# @nocobase/plugin-doc-hub

NocoBase 文件庫管理插件，支援 Git 同步、版本歷史、專案分類與權限隔離。

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
├── patch-nginx-cache.sh  ← nginx cache patch 腳本
└── storage/
    ├── db/postgres/      ← 資料庫資料（不進 git）
    ├── uploads/          ← 上傳檔案
    └── plugins/
        └── @nocobase/
            └── plugin-doc-hub/   ← 本插件（獨立 git repo）
```

---

## 首次部署

### 1. 建立工作目錄

```bash
mkdir /opt/nocobase && cd /opt/nocobase
```

### 2. 複製設定檔

把 `docker-compose.yml` 和 `patch-nginx-cache.sh` 放到此目錄。

### 3. Clone 插件

```bash
mkdir -p storage/plugins/@nocobase
git clone https://github.com/yanchen184/nocobase-plugin-doc-hub \
  storage/plugins/@nocobase/plugin-doc-hub
```

### 4. 建立 .env

```bash
cp .env.example .env
```

編輯 `.env`，填入必要的值（見下方說明）。

### 5. 啟動

```bash
docker-compose up -d
```

第一次啟動較慢（需解壓 LibreOffice），約需 3-5 分鐘。

### 6. Patch nginx cache（首次 + 每次 force-recreate 後）

等容器完全啟動後執行：

```bash
chmod +x patch-nginx-cache.sh
./patch-nginx-cache.sh
```

確認成功：

```bash
curl -sI "http://localhost:13000/static/plugins/@nocobase/plugin-doc-hub/dist/client/index.js" | grep Cache-Control
# 應顯示：Cache-Control: no-store, no-cache, must-revalidate
```

---

## 環境變數說明（.env）

| 變數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| `APP_KEY` | ✅ | JWT 簽名金鑰，務必改成隨機字串 | `openssl rand -hex 32` |
| `DB_PASSWORD` | ✅ | PostgreSQL 密碼 | `your-strong-password` |
| `DOCHUB_GITLAB_HOST` | 使用 GitLab 才需要 | GitLab 主機 IP/domain | `10.1.2.191` |
| `DOCHUB_GITLAB_TOKEN` | 使用 GitLab 才需要 | GitLab Personal Access Token（需 `read_repository` + `write_repository` 權限） | `glpat-xxxx` |
| `DOCHUB_GITHUB_TOKEN` | 使用 GitHub 才需要 | GitHub Personal Access Token（需 `repo` 權限） | `ghp_xxxx` |

### .env 範本

```env
APP_KEY=your-random-secret-key-change-me
DB_PASSWORD=your-db-password

# GitLab（公司內部）
DOCHUB_GITLAB_HOST=10.1.2.191
DOCHUB_GITLAB_TOKEN=glpat-your-token-here

# GitHub（選填）
DOCHUB_GITHUB_TOKEN=
```

> **注意**：`.env` 含機敏資訊，不要 commit 進 git。

---

## 日常維運

### 更新插件

```bash
cd storage/plugins/@nocobase/plugin-doc-hub
git pull
cd ../../..
docker-compose restart app
# 使用者不需要任何操作，瀏覽器自動載入新版
```

### 重啟服務

```bash
docker-compose restart app   # 只重啟 app（保留資料）
```

### 查看 log

```bash
docker-compose logs app -f --tail=50
```

### 備份資料庫

```bash
docker exec nocobase-postgres-1 pg_dump -U nocobase nocobase > backup-$(date +%Y%m%d).sql
```

---

## 注意事項

- `docker-compose down -v` 會刪除所有資料，**禁止**在正式環境執行
- `docker-compose restart app` 不重建容器，資料安全
- `docker-compose up -d --force-recreate` 重建容器後需重跑 `patch-nginx-cache.sh`
- NocoBase 的表單、欄位、權限設定全部存在 DB，換機器部署需備份還原 DB

---

## GitLab Webhook 設定（自動同步 Git → DocHub）

1. 進入 GitLab 專案 → Settings → Webhooks
2. URL：`http://your-server:13000/api/docDocuments:webhookReceive`
3. Trigger：勾選 **Push events**
4. 不需要 Secret Token（內部網路環境）
5. 點 Add webhook

---

## 帳號

| 帳號 | 密碼 | 角色 |
|------|------|------|
| `nocobase` | 見 .env APP_KEY 設定後登入 | Admin |

首次登入後請至「使用者管理」建立其他帳號並設定角色。
