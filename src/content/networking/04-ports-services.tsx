import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PortsServices() {
  return (
    <div className="prose-hh">
      <h1>Ports, Services, and Protocol Identification</h1>
      <p>
        Port numbers help computers deliver network traffic to the right application endpoint. They are
        useful clues during troubleshooting and security reviews, but a number alone does not prove which
        software is running or whether it is vulnerable. This lesson builds the model needed to read a
        listening-socket list, interpret a scan, identify a protocol safely, and record exposure without
        jumping from a port number to an unsupported exploit claim.
      </p>

      <h2>What a port identifies</h2>
      <p>
        An IP address identifies a network interface or destination on an IP network. A transport port
        identifies an application endpoint on that host. The transport protocol matters: TCP port 443 and
        UDP port 443 are different sockets, and a machine can use both. For each packet, the source port
        identifies the sender's endpoint and the destination port identifies the endpoint the sender wants
        to reach.
      </p>
      <p>
        A server process binds a socket to an address and port, then listens for connections or datagrams.
        It can bind to one specific interface or to a wildcard address that accepts traffic addressed to
        several local interfaces. A process bound only to loopback may be available to local programs but
        not to other machines. A process bound to all interfaces may still be unreachable because a host
        firewall, cloud security policy, router ACL, or upstream network blocks it. “Listening,”
        “reachable,” and “exposed to the Internet” describe different conditions.
      </p>
      <CodeBlock label="A network flow has two endpoints and a transport">{'TCP client 192.0.2.25:53014 -> server 198.51.100.40:443\n\nThe server listens on its local TCP port 443.\nThe client usually receives a temporary local source port, here 53014.\nA different client can connect to 198.51.100.40:443 at the same time.'}</CodeBlock>
      <p>
        Operating systems maintain separate socket state for separate flows. A server can accept many
        clients on the same listening port because each established connection has its own endpoint tuple.
        Network address translation may rewrite addresses or ports along the path; monitoring tools can
        therefore show different tuples at different observation points.
      </p>

      <h2>Port ranges and temporary client ports</h2>
      <p>
        IANA divides the 16-bit port-number space into assignment ranges. Ports 0–1023 are the
        <strong> System Ports</strong>, 1024–49151 are the <strong>User Ports</strong>, and 49152–65535 are
        the <strong>Dynamic and/or Private Ports</strong>. These ranges describe registry administration;
        they do not mean every operating system uses exactly 49152–65535 for temporary outbound sockets.
        The ephemeral range is configurable and varies by operating system and system policy.
      </p>
      <p>
        A client operating system selects an ephemeral source port when an application opens an outbound
        connection. The port helps distinguish simultaneous conversations and is returned to the pool
        according to operating-system rules. Servers commonly listen on stable destination ports so
        clients know where to connect. Both roles are conventions: a service can listen on a high port,
        and a client can bind a chosen source port when the application and permissions allow it.
      </p>
      <p>
        On many Unix-like systems, binding to a low-numbered port requires elevated privilege or a
        capability, but exact behavior is configurable. Do not use the IANA range boundary as a universal
        security boundary. A firewall should make decisions based on the required service, source, network
        zone, identity, and application policy.
      </p>

      <h2>Port numbers are conventions, not protocol proof</h2>
      <p>
        IANA's registry records assigned service names and port numbers. It is a useful starting reference,
        not a live inventory of a host and not proof that a service on a port follows the registered
        protocol. A web server may listen on TCP 8443, SSH may be moved to TCP 2222, and a custom
        application may use a number with a familiar registry name. Conversely, a port may be open but
        speak a different protocol than expected.
      </p>
      <p>
        Nmap's <code>-sV</code> service/version detection sends probes and compares responses with service
        signatures. It can improve identification, but fingerprints may be incomplete, obscured by a proxy,
        changed by configuration, or intentionally misleading. A banner is a claim made by a remote
        endpoint, not independent proof of software version. Confirm important findings with authenticated
        asset inventory, package data, configuration, or the service owner.
      </p>
      <Callout variant="tip">
        <p>
          Report what your evidence supports: “TCP/8443 accepted a TLS connection and returned an HTTP
          response with these headers” is more precise than “port 8443 is definitely product X and has
          vulnerability Y.” Separate observation, inference, and validation.
        </p>
      </Callout>

      <h2>Common services to recognize</h2>
      <p>
        The following ports are common examples, not an exhaustive checklist. Confirm the transport and
        application response. An open port is an inventory fact; risk depends on the service's purpose,
        software and configuration, authentication, network exposure, data, and compensating controls.
      </p>
      <table>
        <thead>
          <tr><th>Common port</th><th>Likely role to verify</th></tr>
        </thead>
        <tbody>
          <tr><td><code>TCP 20/21</code></td><td>FTP data/control. Determine whether it is required and whether protected transfer is used.</td></tr>
          <tr><td><code>TCP 22</code></td><td>SSH administration. Verify approved access paths, identities, keys, and authentication policy.</td></tr>
          <tr><td><code>TCP 23</code></td><td>Telnet. Investigate whether cleartext remote administration is still required.</td></tr>
          <tr><td><code>TCP 25</code></td><td>SMTP server-to-server mail transfer. Review relay policy and mail gateway role.</td></tr>
          <tr><td><code>TCP/UDP 53</code></td><td>DNS. Identify authoritative, recursive, or forwarding role and allowed clients.</td></tr>
          <tr><td><code>TCP 80</code></td><td>HTTP. Inspect application behavior and whether redirection or a proxy is expected.</td></tr>
          <tr><td><code>UDP 123</code></td><td>NTP. Identify the time source and restrict client access appropriately.</td></tr>
          <tr><td><code>UDP 161</code></td><td>SNMP. Check version, access policy, device role, and monitoring requirements.</td></tr>
          <tr><td><code>TCP 389</code></td><td>LDAP. Identify directory role and whether transport protection is enforced.</td></tr>
          <tr><td><code>TCP 443</code></td><td>HTTPS. Inspect TLS and application behavior; UDP 443 may carry QUIC/HTTP/3.</td></tr>
          <tr><td><code>TCP 445</code></td><td>SMB. Verify file-sharing need, network scope, signing, and identity policy.</td></tr>
          <tr><td><code>TCP 465/587</code></td><td>SMTP over TLS or mail submission. Confirm expected clients and relay behavior.</td></tr>
          <tr><td><code>TCP 636</code></td><td>LDAP over TLS (LDAPS). Verify certificates and directory policy.</td></tr>
          <tr><td><code>TCP 993/995</code></td><td>IMAP/POP over TLS. Identify mail-service ownership and allowed clients.</td></tr>
          <tr><td><code>TCP 1433</code></td><td>Common Microsoft SQL Server listener. Confirm database role and permitted application tiers.</td></tr>
          <tr><td><code>TCP 2049</code></td><td>NFS. Establish export scope, client network, and platform-specific access controls.</td></tr>
          <tr><td><code>TCP 3306</code></td><td>Common MySQL listener. Verify application dependencies and network reachability.</td></tr>
          <tr><td><code>TCP 3389</code></td><td>RDP. Confirm management path, identity controls, and required exposure.</td></tr>
          <tr><td><code>TCP 5432</code></td><td>Common PostgreSQL listener. Verify role, authentication, and application network boundaries.</td></tr>
          <tr><td><code>TCP 5985/5986</code></td><td>Windows Remote Management. Determine whether HTTP or HTTPS transport is intended.</td></tr>
          <tr><td><code>TCP 6379</code></td><td>Common Redis listener. Validate intended network scope and configured access controls.</td></tr>
          <tr><td><code>TCP 6443</code></td><td>Common Kubernetes API server port. Confirm cluster role and authorized control-plane clients.</td></tr>
          <tr><td><code>TCP 8080/8443</code></td><td>Alternate web or proxy listeners. Identify the actual application and owner.</td></tr>
          <tr><td><code>TCP 9200</code></td><td>Common Elasticsearch HTTP API port. Verify authentication, network scope, and data sensitivity.</td></tr>
          <tr><td><code>TCP 27017</code></td><td>Common MongoDB listener. Verify access controls, network scope, and operational purpose.</td></tr>
        </tbody>
      </table>
      <p>
        This list deliberately avoids describing a default password or unauthenticated database as a
        universal default. Product defaults have changed, installers differ, and administrators often
        customize them. For every service, check its current vendor documentation and the actual deployed
        configuration. In particular, do not assume that a database is exposed merely because its usual
        port appears in a scan, and do not assume that changing the port protects it.
      </p>

      <h2>Modern traffic can use familiar ports in unfamiliar ways</h2>
      <p>
        Port 443 is conventionally used for HTTPS over TCP, while HTTP/3 uses QUIC over UDP, commonly on
        UDP 443. A rule that allows TCP 443 does not automatically allow UDP 443. DNS may use UDP or TCP
        port 53, DNS over TLS commonly uses TCP 853, and DNS over HTTPS travels as HTTPS traffic. Some
        applications use dynamic port negotiation: RPC-based systems can contact a known endpoint mapper
        and then use additional ports selected by the service. A firewall policy must reflect the actual
        platform and required flows rather than relying on a short list of familiar numbers.
      </p>
      <p>
        Encrypted transports change what a passive observer can read. TLS protects application content
        after a successful handshake, subject to certificate validation and protocol configuration, but
        metadata such as addresses, ports, timing, and traffic volume may remain visible. Some TLS details
        may also be visible depending on protocol version, extensions, and deployment. Encryption does not
        make a service safe to expose; authentication, authorization, patching, and network policy remain
        necessary.
      </p>

      <h2>Read the listening sockets on your own host</h2>
      <p>
        Start locally when learning how ports work. A local socket listing can tell you which process is
        listening, which protocol it uses, and which local address it has bound. It does not by itself show
        whether a remote machine can reach that socket. Compare the listener with host firewall rules,
        cloud policy, routes, and a test from the intended network zone.
      </p>
      <CodeBlock label="Linux and Windows local listener inspection">{'Linux:\nss -lntup\n\nWindows PowerShell:\nGet-NetTCPConnection -State Listen | Sort-Object LocalPort\nGet-NetUDPEndpoint | Sort-Object LocalPort'}</CodeBlock>
      <p>
        In the Linux output, <code>-l</code> selects listening sockets, <code>-n</code> keeps numeric
        addresses and ports, <code>-t</code> selects TCP, <code>-u</code> selects UDP, and <code>-p</code>
        asks for process information where permissions allow. UDP has no TCP-style LISTEN state, so UDP
        socket tools show bound endpoints rather than a TCP state machine. Run with appropriate local
        privileges only when you need process ownership; do not elevate a command unnecessarily.
      </p>

      <h2>Identify a service in a controlled lab</h2>
      <p>
        For an authorized lab target, use a small port list first. Then inspect a specific service with the
        protocol-appropriate client. The examples below are for the assigned DarkWorld lab machine only;
        do not scan or connect to unrelated systems without explicit permission.
      </p>
      <CodeBlock label="Scoped service identification against the assigned lab">{'nmap -sV -p 22,80,443,8443 10.10.10.5\ncurl -I http://10.10.10.5/\ncurl -I https://10.10.10.5/\nopenssl s_client -connect 10.10.10.5:443 -servername lab.example'}</CodeBlock>
      <p>
        Nmap's version probes can be more intrusive than a basic reachability test, so follow the lab's
        rate and target guidance. <code>curl -I</code> requests HTTP headers; a server may reject HEAD or
        respond differently from GET. The TLS client shows certificate and negotiation details, but a
        test using an IP address may fail hostname validation unless a matching name is provided. Preserve
        the exact command, time, source network, response, and uncertainty in your notes.
      </p>
      <p>
        A banner-grab with a raw TCP client is not universal. Some services wait for the client to speak
        first, some require TLS, and some intentionally avoid revealing a version. Do not paste arbitrary
        data into a production service just to see what it does. Use protocol-aware clients and the
        designated lab.
      </p>

      <h2>How to assess an exposed service</h2>
      <ol>
        <li>
          <strong>Confirm the observation.</strong> Record address, transport, port, timestamp, scan
          vantage point, probe, and response. Repeat a narrow check if packet loss or a transient failure
          could explain the result.
        </li>
        <li>
          <strong>Identify ownership and purpose.</strong> Match the endpoint to an asset record, process,
          container, cloud resource, business service, and named owner.
        </li>
        <li>
          <strong>Confirm the protocol and product.</strong> Use safe application-level checks, authenticated
          inventory, package data, deployment manifests, and vendor support information.
        </li>
        <li>
          <strong>Map reachability.</strong> Test from the appropriate internal and external vantage points.
          Review host firewall, cloud security groups, network ACLs, load balancers, NAT, and upstream
          filtering. A result from one network does not describe every path.
        </li>
        <li>
          <strong>Review identity and configuration.</strong> Check whether authentication is required,
          authorization is least-privilege, administrative access is restricted, transport protection is
          correct, and logging is enabled.
        </li>
        <li>
          <strong>Evaluate current risk evidence.</strong> Confirm the exact product build and configuration
          before comparing with vendor advisories or vulnerability databases. A service name, port, or
          guessed banner is not enough to establish exposure to a specific vulnerability.
        </li>
        <li>
          <strong>Recommend a proportionate change.</strong> Remove listeners that are not needed; otherwise
          restrict source networks, identity, and service permissions, patch supported software, monitor
          use, and test dependent workflows.
        </li>
      </ol>
      <p>
        This sequence is for inventory and validation. A port review should remain focused on the concept
        being studied: discovering what is listening, understanding the protocol, and validating the
        allowed boundary. It does not require learners to perform exploitation, remediation handoff, or a
        full engagement process in this lesson.
      </p>

      <h2>Common interpretation errors</h2>
      <ul>
        <li>
          <strong>“The port is open, so the application is vulnerable.”</strong> Open means a probe received
          a response consistent with a service. Vulnerability depends on product, version, configuration,
          exposure, and applicable security controls.
        </li>
        <li>
          <strong>“The port is filtered, so the service is absent.”</strong> Filtering hides the service's
          state from this vantage point. The application may be listening behind a firewall.
        </li>
        <li>
          <strong>“The expected port is open, so the expected service is running.”</strong> A service can
          use another port, and a familiar port can carry another protocol. Validate the response.
        </li>
        <li>
          <strong>“The banner tells me the exact version.”</strong> Banners can be hidden, proxied, stale,
          customized, or intentionally misleading. Confirm through trusted inventory.
        </li>
        <li>
          <strong>“The port is not exposed externally, so it is safe.”</strong> Internal exposure may still
          permit a compromised workload or untrusted subnet to reach it. Use segmentation and identity
          controls appropriate to the data and service.
        </li>
      </ul>

      <h2>Check your understanding</h2>
      <ol>
        <li>
          If TCP 443 is reachable, does that prove UDP 443 is reachable? <strong>No.</strong> They are
          separate transport protocols and usually need separate policy decisions.
        </li>
        <li>
          Does the IANA registry prove what a host is running? <strong>No.</strong> It lists assignments;
          the actual endpoint must be identified.
        </li>
        <li>
          Can a service listen on a high port? <strong>Yes.</strong> Port numbers are conventions; local
          permissions and policy may affect what it can bind.
        </li>
        <li>
          Does a local listening-socket listing prove the service is reachable remotely?
          <strong>No.</strong> Host, cloud, and network policy can block the path.
        </li>
        <li>
          What should be confirmed before claiming a particular CVE affects an observed service?
          <strong>The product, exact supported build, relevant configuration, advisory conditions, and
          reachable attack surface.</strong> A port number or guessed banner is not sufficient.
        </li>
      </ol>

      <h2>Key takeaways</h2>
      <p>
        A port is an endpoint number interpreted together with its transport protocol and host. IANA
        assignment ranges are not identical to every operating system's ephemeral-port configuration.
        Port-to-service associations help generate questions but do not identify software by themselves.
        Combine a narrow, authorized network observation with local inventory, protocol-aware validation,
        network policy review, and accurate uncertainty before drawing conclusions.
      </p>

      <h2>Primary references</h2>
      <ul>
        <li><a href="https://www.rfc-editor.org/rfc/rfc6335" target="_blank" rel="noreferrer">RFC 6335: Service Name and Port Number Registry Procedures</a></li>
        <li><a href="https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml" target="_blank" rel="noreferrer">IANA Service Name and Transport Protocol Port Number Registry</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc6056" target="_blank" rel="noreferrer">RFC 6056: Recommendations for Transport-Protocol Port Randomization</a></li>
        <li><a href="https://www.rfc-editor.org/rfc/rfc9000" target="_blank" rel="noreferrer">RFC 9000: QUIC Transport Protocol</a></li>
        <li><a href="https://nmap.org/book/man-version-detection.html" target="_blank" rel="noreferrer">Nmap Network Scanning: Service and Version Detection</a></li>
      </ul>
    </div>
  );
}
