import type { CodeTask } from '../codeTypes';

export const SECURITY_WEBAPP_TASKS: CodeTask[] = [
  {
    id: 'sec-webapp-01',
    title: 'Fix a Real Stored XSS with Output Escaping',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'Stored cross-site scripting is one of the OWASP Top 10\'s oldest, most common bug classes: a ' +
      'comment box (or any user-supplied text) gets inserted straight into an HTML page with no escaping, ' +
      'so a comment containing a <script> tag runs as real, executing JavaScript for every visitor who ' +
      'views it — not just the person who posted it.\n\n' +
      'render_comment_vulnerable(comment) is given and IS vulnerable — study it, it builds HTML by ' +
      'directly interpolating the raw comment text. Then write render_comment_safe(comment): produce the ' +
      'exact same HTML structure, but pass the comment through Python\'s real html.escape() before ' +
      'inserting it, so any HTML special characters (<, >, &, quotes) are converted to their harmless ' +
      'entity form instead of being interpreted as markup.',
    starterCode:
      '# Given, and deliberately vulnerable — do NOT copy this pattern in real code.\n' +
      'def render_comment_vulnerable(comment):\n' +
      '    return f"<div class=\'comment\'>{comment}</div>"\n\n' +
      'def render_comment_safe(comment):\n' +
      '    # TODO: same HTML structure as above, but with the comment run through html.escape() first\n' +
      '    pass\n',
    hints: [
      'import html at the top, then html.escape(comment) converts <, >, &, and quote characters into their safe HTML-entity equivalents.',
      'The output structure must match exactly: "<div class=\'comment\'>" + escaped text + "</div>" — only the escaping step differs from the vulnerable version.',
      'Escaping does not change ordinary text at all — html.escape("nice post!") returns "nice post!" unchanged, since there is nothing to escape.',
    ],
    solution:
      'import html\n\n' +
      'def render_comment_vulnerable(comment):\n' +
      '    return f"<div class=\'comment\'>{comment}</div>"\n\n' +
      'def render_comment_safe(comment):\n' +
      '    return f"<div class=\'comment\'>{html.escape(comment)}</div>"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'payload = "<script>stealCookies()</script>"\n' +
      '__check__("vulnerable version embeds the script tag unescaped", render_comment_vulnerable(payload), f"<div class=\'comment\'>{payload}</div>")\n' +
      '__check__(\n' +
      '    "safe version escapes the script tag",\n' +
      '    render_comment_safe(payload),\n' +
      '    "<div class=\'comment\'>&lt;script&gt;stealCookies()&lt;/script&gt;</div>",\n' +
      ')\n' +
      '__check__("safe version leaves plain text untouched", render_comment_safe("nice post!"), "<div class=\'comment\'>nice post!</div>")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-02',
    title: 'Block Server-Side Request Forgery with URL Validation',
    difficulty: 'Hard',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'SSRF happens when a server fetches a URL an attacker controls (a "fetch this image from a URL" ' +
      'feature is a classic case) without checking where that URL actually points. A real, well-known ' +
      'target: cloud providers expose an internal metadata endpoint at 169.254.169.254 that can leak ' +
      'credentials — if your server will obligingly fetch any URL it\'s given, an attacker just points it ' +
      'there instead of a real image.\n\n' +
      'Write is_safe_fetch_url(url) that returns True only if a URL is safe for a server to fetch on a ' +
      'user\'s behalf:\n' +
      '- Reject anything that isn\'t the "http" or "https" scheme\n' +
      '- Reject if the hostname is exactly "localhost"\n' +
      '- Reject if the hostname is a literal IP address that is private, loopback, link-local, or ' +
      'otherwise reserved (this covers 127.0.0.1, 10.x/172.16.x/192.168.x private ranges, and the ' +
      '169.254.x.x link-local range the cloud metadata service uses)\n' +
      '- Otherwise, allow it',
    starterCode:
      'import ipaddress\n' +
      'from urllib.parse import urlparse\n\n' +
      'def is_safe_fetch_url(url):\n' +
      '    # TODO: parse the URL, reject bad schemes/localhost/private-and-reserved IP literals\n' +
      '    pass\n',
    hints: [
      'urlparse(url) gives you .scheme and .hostname without any manual string splitting.',
      'ipaddress.ip_address(hostname) parses an IP-literal hostname into an object with real .is_private / .is_loopback / .is_link_local / .is_reserved flags — it raises ValueError if the hostname is a domain name instead, which you should catch and treat as "not an IP, so this specific check doesn\'t apply."',
      'Check scheme and the "localhost" special case first, before attempting the IP-address parsing — a domain name should fall through to being allowed once it clears those checks.',
    ],
    solution:
      'import ipaddress\n' +
      'from urllib.parse import urlparse\n\n' +
      'def is_safe_fetch_url(url):\n' +
      '    parsed = urlparse(url)\n' +
      '    if parsed.scheme not in ("http", "https"):\n' +
      '        return False\n' +
      '    hostname = parsed.hostname\n' +
      '    if not hostname:\n' +
      '        return False\n' +
      '    if hostname == "localhost":\n' +
      '        return False\n' +
      '    try:\n' +
      '        ip = ipaddress.ip_address(hostname)\n' +
      '        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:\n' +
      '            return False\n' +
      '    except ValueError:\n' +
      '        pass\n' +
      '    return True\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("blocks the cloud metadata endpoint", is_safe_fetch_url("http://169.254.169.254/latest/meta-data"), False)\n' +
      '__check__("blocks loopback", is_safe_fetch_url("http://127.0.0.1:8080/admin"), False)\n' +
      '__check__("blocks localhost by name", is_safe_fetch_url("http://localhost/internal"), False)\n' +
      '__check__("blocks private range", is_safe_fetch_url("http://10.0.0.5/"), False)\n' +
      '__check__("blocks non-http scheme", is_safe_fetch_url("file:///etc/passwd"), False)\n' +
      '__check__("allows a normal public API", is_safe_fetch_url("https://api.example.com/data"), True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-03',
    title: 'Prevent Path Traversal in File Downloads',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'A "download this file" feature that naively joins a user-supplied filename onto a base directory ' +
      'is a real, classic vulnerability: a filename like "../../etc/passwd" walks straight out of the ' +
      'intended folder using ordinary ".." path segments. The real-world fix is to normalize the ' +
      'resulting path and verify it still lives inside the base directory before touching the file.\n\n' +
      'Write resolve_safe_path(base_dir, user_path) using Python\'s real posixpath module. Join base_dir ' +
      'and user_path, then normalize the result (collapsing any "." and ".." segments) with ' +
      'posixpath.normpath. If the normalized path is base_dir itself or starts with base_dir followed by ' +
      'a "/", return that normalized path (as a string). Otherwise — the path escaped the base directory ' +
      '— return None.',
    starterCode:
      'import posixpath\n\n' +
      'def resolve_safe_path(base_dir, user_path):\n' +
      '    # TODO: join + normalize base_dir/user_path, return it only if still inside base_dir, else None\n' +
      '    pass\n',
    hints: [
      'posixpath.join(base_dir, user_path) combines them; posixpath.normpath(...) then collapses ".." segments the same way a real filesystem would resolve them — no actual file or directory needs to exist for this.',
      'Normalize base_dir too (posixpath.normpath(base_dir)) before comparing, so trailing slashes or redundant segments in the input don\'t cause a false mismatch.',
      'The containment check needs both an exact-match case (user_path resolves to the base dir itself) and a prefix-with-slash case (target == base or target.startswith(base + "/")) — checking startswith(base) alone would wrongly allow a sibling directory like "/var/www/uploads-secret".',
    ],
    solution:
      'import posixpath\n\n' +
      'def resolve_safe_path(base_dir, user_path):\n' +
      '    target = posixpath.normpath(posixpath.join(base_dir, user_path))\n' +
      '    base = posixpath.normpath(base_dir)\n' +
      '    if target == base or target.startswith(base + "/"):\n' +
      '        return target\n' +
      '    return None\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("normal filename resolves inside base dir", resolve_safe_path("/var/www/uploads", "report.pdf"), "/var/www/uploads/report.pdf")\n' +
      '__check__("classic .. traversal is blocked", resolve_safe_path("/var/www/uploads", "../../etc/passwd"), None)\n' +
      '__check__(\n' +
      '    "subdir/../file that still resolves inside is allowed",\n' +
      '    resolve_safe_path("/var/www/uploads", "subdir/../report.pdf"),\n' +
      '    "/var/www/uploads/report.pdf",\n' +
      ')\n' +
      '__check__(\n' +
      '    "deeply nested legitimate path is allowed",\n' +
      '    resolve_safe_path("/var/www/uploads", "2026/07/photo.jpg"),\n' +
      '    "/var/www/uploads/2026/07/photo.jpg",\n' +
      ')\n' +
      '__check__("sneaky traversal that still escapes is blocked", resolve_safe_path("/var/www/uploads", "subdir/../../secrets.txt"), None)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-04',
    title: 'Forge a JWT "alg:none" Token — and Detect the Attack',
    difficulty: 'Hard',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'A real, historically widespread JWT vulnerability class: the JWT spec allows a header of ' +
      '{"alg": "none"}, meaning "this token isn\'t signed at all" — and for years, several popular JWT ' +
      'libraries would happily verify (accept) such a token without checking that the server actually ' +
      'intended to allow unsigned tokens. An attacker who can see a legitimate token just needs to build ' +
      'their own token claiming to be an admin, set alg to "none", and leave the signature empty.\n\n' +
      'Write two functions. forge_none_alg_token(payload) builds a real, spec-compliant unsigned JWT: a ' +
      'header of {"alg": "none", "typ": "JWT"} and your payload dict, each JSON-encoded then base64url-' +
      'encoded (no padding "=" characters), joined as "header.payload." — note the trailing dot with ' +
      'nothing after it, since there is no signature. is_none_alg_token(token) decodes just the header ' +
      'segment of any JWT and returns True if its "alg" field is "none" (case-insensitive) — this is the ' +
      'exact check a server must perform and reject, and the one vulnerable libraries skipped.',
    starterCode:
      'import base64\n' +
      'import json\n\n' +
      'def _b64url_encode(data: bytes) -> str:\n' +
      '    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\n' +
      'def _b64url_decode(s: str) -> bytes:\n' +
      '    padding = "=" * (-len(s) % 4)\n' +
      '    return base64.urlsafe_b64decode(s + padding)\n\n' +
      'def forge_none_alg_token(payload):\n' +
      '    # TODO: build "header.payload." with alg:none and no signature\n' +
      '    pass\n\n' +
      'def is_none_alg_token(token):\n' +
      '    # TODO: decode just the header segment, check alg (case-insensitively) == "none"\n' +
      '    pass\n',
    hints: [
      'The header dict is always {"alg": "none", "typ": "JWT"} — json.dumps it with separators=(",", ":") (no spaces, matching how real JWT libraries compact-encode), then pass the resulting bytes through _b64url_encode.',
      'Do the same JSON+base64url step for the payload dict, then join as f"{header_b64}.{payload_b64}." — the trailing dot is required, it marks an empty (present but zero-length) signature segment.',
      'is_none_alg_token only needs the first segment: token.split(".")[0], run through _b64url_decode and json.loads, then check header.get("alg", "").lower() == "none".',
    ],
    solution:
      'import base64\n' +
      'import json\n\n' +
      'def _b64url_encode(data: bytes) -> str:\n' +
      '    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\n' +
      'def _b64url_decode(s: str) -> bytes:\n' +
      '    padding = "=" * (-len(s) % 4)\n' +
      '    return base64.urlsafe_b64decode(s + padding)\n\n' +
      'def forge_none_alg_token(payload):\n' +
      '    header = {"alg": "none", "typ": "JWT"}\n' +
      '    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())\n' +
      '    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())\n' +
      '    return f"{header_b64}.{payload_b64}."\n\n' +
      'def is_none_alg_token(token):\n' +
      '    header_b64 = token.split(".")[0]\n' +
      '    header = json.loads(_b64url_decode(header_b64))\n' +
      '    return header.get("alg", "").lower() == "none"\n',
    testCode:
      'import json\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'forged = forge_none_alg_token({"user": "admin", "role": "admin"})\n' +
      '__check__("forged token is recognized as alg:none", is_none_alg_token(forged), True)\n' +
      '__check__("forged token has an empty trailing signature segment", forged.endswith("."), True)\n' +
      '__check__("forged token has exactly 3 dot-separated segments", len(forged.split(".")), 3)\n\n' +
      'payload_b64 = forged.split(".")[1]\n' +
      'padding = "=" * (-len(payload_b64) % 4)\n' +
      'import base64\n' +
      'recovered_payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding))\n' +
      '__check__("forged payload round-trips correctly", recovered_payload, {"user": "admin", "role": "admin"})\n\n' +
      'normal_token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYm9iIn0.somesignature"\n' +
      '__check__("a normally-signed token is not flagged as alg:none", is_none_alg_token(normal_token), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-05',
    title: 'Detect HTTP Request Smuggling Signals (CL.TE)',
    difficulty: 'Hard',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'HTTP request smuggling happens when a front-end proxy and a back-end server disagree about where ' +
      'one HTTP request ends and the next begins — usually because both a Content-Length header (which ' +
      'says "the body is N bytes") and a Transfer-Encoding: chunked header (which says "read chunks until ' +
      'a zero-length chunk") are present, and the two servers in the chain trust different ones. This ' +
      'ambiguity (CL.TE or TE.CL, depending on which server trusts which header) is exactly what a real ' +
      'smuggling scanner looks for.\n\n' +
      'Write find_smuggling_signals(headers) where headers is a list of (name, value) tuples exactly as ' +
      'they appeared on the wire (preserving any duplicates and original casing). Return a list of short ' +
      'human-readable reason strings describing any smuggling-risky pattern found:\n' +
      '- If "Content-Length" appears more than once (case-insensitively) with two different values, add ' +
      '"duplicate Content-Length headers with different values"\n' +
      '- If both "Content-Length" and "Transfer-Encoding" are present (case-insensitively) at all, add ' +
      '"both Content-Length and Transfer-Encoding present (CL.TE/TE.CL ambiguity)"\n' +
      'Return an empty list for a clean request with neither pattern.',
    starterCode:
      'def find_smuggling_signals(headers):\n' +
      '    # TODO: headers is a list of (name, value) tuples — check for CL/TE ambiguity signals\n' +
      '    pass\n',
    hints: [
      'Build names_lower = [n.lower() for n, v in headers] once, then use it for both checks.',
      'For the duplicate-Content-Length check: names_lower.count("content-length") > 1, then collect the actual values for those entries and check len(set(values)) > 1 (values are the same by coincidence sometimes, and that\'s not the interesting case).',
      'For the CL/TE ambiguity check, it doesn\'t matter how many of each there are — just whether "content-length" and "transfer-encoding" both appear anywhere in names_lower.',
    ],
    solution:
      'def find_smuggling_signals(headers):\n' +
      '    names_lower = [n.lower() for n, v in headers]\n' +
      '    reasons = []\n' +
      '    if names_lower.count("content-length") > 1:\n' +
      '        cls = [v for n, v in headers if n.lower() == "content-length"]\n' +
      '        if len(set(cls)) > 1:\n' +
      '            reasons.append("duplicate Content-Length headers with different values")\n' +
      '    if "content-length" in names_lower and "transfer-encoding" in names_lower:\n' +
      '        reasons.append("both Content-Length and Transfer-Encoding present (CL.TE/TE.CL ambiguity)")\n' +
      '    return reasons\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'clean = [("Host", "example.com"), ("Content-Length", "10")]\n' +
      '__check__("clean request has no signals", find_smuggling_signals(clean), [])\n\n' +
      'clte = [("Host", "example.com"), ("Content-Length", "13"), ("Transfer-Encoding", "chunked")]\n' +
      '__check__("CL+TE ambiguity is flagged", len(find_smuggling_signals(clte)), 1)\n\n' +
      'dupcl = [("Content-Length", "10"), ("Content-Length", "20")]\n' +
      '__check__("conflicting duplicate Content-Length is flagged", len(find_smuggling_signals(dupcl)), 1)\n\n' +
      'dupcl_same = [("Content-Length", "10"), ("Content-Length", "10")]\n' +
      '__check__("identical duplicate Content-Length is not flagged", find_smuggling_signals(dupcl_same), [])\n\n' +
      'both = [("Content-Length", "10"), ("Content-Length", "20"), ("Transfer-Encoding", "chunked")]\n' +
      '__check__("both patterns at once yields two reasons", len(find_smuggling_signals(both)), 2)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-06',
    title: 'Validate a CSRF Token Safely',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'Cross-Site Request Forgery works because a browser automatically attaches a user\'s cookies to ' +
      'requests from any site, including a malicious one — so a form on an attacker\'s page can trigger a ' +
      'real, authenticated action on your site without the user ever meaning to. The standard defense is a ' +
      'CSRF token: a secret value stored server-side per session and required on every state-changing ' +
      'request, which an attacker\'s page has no way to read or guess.\n\n' +
      'Write is_valid_csrf_token(session_token, submitted_token) that returns True only if both values are ' +
      'non-empty and match exactly, using a constant-time comparison (this is the same real timing-attack ' +
      'concern as comparing password hashes — never use == for a security-sensitive comparison).',
    starterCode:
      'import hmac\n\n' +
      'def is_valid_csrf_token(session_token, submitted_token):\n' +
      '    # TODO: reject empty values, then compare safely with hmac.compare_digest\n' +
      '    pass\n',
    hints: [
      'Check both session_token and submitted_token are truthy (non-empty) first — an empty session token should never be treated as "no CSRF protection needed."',
      'hmac.compare_digest(session_token, submitted_token) is the correct, constant-time way to compare the two — the same tool used for comparing password hashes and API keys.',
      'Both early-exit checks and the final comparison all need to hold for the function to return True — short-circuit to False the moment either token is missing.',
    ],
    solution:
      'import hmac\n\n' +
      'def is_valid_csrf_token(session_token, submitted_token):\n' +
      '    if not session_token or not submitted_token:\n' +
      '        return False\n' +
      '    return hmac.compare_digest(session_token, submitted_token)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("matching tokens are valid", is_valid_csrf_token("tok123", "tok123"), True)\n' +
      '__check__("mismatched tokens are rejected", is_valid_csrf_token("tok123", "tok124"), False)\n' +
      '__check__("missing submitted token is rejected", is_valid_csrf_token("tok123", ""), False)\n' +
      '__check__("missing session token is rejected", is_valid_csrf_token("", "tok123"), False)\n' +
      '__check__("both missing is rejected", is_valid_csrf_token("", ""), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-webapp-07',
    title: 'Prevent Open Redirect Phishing Chains',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Web Application Security (OWASP)',
    prompt:
      'A "log in, then redirect back to where you were" feature is a classic real target: if the redirect ' +
      'destination is taken straight from a URL parameter with no validation, an attacker crafts a link to ' +
      'your real, trusted login page that redirects the victim to a phishing site right after — the URL bar ' +
      'shows your legitimate domain the whole time the user is entering credentials, which is exactly what ' +
      'makes open-redirect-based phishing so effective.\n\n' +
      'Write is_safe_redirect(url, allowed_hosts) where allowed_hosts is a set of hostnames your app ' +
      'controls. Parse the URL: if it has a scheme, reject anything other than "http"/"https" (this blocks ' +
      'tricks like "javascript:alert(1)"). A relative URL (no netloc/host at all, like "/dashboard") is ' +
      'always safe since it can only point within your own site. Otherwise, allow it only if its netloc ' +
      'is exactly in allowed_hosts.',
    starterCode:
      'from urllib.parse import urlparse\n\n' +
      'def is_safe_redirect(url, allowed_hosts):\n' +
      '    # TODO: reject non-http(s) schemes; allow relative URLs; check absolute URLs against allowed_hosts\n' +
      '    pass\n',
    hints: [
      'urlparse(url) gives you .scheme (empty string for a relative URL like "/dashboard") and .netloc (the host[:port] part, also empty for a relative URL).',
      'Reject early if parsed.scheme is truthy AND not in ("http", "https") — this catches "javascript:", "data:", and similar scheme-based tricks.',
      'If parsed.netloc is empty, the URL is relative (no host at all) and is always safe to allow. Otherwise, the only safe case is parsed.netloc being exactly one of allowed_hosts — note this also correctly rejects a protocol-relative URL like "//evil.com/phish", since its netloc is "evil.com".',
    ],
    solution:
      'from urllib.parse import urlparse\n\n' +
      'def is_safe_redirect(url, allowed_hosts):\n' +
      '    parsed = urlparse(url)\n' +
      '    if parsed.scheme and parsed.scheme not in ("http", "https"):\n' +
      '        return False\n' +
      '    if not parsed.netloc:\n' +
      '        return True\n' +
      '    return parsed.netloc in allowed_hosts\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'allowed = {"app.example.com", "www.example.com"}\n' +
      '__check__("relative path is always safe", is_safe_redirect("/dashboard", allowed), True)\n' +
      '__check__("allowed absolute host is safe", is_safe_redirect("https://app.example.com/home", allowed), True)\n' +
      '__check__("unrelated external host is blocked", is_safe_redirect("https://evil.com/phish", allowed), False)\n' +
      '__check__("protocol-relative URL to an external host is blocked", is_safe_redirect("//evil.com/phish", allowed), False)\n' +
      '__check__("javascript: scheme is blocked", is_safe_redirect("javascript:alert(1)", allowed), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
