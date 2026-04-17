-- DocHub Seed Data
-- 執行方式：
--   docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase < scripts/seed.sql
-- 注意：使用 INSERT ... ON CONFLICT DO NOTHING，重複執行安全。

-- ─────────────────────────────────────────────
-- 第一層：群組（docGroups）
-- ─────────────────────────────────────────────
INSERT INTO "docGroups" (id, name, sort, "createdAt", "updatedAt")
VALUES
  (1, '專案文件', 1, NOW(), NOW()),
  (2, '公司知識庫', 2, NOW(), NOW()),
  (3, '歸檔',     3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      sort = EXCLUDED.sort,
      "updatedAt" = NOW();

-- 同步 sequence，避免後續 INSERT 衝突
SELECT setval('"docGroups_id_seq"', (SELECT MAX(id) FROM "docGroups"));

-- ─────────────────────────────────────────────
-- 第二層（資料夾預設清單）
-- 說明：資料夾（docCategories）是跟著專案建立的，
--       不在 seed 裡建實際資料，而是記錄在 client
--       的 DEFAULT_FOLDERS 常數（dist/client/index.js line 218）。
--       以下列出預設資料夾名稱供參考，若需要在特定
--       專案下建立預設資料夾，請改用下方範本。
--
-- 預設資料夾順序：
--   1. SRS
--   2. SDS
--   3. SPEC
--   4. PM-Doc
--   5. Others
--   6. 上版單
--
-- 若要為某個已存在的專案（projectId = X）批次建立預設資料夾：
-- ─────────────────────────────────────────────
-- INSERT INTO "docCategories" (name, "projectId", sort, "createdAt", "updatedAt")
-- VALUES
--   ('SRS',    X, 1, NOW(), NOW()),
--   ('SDS',    X, 2, NOW(), NOW()),
--   ('SPEC',   X, 3, NOW(), NOW()),
--   ('PM-Doc', X, 4, NOW(), NOW()),
--   ('Others', X, 5, NOW(), NOW()),
--   ('上版單', X, 6, NOW(), NOW())
-- ON CONFLICT DO NOTHING;
