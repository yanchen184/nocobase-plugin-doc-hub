# @nocobase/plugin-doc-hub

**DocHub** — NocoBase 企業文件管理插件。  
支援 Markdown 撰寫、表單範本、版本歷史、文件鎖定、稽核日誌、Git 雙向同步（GitHub / GitLab）。

---

## 功能一覽

| 功能 | 說明 |
|------|------|
| Markdown 編輯器 | 分割預覽、自動儲存（30s）、Cmd+S 手動儲存 |
| 表單範本系統 | 欄位拖曳建構器、JSON 視圖、多類型欄位（文字/日期/用戶）|
| 版本歷史 | 每次儲存自動快照、逐行 Diff 比較 |
| 文件鎖定 | Admin 鎖定後任何人無法刪除，非 Admin 無法編輯 |
| 稽核日誌 | 建立 / 更新 / 刪除 / 鎖定 / Git 同步失敗 全記錄 |
| 專案層級權限 | Viewer / Editor / Subscriber 三角色，每個專案獨立設定 |
| **Git 雙向同步** | GitHub / GitLab Push + Pull，Webhook 自動觸發 |
| 全文搜尋 | PostgreSQL GIN 索引，支援中文模糊搜尋 |
| 拖曳排序 | 文件列表、資料夾皆可拖曳調整順序 |

---

## 部署方式

### 系統需求

- Docker + Docker Compose
- NocoBase image: `nocobase/nocobase:latest-full`

### 目錄結構

```
NocoBase/
├── docker-compose.yml
├── .env                  ← 機敏設定（不進 git）
├── patch-nginx-cache.sh  ← nginx cache 長期快取修正腳本
└── storage/
    └── plugins/
        └── @nocobase/
            └── plugin-doc-hub/   ← 本插件（獨立 git repo）
```

### 首次部署

```bash
# 1. 建立工作目錄
mkdir /opt/nocobase && cd /opt/nocobase

# 2. Clone 插件
mkdir -p storage/plugins/@nocobase
git clone https://github.com/yanchen184/nocobase-plugin-doc-hub \
  storage/plugins/@nocobase/plugin-doc-hub

# 3. 建立 .env（見下方說明）
cp storage/plugins/@nocobase/plugin-doc-hub/.env.example .env

# 4. 啟動
docker-compose up -d

# 5. Patch nginx cache（首次 + 每次 force-recreate 後執行一次）
chmod +x patch-nginx-cache.sh
./patch-nginx-cache.sh
```

### 日常更新插件

```bash
cd storage/plugins/@nocobase/plugin-doc-hub
git pull
cd ../../..
docker-compose restart app
```

---

## 環境變數說明（.env）

| 變數 | 必填 | 說明 |
|------|------|------|
| `APP_KEY` | ✅ | JWT 簽名金鑰，建議 `openssl rand -hex 32` |
| `DB_PASSWORD` | ✅ | PostgreSQL 密碼 |
| `DOCHUB_GITLAB_HOST` | Git 同步時 | GitLab 主機（IP 或 domain） |
| `DOCHUB_GITLAB_TOKEN` | Git 同步時 | GitLab Personal Access Token |
| `DOCHUB_GITHUB_TOKEN` | Git 同步時 | GitHub Personal Access Token |

```env
APP_KEY=your-random-secret-key-change-me
DB_PASSWORD=your-db-password

# GitLab（公司內部）
DOCHUB_GITLAB_HOST=10.1.2.191
DOCHUB_GITLAB_TOKEN=glpat-your-token-here

# GitHub（選填）
DOCHUB_GITHUB_TOKEN=
```

---

## Git 雙向同步設定

DocHub 支援與 GitLab / GitHub 的雙向同步：

- **DocHub → Git**：發布文件後手動推送，或從列表點 🔄
- **Git → DocHub**：手動拉取，或透過 Webhook 在 `git push` 時自動觸發

### Step 1：產生 GitLab Personal Access Token

1. 登入 GitLab（`https://10.1.2.191`）
2. 右上角頭像 → **Edit profile** → **Access Tokens**
3. 建立新 Token，勾選以下 Scopes：
   - ✅ `read_repository` — 讀取檔案（Git → DocHub 拉取）
   - ✅ `write_repository` — 寫入檔案（DocHub → Git 推送）
4. 複製 Token（只顯示一次！）

### Step 2：填入 .env

```env
DOCHUB_GITLAB_HOST=10.1.2.191
DOCHUB_GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

重啟服務讓設定生效：

```bash
docker-compose restart app
```

### Step 3：在文件上設定 Git 連結

進入任一文件的**編輯頁**，在頂部 Git 同步列（admin 才可見）填入：

| 欄位 | 範例 |
|------|------|
| Repo | `wezoomtek/wez-spring-boot-starters` |
| 檔案路徑 | `docs/quick-start.md` |
| 分支 | `main` 或 `master` |

填好後點「**從 Git 拉取最新**」測試連線。

### Step 4：設定 GitLab Webhook（自動同步）

讓每次 `git push` 自動把最新內容同步到 DocHub：

1. 進入 GitLab 專案 → **Settings** → **Webhooks**
2. URL 填入：
   ```
   http://your-server-ip:13000/api/docDocuments:webhookReceive
   ```
3. **Trigger** 勾選 `Push events`
4. 若使用自簽憑證，取消勾選 `Enable SSL verification`
5. 點 **Add webhook**
6. 點 **Test** → `Push events` 確認回傳 `200 OK`

> 📌 **Demo Repo**：`https://10.1.2.191/wezoomtek/wez-spring-boot-starters`  
> 已包含 `docs/` 目錄和多個 `.md` 檔案，可直接用於測試 Git 雙向同步。

### 推送文件到 Git（DocHub → Git）

1. 文件必須先**發布**（草稿不能推送）
2. 在列表頁找到該文件，點 ⋯ → **同步 Git**
3. 確認後，文件內容將推送到 GitLab 對應路徑並建立 commit

### 同步狀態說明

| 狀態 | 說明 |
|------|------|
| 空白 | 未設定 Git 連結 |
| `Synced ✓` | 最後一次同步成功 |
| `Failed ✗` | 同步失敗（Token 過期 / repo 路徑錯誤）→ 站內信通知 Admin |

---

## 帳號

| 帳號 | 密碼 | 角色 |
|------|------|------|
| `admin@nocobase.com` | `admin123` | Admin（管理員）|
| `member@test.com` | `member123` | 一般用戶（受權限限制）|

登入後請至「使用者管理」建立實際帳號。

---

## 常見問題

**Q：更新插件後瀏覽器還是舊版？**  
A：執行 `./patch-nginx-cache.sh` 確認 no-cache 設定，再強制重整（Cmd+Shift+R）。

**Q：Git 同步失敗顯示 `401 Unauthorized`？**  
A：Token 已過期或 Scope 不足，重新到 GitLab 產生新 Token 並更新 `.env`。

**Q：GitLab Webhook Test 顯示 `Connection refused`？**  
A：確認 NocoBase 服務的 port 13000 對 GitLab 所在網段可連通，或調整防火牆規則。

**Q：`docker-compose down -v` 後資料不見了？**  
A：`-v` 會刪除所有 volumes 包含資料庫！正式環境只能用 `docker-compose restart app`。
