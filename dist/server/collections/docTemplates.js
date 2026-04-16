var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docTemplates', title: '文件範本',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'text', name: 'description' },
    { type: 'json', name: 'fields' },
    { type: 'integer', name: 'defaultCategoryId' },
    { type: 'integer', name: 'projectId' },
    { type: 'json', name: 'listDisplayFields' },
    { type: 'string', name: 'status', defaultValue: 'active' },
    { type: 'integer', name: 'sort', defaultValue: 0 },
    { type: 'integer', name: 'createdById' },
    { type: 'integer', name: 'updatedById' },
    { type: 'date', name: 'createdAt' },
    { type: 'date', name: 'updatedAt' },
  ],
});
