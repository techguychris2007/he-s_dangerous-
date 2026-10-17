import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IpSubnetting() {
  return (
    <div className="prose-hh">
      <h1>IP Addressing &amp; Subnetting</h1>
      <p>
        IP addressing gives each network interface an address routers can use to deliver packets.
        Subnetting divides address space into manageable ranges; routing selects the next hop. Security
        analysts use these skills to understand asset inventories, firewall rules, cloud networks, packet
        captures, incident timelines, and authorized testing scope. This lesson starts with the arithmetic
        and then applies it to IPv4, IPv6, route tables, and Python.
      </p>

      <h2>Before subnetting: address, interface, route, and prefix</h2>
      <p>
        An IP address belongs to a network interface, not inherently to a person or physical computer. A
        server can have several interfaces; DHCP can change an address; and NAT can make many internal
        devices appear externally behind one public address. When reviewing evidence, record the timestamp,
        address family, source and destination, protocol, and network context. An IP address alone is not a
        reliable identity.
      </p>
      <p>
        A <strong>route</strong> tells an IP stack where to send traffic for a destination prefix. A
        <strong>prefix length</strong> says how many leading bits identify the network. In
        <code>10.20.30.0/24</code>, the first 24 of 32 IPv4 bits are the network prefix and the remaining
        8 bits vary within the block. The dotted mask is <code>255.255.255.0</code>: each 255 octet
        represents eight 1 bits in the mask.
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
      <p>
        Here is the same reasoning with a different prefix. For <code>10.20.4.77/26</code>, there are six
        host bits, so the block contains 64 addresses. The final mask octet is 192; the block size is
        <code>256 - 192 = 64</code>. The network boundaries in the last octet are 0, 64, 128, and 192.
        Address 77 falls in the 64–127 block, so the network is <code>10.20.4.64/26</code>, the
        conventional host range is <code>.65</code> through <code>.126</code>, and the broadcast address is
        <code>.127</code>.
      </p>
      <p>
        The common host-count formula is <code>2^(32-prefix)</code> total IPv4 addresses and, for an
        ordinary subnet, two fewer conventional host addresses. Do not apply that subtraction universally:
        RFC 3021 permits /31 prefixes on supported point-to-point links, where both addresses are endpoints,
        and /32 identifies one address. Cloud providers can reserve additional addresses in each subnet, so
        their usable capacity may be smaller than the familiar formula suggests.
      </p>
      <table>
        <thead><tr><th>Prefix</th><th>Mask</th><th>Total addresses</th><th>Common use</th></tr></thead>
        <tbody>
          <tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>Small LAN or subnet</td></tr>
          <tr><td>/25</td><td>255.255.255.128</td><td>128</td><td>Half of a /24</td></tr>
          <tr><td>/26</td><td>255.255.255.192</td><td>64</td><td>Quarter of a /24</td></tr>
          <tr><td>/27</td><td>255.255.255.224</td><td>32</td><td>Small service segment</td></tr>
          <tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>Small infrastructure subnet</td></tr>
          <tr><td>/30</td><td>255.255.255.252</td><td>4</td><td>Two conventional host addresses</td></tr>
          <tr><td>/31</td><td>255.255.255.254</td><td>2</td><td>Point-to-point link on supported devices</td></tr>
          <tr><td>/32</td><td>255.255.255.255</td><td>1</td><td>Host route or single address</td></tr>
        </tbody>
      </table>
      <p>
        A fast block-size method is to find the first mask octet that is neither 255 nor 0 and subtract it
        from 256. For a /27 the final mask octet is 224, giving blocks of 32. Its last-octet boundaries are
        0, 32, 64, 96, 128, 160, 192, and 224. This shortcut helps with mental checks; use a trusted
        calculator to confirm changes.
      </p>

      <h2>Private (RFC1918) ranges</h2>
      <p>These never route on the public internet — you'll see them constantly on internal engagements:</p>
      <CodeBlock>{`10.0.0.0/8        10.0.0.0     – 10.255.255.255
172.16.0.0/12     172.16.0.0   – 172.31.255.255
192.168.0.0/16    192.168.0.0  – 192.168.255.255`}</CodeBlock>
      <p>
        Private addresses are not meant to be routed across the public Internet, but they can be routed
        inside an organization, between connected private networks, or through a VPN. Private does not mean
        secret, encrypted, trusted, or unreachable by someone who already has an authorized path into that
        network. NAT is common, but it is separate from security policy: translation changes address
        information, while a firewall or application access-control policy decides whether communication is
        allowed. Seeing one public address does not reveal how many internal assets exist and does not imply
        those assets are reachable.
      </p>
      <p>
        Address overlap is a practical risk. If two connected offices or cloud networks both use
        <code>10.0.0.0/8</code>, a router may not know which site owns <code>10.5.4.20</code>. This can break
        routing or require translation and renumbering. An IP address management plan should reserve
        non-overlapping ranges, record owners and purposes, and leave room for future sites and cloud
        environments.
      </p>

      <h2>Letting the computer do the math</h2>
      <p>
        You should be able to subnet by hand, but on a real engagement you'll usually just double-check
        with a tool — mistyping a mask under time pressure is an easy way to scan the wrong range entirely.
      </p>
      <CodeBlock label="ipcalc — quick sanity-check any CIDR block">{`ipcalc 10.10.10.128/25
Address:   10.10.10.128
Netmask:   255.255.255.128 = 25
Network:   10.10.10.128/25
HostMin:   10.10.10.129
HostMax:   10.10.10.254
Broadcast: 10.10.10.255
Hosts/Net: 126`}</CodeBlock>
      <CodeBlock label="expanding a CIDR block into a target list for tooling">{`prips 10.10.10.0/24 > targets.txt          # one IP per line, ready to feed into a loop or nmap -iL
nmap -sn -iL targets.txt                     # or just hand nmap the CIDR directly — it expands it itself`}</CodeBlock>

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
        CIDR notation tells you how many addresses a range represents; it does not tell you whether hosts
        will answer ping or whether every address is assigned. A /24 has 256 total addresses, but network
        and broadcast addresses have special roles on a conventional subnet. Discovery tools also miss
        systems that filter probes or are offline, and may report infrastructure such as gateways. In an
        authorized lab, compare tool output with the written scope and explain why an address may be absent.
        Never enlarge scope because a neighboring address responds.
      </p>

      <h2>IPv6, briefly</h2>
      <p>
        IPv6 addresses are 128 bits, written as eight hexadecimal groups separated by colons. Leading
        zeroes in a group may be omitted, and one run of zero groups may be compressed with
        <code>::</code>. For example, <code>2001:0db8:0000:0000:0000:0000:0000:0042</code> becomes
        <code>2001:db8::42</code>. The double colon may appear only once because it represents an unknown
        number of zero groups. <code>2001:db8::/32</code> is reserved for documentation examples, not real
        public allocation.
      </p>
      <p>
        /64 is common for an IPv6 LAN, but real routing and allocation plans can use other prefix lengths.
        Link-local addresses in <code>fe80::/10</code> operate on one link and need an interface scope when a
        machine has several interfaces. Unique local addresses in <code>fc00::/7</code> are intended for
        private internetworks. IPv6 uses multicast rather than IPv4-style broadcast, and Neighbor Discovery
        and Router Advertisements help systems learn neighbors and prefixes.
      </p>
      <p>
        A dual-stack system may have both IPv4 and IPv6 routes, and applications may use either. A firewall
        rule that covers only IPv4 can leave a second path. Privacy extensions can change an IPv6 interface
        identifier over time, so the address is not always a stable device identity. Correlate address,
        DNS, endpoint inventory, authentication, and timestamps when investigating.
      </p>
      <CodeBlock label="inspect local IPv4 and IPv6 configuration">{'ip -br address\nip -6 address\nip route\nip -6 route\nip route get 192.0.2.20\nip -6 route get 2001:db8::20'}</CodeBlock>
      <CodeBlock label="don't forget the -6 flag exists">{`nmap -6 2001:db8::5              # nmap won't touch IPv6 targets unless you explicitly ask
ping6 fe80::1%eth0                  # link-local addresses require specifying the interface`}</CodeBlock>

      <h2>Supernetting: CIDR aggregation in the other direction</h2>
      <p>
        Subnetting splits a block down; <strong>supernetting</strong> (CIDR aggregation) merges adjacent
        blocks up into one shorter, larger prefix — the same mechanism, run backwards. If a scope lists{' '}
        <code>10.10.10.0/24</code> and <code>10.10.11.0/24</code> as two separate lines, they may actually
        be summarized by <code>10.10.10.0/23</code>. They must be adjacent, correctly aligned, and belong to
        the same authorized scope. An aggregate can include addresses that were not separately listed if
        the boundaries are wrong, so calculate the full range before using it in routing or testing.
        Internet routers also use aggregation to reduce the number of individual routes they carry.
      </p>

      <h2>Worked VLSM plan</h2>
      <p>
        Variable Length Subnet Masking (VLSM) allocates differently sized subnets to groups with different
        address needs. Suppose an approved training network owns <code>10.50.0.0/24</code> and needs about
        50 client, 25 service, and 10 management addresses. Allocate the largest requirement first:
        <code>10.50.0.0/26</code> contains 64 addresses, <code>10.50.0.64/27</code> contains 32, and
        <code>10.50.0.96/28</code> contains 16. The host ranges are respectively <code>.1–.62</code>,
        <code>.65–.94</code>, and <code>.97–.110</code> on the final octet. The remainder from
        <code>10.50.0.112</code> to <code>10.50.0.255</code> can remain reserved for future use.
      </p>
      <p>
        Those ranges still need room for a gateway, static devices, DHCP reservations, and any cloud
        provider-reserved addresses. If one group grows beyond capacity, revise the approved plan through
        change control instead of silently borrowing a neighbor's addresses. Document subnet, VLAN or cloud
        subnet ID, purpose, gateway, DNS, DHCP range, owner, policy, and growth reserve together.
      </p>

      <h2>Validate scope data with Python</h2>
      <p>
        Python's standard <code>ipaddress</code> module calculates prefixes without external packages. The
        example below checks a candidate address against explicitly listed ranges and detects overlap. It
        performs only local arithmetic; it does not connect to or scan a network.
      </p>
      <CodeBlock label="Offline prefix and scope validation">{'from ipaddress import ip_address, ip_network\n\napproved = [\n    ip_network("10.50.0.0/24", strict=True),\n    ip_network("2001:db8:50::/48", strict=True),\n]\n\ndef in_scope(candidate_text, networks):\n    candidate = ip_address(candidate_text)\n    return any(\n        network.version == candidate.version and candidate in network\n        for network in networks\n    )\n\ndef overlapping_ranges(networks):\n    pairs = []\n    for index, first in enumerate(networks):\n        for second in networks[index + 1:]:\n            if first.version == second.version and first.overlaps(second):\n                pairs.append((str(first), str(second)))\n    return pairs\n\nprint(in_scope("10.50.0.42", approved))\nprint(approved[0].network_address, approved[0].num_addresses)\nprint(overlapping_ranges(approved))'}</CodeBlock>
      <p>
        The function answers only whether an address falls inside a listed prefix. It does not prove who owns
        the host or authorize a connection. Use <code>strict=True</code> when a network boundary is required;
        <code>strict=False</code> can normalize a host address down to its containing network and hide a
        typo. Compare IPv4 only with IPv4 and IPv6 only with IPv6.
      </p>

      <h2>Subnetting mistakes that waste real engagement time</h2>
      <ul>
        <li>Confusing the number of addresses in a prefix with the number of assignable hosts, especially on /31, /32, and cloud subnets.</li>
        <li>Confusing the network address (<code>.0</code> in a /24) or broadcast address (<code>.255</code>)
        with ordinary host addresses in a conventional IPv4 subnet.</li>
        <li>Assuming every private range is /8, or treating all of <code>172.0.0.0/8</code> as RFC 1918 space.</li>
        <li>Assuming traceroute or TTL comparison proves subnet membership; routing-path observations do not replace address calculation or an IPAM record.</li>
        <li>Forgetting IPv6 routes and policies when a service is dual-stack.</li>
      </ul>

      <h2>Key takeaways</h2>
      <p>
        CIDR prefix length tells you how many leading bits identify a network; remaining bits determine its
        size. Use bitwise reasoning or a trusted calculator, verify routes on the host, and account for
        special prefixes, cloud reservations, overlap, and IPv6. Keep address plans documented, treat NAT
        and security policy as different controls, and never confuse network membership with identity or
        authorization.
      </p>

      <h2>Primary references</h2>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc1918" target="_blank" rel="noreferrer">RFC 1918: Address Allocation for Private Internets</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc4632" target="_blank" rel="noreferrer">RFC 4632: Classless Inter-domain Routing</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc3021" target="_blank" rel="noreferrer">RFC 3021: Using /31 Prefixes on IPv4 Point-to-Point Links</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc6598" target="_blank" rel="noreferrer">RFC 6598: Shared Address Space for Carrier-Grade NAT</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc5737" target="_blank" rel="noreferrer">RFC 5737: IPv4 Address Blocks Reserved for Documentation</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc3849" target="_blank" rel="noreferrer">RFC 3849: IPv6 Prefix Reserved for Documentation</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc4291" target="_blank" rel="noreferrer">RFC 4291: IPv6 Addressing Architecture</a></li>
        <li><a href="https://docs.python.org/3/library/ipaddress.html" target="_blank" rel="noreferrer">Python standard library: ipaddress</a></li>
      </ul>
    </div>
  );
}
