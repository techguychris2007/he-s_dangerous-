import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const addresses = [
  '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  '2001:db8:85a3::8a2e:370:7334  # same address, compressed',
  '',
  'fe80::/10       link-local unicast; valid only on the local link',
  'fc00::/7        unique-local address space',
  '2000::/3        currently allocated global-unicast range',
  '::1             loopback',
  '::              unspecified address',
  '2001:db8::/32   documentation prefix; examples only',
].join('\n');

const autoconfig = [
  'Host A                    Router                    Host B',
  '  |                         |                          |',
  '  |-- Router Solicitation ->|                          |',
  '  |<- Router Advertisement -|                          |',
  '  |   prefix, lifetimes,     |                          |',
  '  |   default-router data    |                          |',
  '  |                         |                          |',
  '  |-- Neighbor Solicitation: Duplicate Address Detection |',
  '  |                         |                          |',
  '  |-- Neighbor Solicitation / Neighbor Advertisement -->|',
  '  |       resolve IPv6 neighbor to link-layer address    |',
  '',
  'DNS may be learned from RA (RDNSS) or DHCPv6, depending on policy.',
  'SLAAC, DHCPv6, and static assignment can coexist in a network.',
].join('\n');

const commands = [
  '# Read-only host inspection on Kali or another Linux system.',
  'ip -6 address show',
  'ip -6 route show',
  'resolvectl status',
  '',
  '# Capture Neighbor Discovery on an interface in your isolated lab.',
  'sudo tcpdump -n -i eth0 icmp6',
  '',
  '# Example only: scan one explicitly assigned lab host.',
  '# Configure fd42:4457:1::10 on a VM in your host-only lab first.',
  'nmap -6 -sT -Pn -p 22,80 --reason fd42:4457:1::10',
  '',
  '# Never expand this to a network you do not own or have permission to test.',
].join('\n');

const firewallMatrix = [
  'Control plane / data path             IPv4 policy        IPv6 policy',
  'Internet ingress to public web         allow 443          allow 443',
  'Internet ingress to admin service      deny               deny',
  'App subnet to database                 allow 5432          allow 5432',
  'Guest segment to internal services     deny               deny',
  'ICMP / ICMPv6 required functions       explicitly scoped  explicitly scoped',
  '',
  'Review effective policy at the host, cloud edge, network firewall,',
  'load balancer, and identity-aware proxy. Do not infer parity from one layer.',
].join('\n');

export default function Ipv6FundamentalsAndTransition() {
  return (
    <article className="prose-hh">
      <h1>IPv6 Fundamentals, Operations, and Security</h1>
      <p>
        IPv6 is a full network-layer protocol, not an optional label placed on top of IPv4. Many current
        operating systems enable it by default, and a network may use IPv4 and IPv6 together, IPv6-only access
        with translation, or different arrangements in separate segments. A security review that checks only
        IPv4 can miss a working communication path. This lesson builds the address and neighbor-discovery model
        first, then shows how to inspect a dual-stack host and test a narrowly scoped lab endpoint.
      </p>

      <h2>Prerequisite concepts</h2>
      <p>
        An IP address identifies an interface at the network layer; it is not necessarily a permanent identity
        for a person or device. A prefix states which leading bits represent the network. A router forwards
        packets between networks, while a switch forwards frames inside a local link. A firewall enforces
        traffic policy. IPv4 uses 32-bit addresses; IPv6 uses 128-bit addresses. Neither address family decides
        whether a user is allowed to access an application—that decision belongs to the relevant application
        and identity controls.
      </p>

      <h2>1. Read and classify IPv6 addresses</h2>
      <p>
        IPv6 is written as eight groups of hexadecimal digits separated by colons. Leading zeroes within a group
        may be omitted. One consecutive run of zero groups can be replaced by <code>::</code>, but only once,
        because using it twice would make the number of omitted groups ambiguous. Prefix notation works like
        CIDR: <code>/64</code> means the first 64 bits are the prefix. A /64 is common on a LAN, but it is not
        correct to assume every IPv6 prefix has that length.
      </p>
      <CodeBlock label="Common IPv6 address forms">{addresses}</CodeBlock>
      <p>
        Global-unicast addresses are generally intended to be globally reachable, but address assignment does
        not imply that a host is reachable through the organization's firewalls. Link-local addresses beginning
        with <code>fe80::/10</code> are used on one link and are not forwarded by routers. When a host has
        multiple interfaces, the same link-local address may be ambiguous; command-line tools often need an
        interface scope such as <code>%eth0</code>. Unique-local addresses provide private internal addressing,
        but they are not a security control: route filters and firewalls still determine where packets can go.
      </p>
      <p>
        The documentation-only prefix <code>2001:db8::/32</code> is useful in written examples. Do not configure
        it as a real internet service address. For a lab that needs internal communication, choose a ULA prefix
        dedicated to an isolated virtual network and document that prefix as part of the exercise.
      </p>

      <h2>2. SLAAC, DHCPv6, and Neighbor Discovery</h2>
      <p>
        Stateless Address Autoconfiguration (SLAAC) lets a host construct addresses from a prefix advertised by
        a router. Router Advertisements (RAs) also communicate information such as prefix lifetimes and default
        router availability. DHCPv6 can provide addresses or other configuration, and the two approaches may
        coexist. An RA's flags influence host behavior, but the exact configuration depends on the operating
        system and network policy. DNS server information can be supplied through Router Advertisement options
        or DHCPv6.
      </p>
      <p>
        IPv6 Neighbor Discovery Protocol (NDP), carried in ICMPv6, performs several jobs that are distinct in
        IPv4. Neighbor Solicitation and Neighbor Advertisement messages resolve a local IPv6 neighbor to a
        link-layer address and support Duplicate Address Detection. Router Solicitation asks routers to send an
        advertisement; Router Advertisement communicates router and prefix information. NDP also includes
        reachability and redirect behaviors. ICMPv6 is part of normal IPv6 operation, so a blanket rule that
        blocks all ICMPv6 can break essential functions such as path MTU discovery and error reporting.
      </p>
      <CodeBlock label="A simplified autoconfiguration and neighbor-discovery exchange">{autoconfig}</CodeBlock>
      <p>
        SLAAC and NDP messages on a local link are not automatically authenticated in the usual enterprise
        deployment. A rogue RA can advertise an unwanted default router or prefix, potentially steering traffic
        or causing disruption on that segment. Defenses include managed switch RA Guard, port and VLAN controls,
        wireless client isolation where appropriate, host monitoring, and validated switch configuration.
        RA-Guard implementations must account for packet-extension-header evasion and should follow current
        implementation guidance; deploying a feature called “RA Guard” without checking the actual hardware
        behavior is not sufficient.
      </p>
      <Callout variant="warn">
        <p>
          Do not reproduce rogue Router Advertisement attacks on a school, home, office, or shared Wi-Fi network.
          The authorized lab exercise is to inspect your own VM's address, route, and ICMPv6 traffic, then compare
          the resulting configuration with the lab's expected router. Misleading a real network's hosts can
          interrupt connectivity for everyone on the segment.
        </p>
      </Callout>

      <h2>3. Address privacy and asset tracking</h2>
      <p>
        Some hosts create temporary IPv6 addresses with randomized interface identifiers for outbound
        connections. This reduces the ease of tracking one device by a stable interface identifier, but does not
        make the user anonymous: DNS names, account sessions, application identifiers, TLS fingerprints, and
        network telemetry may still correlate activity. A server usually needs stable addressing or stable DNS
        records, while a client can use temporary addresses for certain outbound traffic. Inventory tools should
        therefore correlate an address with time, interface, DHCP/RA data, device identity, and network logs
        instead of assuming one address permanently identifies one endpoint.
      </p>

      <h2>4. Dual-stack security and transition mechanisms</h2>
      <p>
        Dual-stack means both IPv4 and IPv6 are enabled and routed. The security requirement is policy parity:
        the same intended trust boundary must exist in both stacks at every relevant enforcement point. It is
        common for an organization to maintain detailed IPv4 rules while forgetting IPv6 host firewalls, cloud
        security groups, monitoring pipelines, DNS records, or incident queries. That is a configuration gap,
        not an inherent weakness in IPv6.
      </p>
      <p>
        Older transition mechanisms such as 6to4 and Teredo tunnel IPv6 over IPv4 and may remain enabled on
        legacy systems. Their status and default behavior vary by operating system and network. Modern
        deployments also use translation mechanisms such as NAT64/DNS64 and 464XLAT to let IPv6-only clients
        reach IPv4 services. These mechanisms solve interoperability problems; they create additional gateways,
        logs, routing behavior, and policy locations that operators must understand. Inventory the actual
        mechanisms in use rather than assuming a tunnel exists because a protocol is historically known.
      </p>
      <CodeBlock label="Compare intended IPv4 and IPv6 enforcement">{firewallMatrix}</CodeBlock>
      <p>
        For each edge and host, test the effective policy in both address families. Check cloud security groups,
        network ACLs, host firewalls, load balancers, service listeners, DNS AAAA records, and monitoring. Log
        IPv6 source and destination addresses consistently, normalize them before correlation, and ensure
        detection rules are not written only for dotted-decimal IPv4 values. Verify that asset inventories and
        incident forms accept full IPv6 notation, compressed forms, and scoped link-local addresses.
      </p>

      <h2>5. Inspect IPv6 on a Linux training host</h2>
      <p>
        These commands are useful for defensive troubleshooting and are read-only except for the final scan.
        The scan example is deliberately limited to one host that you assign inside an isolated host-only VM
        network. Do not copy it to a real network just because the address is an example.
      </p>
      <CodeBlock label="Host inspection and one-host lab validation">{commands}</CodeBlock>
      <p>
        Read <code>ip -6 address show</code> by interface: note each address, prefix length, scope, and tentative,
        preferred, or deprecated status. Read <code>ip -6 route show</code> to identify the default router and
        directly connected prefixes. In the packet capture, observe Router Solicitation/Advertisement and
        Neighbor Solicitation/Advertisement traffic; do not conclude a route is malicious just because an RA
        exists. Compare the router's source link-layer address and advertised parameters with the configured
        lab router.
      </p>
      <p>
        In your isolated lab, assign a ULA address to a second VM, allow only the intended test ports in its
        firewall, and scan that exact address. Confirm that IPv4 and IPv6 firewall rules produce the intended
        result. A failed connection can mean the host is down, the route is missing, a firewall rejected it, or
        the service is not listening; distinguish these explanations using route output, packet capture, and
        host logs.
      </p>

      <h2>6. IPv6 discovery without brute-forcing a /64</h2>
      <p>
        A typical IPv6 /64 contains 2<sup>64</sup> interface identifiers, making exhaustive address scanning
        impractical. Authorized discovery instead uses known data sources: DNS AAAA records, cloud and network
        inventory, certificate transparency hostnames, service logs, configuration management, and neighbor
        caches when the analyst is already on the local segment. Use those sources to build an approved target
        list, then validate exact hosts within the written scope. A neighbor cache is local and time-dependent;
        it is not a complete inventory of a remote organization.
      </p>
      <p>
        This changes the evidence workflow: record the source of each candidate address, resolution time, owning
        account or network, scope decision, and validation result. When a hostname returns both A and AAAA
        records, test both only if the program's scope authorizes the hostname and address family. A web
        application can behave differently based on the address family, proxy, and virtual host, so keep those
        variables in the notes.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>Equating NAT with a firewall. NAT and stateful filtering are different functions; neither address
          translation nor address size defines application authorization.</li>
        <li>Assuming private/ULA or link-local addresses are inherently safe. Segmentation, local-link controls,
          and host policy still matter.</li>
        <li>Blocking all ICMPv6. That can break required network behavior and hide diagnostic evidence.</li>
        <li>Scanning an entire /64 or treating DNS as complete inventory. Use authorized inventories and exact
          candidates.</li>
        <li>Reviewing only the perimeter. Hosts, cloud resources, containers, VPNs, and service meshes can have
          IPv6 paths that bypass a single edge control.</li>
        <li>Attributing an address to a person without time context. Temporary addresses, leases, proxies, and
          shared devices complicate attribution.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>Why can a global-unicast address still be unreachable from the public internet?</li>
        <li>Which NDP messages help a host learn router information and resolve a neighbor?</li>
        <li>Why is blocking every ICMPv6 message a poor firewall strategy?</li>
        <li>What security gap can occur when IPv4 policy is maintained but IPv6 policy is forgotten?</li>
        <li>Why do DNS, logs, and cloud inventory help discover IPv6 hosts more effectively than exhaustive
          scanning of a /64?</li>
        <li>What evidence would help distinguish a rogue RA from the expected lab router advertisement?</li>
      </ol>

      <h2>Further reading</h2>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc4861.html" target="_blank" rel="noreferrer">RFC 4861: Neighbor Discovery for IP version 6</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc6105.html" target="_blank" rel="noreferrer">RFC 6105: IPv6 Router Advertisement Guard</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc7113.html" target="_blank" rel="noreferrer">RFC 7113: Implementation Advice for RA-Guard</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc8981.html" target="_blank" rel="noreferrer">RFC 8981: Temporary Address Extensions for SLAAC</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc8683.html" target="_blank" rel="noreferrer">RFC 8683: NAT64/464XLAT deployment guidance</a></li>
      </ul>
    </article>
  );
}
