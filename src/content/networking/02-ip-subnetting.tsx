import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IpSubnetting() {
  return (
    <div className="prose-hh">
      <h1>IP Addressing &amp; Subnetting</h1>
      <p>
        Every target you scan, every scope document you're handed, every pivot you attempt across a
        network depends on reading CIDR notation fluently. This is one of the few purely mathematical
        skills in offensive security — and it's non-negotiable.
      </p>

      <h2>IPv4 basics</h2>
      <p>
        An IPv4 address is 32 bits, written as four decimal octets: <code>192.168.1.10</code>. Each octet
        is 0-255 (8 bits). Addresses are split into a <strong>network portion</strong> and a
        <strong> host portion</strong> — the subnet mask tells you where that split happens.
      </p>

      <h2>CIDR notation</h2>
      <p>
        <code>10.10.10.0/24</code> means: the first 24 bits are the network, the remaining 8 bits identify
        hosts within it. That gives you 2⁸ = 256 addresses (254 usable — network and broadcast addresses
        are reserved).
      </p>
      <CodeBlock label="common CIDR blocks you'll see in scopes">{`/24  255.255.255.0    256 addresses (254 usable)  — a typical LAN
/23  255.255.254.0    512 addresses (510 usable)  — two /24s merged
/16  255.255.0.0      65,536 addresses            — a whole corporate range
/30  255.255.255.252  4 addresses (2 usable)      — point-to-point link
/32  255.255.255.255  1 address                   — a single host`}</CodeBlock>

      <h2>Fast subnetting math (do this in your head)</h2>
      <p>
        The number of usable hosts in a subnet is <code>2^(32-prefix) - 2</code>. You'll use this constantly
        to figure out how large an engagement's scope actually is.
      </p>
      <ul>
        <li><code>/24</code> → 2⁸ - 2 = 254 hosts</li>
        <li><code>/25</code> → 2⁷ - 2 = 126 hosts</li>
        <li><code>/28</code> → 2⁴ - 2 = 14 hosts</li>
      </ul>
      <p>
        To find which network an IP belongs to, AND the IP with the subnet mask. E.g. is
        <code> 10.10.10.130</code> in <code>10.10.10.128/25</code>? The /25 mask is
        <code> 255.255.255.128</code>. <code>130 &amp; 128 = 128</code>, which matches the network address — yes, it's in range.
      </p>

      <h2>Private (RFC1918) ranges</h2>
      <p>These never route on the public internet — you'll see them constantly on internal engagements:</p>
      <CodeBlock>{`10.0.0.0/8        10.0.0.0     – 10.255.255.255
172.16.0.0/12     172.16.0.0   – 172.31.255.255
192.168.0.0/16    192.168.0.0  – 192.168.255.255`}</CodeBlock>

      <Callout variant="warn">
        <p>
          <strong>Scope discipline:</strong> "10.10.10.0/24" as your authorized scope means exactly those
          254 hosts — not the gateway outside it, not a host you find on the same switch that happens to
          be a /23 neighbor. Attacking outside authorized scope turns a legal engagement into a crime.
          Always re-read the rules of engagement before you touch anything.
        </p>
      </Callout>

      <h2>Reading nmap/ping output through this lens</h2>
      <p>
        When you scan <code>10.10.10.0/24</code> with nmap, it will iterate all 254 usable addresses. If
        your engagement scope is a /16, that's up to 65,534 hosts — you'd want a fast discovery scan first
        (<code>nmap -sn</code>, a ping sweep) before running expensive full port scans against every host.
        This is why subnetting fluency directly shapes how you plan a scan strategy, which we cover in
        Module 3.
      </p>

      <h2>IPv6, briefly</h2>
      <p>
        IPv6 addresses are 128 bits, written in hex groups: <code>2001:0db8:85a3::8a2e:0370:7334</code>.
        Corporate networks are increasingly dual-stack. Many scanners default to IPv4-only — a classic
        recon gap is forgetting to check for IPv6 services listening on the same host.
      </p>
    </div>
  );
}
