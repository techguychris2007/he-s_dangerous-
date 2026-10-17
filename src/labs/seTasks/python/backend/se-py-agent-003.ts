import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-003', title: 'Evidence-Grounded Research Assistant', difficulty: 'Hard', category: 'Agentic AI / Retrieval',
  summary: 'Build a local-document retrieval pipeline that returns traceable evidence and abstains when the documents do not support an answer.',
  prompt: 'Implement `search_documents(question, documents, limit=3)` and `answer_from_evidence(question, results)`. Documents contain `id`, `title`, and `text`. Normalize tokens case-insensitively, rank documents by the number of distinct query terms present (then stable id), and return only positive matches with a short extract and matching terms. The answer function must cite the evidence ids and abstain when results are empty; it must never invent a fact or claim that a language model verified the answer. This is deterministic local retrieval over supplied fixtures, not a network-connected assistant.',
  tags: ['agentic-ai', 'retrieval', 'citations', 'grounding'],
  hints: ['Tokenize consistently and discard empty tokens.', 'Use deterministic tie-breaking so the same question produces the same order.', 'Citations are document ids; do not cite documents that were not returned as evidence.'],
  fixtures: `{"documents":[{"id":"d2","title":"Retention","text":"Security logs are retained for 90 days."},{"id":"d1","title":"Access","text":"Analysts use least privilege and review access quarterly."},{"id":"d3","title":"Noise","text":"The office closes at five."}]}`,
  starter: `"""Deterministic retrieval and evidence-only response formatting."""

import re

def _tokens(text):
    """Return normalized word tokens; keep this helper deterministic."""
    # TODO: return lowercase alphanumeric tokens from strings safely.
    pass

def search_documents(question, documents, limit=3):
    """Return positive matches as {id, title, score, terms, extract}."""
    # TODO: validate inputs, rank by overlap, then stable id, and enforce limit.
    pass

def answer_from_evidence(question, results):
    """Return {answer, citations, abstained}; never add unsupported facts."""
    # TODO: produce a transparent evidence summary or an explicit abstention.
    pass

def run_demo():
    return answer_from_evidence("", [])
`,
  solution: `"""Deterministic retrieval and evidence-only response formatting."""
import re

def _tokens(text):
    if not isinstance(text, str): return set()
    return set(re.findall(r"[a-z0-9]+", text.lower()))

def search_documents(question, documents, limit=3):
    if not isinstance(documents, list): raise ValueError("documents must be a list")
    if not isinstance(limit, int) or isinstance(limit, bool) or limit < 0: raise ValueError("limit must be non-negative")
    query = _tokens(question); ranked = []
    for index, doc in enumerate(documents):
        if not isinstance(doc, dict): continue
        did, title, body = doc.get("id"), doc.get("title"), doc.get("text")
        if not isinstance(did, str) or not isinstance(title, str) or not isinstance(body, str): continue
        terms = sorted(query & _tokens(title + " " + body))
        if terms:
            extract = body.strip()
            if len(extract) > 240: extract = extract[:237].rsplit(" ", 1)[0] + "..."
            ranked.append({"id": did, "title": title, "score": len(terms), "terms": terms, "extract": extract, "_index": index})
    ranked.sort(key=lambda item: (-item["score"], item["id"], item["_index"]))
    return [{k:v for k,v in item.items() if k != "_index"} for item in ranked[:limit]]

def answer_from_evidence(question, results):
    if not isinstance(results, list) or not results:
        return {"answer": "I cannot answer from the supplied documents; no matching evidence was found.", "citations": [], "abstained": True}
    valid = [r for r in results if isinstance(r, dict) and isinstance(r.get("id"), str) and isinstance(r.get("extract"), str)]
    if not valid:
        return {"answer": "I cannot answer from the supplied documents; no valid evidence was found.", "citations": [], "abstained": True}
    citations = list(dict.fromkeys(r["id"] for r in valid))
    evidence = " ".join(f"{r['title']}: {r['extract']}" for r in valid)
    return {"answer": "Evidence found: " + evidence, "citations": citations, "abstained": False}

def run_demo():
    return answer_from_evidence("", [])
`,
  testCode: `from project import search_documents, answer_from_evidence
docs = [{"id":"d2","title":"Retention","text":"Security logs are retained for 90 days."},{"id":"d1","title":"Access","text":"Analysts use least privilege and review access quarterly."},{"id":"d3","title":"Noise","text":"The office closes at five."}]
r = search_documents("security logs retained", docs)
a = answer_from_evidence("How long?", r)
checks = [("relevant ranking", r[0]["id"] == "d2"), ("terms explain score", r[0]["terms"] == ["logs","retained","security"]), ("irrelevant excluded", all(x["id"] != "d3" for x in r)), ("answer cites evidence", a["citations"] == ["d2"] and not a["abstained"]), ("no evidence abstains", answer_from_evidence("unknown", [])["abstained"]), ("limit honored", len(search_documents("security", docs, 1)) == 1)]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
