#!/usr/bin/env python3
"""build-permission-manual.py — DocHub 權限角色截圖手冊"""
import base64
from pathlib import Path

ROOT = Path(__file__).parent
SHOT_DIR = ROOT / 'e2e' / 'artifacts' / 'manual-shots' / 'permission-roles'
OUTPUT = ROOT / 'permission-manual.html'


def img_tag(png_name: str, caption: str, klass: str = '') -> str:
    p = SHOT_DIR / png_name
    if not p.exists():
        return f'<p class="missing">⚠️ 截圖 {png_name} 不存在</p>'
    b64 = base64.b64encode(p.read_bytes()).decode()
    cls = f' class="{klass}"' if klass else ''
    return f'''
    <figure{cls}>
      <img src="data:image/png;base64,{b64}" alt="{caption}">
      <figcaption>{caption}</figcaption>
    </figure>'''


sections = [
    ('intro', '前言', '''
        <p>本手冊示範 DocHub 三層權限架構：<strong>Viewer ⊂ Subscriber ⊂ Editor</strong>。
        高權限自動包含低權限，每個用戶只需勾選在最高權限欄位即可。</p>
        <table class="role-table">
          <tr><th>角色</th><th>看到專案</th><th>收通知</th><th>編輯文件</th></tr>
          <tr><td>👁 <strong>Viewer</strong></td><td>✓</td><td>—</td><td>—</td></tr>
          <tr><td>🔔 <strong>Subscriber</strong></td><td>✓</td><td>✓</td><td>—</td></tr>
          <tr><td>✏️ <strong>Editor</strong></td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>🚪 <strong>Outsider</strong></td><td>—</td><td>—</td><td>—</td></tr>
        </table>
    '''),
    ('admin-modal', '第一章　管理員設定權限', '''
        <h3>1.1　完整權限設定 Modal</h3>
        <p>管理員打開「🔐 專案權限設定」可看到三層權限欄位 + 階層提示表格。</p>
        ''' + img_tag('01_perm_modal_full.png', '專案權限設定 Modal — 完整檢視（顯示 Hint Table 與三個權限欄）') + '''
        <h3>1.2　權限階層提示表格特寫</h3>
        <p>提示表格說明三個角色的權限差異，並提示「每個用戶只需勾選在最高權限欄位即可」。</p>
        ''' + img_tag('02_perm_hint_zoom.png', '權限階層 Hint Table 特寫') + '''
    '''),
    ('admin', '第二章　Admin 視角', '''
        <p>管理員可看到所有專案，且擁有完整的 CRUD 權限（包含建立、編輯、刪除、權限設定）。</p>
        ''' + img_tag('03_role_admin_sidebar.png', '③ Admin 側邊欄 — 看到所有專案') + img_tag('04_role_admin_edit_btn.png', '④ Admin 進入文件 — 編輯按鈕可用'),
    ),
    ('editor', '第三章　Editor 視角（最高權限）', '''
        <p>Editor 被授權的專案，<strong>可看到、收通知、且可編輯</strong>文件。</p>
        ''' + img_tag('05_role_editor_sidebar.png', '⑤ Editor 側邊欄 — 看到被授權的專案') + img_tag('06_role_editor_edit_btn.png', '⑥ Editor 進入文件 — 編輯按鈕可用'),
    ),
    ('subscriber', '第四章　Subscriber 視角（中間權限）', '''
        <p>Subscriber 被授權的專案，<strong>可看到、收通知，但無法編輯</strong>。</p>
        ''' + img_tag('07_role_subscriber_sidebar.png', '⑦ Subscriber 側邊欄 — 看到被授權的專案') + img_tag('08_role_subscriber_no_edit.png', '⑧ Subscriber 進入文件 — 無編輯按鈕（只能讀）'),
    ),
    ('viewer', '第五章　Viewer 視角（最低權限）', '''
        <p>Viewer 被授權的專案，<strong>可看到，但無法收通知、無法編輯</strong>。</p>
        ''' + img_tag('09_role_viewer_sidebar.png', '⑨ Viewer 側邊欄 — 看到被授權的專案') + img_tag('10_role_viewer_no_edit.png', '⑩ Viewer 進入文件 — 無編輯按鈕（只能讀）'),
    ),
    ('outsider', '第六章　Outsider 視角（無權限）', '''
        <p>Outsider 完全看不到該專案，後端 API 也會拒絕回應（403 / 空陣列）。</p>
        ''' + img_tag('11_role_outsider_no_project.png', '⑪ Outsider 側邊欄 — 看不到任何被授權的專案'),
    ),
    ('notification', '第七章　通知系統', '''
        <p>當文件有更新時，<strong>Editor + Subscriber + Admin（含本人）</strong>都會收到通知；<strong>Viewer 不會</strong>收到。
        以下四張對照組分別呈現四種角色登入後查看通知收件匣的結果。</p>
        <h3>7.1　Editor 收件匣 ✓</h3>
        ''' + img_tag('12a_editor_inbox.png', '⑫a Editor — 收到「文件更新」通知')
        + '''
        <h3>7.2　Subscriber 收件匣 ✓</h3>
        ''' + img_tag('12b_subscriber_inbox.png', '⑫b Subscriber — 收到「文件更新」通知')
        + '''
        <h3>7.3　Admin 收件匣 ✓（self-notify）</h3>
        <p>Admin 是建立專案的人，自動成為 editor + subscriber，<strong>連自己改的文件也會收到通知</strong>，作為「動作已完成」的回執。</p>
        ''' + img_tag('12c_admin_inbox.png', '⑫c Admin — 自己改的文件也收到通知')
        + '''
        <h3>7.4　Viewer 收件匣 ✗（對照組）</h3>
        <p>Viewer 沒有訂閱權限，<strong>該文件的更新不會出現</strong>在收件匣（畫面中只看得到舊的、不相關的通知）。</p>
        ''' + img_tag('12d_viewer_inbox_empty.png', '⑫d Viewer — 沒有收到 PERM-DEMO 文件的更新通知（對照組）'),
    ),
    ('summary', '附錄　關鍵設計', '''
        <h3>1. Self-notify</h3>
        <p>即使是「本人改的文件」，本人也會收到通知，方便確認操作成功。</p>

        <h3>2. 自動加入 creator</h3>
        <p>建立專案的 admin 自動成為 editor + subscriber，並會在每次 setPermissions 時被保留，避免被誤刪。</p>

        <h3>3. 階層展開（伺服器端）</h3>
        <p>API 回傳專案清單時，會 UNION 三張 junction table（viewers / subscribers / editors），<br>
        確保高權限的人也看得到低權限應該看的專案。</p>

        <h3>4. 編輯防護</h3>
        <p>Subscriber / Viewer / Outsider 嘗試編輯文件時，後端直接回 403，UI 也不會顯示編輯按鈕。</p>
    '''),
]

# Build TOC
toc_html = '<nav class="toc"><h2>目錄</h2><ol>'
for sid, title, _ in sections:
    toc_html += f'<li><a href="#{sid}">{title}</a></li>'
toc_html += '</ol></nav>'

# Build body
body_html = ''
for sid, title, content in sections:
    body_html += f'<section id="{sid}"><h2>{title}</h2>{content}</section>\n'

OUTPUT.write_text(f'''<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>DocHub 權限角色操作手冊</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
    max-width: 1100px; margin: 0 auto; padding: 2rem;
    color: #1f2937; line-height: 1.7;
  }}
  h1 {{
    font-size: 2.5rem; margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }}
  .subtitle {{ color: #6b7280; margin-bottom: 2rem; }}
  h2 {{
    color: #1e40af; border-bottom: 3px solid #2563eb; padding-bottom: 0.4rem;
    margin-top: 3rem; font-size: 1.6rem;
  }}
  h3 {{ color: #374151; margin-top: 2rem; }}
  section {{ margin-bottom: 3rem; }}
  figure {{ margin: 1.5rem 0; text-align: center; }}
  img {{
    max-width: 100%; border: 1px solid #e5e7eb;
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }}
  figcaption {{ color: #6b7280; font-size: 0.9rem; margin-top: 0.6rem; }}
  .role-table {{ border-collapse: collapse; margin: 1rem 0; width: 100%; }}
  .role-table th, .role-table td {{
    border: 1px solid #d1d5db; padding: 0.6rem 1rem; text-align: center;
  }}
  .role-table th {{ background: #f3f4f6; }}
  .role-table td:first-child {{ text-align: left; }}
  .toc {{
    background: #f9fafb; border-left: 4px solid #2563eb;
    padding: 1rem 2rem; border-radius: 6px; margin: 2rem 0;
  }}
  .toc ol {{ margin: 0.5rem 0; padding-left: 1.5rem; }}
  .toc a {{ color: #2563eb; text-decoration: none; }}
  .toc a:hover {{ text-decoration: underline; }}
  .missing {{ color: #dc2626; font-style: italic; }}
  code {{
    background: #f3f4f6; padding: 0.1rem 0.4rem;
    border-radius: 4px; font-size: 0.9em;
  }}
  strong {{ color: #1e40af; }}
</style>
</head>
<body>
<h1>📚 DocHub 權限角色操作手冊</h1>
<p class="subtitle">Viewer ⊂ Subscriber ⊂ Editor — 三層權限階層完整實作示範</p>

{toc_html}

{body_html}

<footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #9ca3af; text-align: center; font-size: 0.85rem;">
  Generated by DocHub Plugin / E2E Screenshot Tour · {Path(__file__).name}
</footer>
</body>
</html>''', encoding='utf-8')

size_kb = OUTPUT.stat().st_size // 1024
print(f'✅ 輸出：{OUTPUT}')
print(f'   大小：{size_kb} KB')
print(f'   截圖目錄：{SHOT_DIR}')
