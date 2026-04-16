var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docProjects', title: '文件專案',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'slug', unique: true },
    { type: 'text', name: 'description' },
    { type: 'string', name: 'githubRepo' },
    { type: 'string', name: 'githubBranch', defaultValue: 'main' },
    { type: 'string', name: 'githubDocsPath', defaultValue: 'docs/' },
    { type: 'string', name: 'githubToken' },
    { type: 'hasMany', name: 'documents', target: 'docDocuments', foreignKey: 'projectId' },
    { type: 'hasMany', name: 'categories', target: 'docCategories', foreignKey: 'projectId' },
    { type: 'belongsTo', name: 'group', target: 'docGroups', foreignKey: 'groupId' },
    { type: 'belongsToMany', name: 'viewers', target: 'users', through: 'docProjectViewers', foreignKey: 'projectId', otherKey: 'userId' },
    { type: 'belongsToMany', name: 'editors', target: 'users', through: 'docProjectEditors', foreignKey: 'projectId', otherKey: 'userId' },
    { type: 'belongsToMany', name: 'subscribers', target: 'users', through: 'docProjectSubscribers', foreignKey: 'projectId', otherKey: 'userId' },
    { type: 'belongsTo', name: 'createdBy', target: 'users', foreignKey: 'createdById' },
    { type: 'belongsTo', name: 'updatedBy', target: 'users', foreignKey: 'updatedById' },
    { type: 'date', name: 'createdAt', field: 'createdAt' },
    { type: 'date', name: 'updatedAt', field: 'updatedAt' },
  ],
});
