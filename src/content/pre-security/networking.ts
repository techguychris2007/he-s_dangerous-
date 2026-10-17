import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

export const beginnerNetworkLessons: CurriculumLesson[] = [
  {
    id: 'pre-network-1', slug: 'addresses-packets-and-routes', title: 'IP Addresses, Ports, and Scope', summary: 'Learn the network terms that every lab uses: IP address, port, service, route, and scope.', minutes: 20,
    prerequisite: 'Complete the lab orientation or understand what a target is.',
    outcomes: ['Explain IP address, port, and service', 'Read nmap output without guessing', 'Avoid touching out-of-scope systems'],
    introduction: 'A beginner does not need every networking detail on day one. You need enough vocabulary to know what system you are allowed to contact, what service answered, and what evidence proves it.',
    toolWorkflow: [
      { tool: 'nmap service scan', when: 'Use it when the lab asks what is listening on a scoped host.', actions: ['Confirm the target address from the briefing.', 'Run a service scan against only the scoped target.', 'Record open ports, service names, versions, and anything filtered or closed.'], evidence: 'Target IP, command used, open TCP ports, service/version text, and one limitation sentence.' },
      { tool: 'Netcat banner check', when: 'Use it when a plain TCP service may speak first or accept simple text.', actions: ['Connect to the exact host and port from the scan.', 'Read the banner before typing anything.', 'If the service expects input, send the lab-provided safe probe only.'], evidence: 'The banner text, target host:port, and whether the conversation was plain TCP.' },
    ],
    keyTerms: [
      { term: 'Scope', meaning: 'The exact systems, addresses, and actions allowed by the lab or assessment.' },
      { term: 'Port', meaning: 'A numbered endpoint where a network service can listen on a host.' },
      { term: 'Banner', meaning: 'Text a service returns that may reveal protocol, product, version, or training instructions.' },
      { term: 'Service fingerprint', meaning: 'A best-effort identification of software behavior behind a port.' },
    ],
    readinessChecklist: ['You can explain why the target is in scope.', 'You can distinguish an open port from a confirmed vulnerability.', 'You can save a banner as evidence without claiming more than it proves.'],
    sections: [
      { title: 'Targets, addresses, and ports', paragraphs: ['An IP address is a network-layer destination; a port is a transport-layer endpoint used by a process. TCP and UDP have separate port spaces, so TCP/53 and UDP/53 are different endpoints even though both are commonly associated with DNS. A service is the program or protocol behavior behind an endpoint. Port numbers are conventions, not proof: a web service can listen on 8080, and a non-web program can listen on 443.', 'IPv4 private ranges commonly used in labs are 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. 127.0.0.0/8 is loopback on the same host; 169.254.0.0/16 is link-local. IPv6 has its own address format, loopback (::1), and link-local range (fe80::/10). A private address is not automatically in scope: the lab brief defines the authorized target, not the address class.'] },
      { title: 'Scope comes first; reachability is a separate question', paragraphs: ['If a lab names 10.10.10.20, that is the host you test. Do not scan your home network, campus network, or the public internet. Security skill includes restraint. Write down the exact IP or hostname, ports, permitted tools, and time window before running a command.', 'Routes explain where a packet will be sent; DNS explains which address a name currently resolves to. If a host does not answer, it may be down, filtered, on another segment, or simply outside the simulation. A route, DNS answer, and successful connection are three different observations. Record what you actually saw rather than guessing which explanation is true.'] },
      { title: 'Read a service scan as evidence, not a verdict', paragraphs: ['A useful scan note names the target, protocol, port, state, service guess, and version confidence. “10.10.10.20 has TCP/80 open and nmap identified an HTTP service” is better than “the server is vulnerable.” An open port means the scan received a response consistent with a listener. A version probe is a fingerprint estimate; proxies, custom banners, and backported patches can make an apparent version incomplete or misleading.', 'Nmap commonly reports open, closed, and filtered. Open means a service accepted or responded to the probe. Closed means the host was reachable but reported no listener for that port. Filtered means a firewall or network behavior prevented Nmap from deciding. UDP results can be ambiguous because many UDP services do not reply to empty probes. Silence is not the same as proof of a closed port.'] , code: 'nmap -sV 10.10.10.20\nnc 10.10.10.20 31337\ncurl http://10.10.10.20/health', label: 'Run only against the lab target in your briefing' },
      { title: 'Worked example: turn scan lines into a careful note', paragraphs: ['Suppose the lab returns the following illustrative output. The transport protocol matters: the port number alone is incomplete. The state describes the scan observation, while a service/version probe is a best-effort identification. The output does not say whether authentication is weak, whether the service is vulnerable, or whether the host contains sensitive data. Those are separate hypotheses requiring authorized evidence.'], code: 'PORT      STATE     SERVICE\n22/tcp    open      ssh\n80/tcp    open      http\n443/tcp   filtered  https\n\nEvidence note:\nTarget 10.10.10.20; TCP/22 and TCP/80 responded as open.\nThe service names are Nmap protocol guesses, not vulnerability findings.\nTCP/443 was filtered from this vantage point, not proven closed.\nNo vulnerability conclusion follows from this scan alone.', label: 'Illustrative scan output and evidence note' },
    ],
    table: { headers: ['Term', 'Meaning', 'Lab evidence'], rows: [['IP address', 'Host location', '10.10.10.20'], ['Port', 'Service endpoint', 'TCP/80 or TCP/31337'], ['Service', 'Software behavior behind a port', 'HTTP health response or banner text']] },
    exercise: { scenario: 'A scan shows 10.10.10.20 has ports 80 and 31337 open.', task: 'Write a short evidence note.', answer: 'Target 10.10.10.20 exposes HTTP on TCP/80 and a training-banner service on TCP/31337. Next steps are to request /health and read the banner.', evidence: 'Save the scan output and one follow-up response.' },
    misconceptions: ['A port number is not a vulnerability.', 'No response is not proof a host is safe.', 'Scope is part of the technical task.'],
    sources: [primarySources.testing, primarySources.ncat],
    labs: ['pre-netcat-services'],
    quiz: [
      { question: 'What does a port identify?', options: ['A service endpoint on a host', 'A person using the host', 'A password policy', 'A certificate design'], answer: 0 },
      { question: 'Why use nmap -sV?', options: ['To identify service versions', 'To write reports automatically', 'To decrypt TLS', 'To create users'], answer: 0 },
    ],
  },
  {
    id: 'pre-network-2', slug: 'dns-transport-and-tls', title: 'DNS, TCP, TLS, and Netcat', summary: 'Understand names, connections, encryption limits, and why Netcat is useful for plain TCP services.', minutes: 22,
    prerequisite: 'Know what an IP address and port are.',
    outcomes: ['Explain DNS name-to-address mapping', 'Recognize a TCP handshake and banner', 'Know when TLS prevents payload reading'],
    introduction: 'Most tools are just careful ways of asking network questions. DNS asks where a name points. TCP asks whether a service will talk. TLS changes what you can read in the middle.',
    toolWorkflow: [
      { tool: 'DNS inspection', when: 'Use it when a domain name appears in a lab or packet capture.', actions: ['Identify the queried name.', 'Record the answer address and TTL if present.', 'Treat the result as name resolution, not proof that the website worked.'], evidence: 'Query name, answer IP, frame or output line, and the tool view used.' },
      { tool: 'Netcat plain TCP check', when: 'Use it for simple banner services where encryption is not involved.', actions: ['Connect to the named host and port.', 'Copy the first server response exactly.', 'Stop if the service requires unknown protocol behavior.'], evidence: 'Connection target, banner text, and a note that it was visible because it was not TLS-encrypted.' },
    ],
    keyTerms: [
      { term: 'DNS answer', meaning: 'A response that maps a name to an address or another record.' },
      { term: 'TCP handshake', meaning: 'The connection setup that happens before application data is exchanged.' },
      { term: 'TLS', meaning: 'Encryption that protects application content between endpoints.' },
      { term: 'Metadata', meaning: 'Observable facts such as endpoints, timing, and certificate details that may remain visible even when payloads are encrypted.' },
    ],
    readinessChecklist: ['You can explain what DNS proves and what it does not prove.', 'You know why Netcat works well for plain banners.', 'You can write a limitation for encrypted traffic.'],
    sections: [
      { title: 'DNS Answers the Where Question', paragraphs: ['DNS maps names to addresses. In the training capture, portal.lab resolves to 10.10.10.20. That does not prove the web app is healthy; it only proves what address the name points to at that moment.', 'When DNS is wrong, browsers and tools may contact the wrong host. When DNS is right, the next question is whether the service responds.'] },
      { title: 'TCP Starts a Conversation', paragraphs: ['TCP uses a three-step handshake before data flows. Netcat is useful because it lets you open a simple TCP connection and see the first words a service sends. That first banner can reveal a protocol, version, or warning.', 'Netcat is not magic. If the service expects a precise protocol, typing random text may do nothing. In beginner labs, use it to read plain banners and understand connection behavior.'] },
      { title: 'TLS Changes Visibility', paragraphs: ['TLS encrypts application data. Without keys or endpoint visibility, a packet capture may show IPs, ports, timing, and certificate metadata, but not the HTTP path or body. This is why Wireshark lessons separate HTTP from TLS.'] },
    ],
    table: { headers: ['Layer clue', 'What it can tell you', 'What it cannot prove alone'], rows: [['DNS', 'Name resolves to an address', 'The service is healthy'], ['TCP banner', 'A plain service is listening', 'The service is vulnerable'], ['TLS record', 'Encrypted data moved', 'The hidden HTTP path']] },
    exercise: { scenario: 'Netcat reads a banner from 10.10.10.20:31337 but TLS traffic to 10.10.10.30 remains unreadable.', task: 'Explain the difference.', answer: 'The banner service is plain TCP, so the text is visible. The TLS flow carries encrypted application data, so a capture without keys cannot read the request body or path.', evidence: 'Record both the banner output and the TLS limitation in the note.' },
    misconceptions: ['DNS success does not mean web success.', 'Netcat reads plain conversations; it does not automatically understand every protocol.', 'Encrypted payloads should not be treated as readable evidence.'],
    sources: [primarySources.ncat, primarySources.wireshark],
    labs: ['pre-netcat-services', 'pre-wireshark-first-capture'],
    quiz: [
      { question: 'What does DNS primarily map?', options: ['Names to addresses', 'Passwords to hashes', 'Files to permissions', 'Certificates to reports'], answer: 0 },
      { question: 'What does TLS usually hide from a passive capture?', options: ['Application payload content', 'Source IP address', 'Destination IP address', 'Packet timing'], answer: 0 },
    ],
  },
  {
    id: 'pre-network-3', slug: 'web-requests-browser-and-databases', title: 'HTTP Requests Before Web Attacks', summary: 'Read methods, paths, hosts, headers, cookies, and responses before using Burp Suite.', minutes: 21,
    prerequisite: 'Know what a host and port are.',
    outcomes: ['Identify HTTP method, path, host, and cookie', 'Separate authentication from authorization', 'Prepare for Burp Repeater practice'],
    introduction: 'Web security starts with reading one request carefully. If you cannot explain the request, changing it will feel like guessing.',
    toolWorkflow: [
      { tool: 'HTTP request reading', when: 'Use it before changing anything in Burp or curl.', actions: ['Read the method, path, Host header, and Cookie header.', 'Identify the identity represented by the session.', 'Write what object the request is asking for.'], evidence: 'A short request summary with method, path, host, session identity, and expected access rule.' },
      { tool: 'Burp Repeater preparation', when: 'Use it once you have a clean baseline request.', actions: ['Send the original request first.', 'Change one variable, such as object ID or cookie.', 'Compare status code and response body against the baseline.'], evidence: 'A three-row comparison: baseline, changed object, removed or changed session.' },
    ],
    keyTerms: [
      { term: 'Method', meaning: 'The requested HTTP action, such as GET, POST, PUT, PATCH, or DELETE.' },
      { term: 'Path', meaning: 'The resource location requested from the web server.' },
      { term: 'Cookie', meaning: 'Client-side state often used to carry a session identifier.' },
      { term: 'Authorization', meaning: 'The decision about what an authenticated identity may access or change.' },
    ],
    readinessChecklist: ['You can label the request method, path, host, and cookie.', 'You can explain the difference between 401 and 403.', 'You can design a one-variable request comparison.'],
    sections: [
      { title: 'The Request Line', paragraphs: ['GET /api/profile/alex HTTP/1.1 says the method is GET, the path is /api/profile/alex, and the protocol version is HTTP/1.1. The Host header says which site the client meant to reach.', "Cookies often carry session identity. A missing or invalid session is an authentication problem. A valid session trying to read someone else's object is usually an authorization question."] },
      { title: 'Responses Have Meaning', paragraphs: ['A 200 response means the request succeeded. A 401 response usually means authentication is missing or invalid. A 403 response usually means the server understood who you are but refused the action. Those differences matter in reports.', 'Never jump from "403" to "secure" or from "200" to "vulnerable." You need the request, the response, and the intended access rule.'] },
      { title: 'One Variable at a Time', paragraphs: ['Burp Repeater is powerful because it lets you change one part of the request and compare the result. Change the object ID. Then change the cookie. Then change the path. Do not change five things and pretend you know which one mattered.'], code: 'GET /api/profile/alex HTTP/1.1\nHost: portal.lab\nCookie: session=learner-alex', label: 'Baseline HTTP request' },
    ],
    table: { headers: ['HTTP part', 'Example', 'Question it answers'], rows: [['Method', 'GET', 'What action is requested?'], ['Path', '/api/profile/alex', 'What object is requested?'], ['Cookie', 'session=learner-alex', 'Who is the requester claiming to be?']] },
    exercise: { scenario: 'A baseline request returns 200, changing alex to sam returns 403, and removing the cookie returns 401.', task: 'What did you learn?', answer: 'The app distinguishes normal access, denied cross-user access, and missing authentication. That suggests the tested endpoint has an authorization boundary for sam in this fixture.', evidence: 'Save the three request/response pairs.' },
    misconceptions: ['401 and 403 mean different things.', 'A cookie is not the same as authorization.', 'Changing one variable at a time is slower only until you need to explain your result.'],
    sources: [primarySources.http, primarySources.burp],
    labs: ['pre-burp-first-request'],
    quiz: [
      { question: 'What does 401 most commonly indicate?', options: ['Authentication is missing or invalid', 'The request is always malicious', 'The file is deleted', 'The DNS server failed'], answer: 0 },
      { question: 'Why change one request field at a time?', options: ['To know what caused the response change', 'To make the server slower', 'To avoid using headers', 'To hide evidence'], answer: 0 },
    ],
  },
];
