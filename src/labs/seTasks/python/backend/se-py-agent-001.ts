import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-001', title: 'Agent Tool Permission Broker', difficulty: 'Hard', category: 'Agentic AI / Safety',
  summary: 'Evaluate an agent’s proposed tool calls against an explicit allowlist and require human approval for effects.',
  prompt: 'Implement `review_actions(actions, policy, approvals=())`. Every action has an id, tool, arguments, and effect (`read`, `write`, or `destructive`). The policy declares allowed tool names and which effects may run without approval. Reject unknown tools, malformed actions, and effects outside the allowlist. For write/destructive effects not explicitly preauthorized, return `approval_required` unless the action id appears in the human approval set; even approved actions are only marked ready and are never executed here. Keep decisions ordered, explain each decision, and ensure the policy defaults to deny. Do not call APIs, shell commands, or external systems.',
  tags: ['agentic-ai', 'tool-calling', 'least-privilege', 'human-approval'],
  hints: ['Separate the policy decision from the tool executor; this task implements only the former.', 'Default-deny when a policy field is absent or malformed.', 'Treat action arguments as untrusted data and never inspect them by executing them.'],
  fixtures: `{"policy":{"allowed_tools":["search_docs","draft_email"],"auto_effects":["read"]},"actions":[{"id":"a1","tool":"search_docs","arguments":{"query":"refund policy"},"effect":"read"},{"id":"a2","tool":"draft_email","arguments":{"to":"customer"},"effect":"write"},{"id":"a3","tool":"delete_account","arguments":{},"effect":"destructive"}]}`,
  starter: `"""Policy-only broker for proposed agent tool calls. It never executes a tool."""

VALID_EFFECTS = {"read", "write", "destructive"}

def review_actions(actions, policy, approvals=()):
    """Return one ordered decision per proposed action.

    Decision shape: {id, tool, decision, reason}; decision is deny, approval_required, or ready.
    The policy is default-deny. Read operations may be preapproved by an allowlisted tool; effects
    beyond auto_effects require a matching human approval. Unknown/malformed records are denied.
    This function must not invoke or simulate the proposed tools.
    """
    # TODO: validate policy and every proposed action independently; never let one bad item abort all.
    pass

def run_demo():
    return review_actions([], {"allowed_tools": [], "auto_effects": []})
`,
  solution: `"""Policy-only broker for proposed agent tool calls. It never executes a tool."""
VALID_EFFECTS = {"read", "write", "destructive"}

def review_actions(actions, policy, approvals=()):
    if not isinstance(actions, list):
        raise ValueError("actions must be a list")
    if not isinstance(policy, dict):
        policy = {}
    allowed = policy.get("allowed_tools", [])
    auto = policy.get("auto_effects", [])
    if not isinstance(allowed, list): allowed = []
    if not isinstance(auto, list): auto = []
    allowed, auto = set(x for x in allowed if isinstance(x, str)), set(x for x in auto if isinstance(x, str) and x in VALID_EFFECTS)
    approved = set(x for x in approvals if isinstance(x, str))
    decisions = []
    for index, action in enumerate(actions):
        if not isinstance(action, dict):
            decisions.append({"id": f"invalid-{index + 1}", "tool": "", "decision": "deny", "reason": "Action must be an object."})
            continue
        action_id, tool, effect = action.get("id"), action.get("tool"), action.get("effect")
        if not isinstance(action_id, str) or not action_id or not isinstance(tool, str) or not tool or not isinstance(action.get("arguments"), dict) or not isinstance(effect, str) or effect not in VALID_EFFECTS:
            decisions.append({"id": action_id if isinstance(action_id, str) else f"invalid-{index + 1}", "tool": tool if isinstance(tool, str) else "", "decision": "deny", "reason": "Action fields are invalid."})
        elif tool not in allowed:
            decisions.append({"id": action_id, "tool": tool, "decision": "deny", "reason": "Tool is not allowlisted."})
        elif effect in auto:
            decisions.append({"id": action_id, "tool": tool, "decision": "ready", "reason": "Tool and effect are allowlisted; execution remains a separate step."})
        elif action_id in approved:
            decisions.append({"id": action_id, "tool": tool, "decision": "ready", "reason": "Human approval recorded; no action was executed."})
        else:
            decisions.append({"id": action_id, "tool": tool, "decision": "approval_required", "reason": "This effect requires an explicit human approval."})
    return decisions

def run_demo():
    return review_actions([], {"allowed_tools": [], "auto_effects": []})
`,
  testCode: `from project import review_actions
policy = {"allowed_tools":["search_docs","draft_email"],"auto_effects":["read"]}
actions = [{"id":"r1","tool":"search_docs","arguments":{},"effect":"read"},{"id":"w1","tool":"draft_email","arguments":{},"effect":"write"},{"id":"x1","tool":"delete_account","arguments":{},"effect":"destructive"},{"id":"bad","tool":"search_docs","arguments":{},"effect":"destructive"},None]
r = review_actions(actions, policy)
checks = [("read allowlisted", r[0]["decision"] == "ready"), ("write needs approval", r[1]["decision"] == "approval_required"), ("unknown tool denied", r[2]["decision"] == "deny"), ("allowlisted destructive still approval gated", r[3]["decision"] == "approval_required"), ("bad record isolated", r[4]["decision"] == "deny"), ("approval does not execute", review_actions([actions[1]], policy, {"w1"})[0]["reason"].startswith("Human approval recorded"))]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
