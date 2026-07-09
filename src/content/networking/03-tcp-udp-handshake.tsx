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
      </p>
    </div>
  );
}
