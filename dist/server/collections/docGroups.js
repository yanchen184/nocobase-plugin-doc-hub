var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docGroups', title: '文件群組',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'slug' },
    { type: 'text', name: 'description' },
    { type: 'integer', name: 'sort', defaultValue: 0 },
    { type: 'hasMany', name: 'projects', target: 'docProjects', foreignKey: 'groupId' },
    { type: 'date', name: 'createdAt', field: 'createdAt' },
    { type: 'date', name: 'updatedAt', field: 'updatedAt' },
  ],
});
