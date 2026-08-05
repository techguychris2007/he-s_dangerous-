import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ActiveScanningNmap() {
  return (
    <div className="prose-hh">
      <h1>Active Scanning with Nmap</h1>
      <p>
        Nmap is the single most important tool in this entire course. Nearly every lab from here forward
        begins with an nmap scan. This lesson gets you fluent; the lab right after this module gets your
        hands on a real (simulated) target.
      </p>

      <h2>The standard workflow</h2>
      <CodeBlock label="stage 1 — is anything alive?">{`nmap -sn 10.10.10.0/24
# ping sweep, no port scan — fast way to find live hosts in a range`}</CodeBlock>
      <CodeBlock label="stage 2 — what's open, fast">{`nmap 10.10.10.5
# default: top 1000 TCP ports, SYN scan if root`}</CodeBlock>
      <CodeBlock label="stage 3 — full depth on a confirmed target">{`nmap -sV -sC -p- -oN full-scan.txt 10.10.10.5
# -sV  version detection
# -sC  default script scan (safe NSE scripts)
# -p-  all 65535 ports, not just the top 1000
# -oN  save normal-format output to a file`}</CodeBlock>

      <h2>Scan types</h2>
      <CodeBlock>{`nmap -sS 10.10.10.5    # SYN scan (default w/ root) — fast, half-open, quieter
nmap -sT 10.10.10.5    # full TCP connect — use when you lack raw socket privileges
nmap -sU 10.10.10.5    # UDP scan — slow, but catches DNS/SNMP/NTP
nmap -sA 10.10.10.5    # ACK scan — maps firewall rules, not port state`}</CodeBlock>

      <h2>Timing &amp; evasion knobs</h2>
      <CodeBlock>{`nmap -T4 10.10.10.5           # timing template 0 (paranoid) - 5 (insane)
nmap -Pn 10.10.10.5            # skip host discovery — treat host as up (needed if ICMP is blocked)
nmap -f 10.10.10.5              # fragment packets — dodge naive packet filters
nmap --script vuln 10.10.10.5   # run the vuln-detection NSE script category`}</CodeBlock>

      <h2>Reading the output</h2>
      <CodeBlock label="what a real result looks like">{`PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.2p2 Ubuntu-4ubuntu2.10
80/tcp   open  http    Apache httpd 2.4.18
139/tcp  open  netbios-ssn Samba smbd 3.X - 4.X
445/tcp  open  netbios-ssn Samba smbd 4.3.11-Ubuntu`}</CodeBlock>
      <p>
        Every line here is a lead: OpenSSH 7.2p2 and Samba 4.3.11 are specific enough to search
        "searchsploit" or CVE databases against. This is the exact table format the in-browser lab
        terminal reproduces, so what you see here is what you'll see (and act on) hands-on.
      </p>

      <Callout variant="tip">
        <p>
          Always save scan output (<code>-oN</code>/<code>-oX</code>/<code>-oA</code>). On a real
          engagement across dozens of hosts, re-running scans because you didn't save the first one is a
          rookie mistake that costs hours.
        </p>
      </Callout>

      <h2>NSE categories: <code>--script vuln</code> is one of several</h2>
      <p>
        The Nmap Scripting Engine ships with over 600 scripts organized into categories — <code>vuln</code>{' '}
        (used above) is just the one most people learn first. Knowing the others changes what you reach for
        and when:
      </p>
      <CodeBlock label="NSE categories worth knowing by name">{`--script discovery   broader host/service info gathering beyond the default probes
--script auth        checks for default credentials and weak auth configs
--script brute        runs a brute-force attempt directly through NSE (no separate hydra call needed)
--script exploit       actively attempts to exploit a found vulnerability, not just detect it
--script safe           read-only, non-intrusive scripts — the category "safe" for production targets
--script intrusive       may crash a service or trigger real changes — never run without explicit authorization`}</CodeBlock>
      <p>
        <code>-sC</code> (used in the stage-3 workflow above) is shorthand for exactly one category:{' '}
        <code>--script default</code>, a curated subset of <code>safe</code> scripts nmap's authors judged
        useful enough to run automatically. Reaching for a named category directly (<code>--script
        auth,discovery</code>) is how you go beyond that default set deliberately, instead of hoping{' '}
        <code>-sC</code> happened to cover what you actually need.
      </p>

      <h2>When nmap is too slow: Masscan &amp; RustScan</h2>
      <p>
        Nmap's port-scan engine is thorough but stateful and comparatively slow — scanning a /8 (16 million
        hosts) with nmap is impractical. Two other tools exist specifically to solve the "huge range, fast"
        problem, and the professional workflow is to use them <em>together</em> with nmap, not instead of it.
      </p>
      <CodeBlock label="masscan — an asynchronous, internet-scale port scanner">{`masscan -p1-65535 10.0.0.0/8 --rate 100000
# masscan uses its own custom TCP/IP stack, bypassing the kernel's network stack entirely,
# which is how it can transmit hundreds of thousands of packets per second — the same
# engineering behind the original "scan the whole internet in under 6 minutes" research`}</CodeBlock>
      <CodeBlock label="rustscan — modern, fast, and designed to hand off to nmap automatically">{`rustscan -a 10.10.10.5 -- -sV -sC
# rustscan finds open ports in seconds using an adaptive scan-rate algorithm,
# then pipes just those ports into nmap for the deep service/script detection
# nmap alone is slower at — you get masscan-like discovery speed with nmap-quality results`}</CodeBlock>
      <p>
        The pattern that scales to real engagements: use masscan or rustscan to find <em>which</em> ports
        are open across a huge range in seconds, then run <code>nmap -sV -sC -p &lt;discovered-ports&gt;</code>
        against just those hosts/ports for accurate version and vulnerability detection. Masscan trades
        accuracy for raw speed (it's easy to overwhelm a network with its default rate and get dropped
        packets/false negatives), so treat its output as a fast first pass, not a final answer.
      </p>

      <h2>Verifying what a scan actually sent: tcpdump &amp; Wireshark</h2>
      <p>
        Nmap's terminal output tells you what it <em>concluded</em>; a packet capture tells you what it
        <em> actually transmitted</em>. Running a capture alongside a scan is the fastest way to build real
        intuition for what a "SYN scan" or a fragmented scan is actually doing on the wire, and it's
        essential when a scan behaves unexpectedly against a firewall or IDS.
      </p>
      <CodeBlock label="capturing your own scan traffic">{`sudo tcpdump -i eth0 host 10.10.10.5 -w scan.pcap    # capture to a file while nmap runs in another terminal
sudo tcpdump -i eth0 tcp[tcpflags] & tcp-syn != 0 and host 10.10.10.5   # SYN packets only`}</CodeBlock>
      <p>
        Open that same capture in Wireshark and you can see, frame by frame, exactly why <code>-sS</code>
        is called a "half-open" scan: nmap sends a SYN, the target answers SYN/ACK, and nmap sends a RST
        instead of completing the handshake with an ACK — the connection is never fully established, which
        is both faster and quieter in logs than a full TCP connect scan.
      </p>

      <Callout variant="danger">
        <p>
          Nmap sends real packets to real hosts — this is active reconnaissance and must be inside written
          authorization. Running <code>nmap</code> against infrastructure you don't have permission to test
          is illegal in most jurisdictions, full stop.
        </p>
      </Callout>
    </div>
  );
}
