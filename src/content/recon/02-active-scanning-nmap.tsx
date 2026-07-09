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
