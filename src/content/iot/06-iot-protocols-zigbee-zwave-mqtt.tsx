import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IotProtocolsZigbeeZwaveMqtt() {
  return (
    <div className="prose-hh">
      <h1>IoT Communication Protocols: Zigbee, Z-Wave & MQTT Security</h1>
      <p>
        Not every IoT device talks Wi-Fi or Bluetooth. Smart-home ecosystems widely rely on Zigbee and Z-Wave —
        low-power mesh radio protocols built specifically for sensors and actuators — while the backend
        messaging between devices and cloud platforms overwhelmingly runs on MQTT. This lesson covers all
        three, and the trust assumptions each one gets wrong in ways that echo this entire course.
      </p>

      <h2>Zigbee: mesh networking with a single network-wide key</h2>
      <CodeBlock label="the Zigbee trust model, and its most common real-world failure">{`Zigbee devices join a network using a Trust Center (usually the hub) that
distributes a single NETWORK KEY to every device on the mesh -- all
devices then encrypt their traffic with that ONE shared key.

The Zigbee specification defines a well-known DEFAULT Trust Center link key
("ZigBeeAlliance09") used during the initial key-transport step, before a
device receives its real network key -- meant to be used only briefly
during commissioning.

-- the recurring real-world failure: many vendor implementations transport
   the actual network key using this default, publicly known link key with
   no additional protection, meaning anyone capturing that brief
   commissioning exchange (with an inexpensive Zigbee sniffer like an
   Ubertooth or a CC2531 dongle) recovers the network key for the ENTIRE
   mesh -- every device, not just the one being commissioned`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice the shape of this failure: a single shared secret protecting an entire network, transported
          using a WELL-KNOWN default key during setup. This is structurally the same risk category as WPA2's
          single shared PSK from the Wireless module, compounded by the transport step itself using a
          publicly documented default — the IoT-scale version of shipping a default admin password, just for a
          key exchange instead of a login.
        </p>
      </Callout>

      <h2>Z-Wave: proprietary, but not immune</h2>
      <p>
        Z-Wave takes a more closed, proprietary approach than Zigbee's open specification — historically
        treated by some vendors as "security by obscurity is good enough here," directly contradicting the
        Open Design principle from the Security Engineering module. Researchers have nonetheless documented
        downgrade attacks against Z-Wave's S2 security framework, forcing a device back to the older, weaker S0
        security class during pairing — the exact same downgrade-attack pattern as WPA3's Transition Mode
        weakness and 5G's fallback-to-4G concern from the Wireless module, recurring again in a third,
        completely different protocol family.
      </p>

      <h2>MQTT: the message broker most IoT backends run on</h2>
      <CodeBlock label="MQTT's publish/subscribe model, and its default-insecure configuration">{`Devices PUBLISH sensor readings/state to a topic on a central broker;
other devices/apps SUBSCRIBE to topics they care about. The broker itself
has no concept of authorization built into the base protocol -- topic-level
access control is an OPT-IN feature many broker deployments never configure.

mosquitto_sub -h broker.example.com -t "#"
  -- the "#" wildcard subscribes to EVERY topic on the broker at once.
     On a broker with no authentication and no topic-level ACLs configured
     (a very common real-world default, especially on quickly-deployed
     proof-of-concept and small-vendor IoT backends), this single command
     dumps every device's live telemetry across the entire fleet --
     smart lock states, camera motion events, thermostat readings, garage
     door open/closed status -- to anyone who simply connects`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real research — widespread exposed MQTT brokers, documented repeatedly since 2017:</strong>{' '}
          multiple independent security research efforts (including reporting connected to the Avast Threat
          Labs and various independent researchers using Shodan-based internet scanning) have repeatedly found
          tens of thousands of MQTT brokers reachable directly on the public internet with no authentication
          configured at all, exposing live data from smart home devices, industrial sensors, and in some
          documented cases, real-time GPS tracking data from vehicle fleets — a finding that recurs on internet
          scans essentially every time researchers look, specifically because MQTT's base protocol makes
          "publicly reachable with no auth" the path of least resistance for a developer moving quickly rather
          than something that requires an active misconfiguration to reach.
        </p>
      </Callout>

      <h2>Testing MQTT security in practice</h2>
      <CodeBlock label="the enumeration workflow, extending this course's existing service-enumeration methodology">{`nmap -p 1883,8883 <target>          # 1883 = unencrypted MQTT, 8883 = MQTT/TLS
mosquitto_sub -h <target> -p 1883 -t "#" -v
  -- if this returns live data with no username/password prompt, the
     broker has no authentication configured at all
mosquitto_pub -h <target> -p 1883 -t "home/frontdoor/lock/set" -m "UNLOCK"
  -- if publish access is equally unrestricted, an attacker isn't limited
     to READING telemetry -- they can PUBLISH commands, directly
     controlling any device subscribed to that topic`}</CodeBlock>

      <p>
        With the communication-layer protocols covered, the next lesson moves to where IoT-style embedded
        devices carry the highest real-world stakes of all — industrial control systems and SCADA, where the
        same categories of finding can affect physical infrastructure rather than a smart-home convenience
        device.
      </p>
    </div>
  );
}
