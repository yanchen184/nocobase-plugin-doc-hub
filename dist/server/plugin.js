var import_server = require("@nocobase/server");
var import_syncToGit = require("./actions/syncToGit");
var import_syncProjectToGit = require("./actions/syncProjectToGit");

// Server-side line diff：回傳 unified diff patch 字串
// 格式：每行前綴 "+" 新增、"-" 刪除、" " 不變
function computeLineDiffPatch(oldText, newText) {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');
  const m = oldLines.length, n = newLines.length;
  // LCS dp
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i-1] === newLines[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  // backtrack
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
      result.push(' ' + oldLines[i-1]); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.push('+' + newLines[j-1]); j--;
    } else {
      result.push('-' + oldLines[i-1]); i--;
    }
  }
  return result.reverse().join('\n');
}

class PluginDocHubServer extends import_server.Plugin {
  async beforeLoad() {
    this.logger = this.createLogger({ dirname: 'doc-hub', filename: '%DATE%.log' });
  }

  async load() {
    // Helper：取得當前登入用戶（相容 public ACL — 不會自動 inject currentUser）
    async function getCurrentUser(ctx) {
      if (ctx.state?.currentUser) return ctx.state.currentUser;
      if (ctx.auth?.check) {
        try {
          const user = await ctx.auth.check();
          if (user) { ctx.state.currentUser = user; return user; }
        } catch(e) { /* unauthenticated */ }
      }
      return null;
    }

    await this.db.import({ directory: require('path').resolve(__dirname, 'collections') });

    // 確保新 collection 的 table 存在（安全的 sync，只新增不刪）
    try {
      await this.db.sync({ force: false, alter: { drop: false } });
    } catch (e) {
      this.logger && this.logger.warn('db sync warning: ' + (e && e.message));
    }

    // ── Audit Log helper ────────────────────────────────────────────────────
    const _logger = this.logger;
    const _db = this.db;
    async function writeAuditLog({ action, resourceType, resourceId, resourceTitle, user, detail }) {
      try {
        await _db.getRepository('docAuditLogs').create({
          values: {
            action,
            resourceType: resourceType || 'docDocuments',
            resourceId: resourceId || null,
            resourceTitle: resourceTitle || '',
            userId: user?.id || null,
            userNickname: user?.nickname || user?.username || user?.email || '未知',
            detail: detail || null,
            createdAt: new Date(),
          },
        });
      } catch(e) {
        _logger && _logger.warn('[AuditLog] write failed: ' + e.message);
      }
    }

    // ── Git 失敗站內信通知 helper ─────────────────────────────────────────────
    async function notifyGitSyncFailed(db, docId, docTitle, errorMsg) {
      try {
        const docRepo = db.getRepository('docDocuments');
        // 更新 gitSyncStatus 為 'failed'
        await docRepo.update({ filterByTk: docId, values: { gitSyncStatus: 'failed', gitSyncedAt: new Date() } }).catch(() => {});
        const doc = await docRepo.findOne({ filterByTk: docId, appends: ['subscribers'] });
        if (!doc) return;
        const recipientIds = new Set();
        if (doc.createdById) recipientIds.add(doc.createdById);
        (doc.subscribers || []).forEach(u => recipientIds.add(u.id));
        if (recipientIds.size === 0) return;
        const msgRepo = db.getRepository('notificationInAppMessages');
        for (const uid of recipientIds) {
          await msgRepo.create({
            values: {
              userId: uid,
              channelName: 'doc-hub',
              title: `Git 同步失敗：${docTitle || '文件'}`,
              content: `文件《${docTitle || '（未知）'}》的 Git 同步發生錯誤：${errorMsg || '未知錯誤'}，請確認 Git 設定或聯繫管理員。`,
              status: 'unread',
              receiveTimestamp: Date.now(),
            },
          });
        }
      } catch(e) {
        _logger && _logger.warn('[DocHub] notifyGitSyncFailed error: ' + e.message);
      }
    }

    this.app.resourceManager.registerActionHandler('docDocuments:syncToGit', import_syncToGit.syncToGit);
    this.app.resourceManager.registerActionHandler('docProjects:syncToGit', import_syncProjectToGit.syncProjectToGit);

    // 側邊欄文件數量 — 只回傳 { count: N }
    this.app.resourceManager.registerActionHandler('docDocuments:count', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.body = { count: 0 }; return; }
      const { Op } = require('sequelize');
      const repo = ctx.db.getRepository('docDocuments');
      const projectId = ctx.action.params.projectId || null;
      const where = {};
      if (projectId) where.projectId = projectId;
      if (!isAdmin(currentUser)) {
        const visibleIds = await getVisibleDocIds(ctx.db, currentUser.id);
        if (visibleIds.length === 0) { ctx.body = { count: 0 }; return; }
        where.id = { [Op.in]: visibleIds };
      }
      const count = await repo.model.count({ where });
      ctx.body = { count };
    });

    // 圖片上傳 — 存到 storage/uploads/doc-images/，回傳 { url }
    this.app.resourceManager.registerActionHandler('docDocuments:uploadImage', async (ctx) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }

      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');
      const Busboy = require('busboy');

      const contentType = ctx.request.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        ctx.throw(400, 'Expected multipart/form-data'); return;
      }

      const { buffer, filename: origName } = await new Promise((resolve, reject) => {
        const bb = Busboy({ headers: ctx.request.headers, limits: { fileSize: 20 * 1024 * 1024 } });
        let result = null;
        bb.on('file', (fieldname, stream, info) => {
          const chunks = [];
          stream.on('data', (d) => chunks.push(d));
          stream.on('end', () => { result = { buffer: Buffer.concat(chunks), filename: info.filename }; });
        });
        bb.on('finish', () => resolve(result || {}));
        bb.on('error', reject);
        ctx.req.pipe(bb);
      });

      if (!buffer || !buffer.length) { ctx.throw(400, 'No file uploaded'); return; }

      const ext = path.extname(origName || 'image.png').toLowerCase() || '.png';
      const allowed = ['.jpg','.jpeg','.png','.gif','.webp'];
      if (!allowed.includes(ext)) { ctx.throw(400, 'Unsupported file type'); return; }

      const dir = path.join(process.cwd(), 'storage', 'uploads', 'doc-images');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const unique = crypto.randomBytes(8).toString('hex');
      const filename = unique + ext;
      fs.writeFileSync(path.join(dir, filename), buffer);

      ctx.body = { url: '/storage/uploads/doc-images/' + filename };
    });

    // 全文搜尋 action（title + content ILIKE）
    this.app.resourceManager.registerActionHandler('docDocuments:search', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const q = (ctx.action.params.q || '').trim();
      const pageSize = Math.min(parseInt(ctx.action.params.pageSize) || 20, 200);
      const page = parseInt(ctx.action.params.page) || 1;
      const categoryId = ctx.action.params.categoryId || null;
      const typeId = ctx.action.params.typeId || null;
      const status = ctx.action.params.status || null;
      const projectId = ctx.action.params.projectId || null;

      if (!currentUser) { ctx.body = []; ctx.meta = { count: 0, page, pageSize, totalPage: 0 }; return; }

      const { Op, literal, fn, col } = require('sequelize');
      const sequelize = ctx.db.sequelize;
      const repo = ctx.db.getRepository('docDocuments');

      // 權限過濾
      let visibleIds = null;
      if (!isAdmin(currentUser)) {
        visibleIds = await getVisibleDocIds(ctx.db, currentUser.id);
      }

      // 把使用者輸入的關鍵字轉成 tsquery（以空格分詞，每詞加 :* 支援前綴比對）
      function toTsQuery(input) {
        return input.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '') || w).filter(Boolean).map(w => w + ':*').join(' & ');
      }

      const useTsVector = !!q;
      const tsQuery = useTsVector ? toTsQuery(q) : null;

      // 組合 WHERE 條件
      const whereParts = ['1=1'];
      const replacements = {};

      if (tsQuery) {
        whereParts.push(`"docDocuments".search_vector @@ to_tsquery('simple', :tsQuery)`);
        replacements.tsQuery = tsQuery;
      }
      if (categoryId) { whereParts.push(`"docDocuments"."categoryId" = :categoryId`); replacements.categoryId = categoryId; }
      if (projectId) { whereParts.push(`"docDocuments"."projectId" = :projectId`); replacements.projectId = projectId; }
      if (typeId) { whereParts.push(`"docDocuments"."typeId" = :typeId`); replacements.typeId = typeId; }
      if (status) { whereParts.push(`"docDocuments".status = :status`); replacements.status = status; }
      if (visibleIds !== null) {
        if (visibleIds.length === 0) { ctx.body = []; ctx.meta = { count: 0, page, pageSize, totalPage: 0 }; return; }
        whereParts.push(`"docDocuments".id IN (:visibleIds)`);
        replacements.visibleIds = visibleIds;
      }

      const whereSQL = whereParts.join(' AND ');
      const offset = (page - 1) * pageSize;

      // ts_rank 排序（有搜尋時），否則 updatedAt DESC
      const orderSQL = tsQuery
        ? `ts_rank("docDocuments".search_vector, to_tsquery('simple', :tsQuery)) DESC, "docDocuments"."updatedAt" DESC`
        : `"docDocuments"."updatedAt" DESC`;

      // ts_headline 擷取高亮片段（PostgreSQL 原生）
      const headlineSQL = tsQuery
        ? `, ts_headline('simple', coalesce("docDocuments".content,''), to_tsquery('simple', :tsQuery), 'MaxWords=30, MinWords=10, MaxFragments=3, FragmentDelimiter=\" … \"') AS _headline`
        : '';

      const countResult = await sequelize.query(
        `SELECT COUNT(*) AS total FROM "docDocuments" WHERE ${whereSQL}`,
        { replacements, type: sequelize.QueryTypes.SELECT }
      );
      const total = parseInt(countResult[0]?.total || 0);

      const rows = await sequelize.query(
        `SELECT "docDocuments".id, "docDocuments".title, "docDocuments".status,
                "docDocuments"."typeId", "docDocuments"."categoryId", "docDocuments"."projectId",
                "docDocuments"."githubRepo", "docDocuments"."githubFilePath", "docDocuments"."gitSyncStatus",
                "docDocuments"."gitSyncedAt", "docDocuments"."gitLastSyncedByName",
                "docDocuments"."updatedAt", "docDocuments"."createdAt",
                "docDocuments"."lastEditorId", "docDocuments"."authorId"
                ${headlineSQL}
         FROM "docDocuments"
         WHERE ${whereSQL}
         ORDER BY ${orderSQL}
         LIMIT :limit OFFSET :offset`,
        { replacements: { ...replacements, limit: pageSize, offset }, type: sequelize.QueryTypes.SELECT }
      );

      // 補齊關聯（category, type, lastEditor）
      const catIds = [...new Set(rows.map(r => r.categoryId).filter(Boolean))];
      const typeIds = [...new Set(rows.map(r => r.typeId).filter(Boolean))];
      const editorIds = [...new Set(rows.map(r => r.lastEditorId).filter(Boolean))];

      const [cats, types, editors] = await Promise.all([
        catIds.length ? repo.model.sequelize.query(`SELECT id, name FROM "docCategories" WHERE id IN (:ids)`, { replacements: { ids: catIds }, type: sequelize.QueryTypes.SELECT }) : [],
        typeIds.length ? repo.model.sequelize.query(`SELECT id, name FROM "docTypes" WHERE id IN (:ids)`, { replacements: { ids: typeIds }, type: sequelize.QueryTypes.SELECT }) : [],
        editorIds.length ? repo.model.sequelize.query(`SELECT id, nickname, username, email FROM users WHERE id IN (:ids)`, { replacements: { ids: editorIds }, type: sequelize.QueryTypes.SELECT }) : [],
      ]);
      const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
      const typeMap = Object.fromEntries(types.map(t => [t.id, t]));
      const editorMap = Object.fromEntries(editors.map(e => [e.id, e]));

      const dataRows = rows.map(r => {
        const doc = { ...r };
        doc.category = catMap[r.categoryId] || null;
        doc.type = typeMap[r.typeId] || null;
        doc.lastEditor = editorMap[r.lastEditorId] || null;
        if (r._headline) {
          doc._snippets = r._headline.split(' … ').filter(Boolean).map(s => ({ text: s.replace(/<\/?b>/g, '') }));
          doc._headlineHtml = r._headline;
          delete doc._headline;
        }
        return doc;
      });
      // NocoBase 框架會自動把 ctx.body 包成 { data: ctx.body }
      // 所以這裡直接設 array，前端用 res.data.data 拿到 array
      ctx.body = dataRows;
      ctx.meta = { count: total, page, pageSize, totalPage: Math.ceil(total / pageSize) };
    });

    // 權限過濾 helper：判斷當前 user 是否為 admin
    function isAdmin(user) {
      if (!user) return false;
      if (Number(user.id) === 1) return true;
      if (user.roles && user.roles.some(r => r.name === 'root' || r.name === 'admin')) return true;
      return false;
    }

    // 取得當前 user 可見的文件 ID 集合（用於 list/search 過濾）
    // 可見性來源：1) 自己創建的 2) 文件層級的 viewer/editor/subscriber 3) 資料夾層級的 viewer/editor
    async function getVisibleDocIds(db, userId) {
      const { Op } = require('sequelize');
      // 1. 自己創建的文件
      const owned = await db.getRepository('docDocuments').find({
        filter: { createdById: userId },
        fields: ['id'],
      });
      // 2. 文件層級授權
      const docViewerRows = await db.sequelize.query(
        `SELECT "documentId" as id FROM "docDocumentViewers" WHERE "userId" = :uid
         UNION SELECT "documentId" FROM "docDocumentEditors" WHERE "userId" = :uid
         UNION SELECT "documentId" FROM "docDocumentSubscribers" WHERE "userId" = :uid`,
        { replacements: { uid: userId }, type: db.sequelize.QueryTypes.SELECT }
      );
      // 3. 資料夾層級授權（overridePermission=true 的資料夾用自己的 viewer/editor）
      let catDocIds = [];
      try {
        // 只取有 override 的資料夾中，user 有權限的
        const catRows = await db.sequelize.query(
          `SELECT cv."categoryId" FROM "docCategoryViewers" cv
           JOIN "docCategories" c ON c.id = cv."categoryId" AND c."overridePermission" = true
           WHERE cv."userId" = :uid
           UNION
           SELECT ce."categoryId" FROM "docCategoryEditors" ce
           JOIN "docCategories" c ON c.id = ce."categoryId" AND c."overridePermission" = true
           WHERE ce."userId" = :uid`,
          { replacements: { uid: userId }, type: db.sequelize.QueryTypes.SELECT }
        );
        if (catRows.length > 0) {
          const catIds = catRows.map(r => r.categoryId);
          const docs = await db.getRepository('docDocuments').find({
            filter: { categoryId: { $in: catIds } },
            fields: ['id'],
          });
          catDocIds = docs.map(d => d.id);
        }
      } catch(e) { /* docCategoryViewers table may not exist yet */ }

      // 4. 專案層授權 — 有專案 viewer/editor 可見該專案下【未 override】資料夾的文件
      let projDocIds = [];
      try {
        const projRows = await db.sequelize.query(
          `SELECT "projectId" FROM "docProjectViewers" WHERE "userId" = :uid
           UNION SELECT "projectId" FROM "docProjectEditors" WHERE "userId" = :uid`,
          { replacements: { uid: userId }, type: db.sequelize.QueryTypes.SELECT }
        );
        if (projRows.length > 0) {
          const projIds = projRows.map(r => r.projectId);
          // 只取 overridePermission=false 的資料夾下的文件（override=true 的由資料夾層自己管）
          const docs = await db.sequelize.query(
            `SELECT d.id FROM "docDocuments" d
             LEFT JOIN "docCategories" c ON c.id = d."categoryId"
             WHERE d."projectId" IN (:projIds)
               AND (c."overridePermission" IS NULL OR c."overridePermission" = false)`,
            { replacements: { projIds }, type: db.sequelize.QueryTypes.SELECT }
          );
          projDocIds = docs.map(d => d.id);
        }
      } catch(e) { /* docProjectViewers table may not exist yet */ }

      const ids = new Set([
        ...owned.map(d => d.id),
        ...docViewerRows.map(r => r.id),
        ...catDocIds,
        ...projDocIds,
      ]);
      return [...ids];
    }

    // 專案層權限 helper：取得 user 有 viewer/editor 的專案 ID
    async function getVisibleProjectIds(db, userId) {
      try {
        const rows = await db.sequelize.query(
          `SELECT "projectId" FROM "docProjectViewers" WHERE "userId" = :uid
           UNION SELECT "projectId" FROM "docProjectEditors" WHERE "userId" = :uid`,
          { replacements: { uid: userId }, type: db.sequelize.QueryTypes.SELECT }
        );
        return rows.map(r => r.projectId);
      } catch(e) { return []; }
    }

    // 覆寫 docDocuments:list — 加權限過濾（owner/viewer/editor/subscriber 都可見）
    this.app.resourceManager.registerActionHandler('docDocuments:list', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.body = []; ctx.meta = { count: 0, page: 1, pageSize: 20, totalPage: 0 }; return; }

      const params = ctx.action.params;
      const filter = params.filter || {};
      const { Op } = require('sequelize');
      const repo = ctx.db.getRepository('docDocuments');
      const pageSize = Math.min(parseInt(params.pageSize) || 20, 200);
      const page = parseInt(params.page) || 1;
      const appends = params.appends || [];
      const sortParam = params.sort || ['-updatedAt'];

      // 解析 sort 參數 → Sequelize order 格式
      const order = (Array.isArray(sortParam) ? sortParam : [sortParam]).map(s => {
        if (s.startsWith('-')) return [s.slice(1), 'DESC'];
        return [s, 'ASC'];
      });

      const where = {};
      if (filter.projectId) where.projectId = filter.projectId;
      if (filter.categoryId) where.categoryId = filter.categoryId;
      if (filter.typeId) where.typeId = filter.typeId;
      if (filter.status) where.status = filter.status;

      // 非 admin：只能看自己有權限的文件（owner/viewer/editor/subscriber）
      if (!isAdmin(currentUser)) {
        const visibleIds = await getVisibleDocIds(ctx.db, currentUser.id);
        if (visibleIds.length === 0) { ctx.body = []; ctx.meta = { count: 0, page, pageSize, totalPage: 0 }; return; }
        where.id = { [Op.in]: visibleIds };
        // 草稿只有創建者才能看到
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({
          [Op.or]: [
            { status: 'published' },
            { [Op.and]: [{ status: 'draft' }, { createdById: currentUser.id }] },
          ],
        });
      }

      const include = [];
      if (appends.includes('category')) include.push({ association: 'category', required: false });
      if (appends.includes('type')) include.push({ association: 'type', required: false });
      if (appends.includes('lastEditor')) include.push({ association: 'lastEditor', required: false });

      const { count, rows } = await repo.model.findAndCountAll({
        where, include, order,
        limit: pageSize, offset: (page - 1) * pageSize,
      });
      ctx.body = rows.map(r => r.toJSON());
      ctx.meta = { count, page, pageSize, totalPage: Math.ceil(count / pageSize) };
    });

    // 覆寫 docDocuments:get — 加權限過濾
    this.app.resourceManager.registerActionHandler('docDocuments:get', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const paramAppends = ctx.action.params.appends || [];
      const appends = [...new Set([...paramAppends, 'viewers', 'editors', 'subscribers'])];

      const doc = await repo.findOne({ filterByTk, appends });
      if (!doc) { ctx.throw(404, '文件不存在'); return; }

      if (!isAdmin(currentUser)) {
        const uid = currentUser.id;
        const isOwner = doc.createdById === uid;
        if (!isOwner) {
          const ids = await getVisibleDocIds(ctx.db, uid);
          if (!ids.includes(doc.id)) { ctx.throw(403, '沒有權限查看此文件'); return; }
        }
      }
      ctx.body = doc;
    });

    // 覆寫 docDocuments:destroy — 只有文件創建者或 admin 可刪除；鎖定中文件任何人不可刪
    this.app.resourceManager.registerActionHandler('docDocuments:destroy', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const doc = await repo.findOne({ filterByTk });
      if (!doc) { ctx.throw(404, '文件不存在'); return; }
      // 鎖定中：任何人（包含 admin）都不能刪除
      if (doc.locked) {
        ctx.throw(403, '此文件已鎖定，無法刪除。請先由管理員解鎖後再操作。'); return;
      }
      if (!isAdmin(currentUser) && Number(doc.createdById) !== Number(currentUser.id)) {
        ctx.throw(403, '只有文件創建者或管理員可以刪除文件'); return;
      }
      await repo.destroy({ filterByTk });
      await writeAuditLog({
        action: 'delete',
        resourceType: 'docDocuments',
        resourceId: doc.id,
        resourceTitle: doc.title,
        user: currentUser,
        detail: { status: doc.status, categoryId: doc.categoryId, projectId: doc.projectId },
      });
      ctx.body = { ok: true };
      await next();
    });

    // Git API helper（支援 GitHub 和 GitLab）
    // 從環境變數讀取（請在 docker-compose.yml 或 .env 中設定）
    const GITHUB_TOKEN = process.env.DOCHUB_GITHUB_TOKEN || '';
    const GITLAB_TOKEN = process.env.DOCHUB_GITLAB_TOKEN || '';
    const GITLAB_HOST = process.env.DOCHUB_GITLAB_HOST || '10.1.2.191';

    // 判斷是否為 GitLab（repo 格式：host/namespace/project 或純 namespace/project）
    function isGitLab(repo) {
      if (!repo || !GITLAB_HOST) return false;
      return repo.startsWith(GITLAB_HOST) || repo.startsWith('https://' + GITLAB_HOST);
    }

    // 檢查 Git token 是否已設定
    function checkGitToken(repo) {
      if (isGitLab(repo)) {
        if (!GITLAB_TOKEN) throw Object.assign(new Error('GitLab Token 未設定，請在 .env 中設定 DOCHUB_GITLAB_TOKEN'), { status: 503 });
      } else {
        if (!GITHUB_TOKEN) throw Object.assign(new Error('GitHub Token 未設定，請在 .env 中設定 DOCHUB_GITHUB_TOKEN'), { status: 503 });
      }
    }

    // 統一拉取介面：回傳 { content(base64), sha, name }
    async function githubGetFile(repo, filePath, branch = 'main') {
      const https = require('https');
      const http = require('http');

      if (isGitLab(repo)) {
        // GitLab API
        const cleanRepo = repo.replace('https://' + GITLAB_HOST + '/', '').replace(GITLAB_HOST + '/', '').replace(/\.git$/, '');
        const encodedProject = encodeURIComponent(cleanRepo);
        const encodedFile = encodeURIComponent(filePath);
        const path = `/api/v4/projects/${encodedProject}/repository/files/${encodedFile}?ref=${branch}`;
        return new Promise((resolve, reject) => {
          const opts = { hostname: GITLAB_HOST, port: 443, path, method: 'GET', rejectUnauthorized: false,
            headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN } };
          https.get(opts, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                // GitLab 回傳 content 是 base64（帶換行），blob_id 是 sha
                const cleanContent = parsed.content ? parsed.content.replace(/\n/g, '') : parsed.content;
                resolve({ content: cleanContent, sha: parsed.blob_id, name: parsed.file_name, message: parsed.message });
              } catch(e) { reject(e); }
            });
          }).on('error', reject);
        });
      } else {
        // GitHub API
        return new Promise((resolve, reject) => {
          // repo 可能是完整 URL（https://github.com/owner/name）或 owner/name 短格式，統一轉成 owner/name
          const repoPath = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
          const url = `https://api.github.com/repos/${repoPath}/contents/${filePath}${branch ? '?ref=' + branch : ''}`;
          const opts = { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'DocHub', 'Accept': 'application/vnd.github.v3+json' } };
          https.get(url, opts, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
              try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
          }).on('error', reject);
        });
      }
    }

    // 自訂 update action：處理 m2m 關聯（viewers/editors/subscribers）+ SHA 衝突偵測
    // 文件 create：同資料夾（categoryId）下不允許同名
    this.app.resourceManager.registerActionHandler('docDocuments:create', async (ctx, next) => {
      await getCurrentUser(ctx); // 確保 ctx.state.currentUser 被設置（public ACL 需要）
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docDocuments');
      const { title, categoryId = null, projectId = null, viewerIds, editorIds, subscriberIds, ...docFields } = values;
      if (title && title.trim()) {
        const filter = { title: title.trim(), categoryId: categoryId || null };
        if (projectId) filter.projectId = projectId;
        const dup = await repo.findOne({ filter });
        if (dup) { ctx.throw(400, `文件「${title.trim()}」已存在於此資料夾，請使用不同標題`); return; }
      }
      // Template form doc: convert formData → serialized template content
      if (values.contentType === 'template' && values.templateId && values.formData) {
        const tpl = await ctx.db.getRepository('docTemplates').findOne({ filterByTk: values.templateId });
        docFields.content = serializeTemplateContent({
          templateId: values.templateId,
          templateName: tpl ? tpl.name : '',
          templateVersion: 1,
          data: values.formData,
          fields: tpl ? (tpl.fields || []) : [], // 快照欄位定義，避免範本更新後舊文件渲染損壞
        });
      }
      const doc = await repo.create({ values: { ...docFields, title, categoryId, projectId, authorId: ctx.state?.currentUser?.id, lastEditorId: ctx.state?.currentUser?.id } });
      // 設定 m2m 關聯（viewers/editors/subscribers）
      if (Array.isArray(viewerIds) && viewerIds.length > 0) {
        await ctx.db.getRepository('docDocuments.viewers', doc.id).set(viewerIds);
      }
      if (Array.isArray(editorIds) && editorIds.length > 0) {
        await ctx.db.getRepository('docDocuments.editors', doc.id).set(editorIds);
      }
      if (Array.isArray(subscriberIds) && subscriberIds.length > 0) {
        await ctx.db.getRepository('docDocuments.subscribers', doc.id).set(subscriberIds);
      }
      ctx.body = doc;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docDocuments:update', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const values = ctx.action.params.values || ctx.request.body || {};
      const { viewerIds, editorIds, subscriberIds, changeSummary, skipConflictCheck, ...docFields } = values;

      const repo = ctx.db.getRepository('docDocuments');

      // 鎖定檢查：鎖定中的文件，非 admin 不能修改
      const currentForLock = await repo.findOne({ filterByTk });
      if (currentForLock && currentForLock.locked && !isAdmin(currentUser)) {
        ctx.throw(403, '此文件已鎖定，無法編輯。如需修改請聯繫管理員解鎖。'); return;
      }

      // 標題唯一性：同 categoryId 下不允許同名（排除自己）
      if (docFields.title && docFields.title.trim()) {
        const current = await repo.findOne({ filterByTk });
        if (current) {
          const catId = docFields.categoryId !== undefined ? docFields.categoryId : current.categoryId;
          const dup = await repo.findOne({ filter: { title: docFields.title.trim(), categoryId: catId || null } });
          if (dup && dup.id !== current.id) {
            ctx.throw(400, `文件「${docFields.title.trim()}」已存在於此資料夾，請使用不同標題`); return;
          }
        }
      }

      // SHA 衝突偵測：若文件綁定了 GitHub，比對 SHA 是否一致
      if (!skipConflictCheck) {
        const current = await repo.findOne({ filterByTk });
        if (current && current.githubRepo && current.githubFilePath && current.gitSha) {
          try {
            const proj = await ctx.db.getRepository('docProjects').findOne({ filter: { id: current.projectId } });
            const branch = proj?.githubBranch || 'main';
            const ghFile = await githubGetFile(current.githubRepo, current.githubFilePath, branch);
            if (ghFile && ghFile.sha && ghFile.sha !== current.gitSha) {
              ctx.status = 409;
              ctx.body = {
                errors: [{ message: 'GIT_CONFLICT', code: 'GIT_CONFLICT', latestSha: ghFile.sha }]
              };
              return;
            }
          } catch (e) {
            this.logger.warn('SHA check failed (skip): ' + e.message);
          }
        }
      }

      // Template form update: merge formData into existing template content
      if (values.formData) {
        const existing = await repo.findOne({ filterByTk });
        if (existing && isTemplateContent(existing.content)) {
          const parsed = parseTemplateContent(existing.content);
          if (parsed) {
            docFields.content = serializeTemplateContent({ ...parsed, data: { ...(parsed.data || {}), ...values.formData } });
          }
        }
      }

      // 更新文件本體欄位（不含 m2m）— 傳入 context 讓 afterUpdate hook 能取得 currentUser
      await repo.update({ filterByTk, values: { ...docFields, lastEditorId: ctx.state?.currentUser?.id }, context: ctx });

      // 更新 m2m 關聯（有傳才更新）
      if (Array.isArray(viewerIds)) {
        await ctx.db.getRepository('docDocuments.viewers', filterByTk).set(viewerIds);
      }
      if (Array.isArray(editorIds)) {
        await ctx.db.getRepository('docDocuments.editors', filterByTk).set(editorIds);
      }
      if (Array.isArray(subscriberIds)) {
        await ctx.db.getRepository('docDocuments.subscribers', filterByTk).set(subscriberIds);
      }

      // 回傳更新後的文件
      const doc = await repo.findOne({ filterByTk, appends: ['viewers', 'editors', 'subscribers', 'type', 'lastEditor'] });
      await writeAuditLog({
        action: 'update',
        resourceType: 'docDocuments',
        resourceId: doc?.id,
        resourceTitle: doc?.title,
        user: currentUser,
        detail: { changedFields: Object.keys(docFields) },
      });
      ctx.body = doc;
      await next();
    });

    // pullFromGit：從 GitHub 拉最新內容覆蓋 DocHub
    this.app.resourceManager.registerActionHandler('docDocuments:pullFromGit', async (ctx, next) => {
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const doc = await repo.findOne({ filterByTk });
      if (!doc || !doc.githubRepo) {
        ctx.throw(400, '此文件未綁定 GitHub 路徑');
      }
      const branch = doc.githubBranch || 'master';
      // 若未設定檔案路徑，有分支時預設 README.md
      const filePath = doc.githubFilePath || (doc.githubBranch ? 'README.md' : null);
      if (!filePath) {
        ctx.throw(400, '此文件未綁定 GitHub 路徑');
      }
      try { checkGitToken(doc.githubRepo); } catch(e) { ctx.throw(503, e.message); return; }
      let ghFile;
      try {
        ghFile = await githubGetFile(doc.githubRepo, filePath, branch);
      } catch (e) {
        this.logger.error('[DocHub] pullFromGit fetch error: ' + e.message);
        await notifyGitSyncFailed(ctx.db, doc.id, doc.title, 'Git 連線失敗：' + e.message);
        await writeAuditLog({ action: 'git_sync_failed', resourceId: doc.id, resourceTitle: doc.title, detail: { error: e.message, phase: 'fetch' } });
        ctx.throw(502, 'Git 拉取失敗，請稍後再試');
        return;
      }
      if (!ghFile || !ghFile.content) {
        const errMsg = ghFile?.message || '找不到檔案';
        await notifyGitSyncFailed(ctx.db, doc.id, doc.title, errMsg);
        await writeAuditLog({ action: 'git_sync_failed', resourceId: doc.id, resourceTitle: doc.title, detail: { error: errMsg, phase: 'not_found' } });
        ctx.throw(404, ghFile?.message ? `找不到檔案：${ghFile.message}` : '找不到檔案（請確認 repo / 路徑 / 分支）');
        return;
      }
      try {
        const content = Buffer.from(ghFile.content, 'base64').toString('utf8');
        await repo.update({ filterByTk, values: { content, gitSha: ghFile.sha, gitSyncedAt: new Date(), gitSyncStatus: 'synced' }, context: ctx });
        const updated = await repo.findOne({ filterByTk, appends: ['viewers', 'editors', 'subscribers', 'type', 'lastEditor'] });
        ctx.body = updated;
        this.logger.info(`[DocHub] pullFromGit: doc ${filterByTk} pulled sha=${ghFile.sha}`);
      } catch (e) {
        this.logger.error('[DocHub] pullFromGit update error: ' + e.message);
        await notifyGitSyncFailed(ctx.db, doc.id, doc.title, '拉取成功但寫入失敗：' + e.message);
        await writeAuditLog({ action: 'git_sync_failed', resourceId: doc.id, resourceTitle: doc.title, detail: { error: e.message, phase: 'update' } });
        ctx.throw(500, 'Git 拉取成功但更新失敗，請稍後再試');
      }
      await next();
    });

    // fetchFromGit：新增文件時預覽拉取（不需要 filterByTk，只傳 repo + filePath）
    this.app.resourceManager.registerActionHandler('docDocuments:fetchFromGit', async (ctx, next) => {
      const rawBody = ctx.request.body || {};
      const paramValues = ctx.action.params.values || {};
      const body = Object.assign({}, rawBody, paramValues);
      const params = ctx.action.params || {};
      const githubRepo = body.githubRepo || params.githubRepo;
      const githubFilePath = body.githubFilePath || params.githubFilePath;
      const branch = body.branch || body.githubBranch || params.branch || 'master';
      this.logger.info(`[DocHub] fetchFromGit: repo=${githubRepo} path=${githubFilePath} branch=${branch} rawBody=${JSON.stringify(rawBody)}`);
      const resolvedFilePath = githubFilePath || 'README.md';
      if (!githubRepo) ctx.throw(400, '請提供 repo');
      try { checkGitToken(githubRepo); } catch(e) { ctx.throw(503, e.message); return; }
      try {
        const ghFile = await githubGetFile(githubRepo, resolvedFilePath, branch);
        this.logger.info(`[DocHub] fetchFromGit result: ${JSON.stringify({sha: ghFile?.sha, hasContent: !!ghFile?.content, message: ghFile?.message})}`);
        if (!ghFile || !ghFile.content) {
          const errMsg = ghFile?.message || '找不到檔案（請確認 repo / 路徑 / 分支是否正確）';
          ctx.throw(404, `Git 拉取失敗：${errMsg}`);
        }
        const content = Buffer.from(ghFile.content, 'base64').toString('utf8');
        ctx.body = { content, sha: ghFile.sha, name: ghFile.name };
      } catch (e) {
        this.logger.error('[DocHub] fetchFromGit error: ' + e.message);
        ctx.throw(500, 'Git 拉取失敗：' + e.message);
      }
      await next();
    });

    // webhookReceive：接收 GitLab / GitHub push webhook
    this.app.resourceManager.registerActionHandler('docDocuments:webhookReceive', async (ctx, next) => {
      // ── Webhook 身份驗證 ──
      const webhookSecret = process.env.DOCHUB_WEBHOOK_SECRET || '';
      if (webhookSecret) {
        // GitLab: X-Gitlab-Token header（純文字比對）
        const gitlabToken = ctx.request.headers['x-gitlab-token'] || '';
        // GitHub: X-Hub-Signature-256 header（HMAC-SHA256）
        const githubSig = ctx.request.headers['x-hub-signature-256'] || '';
        let authorized = false;
        if (gitlabToken) {
          authorized = gitlabToken === webhookSecret;
        } else if (githubSig) {
          try {
            const crypto = require('crypto');
            const rawBody = JSON.stringify(ctx.request.body || {});
            const expected = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
            const a = Buffer.from(githubSig); const b = Buffer.from(expected);
            authorized = a.length === b.length && crypto.timingSafeEqual(a, b);
          } catch(e) { authorized = false; }
        }
        if (!authorized) {
          this.logger.warn('[DocHub] webhook: unauthorized request rejected');
          ctx.throw(401, 'Webhook secret mismatch'); return;
        }
      }

      const payload = ctx.request.body || {};

      // ── 解析 push 資訊（相容 GitHub 和 GitLab payload 格式）──
      const branch = (payload.ref || '').replace('refs/heads/', '');

      // GitHub: repository.full_name = "owner/repo"
      // GitLab: project.path_with_namespace = "namespace/project"，或 repository.name
      const repoFullName =
        payload.repository?.full_name ||           // GitHub
        payload.project?.path_with_namespace ||    // GitLab
        null;

      // GitLab 的 repo 在文件裡可能存成 "10.1.2.191/ns/proj" 或 "https://10.1.2.191/ns/proj"
      const isGitLabPayload = !!(payload.project?.path_with_namespace);
      const repoWithHost = isGitLabPayload ? (GITLAB_HOST + '/' + repoFullName) : null;
      const repoWithHttps = isGitLabPayload ? ('https://' + GITLAB_HOST + '/' + repoFullName) : null;

      if (!repoFullName) {
        this.logger.warn('[DocHub] webhook: missing repo info');
        ctx.body = { ok: true, skipped: 'no repo' };
        await next();
        return;
      }

      // 收集本次 push 涉及的所有檔案
      const pushedFiles = [];
      (payload.commits || []).forEach(commit => {
        (commit.added || []).forEach(f => pushedFiles.push(f));
        (commit.modified || []).forEach(f => pushedFiles.push(f));
      });

      this.logger.info(`[DocHub] webhook: repo=${repoFullName} branch=${branch} files=${pushedFiles.join(',')}`);

      const docRepo = ctx.db.getRepository('docDocuments');
      let updated = 0;

      for (const filePath of [...new Set(pushedFiles)]) {
        // 比對文件的 githubRepo 欄位（支援三種格式：namespace/repo, host/ns/repo, https://host/ns/repo）
        const possibleRepos = [repoFullName];
        if (repoWithHost) possibleRepos.push(repoWithHost);
        if (repoWithHttps) possibleRepos.push(repoWithHttps);

        // 用 OR 條件比對所有可能格式
        const docs = await docRepo.model.findAll({
          where: {
            githubRepo: possibleRepos,   // Sequelize 陣列自動轉 IN
            githubFilePath: filePath,
          }
        });

        for (const docModel of docs) {
          try {
            // branch 比對：用文件本身的 githubBranch（預設 master）
            const expectedBranch = docModel.githubBranch || 'master';
            // branch 為空字串時也視為不符，避免任意分支觸發同步
            if (!branch || branch !== expectedBranch) {
              this.logger.info(`[DocHub] webhook: skip doc ${docModel.id}, branch mismatch (got '${branch}', expect '${expectedBranch}')`);
              continue;
            }

            // 從 Git 拉最新內容
            const ghFile = await githubGetFile(docModel.githubRepo, filePath, branch);
            if (!ghFile || !ghFile.content) {
              const errMsg = ghFile?.message || '找不到檔案';
              await notifyGitSyncFailed(ctx.db, docModel.id, docModel.title, 'Webhook 同步：' + errMsg);
              await writeAuditLog({ action: 'git_sync_failed', resourceId: docModel.id, resourceTitle: docModel.title, detail: { error: errMsg, phase: 'webhook_not_found' } });
              continue;
            }

            const content = Buffer.from(ghFile.content, 'base64').toString('utf8');
            await docRepo.update({
              filterByTk: docModel.id,
              values: { content, gitSha: ghFile.sha, gitSyncedAt: new Date(), gitSyncStatus: 'synced' }
            });
            updated++;
            this.logger.info(`[DocHub] webhook updated doc id=${docModel.id} sha=${ghFile.sha}`);
          } catch (e) {
            this.logger.error(`[DocHub] webhook update doc ${docModel.id} error: ${e.message}`);
            await notifyGitSyncFailed(ctx.db, docModel.id, docModel.title, 'Webhook 同步失敗：' + e.message);
            await writeAuditLog({ action: 'git_sync_failed', resourceId: docModel.id, resourceTitle: docModel.title, detail: { error: e.message, phase: 'webhook_update' } });
          }
        }
      }

      ctx.body = { ok: true, updated };
      await next();
    });

    // 群組 CRUD（list/get 所有人，create/update/destroy 限 admin）
    this.app.resourceManager.registerActionHandler('docGroups:create', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdmin = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdmin) { ctx.throw(403, '只有管理員可以建立群組'); return; }
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docGroups');
      const group = await repo.create({ values });
      ctx.body = group;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docGroups:update', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdmin = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdmin) { ctx.throw(403, '只有管理員可以修改群組'); return; }
      const { filterByTk } = ctx.action.params;
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docGroups');
      await repo.update({ filterByTk, values });
      const group = await repo.findOne({ filterByTk });
      ctx.body = group;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docGroups:destroy', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdmin = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdmin) { ctx.throw(403, '只有管理員可以刪除群組'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docGroups');
      await repo.destroy({ filterByTk });
      ctx.body = { ok: true };
      await next();
    });

    // 專案 create：建立後自動生成 SRS/SDS/SPEC/PM-Doc/Others/上版單 六個預設資料夾
    this.app.resourceManager.registerActionHandler('docProjects:create', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdminUser = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdminUser) { ctx.throw(403, '只有管理員可以建立專案'); return; }
      const values = ctx.request.body || {};
      const projRepo = ctx.db.getRepository('docProjects');
      const catRepo = ctx.db.getRepository('docCategories');
      const project = await projRepo.create({ values });

      // 自動建立資料夾：優先用 client 傳入的 folders，否則用預設 6 個
      const clientFolders = Array.isArray(values.folders) ? values.folders : null;
      const defaultFolders = clientFolders || [
        { name: 'SRS',    sort: 0 },
        { name: 'SDS',    sort: 1 },
        { name: 'SPEC',   sort: 2 },
        { name: 'PM-Doc', sort: 3 },
        { name: 'Others', sort: 4 },
        { name: '上版單', sort: 5 },
      ];
      try {
        for (let i = 0; i < defaultFolders.length; i++) {
          const f = defaultFolders[i];
          if (!f.name || !f.name.trim()) continue;
          await catRepo.create({ values: { name: f.name.trim(), projectId: project.id, sort: f.sort != null ? f.sort : i } });
        }
      } catch(e) {
        this.logger && this.logger.warn('Auto-create folders failed: ' + e.message);
      }

      ctx.body = project;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docProjects:destroy', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdmin = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdmin) { ctx.throw(403, '只有管理員可以刪除專案'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docProjects');
      await repo.destroy({ filterByTk });
      ctx.body = { ok: true };
      await next();
    });

    // 專案權限：取得目前的 viewer/editor 列表
    this.app.resourceManager.registerActionHandler('docProjects:getPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const proj = await ctx.db.getRepository('docProjects').findOne({
        filterByTk,
        appends: ['viewers', 'editors', 'subscribers'],
      });
      if (!proj) { ctx.throw(404, '專案不存在'); return; }
      ctx.body = {
        viewerIds: (proj.viewers || []).map(u => u.id),
        editorIds: (proj.editors || []).map(u => u.id),
        subscriberIds: (proj.subscribers || []).map(u => u.id),
        viewers: proj.viewers || [],
        editors: proj.editors || [],
        subscribers: proj.subscribers || [],
      };
    });

    // 專案權限：設定 viewer/editor（限 admin）
    this.app.resourceManager.registerActionHandler('docProjects:setPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以設定專案權限'); return; }
      const { filterByTk } = ctx.action.params;
      const body = ctx.request.body || {};
      const { viewerIds, editorIds, subscriberIds } = body;
      const projRepo = ctx.db.getRepository('docProjects');
      const proj = await projRepo.findOne({ filterByTk });
      if (!proj) { ctx.throw(404, '專案不存在'); return; }
      if (Array.isArray(viewerIds)) {
        await ctx.db.getRepository('docProjects.viewers', filterByTk).set(viewerIds);
      }
      if (Array.isArray(editorIds)) {
        await ctx.db.getRepository('docProjects.editors', filterByTk).set(editorIds);
      }
      if (Array.isArray(subscriberIds)) {
        await ctx.db.getRepository('docProjects.subscribers', filterByTk).set(subscriberIds);
      }
      ctx.body = { ok: true };
      await next();
    });

    // 資料夾權限：讀取（override 狀態 + 成員清單）
    this.app.resourceManager.registerActionHandler('docCategories:getPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const cat = await ctx.db.getRepository('docCategories').findOne({
        filterByTk,
        appends: ['viewers', 'editors'],
      });
      if (!cat) { ctx.throw(404, '資料夾不存在'); return; }
      ctx.body = {
        overridePermission: !!cat.overridePermission,
        viewerIds: (cat.viewers || []).map(u => u.id),
        editorIds: (cat.editors || []).map(u => u.id),
        viewers: cat.viewers || [],
        editors: cat.editors || [],
      };
      await next();
    });

    // 資料夾權限：設定（限 admin）
    this.app.resourceManager.registerActionHandler('docCategories:setPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以設定資料夾權限'); return; }
      const { filterByTk } = ctx.action.params;
      const body = ctx.request.body || {};
      const { overridePermission, viewerIds, editorIds } = body;
      const repo = ctx.db.getRepository('docCategories');
      const cat = await repo.findOne({ filterByTk });
      if (!cat) { ctx.throw(404, '資料夾不存在'); return; }
      await repo.update({ filterByTk, values: { overridePermission: !!overridePermission } });
      if (!!overridePermission) {
        if (Array.isArray(viewerIds)) {
          await ctx.db.getRepository('docCategories.viewers', filterByTk).set(viewerIds);
        }
        if (Array.isArray(editorIds)) {
          await ctx.db.getRepository('docCategories.editors', filterByTk).set(editorIds);
        }
      } else {
        // 切回繼承時清空自訂成員
        await ctx.db.getRepository('docCategories.viewers', filterByTk).set([]);
        await ctx.db.getRepository('docCategories.editors', filterByTk).set([]);
      }
      ctx.body = { ok: true };
      await next();
    });

    // 分類 create：同專案同父資料夾下不允許同名
    this.app.resourceManager.registerActionHandler('docCategories:create', async (ctx, next) => {
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docCategories');
      const { name, projectId, parentId = null } = values;
      if (name) {
        const dup = await repo.findOne({ filter: { name, projectId: projectId || null, parentId: parentId || null } });
        if (dup) { ctx.throw(400, `資料夾「${name}」已存在，請使用不同名稱`); return; }
      }
      const cat = await repo.create({ values });
      ctx.body = cat;
      await next();
    });

    // 分類 update：改名時也檢查同層是否已有同名
    this.app.resourceManager.registerActionHandler('docCategories:update', async (ctx, next) => {
      const { filterByTk } = ctx.action.params;
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docCategories');
      if (values.name) {
        const current = await repo.findOne({ filterByTk });
        if (current) {
          const dup = await repo.findOne({
            filter: { name: values.name, projectId: current.projectId || null, parentId: current.parentId || null }
          });
          if (dup && dup.id !== current.id) {
            ctx.throw(400, `資料夾「${values.name}」已存在，請使用不同名稱`); return;
          }
        }
      }
      await repo.update({ filterByTk, values });
      const cat = await repo.findOne({ filterByTk });
      ctx.body = cat;
      await next();
    });

    // 文件鎖定（admin only，需二次確認由前端處理）
    this.app.resourceManager.registerActionHandler('docDocuments:lock', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以鎖定文件'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const doc = await repo.findOne({ filterByTk });
      if (!doc) { ctx.throw(404, '文件不存在'); return; }
      if (doc.locked) { ctx.body = { ok: true, locked: true, message: '文件已是鎖定狀態' }; return; }
      await repo.update({ filterByTk, values: { locked: true } });
      await writeAuditLog({ action: 'lock', resourceId: doc.id, resourceTitle: doc.title, user: currentUser });
      ctx.body = { ok: true, locked: true };
      await next();
    });

    // 文件解鎖（admin only）
    this.app.resourceManager.registerActionHandler('docDocuments:unlock', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以解鎖文件'); return; }
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const doc = await repo.findOne({ filterByTk });
      if (!doc) { ctx.throw(404, '文件不存在'); return; }
      if (!doc.locked) { ctx.body = { ok: true, locked: false, message: '文件已是未鎖定狀態' }; return; }
      await repo.update({ filterByTk, values: { locked: false } });
      await writeAuditLog({ action: 'unlock', resourceId: doc.id, resourceTitle: doc.title, user: currentUser });
      ctx.body = { ok: true, locked: false };
      await next();
    });

    // 稽核日誌查詢（admin only）
    this.app.resourceManager.registerActionHandler('docAuditLogs:list', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以查看稽核日誌'); return; }
      const params = ctx.action.params;
      const pageSize = parseInt(params.pageSize) || 50;
      const page = parseInt(params.page) || 1;
      const filter = params.filter || {};
      const where = {};
      if (filter.action) where.action = filter.action;
      if (filter.userId) where.userId = filter.userId;
      if (filter.resourceType) where.resourceType = filter.resourceType;
      const { Op } = require('sequelize');
      if (filter.resourceTitle) where.resourceTitle = { [Op.iLike]: '%' + filter.resourceTitle + '%' };
      if (filter.dateFrom || filter.dateTo) {
        where.createdAt = {};
        if (filter.dateFrom) where.createdAt[Op.gte] = new Date(filter.dateFrom);
        if (filter.dateTo) where.createdAt[Op.lte] = new Date(filter.dateTo);
      }
      const repo = ctx.db.getRepository('docAuditLogs');
      const { count, rows } = await repo.model.findAndCountAll({
        where, order: [['createdAt', 'DESC']],
        limit: pageSize, offset: (page - 1) * pageSize,
      });
      ctx.body = rows.map(r => r.toJSON());
      ctx.meta = { count, page, pageSize, totalPage: Math.ceil(count / pageSize) };
    });

    // 文件拖曳排序：接收新的 id 順序陣列，批次更新 sort 欄位
    this.app.resourceManager.registerActionHandler('docDocuments:reorder', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { ids } = ctx.request.body || {};
      if (!Array.isArray(ids) || ids.length === 0) { ctx.throw(400, 'ids required'); return; }
      const repo = ctx.db.getRepository('docDocuments');
      await Promise.all(ids.map((id, index) => repo.update({ filterByTk: id, values: { sort: index } })));
      ctx.body = { ok: true };
      await next();
    });

    // 資料夾拖曳排序
    this.app.resourceManager.registerActionHandler('docCategories:reorder', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { ids } = ctx.request.body || {};
      if (!Array.isArray(ids) || ids.length === 0) { ctx.throw(400, 'ids required'); return; }
      const repo = ctx.db.getRepository('docCategories');
      await Promise.all(ids.map((id, index) => repo.update({ filterByTk: id, values: { sort: index } })));
      ctx.body = { ok: true };
      await next();
    });

    // 資料夾權限：取得目前的 viewer/editor 列表
    this.app.resourceManager.registerActionHandler('docCategories:getPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const cat = await ctx.db.getRepository('docCategories').findOne({
        filterByTk,
        appends: ['viewers', 'editors'],
      });
      if (!cat) { ctx.throw(404, '資料夾不存在'); return; }
      ctx.body = {
        viewerIds: (cat.viewers || []).map(u => u.id),
        editorIds: (cat.editors || []).map(u => u.id),
        viewers: cat.viewers || [],
        editors: cat.editors || [],
      };
    });

    // 資料夾權限：設定 viewer/editor（限 admin）
    this.app.resourceManager.registerActionHandler('docCategories:setPermissions', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, '只有管理員可以設定資料夾權限'); return; }
      const { filterByTk } = ctx.action.params;
      const body = ctx.request.body || {};
      const { viewerIds, editorIds } = body;
      const catRepo = ctx.db.getRepository('docCategories');
      const cat = await catRepo.findOne({ filterByTk });
      if (!cat) { ctx.throw(404, '資料夾不存在'); return; }
      if (Array.isArray(viewerIds)) {
        await ctx.db.getRepository('docCategories.viewers', filterByTk).set(viewerIds);
      }
      if (Array.isArray(editorIds)) {
        await ctx.db.getRepository('docCategories.editors', filterByTk).set(editorIds);
      }
      ctx.body = { ok: true };
      await next();
    });

    // ── Template content helpers ─────────────────────────────────────────────
    var TEMPLATE_PREFIX = 'TEMPLATE_FORM_V1\n';
    function isTemplateContent(content) {
      return typeof content === 'string' && content.startsWith(TEMPLATE_PREFIX);
    }
    function parseTemplateContent(content) {
      try { return JSON.parse(content.slice(TEMPLATE_PREFIX.length)); } catch(e) { return null; }
    }
    function serializeTemplateContent(obj) {
      return TEMPLATE_PREFIX + JSON.stringify(obj);
    }

    // ── docTemplates CRUD handlers ───────────────────────────────────────────
    this.app.resourceManager.registerActionHandler('docTemplates:list', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }
      const repo = ctx.db.getRepository('docTemplates');
      const filter = { status: 'active' };
      const rows = await repo.find({ filter, sort: ['sort', 'createdAt'] });
      ctx.body = rows;
      ctx.meta = { count: rows.length };
      await next();
    });

    this.app.resourceManager.registerActionHandler('docTemplates:get', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }
      const id = ctx.action.params.filterByTk || ctx.action.params.id;
      const repo = ctx.db.getRepository('docTemplates');
      const row = await repo.findOne({ filterByTk: id });
      if (!row) { ctx.throw(404, 'Template not found'); return; }
      ctx.body = row;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docTemplates:create', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, 'Admin only'); return; }
      const body = ctx.request.body || {};
      // label → name auto-conversion happens on client; server receives ready-to-save fields
      var name = (body.name || '').trim();
      if (!name) { ctx.throw(400, 'Template name required'); return; }
      const repo = ctx.db.getRepository('docTemplates');
      const tpl = await repo.create({
        values: {
          name,
          description: body.description || '',
          fields: body.fields || [],
          defaultCategoryId: body.defaultCategoryId || null,
          projectId: body.projectId || null,
          listDisplayFields: body.listDisplayFields || [],
          status: 'active',
          sort: body.sort || 0,
          createdById: currentUser.id,
          updatedById: currentUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      await writeAuditLog({ action: 'template_create', resourceType: 'docTemplates', resourceId: tpl.id, resourceTitle: name, user: currentUser, detail: { fields: (body.fields || []).length } });
      ctx.body = tpl;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docTemplates:update', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, 'Admin only'); return; }
      const id = ctx.action.params.filterByTk || ctx.action.params.id;
      const body = ctx.request.body || {};
      const repo = ctx.db.getRepository('docTemplates');
      const existing = await repo.findOne({ filterByTk: id });
      if (!existing) { ctx.throw(404, 'Template not found'); return; }
      const updates = { updatedById: currentUser.id, updatedAt: new Date() };
      if (body.name !== undefined) updates.name = (body.name || '').trim();
      if (body.description !== undefined) updates.description = body.description;
      if (body.fields !== undefined) updates.fields = body.fields;
      if (body.defaultCategoryId !== undefined) updates.defaultCategoryId = body.defaultCategoryId;
      if (body.projectId !== undefined) updates.projectId = body.projectId;
      if (body.listDisplayFields !== undefined) updates.listDisplayFields = body.listDisplayFields;
      if (body.status !== undefined) updates.status = body.status;
      if (body.sort !== undefined) updates.sort = body.sort;
      const updated = await repo.update({ filterByTk: id, values: updates });
      await writeAuditLog({ action: 'template_update', resourceType: 'docTemplates', resourceId: id, resourceTitle: updates.name || existing.name, user: currentUser });
      ctx.body = updated;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docTemplates:destroy', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, 'Unauthorized'); return; }
      if (!isAdmin(currentUser)) { ctx.throw(403, 'Admin only'); return; }
      const id = ctx.action.params.filterByTk || ctx.action.params.id;
      const repo = ctx.db.getRepository('docTemplates');
      const existing = await repo.findOne({ filterByTk: id });
      if (!existing) { ctx.throw(404, 'Template not found'); return; }
      // Soft delete: set status=archived
      await repo.update({ filterByTk: id, values: { status: 'archived', updatedAt: new Date() } });
      await writeAuditLog({ action: 'template_delete', resourceType: 'docTemplates', resourceId: id, resourceTitle: existing.name, user: currentUser });
      ctx.body = { ok: true };
      await next();
    });

    this.app.acl.registerSnippet({
      name: 'pm.' + this.name,
      actions: ['docGroups:*', 'docProjects:*', 'docDocuments:*', 'docCategories:*', 'docVersions:*', 'docTypes:*', 'docTemplates:*'],
    });
    // 用 public 讓 NocoBase member 角色也能進入，DocHub 自己的 handler 負責權限控制
    // 注意：public ACL 不會 inject currentUser，handler 需要自行從 ctx.auth.user 或 token 取得
    // 用 public 讓所有角色（包含 member）都能通過 ACL，handler 自己負責權限過濾
    // public ACL 不會 inject currentUser，由 getCurrentUser() helper 手動從 auth 取得
    // DocHub 通知查詢端點 — 掛在 docDocuments resource 下作為自定義 action
    // GET /api/docDocuments:myNotifications — 回傳當前 user 的 doc-hub channel 通知
    this.app.resourceManager.registerActionHandler('docDocuments:myNotifications', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const params = ctx.action?.params || {};
      const pageSize = Math.min(parseInt(String(params.pageSize || '20')), 200);
      const page = parseInt(String(params.page || '1'));
      try {
        const msgRepo = ctx.db.getRepository('notificationInAppMessages');
        const { count, rows } = await msgRepo.model.findAndCountAll({
          where: { userId: currentUser.id, channelName: 'doc-hub' },
          order: [['receiveTimestamp', 'DESC']],
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });
        ctx.body = rows.map(r => r.toJSON());
        ctx.meta = { count, page, pageSize, totalPage: Math.ceil(count / pageSize) };
      } catch(e) {
        ctx.throw(500, e.message);
      }
      await next();
    });

    this.app.acl.allow('docDocuments', ['syncToGit', 'search', 'list', 'update', 'get', 'create', 'pullFromGit', 'fetchFromGit', 'destroy', 'reorder', 'webhookReceive', 'count', 'updateSummary', 'uploadImage', 'lock', 'unlock', 'myNotifications'], 'public');
    this.app.acl.allow('docAuditLogs', ['list'], 'public');
    this.app.acl.allow('docProjects', ['list', 'get', 'create', 'update', 'destroy', 'syncToGit', 'getPermissions', 'setPermissions'], 'public');
    this.app.acl.allow('docGroups', ['list', 'get', 'create', 'update', 'destroy'], 'public');
    this.app.acl.allow('docCategories', ['list', 'get', 'create', 'update', 'destroy', 'reorder', 'getPermissions', 'setPermissions'], 'public');
    this.app.acl.allow('docVersions', ['list', 'updateSummary'], 'public');
    this.app.acl.allow('docTypes', ['list', 'get', 'update'], 'public');
    this.app.acl.allow('docTemplates', ['list', 'get', 'create', 'update', 'destroy'], 'public');

    // 種子資料：確保預設 docTypes 存在（idempotent）
    try {
      const typeRepo = this.db.getRepository('docTypes');
      const RELEASE_NOTE_TEMPLATE = [
        '# 上版單',
        '',
        '## 基本資訊',
        '',
        '| 項目 | 內容 |',
        '|------|------|',
        '| 專案名稱 | |',
        '| 版本號 | v |',
        '| 上版日期 | YYYY-MM-DD |',
        '| 上版時間 | HH:MM |',
        '| 上版環境 | □ 開發  □ 測試  □ 預產  □ 正式 |',
        '| 負責人 | |',
        '| 審核人 | |',
        '',
        '---',
        '',
        '## 上版內容',
        '',
        '### 變更摘要',
        '',
        '> 簡短說明此次上版的主要目的與範圍',
        '',
        '',
        '',
        '### 變更清單',
        '',
        '| # | 變更項目 | 類型 | 影響範圍 | 備註 |',
        '|---|----------|------|----------|------|',
        '| 1 | | □ 新功能 □ 修正 □ 優化 □ 設定 | | |',
        '| 2 | | □ 新功能 □ 修正 □ 優化 □ 設定 | | |',
        '| 3 | | □ 新功能 □ 修正 □ 優化 □ 設定 | | |',
        '',
        '---',
        '',
        '## 上版前檢查',
        '',
        '| 檢查項目 | 確認 | 備註 |',
        '|----------|------|------|',
        '| 程式碼已通過 Code Review | □ | |',
        '| 測試環境已驗證通過 | □ | |',
        '| DB Migration 腳本已準備 | □ N/A □ 已準備 | |',
        '| 環境變數 / 設定檔已更新 | □ N/A □ 已更新 | |',
        '| 備份計畫已確認 | □ N/A □ 已確認 | |',
        '| 回滾計畫已確認 | □ N/A □ 已確認 | |',
        '| 相關人員已通知 | □ | |',
        '',
        '---',
        '',
        '## 上版流程',
        '',
        '| 步驟 | 操作項目 | 執行人 | 預計時間 | 完成 |',
        '|------|----------|--------|----------|------|',
        '| 1 | 通知相關人員進入維護模式 | | | □ |',
        '| 2 | 建立當前版本備份 | | | □ |',
        '| 3 | 執行 DB Migration | | | □ |',
        '| 4 | 部署新版程式碼 | | | □ |',
        '| 5 | 重啟服務 | | | □ |',
        '| 6 | 執行 Smoke Test | | | □ |',
        '| 7 | 確認監控指標正常 | | | □ |',
        '| 8 | 通知相關人員上版完成 | | | □ |',
        '',
        '---',
        '',
        '## 上版後驗證',
        '',
        '| 驗證項目 | 結果 | 驗證人 |',
        '|----------|------|--------|',
        '| 主要功能正常 | □ 通過 □ 異常 | |',
        '| 效能指標正常 | □ 通過 □ 異常 | |',
        '| 錯誤日誌無異常 | □ 通過 □ 異常 | |',
        '',
        '---',
        '',
        '## 問題記錄',
        '',
        '> 如上版過程中發生任何問題，記錄於此',
        '',
        '| 時間 | 問題描述 | 處理方式 | 狀態 |',
        '|------|----------|----------|------|',
        '| | | | □ 處理中 □ 已解決 |',
        '',
        '---',
        '',
        '## 簽核',
        '',
        '| 角色 | 姓名 | 簽核時間 |',
        '|------|------|----------|',
        '| 上版負責人 | | |',
        '| 專案主管 | | |',
      ].join('\n');

      const defaultTypes = [
        { id: 2, name: 'SRS', color: 'blue', sort: 1, template: null },
        { id: 3, name: 'SDS', color: 'purple', sort: 2, template: null },
        { id: 4, name: 'SPEC', color: 'cyan', sort: 3, template: null },
        { id: 5, name: 'PM-Doc', color: 'orange', sort: 4, template: null },
        { id: 6, name: 'Others', color: 'default', sort: 5, template: null },
        { id: 7, name: '上版單', color: 'red', sort: 6, template: RELEASE_NOTE_TEMPLATE },
      ];
      for (const t of defaultTypes) {
        const exists = await typeRepo.findOne({ filter: { id: t.id } });
        if (!exists) {
          await typeRepo.create({ values: t });
        } else if (t.id === 7 && !exists.template) {
          // 補上 template 欄位（如果已存在但沒有 template）
          await typeRepo.update({ filter: { id: 7 }, values: { template: RELEASE_NOTE_TEMPLATE } });
        }
      }
    } catch(e) {
      this.logger && this.logger.warn('docTypes seed error: ' + (e && e.message));
    }

    // 版本摘要修改：只有版本的 editorId 或 admin 可修改 changeSummary
    this.app.resourceManager.registerActionHandler('docVersions:updateSummary', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.throw(401, '請先登入'); return; }
      const { filterByTk } = ctx.action.params;
      const body = ctx.request.body || {};
      const changeSummary = (body.changeSummary || '').trim();
      const vRepo = this.db.getRepository('docVersions');
      const ver = await vRepo.findOne({ filterByTk });
      if (!ver) { ctx.throw(404, '版本不存在'); return; }
      if (!isAdmin(currentUser) && Number(ver.editorId) !== Number(currentUser.id)) {
        ctx.throw(403, '只有修改者或管理員可以編輯版本摘要'); return;
      }
      await vRepo.update({ filterByTk, values: { changeSummary } });
      ctx.body = { ok: true, changeSummary };
    });

    // 自動版本記錄 + 訂閱者通知
    this.db.on('docDocuments.afterCreate', async (model, options) => {
      const currentUser = options?.context?.state?.currentUser;
      // Audit log：建立文件
      await writeAuditLog({ action: 'create', resourceId: model.id, resourceTitle: model.title, user: currentUser });
      // 確保 createdById 有被記錄（owner）
      if (currentUser?.id && !model.createdById) {
        try {
          await this.db.getRepository('docDocuments').update({
            filterByTk: model.id,
            values: { createdById: currentUser.id, authorId: currentUser.id },
          });
        } catch(e) { this.logger.warn('set createdById failed: ' + e.message); }
      }

      // 建立時若已綁定 git repo，自動拉取內容
      if (model.githubRepo) {
        try {
          const filePath = model.githubFilePath || 'README.md';
          const branch = model.githubBranch || 'main';
          const ghFile = await githubGetFile(model.githubRepo, filePath, branch);
          let content = null;
          let sha = null;
          if (ghFile && !ghFile.message) {
            // GitHub: content is base64, sha is direct
            const rawContent = ghFile.content || '';
            const decoded = Buffer.from(rawContent.replace(/\n/g, ''), 'base64').toString('utf8');
            content = decoded;
            sha = ghFile.sha;
          } else if (ghFile && ghFile.content !== undefined && ghFile.sha) {
            // GitLab: already handled in githubGetFile (content is base64, sha is blob_id)
            const decoded = Buffer.from(ghFile.content.replace(/\n/g, ''), 'base64').toString('utf8');
            content = decoded;
            sha = ghFile.sha;
          }
          if (content !== null) {
            await this.db.getRepository('docDocuments').update({
              filterByTk: model.id,
              values: { content, gitSha: sha, gitSyncStatus: 'synced', gitSyncedAt: new Date() },
            });
            // 建立 v1（用拉取的內容）
            try {
              const vRepo = this.db.getRepository('docVersions');
              await vRepo.create({ values: { documentId: model.id, content, changeSummary: '初始版本（從 Git 拉取）', versionNumber: 1, editorId: currentUser?.id } });
            } catch (err) { this.logger.error('v1 create failed: ' + err.message); }
            return;
          } else {
            this.logger.warn('afterCreate auto-pull: git returned error: ' + (ghFile?.message || 'unknown'));
            await this.db.getRepository('docDocuments').update({
              filterByTk: model.id, values: { gitSyncStatus: 'failed', gitSyncedAt: new Date() }
            }).catch(() => {});
          }
        } catch (err) {
          this.logger.warn('afterCreate auto-pull failed: ' + err.message);
          await this.db.getRepository('docDocuments').update({
            filterByTk: model.id, values: { gitSyncStatus: 'failed', gitSyncedAt: new Date() }
          }).catch(() => {});
        }
      }

      // 建立 v1（無 git 或拉取失敗時）
      if (!model.content) return;
      try {
        const vRepo = this.db.getRepository('docVersions');
        await vRepo.create({ values: { documentId: model.id, content: model.content, changeSummary: '初始版本', versionNumber: 1, editorId: currentUser?.id } });
      } catch (err) { this.logger.error('v1 create failed: ' + err.message); }
    });

    this.db.on('docDocuments.afterUpdate', async (model, options) => {
      const changed = model.changed();
      if (!changed || !changed.includes('content')) return;

      // public ACL 下 ctx.state.currentUser 可能為 null，需從 auth 取
      let currentUser = options?.context?.state?.currentUser;
      if (!currentUser && options?.context?.auth?.check) {
        try {
          const u = await options.context.auth.check();
          if (u) { currentUser = u; if (options.context.state) options.context.state.currentUser = u; }
        } catch(e) { /* unauthenticated */ }
      }

      const userSummary = options?.context?.action?.params?.values?.changeSummary
        || options?.context?.body?.changeSummary;

      // 自動版本記錄
      try {
        const vRepo = this.db.getRepository('docVersions');
        const latest = await vRepo.findOne({ filter: { documentId: model.id }, sort: ['-versionNumber'] });
        const next = (latest?.versionNumber || 0) + 1;
        const changeSummary = (userSummary && userSummary.trim()) ? userSummary.trim() : 'v' + next;
        // v1 存完整 content 作為基底；之後只存 diffPatch
        const isFirst = next === 1;
        const diffPatch = isFirst ? null : computeLineDiffPatch(latest?.content || '', model.content || '');
        await vRepo.create({ values: {
          documentId: model.id,
          content: isFirst ? model.content : null,
          diffPatch,
          changeSummary,
          versionNumber: next,
          editorId: currentUser?.id,
        }});
      } catch (err) { this.logger.error('version create failed: ' + err.message); }

      // 訂閱者站內信通知
      try {
        const docRepo = this.db.getRepository('docDocuments');
        const doc = await docRepo.findOne({ filterByTk: model.id, appends: ['subscribers', 'category'] });
        const docSubscribers = doc?.subscribers || [];
        // 合併專案層訂閱者
        let projSubscribers = [];
        if (doc?.projectId) {
          try {
            const proj = await this.db.getRepository('docProjects').findOne({ filterByTk: doc.projectId, appends: ['subscribers'] });
            projSubscribers = proj?.subscribers || [];
          } catch(e) {}
        }
        // 合併去重（用 id）
        const seenIds = new Set();
        const subscribers = [];
        for (const u of [...docSubscribers, ...projSubscribers]) {
          if (!seenIds.has(u.id)) { seenIds.add(u.id); subscribers.push(u); }
        }
        this.logger.info(`[DocHub notify] docId=${model.id} subscribers=${subscribers.length} currentUserId=${currentUser?.id}`);
        if (subscribers.length === 0) return;

        // currentUser 在 hook context 可能只有 id，需從 DB 取完整資料
        let editorName = '未知編輯者';
        if (currentUser?.id) {
          try {
            const userRepo = this.db.getRepository('users');
            const fullUser = await userRepo.findOne({ filterByTk: currentUser.id });
            editorName = fullUser?.nickname || fullUser?.username || '未知編輯者';
          } catch(e) {
            editorName = currentUser?.nickname || currentUser?.username || '未知編輯者';
          }
        }
        const summaryText = (userSummary && userSummary.trim()) ? `（${userSummary.trim()}）` : '';
        const folderText = doc?.category?.name ? `【${doc.category.name}】` : '';
        const msgRepo = this.db.getRepository('notificationInAppMessages');

        for (const subscriber of subscribers) {
          if (currentUser && subscriber.id === currentUser.id) continue;
          try {
            const m = await msgRepo.create({
              values: {
                userId: subscriber.id,
                channelName: 'doc-hub',
                title: `文件更新：${folderText}${model.title}`,
                content: `${editorName} 更新了文件${folderText}《${model.title}》${summaryText}`,
                status: 'unread',
                receiveTimestamp: Date.now(),
              },
            });
            // 透過 WebSocket 即時推播給線上用戶
            try {
              this.app.emit('ws:sendToUser', {
                userId: subscriber.id,
                message: { type: 'in-app-message:created', payload: m.toJSON() },
              });
            } catch(wsErr) { this.logger.warn('[DocHub] ws emit failed: ' + wsErr.message); }
          } catch (err) { this.logger.error(`[DocHub] 通知失敗 userId=${subscriber.id}: ${err.message}`); }
        }
      } catch (err) { this.logger.error('subscriber notification failed: ' + err.message); }
    });

    // 確保 doc-hub in-app notification channel 存在
    try {
      const channelRepo = this.db.getRepository('notificationChannels');
      const existing = await channelRepo.findOne({ filter: { name: 'doc-hub' } });
      if (!existing) {
        await channelRepo.create({
          values: {
            name: 'doc-hub',
            title: 'DocHub 文件通知',
            notificationType: 'in-app-message',
            description: 'DocHub plugin 文件訂閱通知',
          }
        });
        this.logger.info('[DocHub] notification channel "doc-hub" created');
      }
    } catch(e) {
      this.logger.warn('[DocHub] ensure notification channel failed: ' + e.message);
    }

    // 修正 sidebar 連結指向 /admin/doc-hub
    await this.fixSidebarLink();

    this.logger.info('DocHub plugin loaded');
  }

  async install() {
    await this.createDocHubUI();
    this.logger.info('DocHub plugin installed with UI');
  }

  async createDocHubUI() {
    const routesRepo = this.db.getRepository('desktopRoutes');

    // 如果有舊的 page 類型，刪掉重建
    const existingPage = await routesRepo.findOne({ filter: { title: 'DocHub', type: 'page' } });
    if (existingPage) {
      await routesRepo.destroy({ filter: { id: existingPage.id } });
      this.logger.info('DocHub old page route removed, rebuilding as link');
    }

    // 檢查是否已有 link 類型
    const existingLink = await routesRepo.findOne({ filter: { title: 'DocHub', type: 'link' } });
    if (existingLink) {
      this.logger.info('DocHub link already exists, skip UI creation');
      return;
    }

    // 建立 link 類型 route，直接指向 /admin/doc-hub
    const route = await routesRepo.create({
      values: {
        title: 'DocHub',
        icon: 'FileTextOutlined',
        type: 'link',
        options: { href: '/admin/doc-hub', target: '_self' },
      },
    });

    this.logger.info('DocHub UI created as link route: id=' + route.id);
  }

  async fixSidebarLink() {
    const routesRepo = this.db.getRepository('desktopRoutes');

    // 移除所有非 link 類型的 DocHub 路由（page, flowPage 等舊的）
    const oldRoutes = await routesRepo.find({ filter: { title: 'DocHub' } });
    for (const r of oldRoutes) {
      if (r.type !== 'link') {
        await routesRepo.destroy({ filter: { id: r.id } });
        this.logger.info('DocHub old route removed: type=' + r.type + ' id=' + r.id);
      }
    }

    const existingLink = await routesRepo.findOne({ filter: { title: 'DocHub', type: 'link' } });
    if (!existingLink) {
      await routesRepo.create({
        values: {
          title: 'DocHub',
          icon: 'FileTextOutlined',
          type: 'link',
          options: { href: '/admin/doc-hub', target: '_self' },
        },
      });
      this.logger.info('DocHub link route created');
    }
  }

  async afterEnable() { this.logger.info('DocHub plugin enabled'); }
  async afterDisable() {}
  async remove() {}
}

module.exports = PluginDocHubServer;
module.exports.default = PluginDocHubServer;
module.exports.PluginDocHubServer = PluginDocHubServer;
