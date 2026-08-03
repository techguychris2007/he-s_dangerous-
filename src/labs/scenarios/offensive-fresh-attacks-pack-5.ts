import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Two AD attack classes that were surprisingly absent from the whole platform despite being among
 *  the most foundational internal-network techniques there are (LLMNR/NBT-NS poisoning and NTLM
 *  relay), plus one fresh web technique (XML-RPC pingback SSRF). The hashcat lab's plaintext is
 *  deliberately shipped in its OWN lab-local wordlist file (not the shared default one), and was
 *  verified programmatically to actually crack -- see the CHANGELOG entry on the hashcat/wordlist
 *  bug this exact mistake caused elsewhere on the platform. */
export const offensiveFreshAttacksLabs5: LabScenario[] = [
  // 1 — Active Directory: LLMNR/NBT-NS Poisoning
  {
    id: 'ad-llmnr-poisoning-ntlmv2-capture',
    title: 'LLMNR/NBT-NS Poisoning Captures an NTLMv2 Hash',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A workstation user mistypes a network share name — \\\\flie-server01\\reports instead of ' +
      '\\\\file-server01\\reports. DNS has no record for the misspelled name, so Windows falls back to ' +
      'LLMNR (Link-Local Multicast Name Resolution) and NBT-NS, broadcasting "does anyone on this network ' +
      'segment know this name?" to everyone listening. An attacker running Responder on the same broadcast ' +
      'domain answers "yes, that\'s me" for every such query — the victim\'s OS then automatically attempts ' +
      'SMB authentication against the attacker\'s fake server, handing over a full NTLMv2 challenge-response ' +
      'straight to Responder with zero user interaction beyond the original typo. This is one of the single ' +
      'most reliable techniques in real internal penetration tests specifically because it requires no ' +
      'vulnerability at all — it abuses a legacy name-resolution fallback that is still enabled by default ' +
      'on most Windows networks.',
    objectives: [
      { text: 'cat responder-capture-log.txt', why: 'Confirms the poisoning actually worked before spending any offline cracking effort — Responder logs exactly which host authenticated and which account it authenticated as.' },
      {
        text: 'hashcat -m 5600 captured-ntlmv2.hash /root/wordlists/corp-wordlist.txt',
        why: 'Mode 5600 is hashcat\'s real identifier for NetNTLMv2 — the exact hash type an LLMNR/NBT-NS poisoning capture produces, distinct from the raw NTLM (mode 1000) hash type used elsewhere on this platform.',
      },
      { text: 'Confirm the cracked password and capture the flag', why: 'A successfully cracked NTLMv2 response recovers the account\'s real plaintext domain password — from here it is a normal credentialed foothold, no exploit required at any point in the chain.' },
    ],
    hints: [
      'cat responder-capture-log.txt',
      'hashcat -m 5600 captured-ntlmv2.hash /root/wordlists/corp-wordlist.txt',
      'The cracked password is a normal-looking corporate password sitting in the small wordlist provided — this is intentionally realistic: real captured hashes usually crack against small, targeted wordlists, not brute force.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'responder-capture-log.txt': file(
        [
          '[*] [LLMNR]  Poisoned answer sent to 10.10.190.15 for name flie-server01',
          '[*] [NBT-NS] Poisoned answer sent to 10.10.190.15 for name FLIE-SERVER01 (workstation)',
          '[SMB] NTLMv2-SSP Client   : 10.10.190.15',
          '[SMB] NTLMv2-SSP Username : CORP\\\\jsmith',
          '[SMB] NTLMv2-SSP Hash     : written to captured-ntlmv2.hash',
          '--- capture complete -- proceed to offline cracking, no further network interaction required ---',
        ].join('\n'),
      ),
      'captured-ntlmv2.hash': file(
        '#HASHCAT_HASH:jsmith::CORP:1122334455667788:8f4a2c91e6b7d3a0f5c8e2b1a9d6f3c0:0101000000000000\n' +
          '#HASHCAT_PLAINTEXT:Autumn2026!\n' +
          '#HASHCAT_FLAG:flag{llmnr_nbtns_poisoning_captures_ntlmv2_cracked_offline}\n',
      ),
      wordlists: dir({
        'corp-wordlist.txt': file('Password1\nWelcome2024\nAutumn2026!\nCorp123!\nChangeMe!\n'),
      }),
    }),
    network: [],
  },

  // 2 — Active Directory: NTLM Relay to LDAP
  {
    id: 'ad-ntlm-relay-ldap-domain-admin',
    title: 'NTLM Relay to LDAP Grants Domain Admin — No Cracking Required',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'Rather than capturing an NTLM authentication attempt and cracking it offline (a coin-flip against a ' +
      'strong password), NTLM relay skips cracking entirely: the attacker captures a live authentication ' +
      'attempt (via the same LLMNR/NBT-NS poisoning technique, or by coercing one with PetitPotam-style ' +
      'techniques) and immediately forwards — relays — it to a DIFFERENT service in real time, before it ' +
      'expires. Corp-dc02\'s LDAP service does not enforce channel binding or signing, so a relayed ' +
      'authentication from a Domain Admin\'s machine account is accepted as a fully authenticated LDAP ' +
      'session — with zero knowledge of any password, ever. This exact technique (NTLM relay to LDAP, ' +
      'absent channel binding) is why Microsoft shipped hardening guidance and eventual default changes ' +
      'specifically for LDAP channel binding and signing in 2022-2023, following repeated real-world abuse.',
    objectives: [
      { text: 'cat captured-auth-attempt.txt', why: 'Confirms a live, still-valid authentication attempt was captured — relay only works while the captured authentication has not yet expired, unlike offline cracking which has no time pressure.' },
      {
        text: 'curl -X POST -d "relay_target=ldap&captured_auth=DC02$@CORP" 10.10.191.2:389/relay/forward',
        why: 'This mirrors running ntlmrelayx.py -t ldap://10.10.191.2 against the captured authentication — relaying it live to the LDAP service instead of the SMB service it was originally headed for, since that LDAP service is the one that skips channel-binding validation.',
      },
      { text: 'Use the relayed LDAP session to add the attacker to Domain Admins and capture the flag', why: 'A relayed LDAP session authenticated as a machine account with directory-write privileges can modify group membership directly — this is the actual "no cracking required" impact: a password nobody ever learned still resulted in full domain compromise.' },
    ],
    hints: [
      'cat captured-auth-attempt.txt',
      'curl -X POST -d "relay_target=ldap&captured_auth=DC02$@CORP" 10.10.191.2:389/relay/forward',
      'The relayed session belongs to a machine account with directory-write rights — the flag is on the group-modification confirmation.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-auth-attempt.txt': file(
        'Live-captured (not yet expired) NTLM authentication attempt, via LLMNR poisoning:\n' +
          'Source account:  DC02$ (a domain-joined machine account with directory-write privileges)\n' +
          'Destination:     originally addressed to \\\\fileserver03\\backups (irrelevant -- being relayed elsewhere)\n' +
          'Status:          valid for approximately 20 more seconds -- relay it now, do not attempt to crack it\n',
      ),
    }),
    network: [
      {
        hostname: 'corp-dc02',
        ip: '10.10.191.2',
        os: 'Windows Server 2019 (Domain Controller, LDAP channel binding not enforced)',
        services: [
          {
            port: 389,
            name: 'ldap',
            version: 'Microsoft Active Directory LDAP (channel binding: disabled)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/relay/forward',
                param: 'captured_auth',
                triggerSubstrings: ['DC02$@CORP'],
                vulnerableResponse:
                  '{"status":"relayed","ldap_session":"authenticated_as_DC02$","action":"add_user_to_domain_admins","result":"success","note":"flag{ntlm_relay_to_ldap_no_channel_binding_grants_domain_admin}"}',
                normalResponse: '{"error":"LDAP bind failed - no valid captured authentication provided"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Web: XML-RPC Pingback SSRF
  {
    id: 'web-xmlrpc-pingback-ssrf',
    title: 'XML-RPC Pingback Abuse for Internal Port Scanning & SSRF',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Blogsvc31 exposes /xmlrpc.php with the pingback.ping method enabled — a legacy feature that lets one ' +
      'blog notify another that it linked to it, by having the SERVER itself fetch a URL you supply and ' +
      'report back what it found. That "the server fetches a URL you supply" mechanic is a textbook SSRF ' +
      'primitive: point it at an internal-only address instead of a real blog, and the response timing and ' +
      'content reveal exactly what the server can reach that you cannot reach directly yourself. This exact ' +
      'abuse (xmlrpc.php pingback used for internal port scanning and SSRF) is a well-documented, ' +
      'repeatedly-disclosed real vulnerability class in WordPress and similar blogging platforms, common ' +
      'enough that most hardened deployments disable XML-RPC entirely specifically because of this.',
    objectives: [
      { text: 'nmap -sV 10.10.192.2', why: 'Confirms the blog service and its exposed XML-RPC endpoint before probing pingback behavior.' },
      {
        text: 'curl -X POST -d "pingback_target=http://169.254.169.254/latest/meta-data/" 10.10.192.2/xmlrpc.php',
        why: 'Pointing the pingback URL at the cloud metadata service instead of a real blog post is the highest-value SSRF target available — if the server fetches it and reflects the response, you have turned a "notify me when you link to my post" feature into a full internal-network proxy.',
      },
      { text: 'Confirm the leaked metadata and capture the flag', why: 'The pingback response reflecting real internal content back to you is what proves impact — an unreachable-from-outside endpoint just got read anyway, entirely through the blog server acting as an unwitting proxy.' },
    ],
    hints: [
      'nmap -sV 10.10.192.2',
      'curl -X POST -d "pingback_target=http://169.254.169.254/latest/meta-data/" 10.10.192.2/xmlrpc.php',
      'The pingback response echoes back exactly what the server fetched -- including content you could never reach directly from outside the network.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'blogsvc31',
        ip: '10.10.192.2',
        os: 'Ubuntu 22.04 (PHP blog platform, XML-RPC pingback enabled)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache 2.4 (PHP 8.1, xmlrpc.php pingback.ping enabled)',
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/xmlrpc.php',
                param: 'pingback_target',
                triggerSubstrings: ['169.254.169.254'],
                vulnerableResponse:
                  '<?xml version="1.0"?><methodResponse><fault>Pingback fetched target -- response body: ' +
                  '{"role":"blogsvc31-iam-role","access_key":"AKIA_INTERNAL_ONLY_NEVER_EXPOSED"} -- ' +
                  'note: flag{xmlrpc_pingback_ssrf_reaches_cloud_metadata}</fault></methodResponse>',
                normalResponse: '<?xml version="1.0"?><methodResponse><fault>Pingback target URL must be a public blog post</fault></methodResponse>',
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
