import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function OsiTcpIp() {
  return (
    <div className="prose-hh">
      <h1>How Networks Actually Work: OSI &amp; TCP/IP</h1>
      <p>
        Network security problems are easier to diagnose when you know which part of communication is
        failing. A name may resolve correctly while a route is missing; a host may be reachable while an
        application rejects a request. The OSI and TCP/IP models are maps for separating those questions,
        not a claim that every modern protocol fits into one perfect box.
      </p>

      <h2>The OSI Model (7 layers)</h2>
      <p>The OSI model is a conceptual map. You won't run "layer 4" as a command, but you will constantly
      reason in these terms ("that's an L7 issue", "this is failing at L3").</p>
      <ul>
        <li><strong>Layer 7 — Application</strong>: HTTP, DNS, FTP, SSH. The protocols tools actually speak.</li>
        <li><strong>Layer 6 — Presentation</strong>: Encoding/encryption (TLS lives roughly here/L4-L7 in practice).</li>
        <li><strong>Layer 5 — Session</strong>: Establishing/maintaining a conversation between two hosts.</li>
        <li><strong>Layer 4 — Transport</strong>: TCP and UDP use ports to deliver data to processes. TCP provides ordered reliable delivery; UDP itself does not.</li>
        <li><strong>Layer 3 — Network</strong>: IP addressing and routing. "How do I get from A to B."</li>
        <li><strong>Layer 2 — Data Link</strong>: MAC addresses, switches, ARP. Local segment delivery.</li>
        <li><strong>Layer 1 — Physical</strong>: Cables, radio, voltage. The actual bits on the wire.</li>
      </ul>

      <h2>TCP/IP: the model that actually runs the internet</h2>
      <p>
        In practice, engineers use the simpler 4-layer TCP/IP model, which maps roughly onto OSI:
      </p>
      <ul>
        <li><strong>Application</strong> (OSI 5-7): HTTP, DNS, SSH, FTP, SMB</li>
        <li><strong>Transport</strong> (OSI 4): TCP, UDP</li>
        <li><strong>Internet</strong> (OSI 3): IP, ICMP, routing</li>
        <li><strong>Link</strong> (OSI 1-2): Ethernet, Wi-Fi, MAC addressing</li>
      </ul>
      <p>
        Analysts often start at the application layer by asking what action was requested, then check
        transport ports, IP routes, and local-link behavior when evidence points lower in the stack. The
        model prevents category mistakes: a DNS answer does not prove an HTTP response, and an open TCP
        port does not prove that the application will authorize a particular user.
      </p>

      <h2>Every layer, one real command each</h2>
      <p>
        These Linux commands inspect local configuration or make one ordinary request to a reserved
        example domain. They do not scan a range:
      </p>
      <CodeBlock label="inspect link, route, sockets, name resolution, and HTTP">{`ip neigh                       # L2 — cached IP-to-link-address entries
ip route                       # L3 — selected routes and default gateway
ss -tulpn                      # L4 — local TCP/UDP listeners; process names may need privileges
getent ahosts example.com      # resolver answer on this Linux system
curl -sSI https://example.com  # L7 — one HTTP response through TLS`}</CodeBlock>
      <p>
        Notice how each command operates on a completely different kind of address: MAC address (L2), IP
        address (L3), port number (L4), and a URL/hostname (L7). Confusing which layer a problem lives at
        is the single most common beginner debugging mistake — "the website won't load" could be a DNS
        failure (L7), a firewall dropping the port (L4), no route to the host (L3), or a cable/Wi-Fi issue
        (L1/L2), and each has a completely different fix.
      </p>

      <h3>MTU and fragmentation, briefly</h3>
      <p>
        Each link has a maximum frame size called its MTU; 1500 bytes is common for Ethernet, though
        tunnels and other links can change the effective path MTU. IPv4 routers may fragment packets when
        allowed by the packet flags. IPv6 routers do not fragment in transit: the sending host handles
        fragmentation, and a router that cannot forward a packet sends an ICMPv6 Packet Too Big message.
        Firewalls and sensors must handle fragments consistently; fragments may also be dropped or delayed,
        so fragmentation is not a reliable way to make a connection work. In authorized testing, avoid
        fragmentation tricks unless the engagement explicitly calls for them and the network owner has
        approved the test.
      </p>

      <h2>Encapsulation: what actually happens to your data</h2>
      <p>
        For HTTP/1.1 or HTTP/2 over TCP, application bytes are carried in TCP segments, inside IP packets,
        inside link-layer frames. At each routed hop, the link-layer frame is replaced for the next link;
        the IP endpoints generally remain the same unless a device performs address translation. The
        destination host processes those layers to deliver bytes to the application. TLS encrypts HTTP
        content, so a passive capture normally cannot show its path or body without endpoint keys or other
        authorized visibility.
      </p>
      <CodeBlock label="conceptual packet structure">{`[ Ethernet Header | IP Header | TCP Header | HTTP Data ]
     L2 (MAC)        L3 (IP)     L4 (Port)     L7 (App)`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Troubleshoot from the lowest relevant layer upward: is the interface connected, is there a route,
          does the destination transport endpoint respond, and does the application return the expected
          protocol response? A failed ping does not prove a web service is down because networks may filter
          ICMP while allowing TCP. Use the protocol-specific evidence that matches the question.
        </p>
      </Callout>

      <h2>Use layers to locate a failure and understand security evidence</h2>
      <p>
        Many failures and controls can be described by the layer where their evidence appears:
      </p>
      <ul>
        <li><strong>Link layer</strong>: switch-port policy, neighbor discovery, and local-segment visibility.</li>
        <li><strong>IP layer</strong>: route selection, address filtering, and network segmentation.</li>
        <li><strong>Transport layer</strong>: permitted TCP/UDP endpoints, stateful filtering, and connection behavior.</li>
        <li><strong>Application layer</strong>: request validation, authentication, authorization, and safe data handling.</li>
      </ul>
      <p>
        This layer mapping is also exactly how packet analysis tools like tcpdump and Wireshark present
        traffic to you — every capture you'll take in this course shows nested layer headers, which we
        cover hands-on once you've got DNS and HTTP under your belt in lesson 5.
      </p>
      <Callout variant="info">
        <p>
          An authorized inventory probe depends on routing at L3, the selected transport at L4, and
          sometimes application-aware probes. Its service and version labels are fingerprints, not
          guaranteed truths. Confirm the actual service and configuration before claiming a vulnerability.
        </p>
      </Callout>
      <h3>Modern example: QUIC and HTTP/3</h3>
      <p>
        QUIC is a standardized transport protocol carried in UDP datagrams. It provides streams, loss
        recovery, congestion control, connection migration, and TLS-based protection. HTTP/3 uses QUIC,
        while HTTP/2 commonly uses TCP with TLS. A service may accept both TCP and UDP on port 443, so a
        TCP-only observation does not establish whether HTTP/3 is available. UDP probes can also receive
        no answer even when a service exists; interpret results using the protocol behavior and authorized
        vantage point.
      </p>

      <p>
        In the next lesson we'll get concrete about Layer 3 — IP addressing and subnetting — because you
        cannot scope a network, plan lateral movement, or read a <code>nmap</code> output confidently
        without it.
      </p>
      <p>
        Standards references: <a href="https://www.rfc-editor.org/rfc/rfc8200.html" target="_blank" rel="noreferrer">RFC 8200, IPv6</a> and <a href="https://www.rfc-editor.org/rfc/rfc9000.html" target="_blank" rel="noreferrer">RFC 9000, QUIC</a>.
      </p>
    </div>
  );
}
