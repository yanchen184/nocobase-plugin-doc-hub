exports.syncProjectToGit = async function syncProjectToGit(ctx, next) {
  const { filterByTk } = ctx.action.params;
  const projectRepo = ctx.db.getRepository('docProjects');
  const project = await projectRepo.findOne({ filterByTk });
  if (!project) ctx.throw(404, 'Project not found');
  if (!project.githubRepo || !project.githubToken) ctx.throw(400, 'GitHub settings not configured');

  const docRepo = ctx.db.getRepository('docDocuments');
  const docs = await docRepo.find({ filter: { projectId: project.id, status: 'published' } });
  const results = [];

  for (const doc of docs) {
    try {
      const filePath = (project.githubDocsPath || 'docs/') + (doc.slug || doc.title.replace(/\s+/g, '-').toLowerCase() + '.md');
      const fileContent = ['---','title: "'+doc.title+'"','slug: "'+doc.slug+'"','---','',doc.content||''].join('\n');
      const contentBase64 = Buffer.from(fileContent, 'utf-8').toString('base64');
      const apiUrl = 'https://api.github.com/repos/' + project.githubRepo + '/contents/' + filePath;
      const headers = { 'Authorization': 'Bearer ' + project.githubToken, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' };

      let sha = null;
      try { const r = await fetch(apiUrl+'?ref='+(project.githubBranch||'main'), { headers }); if (r.ok) sha = (await r.json()).sha; } catch(_) {}

      const body = { message: 'docs: sync ' + doc.title, content: contentBase64, branch: project.githubBranch || 'main' };
      if (sha) body.sha = sha;

      const r = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        await docRepo.update({ filterByTk: doc.id, values: { gitSha: d.content?.sha, gitSyncedAt: new Date(), gitSyncStatus: 'synced' } });
        results.push({ id: doc.id, title: doc.title, status: 'synced' });
      } else {
        results.push({ id: doc.id, title: doc.title, status: 'error', error: (await r.json()).message });
      }
    } catch (e) { results.push({ id: doc.id, title: doc.title, status: 'error', error: e.message }); }
  }

  ctx.body = { success: true, total: docs.length, synced: results.filter(r=>r.status==='synced').length, results };
  await next();
};
