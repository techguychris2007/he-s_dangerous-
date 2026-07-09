import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function TcpUdpHandshake() {
  return (
    <div className="prose-hh">
      <h1>TCP, UDP, and the Three-Way Handshake</h1>
      <p>
        Nmap's entire scanning strategy is built on how TCP and UDP behave differently. If you understand
        the handshake, scan output stops being magic and starts being obvious.
      </p>

      <h2>TCP: reliable, connection-oriented</h2>
      <p>
        TCP guarantees delivery and ordering. Before any data flows, both sides perform a
        <strong> three-way handshake</strong>:
      </p>
      <CodeBlock label="TCP three-way handshake">{`Client                          Server
  |------ SYN (seq=x) ---------->|   "I want to connect"
  |<--- SYN-ACK (seq=y,ack=x+1) -|   "OK, here's my sequence number"
  |------ ACK (ack=y+1) -------->|   "Confirmed, connection open"`}</CodeBlock>
      <p>
        This is exactly what an nmap <strong>SYN scan</strong> (<code>-sS</code>) exploits: it sends the
        SYN, watches for SYN-ACK (port open) or RST (port closed), and never completes the handshake —
        making it faster and quieter than a full connect scan.
      </p>

      <h2>TCP flags: the actual bits that drive every scan type</h2>
      <p>
        Every TCP segment carries a set of control flags in its header. Nmap's various scan modes are
        really just different combinations of these flags sent deliberately:
      </p>
      <CodeBlock label="the flags you'll see referenced constantly">{`SYN   synchronize — "start a connection" / initiates the handshake
ACK   acknowledge — "I received your last segment"
FIN   finish — graceful "I'm done sending" close request
RST   reset — abrupt "this port/connection doesn't exist, stop"
PSH   push — "deliver this data to the application immediately, don't buffer it"
URG   urgent — marks data that should be processed out of band (rarely used today)`}</CodeBlock>
      <p>
        Reading these directly explains scan behavior: a SYN scan (<code>-sS</code>) sends only SYN; an ACK
        scan (<code>-sA</code>) sends only ACK (useful for mapping stateful firewall rules, since a
        stateless firewall will let an ACK through where it would have blocked a SYN); a "Xmas scan"
        (<code>-sX</code>) sets FIN, PSH, and URG all at once — an unusual combination that closed ports
        answer with RST but many firewalls/older stacks handle inconsistently, which is exactly the
        ambiguity that scan type is trying to exploit.
      </p>
      <p>
        TCP also tracks a <strong>sequence number</strong> (byte-ordering, so out-of-order segments can be
        reassembled correctly) and a <strong>window size</strong> (how many unacknowledged bytes the sender
        is allowed to have in flight — this is how TCP does flow control without a fixed rate limit). When
        a segment is lost, the receiver's missing ACK triggers retransmission after a timeout — this
        retry behavior is part of why lossy or filtered connections feel "slow" rather than simply broken.
      </p>

      <h2>UDP: fast, connectionless, no guarantees</h2>
      <p>
        UDP just sends datagrams with no handshake, no acknowledgment, no ordering guarantee. This makes it
        fast (DNS, DHCP, streaming, VoIP use it) but miserable to scan — there's no SYN-ACK to detect. Nmap
        has to send a probe and either see a response (open) or an ICMP "port unreachable" (closed);
        silence is ambiguous (open OR filtered). This is why UDP scans are slow and less reliable than TCP
        scans.
      </p>

      <h2>Port states nmap reports</h2>
      <ul>
        <li><strong>open</strong> — an application is actively accepting connections</li>
        <li><strong>closed</strong> — reachable, but nothing is listening</li>
        <li><strong>filtered</strong> — a firewall is dropping/blocking probes, no reply at all</li>
        <li><strong>unfiltered</strong> — reachable, but state can't be determined (rare, seen in ACK scans)</li>
      </ul>

      <h2>Connection teardown</h2>
      <p>
        TCP closes gracefully with a FIN/ACK exchange from each side (four-way close), or abruptly with a
        RST. You'll see RST constantly in scan traffic — it means "closed port, nobody's listening, stop
        talking to me."
      </p>
      <CodeBlock label="the graceful four-way close">{`Client                          Server
  |------ FIN ------------------>|   "I'm done sending"
  |<----- ACK --------------------|   "acknowledged"
  |<----- FIN --------------------|   "I'm done too"
  |------ ACK ------------------->|   "acknowledged, connection closed"`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Rule of thumb while enumerating: TCP services (SSH, HTTP, SMB, FTP) are where you'll spend 90% of
          your time. Don't skip UDP entirely though — SNMP (161), DNS (53), and NTP (123) are UDP services
          that regularly leak configuration and version data that TCP scans will never show you.
        </p>
      </Callout>

      <h2>Try it conceptually</h2>
      <CodeBlock label="reference — not run here, covered hands-on in Module 3">{`nmap -sS 10.10.10.5      # TCP SYN scan (needs root/admin) — the default "stealth" scan
nmap -sT 10.10.10.5      # TCP full-connect scan — completes the handshake, noisier
nmap -sU 10.10.10.5      # UDP scan — slow, but catches DNS/SNMP/NTP`}</CodeBlock>
      <p>
        You'll run real versions of these commands against a live simulated target in the Module 3 labs.
        The next lesson closes out this module by showing you how to actually <em>capture and read</em>
        this exact handshake off the wire with tcpdump and Wireshark, so the diagrams above stop being
        theory and become something you can point at in a real packet trace.
      </p>
    </div>
  );
}
