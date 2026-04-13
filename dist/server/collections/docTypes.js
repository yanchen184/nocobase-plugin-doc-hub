var import_database = require("@nocobase/database");
module.exports = (0, import_database.defineCollection)({
  name: 'docTypes', title: '文件類型',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'text', name: 'description' },
    { type: 'string', name: 'color' },
    { type: 'integer', name: 'sort', defaultValue: 0 },
  ],
});
