#!/usr/bin/env python3
"""
build_manual.py — 產出 DocHub 完整 HTML 操作手冊

讀取：
  - MANUAL.md（文字內容）
  - artifacts/manual-shots/chN/*.png（每章截圖）

輸出：
  - manual.html（單檔，所有截圖以 base64 內嵌）

使用：
  python3 tools/build_manual.py
  打開 manual.html 即可
"""
from __future__ import annotations
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # e2e/
PLUGIN_ROOT = ROOT.parent                       # plugin-doc-hub/
MANUAL_MD = PLUGIN_ROOT / 'MANUAL.md'
SHOT_ROOT = ROOT / 'artifacts' / 'manual-shots'
OUTPUT = PLUGIN_ROOT / 'manual.html'


# ─────────────────────────────────────────────────────────────
#  章節 → 截圖對應（按章節 ID 排序、每張附標題）
# ─────────────────────────────────────────────────────────────
CHAPTER_SHOTS: dict[str, list[tuple[str, str]]] = {
    # anchor_prefix : [(filename, caption), ...]
    '2-快速上手': [
        ('ch1/02_list_full.png', '介面概覽：左側組織樹 / 頂部類型 Tab / 中央文件表格（Admin 視角）'),
    ],
    '3-組織架構群組-專案-資料夾': [
        ('ch1/01_list_default.png', '文件庫主頁（Admin 視角）'),
        ('ch1/03_list_project_view.png', '選擇專案後的列表檢視'),
        ('ch1/04_list_folder_view.png', '進入資料夾查看文件'),
        ('ch2/01_sidebar_default.png', '左側三層組織樹：群組 / 專案 / 資料夾'),
        ('ch2/02_sidebar_search.png', '側邊欄即時搜尋'),
        ('ch2/03_sidebar_collapsed.png', '側邊欄收合後的模式'),
        ('ch2/04_sidebar_expanded.png', '展開群組顯示所屬專案'),
    ],
    '4-文件管理': [
        ('ch3/01_view_page.png', '文件閱讀頁（Markdown 渲染）'),
        ('ch3/02_edit_page.png', '文件編輯頁（分割預覽模式）'),
        ('ch3/03_new_doc_modal.png', '新增文件對話框（自由撰寫 / 使用範本 / Git 同步）'),
        ('ch3/04_delete_confirm.png', '刪除文件前的確認'),
        ('ch3/05_edit_dirty.png', '編輯中（未儲存）的狀態'),
    ],
    '5-表單範本系統': [
        ('ch5/01_template_list.png', '範本列表頁'),
        ('ch5/02_template_builder.png', '建立新範本（欄位 / JSON 雙模式）'),
        ('ch5/03_template_fill.png', '填寫表單範本'),
        ('ch5/04_template_viewer.png', '已填寫範本的閱讀模式'),
    ],
    '6-文件鎖定': [
        ('ch6/04_locked_doc.png', '已鎖定文件的閱讀頁（顯示 🔒 鎖定狀態）'),
        ('ch8/03_version_entry_menu.png', '列表「⋯」選單：鎖定文件/解鎖文件'),
    ],
    '7-全文搜尋': [
        ('ch7search/01_search_empty_input.png', '側邊欄頂部搜尋框（⌘K 聚焦）'),
        ('ch7search/02_search_results.png', '輸入關鍵字 → 標題與片段黃底高亮'),
        ('ch7search/03_search_with_filter.png', '搜尋 + 專案篩選組合'),
        ('ch7search/04_search_no_results.png', '查無結果的空狀態'),
    ],
    '8-git-雙向同步': [
        ('ch4/01_git_edit_bar.png', '編輯頁綠色 Git 資訊列（Repo / Path / Branch）'),
        ('ch4/04_git_edit_inputs.png', '點「修改」切換為輸入模式'),
        ('ch4/02_git_sync_modal.png', '推送到 Git 的確認對話框'),
        ('ch4/03_git_view_page.png', 'Git 綁定文件的閱讀頁（Admin 可見拉取最新）'),
    ],
    '9-權限管理': [
        ('ch6/01_project_perm_modal.png', '專案權限設定（Viewer / Editor / Subscriber）'),
        ('ch6/02_category_perm_modal.png', '資料夾權限設定（預設繼承專案）'),
        ('ch6/03_category_perm_custom.png', '切換為「自訂此資料夾的權限」'),
        ('ch7/03_subscriber_panel.png', '訂閱者（Subscriber）管理'),
    ],
    '10-稽核日誌': [
        ('ch7/01_audit_log_modal.png', '稽核日誌 Modal（所有操作歷史）'),
        ('ch7/02_audit_log_rows.png', '稽核記錄（建立/更新/鎖定/Git 同步等動作標籤）'),
    ],
    '11-站內信通知鈴鐺圖示': [
        ('ch11/01_bell_with_badge.png', '右上角鈴鐺圖示 + 紅色未讀數字 Badge（訂閱者看到的即時通知）'),
        ('ch11/02_notification_list.png', '點開鈴鐺後的通知面板：左側清單列出未讀訊息，右側顯示完整內容（標題、Content、時間、狀態）'),
        ('ch7/04_doc_subscribe_view.png', '文件閱讀頁（訂閱該文件的使用者會收到更新通知）'),
    ],
    '12-附件管理pdf-word-excel': [
        ('ch12/01_edit_toolbar_attach_btn.png', '編輯頁工具列「📎 附件」按鈕（點擊選取檔案上傳）'),
        ('ch12/02_edit_with_attachment_md.png', '編輯框內的 Markdown 語法：!pdf[...] 與 [📎 ...](...)'),
        ('ch12/03_view_pdf_embed.png', '閱讀頁 PDF 內嵌 iframe 預覽（含頂部檔名與「下載 ↗」連結）'),
        ('ch12/04_view_file_link_cards.png', '閱讀頁附件下載卡片（Word / 其他檔案自動顯示對應圖示）'),
        ('ch12/05_view_full.png', '閱讀頁全頁示範（PDF 內嵌 + 附件卡片 + Markdown 內文）'),
    ],
    '13-標籤管理tags': [
        ('ch13/01_edit_tags_meta.png', '編輯頁 Meta bar 的「標籤」欄位：可直接輸入新標籤、用逗號或 Enter 分隔'),
        ('ch13/02_view_tags_row.png', '閱讀頁 Meta 下方的彩色標籤列（點擊任一標籤可跳至該標籤的文件列表）'),
        ('ch13/03_list_tag_chips.png', '列表頁每筆文件標題下方的標籤 chips（顏色由標籤名稱 hash 產生，一致穩定）'),
        ('ch13/04_list_filter_banner.png', '點擊標籤進入篩選模式：頂部出現青綠色 banner，顯示「🏷 標籤篩選：urgent」'),
        ('ch13/05_sidebar_tags_section.png', '側邊欄底部的「🏷 標籤」面板：依使用次數排序的 Top 10（Admin 另有「管理…」入口）'),
        ('ch13/06_tag_manager_list.png', '/admin/doc-hub/tags 標籤管理頁：名稱、顏色、使用次數、建立時間，可編輯/刪除/合併'),
        ('ch13/07_tag_manager_merge_modal.png', '合併標籤 Modal：把舊標籤的文件全部搬到新標籤，舊標籤自動刪除'),
        ('ch13/08_tag_manager_full.png', '標籤管理頁全頁示範'),
    ],
    # 版本歷史雖未獨立成章，但納入文件管理的延伸
    '4-文件管理_versions': [
        ('ch8/01_version_page.png', '版本歷史頁（左側版本列表、右側 Diff）'),
        ('ch8/02_version_diff.png', 'v2 對比 v1 的 Diff（+6 行 / −2 行）'),
        ('ch8/04_version_summary_edit.png', '編輯版本摘要（記錄此次修改了什麼）'),
    ],
}


# ─────────────────────────────────────────────────────────────
#  Markdown → HTML（極簡版，不依賴外部套件）
# ─────────────────────────────────────────────────────────────
def md_to_html(md: str) -> str:
    lines = md.split('\n')
    out: list[str] = []
    in_code = False
    code_lang = ''
    in_table = False
    table_rows: list[list[str]] = []
    in_list = False
    list_type = ''  # 'ul' or 'ol'
    in_quote = False

    def flush_table() -> None:
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        out.append('<table>')
        # 第一列是 header；第二列是分隔線；其餘是 body
        if len(table_rows) >= 2:
            out.append('<thead><tr>')
            for h in table_rows[0]:
                out.append(f'<th>{inline(h)}</th>')
            out.append('</tr></thead>')
            out.append('<tbody>')
            for row in table_rows[2:]:
                out.append('<tr>')
                for c in row:
                    out.append(f'<td>{inline(c)}</td>')
                out.append('</tr>')
            out.append('</tbody>')
        out.append('</table>')
        table_rows = []
        in_table = False

    def flush_list() -> None:
        nonlocal in_list, list_type
        if in_list:
            out.append(f'</{list_type}>')
            in_list = False
            list_type = ''

    def flush_quote() -> None:
        nonlocal in_quote
        if in_quote:
            out.append('</blockquote>')
            in_quote = False

    def inline(text: str) -> str:
        # 行內 code `xxx`
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        # 粗體 **xxx**
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        # 連結 [label](url)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
        # 斜體 _xxx_
        text = re.sub(r'(?<!\w)_([^_]+)_(?!\w)', r'<em>\1</em>', text)
        return text

    def header_id(text: str) -> str:
        """Generate GitHub-style anchor from header text"""
        # 移除數字前綴後保留原字（含 CJK）
        slug = text.strip().lower()
        # 移除特殊符號
        slug = re.sub(r'[（）()【】\[\]「」《》、，。：；？！.,?!:;/\\]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        return slug

    for raw in lines:
        line = raw.rstrip('\n')

        # Code fence
        if line.startswith('```'):
            if not in_code:
                flush_list()
                flush_quote()
                flush_table()
                in_code = True
                code_lang = line[3:].strip()
                out.append(f'<pre><code class="lang-{code_lang}">')
            else:
                in_code = False
                out.append('</code></pre>')
            continue
        if in_code:
            out.append(line.replace('<', '&lt;').replace('>', '&gt;'))
            continue

        # Horizontal rule
        if line.strip() == '---':
            flush_list()
            flush_quote()
            flush_table()
            out.append('<hr>')
            continue

        # Header
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            flush_list()
            flush_quote()
            flush_table()
            level = len(m.group(1))
            text = m.group(2)
            hid = header_id(text)
            out.append(f'<h{level} id="{hid}">{inline(text)}</h{level}>')
            continue

        # Table
        if '|' in line and line.strip().startswith('|'):
            flush_list()
            flush_quote()
            in_table = True
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            table_rows.append(cells)
            continue
        elif in_table:
            flush_table()

        # Blockquote
        if line.startswith('>'):
            flush_list()
            flush_table()
            if not in_quote:
                out.append('<blockquote>')
                in_quote = True
            out.append(inline(line.lstrip('>').strip()) + '<br>')
            continue
        elif in_quote and line.strip() == '':
            flush_quote()

        # List
        m_ul = re.match(r'^(\s*)[-*]\s+(.+)$', line)
        m_ol = re.match(r'^(\s*)(\d+)\.\s+(.+)$', line)
        if m_ul:
            flush_quote()
            flush_table()
            if not in_list or list_type != 'ul':
                flush_list()
                out.append('<ul>')
                in_list = True
                list_type = 'ul'
            out.append(f'<li>{inline(m_ul.group(2))}</li>')
            continue
        if m_ol:
            flush_quote()
            flush_table()
            if not in_list or list_type != 'ol':
                flush_list()
                out.append('<ol>')
                in_list = True
                list_type = 'ol'
            out.append(f'<li>{inline(m_ol.group(3))}</li>')
            continue
        if in_list and line.strip() == '':
            flush_list()

        # Empty line
        if line.strip() == '':
            flush_quote()
            continue

        # Paragraph
        flush_list()
        flush_quote()
        flush_table()
        out.append(f'<p>{inline(line)}</p>')

    flush_list()
    flush_quote()
    flush_table()
    if in_code:
        out.append('</code></pre>')

    return '\n'.join(out)


# ─────────────────────────────────────────────────────────────
#  把截圖內嵌成 base64 <figure>
# ─────────────────────────────────────────────────────────────
def img_figure(rel_path: str, caption: str) -> str:
    p = SHOT_ROOT / rel_path
    if not p.exists():
        return (
            f'<figure class="missing"><div class="miss-hint">⚠️ 截圖不存在：{rel_path}</div>'
            f'<figcaption>{caption}</figcaption></figure>'
        )
    b64 = base64.b64encode(p.read_bytes()).decode('ascii')
    return (
        f'<figure><img src="data:image/png;base64,{b64}" alt="{caption}" loading="lazy">'
        f'<figcaption>{caption}</figcaption></figure>'
    )


def build_shots_section(prefix: str, heading: str = '操作畫面') -> str:
    shots = CHAPTER_SHOTS.get(prefix, [])
    if not shots:
        return ''
    figs = '\n'.join(img_figure(n, c) for n, c in shots)
    return f'<div class="shots-block"><div class="shots-heading">📸 {heading}</div>{figs}</div>'


# ─────────────────────────────────────────────────────────────
#  注入截圖區塊到對應章節末尾
# ─────────────────────────────────────────────────────────────
def inject_shots(html: str) -> str:
    """在每個 H2 章節末尾、下個 H2/HR 之前插入對應截圖"""
    # 把 HTML 拆成 H2 區段
    pattern = re.compile(r'(<h2 id="([^"]+)">.*?</h2>)', re.DOTALL)
    segments: list[tuple[int, int, str]] = []  # (start, end, anchor_id)
    for m in pattern.finditer(html):
        segments.append((m.start(), m.end(), m.group(2)))

    if not segments:
        return html

    # 從後往前注入，以免 offset 位移
    result = html
    for i in range(len(segments) - 1, -1, -1):
        start, end, anchor = segments[i]
        # 找本章結束點（下個 H2 的 start，或結尾）
        chapter_end = segments[i + 1][0] if i + 1 < len(segments) else len(result)

        # 找本章對應的截圖
        shots_html = ''
        if anchor in CHAPTER_SHOTS:
            shots_html += build_shots_section(anchor)
        # 文件管理章特殊：加上版本歷史截圖
        if anchor == '4-文件管理':
            shots_html += build_shots_section(
                '4-文件管理_versions', heading='版本歷史截圖'
            )

        if shots_html:
            # 往前找最後一個 <hr> 的位置（本章結束前）
            segment_html = result[end:chapter_end]
            last_hr = segment_html.rfind('<hr>')
            if last_hr >= 0:
                insert_pos = end + last_hr
            else:
                insert_pos = chapter_end
            result = result[:insert_pos] + shots_html + result[insert_pos:]

    return result


# ─────────────────────────────────────────────────────────────
#  HTML 模板
# ─────────────────────────────────────────────────────────────
CSS = """
:root {
  --bg: #fafbfc;
  --fg: #1a1a1a;
  --muted: #666;
  --accent: #1677ff;
  --code-bg: #f6f8fa;
  --border: #e5e7eb;
  --quote-bg: #f0f6fc;
  --quote-border: #1677ff;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC',
               'PingFang TC', 'Hiragino Sans TC', 'Microsoft JhengHei',
               sans-serif;
  color: var(--fg);
  background: var(--bg);
  line-height: 1.7;
  font-size: 16px;
}
.layout {
  display: flex;
  min-height: 100vh;
  align-items: flex-start;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: 100vh;
  overflow-y: auto;
  background: #0f1419;
  color: #d1d5db;
  padding: 1.5rem 0 2rem;
  border-right: 1px solid #1f2937;
}
.sidebar .brand {
  padding: 0 1.5rem 1.2rem;
  border-bottom: 1px solid #1f2937;
  margin-bottom: 1rem;
}
.sidebar .brand-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: .3rem;
}
.sidebar .brand-sub {
  font-size: .78rem;
  color: #6b7280;
}
.sidebar nav {
  padding: 0 .6rem;
}
.sidebar nav a {
  display: block;
  padding: .5rem .9rem;
  margin-bottom: .1rem;
  font-size: .9rem;
  color: #9ca3af;
  border-radius: 5px;
  text-decoration: none;
  line-height: 1.4;
  transition: background .15s, color .15s;
}
.sidebar nav a:hover {
  background: #1f2937;
  color: #fff;
  text-decoration: none;
}
.sidebar nav a.active {
  background: #1677ff;
  color: #fff;
}
.sidebar nav .nav-section {
  padding: .8rem .9rem .3rem;
  font-size: .72rem;
  color: #4b5563;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 600;
}
.container {
  flex: 1;
  min-width: 0;
  max-width: 1080px;
  margin: 0;
  padding: 2rem 2.5rem 6rem;
}
@media (max-width: 960px) {
  .sidebar { display: none; }
  .container { margin: 0 auto; }
}
header.cover {
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  color: #fff;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 8px 24px rgba(22,119,255,0.15);
}
header.cover h1 { font-size: 2.4rem; margin: 0 0 .6rem; }
header.cover .sub { opacity: .9; font-size: 1.1rem; }
header.cover .meta {
  margin-top: 1.8rem; padding-top: 1.2rem;
  border-top: 1px solid rgba(255,255,255,.3);
  font-size: .9rem; opacity: .85;
  display: flex; gap: 2rem; flex-wrap: wrap;
}
h1 { font-size: 2rem; border-bottom: 3px solid var(--accent); padding-bottom: .4rem; margin-top: 3rem; }
h2 {
  font-size: 1.6rem;
  margin-top: 3rem; padding-top: 1rem;
  border-top: 2px solid var(--border);
  color: #0958d9;
}
h3 { font-size: 1.25rem; margin-top: 2rem; color: #222; }
h4 { font-size: 1.08rem; margin-top: 1.5rem; color: #444; }
p { margin: .8rem 0; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code {
  background: var(--code-bg);
  padding: .15em .4em;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: .9em;
  color: #d6336c;
}
pre {
  background: #282c34;
  color: #e5e7eb;
  padding: 1rem 1.2rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: .88em;
  line-height: 1.55;
}
pre code { background: transparent; color: inherit; padding: 0; }
blockquote {
  background: var(--quote-bg);
  border-left: 4px solid var(--quote-border);
  padding: .8rem 1.2rem;
  margin: 1rem 0;
  border-radius: 0 6px 6px 0;
  color: #333;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  font-size: .92em;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  border-radius: 6px;
  overflow: hidden;
}
thead { background: #f0f6fc; }
th, td { padding: .7rem 1rem; text-align: left; border: 1px solid var(--border); }
th { font-weight: 600; color: #0958d9; }
tbody tr:nth-child(even) { background: #fafbfc; }
tbody tr:hover { background: #eff6ff; }
hr { border: none; border-top: 1px dashed #d0d7de; margin: 2.5rem 0; }
ul, ol { margin: .6rem 0 .6rem 1.6rem; padding: 0; }
li { margin: .3rem 0; }

/* 截圖區塊 */
.shots-block {
  margin: 1.5rem 0 2.5rem;
  padding: 1.3rem 1.5rem;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.shots-heading {
  font-weight: 600;
  color: #0958d9;
  margin-bottom: 1.2rem;
  font-size: 1.05rem;
  letter-spacing: .02em;
}
figure {
  margin: 0 0 1.5rem;
  padding: 0;
}
figure img {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  background: #fff;
}
figcaption {
  font-size: .85em;
  color: var(--muted);
  margin-top: .5rem;
  text-align: center;
  font-style: italic;
}
figure.missing {
  padding: 1rem; background: #fff3cd; border: 1px dashed #ffc107; border-radius: 6px;
  text-align: center; color: #664d03;
}
.miss-hint { font-size: .9em; margin-bottom: .3rem; }

/* TOC */
.toc {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin: 2rem 0;
}
.toc > div:first-child { font-weight: 600; color: #0958d9; margin-bottom: .6rem; }
.toc ol { margin: 0 0 0 1.4rem; }
.toc li { margin: .2rem 0; }

/* Scroll offset for anchor links */
h1, h2, h3, h4 { scroll-margin-top: 1rem; }

/* Print */
@media print {
  body { font-size: 11pt; background: #fff; }
  .container { padding: 0; }
  header.cover { color: #000; background: #f0f6fc !important; -webkit-print-color-adjust: exact; }
  h2 { page-break-after: avoid; }
  figure { page-break-inside: avoid; }
  pre, blockquote { page-break-inside: avoid; }
}
"""


def build_sidebar_nav(body_html: str) -> str:
    """從 body HTML 抓所有 <h2 id=…>，產生 fixed 左側 nav"""
    pattern = re.compile(r'<h2 id="([^"]+)">(.+?)</h2>', re.DOTALL)
    items: list[tuple[str, str]] = []
    for m in pattern.finditer(body_html):
        anchor = m.group(1)
        # 去掉 inline 標籤
        title = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        items.append((anchor, title))

    # 分區：把編號章節跟附錄分組
    main_items = [(a, t) for a, t in items if re.match(r'^\d+', t)]
    misc_items = [(a, t) for a, t in items if not re.match(r'^\d+', t)]

    lines: list[str] = ['<nav>']
    if misc_items:
        lines.append('<div class="nav-section">手冊資訊</div>')
        for a, t in misc_items[:3]:
            lines.append(f'<a href="#{a}">{t}</a>')
    if main_items:
        lines.append('<div class="nav-section">功能章節</div>')
        for a, t in main_items:
            lines.append(f'<a href="#{a}">{t}</a>')
    rest = misc_items[3:]
    if rest:
        lines.append('<div class="nav-section">附錄</div>')
        for a, t in rest:
            lines.append(f'<a href="#{a}">{t}</a>')
    lines.append('</nav>')
    return '\n'.join(lines)


SIDEBAR_SCRIPT = """
(function () {
  var links = document.querySelectorAll('.sidebar nav a');
  var anchors = Array.prototype.map.call(links, function (a) {
    return { el: a, target: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (x) { return x.target; });
  function update() {
    var top = window.scrollY + 80;
    var active = null;
    for (var i = 0; i < anchors.length; i++) {
      if (anchors[i].target.offsetTop <= top) active = anchors[i];
    }
    links.forEach(function (l) { l.classList.remove('active'); });
    if (active) active.el.classList.add('active');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
"""


def build_html(body_inner: str, title: str = 'DocHub Plugin 操作手冊') -> str:
    sidebar_nav = build_sidebar_nav(body_inner)
    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
<div class="layout">
<aside class="sidebar">
  <div class="brand">
    <div class="brand-title">📘 DocHub 手冊</div>
    <div class="brand-sub">企業文件管理系統</div>
  </div>
  {sidebar_nav}
</aside>
<div class="container">
<header class="cover">
  <h1>📘 DocHub Plugin 操作手冊</h1>
  <div class="sub">企業文件管理系統 — 功能導覽、操作步驟與實機截圖</div>
  <div class="meta">
    <span>版本：v2.0（完整詳細版）</span>
    <span>目標讀者：一般使用者 + 系統管理員</span>
    <span>產出：Playwright 自動化截圖</span>
  </div>
</header>
{body_inner}
</div>
</div>
<script>{SIDEBAR_SCRIPT}</script>
</body>
</html>
"""


# ─────────────────────────────────────────────────────────────
#  主流程
# ─────────────────────────────────────────────────────────────
def main() -> None:
    if not MANUAL_MD.exists():
        raise SystemExit(f'找不到 MANUAL.md：{MANUAL_MD}')

    md_text = MANUAL_MD.read_text(encoding='utf-8')
    # 移除最外層 H1（由 cover 提供）
    md_text = re.sub(r'^# DocHub Plugin 使用手冊\s*\n', '', md_text, count=1)

    body_html = md_to_html(md_text)
    body_html = inject_shots(body_html)

    html = build_html(body_html)
    OUTPUT.write_text(html, encoding='utf-8')

    size_kb = OUTPUT.stat().st_size // 1024
    shot_count = sum(len(v) for v in CHAPTER_SHOTS.values())
    print(f'✅ HTML 手冊產出完成')
    print(f'   檔案：{OUTPUT}')
    print(f'   大小：{size_kb} KB')
    print(f'   截圖：{shot_count} 張（內嵌 base64）')
    print()
    print(f'🌐 在瀏覽器開啟：open "{OUTPUT}"')


if __name__ == '__main__':
    main()
