import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-021', title: 'Local HTML Record Extractor', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Parse supplied HTML fragments into normalized records without navigating to or scraping external URLs.',
  prompt: 'Implement `extract_cards(html)`. Use Python’s `HTMLParser` to extract cards with a `data-record` marker, collect title and description text, normalize whitespace, and report cards missing required fields. Ignore script/style contents and never load URLs or execute JavaScript. The exercise uses small local HTML snippets to teach robust parsing and schema validation.',
  tags: ['agentic-ai', 'html-parsing', 'normalization', 'offline'],
  hints: ['Track parser state as start tags and end tags arrive.', 'HTML text can be split across several data callbacks.', 'Do not use a regular expression as the HTML parser.'],
  fixtures: `{"html":"<article data-record><h2>Example</h2><p>  Short description </p></article>"}`,
  starter: `"""Extract records from an HTML string already supplied in memory."""
from html.parser import HTMLParser

class CardParser(HTMLParser):
    def __init__(self):
        super().__init__()
        # TODO: track card/title/description state and accumulate split text nodes.

def extract_cards(html):
    """Return normalized records and warnings. Never fetch or execute page content."""
    # TODO: feed a local parser, validate each record, and normalize its text fields.
    pass

def run_demo(): return extract_cards("")
`,
  solution: `"""Extract records from an HTML string already supplied in memory."""
from html.parser import HTMLParser
class CardParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.cards=[]; self.current=None; self.field=None; self.parts=[]; self.ignored=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=="script" or tag=="style": self.ignored+=1; return
        if self.ignored: return
        if tag=="article" and "data-record" in attrs: self.current={"title":"","description":""}; self.cards.append(self.current)
        elif self.current is not None and tag=="h2": self.field="title"
        elif self.current is not None and tag=="p": self.field="description"
    def handle_endtag(self,tag):
        if tag in ("script","style") and self.ignored: self.ignored-=1; return
        if tag in ("h2","p"): self.field=None
        if tag=="article": self.current=None
    def handle_data(self,data):
        if self.current is not None and self.field and not self.ignored: self.current[self.field]+=data
def extract_cards(html):
    if not isinstance(html,str): raise ValueError("html must be text")
    parser=CardParser(); parser.feed(html); records=[]; warnings=[]
    for index,card in enumerate(parser.cards,1):
        item={k:" ".join(v.split()) for k,v in card.items()}
        if not item["title"] or not item["description"]: warnings.append({"record":index,"reason":"required text missing"})
        else: records.append(item)
    return {"records":records,"warnings":warnings,"network_requests":0,"scripts_executed":0}
def run_demo(): return extract_cards("")
`,
  testCode: `from project import extract_cards
html='<article data-record><h2>Example</h2><p>  Short <b>description</b> </p></article><script><article data-record><h2>bad</h2><p>ignore</p></article></script>'
r=extract_cards(html)
checks=[("card parsed",len(r["records"])==1), ("text normalized",r["records"][0]["description"]=="Short description"), ("script ignored","bad" not in str(r)), ("no fetch or execution",r["network_requests"]==0 and r["scripts_executed"]==0), ("missing fields warned",len(extract_cards('<article data-record><h2>Only</h2></article>')["warnings"])==1)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
