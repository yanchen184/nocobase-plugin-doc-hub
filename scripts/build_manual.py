#!/usr/bin/env python3
"""build_manual.py — 把截圖嵌入 HTML 手冊，每次產生新檔案保留歷史"""
import base64
from pathlib import Path
from datetime import datetime

SHOT_DIR  = Path(__file__).parent.parent / 'e2e/artifacts/screenshots'
OUT_DIR   = Path(__file__).parent.parent / 'docs/manuals'
OUT_DIR.mkdir(parents=True, exist_ok=True)

timestamp = datetime.now().strftime('%Y-%m-%d_%H%M')
OUTPUT    = OUT_DIR / f'manual-{timestamp}.html'

def img(png_name: str, caption: str) -> str:
    p = SHOT_DIR / png_name
    if not p.exists():
        return f'<p class="no-img">（截圖 {png_name} 不存在）</p>'
    b64 = base64.b64encode(p.read_bytes()).decode()
    return f'''<figure>
      <img src="data:image/png;base64,{b64}" alt="{caption}">
      <figcaption>{caption}</figcaption>
    </figure>'''

chapters = [
    ('第一章　文件列表', f'''
<p>DocHub 主畫面以表格呈現所有文件，支援即時搜尋、排序與多種操作。每份文件有兩種狀態：<strong>草稿</strong>（橘色）與<strong>已發布</strong>（綠色）。</p>
{img("01_列表頁.png", "1-1  文件列表主畫面")}
{img("01b_列表頁_全頁.png", "1-2  列表完整全頁（含底部分頁資訊）")}
{img("02_列表搜尋.png", "1-3  搜尋輸入中")}
{img("02_列表搜尋結果.png", "1-4  搜尋結果過濾後")}
{img("01c_列表頁_草稿vs已發布.png", "1-5  狀態欄：橘色「草稿」與綠色「已發布」同時顯示")}
{img("18_列表頁_全頁.png", "1-6  列表全頁（含 Git 同步欄位）")}
'''),

    ('第二章　新增文件', f'''
<p>在側邊欄選取資料夾後，點選右上角「+ 新增文件」按鈕開啟 Modal，提供三種建立方式：</p>
<ul>
  <li><strong>自由撰寫</strong>：直接進入 Markdown 編輯頁，從空白開始撰寫。</li>
  <li><strong>使用範本</strong>：從預先建立的表單範本建立，填寫欄位後自動產生結構化文件。</li>
  <li><strong>Git 同步</strong>：填入 GitHub/GitLab 倉庫資訊，從遠端 .md 檔匯入並同步內容。</li>
</ul>
{img("02a_新增Modal_三種方式.png", "2-1  新增文件對話框（三種建立方式選擇）")}
{img("02b_新增文件_自由撰寫_空白編輯頁.png", "2-2  自由撰寫：點選後直接進入空白 Markdown 編輯頁")}
{img("02c_新增文件_使用範本_選範本.png", "2-3  使用範本：選擇要套用的範本")}
{img("02d_新增文件_Git同步_填倉庫資訊.png", "2-4  Git 同步：填入倉庫路徑與分支資訊")}
'''),

    ('第三章　編輯頁', f'''
<p>DocHub 提供 Markdown 編輯器，支援即時預覽、自動儲存（3 秒防抖）、Cmd+S 手動儲存與 Cmd+K 跳轉命令列。若文件來自 Git 倉庫，編輯頁頂部會顯示 Git 資訊列，可隨時拉取最新內容。</p>
{img("04_編輯頁.png", "3-1  編輯頁介面（Markdown 左、即時預覽右）")}
{img("04b_編輯頁_dirty狀態.png", "3-2  有未儲存變更時標題列顯示提示")}
{img("03b_編輯頁_Git資訊列_放大.png", "3-3  Git 資訊列：顯示來源倉庫路徑、分支，可點「拉取最新」同步")}
'''),

    ('第四章　閱讀頁', f'''
<p>閱讀頁將 Markdown 渲染為 HTML，滾動時頂部顯示藍色閱讀進度條。右上角提供「版本歷史」、「列印（匯出 PDF）」、「編輯」三個操作按鈕；右側自動產生文件目錄（TOC）。</p>
{img("05_閱讀頁.png", "4-1  閱讀頁主畫面（含 TOC 目錄）")}
{img("05b_閱讀頁_進度條.png", "4-2  滾動後頂部顯示藍色閱讀進度條")}
{img("05c_閱讀頁_底部.png", "4-3  閱讀頁內容區（版本歷史、列印、編輯按鈕在右上角）")}
'''),

    ('第五章　版本歷史與 Diff 比較', f'''
<p>每次儲存自動建立版本快照，版本歷史頁面可選擇任意兩版比較差異，以<strong style="color:#ef4444">紅底（刪除）</strong>/<strong style="color:#22c55e">綠底（新增）</strong>行內高亮顯示。</p>
{img("06_版本歷史.png", "5-1  版本歷史列表（v1、v2 快照，顯示 +7行 -0行 徽章）")}
{img("06b_版本歷史_Diff紅綠高亮.png", "5-2  v1→v2 Diff 比較：紅底為刪除行、綠底為新增行")}
'''),

    ('第六章　操作欄功能', f'''
<p>列表每行右側的「…」操作欄展開後提供：鎖定/解鎖、移動、刪除、Git 同步等操作。</p>
{img("07_操作欄Dropdown.png", "6-1  操作欄展開選單（鎖定、移動、刪除、Git 同步）")}
{img("07b_鎖定確認Modal.png", "6-2  鎖定確認對話框（輸入備註說明鎖定原因）")}
{img("10_移動文件Modal.png", "6-3  移動文件：選擇目標專案與目標資料夾後確認")}
'''),

    ('第七章　文件鎖定', f'''
<p>鎖定後文件進入唯讀模式，列表顯示鎖定圖示，閱讀頁顯示「已鎖定」橫幅。只有鎖定人可解鎖。</p>
{img("08_鎖定文件閱讀頁.png", "7-1  已鎖定文件的閱讀頁")}
{img("09_列表含鎖定標示.png", "7-2  列表中鎖定狀態圖示")}
'''),

    ('第八章　稽核日誌', f'''
<p>所有文件操作（建立、編輯、鎖定、解鎖、刪除、移動）均記錄稽核日誌，可依時間範圍與操作類型篩選。</p>
{img("11_稽核日誌.png", "8-1  稽核日誌頁面（操作記錄列表）")}
'''),

    ('第九章　範本管理', f'''
<p>DocHub 提供視覺化範本建構器，可定義表單欄位（文字、下拉、多行文字等），範本以 <code>TEMPLATE_FORM_V1</code> 格式存在文件 content 中。</p>
{img("12_範本管理頁.png", "9-1  範本管理列表頁")}
{img("13_範本建構器Modal.png", "9-2  範本建構器 Modal（視覺模式）")}
{img("13b_範本建構器JSON視圖.png", "9-3  範本建構器 JSON 原始視圖")}
'''),

    ('第十章　填寫範本', f'''
<p>從範本建立文件時，進入填寫範本頁；系統根據範本欄位定義產生表單，填寫完成後自動生成 Markdown 內容。</p>
{img("14_填寫範本頁.png", "10-1  填寫範本頁（根據範本欄位產生的表單）")}
'''),

    ('第十一章　專案與資料夾權限', f'''
<p>每個專案可設定讀取、編輯、訂閱的成員清單；資料夾支援繼承專案權限或自訂覆蓋。</p>
{img("15_專案權限Modal.png", "11-1  專案權限設定對話框（建立專案畫面）")}
{img("15b_資料夾權限Modal_繼承模式.png", "11-2  資料夾權限（繼承模式）")}
{img("15c_資料夾權限Modal_自訂模式.png", "11-3  資料夾權限（自訂模式）")}
'''),

    ('第十二章　側邊欄與最近查看', f'''
<p>左側邊欄顯示專案樹狀結構與最近查看文件，可快速跳轉到常用頁面。</p>
{img("17_側邊欄.png", "12-1  左側邊欄（專案樹）")}
{img("17_最近查看_Sidebar底部.png", "12-2  側邊欄底部顯示最近查看文件")}
{img("19_首頁_全部文件.png", "12-3  首頁全部文件視圖")}
{img("19b_首頁_全頁.png", "12-4  首頁全頁截圖")}
'''),

    ('第十三章　Git 雙向同步 — 手動拉取', f'''
<p>DocHub 支援 GitLab / GitHub 雙向同步。設定好倉庫路徑後，可在文件頁面手動觸發「從 Git 拉取」，將倉庫的 README 或指定路徑內容同步到 DocHub 文件。</p>

<h3>13.1 拉取前狀態</h3>
{img("git_01_編輯頁_拉取前.png", "13-1  編輯頁（GitLab 倉庫設定完成，尚未同步）")}
{img("git_02_Git資訊列_拉取前.png", "13-2  底部 Git 資訊列（顯示倉庫路徑，同步時間：從未）")}

<h3>13.2 執行拉取</h3>
{img("git_03_拉取成功_訊息.png", "13-3  拉取成功通知（右上角 Toast）")}

<h3>13.3 拉取後結果</h3>
{img("git_04_編輯頁_拉取後內容.png", "13-4  編輯頁拉取後內容（顯示 GitLab README 內容）")}
{img("git_05_閱讀頁_GitLab內容.png", "13-5  閱讀頁呈現 GitLab 倉庫內容")}
'''),

    ('第十四章　Git 雙向同步 — 推送到 Git', f'''
<p>在 DocHub 編輯文件後，可透過操作欄「同步到 Git」將修改推送回 GitLab / GitHub，自動產生 commit 記錄。</p>
{img("git_06_編輯頁_編輯後準備推送.png", "14-1  DocHub 中編輯文件（準備推送到 GitLab）")}
{img("git_07_列表頁_Git同步欄.png", "14-2  列表頁 Git 同步欄位")}
{img("git_07_操作欄_同步Git選項.png", "14-3  操作欄「同步到 Git」選項")}
{img("git_08_同步確認Modal.png", "14-4  同步確認 Modal（顯示目標倉庫與 commit 訊息）")}
'''),

    ('第十五章　Git 雙向同步 — Webhook 自動同步', f'''
<p>設定 GitLab Webhook（推送到 <code>http://your-server:13000/api/docDocuments:webhookGitPull</code>），每次 Git push 後 DocHub 自動拉取最新內容，版本歷史自動記錄同步事件。</p>

<h3>15.1 Webhook 觸發後</h3>
{img("git_10_Webhook自動同步後閱讀頁.png", "15-1  Webhook 觸發自動同步後的閱讀頁")}
{img("git_11_列表頁_Synced狀態.png", "15-2  自動同步後列表 Git 狀態更新為 synced")}

<h3>15.2 版本歷史含 Git 同步記錄</h3>
{img("git_12_版本歷史_含Git同步記錄.png", "15-3  版本歷史頁面顯示 Git 自動同步的版本記錄")}
'''),

    ('第十六章　多帳號權限隔離驗證', f'''
<p>DocHub 的存取控制以「專案」為基本單位。管理員設定專案的 viewer / editor / subscriber 清單後，只有被授權的帳號才能看到該專案下的文件；未授權帳號即使知道文件 ID 也無法直接存取。</p>

<h3>16.1 權限設定流程</h3>
<ol>
  <li>管理員在專案設定中，指定哪些用戶可以「讀取」、「編輯」或「訂閱」</li>
  <li>被加入 viewer 的用戶登入後，在文件列表只會看到自己有權限的文件</li>
  <li>沒有被加入的用戶，文件列表完全隱藏該文件，直接存取也會回傳 403</li>
</ol>

<h3>16.2 E2E 驗證結果（12-permission-isolation.spec.ts）</h3>
<ul>
  <li>✅ memberA（有 viewer 權限）可以看到受限文件</li>
  <li>✅ memberB（無任何權限）看不到受限文件</li>
  <li>✅ admin 可以看到所有文件（不受權限隔離影響）</li>
  <li>✅ memberB 直接用 ID 存取文件，回傳 403 或空資料</li>
</ul>

<h3>16.3 資料夾層級繼承</h3>
{img("15b_資料夾權限Modal_繼承模式.png", "16-1  資料夾繼承專案權限（預設模式）")}
{img("15c_資料夾權限Modal_自訂模式.png", "16-2  資料夾自訂權限（override 模式）")}
'''),

    ('第十七章　訂閱者站內信通知驗證', f'''
<p>當文件被更新時，DocHub 自動通知所有訂閱者（文件層 + 專案層訂閱者合併）。通知以站內信形式即時送達，同時透過 WebSocket 推播給線上用戶。</p>

<h3>17.1 通知觸發條件</h3>
<ul>
  <li>文件 <code>content</code> 欄位有變更才觸發（純 metadata 更新不觸發）</li>
  <li>編輯者自己不會收到自己更新的通知（排除自己）</li>
  <li>文件層訂閱者 ＋ 專案層訂閱者合併去重後統一通知</li>
</ul>

<h3>17.2 通知內容格式</h3>
<ul>
  <li><strong>標題</strong>：<code>文件更新：【資料夾名稱】文件標題</code></li>
  <li><strong>內容</strong>：<code>編輯者名稱 更新了文件【資料夾】《文件標題》（更新摘要）</code></li>
  <li><strong>Channel</strong>：<code>doc-hub</code></li>
</ul>

<h3>17.3 通知 Bell 與通知面板</h3>
{img("17_通知Bell_有角標.png", "17-1  右上角通知 Bell（有未讀角標）")}
{img("17b_通知面板_開啟.png", "17-2  點開通知 Bell 後的通知面板")}
{img("17c_通知項目_DocHub.png", "17-3  通知列表中的 DocHub 通知項目")}

<h3>17.4 訂閱者設定（專案權限 Modal）</h3>
<p>在列表頁選取專案後，點右上角「🔐 權限」按鈕，即可在 Modal 中設定閱覽者、編輯者、以及接收通知的 <strong>訂閱者</strong>。</p>
{img("17d_專案權限Modal_訂閱者設定.png", "17-4  專案權限設定 Modal — 訂閱者欄位")}

<h3>17.5 E2E 驗證結果（13-notification.spec.ts）</h3>
<ul>
  <li>✅ admin 更新文件後，訂閱者 memberA 收到未讀通知</li>
  <li>✅ 通知標題包含文件標題與「文件更新」字樣</li>
  <li>✅ admin 更新自己的文件時，不會收到自己的通知</li>
  <li>✅ 未訂閱的用戶不會收到通知</li>
</ul>

<h3>17.6 查詢自己的通知</h3>
<p>使用 API 端點 <code>GET /api/docDocuments:myNotifications</code>（需登入），回傳當前用戶在 <code>doc-hub</code> channel 的所有通知，依時間倒序排列。</p>
'''),

    ('附錄　常見問題 (FAQ)', f'''
<h3>Q1: Git 拉取失敗，顯示「GitHub Token 未設定」</h3>
<p>若倉庫路徑未包含 GitLab 主機 IP（如 <code>10.1.2.191/wezoomtek/repo</code>），系統會嘗試使用 GitHub Token。請確認環境變數已設定：</p>
<ul>
  <li>GitLab：<code>DOCHUB_GITLAB_HOST=10.1.2.191</code>、<code>DOCHUB_GITLAB_TOKEN=your_token</code></li>
  <li>GitHub（選填）：<code>DOCHUB_GITHUB_TOKEN=your_token</code></li>
</ul>

<h3>Q2: Webhook 自動同步的 URL 怎麼填？</h3>
<p>DocHub 以 Docker 運行時，Webhook URL 填寫：<code>http://[DocHub伺服器IP]:13000/api/docDocuments:webhookGitPull</code>。
GitLab 在同一內網時，可直接填寫內網 IP；若 DocHub 在公網，填寫公網 IP 或 Domain。</p>

<h3>Q3: 如何建立有意義的版本歷史？</h3>
<p>每次儲存都會自動建立版本快照。若要在版本歷史頁面看到 Diff，文件需有至少兩個版本（即至少儲存過兩次）。版本歷史支援選取任意兩版比較差異。</p>

<h3>Q4: 範本和文件類型（docTypes）有什麼關係？</h3>
<p>docTypes 定義文件的分類（如 API 文件、設計文件），可以關聯一個範本；建立該類型文件時自動套用對應範本。範本本身存在 docTemplates collection 中，以 <code>TEMPLATE_FORM_V1</code> JSON 格式描述欄位定義。</p>

<h3>Q5: 資料夾權限與專案權限的優先順序？</h3>
<p>預設資料夾繼承專案權限。若在資料夾層切換為「自訂模式」，則以資料夾的權限設定為準，覆蓋專案預設。</p>
'''),
]

toc_items = ''.join(f'<li><a href="#ch{i+1}">{title}</a></li>' for i, (title, _) in enumerate(chapters))
body_content = ''.join(f'<section id="ch{i+1}"><h2>{title}</h2>{content}</section>\n' for i, (title, content) in enumerate(chapters))

html = f'''<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DocHub 操作手冊 {timestamp}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
    background: #f5f5f5;
    color: #333;
    line-height: 1.7;
  }}
  .sidebar {{
    position: fixed;
    top: 0; left: 0;
    width: 260px; height: 100vh;
    background: #1a1a2e;
    color: #ccc;
    overflow-y: auto;
    padding: 24px 0;
    z-index: 100;
  }}
  .sidebar h1 {{
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    padding: 0 20px 16px;
    border-bottom: 1px solid #333;
    margin-bottom: 16px;
  }}
  .sidebar ul {{ list-style: none; }}
  .sidebar li a {{
    display: block;
    padding: 8px 20px;
    color: #aaa;
    text-decoration: none;
    font-size: 0.85rem;
    transition: background 0.15s, color 0.15s;
  }}
  .sidebar li a:hover {{
    background: #2d2d4e;
    color: #fff;
  }}
  .main {{
    margin-left: 260px;
    max-width: 900px;
    padding: 40px 48px 80px;
  }}
  .cover {{
    text-align: center;
    padding: 60px 0 48px;
    margin-bottom: 48px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
    border-radius: 12px;
  }}
  .cover h1 {{ font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; }}
  .cover .sub {{ font-size: 1rem; color: #aaa; }}
  .cover .version {{
    display: inline-block;
    margin-top: 20px;
    padding: 4px 16px;
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
    font-size: 0.85rem;
  }}
  section {{
    background: #fff;
    border-radius: 8px;
    padding: 32px 40px;
    margin-bottom: 32px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }}
  section h2 {{
    font-size: 1.4rem;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #eee;
  }}
  section h3 {{
    font-size: 1.05rem;
    font-weight: 600;
    color: #444;
    margin: 24px 0 12px;
  }}
  section p {{ margin-bottom: 16px; color: #555; }}
  section ul {{ margin: 8px 0 16px 20px; color: #555; }}
  section li {{ margin-bottom: 6px; }}
  code {{
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.85em;
  }}
  figure {{ margin: 20px 0; text-align: center; }}
  figure img {{
    max-width: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }}
  figcaption {{ margin-top: 8px; color: #888; font-size: 0.85rem; }}
  .no-img {{
    padding: 20px;
    background: #fff3cd;
    border-radius: 6px;
    color: #856404;
    font-size: 0.9rem;
    text-align: center;
  }}
  @media (max-width: 768px) {{
    .sidebar {{ display: none; }}
    .main {{ margin-left: 0; padding: 20px; }}
  }}
</style>
</head>
<body>
<nav class="sidebar">
  <h1>DocHub 操作手冊</h1>
  <ul>{toc_items}</ul>
</nav>
<div class="main">
  <div class="cover">
    <h1>DocHub 操作手冊</h1>
    <div class="sub">WezoomTek 文件協作平台</div>
    <div class="version">產生時間：{timestamp}</div>
  </div>
  {body_content}
</div>
</body>
</html>'''

OUTPUT.write_text(html, encoding='utf-8')
size_kb = OUTPUT.stat().st_size // 1024
img_count = html.count('data:image/png;base64,')
print(f'✅ 輸出：{OUTPUT}')
print(f'   大小：{size_kb} KB　｜　截圖：{img_count} 張')

# 列出所有歷史版本
versions = sorted(OUT_DIR.glob('manual-*.html'))
print(f'\n📚 docs/manuals/ 目前共 {len(versions)} 個版本：')
for v in versions:
    kb = v.stat().st_size // 1024
    print(f'   {v.name}  ({kb} KB)')
