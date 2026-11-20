import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-010', title: 'Secret and PII Triage', difficulty: 'Hard', category: 'Agentic AI / Security Engineering',
  summary: 'Identify credential-shaped and personal-data patterns in supplied text, redact evidence, and prepare a safe escalation record.',
  prompt: 'Implement `inspect_text(text)`. Detect clearly labeled API keys, bearer tokens, email addresses, and phone-like values using conservative patterns. Return type, character span, and a redacted excerpt; never return the raw secret or complete personal identifier. Distinguish a detected pattern from a confirmed credential, and include safe next-step guidance. Do not contact providers, revoke credentials, search repositories, or expose the original value in logs.',
  tags: ['agentic-ai', 'secrets', 'privacy', 'redaction'],
  hints: ['Redact before constructing any output string.', 'The result is a possible exposure and requires verification by an authorized owner.', 'Avoid logging the original text in error messages.'],
  fixtures: `{"sample":"Authorization: Bearer abcd1234EXAMPLE and contact analyst@example.test"}`,
  starter: `"""Privacy-safe pattern triage over caller-supplied text only."""
import re

def inspect_text(text):
    """Return redacted candidate findings; never echo matched raw values."""
    # TODO: validate text, detect supported patterns, and report only masked evidence.
    # TODO: label every match as unverified and recommend authorized human review.
    pass

def run_demo(): return inspect_text("")
`,
  solution: `"""Privacy-safe pattern triage over caller-supplied text only."""
import re
PATTERNS=[("bearer_token",re.compile(r"(?i)bearer\\s+[A-Za-z0-9._~+/-]{8,}")),("email",re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")),("api_key",re.compile(r"(?i)(?:api[_-]?key|secret)\\s*[:=]\\s*[A-Za-z0-9_-]{8,}"))]
def _mask(value,kind):
    if kind=="email":
        name,domain=value.split("@",1); return (name[:1]+"***@"+domain)
    return value[:4]+"…[REDACTED]"
def inspect_text(text):
    if not isinstance(text,str): raise ValueError("text must be a string")
    findings=[]
    for kind,pattern in PATTERNS:
        for match in pattern.finditer(text):
            findings.append({"type":kind,"start":match.start(),"end":match.end(),"redacted":_mask(match.group(),kind),"verified":False,"next_step":"Restrict access to the source, verify with its owner, and use the approved rotation process if confirmed."})
    findings.sort(key=lambda x:(x["start"],x["type"]))
    return {"findings":findings,"raw_values_returned":False}
def run_demo(): return inspect_text("")
`,
  testCode: `from project import inspect_text
text="Bearer abcdefgh12345 and analyst@example.test"
r=inspect_text(text)
checks=[("token detected",any(x["type"]=="bearer_token" for x in r["findings"])), ("email detected",any(x["type"]=="email" for x in r["findings"])), ("raw secret omitted","abcdefgh12345" not in str(r)), ("email masked", "analyst@example.test" not in str(r)), ("unverified status",all(x["verified"] is False for x in r["findings"]))]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
