#!/usr/bin/env python3
"""
build_story_manual.py — 產出 DocHub 故事性操作手冊（單檔 HTML）

讀取：artifacts/manual-shots/story/ch{1..8}_*.png
輸出：story_manual.html（單檔，所有截圖 base64 內嵌）

執行：
  cd e2e
  python3 tools/build_story_manual.py
"""
from __future__ import annotations

import base64
from pathlib import Path
from typing import NamedTuple

ROOT = Path(__file__).resolve().parent.parent  # e2e/
PLUGIN_ROOT = ROOT.parent  # plugin-doc-hub/
SHOT_DIR = ROOT / "artifacts" / "manual-shots" / "story"
OUTPUT = PLUGIN_ROOT / "story_manual.html"


class Shot(NamedTuple):
    filename: str
    caption: str


class Chapter(NamedTuple):
    no: int
    title: str
    intro: str
    shots: list[Shot]


CHAPTERS: list[Chapter] = [
    Chapter(
        1,
        "從零建立示範專案",
        "從文件庫首頁開始：建立一個全新的「[STORY] 示範專案」，"
        "DocHub 自動產生 8 個預設資料夾（01_提案與規劃 → 99_記錄），讓團隊不用再重複佈線。"
        "左側 Sidebar 採三層組織樹：🏠 總覽 → 🗂 群組（如「專案」「制度規定」「共用知識庫」）→ 📁 專案 → 📑 資料夾，"
        "每一層 Admin 都可以就地新增（hover 群組會出現 +）。",
        [
            Shot(
                "ch1_01_首頁全部文件.png",
                "文件庫首頁 — 左側 Sidebar 顯示三大群組（🗂 專案 / 🗂 制度規定 / 🗂 共用知識庫），"
                "中間「總覽」呈現所有可見文件清單（含標籤 / 狀態 / 最後更新者），右上角是 ❓ 與使用者選單",
            ),
            Shot(
                "ch1_03_側邊欄顯示新專案.png",
                "建立完成 — 左側組織樹立刻出現「[STORY] 示範專案」於「🗂 專案」群組第一項，"
                "Sidebar 每個群組可摺疊（左側 ❯ chevron）、專案右側 + 號用於新增資料夾、"
                "右側標題列右上角的鈴鐺 🔔 即時亮起新通知 badge。"
                "共用知識庫的文件（如 ISO 27001 / OWASP / Kubernetes 等 7 份）已自動列在「主題」分類中",
            ),
            Shot(
                "ch1_04_專案頁_六個預設資料夾.png",
                "進入專案 — 自動建好 8 個預設資料夾（01_提案與規劃 ~ 99_記錄），左側 Sidebar 同步展開 📁 樹枝，"
                "中間是該專案的文件清單，頂部 Tabs 是各資料夾切換",
            ),
            Shot(
                "ch1_04b_專案頁_全頁.png",
                "全頁總覽 — Sidebar（左 280px sticky）+ 主內容（資料夾 Tabs / 標籤雲 / 文件清單 / 分頁），"
                "整個版面採深色側欄 + 淺色內容區的對比設計",
            ),
            Shot(
                "ch1_04c_sidebar_資料夾展開.png",
                "Sidebar 展開驗證 — 點「[STORY] 示範專案」左側 ❯ 展開後，看到 8 個預設資料夾依序排列："
                "01_提案與規劃 → 02_需求 → 03_設計 → 04_測試 → 05_部署與上線 → 06_驗收 → 07_結案 → 99_記錄，"
                "編號小的在上、99_記錄沉在最底，跟頁面 Tab 順序完全一致",
            ),
            Shot(
                "ch1_04d_共用知識庫_預設資料夾.png",
                "共用知識庫底下的專案（如「01_技術領域」）採自由分類，不套 SDLC — "
                "只有「專案」群組才需要 01~07 + 99 結構，知識庫由使用者依主題自行管理；"
                "Sidebar 內的 7 個專案按 01 → 07 編號自然排序。",
            ),
        ],
    ),
    Chapter(
        2,
        "四種建立文件方式",
        "進到資料夾，點「+ 新增文件」會跳出四種方式：自由撰寫、使用範本、從檔案匯入、Git 同步。"
        "DocHub 在這四條入口都用同一張卡片式 Modal 統一體驗。",
        [
            Shot("ch2_01_新增方式選擇Modal.png", "點「新增文件」彈出選擇 Modal"),
            Shot("ch2_02b_四種方式Modal.png", "四種卡片：自由撰寫 / 使用範本 / 從檔案匯入 / Git 同步"),
            Shot("ch2_02a_自由撰寫_編輯頁.png", "自由撰寫 — Markdown 編輯頁 + 預覽分割"),
            Shot("ch2_02b2_從檔案匯入_上傳介面.png", "從檔案匯入 — 拖曳 .md/.docx 上傳"),
            Shot("ch2_02c_Git同步_填倉庫資訊.png", "Git 同步 — 填入 GitHub/GitLab 倉庫資訊"),
        ],
    ),
    Chapter(
        3,
        "範本系統 — 從零寫一個範本",
        "為了讓「[STORY] 上版單」這類重複表單能標準化，"
        "DocHub 提供範本管理頁，可視覺化拖拉建構欄位（text / textarea / select / date / multiselect / user），"
        "也支援 JSON 模式直接編輯。",
        [
            Shot("ch3_01_範本管理頁.png", "進入範本管理頁，看見既有範本"),
            Shot("ch3_02_範本Builder_空白.png", "點「建立範本」打開 Builder Modal"),
            Shot(
                "ch3_03_範本Builder_視覺模式_已填四欄位.png",
                "視覺模式：已加入 4 個欄位（版本號 / 變更內容 / 影響範圍 / 上版時間）",
            ),
            Shot("ch3_04_範本Builder_JSON模式.png", "切換到 JSON 模式 — 開發者也能直接編輯"),
            Shot("ch3_05_範本管理頁_看見新範本.png", "儲存後，範本管理頁立刻看見「[STORY] 上版單」"),
        ],
    ),
    Chapter(
        4,
        "使用剛建好的範本建立文件",
        "回到資料夾，點「+ 新增文件」→ 選「使用範本」→ 選剛剛建好的範本，"
        "DocHub 把欄位轉成填寫表單；填完即儲存成一份 view 模式呈現的結構化文件。",
        [
            Shot("ch4_01_四種方式Modal_準備選範本.png", "新增文件 Modal，準備點「使用範本」"),
            Shot("ch4_02_範本選擇Modal.png", "範本選擇 Modal，看見「[STORY] 上版單」卡片"),
            Shot("ch4_03_範本填寫頁_空白表單.png", "範本填寫頁 — 空白表單"),
            Shot("ch4_04_範本填寫頁_已填內容.png", "填入 v1.2.3、變更內容、影響範圍、上版時間"),
            Shot(
                "ch4_05_範本文件_view頁_TemplateFormViewer.png",
                "儲存後 view 頁：TemplateFormViewer 把欄位優雅排版",
            ),
        ],
    ),
    Chapter(
        5,
        "Diff 能耐 — 編輯前後一目了然",
        "DocHub 自動為每次儲存記下一版，左側列出所有版本，"
        "右側用 GitHub 風格的 Diff（綠 + / 紅 -）呈現相鄰版本之間的差異。",
        [
            Shot("ch5_01_view頁_版本歷史按鈕.png", "閱讀頁右上角「版本歷史」按鈕"),
            Shot("ch5_02_版本列表_三個版本.png", "進入版本歷史頁 — 三個版本依序排列"),
            Shot(
                "ch5_03_v2對比v1_diff展現.png",
                "▶ 點 v2：右側顯示 v2 vs v1 的 diff（+4 行 / −2 行，紅綠並列）— Diff 能耐的核心展示",
            ),
            Shot("ch5_05_v1初始版本_全部新增.png", "點 v1：初始版本（+15 行 全綠 — 沒有更早版本可比，全部視為新增）"),
        ],
    ),
    Chapter(
        6,
        "Git 雙向同步閉環",
        "把文件綁到 GitLab repo 後，DocHub ↔ Git 變成雙向：A 方向「DocHub → Git」按一鍵推送 commit，"
        "B 方向「Git → DocHub」靠 webhook，IDE 推 commit 後 DocHub 自動更新。"
        "兩個方向都會通知該文件的訂閱者。",
        [
            Shot("ch2_02b_四種方式Modal.png", "起點：新增文件 Modal 第 4 張卡片「Git 同步」"),
            Shot("ch2_02c_Git同步_填倉庫資訊.png", "填入 GitLab 倉庫 / 路徑 / 分支"),
            Shot(
                "ch6_03_編輯頁_GitLab狀態列已綁定.png",
                "編輯頁頂部顯示綠色狀態列：已綁定 GitLab 檔案",
            ),
            Shot(
                "ch6_05_admin列表頁_GitLab綁定資訊.png",
                "資料夾頁頂部顯示 GitLab repo 連結（10.1.2.191/wezoomtek/wez-spring-boot-starters） — 證明整個資料夾已雙向綁定 Git",
            ),
            Shot(
                "ch6_06_訂閱者通知_DocHub到GitLab.png",
                "▶ 方向 A：訂閱者首頁右上角鈴鐺出現紅色 77 — DocHub→Git 同步觸發站內通知",
            ),
            Shot(
                "ch6_07_閱讀頁_GitLab推送自動同步.png",
                "▶ 方向 B：在 GitLab 直接推 commit，DocHub 自動更新（webhook 觸發）",
            ),
            Shot(
                "ch6_08_訂閱者通知_GitLab到DocHub.png",
                "鈴鐺從 77 跳到 78 — Git→DocHub 同步又觸發一則通知",
            ),
        ],
    ),
    Chapter(
        7,
        "三種角色驗證 — 每個人只能做該做的事",
        "DocHub 在「專案層」就把權限切好：Viewer 只看不改、Editor 可編輯、Subscriber 收通知、外人完全看不到。"
        "下面四張截圖用同一份文件、不同身份登入，工具列差異一目了然。",
        [
            Shot(
                "ch7_01_viewer_閱讀頁_只能看.png",
                "👤 Viewer：能看內容，但右上角只有「版本歷史 / 列印」（沒有編輯）",
            ),
            Shot(
                "ch7_02_editor_閱讀頁_有編輯按鈕.png",
                "✏️ Editor：右上角多出綠色「編輯」按鈕",
            ),
            Shot("ch7_03_editor_編輯頁_能改內容.png", "Editor 進入編輯頁，能修改任何欄位"),
            Shot(
                "ch7_04_subscriber_閱讀頁_訂閱標誌.png",
                "📬 Subscriber：閱讀頁與 viewer 相同（無編輯鈕），但會在背景自動收通知（鈴鐺 badge 詳見 Ch8）",
            ),
            Shot(
                "ch7_05_outsider_無權限_看不到.png",
                "🚫 Outsider：彈出「沒有權限查看此文件」+ 空白頁",
            ),
        ],
    ),
    Chapter(
        8,
        "訂閱者體驗 — 訂閱、累積未讀、進入文件",
        "每當文件被更新（自由編輯 / 範本填寫 / Git 同步），DocHub 都會自動發站內信給訂閱者，"
        "右上角鈴鐺 badge 即時遞增。Subscriber 進入文件時只能讀，不會看到編輯按鈕。",
        [
            Shot(
                "ch8_01_subscriber首頁_鈴鐺紅badge.png",
                "登入後首頁右上角鈴鐺顯示紅色 badge（80 則未讀）",
            ),
            Shot(
                "ch8_02_通知清單彈出.png",
                "點鈴鐺彈出 Drawer：左側未讀清單、右側完整訊息（標題 / 內容 / 時間）",
            ),
            Shot(
                "ch8_03_點通知跳到文件.png",
                "Subscriber 首頁 — 鈴鐺 hover 顯示「Message」tooltip，紅色 80 badge 提示新通知",
            ),
            Shot(
                "ch8_04_subscriber_閱讀頁_完整體驗.png",
                "進入文件閱讀頁 — Subscriber 看見內容、無編輯權限、頂端鈴鐺仍保留 80 通知 badge（完整訂閱動線）",
            ),
        ],
    ),
]


# ───────────────────────────────────────────────────────────────
#  HTML 產生
# ───────────────────────────────────────────────────────────────
def img_b64(path: Path) -> str:
    if not path.exists():
        return ""
    return base64.b64encode(path.read_bytes()).decode("ascii")


def chapter_html(ch: Chapter) -> str:
    parts = [
        f'<section id="ch{ch.no}">',
        f"  <h2>第 {ch.no} 章　{ch.title}</h2>",
        f'  <p class="intro">{ch.intro}</p>',
    ]
    for shot in ch.shots:
        b64 = img_b64(SHOT_DIR / shot.filename)
        if not b64:
            parts.append(
                f'  <p class="missing">（缺截圖：{shot.filename}）</p>'
            )
            continue
        parts.append("  <figure>")
        parts.append(
            f'    <img src="data:image/png;base64,{b64}" alt="{shot.caption}">'
        )
        parts.append(f"    <figcaption>{shot.caption}</figcaption>")
        parts.append("  </figure>")
    parts.append("</section>")
    return "\n".join(parts)


def sidebar_html() -> str:
    items = "\n".join(
        f'  <li><a href="#ch{c.no}"><span class="num">{c.no}</span> {c.title}</a></li>'
        for c in CHAPTERS
    )
    return f"""<nav id="sidebar">
  <h1>📘 DocHub 操作手冊</h1>
  <p class="subtitle">故事性導覽 · 8 章 · {sum(len(c.shots) for c in CHAPTERS)} 張截圖</p>
  <ul>
{items}
  </ul>
</nav>"""


CSS = """
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Helvetica Neue', sans-serif;
  background: #f7f8fa;
  color: #1a1f26;
  line-height: 1.65;
}
.layout { display: flex; min-height: 100vh; }
#sidebar {
  position: sticky; top: 0; align-self: flex-start;
  width: 280px; height: 100vh; overflow-y: auto;
  background: #1a1f26; color: #d1d8e0;
  padding: 24px 20px;
  border-right: 1px solid #2a313a;
}
#sidebar h1 { margin: 0 0 4px; font-size: 20px; color: #fff; }
#sidebar .subtitle { margin: 0 0 24px; font-size: 12px; color: #8b95a3; }
#sidebar ul { list-style: none; padding: 0; margin: 0; }
#sidebar li { margin: 0; }
#sidebar a {
  display: flex; align-items: baseline; gap: 8px;
  padding: 10px 12px; border-radius: 6px;
  color: #d1d8e0; text-decoration: none;
  font-size: 14px; transition: background 0.15s;
}
#sidebar a:hover { background: #2a313a; color: #fff; }
#sidebar .num {
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px;
  background: #1677ff; color: #fff;
  border-radius: 50%; font-size: 11px; font-weight: 600;
}
main {
  flex: 1; max-width: 1100px;
  padding: 48px 56px 100px;
}
section {
  margin-bottom: 80px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 36px 40px;
  scroll-margin-top: 24px;
}
h2 {
  margin: 0 0 16px;
  font-size: 24px;
  color: #1a1f26;
  border-bottom: 2px solid #1677ff;
  padding-bottom: 12px;
}
.intro {
  color: #5f6b7a;
  font-size: 15px;
  margin: 0 0 32px;
  padding: 12px 16px;
  background: #f5f8ff;
  border-left: 3px solid #1677ff;
  border-radius: 0 4px 4px 0;
}
figure { margin: 0 0 32px; }
figure img {
  width: 100%; max-width: 1000px;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  display: block;
}
figcaption {
  margin-top: 10px;
  color: #5f6b7a;
  font-size: 13.5px;
  text-align: center;
  font-style: italic;
}
.missing {
  background: #fffbe6;
  color: #ad6800;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
}
@media (max-width: 1100px) {
  #sidebar { display: none; }
  main { padding: 24px; }
}
"""


def build() -> str:
    chapters = "\n".join(chapter_html(c) for c in CHAPTERS)
    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DocHub 操作手冊 — 故事性導覽</title>
<style>{CSS}</style>
</head>
<body>
<div class="layout">
{sidebar_html()}
<main>
<header style="margin-bottom:48px">
  <h1 style="font-size:32px; margin:0 0 8px">DocHub 操作手冊</h1>
  <p style="color:#5f6b7a; font-size:16px; margin:0">
    從零開始打造一個專案 → 範本 → 文件 → 角色 → 訂閱通知 — 完整故事性導覽
  </p>
</header>
{chapters}
</main>
</div>
</body>
</html>
"""


def main() -> None:
    if not SHOT_DIR.exists():
        raise SystemExit(f"找不到截圖目錄：{SHOT_DIR}")
    html = build()
    OUTPUT.write_text(html, encoding="utf-8")
    size_kb = OUTPUT.stat().st_size // 1024
    total_shots = sum(len(c.shots) for c in CHAPTERS)
    print(f"✅ 輸出：{OUTPUT}")
    print(f"   大小：{size_kb} KB")
    print(f"   章節：{len(CHAPTERS)}　總截圖：{total_shots}")


if __name__ == "__main__":
    main()
