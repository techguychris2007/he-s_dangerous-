import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir(extra ?? {}) }),
  };
}

export const currentThreatsLabs: LabScenario[] = [
  {
    id: 'cve-2025-53770-sharepoint-toolshell',
    title: 'CVE-2025-53770 "ToolShell": SharePoint Unauthenticated RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Highmoor County government IT runs an on-premises Microsoft SharePoint Server Subscription Edition farm ' +
      '(SP-GOV01) for internal case-management workflows. On July 19-20, 2025, attackers actively exploited ' +
      'CVE-2025-53770, dubbed "ToolShell," against government agencies and financial institutions worldwide — ' +
      'a true zero-day at the time, with no vendor patch yet available. The root cause is insecure ' +
      'deserialization of untrusted data in a SharePoint web service endpoint that is reachable without any ' +
      'authentication; in the wild, attackers chained it with a related authentication-bypass/spoofing flaw to ' +
      'fully sidestep login, then achieved remote code execution as the SharePoint application pool identity. ' +
      'Worse, many attackers went on to steal the server\'s ASP.NET machine keys (validationKey/decryptionKey) ' +
      'to forge persistent __VIEWSTATE payloads — meaning patching the deserialization bug alone was not enough ' +
      'to evict them, since the stolen keys kept working. This lab recreates that exact chain against SP-GOV01.',
    objectives: [
      { text: 'nmap -sV 10.10.115.1', why: 'Confirms this is an on-premises SharePoint Server (SharePoint Online was never affected by this CVE) and surfaces the build number needed to check it against the vulnerable range for CVE-2025-53770.' },
      { text: 'curl 10.10.115.1:443/_layouts/15/start.aspx', why: 'Grabs the SharePoint version banner to confirm this on-prem Subscription Edition install is a real ToolShell candidate before attempting anything against it.' },
      { text: 'curl 10.10.115.1:443/_layouts/15/ToolPane.aspx', why: 'Confirms the ToolPane.aspx endpoint used by the real ToolShell chain loads with no authentication redirect at all — the exact unauthenticated reachability that let attackers pair it with a spoofed Referer header to fully bypass auth before sending the malicious serialized payload.' },
      { text: 'exploit sharepoint-toolshell 10.10.115.1', why: 'Models the real attack: a crafted object graph is sent to the SharePoint web service, which insecurely deserializes it — meaning it reconstructs and runs attacker-controlled code just by reading the "data" back into memory, without ever validating what that data actually contains. This is what let a fully unauthenticated request achieve remote code execution as the SharePoint app pool identity on July 19-20, 2025, before any patch existed.' },
      { text: 'Read the RCE confirmation: cat /root/root.txt', why: 'Confirms code execution as the SharePoint service identity — the first-stage impact of ToolShell.' },
      { text: 'Read the stolen persistence material: cat /root/web.config.txt', why: 'Real ToolShell attackers did not stop at one shell — they exfiltrated the server\'s ASP.NET machine keys so they could forge valid __VIEWSTATE payloads and regain code execution at will, surviving even a full patch of the original deserialization bug. This is exactly why incident-response guidance was "patch AND rotate machine keys," not patch alone.' },
    ],
    hints: [
      'nmap -sV 10.10.115.1 — confirm the on-prem SharePoint build and exposed port.',
      'curl 10.10.115.1:443/_layouts/15/start.aspx — confirms this is on-prem SharePoint Server, not SharePoint Online.',
      'curl 10.10.115.1:443/_layouts/15/ToolPane.aspx — confirms the vulnerable endpoint loads without any auth redirect.',
      'exploit sharepoint-toolshell 10.10.115.1 — models the unauthenticated deserialization RCE chain.',
      'cat /root/root.txt for the first flag, then cat /root/web.config.txt for the stolen-machine-keys flag.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'SP-GOV01', ip: '10.10.115.1', os: 'Windows Server 2019 (SharePoint Server Subscription Edition)',
        exploitableAs: 'sharepoint-toolshell',
        services: [
          {
            port: 443, name: 'https', version: 'Microsoft SharePoint Server Subscription Edition, build 16.0.18526 (ToolShell / CVE-2025-53770 unpatched)',
            http: {
              '/_layouts/15/start.aspx':
                'HTTP/1.1 200 OK\nMicrosoftSharePointTeamServices: 16.0.0.18526\nX-Powered-By: ASP.NET\n<html><title>Highmoor County Services Portal - SharePoint Server</title></html>\nNote: this is an on-premises SharePoint Server Subscription Edition install. SharePoint Online is not affected by CVE-2025-53770.',
              '/_layouts/15/ToolPane.aspx':
                'HTTP/1.1 200 OK\n<html><body>ToolPane.aspx loaded - no authentication redirect occurred.</body></html>\nThis endpoint is reachable pre-authentication, the exact precondition attackers abused on 2025-07-19/20 by pairing it with a spoofed Referer header to fully bypass the auth check before sending a malicious serialized payload.',
            },
          },
        ],
        users: [],
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2025-53770 ("ToolShell") confirmed - a crafted payload sent to the pre-auth-reachable ToolPane.aspx endpoint was insecurely deserialized by the SharePoint web service, executing arbitrary code as the SharePoint application pool identity (w3wp.exe). This exact chain was used against government agencies and financial institutions on July 19-20, 2025, before Microsoft had a patch available - a true zero-day exploited in the wild.\nflag{sharepoint_toolshell_cve_2025_53770_deserialization_rce}\n'
            ),
            'web.config.txt': file(
              'Stolen from the SharePoint application pool after RCE - ASP.NET machine keys, harvested exactly as real ToolShell attackers did:\n<machineKey validationKey="B8F2SIMULATEDA91C0091FF23" decryptionKey="4D7ASIMULATED0E6271BC44" validation="SHA1" decryption="AES" />\nWith these keys an attacker can forge a valid __VIEWSTATE payload at will and re-achieve remote code execution on this server any time in the future - even AFTER the deserialization bug itself is patched, because the stolen keys themselves were never rotated. This is exactly why CISA and Microsoft urged organizations to rotate machine keys, not just patch, in the wake of ToolShell.\nflag{stolen_machinekeys_forge_viewstate_persistence}\n'
            ),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2025-3248-langflow-rce',
    title: 'CVE-2025-3248: Langflow Unauthenticated Code Execution',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Solvane Analytics runs Langflow, a popular open-source no-code/low-code platform for building AI and LLM ' +
      'workflows, internally at ai01 (10.10.115.2) so its data science team can prototype agent pipelines ' +
      'without writing full applications. In 2025, researchers disclosed CVE-2025-3248: a specific API ' +
      'endpoint used to validate and execute custom Python component code carried no authentication check ' +
      'whatsoever, letting anyone who could reach it submit arbitrary Python for the server to execute ' +
      'directly. Rated a maximum-severity 9.8 CVSS, it was added to the CISA Known Exploited Vulnerabilities ' +
      'catalog in May 2025 after botnet operators were observed actively scanning for and exploiting it in ' +
      'the wild within days of public disclosure. This lab walks through confirming the exposure and ' +
      'weaponizing it against Solvane\'s internal instance.',
    objectives: [
      { text: 'nmap -sV 10.10.115.2', why: 'Confirms Langflow is exposed and reachable on its default port. No-code AI workflow platforms like this are increasingly deployed internally and rarely security-audited, exactly the kind of target attackers scanned for in the days after this CVE was disclosed.' },
      { text: 'curl 10.10.115.2:7860/', why: 'Confirms there is no login wall on the base Langflow UI at all — a sign the whole platform, not just one isolated bug, was left with no default authentication requirement in this deployment.' },
      { text: 'curl -X POST -d "code=print(\'healthcheck\')" 10.10.115.2:7860/api/v1/validate/code', why: 'This mirrors submitting harmless Python to the real code-validation API. Getting a clean, successful result back with zero authentication confirms the precondition that made this a maximum-severity, unauthenticated code-execution bug: the server will run whatever Python it is handed, no questions asked.' },
      { text: 'exploit langflow-code-execution 10.10.115.2', why: 'Models submitting a weaponized custom-component payload (for example, one that calls os.system or subprocess to spawn a reverse shell) to that same endpoint. Because the endpoint executes submitted Python directly and unauthenticated, this is a single HTTP request away from a full shell on the Langflow host — exactly why CISA added it to the KEV catalog and why botnet operators were observed mass-scanning for it within days of disclosure.' },
      { text: 'Read the RCE confirmation: cat /root/root.txt', why: 'Confirms full, unauthenticated remote code execution on the AI platform host.' },
      { text: 'Read the harvested credentials: cat /root/langflow-secrets.txt', why: 'AI orchestration platforms like Langflow routinely hold live API keys for every LLM provider and external service they integrate with. An RCE here does not just hand over a shell — it hands over every third-party API key the platform was trusted with, turning one bug into a supply-chain-style compromise of every connected AI service.' },
    ],
    hints: [
      'nmap -sV 10.10.115.2 — confirm Langflow and its version on port 7860.',
      'curl 10.10.115.2:7860/ — confirms there is no authentication wall on the base UI.',
      'curl -X POST -d "code=print(\'healthcheck\')" 10.10.115.2:7860/api/v1/validate/code — confirms the code-execution API runs submitted code unauthenticated.',
      'exploit langflow-code-execution 10.10.115.2 — models an unauthenticated, weaponized Python payload achieving RCE.',
      'cat /root/root.txt for the first flag, then cat /root/langflow-secrets.txt for the stolen API-key flag.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'ai01', ip: '10.10.115.2', os: 'Ubuntu 22.04 (Docker container host)',
        exploitableAs: 'langflow-code-execution',
        services: [
          {
            port: 7860, name: 'http', version: 'Langflow 1.3.0 (unauthenticated code-execution API - CVE-2025-3248)',
            http: {
              '/': 'HTTP/1.1 200 OK\n<html><title>Langflow - Solvane Analytics AI Workflow Builder</title></html>\nLangflow 1.3.0 - no login wall on the base UI or its underlying API.',
              '/api/v1/validate/code':
                'HTTP/1.1 200 OK\n{"valid": true, "result": "OK - healthcheck"}\nNote: this response required no Authorization header, no session cookie, and no API key. The /api/v1/validate/code endpoint used to validate custom Python component code never checks for authentication at all.',
            },
          },
        ],
        users: [],
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2025-3248 confirmed - arbitrary Python code submitted to the unauthenticated /api/v1/validate/code endpoint was executed directly by the Langflow server process, with no login, API key, or session token required. This flaw carried a 9.8 CVSS score and was added to the CISA Known Exploited Vulnerabilities catalog in May 2025 after botnet operators were observed scanning for and exploiting it within days of public disclosure.\nflag{langflow_cve_2025_3248_unauth_code_execution}\n'
            ),
            'langflow-secrets.txt': file(
              'Recovered from the Langflow credential store after RCE - this AI orchestration platform holds live API keys for every LLM provider it integrates with:\nOPENAI_API_KEY=sk-simulated-4f8b2c9d1a\nANTHROPIC_API_KEY=sk-ant-simulated-7e21db\nCompromising a no-code AI workflow tool does not just hand over a shell - it hands over every third-party API key the platform was trusted with.\nflag{ai_platform_rce_leaks_llm_provider_api_keys}\n'
            ),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2025-32433-erlang-otp-ssh',
    title: 'CVE-2025-32433: Erlang/OTP SSH Pre-Auth RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Vaultmoor Data Systems runs a RabbitMQ message-broker cluster whose nodes, like all Erlang/OTP-based ' +
      'infrastructure (RabbitMQ, CouchDB, and others), ship with an SSH daemon implemented directly in ' +
      'Erlang/OTP rather than OpenSSH. CVE-2025-32433, disclosed in 2025 with the maximum possible 10.0 CVSS ' +
      'score, is a flaw in that SSH daemon\'s handling of protocol messages received before authentication ' +
      'completes — meaning an attacker could send specially crafted messages and achieve full remote code ' +
      'execution without ever supplying a username, password, SSH key, or even finishing the handshake. This ' +
      'lab targets mq-node03 (10.10.115.3), one node in Vaultmoor\'s cluster that was never patched.',
    objectives: [
      { text: 'nmap -sV 10.10.115.3', why: 'Confirms the SSH service on this host is not OpenSSH but the Erlang/OTP-bundled ssh daemon backing this RabbitMQ node — a completely separate codebase from mainline OpenSSH, with its own, unrelated set of vulnerabilities.' },
      { text: 'ssh admin@10.10.115.3 and try a guessed password', why: 'Confirms the service still enforces conventional username/password authentication for a normal login attempt — establishing the "normal" access path makes the next step\'s complete bypass of that entire process the real point of this lesson.' },
      { text: 'exploit erlang-otp-ssh-preauth 10.10.115.3', why: 'Models sending a series of crafted SSH protocol messages during the key-exchange / pre-authentication phase of the connection, before the daemon ever asks for or validates any credential. Because the flaw sits in message handling that runs prior to authentication, this achieves remote code execution with absolutely no credentials, keys, or completed handshake required at all — a fundamentally different, and more severe, class of access than any credential-based foothold.' },
      { text: 'Read the flag: cat /root/root.txt', why: 'Confirms remote code execution as the service user was reached with zero authentication of any kind — the defining characteristic of a maximum-severity, pre-auth RCE.' },
    ],
    hints: [
      'nmap -sV 10.10.115.3 — note the SSH banner names the Erlang/OTP daemon, not OpenSSH.',
      'ssh admin@10.10.115.3 — a normal login still requires a valid password here; any guess is denied.',
      'exploit erlang-otp-ssh-preauth 10.10.115.3 — models the pre-authentication RCE that needs no credentials at all.',
      'Once the session opens, cat /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'mq-node03', ip: '10.10.115.3', os: 'Ubuntu 22.04 (RabbitMQ cluster node)',
        exploitableAs: 'erlang-otp-ssh-preauth',
        services: [
          { port: 22, name: 'ssh', version: 'Erlang/OTP ssh daemon bundled with RabbitMQ 3.13.7 (CVE-2025-32433 unpatched, pre-auth RCE, CVSS 10.0)' },
          { port: 5672, name: 'amqp', version: 'RabbitMQ 3.13.7 (AMQP 0-9-1)' },
        ],
        users: [],
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2025-32433 confirmed - a maximum-severity 10.0 CVSS flaw in the SSH daemon implementation shipped with Erlang/OTP (the runtime RabbitMQ, CouchDB, and other Erlang-based infrastructure is built on). By sending a small number of crafted SSH protocol messages BEFORE authentication was ever completed, this exploit reached full remote code execution as the service user with no username, password, key, or completed handshake of any kind - unlike a stolen or brute-forced credential, there was never anything to steal or guess here at all.\nflag{erlang_otp_ssh_cve_2025_32433_preauth_rce}\n'
            ),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2025-64446-fortiweb-authbypass',
    title: 'CVE-2025-64446: FortiWeb Path Traversal Auth Bypass',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Brackenfield Retail Group deploys a FortiWeb web application firewall in front of its storefront to ' +
      'block SQL injection, XSS, and other common web attacks before they ever reach the application. ' +
      'CVE-2025-64446, rated 9.8 CVSS, is a path traversal flaw in FortiWeb\'s own management interface: by ' +
      'sending crafted "../../../" sequences, an unauthenticated attacker can escape the intended web root ' +
      'and reach an internal API endpoint that should only ever be reachable after login — and use it to ' +
      'create a brand-new administrator account directly on the appliance. This lab targets fortiweb-edge01 ' +
      '(10.10.115.4), turning the very device meant to protect Brackenfield\'s web app into the attacker\'s ' +
      'own foothold.',
    objectives: [
      { text: 'nmap -sV 10.10.115.4', why: 'Confirms the FortiWeb management interface itself — not just the WAF\'s protective proxy path — is reachable at all. Management interfaces are supposed to be restricted to trusted admin networks, so finding one exposed is a critical finding even before any specific CVE is considered.' },
      { text: 'curl 10.10.115.4:443/api/v2.0/system/status', why: 'Confirms the admin API is properly gated behind authentication under normal circumstances. A 401/authentication-required response here is the expected, secure baseline that the path-traversal bypass in the next step completely defeats.' },
      { text: 'exploit fortiweb-path-traversal 10.10.115.4', why: 'Models sending a request containing "../../../" style traversal sequences to the management interface, escaping the web root the request was supposed to be confined to and reaching an internal, normally post-authentication-only API used to create administrator accounts. Because the traversal happens before any authentication check is reached, an attacker with zero credentials can create a fully-privileged super_admin account on the appliance itself — no username, password, or session of any kind required.' },
      { text: 'Read the flag: cat /root/root.txt', why: 'Confirms the real, severe impact of this CVE: a brand-new administrator account was created directly on the WAF appliance itself, turning the very device meant to defend the web application into the attacker\'s own persistent backdoor into the network.' },
    ],
    hints: [
      'nmap -sV 10.10.115.4 — confirm the FortiWeb management interface is exposed.',
      'curl 10.10.115.4:443/api/v2.0/system/status — confirms this normal admin path is properly gated (401/auth required).',
      'exploit fortiweb-path-traversal 10.10.115.4 — models the "../../../" traversal that reaches the internal admin-creation API pre-auth.',
      'Once the session opens, cat /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'fortiweb-edge01', ip: '10.10.115.4', os: 'FortiWeb 7.4.3 (WAF appliance)',
        exploitableAs: 'fortiweb-path-traversal',
        services: [
          {
            port: 443, name: 'https', version: 'FortiWeb 7.4.3 management interface (path traversal + auth bypass - CVE-2025-64446)',
            http: {
              '/': 'HTTP/1.1 200 OK\n<html><title>FortiWeb - Brackenfield Retail Group</title></html>\nLogin required.',
              '/api/v2.0/system/status': 'HTTP/1.1 401 Unauthorized\n{"status":"error","message":"Authentication required"}',
            },
          },
        ],
        users: [],
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2025-64446 confirmed - a path traversal flaw in the FortiWeb management interface let a completely unauthenticated attacker escape the intended web root using crafted "../../../" sequences and reach an internal API endpoint that should only ever be callable by an already-authenticated administrator. That internal endpoint was used to create a brand-new local administrator account directly on the WAF appliance itself.\nNewly created attacker account discovered on this device:\n  username: svc_maintenance  role: super_admin  created: (post-compromise)\nThis is the real, severe impact of CVE-2025-64446: the web application firewall meant to protect the application in front of it instead became the attacker\'s own persistent foothold, with full administrative control of the security appliance itself.\nflag{fortiweb_cve_2025_64446_path_traversal_new_admin}\n'
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];
