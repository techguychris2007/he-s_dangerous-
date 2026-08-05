import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function RoutingFundamentalsAndAttacks() {
  return (
    <div className="prose-hh">
      <h1>Routing Fundamentals & Common Routing Attacks</h1>
      <p>
        This closing lesson covers how traffic actually finds its way from one network to another — the
        missing piece connecting everything from OSI Layer 3 in Lesson 1 through this module's segmentation
        material — and the attacks that exploit routing's own trust assumptions, closing this module before
        the Linux Basics module begins.
      </p>

      <h2>Routing tables: the fundamental lookup every packet goes through</h2>
      <CodeBlock label="reading a routing table">{`$ ip route
default via 192.168.1.1 dev eth0            # the "gateway of last resort"
10.0.5.0/24 dev eth1 proto kernel scope link  # directly connected subnet
172.16.0.0/16 via 10.0.5.254 dev eth1           # reach 172.16.0.0/16 via
                                                  this specific next-hop

-- longest-prefix match wins: a route to 172.16.0.0/16 is preferred over
   the 0.0.0.0/0 default route for any destination actually inside that
   range, regardless of the order routes were added`}</CodeBlock>

      <h2>ARP spoofing: routing's most locally-exploitable trust gap</h2>
      <p>
        Before a packet can even be routed off the local segment, a device has to resolve the NEXT HOP's MAC
        address via ARP (IPv4) or NDP (Lesson 6's IPv6 equivalent) — and ARP, like the unauthenticated
        management frames from the Wireless module's Lesson 1, has no built-in authentication at all.
      </p>
      <CodeBlock label="the ARP spoofing / MITM technique">{`Normal:    Victim ARPs "who has 192.168.1.1 (gateway)?" -> gateway replies
           with its real MAC -- victim sends gateway-bound traffic there

Spoofed:   Attacker sends UNSOLICITED ARP replies claiming "192.168.1.1 is
           at MY MAC address" -- to both the victim AND the real gateway
           (a full bidirectional MITM position)
           Victim's ARP cache now maps the gateway's IP to the attacker's
           MAC -- ALL of the victim's off-subnet traffic now flows through
           the attacker first, who can inspect, modify, or drop it before
           forwarding it on to the real gateway

$ arpspoof -i eth0 -t 192.168.1.50 192.168.1.1   # classic tool, same
                                                    # underlying technique
                                                    # for decades`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice the structural parallel to the Wireless module's rogue AP/evil twin material and this module's
          own Lesson 6 SLAAC-spoofing attack: three completely different layers (Wi-Fi association, IPv6
          autoconfiguration, IPv4 address resolution), the exact same underlying gap — an unauthenticated
          broadcast/local announcement a device trusts implicitly, with no cryptographic way to verify who
          actually sent it.
        </p>
      </Callout>

      <h2>Rogue DHCP: redirecting an entire segment's default gateway</h2>
      <p>
        DHCP itself is equally unauthenticated — any device can respond to a DHCP DISCOVER broadcast, and a
        client typically accepts whichever DHCP OFFER arrives first. A rogue DHCP server on the local segment
        can hand out a legitimate-looking IP lease while setting itself as the default gateway and DNS server —
        achieving the same MITM position as ARP spoofing, but for every NEW device that joins the segment,
        without needing to actively attack any single already-connected host.
      </p>

      <h2>BGP: routing trust at internet scale, and why it matters here</h2>
      <CodeBlock label="the internet-scale version of the same local-trust problem">{`Border Gateway Protocol (BGP) is how autonomous systems (ISPs, large
organizations) announce "I am the correct path to reach this IP range" to
each other across the entire internet -- and, like ARP and DHCP, BGP
historically has NO strong built-in verification that an announcing AS
actually legitimately owns the address range it's announcing.

A BGP HIJACK happens when an AS (maliciously or through simple
misconfiguration) announces a route for an IP range it doesn't actually
own -- and because BGP generally prefers more SPECIFIC route
announcements, even a small, obviously-wrong announcement can successfully
divert real internet traffic through the hijacking AS.`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real incident — the 2018 MyEtherWallet BGP hijack:</strong> attackers used a BGP hijack against
          Amazon's Route 53 DNS infrastructure, announcing a more specific route for a block of IP addresses
          used by Route 53's name servers and rerouting roughly two hours of DNS traffic for
          myetherwallet.com through attacker-controlled servers. Victims who queried DNS during that window
          received a malicious IP address, were served a convincing phishing clone of the real cryptocurrency
          wallet site, and had their private keys — and the funds those keys controlled — stolen the moment
          they attempted to log in. It remains a widely cited example of how a routing-layer attack, invisible
          to the actual application and completely bypassing any TLS certificate the real site had, can achieve
          full traffic interception at internet scale — the exact same "redirect traffic to an attacker-
          controlled destination" goal as ARP spoofing and rogue DHCP, just reached at a scale and layer far
          beyond any single local network.
        </p>
      </Callout>

      <h2>Module synthesis: three layers, one recurring pattern</h2>
      <CodeBlock label="the throughline across this module's closing three lessons">{`Layer 2 (VLANs, Lesson 7)     -- trunk negotiation and native VLAN
                                assumptions, exploitable when misconfigured
Layer 3 local (ARP/DHCP)         -- unauthenticated local announcements,
                                trusted implicitly by every device on-segment
Layer 3 global (BGP)               -- the exact same unauthenticated-
                                announcement trust gap, at internet scale`}</CodeBlock>
      <p>
        With this module's full arc now complete — from OSI layers and subnetting through IPv6, segmentation,
        and routing trust — the next module moves from understanding how networks are structured to actually
        operating inside one: Linux fundamentals for offensive work.
      </p>
    </div>
  );
}
