var import_server = require("@nocobase/server");
var import_syncToGit = require("./actions/syncToGit");
var import_syncProjectToGit = require("./actions/syncProjectToGit");

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

    this.app.resourceManager.registerActionHandler('docDocuments:syncToGit', import_syncToGit.syncToGit);
    this.app.resourceManager.registerActionHandler('docProjects:syncToGit', import_syncProjectToGit.syncProjectToGit);

    // 全文搜尋 action（title + content ILIKE）
    this.app.resourceManager.registerActionHandler('docDocuments:search', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const q = (ctx.action.params.q || '').trim();
      const pageSize = parseInt(ctx.action.params.pageSize) || 20;
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

      ctx.body = rows.map(r => {
        const doc = { ...r };
        doc.category = catMap[r.categoryId] || null;
        doc.type = typeMap[r.typeId] || null;
        doc.lastEditor = editorMap[r.lastEditorId] || null;
        if (r._headline) {
          // ts_headline 回傳的片段已含 <b>關鍵字</b>，轉成前端可用的純文字陣列
          doc._snippets = r._headline.split(' … ').filter(Boolean).map(s => ({ text: s.replace(/<\/?b>/g, '') }));
          doc._headlineHtml = r._headline; // 保留 HTML 版本供前端高亮渲染
          delete doc._headline;
        }
        return doc;
      });
      ctx.meta = { count: total, page, pageSize, totalPage: Math.ceil(total / pageSize) };
      await next();
    });

    // 權限過濾 helper：判斷當前 user 是否為 admin
    function isAdmin(user) {
      if (!user) return false;
      if (Number(user.id) === 1) return true;
      if (user.roles && user.roles.some(r => r.name === 'root' || r.name === 'admin')) return true;
      return false;
    }

    // 取得當前 user 可見的文件 ID 集合（用於 list/search 過濾）
    async function getVisibleDocIds(db, userId) {
      const { Op } = require('sequelize');
      // owner 或 viewer 或 editor 或 subscriber
      const owned = await db.getRepository('docDocuments').find({
        filter: { createdById: userId },
        fields: ['id'],
      });
      const viewerRows = await db.sequelize.query(
        `SELECT "documentId" as id FROM "docDocumentViewers" WHERE "userId" = :uid
         UNION SELECT "documentId" FROM "docDocumentEditors" WHERE "userId" = :uid
         UNION SELECT "documentId" FROM "docDocumentSubscribers" WHERE "userId" = :uid`,
        { replacements: { uid: userId }, type: db.sequelize.QueryTypes.SELECT }
      );
      const ids = new Set([
        ...owned.map(d => d.id),
        ...viewerRows.map(r => r.id),
      ]);
      return [...ids];
    }

    // 覆寫 docDocuments:list — 加權限過濾（owner/viewer/editor/subscriber 都可見）
    this.app.resourceManager.registerActionHandler('docDocuments:list', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) { ctx.body = []; ctx.meta = { count: 0, page: 1, pageSize: 20, totalPage: 0 }; return; }

      const params = ctx.action.params;
      const filter = params.filter || {};
      const { Op } = require('sequelize');
      const repo = ctx.db.getRepository('docDocuments');
      const pageSize = parseInt(params.pageSize) || 20;
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
      const { filterByTk } = ctx.action.params;
      const repo = ctx.db.getRepository('docDocuments');
      const appends = ctx.action.params.appends || [];

      const doc = await repo.findOne({ filterByTk, appends });
      if (!doc) { ctx.throw(404, '文件不存在'); return; }

      if (!isAdmin(currentUser) && currentUser) {
        const uid = currentUser.id;
        const isOwner = doc.createdById === uid;
        if (!isOwner) {
          const ids = await getVisibleDocIds(ctx.db, uid);
          if (!ids.includes(doc.id)) { ctx.throw(403, '沒有權限查看此文件'); return; }
        }
      }
      ctx.body = doc;
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
      const { title, categoryId = null, projectId = null } = values;
      if (title && title.trim()) {
        const filter = { title: title.trim(), categoryId: categoryId || null };
        if (projectId) filter.projectId = projectId;
        const dup = await repo.findOne({ filter });
        if (dup) { ctx.throw(400, `文件「${title.trim()}」已存在於此資料夾，請使用不同標題`); return; }
      }
      const doc = await repo.create({ values: { ...values, authorId: ctx.state?.currentUser?.id, lastEditorId: ctx.state?.currentUser?.id } });
      ctx.body = doc;
      await next();
    });

    this.app.resourceManager.registerActionHandler('docDocuments:update', async (ctx, next) => {
      await getCurrentUser(ctx); // 確保 ctx.state.currentUser 被設置（public ACL 需要）
      const { filterByTk } = ctx.action.params;
      const values = ctx.action.params.values || ctx.request.body || {};
      const { viewerIds, editorIds, subscriberIds, changeSummary, skipConflictCheck, ...docFields } = values;

      const repo = ctx.db.getRepository('docDocuments');

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

      // 更新文件本體欄位（不含 m2m）
      await repo.update({ filterByTk, values: { ...docFields, lastEditorId: ctx.state?.currentUser?.id } });

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
      let ghFile;
      try {
        ghFile = await githubGetFile(doc.githubRepo, filePath, branch);
      } catch (e) {
        this.logger.error('[DocHub] pullFromGit fetch error: ' + e.message);
        ctx.throw(502, 'Git 拉取失敗，請稍後再試');
        return;
      }
      if (!ghFile || !ghFile.content) {
        ctx.throw(404, ghFile?.message ? `找不到檔案：${ghFile.message}` : '找不到檔案（請確認 repo / 路徑 / 分支）');
        return;
      }
      try {
        const content = Buffer.from(ghFile.content, 'base64').toString('utf8');
        await repo.update({ filterByTk, values: { content, gitSha: ghFile.sha, gitSyncedAt: new Date(), gitSyncStatus: 'synced' } });
        const updated = await repo.findOne({ filterByTk, appends: ['viewers', 'editors', 'subscribers', 'type', 'lastEditor'] });
        ctx.body = updated;
        this.logger.info(`[DocHub] pullFromGit: doc ${filterByTk} pulled sha=${ghFile.sha}`);
      } catch (e) {
        this.logger.error('[DocHub] pullFromGit update error: ' + e.message);
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
      if (!githubRepo || !githubFilePath) ctx.throw(400, '請提供 repo 和 filePath');
      try {
        const ghFile = await githubGetFile(githubRepo, githubFilePath, branch);
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
            if (branch && branch !== expectedBranch) {
              this.logger.info(`[DocHub] webhook: skip doc ${docModel.id}, branch mismatch (got ${branch}, expect ${expectedBranch})`);
              continue;
            }

            // 從 Git 拉最新內容
            const ghFile = await githubGetFile(docModel.githubRepo, filePath, branch);
            if (!ghFile || !ghFile.content) continue;

            const content = Buffer.from(ghFile.content, 'base64').toString('utf8');
            await docRepo.update({
              filterByTk: docModel.id,
              values: { content, gitSha: ghFile.sha, gitSyncedAt: new Date(), gitSyncStatus: 'synced' }
            });
            updated++;
            this.logger.info(`[DocHub] webhook updated doc id=${docModel.id} sha=${ghFile.sha}`);
          } catch (e) {
            this.logger.error(`[DocHub] webhook update doc ${docModel.id} error: ${e.message}`);
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

    // 專案 create/update/destroy 限 admin
    this.app.resourceManager.registerActionHandler('docProjects:create', async (ctx, next) => {
      const currentUser = await getCurrentUser(ctx);
      const isAdmin = Number(currentUser?.id) === 1
        || currentUser?.roles?.some(r => r.name === 'root' || r.name === 'admin');
      if (!isAdmin) { ctx.throw(403, '只有管理員可以建立專案'); return; }
      const values = ctx.request.body || {};
      const repo = ctx.db.getRepository('docProjects');
      const project = await repo.create({ values });
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

    // 文件拖曳排序：接收新的 id 順序陣列，批次更新 sort 欄位
    this.app.resourceManager.registerActionHandler('docDocuments:reorder', async (ctx, next) => {
      const { ids } = ctx.request.body || {};
      if (!Array.isArray(ids) || ids.length === 0) { ctx.throw(400, 'ids required'); return; }
      const repo = ctx.db.getRepository('docDocuments');
      await Promise.all(ids.map((id, index) => repo.update({ filterByTk: id, values: { sort: index } })));
      ctx.body = { ok: true };
      await next();
    });

    // 資料夾拖曳排序
    this.app.resourceManager.registerActionHandler('docCategories:reorder', async (ctx, next) => {
      const { ids } = ctx.request.body || {};
      if (!Array.isArray(ids) || ids.length === 0) { ctx.throw(400, 'ids required'); return; }
      const repo = ctx.db.getRepository('docCategories');
      await Promise.all(ids.map((id, index) => repo.update({ filterByTk: id, values: { sort: index } })));
      ctx.body = { ok: true };
      await next();
    });

    this.app.acl.registerSnippet({
      name: 'pm.' + this.name,
      actions: ['docGroups:*', 'docProjects:*', 'docDocuments:*', 'docCategories:*', 'docVersions:*', 'docTypes:*'],
    });
    // 用 public 讓 NocoBase member 角色也能進入，DocHub 自己的 handler 負責權限控制
    // 注意：public ACL 不會 inject currentUser，handler 需要自行從 ctx.auth.user 或 token 取得
    // 用 public 讓所有角色（包含 member）都能通過 ACL，handler 自己負責權限過濾
    // public ACL 不會 inject currentUser，由 getCurrentUser() helper 手動從 auth 取得
    this.app.acl.allow('docDocuments', ['syncToGit', 'search', 'list', 'update', 'get', 'create', 'pullFromGit', 'fetchFromGit', 'destroy', 'reorder', 'webhookReceive'], 'public');
    this.app.acl.allow('docProjects', ['list', 'get', 'create', 'update', 'destroy', 'syncToGit'], 'public');
    this.app.acl.allow('docGroups', ['list', 'get', 'create', 'update', 'destroy'], 'public');
    this.app.acl.allow('docCategories', ['list', 'get', 'create', 'update', 'destroy', 'reorder'], 'public');

    // 自動版本記錄 + 訂閱者通知
    this.db.on('docDocuments.afterCreate', async (model, options) => {
      const currentUser = options?.context?.state?.currentUser;
      // 確保 createdById 有被記錄（owner）
      if (currentUser?.id && !model.createdById) {
        try {
          await this.db.getRepository('docDocuments').update({
            filterByTk: model.id,
            values: { createdById: currentUser.id, authorId: currentUser.id },
          });
        } catch(e) { this.logger.warn('set createdById failed: ' + e.message); }
      }
      // 建立 v1
      if (!model.content) return;
      try {
        const vRepo = this.db.getRepository('docVersions');
        await vRepo.create({ values: { documentId: model.id, content: model.content, changeSummary: '初始版本', versionNumber: 1, editorId: currentUser?.id } });
      } catch (err) { this.logger.error('v1 create failed: ' + err.message); }
    });

    this.db.on('docDocuments.afterUpdate', async (model, options) => {
      const changed = model.changed();
      if (!changed || !changed.includes('content')) return;

      const currentUser = options?.context?.state?.currentUser;
      const userSummary = options?.context?.action?.params?.values?.changeSummary
        || options?.context?.body?.changeSummary;

      // 自動版本記錄
      try {
        const vRepo = this.db.getRepository('docVersions');
        const latest = await vRepo.findOne({ filter: { documentId: model.id }, sort: ['-versionNumber'] });
        const next = (latest?.versionNumber || 0) + 1;
        const changeSummary = (userSummary && userSummary.trim()) ? userSummary.trim() : 'v' + next;
        await vRepo.create({ values: { documentId: model.id, content: model.content, changeSummary, versionNumber: next, editorId: currentUser?.id } });
      } catch (err) { this.logger.error('version create failed: ' + err.message); }

      // 訂閱者站內信通知
      try {
        const docRepo = this.db.getRepository('docDocuments');
        const doc = await docRepo.findOne({ filter: { id: model.id }, appends: ['subscribers', 'category'] });
        const subscribers = doc?.subscribers || [];
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
