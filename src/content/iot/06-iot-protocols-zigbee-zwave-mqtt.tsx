import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const zigbeeFlow = [
  'Device (not yet trusted)       Trust Center / coordinator',
  '       |                                  |',
  '       |-- join request, identity ------->|',
  '       |                                  | Is joining open?',
  '       |                                  | Is this device expected?',
  '       |                                  | Which key policy applies?',
  '       |<-- protected key delivery -------|',
  '       |                                  |',
  '       |-- authenticated network traffic ->|',
  '',
  'Review questions:',
  '- Was joining intentionally enabled for a short commissioning window?',
  '- Did the Trust Center match the device to an expected identity?',
  '- Was a device-specific installation code/link key available and used?',
  '- How are lost, replaced, reset, or retired devices removed?',
].join('\n');

const zwaveRecord = [
  'Device: hallway-lock-01',
  'Expected role: access-control actuator',
  'Controller record: identity and inclusion timestamp',
  'Negotiated class: S2 Access Control (verify from controller evidence)',
  'DSK check: compared with the label or QR on the physical device',
  'Firmware: vendor version and update status recorded',
  'Join window: closed after planned installation',
  'Retirement: device removed and key material revoked',
  '',
  'If the record instead shows S0, S2 Unauthenticated, an unknown identity,',
  'or an unexplained re-inclusion, preserve evidence and investigate the',
  'specific controller and product. Do not test a production lock without',
  'written authorization and a safe change window.',
].join('\n');

const mqttAcl = [
  '# Example ACL policy for a disposable local lab. Check your broker version.',
  '# A telemetry reader can observe only the synthetic lab namespace.',
  'user lab-reader',
  'topic read dw-lab/telemetry/+',
  '',
  '# A simulated sensor may publish only its own synthetic reading.',
  'user sensor-17',
  'topic write dw-lab/telemetry/sensor-17',
  '',
  '# A dashboard can read telemetry but does not receive publish permission.',
  'user lab-dashboard',
  'topic read dw-lab/telemetry/#',
  '',
  '# Keep command topics separate and tightly controlled.',
  '# Do not grant broad read/write rights unless a role truly needs them.',
].join('\n');

const localTest = [
  '# Terminal 1: harmless synthetic data to the local broker.',
  'mosquitto_pub -h 127.0.0.1 -p 1883 \\',
  "  -u sensor-17 -P 'LAB_ONLY_TEST_SECRET' \\",
  "  -t 'dw-lab/telemetry/sensor-17' \\",
  "  -m 'synthetic-temperature-reading'",
  '',
  '# Terminal 2: the reader can receive this lab topic.',
  'mosquitto_sub -h 127.0.0.1 -p 1883 \\',
  "  -u lab-reader -P 'LAB_ONLY_TEST_SECRET' \\",
  "  -t 'dw-lab/telemetry/sensor-17' -C 1 -v",
  '',
  '# Negative test: a reader should not publish.',
  'mosquitto_pub -h 127.0.0.1 -p 1883 \\',
  "  -u lab-reader -P 'LAB_ONLY_TEST_SECRET' \\",
  "  -t 'dw-lab/telemetry/sensor-17' -m 'unauthorized-write-test'",
  '',
  '# Negative test: a sensor must not publish as another device.',
  'mosquitto_pub -h 127.0.0.1 -p 1883 \\',
  "  -u sensor-17 -P 'LAB_ONLY_TEST_SECRET' \\",
  "  -t 'dw-lab/telemetry/sensor-99' -m 'wrong-device-test'",
].join('\n');

export default function IotProtocolsZigbeeZwaveMqtt() {
  return (
    <article className="prose-hh">
      <h1>IoT Communication Security: Zigbee, Z-Wave, and MQTT</h1>
      <p>
        Internet of Things (IoT) systems connect small devices, radio networks, gateways, message brokers,
        cloud services, and user applications. A temperature sensor may use a low-power radio to reach a home
        hub; the hub may send an event to a cloud service over IP. Each link has its own identity, encryption,
        authorization, and failure modes. Understanding where a protocol operates is more useful than memorizing
        a port number: a radio capture, a gateway configuration review, and a broker access-control review expose
        different parts of the system.
      </p>

      <h2>Learning goals and prerequisites</h2>
      <p>
        By the end of this lesson, you should distinguish a Zigbee network key from a Trust Center link key,
        explain the purpose of Zigbee installation codes, describe Z-Wave S2 classes and device-specific keys,
        trace an MQTT publish/subscribe exchange, and assess a broker’s identity, transport, and topic
        permissions. The terms below establish the necessary foundation before we go further.
      </p>
      <ul>
        <li><strong>Authentication</strong> answers “which device or user is this?” It may use a password,
          certificate, hardware identity, or pairing secret.</li>
        <li><strong>Authorization</strong> answers “what may this authenticated identity do?” A sensor that can
          publish its own readings should not automatically be allowed to control a lock.</li>
        <li><strong>Encryption</strong> makes captured traffic unreadable without a key. It does not prove that
          the peer is trustworthy or authorized to publish a command.</li>
        <li><strong>Commissioning</strong> is the controlled process that enrolls a device into a network and
          establishes identity and keys. Setup windows and recovery modes are security-sensitive states.</li>
        <li><strong>Broker</strong> is the MQTT server that accepts clients and routes publications to
          subscribers whose topic filters are permitted.</li>
      </ul>

      <h2>1. Zigbee architecture: radio, mesh, and Trust Center</h2>
      <p>
        Zigbee is a low-power networking stack used for sensors, lighting, and control devices. A conventional
        mesh has a coordinator that forms the network, routers that relay traffic, and end devices such as
        battery-powered sensors that may sleep between reports. IEEE 802.15.4 provides the radio link. Zigbee
        adds network-layer routing and security, application-layer clusters and commands, and a centralized
        Trust Center role that manages joining and security policy.
      </p>
      <p>
        “Network key” and “link key” are not interchangeable. A network key protects network-layer traffic for
        members of a network. Devices that possess it may be able to create or inspect network-layer frames,
        subject to protocol details and other controls. A Trust Center link key protects security exchanges
        between a particular device and the Trust Center. Application Support (APS) link keys can provide
        pairwise protection between endpoints when the profile and implementation use them. The selected
        security policy determines which keys are used and what access a key holder receives; do not assume
        every deployment uses one identical key arrangement.
      </p>
      <CodeBlock label="Zigbee joining: security decisions to verify">{zigbeeFlow}</CodeBlock>
      <p>
        Zigbee specifications define a well-known global Trust Center link key for compatibility, but that does
        not mean every modern device uses it or every join is exposed. Implementations may support
        installation-code-derived keys, dynamic link keys, or other policies. An installation code is
        provisioned for an individual device and conveyed to the Trust Center through a separate channel. The
        Trust Center uses it to derive a link key that protects delivery of network credentials. Security
        depends on whether the product enables that flow, how the code is protected during manufacturing and
        setup, and how commissioning is controlled.
      </p>
      <Callout variant="tip">
        <p>
          A packet capture during pairing does not automatically reveal a network key. Identify the joining
          policy, key type, and device implementation first. A defensible finding says which exchange was
          observed and what it proves; it does not infer that all traffic is readable because a known key exists
          in the specification.
        </p>
      </Callout>

      <h3>Zigbee assessment: what evidence is useful?</h3>
      <p>
        A passive assessment can record channel, PAN identifier, observed device addresses, beacon and join
        activity, security headers, frame counters, and whether the network repeatedly accepts joins. These
        observations characterize a network but do not alone prove that a key was recovered or a command was
        accepted. With authorization for gateway review, inspect commissioning policy, the installation-code
        workflow, device inventory, key rotation, and decommissioning. Never attempt to pair an unknown device
        with a production network.
      </p>
      <p>
        Zigbee analysis requires a compatible IEEE 802.15.4 radio and supported capture software. Select hardware
        based on frequency band, regional rules, channel support, and the analyzer’s current device matrix.
        Ubertooth is Bluetooth-focused hardware, not a Zigbee sniffer. Older CC2531 setups appear in historical
        research, but hardware and firmware support varies; verify compatibility instead of treating one adapter
        as universal. A lab may use a vendor network analyzer or a software trace from a development gateway.
      </p>

      <h2>2. Z-Wave: inclusion and security classes</h2>
      <p>
        Z-Wave is a low-power mesh protocol commonly used in residential automation. A controller coordinates
        membership and routing; devices expose capabilities through command classes. The central defensive
        questions are how the product is included, what security class is negotiated, and whether the user
        verifies that the physical device being enrolled is the expected device.
      </p>
      <p>
        Z-Wave S2 defines Access Control, Authenticated, and Unauthenticated security classes. These classes use
        distinct keys and represent different trust requirements. Access Control is intended for sensitive
        actuators such as locks; Authenticated is intended for devices whose enrollment can be verified; and
        Unauthenticated supports constrained enrollment interfaces with weaker assurance. During secure
        inclusion, a Device-Specific Key (DSK) helps the controller and user confirm device identity. A DSK may
        appear as digits or in a QR code, so control of the product label, packaging, and enrollment interface
        is part of the trust chain.
      </p>
      <p>
        Security 0 (S0) is an older framework and is a compatibility concern when it appears in an inventory.
        S2 is the modern framework supported by current certified product generations; actual support and
        negotiated class depend on the controller and node. Avoid claiming that an attacker can universally
        force an S2-to-S0 downgrade. During an authorized review, record the negotiated class and whether the
        controller surfaced a warning when weaker security was selected.
      </p>
      <CodeBlock label="Example Z-Wave enrollment record for a sensitive actuator">{zwaveRecord}</CodeBlock>

      <h2>3. MQTT: messages, topics, and broker permissions</h2>
      <p>
        MQTT is a lightweight publish/subscribe protocol. A producer publishes a payload to a topic such as
        <code>site-a/boiler-3/temperature</code>; consumers subscribe to topic filters and receive matching
        publications through a broker. Publishers need not know which consumers exist. This loose coupling helps
        constrained and unreliable networks, but it makes the broker a central security boundary.
      </p>
      <p>
        MQTT topic names are not automatically protected resources. The broker implementation and configuration
        decide which authenticated client may connect, subscribe, publish, use a client identifier, or access a
        retained message. A successful password check is authentication; topic ACLs are authorization. A policy
        should constrain both directions: sensor identities publish only their own telemetry, dashboards
        subscribe only to the required site, and command publishers have separate, narrowly scoped permissions.
        A broad subscription such as <code>#</code> may disclose many topics, so brokers should restrict broad
        filters.
      </p>
      <p>
        MQTT versions 3.1.1 and 5.0 define protocol behavior; they do not require every broker to use the same
        identity store or authorization policy. MQTT 5 adds enhanced authentication flows and richer reason
        codes, but deployments still need an appropriately configured broker. TLS protects a connection in
        transit and can support certificate-based client authentication. It does not replace authorization,
        device identity lifecycle, or safe credential handling.
      </p>
      <h3>MQTT features that affect incident impact</h3>
      <ul>
        <li><strong>QoS 0, 1, and 2:</strong> delivery behavior trades overhead for delivery guarantees; these
          levels are not confidentiality settings. QoS 1 may deliver more than once, so applications should
          tolerate duplicates where necessary.</li>
        <li><strong>Retained messages:</strong> the broker may store the latest retained publication and send it
          to a new subscriber. A stale or sensitive value can outlive the original session.</li>
        <li><strong>Persistent sessions and queued messages:</strong> subscription state or messages can remain
          while clients disconnect, so revocation and client-identity reuse deserve review.</li>
        <li><strong>Last Will and Testament:</strong> a client may ask the broker to publish a final message after
          unexpected disconnection. The application should not treat it as cryptographic proof of device health.</li>
        <li><strong>Wildcards:</strong> <code>+</code> matches one topic level and <code>#</code> can match many
          levels. Limit broad subscriptions because they may reveal fleet-wide telemetry.</li>
      </ul>
      <CodeBlock label="Narrow ACL example for a disposable local broker">{mqttAcl}</CodeBlock>
      <p>
        In Mosquitto ACL syntax, a <code>user</code> line scopes subsequent topic rules to that broker username;
        <code>read</code> and <code>write</code> control subscription and publication rights. Broker versions and
        configuration mechanisms evolve, so use the installed version’s documentation and validate policy with
        test identities. Configuration expresses intended policy; test behavior to confirm what the broker
        actually enforces.
      </p>

      <h2>4. Safe local practice: inspect topic permissions</h2>
      <p>
        The following commands are limited to a broker on your own machine and a synthetic topic namespace.
        Use a disposable training broker with test credentials, never a public service or real smart-home or
        industrial device. Create the test users and apply the narrow ACL above. Then check both the permitted
        and denied cases.
      </p>
      <CodeBlock label="Localhost-only synthetic telemetry and authorization checks">{localTest}</CodeBlock>
      <p>
        Record the broker version, listener address, TLS setting, authentication method, ACL source, test
        identity, topic, and result. A denied publication is a useful result, not a failed test. If a connection
        is unexpectedly accepted, verify which listener and configuration the broker loaded before changing
        anything. Never put real passwords in shell history or reports; use disposable secrets and rotate them
        after practice.
      </p>

      <h2>5. A threat model across the three protocols</h2>
      <p>
        Consider a building with a Zigbee sensor mesh, a Z-Wave lock network, and an MQTT service that forwards
        events to an operations dashboard. The radios differ, but the trust questions repeat: how is a device
        enrolled, what identity does the gateway observe, what is encrypted, which principal may send which
        message, how are keys revoked, and where can an analyst find evidence?
      </p>
      <ol>
        <li><strong>Inventory:</strong> record device model, firmware, radio, owner, gateway, role, and expected
          communication paths. Unknown devices and duplicated identities require investigation.</li>
        <li><strong>Enrollment:</strong> close commissioning windows after setup; verify device identity using a
          unique code or QR/DSK where supported; record who approved enrollment.</li>
        <li><strong>Least privilege:</strong> separate sensors, dashboards, administrators, and actuators. A
          telemetry publisher does not need actuator permissions just because both use MQTT.</li>
        <li><strong>Key lifecycle:</strong> define how keys are provisioned, protected, rotated after suspected
          exposure, and removed when devices are reset, lost, or retired.</li>
        <li><strong>Transport and storage:</strong> use suitable TLS configuration for gateway-to-broker
          connections, safeguard broker databases and backups, and keep reusable secrets out of logs.</li>
        <li><strong>Monitoring:</strong> alert on repeated failed joins, unexpected re-inclusion, new identities,
          unusual subscriptions, denied-publication bursts, and broker ACL changes.</li>
        <li><strong>Recovery:</strong> test device replacement and credential revocation. A control that cannot
          be rotated may force teams to leave a compromised identity active.</li>
      </ol>

      <h2>Worked example: a dashboard can read beyond its role</h2>
      <p>
        A dashboard account subscribes to <code>building/#</code> because that was convenient during
        development. Later, maintenance notes and occupancy data are added under the same prefix. The dashboard
        now receives them without a code change: its authorization scope expanded with the topic tree. Preserve
        broker configuration and connection logs, identify which clients used the broad filter, and determine
        whether retained data or downstream storage expanded exposure. Then narrow the dashboard to exact
        read-only topic prefixes. If sensitive data may have been exposed, follow the organization’s incident
        and privacy process. An ACL alone shows potential access, not proof that a client read the data.
      </p>
      <Callout variant="warn">
        <p>
          Do not publish “unlock,” “open,” or other actuator commands in this lesson. A command topic can cause
          a physical action in a real deployment. Use only synthetic telemetry and a local disposable broker;
          before interacting with an actuator simulator, verify that it is isolated from real devices.
        </p>
      </Callout>

      <h2>Common misconceptions</h2>
      <ul>
        <li><strong>“Encrypted means safe.”</strong> An overprivileged client may still publish harmful messages
          over an encrypted connection.</li>
        <li><strong>“A shared network key means every frame is automatically readable.”</strong> Results depend
          on protocol layer, frame protection, security policy, and the key material actually available.</li>
        <li><strong>“Zigbee always transports the network key with the public default key.”</strong> The key
          exists for compatibility, but networks can use installation codes or other policies; verify the
          observed deployment.</li>
        <li><strong>“Z-Wave S2 is always downgraded to S0.”</strong> This is not universal. Record the
          negotiated class and investigate the specific controller and product.</li>
        <li><strong>“Port 1883 proves an MQTT broker is unauthenticated.”</strong> A port alone says nothing
          conclusive about authentication, ACLs, TLS termination, or exposure.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>Which Zigbee key protects network-layer communication, and what is the distinct role of a Trust
          Center link key?</li>
        <li>Why must an installation code reach the Trust Center through a separate channel?</li>
        <li>What does a DSK help a user verify during Z-Wave S2 inclusion?</li>
        <li>Why should a broker restrict a dashboard from subscribing to <code>#</code>?</li>
        <li>If an MQTT client authenticates but its publication is denied, which control is working?</li>
        <li>Describe a safe negative authorization test against a local lab broker.</li>
      </ol>
      <p>
        A strong answer separates identity, encryption, and authorization. For example: “The dashboard has a
        valid identity and TLS connection, but the broker denies its publication under the ACL” describes three
        different controls accurately.
      </p>

      <h2>Key terms</h2>
      <p>
        <strong>Trust Center:</strong> Zigbee role managing joining and key policy. <strong>Installation
        code:</strong> device-specific provisioning value used to derive a joining link key. <strong>DSK:</strong>
        Z-Wave Device-Specific Key used to verify enrollment. <strong>Topic:</strong> hierarchical MQTT message
        name. <strong>ACL:</strong> policy restricting which clients may publish or subscribe.
        <strong>Retained message:</strong> broker-stored latest topic value sent to qualifying subscribers.
        <strong>Commissioning window:</strong> period when a gateway accepts device enrollment.
      </p>
      <p>
        Apply these concepts through the device lifecycle: identify the asset, enroll it securely, grant least
        privilege, monitor expected behavior, and revoke its identity when it leaves service. The next lesson
        applies these principles to industrial control systems, where testing and change approval must also
        protect operational safety and availability.
      </p>
    </article>
  );
}
