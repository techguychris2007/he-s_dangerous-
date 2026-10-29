import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

export const beginnerSystemLessons: CurriculumLesson[] = [
  {
    id: 'pre-system-1', slug: 'linux-navigation-and-streams', title: 'Wireshark: Display Filters and Frames', summary: 'Use display filters to reduce noise and inspect the fields that matter.', minutes: 22,
    prerequisite: 'Know IP addresses, ports, DNS, and HTTP basics.',
    outcomes: ['Apply simple Wireshark display filters', 'Inspect frame details without overclaiming', 'Explain why capture filters and display filters differ'],
    introduction: 'Wireshark can show thousands of packets. Beginners get lost when they try to read everything. The skill is choosing a question, filtering for the evidence, and inspecting the frame that answers it.',
    toolWorkflow: [
      { tool: 'Wireshark display filters', when: 'Use them when a capture contains too much traffic to read row by row.', actions: ['Start with a broad protocol filter such as dns, http, tcp, or tls.', 'Narrow by address only after you know the target.', 'Open the frame details and copy the exact field that supports your claim.'], evidence: 'Filter used, frame number, field name, field value, and what the field proves.' },
    ],
    keyTerms: [
      { term: 'Frame', meaning: 'One captured packet row in Wireshark.' },
      { term: 'Display filter', meaning: 'A view filter that hides or shows packets already captured.' },
      { term: 'Capture filter', meaning: 'A collection rule applied before packets are saved.' },
      { term: 'Field', meaning: 'A parsed value inside packet details, such as DNS query name or answer address.' },
    ],
    readinessChecklist: ['You can find a DNS answer by frame number.', 'You can explain why display filters do not change the original capture.', 'You can write one packet-evidence sentence without overclaiming.'],
    sections: [
      { title: 'Display Filters Answer Questions', paragraphs: ['A display filter hides rows in the view; it does not change the capture. dns shows DNS packets. http shows cleartext HTTP packets. ip.addr == 10.10.10.20 shows packets where that address is source or destination.', 'A capture filter is different because it decides what is collected before the packets are saved. In beginner labs you mostly use display filters because the evidence is already captured.'] },
      { title: 'Frames, Fields, and Evidence', paragraphs: ['Each packet row is a frame. The row gives a summary; the details pane gives fields. For DNS, useful fields include query name, answer address, transaction ID, response bit, and TTL. A good note says exactly which frame supports the claim.', 'In the DarkWorld capture, frame 2 is the DNS answer that maps portal.lab to 10.10.10.20. That is a narrow, evidence-backed claim.'] },
      { title: 'Useful Starter Filters', paragraphs: ['Start with protocol filters, then narrow by address or stream. If a filter returns nothing, check spelling and ask whether the protocol is encrypted or simply absent from the capture.'], code: 'dns\nhttp\ntcp\ntls\nip.addr == 10.10.10.20\ntcp.stream == 0', label: 'Wireshark display filters' },
    ],
    table: { headers: ['Filter', 'Shows', 'Common mistake'], rows: [['dns', 'Name queries and answers', 'Treating DNS as proof the web app worked'], ['http', 'Cleartext HTTP messages', 'Expecting it to show TLS payloads'], ['ip.addr == 10.10.10.20', 'Traffic involving one IP', 'Forgetting it can match source or destination']] },
    exercise: { scenario: 'A capture shows a DNS answer for portal.lab but no readable HTTP rows.', task: 'What can you safely conclude?', answer: 'You can conclude the capture contains a DNS answer for the name. You cannot conclude the web request succeeded unless HTTP or another application-layer result is present.', evidence: 'Save the frame number, filter, and exact field value.' },
    misconceptions: ['A display filter does not delete packets.', 'A DNS answer is not an HTTP response.', 'No rows can mean wrong filter, encryption, or absent traffic.'],
    sources: [primarySources.wireshark],
    labs: [],
    quiz: [
      { question: 'What does a Wireshark display filter do?', options: ['Hides or shows rows in the current view', 'Changes packets on the network', 'Decrypts every flow', 'Creates a user account'], answer: 0 },
      { question: 'Which filter shows DNS traffic?', options: ['dns', 'whoami', 'grep dns', 'cookie'], answer: 0 },
    ],
  },
  {
    id: 'pre-system-2', slug: 'windows-powershell-and-identity', title: 'Wireshark: TCP Streams and Cleartext HTTP', summary: 'Follow a stream and translate packets into a readable request and response.', minutes: 23,
    prerequisite: 'Complete the display filter lesson.',
    outcomes: ['Explain a TCP stream', 'Follow readable HTTP conversation data', 'Separate packet-level facts from application-level meaning'],
    introduction: 'A stream is a conversation reconstructed from packets. Following a stream helps you see how a request and response fit together.',
    toolWorkflow: [
      { tool: 'Follow TCP Stream', when: 'Use it after a filter shows readable HTTP packets in one conversation.', actions: ['Identify the stream number from packet details.', 'Open the stream reconstruction.', 'Separate client request text from server response text.'], evidence: 'Stream number, method and path, response status, and the exact response field that matters.' },
    ],
    keyTerms: [
      { term: 'TCP stream', meaning: 'A single reconstructed conversation between two endpoints.' },
      { term: 'Handshake', meaning: 'Connection setup before application data moves.' },
      { term: 'HTTP status', meaning: 'The response code that describes how the server handled the request.' },
      { term: 'Application data', meaning: 'The protocol content carried after connection setup, such as an HTTP request.' },
    ],
    readinessChecklist: ['You can tell handshake packets apart from application data.', 'You can extract a readable request and response from one stream.', 'You can state what a 200 response proves in context.'],
    sections: [
      { title: 'From Handshake to Data', paragraphs: ['TCP usually starts with SYN, SYN-ACK, and ACK. Those packets establish the connection. Application data comes after that. In the training capture, the HTTP GET and 200 OK belong to TCP stream 0.', 'You do not need to memorize every flag to begin. You do need to recognize that connection setup is not the same as the application request.'] },
      { title: 'Follow Stream Carefully', paragraphs: ['Follow TCP Stream takes packets from the same stream and displays the conversation. For cleartext HTTP, that can reveal the method, path, host, status, and body. For TLS, the same action may only show encrypted bytes.', 'When you report stream evidence, include the stream number and the readable fields. Avoid claiming intent from a single request unless the scenario supports it.'] },
      { title: 'What the Lab Teaches', paragraphs: ['The HTTP stream shows GET /health and a JSON response saying the case is ready. That proves a health check succeeded in the fixture. It does not prove login, exploitation, or sensitive data exposure.'] },
    ],
    table: { headers: ['Packet evidence', 'Meaning', 'Limit'], rows: [['SYN/SYN-ACK/ACK', 'TCP connection setup', 'Not an HTTP request'], ['GET /health', 'Client requested a path', 'Not proof of compromise'], ['200 OK', 'Server returned success', 'Meaning depends on endpoint']] },
    exercise: { scenario: 'You follow stream 0 and see GET /health followed by {"status":"ready"}.', task: 'Write a precise evidence sentence.', answer: 'TCP stream 0 contains a cleartext HTTP GET request to /health and a 200 OK JSON response showing status ready.', evidence: 'Save the stream number and the request/response text.' },
    misconceptions: ['A TCP connection is not automatically a successful web action.', 'A 200 response is not automatically sensitive.', 'Stream reconstruction is evidence, not a story by itself.'],
    sources: [primarySources.wireshark, primarySources.http],
    labs: [],
    quiz: [
      { question: 'What does Follow TCP Stream help reconstruct?', options: ['A conversation from packets in one stream', 'A deleted file timeline', 'A password policy', 'A certificate badge'], answer: 0 },
      { question: 'What does GET /health prove in the training capture?', options: ['A health endpoint was requested', 'Root access was gained', 'All traffic is decrypted', 'DNS failed'], answer: 0 },
    ],
  },
  {
    id: 'pre-system-3', slug: 'logs-processes-and-troubleshooting', title: 'Wireshark: Encryption and Troubleshooting', summary: 'Learn why some traffic remains unreadable and how to troubleshoot filters without inventing conclusions.', minutes: 20,
    prerequisite: 'Know display filters and TCP streams.',
    outcomes: ['Recognize TLS payload limits', 'Troubleshoot empty filters', 'Write limitations honestly'],
    introduction: 'Good analysts know what they cannot see. A packet capture can prove timing, endpoints, ports, and protocol metadata while still hiding the application data.',
    toolWorkflow: [
      { tool: 'TLS visibility check', when: 'Use it when HTTP filters are empty but web traffic may still exist.', actions: ['Try http first to look for cleartext.', 'Try tls and tcp to identify encrypted flows.', 'Record what metadata is visible and what content is hidden.'], evidence: 'Filters tried, endpoint and port metadata, and a limitation sentence about unreadable payload content.' },
    ],
    keyTerms: [
      { term: 'Payload', meaning: 'The application content carried inside packets.' },
      { term: 'Encrypted flow', meaning: 'Traffic where payload content is protected from passive reading.' },
      { term: 'Limitation', meaning: 'A clear statement of what the available evidence cannot prove.' },
      { term: 'False absence', meaning: 'A weak conclusion caused by assuming an empty filter means the activity never happened.' },
    ],
    readinessChecklist: ['You can troubleshoot an empty filter without guessing.', 'You can explain why TLS hides paths and bodies.', 'You can write a limitation that keeps the finding honest.'],
    sections: [
      { title: 'TLS Limits', paragraphs: ['TLS encrypts application data between endpoints. Without keys or endpoint logs, Wireshark cannot simply reveal the hidden HTTP request. You may still see the client IP, server IP, port 443, packet sizes, and timing.', 'That visibility is useful, but it is limited. Your note should say "TLS application data observed" rather than "the user visited this exact URL" unless you have other evidence.'] },
      { title: 'When a Filter Returns Nothing', paragraphs: ['First check spelling. Then try a broader filter such as tcp or ip.addr == target. Then ask whether the protocol is encrypted, absent, or using a different port. Empty results are troubleshooting clues, not final answers.', 'A professional report includes limitations. "No readable HTTP payload was present in the supplied capture" is stronger than pretending the traffic did not exist.'] },
      { title: 'Prepare for Bigger Captures', paragraphs: ['The same habits scale: start with a question, filter, inspect one frame, follow a stream when appropriate, and write what the evidence can and cannot show.'] },
    ],
    table: { headers: ['Observation', 'Safe statement', 'Unsafe jump'], rows: [['TLS application data', 'Encrypted data moved over TCP/443', 'The exact URL was /admin'], ['Empty http filter', 'No cleartext HTTP rows matched', 'No web traffic exists'], ['Broad tcp rows', 'Connections occurred', 'The app was exploited']] },
    exercise: { scenario: 'A learner filters http and sees nothing, then filters tls and sees encrypted application data.', task: 'Repair the conclusion.', answer: 'The capture has TLS traffic but no readable cleartext HTTP rows for that filter. More evidence is needed to identify hidden paths or content.', evidence: 'Save both filters and the limitation sentence.' },
    misconceptions: ['Encryption limits content visibility.', 'An empty filter is not proof of absence.', 'Metadata is useful but narrower than payload evidence.'],
    sources: [primarySources.wireshark],
    labs: [],
    quiz: [
      { question: 'What should you avoid claiming from encrypted TLS data alone?', options: ['The exact hidden HTTP path', 'The destination IP', 'The existence of traffic', 'The destination port'], answer: 0 },
      { question: 'What is a good first step when a filter returns nothing?', options: ['Check spelling and broaden the filter', 'Declare the host safe', 'Delete the capture', 'Change the certificate'], answer: 0 },
    ],
  },
];
