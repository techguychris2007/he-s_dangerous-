import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function OsiTcpIp() {
  return (
    <div className="prose-hh">
      <h1>How Networks Actually Work: OSI &amp; TCP/IP</h1>
      <p>
        Every attack you will ever run — a port scan, a reverse shell, a man-in-the-middle — is just
        traffic moving through layers of abstraction. If you don't understand the layers, you're
        memorizing commands instead of understanding what they do. This lesson builds the mental model
        everything else in this course sits on top of.
      </p>

      <h2>The OSI Model (7 layers)</h2>
      <p>The OSI model is a conceptual map. You won't run "layer 4" as a command, but you will constantly
      reason in these terms ("that's an L7 issue", "this is failing at L3").</p>
      <ul>
        <li><strong>Layer 7 — Application</strong>: HTTP, DNS, FTP, SSH. The protocols tools actually speak.</li>
        <li><strong>Layer 6 — Presentation</strong>: Encoding/encryption (TLS lives roughly here/L4-L7 in practice).</li>
        <li><strong>Layer 5 — Session</strong>: Establishing/maintaining a conversation between two hosts.</li>
        <li><strong>Layer 4 — Transport</strong>: TCP and UDP. Ports live here. Reliability lives here.</li>
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
        As a pentester, you live mostly at the Application and Transport layers day-to-day — that's where
        nmap, curl, ssh, and every exploit you'll write operates — but privilege comes from understanding
        what's happening underneath (ARP spoofing, IP spoofing, routing attacks all live lower down).
      </p>

      <h2>Every layer, one real command each</h2>
      <p>
        The fastest way to make the model concrete is to run one command per layer against your own
        machine and read the output through that layer's lens:
      </p>
      <CodeBlock label="one command per layer">{`arp -a                     # L2 — the MAC addresses your machine has resolved on the local segment
ip route                    # L3 — how your machine decides where to send a packet (gateway, interface)
ss -tulpn                    # L4 — which local ports are open and which process owns them
curl -sI https://example.com  # L7 — an actual application-layer request/response`}</CodeBlock>
      <p>
        Notice how each command operates on a completely different kind of address: MAC address (L2), IP
        address (L3), port number (L4), and a URL/hostname (L7). Confusing which layer a problem lives at
        is the single most common beginner debugging mistake — "the website won't load" could be a DNS
        failure (L7), a firewall dropping the port (L4), no route to the host (L3), or a cable/Wi-Fi issue
        (L1/L2), and each has a completely different fix.
      </p>

      <h3>MTU and fragmentation, briefly</h3>
      <p>
        Every link layer has a Maximum Transmission Unit (MTU) — Ethernet's default is 1500 bytes. If a
        packet is larger than the MTU of a link it needs to cross, it gets fragmented (IPv4) or rejected
        with an ICMP "packet too big" message (IPv6, which doesn't allow in-transit fragmentation). This
        matters offensively: nmap's <code>-f</code> fragmentation flag deliberately splits packets across
        multiple IP fragments specifically to slip past simplistic packet-inspection firewalls that only
        look at the first fragment.
      </p>

      <h2>Encapsulation: what actually happens to your data</h2>
      <p>
        When you run <code>curl http://10.10.10.5</code>, your HTTP request gets wrapped (encapsulated) in
        a TCP segment, which gets wrapped in an IP packet, which gets wrapped in an Ethernet frame. Each
        layer adds a header. The receiving host un-wraps it in reverse. This is why a packet capture
        (Wireshark/tcpdump) shows you nested headers — Ethernet → IP → TCP → HTTP, outside in.
      </p>
      <CodeBlock label="conceptual packet structure">{`[ Ethernet Header | IP Header | TCP Header | HTTP Data ]
     L2 (MAC)        L3 (IP)     L4 (Port)     L7 (App)`}</CodeBlock>

      <Callout variant="tip">
        <p>
          When you troubleshoot "why won't this exploit connect," work the stack bottom-up: Is there
          physical/link connectivity (are you even on the network)? Is there routing (can you ping the
          IP)? Is the port open (L4)? Is the service actually responding correctly (L7)? This is the same
          methodology whether you're debugging code or attacking a box.
        </p>
      </Callout>

      <h2>Why this matters for offensive work</h2>
      <p>
        Almost every category of attack maps to a layer:
      </p>
      <ul>
        <li><strong>L2 attacks</strong>: ARP spoofing/poisoning (tools: <code>arpspoof</code>, Ettercap,
        bettercap), MAC flooding, VLAN hopping.</li>
        <li><strong>L3 attacks</strong>: IP spoofing, ICMP tunneling, routing manipulation.</li>
        <li><strong>L4 attacks</strong>: Port scanning (nmap, masscan), SYN floods, TCP session hijacking.</li>
        <li><strong>L7 attacks</strong>: SQL injection, XSS, auth bypass, command injection — most of the
        web app hacking you'll do lives here.</li>
      </ul>
      <p>
        This layer mapping is also exactly how packet analysis tools like tcpdump and Wireshark present
        traffic to you — every capture you'll take in this course shows nested layer headers, which we
        cover hands-on once you've got DNS and HTTP under your belt in lesson 5.
      </p>
      <Callout variant="info">
        <p>
          A quick sanity check that ties the whole model together: when you run <code>nmap -sV target</code>,
          nmap uses L3 (IP) to reach the host, L4 (TCP/UDP) to find open ports, and then L7 (sending real
          protocol probes and reading the response) to identify the exact service and version. One command,
          three layers, three completely different techniques working together.
        </p>
      </Callout>
      <h3>When the model itself gets blurry: QUIC and HTTP/3</h3>
      <p>
        The clean "L4 is transport, L7 is application" split gets genuinely muddy with QUIC, the transport
        protocol underneath HTTP/3. QUIC runs over UDP rather than TCP, but implements its own reliability,
        ordering, and congestion control INSIDE that UDP stream — reliability logic that used to live
        squarely at L4 now runs partly inside what the OSI model would call an application-layer payload.
        Practically: a plain <code>nmap -sS</code> SYN scan tells you nothing about an HTTP/3 service, since
        there's no TCP handshake to see at all — you'd need a UDP-aware probe that understands QUIC's own
        handshake to even confirm it's there.
      </p>

      <p>
        In the next lesson we'll get concrete about Layer 3 — IP addressing and subnetting — because you
        cannot scope a network, plan lateral movement, or read a <code>nmap</code> output confidently
        without it.
      </p>
    </div>
  );
}
