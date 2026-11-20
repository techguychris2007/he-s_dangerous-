import Callout from '../../components/lesson/Callout';

export default function NetworkSegmentationVlansAndFirewalls() {
  return (
    <div className="prose-hh">
      <h1>Network Segmentation, VLANs &amp; Firewalls</h1>
      <p>
        Segmentation divides a network into smaller areas and controls which communications may cross the
        boundaries between them. It limits accidental exposure, contains compromised devices, and makes
        network behavior easier to understand. This lesson starts with the path a packet follows, explains
        VLANs and routed boundaries, then builds up to firewall policy, cloud controls, logging, and safe
        verification. A diagram or VLAN number does not prove isolation; the forwarding path and the policy
        applied to it do.
      </p>

      <h2>Start with the terms: what exactly is being separated?</h2>
      <p>
        A <strong>network segment</strong> is a group of systems that share a communication boundary or policy.
        A <strong>broadcast domain</strong> is the set of Layer 2 devices that receive a particular Ethernet
        broadcast. A <strong>VLAN</strong> creates a logical Layer 2 broadcast domain on compatible switches.
        An <strong>IP subnet</strong> is a Layer 3 address range, such as <code>10.20.30.0/24</code>. A
        firewall or router policy makes decisions about traffic crossing a boundary. These terms are related,
        but they are not synonyms.
      </p>
      <p>
        A common design assigns one IP subnet to one VLAN, which makes the layout easier to operate. This is a
        convention, not a law of networking. Hosts need a Layer 3 gateway to communicate with a different IP
        subnet. A device that routes between segments is a natural place to apply policy. But hosts can talk
        directly to peers on their own subnet without crossing that router, so a router firewall alone does
        not isolate every system in the same Layer 2 segment.
      </p>
      <pre><code>
Client in VLAN 20 / 10.20.20.25
  | Ethernet frame addressed to the default gateway MAC
  v
Access switch (places the client port in VLAN 20)
  | 802.1Q trunk carries VLAN 20 toward the routing device
  v
Layer 3 gateway / firewall
  | checks route, policy, connection state, and possibly identity
  v
Server in VLAN 40 / 10.20.40.18

If client and server share a VLAN and subnet, the client can send directly
at Layer 2. The inter-VLAN firewall is not on that path.
      </code></pre>
      <p>
        When troubleshooting, draw the actual path before editing policy. Identify both endpoints, their
        addresses, VLAN or cloud subnet, gateways, and every device that can route or filter the traffic. A
        firewall rule cannot affect a path that bypasses that firewall.
      </p>

      <h2>How VLAN tagging works</h2>
      <p>
        Ethernet switches learn which MAC addresses are reachable on which ports and forward frames inside a
        VLAN. IEEE 802.1Q adds a VLAN tag to frames carried across a trunk. The VLAN identifier is 12 bits;
        values 0 and 4095 are reserved, leaving VLAN IDs 1 through 4094 available for configured VLANs.
        Ordinary end-host traffic on an access port is usually untagged. The switch associates that port with
        its configured access VLAN. On a trunk, the switch carries multiple VLANs over one physical link,
        tagging frames so the next switch or router can keep them separate.
      </p>
      <pre><code>
Access port (typical workstation connection)
  - assigned to one access VLAN
  - workstation normally sends ordinary, untagged Ethernet frames
  - switch associates received frames with that port's VLAN

Trunk port (typical switch-to-switch or switch-to-router connection)
  - carries a configured set of VLANs over one physical link
  - tagged frames identify their VLAN using 802.1Q
  - a native VLAN may carry untagged traffic, depending on configuration
  - both ends must agree on trunking, allowed VLANs, and native VLAN policy
      </code></pre>
      <p>
        A VLAN limits Layer 2 broadcast propagation. It does not encrypt frames, authenticate users, or by
        itself filter every conversation. A host on VLAN 20 is a member of that Layer 2 domain. To protect
        services in another VLAN, configure the Layer 3 path to allow only required flows. To restrict
        conversations between devices inside one VLAN, consider host firewalls, switch access controls,
        private-VLAN features, or a design that routes those devices through an enforceable policy point.
      </p>

      <h2>Trunk scope, native VLANs, and the VLAN-hopping myth</h2>
      <p>
        A trunk should carry only the VLANs that need to cross that link. A broad allowed-VLAN list can make
        future configuration mistakes affect more of the network. The native VLAN determines how a switch
        handles untagged frames on an 802.1Q trunk; mismatched native VLANs can cause traffic leaks,
        spanning-tree inconsistencies, or confusing failures. Keep the setting consistent at both ends and
        avoid using a user or sensitive workload VLAN for untagged trunk traffic.
      </p>
      <p>
        VLAN hopping is often presented as though any attacker on an access port can routinely cross VLANs.
        That overstates the risk. Classic switch-spoofing depends on trunk negotiation being enabled and
        accepted by the switch configuration. Double-tagging depends on a particular combination of native
        VLAN behavior, frame handling, and topology; the classic technique generally does not provide a
        normal bidirectional session. These techniques explain why trunks must be deliberate, but they do not
        replace checking the actual switch model, software release, port mode, and forwarding configuration.
      </p>
      <p>
        On Cisco platforms that support Dynamic Trunking Protocol (DTP), check the release-specific defaults
        and negotiation state rather than assuming every switch behaves alike. Configure an endpoint port as
        a non-trunk/access port when it is not intended to be a trunk. A real switch-to-switch trunk should be
        explicitly configured at both ends, have an approved VLAN allowlist, and use a reviewed native-VLAN
        policy. Do not blindly change a production trunk: it may carry legitimate voice, management, or
        spanning-tree traffic. Cisco's current guide documents platform-specific behavior.
      </p>
      <Callout variant="tip">
        <p>
          Practical review questions: Which device owns this port? What VLAN is assigned? Does this link need
          to be a trunk? Which VLANs must cross it? What is the native VLAN at both ends? How will you confirm
          the change and restore the previous state if an approved device stops communicating? These are safer
          than applying a universal recipe without understanding the switch and its control traffic.
        </p>
      </Callout>

      <h2>Inter-VLAN routing creates a policy boundary</h2>
      <p>
        Hosts on different IP subnets send traffic to a default gateway. The gateway routes toward the
        destination subnet. A router may simply forward packets, or an inline firewall may inspect and enforce
        policy. Some switches also perform Layer 3 routing, so “it is a switch” does not mean that traffic is
        not routed. Confirm the device's role and the path used by the specific flow.
      </p>
      <p>
        Describe policy as required flows rather than vague labels such as “internal” or “trusted.” For each
        flow, record the source group, destination group, protocol, destination port, direction, business
        purpose, owner, and expected lifetime. For example, a web tier might accept HTTPS from a load
        balancer and connect to one database service. It should not receive unrestricted access to employee
        laptops merely because both networks use private addresses.
      </p>
      <pre><code>
Training application with three security zones

Internet users       -&gt; public load balancer : TCP/443   required
Load balancer        -&gt; web service          : TCP/8443  required
Web service          -&gt; database             : TCP/5432  required
Admin workstation    -&gt; management gateway   : TCP/22    approved admins only
Web service          -&gt; employee endpoints   : any       not required
Database             -&gt; Internet             : any       not required by design

These are decisions for this example, not universal facts. Validate the
application's real dependencies before enforcing them.
      </code></pre>
      <p>
        The matrix exposes hidden dependencies early: DNS, time synchronization, certificate validation,
        software updates, monitoring, backups, identity providers, and message queues. If those are forgotten,
        a default-deny rollout can break the application. Discover dependencies through system owners,
        architecture, existing rules, application traces, and time-bounded flow logs; then validate them in a
        test or staged environment.
      </p>

      <h2>Firewall types and connection state</h2>
      <p>
        A <strong>stateless packet filter</strong> evaluates each packet independently using fields such as
        source and destination address, protocol, and port. It does not remember that an earlier packet began
        a connection. A <strong>stateful firewall</strong> tracks connection state, so it can recognize response
        traffic for an allowed connection. An <strong>application proxy</strong> terminates one connection and
        creates another, allowing it to make decisions using application-layer information. A next-generation
        firewall may combine state tracking with application identification, threat inspection, identity, and
        other controls. Capabilities vary by product and configuration.
      </p>
      <p>
        Stateful does not mean secure by default, nor that all return packets are harmless. It means the
        firewall tracks traffic according to its state model and policy. A firewall can permit a new inbound
        connection, an outbound connection, or both. Stateful inspection is not equivalent to application
        authorization: an allowed TCP session can still carry a request that the application should reject.
      </p>
      <p>
        Rule evaluation is product-specific. Some access-control lists use ordered rules where the first match
        decides the result. Cloud security groups commonly aggregate allow rules and have no ordered deny rule.
        Other systems use policy priorities, rule groups, or separate stateless and stateful engines. Read the
        documentation for the exact enforcement point; do not assume every firewall uses the same
        top-to-bottom, first-match model.
      </p>
      <pre><code>
Example: web-01 (10.40.2.15) -&gt; db-01 (10.40.4.20), TCP/5432

1. Is the route from web-01 to db-01 present and selected?
2. Which gateway or inspection point handles that route?
3. Is the source the expected web-service identity or workload group?
4. Does policy permit TCP destination port 5432 to this database?
5. Is a network ACL or other subnet control also evaluated?
6. Does the database host firewall accept the flow?
7. Is the service listening on the expected address and port?
8. Can the response return through the expected route and state table?
9. Do logs or counters show where the flow was allowed or denied?
      </code></pre>

      <h2>Default deny is a policy design, not a magic setting</h2>
      <p>
        In a default-deny design, a flow is denied unless a rule explicitly permits it. This reduces exposure
        from services no one intended to publish. A broad default-allow policy with selected blocks may be
        easier to start, but forgotten restrictions become dangerous. Default deny only works when required
        flows are known and the enforcement point sees them. Denying everything can make a service unusable;
        availability and safety still matter.
      </p>
      <p>
        A mature rollout inventories traffic, groups similar workloads, writes narrowly scoped rules, tests in
        a non-production or canary environment, observes denies, and rolls out in stages. Each rule should have
        an owner, reason, review date, and removal condition. Temporary rules should expire automatically
        where supported. Remove unused rules only after checking a representative period that includes
        monthly jobs, disaster-recovery exercises, and infrequent administration.
      </p>

      <h2>Cloud security groups and network ACLs: two different AWS controls</h2>
      <p>
        In Amazon VPC, security groups are associated with supported resources or network interfaces. They
        control allowed inbound and outbound traffic and are stateful. Multiple security groups associated
        with a resource contribute allow rules, so adding a restrictive-looking group does not cancel an allow
        granted by another group. Security groups support allow rules rather than explicit deny rules.
      </p>
      <p>
        A network ACL (NACL) is associated with a subnet and evaluates traffic entering and leaving that
        subnet. NACL rules include allow and deny actions and are checked in ascending rule-number order until
        a matching rule is found. NACLs are stateless: if inbound traffic is allowed, its return path needs its
        own outbound rule, and vice versa. This is a common cause of broken connections when a narrow NACL is
        introduced without accounting for client-side ephemeral ports and both directions of the conversation.
      </p>
      <table>
        <thead>
          <tr><th>Property</th><th>AWS security group</th><th>AWS network ACL</th></tr>
        </thead>
        <tbody>
          <tr><td>Applied to</td><td>Supported resource or network interface</td><td>Subnet</td></tr>
          <tr><td>State</td><td>Stateful; response traffic is tracked</td><td>Stateless; both directions need policy</td></tr>
          <tr><td>Rule actions</td><td>Allow rules</td><td>Allow and deny rules</td></tr>
          <tr><td>Evaluation</td><td>Combined allow rules; no first-match deny list</td><td>Ascending rule number; first matching rule applies</td></tr>
          <tr><td>Typical use</td><td>Resource-level access policy</td><td>Subnet-level additional boundary</td></tr>
        </tbody>
      </table>
      <p>
        Example: an approved administrator connects to a private host over SSH. A security group can allow
        TCP/22 from the administrator's known source range; response packets are tracked. If a subnet NACL is
        also in the path, its inbound rule must permit the connection and its outbound rules must permit
        response packets to the client's actual source port range. Do not copy a broad ephemeral-port range
        from a random example without confirming client behavior and cloud guidance. The same packet may be
        subject to route tables, security groups, NACLs, host firewalls, and application authentication, each
        solving a different part of the problem.
      </p>
      <Callout variant="warn">
        <p>
          In AWS, a deny rule in one security group does not override an allow from another security group.
          Review every group attached to the resource. For NACLs, a matching lower-numbered allow can prevent
          a later deny from being reached. Test effective behavior, not just the visual appearance of one
          rule list.
        </p>
      </Callout>

      <h2>Segmentation in a zero-trust architecture</h2>
      <p>
        Traditional perimeter security often treated the internal network as trusted. Modern systems span
        offices, cloud networks, SaaS, remote endpoints, containers, and service-to-service APIs, so network
        location alone is a weak identity signal. NIST's Zero Trust Architecture guidance says access should
        not be implicitly trusted solely because an account or device is on an internal LAN; authentication
        and authorization are evaluated for the resource being accessed.
      </p>
      <p>
        Segmentation remains useful in a zero-trust program: it limits reachable paths and can contain
        compromise. It is one layer, not the whole architecture. A stronger design combines network policy
        with verified user and workload identity, least privilege, short-lived credentials, application
        authorization, and useful telemetry. In cloud-native applications, microsegmentation can express
        service-to-service policy at a finer level than a large subnet boundary. It still needs a reliable
        identity source and a plan for observing and maintaining policy as services change.
      </p>

      <h2>Do not forget IPv6, DNS, and alternate paths</h2>
      <p>
        Review both IPv4 and IPv6 when both are enabled. Blocking an IPv4 path while leaving an equivalent
        IPv6 route open is a policy gap. Also check VPNs, peering, private endpoints, load balancers,
        service meshes, management networks, wireless, and alternate routes around the firewall under review.
        The previous IPv6 lesson covers address and neighbor-discovery behavior; here the operational point is
        to keep policy intent consistent across address families.
      </p>
      <p>
        Network access depends on services that are easy to omit from a flow matrix: DNS, DHCP, time
        synchronization, certificate validation, identity providers, endpoint management, monitoring, logging,
        and software repositories. DNS filtering also requires care: applications may use approved resolvers,
        encrypted DNS, or hard-coded endpoints, and cloud platforms can have provider-managed resolver paths
        that ordinary subnet rules do not control. Identify the supported path before writing a deny rule.
      </p>

      <h2>Observe and verify policy safely</h2>
      <p>
        Check both the intended positive case and a nearby negative case: an approved application can reach
        its database on the documented port, while an unrelated workstation cannot. Use a test environment or
        explicitly authorized lab systems. Record source, destination, time, protocol, result, and policy
        decision. A failed connection alone does not prove a firewall blocked it; the service could be stopped,
        DNS could be wrong, a route could be missing, or the return path could be asymmetric.
      </p>
      <pre><code>
# Inspect local addresses, interfaces, and route selection
ip -br address
ip route
ip route get 192.0.2.20

# Show listening TCP/UDP sockets and owning processes (permissions vary)
ss -lntup

# Inspect neighbor-cache entries; this is not a substitute for route review
ip neigh

# In an authorized lab, capture only the named interface and test flow.
# Use your lab's interface and target, not an unrelated network.
sudo tcpdump -ni eth0 'host 192.0.2.20 and tcp port 8443'

# Stop with Ctrl-C. Protect capture files: they can contain sensitive data.
      </code></pre>
      <p>
        These commands inspect the local host or observe traffic you are authorized to monitor. They do not
        grant permission to scan another network. Packet capture can reveal names, addresses, timing, and
        sometimes application data; minimize the capture filter, restrict access to saved files, and dispose
        of them under lab retention rules. Cloud flow logs generally describe metadata about flows. They are
        not full packet captures and cannot show application payload or prove what a user did inside an
        encrypted session.
      </p>

      <h2>Worked investigation: a service cannot reach its database</h2>
      <p>
        A web service in <code>10.40.2.0/24</code> cannot connect to a database in
        <code>10.40.4.0/24</code> on TCP/5432 after a segmentation change. Work from the packet path outward
        rather than adding a broad allow rule:
      </p>
      <ol>
        <li>Confirm the application is configured with the intended database hostname and port.</li>
        <li>Resolve the hostname from the web host and verify it returns the expected private address.</li>
        <li>Check that the database listens on the intended interface and its host firewall allows the web tier.</li>
        <li>Inspect the web host's route; confirm it uses the expected gateway and no alternate path.</li>
        <li>Check the source identity and effective security-group or firewall policy on both endpoints.</li>
        <li>Check subnet-level ACLs in both directions, including response traffic if the control is stateless.</li>
        <li>Review flow records, rule counters, or firewall logs at each enforcement point for an allow or deny.</li>
        <li>Test the exact authorized flow, then test that a similar unauthorized source remains blocked.</li>
        <li>Document evidence and policy changes; remove temporary test access after verification.</li>
      </ol>
      <p>
        If packets leave the web host but do not appear at the database subnet, investigate routing and
        intermediate policy. If packets arrive but no response leaves, inspect the listener, host firewall,
        and return route. If both directions are visible but the application still fails, check TLS,
        authentication, database grants, and application logs. This layered method avoids confusing a network
        symptom with an application failure.
      </p>

      <h2>Common mistakes and how to reason about them</h2>
      <ul>
        <li><strong>“Different VLANs means isolated.”</strong> They are separated at Layer 2, but a router or Layer 3 switch may route between them with permissive policy.</li>
        <li><strong>“Private IP means trusted.”</strong> Private addressing is not authentication and does not prove the sender is safe.</li>
        <li><strong>“The firewall says allow, so the app should work.”</strong> Routing, return traffic, host firewalls, listeners, TLS, identity, and application authorization still matter.</li>
        <li><strong>“All firewalls process rules top to bottom.”</strong> Semantics differ. Know whether the control is ordered, additive, stateful, or split into multiple engines.</li>
        <li><strong>“Add a restrictive cloud group to deny traffic.”</strong> AWS security-group allow rules aggregate; another group does not cancel an allow.</li>
        <li><strong>“A NACL rule for the server port is enough.”</strong> NACLs are stateless, so consider both directions.</li>
        <li><strong>“The IPv4 rule covers the service.”</strong> A dual-stack service needs equivalent IPv6 review and tests.</li>
        <li><strong>“A packet capture is harmless.”</strong> Captures can contain sensitive metadata or data; scope, protect, and dispose of them carefully.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>
          Two hosts share a subnet and VLAN. Will their traffic necessarily pass through the router firewall?
          <strong>No.</strong> They may communicate directly at Layer 2. Verify the path; use host or switch
          controls if same-segment isolation is required.
        </li>
        <li>
          Why does a subnet NACL need an outbound rule when inbound SSH is permitted?
          <strong>Because it is stateless.</strong> The response is a separate direction and must match an
          outbound rule; the client source port also matters.
        </li>
        <li>
          If one AWS security group allows TCP/5432 and another has no matching rule, does the second deny it?
          <strong>No.</strong> Security-group allow rules are combined; groups do not provide explicit deny
          that overrides the allow.
        </li>
        <li>
          Does a VLAN provide encryption or user identity? <strong>No.</strong> It creates a Layer 2 logical
          broadcast domain; encryption, identity, authorization, and routed policy are separate controls.
        </li>
        <li>
          What evidence distinguishes a firewall drop from a stopped service? <strong>Correlate route,
          flow-log or rule-counter evidence, packet observations at both ends, listener status, and
          application logs.</strong> One failed client connection is not enough.
        </li>
      </ol>

      <h2>Key takeaways</h2>
      <p>
        VLANs divide Layer 2 broadcast domains; subnets describe Layer 3 address ranges; routers and firewalls
        govern flows between routed networks. Secure design begins with real application dependencies,
        permits only justified source-to-destination flows, and verifies both successful and blocked behavior
        along the actual packet path. Cloud controls have distinct scope and state models, IPv4 and IPv6 must
        be reviewed together, and network location by itself does not establish trust.
      </p>

      <h2>Further reading from primary sources</h2>
      <ul>
        <li><a href="https://csrc.nist.gov/pubs/sp/800/207/final" target="_blank" rel="noreferrer">NIST SP 800-207: Zero Trust Architecture</a></li>
        <li><a href="https://csrc.nist.gov/pubs/sp/800/207/A/final" target="_blank" rel="noreferrer">NIST SP 800-207A: Zero Trust for cloud-native applications</a></li>
        <li><a href="https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/vlan/vlan-configuration-guide/configure-vlan-trunks.html" target="_blank" rel="noreferrer">Cisco IOS XE VLAN trunk configuration guide</a></li>
        <li><a href="https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html" target="_blank" rel="noreferrer">AWS: Control traffic with security groups</a></li>
        <li><a href="https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html" target="_blank" rel="noreferrer">AWS: Control subnet traffic with network ACLs</a></li>
        <li><a href="https://docs.aws.amazon.com/vpc/latest/userguide/nacl-examples.html" target="_blank" rel="noreferrer">AWS: Example security group and network ACL policies</a></li>
      </ul>
    </div>
  );
}
