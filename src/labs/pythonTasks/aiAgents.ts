import type { CodeTask } from '../codeTypes';

/** AI agent tasks: the real orchestration patterns behind autonomous investigation agents (the kind
 *  that chain OSINT tools, pivot on findings, and write their own reports) — NOT wrappers around a
 *  live LLM API. There's no network access and no API key available to whatever's grading this code,
 *  so every task here separates the part that's actually yours to build — the decision loop, the
 *  chaining logic, the correlation, the synthesis — from the part that would be a real subprocess call
 *  or a real API request in production, which is always passed in as a plain function argument instead.
 *
 *  This isn't a workaround — it's the exact same layering a real agent framework needs: pure
 *  orchestration logic that never touches the network directly, testable on its own, with the actual
 *  tool execution swapped in at the boundary. Once you can build these, swapping the injected fixture
 *  functions for real calls (subprocess.run(["holehe", email]), a live breach-database API, a real
 *  language model's tool-use response) is a small step — the hard part, the part actually worth
 *  learning, is everything in these tasks. */

const RUNNER =
  'for name, ok, actual, expected in __results__:\n' +
  '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
  'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n';

const HEADER =
  '__results__ = []\n' +
  'def __check__(name, actual, expected):\n' +
  '    __results__.append((name, actual == expected, actual, expected))\n\n';

export const PYTHON_AI_AGENT_TASKS: CodeTask[] = [
  {
    id: 'py-agent-01',
    title: 'Agent: The Tool-Use Dispatch Loop',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'This is the core loop every tool-calling AI agent is built on — the same one behind ' +
      'autonomous OSINT frameworks, coding agents, and anything else that lets a model decide what ' +
      'to run next. Build it as a plain, model-agnostic function.\n\n' +
      'Write run_agent(query, decide_next_step, tools, max_steps=10):\n\n' +
      '- Maintain a history list, starting with {"role": "user", "content": query}.\n' +
      '- Loop up to max_steps times. Each iteration, call decide_next_step(history) — this stands ' +
      'in for "ask the model what to do next." It returns either ("tool", tool_name, args_dict) or ' +
      '("done", final_answer).\n' +
      '- If it returns ("done", answer): stop and return {"answer": answer, "steps": steps_taken, ' +
      '"history": history}.\n' +
      '- If it returns ("tool", name, args): look up tools[name] and call it as tools[name](**args) ' +
      "to get the REAL result — never invent what a tool 'would' return. If name isn't in tools, " +
      "the result is the string \"ERROR: unknown tool '<name>'\" instead of calling anything. Either " +
      'way, append (name, args, result) to a steps_taken list, then append two entries to history: ' +
      'an assistant turn recording the tool call, and a tool_result turn carrying the real result.\n' +
      '- If the loop finishes all max_steps without ever getting "done", return {"answer": None, ' +
      '"steps": steps_taken, "history": history, "error": "max_steps exceeded"}.\n\n' +
      "This is exactly the shape of a real tool-use API loop: the caller never generates a " +
      "tool's output, only ever reads back what the real function actually returned.",
    starterCode:
      'def run_agent(query, decide_next_step, tools, max_steps=10):\n' +
      '    # TODO: build the history list, loop up to max_steps calling decide_next_step(history),\n' +
      '    # execute real tools[name](**args) on a "tool" decision, record steps_taken, and return\n' +
      '    # once "done" is returned (or report max_steps exceeded if it never is)\n' +
      '    pass\n',
    hints: [
      'Start with history = [{"role": "user", "content": query}] and steps_taken = [] before the loop.',
      'decide_next_step(history) returns a tuple — check decision[0] == "done" first; if so, return immediately with decision[1] as the answer.',
      'Otherwise decision is ("tool", name, args) — unpack with _, tool_name, args = decision, then either call tools[tool_name](**args) if tool_name is in tools, or build the "ERROR: unknown tool ..." string if it isn\'t.',
      'Append the (name, args, result) tuple to steps_taken, then append an assistant-turn dict AND a tool_result-turn dict to history — two separate appends, not one.',
      'If the for loop over range(max_steps) finishes normally (no early return happened), that\'s your max_steps-exceeded case — return the dict with "error" set.',
    ],
    solution:
      'def run_agent(query, decide_next_step, tools, max_steps=10):\n' +
      '    history = [{"role": "user", "content": query}]\n' +
      '    steps_taken = []\n' +
      '    for _ in range(max_steps):\n' +
      '        decision = decide_next_step(history)\n' +
      '        if decision[0] == "done":\n' +
      '            return {"answer": decision[1], "steps": steps_taken, "history": history}\n\n' +
      '        _, tool_name, args = decision\n' +
      '        if tool_name not in tools:\n' +
      '            result = f"ERROR: unknown tool \'{tool_name}\'"\n' +
      '        else:\n' +
      '            result = tools[tool_name](**args)\n\n' +
      '        steps_taken.append((tool_name, args, result))\n' +
      '        history.append({"role": "assistant", "content": {"tool_use": tool_name, "args": args}})\n' +
      '        history.append({"role": "tool_result", "content": result})\n' +
      '    return {"answer": None, "steps": steps_taken, "history": history, "error": "max_steps exceeded"}\n',
    testCode:
      HEADER +
      'def fake_search_email(email):\n' +
      '    return ["Spotify", "GitHub"]\n\n' +
      'def fake_search_username(username):\n' +
      '    return ["reddit.com/u/" + username, "github.com/" + username]\n\n' +
      'tools = {"search_email": fake_search_email, "search_username": fake_search_username}\n\n' +
      'script = iter([\n' +
      '    ("tool", "search_email", {"email": "x@example.com"}),\n' +
      '    ("tool", "search_username", {"username": "x_handle"}),\n' +
      '    ("done", "Found accounts on Spotify, GitHub, and 2 more via username pivot."),\n' +
      '])\n' +
      'def scripted_model(history):\n' +
      '    return next(script)\n\n' +
      'result = run_agent("investigate x@example.com", scripted_model, tools)\n' +
      '__check__("returns the final answer once done", result["answer"], "Found accounts on Spotify, GitHub, and 2 more via username pivot.")\n' +
      '__check__("records both tool calls", len(result["steps"]), 2)\n' +
      '__check__("first step used the REAL tool result", result["steps"][0][2], ["Spotify", "GitHub"])\n' +
      '__check__("second step used the REAL tool result", result["steps"][1][2], ["reddit.com/u/x_handle", "github.com/x_handle"])\n' +
      '__check__("history grows by 2 entries per tool step, plus the initial user message", len(result["history"]), 5)\n\n' +
      'unknown_script = iter([("tool", "does_not_exist", {}), ("done", "stopped")])\n' +
      'r2 = run_agent("q", lambda h: next(unknown_script), tools)\n' +
      '__check__("unknown tool produces an error string instead of crashing", r2["steps"][0][2], "ERROR: unknown tool \'does_not_exist\'")\n\n' +
      'def infinite_model(history):\n' +
      '    return ("tool", "search_email", {"email": "a@a.com"})\n' +
      'r3 = run_agent("q", infinite_model, tools, max_steps=3)\n' +
      '__check__("reports max_steps exceeded instead of looping forever", r3.get("error"), "max_steps exceeded")\n' +
      '__check__("still stops at exactly max_steps", len(r3["steps"]), 3)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-02',
    title: 'Agent: OSINT Pivot Chainer',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'The single most valuable thing an OSINT agent does is pivot: find a username tied to an ' +
      'email, then automatically search THAT username everywhere else, without a human manually ' +
      'copying it between tools. Build that pivot as a standalone function.\n\n' +
      'Write investigate_email(email, find_linked_username, search_all_platforms):\n\n' +
      '- Call find_linked_username(email) — it returns a username string, or None if no linked ' +
      'account was found.\n' +
      '- If it returned None, return {"email": email, "linked_username": None, "platforms": []} — ' +
      'no pivot to make.\n' +
      '- If it returned a username, call search_all_platforms(username) to get the real list of ' +
      'platforms it appears on, and return {"email": email, "linked_username": username, ' +
      '"platforms": <that list>}.',
    starterCode:
      'def investigate_email(email, find_linked_username, search_all_platforms):\n' +
      '    # TODO: call find_linked_username(email); if it returns a username, pivot by calling\n' +
      '    # search_all_platforms(username) too. Return a dict with "email", "linked_username",\n' +
      '    # "platforms" either way.\n' +
      '    pass\n',
    hints: [
      'Call find_linked_username(email) exactly once and store the result — you need it either way, whether or not it\'s None.',
      'If the username is None, skip calling search_all_platforms entirely and return "platforms": [] — an unnecessary pivot on a non-existent username is exactly the kind of extra tool call a good agent avoids.',
      'If it\'s not None, call search_all_platforms(username) and use its real return value for "platforms".',
    ],
    solution:
      'def investigate_email(email, find_linked_username, search_all_platforms):\n' +
      '    findings = {"email": email, "linked_username": None, "platforms": []}\n' +
      '    username = find_linked_username(email)\n' +
      '    if username:\n' +
      '        findings["linked_username"] = username\n' +
      '        findings["platforms"] = search_all_platforms(username)\n' +
      '    return findings\n',
    testCode:
      HEADER +
      'def find_username_ok(email):\n' +
      '    return "target_handle" if email == "x@example.com" else None\n\n' +
      'def search_platforms_ok(username):\n' +
      '    return ["github.com/" + username, "reddit.com/u/" + username, "twitter.com/" + username]\n\n' +
      'r1 = investigate_email("x@example.com", find_username_ok, search_platforms_ok)\n' +
      '__check__("pivots to the found username", r1["linked_username"], "target_handle")\n' +
      '__check__("real platform results come back", len(r1["platforms"]), 3)\n' +
      '__check__("platform list uses the actual returned data", r1["platforms"][0], "github.com/target_handle")\n\n' +
      'calls = []\n' +
      'def search_platforms_tracking(username):\n' +
      '    calls.append(username)\n' +
      '    return ["x"]\n\n' +
      'r2 = investigate_email("nobody@example.com", find_username_ok, search_platforms_tracking)\n' +
      '__check__("no username found -> linked_username stays None", r2["linked_username"], None)\n' +
      '__check__("no username found -> platforms stays empty", r2["platforms"], [])\n' +
      '__check__("does not call search_all_platforms when there is nothing to pivot on", calls, [])\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-03',
    title: 'Agent: Breach & Reuse Risk Correlator',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'Raw breach data by itself is not actionable — "your email was in 2 breaches" tells someone ' +
      'little. An agent that correlates breach history against how many live accounts share that ' +
      'email is what turns raw findings into a prioritized action list.\n\n' +
      'Write correlate_breach_risk(email, accounts, breaches) where accounts is a list of ' +
      '{"platform": str, "username": str} and breaches is a list of {"email": str, "breach_name": ' +
      'str, "year": int, "data_types": list[str]}:\n\n' +
      "- Filter breaches to only this email's entries.\n" +
      '- A breach counts as "password exposed" if "password" is in that breach\'s data_types.\n' +
      '- Compute risk_score = (2 points per matching breach) + (5 points if ANY matching breach ' +
      'exposed a password) + (1 point per linked account, since each one is a bigger blast radius ' +
      'if a password was reused).\n' +
      "- Build priority_actions: if a password was exposed AND there's at least one linked " +
      'account, the FIRST action is "Rotate password immediately — exposed in {N} breach(es), ' +
      'reused across {M} known account(s)". Then, for every matching breach (in the order given), ' +
      'add "Review exposure from {breach_name} ({year}): {data_types joined by \', \'}".\n' +
      '- Return {"risk_score": ..., "priority_actions": [...], "breach_count": <matching breach count>}.',
    starterCode:
      'def correlate_breach_risk(email, accounts, breaches):\n' +
      '    # TODO: filter breaches to this email, compute risk_score per the rules above, and build\n' +
      '    # priority_actions (password-rotation warning first if applicable, then one line per breach)\n' +
      '    pass\n',
    hints: [
      'email_breaches = [b for b in breaches if b["email"] == email] gets you the filtered list to work from for everything else.',
      'password_exposed = any("password" in b["data_types"] for b in email_breaches) — any() short-circuits correctly here.',
      'risk_score = len(email_breaches) * 2, then += 5 if password_exposed, then += len(accounts).',
      'Only add the rotate-password action if password_exposed AND accounts is non-empty — a password with no linked accounts to worry about doesn\'t need the same urgency.',
      'Use an f-string for each line, and join data_types with \', \'.join(...) rather than printing the raw list.',
    ],
    solution:
      'def correlate_breach_risk(email, accounts, breaches):\n' +
      '    email_breaches = [b for b in breaches if b["email"] == email]\n' +
      '    password_exposed = any("password" in b["data_types"] for b in email_breaches)\n\n' +
      '    risk_score = 0\n' +
      '    risk_score += len(email_breaches) * 2\n' +
      '    if password_exposed:\n' +
      '        risk_score += 5\n' +
      '    risk_score += len(accounts)\n\n' +
      '    priority = []\n' +
      '    if password_exposed and accounts:\n' +
      '        priority.append(\n' +
      '            f"Rotate password immediately — exposed in {len(email_breaches)} breach(es), "\n' +
      '            f"reused across {len(accounts)} known account(s)"\n' +
      '        )\n' +
      '    for b in email_breaches:\n' +
      '        priority.append(f"Review exposure from {b[\'breach_name\']} ({b[\'year\']}): {\', \'.join(b[\'data_types\'])}")\n\n' +
      '    return {"risk_score": risk_score, "priority_actions": priority, "breach_count": len(email_breaches)}\n',
    testCode:
      HEADER +
      'breaches = [\n' +
      '    {"email": "x@example.com", "breach_name": "LinkedIn", "year": 2016, "data_types": ["email", "password"]},\n' +
      '    {"email": "x@example.com", "breach_name": "Adobe", "year": 2013, "data_types": ["email"]},\n' +
      '    {"email": "y@example.com", "breach_name": "Other", "year": 2020, "data_types": ["email"]},\n' +
      ']\n' +
      'accounts = [{"platform": "GitHub", "username": "x_handle"}, {"platform": "Reddit", "username": "x_handle"}]\n\n' +
      'r = correlate_breach_risk("x@example.com", accounts, breaches)\n' +
      '__check__("risk score: 2 breaches*2 + password bonus 5 + 2 accounts = 11", r["risk_score"], 11)\n' +
      '__check__("only counts this email\'s breaches", r["breach_count"], 2)\n' +
      '__check__("rotate-password warning comes first when applicable", r["priority_actions"][0], "Rotate password immediately — exposed in 2 breach(es), reused across 2 known account(s)")\n' +
      '__check__("one review line per matching breach after the warning", len(r["priority_actions"]), 3)\n' +
      '__check__("review line format is exact", r["priority_actions"][1], "Review exposure from LinkedIn (2016): email, password")\n\n' +
      'r2 = correlate_breach_risk("clean@example.com", [], breaches)\n' +
      '__check__("no matching breaches -> score is 0", r2["risk_score"], 0)\n' +
      '__check__("no matching breaches -> no actions at all", r2["priority_actions"], [])\n\n' +
      'r3 = correlate_breach_risk("y@example.com", [{"platform": "X", "username": "y"}], breaches)\n' +
      '__check__("breach with no password exposure does not trigger the rotate warning", r3["priority_actions"], ["Review exposure from Other (2020): email"])\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-04',
    title: 'Agent: Autonomous Recon Planner',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'Before an agent runs a single tool, it has to decide WHICH tools even apply — a phone number ' +
      "and a domain name need completely different investigation plans. Build the planner that's " +
      'usually the very first step of an autonomous recon agent.\n\n' +
      'Write classify_target(target) that identifies what kind of target a string is, checking IN ' +
      'THIS ORDER (so nothing is ambiguously two things at once) and returning the first match:\n\n' +
      '1. "email" — an email-shaped string: local part of word characters/dots/plus/hyphen, @, then ' +
      'a domain.\n' +
      '2. "ip" — four dot-separated groups of 1-3 digits (just the shape, no need to validate 0-255).\n' +
      '3. "phone" — an optional leading +, then 7 to 15 digits, nothing else.\n' +
      '4. "domain" — one or more "word." groups followed by a 2+ letter TLD (e.g. example.com).\n' +
      '5. "username" — the fallback for anything matching none of the above.\n\n' +
      'Then write plan_investigation(target) that calls classify_target and returns {"target": ' +
      'target, "target_type": <type>, "plan": <ordered list of tool names>} using this fixed plan ' +
      'per type:\n' +
      '  email    -> ["search_breach", "search_email", "search_username"]\n' +
      '  ip       -> ["search_ip"]\n' +
      '  phone    -> ["search_phone"]\n' +
      '  domain   -> ["search_whois", "search_domain", "generate_dorks"]\n' +
      '  username -> ["search_username", "generate_dorks"]',
    starterCode:
      'import re\n\n' +
      'EMAIL_RE = re.compile(r"...")   # TODO\n' +
      'IP_RE = re.compile(r"...")      # TODO\n' +
      'PHONE_RE = re.compile(r"...")   # TODO\n' +
      'DOMAIN_RE = re.compile(r"...")  # TODO\n\n' +
      'PLANS = {\n' +
      '    "email": ["search_breach", "search_email", "search_username"],\n' +
      '    "ip": ["search_ip"],\n' +
      '    "phone": ["search_phone"],\n' +
      '    "domain": ["search_whois", "search_domain", "generate_dorks"],\n' +
      '    "username": ["search_username", "generate_dorks"],\n' +
      '}\n\n' +
      'def classify_target(target):\n' +
      '    # TODO: check EMAIL_RE, IP_RE, PHONE_RE, DOMAIN_RE in that order; fall back to "username"\n' +
      '    pass\n\n' +
      'def plan_investigation(target):\n' +
      '    # TODO: classify target, then return {"target", "target_type", "plan"} using PLANS\n' +
      '    pass\n',
    hints: [
      'EMAIL_RE: r"^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$" — a local part, @, then a domain with at least one dot.',
      'IP_RE: r"^(\\d{1,3}\\.){3}\\d{1,3}$" — three "digits-then-dot" groups followed by one more digit group.',
      'PHONE_RE: r"^\\+?\\d{7,15}$" — an optional literal +, then 7 to 15 digits and nothing else.',
      'DOMAIN_RE: r"^([\\w-]+\\.)+[a-zA-Z]{2,}$" — one or more "label." groups, ending in a letters-only TLD of 2+ characters.',
      'classify_target: use .match() with each pattern in order, returning the type name the moment one matches; if none match, return "username".',
      'plan_investigation is a thin wrapper: target_type = classify_target(target), then return {"target": target, "target_type": target_type, "plan": PLANS[target_type]}.',
    ],
    solution:
      'import re\n\n' +
      'EMAIL_RE = re.compile(r"^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$")\n' +
      'IP_RE = re.compile(r"^(\\d{1,3}\\.){3}\\d{1,3}$")\n' +
      'PHONE_RE = re.compile(r"^\\+?\\d{7,15}$")\n' +
      'DOMAIN_RE = re.compile(r"^([\\w-]+\\.)+[a-zA-Z]{2,}$")\n\n' +
      'PLANS = {\n' +
      '    "email": ["search_breach", "search_email", "search_username"],\n' +
      '    "ip": ["search_ip"],\n' +
      '    "phone": ["search_phone"],\n' +
      '    "domain": ["search_whois", "search_domain", "generate_dorks"],\n' +
      '    "username": ["search_username", "generate_dorks"],\n' +
      '}\n\n' +
      'def classify_target(target):\n' +
      '    if EMAIL_RE.match(target):\n' +
      '        return "email"\n' +
      '    if IP_RE.match(target):\n' +
      '        return "ip"\n' +
      '    if PHONE_RE.match(target):\n' +
      '        return "phone"\n' +
      '    if DOMAIN_RE.match(target):\n' +
      '        return "domain"\n' +
      '    return "username"\n\n' +
      'def plan_investigation(target):\n' +
      '    target_type = classify_target(target)\n' +
      '    return {"target": target, "target_type": target_type, "plan": PLANS[target_type]}\n',
    testCode:
      HEADER +
      '__check__("classifies an email", classify_target("x@example.com"), "email")\n' +
      '__check__("classifies an ip", classify_target("192.168.1.1"), "ip")\n' +
      '__check__("classifies a phone number", classify_target("+14155552671"), "phone")\n' +
      '__check__("classifies a bare domain", classify_target("example.com"), "domain")\n' +
      '__check__("falls back to username for anything else", classify_target("johndoe99"), "username")\n\n' +
      'p1 = plan_investigation("x@example.com")\n' +
      '__check__("email plan has the right type", p1["target_type"], "email")\n' +
      '__check__("email plan runs breach check before email search before username pivot", p1["plan"], ["search_breach", "search_email", "search_username"])\n\n' +
      'p2 = plan_investigation("192.168.1.1")\n' +
      '__check__("ip plan is just search_ip", p2["plan"], ["search_ip"])\n\n' +
      'p3 = plan_investigation("example.com")\n' +
      '__check__("domain plan runs whois, then subdomain search, then dorks", p3["plan"], ["search_whois", "search_domain", "generate_dorks"])\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-05',
    title: 'Agent: Attack Surface Graph Mapper',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      "A company's real attack surface isn't one domain — it's every subdomain, and every IP those " +
      'subdomains actually resolve to, since two subdomains sharing an IP means compromising one ' +
      'host affects both. Build the agent step that turns a domain into that map.\n\n' +
      'Write map_attack_surface(root_domain, resolve_subdomains, get_ip):\n\n' +
      '- Call resolve_subdomains(root_domain) to get the real list of subdomains.\n' +
      '- For each subdomain, call get_ip(subdomain) to get its real IP (which may be None if it ' +
      "didn't resolve).\n" +
      '- Build a graph dict: graph[root_domain] = {"type": "domain", "children": [list of ' +
      'subdomains]}, and graph[subdomain] = {"type": "subdomain", "ip": <that subdomain\'s ip>} for ' +
      'each one.\n' +
      '- Track the set of unique, non-None IPs found across all subdomains.\n' +
      '- Return {"graph": graph, "subdomain_count": <n>, "unique_ip_count": <n>, "exposure_score": ' +
      'subdomain_count + unique_ip_count * 2} — IPs count double since a shared IP hosting multiple ' +
      'subdomains is a bigger single point of failure than any individual subdomain.',
    starterCode:
      'def map_attack_surface(root_domain, resolve_subdomains, get_ip):\n' +
      "    # TODO: resolve subdomains, get each one's real ip, build the graph dict, track unique\n" +
      '    # ips, and return graph + counts + exposure_score per the rules above\n' +
      '    pass\n',
    hints: [
      'Start with graph = {root_domain: {"type": "domain", "children": []}} and unique_ips = set() before the loop.',
      'subdomains = resolve_subdomains(root_domain) — call this once and reuse the list, both for the loop and for subdomain_count.',
      'For each sub in subdomains: ip = get_ip(sub); append sub to graph[root_domain]["children"]; set graph[sub] = {"type": "subdomain", "ip": ip}.',
      'Only add to unique_ips when ip is truthy (not None) — a subdomain that failed to resolve shouldn\'t count as an IP.',
      'exposure_score is computed from len(subdomains) and len(unique_ips), not from iterating again — you already have both counts by the time you return.',
    ],
    solution:
      'def map_attack_surface(root_domain, resolve_subdomains, get_ip):\n' +
      '    graph = {root_domain: {"type": "domain", "children": []}}\n' +
      '    subdomains = resolve_subdomains(root_domain)\n' +
      '    unique_ips = set()\n\n' +
      '    for sub in subdomains:\n' +
      '        ip = get_ip(sub)\n' +
      '        graph[root_domain]["children"].append(sub)\n' +
      '        graph[sub] = {"type": "subdomain", "ip": ip}\n' +
      '        if ip:\n' +
      '            unique_ips.add(ip)\n\n' +
      '    return {\n' +
      '        "graph": graph,\n' +
      '        "subdomain_count": len(subdomains),\n' +
      '        "unique_ip_count": len(unique_ips),\n' +
      '        "exposure_score": len(subdomains) + len(unique_ips) * 2,\n' +
      '    }\n',
    testCode:
      HEADER +
      'def fake_subdomains(domain):\n' +
      '    return ["api." + domain, "staging." + domain, "mail." + domain]\n\n' +
      'def fake_get_ip(host):\n' +
      '    mapping = {\n' +
      '        "api.example.com": "1.2.3.4",\n' +
      '        "staging.example.com": "1.2.3.4",\n' +
      '        "mail.example.com": "5.6.7.8",\n' +
      '    }\n' +
      '    return mapping.get(host)\n\n' +
      'r = map_attack_surface("example.com", fake_subdomains, fake_get_ip)\n' +
      '__check__("finds all 3 subdomains", r["subdomain_count"], 3)\n' +
      '__check__("two subdomains sharing an ip only count once", r["unique_ip_count"], 2)\n' +
      '__check__("exposure score: 3 subdomains + 2 unique ips * 2 = 7", r["exposure_score"], 7)\n' +
      '__check__("root domain lists all children", sorted(r["graph"]["example.com"]["children"]), ["api.example.com", "mail.example.com", "staging.example.com"])\n' +
      '__check__("subdomain node carries its real resolved ip", r["graph"]["api.example.com"]["ip"], "1.2.3.4")\n\n' +
      'def fake_subdomains_none(domain):\n' +
      '    return ["ghost." + domain]\n' +
      'def fake_get_ip_none(host):\n' +
      '    return None\n' +
      'r2 = map_attack_surface("example.com", fake_subdomains_none, fake_get_ip_none)\n' +
      '__check__("an unresolved subdomain does not count toward unique ips", r2["unique_ip_count"], 0)\n' +
      '__check__("exposure score still counts the subdomain itself", r2["exposure_score"], 1)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-06',
    title: 'Agent: Autonomous SOC Log Investigator',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'A SOC analyst rarely knows the right query on the first try — they query something broad, ' +
      'look at what came back, then narrow in based on THAT. Build an agent loop that does the ' +
      'same: it only ever sees its own accumulated findings, never the raw log data directly, and ' +
      "decides its next query based on what it's found so far.\n\n" +
      'Write investigate_logs(logs, decide_next_query, max_queries=5) where logs is a list of ' +
      'dicts (each with fields like "ip", "status", "user"):\n\n' +
      '- Maintain a findings list, starting empty.\n' +
      '- Loop up to max_queries times. Call decide_next_query(findings) — it returns either ' +
      '("query", field, value) or ("conclude", verdict).\n' +
      '- On ("conclude", verdict): stop and return {"verdict": verdict, "findings": findings, ' +
      '"queries_run": queries_run}.\n' +
      '- On ("query", field, value): run the REAL filter — every row in logs where row.get(field) ' +
      '== value — append {"field": field, "value": value, "count": <matches>, "rows": <the ' +
      'matches>} to findings, and append (field, value, match_count) to a separate queries_run ' +
      'list.\n' +
      '- If max_queries is reached with no "conclude", return {"verdict": None, "findings": ' +
      'findings, "queries_run": queries_run, "error": "max_queries exceeded"}.',
    starterCode:
      'def investigate_logs(logs, decide_next_query, max_queries=5):\n' +
      '    # TODO: loop up to max_queries times, calling decide_next_query(findings); run a real\n' +
      '    # filter over logs on a "query" decision and record it in both findings and queries_run;\n' +
      '    # stop and return on "conclude"; report max_queries exceeded if it never concludes\n' +
      '    pass\n',
    hints: [
      'findings = [] and queries_run = [] before the loop — decide_next_query only ever receives findings, never logs or queries_run directly.',
      'decision = decide_next_query(findings); if decision[0] == "conclude": return immediately using decision[1] as the verdict.',
      'Otherwise unpack _, field, value = decision, then matches = [row for row in logs if row.get(field) == value] — this is the REAL query against the real data.',
      'Append the full match list (not just the count) into findings\' dict — the next decide_next_query call might need to inspect the actual rows, not just how many there were.',
      'queries_run gets the lighter-weight (field, value, len(matches)) tuple — that\'s a separate list from findings, used for a different purpose (an audit trail of what was run).',
    ],
    solution:
      'def investigate_logs(logs, decide_next_query, max_queries=5):\n' +
      '    findings = []\n' +
      '    queries_run = []\n' +
      '    for _ in range(max_queries):\n' +
      '        decision = decide_next_query(findings)\n' +
      '        if decision[0] == "conclude":\n' +
      '            return {"verdict": decision[1], "findings": findings, "queries_run": queries_run}\n\n' +
      '        _, field, value = decision\n' +
      '        matches = [row for row in logs if row.get(field) == value]\n' +
      '        queries_run.append((field, value, len(matches)))\n' +
      '        findings.append({"field": field, "value": value, "count": len(matches), "rows": matches})\n' +
      '    return {"verdict": None, "findings": findings, "queries_run": queries_run, "error": "max_queries exceeded"}\n',
    testCode:
      HEADER +
      'logs = [\n' +
      '    {"ip": "10.0.0.1", "status": "FAILURE", "user": "admin"},\n' +
      '    {"ip": "10.0.0.1", "status": "FAILURE", "user": "admin"},\n' +
      '    {"ip": "10.0.0.1", "status": "FAILURE", "user": "admin"},\n' +
      '    {"ip": "10.0.0.2", "status": "SUCCESS", "user": "jsmith"},\n' +
      ']\n\n' +
      'def model_brute_force(findings):\n' +
      '    if len(findings) == 0:\n' +
      '        return ("query", "status", "FAILURE")\n' +
      '    last = findings[-1]\n' +
      '    if last["count"] >= 3:\n' +
      '        return ("conclude", f"Brute force suspected: {last[\'count\']} failures found")\n' +
      '    return ("conclude", "No brute force pattern detected")\n\n' +
      'r = investigate_logs(logs, model_brute_force)\n' +
      '__check__("concludes brute force based on the real match count", r["verdict"], "Brute force suspected: 3 failures found")\n' +
      '__check__("ran exactly one query before concluding", r["queries_run"], [("status", "FAILURE", 3)])\n\n' +
      'def model_clean(findings):\n' +
      '    if len(findings) == 0:\n' +
      '        return ("query", "status", "SUCCESS")\n' +
      '    return ("conclude", "clean" if findings[0]["count"] > 0 else "no successes")\n\n' +
      'r2 = investigate_logs(logs, model_clean)\n' +
      '__check__("a different query path reaches a different, still-correct verdict", r2["verdict"], "clean")\n\n' +
      'def model_infinite(findings):\n' +
      '    return ("query", "status", "FAILURE")\n\n' +
      'r3 = investigate_logs(logs, model_infinite, max_queries=2)\n' +
      '__check__("reports max_queries exceeded rather than looping forever", r3.get("error"), "max_queries exceeded")\n' +
      '__check__("stops at exactly max_queries", len(r3["queries_run"]), 2)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-07',
    title: 'Agent: Multi-Source Identity Resolver',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'Every real OSINT tool disagrees with every other one at least occasionally — one source ' +
      'says "NYC", another says nothing, a third says "New York". An agent that just reports raw ' +
      "per-tool output isn't useful; one that merges everything into a single confident profile " +
      'is. Build that merge step.\n\n' +
      'Write merge_identity_profiles(sources) where sources is a list of dicts like {"source": ' +
      '"sherlock", "name": "John Doe", "location": "NYC", "usernames": ["jd99"]} — any dict may be ' +
      'missing some fields entirely, and list-valued fields (like "usernames") should be treated ' +
      'differently from scalar fields (like "name"):\n\n' +
      '- For every SCALAR field (a string, not a list) that appears in ANY source: count how many ' +
      'sources report each distinct value for that field (ignoring sources where the field is ' +
      'missing or None), and pick whichever value has the most votes. Break ties by whichever value ' +
      'was seen FIRST across the sources list. Also track how many sources agreed on the winning ' +
      'value, in a separate confidence dict.\n' +
      '- For every LIST field that appears in any source: the merged value is the union of every ' +
      'item from every source, deduplicated, keeping first-seen order (no voting — every item any ' +
      'source reports gets included).\n' +
      '- Return {"profile": <merged dict>, "confidence": <dict of scalar field -> vote count>, ' +
      '"source_count": len(sources)}.',
    starterCode:
      'def merge_identity_profiles(sources):\n' +
      '    # TODO: split fields into scalar vs list-valued across all sources; for scalar fields,\n' +
      '    # vote and pick the most-agreed-on value (ties broken by first-seen order), tracking\n' +
      '    # confidence; for list fields, union+dedupe preserving first-seen order\n' +
      '    pass\n',
    hints: [
      'First pass: walk every source\'s keys (skipping "source" itself) and sort each field name into a scalar_fields set or a list_fields set based on isinstance(v, list).',
      'For each scalar field: build a votes dict (value -> count) and an order list (first-seen order of distinct values) by walking sources again, skipping any source where the field is missing or None.',
      'Pick the winner with max(order, key=lambda v: votes[v]) — iterating `order` (not `votes` directly) is what makes ties break by first-seen order, since max() keeps the first max it encounters.',
      'profile[field] = winner and confidence[field] = votes[winner] for each scalar field.',
      'For each list field: walk sources in order, and for each item in source.get(field, []), append it to a running list only if it\'s not already in there — that\'s the dedupe-preserving-order step.',
    ],
    solution:
      'def merge_identity_profiles(sources):\n' +
      '    scalar_fields = set()\n' +
      '    list_fields = set()\n' +
      '    for s in sources:\n' +
      '        for k, v in s.items():\n' +
      '            if k == "source":\n' +
      '                continue\n' +
      '            if isinstance(v, list):\n' +
      '                list_fields.add(k)\n' +
      '            else:\n' +
      '                scalar_fields.add(k)\n\n' +
      '    profile = {}\n' +
      '    confidence = {}\n\n' +
      '    for field in scalar_fields:\n' +
      '        votes = {}\n' +
      '        order = []\n' +
      '        for s in sources:\n' +
      '            if field in s and s[field] is not None:\n' +
      '                v = s[field]\n' +
      '                if v not in votes:\n' +
      '                    votes[v] = 0\n' +
      '                    order.append(v)\n' +
      '                votes[v] += 1\n' +
      '        if votes:\n' +
      '            best = max(order, key=lambda v: votes[v])\n' +
      '            profile[field] = best\n' +
      '            confidence[field] = votes[best]\n\n' +
      '    for field in list_fields:\n' +
      '        seen = []\n' +
      '        for s in sources:\n' +
      '            for v in s.get(field, []):\n' +
      '                if v not in seen:\n' +
      '                    seen.append(v)\n' +
      '        profile[field] = seen\n\n' +
      '    return {"profile": profile, "confidence": confidence, "source_count": len(sources)}\n',
    testCode:
      HEADER +
      'sources = [\n' +
      '    {"source": "sherlock", "name": "John Doe", "usernames": ["jd99"]},\n' +
      '    {"source": "holehe", "name": "John Doe", "location": "NYC", "usernames": ["jd99", "johndoe"]},\n' +
      '    {"source": "whois", "name": "J. Doe", "location": "NYC", "usernames": []},\n' +
      ']\n\n' +
      'r = merge_identity_profiles(sources)\n' +
      '__check__("majority-voted name wins (2 of 3 sources)", r["profile"]["name"], "John Doe")\n' +
      '__check__("location present in only 2 sources still resolves", r["profile"]["location"], "NYC")\n' +
      '__check__("usernames union across all sources, deduplicated", r["profile"]["usernames"], ["jd99", "johndoe"])\n' +
      '__check__("confidence tracks the winning value\'s vote count", r["confidence"]["name"], 2)\n' +
      '__check__("source_count reflects input length", r["source_count"], 3)\n\n' +
      'tie_sources = [\n' +
      '    {"source": "a", "city": "Boston"},\n' +
      '    {"source": "b", "city": "Chicago"},\n' +
      ']\n' +
      'r2 = merge_identity_profiles(tie_sources)\n' +
      '__check__("a tie breaks toward whichever value was seen first", r2["profile"]["city"], "Boston")\n' +
      '__check__("a 1-1 tie still has confidence 1", r2["confidence"]["city"], 1)\n\n' +
      'missing_sources = [{"source": "a", "name": "X"}, {"source": "b"}, {"source": "c", "name": None}]\n' +
      'r3 = merge_identity_profiles(missing_sources)\n' +
      '__check__("missing and None values are ignored, not treated as a vote", r3["confidence"]["name"], 1)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-08',
    title: 'Agent: Context Window Manager',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      "This one is a genuinely unsolved-in-production problem, not a toy exercise: a long-running " +
      "agent's conversation grows without bound, but the model's context window doesn't. Every " +
      "real agent framework needs some version of what you're about to build.\n\n" +
      'Write trim_context(messages, max_tokens, count_tokens) where messages is a list of {"role": ' +
      'str, "content": str} and count_tokens(text) -> int estimates a string\'s token cost:\n\n' +
      '- If messages is empty, return [] immediately.\n' +
      '- ALWAYS keep messages[0] (the first message — typically the original task/system prompt: ' +
      'losing it means the agent forgets what it was even asked to do).\n' +
      "- From the budget of max_tokens minus messages[0]'s own token cost, fit as many of the MOST " +
      'RECENT remaining messages as you can (walking backward from the end), without exceeding the ' +
      'budget.\n' +
      '- If every remaining message fit (nothing had to be dropped), just return the original ' +
      'messages list unchanged.\n' +
      '- Otherwise, insert ONE summary message — {"role": "system", "content": f"[{N} earlier ' +
      'message(s) summarized/omitted to fit context budget]"} — between the kept first message and ' +
      'the kept recent ones, where N is exactly how many messages got dropped.',
    starterCode:
      'def trim_context(messages, max_tokens, count_tokens):\n' +
      '    # TODO: always keep messages[0]; from the remaining budget, keep as many of the most\n' +
      '    # recent later messages as fit; if none were dropped return messages unchanged, otherwise\n' +
      '    # insert one summary message stating how many were dropped\n' +
      '    pass\n',
    hints: [
      'Handle the empty-list case first and return immediately — everything after assumes at least one message exists.',
      'first = messages[0]; budget = max_tokens - count_tokens(first["content"]) — this is the token budget left for everything else.',
      'Walk messages[1:] IN REVERSE (reversed(messages[1:])), accumulating into a list while tracking a running token total — stop (break) the moment adding the next message would exceed budget.',
      'Remember to reverse the kept-recent list back to chronological order before returning it — building it by walking backward means it comes out newest-first.',
      'num_dropped = len(messages) - 1 - len(kept_recent) — if that\'s 0 or less, return the original `messages` object unchanged (not a rebuilt equivalent list); otherwise build the summary message and return [first, summary] + kept_recent.',
    ],
    solution:
      'def trim_context(messages, max_tokens, count_tokens):\n' +
      '    if not messages:\n' +
      '        return []\n\n' +
      '    first = messages[0]\n' +
      '    first_tokens = count_tokens(first["content"])\n' +
      '    budget = max_tokens - first_tokens\n\n' +
      '    kept_recent = []\n' +
      '    used = 0\n' +
      '    for msg in reversed(messages[1:]):\n' +
      '        t = count_tokens(msg["content"])\n' +
      '        if used + t > budget:\n' +
      '            break\n' +
      '        kept_recent.append(msg)\n' +
      '        used += t\n' +
      '    kept_recent.reverse()\n\n' +
      '    num_dropped = len(messages) - 1 - len(kept_recent)\n' +
      '    if num_dropped <= 0:\n' +
      '        return messages\n\n' +
      '    summary = {\n' +
      '        "role": "system",\n' +
      '        "content": f"[{num_dropped} earlier message(s) summarized/omitted to fit context budget]",\n' +
      '    }\n' +
      '    return [first, summary] + kept_recent\n',
    testCode:
      HEADER +
      'def toklen(s):\n' +
      '    return len(s.split())\n\n' +
      'msgs = [\n' +
      '    {"role": "system", "content": "investigate x@example.com"},\n' +
      '    {"role": "tool_result", "content": "one two three four five"},\n' +
      '    {"role": "tool_result", "content": "six seven eight nine ten"},\n' +
      '    {"role": "tool_result", "content": "eleven twelve thirteen"},\n' +
      ']\n\n' +
      'r = trim_context(msgs, max_tokens=8, count_tokens=toklen)\n' +
      '__check__("always keeps the first message", r[0], msgs[0])\n' +
      '__check__("inserts exactly one summary message when trimming happens", r[1]["content"], "[2 earlier message(s) summarized/omitted to fit context budget]")\n' +
      '__check__("keeps the most recent message that fits the remaining budget", r[2], msgs[3])\n' +
      '__check__("result length is first + summary + kept recent", len(r), 3)\n\n' +
      'r2 = trim_context(msgs, max_tokens=1000, count_tokens=toklen)\n' +
      '__check__("nothing dropped when everything fits -> returns original list untouched", r2 is msgs, True)\n\n' +
      '__check__("empty input returns empty output", trim_context([], 100, toklen), [])\n\n' +
      'single = [{"role": "system", "content": "hi"}]\n' +
      '__check__("a single message never gets a summary inserted", trim_context(single, 1, toklen), single)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-09',
    title: 'Agent: Tool Selection Router',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      "Before a model can call the right tool, something has to decide which tool is even " +
      "relevant — in a real system that's the model reading tool schemas; here, build the explicit, " +
      'testable version of that same idea: keyword-based relevance scoring.\n\n' +
      'Write route_to_tool(query, tool_schemas) where tool_schemas is a list of {"name": str, ' +
      '"keywords": list[str]}:\n\n' +
      '- Extract the set of whole words in query (case-insensitive — "IP" and "ip" should match the ' +
      'same keyword).\n' +
      '- Score each tool by counting how many of ITS keywords appear as a whole word in that set ' +
      '(also case-insensitive).\n' +
      '- Return the name of the highest-scoring tool. If multiple tools tie for the highest score, ' +
      'return whichever one appears EARLIEST in tool_schemas.\n' +
      '- If every tool scores 0 (nothing matched at all), return None.',
    starterCode:
      'import re\n\n' +
      'def route_to_tool(query, tool_schemas):\n' +
      '    # TODO: extract the set of whole words in query (lowercased), score each tool by counting\n' +
      '    # matching keywords, and return the name of the best-scoring tool (or None if every score\n' +
      '    # is 0). Ties go to whichever tool comes first in tool_schemas.\n' +
      '    pass\n',
    hints: [
      're.findall(r"\\w+", query.lower()) gives you every word in the query, lowercased — wrap it in set(...) for fast membership checks.',
      'For each tool, score = sum(1 for kw in tool["keywords"] if kw.lower() in words) — lowercase the keyword too, in case the schema itself has mixed case.',
      'Track best_score and best_name as you go, only updating them with strictly GREATER scores (score > best_score, not >=) — that\'s what makes an earlier tool win a tie, since a later tool with an EQUAL score never overwrites it.',
      'Initialize best_score = 0 and best_name = None before the loop — that naturally handles the "nothing matched" case with no special-casing needed.',
    ],
    solution:
      'import re\n\n' +
      'def route_to_tool(query, tool_schemas):\n' +
      '    words = set(re.findall(r"\\w+", query.lower()))\n\n' +
      '    best_name = None\n' +
      '    best_score = 0\n' +
      '    for tool in tool_schemas:\n' +
      '        score = sum(1 for kw in tool["keywords"] if kw.lower() in words)\n' +
      '        if score > best_score:\n' +
      '            best_score = score\n' +
      '            best_name = tool["name"]\n' +
      '    return best_name\n',
    testCode:
      HEADER +
      'schemas = [\n' +
      '    {"name": "search_email", "keywords": ["email", "address", "inbox"]},\n' +
      '    {"name": "search_username", "keywords": ["username", "handle", "account"]},\n' +
      '    {"name": "search_ip", "keywords": ["ip", "address", "geolocation"]},\n' +
      ']\n\n' +
      '__check__("routes to the tool with the most matching keywords", route_to_tool("find accounts linked to this email address", schemas), "search_email")\n' +
      '__check__("case-insensitive matching", route_to_tool("What USERNAME HANDLE is linked here?", schemas), "search_username")\n' +
      '__check__("returns None when nothing matches at all", route_to_tool("banana", schemas), None)\n' +
      '__check__("a more specific multi-keyword match wins over a shared single keyword", route_to_tool("check the ip address geolocation", schemas), "search_ip")\n\n' +
      'tied = [{"name": "first", "keywords": ["x"]}, {"name": "second", "keywords": ["x"]}]\n' +
      '__check__("ties resolve to whichever tool appears first in the list", route_to_tool("x", tied), "first")\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-10',
    title: 'Agent: Autonomous Investigation Report Writer',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      "The last step of any real investigation agent is turning a pile of structured findings into " +
      "something a human actually reads. It has to be autonomous about STRUCTURE too — an agent " +
      "that always prints every possible section, empty ones included, produces noise nobody wants " +
      "to read through.\n\n" +
      'Write generate_report(findings) where findings is a dict that may contain any of the keys ' +
      '"platforms", "breaches", "usernames", "subdomains" (each a list, and any key may be missing ' +
      'entirely or present but empty):\n\n' +
      '- Produce a Markdown report with one section per NON-EMPTY key that IS present, using these ' +
      'exact titles, always in this fixed order regardless of the dict\'s own key order:\n' +
      '    platforms  -> "## Online Presence"\n' +
      '    breaches   -> "## Data Breaches"\n' +
      '    usernames  -> "## Linked Usernames"\n' +
      '    subdomains -> "## Discovered Subdomains"\n' +
      '- Skip a section entirely if that key is missing from findings, OR present but an empty list ' +
      '— an agent listing "## Data Breaches" with nothing under it is worse than not mentioning ' +
      'breaches at all.\n' +
      '- Each included section is its title line, then one line per item prefixed with "- ", ' +
      'joined with newlines.\n' +
      '- Join all included sections together separated by a blank line (i.e. two newlines between ' +
      'sections).\n' +
      '- If NOTHING has any findings at all (every relevant key missing or empty), return exactly ' +
      'the string "No findings." instead of an empty report.',
    starterCode:
      'def generate_report(findings):\n' +
      '    # TODO: build one "## Title" section per non-empty key present, in the fixed order given\n' +
      '    # above, joined by blank lines; return "No findings." if nothing qualifies at all\n' +
      '    pass\n',
    hints: [
      'Hardcode the fixed order and titles as a list of (key, title) tuples up front — iterate THAT list, never findings.keys(), since that\'s what guarantees the fixed section order regardless of the dict\'s own key order.',
      'For each (key, title) pair: items = findings.get(key) — if items is truthy (present AND non-empty; get() returns None for a missing key, and an empty list is also falsy), build that section.',
      'Build a section as "\\n".join([title] + [f"- {item}" for item in items]) — the title is just the first line of the same joined block.',
      'Collect all built sections into a list, then "\\n\\n".join(sections) at the end for the blank-line separation between sections.',
      'If the sections list ends up empty (nothing qualified), return "No findings." instead of joining an empty list (which would just give you an empty string).',
    ],
    solution:
      'def generate_report(findings):\n' +
      '    order = [\n' +
      '        ("platforms", "## Online Presence"),\n' +
      '        ("breaches", "## Data Breaches"),\n' +
      '        ("usernames", "## Linked Usernames"),\n' +
      '        ("subdomains", "## Discovered Subdomains"),\n' +
      '    ]\n' +
      '    sections = []\n' +
      '    for key, title in order:\n' +
      '        items = findings.get(key)\n' +
      '        if items:\n' +
      '            lines = [title] + [f"- {item}" for item in items]\n' +
      '            sections.append("\\n".join(lines))\n\n' +
      '    if not sections:\n' +
      '        return "No findings."\n' +
      '    return "\\n\\n".join(sections)\n',
    testCode:
      HEADER +
      'r1 = generate_report({"platforms": ["Spotify", "GitHub"], "breaches": ["LinkedIn (2016)"]})\n' +
      '__check__("basic two-section report", r1, "## Online Presence\\n- Spotify\\n- GitHub\\n\\n## Data Breaches\\n- LinkedIn (2016)")\n\n' +
      'r2 = generate_report({"platforms": [], "usernames": ["jd99"]})\n' +
      '__check__("an empty-list key is skipped entirely, not printed as an empty section", r2, "## Linked Usernames\\n- jd99")\n\n' +
      'r3 = generate_report({})\n' +
      '__check__("nothing at all -> exact fallback string", r3, "No findings.")\n\n' +
      'r4 = generate_report({"subdomains": ["api.x.com"], "platforms": ["Y"]})\n' +
      '__check__("section order is fixed regardless of dict insertion order", r4, "## Online Presence\\n- Y\\n\\n## Discovered Subdomains\\n- api.x.com")\n\n' +
      'r5 = generate_report({"breaches": ["A", "B", "C"]})\n' +
      '__check__("multi-item section lists every item on its own line", r5, "## Data Breaches\\n- A\\n- B\\n- C")\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-11',
    title: 'Agent: Mobile-Money Scam Triage',
    difficulty: 'Medium',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'Mobile-money fraud — fake "you\'ve won", fake "send your PIN to reverse a wrong transfer" ' +
      'messages — costs ordinary people real money every day, and almost none of the people it ' +
      'reaches have a security background. A triage agent that reads a message and explains WHY it ' +
      "looks like a scam is something that could sit inside a chat app or an SMS filter.\n\n" +
      'Write score_scam_message(text). Check these five rules against the lowercased text — each ' +
      'rule counts ONCE no matter how many times it matches, and the reasons list always uses this ' +
      'fixed rule order:\n\n' +
      '1. "urgency" (+2): any of the WHOLE WORDS urgent, immediately, now, expires — or the phrase ' +
      '"within 24 hours".\n' +
      '2. "secret_request" (+4): any of the WHOLE WORDS pin, password, otp — or the phrase ' +
      '"verification code".\n' +
      '3. "payment_request" (+3): any of the phrases "send money", "transfer", "mobile money", ' +
      '"gift card", "bitcoin" — or the WHOLE WORD momo.\n' +
      '4. "link" (+2): the text contains something matching https?://\\S+\n' +
      '5. "prize" (+3): any of the WHOLE WORDS won, winner, prize, lottery, congratulations.\n\n' +
      'Whole-word matters: "spinning" must not trigger "pin", and "wonderful" must not trigger ' +
      '"won". Return {"score": <sum>, "verdict": <...>, "reasons": [rule names that fired, in the ' +
      'fixed order above]}, where verdict is "scam" if score >= 6, "suspicious" if score is 3 to ' +
      '5, and "likely_safe" otherwise.',
    starterCode:
      'import re\n\n' +
      'def score_scam_message(text):\n' +
      '    # TODO: lowercase the text, get its set of whole words with re.findall(r"\\w+", ...), then\n' +
      '    # check the five rules (each counts once), in the fixed order, collecting score + reasons\n' +
      '    pass\n',
    hints: [
      'lowered = text.lower(); words = set(re.findall(r"\\w+", lowered)) — use `words` for whole-word checks and `lowered` for phrase checks like "within 24 hours".',
      'Whole-word rule check: bool(words & {"urgent", "immediately", "now", "expires"}) — set intersection is non-empty only if at least one of those exact words appears.',
      'Phrase check: any(p in lowered for p in ["send money", "transfer", ...]) — a plain substring check is right for phrases (and for "transfer", which is fine as a substring here).',
      'Build a list of (rule_name, points, fired_bool) tuples in the fixed order, then loop over it once: add points and append rule_name for each fired one.',
      'Verdict thresholds: score >= 6 -> "scam"; elif score >= 3 -> "suspicious"; else "likely_safe".',
    ],
    solution:
      'import re\n\n' +
      'def score_scam_message(text):\n' +
      '    lowered = text.lower()\n' +
      '    words = set(re.findall(r"\\w+", lowered))\n\n' +
      '    rules = [\n' +
      '        ("urgency", 2, bool(words & {"urgent", "immediately", "now", "expires"}) or "within 24 hours" in lowered),\n' +
      '        ("secret_request", 4, bool(words & {"pin", "password", "otp"}) or "verification code" in lowered),\n' +
      '        ("payment_request", 3, any(p in lowered for p in ["send money", "transfer", "mobile money", "gift card", "bitcoin"]) or "momo" in words),\n' +
      '        ("link", 2, re.search(r"https?://\\S+", lowered) is not None),\n' +
      '        ("prize", 3, bool(words & {"won", "winner", "prize", "lottery", "congratulations"})),\n' +
      '    ]\n\n' +
      '    score = 0\n' +
      '    reasons = []\n' +
      '    for name, points, fired in rules:\n' +
      '        if fired:\n' +
      '            score += points\n' +
      '            reasons.append(name)\n\n' +
      '    if score >= 6:\n' +
      '        verdict = "scam"\n' +
      '    elif score >= 3:\n' +
      '        verdict = "suspicious"\n' +
      '    else:\n' +
      '        verdict = "likely_safe"\n' +
      '    return {"score": score, "verdict": verdict, "reasons": reasons}\n',
    testCode:
      HEADER +
      'r1 = score_scam_message("URGENT: send your MoMo PIN now to claim your prize http://x.co")\n' +
      '__check__("classic MoMo scam hits every rule: 2+4+3+2+3 = 14", r1["score"], 14)\n' +
      '__check__("and is called a scam", r1["verdict"], "scam")\n' +
      '__check__("reasons come back in the fixed rule order", r1["reasons"], ["urgency", "secret_request", "payment_request", "link", "prize"])\n\n' +
      'r2 = score_scam_message("Hi, are we still meeting for lunch tomorrow?")\n' +
      '__check__("normal message scores 0", r2["score"], 0)\n' +
      '__check__("normal message is likely_safe with no reasons", (r2["verdict"], r2["reasons"]), ("likely_safe", []))\n\n' +
      'r3 = score_scam_message("Your package arrives now, track: https://track.example.com")\n' +
      '__check__("urgency + link = 4 -> suspicious", (r3["score"], r3["verdict"]), (4, "suspicious"))\n' +
      '__check__("only the rules that fired are listed", r3["reasons"], ["urgency", "link"])\n\n' +
      'r4 = score_scam_message("Please share the OTP")\n' +
      '__check__("a secret request alone is already suspicious", (r4["score"], r4["verdict"]), (4, "suspicious"))\n\n' +
      '__check__("whole-word matching: wonderful is not won", score_scam_message("What a wonderful day")["score"], 0)\n' +
      '__check__("whole-word matching: spinning is not pin", score_scam_message("spinning class at 6")["score"], 0)\n' +
      '__check__("each rule counts once even if it matches repeatedly", score_scam_message("now now now now")["score"], 2)\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-12',
    title: 'Agent: Dependency Vulnerability Triage',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'Most small teams have no idea which of their dependencies are already known-vulnerable — ' +
      'advisory feeds exist, but nobody has time to cross-reference them by hand against a ' +
      'requirements file. An agent that does that cross-reference and hands back a prioritized fix ' +
      "list is a real gap in how most projects get maintained.\n\n" +
      'Write triage_dependencies(installed, advisories) where installed is a dict of package name ' +
      '-> version string like "2.19.0", and advisories is a list of {"id": str, "package": str, ' +
      '"affected_below": str, "severity": str} (severity is "critical", "high", "medium", or ' +
      '"low"):\n\n' +
      '- An advisory applies only if its package is actually installed AND the installed version ' +
      'is strictly LOWER than affected_below.\n' +
      '- Compare versions NUMERICALLY, part by part: "2.9.0" is lower than "2.10.0" (a plain string ' +
      'comparison gets this wrong). Versions with different part counts compare as if padded with ' +
      'zeros, so "2.0" equals "2.0.0" (equal is NOT lower, so it is not affected).\n' +
      '- Return a list of findings, each {"id", "package", "installed", "fixed_in" (the ' +
      'advisory\'s affected_below), "severity"}, sorted by severity (critical first, then high, ' +
      'medium, low), and within the same severity by package name, then by advisory id.',
    starterCode:
      'def parse_version(v):\n' +
      '    # TODO: turn "2.19.0" into a tuple of ints, e.g. (2, 19, 0)\n' +
      '    pass\n\n' +
      'def is_lower(a, b):\n' +
      '    # TODO: True if version string a is strictly lower than b; treat missing trailing parts as 0\n' +
      '    pass\n\n' +
      'def triage_dependencies(installed, advisories):\n' +
      '    # TODO: keep advisories whose package is installed at a strictly lower version, then sort\n' +
      '    # by severity rank, package name, advisory id\n' +
      '    pass\n',
    hints: [
      'parse_version: tuple(int(p) for p in v.split(".")) — comparing tuples of ints is exactly what makes 2.9.0 < 2.10.0 come out right.',
      'is_lower: parse both, pad the shorter tuple with zeros up to the longer one\'s length (a + (0,) * (n - len(a))), then compare the padded tuples with <.',
      'Severity ranking: SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3} and sort by (rank, package, id) — a tuple sort key handles all three levels at once.',
      'Skip an advisory outright if its package is not in installed — check membership before parsing anything.',
      'Each finding\'s "installed" comes from the installed dict, and "fixed_in" is just the advisory\'s affected_below value.',
    ],
    solution:
      'SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}\n\n' +
      'def parse_version(v):\n' +
      '    return tuple(int(p) for p in v.split("."))\n\n' +
      'def is_lower(a, b):\n' +
      '    pa, pb = parse_version(a), parse_version(b)\n' +
      '    n = max(len(pa), len(pb))\n' +
      '    pa = pa + (0,) * (n - len(pa))\n' +
      '    pb = pb + (0,) * (n - len(pb))\n' +
      '    return pa < pb\n\n' +
      'def triage_dependencies(installed, advisories):\n' +
      '    findings = []\n' +
      '    for adv in advisories:\n' +
      '        pkg = adv["package"]\n' +
      '        if pkg not in installed:\n' +
      '            continue\n' +
      '        if is_lower(installed[pkg], adv["affected_below"]):\n' +
      '            findings.append({\n' +
      '                "id": adv["id"],\n' +
      '                "package": pkg,\n' +
      '                "installed": installed[pkg],\n' +
      '                "fixed_in": adv["affected_below"],\n' +
      '                "severity": adv["severity"],\n' +
      '            })\n' +
      '    findings.sort(key=lambda f: (SEVERITY_RANK[f["severity"]], f["package"], f["id"]))\n' +
      '    return findings\n',
    testCode:
      HEADER +
      'installed = {"requests": "2.19.0", "flask": "2.0", "django": "3.2.5", "numpy": "1.24.0"}\n' +
      'advisories = [\n' +
      '    {"id": "A1", "package": "requests", "affected_below": "2.20.0", "severity": "high"},\n' +
      '    {"id": "A2", "package": "django", "affected_below": "3.2.10", "severity": "critical"},\n' +
      '    {"id": "A3", "package": "flask", "affected_below": "2.0.0", "severity": "low"},\n' +
      '    {"id": "A4", "package": "numpy", "affected_below": "1.22.0", "severity": "medium"},\n' +
      '    {"id": "A5", "package": "pillow", "affected_below": "9.0.0", "severity": "critical"},\n' +
      '    {"id": "A6", "package": "requests", "affected_below": "2.31.0", "severity": "medium"},\n' +
      ']\n' +
      'r = triage_dependencies(installed, advisories)\n' +
      '__check__("only genuinely affected advisories are returned, most severe first", [f["id"] for f in r], ["A2", "A1", "A6"])\n' +
      '__check__("fixed_in reports the advisory threshold", r[0]["fixed_in"], "3.2.10")\n' +
      '__check__("installed reports the actual installed version", r[1]["installed"], "2.19.0")\n' +
      '__check__("a package that is not installed is ignored (pillow)", "A5" in [f["id"] for f in r], False)\n' +
      '__check__("equal versions are not affected: 2.0 vs 2.0.0 (flask)", "A3" in [f["id"] for f in r], False)\n' +
      '__check__("newer than the threshold is not affected (numpy)", "A4" in [f["id"] for f in r], False)\n\n' +
      'r2 = triage_dependencies({"x": "2.9.0"}, [{"id": "N1", "package": "x", "affected_below": "2.10.0", "severity": "low"}])\n' +
      '__check__("versions compare numerically: 2.9.0 is lower than 2.10.0", len(r2), 1)\n\n' +
      'r3 = triage_dependencies({"b": "1.0", "a": "1.0"}, [\n' +
      '    {"id": "Z", "package": "b", "affected_below": "2.0", "severity": "high"},\n' +
      '    {"id": "Y", "package": "a", "affected_below": "2.0", "severity": "high"},\n' +
      '])\n' +
      '__check__("same severity sorts by package name next", [f["package"] for f in r3], ["a", "b"])\n\n' +
      RUNNER,
  },
  {
    id: 'py-agent-13',
    title: 'Agent: Misinformation Origin Tracer',
    difficulty: 'Hard',
    language: 'python',
    category: 'AI Agents',
    prompt:
      'When a false claim spreads on social media, the useful questions are "where did it start?", ' +
      '"how far did it reach?", and "did more than one account seed it independently?" — the last ' +
      'one is often the sign of a coordinated campaign, not organic spread. Journalists and ' +
      'fact-checkers mostly answer these by hand, one screenshot at a time.\n\n' +
      'Write trace_claim_origin(shares) where shares is a list of {"user": str, "time": int, ' +
      '"from": str or None}: "from" is the user this person saw the claim from, or None if they ' +
      'posted it without a known source (a root).\n\n' +
      '- If there are no roots at all, return {"origin": None, "reach": 0, "depth": 0, ' +
      '"other_roots": []}.\n' +
      '- The origin is the user of the root share with the earliest "time" (if two roots tie on ' +
      'time, the one that appears first in the list).\n' +
      '- reach is how many distinct users are reachable from the origin by following "from" links ' +
      'downward, counting the origin itself.\n' +
      '- depth is the longest chain length from the origin (the origin is depth 0, someone who ' +
      'shared directly from the origin is depth 1, and so on).\n' +
      '- other_roots is a sorted list of the users of every OTHER root share — independent seeders ' +
      'who are not the origin.\n' +
      '- Return {"origin": ..., "reach": ..., "depth": ..., "other_roots": [...]}.',
    starterCode:
      'def trace_claim_origin(shares):\n' +
      '    # TODO: find roots (from is None); pick the earliest as the origin; build a children map\n' +
      '    # from the "from" links; walk it level by level from the origin to get reach and depth;\n' +
      '    # report every other root as other_roots\n' +
      '    pass\n',
    hints: [
      'roots = [s for s in shares if s["from"] is None]; if not roots, return the empty result immediately.',
      'min(roots, key=lambda s: s["time"]) picks the earliest root — and min() returns the FIRST one it sees on a tie, which is exactly the tie-break the task asks for.',
      'Build children = {} by looping shares and, for every share with a non-None "from", doing children.setdefault(s["from"], []).append(s["user"]).',
      'Walk breadth-first from the origin: keep a visited set (so a cycle can never loop forever), a frontier list, and bump depth each time a level produces new users.',
      'reach = len(visited) once the walk is done; other_roots = sorted(user for every root whose user is not the origin).',
    ],
    solution:
      'def trace_claim_origin(shares):\n' +
      '    roots = [s for s in shares if s["from"] is None]\n' +
      '    if not roots:\n' +
      '        return {"origin": None, "reach": 0, "depth": 0, "other_roots": []}\n\n' +
      '    origin = min(roots, key=lambda s: s["time"])["user"]\n\n' +
      '    children = {}\n' +
      '    for s in shares:\n' +
      '        if s["from"] is not None:\n' +
      '            children.setdefault(s["from"], []).append(s["user"])\n\n' +
      '    visited = {origin}\n' +
      '    frontier = [origin]\n' +
      '    depth = 0\n' +
      '    while True:\n' +
      '        nxt = []\n' +
      '        for u in frontier:\n' +
      '            for c in children.get(u, []):\n' +
      '                if c not in visited:\n' +
      '                    visited.add(c)\n' +
      '                    nxt.append(c)\n' +
      '        if not nxt:\n' +
      '            break\n' +
      '        depth += 1\n' +
      '        frontier = nxt\n\n' +
      '    other_roots = sorted(s["user"] for s in roots if s["user"] != origin)\n' +
      '    return {"origin": origin, "reach": len(visited), "depth": depth, "other_roots": other_roots}\n',
    testCode:
      HEADER +
      'shares = [\n' +
      '    {"user": "a", "time": 1, "from": None},\n' +
      '    {"user": "b", "time": 2, "from": "a"},\n' +
      '    {"user": "c", "time": 3, "from": "a"},\n' +
      '    {"user": "d", "time": 4, "from": "b"},\n' +
      '    {"user": "e", "time": 5, "from": "d"},\n' +
      '    {"user": "z", "time": 3, "from": None},\n' +
      '    {"user": "y", "time": 4, "from": "z"},\n' +
      ']\n' +
      'r = trace_claim_origin(shares)\n' +
      '__check__("origin is the earliest root", r["origin"], "a")\n' +
      '__check__("reach counts the origin plus everyone downstream (a,b,c,d,e)", r["reach"], 5)\n' +
      '__check__("depth is the longest chain: a -> b -> d -> e", r["depth"], 3)\n' +
      '__check__("the independent second seeder is reported", r["other_roots"], ["z"])\n\n' +
      '__check__("empty input", trace_claim_origin([]), {"origin": None, "reach": 0, "depth": 0, "other_roots": []})\n' +
      '__check__("no roots at all", trace_claim_origin([{"user": "b", "time": 1, "from": "a"}])["origin"], None)\n\n' +
      'tie = [\n' +
      '    {"user": "p", "time": 5, "from": None},\n' +
      '    {"user": "q", "time": 5, "from": None},\n' +
      ']\n' +
      'r2 = trace_claim_origin(tie)\n' +
      '__check__("a time tie between roots goes to the one listed first", (r2["origin"], r2["other_roots"]), ("p", ["q"]))\n\n' +
      'r3 = trace_claim_origin([{"user": "solo", "time": 1, "from": None}])\n' +
      '__check__("a lone poster has reach 1 and depth 0", (r3["reach"], r3["depth"]), (1, 0))\n\n' +
      'cyc = [\n' +
      '    {"user": "a", "time": 1, "from": None},\n' +
      '    {"user": "b", "time": 2, "from": "a"},\n' +
      '    {"user": "a", "time": 3, "from": "b"},\n' +
      ']\n' +
      '__check__("a share cycle cannot loop forever", trace_claim_origin(cyc)["reach"], 2)\n\n' +
      RUNNER,
  },
];
