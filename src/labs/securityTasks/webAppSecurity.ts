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
];
