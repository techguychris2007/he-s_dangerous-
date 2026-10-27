"""Render the owner-review policy drafts as standalone, accessible review pages.

These pages remain explicitly marked as drafts until the owner approves the text.
Run from the repository root. No third-party packages are required.
"""
from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def inline(text):
    text = escape(text)
    text = re.sub(r"\[([^]]+)\]\((https://[^ )]+)\)", r'<a href="\2" rel="noopener noreferrer">\1</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", text)


for slug, title in [('privacy', 'Privacy policy'), ('terms', 'Terms of service')]:
    source = 'privacy-policy' if slug == 'privacy' else 'terms-of-service'
    text = (ROOT / f'docs/legal/{source}.draft.md').read_text(encoding='utf-8')
    text = text.replace('**Draft for owner review — not published or effective. Prepared October 27, 2026.**', '**Effective October 27, 2026.**')
    text = text.replace('When published and presented to users, these terms will govern use', 'These terms govern use')
    text = text.replace('These drafts do not themselves change any existing user agreement.', '')
    text = text.replace('The published terms will show an effective or update date.', 'These terms show their effective or update date.')
    paragraphs = text.split('\n\n')
    body = []
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if paragraph.startswith('# '):
            body.append(f'<h1>{inline(paragraph[2:])}</h1>')
        elif paragraph.startswith('## '):
            body.append(f'<h2>{inline(paragraph[3:])}</h2>')
        else:
            body.append(f'<p>{inline(paragraph)}</p>')
    output = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — DarkWorld</title>
<style>
:root{{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0e1624;color:#dce4ed}}
*{{box-sizing:border-box}}body{{margin:0}}a{{color:#8dd5cd;text-underline-offset:4px}}a:focus-visible{{outline:2px solid #8dd5cd;outline-offset:5px}}
header,main,footer{{max-width:880px;margin:auto;padding:28px}}header{{display:flex;flex-wrap:wrap;justify-content:space-between;gap:20px;border-bottom:1px solid #304052}}nav{{display:flex;gap:24px}}main{{padding-top:42px;padding-bottom:64px}}
h1{{font-size:clamp(2rem,5vw,3rem);line-height:1.15;color:#fff;margin:28px 0}}h2{{font-size:1.3rem;color:#fff;margin:42px 0 14px}}p{{line-height:1.8;margin:0 0 18px}}strong{{color:#f0f5fa}}code{{background:#253247;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}}
.notice{{padding:18px 22px;border:1px solid #b29b5e;border-radius:10px;color:#eddaad;background:#29261e}}footer{{border-top:1px solid #304052;font-size:.9rem;color:#aab9ca}}@media print{{:root{{color-scheme:light;background:white;color:#222}}h1,h2,strong{{color:#111}}a{{color:#165e59}}header,footer{{display:none}}}}
</style></head><body><header><a href="/#/welcome">DARKWORLD ACADEMY</a><nav aria-label="Policy navigation"><a href="/privacy.html"{' aria-current="page"' if slug == 'privacy' else ''}>Privacy</a><a href="/terms.html"{' aria-current="page"' if slug == 'terms' else ''}>Terms</a></nav></header>
<main>
{''.join(body)}</main><footer>DarkWorld Academy · Policies · <a href="/#/login">Back to sign in</a></footer></body></html>
'''
    (ROOT / f'public/{slug}.html').write_text(output, encoding='utf-8')
    print(f'Prepared public/{slug}.html (draft)')
