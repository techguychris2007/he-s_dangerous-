import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const bugBountyAdvancedLabs: LabScenario[] = [
  {
    id: 'bb-subdomain-takeover',
    title: 'Bug Bounty: Subdomain Takeover via Dangling CNAME',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s DNS still has a CNAME record for old-promo.meridiancorp.example pointing at a cloud ' +
      'hosting provider resource that was deleted months ago. Whoever claims that resource name on the cloud ' +
      'provider now controls whatever old-promo.meridiancorp.example resolves to — one of the most commonly ' +
      'disclosed, high-signal bug bounty finding categories, because scanners like to flag it but confirming ' +
      'actual impact still takes a human.',
    objectives: [
      { text: 'Scan 10.10.108.1 (simulating the dangling subdomain) and check what it serves', why: 'A dangling CNAME often still resolves and serves SOMETHING — usually a "not claimed" placeholder page from the hosting provider, which is the first tell.' },
      { text: 'Confirm the resource is unclaimed by requesting /claim-status', why: 'This step mirrors checking the actual hosting provider dashboard/API for whether the resource name is available to register — the deciding factor between "interesting" and "exploitable."' },
      { text: 'Retrieve the proof-of-concept confirmation and capture the flag', why: 'Reports in this category are paid based on demonstrated impact (e.g., serving attacker content on the company\'s own subdomain) — not just "the CNAME points somewhere odd," which is why confirming claimability matters so much in triage.' },
    ],
    hints: [
      'nmap -sV 10.10.108.1',
      'curl 10.10.108.1/',
      'curl 10.10.108.1/claim-status',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'old-promo', ip: '10.10.108.1', os: 'Cloud hosting placeholder',
        services: [{
          port: 80, name: 'http', version: 'Cloud static hosting (unclaimed resource)',
          http: {
            '/': '<html><body><h1>404 — This resource is not claimed</h1></body></html>',
            '/claim-status': '{"resource":"old-promo-meridiancorp","claimable":true,"note":"flag{dangling_cname_unclaimed_resource_takeover}"}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-graphql-introspection-idor',
    title: 'Bug Bounty: GraphQL Introspection to IDOR',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s mobile app talks to a GraphQL API left with introspection enabled in production — a ' +
      'very common real finding, since introspection is meant for development only. It reveals fields and ' +
      'queries never documented publicly, including an admin-only field the frontend never uses but the ' +
      'server still honors from any authenticated (or here, any) request.',
    objectives: [
      { text: 'Query the GraphQL introspection endpoint to map the schema', why: 'Introspection dumps the entire API surface — every type, field, and query — turning a black-box API into a fully documented one for free.' },
      { text: 'Identify the undocumented adminNotes field on the User type', why: 'Fields that exist in the schema but aren\'t used by the official app are a classic sign of leftover internal tooling never properly access-controlled.' },
      { text: 'Query a user profile including adminNotes and capture the leaked flag', why: 'This is IDOR by a different name — the API trusts the query shape you send rather than checking whether YOU are authorized to see that specific field for that specific user.' },
    ],
    hints: [
      'curl -H "User-Agent: test" 10.10.108.2/graphql?introspect=true',
      'The schema reveals a field called adminNotes on the User type that the public app never queries.',
      'curl "10.10.108.2/graphql?query=adminNotes&id=1"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'graphql-api', ip: '10.10.108.2', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'Apollo GraphQL Server 3.6',
          http: { '/': '<html><body><h1>Meridian GraphQL API</h1></body></html>' },
          vulnRoutes: [{
            kind: 'idor', path: '/graphql', param: 'query',
            triggerSubstrings: ['adminnotes'],
            vulnerableResponse: '{"id":1,"adminNotes":"VIP customer, do not suspend. Internal risk score: 2. flag{graphql_introspection_leaks_undocumented_field}"}',
            normalResponse: '{"types":["User","Order","Product"],"userFields":["id","name","email","adminNotes"],"note":"adminNotes is undocumented and unused by the official app"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-oauth-redirect-bypass',
    title: 'Bug Bounty: OAuth redirect_uri Validation Bypass',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s "Login with Meridian" OAuth flow validates redirect_uri with a simple substring check ' +
      'instead of an exact match — a widely reported real vulnerability pattern. This lets an attacker ' +
      'register a lookalike domain, or in this lab\'s case, simply append their own domain after the ' +
      'legitimate one, to redirect the victim\'s authorization code to an attacker-controlled endpoint.',
    objectives: [
      { text: 'Request the OAuth authorize endpoint with the legitimate redirect_uri to see normal behavior', why: 'Establishes what a properly-scoped request looks like before probing the validation logic.' },
      { text: 'Test whether validation is a substring check by appending an attacker domain after the trusted one', why: 'A shockingly common real implementation mistake is checking "does redirect_uri START WITH/CONTAIN our domain" instead of "does it EXACTLY MATCH one of our registered redirect URIs" — the difference between those two checks is the entire vulnerability.' },
      { text: 'Confirm the authorization code redirects to the attacker domain and capture the flag', why: 'A stolen authorization code can be exchanged for a real access token — this is how OAuth redirect validation bugs lead directly to full account takeover in bug bounty reports.' },
    ],
    hints: [
      'curl "10.10.108.3/oauth/authorize?redirect_uri=https://meridiancorp.example/callback"',
      'curl "10.10.108.3/oauth/authorize?redirect_uri=https://meridiancorp.example.attacker-evil.example/callback"',
      'If the second request is still accepted, the validation is a prefix/substring check, not an exact match.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'oauth-provider', ip: '10.10.108.3', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {},
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/oauth/authorize', param: 'redirect_uri',
            triggerSubstrings: ['.attacker-evil.example', '.attacker.example', 'evil.example'],
            vulnerableResponse: '{"status":"redirecting","to":"https://meridiancorp.example.attacker-evil.example/callback?code=AUTH_CODE_LEAKED","flag":"flag{oauth_redirect_uri_substring_validation_bypass}"}',
            normalResponse: '{"status":"redirecting","to":"https://meridiancorp.example/callback?code=AUTH_CODE_abc123"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-race-condition-coupon',
    title: 'Bug Bounty: Race Condition in Coupon Redemption',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s checkout applies single-use coupon codes, but the "already redeemed" check and the ' +
      '"mark as redeemed" write happen as two separate steps with no locking between them — a textbook race ' +
      'condition. Sending the redemption request many times at once, before the first one finishes writing ' +
      '"redeemed," lets several of them pass the check simultaneously, redeeming a one-time coupon repeatedly. ' +
      'This category of bug (Time-Of-Check-To-Time-Of-Use) has paid out real five-figure bounties on major ' +
      'e-commerce and fintech programs.',
    objectives: [
      { text: 'Redeem the coupon once normally to confirm it works', why: 'Confirms the coupon is valid and single-use under normal conditions before testing the race.' },
      { text: 'Send the redemption request rapidly, simulating concurrent requests, using the special "burst" flag this lab exposes', why: 'In a real test this means firing 20-50 identical requests within milliseconds using a tool like Burp\'s Turbo Intruder — this lab simplifies that to a single repeatable trigger so you can focus on the underlying concept: check-then-act without a lock is unsafe.' },
      { text: 'Confirm the coupon was redeemed multiple times and capture the flag', why: 'This is exactly the kind of bug automated scanners never find — it requires understanding the business logic and timing, not just fuzzing inputs.' },
    ],
    hints: [
      'curl "10.10.108.4/redeem?code=SAVE50"',
      'curl "10.10.108.4/redeem?code=SAVE50&burst=true"  — this lab represents a burst of concurrent requests with this flag.',
      'A vulnerable response shows the coupon being redeemed more than once.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'checkout-svc', ip: '10.10.108.4', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'Node.js / Express 4.18',
          http: {},
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/redeem', param: 'burst',
            triggerSubstrings: ['true'],
            vulnerableResponse: '{"redeemed_count":6,"expected":1,"note":"race condition allowed 6 concurrent redemptions of a single-use coupon","flag":"flag{race_condition_toctou_coupon_redeemed_6_times}"}',
            normalResponse: '{"redeemed_count":1,"expected":1,"note":"redeemed normally"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'bb-blind-ssrf-report',
    title: 'Bug Bounty: Blind SSRF via PDF Export Feature',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'Meridian Corp\'s "export to PDF" feature renders a URL you provide into a PDF server-side using a ' +
      'headless browser. Unlike the earlier SSRF labs where you could see the response directly, this one is ' +
      '"blind" — the PDF is emailed to you asynchronously, and the only feedback you get is a status code. ' +
      'Blind SSRF is one of the trickiest real bug bounty categories to prove impact on, since you can\'t just ' +
      'read the response back.',
    objectives: [
      { text: 'Submit a normal external URL to the export feature and note the response', why: 'Blind vulnerabilities require you to characterize "normal" behavior carefully, since you won\'t get rich feedback from the exploit itself.' },
      { text: 'Submit an internal URL (an internal admin panel address) as the export target', why: 'Even without seeing the rendered PDF content, a different status code or timing between "reachable internal host" and "unreachable" is often the only confirmation a blind SSRF is real.' },
      { text: 'Read the confirmation status difference and capture the flag', why: 'In real disclosed reports, researchers often had to get creative — DNS callbacks, timing differences, or out-of-band interaction — to prove a blind SSRF was genuinely reaching internal infrastructure.' },
    ],
    hints: [
      'curl "10.10.108.5/export/pdf?url=https://example.com"',
      'curl "10.10.108.5/export/pdf?url=http://10.0.0.5:8080/admin"',
      'Compare the two responses carefully — one confirms the internal host was reached even though you never see its content.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'export-svc', ip: '10.10.108.5', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'Node.js (Puppeteer headless renderer)',
          http: {},
          vulnRoutes: [{
            kind: 'ssrf', path: '/export/pdf', param: 'url',
            triggerSubstrings: ['10.0.0.', '192.168.', 'internal', 'localhost', '127.0.0.1'],
            vulnerableResponse: '{"status":"queued","render_time_ms":842,"internal_reachable":true,"flag":"flag{blind_ssrf_confirmed_via_internal_reachability}"}',
            normalResponse: '{"status":"queued","render_time_ms":210,"internal_reachable":false}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
