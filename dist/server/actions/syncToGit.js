// 從環境變數讀取（請在 docker-compose.yml 或 .env 中設定）
const GITHUB_TOKEN = process.env.DOCHUB_GITHUB_TOKEN || '';
const GITLAB_TOKEN = process.env.DOCHUB_GITLAB_TOKEN || '';
const GITLAB_HOST = process.env.DOCHUB_GITLAB_HOST || '';

function isGitLab(repo) {
  return repo && (repo.startsWith(GITLAB_HOST) || repo.startsWith('https://' + GITLAB_HOST));
}

exports.syncToGit = async function syncToGit(ctx, next) {
  const { filterByTk } = ctx.action.params;
  const docRepo = ctx.db.getRepository('docDocuments');
  const doc = await docRepo.findOne({ filterByTk });
  if (!doc) ctx.throw(404, 'Document not found');

  // 文件 Git 設定存在文件本身（不是 project）
  if (!doc.githubRepo || !doc.githubFilePath) {
    ctx.throw(400, '此文件尚未設定 Git 路徑，請在編輯頁填寫 Repo 和檔案路徑');
  }

  if (doc.status !== 'published') {
    ctx.throw(400, '只有已發布的文件才能同步到 Git');
  }

  const repo = doc.githubRepo;
  const filePath = doc.githubFilePath;
  const branch = doc.githubBranch || 'master';
  const fileContent = doc.content || '';
  const contentBase64 = Buffer.from(fileContent, 'utf-8').toString('base64');
  const cu = ctx.state?.currentUser || {};
  const editorName = cu.nickname || cu.username || cu.email || 'NocoBase';
  const editorEmail = cu.email || `${cu.username || 'nocobase'}@dochub.local`;

  let newSha = null;

  if (isGitLab(repo)) {
    // GitLab API
    const https = require('https');
    const cleanRepo = repo.replace('https://' + GITLAB_HOST + '/', '').replace(GITLAB_HOST + '/', '');
    const encodedProject = encodeURIComponent(cleanRepo);
    const encodedFile = encodeURIComponent(filePath);

    // 先取得目前檔案（取 blob_id）
    let existingId = null;
    try {
      const getResult = await new Promise((resolve) => {
        const opts = {
          hostname: GITLAB_HOST, port: 443,
          path: `/api/v4/projects/${encodedProject}/repository/files/${encodedFile}?ref=${branch}`,
          method: 'GET', rejectUnauthorized: false,
          headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN }
        };
        https.get(opts, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve(JSON.parse(d)); } catch(e) { resolve({}); }
          });
        }).on('error', () => resolve({}));
      });
      existingId = getResult.blob_id || null;
    } catch(_) {}

    // PUT (update) or POST (create)
    const method = existingId ? 'PUT' : 'POST';
    const body = JSON.stringify({
      branch,
      content: contentBase64,
      encoding: 'base64',
      commit_message: `docs: update ${filePath} by ${editorName}`,
      author_name: editorName,
      author_email: editorEmail,
    });

    const putResult = await new Promise((resolve, reject) => {
      const opts = {
        hostname: GITLAB_HOST, port: 443,
        path: `/api/v4/projects/${encodedProject}/repository/files/${encodedFile}`,
        method, rejectUnauthorized: false,
        headers: {
          'PRIVATE-TOKEN': GITLAB_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        }
      };
      const req = https.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
          catch(e) { resolve({ status: res.statusCode, data: {} }); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (putResult.status >= 400) {
      ctx.throw(putResult.status, 'GitLab API error: ' + (putResult.data?.message || putResult.status));
    }
    // GitLab PUT 只回 {file_path, branch}，不含 SHA，需要再 GET 一次取 blob_id
    try {
      const getAfter = await new Promise((resolve) => {
        const opts = {
          hostname: GITLAB_HOST, port: 443,
          path: `/api/v4/projects/${encodedProject}/repository/files/${encodedFile}?ref=${branch}`,
          method: 'GET', rejectUnauthorized: false,
          headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN }
        };
        https.get(opts, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
        }).on('error', () => resolve({}));
      });
      newSha = getAfter.blob_id || null;
    } catch(_) { newSha = null; }

  } else {
    // GitHub API
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DocHub',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    let existingSha = null;
    try {
      const getRes = await fetch(apiUrl + '?ref=' + branch, { headers });
      if (getRes.ok) existingSha = (await getRes.json()).sha;
    } catch(_) {}

    const commitBody = {
      message: `docs: update ${filePath} by ${editorName}`,
      content: contentBase64,
      branch,
      author: { name: editorName, email: editorEmail },
      committer: { name: editorName, email: editorEmail },
    };
    if (existingSha) commitBody.sha = existingSha;

    const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(commitBody) });
    if (!putRes.ok) {
      const e = await putRes.json();
      ctx.throw(putRes.status, 'GitHub API error: ' + (e.message || putRes.statusText));
    }
    const result = await putRes.json();
    newSha = result.content?.sha;
  }

  // 更新文件的 Git 狀態
  await docRepo.update({ filterByTk, values: { gitSha: newSha, gitSyncedAt: new Date(), gitSyncStatus: 'synced', gitLastSyncedByName: editorName } });

  ctx.body = { success: true, gitSha: newSha, filePath };
  await next();
};
