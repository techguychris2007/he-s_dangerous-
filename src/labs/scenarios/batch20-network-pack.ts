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
      'cat /root/root.txt',
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

/** Batch 20, part 1: 10 more real, famous CVEs via this platform's proven `exploit <module> <ip>` mechanic
 *  (now used across 29 CVE-RCE labs total). Written from established, high-confidence technical knowledge
 *  of these specific, extensively-documented vulnerabilities -- WebSearch became unavailable partway through
 *  this session (blocked by the same classifier affecting tsx/oxlint/git commit, confirmed by direct retry),
 *  so unlike every earlier batch, none of these were freshly spot-checked against a live source before
 *  writing. Every one chosen specifically because it's among the most famous, most extensively publicly
 *  documented vulnerabilities of its year (CISA KEV entries, widely-cited by name in security press) rather
 *  than an obscure one this session's static knowledge would be more likely to misremember -- see NOTES.md
 *  batch 20 for the explicit, honest accounting of what could and couldn't be verified this batch. */
export const batch20NetworkLabs: LabScenario[] = [
  cveLab({
    id: 'cve-2019-0708-bluekeep-rdp-rce',
    title: 'CVE-2019-0708: BlueKeep — Pre-Auth RDP Remote Code Execution',
    difficulty: 'Hard',
    ip: '10.10.290.2',
    hostname: 'legacy-rdp-srv06',
    port: 3389,
    serviceName: 'ms-wbt-server',
    version: 'Windows Server 2008 R2 RDP (unpatched, CVE-2019-0708)',
    os: 'Windows Server 2008 R2 (unpatched, no NLA enforced)',
    moduleName: 'cve-2019-0708-bluekeep',
    exploitNote:
      'CVE-2019-0708 (BlueKeep) confirmed -- a use-after-free vulnerability in Windows\' Remote Desktop ' +
      'Protocol implementation, specifically in how the Terminal Server component handles a virtual channel ' +
      'during connection setup, reachable with NO authentication at all before any login prompt is ever ' +
      'shown. Microsoft itself took the unusual step of patching this on end-of-life Windows XP and Server ' +
      '2003, an explicit acknowledgment of how severe and wormable they judged this to be -- the same ' +
      'exploitation shape as EternalBlue/WannaCry, but against RDP instead of SMB.',
    flag: 'flag{bluekeep_rdp_pre_auth_use_after_free_cve_2019_0708}',
    briefing:
      'legacy-rdp-srv06 exposes RDP (port 3389) on an unpatched Windows Server 2008 R2 install, vulnerable ' +
      'to CVE-2019-0708, publicly nicknamed BlueKeep. The real flaw is a use-after-free in the Terminal ' +
      'Server component\'s handling of a virtual channel during connection setup -- reachable by any client ' +
      'that can complete the RDP handshake, with no authentication and no user interaction required at all, ' +
      'since the vulnerable code path runs before any login screen is ever presented. Microsoft judged this ' +
      'severe and wormable enough (the same real-world exploitation shape as EternalBlue/WannaCry, just ' +
      'against RDP instead of SMB) that they took the highly unusual step of shipping a patch for Windows XP ' +
      'and Server 2003, both years past their official end of life at the time.',
  }),
  cveLab({
    id: 'cve-2020-0796-smbghost-compression-rce',
    title: 'CVE-2020-0796: SMBGhost — SMBv3 Compression Buffer Overflow RCE',
    difficulty: 'Hard',
    ip: '10.10.291.2',
    hostname: 'fileshare-legacy11',
    port: 445,
    serviceName: 'microsoft-ds',
    version: 'Windows 10 1903 SMBv3.1.1 (unpatched, CVE-2020-0796)',
    os: 'Windows 10 1903 (SMBv3 compression enabled, unpatched)',
    moduleName: 'cve-2020-0796-smbghost',
    exploitNote:
      'CVE-2020-0796 (SMBGhost) confirmed -- an integer overflow in how SMBv3.1.1 decompresses a ' +
      'compressed packet, a genuinely new protocol feature introduced in that same SMB version, leading to ' +
      'a buffer overflow reachable pre-authentication over the network. CVSS 10.0 -- both a client-side and ' +
      'server-side attack surface exist, and it is wormable in the same real sense EternalBlue was, since no ' +
      'credentials or user interaction are needed at all.',
    flag: 'flag{smbghost_smbv3_compression_integer_overflow_cve_2020_0796}',
    briefing:
      'fileshare-legacy11 has SMBv3.1.1 compression enabled -- a feature introduced in that exact protocol ' +
      'version -- and is unpatched against CVE-2020-0796, nicknamed SMBGhost. The real flaw is an integer ' +
      'overflow in the kernel-mode driver that decompresses an incoming compressed SMB packet, corrupting ' +
      'memory in a way that\'s reachable with no authentication at all before any credential is ever ' +
      'checked. CVSS 10.0 -- distinct from EternalBlue (CVE-2017-0144, an older SMBv1 exploit already on ' +
      'this platform), this targets a completely different, much newer SMB protocol version and its ' +
      'compression feature specifically, not the legacy SMBv1 code path.',
  }),
  cveLab({
    id: 'cve-2022-30190-follina-msdt-rce',
    title: 'CVE-2022-30190: Follina — MSDT Remote Code Execution via a Malicious Office Document',
    difficulty: 'Medium',
    ip: '10.10.292.2',
    hostname: 'docshare-portal14',
    port: 80,
    serviceName: 'http',
    version: 'Document-sharing portal serving unsanitized .docx uploads (CVE-2022-30190 trigger)',
    os: 'Windows 10/11 client rendering fetched documents (MSDT unpatched)',
    moduleName: 'cve-2022-30190-follina-msdt',
    exploitNote:
      'CVE-2022-30190 (Follina) confirmed -- a malicious Word document\'s remote template feature fetches an ' +
      'HTML file containing an ms-msdt: URI, invoking the Microsoft Support Diagnostic Tool directly. Because ' +
      'the document uses Word\'s template-loading mechanism rather than macros, it triggers with NO macro ' +
      'warning and, critically, requires no user interaction beyond the document simply being opened (the ' +
      'exploit also works purely through Word\'s Preview Pane, with no click into the file at all in some ' +
      'configurations) -- a real, widely-exploited zero-day used in the wild well before Microsoft\'s patch ' +
      'shipped.',
    flag: 'flag{follina_msdt_ms_msdt_uri_no_macro_warning_cve_2022_30190}',
    briefing:
      'docshare-portal14 hosts a malicious .docx file whose remote template feature fetches an external HTML ' +
      'file containing a crafted ms-msdt: URI -- CVE-2022-30190, publicly nicknamed Follina. The real, ' +
      'specific danger this technique represents: because it abuses Word\'s legitimate remote-template ' +
      'loading mechanism rather than a VBA macro, it triggers with none of the "Enable Content" macro ' +
      'warnings users have been trained to distrust, and in some configurations executes purely through ' +
      'Word\'s Preview Pane with no click into the file required at all. This was a genuine zero-day, ' +
      'actively exploited in real phishing campaigns for weeks before Microsoft\'s official patch shipped.',
  }),
  cveLab({
    id: 'cve-2024-3094-xz-utils-liblzma-backdoor',
    title: 'CVE-2024-3094: The XZ Utils / liblzma Supply Chain Backdoor',
    difficulty: 'Hard',
    ip: '10.10.293.2',
    hostname: 'build-mirror-relay09',
    port: 22,
    serviceName: 'ssh',
    version: 'OpenSSH (patched via systemd/libsystemd -> backdoored liblzma 5.6.1, CVE-2024-3094)',
    os: 'Linux distribution shipping the backdoored xz-utils 5.6.0/5.6.1 release tarballs',
    moduleName: 'cve-2024-3094-xz-backdoor',
    exploitNote:
      'CVE-2024-3094 confirmed -- a multi-year social-engineering supply-chain operation ("Jia Tan") inserted ' +
      'obfuscated build-time code into the official xz-utils RELEASE TARBALLS (never visible in the public ' +
      'git repository itself), which patches liblzma\'s IFUNC resolver mechanism at load time on distributions ' +
      'where sshd links libsystemd, which in turn links liblzma. The backdoor intercepts and modifies ' +
      'RSA_public_decrypt used during SSH certificate authentication, giving the key-holder a pre-' +
      'authentication remote code execution path. Discovered by Andres Freund, a PostgreSQL developer, who ' +
      'noticed anomalous CPU usage and a ~500ms slowdown in SSH login latency -- one of the most significant ' +
      'open-source supply-chain compromises ever caught before mass deployment.',
    flag: 'flag{xz_utils_liblzma_ifunc_backdoor_sshd_supply_chain_cve_2024_3094}',
    briefing:
      'build-mirror-relay09 runs a Linux distribution that packaged the backdoored xz-utils 5.6.0/5.6.1 ' +
      'release -- CVE-2024-3094, one of the most significant open-source supply-chain compromises ever ' +
      'caught. The backdoor was never present in the public xz-utils git repository at all -- it was ' +
      'injected only into the official release TARBALLS by "Jia Tan," a persona that spent roughly two years ' +
      'building trust as a legitimate co-maintainer before inserting the payload. On distributions where ' +
      'sshd links against libsystemd, which in turn links against liblzma, the backdoor hijacks liblzma\'s ' +
      'IFUNC symbol-resolution mechanism at load time to intercept and modify RSA_public_decrypt during SSH ' +
      'certificate authentication -- a pre-authentication remote code execution path for whoever holds the ' +
      'corresponding key. It was discovered only by chance: PostgreSQL developer Andres Freund noticed SSH ' +
      'logins taking roughly 500 milliseconds longer than expected and traced the anomaly back to this exact ' +
      'backdoor before it reached most stable distribution releases.',
  }),
  cveLab({
    id: 'cve-2023-23397-outlook-ntlm-leak-zeroclick',
    title: 'CVE-2023-23397: Outlook Zero-Click NTLM Hash Leak via a Calendar Reminder',
    difficulty: 'Medium',
    ip: '10.10.294.2',
    hostname: 'mail-relay-exch19',
    port: 443,
    serviceName: 'https',
    version: 'Exchange/Outlook environment (client-side trigger, CVE-2023-23397)',
    os: 'Windows client running an unpatched Outlook build receiving the malicious item',
    moduleName: 'cve-2023-23397-outlook-ntlm-leak',
    exploitNote:
      'CVE-2023-23397 confirmed -- a malicious email carries a custom Outlook reminder-sound property set to ' +
      'a UNC path on an attacker-controlled SMB server; the instant Outlook processes the reminder (which ' +
      'happens automatically, before the user ever opens or even sees the email in the reading pane), it ' +
      'attempts to authenticate to that UNC path, leaking the victim\'s NTLMv2 hash to the attacker for free. ' +
      'CVSS 9.8, a genuine zero-click attack -- confirmed by Microsoft as actively exploited in the wild, ' +
      'including by Russian state-linked actors against European government and military targets, before ' +
      'the patch shipped.',
    flag: 'flag{outlook_zero_click_reminder_ntlm_leak_cve_2023_23397}',
    briefing:
      'mail-relay-exch19 represents an Exchange/Outlook environment where a malicious email exploiting ' +
      'CVE-2023-23397 was delivered. The real trigger is genuinely zero-click: the malicious email sets a ' +
      'custom reminder-sound property to a UNC path pointing at an attacker-controlled SMB server, and ' +
      'Outlook processes calendar/task reminders automatically the moment the item is received -- the ' +
      'victim never has to open the email, click a link, or interact with it in any way at all. The instant ' +
      'the reminder fires, Outlook attempts to authenticate to that UNC path to "play" the reminder sound, ' +
      'leaking the victim\'s NTLMv2 hash directly to the attacker for free. Microsoft confirmed this was ' +
      'actively exploited in the wild, including by Russian state-linked threat actors against European ' +
      'government and military organizations, before the patch was released.',
  }),
  cveLab({
    id: 'cve-2019-11510-pulse-secure-arbitrary-file-read',
    title: 'CVE-2019-11510: Pulse Secure VPN Pre-Auth Arbitrary File Read',
    difficulty: 'Medium',
    ip: '10.10.295.2',
    hostname: 'vpn-gateway-pulse07',
    port: 443,
    serviceName: 'https',
    version: 'Pulse Connect Secure 9.0R3 (unpatched, CVE-2019-11510)',
    os: 'Pulse Secure VPN appliance (unpatched)',
    moduleName: 'cve-2019-11510-pulse-secure-file-read',
    exploitNote:
      'CVE-2019-11510 confirmed -- an unauthenticated attacker crafts a specific URI (real, well-documented ' +
      'PoC path: /dana-na/../dana/html5acc/guacamole/../../../../../../etc/passwd?/dana/html5acc/guacamole/) ' +
      'that traverses outside the intended web root and reads arbitrary files directly off the appliance, ' +
      'including its plaintext session-database file, which contains active users\' credentials and session ' +
      'tokens -- turning a simple file-read primitive into full authenticated VPN access. CISA named this ' +
      'one of the most exploited vulnerabilities of 2020/2021, used in real ransomware intrusions including ' +
      'against Travelex.',
    flag: 'flag{pulse_secure_dana_na_path_traversal_session_db_leak_cve_2019_11510}',
    briefing:
      'vpn-gateway-pulse07 runs Pulse Connect Secure, unpatched against CVE-2019-11510 -- a pre-' +
      'authentication arbitrary file read reachable via a crafted path-traversal URI under /dana-na/. The ' +
      'real, devastating impact isn\'t simply "read some files" in the abstract: the specific file real ' +
      'attackers target is the appliance\'s own plaintext session database, which contains active session ' +
      'tokens and cached credentials for every currently logged-in VPN user, turning a file-read bug ' +
      'directly into full authenticated network access with no further exploitation needed. CISA named this ' +
      'one of the most exploited vulnerabilities during 2020 and 2021, and it was used in real ransomware ' +
      'intrusions, including the widely-reported attack against Travelex.',
  }),
  cveLab({
    id: 'cve-2022-41040-proxynotshell-exchange-chain',
    title: 'CVE-2022-41040/41082: ProxyNotShell — A Second Exchange Pre-Auth RCE Chain',
    difficulty: 'Hard',
    ip: '10.10.296.2',
    hostname: 'mail-exch03',
    port: 443,
    serviceName: 'https',
    version: 'Microsoft Exchange Server 2019 CU12 (unpatched, ProxyNotShell chain)',
    os: 'Windows Server 2019 (Exchange 2019, unpatched)',
    moduleName: 'cve-2022-41040-proxynotshell',
    exploitNote:
      'CVE-2022-41040/CVE-2022-41082 confirmed -- publicly nicknamed ProxyNotShell, a genuinely distinct ' +
      'two-CVE Exchange chain from this platform\'s existing ProxyLogon and ProxyShell labs: CVE-2022-41040 ' +
      'is a server-side request forgery reachable by any authenticated user (even a low-privileged mailbox ' +
      'account), which is chained into CVE-2022-41082, a PowerShell remoting RCE, once that SSRF grants the ' +
      'attacker a foothold on the backend. Disclosed by GTSC after observing active in-the-wild exploitation ' +
      'against their own client\'s environment before Microsoft had a patch ready.',
    flag: 'flag{proxynotshell_exchange_ssrf_powershell_remoting_chain_41040_41082}',
    briefing:
      'mail-exch03 is a third, differently-vulnerable Exchange server in this environment -- unpatched ' +
      'against ProxyNotShell (CVE-2022-41040 chained with CVE-2022-41082), a genuinely distinct chain from ' +
      'this platform\'s existing ProxyLogon (CVE-2021-26855) and ProxyShell (CVE-2021-34473 chain) labs, ' +
      'despite the deliberately similar public nickname. Here, CVE-2022-41040 is a server-side request ' +
      'forgery reachable by any AUTHENTICATED user, even an ordinary low-privileged mailbox account with no ' +
      'admin rights at all -- and that SSRF is chained directly into CVE-2022-41082, a PowerShell remoting ' +
      'RCE, once it reaches the backend. GTSC, the security firm that discovered this chain, reported it was ' +
      'already being actively exploited in the wild against one of their own clients before Microsoft had ' +
      'any patch ready at all.',
  }),
  cveLab({
    id: 'cve-2021-41773-apache-http-server-path-traversal-rce',
    title: 'CVE-2021-41773/42013: Apache HTTP Server Path Traversal RCE',
    difficulty: 'Medium',
    ip: '10.10.297.2',
    hostname: 'web-apache-legacy22',
    port: 80,
    serviceName: 'http',
    version: 'Apache HTTP Server 2.4.49 (unpatched, CVE-2021-41773 + incomplete-fix CVE-2021-42013)',
    os: 'Ubuntu 20.04 (Apache 2.4.49, mod_cgi enabled)',
    moduleName: 'cve-2021-41773-apache-path-traversal',
    exploitNote:
      'CVE-2021-41773 confirmed -- a regression in Apache 2.4.49\'s path-normalization logic lets ' +
      '%2e%2e-style encoded traversal sequences escape the intended document root, permitting file reads ' +
      'outside the webroot; when the traversed path lands on a CGI script location with mod_cgi enabled, ' +
      'this becomes full remote code execution rather than just file disclosure. Apache\'s own first patch ' +
      'was incomplete, leading directly to CVE-2021-42013 days later for the same root cause with a double-' +
      'encoding bypass -- both actively exploited in the wild within 24 hours of public disclosure.',
    flag: 'flag{apache_path_traversal_mod_cgi_rce_incomplete_patch_41773_42013}',
    briefing:
      'web-apache-legacy22 runs Apache HTTP Server 2.4.49, unpatched against CVE-2021-41773 -- a real ' +
      'regression (not a new bug class) in that specific version\'s path-normalization logic, letting ' +
      '%2e%2e-encoded traversal sequences escape the configured document root. On its own this is a file-' +
      'disclosure bug, but because mod_cgi is enabled and the traversed path can land on a CGI script ' +
      'location, it becomes full unauthenticated remote code execution instead. The real, notable detail ' +
      'here: Apache\'s own first emergency patch was itself incomplete, and a double-URL-encoding bypass of ' +
      'that very patch was disclosed days later as CVE-2021-42013 -- both were being actively exploited in ' +
      'the wild within 24 hours of their respective public disclosures.',
  }),
  cveLab({
    id: 'cve-2023-38831-winrar-spoofed-extension-rce',
    title: 'CVE-2023-38831: WinRAR Spoofed File Extension RCE',
    difficulty: 'Medium',
    ip: '10.10.298.2',
    hostname: 'fileshare-archive12',
    port: 80,
    serviceName: 'http',
    version: 'File-sharing host serving a malicious .rar archive (CVE-2023-38831 trigger)',
    os: 'Windows client extracting/previewing the archive with an unpatched WinRAR build',
    moduleName: 'cve-2023-38831-winrar-extension-spoof',
    exploitNote:
      'CVE-2023-38831 confirmed -- a crafted .rar archive contains both a decoy file (like a .jpg) and a ' +
      'same-named folder holding a malicious script, exploiting a real quirk in how unpatched WinRAR builds ' +
      'handle a folder and a file sharing an identical base name inside the ZIP/RAR temporary-extraction ' +
      'process: double-clicking the decoy in WinRAR\'s preview pane executes the malicious script from the ' +
      'same-named folder instead. CVSS 7.8, actively exploited by real financial-fraud and crypto-theft ' +
      'campaigns for months before public disclosure, distributed through legitimate-looking trading-forum ' +
      'archive attachments.',
    flag: 'flag{winrar_spoofed_extension_samename_folder_rce_cve_2023_38831}',
    briefing:
      'fileshare-archive12 hosts a malicious .rar archive exploiting CVE-2023-38831 -- a real quirk in how ' +
      'unpatched WinRAR versions handle a decoy file (like invoice.jpg) and a folder sharing that exact same ' +
      'base name, both packed into the same archive. When a victim double-clicks the decoy from inside ' +
      'WinRAR\'s own preview pane, the temporary-extraction logic executes the malicious script sitting in ' +
      'the identically-named folder instead of opening the harmless-looking decoy file. This was actively ' +
      'exploited for months by real financial-fraud and cryptocurrency-theft campaigns, distributed through ' +
      'archives posted on legitimate-looking trading forums, before it was publicly disclosed and patched.',
  }),
  cveLab({
    id: 'cve-2018-13379-fortios-sslvpn-path-traversal-creds',
    title: 'CVE-2018-13379: FortiOS SSL VPN Pre-Auth Path Traversal — Plaintext Credential Disclosure',
    difficulty: 'Medium',
    ip: '10.10.299.2',
    hostname: 'fortigate-vpn-legacy02',
    port: 443,
    serviceName: 'https',
    version: 'FortiOS 6.0.4 SSL VPN (unpatched, CVE-2018-13379)',
    os: 'Fortinet FortiGate appliance (unpatched, older SSL VPN web portal)',
    moduleName: 'cve-2018-13379-fortios-path-traversal',
    exploitNote:
      'CVE-2018-13379 confirmed -- a genuinely distinct, much older bug class from this platform\'s two other ' +
      'FortiOS labs (both memory-corruption RCEs): this is a pre-authentication path-traversal vulnerability ' +
      'in the SSL VPN web portal, reachable via a crafted URI, that reads the sslvpn_websession file directly ' +
      'off the appliance -- a file containing active users\' session data, including plaintext usernames and ' +
      'passwords. A list of over 500,000 Fortinet VPN credentials harvested via this exact CVE was leaked ' +
      'publicly in 2021, long after the original 2019 disclosure, showing how long real attackers kept ' +
      'exploiting unpatched appliances.',
    flag: 'flag{fortios_sslvpn_path_traversal_plaintext_creds_cve_2018_13379}',
    briefing:
      'fortigate-vpn-legacy02 runs an older FortiOS SSL VPN build, unpatched against CVE-2018-13379 -- a ' +
      'genuinely distinct, much older bug class from this platform\'s two other FortiOS labs (CVE-2022-42475 ' +
      'and CVE-2024-21762, both memory-corruption RCEs in a newer sslvpnd): this one is a pre-authentication ' +
      'path-traversal bug in the SSL VPN web portal, reachable via a crafted URI, that directly reads the ' +
      'sslvpn_websession file off the appliance -- containing active users\' session data, plaintext ' +
      'usernames and passwords included. The real, sobering detail: a list of over 500,000 Fortinet VPN ' +
      'credentials harvested via this exact CVE was leaked publicly in 2021, two years after the original ' +
      'disclosure, demonstrating just how long real attackers kept finding and exploiting appliances that ' +
      'were never patched.',
  }),
];