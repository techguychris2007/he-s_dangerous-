import type { CurriculumLesson } from '../content/curriculumDefinition';

const references = {
  sysmon: { title: 'Microsoft Sysinternals · Sysmon', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon' },
  sigma: { title: 'SigmaHQ · Rule structure and detection logic', url: 'https://sigmahq.io/docs/basics/rules.html' },
  atomic: { title: 'Atomic Red Team · Tests, prerequisites and cleanup', url: 'https://github.com/redcanaryco/atomic-red-team' },
  ir: { title: 'NIST SP 800-61 Rev. 3 · Incident response and CSF 2.0', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final' },
  velociraptor: { title: 'Velociraptor · Artifact definitions and preconditions', url: 'https://docs.velociraptor.app/docs/artifacts/' },
  volatility: { title: 'Volatility 3 · Windows analysis tutorial', url: 'https://volatility3.readthedocs.io/en/latest/getting-started-windows-tutorial.html' },
  yara: { title: 'YARA · Writing rules', url: 'https://yara.readthedocs.io/en/stable/writingrules.html' },
  shuffle: { title: 'Shuffle · Security automation', url: 'https://github.com/Shuffle/Shuffle' },
  detectionLab: { title: 'DetectionLab · Architecture and maintenance notice', url: 'https://github.com/clong/DetectionLab' },
  config: { title: 'Nextron Systems · Sysmon configuration', url: 'https://github.com/NextronSystems/sysmon-config' },
  packet: { title: 'Wireshark · Display filtering', url: 'https://www.wireshark.org/docs/wsug_html_chunked/ChWorkBuildDisplayFilterSection.html' },
};
const code = (...lines: string[]) => lines.join('\n');

export const DEFENSIVE_PRACTICAL_LESSONS: CurriculumLesson[] = [
  {
    id: 'defensive-triage-host-telemetry', slug: 'host-telemetry',
    title: 'Read Windows & Linux Evidence from the Source', minutes: 45,
    summary: 'Read logon, process, service and journal records; follow identifiers and verify that collection is working.',
    prerequisite: 'A process is a running program. A service performs background work. A terminal command runs a program with arguments. This lesson explains the event fields before using them.',
    outcomes: ['Distinguish current host state from historical events', 'Extract named Windows event fields', 'Read Linux service and authentication evidence in UTC', 'Recognize collection gaps'],
    introduction: 'A defender must know what the operating system recorded, which component recorded it and what the record means. A dashboard label becomes useful when you can trace it to the source. We will build that skill with Windows and Linux command examples and a workstation investigation.',
    sections: [
      { title: 'Accounts, sessions, processes and records', paragraphs: [
        'An account is an identity with assigned permissions. A logon session represents an authenticated context. Several processes can run inside a session. A process can create child processes, each with a process identifier, or PID. The operating system reuses PIDs: PID 4120 today can identify a different program tomorrow. Match the computer and creation time too, or use a stable source identifier such as a Sysmon ProcessGuid.',
        'An event is a source’s statement about an occurrence. Provider, event identifier, timestamp and named fields define its meaning. Event ID 1 from Sysmon is different from event ID 1 from another provider. A service listing describes current configuration; an installation event records a historical change. Neither automatically establishes who was physically at the keyboard, what every instruction did or whether the activity was authorized.'
      ] },
      { title: 'Windows authentication and service evidence', paragraphs: [
        'Security event 4624 records a successful logon on the reporting computer; 4625 records a failed logon. Inspect account, source address, authentication package and LogonType. Type 3 is a network logon; type 10 commonly represents remote interactive access. A type 3 record alone does not prove an RDP desktop session. Event 4720 concerns account creation and event 1102 concerns Security audit-log clearing. Audit policy and retention determine which records are available.',
        'System event 7045 from the Service Control Manager reports service installation. Security event 4697 can report it when the relevant audit policy is enabled. A service name resembling Windows Update is only a name. Inspect its binary path, creator context, installation time and approved change. Legitimate remote-support software can be abused, so corroborate installation with ownership and session activity.'
      ], code: code(
        '# PowerShell on an authorized Windows training host:',
        '$start = (Get-Date).AddHours(-2)',
        "Get-WinEvent -FilterHashtable @{",
        "  LogName = 'Security'; Id = 4624,4625,4720,1102; StartTime = $start",
        '} | Select-Object TimeCreated, Id, ProviderName, MachineName, Message',
        '',
        "Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045; StartTime=$start} |",
        '  Select-Object TimeCreated, Id, Message'
      ), label: 'Real host-side queries · source events and providers' },
      { title: 'Extract named fields without guessing array positions', paragraphs: [
        'The rendered Message is readable but can change with language and provider version. Event XML exposes named data fields. Parse each EventData element by its Name attribute and preserve the original EVTX or XML alongside a normalized export. The example keeps computer, record ID and UTC time without assuming the fifth property is always a username.',
        'A missing field means unknown. Do not replace an absent result with success or an absent account with the currently signed-in user. Record parser failures separately. EventRecordID belongs to its channel and host context; it is not a global incident identifier. Retain original timestamps and offsets before normalization, especially when collection delays or source clock skew can reverse apparent order.'
      ], code: code(
        "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 10 |",
        '  ForEach-Object {',
        '    [xml]$xml = $_.ToXml()',
        '    $data = @{}',
        '    foreach ($item in $xml.Event.EventData.Data) {',
        "      $data[$item.Name] = $item.'#text'",
        '    }',
        '    [pscustomobject]@{',
        '      Computer = $_.MachineName; RecordId = $_.RecordId',
        "      TimeUtc = $_.TimeCreated.ToUniversalTime().ToString('o')",
        "      Account = $data['TargetUserName']",
        "      SourceAddress = $data['IpAddress']; LogonType = $data['LogonType']",
        '    }',
        '  } | ConvertTo-Json'
      ), label: 'Named-field extraction · retain the original records too' },
      { title: 'Linux journal, processes and listening sockets', paragraphs: [
        'On a systemd host, journalctl reads the journal and systemctl inspects service state. The SSH service may be named ssh or sshd depending on the distribution. Identify the actual unit before filtering. Some distributions also store authentication messages in /var/log/auth.log or /var/log/secure, depending on configuration. Request UTC and restrict the interval so another analyst can repeat the search.',
        'A failed SSH attempt means that attempt failed. A later accepted authentication establishes that credentials were accepted, not that the rightful owner used them. Correlate source, account, session and subsequent actions. Shell history can be edited, disabled or incomplete and generally does not capture every noninteractive action. Process and socket listings are snapshots: record when they were collected.'
      ], code: code(
        '# Linux training VM; confirm the service name locally.',
        'timedatectl status',
        'systemctl list-units --type=service --all',
        'journalctl --utc --since "2026-01-12 08:00:00" --until "2026-01-12 09:00:00" -u ssh --no-pager',
        'journalctl --utc --since "1 hour ago" -o json > journal-window.jsonl',
        'ps -eo pid,ppid,user,lstart,args',
        'ss -lntup',
        'systemctl show ssh -p ExecStart -p User -p FragmentPath'
      ), label: 'Real Linux commands · time, service and runtime context' },
      { title: 'Check collection before interpreting an empty search', paragraphs: [
        'Verify channel coverage, host last-seen time, retention and parser health before closing an alert. Send an approved benign test through the source-to-search path. If it exists on the host but is absent from the SIEM, inspect forwarding, permissions, parsing and time filters. A healthy agent heartbeat does not prove every required channel is being forwarded.',
        'In the linked loader investigation, retain the attachment and execution records from the same workstation. Compare the approved remote-support deployment on a different computer without treating its ticket as blanket authorization. Your first triage result should name the host, identity, UTC window, source records, conclusion and next action. The case records are reconstructed; the commands above illustrate the corresponding workstation investigation.'
      ] }
    ],
    table: { headers: ['Question', 'Useful source', 'Limit'], rows: [
      ['Did authentication succeed?', '4624 with host and provider', 'Does not establish rightful use'],
      ['Was a service installed?', '7045 plus change record', 'Installation is not automatically malicious'],
      ['Is a process running now?', 'Timestamped process snapshot', 'May miss short-lived execution']
    ] },
    exercise: { scenario: 'WS-14 has script-driven DLL execution. WS-22 has a ticket approving the same remote-support product.', task: 'Explain why the WS-22 ticket cannot close the WS-14 alert and identify the first correlation.', answer: 'The approval concerns a different host and deployment context. Correlate attachment interaction with execution on WS-14, then inspect service and remote-session evidence. Separate product legitimacy from deployment authorization.', evidence: 'Host, account, UTC window, record IDs, query and bounded conclusion.' },
    misconceptions: ['A successful logon proves authentication, not rightful use.', 'Names and signatures alone do not decide authorization.', 'A collection gap must stay visible in the conclusion.'],
    sources: [references.sysmon, references.ir, { title: 'systemd · journalctl', url: 'https://www.freedesktop.org/software/systemd/man/latest/journalctl.html' }],
    labs: ['defence-icedid-response', 'guided-pentest-forensics-ghcorp-workstation'],
    quiz: [
      { prompt: 'Why correlate a PID with host and creation time?', choices: ['PIDs are reused', 'PIDs are globally unique', 'Only root has a PID'], correctIndex: 0, explanation: 'The same number can identify different processes over time or across computers.' },
      { prompt: 'The source stopped forwarding. What does an empty search establish?', choices: ['The host is clean', 'The missing interval limits the conclusion', 'The host is definitely compromised'], correctIndex: 1, explanation: 'Missing observation prevents a reliable absence claim.' }
    ]
  },
  {
    id: 'defensive-triage-network-evidence', slug: 'network-evidence',
    title: 'DNS, TCP & TLS: What Network Evidence Can Prove', minutes: 40,
    summary: 'Filter captures, follow connections and distinguish resolution, transport, encryption and application evidence.',
    prerequisite: 'An address identifies a network endpoint in context. A port identifies a transport endpoint. DNS resolves names; TCP carries an ordered stream; TLS protects application data. These layers are explained below.',
    outcomes: ['Distinguish capture and display filters', 'Separate DNS resolution from connection success', 'Explain encrypted-traffic visibility', 'Correlate flows with host processes'],
    introduction: 'A packet capture records what crossed an observation point. It does not automatically identify the person behind a request or reveal encrypted content. Follow the layers from a name lookup to an application action, and match each conclusion to the evidence available.',
    sections: [
      { title: 'From a name lookup to transport state', paragraphs: [
        'A browser requesting https://portal.example may use a cache or query DNS for an A or AAAA record. A describes an IPv4 address; AAAA describes an IPv6 address. An answer may contain multiple addresses, an alias, an error or no usable result. A DNS query proves a name was requested. It does not prove the answer was used or that any connection succeeded.',
        'A TCP SYN, SYN/ACK and ACK normally establish transport state. Retransmissions can reflect loss or an unresponsive peer; a reset can terminate a connection. Port 443 is a convention rather than proof of TLS or a safe application. UDP and QUIC have different semantics. NAT and proxies can make many clients share one observed address, requiring additional mapping logs for attribution.'
      ] },
      { title: 'Capture filters and display filters', paragraphs: [
        'A capture filter decides what gets retained. A display filter selects packets already in the file. Traffic excluded during acquisition cannot be recovered by changing a display expression afterward. With tcpdump, quote expressions containing spaces or parentheses to prevent shell interpretation. Use an authorized interface, scope and collection budget because captures can contain sensitive data.',
        'Wireshark display expressions and BPF-style tcpdump filters are different languages. In Wireshark, dns selects dissected DNS packets; tcp.port == 443 tests either endpoint’s TCP port. The tcpdump expression host 192.0.2.10 and tcp port 443 operates during capture or capture-file reading. A text substring match is different from a structured query-name test.'
      ], code: code(
        '# Read an existing capture without sending traffic:',
        "tcpdump -nn -r training.pcap 'host 192.0.2.10 and tcp port 443'",
        "tcpdump -nn -r training.pcap 'udp port 53 or tcp port 53'",
        '',
        '# Enter these in Wireshark, not in a shell:',
        'dns.flags.response == 0',
        'dns.qry.name contains "example"',
        'tcp.flags.syn == 1 && tcp.flags.ack == 0',
        'ip.addr == 192.0.2.10 && tcp.port == 443'
      ), label: 'Real packet filters · retain the tool and capture context' },
      { title: 'Encrypted metadata and plaintext provenance', paragraphs: [
        'A sensor may observe endpoints, lengths, timing, direction and parts of the TLS handshake. Visibility depends on protocol version and deployment: encrypted ClientHello can hide information older workflows expected to see. A visible server name is client-supplied context, and a valid certificate does not make every action behind that identity benign.',
        'Ordinary TLS application records do not expose an HTTP body. Plaintext in an investigation needs an explained source: application auditing, endpoint instrumentation, approved TLS termination or an authorized decrypted capture. Absence of plaintext limits claims about transferred content, while leaving connection evidence useful. Also distinguish payload bytes, wire bytes and aggregated flow estimates when interpreting volume.'
      ] },
      { title: 'Join a connection to a host process', paragraphs: [
        'A five-tuple contains source address, source port, destination address, destination port and transport protocol. Add an interval and observation point. Endpoint telemetry may associate the flow with a user and process; a perimeter sensor usually cannot do so alone. Join using stable process IDs or precise host and time context, then account for DHCP, NAT and proxy translation.',
        'The following local example exposes its assumptions. Matching host, destination and time produces a candidate association, not a universal proof of causation. In the supply-chain case, DNS and process-linked network evidence support contact from MonitoringService.exe. They do not reveal encrypted payload contents or establish which documents, if any, were stolen.'
      ], code: code(
        'dns = {"host": "MON-01", "answer": "203.0.113.90", "time": 100}',
        'flow = {"host": "MON-01", "dst": "203.0.113.90", "time": 102,',
        '        "process_guid": "PG-51", "bytes_out": 900}',
        'same_host = dns["host"] == flow["host"]',
        'same_address = dns["answer"] == flow["dst"]',
        'within_window = 0 <= flow["time"] - dns["time"] <= 30',
        'print(same_host and same_address and within_window)  # True',
        '# Candidate correlation; payload and intent remain unproven.'
      ), label: 'Python · a bounded local correlation' },
      { title: 'Periodicity, baselines and missing sensors', paragraphs: [
        'Repeated communication can be a command-and-control lead, but updaters and monitoring agents are also periodic. Compare intervals, jitter, fleet prevalence, process ancestry and destination ownership. Unknown reputation means a source has no reported verdict; it does not make an address safe. A large transfer is a scoping lead requiring file access, staging or application evidence to establish content.',
        'The case includes MON-02 with the same installed software but stale endpoint visibility. Keep it in the hunt population and assign targeted collection. DNS coverage cannot replace missing process evidence. Record the supported claim, sensor placement, clock uncertainty, encrypted-content limitations and unresolved hosts when closing a checkpoint.'
      ] }
    ],
    table: { headers: ['Observation', 'Supported claim', 'Still needed'], rows: [
      ['DNS request', 'A name was queried', 'Connection outcome'],
      ['Completed connection', 'Transport contact occurred', 'Application action'],
      ['Process-linked flow', 'A process is associated with contact', 'Intent, content and impact']
    ] },
    exercise: { scenario: 'A DNS result and TLS flow share a host and destination. A second host has no endpoint records because its sensor stopped yesterday.', task: 'State the first host’s supported claim and the second host’s next action.', answer: 'The first has process-linked contact after resolution; content theft is unproven. The second needs targeted collection or sensor repair and remains in scope.', evidence: 'Host, UTC interval, destination, observation sources and visibility limits.' },
    misconceptions: ['A DNS query does not prove a connection.', 'Port 443 does not prove safety.', 'TLS plaintext needs an explained source.'],
    sources: [references.packet, references.sysmon, { title: 'tcpdump · Manual', url: 'https://www.tcpdump.org/manpages/tcpdump.1.html' }],
    labs: ['defence-supply-chain-hunt', 'guided-pentest-soc-dns-beaconing'],
    quiz: [
      { prompt: 'What does an ordinary encrypted TLS capture expose?', choices: ['Every password', 'Metadata within the sensor’s visibility', 'The rightful user’s intent'], correctIndex: 1, explanation: 'Application content requires another plaintext source or approved decryption.' },
      { prompt: 'A Wireshark display filter selects what?', choices: ['Already captured packets', 'Every packet on the internet', 'Endpoint permissions'], correctIndex: 0, explanation: 'It changes the view of retained packets, not the original acquisition.' }
    ]
  },
  {
    id: 'defensive-detection-sysmon-sigma-validation', slug: 'sysmon-sigma-validation',
    title: 'Build & Validate a Sysmon-to-Sigma Detection', minutes: 50,
    summary: 'Define the source contract, write an original rule and test both the analytic and its delivery path.',
    prerequisite: 'Telemetry records activity. A detection applies logic to records. A false positive is benign activity that matches that logic. The fields, Boolean conditions and validation steps are explained here.',
    outcomes: ['Verify required Sysmon fields', 'Write a Sigma selection', 'Design positive, negative and missing-field fixtures', 'Test source-to-alert delivery'],
    introduction: 'A query cannot detect a field the collector never sends. Detection engineering therefore begins with collection and meaning, then moves to logic and measured validation. We will build a narrow PowerShell review analytic and document precisely what it catches and misses.',
    sections: [
      { title: 'Establish the sensor contract', paragraphs: [
        'Sysmon records host activity in its Windows operational channel. Configuration controls included and excluded events. Process creation, network connection and registry changes are distinct event families; high-volume categories require capacity planning. Confirm installed version and schema before applying a configuration from a repository. Review, test and version a curated configuration for your own environment.',
        'This analytic requires Image, CommandLine, ParentImage, User, Computer and a stable process identifier in process-creation records. Capture a raw source event and its normalized SIEM representation. Document each field mapping and any transformation. Command lines can contain credentials, so retention and access controls are part of the collection design. Missing input is a coverage problem, not a clean negative.'
      ], code: code(
        "Get-WinEvent -ListLog 'Microsoft-Windows-Sysmon/Operational'",
        'Get-WinEvent -FilterHashtable @{',
        "  LogName='Microsoft-Windows-Sysmon/Operational'; Id=1",
        '} -MaxEvents 5 | Select-Object TimeCreated, MachineName, Message',
        '',
        '# Inspect the locally installed Sysmon configuration and schema:',
        '.\\Sysmon64.exe -c',
        '.\\Sysmon64.exe -s'
      ), label: 'Verify the installed source and available schema' },
      { title: 'Specify a behavior before writing syntax', paragraphs: [
        'Our review candidate is a PowerShell executable launched with the full -EncodedCommand argument. Encoding is reversible representation, not encryption or a malicious verdict. Administrators and deployment systems can use it legitimately. This teaching analytic intentionally does not cover abbreviated switches, argument rearrangement or every obfuscation form. Documenting those limits prevents false coverage claims.',
        'Image identifies the executable and CommandLine describes the invocation. Parent process, user, asset role and change records provide triage context. Signing and administrator status are insufficient allow conditions: trusted interpreters and privileged accounts can be abused. A justified exception should identify a specific job, owner, source and review date, while preserving tests for the suspicious behavior.'
      ] },
      { title: 'Read an original Sigma rule line by line', paragraphs: [
        'Sigma expresses an analytic in a structured format. logsource identifies the product and event category. The fields inside selection are conjunctive: executable identity and argument condition must both hold. The image suffix list supplies alternatives within that field. condition names the selection. A backend and conversion pipeline must map the generic fields into your SIEM schema before deployment.',
        'This original DarkWorld rule is a test analytic. Its falsepositives section documents likely benign matches; it does not automatically exclude them. ATT&CK tags describe behavior under investigation and do not prove an actor’s identity. status, owner, dates and version history help reviewers understand maturity and changes. A syntactically valid rule can still be operationally useless if the source mapping is wrong.'
      ], code: code(
        'title: DarkWorld Encoded PowerShell Review Candidate',
        'id: 60cd5748-2cbc-49cb-8e37-1a3a27a46f10',
        'status: test',
        'description: Full EncodedCommand argument; abbreviated switches are outside scope.',
        'author: DarkWorld',
        'date: 2026-10-16',
        'logsource:',
        '  category: process_creation',
        '  product: windows',
        'detection:',
        '  selection:',
        '    Image|endswith:',
        "      - '\\powershell.exe'",
        "      - '\\pwsh.exe'",
        "    CommandLine|contains: ' -EncodedCommand '",
        '  condition: selection',
        'falsepositives:',
        '  - Approved administration and deployment jobs',
        'level: medium',
        'tags:',
        '  - attack.execution',
        '  - attack.t1059.001'
      ), label: 'Original Sigma teaching example · review before production use' },
      { title: 'Test true matches, near misses and unknown input', paragraphs: [
        'A positive fixture satisfies the intended behavior. A negative fixture should resemble it while violating a condition, such as another executable with the same argument text in a filename. A benign-but-matching fixture proves that a match still needs contextual review. A missing-field fixture checks that parser failures are not being counted as healthy coverage.',
        'The Python model below tests the narrow Boolean idea without pretending to be a Sigma converter. Production validation must also compile the rule through the chosen backend pipeline and execute its generated query against a test index. Retain raw event, normalized event, compiled query, expected decision and rule version so a later parser or rule change can be tested against the same evidence.'
      ], code: code(
        'def review_candidate(event):',
        '    image = event.get("Image")',
        '    command = event.get("CommandLine")',
        '    if not isinstance(image, str) or not isinstance(command, str):',
        '        return None  # required telemetry is unknown',
        '    binary = image.lower().endswith(("\\\\powershell.exe", "\\\\pwsh.exe"))',
        '    argument = " -encodedcommand " in command.lower()',
        '    return binary and argument',
        '',
        'positive = {"Image": r"C:\\Windows\\System32\\powershell.exe",',
        '            "CommandLine": "powershell.exe -EncodedCommand ZQBjAGgAbwA="}',
        'near_miss = {"Image": r"C:\\Windows\\notepad.exe",',
        '             "CommandLine": "notepad.exe notes -EncodedCommand example.txt"}',
        'assert review_candidate(positive) is True',
        'assert review_candidate(near_miss) is False',
        'assert review_candidate({"Image": "pwsh.exe"}) is None'
      ), label: 'Runnable Python fixtures · a logic model, not a Sigma runtime' },
      { title: 'Validate the complete detection path', paragraphs: [
        'An end-to-end test covers approved action, sensor, forwarding, parsing, rule execution, alert routing and analyst visibility. Atomic Red Team publishes specific tests with prerequisites and cleanup. Read the chosen test completely and use an isolated authorized environment. Do not execute a whole technique collection without reviewing each action. Begin with a harmless local marker when that answers the test question.',
        'Record expected source events, host, time window and cleanup. If no alert appears, inspect each hop. A source event present on the host but missing in the SIEM points to collection or parsing. A matching query with no analyst case points to routing. A successful test validates that version, host and path; it does not demonstrate every endpoint or variant. The browser case is a reasoning exercise and does not execute Atomic tests.'
      ] },
      { title: 'Tune without erasing useful coverage', paragraphs: [
        'Precision concerns how many reviewed matches are useful; recall concerns how much relevant activity is detected. In operations, the complete set of missed activity is usually unknown, so state the test population and known blind spots. Report sensor and parser coverage alongside alert volume, reviewed closure quality and response delays. An uninstrumented host producing no alerts is not evidence of effective detection.',
        'When an approved job creates noise, add its fixture before changing the rule. Re-run the original positive and near-miss cases plus missing-input tests. Assign exceptions an owner and expiry or review trigger. In the linked investigations, remote-support products, scripts and signed software need contextual analysis rather than permanent allowlisting by name.'
      ] }
    ],
    table: { headers: ['Layer', 'Test', 'Likely failure'], rows: [
      ['Source', 'Known event in host channel', 'Sensor/configuration'],
      ['Normalization', 'Required fields retain meaning', 'Parser/mapping'],
      ['Delivery', 'Expected case reaches analyst', 'Rule/routing']
    ] },
    exercise: { scenario: 'An approved deployment matches the encoded-command analytic. Another event lacks CommandLine.', task: 'Handle both without suppressing all PowerShell activity.', answer: 'Review a bounded job-specific exception with a regression fixture. Treat missing CommandLine as unknown telemetry and investigate collection or parsing. Verify the source-to-case path before describing coverage.', evidence: 'Rule, source contract, fixture set, generated query and end-to-end test record.' },
    misconceptions: ['Telemetry collection is not detection by itself.', 'A Sigma file needs backend conversion and correct field mapping.', 'Encoding alone is not a malicious verdict.'],
    sources: [references.sysmon, references.sigma, references.config, references.atomic],
    labs: ['defence-icedid-response', 'defence-supply-chain-hunt'],
    quiz: [
      { prompt: 'Only CommandLine matches a selection requiring Image AND CommandLine. What happens?', choices: ['The selection does not match', 'Any single field is enough', 'The event becomes high severity'], correctIndex: 0, explanation: 'Both field conditions must hold.' },
      { prompt: 'A required field is absent. How should the result be interpreted?', choices: ['Clean negative', 'Visibility or parsing problem', 'Confirmed malware'], correctIndex: 1, explanation: 'The analytic cannot reliably evaluate its claimed behavior without required input.' }
    ]
  },
  {
    id: 'defensive-investigation-forensic-collection', slug: 'forensic-collection',
    title: 'Collect & Correlate Memory, Disk & Endpoint Artifacts', minutes: 50,
    summary: 'Preserve evidence, use modern memory-analysis commands and design bounded endpoint collections.',
    prerequisite: 'RAM holds changing runtime state. Disk stores persistent data. A hash is a digest of bytes. A forensic artifact is a trace that may answer a historical question; each source has limits.',
    outcomes: ['Plan a collection with provenance', 'Use Volatility 3 command forms', 'Interpret Autopsy and filesystem artifacts', 'Explain targeted Velociraptor collections'],
    introduction: 'Forensics connects traces to an investigative question while preserving how those traces were obtained. Collecting everything can delay response; collecting too little can lose the decisive evidence. Choose sources according to the question, volatility, collection impact and operational constraints.',
    sections: [
      { title: 'Preserve provenance and explain acquisition decisions', paragraphs: [
        'Runtime state can disappear when a process ends or a host restarts. Persistent files may survive longer but can be overwritten. Active destructive activity may justify immediate isolation before an ideal acquisition. Record the decision, authority, expected state changes and prioritized evidence. A generic order-of-volatility list cannot resolve every incident’s business and technical tradeoffs.',
        'A manifest should record case ID, source host, collector, tool and version, UTC start/end, method, destination, errors and custody transfers. Keep originals controlled and analyze working copies. SHA-256 helps identify later byte changes; it does not prove original truth, completeness or collector identity. Keep acquisition logs, configuration and failed collections with the evidence.'
      ], code: code(
        '# Analysis workstation after an approved acquisition:',
        'sha256sum memory.raw disk-image.E01 > evidence-sha256.txt',
        'sha256sum -c evidence-sha256.txt',
        '',
        '# PowerShell equivalent for one collected file:',
        'Get-FileHash -Algorithm SHA256 -LiteralPath .\\memory.raw'
      ), label: 'Integrity comparison · choose the command for your operating system' },
      { title: 'Memory acquisition and Volatility 3 analysis', paragraphs: [
        'Volatility analyzes a memory image; acquisition is a separate operation using a method appropriate to the target platform. Record acquisition impact and image type. Modern Volatility 3 workflows use plugins and symbol support rather than blindly reusing old Volatility 2 profile commands. For offline analysis, prepare required symbols through an authorized process before disconnecting.',
        'Start with image context, processes and parent-child relationships, then inspect candidate command lines and network evidence with plugins available for that image and version. A tree suggests relationships, not intent. A capture is time-bounded and can be incomplete. Missing processes do not prove they never ran. Distinguish list-based results from scanning for remnants and preserve the method behind each finding.'
      ], code: code(
        '# From a Volatility 3 source checkout:',
        'python3 vol.py --help',
        'python3 vol.py -f memory.raw windows.info',
        'python3 vol.py -f memory.raw windows.pslist',
        'python3 vol.py -f memory.raw windows.pstree',
        'python3 vol.py -f memory.raw windows.cmdline',
        '# Available plugins and results depend on image, symbols and version.'
      ), label: 'Modern Volatility 3 command forms' },
      { title: 'Autopsy ingest and filesystem interpretation', paragraphs: [
        'In Autopsy, create a case with reference and examiner, add the acquired data source, confirm time interpretation and select ingest modules relevant to the question. Preserve the image, ingest settings and warnings. Filesystem views, keyword results, browser artifacts and deleted-file recovery are different products. A finding needs its original path, source artifact and enough context to reproduce the interpretation.',
        'NTFS metadata, the USN journal, registry hives, scheduled tasks and service configuration can support persistence and file-activity analysis. Prefetch can support execution analysis where enabled and retained. Amcache and Shimcache are not universal standalone execution verdicts; meaning depends on artifact version and surrounding evidence. Modification time can reflect copying or deliberate changes rather than execution. Seek an independent trace before making a strong claim.'
      ] },
      { title: 'Targeted collection with Velociraptor artifacts', paragraphs: [
        'Velociraptor artifacts package collection logic, parameters and optional preconditions into reviewable definitions. A precondition can skip a source on an irrelevant platform. Review the queries, external tools and upload behavior before scheduling a hunt. Set host population, resource budget and output destination; test a small sample before expansion. A client that never responds is different from a successful collection returning zero matches.',
        'This original minimal artifact collects host context only. It teaches structure without collecting sensitive files. For an incident, choose established artifacts for the precise question, inspect the installed version and retain parameter values. Permissions, platform paths and live state affect output, so preserve status and errors alongside returned rows.'
      ], code: code(
        'name: Custom.DarkWorld.HostContext',
        'description: Basic host context for an authorized training case.',
        'type: CLIENT',
        'sources:',
        '  - name: Context',
        "    precondition: SELECT OS FROM info() WHERE OS = 'windows'",
        '    query: |',
        '      SELECT Hostname, OS, Architecture FROM info()',
        '# Review in the installed artifact editor before collection.'
      ), label: 'Original VQL artifact · bounded host information' },
      { title: 'Correlate sources into a timeline', paragraphs: [
        'Normalize to UTC while retaining source values and offsets. Timestamp meaning matters: file modification, event creation, ingestion and acquisition are different clocks. Service installation, process launch and a connection form a useful sequence when host, identity or process context agrees. Temporal proximity alone does not establish that one caused the next.',
        'For the loader case, distinguish the suspicious service from the approved deployment on another host. Investigating a possible transfer may require process command lines, file access and application audit in addition to a flow. A connection from rclone.exe is not a full inventory of stolen documents. State observations, interpretation, unknowns and the bounded next collection separately.'
      ] },
      { title: 'Maintain the evidence record through recovery', paragraphs: [
        'Store evidence outside the affected host’s rebuild path and restrict access: memory and disk images can contain secrets and personal data. Document derivative exports, redactions and transformations. Never overwrite the sole original with a cleaned copy. Follow retention and handling rules applicable to the organization and collection.',
        'A clean build and tested business function support recovery of the tested host. They do not resolve every affected identity or unobserved machine. Record pre-reboot memory loss, unavailable logs and failed collections explicitly. Keep the remaining hunt assigned rather than converting “restored service” into an unsupported statement that the entire environment is clean.'
      ] }
    ],
    table: { headers: ['Source', 'Useful question', 'Limit'], rows: [
      ['Memory view', 'What runtime state is recoverable?', 'Snapshot and acquisition gaps'],
      ['Service/registry artifact', 'What persistence configuration existed?', 'Configuration alone is not execution'],
      ['Filesystem time', 'What metadata change was recorded?', 'Meaning depends on operation and filesystem']
    ] },
    exercise: { scenario: 'A host rebooted before memory collection, but service events and disk artifacts survive.', task: 'Choose useful evidence and state what cannot be reconstructed reliably.', answer: 'Preserve service configuration, event logs, relevant hives and filesystem traces with provenance. Correlate independent network evidence. State that pre-reboot runtime state was not acquired; persistent artifacts cannot reconstruct every memory-only action.', evidence: 'Manifest, hashes, source references, UTC timeline and collection gaps.' },
    misconceptions: ['Volatility is an analysis tool, not the acquisition step.', 'A hash is not complete provenance.', 'One filesystem artifact rarely establishes the entire execution story.'],
    sources: [references.volatility, references.velociraptor, references.ir, { title: 'Autopsy · Documentation', url: 'https://www.autopsy.com/documentation/' }],
    labs: ['defence-icedid-response', 'guided-pentest-forensics-ghcorp-workstation'],
    quiz: [
      { prompt: 'A matching SHA-256 comparison establishes what?', choices: ['Bytes match the earlier digest', 'Collector identity is proven', 'All relevant events were collected'], correctIndex: 0, explanation: 'Digest comparison checks integrity, not completeness or full provenance.' },
      { prompt: 'A client never answered a hunt. Is this a zero-match result?', choices: ['Yes', 'No; preserve the collection failure', 'Only on Windows'], correctIndex: 1, explanation: 'No response is a visibility gap; a completed query returning no rows is different.' }
    ]
  },
  {
    id: 'defensive-investigation-intelligence-scoping', slug: 'intelligence-scoping',
    title: 'Use Threat Intelligence & OSINT to Scope an Incident', minutes: 40,
    summary: 'Evaluate indicators, preserve provenance and distinguish observed infrastructure from actor attribution.',
    prerequisite: 'An indicator is an observable such as a domain, address or file digest. A hypothesis is an explanation to test. Confidence measures support for a claim; it differs from incident severity.',
    outcomes: ['Evaluate intelligence provenance and freshness', 'Normalize indicators without changing meaning', 'Correlate resource and identity evidence', 'Avoid unsupported attribution'],
    introduction: 'Intelligence is useful when it changes a bounded investigation decision. Copying a list of suspicious addresses into an alert does not explain whether an observation matters. We will connect public reporting, local evidence and asset ownership while preserving uncertainty.',
    sections: [
      { title: 'Indicators, behaviors and attribution', paragraphs: [
        'An address or domain is an observable. A report can associate it with activity during a particular interval, but infrastructure changes owners and shared hosting can serve unrelated tenants. File digests identify exact bytes, while behavioral descriptions can survive filename and address changes. Preserve type, value, first/last observed time, source publication, confidence and context instead of keeping an unlabelled string list.',
        'Actor attribution is a separate claim requiring substantially more evidence than one matching indicator. Similar software and techniques are used by multiple groups and administrators. An ATT&CK mapping describes behavior; it is not a verdict about the operator. In a case note, distinguish observed contact, local authorization status, intelligence association and attribution assessment.'
      ] },
      { title: 'Check source quality and independence', paragraphs: [
        'Prefer the originating advisory, vendor analysis or investigation report when available. Record the publication date and the period the report describes; an article published in June may describe an intrusion months earlier. Check whether a claim is confirmed, assessed or unresolved. Ten feeds repeating the same original report are not ten independent confirmations.',
        'A reputation result of unknown means the queried service has no reported judgment in that context. It is not evidence of safety. Freshness matters for blocking decisions, and confidence is not the same as severity. A low-confidence lead on a critical identity may deserve urgent review because the plausible impact is high, even while the claim remains uncertain.'
      ] },
      { title: 'Normalize safely and retain the original value', paragraphs: [
        'Defanged domains such as portal[.]example are useful in notes because they reduce accidental navigation. Reconstruct only the observable needed for a local comparison, retaining the raw string and transformation. Normalize DNS names case-insensitively, but do not indiscriminately lowercase URL paths, opaque tokens or case-sensitive identifiers. Validate addresses and indicator types before using them in a lookup.',
        'The example uses Python’s standard library and only local strings. It separates an original value from the normalized domain and rejects a URL where a domain was expected. This is a formatting validator, not a complete public-suffix, reputation or internationalized-domain security analysis. An incident workflow should preserve parsing errors instead of silently dropping them.'
      ], code: code(
        'import re',
        '',
        'def normalize_domain(raw):',
        '    if not isinstance(raw, str):',
        '        raise TypeError("domain must be text")',
        '    value = raw.strip().replace("[.]", ".").rstrip(".").lower()',
        '    if len(value) > 253 or "://" in value or "/" in value:',
        '        raise ValueError("expected a domain, not a URL")',
        '    labels = value.split(".")',
        '    pattern = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"',
        '    if len(labels) < 2 or not all(re.fullmatch(pattern, part) for part in labels):',
        '        raise ValueError("invalid ASCII domain shape")',
        '    return {"original": raw, "normalized": value}',
        '',
        'assert normalize_domain(" Portal[.]Example. ")["normalized"] == "portal.example"'
      ), label: 'Local Python normalization · preserve the original observable' },
      { title: 'Use OSINT without contaminating the investigation', paragraphs: [
        'Public registration, certificate transparency, historical DNS and published advisories can enrich an infrastructure lead. Their observation points and update schedules differ. A domain registered recently can be benign, and a long-lived domain can be compromised. Preserve the query, provider, retrieval time and returned record. An enrichment graph should label each edge: resolved-to, certificate-contained, reported-with or actually-connected are different relationships.',
        'Avoid uploading private samples, internal hostnames, personal identifiers or secret-bearing URLs to a public service merely to get a verdict. Use approved private lookups, offline snapshots or extracted non-sensitive observables where appropriate. The DarkWorld case files provide labelled offline intelligence snapshots so investigation does not depend on external accounts or live infrastructure.'
      ] },
      { title: 'Cloud resource activity may outlive a sign-in event', paragraphs: [
        'Identity-provider logs describe authentication and token-related events at that provider. Resource logs describe actions such as mailbox reads or file access. A request using an existing token need not create a new interactive sign-in. Therefore, an empty sign-in search cannot cancel a successful resource-audit event. Verify collection health, time window, principal, app and session before interpreting the mismatch.',
        'In the token case, compare the two mailboxes sharing an unfamiliar client context with an approved backup using a different client. The historical Storm-0558 report makes token abuse a relevant hypothesis, but it cannot attribute the fictional case or establish the real key acquisition mechanism. Preserve request and session IDs for the provider. Tenant session revocation, password reset and provider signing/validation changes have different scopes.'
      ] },
      { title: 'Write an intelligence-supported scope statement', paragraphs: [
        'Start with what local records establish: hosts, identities, resource operations and interval. Add the intelligence claim with its source, relevance and uncertainty. Name the next action it justifies, such as a bounded hunt, ownership check or provider escalation. Record negative controls and missing coverage so a later reviewer can see why the decision was reasonable.',
        'For a supply-chain alert, inventory of affected packages defines a candidate population, while execution and network evidence can distinguish observed activity. A signed package still needs integrity and provenance checks. A quiet endpoint with a broken sensor stays unresolved. Do not distribute the case’s example-domain substitute as a real historical indicator; the provenance statement explains that it is training data.'
      ] }
    ],
    table: { headers: ['Claim', 'Evidence', 'Avoid'], rows: [
      ['Contact observed', 'Local connection or resource event', 'Treating a feed entry as local contact'],
      ['Deployment unauthorized', 'Ownership and change records', 'Trusting a product name alone'],
      ['Actor association', 'Explicitly sourced assessment', 'Attributing from one shared indicator']
    ] },
    exercise: { scenario: 'A mailbox read used an unfamiliar app. Identity ingestion is healthy but no new interactive sign-in exists.', task: 'State a hypothesis, a useful pivot and a conclusion you must not make.', answer: 'Investigate existing-token or token-validation paths, correlate resource sessions and app ownership, and preserve provider request evidence. Do not conclude access was impossible or attribute a specific actor from the analogy.', evidence: 'Observable register with provenance, local correlation, confidence and bounded scope.' },
    misconceptions: ['Unknown reputation is not a clean verdict.', 'Several feeds may repeat one source.', 'A technique mapping does not identify the actor.'],
    sources: [references.ir, { title: 'Microsoft · Storm-0558 technical analysis', url: 'https://www.microsoft.com/en-us/security/blog/2023/07/14/analysis-of-storm-0558-techniques-for-unauthorized-email-access/' }, { title: 'Incident-response reference collection · evaluate each linked source', url: 'https://github.com/meirwah/awesome-incident-response' }],
    labs: ['defence-cloud-token-response', 'defence-supply-chain-hunt'],
    quiz: [
      { prompt: 'Three feeds repeat one vendor report. How many independent investigations does this establish?', choices: ['Three', 'One originating report', 'None of the information can be used'], correctIndex: 1, explanation: 'Repeated publication does not create independent corroboration.' },
      { prompt: 'Resource access succeeded but no interactive sign-in appears. What should happen?', choices: ['Dismiss access', 'Review resource/session evidence and collection semantics', 'Attribute the original historical actor'], correctIndex: 1, explanation: 'Different sources record different stages of authentication and use.' }
    ]
  },
  {
    id: 'defensive-detection-malware-triage-yara', slug: 'malware-triage-yara',
    title: 'Malware Triage with Safe Fixtures & YARA', minutes: 40,
    summary: 'Read file evidence, write an original signature and understand static versus sandbox observations.',
    prerequisite: 'A file is bytes plus metadata. Static analysis examines bytes without running the program; dynamic analysis observes execution. A signature tests specified patterns rather than proving every possible behavior.',
    outcomes: ['Preserve a sample’s identity and handling context', 'Write and test a YARA condition', 'Explain false positives and false negatives', 'Correlate file triage with endpoint behavior'],
    introduction: 'Malware triage answers bounded questions about a suspicious artifact before deeper analysis. The goal is a reproducible decision with preserved evidence. You can learn signature mechanics using harmless text fixtures, without downloading or executing malware.',
    sections: [
      { title: 'Identify the artifact and its collection context', paragraphs: [
        'Record source host, original path, collection time, acquisition method, file size and digest. Work on a controlled copy. An extension such as .pdf does not prove the content type, and a filename resembling a system component does not prove origin. File-format parsing, signing information, strings and imports each provide different observations. Retain the tool version and errors for reproducibility.',
        'A signature can verify a publisher relationship within a particular trust chain while the signed program can still be abused. A known malicious digest identifies those exact bytes; repacking changes it. A new digest is not a benign verdict. Reputation must be interpreted with timestamp and source context, and private samples should follow the approved handling policy rather than being uploaded automatically.'
      ] },
      { title: 'Learn YARA on harmless local text', paragraphs: [
        'YARA rules define named patterns and a Boolean condition. Text, byte patterns and regular expressions can describe content. Matching a string means those bytes were observed in the scanned input; it does not prove the string was executed. A condition can combine patterns and constrain size or file structure to reduce unrelated matches.',
        'This original teaching rule deliberately matches a harmless DarkWorld fixture, not a malware family. Requiring both markers demonstrates conjunction, while a size bound demonstrates scope. The Python fixture creation runs locally and creates ordinary text. With YARA installed, scan the directory and inspect which file matches. The near miss contains only one required marker and should not match.'
      ], code: code(
        'rule DarkWorld_Harmless_Training_Fixture',
        '{',
        '  meta:',
        '    author = "DarkWorld"',
        '    purpose = "Teach matching with benign text only"',
        '  strings:',
        '    $marker = "DARKWORLD_TRAINING_ONLY" ascii',
        '    $action = "SIMULATED_REMOTE_SUPPORT" ascii',
        '  condition:',
        '    filesize < 4096 and all of them',
        '}'
      ), label: 'Original YARA rule · save as training.yar' },
      { title: 'Create regression fixtures and explain the result', paragraphs: [
        'A positive fixture establishes that the intended bytes match. A near-miss fixture establishes that the conjunction is meaningful. Include empty and oversized inputs, case variants and unrelated benign files when extending a signature. Keep expected outputs alongside each fixture. A signature that matches every test file is not useful simply because it matches the positive one.',
        'The expected YARA result is one match for positive.txt. If near-miss.txt also matches, review the condition and string definitions. If neither matches, verify path, encoding and rule compilation. These tests teach rule mechanics; production malware classification needs a representative corpus, source attribution and review of operational false-positive cost.'
      ], code: code(
        '# Python: create harmless local fixtures.',
        'from pathlib import Path',
        'folder = Path("yara-training")',
        'folder.mkdir(exist_ok=True)',
        '(folder / "positive.txt").write_text(',
        '    "DARKWORLD_TRAINING_ONLY\\nSIMULATED_REMOTE_SUPPORT\\n", encoding="ascii")',
        '(folder / "near-miss.txt").write_text("DARKWORLD_TRAINING_ONLY\\n", encoding="ascii")',
        '(folder / "empty.txt").write_text("", encoding="ascii")',
        '',
        '# In a shell with YARA installed:',
        '# yara -r training.yar yara-training'
      ), label: 'Runnable benign fixture creation · no malware execution' },
      { title: 'Static evidence and dynamic observations answer different questions', paragraphs: [
        'Readable strings may reveal configuration, library names or embedded documents, but they may be unused data. Packed or encrypted content can hide strings, causing false negatives. Imports suggest available capabilities rather than proving they were invoked. Reverse engineering can clarify code paths but must still distinguish reachable functionality from observed execution.',
        'A controlled sandbox can observe processes, files, registry changes and network attempts during that run. Evasion, missing dependencies, timing, user interaction and restricted networking can change behavior. “No activity observed” applies to those conditions and duration. Use an isolated analysis environment with controlled egress and snapshots; sandbox deployment and sample execution are separate exercises beyond this harmless fixture lab.'
      ] },
      { title: 'Link file triage back to the case', paragraphs: [
        'Correlate the artifact digest and path with process creation, parent process, user and connections on the affected host. A file found on disk is not proof of execution. A process-linked connection is stronger evidence of contact but still does not identify transferred content. Preserve offsets or matched strings when they materially support the claim and avoid filling an alert with unreviewed output.',
        'In the loader investigation, the archive interaction, scripting parent, DLL execution and subsequent remote-session evidence are separate observations. A legitimate support product on another host is a useful benign control. Build an escalation that states what executed, what is suspicious about its context, what is still unknown and which collection would resolve it.'
      ] }
    ],
    table: { headers: ['Method', 'Observation', 'Limit'], rows: [
      ['Digest', 'Exact-byte identity', 'Changes with repacking'],
      ['YARA', 'Specified content patterns', 'Match is not execution'],
      ['Sandbox', 'Behavior under test conditions', 'No observation is not universal absence']
    ] },
    exercise: { scenario: 'A rule matches a suspicious DLL, but its filename also appears in a document and the host was restarted.', task: 'Explain which observations support execution and which only identify content.', answer: 'The rule identifies matched bytes; the document reference is contextual text. Correlate process events and surviving artifacts to execution, while recording the missing pre-reboot runtime evidence.', evidence: 'Sample manifest, rule version, positive/negative fixtures and source-linked findings.' },
    misconceptions: ['A YARA match is not a complete behavior verdict.', 'No sandbox activity does not prove a sample is harmless.', 'A legitimate signed tool can still be used without authorization.'],
    sources: [references.yara, references.sysmon, { title: 'Malware-analysis resource collection · inspect tools before use', url: 'https://github.com/rshipp/awesome-malware-analysis' }],
    labs: ['defence-icedid-response'],
    quiz: [
      { prompt: 'A YARA rule matches a file. What is directly established?', choices: ['Specified content met the condition', 'Every matched string executed', 'The actor’s identity'], correctIndex: 0, explanation: 'The matching condition applies to content, not the complete execution history.' },
      { prompt: 'Why retain a near-miss fixture?', choices: ['To test that required conditions matter', 'To increase sample count only', 'To prove all future malware is detected'], correctIndex: 0, explanation: 'A similar input that should not match exposes overbroad logic.' }
    ]
  },
  {
    id: 'defensive-command-response-automation', slug: 'response-automation',
    title: 'Build a Reliable Triage & Response Automation', minutes: 50,
    summary: 'Validate events, produce bounded action plans, require specific approvals and handle retries without duplicate actions.',
    prerequisite: 'A function maps input to output. JSON carries structured data. A side effect changes external state. A retry repeats work after uncertainty. Idempotency means a repeated request does not create an extra effect.',
    outcomes: ['Validate an alert schema', 'Separate enrichment from response authority', 'Design idempotency and audit records', 'Verify both security outcome and business continuity'],
    introduction: 'Automation can retrieve context quickly, but a fast wrong action can expand an incident. A reliable playbook validates input, preserves evidence, limits authority and verifies results. We will implement a local decision planner using Python’s standard library before discussing how it maps into SOAR.',
    sections: [
      { title: 'Define an event contract and trust boundaries', paragraphs: [
        'A webhook or alert payload is input, even when it arrives from a security product. Validate required fields, types, allowed values and target identity before using it. An untrusted host string must not become a shell command. Keep secrets in an approved credential store and grant the playbook only the APIs it needs. Preserve the original alert and parser version so an analyst can reconstruct the decision.',
        'Separate collection, enrichment, assessment, approval and action. Looking up asset ownership is different from isolating an endpoint. A reputation lookup adds a sourced observation rather than an automatic verdict. A production workflow must also define behavior for unavailable inventory, rate limits, missing identity and partial response. Unknown input should produce a review task instead of an optimistic default.'
      ] },
      { title: 'Write a local planner before an API integration', paragraphs: [
        'The example generates an action proposal and a stable request key. It makes no network calls and does not isolate a machine. The asset must exist in the local inventory, and critical assets require an approval bound to the specific incident, host and action. The planner records reasons and rejects malformed input. This keeps the decision logic testable before credentials and external systems are introduced.',
        'A deterministic key lets a later executor recognize a repeated request. It is not sufficient by itself: a real executor must reserve and persist the key atomically with action status, handle concurrent workers and reconcile uncertain API outcomes. Store proposed, approved, attempted, succeeded and verified as different states. A successful HTTP response is not always proof that isolation is effective.'
      ], code: code(
        'from dataclasses import dataclass',
        'import hashlib',
        'import json',
        '',
        '@dataclass(frozen=True)',
        'class Asset:',
        '    host: str',
        '    critical: bool',
        '    isolation_allowed: bool',
        '',
        'INVENTORY = {',
        '    "WS-14": Asset("WS-14", False, True),',
        '    "FILE-02": Asset("FILE-02", True, True),',
        '}',
        '',
        'def plan_response(alert, approved_actions=frozenset()):',
        '    if not isinstance(alert, dict):',
        '        raise ValueError("alert must be an object")',
        '    for name in ("incident_id", "host", "behavior"):',
        '        if not isinstance(alert.get(name), str) or not alert[name].strip():',
        '            raise ValueError(f"missing or invalid {name}")',
        '    if type(alert.get("confidence")) is not int:',
        '        raise ValueError("confidence must be an integer")',
        '    if not 0 <= alert["confidence"] <= 100:',
        '        raise ValueError("confidence is outside 0..100")',
        '    asset = INVENTORY.get(alert["host"])',
        '    if asset is None:',
        '        return {"state": "review", "reason": "unknown asset"}',
        '    if alert["behavior"] != "confirmed_unauthorized_remote_session":',
        '        return {"state": "review", "reason": "behavior needs investigation"}',
        '    if alert["confidence"] < 90 or not asset.isolation_allowed:',
        '        return {"state": "review", "reason": "response criteria unmet"}',
        '    action = "isolate_endpoint"',
        '    approval = (alert["incident_id"], asset.host, action)',
        '    if asset.critical and approval not in approved_actions:',
        '        return {"state": "approval_required", "target": asset.host}',
        '    identity = {',
        '        "incident_id": alert["incident_id"],',
        '        "host": asset.host,',
        '        "action": action,',
        '    }',
        '    request_key = hashlib.sha256(',
        '        json.dumps(identity, sort_keys=True).encode("utf-8")',
        '    ).hexdigest()',
        '    return {"state": "proposed", **identity, "request_key": request_key}',
        '',
        'sample = {"incident_id": "IR-81", "host": "FILE-02",',
        '          "behavior": "confirmed_unauthorized_remote_session", "confidence": 95}',
        'assert plan_response(sample)["state"] == "approval_required"',
        'approval = frozenset({("IR-81", "FILE-02", "isolate_endpoint")})',
        'first = plan_response(sample, approval)',
        'second = plan_response(sample, approval)',
        'assert first["request_key"] == second["request_key"]',
        'assert first["state"] == "proposed"',
        'assert plan_response({**sample, "host": "UNKNOWN"})["state"] == "review"',
        'print(first["state"])  # proposed; no external action was performed'
      ), label: 'Runnable Python planner · deterministic proposal, no API side effects' },
      { title: 'Map the planner into a SOAR workflow', paragraphs: [
        'A platform such as Shuffle can connect triggers, enrichment tools, conditions, human decisions and response actions. Map each step to a defined input and output. Pin or review application versions and keep evidence about execution. Avoid placing privileged credentials in a broadly shared workflow or returning them in logs. Validate data at each boundary rather than assuming the previous integration normalized it correctly.',
        'For an endpoint case, collect asset ownership and criticality, preserve alert evidence, ask for an approval where required, submit the bounded action and query its status. A critical server may need a retained responder channel and alternate service monitoring. Do not silently broaden a single-host approval into a subnet-wide action. Every manual decision should identify incident, target, action, approver and validity period.'
      ] },
      { title: 'Handle retry, concurrency and partial failure', paragraphs: [
        'After an API timeout, the action may have succeeded even though the caller did not receive confirmation. Query remote status or use an idempotency facility before repeating. Bound retry count, use backoff and distinguish transient failure from invalid credentials or forbidden action. A queue needs a controlled dead-letter path for work that cannot complete automatically.',
        'If isolation succeeds but session revocation fails, preserve both results. Do not collapse the workflow into a single green check. Persist attempt timestamps, remote request IDs and outcome transitions. Restrict access to audit logs without hiding errors from operators. Simulate duplicate delivery, concurrent workers, stale approvals and unexpected asset ownership in tests before enabling external effects.'
      ] },
      { title: 'Verify outcome and retain recovery responsibility', paragraphs: [
        'Verify that the harmful path is denied and the intended service remains usable. For a mailbox case, test stale access denial and approved client success. For endpoint isolation, inspect control status and the retained management channel rather than inferring success from the action request. A tenant password reset cannot substitute for a provider’s signing-key or validation correction.',
        'Recovery requires trusted system state, appropriate credential handling, working telemetry and business-owner acceptance. Track unresolved scope separately. In Casefile 01, the response authority and action receipt cover different facts. In Casefile 02, tenant actions and provider mitigation address different layers. Use these distinctions when deciding what a playbook may mark complete.'
      ] }
    ],
    table: { headers: ['State', 'Evidence', 'Next responsibility'], rows: [
      ['Proposed', 'Validated plan and bounded target', 'Approval if required'],
      ['Attempted', 'API request and correlation ID', 'Reconcile actual result'],
      ['Verified', 'Denied harmful path plus working intended path', 'Monitoring and remaining scope']
    ] },
    exercise: { scenario: 'An isolation request times out after the endpoint accepted it. A retry arrives while the approval’s host differs from the requested target.', task: 'Define safe workflow behavior and tests for both conditions.', answer: 'Reconcile status using the stable request key and remote identifiers before repeating an effect. Reject the mismatched approval. Keep the case owned with a visible partial-failure state and test duplicate delivery, wrong target and approved service continuity.', evidence: 'Input contract, approval scope, idempotency record, action receipt and verification result.' },
    misconceptions: ['A deterministic key alone is not a durable idempotency system.', 'A requested action is not a verified outcome.', 'Approval must bind the exact target and action.'],
    sources: [references.shuffle, references.ir],
    labs: ['defence-icedid-response', 'defence-cloud-token-response'],
    quiz: [
      { prompt: 'An API call times out. What should happen before repeating a destructive effect?', choices: ['Assume failure and repeat immediately', 'Reconcile remote status and idempotency state', 'Delete the audit record'], correctIndex: 1, explanation: 'The remote operation may have succeeded despite the timeout.' },
      { prompt: 'Why bind approval to incident, host and action?', choices: ['To prevent approval reuse for a different effect', 'To increase log volume', 'To remove the need for verification'], correctIndex: 0, explanation: 'A general approval flag is too broad for a high-impact response operation.' }
    ]
  },
  {
    id: 'defensive-leadership-modern-defense-lab', slug: 'modern-defense-lab',
    title: 'Design a Modern Defense Lab & Measure Readiness', minutes: 35,
    summary: 'Build a reproducible learning architecture and measure evidence quality, recovery and coverage rather than tool count.',
    prerequisite: 'A virtual machine isolates an operating-system instance. A snapshot records a restore point. A sensor records activity. A collector forwards it. A SIEM searches it. A case workflow connects evidence to decisions.',
    outcomes: ['Map the source-to-response architecture', 'Recognize maintenance limits in reference projects', 'Define coverage and recovery tests', 'Use role milestones as learning evidence'],
    introduction: 'A useful defense lab makes the entire chain observable: an approved action creates evidence, collection preserves it, an analytic identifies it, and an analyst verifies a response. The architecture should make failures diagnosable and experiments repeatable.',
    sections: [
      { title: 'Build the minimum observable architecture', paragraphs: [
        'Start with an isolated client, a server or identity system, a collector and an analysis workstation. Keep hostnames, addresses, clocks and software versions in an inventory. Define snapshots and a reset procedure so each exercise begins from a known state. Use synthetic accounts and documents. Record which traffic can leave the lab and which services are intentionally vulnerable.',
        'Map sources to investigative questions: endpoint events for process ancestry, identity events for authentication, resource audit for data actions, network observations for contact, and change records for authorization. A source contract should name required fields, retention, owner and a benign verification signal. A diagram without tested collection is only a plan.'
      ] },
      { title: 'Use reference repositories with maintenance awareness', paragraphs: [
        'DetectionLab illustrates Windows-domain visibility, forwarding and integrated analysis architecture, but its maintainers state that active maintenance stopped in January 2023. It remains useful as an architectural reference, not a promise that an unchanged deployment is current, hardened or supported. Review operating-system images, dependencies, credentials and network exposure before adapting it.',
        'Likewise, a community roadmap or defensive resource hub is a discovery aid, not an authority for every technical claim. Follow links to current vendor documentation, framework releases and maintained tools. Curated Sysmon configuration requires estate-specific review. Treat downloaded rules as code with provenance, tests and version control, and preserve license and attribution where material is reused.'
      ] },
      { title: 'Connect CSF outcomes to operational evidence', paragraphs: [
        'NIST CSF 2.0 organizes outcomes under Govern, Identify, Protect, Detect, Respond and Recover. These functions help connect accountability, assets, prevention, observation, decisions and restoration. They are not a one-time checklist that ends once a SIEM is installed. NIST SP 800-61 Rev. 3 places incident response within this broader risk-management context.',
        'Translate each outcome into a demonstration. Identify: the inventory includes the affected service and owner. Detect: a known test event reaches a reviewed alert. Respond: a bounded action is authorized and verified. Recover: a clean restore meets service and data-reconciliation checks. Govern: responsibilities, approvals and exceptions are explicit. Protect: controls are configured and tested against the relevant boundary.'
      ] },
      { title: 'Measure coverage, quality and operational cost', paragraphs: [
        'A useful coverage denominator includes required assets and source types, not only machines that already report. Separate installed sensors, healthy sensors, correctly parsed records, tested analytics and verified response paths. If a hundred hosts have agents but half do not forward the needed channel, agent count overstates usable detection coverage.',
        'Pair speed with quality and tail delays. Median triage time can improve while difficult cases accumulate. Review closure accuracy, oldest high-impact backlog, collection gaps, harmful automation and restore test success. Measure recovery duration and data reconciliation under realistic dependencies. Explain exclusions and time windows so a metric supports a decision rather than decorating a dashboard.'
      ] },
      { title: 'Progress from Tier 1 practice to program leadership', paragraphs: [
        'Tier 1 practice should demonstrate source reading, bounded triage and a usable escalation. Tier 2 adds cross-source scoping, session reasoning and response verification. Senior detection work adds field contracts, fixtures and controlled validation. Incident leadership adds evidence handling, authority, continuity and recovery coordination. Program leadership adds architecture, ownership, investment decisions and sustained improvement.',
        'The platform milestones record learning evidence rather than an employment guarantee. Repeat cases with changed assumptions: a missing sensor, an approved tool deployment, a failed revocation or a restore that loses recent data. Explain decisions to another learner and test whether they can reproduce the result. A convincing portfolio retains source references, limitations and verified outcomes, rather than only screenshots of flags.'
      ] }
    ],
    table: { headers: ['Capability', 'Demonstration', 'Quality check'], rows: [
      ['Detection', 'Known event reaches a reviewed case', 'Required population and fields are covered'],
      ['Response', 'Bounded approved action is verified', 'Partial failure and continuity are visible'],
      ['Recovery', 'Trusted state and business function restored', 'Data reconciliation and monitoring pass']
    ] },
    exercise: { scenario: 'The SIEM dashboard is green, but MON-02 stopped sending endpoint events and only MON-01 passed restoration tests.', task: 'Write a readiness update with an owner and acceptance test for the gaps.', answer: 'Report MON-01 recovery as verified within its tests. Keep MON-02 scoped and assigned to the endpoint team for targeted collection and a source-to-search test. Do not count silence as safety or one restored host as fleet-wide closure.', evidence: 'Architecture, source contracts, owned gaps and observable acceptance criteria.' },
    misconceptions: ['Installed tools are not the same as tested capability.', 'A reference lab’s old deployment instructions are not a current support guarantee.', 'Role titles vary; demonstrated evidence matters.'],
    sources: [references.detectionLab, references.ir, references.config, { title: 'Defensive Security Hub · Resource discovery', url: 'https://github.com/MrM8BRH/Defensive-Security-Hub' }],
    labs: ['defence-supply-chain-hunt'],
    quiz: [
      { prompt: 'Which population belongs in the coverage denominator?', choices: ['Only healthy reporters', 'Required assets, including collection gaps', 'Only assets with alerts'], correctIndex: 1, explanation: 'Excluding missing sensors inflates apparent coverage.' },
      { prompt: 'What is the best use of an unmaintained reference lab?', choices: ['Assume it is hardened and current', 'Study the architecture and review/update dependencies before adapting', 'Treat it as a credential'], correctIndex: 1, explanation: 'Architectural lessons can remain useful while implementation dependencies age.' }
    ]
  },
];
