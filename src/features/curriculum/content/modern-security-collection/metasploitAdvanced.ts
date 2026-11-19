import type { CurriculumLesson } from '../curriculumDefinition';

const sources = [
  { title: 'Metasploit: how payloads work', url: 'https://docs.metasploit.com/docs/using-metasploit/basics/how-payloads-work.html' },
  { title: 'Metasploit: Meterpreter', url: 'https://docs.metasploit.com/docs/using-metasploit/advanced/meterpreter/meterpreter.html' },
  { title: 'Metasploit Framework: writing an auxiliary module', url: 'https://github.com/rapid7/metasploit-framework/blob/master/docs/metasploit-framework.wiki/How-to-get-started-with-writing-an-auxiliary-module.md' },
  { title: 'Rapid7: managing Meterpreter and shell sessions', url: 'https://docs.rapid7.com/metasploit/manage-meterpreter-and-shell-sessions/' },
];

export const metasploitAdvancedLessons: CurriculumLesson[] = [
  {
    id: 'msf-advanced-1', slug: 'msfvenom-payload-design-and-artifact-control',
    title: 'Payload Design, msfvenom Formats, and Artifact Control',
    summary: 'Understand what a payload does, how current payload tooling describes formats and compatibility, and how to handle generated artifacts safely in a lab.',
    minutes: 45,
    prerequisite: 'A payload is the code or action an exploit attempts to run after its preconditions are met. An executable format describes how an operating system loads a file; it does not describe what the payload is allowed to do.',
    outcomes: ['Distinguish exploit, payload, handler, and session', 'Read platform, architecture, transport, and format metadata', 'Explain staged and single payload tradeoffs', 'Keep generated lab artifacts attributable and contained'],
    introduction: 'Metasploit separates the mechanism that reaches a vulnerable condition from the action requested after that condition is reached. The payload family and its transport determine what happens next; the handler is the framework component that waits for and manages a compatible connection. These pieces must agree. A file existing on disk is not evidence that it ran, that the exploit worked, or that a callback became a session. This lesson teaches how to inspect those pieces and manage any exercise artifact without relying on obsolete recipes.',
    sections: [
      { title: 'Use the current payload tool and inspect before creating anything', paragraphs: [
        'The current command-line payload utility is msfvenom. Older material may show msfpayload and msfencode as separate commands; those tools were combined into msfvenom years ago. Do not copy a historical command just because its syntax appears in a book. Start with the help output from the installed version, list supported payloads and output formats, and compare those lists with the selected exploit module. A payload that exists in the general catalog is not necessarily compatible with every module or target.',
        'The command below only asks the installed tool to describe its interface. In msfconsole, show payloads narrows the choices to the selected module; msfvenom --list payloads describes the broader installed catalog. Use the exact name and options documented by the installed release. This avoids both outdated option names and mistaken assumptions based on a different Metasploit version.',
      ], code: '# Kali terminal: inspect the installed tool, do not generate an artifact\nmsfvenom --help\nmsfvenom --list payloads\nmsfvenom --list formats\n# In a selected msfconsole exploit module:\nshow payloads\nshow options', label: 'Version-aware discovery commands' },
      { title: 'Read the four compatibility dimensions', paragraphs: [
        'Platform identifies the target operating-system family, such as Linux, Windows, or Android. Architecture identifies the instruction set expected by the payload, for example x86 or x64. Process architecture may differ from the operating system architecture: a 64-bit operating system can run a 32-bit process. Transport describes how the new process communicates, such as a reverse connection initiated by the target or a bind listener reached by the tester. Output format describes the container written to disk, such as a Windows executable, a Linux ELF file, a raw byte sequence, or a script format.',
        'These are separate choices. Changing the output format does not change the payload’s permissions or make it suitable for another architecture. Changing reverse to bind changes connection direction and firewall requirements. A handler must use the matching payload identity and callback settings; selecting a different compatible-looking payload can still leave the handler waiting forever. Confirm the target process, route, permitted ports, and module support before an authorized lab run.',
      ] },
      { title: 'Compare staged and single payload delivery', paragraphs: [
        'A staged payload uses a small initial component to establish communication, then transfers a larger stage. A single or stageless payload carries the larger implementation in its initial delivery. Staging can reduce the first transfer size, but it adds a second transfer that can fail because of filtering, interrupted connectivity, or target process behavior. A single payload avoids that later transfer but can produce a larger initial artifact. Neither form is inherently stealthy, reliable, or appropriate; endpoint security products can detect either.',
        'Use the installed payload documentation to identify naming conventions. In common names, a slash-separated form such as a platform/architecture/transport combination may indicate a staged family, while a trailing underscore often distinguishes a single form; names vary, so inspect rather than infer. Do not describe an encoder as a way to bypass modern endpoint protection. Encoding is a representation transformation, not a security-control guarantee, and the resulting artifact remains subject to scanning and behavioral detection.',
      ] },
      { title: 'Treat artifacts as controlled evidence', paragraphs: [
        'For a permitted isolated exercise, record the exact framework version, module and payload identifiers, non-secret option values, output format, file name, and a cryptographic hash of the resulting file. Store it only inside the lab workspace, label it as generated training material, and remove it during cleanup. Do not upload it to public file-sharing or malware-analysis services if it contains private lab material or was generated from a real engagement. Follow the engagement rules for retention and handling.',
        'A generated file is an artifact, not proof of execution. Keep separate evidence for delivery, process execution, callback traffic, handler job, and established session. If the framework reports no session, preserve the exact message and investigate the transport and compatibility layers rather than claiming a successful foothold. DarkWorld simulates selected commands; reproducing payload behavior requires a deliberately isolated target and explicit authorization.',
      ] },
    ],
    toolWorkflow: [
      { tool: 'msfconsole', when: 'Select the intended exploit module and review its requirements.', actions: ['Read info and references.', 'Review show targets and show payloads.', 'Confirm the lab target and callback route before execution.', 'Capture the final module, payload, and option state.'], evidence: 'Sanitized console transcript with framework version and module path.' },
      { tool: 'msfvenom', when: 'Inspect current payload and output capabilities before an approved lab artifact is created.', actions: ['Read --help for the installed version.', 'Check payload metadata and required options.', 'Confirm platform, process architecture, transport, and output format.', 'Hash, label, store, and remove the artifact according to the lab rules.'], evidence: 'Artifact hash and a record of the lab, framework version, and approved handling steps.' },
    ],
    keyTerms: [
      { term: 'Handler', meaning: 'A framework component that listens for or manages the communication expected from a selected payload.' },
      { term: 'Stager', meaning: 'A small initial payload component that establishes communication and obtains a later stage.' },
      { term: 'Stage', meaning: 'The later payload component transferred after a stager connects.' },
      { term: 'Single payload', meaning: 'A payload that carries its larger implementation in the initial delivery rather than fetching a separate stage.' },
      { term: 'Artifact', meaning: 'A file or other output created during testing; its existence does not prove execution.' },
    ],
    table: { headers: ['Choice', 'What it describes', 'What to verify'], rows: [
      ['Platform / architecture', 'Target operating-system family and instruction set', 'Actual process architecture and module support'],
      ['Reverse / bind transport', 'Which side initiates the connection', 'Routes, permitted ports, and handler reachability'],
      ['Staged / single', 'One transfer or an initial transfer plus a later stage', 'Network reliability and target constraints'],
    ] },
    exercise: { scenario: 'A lab operator has a Windows x64 target, but the test process is a 32-bit service. A handler is listening on an address reachable from the tester but not from the target.', task: 'Name the compatibility facts that must be rechecked and explain why a correct scan does not guarantee a session.', answer: 'Check the payload architecture against the process the module affects, verify the module supports that payload, and correct the callback endpoint so the target can reach it. A scan tests tester-to-target connectivity, while a reverse payload requires target-to-handler connectivity; these are different routes. Also inspect handler/session state and any staging transfer outcome.', evidence: 'A sanitized compatibility matrix, route diagram, handler job state, and session listing from the authorized lab.' },
    misconceptions: ['msfvenom output does not prove that the artifact executed.', 'A reverse callback address must be reachable from the target.', 'A staged payload can fail after its initial component runs.', 'Encoding does not promise endpoint-protection bypass.', 'A session does not establish privileged access by itself.'],
    sources, labs: ['msf-tomcat-mgr-upload-real-console'],
    quiz: [
      { question: 'Which tool replaces the older separate msfpayload and msfencode utilities?', options: ['msfvenom', 'msfdb', 'msfrpc'], answer: 0 },
      { question: 'What does a generated payload file establish?', options: ['That an artifact was created', 'That it executed on a target', 'That a privileged session exists'], answer: 0 },
      { question: 'For a reverse payload, which side initiates the callback?', options: ['The target', 'The handler', 'The database'], answer: 0 },
    ],
  },
  {
    id: 'msf-advanced-2', slug: 'meterpreter-architecture-and-session-interpretation',
    title: 'Meterpreter Architecture and Session Interpretation',
    summary: 'Learn how a Meterpreter session differs from a shell, how its command protocol and extensions fit together, and what session evidence actually establishes.',
    minutes: 40,
    prerequisite: 'A shell is an interface to a command interpreter. A process has an identity, permissions, architecture, and lifetime. A network session is an established communication channel; its existence does not grant additional operating-system privileges.',
    outcomes: ['Distinguish shell and Meterpreter session types', 'Describe the client/server and extension model', 'Interpret session identity, process, and transport evidence accurately', 'Explain why endpoint telemetry may record session behavior'],
    introduction: 'Meterpreter is an interactive payload environment managed through a Metasploit session. It presents structured commands and can load extensions over its communication channel. That design differs from receiving a normal operating-system shell. Understanding the difference prevents a common reporting error: describing an interactive session as root or administrator when the session is actually running as an unprivileged service account.',
    sections: [
      { title: 'The session is a protocol endpoint, not a new privilege level', paragraphs: [
        'A Meterpreter client runs in the target process and communicates with the Metasploit handler. The handler tracks the connection as a session and presents a command interface. Internally, request and response messages are structured rather than simply being lines typed into cmd.exe or Bash; the protocol uses typed fields commonly described as TLVs (type-length-value records). This lets the framework request information or actions and parse structured replies. The learner normally interacts with Meterpreter commands rather than constructing protocol messages by hand.',
        'A shell session exposes a command interpreter such as a Windows command prompt or a Unix shell. Meterpreter exposes its own command set, such as sysinfo, getuid, pwd, and background. A command named pwd in Meterpreter reports the session’s current working directory, while a command in a local terminal reports the local machine. Always identify which prompt is active before interpreting output. The session’s effective account and process token remain the operating system’s authority boundary.',
      ] },
      { title: 'Understand the core, transport, and extensions', paragraphs: [
        'The core Meterpreter service handles session communication and a set of built-in commands. Depending on platform and framework version, additional capabilities can be provided by extensions that are loaded when needed. This modular design keeps every capability from being present in every session. A missing command can mean that the relevant extension is unavailable, unsupported on that target, or not loaded; it does not prove the target is patched or the session is broken. Use help and the version-matched documentation to determine what the current session supports.',
        'The transport may be reverse or bind and can use different network protocols. The route, proxy, NAT, firewall, listener, and target process all affect whether a channel remains usable. Network interruption, process termination, host reboot, handler shutdown, or defensive containment can end a session. Meterpreter is an in-memory process capability, not a guarantee of diskless behavior or invisibility: operating-system and endpoint telemetry may record process creation, memory activity, network connections, loaded modules, and account context.',
      ] },
      { title: 'Collect a minimum, read-only session record', paragraphs: [
        'Start in the framework prompt with sessions -l and record the ID, type, and endpoint information shown by the current release. Interact with the displayed session ID, not a copied example number. In Meterpreter, use help to confirm commands available in that session; sysinfo describes the host, getuid reports the effective identity, getpid identifies the process, and pwd reports its working directory. Background returns to the framework without intentionally closing the session. These observations describe the session state at collection time.',
        'Avoid inferring domain administrator, root, or local administrator status from a hostname, operating-system version, or successful connection. Explain which command or evidence supports each identity claim. In a defensive investigation, correlate the session’s observed process and network activity with endpoint and network telemetry. A handler record is framework evidence; it is not independent proof of the target-side action. Preserve timestamps and time-zone context when matching events.',
      ], code: '# In msfconsole: list sessions and use the ID shown by your own lab\nsessions -l\nsessions -i <session-id>\n# In a Meterpreter prompt, when supported:\nhelp\nsysinfo\ngetuid\ngetpid\npwd\nbackground\n# Back in msfconsole:\nsessions -l', label: 'Read-only session triage; replace the placeholder with the displayed ID' },
      { title: 'Explain session loss by checking each layer', paragraphs: [
        'If interaction fails, first determine whether the session still appears in sessions -l. If it does, check whether the selected ID and session type match the commands being used. If it disappeared, inspect the handler and job state, the target process lifetime, network reachability, and lab reset or containment events. A disconnection alone does not identify which layer failed. A console restart may also remove framework-side state even if a target process was still running.',
        'For an incident report, distinguish what the framework observed from what target-side telemetry confirms. State the session type, timestamp, reported identity, process ID if collected, and the method used to validate each. Note that the session was temporary unless persistence was separately established and authorized. DarkWorld demonstrates a selected subset of these operations in a simulator; its transcript should be labeled as training evidence, not a real target observation.',
      ] },
    ],
    keyTerms: [
      { term: 'Session type', meaning: 'The interaction interface established by a payload, for example shell or Meterpreter.' },
      { term: 'TLV', meaning: 'A typed protocol field represented by its type, length, and value; one way Meterpreter structures requests and responses.' },
      { term: 'Extension', meaning: 'An optional set of Meterpreter capabilities loaded when supported and needed.' },
      { term: 'Effective identity', meaning: 'The account or security token under which the session’s target process is operating.' },
    ],
    table: { headers: ['Evidence', 'Supports', 'Does not establish'], rows: [
      ['sessions -l entry', 'Framework tracks an interactive session', 'Independent confirmation of every target action'],
      ['getuid output', 'Identity reported by the session at that time', 'That the identity has unbounded rights'],
      ['sysinfo output', 'Host facts reported through the session', 'Patch state or exploitability of unrelated services'],
    ] },
    exercise: { scenario: 'A Meterpreter session reports a service account and a Windows host. A learner writes that they obtained administrator access because the session is interactive.', task: 'Correct the claim and list the extra evidence required for a privilege statement.', answer: 'Report an established Meterpreter session under the service account reported by getuid. Interactivity does not elevate the process. Any stronger privilege statement requires direct evidence of the effective token or a permitted privileged action, collected and corroborated under the lab rules.', evidence: 'Session type, timestamp, getuid output, and corroborating target-side identity telemetry.' },
    misconceptions: ['Meterpreter commands are not shell commands.', 'Interactive access does not imply administrator rights.', 'A loaded extension is not necessarily available on every target.', 'A session in the framework is not independent target-side forensic proof.'],
    sources, labs: ['msf-tomcat-mgr-upload-real-console'],
    quiz: [
      { question: 'What is the key distinction between a shell and Meterpreter session?', options: ['They expose different interaction interfaces and command sets', 'A shell is always privileged', 'Meterpreter cannot communicate over a network'], answer: 0 },
      { question: 'What does getuid support?', options: ['The identity reported by the current session', 'Proof that every host account is compromised', 'Proof that the target is patched'], answer: 0 },
    ],
  },
  {
    id: 'msf-advanced-3', slug: 'writing-and-reviewing-a-read-only-auxiliary-module',
    title: 'Writing and Reviewing a Read-Only Auxiliary Module',
    summary: 'Study a complete, conservative Ruby auxiliary module that requests one HTTP page, records response metadata, handles failures, and avoids changing the target.',
    minutes: 55,
    prerequisite: 'Ruby classes define objects and methods. A Metasploit module extends framework behavior through a class named MetasploitModule. An HTTP GET requests a resource; it should not be assumed to be side-effect-free for every application, so the target must still be explicitly authorized.',
    outcomes: ['Identify the structure of a framework module', 'Register and validate user-configurable options', 'Handle HTTP errors and timeouts explicitly', 'Review a module for side effects, evidence quality, and testability'],
    introduction: 'Writing a small auxiliary module teaches how framework options, shared client code, output, and failure handling fit together. The example below performs one HTTP GET against the operator-specified path and reports the status and selected response headers. It does not submit credentials, upload files, execute a command, follow an unbounded crawl, or attempt exploitation. Even a read request can reach sensitive application logic, so use the module only against a system in your authorized scope and at the rate allowed by the rules of engagement.',
    sections: [
      { title: 'The module class and metadata describe the contract', paragraphs: [
        'Metasploit discovers a module through its file path and the class MetasploitModule. An auxiliary module inherits from Msf::Auxiliary and includes capability mixins only when needed. The HttpClient mixin provides HTTP request behavior; the module should not reimplement sockets or hide framework defaults without a reason. initialize passes descriptive metadata to update_info and registers the options the operator must configure. Name and Description explain the narrow behavior. Author and License identify provenance and distribution terms. Notes record expected stability, side effects, and reliability for reviewers.',
        'The module should have one clear job. This example requests only the configured path, reports the HTTP response code and a small set of useful headers, and stops. The scanner support uses RHOSTS to select hosts; HTTP client support supplies RPORT and SSL for the endpoint. TARGETURI selects a path. A timeout keeps an unavailable endpoint from blocking indefinitely. Use the framework option validation rather than accepting arbitrary values and assuming they are safe.',
      ] },
      { title: 'Worked example: one bounded HTTP metadata request', paragraphs: [
        'Save the following in the appropriate local development tree as an auxiliary module file, then use the framework’s module development and linting guidance for the exact installed release. The example deliberately avoids setting a default remote target: the operator must identify the approved host. It makes one request, does not follow redirects automatically in application code, and prints only a selected header set. Before adapting it, verify the current HttpClient method signatures in the current framework source.',
      ], code: `# frozen_string_literal: true

class MetasploitModule < Msf::Auxiliary
  include Msf::Exploit::Remote::HttpClient
  include Msf::Auxiliary::Scanner

  def initialize(info = {})
    super(update_info(info,
      'Name' => 'Authorized HTTP Response Metadata Check',
      'Description' => %q{
        Sends one HTTP GET request to the configured path and reports a
        small set of response headers. It does not submit or modify data.
      },
      'Author' => ['DarkWorld training example'],
      'License' => MSF_LICENSE,
      'Notes' => {
        'Stability' => [UNKNOWN_STABILITY],
        'SideEffects' => [IOC_IN_LOGS],
        'Reliability' => [UNKNOWN_RELIABILITY]
      }
    ))

    register_options([
      OptString.new('TARGETURI', [true, 'Path to request', '/'])
    ])
  end

  def run_host(target_host)
    path = normalize_uri(target_uri.path)
    print_status("Requesting #{path} from #{target_host}:#{rport}")

    response = send_request_cgi({
      'method' => 'GET',
      'uri' => path,
      'keep_cookies' => false
    }, 10)

    unless response
      print_error('No HTTP response received before the request timed out')
      return
    end

    print_good("HTTP status: #{response.code}")
    unless response.headers
      print_error('The response contained no headers')
      return
    end

    wanted_headers = %w[server content-type content-length]
    response.headers.each do |header, value|
      print_line("#{header}: #{value}") if wanted_headers.include?(header.to_s.downcase)
    end
  rescue Rex::ConnectionError => e
    print_error("Connection failed: #{e.class}")
  end
end`, label: 'Ruby auxiliary module example; verify APIs against the installed Framework version' },
      { title: 'Review the code for safety and maintainability', paragraphs: [
        'The option registration makes the destination path and transport visible in show options. The request is bounded to one GET and uses a timeout. The response is checked before fields are read, and only a small allowlist of headers is printed. The rescue handles a connection failure without converting it into a successful result. The module never prints response bodies, which may contain personal or secret data. Its metadata discloses that the request can appear in application logs.',
        'Before using this as a development starting point, compare the method signature and metadata constants against the current Metasploit Framework source. Framework APIs evolve, and code that parses but does not run correctly is not a finished module. Run the framework’s style checks, add tests for a normal response, no response, connection refusal, missing headers, mixed-case header names, and a non-default URI, then review the network behavior. A safe module still needs rate limits and explicit scope; an auxiliary label does not make arbitrary scanning harmless.',
      ] },
      { title: 'Use check methods as evidence, not a verdict oracle', paragraphs: [
        'Some exploit modules provide check to test whether conditions appear compatible without performing the full exploit action. A check result reflects the logic and evidence available to that particular module. It can be vulnerable, safe, unknown, or detected, depending on the module and release. A safe result does not prove the product has no vulnerability, and a vulnerable result is not a guarantee that exploitation will work. A check may still send network requests and can have side effects if the implementation is flawed.',
        'A good check documents what it observes, uses conservative confidence, handles missing or ambiguous responses, and avoids claiming more than the signal supports. For an auxiliary module, state the request, response fields, timeout, and known limitations. Keep findings reproducible by recording the framework version, module revision, sanitized options, timestamp, and target-side evidence where available.',
      ] },
    ],
    keyTerms: [
      { term: 'Mixin', meaning: 'A reusable module component included in a class to provide a focused capability such as HTTP client support.' },
      { term: 'Option contract', meaning: 'The inputs registered by a module, including required state, default values, descriptions, and validation.' },
      { term: 'Side effect', meaning: 'An observable change or operational consequence caused by a module, including logs, service load, or state changes.' },
      { term: 'Confidence', meaning: 'How strongly collected evidence supports a module check result; uncertainty must remain visible.' },
    ],
    table: { headers: ['Review area', 'Good evidence', 'Weak practice'], rows: [
      ['Scope', 'Operator-supplied host and documented lab authorization', 'Hard-coded public or production destination'],
      ['Failure handling', 'Timeout and explicit no-response result', 'Treating an empty response as success'],
      ['Data minimization', 'Print selected non-sensitive headers', 'Dump full response bodies by default'],
    ] },
    exercise: { scenario: 'A module developer wants to add response-body printing because it makes debugging easier.', task: 'Explain the privacy and evidence risks and propose a safer development approach.', answer: 'Bodies can contain credentials, personal information, tokens, or large data; logging them creates a second copy of sensitive material. Keep output limited to selected fields, add an explicit opt-in debugging mode only for synthetic lab data, redact values, and test the normal and failure paths. Document the behavior and retention rules.', evidence: 'A code review checklist, test cases, and a sanitized sample transcript.' },
    misconceptions: ['Auxiliary modules can still create load and log entries.', 'An HTTP GET is not universally free of side effects.', 'A module check is not a universal vulnerability verdict.', 'Code that parses successfully has not necessarily passed framework API or behavior tests.'],
    sources, labs: ['msf-auxiliary-smb-version-scan-real-console'],
    quiz: [
      { question: 'Why does the example avoid printing the response body?', options: ['It may contain sensitive data and create unnecessary retained copies', 'HTTP bodies are always binary', 'Headers cannot be logged'], answer: 0 },
      { question: 'What does a module check result establish?', options: ['Only what its implementation and collected evidence support', 'Guaranteed exploit success', 'That the application is safe in all configurations'], answer: 0 },
    ],
  },
];
