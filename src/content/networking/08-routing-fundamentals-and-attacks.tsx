import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function RoutingFundamentalsAndAttacks() {
  return (
    <div className="prose-hh">
      <h1>Routing Fundamentals &amp; Routing Security</h1>
      <p>
        Routing is the process of choosing where an IP packet should go next. A host first decides whether a
        destination is on its local link or should be sent to a gateway. Routers repeat that decision at each
        network boundary until the packet reaches its destination or is dropped. Understanding this path lets
        defenders explain outages, investigate suspicious traffic, and identify where policy or route
        announcements may have diverted packets.
      </p>

      <h2>Routing, forwarding, and the tables that support them</h2>
      <p>
        <strong>Routing</strong> is the control-plane process that learns or configures paths. A router can
        learn routes from a routing protocol, receive them from a peer, or have them configured by an
        administrator. The <strong>routing information base (RIB)</strong> contains candidate routes and
        their attributes. The operating system or router selects routes according to its own policy and
        installs usable forwarding entries in a <strong>forwarding information base (FIB)</strong>. The FIB
        is consulted when packets arrive. Product terminology varies, but this distinction explains why a
        route visible in a protocol's neighbor table may not be the route actually used for forwarding.
      </p>
      <p>
        A host or router generally follows these steps: choose the correct routing table or policy rule; find
        routes whose prefixes contain the destination; use the longest matching prefix; resolve the selected
        next-hop link address if needed; create a link-layer frame for that next hop; and send the packet out
        the chosen interface. Each router makes its own next-hop decision. It does not carry one Ethernet
        frame end-to-end across the Internet. The IP source and destination normally stay the same across
        routed hops unless another mechanism such as NAT changes them, while the Layer 2 source and destination
        change at each link.
      </p>
      <CodeBlock label="Inspect the routes selected by a Linux host">{'ip route\nip -6 route\nip rule show\nip route get 203.0.113.80\nip -6 route get 2001:db8::80'}</CodeBlock>
      <p>
        A line such as <code>default via 192.0.2.1 dev eth0</code> says that destinations without a more
        specific route are sent to next hop <code>192.0.2.1</code> through interface <code>eth0</code>. A
        directly connected route may have no next-hop address because the destination is on that link.
        Route output can also include a metric, source address, protocol, or table. Metrics and route
        preferences are platform-specific; they should not be confused with longest-prefix match.
      </p>
      <p>
        <strong>Longest-prefix match</strong> answers which destination range is most specific. If both
        <code>10.40.0.0/16</code> and <code>10.40.8.0/24</code> match the destination
        <code>10.40.8.25</code>, the /24 is the more specific prefix. When several candidate routes have the
        same prefix length, route-selection policy, metrics, protocol preference, or multipath configuration
        may determine what happens. The routes are not simply chosen by whichever line appears first.
      </p>
      <p>
        Policy routing can select a table based on source address, incoming interface, firewall mark, or other
        configured attributes. VPNs, containers, cloud networking, and multi-homed servers often use this.
        Therefore, looking only at the main route table can miss the selected path. Use
        <code>ip rule show</code> and a destination-specific <code>ip route get</code> on the actual host to
        see which route the kernel would select.
      </p>

      <h2>Next-hop resolution: ARP for IPv4 and Neighbor Discovery for IPv6</h2>
      <p>
        IP routing chooses a next-hop IP address; Ethernet delivery still needs a destination MAC address on
        the current local link. If a destination is off-subnet, a host resolves the gateway's MAC, not the
        remote server's MAC. IPv4 Address Resolution Protocol (ARP) performs this mapping on a local link.
        IPv6 Neighbor Discovery Protocol (NDP), carried in ICMPv6, handles neighbor address resolution and
        other link functions. A router repeats next-hop resolution on its own outgoing link.
      </p>
      <p>
        These protocols are link-local. ARP does not cross a router, and an ARP observation on one VLAN does
        not reveal every device on routed networks. Basic ARP has no cryptographic sender authentication, so a
        hostile or misconfigured device on the same Layer 2 segment may send misleading address claims.
        NDP also relies on local-link messages; IPv6 security therefore needs protections for Router
        Advertisements and related neighbor traffic. An ARP or NDP cache entry is evidence of a local
        mapping, not proof of a person's identity.
      </p>
      <CodeBlock label="Read the local neighbor cache without changing it">{'ip neigh show\nip -6 neigh show'}</CodeBlock>
      <p>
        A sudden gateway MAC change can have benign causes, including failover, a virtual gateway, hardware
        replacement, or address movement. Investigate it by correlating timestamps with change records,
        switch telemetry, DHCP leases, gateway redundancy events, and packet observations. Do not conclude
        that an address spoof occurred from one cache entry alone.
      </p>

      <h2>Local-link attacks and defensive controls</h2>
      <p>
        An ARP cache-poisoning attempt tries to make a victim associate an IP address, often a gateway, with
        an attacker's MAC address. If forwarding and topology conditions allow, this can place the attacker
        on a traffic path, create intermittent outages, or enable observation of unencrypted traffic. Modern
        applications should use authenticated encryption such as correctly validated TLS, but encryption
        does not prevent traffic disruption, metadata collection, or a user being redirected to a different
        service that presents a valid certificate for its own name.
      </p>
      <p>
        Defenses should match the network and equipment. Common enterprise controls include access-port
        authentication such as 802.1X, limiting user ports to access mode, DHCP snooping, Dynamic ARP
        Inspection (DAI) where supported, IP Source Guard, switch-port protections, and segmentation.
        DHCP snooping builds a binding between an assigned address and a switch port; DAI can use those
        bindings to validate ARP claims. Their effectiveness depends on correct trusted-port configuration
        and complete bindings for static devices, phones, and special workloads. A misconfigured trusted
        uplink can weaken the control or interrupt legitimate service.
      </p>
      <p>
        For IPv6, use platform-supported controls such as Router Advertisement Guard and DHCPv6 Guard, and
        monitor unexpected router advertisements or neighbor changes. These controls need a current device
        inventory and careful exception handling. A static neighbor entry may be useful for a small critical
        link but is hard to manage at enterprise scale and does not replace identity, application security,
        or a documented change process.
      </p>

      <h2>DHCP and the default route</h2>
      <p>
        Dynamic Host Configuration Protocol (DHCP) lets a client obtain configuration such as an address,
        subnet mask or prefix, default gateway, DNS resolvers, and lease duration. In the familiar IPv4
        exchange, the client broadcasts DHCPDISCOVER, a server may respond with DHCPOFFER, the client sends
        DHCPREQUEST, and the server confirms with DHCPACK. There can be multiple offers; clients and
        implementations do not all make decisions in a simplistic universal “first response always wins”
        way.
      </p>
      <p>
        An unauthorized DHCP server may offer misleading network settings, including a wrong gateway or DNS
        resolver. The result can be failed connectivity, traffic sent through an unexpected router, or name
        resolution to an unintended destination. Enterprise switches can use DHCP snooping to permit server
        responses only on trusted ports. Combine that with access-port authentication, clear port ownership,
        monitoring, and IPv6 Router Advertisement protections. In virtual networks, review the provider's
        DHCP and metadata behavior; the underlying control plane may not be visible as an ordinary switch
        port.
      </p>
      <p>
        When a host receives an unexpected address, check the DHCP lease, configured gateway and DNS, local
        routes, switch or wireless association, and recent network changes. Compare with an approved
        baseline for the correct VLAN or cloud subnet. A surprising lease does not by itself prove malicious
        activity; relay configuration, failover, stale reservations, and device movement can produce
        legitimate changes.
      </p>

      <h2>BGP: how networks exchange reachability</h2>
      <p>
        The Border Gateway Protocol (BGP) exchanges reachability information between autonomous systems
        (ASes), which are independently administered routing domains. An announcement associates an IP prefix
        with path attributes, including an AS_PATH that records the route's inter-domain path. BGP is a
        policy-based path-vector protocol: networks choose routes using local business, security, and
        engineering policy, not simply by selecting the geographically shortest path.
      </p>
      <p>
        A <strong>route leak</strong> is generally an unintended propagation of routes beyond the intended
        routing relationship or policy. A <strong>prefix hijack</strong> occurs when a network announces
        reachability for an address prefix it is not authorized to originate. These events may be accidental
        or malicious. Some networks may accept and propagate a bad announcement; others may reject it, so a
        route event does not necessarily divert traffic everywhere. BGP control-plane visibility also does
        not guarantee that data-plane packets follow the announced path.
      </p>
      <p>
        When routers have accepted competing routes, a more-specific prefix often attracts traffic for the
        addresses it covers because forwarding uses longest-prefix match. But propagation and acceptance
        depend on each network's filters and route-selection policy. Do not explain every hijack as “BGP
        always picks the shortest” or “every more-specific route wins globally”; BGP best-path policy and
        prefix forwarding are separate decisions.
      </p>

      <h2>Modern BGP origin validation: what RPKI does and does not do</h2>
      <p>
        Resource Public Key Infrastructure (RPKI) lets an address holder publish a digitally signed Route
        Origin Authorization (ROA). A ROA states which AS is authorized to originate a prefix and the
        maximum prefix length permitted by that authorization. A network that performs Route Origin
        Validation (ROV) compares received route announcements with validated ROA data and can classify
        origin state as <strong>Valid</strong>, <strong>Invalid</strong>, or <strong>NotFound</strong>.
        Operators commonly use route policy to reject or de-prefer invalid announcements.
      </p>
      <p>
        ROV is a practical safeguard against some unauthorized or mistaken origin announcements, but it is
        not complete BGP path security. It checks the origin-AS relationship and allowed prefix length; it
        does not cryptographically validate every AS_PATH hop. NotFound means no covering authorization was
        found, not necessarily that the route is malicious. An overly broad ROA maximum length can allow
        unwanted more-specific announcements to validate, while an incorrect ROA or incorrect rejection
        policy can make the legitimate prefix unreachable. ROA data can also differ between caches while
        updates propagate.
      </p>
      <p>
        Operators strengthen routing security with precise ROAs, ROV on import, prefix and AS-path filters,
        maximum-prefix limits, peer-session protections, route monitoring, and tested incident contacts.
        These controls address different failure modes and should be layered. Before rejecting routes,
        validate the organization's own ROAs, ensure redundant origins are covered, monitor validation state,
        and test policy changes. Organizations that do not operate BGP can still ask their providers about
        RPKI/ROV support, route filtering, incident notification, and escalation.
      </p>
      <CodeBlock label="Three origin-validation states in plain language">{'VALID:    a covering ROA matches the announced origin AS and prefix length\nINVALID:  a covering ROA exists, but origin AS or allowed length does not match\nNOTFOUND:  no covering ROA is available to validate this route\n\nThese labels describe origin validation only; they do not attest the full AS path.'}</CodeBlock>
      <Callout variant="tip">
        <p>
          NotFound does not establish that an announcement is malicious, and an Invalid result can follow an
          operator's own incorrect ROA. Preserve the route update, prefix, origin AS, validation data and
          timestamp; compare the observed announcement with the address holder's approved route plan and
          more than one independent routing view before escalating.
        </p>
      </Callout>

      <h2>Real incident: the 2018 Route 53 and MyEtherWallet event</h2>
      <p>
        In April 2018, a BGP route hijack affected some Amazon Route 53 DNS-server prefixes. Some recursive
        resolvers sent queries to an impostor DNS server, which returned a malicious address for
        myetherwallet.com. This combined a routing diversion with altered DNS answers; it was not a direct
        compromise of the wallet application's code. Cloudflare's incident analysis reported that the
        fraudulent site presented a self-signed TLS certificate and that users who ignored the browser's
        certificate warning were exposed. The event shows how routing and DNS failures can combine while
        correctly validated HTTPS still gives users a meaningful warning. It also shows why network
        availability, DNS integrity, certificate validation, and user-facing warnings each matter.
      </p>

      <h2>How defenders investigate an unexpected route or gateway</h2>
      <ol>
        <li>Record the affected host, interface, timestamp, source and destination addresses, and reported symptom.</li>
        <li>Inspect its selected route and neighbor-cache entries; compare them with the approved network baseline.</li>
        <li>Check address assignment, gateway, DNS, wireless or switch-port association, and recent failover or change events.</li>
        <li>At the network edge, compare the active routing table with the intended routing policy and peer updates.</li>
        <li>For a suspected public BGP event, correlate multiple independent route collectors, provider notices, and authoritative route-origin data.</li>
        <li>Check both control-plane announcements and data-plane reachability; traceroute alone cannot prove who originated a route.</li>
        <li>Preserve time-bounded logs and packet evidence, then make changes through the approved network incident process.</li>
        <li>After containment, verify normal and alternate paths, DNS answers, application certificate behavior, and monitoring coverage.</li>
      </ol>
      <p>
        The goal is to identify the boundary where observed behavior diverges from the approved path. A local
        neighbor-cache change points toward the local link or gateway; a route-table change may involve host
        policy, VPN, or routing updates; a public announcement anomaly requires provider and inter-domain
        evidence. Distinguish these layers before blaming a single protocol.
      </p>

      <h2>Safe hands-on practice</h2>
      <p>
        In a private lab, compare the route selected for two destinations, inspect IPv4 and IPv6 neighbor
        caches, and document how a gateway address maps to a local-link address. Then review a synthetic BGP
        announcement table and label each route using its prefix, origin AS, ROA state, and maximum length.
        Do not send ARP spoofing, rogue DHCP, or BGP announcements on a production or public network. The
        defensive concepts can be learned from controlled captures, switch configuration exports, and
        synthetic routing data.
      </p>
      <CodeBlock label="Read-only route and neighbor inspection on your own lab host">{'ip route get 192.0.2.25\nip -6 route get 2001:db8::25\nip neigh show\nip -6 neigh show\nip rule show'}</CodeBlock>

      <h2>Knowledge check</h2>
      <ol>
        <li>
          A server has two matching routes to a destination, one /16 and one /24. Which is more specific?
          <strong>The /24.</strong> It matches more leading destination bits. If routes have equal prefix
          length, local route-selection policy decides among them.
        </li>
        <li>
          Does an ARP cache entry identify the human using the device?
          <strong>No.</strong> It is a local IP-to-MAC mapping that can change and may be spoofed or stale.
        </li>
        <li>
          What does RPKI origin validation check?
          <strong>Whether the announced prefix and origin AS match a valid ROA and permitted maximum length.</strong>
          It does not validate every AS in the path.
        </li>
        <li>
          What does ROV NotFound mean?
          <strong>No covering ROA was available for the announcement.</strong> It is not equivalent to Invalid
          and does not by itself prove wrongdoing.
        </li>
        <li>
          Why compare both route announcements and traceroute or flow observations?
          <strong>The control plane describes paths being advertised; data-plane tests show what packets actually do.</strong>
          Neither view alone answers every question.
        </li>
      </ol>

      <h2>Key takeaways</h2>
      <p>
        Routing selects next hops through destination-prefix lookup and local policy. ARP and NDP resolve
        addresses on the local link, while DHCP supplies configuration and BGP exchanges reachability between
        routing domains. These layers have different threat models and defenses. Current RPKI origin
        validation reduces some BGP origin mistakes but does not validate the full path; investigation should
        correlate host state, network policy, route data, and observed packet behavior.
      </p>

      <h2>Primary references</h2>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc7454" target="_blank" rel="noreferrer">RFC 7454: BGP Operations and Security</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc6811" target="_blank" rel="noreferrer">RFC 6811: BGP Prefix Origin Validation</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc7115" target="_blank" rel="noreferrer">RFC 7115: RPKI Origin Validation Operation</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc8893" target="_blank" rel="noreferrer">RFC 8893: RPKI Origin Validation for BGP Export</a></li>
        <li><a href="https://blog.cloudflare.com/bgp-leaks-and-crypto-currencies/" target="_blank" rel="noreferrer">Cloudflare: BGP leaks and cryptocurrencies (2018 incident analysis)</a></li>
      </ul>
    </div>
  );
}
