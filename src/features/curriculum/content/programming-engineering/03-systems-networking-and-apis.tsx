import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SystemsAndNetworking() {
  return <div className="prose-hh">
    <h1>Processes, Networking &amp; HTTP APIs</h1>
    <p>A program runs inside an operating system, uses memory and file descriptors, and may communicate with another machine over a network. Understanding these boundaries helps explain timeouts, port conflicts, buffering, permission errors, and why a request can fail at several different layers before application code sees it.</p>
    <h2>Processes, threads, and resources</h2>
    <p>A process is a running program with its own virtual address space and operating-system resources. A thread is an execution path within a process; threads share process memory, which makes communication convenient but creates race conditions if shared state is changed without coordination. A file descriptor is a process-local handle for an open file, socket, or pipe. Handles are finite resources and should be closed reliably.</p>
    <p>Virtual memory gives a process the illusion of a private address space; the operating system maps virtual pages to physical memory and enforces access permissions. Python manages most object memory automatically through reference counting and a cyclic garbage collector, but it cannot automatically release every external resource. Use context managers for files, sockets, locks, and database connections.</p>
    <h2>From a hostname to an application response</h2>
    <p>A client typically resolves a hostname using DNS, chooses an IP address, establishes transport connectivity with TCP or another transport, negotiates TLS for HTTPS, sends an HTTP request, and receives a response. This layered view is diagnostic: DNS failure is not an HTTP status; a TCP timeout is not an application denial; and a successful TLS handshake does not mean the user is authorized.</p>
    <CodeBlock label="A bounded HTTPS request with explicit failure classes">{`from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def fetch_status(url):
    request = Request(url, headers={"User-Agent": "DarkWorld-Training/1.0"})
    try:
        with urlopen(request, timeout=5) as response:
            return response.status, response.headers.get("Content-Type", "")
    except HTTPError as error:
        # The peer responded with an HTTP error status; it is still a response.
        return error.code, error.headers.get("Content-Type", "")
    except URLError as error:
        # DNS, connection, TLS, or other transport-level failure may be nested here.
        raise ConnectionError(f"request could not reach the service: {error.reason}") from error

# Use only with a service you own or are authorized to test.
# status, content_type = fetch_status("https://example.org/health")`}</CodeBlock>
    <p>Production HTTP clients need timeouts because an unbounded wait can tie up a worker indefinitely. They also need response-size limits, certificate verification, redirect policy, retry rules, and careful handling of secrets in URLs and logs. A timeout should be chosen from the operation's latency objective; it is not merely a number copied from an example.</p>
    <h2>HTTP request anatomy and statelessness</h2>
    <p>An HTTP request has a method, target, headers, and sometimes a body. A response has a status, headers, and often a body. HTTP itself does not make two requests belong to the same user; applications add cookies or tokens to represent a session. Methods express intended semantics: GET reads, POST commonly creates or triggers work, PUT replaces, PATCH partially updates, and DELETE removes. Correct semantics matter for caching, retries, auditing, and access control.</p>
    <p>Authentication answers “who is making this request?” Authorization answers “may this identity perform this action on this object?” A valid identifier in a URL is not proof of permission. Enforce authorization server-side on every operation, especially when changing an object ID from one value to another could expose another user's record.</p>
    <h2>HTTPS and TLS protect a channel, not application logic</h2>
    <p>TLS authenticates the server certificate and encrypts data in transit when configured correctly. It does not prevent a compromised endpoint from reading data, validate that a request is authorized, make unsafe input safe, or guarantee the server's application behaves correctly. Certificate verification should remain enabled. Avoid custom cryptography and use maintained clients and platform trust stores.</p>
    <h2>Socket programming and framing</h2>
    <p>A TCP socket provides a reliable byte stream, not a sequence of application messages. One send can be received in multiple chunks; multiple sends can arrive together. Applications need framing, such as a length prefix or delimiter with escaping, and must handle partial reads and writes. UDP preserves datagram boundaries but does not guarantee delivery or order. The standard socket API is low-level; most application code should use a mature HTTP or database client instead.</p>
    <CodeBlock label="Illustrative TCP read loop: a stream must be read until its protocol boundary">{`def read_exactly(sock, byte_count):
    chunks = []
    remaining = byte_count
    while remaining:
        chunk = sock.recv(remaining)
        if not chunk:
            raise EOFError("peer closed before the complete message arrived")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)

# A real protocol must first define how byte_count is encoded and bounded.
# Reject a declared size above a safe limit before allocating or reading it.`}</CodeBlock>
    <Callout variant="warn"><p>Never expose a raw socket service or test client to arbitrary public targets from a learner platform. Network exercises should run against explicitly authorized local or simulated services, with destination allowlists and resource limits.</p></Callout>
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/library/socket.html" target="_blank" rel="noreferrer">Python sockets</a>, <a href="https://www.rfc-editor.org/rfc/rfc9110" target="_blank" rel="noreferrer">HTTP Semantics (RFC 9110)</a>, and <a href="https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP REST Security</a>.</p>
  </div>;
}
