import type { CurriculumLesson } from '../curriculumDefinition';

export const protocolLessons: CurriculumLesson[] = [
  {
    id: 'py-protocol-1', slug: 'bytes-utf8-tcp-framing-and-bounds', title: 'Bytes, UTF-8, TCP Framing and Bounds',
    summary: 'Implement a small binary message format while understanding byte lengths, partial input and complete-consumption validation.',
    minutes: 50, prerequisite: 'Python strings, bytes, functions and integer arithmetic. The first section explains how these types differ.',
    outcomes: ['Calculate encoded byte lengths', 'Decode a bounded framed stream', 'Reject incomplete or invalid input without returning partial success'],
    introduction: 'A network protocol defines how bytes represent messages. TCP supplies an ordered byte stream, so your application must define where one message ends and another begins. A single recv call is not a complete-message contract.',
    sections: [
      { title: 'Text characters and wire bytes have different lengths', paragraphs: [
        'Python str represents Unicode text. bytes represents byte values. Encoding turns text into bytes according to a named encoding; decoding interprets bytes according to that encoding. UTF-8 uses different byte counts for different characters. The text é has one character but encodes into two bytes. A wire length must therefore count the encoded bytes, not the characters in the original string.',
        'Strict decoding rejects byte sequences that are not valid for the encoding. Ignoring decoding errors can change identities or make different inputs appear equal, so it is not a neutral repair. Define the accepted encoding and malformed-input behavior as part of the protocol. Do not use pickle to deserialize arbitrary peer input; its object-construction behavior introduces a separate execution boundary.',
      ], code: 'text = "é"\npayload = text.encode("utf-8")\nprint(len(text), len(payload))  # 1 2\nheader = len(payload).to_bytes(4, "big")\nprint(header.hex())  # 00000002\nprint(int.from_bytes(header, "big"))  # 2', label: 'Executable Python byte-length and big-endian header example' },
      { title: 'A length prefix supplies message boundaries', paragraphs: [
        'Our practice format uses four unsigned big-endian bytes for a payload length, followed by exactly that many UTF-8 bytes. Big-endian puts the most significant byte first. A zero length represents an empty message. The four-byte field can represent very large values, but the application contract limits payloads to 4096 bytes. Representation capacity is not permission to allocate that much memory.',
        'A decoder first checks that a complete header remains, then interprets its length, checks the application limit and verifies that the complete payload remains. Only then does it decode. Advance the cursor by header length plus payload length and continue until the input is fully consumed. One valid frame followed by a truncated frame must fail under this task’s all-or-error contract.',
      ] },
      { title: 'Partial reads require state and limits', paragraphs: [
        'A live socket recv call can return fewer bytes than requested. A receiver commonly accumulates the required header and body while handling timeout, closure and size limits. sendall handles sending the supplied bytes under its behavior; it does not turn TCP into a message-oriented protocol. A zero-byte receive indicates stream closure, and closure before a complete frame is a protocol failure.',
        'The coding lab decodes a complete supplied bytes buffer so you can master the format before adding live I/O. A later socket implementation additionally needs a bounded buffer, timeout, cancellation and concurrency policy. Do not add remote command execution, credential collection or persistence to an exercise about message boundaries.',
      ] },
      { title: 'Implement and test the full codec yourself', paragraphs: [
        'The assignment provides empty encode_frames and decode_frames functions. You write type validation, encoding, size limits, headers, cursor arithmetic and error handling. Test ASCII, multi-byte text, empty frames, multiple frames, truncated headers, truncated bodies, invalid UTF-8 and oversized advertised payloads. A boolean is not accepted as the exact integer payload limit even though Python bool subclasses int.',
        'Use expected bytes to check your encoder independently of your decoder: two incorrect functions can sometimes round-trip each other. The string é must produce length header 00000002. After the codec passes, explain why encrypting transport would not repair a decoder that trusts an unchecked length field.',
      ] },
    ],
    table: { headers: ['Field', 'Meaning', 'Limit'], rows: [] },
    exercise: { scenario: 'A decoder returns the first valid message and ignores an incomplete second header.', task: 'Explain why this violates the contract and add a test catching it.', answer: 'The task requires complete consumption or an error. Append one byte to a valid encoded frame and expect ValueError rather than partial success.', evidence: 'Your expected wire bytes and malformed trailing-input test.' },
    misconceptions: ['TCP reads do not preserve application-message boundaries.', 'Character count is not UTF-8 byte length.', 'Transport encryption does not validate application framing.'],
    sources: [{ title: 'Python socket programming', url: 'https://docs.python.org/3/howto/sockets.html' }, { title: 'Python binary sequence types', url: 'https://docs.python.org/3/library/stdtypes.html#binary-sequence-types-bytes-bytearray-memoryview' }],
    labs: ['py-stream-frames'],
    quiz: [{ question: 'How many UTF-8 bytes represent é?', options: ['One in every encoding', 'Two', 'Four because the header is four bytes'], answer: 1 }],
  },
  {
    id: 'web-protocol-1', slug: 'query-form-encoding-and-duplicate-parameters', title: 'Query Encoding, Form Bodies and Duplicate Parameters',
    summary: 'Parse actual encoded input and understand where proxies, frameworks and application validation can disagree.',
    minutes: 40, prerequisite: 'HTTP requests have a target, headers and optional body; Python strings hold text. These boundaries are explained below.',
    outcomes: ['Distinguish encoding from encryption', 'Preserve repeated values during parsing', 'Declare an unambiguous parameter contract'],
    introduction: 'A web application interprets several formats before it uses an input value. URL percent-encoding, form encoding, JSON parsing and HTML output are different operations. Treating them as one generic sanitization step creates confusion and security gaps.',
    sections: [
      { title: 'Percent-encoding represents bytes in a URL', paragraphs: [
        'A percent escape uses a percent sign and two hexadecimal digits. %2F represents the byte used for slash; %20 represents a space. Encoding allows values to be represented in a format, but does not authenticate the sender or make a value safe in another interpreter. Decode only according to the actual boundary’s contract rather than repeatedly decoding until the string stops changing.',
        'In application/x-www-form-urlencoded data, a plus sign commonly represents a space. An encoded %2B represents a literal plus. JSON does not apply these form rules. The request Content-Type helps identify the intended body format, but the server still needs a supported parser and explicit limits.',
      ] },
      { title: 'Repeated keys are actual input, not noise', paragraphs: [
        'A request can contain role=user&role=admin. Some APIs return the first value, some return the last, and others return a list. If a security check and business operation use different interpretations, checking one value does not protect the other. Preserve repetition until your application applies a deliberate rule.',
        'The executable example below keeps ordered name/value pairs and blank values. For a field defined as single-valued, reject duplicates rather than silently allowing a downstream component to pick another value. Multi-valued fields such as selected tags can use a different explicit schema.',
      ], code: 'from urllib.parse import parse_qsl\n\npairs = parse_qsl("name=Alice+Smith&symbol=%2B&role=user&role=admin&empty=", keep_blank_values=True)\nprint(pairs)\n# name becomes Alice Smith; symbol becomes +; both role values remain.\nroles = [value for key, value in pairs if key == "role"]\nif len(roles) != 1:\n    print("Rejected duplicate single-valued role field")', label: 'Executable local form parsing with duplicate preservation' },
      { title: 'Parse once, validate the resulting schema', paragraphs: [
        'After format parsing, validate field names, required fields, types, ranges and permitted combinations. Reject an unknown privilege field even if its syntax is well-formed. Authorization uses the verified actor and requested resource; a parsed owner or role string does not establish authority.',
        'Proxies and frameworks can differ in path normalization, header handling and body limits. For a controlled test, preserve the exact request bytes where possible and observe which component performs each interpretation. Do not turn one parser difference into a claim that every deployment is vulnerable.',
      ] },
      { title: 'Output uses a different context', paragraphs: [
        'A value accepted as a name may later appear in HTML text, an attribute, a URL or a database query. Each receiving context needs its appropriate API: escaped text binding for ordinary HTML text, a supported URL builder for URLs and driver-bound values for SQL. Input validation does not replace output handling.',
        'In the paired web fixture, change one documented input while keeping identity and the target object explicit. For coding practice, write a single-valued field parser that rejects duplicate role keys, preserves a literal encoded plus and distinguishes missing from present-but-empty values. Avoid adding unrelated exploit chains to this format lesson.',
      ] },
    ],
    table: { headers: ['Format', 'Operation', 'Not established'], rows: [] },
    exercise: { scenario: 'A gateway checks the first role value and a backend uses the last.', task: 'Explain the inconsistent interpretation and propose a single-valued contract.', answer: 'The request supplies two values but components choose different ones. Parse the same declared schema at the intended boundary and reject duplicates for role before authorization or execution.', evidence: 'The original pairs and explicit duplicate rejection.' },
    misconceptions: ['Encoding is not encryption.', 'Form plus-sign behavior is not universal JSON behavior.', 'Parsing a role does not authorize that role.'],
    sources: [{ title: 'Python URL parsing', url: 'https://docs.python.org/3/library/urllib.parse.html' }, { title: 'HTTP semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' }],
    labs: ['web-live-relay-support'],
    quiz: [{ question: 'What does a literal plus in form-encoded data normally represent?', options: ['A space', 'Administrator access', 'An encrypted byte'], answer: 0 }],
  },
];
