import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PortsServices() {
  return (
    <div className="prose-hh">
      <h1>Ports, Services, and Protocols You Must Know Cold</h1>
      <p>
        You need these memorized the way a mechanic knows engine parts by sight. When nmap shows you a
        port number, you should instantly know what's probably running, what a foothold there looks like,
        and where to look first.
      </p>

      <h2>The essential port list</h2>
      <CodeBlock label="ports every pentester knows on sight">{`21    FTP          File transfer — check for anonymous login
22    SSH          Remote shell — check for weak/reused creds, key auth
23    Telnet       Unencrypted remote shell — instant red flag if found
25    SMTP         Mail transfer — user enumeration via VRFY/EXPN
53    DNS          Name resolution — zone transfers (AXFR) leak infrastructure
80    HTTP         Web — the biggest attack surface on most engagements
110   POP3         Mail retrieval
111   RPCbind      Maps RPC services — often a pivot to NFS
135   MSRPC        Windows RPC endpoint mapper
139   NetBIOS      Legacy Windows file sharing
143   IMAP         Mail retrieval
389   LDAP         Directory services — AD enumeration goldmine
443   HTTPS        Encrypted web — same attack surface as 80, wrapped in TLS
445   SMB          Windows file sharing — EternalBlue, share enumeration, relay attacks
3306  MySQL        Database — default/weak creds, UDFs for RCE
3389  RDP          Windows remote desktop — brute force, BlueKeep-class bugs
5432  PostgreSQL   Database
5985  WinRM        Windows remote management (HTTP)
6379  Redis        Often unauthenticated — write to disk for RCE
8080  HTTP-alt     Common alternate web port, proxies, admin panels`}</CodeBlock>

      <h2>Why "port = protocol" is a dangerous assumption</h2>
      <p>
        Port numbers are a convention, not a law. A service can listen on any port — a web server on 4444,
        SSH on 2222. This is exactly why nmap's <code>-sV</code> (version detection) exists: it doesn't
        trust the port number, it sends protocol-specific probes and reads the actual response to identify
        what's really there.
      </p>
      <CodeBlock>{`nmap -sV -p- 10.10.10.5              # scan ALL 65535 ports, then fingerprint whatever answers
nmap -sV --version-intensity 9 -p8443 10.10.10.5   # throw every probe nmap has at one weird port`}</CodeBlock>
      <p>
        The <code>--version-intensity</code> scale runs 0-9: lower numbers only try the probes most likely
        to match common services (faster, quieter); 9 throws every signature in nmap's probe database at
        the port (slower, thorough) — reach for it specifically on unusual, non-standard ports where the
        default guess comes back empty or wrong.
      </p>

      <Callout variant="tip">
        <p>
          Build the habit: whenever you see an open port, ask three questions. (1) What's the service and
          version? (2) Are there known CVEs for that exact version? (3) Does it accept anonymous/default/
          weak credentials? Most real-world footholds come from question 3, not zero-days.
        </p>
      </Callout>

      <h2>Well-known vs. registered vs. dynamic</h2>
      <ul>
        <li><strong>0–1023</strong>: Well-known ports (require root to bind on Linux) — SSH, HTTP, DNS live here.</li>
        <li><strong>1024–49151</strong>: Registered ports — MySQL (3306), RDP (3389).</li>
        <li><strong>49152–65535</strong>: Dynamic/ephemeral — your OS picks these for outbound connections.</li>
      </ul>

      <h2>Banner grabbing</h2>
      <p>
        Many services announce their version voluntarily the moment you connect — this is a "banner."
      </p>
      <CodeBlock label="conceptual — you'll practice this live in the labs">{`nc 10.10.10.5 22
SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.10`}</CodeBlock>
      <p>
        That single line tells you the OS family, distro, and exact OpenSSH version — often enough to
        search for a matching public exploit. Enumeration is largely the disciplined collection of details
        like this, which we build into a full methodology in Module 3.
      </p>
      <p>
        Not every service volunteers a banner over plain TCP — TLS-wrapped services (HTTPS, and anything
        else layered on TLS) need the handshake completed first before you can see anything meaningful:
      </p>
      <CodeBlock label="banner grabbing through TLS">{`openssl s_client -connect 10.10.10.5:443 -quiet
# completes the TLS handshake, then drops you into a raw stream —
# type "GET / HTTP/1.0" and press enter twice to see the HTTP response and headers`}</CodeBlock>

      <h2>UDP services deserve equal attention</h2>
      <p>
        Because TCP dominates most checklists, UDP services get skipped far too often — and they leak just
        as much. SNMP with a default community string of <code>public</code> can dump an entire device's
        configuration; DNS (UDP/53) reveals infrastructure through zone transfers; NTP (UDP/123) can even be
        abused for reflection/amplification DDoS. Always run a UDP sweep on the top ports even under time
        pressure:
      </p>
      <CodeBlock>{`nmap -sU --top-ports 20 10.10.10.5     # a fast, targeted UDP pass instead of skipping UDP entirely`}</CodeBlock>
    </div>
  );
}
