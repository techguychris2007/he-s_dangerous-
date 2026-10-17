import type { CurriculumLesson } from '../curriculumDefinition';

const sources = [
  { title: 'Metasploit Framework: running modules', url: 'https://docs.metasploit.com/docs/using-metasploit/basics/using-metasploit.html' },
  { title: 'Metasploit database management', url: 'https://docs.rapid7.com/metasploit/managing-the-database/' },
];

export const metasploitDepthLessons: CurriculumLesson[] = [
  {
    id: 'msf-depth-1', slug: 'framework-console-modules-and-option-state',
    title: 'Metasploit Console: Modules, Options and Reproducible Scans',
    summary: 'Learn the actual console commands, module families, configuration scope and interpretation of a service scan.',
    minutes: 45,
    prerequisite: 'A service listens on an IP address and port. A scanner connects to that endpoint. The console is the framework interface, not the remote operating-system shell.',
    outcomes: ['Find and inspect a module', 'Separate local options from global defaults', 'Read scan output without claiming exploitation'],
    introduction: 'Metasploit is a framework containing independent modules and shared facilities. msfconsole lets you select a module, configure its inputs, execute it and inspect its output. Learning that sequence is more useful than memorizing one historical exploit. In this lesson you perform a service-identification workflow against your designated isolated lab target.',
    sections: [
      { title: 'Understand what each module family does', paragraphs: [
        'An auxiliary module performs a supporting action such as service identification, authentication testing or administration. Auxiliary does not mean harmless: a login tester can lock accounts, and a scanner sends requests. An exploit module implements a particular route to executing code or another exploit effect. A payload supplies the action executed after the exploit establishes the necessary conditions. A post module operates through an existing compatible session.',
        'A module path identifies its family and purpose. auxiliary/scanner/smb/smb_version is a service scanner. Selecting it changes the console prompt and loads its option contract; selection alone does not scan anything. A payload is not interchangeable with an exploit, and a post module cannot be assumed to work before you have a suitable session. Encoders transform payload representations for technical constraints; encoding is not a guarantee of bypassing endpoint protection.',
      ] },
      { title: 'Open the console and inspect before configuring', paragraphs: [
        'Run msfconsole from a Kali terminal. Within the console, version records your installed framework version, help lists console commands, and search narrows the module catalog. Use the full module path when documenting a workflow because search result numbers can change as the installation changes. info describes references and behavior; show options displays option names, current values, requirements and descriptions.',
        'Required means the framework needs a value to run that module, not that the current value is correct. A default port can still be wrong for your target. Inspect show advanced when diagnosing module-specific behavior, and use help for the installed release rather than assuming a book screenshot defines the current interface. Reading module information is different from executing check, which can contact or modify a target depending on the module.',
      ], code: 'msfconsole\nversion\nsearch type:auxiliary smb_version\nuse auxiliary/scanner/smb/smb_version\ninfo\nshow options\nshow advanced', label: 'Kali terminal first line; subsequent lines inside msfconsole' },
      { title: 'Configure only the designated target', paragraphs: [
        'RHOSTS names the remote hosts a scanner will contact; RPORT names the remote service port. set configures an option in the active module. setg establishes a global setting that can influence subsequently selected modules. A previous global target is a common source of accidental mistakes, so inspect getg RHOSTS and remove an unwanted global value with unsetg RHOSTS before configuring the current lab.',
        'The private address below is an example isolated VM address, not a DarkWorld universal target. Replace it with the address provided by your lab. A subnet expression would contact multiple hosts; start with one target while learning. After setting options, read show options again. Only run when the displayed endpoint matches your exercise. A scanner result such as an operating-system string is an observation from a protocol response, not proof of administrator access.',
      ], code: 'getg RHOSTS\nunsetg RHOSTS\nset RHOSTS 192.168.56.101\nset RPORT 445\nshow options\nrun\nback', label: 'Single-host scanner against an isolated target you control' },
      { title: 'Interpret completion and errors accurately', paragraphs: [
        'Module execution completed means the framework finished the module invocation. It does not necessarily mean a service was reachable or a vulnerability existed. Connection refused commonly means the connection reached an endpoint that did not accept it, while a timeout can involve routing, filtering or an unresponsive service. Neither error establishes a vulnerability conclusion by itself.',
        'Compare the target address, port and protocol with the exercise first. Then inspect the response or error. Change one relevant setting and repeat only when the new setting is justified. DarkWorld simulates selected console commands; its transcript is training evidence. To reproduce this on Kali you need the actual framework and isolated target service, and the real response will depend on their configuration.',
      ] },
    ],
    table: { headers: ['Command', 'Purpose', 'Limit'], rows: [['use / info', 'Select and inspect a module', 'Does not run the scan'], ['set / setg', 'Local configuration / global default', 'A populated option can be incorrect'], ['run', 'Execute the selected module', 'Completion is not vulnerability proof']] },
    exercise: { scenario: 'A scanner completes without reporting a service. Its RPORT is 445, but the lab lists SMB on a forwarded port.', task: 'Identify the setting to verify and explain what completion establishes.', answer: 'Verify the remote forwarded service port and RHOSTS against the lab. Completion describes the invocation, not a successful service observation.', evidence: 'Sanitized options and the actual scanner response.' },
    misconceptions: ['Auxiliary is not a synonym for passive.', 'Selecting a module does not execute it.', 'A service banner is not a privileged session.'], sources,
    labs: ['msf-auxiliary-smb-version-scan-real-console'],
    quiz: [{ question: 'Which command changes a global option?', options: ['setg', 'info', 'back'], answer: 0 }, { question: 'What does a banner establish?', options: ['A service observation', 'Administrator authority', 'Every applicable CVE'], answer: 0 }],
  },
  {
    id: 'msf-depth-2', slug: 'database-workspaces-and-imported-service-evidence',
    title: 'Metasploit Workspaces: Store and Query Service Evidence',
    summary: 'Connect the database, separate exercises, import Nmap XML and understand the difference between discovery records and confirmed vulnerabilities.',
    minutes: 40,
    prerequisite: 'A database stores structured records. Nmap XML is a machine-readable scan export. A workspace separates record collections; it is not a network boundary.',
    outcomes: ['Inspect database connectivity', 'Create and select a workspace', 'Import and interpret discovery records'],
    introduction: 'A console transcript is useful, but structured host and service records make larger exercises easier to understand. Metasploit can store these records in a PostgreSQL-backed database. This facility is optional for many individual modules; a database problem and a target connection problem are separate failures.',
    sections: [
      { title: 'Check the database without destroying existing data', paragraphs: [
        'Inside msfconsole, db_status reports whether the framework has a database connection. Outside the console, msfdb help describes the database utility shipped with your installation. Packaging and service setup differ, so inspect that help and your distribution documentation before initializing a new installation. Do not use a destructive reinitialization as a routine fix for a disconnected database containing work.',
        'A connected status indicates a usable connection, not that your current workspace contains fresh observations. If a module runs while database support is disconnected, its console response may still exist but database queries will not automatically have the corresponding stored results. Check both the module response and database state when teaching or reproducing a workflow.',
      ], code: '# In a Kali terminal:\nmsfdb help\n# Inside msfconsole:\ndb_status\nworkspace', label: 'Read-only installation and connection checks' },
      { title: 'Separate records with a named workspace', paragraphs: [
        'workspace lists available workspaces. workspace -a training-smb creates a collection for this exercise, and workspace training-smb selects it. hosts displays stored host records; services displays service records. A host record and a service record describe different objects: one address can have several services, and their protocol, port and observed state matter independently.',
        'A workspace organizes evidence, but it does not restrict the target addresses accepted by scanner modules. You must still configure the correct host before running a module. Avoid deleting or overwriting another exercise workspace to obtain an empty display. A fresh name keeps old data separate and makes it easier to notice which observations were collected during your current exercise.',
      ], code: 'workspace -a training-smb\nworkspace training-smb\nhosts\nservices', label: 'Framework database commands; a working database is required' },
      { title: 'Import a scan you already performed', paragraphs: [
        'Nmap -oX writes an XML result that preserves structured scan information. The example performs version detection against one isolated target and exports the result to training.xml. db_import reads a supported result file into the active workspace. Importing does not run the network scan again: it creates records from the saved file. Verify the active workspace before importing.',
        'After importing, compare services with the XML file. Port, protocol and product/version fields should be interpreted as observations from that particular scan time. Reused lab addresses and restarted containers can make stored observations stale. A port described as open supports the conclusion that the scanner observed an accepting service, not that a matching exploit will work.',
      ], code: '# Kali terminal; substitute your isolated lab address:\nnmap -sV -oX training.xml 192.168.56.101\n# msfconsole, with the intended workspace selected:\ndb_import training.xml\nhosts\nservices\nvulns', label: 'Real local scan export and framework import; not all commands are simulated in DarkWorld' },
      { title: 'Distinguish a vulnerability record from validation', paragraphs: [
        'The vulns display queries stored vulnerability records. Those records may originate from imported scanners or modules. Their presence records a reported finding; you still need the source, applicable product and configuration, and the validation method to explain what was actually established. A service product string alone is insufficient to conclude that every CVE for that product applies.',
        'A blank vulns display does not prove a secure target. It can mean no vulnerability-producing module ran, nothing was imported, the wrong workspace is selected or the database is disconnected. Explain these data-path possibilities before making a security conclusion. In the paired lab, service enumeration remains the objective; database administration is a Kali extension rather than a hidden grading requirement.',
      ] },
    ],
    table: { headers: ['Record', 'Contains', 'Does not prove'], rows: [['Host', 'Address and observed host attributes', 'Every service state'], ['Service', 'Port, protocol and observation', 'Successful exploitation'], ['Vulnerability', 'Reported finding and references', 'Universal exploitability']] },
    exercise: { scenario: 'An imported XML file shows an open service but vulns is empty.', task: 'Explain why those results can both be correct.', answer: 'A discovery scan can produce service records without validated vulnerability records. Confirm the workspace and import, then interpret each record according to its source.', evidence: 'Workspace name and matching service fields.' },
    misconceptions: ['Workspaces do not enforce network scope.', 'Importing does not rescan the target.', 'An empty vulnerability table is not a clean bill of health.'], sources,
    labs: ['msf-auxiliary-smb-version-scan-real-console'],
    quiz: [{ question: 'What does db_import do?', options: ['Reads saved scan results', 'Automatically exploits every host', 'Isolates the VM network'], answer: 0 }],
  },
  {
    id: 'msf-depth-3', slug: 'payload-transport-session-and-job-fundamentals',
    title: 'Payload Transport, Sessions and Background Jobs',
    summary: 'Understand callback routing, architecture compatibility, staged delivery and the actual distinction between jobs and sessions.',
    minutes: 45,
    prerequisite: 'An IP route determines where packets go. A process executes under an account. A TCP listener accepts a connection; outbound reachability and inbound reachability are different.',
    outcomes: ['Explain reverse versus bind connectivity', 'Separate a job from a session', 'Inspect a session without assuming privilege'],
    introduction: 'An exploit effect and a usable session are separate outcomes. A module may reach the target and trigger its vulnerable behavior while the selected payload fails to establish a connection. Understanding transport, execution context and framework state explains this common failure without guessing.',
    sections: [
      { title: 'Remote target settings and callback settings describe opposite directions', paragraphs: [
        'RHOSTS and RPORT typically identify the service the framework contacts. For a reverse payload, the target initiates a connection back to the configured callback endpoint. LHOST describes that endpoint in applicable payloads, and LPORT describes its port. Choose an address reachable from the target, which can differ from the address your browser uses to reach DarkWorld.',
        'With two isolated VMs on a host-only network, each VM has a private address on that virtual network. A loopback address such as 127.0.0.1 refers to the machine using it, so supplying it as a remote callback address usually directs the target to itself. NAT or VPN interfaces introduce additional routes; a correct service scan does not by itself establish that the reverse route works. A bind payload instead places a listener on the target that the framework must reach.',
      ] },
      { title: 'Compatibility includes execution architecture and delivery behavior', paragraphs: [
        'A payload must match the module-supported platform and execution environment. A 64-bit operating system can run a 32-bit process, so operating-system architecture and exploited process architecture are not always the same. show payloads lists payloads compatible with the selected module, and show targets lists target choices when the module defines them. Inspect the module information before choosing a target.',
        'A staged payload first executes a smaller component that retrieves or receives a later component. A stageless payload contains the relevant implementation in one delivery. Staged delivery can fail after initial code execution when the later transfer is blocked or interrupted. Neither staging choice automatically makes a payload undetectable. Historical msfpayload and msfencode command examples should not be used as current setup instructions; inspect current msfvenom help when studying payload formats.',
      ], code: '# Inside the selected module context, without executing it:\ninfo\nshow targets\nshow payloads\nshow options\n# In a Kali terminal:\nmsfvenom --help', label: 'Compatibility inspection; no payload generation or target execution' },
      { title: 'Jobs and sessions are different framework objects', paragraphs: [
        'A job is a background task managed by the framework, such as a listener or a running module. A session is an established interaction with a target. jobs lists tasks; sessions -l lists sessions. A listening job can exist before any target connects. Conversely, an open session can remain usable after the module invocation that created it has finished.',
        'Use sessions -i with the ID actually displayed by your console to interact with that session. The example ID 1 is not guaranteed. In Meterpreter, help lists supported commands, sysinfo reports system details and getuid reports the current account context. background returns to the framework while preserving that session. These commands are not interchangeable with a normal Linux command shell, where id and uname describe the local shell context instead.',
      ], code: '# msfconsole:\njobs\nsessions -l\nsessions -i 1\n# Only in a compatible Meterpreter session:\nhelp\nsysinfo\ngetuid\nbackground', label: 'Session inspection after the designated lab establishes a session' },
      { title: 'Diagnose a missing session by separating the layers', paragraphs: [
        'First confirm the module prerequisites and the exact service endpoint. Next distinguish a refused or timed-out service connection from a reported exploit attempt. Then inspect payload compatibility and callback reachability. Finally compare listener/job state with sessions -l. A message that no session was created states the final outcome, not which layer failed.',
        'A session running as a service account does not automatically have root, administrator or domain privileges. Record the session type and effective identity before interpreting what it can do. Terminating a specific session and stopping a specific job are separate actions; inspect sessions -h and jobs -h before ending only the objects belonging to your exercise. The simulator supports selected actions, while full transport behavior requires actual isolated machines.',
      ] },
    ],
    table: { headers: ['Object', 'Meaning', 'Common mistake'], rows: [['Job', 'Background framework task', 'Assuming it proves a connected target'], ['Session', 'Established target interaction', 'Assuming it is privileged'], ['LHOST', 'Applicable callback endpoint', 'Using target-relative loopback']] },
    exercise: { scenario: 'The scanner can reach a target, but a reverse payload points at 127.0.0.1.', task: 'Explain the two connection directions and the likely callback problem.', answer: 'The scan is framework-to-target. The reverse callback is target-to-framework; loopback on the target points back to the target itself. Verify a framework address reachable from the isolated target.', evidence: 'A network diagram with actual lab interface addresses and session/job listings.' },
    misconceptions: ['A listener is not an established session.', 'Initial code execution does not ensure staged transfer completes.', 'An established session is not proof of administrator privilege.'], sources,
    labs: ['msf-tomcat-mgr-upload-real-console'],
    quiz: [{ question: 'Which object represents an established target interaction?', options: ['Session', 'Search result', 'Workspace'], answer: 0 }, { question: 'What does background do in Meterpreter?', options: ['Returns to the framework while keeping the session', 'Proves persistence', 'Grants administrator rights'], answer: 0 }],
  },
];
