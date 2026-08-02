import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PacketSniffing() {
  return (
    <div className="prose-hh">
      <h1>Building a Simple Network Sniffer &amp; Packet Parser</h1>
      <p>
        Everything so far has been about sending crafted traffic — a scanner probing ports, a brute-forcer
        posting login attempts. This lesson flips the direction: reading raw traffic straight off the wire
        and pulling structured fields (source/destination IPs, ports, protocol) out of bytes that have no
        built-in Python representation at all. This is the classic <em>Black Hat Python</em> raw-socket
        chapter, and the foundation every real packet-capture tool (tcpdump, Wireshark, scapy itself) builds
        on internally.
      </p>

      <h2>Why sniffing matters offensively</h2>
      <p>
        A packet sniffer is how an attacker on the same network segment (or with a man-in-the-middle
        position) sees traffic that was never addressed to them at all. Any protocol that isn't encrypted —
        HTTP Basic Auth, plain FTP, Telnet, unencrypted SMTP — puts credentials and data directly on the
        wire in cleartext, readable by anyone capturing that segment's traffic. This is the concrete,
        practical reason "just use HTTPS everywhere" is such a strongly enforced modern default: it isn't
        theoretical, it's exactly what a sniffer like the one built in this lesson would otherwise read in
        plain text.
      </p>

      <h2>A minimal raw-socket sniffer</h2>
      <p>
        On Linux, a raw socket bypasses the normal TCP/UDP socket abstraction and hands you every byte of
        every packet that crosses the interface, starting from the IP header itself:
      </p>
      <CodeBlock label="raw_sniffer.py — capturing raw IP packets">{`import socket

# AF_INET + SOCK_RAW + IPPROTO_TCP: capture raw IP packets carrying TCP, headers and all.
# Requires root — reading raw traffic off the wire is a privileged operation by design.
sniffer = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
sniffer.bind(("0.0.0.0", 0))
sniffer.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)

while True:
    raw_packet = sniffer.recvfrom(65535)[0]
    print(f"Captured {len(raw_packet)} bytes")`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Raw sockets require root/administrator privileges precisely because reading traffic that isn't
          addressed to your own process is a meaningful capability — the OS won't hand it to an unprivileged
          program.
        </p>
      </Callout>

      <h2>Parsing the IP header by hand with struct</h2>
      <p>
        <code>raw_packet</code> above is just bytes — Python has no built-in concept of "an IP header." The{' '}
        <code>struct</code> module is how you tell Python to interpret a fixed sequence of bytes as specific
        field widths and types, exactly matching the real IPv4 header layout defined in RFC 791:
      </p>
      <CodeBlock label="parsing the first 20 bytes as an IPv4 header">{`import struct
import socket

def parse_ip_header(raw_packet):
    ip_header = raw_packet[:20]
    # '!' = network byte order (big-endian). Field widths below match RFC 791's IPv4 header exactly:
    # B=1 byte (version+IHL), B=1 byte (ToS), H=2 bytes (total length), ... 4s=4-byte src/dst addresses
    fields = struct.unpack("!BBHHHBBH4s4s", ip_header)
    version_ihl = fields[0]
    ttl = fields[5]
    protocol = fields[6]
    src_addr = socket.inet_ntoa(fields[8])
    dst_addr = socket.inet_ntoa(fields[9])
    return {
        "version": version_ihl >> 4,
        "ttl": ttl,
        "protocol": protocol,   # 6 = TCP, 17 = UDP, 1 = ICMP
        "src": src_addr,
        "dst": dst_addr,
    }`}</CodeBlock>
      <p>
        <code>socket.inet_ntoa()</code> is doing real work here: the raw address fields are 4 packed bytes
        (e.g. <code>b"\\x0a\\x0a\\x0a\\x05"</code>), not a human-readable string — <code>inet_ntoa</code> is
        what converts those 4 bytes into the familiar dotted-quad form ("10.10.10.5") you'd actually want to
        print or match against.
      </p>

      <h2>The same capture, in scapy</h2>
      <p>
        Manually unpacking every protocol's header by hand is exactly the tedious, error-prone work{' '}
        <strong>scapy</strong> exists to eliminate — it parses Ethernet, IP, TCP, UDP, DNS, and dozens of
        other protocols into real Python objects with named attributes, and works identically across
        platforms (the raw-socket code above is Linux-specific).
      </p>
      <CodeBlock label="the same sniffer, in scapy">{`from scapy.all import sniff, IP, TCP

def handle_packet(packet):
    if packet.haslayer(IP) and packet.haslayer(TCP):
        print(f"{packet[IP].src}:{packet[TCP].sport} -> {packet[IP].dst}:{packet[TCP].dport}")

sniff(filter="tcp", prn=handle_packet, count=20)`}</CodeBlock>
      <p>
        <code>packet.haslayer(IP)</code> and <code>packet[IP].src</code> read almost like plain English
        specifically because scapy has already done the struct-unpacking work shown above internally — this
        is the same relationship pwntools has to raw sockets in the previous lesson: understand the
        low-level mechanism first, then reach for the library that wraps it once you're doing real work.
      </p>

      <h2>A concrete example: catching HTTP Basic Auth in cleartext</h2>
      <p>
        HTTP Basic Auth sends credentials as a base64-encoded (not encrypted — base64 is trivially reversed)
        string in the <code>Authorization</code> header. Over plain HTTP, a sniffer on the same segment
        reads it directly:
      </p>
      <CodeBlock label="catching Basic Auth credentials in flight">{`from scapy.all import sniff, TCP, Raw
import base64

def handle_packet(packet):
    if packet.haslayer(Raw) and packet.haslayer(TCP) and packet[TCP].dport == 80:
        payload = packet[Raw].load
        if b"Authorization: Basic" in payload:
            encoded = payload.split(b"Basic ")[1].split(b"\\r\\n")[0]
            print(f"[+] Captured credentials: {base64.b64decode(encoded).decode()}")

sniff(filter="tcp port 80", prn=handle_packet)`}</CodeBlock>
      <p>
        <code>base64.b64decode()</code> instantly reverses the encoding — this is exactly why Basic Auth
        over plain HTTP is treated as equivalent to sending a password in cleartext, and why HTTPS
        (encrypting the whole connection, not just the credential) is the actual fix, not a "stronger"
        encoding scheme.
      </p>

      <Callout variant="danger">
        <p>
          Packet sniffing captures traffic from every device on the segment you're listening on, not just
          your own — running any sniffer against a network you don't own or have explicit written
          authorization to test is unauthorized interception, a serious offense in most jurisdictions.
          Practice against your own lab VMs, a dedicated home lab segment, or the interactive labs on this
          platform only.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the full Python offensive-tooling foundation this course builds on: sockets and
        scanning, HTTP automation and recon at scale, brute-forcers and exploit PoC skeletons, and now raw
        packet capture and parsing — the same toolkit <em>Black Hat Python</em> itself teaches, and the
        exact skillset behind most of the custom tooling referenced throughout the Web Application Hacking
        and Bug Bounty modules ahead.
      </p>
    </div>
  );
}
