import CodeBlock from '../../components/lesson/CodeBlock';

export default function TcpUdpHandshake() {
  return (
    <div className="prose-hh">
      <h1>TCP, UDP, and Transport-Layer Behavior</h1>
      <p>
        IP moves packets between network interfaces, but applications also need a way to distinguish
        conversations and decide how data should be delivered. The transport layer provides that service.
        TCP establishes state and delivers an ordered byte stream; UDP sends independent datagrams with
        much less transport-level coordination. These differences explain ordinary application behavior,
        packet captures, firewall logs, and what a network scanner can infer from a response.
      </p>

      <h2>Start with the application conversation</h2>
      <p>
        Imagine a laptop opening an HTTPS connection to a server. The IP packet identifies source and
        destination addresses. The TCP header adds source and destination ports. The resulting four values
        are often called the <strong>four-tuple</strong>: client IP, client port, server IP, server port.
        Protocol is also needed to distinguish TCP from UDP, so monitoring systems commonly describe the
        full flow as a five-tuple. A client usually chooses a temporary source port, while the server listens
        on a configured destination port. Many unrelated clients can contact the same server port because
        each conversation has its own tuple.
      </p>
      <CodeBlock label="One HTTPS flow as a five-tuple">{'Protocol: TCP\nSource:      192.0.2.25:53014\nDestination: 198.51.100.40:443\n\nA second browser connection can use a different source port while still\nconnecting to destination TCP port 443.'}</CodeBlock>
      <p>
        A port is local to a host and transport protocol; it is not a global address. TCP port 53 and UDP
        port 53 are separate endpoints. DNS commonly uses UDP for ordinary queries and can use TCP when
        responses are truncated, for zone transfers, and in other situations. A firewall rule for one
        transport does not automatically permit the other.
      </p>

      <h2>TCP is a reliable, ordered byte stream</h2>
      <p>
        TCP gives an application a bidirectional stream of bytes. It does not preserve the boundaries of
        individual application writes: one write may be delivered in multiple reads, and several writes may
        arrive together. Applications that need message boundaries must define them, for example with a
        fixed-length header, delimiter, or length-prefixed frame.
      </p>
      <p>
        TCP assigns sequence numbers to bytes. A receiver acknowledges the next byte it expects. If data is
        lost, duplicate acknowledgements or a retransmission timer can lead the sender to retransmit it. The
        receiver reassembles bytes in order and checks the TCP checksum for corruption. This makes TCP a
        reliable transport service while the connection remains usable; it does not guarantee that a
        connection will eventually succeed. A cable can be unplugged, a route can disappear, a peer can
        crash, or an application can close the socket. TCP reports failure to the application rather than
        delivering a magical guarantee of eventual delivery.
      </p>
      <p>
        Reliability, flow control, and congestion control solve different problems. Reliability detects
        loss and supports retransmission. <strong>Flow control</strong> uses the receiver-advertised window
        to keep a sender from overwhelming the receiving application or host buffer. <strong>Congestion
        control</strong> adjusts traffic sent into the network to reduce congestion. The effective amount
        in flight is constrained by both receiver capacity and the sender's congestion-control state; the
        TCP window field alone is not a fixed sending rate.
      </p>

      <h2>The TCP three-way handshake, one step at a time</h2>
      <p>
        Before normal TCP data exchange, the endpoints synchronize initial sequence numbers and establish
        connection state. The initiating host sends a segment with SYN set. The listener responds with
        SYN and ACK. The initiator acknowledges the listener's sequence number. The ACK values refer to the
        next sequence number expected, which is why each SYN consumes one sequence number even before
        application data is sent.
      </p>
      <CodeBlock label="Read the sequence and acknowledgment numbers">{'Client                                      Server\n  | ---- SYN, seq = x ----------------------> |\n  | <--- SYN-ACK, seq = y, ack = x + 1 ------ |\n  | ---- ACK, ack = y + 1 ------------------> |\n  |             application data             |\n\nThe first endpoint offers sequence number x. The second offers y.\nEach ACK confirms the SYN from the other endpoint and states the next byte expected.'}</CodeBlock>
      <p>
        A successful handshake proves that this exchange reached a TCP endpoint willing to complete the
        connection at that moment. It does not prove that the service is safe, authenticated, correctly
        configured, or reachable from every network. TLS is a separate protocol negotiation commonly
        layered over TCP; a TCP handshake by itself provides no encryption or server identity check.
      </p>
      <p>
        TCP has other valid state transitions too. Simultaneous open is possible when both endpoints send
        SYN. Retransmissions can repeat handshake segments when replies are lost. Middleboxes may alter,
        proxy, or reset the exchange. These cases are useful to recognize in packet captures but do not
        change the ordinary three-message flow most learners first observe.
      </p>

      <h2>TCP flags are evidence, not plain-English verdicts</h2>
      <p>
        TCP flags are bits in the header that communicate protocol state. A packet capture may display
        several flags at once. Interpreting a flag requires the packet direction, connection state,
        sequence numbers, and surrounding packets; a single flag should not be translated into a universal
        statement about the application.
      </p>
      <ul>
        <li><strong>SYN</strong> begins or participates in synchronizing connection sequence state.</li>
        <li><strong>ACK</strong> makes the acknowledgment field meaningful and acknowledges received sequence space.</li>
        <li><strong>FIN</strong> says that this sender has no more stream data to send; the other direction can remain open.</li>
        <li><strong>RST</strong> resets a connection or rejects an attempt in the applicable state.</li>
        <li><strong>PSH</strong> is a transport hint; it does not mean “run this command immediately.”</li>
        <li><strong>URG</strong> marks the urgent-pointer field as significant and is uncommon in ordinary modern application traffic.</li>
        <li><strong>ECE</strong> and <strong>CWR</strong> participate in Explicit Congestion Notification behavior.</li>
      </ul>
      <p>
        A reset often means no listener accepted a connection attempt, but it can also come from a firewall,
        proxy, load balancer, or service policy. A FIN is not equivalent to a reset: FIN supports orderly
        half-close behavior, where one side has finished sending but can still receive data.
      </p>

      <h2>Closing a TCP connection</h2>
      <p>
        Each direction of a TCP stream closes independently. When a client has finished sending, it can send
        FIN. The server acknowledges that end of the client stream and may continue sending its own data.
        Later the server sends FIN and the client acknowledges it. This is often drawn as four packets, but
        acknowledgments can be combined with data or other control flags, so real captures do not always
        show the neat textbook pattern. Applications should still read until the protocol indicates the
        response is complete or the peer closes its sending direction.
      </p>
      <CodeBlock label="A common orderly close">{'Client                                      Server\n  | ---- FIN ------------------------------> |\n  | <--- ACK ------------------------------- |\n  | <--- FIN ------------------------------- |\n  | ---- ACK ------------------------------> |\n\nFIN closes one sending direction. The other direction may continue briefly.'}</CodeBlock>
      <p>
        RST aborts a connection rather than closing it through the normal FIN exchange. Packet captures may
        show resets after an application error, a listener disappearing, an explicit policy decision, or
        state expiring in a middlebox. Determine which endpoint sent the reset and correlate it with the
        rest of the flow before diagnosing its cause.
      </p>

      <h2>UDP is a message-oriented datagram service</h2>
      <p>
        UDP places source and destination ports, message length, and a checksum in a small header. It does
        not establish a transport connection, retransmit lost datagrams, reorder them, or negotiate a
        receiver window. Each UDP send is a datagram, so application message boundaries are preserved.
        The application may add its own acknowledgments, retries, ordering, authentication, encryption, or
        congestion handling when it needs them.
      </p>
      <p>
        “Connectionless” does not mean that an application cannot keep state. A DNS resolver tracks queries;
        a video call maintains a session; a game may associate datagrams with a player. That state belongs
        to the application or a higher protocol, rather than a TCP-style handshake in UDP itself. UDP can
        be useful where low delay matters, where messages are naturally independent, or where a higher
        protocol implements the required reliability.
      </p>
      <p>
        QUIC is a modern example of the last case. It runs over UDP but implements encrypted connection
        establishment, reliable streams, loss recovery, and congestion control in the QUIC protocol.
        HTTP/3 uses QUIC. Therefore, seeing UDP does not mean the application has no reliability or
        encryption; identify the protocol above the transport before drawing that conclusion.
      </p>
      <p>
        UDP is not inherently faster in every application. Avoiding a transport handshake can reduce setup
        delay, but loss, retries, congestion, application design, and network conditions determine real
        performance. An application that adds reliable delivery on top of UDP must implement those details
        correctly.
      </p>

      <h2>What a network scanner can infer</h2>
      <p>
        A port scanner sends carefully selected probes and classifies the responses. Its state describes
        what the scanner observed from its location at that time. Firewalls, packet loss, rate limits,
        NAT, proxies, host behavior, and routing can all affect the result. A scan does not reveal a
        timeless property of a port or prove the software's security.
      </p>
      <ul>
        <li><strong>open</strong>: the scanner received evidence that an application is accepting or answering on the port.</li>
        <li><strong>closed</strong>: the host was reachable and indicated that no application was listening for that probe.</li>
        <li><strong>filtered</strong>: filtering or lack of response prevented Nmap from deciding whether the port was open.</li>
        <li><strong>unfiltered</strong>: an ACK probe reached the host, but that scan type cannot determine whether the port is open or closed.</li>
        <li><strong>open|filtered</strong>: Nmap cannot distinguish an open service from a filter that silently discards the probe; common with UDP and some flag scans.</li>
        <li><strong>closed|filtered</strong>: a particular scan result leaves closed and filtered indistinguishable.</li>
      </ul>
      <p>
        A UDP application may reply with an application-level datagram, which is strong evidence of an open
        service. An ICMP port-unreachable response usually indicates closed. Silence is inconclusive: an
        open service may ignore an empty or malformed probe, a firewall may drop it, or a packet may have
        been lost. Nmap can send protocol-aware probes for common UDP services, but an inconclusive result
        remains inconclusive.
      </p>

      <h2>SYN scan and ACK scan: accurate interpretations</h2>
      <p>
        A TCP SYN scan sends an initial SYN. A SYN-ACK is normally classified as open; a reset is normally
        classified as closed; no useful response or an ICMP administrative-prohibited error can lead to a
        filtered classification. Nmap generally does not complete the TCP handshake when using a SYN scan,
        but that does not make the scan invisible or inherently quiet. Firewalls, intrusion detection,
        endpoint telemetry, and service logs may record probes or unusual connection attempts. Use scans
        only against systems you own or have explicit authorization to assess.
      </p>
      <p>
        An ACK scan sends an ACK probe to study filtering behavior. It classifies ports as filtered or
        unfiltered; it does <strong>not</strong> discover which ports are open. Its output alone cannot prove
        that a firewall is stateful or stateless. Network position, firewall rules, host stack behavior, and
        other evidence must be considered together.
      </p>
      <p>
        FIN, NULL, and Xmas scans rely on standards-based expectations about how some TCP stacks respond to
        unusual flag combinations. Operating systems and middleboxes differ, and modern filtering often
        makes results ambiguous. They are not dependable ways to bypass a firewall. A result that differs
        from a SYN scan is a clue to investigate, not a reliable security conclusion.
      </p>

      <h2>Practice only in an authorized lab</h2>
      <p>
        The commands below illustrate what a learner can compare against the designated DarkWorld lab
        target. Replace the example address with the target assigned by that lab. Do not run active scans
        against public systems or networks without explicit authorization. Keep the scan narrow so the
        result answers a specific question.
      </p>
      <CodeBlock label="Nmap examples for the assigned lab target">{'sudo nmap -sS -p 22,80,443 10.10.10.5\nsudo nmap -sT -p 22,80,443 10.10.10.5\nsudo nmap -sA -p 22,443 10.10.10.5\nsudo nmap -sU --top-ports 20 10.10.10.5'}</CodeBlock>
      <p>
        Compare SYN and connect scans from the same lab network, then inspect the same traffic in Wireshark.
        Record the source and destination tuple, TCP flags, response type, elapsed time, and any packets
        retransmitted. For UDP, record whether there was an application response, an ICMP error, or no
        response. The last observation should be labeled unknown or ambiguous unless additional evidence
        resolves it.
      </p>

      <h2>Denial-of-service relevance and defenses</h2>
      <p>
        A server normally reserves some resources while a TCP connection is being established. A SYN flood
        attempts to consume those resources by sending many SYNs without completing handshakes. The impact
        depends on backlog sizing, operating-system behavior, traffic filtering, load balancing, and the
        server's capacity. SYN cookies are one mitigation: a server can encode enough handshake state into
        its SYN-ACK sequence number to avoid allocating ordinary connection state immediately, then validate
        the final ACK. They are not a complete DDoS solution and do not replace upstream filtering,
        capacity planning, monitoring, and a response plan.
      </p>
      <p>
        In a defensive packet review, look for rates and patterns rather than treating one incomplete
        handshake as an attack. Compare SYNs, completed handshakes, retransmissions, resets, source
        diversity, destination ports, load-balancer health, and application impact. Spoofed source addresses
        are possible, so a source address in a packet is not by itself reliable attribution.
      </p>

      <h2>Check your understanding</h2>
      <ol>
        <li>
          Does a TCP handshake encrypt application data? <strong>No.</strong> TLS or another application
          protocol must provide encryption and identity verification.
        </li>
        <li>
          Can TCP guarantee that a message will eventually arrive? <strong>No.</strong> It provides
          retransmission and ordered delivery while the connection works, and reports failures when it
          cannot continue.
        </li>
        <li>
          Does UDP mean that an application has no connection state? <strong>No.</strong> The application
          can maintain state or use another protocol such as QUIC over UDP.
        </li>
        <li>
          Does an ACK scan tell you that a port is open? <strong>No.</strong> It reports filtered or
          unfiltered for that probe and cannot identify open ports.
        </li>
        <li>
          Does no response to a UDP probe prove the service is closed? <strong>No.</strong> The result can
          be open|filtered because the service may not answer that probe or a filter may have dropped it.
        </li>
      </ol>

      <h2>Key takeaways</h2>
      <p>
        TCP provides a reliable ordered byte stream through sequence numbers, acknowledgments,
        retransmission, flow control, and congestion control. UDP preserves datagram boundaries while
        leaving reliability and session behavior to the application or a protocol above it. Scanner states
        describe evidence from a particular vantage point; ACK scans do not identify open ports, and silence
        is especially ambiguous for UDP. Read packet context and authorize every active scan.
      </p>

      <h2>Primary references</h2>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc9293" target="_blank" rel="noreferrer">RFC 9293: Transmission Control Protocol</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc768" target="_blank" rel="noreferrer">RFC 768: User Datagram Protocol</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc9000" target="_blank" rel="noreferrer">RFC 9000: QUIC Transport Protocol</a></li>
        <li><a href="https://nmap.org/book/man-port-scanning-basics.html" target="_blank" rel="noreferrer">Nmap Network Scanning: Port Scanning Basics</a></li>
        <li><a href="https://nmap.org/book/man-port-scanning-techniques.html" target="_blank" rel="noreferrer">Nmap Network Scanning: Port Scanning Techniques</a></li>
      </ul>
    </div>
  );
}
