import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir(extra ?? {}) }),
  };
}

export const adAdvancedLabs: LabScenario[] = [
  {
    id: 'ad-zerologon-cve-2020-1472',
    title: 'CVE-2020-1472: Zerologon Domain Takeover',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL\'s domain controller (10.10.107.1) has never applied the August 2020 patch cycle. It is ' +
      'vulnerable to Zerologon (CVE-2020-1472) — a flaw in the Netlogon protocol\'s cryptography that lets ' +
      'an unauthenticated attacker on the network reset the domain controller\'s own machine account ' +
      'password to blank, leading to instant, complete domain compromise. This was one of the most severe ' +
      'Active Directory vulnerabilities ever disclosed, rated a maximum 10.0 CVSS score.',
    objectives: [
      { text: 'Scan 10.10.107.1 and confirm it is a domain controller (SMB + Netlogon exposed)', why: 'Zerologon specifically targets the Netlogon Remote Protocol used by domain controllers — confirming the role before attacking matters.' },
      { text: 'Launch the exploit: exploit zerologon 10.10.107.1', why: 'The real exploit sends a series of Netlogon authentication requests with a zeroed cryptographic value — because of the flawed AES-CFB8 implementation, roughly 1 in 256 attempts succeeds, and repeating it a few hundred times guarantees a hit. This lab collapses that into a single command.' },
      { text: 'Confirm the resulting session is Domain Administrator and capture the flag', why: 'Once the DC\'s own machine account password is blanked, an attacker can authenticate as the domain controller itself and extract every credential in the domain — full compromise, no user interaction required at any point.' },
    ],
    hints: [
      'nmap -sV 10.10.107.1',
      'exploit zerologon 10.10.107.1',
      'This vulnerability requires zero valid credentials to start — that\'s what made it so dangerous in the real world.',
      'Once the session opens you are Domain Administrator — check /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'DC-CORP01', ip: '10.10.107.1', os: 'Windows Server 2012 R2 (unpatched, Aug 2020 Netlogon fix missing)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB / Netlogon (CVE-2020-1472 unpatched)' }],
        users: [],
        exploitableAs: 'zerologon',
        root: dir({ root: dir({ 'root.txt': file('Zerologon confirmed — a cryptographic flaw in Netlogon reset the DC\'s own password to blank.\nflag{zerologon_cve_2020_1472_domain_takeover}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-dcsync-attack',
    title: 'DCSync: Abusing Replication Rights',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'You\'ve compromised a service account, "svc_backup", on CORP.LOCAL. A BloodHound-style review would ' +
      'show this account was — mistakenly — granted "Replicating Directory Changes" rights, normally reserved ' +
      'for domain controllers themselves. This lets you impersonate a DC and pull every password hash in the ' +
      'domain directly over the network, without ever touching the DC\'s filesystem — the same DCSync ' +
      'technique used constantly in real-world post-compromise credential theft.',
    objectives: [
      { text: 'Validate the svc_backup credential against 10.10.107.2 with crackmapexec', why: 'Confirms the account works before attempting a privileged action with it.' },
      { text: 'Run secretsdump svc_backup:B4ckupSvc2024!@10.10.107.2', why: 'secretsdump mirrors the real Impacket tool of the same name — it asks the domain controller to "replicate" its own credential database to you, which is exactly what a legitimate secondary DC would request, except svc_backup was never supposed to have that right.' },
      { text: 'Locate the krbtgt account hash in the dump and capture the flag', why: 'The krbtgt account\'s hash is the single most valuable secret in the entire domain — it\'s what signs every Kerberos ticket, and owning it is what enables Golden Ticket persistence.' },
    ],
    hints: [
      'crackmapexec smb 10.10.107.2 -u svc_backup -p B4ckupSvc2024!',
      'secretsdump svc_backup:B4ckupSvc2024!@10.10.107.2',
      'The krbtgt line in the dump is the one that matters most — that\'s your flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'DC-CORP02', ip: '10.10.107.2', os: 'Windows Server 2019 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }],
        users: [{ username: 'svc_backup', password: 'B4ckupSvc2024!', canDcsync: true }],
        ntdsHashes:
          'corp.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::\n' +
          'corp.local\\svc_backup:1104:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::\n' +
          'corp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:flag{dcsync_replication_rights_leaks_krbtgt_hash}:::\n' +
          'krbtgt:aes256-cts-hmac-sha1-96:a9c2185f4d7032e681bd95a60c7f1438f09a12c5e6d7483b2f0a1c9d8e7f5634',
        root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'ad-golden-ticket-persistence',
    title: 'Golden Ticket: Forge and Validate a Kerberos TGT',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A prior, authorized domain assessment found the fictional CORP.LOCAL krbtgt AES key and domain SID in ' +
      'the evidence bundle on your Kali attack host. A Golden Ticket is a forged Kerberos ticket-granting ' +
      'ticket (TGT) signed with the domain\'s krbtgt key; it is not a password and cannot be submitted to SSH. ' +
      'The SID identifies the domain in the ticket\'s authorization data. Use the current Impacket ticket ' +
      'workflow, select the resulting cache, inspect its principal with klist, then request access to the ' +
      'domain controller\'s SMB service using Kerberos. In this isolated DarkWorld exercise, those command ' +
      'lines are modeled against a fictional host: the simulator validates the inputs and teaches the flow, ' +
      'but it does not generate a cryptographic ticket or contact a real domain. A successful Kerberos ' +
      'identity still needs service authorization; a TGT by itself does not magically grant SYSTEM on every host.',
    objectives: [
      { text: 'Read ~/dcsync-loot.txt and identify the CORP.LOCAL domain SID and krbtgt AES256 key', why: 'Ticket construction needs both the domain SID and a key for the krbtgt account. The ordinary NT hash is not an SSH or SMB password. The training key here is fictional, and the AES option keeps the workflow aligned with modern Kerberos deployments that are moving away from RC4.' },
      { text: 'Confirm the target is the expected domain controller: nmap -sV -p 88,445 10.10.107.3', why: 'Port 88 identifies the Kerberos service and 445 the SMB service used by the later Impacket client. A banner helps identify a service but is not proof of its patch state or trust configuration.' },
      { text: 'Create the modeled ticket: impacket-ticketer -aesKey <AES256_KEY> -domain-sid <DOMAIN_SID> -domain CORP.LOCAL Administrator', why: 'The actual Impacket tool accepts an AES key, domain SID, domain name, and target principal, then writes a credential-cache file. The platform validates these supplied values and creates a clearly labeled virtual marker instead of a real ccache.' },
      { text: 'Select the cache: export KRB5CCNAME=Administrator.ccache, then run klist', why: 'Kerberos clients read the selected cache through KRB5CCNAME. klist verifies which principal and krbtgt realm the client will present; it does not prove that a remote service will authorize the request.' },
      { text: 'Request a Kerberos-authenticated SMB session: impacket-psexec -k -no-pass -target-ip 10.10.107.3 CORP.LOCAL/Administrator@DC-CORP03.CORP.LOCAL', why: 'The FQDN supplies the service-principal name while -target-ip directs the network connection to the isolated host. The fictional target grants remote service control only to its configured privileged principal; real environments may deny this action even when the ticket validates.' },
      { text: 'Verify the session identity with whoami, then read /root/root.txt', why: 'Access is only the start of verification. Record the identity returned by the remote session before reading the proof file; the simulator models psexec as NT AUTHORITY\\SYSTEM on this training target.' },
      { text: 'Explain the containment lesson: a compromised krbtgt key requires a controlled domain recovery', why: 'A recovery team must account for password history, replication health, ticket lifetimes, service impact, and the supported two-reset procedure. Resetting too quickly can disrupt replication and authentication; follow Microsoft guidance for the actual forest and policy.' },
    ],
    hints: [
      'cat ~/dcsync-loot.txt shows the domain SID and a line labeled aes256-cts-hmac-sha1-96.',
      'Copy the 64-character AES key and S-1-5-21 domain SID into impacket-ticketer; keep CORP.LOCAL as the realm.',
      'After ticket creation, use export KRB5CCNAME=Administrator.ccache and run klist before contacting the SMB target.',
      'Use the DC FQDN in DOMAIN/user@host.fqdn and -target-ip for its lab address; then verify with whoami and cat /root/root.txt.',
      'The simulator clearly marks its cache as virtual. The command sequence reflects real Impacket syntax but no live ticket is created.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dcsync-loot.txt': file(
        'AUTHORIZED TRAINING FIXTURE — fictional CORP.LOCAL domain\n' +
        'Domain SID: S-1-5-21-1357924680-2468013579-1029384756\n' +
        'krbtgt:aes256-cts-hmac-sha1-96:a9c2185f4d7032e681bd95a60c7f1438f09a12c5e6d7483b2f0a1c9d8e7f5634\n' +
        'This value is synthetic and exists only for the DarkWorld simulation.\n',
      ),
    }),
    network: [
      {
        hostname: 'DC-CORP03', ip: '10.10.107.3', os: 'Windows Server 2019 (Domain Controller)',
        services: [
          { port: 88, name: 'kerberos-sec', version: 'Microsoft Kerberos Key Distribution Center' },
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
        ],
        users: [],
        kerberosTicketLab: {
          domain: 'CORP.LOCAL',
          domainSid: 'S-1-5-21-1357924680-2468013579-1029384756',
          krbtgtAes256Key: 'a9c2185f4d7032e681bd95a60c7f1438f09a12c5e6d7483b2f0a1c9d8e7f5634',
          privilegedUser: 'Administrator',
        },
        root: dir({ root: dir({ 'root.txt': file('Kerberos-authenticated SMB remote service execution verified as NT AUTHORITY\\SYSTEM.\nflag{golden_ticket_krbtgt_forged_kerberos_auth}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-printnightmare-cve-2021-34527',
    title: 'CVE-2021-34527: PrintNightmare RCE',
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'A print server on CORP.LOCAL (10.10.107.4) exposes the Windows Print Spooler service — running by ' +
      'default on nearly every Windows machine, including domain controllers in many real environments. ' +
      'PrintNightmare (CVE-2021-34527) is a flaw in how the spooler validates driver installation requests, ' +
      'letting a low-privileged or even remote unauthenticated user install a malicious printer driver that ' +
      'executes as SYSTEM.',
    objectives: [
      { text: 'Scan 10.10.107.4 and confirm the print spooler service is exposed', why: 'PrintNightmare requires the spooler service (accessible via SMB/RPC) to be running and reachable — most real Windows deployments leave it on unless explicitly hardened.' },
      { text: 'Launch the exploit: exploit printnightmare 10.10.107.4', why: 'The real exploit calls the RpcAddPrinterDriverEx RPC method with a specially crafted driver path, tricking the spooler into loading attacker-controlled code as SYSTEM.' },
      { text: 'Confirm SYSTEM access and capture the flag', why: 'PrintNightmare was especially severe because it worked against domain controllers too — many organizations didn\'t realize their DCs were running the vulnerable spooler service by default until this vulnerability made headlines in 2021.' },
    ],
    hints: [
      'nmap -sV 10.10.107.4',
      'exploit printnightmare 10.10.107.4',
      'This is a remote, unauthenticated code-execution path — no credentials needed at all.',
      'Once the session opens you are SYSTEM — check /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'PRINTSRV01', ip: '10.10.107.4', os: 'Windows Server 2019 (Print Spooler exposed)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB / Print Spooler RPC (CVE-2021-34527 unpatched)' }],
        users: [],
        exploitableAs: 'printnightmare',
        root: dir({ root: dir({ 'root.txt': file('PrintNightmare confirmed — a spooler driver-install flaw led straight to SYSTEM.\nflag{printnightmare_cve_2021_34527_system}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-worm-lateral-spread',
    title: 'Ransomware-Style Lateral Spread Across the Domain',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'This lab recreates the mechanics behind the 2017 NotPetya outbreak, which spread through Maersk\'s and ' +
      'Merck\'s networks in minutes: a single phished workstation, cached local-admin credentials reused ' +
      'across the fleet, and an unpatched SMB service, all combined to cause billions of dollars in global ' +
      'damage. You start with one compromised workstation and must chain credential reuse across three hosts ' +
      'to reach the domain controller — exactly the blast-radius problem that made that outbreak so ' +
      'devastating.',
    objectives: [
      { text: 'SSH into WKSTN-101 (10.10.107.5) using the phished user\'s weak password', why: 'Every real worm outbreak like this starts with one foothold — usually phishing, exactly as it was here.' },
      { text: 'Find the cached local admin credential on WKSTN-101 and validate it with crackmapexec against WKSTN-205 (10.10.107.6)', why: 'Reused local admin passwords across a Windows fleet — usually from imaging every machine off the same template — is precisely the mechanism that let NotPetya spread to an entire network in under an hour.' },
      { text: 'SSH into WKSTN-205 and find the domain admin session artifact, then reach DC-CORP04 (10.10.107.7)', why: 'Once an attacker (or worm) reaches a host where a domain admin happened to be logged in, that credential opens the door to the entire domain — this is the final hop that turns "one infected laptop" into "every server down."' },
      { text: 'Capture the flag on the domain controller', why: 'This is the exact blast radius problem organizations now defend against with tiered administration and credential-guard style protections — a single flat, reused-credential network is what made 2017\'s outbreak so catastrophic.' },
    ],
    hints: [
      'ssh jsmith@10.10.107.5 with password Summer2024 (the phished account), then cat user.txt for the first flag.',
      'cat cached-admin-note.txt once logged in — it reveals a local admin password reused across the fleet.',
      'crackmapexec smb 10.10.107.6 -u administrator -p <the-reused-password>, then ssh administrator@10.10.107.6.',
      'On WKSTN-205, cat domain-admin-session.txt for a cached domain admin credential, then crackmapexec/ssh to 10.10.107.7, then cat root.txt for the second flag.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'WKSTN-101', ip: '10.10.107.5', os: 'Windows 10 (domain-joined)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' }],
        users: [{ username: 'jsmith', password: 'Summer2024' }],
        root: dir({
          home: dir({
            jsmith: dir({
              'user.txt': file('Phishing foothold established — exactly the entry point NotPetya used in 2017.\nflag{phishing_foothold_lateral_spread_start}\n'),
              'cached-admin-note.txt': file('IT note to self: local admin pw across the whole fleet is Fleet_Admin_2024! (rotate someday)\n'),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'WKSTN-205', ip: '10.10.107.6', os: 'Windows 10 (domain-joined)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Windows 10)' }, { port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' }],
        users: [{ username: 'administrator', password: 'Fleet_Admin_2024!' }],
        root: dir({
          home: dir({
            administrator: dir({
              'domain-admin-session.txt': file('Cached credential from a recent domain admin help-desk visit:\nda_helpdesk : DA_Cach3d_2024!\n'),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'DC-CORP04', ip: '10.10.107.7', os: 'Windows Server 2019 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }, { port: 22, name: 'ssh', version: 'OpenSSH 8.6 (management access)' }],
        users: [{ username: 'da_helpdesk', password: 'DA_Cach3d_2024!' }],
        root: dir({
          home: dir({
            da_helpdesk: dir({
              'root.txt': file('Full domain compromise via cached-credential lateral spread — the NotPetya blast-radius pattern, recreated end to end.\nflag{lateral_spread_reaches_domain_controller}\n'),
            }),
          }),
        }),
      } as HostDef,
    ],
  },
];
