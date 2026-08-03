import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 21, part 2: Security+ (ARP cache poisoning, typosquatting domain phishing, a rogue trusted root CA)
 *  and Security Engineering (a never-expiring pre-signed URL, a verbose error stack-trace leak, a debug
 *  feature flag left enabled in production). Both tied for this platform's next-thinnest categories after
 *  Cryptography and API (18 labs each) -- see labs-index.md. Every technique researched via WebSearch before
 *  writing -- see NOTES.md batch 21 for citations. */
export const batch21SecplusSecengineeringLabs: LabScenario[] = [
  // 1 — Security+: ARP Cache Poisoning Enables an On-Path Credential-Capture Attack
  {
    id: 'secplus-arp-cache-poisoning-mitm-credential-capture',
    title: 'Security+: ARP Cache Poisoning Enables an On-Path Credential-Capture Attack',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'A workstation on the accounting VLAN is sending unsolicited, unrequested ARP replies claiming the ' +
      'default gateway\'s IP address maps to ITS OWN MAC address -- ARP has no authentication of any kind, so ' +
      'every other host on the segment updates its ARP cache to match without ever verifying the claim, ' +
      'exactly the real, standard ARP spoofing / ARP cache poisoning mechanism used to stand up an on-path ' +
      '(man-in-the-middle) position. Once every host\'s "gateway" entry actually points at the attacker\'s ' +
      'MAC address, all outbound traffic that should have gone straight to the real router routes through the ' +
      'attacker first -- including any plaintext protocol traffic, which the attacker simply reads in transit ' +
      'before forwarding it on so nothing looks broken to the victim.',
    objectives: [
      { text: 'cat arp-table-anomaly-report.txt', why: 'Multiple hosts on the segment show the SAME MAC address bound to the gateway\'s IP -- a MAC address that does not belong to the real router -- and a burst of unsolicited ARP replies with no matching request, the classic ARP spoofing signature.' },
      { text: 'cat intercepted-plaintext-auth-capture.txt', why: 'With the gateway route poisoned, an internal application\'s plaintext HTTP Basic Auth traffic transits through the attacker\'s machine before being forwarded on -- captured directly, no cracking or brute force needed at all.' },
    ],
    hints: [
      'cat arp-table-anomaly-report.txt',
      'cat intercepted-plaintext-auth-capture.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'arp-table-anomaly-report.txt': file(
        'ARP table anomaly report, ACCOUNTING-VLAN (10.20.30.0/24):\n' +
          '  Gateway IP 10.20.30.1 resolves to MAC 00:0c:29:8f:a1:7e on 6 different hosts (should be the\n' +
          '  router\'s own MAC, 00:1a:2b:3c:4d:5e -- these hosts have all been poisoned)\n' +
          '  Traffic capture shows 340+ unsolicited ARP replies from 00:0c:29:8f:a1:7e claiming ownership of\n' +
          '  10.20.30.1, none of them preceded by a matching ARP request -- ARP has no authentication at all,\n' +
          '  so every receiving host updates its cache to match without verifying the claim in any way\n' +
          '  Host owning 00:0c:29:8f:a1:7e: WKSTN-ACCT-07 (should not be routing anything for anyone)\n',
      ),
      'intercepted-plaintext-auth-capture.txt': file(
        'Traffic captured transiting WKSTN-ACCT-07 (poisoned gateway route), destined for the real router:\n' +
          '  GET /internal/invoices HTTP/1.1\n' +
          '  Authorization: Basic am1pbGxlcjpTdW1tZXIyMDI0IQ==\n' +
          '  -- decodes to jmiller:Summer2024! -- plaintext HTTP Basic Auth, captured on-path with no cracking\n' +
          '     or brute force needed, purely because the traffic was routed through the attacker first --\n' +
          '  flag{arp_cache_poisoning_on_path_credential_capture}\n',
      ),
    }),
    network: [],
  },

  // 2 — Security+: A Typosquatting Domain Impersonates a Corporate Login Portal
  {
    id: 'secplus-typosquatting-domain-phishing-lookalike',
    title: 'Security+: A Typosquatting Domain Impersonates a Corporate Login Portal',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'A phishing campaign is using `corp-portall.example` -- one extra "l" -- to impersonate the real ' +
      'employee login portal at `corp-portal.example`. This is typosquatting, distinct from this session\'s ' +
      'existing IDN homograph lab (which swaps in a visually-identical Unicode lookalike CHARACTER, like a ' +
      'Cyrillic "а" for a Latin "a"): typosquatting instead relies on genuinely common HUMAN TYPING/READING ' +
      'errors -- an extra letter, a swapped pair, a missing dash -- registered as an entirely ordinary ASCII ' +
      'domain that requires no special rendering trick to look plausible at a glance. Because Certificate ' +
      'Transparency logging is a mandatory CA/Browser Forum requirement, every certificate ever issued for the ' +
      'lookalike domain is a matter of public record the instant it\'s issued -- exactly how this campaign was ' +
      'first spotted.',
    objectives: [
      { text: 'cat phishing-email-headers.txt', why: 'The email\'s link domain is corp-portall.example -- one character different from the real corp-portal.example -- a genuine typing-error lookalike, not a Unicode homograph.' },
      { text: 'cat certificate-transparency-lookup.txt', why: 'The lookalike domain\'s TLS certificate is real and valid (a free Let\'s Encrypt cert, issued the same day the domain was registered) -- confirming a valid certificate padlock alone proves nothing about which organization actually controls a domain.' },
    ],
    hints: [
      'cat phishing-email-headers.txt',
      'cat certificate-transparency-lookup.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'phishing-email-headers.txt': file(
        'Reported phishing email, subject "Action Required: Password Expiring Today":\n' +
          '  From: IT-Helpdesk@corp-portall.example  (real corporate domain: corp-portal.example -- one extra "l")\n' +
          '  Link text displayed: "Reset your password now"\n' +
          '  Actual href: https://corp-portall.example/reset?token=...\n' +
          '  -- an entirely ordinary ASCII domain, one character different from the real one -- no Unicode\n' +
          '     lookalike character or special rendering trick involved at all, purely a common typo pattern --\n',
      ),
      'certificate-transparency-lookup.txt': file(
        'crt.sh lookup, corp-portall.example:\n' +
          '  Certificate issued: 2026-08-01 (Let\'s Encrypt, domain-validation only)\n' +
          '  Domain registration date: 2026-07-29 (3 days before the certificate, 3 days before this campaign)\n' +
          '  -- Certificate Transparency logging is a mandatory, CA/Browser-Forum-enforced requirement, making\n' +
          '     every issued certificate a matter of public record the instant it\'s issued -- exactly how this\n' +
          '     lookalike domain was caught. A valid padlock/certificate proves ONLY that domain validation\n' +
          '     passed, never that the certificate holder is who they claim to be --\n' +
          '  flag{typosquatting_domain_impersonates_corporate_login_portal}\n',
      ),
    }),
    network: [],
  },

  // 3 — Security+: A Rogue Trusted Root CA Installed on a Managed Device Enables TLS Interception
  {
    id: 'secplus-rogue-trusted-root-ca-tls-interception',
    title: 'Security+: A Rogue Trusted Root CA Installed on a Managed Device Enables TLS Interception',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A laptop\'s trusted root certificate store contains a CA that IT never deployed and has no record of ' +
      'authorizing -- "MeridianContentFilter CA," bundled in silently by a free browser extension the user ' +
      'installed themselves. Once a rogue CA sits in the trusted root store, it can sign a certificate for ' +
      'ANY domain, and the browser will accept it with no warning at all, since the whole point of the trust ' +
      'store is "any certificate chaining up to something in here is automatically trusted." This is a real, ' +
      'currently-tracked technique (MITRE ATT&CK T1553.004, Install Root Certificate) increasingly seen used ' +
      'directly by malware and malicious browser extensions to intercept HTTPS traffic in full -- credentials, ' +
      'session cookies, everything -- with no certificate warning ever shown to the victim, since the ' +
      'interception is happening at a layer the browser has been told, falsely, to fully trust.',
    objectives: [
      { text: 'cat trusted-root-store-audit.txt', why: 'An unauthorized CA, never deployed by IT, sits in this device\'s trusted root store -- silently bundled in by a browser extension the user installed themselves.' },
      { text: 'cat intercepted-tls-session-analysis.txt', why: 'A real banking domain\'s certificate on this device is signed by the rogue CA instead of a real public CA -- proof the rogue CA is actively being used to intercept and re-sign HTTPS traffic in full, with no browser warning shown at all.' },
    ],
    hints: [
      'cat trusted-root-store-audit.txt',
      'cat intercepted-tls-session-analysis.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'trusted-root-store-audit.txt': file(
        'Trusted root certificate store audit, WKSTN-FIN-31:\n' +
          '  Unrecognized CA found: "MeridianContentFilter CA" (self-signed, installed 2026-07-22)\n' +
          '  Installed by: a browser extension ("SaveMore Coupon Finder") the user installed personally,\n' +
          '  not deployed or authorized by IT at any point -- no MDM/GPO record of this CA exists anywhere\n' +
          '  -- MITRE ATT&CK T1553.004 (Install Root Certificate): once trusted, this CA can sign a valid-\n' +
          '     looking certificate for ANY domain, accepted with no browser warning at all --\n',
      ),
      'intercepted-tls-session-analysis.txt': file(
        'TLS certificate-chain analysis, a session to mybank-secure.example from WKSTN-FIN-31:\n' +
          '  Certificate issuer: MeridianContentFilter CA (the rogue root found above)\n' +
          '  Expected issuer for a real banking domain: a public, browser-trusted CA (DigiCert, Let\'s Encrypt, etc.)\n' +
          '  -- the real bank\'s certificate has been silently substituted for one signed by the rogue CA --\n' +
          '     full TLS interception, credentials and session cookies included, with zero certificate warning\n' +
          '     shown to the user, since the device was told to trust this rogue CA completely --\n' +
          '  flag{rogue_trusted_root_ca_tls_interception_no_browser_warning}\n',
      ),
    }),
    network: [],
  },

  // 4 — Security Engineering: A Pre-Signed Download URL With No Expiry Grants Permanent Access
  {
    id: 'secengineering-presigned-url-never-expires',
    title: 'Security Engineering: A Pre-Signed Download URL With No Expiry Grants Permanent Access',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'invoices-svc44 generates a pre-signed download URL every time a customer requests their invoice PDF -- ' +
      'a real, standard pattern for granting temporary, credential-free access to a private object. The ' +
      'defect is entirely in how it\'s configured: the expiry parameter was left at its maximum permitted ' +
      'value, effectively years in the future, turning what\'s supposed to be a short-lived access grant into ' +
      'a permanent, silently-shareable "capability URL" -- and a real, documented risk with exactly this ' +
      'pattern is that such URLs get archived by web crawlers and services like the Wayback Machine, where ' +
      'they remain fetchable by anyone who finds the archived link, long after the original recipient ever ' +
      'needed access.',
    objectives: [
      { text: 'cat presigned-url-generation-review.txt', why: 'Confirms the exact defect: the expiry parameter is set to its maximum permitted value (years, not the minutes/hours a real one-time download link should use) -- a configuration mistake, not a flaw in pre-signed URLs as a mechanism.' },
      { text: 'curl "http://10.10.315.2:80/invoices/download?token=inv-4471-a8f3e9d2c5b7&exp=4089110400"', why: 'This exact URL was generated for a customer 14 months ago -- and because the expiry is effectively years away, it still grants full access today, long after any reasonable one-time download window should have closed.' },
    ],
    hints: [
      'cat presigned-url-generation-review.txt',
      'curl "http://10.10.315.2:80/invoices/download?token=inv-4471-a8f3e9d2c5b7&exp=4089110400"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'presigned-url-generation-review.txt': file(
        'Code review, invoices-svc44 invoice-download URL generation:\n' +
          '  generatePresignedUrl(objectKey, { expiresIn: MAX_EXPIRY })  // MAX_EXPIRY = 60 * 60 * 24 * 365 * 20\n' +
          '  -- 20 years. A real one-time invoice download link should expire in minutes to hours, not decades\n' +
          '  -- this is an implementation/configuration mistake, not a flaw in pre-signed URLs as a mechanism:\n' +
          '     a long expiration effectively turns a "temporary" link into a permanent capability URL that\n' +
          '     can be archived (search crawlers, the Wayback Machine) and remain fetchable indefinitely --\n',
      ),
    }),
    network: [
      {
        hostname: 'invoices-svc44',
        ip: '10.10.315.2',
        os: 'Ubuntu 22.04 (Express 4.18, pre-signed invoice download URLs)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            http: {
              '/invoices/download': '{"status":200,"invoice":"INV-4471.pdf","customer":"Meridian Logistics Ltd","total":"$48,220.00","note":"flag{presigned_url_no_expiry_permanent_access_archived_forever}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Security Engineering: Verbose Error Messages Leak a Full Stack Trace and Internal File Paths
  {
    id: 'secengineering-verbose-error-stack-trace-leak',
    title: 'Security Engineering: Verbose Error Messages Leak a Full Stack Trace and Internal File Paths',
    difficulty: 'Easy',
    category: 'Security Engineering',
    briefing:
      'billing-api17 runs with its framework\'s debug/development error handler still active in production -- ' +
      'a single malformed request triggers an unhandled exception, and instead of a generic error page, the ' +
      'response body includes the FULL stack trace: internal file paths, the framework and its exact version, ' +
      'the ORM query that failed, and a fragment of the database connection string. None of this requires any ' +
      'exploitation technique at all -- it\'s handed over directly by the application\'s own error-handling ' +
      'configuration the moment something goes wrong, turning routine, harmless input validation failures ' +
      'into a reconnaissance goldmine for whatever an attacker tries next.',
    objectives: [
      { text: 'curl "http://10.10.316.2:80/api/invoices?id=12345"', why: 'A normal, valid request returns clean invoice data with no internal detail exposed at all.' },
      { text: 'curl "http://10.10.316.2:80/api/invoices?id=not-a-number"', why: 'A single malformed, non-numeric ID triggers an unhandled exception -- and because the development error handler is still active, the response includes the full stack trace, internal file paths, framework version, and a connection-string fragment.' },
    ],
    hints: [
      'curl "http://10.10.316.2:80/api/invoices?id=12345"',
      'curl "http://10.10.316.2:80/api/invoices?id=not-a-number"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'billing-api17',
        ip: '10.10.316.2',
        os: 'Ubuntu 22.04 (Express 4.18, development error handler active in production)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, NODE_ENV never set to production)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/api/invoices',
                param: 'id',
                triggerSubstrings: ['not-a-number'],
                vulnerableResponse: '{"status":500,"error":"CastError: Cast to Number failed","stack":"at /srv/billing-api17/src/routes/invoices.js:41:19\\n  at /srv/billing-api17/node_modules/express/lib/router/layer.js:95:5","framework":"Express 4.18.2 / Node.js 20.11.0","db_connection_fragment":"postgres://billing_svc:***@internal-db-prod-03.corp.local:5432/billing","note":"flag{verbose_error_stack_trace_internal_paths_connection_string_leak}"}',
                normalResponse: '{"status":200,"invoice":"INV-12345","total":"$1,204.50"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Security Engineering: A Debug Feature Flag Left Enabled in Production Exposes an Internal Admin Panel
  {
    id: 'secengineering-debug-feature-flag-prod-admin-panel',
    title: 'Security Engineering: A Debug Feature Flag Left Enabled in Production Exposes an Internal Admin Panel',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'inventory-svc29 ships with a debug/diagnostics route gated behind a single request header, ' +
      '`X-Debug-Mode: true` -- meant only for internal QA testing against a staging deployment, and never ' +
      'removed before the same codebase shipped to production. Unlike a missing-auth-check bug, this route ' +
      'has NO authentication logic protecting it at all by design -- it was built to be reachable by anyone ' +
      'who knows the header, on the assumption that only people with access to internal QA documentation ' +
      'would ever know it exists. That assumption fails completely the moment the same build reaches a ' +
      'publicly-reachable production host, since the header value itself is a shared, static secret with no ' +
      'per-user or per-environment scoping at all.',
    objectives: [
      { text: 'curl http://10.10.317.2:80/internal/debug-panel', why: 'Without the debug header, the route behaves like any other unrecognized path -- confirms it isn\'t simply linked from anywhere discoverable.' },
      { text: 'curl http://10.10.317.2:80/internal/debug-panel -H "X-Debug-Mode: true"', why: 'The QA-only debug header, meant for a staging environment, still works in production -- there was never any authentication logic on this route at all, only the header check, which is a static, unscoped shared secret.' },
    ],
    hints: [
      'curl http://10.10.317.2:80/internal/debug-panel',
      'curl http://10.10.317.2:80/internal/debug-panel -H "X-Debug-Mode: true"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'inventory-svc29',
        ip: '10.10.317.2',
        os: 'Ubuntu 22.04 (Express 4.18, QA debug route shipped unchanged to production)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/internal/debug-panel',
                param: 'X-Debug-Mode',
                location: 'header',
                triggerSubstrings: ['true'],
                vulnerableResponse: '{"status":200,"panel":"internal debug diagnostics","controls":["force-restock","override-pricing","raw-db-query"],"note":"flag{debug_feature_flag_left_enabled_production_admin_panel}"}',
                normalResponse: '{"error":"404 Not Found"}',
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
