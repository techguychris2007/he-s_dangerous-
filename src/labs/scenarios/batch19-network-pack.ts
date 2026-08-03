import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

function cveLab(cfg: {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  briefing: string;
  ip: string;
  port: number;
  serviceName: string;
  version: string;
  os: string;
  hostname: string;
  moduleName: string;
  exploitNote: string;
  flag: string;
}): LabScenario {
  return {
    id: cfg.id,
    title: cfg.title,
    difficulty: cfg.difficulty,
    category: 'Network',
    briefing: cfg.briefing,
    objectives: [
      { text: `nmap -sV ${cfg.ip}`, why: 'Confirms the exposed service and version before attempting anything version-specific.' },
      { text: `exploit ${cfg.moduleName} ${cfg.ip}`, why: cfg.exploitNote },
      { text: 'Once the session opens, check /root/root.txt', why: 'Confirms full code execution on the target and captures proof.' },
    ],
    hints: [
      `nmap -sV ${cfg.ip}`,
      `exploit ${cfg.moduleName} ${cfg.ip}`,
      'Once the session opens, check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: cfg.hostname,
        ip: cfg.ip,
        os: cfg.os,
        services: [{ port: cfg.port, name: cfg.serviceName, version: cfg.version }],
        users: [],
        exploitableAs: cfg.moduleName,
        root: dir({ root: dir({ 'root.txt': file(`${cfg.exploitNote}\n${cfg.flag}\n`) }) }),
      } as HostDef,
    ],
  };
}

/** Batch 19, part 1: 13 more real, famous, well-documented CVEs via this platform's proven
 *  `exploit <module> <ip>` mechanic (now used across 19 CVE-RCE labs total). Every CVE number, CVSS score,
 *  affected-version range, and real default port below was verified against multiple independent sources
 *  before writing — see NOTES.md batch 19 for the full citation list. Explicitly differentiated in each
 *  briefing from this platform's existing same-vendor CVEs (vCenter, FortiOS, Citrix) where one already
 *  exists, so the distinction is never left implicit. */
export const batch19NetworkLabs: LabScenario[] = [
  cveLab({
    id: 'cve-2021-26855-proxylogon-exchange-ssrf',
    title: 'CVE-2021-26855: ProxyLogon — Microsoft Exchange Pre-Auth SSRF',
    difficulty: 'Hard',
    ip: '10.10.267.2',
    hostname: 'mail-exch01',
    port: 443,
    serviceName: 'https',
    version: 'Microsoft Exchange Server 2019 CU8 (unpatched, CVE-2021-26855)',
    os: 'Windows Server 2019 (Exchange 2019, unpatched)',
    moduleName: 'cve-2021-26855-proxylogon',
    exploitNote:
      'CVE-2021-26855 (ProxyLogon) confirmed -- a pre-authentication SSRF in the Exchange Client Access ' +
      'Service, exploited via a crafted POST to a statically-readable path (like /ecp/x.js) with the ' +
      'request body redirected to an internal backend service named in an X-BEResource cookie, letting an ' +
      'unauthenticated attacker authenticate as the Exchange server itself against its own backend.',
    flag: 'flag{proxylogon_exchange_cas_ssrf_cve_2021_26855}',
    briefing:
      'mail-exch01 runs Microsoft Exchange Server 2019, unpatched against CVE-2021-26855, nicknamed ' +
      'ProxyLogon -- a pre-authentication SSRF in Exchange\'s Client Access Service (CAS), the component ' +
      'that proxies incoming client connections to backend services. The real exploit sends a specially ' +
      'crafted POST request to a path that\'s statically readable with no authentication (like /ecp/x.js -- ' +
      'the file doesn\'t even need to exist), with the request body redirected to whichever internal backend ' +
      'service is named in a cookie called X-BEResource. That lets an unauthenticated attacker authenticate ' +
      'AS the Exchange server against its own backend, reachable over port 443 with no credentials at all -- ' +
      'and when chained with CVE-2021-27065, this becomes full remote code execution.',
  }),
  cveLab({
    id: 'cve-2021-34473-proxyshell-exchange-chain',
    title: 'CVE-2021-34473: ProxyShell — Chained Exchange Pre-Auth RCE',
    difficulty: 'Hard',
    ip: '10.10.268.2',
    hostname: 'mail-exch02',
    port: 443,
    serviceName: 'https',
    version: 'Microsoft Exchange Server 2016 CU21 (unpatched, ProxyShell chain)',
    os: 'Windows Server 2019 (Exchange 2016, unpatched)',
    moduleName: 'cve-2021-34473-proxyshell-chain',
    exploitNote:
      'CVE-2021-34473 confirmed as the entry point of the real ProxyShell chain -- a pre-authentication URL ' +
      'path-confusion bug that reaches Exchange\'s PowerShell backend, chained with CVE-2021-34523 ' +
      '(privilege escalation to elevated PowerShell access) and CVE-2021-31207 (post-auth arbitrary file ' +
      'write), landing a webshell and full remote code execution -- three distinct CVEs combined into one ' +
      'working, unauthenticated exploit chain, mirroring how real ProxyShell attacks worked in practice.',
    flag: 'flag{proxyshell_exchange_three_cve_chain_34473_34523_31207}',
    briefing:
      'mail-exch02 runs a second, differently-vulnerable Exchange server -- this one unpatched against ' +
      'ProxyShell, a real three-CVE exploit chain distinct from ProxyLogon on mail-exch01: CVE-2021-34473 ' +
      '(a pre-auth URL path-confusion bug reaching Exchange\'s backend PowerShell remoting endpoint), ' +
      'CVE-2021-34523 (a privilege-escalation bug elevating that access to a fully-privileged PowerShell ' +
      'session), and CVE-2021-31207 (a post-auth arbitrary file write letting the attacker drop a webshell ' +
      'directly). None of the three alone is enough for full compromise -- the real ProxyShell attacks that ' +
      'hit thousands of servers in 2021 chained all three together into one unauthenticated path to remote ' +
      'code execution.',
  }),
  cveLab({
    id: 'cve-2022-26134-confluence-ognl-injection-rce',
    title: 'CVE-2022-26134: Atlassian Confluence Unauthenticated OGNL Injection RCE',
    difficulty: 'Medium',
    ip: '10.10.269.2',
    hostname: 'wiki-confluence07',
    port: 8090,
    serviceName: 'http',
    version: 'Atlassian Confluence Server 7.18.0 (unpatched, CVE-2022-26134)',
    os: 'Ubuntu 20.04 (Confluence Server, Tomcat, real default port 8090)',
    moduleName: 'cve-2022-26134-confluence-ognl',
    exploitNote:
      'CVE-2022-26134 confirmed -- an unauthenticated OGNL (Object-Graph Navigation Language) injection ' +
      'delivered via a single crafted HTTP GET request with the payload embedded directly in the URI, ' +
      'executing commands with the privileges of the user running the Confluence application. CVSS 9.8, ' +
      'disclosed and actively exploited within days in June 2022.',
    flag: 'flag{confluence_ognl_injection_unauthenticated_rce_cve_2022_26134}',
    briefing:
      'wiki-confluence07 runs Atlassian Confluence Server on its real default port, 8090, unpatched against ' +
      'CVE-2022-26134 -- a CVSS 9.8 unauthenticated OGNL (Object-Graph Navigation Language, the expression ' +
      'language Confluence\'s templating engine uses internally) injection. A single crafted HTTP GET ' +
      'request with the OGNL payload embedded directly in the URI is enough -- no login, no CSRF token, no ' +
      'multi-step chain, just one request executing arbitrary commands with the privileges of the account ' +
      'Confluence itself runs as. Volexity discovered active in-the-wild exploitation before Atlassian even ' +
      'had a patch ready.',
  }),
  cveLab({
    id: 'cve-2022-22965-spring4shell-classloader-rce',
    title: 'CVE-2022-22965: Spring4Shell — Java ClassLoader Manipulation RCE',
    difficulty: 'Hard',
    ip: '10.10.270.2',
    hostname: 'orders-api-svc',
    port: 8080,
    serviceName: 'http',
    version: 'Apache Tomcat 9 + Spring Framework 5.3.17 (unpatched, CVE-2022-22965)',
    os: 'Ubuntu 22.04 (Spring MVC WAR deployment on Tomcat, JDK 9+)',
    moduleName: 'cve-2022-22965-spring4shell',
    exploitNote:
      'CVE-2022-22965 (Spring4Shell) confirmed -- JDK 9+ exposed a class.module.classLoader property through ' +
      'Spring\'s data-binding mechanism that JDK 8 never had, letting a crafted HTTP request manipulate the ' +
      'application\'s own ClassLoader and, through it, Tomcat\'s AccessLogValve logging configuration -- ' +
      'redirecting log output to write a malicious JSP webshell straight into the web root, giving full ' +
      'remote code execution with no direct file-upload feature involved at all.',
    flag: 'flag{spring4shell_classloader_manipulation_accesslogvalve_webshell_cve_2022_22965}',
    briefing:
      'orders-api-svc is a Spring MVC application packaged as a WAR and deployed on Apache Tomcat -- exactly ' +
      'the specific, real prerequisite combination CVE-2022-22965 (Spring4Shell) requires, running on a JDK ' +
      '9+ runtime where a new getModule() method exposed the previously-blocked class.module.classLoader ' +
      'property through Spring\'s parameter-binding mechanism. A crafted request manipulates that property ' +
      'to reach Tomcat\'s own AccessLogValve class and redirect its log output into the web root as a ' +
      'malicious .jsp file -- a genuinely different exploitation path than a normal file-upload ' +
      'vulnerability, since nothing here is a file-upload feature at all, just log-configuration tampering ' +
      'reached through a completely unrelated data-binding bug.',
  }),
  cveLab({
    id: 'cve-2023-27350-papercut-authbypass-rce',
    title: 'CVE-2023-27350: PaperCut MF/NG Authentication Bypass RCE',
    difficulty: 'Medium',
    ip: '10.10.271.2',
    hostname: 'print-mgmt04',
    port: 9191,
    serviceName: 'http',
    version: 'PaperCut NG 21.2.10 (unpatched, CVE-2023-27350, real default admin port 9191)',
    os: 'Windows Server 2019 (PaperCut Application Server)',
    moduleName: 'cve-2023-27350-papercut-authbypass',
    exploitNote:
      'CVE-2023-27350 confirmed -- improper access control in PaperCut\'s SetupCompleted Java class lets an ' +
      'unauthenticated attacker bypass login entirely and reach the application as an administrator, then ' +
      'use PaperCut\'s own built-in scripting interface to run arbitrary commands with SYSTEM privileges. ' +
      'CVSS 9.8, exploited in the wild by the Bl00dy ransomware gang against education-sector targets per ' +
      'CISA\'s own advisory (AA23-131A).',
    flag: 'flag{papercut_setupcompleted_authbypass_scripting_interface_rce_cve_2023_27350}',
    briefing:
      'print-mgmt04 runs PaperCut NG on its real default administration port, 9191, unpatched against ' +
      'CVE-2023-27350 -- a CVSS 9.8 authentication bypass rooted in improper access control in PaperCut\'s ' +
      'own SetupCompleted Java class. The real exploit needs no credentials at all: it reaches the ' +
      'application server directly as an administrator, then invokes PaperCut\'s own built-in scripting ' +
      'interface (a legitimate feature meant for print-workflow automation) to run arbitrary system ' +
      'commands with SYSTEM privileges. CISA\'s own advisory (AA23-131A) documents the Bl00dy ransomware ' +
      'gang actively exploiting this exact CVE against education-sector targets in the wild.',
  }),
  cveLab({
    id: 'cve-2019-19781-citrix-adc-path-traversal-rce',
    title: 'CVE-2019-19781: Citrix ADC/Gateway Path Traversal RCE ("Shitrix")',
    difficulty: 'Medium',
    ip: '10.10.272.2',
    hostname: 'citrix-adc01',
    port: 443,
    serviceName: 'https',
    version: 'Citrix ADC 13.0 (unpatched, CVE-2019-19781)',
    os: 'Citrix ADC/NetScaler appliance (unpatched)',
    moduleName: 'cve-2019-19781-citrix-adc-path-traversal',
    exploitNote:
      'CVE-2019-19781 confirmed -- an unauthenticated directory-traversal bug reachable via the ' +
      '/vpns/ path (real PoC path: https://../vpn/js/../../vpns/cfg/smb.conf) letting an attacker read ' +
      'arbitrary configuration files and, chained with a limited file-write into the same directory, drop ' +
      'and run Perl scripts -- full remote code execution with no authentication at all, distinct from this ' +
      'session\'s existing CitrixBleed (CVE-2023-4966) session-token-leak lab, an entirely different bug ' +
      'class on the same product family.',
    flag: 'flag{citrix_adc_shitrix_path_traversal_rce_cve_2019_19781}',
    briefing:
      'citrix-adc01 is a Citrix Application Delivery Controller (ADC, formerly NetScaler), unpatched against ' +
      'CVE-2019-19781 -- publicly nicknamed "Shitrix," and mechanically distinct from this session\'s ' +
      'existing CitrixBleed lab (CVE-2023-4966, a session-token memory-leak on a much newer version): this ' +
      'one is an unauthenticated directory-traversal bug reachable through the /vpns/ path, letting an ' +
      'attacker read arbitrary configuration files, and chained with a limited file-write into the same ' +
      'writable directory, drop and execute Perl scripts already present on the appliance -- no credentials ' +
      'required at any step.',
  }),
  cveLab({
    id: 'cve-2023-3519-citrix-netscaler-stack-overflow-rce',
    title: 'CVE-2023-3519: Citrix NetScaler ADC/Gateway Stack Buffer Overflow RCE',
    difficulty: 'Hard',
    ip: '10.10.273.2',
    hostname: 'citrix-netscaler03',
    port: 443,
    serviceName: 'https',
    version: 'NetScaler ADC 13.1 (unpatched, CVE-2023-3519)',
    os: 'Citrix NetScaler ADC/Gateway appliance (unpatched)',
    moduleName: 'cve-2023-3519-netscaler-stack-overflow',
    exploitNote:
      'CVE-2023-3519 confirmed -- missing bounds checking on the "target" parameter at the unauthenticated ' +
      '/gwtest/formssso endpoint (reached via ns_aaa_gwtest_get_valid_fsso_server, which calls the ' +
      'vulnerable ns_aaa_saml_url_decode function) lets an attacker inject an excessively long value, ' +
      'triggering a stack buffer overflow in the nsppe process and gaining EIP control -- root-level remote ' +
      'code execution, CVSS 9.8, actively exploited as a zero-day dropping web shells before any patch ' +
      'existed.',
    flag: 'flag{citrix_netscaler_gwtest_formssso_stack_overflow_cve_2023_3519}',
    briefing:
      'citrix-netscaler03 is a third, differently-vulnerable Citrix appliance in this network -- unpatched ' +
      'against CVE-2023-3519, a genuinely different bug class from both this session\'s other Citrix labs ' +
      '(the 2019 path-traversal "Shitrix" and the 2023 CitrixBleed session-leak): this one is a real memory-' +
      'corruption vulnerability, a stack buffer overflow in the nsppe process triggered by missing bounds ' +
      'checking on the "target" parameter at the unauthenticated /gwtest/formssso endpoint. An excessively ' +
      'long value overflows the stack buffer and grants the attacker control of EIP directly -- root-level ' +
      'remote code execution with no credentials needed.',
  }),
  cveLab({
    id: 'cve-2024-21762-fortios-sslvpn-oob-write-rce',
    title: 'CVE-2024-21762: FortiOS SSL VPN Out-of-Bounds Write RCE',
    difficulty: 'Hard',
    ip: '10.10.274.2',
    hostname: 'fortigate-vpn05',
    port: 443,
    serviceName: 'https',
    version: 'FortiOS 7.4.2 SSL VPN (unpatched, CVE-2024-21762)',
    os: 'Fortinet FortiGate appliance (unpatched, sslvpnd running as root)',
    moduleName: 'cve-2024-21762-fortios-sslvpn-oob-write',
    exploitNote:
      'CVE-2024-21762 confirmed -- a crafted HTTP request using chunked transfer encoding with a manipulated ' +
      'chunk-size value causes sslvpnd (which runs as root) to write attacker-controlled data past the ' +
      'boundary of its intended buffer, corrupting memory in a way that grants remote code execution with no ' +
      'authentication at all. CVSS 9.6, distinct from this session\'s existing FortiOS lab (CVE-2022-42475, ' +
      'a different, earlier heap-based buffer overflow in the same SSL VPN component).',
    flag: 'flag{fortios_sslvpn_chunked_encoding_oob_write_root_rce_cve_2024_21762}',
    briefing:
      'fortigate-vpn05 runs a newer, differently-vulnerable FortiOS build than this session\'s existing ' +
      'FortiOS lab -- that one covers CVE-2022-42475, a heap-based buffer overflow; this one is ' +
      'CVE-2024-21762, disclosed two years later against the same SSL VPN functionality but a genuinely ' +
      'distinct bug: an out-of-bounds WRITE triggered by a crafted HTTP request using chunked transfer ' +
      'encoding with a manipulated chunk-size value. Because sslvpnd itself runs as root, the resulting ' +
      'memory corruption grants root-level remote code execution directly, with no authentication step at ' +
      'all -- Fortinet itself confirmed active in-the-wild exploitation before publishing a patch.',
  }),
  cveLab({
    id: 'cve-2023-22515-confluence-broken-access-control-privesc',
    title: 'CVE-2023-22515: Confluence Broken Access Control — Unauthenticated Admin Account Creation',
    difficulty: 'Medium',
    ip: '10.10.275.2',
    hostname: 'wiki-confluence-dc02',
    port: 8090,
    serviceName: 'http',
    version: 'Atlassian Confluence Data Center 8.3.0 (unpatched, CVE-2023-22515)',
    os: 'Ubuntu 22.04 (Confluence Data Center, Tomcat, real default port 8090)',
    moduleName: 'cve-2023-22515-confluence-broken-access-control',
    exploitNote:
      'CVE-2023-22515 confirmed -- broken access control on Confluence\'s setup/bootstrap endpoints lets an ' +
      'unauthenticated attacker directly create a new, fully-privileged Confluence Administrator account, ' +
      'no exploitation of memory corruption or injection required at all, just reaching administrator setup ' +
      'endpoints that were never supposed to be reachable on an already-configured instance. CVSS 10.0, ' +
      'exploited in the wild as a zero-day before Atlassian had any patch, per Atlassian\'s own advisory.',
    flag: 'flag{confluence_broken_access_control_unauth_admin_creation_cve_2023_22515}',
    briefing:
      'wiki-confluence-dc02 runs a second, differently-vulnerable Confluence instance in this network -- ' +
      'wiki-confluence07 covers CVE-2022-26134 (OGNL injection), this one covers CVE-2023-22515, a genuinely ' +
      'different bug class: broken access control on Confluence\'s own administrator setup/bootstrap ' +
      'endpoints. No injection, no memory corruption at all -- an unauthenticated attacker simply reaches ' +
      'endpoints meant only for a brand-new, never-configured instance and uses them to create a fresh, ' +
      'fully-privileged Confluence Administrator account directly, on an instance that was already ' +
      'configured and running in production. CVSS 10.0 -- Atlassian\'s own advisory confirms this was ' +
      'exploited in the wild as a zero-day before any patch existed.',
  }),
  cveLab({
    id: 'cve-2021-21972-vcenter-vropsplugin-file-upload-rce',
    title: 'CVE-2021-21972: vCenter vROps Plugin Unauthenticated File Upload RCE',
    difficulty: 'Medium',
    ip: '10.10.276.2',
    hostname: 'vcenter-mgmt09',
    port: 443,
    serviceName: 'https',
    version: 'VMware vCenter Server 6.7 U3k (unpatched, CVE-2021-21972)',
    os: 'VMware vCenter Server Appliance (vROps plugin, unpatched)',
    moduleName: 'cve-2021-21972-vcenter-vropsplugin-upload',
    exploitNote:
      'CVE-2021-21972 confirmed -- the vRealize Operations (vROps) plugin ships in every default vCenter ' +
      'installation, and its /ui/vropspluginui/rest/services/uploadova endpoint is reachable with no ' +
      'authentication at all, accepting arbitrary file uploads via path traversal (CWE-22). Uploading a ' +
      '.jsp webshell to the web root grants NT AUTHORITY\\SYSTEM on Windows deployments -- distinct from ' +
      'this session\'s existing vCenter lab (CVE-2021-21985, a separate vSphere Client plugin RCE), a ' +
      'genuinely different vulnerable component on the same product.',
    flag: 'flag{vcenter_vrops_plugin_unauth_file_upload_path_traversal_cve_2021_21972}',
    briefing:
      'vcenter-mgmt09 runs vCenter Server with its vRealize Operations (vROps) plugin -- present in every ' +
      'default vCenter installation whether or not vRealize Operations is actually deployed, and unpatched ' +
      'against CVE-2021-21972, a distinct vulnerability from this session\'s existing vCenter lab ' +
      '(CVE-2021-21985, a different plugin entirely). The real flaw: /ui/vropspluginui/rest/services/' +
      'uploadova is reachable with zero authentication and accepts arbitrary file uploads via a path-' +
      'traversal bug (CWE-22, Improper Limitation of a Pathname to a Restricted Directory), letting an ' +
      'attacker write a .jsp webshell directly into the web root and execute it with NT AUTHORITY\\SYSTEM ' +
      'privileges.',
  }),
  cveLab({
    id: 'cve-2023-20887-vmware-aria-networks-command-injection-rce',
    title: 'CVE-2023-20887: VMware Aria Operations for Networks Command Injection RCE',
    difficulty: 'Hard',
    ip: '10.10.277.2',
    hostname: 'aria-netops04',
    port: 443,
    serviceName: 'https',
    version: 'VMware Aria Operations for Networks 6.9 (unpatched, CVE-2023-20887)',
    os: 'VMware Aria Operations for Networks appliance (unpatched)',
    moduleName: 'cve-2023-20887-vmware-aria-command-injection',
    exploitNote:
      'CVE-2023-20887 confirmed -- a two-part chain combining an nginx access-control rule bypass with a ' +
      'command-injection flaw in a backend API endpoint: user-controlled input reaches a system shell call ' +
      'with no proper escaping or validation, letting an unauthenticated attacker execute arbitrary commands ' +
      'with the privileges of the application itself. CVSS 9.8, added to CISA\'s Known Exploited ' +
      'Vulnerabilities catalog after confirmed in-the-wild exploitation.',
    flag: 'flag{vmware_aria_networks_nginx_bypass_command_injection_cve_2023_20887}',
    briefing:
      'aria-netops04 runs VMware Aria Operations for Networks (formerly vRealize Network Insight), ' +
      'unpatched against CVE-2023-20887 -- a real, two-part vulnerability chain: an nginx access-control ' +
      'rule bypass reaches a backend API endpoint that was never meant to be directly accessible, and that ' +
      'endpoint itself contains a command-injection flaw where user-controlled input is passed straight ' +
      'into a system shell call with no escaping or validation at all. Combined, this grants an ' +
      'unauthenticated attacker arbitrary command execution with the privileges of the application, CVSS ' +
      '9.8 -- CISA added this to its Known Exploited Vulnerabilities catalog after confirming real-world ' +
      'exploitation.',
  }),
  cveLab({
    id: 'cve-2024-27198-teamcity-authbypass-rce',
    title: 'CVE-2024-27198: JetBrains TeamCity Authentication Bypass RCE',
    difficulty: 'Medium',
    ip: '10.10.278.2',
    hostname: 'ci-teamcity02',
    port: 8111,
    serviceName: 'http',
    version: 'JetBrains TeamCity On-Premises 2023.11.3 (unpatched, CVE-2024-27198, real default port 8111)',
    os: 'Ubuntu 22.04 (TeamCity build server)',
    moduleName: 'cve-2024-27198-teamcity-authbypass',
    exploitNote:
      'CVE-2024-27198 confirmed -- an alternative-path authentication bypass (CWE-288) in TeamCity\'s web ' +
      'component lets an unauthenticated attacker forge a valid authentication token directly, then use it ' +
      'to reach functionality permitting remote code execution -- full control over every project, build, ' +
      'agent, and artifact on the server, exactly the kind of access that makes a compromised CI server a ' +
      'real supply-chain attack vector. CVSS 9.8, discovered by Rapid7 and disclosed March 2024.',
    flag: 'flag{teamcity_alternate_path_authbypass_token_forge_rce_cve_2024_27198}',
    briefing:
      'ci-teamcity02 runs JetBrains TeamCity on its real default port, 8111, unpatched against ' +
      'CVE-2024-27198 -- a CVSS 9.8 authentication bypass classified as CWE-288 (Authentication Bypass Using ' +
      'an Alternate Path or Channel). The real flaw lets an unauthenticated attacker forge a valid ' +
      'authentication token directly through the alternate path, then use that forged token to reach ' +
      'functionality that permits remote code execution. Because TeamCity is a build/CI server, compromising ' +
      'it grants full control over every project, build configuration, build agent, and build artifact it ' +
      'manages -- exactly the kind of access real attackers use to stage a downstream software supply-chain ' +
      'compromise, not merely to own one isolated server.',
  }),
  cveLab({
    id: 'cve-2017-9841-phpunit-eval-stdin-rce',
    title: 'CVE-2017-9841: PHPUnit eval-stdin.php Exposed for Remote Code Execution',
    difficulty: 'Easy',
    ip: '10.10.279.2',
    hostname: 'legacy-webapp-dev11',
    port: 80,
    serviceName: 'http',
    version: 'PHP 7.1 + PHPUnit 4.8.19 (vendor directory publicly reachable, CVE-2017-9841)',
    os: 'Ubuntu 18.04 (PHP web application, vendor/ deployed inside the webroot)',
    moduleName: 'cve-2017-9841-phpunit-eval-stdin',
    exploitNote:
      'CVE-2017-9841 confirmed -- older PHPUnit versions ship a utility script, eval-stdin.php, whose entire ' +
      'purpose is to eval() whatever PHP code is piped to it on stdin, meant strictly for PHPUnit\'s own ' +
      'internal test tooling. Deploying the vendor/ directory (where Composer installs PHPUnit as a dev ' +
      'dependency) directly inside the public webroot leaves that file reachable over plain HTTP, and a POST ' +
      'request with PHP code in the body gets executed directly -- unauthenticated remote code execution ' +
      'from a file that was never meant to be internet-facing at all.',
    flag: 'flag{phpunit_eval_stdin_vendor_dir_publicly_exposed_rce_cve_2017_9841}',
    briefing:
      'legacy-webapp-dev11 deployed its Composer vendor/ directory directly inside the public webroot -- a ' +
      'genuinely common real deployment mistake, and specifically dangerous here because PHPUnit (a dev-only ' +
      'testing dependency) ships a utility script called eval-stdin.php whose ENTIRE job is to eval() ' +
      'whatever PHP code arrives on stdin, meant strictly for PHPUnit\'s own internal test tooling to use ' +
      'locally. With vendor/ reachable over plain HTTP, that file is reachable too -- a simple POST request ' +
      'with PHP code in the body gets executed directly by the server, unauthenticated remote code execution ' +
      'from a five-year-old, still-common misconfiguration (CVE-2017-9841).',
  }),
];
