var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docVersions', title: '文件版本',
  fields: [
    { type: 'belongsTo', name: 'document', target: 'docDocuments', foreignKey: 'documentId' },
    { type: 'text', name: 'content' },
    { type: 'string', name: 'changeSummary' },
    { type: 'integer', name: 'versionNumber' },
    { type: 'string', name: 'gitSha' },
    { type: 'belongsTo', name: 'editor', target: 'users', foreignKey: 'editorId' },
    { type: 'date', name: 'createdAt', field: 'createdAt' },
  ],
});
