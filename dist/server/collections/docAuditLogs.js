var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docAuditLogs', title: '稽核日誌',
  fields: [
    { type: 'string', name: 'action' },           // create/update/delete/lock/unlock/git_sync_failed
    { type: 'string', name: 'resourceType' },     // docDocuments / docCategories / docProjects
    { type: 'integer', name: 'resourceId' },
    { type: 'string', name: 'resourceTitle' },    // 快照，資源被刪後仍可查
    { type: 'integer', name: 'userId' },
    { type: 'string', name: 'userNickname' },
    { type: 'json', name: 'detail' },             // 額外資訊，如刪除前的 title/status
    { type: 'date', name: 'createdAt' },
  ],
});
