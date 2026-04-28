var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docTags', title: '文件標籤',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'color' },
    { type: 'integer', name: 'usageCount', defaultValue: 0 },
    { type: 'belongsTo', name: 'createdBy', target: 'users', foreignKey: 'createdById' },
    { type: 'date', name: 'createdAt', field: 'createdAt' },
    { type: 'date', name: 'updatedAt', field: 'updatedAt' },
    {
      type: 'belongsToMany',
      name: 'documents',
      target: 'docDocuments',
      through: 'docDocumentTags',
      foreignKey: 'tagId',
      otherKey: 'documentId',
    },
  ],
});
