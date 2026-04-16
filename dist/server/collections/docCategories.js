var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docCategories', title: '文件分類',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'slug' },
    { type: 'belongsTo', name: 'project', target: 'docProjects', foreignKey: 'projectId' },
    { type: 'belongsTo', name: 'parent', target: 'docCategories', foreignKey: 'parentId' },
    { type: 'hasMany', name: 'children', target: 'docCategories', foreignKey: 'parentId' },
    { type: 'integer', name: 'sort', defaultValue: 0 },
    {
      type: 'belongsToMany',
      name: 'viewers',
      target: 'users',
      through: 'docCategoryViewers',
      foreignKey: 'categoryId',
      otherKey: 'userId',
    },
    {
      type: 'belongsToMany',
      name: 'editors',
      target: 'users',
      through: 'docCategoryEditors',
      foreignKey: 'categoryId',
      otherKey: 'userId',
    },
  ],
});
