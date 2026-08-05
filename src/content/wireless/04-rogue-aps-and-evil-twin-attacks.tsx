import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function RogueApsAndEvilTwinAttacks() {
  return (
    <div className="prose-hh">
      <h1>Rogue Access Points & Evil Twin Attacks</h1>
      <p>
        Every technique in the previous two lessons attacks the AP's cryptography. This lesson attacks something
        much simpler and, in practice, far more reliable: a device's willingness to trust a familiar network name.
        An evil twin attack doesn't need to know a single character of the real password — it just needs to
        convince a client to connect to an attacker-controlled AP that LOOKS like the one it already trusts.
      </p>

      <h2>The core technique: cloning what a client already trusts</h2>
      <CodeBlock label="the setup — no cryptographic attack involved at all">{`hostapd (or a tool like airgeddon/wifiphisher) broadcasts an AP with the
IDENTICAL ESSID as the legitimate target (recall Lesson 1: ESSID is not
unique and trivially spoofable) — often on a different channel, sometimes
paired with a stronger signal or a deauth flood against the real AP to push
clients toward the rogue one instead.

Devices configured to auto-reconnect to "known" networks by SSID alone will
often connect to the evil twin automatically, with ZERO user interaction —
because from the device's perspective, "CorpGuest-WiFi" is CorpGuest-WiFi,
regardless of which physical radio is actually answering.`}</CodeBlock>

      <h2>Open networks: no handshake to forge at all</h2>
      <p>
        Against an OPEN network (no password, common at airports, hotels, and coffee shops), an evil twin requires
        even less effort — there's no encryption handshake to replicate, since the real network never had one.
        This makes public open Wi-Fi a persistently attractive target: a device that once joined "Airport_Free_WiFi"
        will often reconnect automatically to anything broadcasting that exact name, at any airport, any time
        later.
      </p>

      <Callout variant="incident">
        <p>
          <strong>The KARMA attack, first documented 2004:</strong> researcher Dino Dai Zovi and collaborators
          demonstrated that many client devices don't just passively wait for known networks to appear — they
          actively broadcast <strong>probe requests</strong> naming every SSID they've previously connected to,
          asking "are you here?" A KARMA-style rogue AP listens for these probes and responds to EVERY one,
          claiming to be whichever network the device asked for by name — turning a device's own connection
          history into a list of networks the attacker can impersonate on demand, no cloning of a specific nearby
          AP required at all. This class of attack pushed the industry toward reducing how eagerly devices
          broadcast their saved-network history, though the underlying auto-reconnect trust model KARMA exploited
          is still present in some form on most devices today.
        </p>
      </Callout>

      <h2>Captive portal phishing: once connected, harvest credentials directly</h2>
      <CodeBlock label="the payoff step, once a client is on the rogue AP">{`A rogue AP fully controls DNS and can redirect ALL HTTP traffic to a fake
captive portal page mimicking the real network's login page (a hotel Wi-Fi
sign-in, a corporate guest-network authentication page). Because the victim
initiated the connection believing it's the legitimate network, credentials
entered here go directly to the attacker -- this is credential phishing
(from the SOC/BEC material) delivered through a network-layer trust attack
instead of an email.

Tools like wifiphisher automate this entire chain: clone SSID, deauth the
real AP to force reconnection, serve a realistic captive portal, capture
whatever credentials or WPA password the victim types in.`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Notice the attack doesn't even need to break WPA2/WPA3 cryptography to obtain the real Wi-Fi password —
          a convincing fake captive portal asking the victim to "re-enter your Wi-Fi password to continue" will
          often just be handed it directly, sidestepping every technique from the previous two lessons entirely.
          This is a recurring theme across this whole course: the human trust layer is frequently the easiest path
          past a technically sound cryptographic control.
        </p>
      </Callout>

      <h2>Detecting rogue APs defensively</h2>
      <CodeBlock label="what a wireless IDS (like Kismet, or enterprise WIPS) actually watches for">{`- A new BSSID broadcasting an ESSID matching a known corporate network,
  from a MAC address/vendor OUI not in the approved AP inventory
- Sudden, unexplained bursts of deauthentication frames -- often the first
  visible sign of an active evil-twin attack in progress
- Duplicate ESSIDs on unexpected channels compared to the documented,
  approved wireless deployment map`}</CodeBlock>
      <p>
        This is the wireless-specific instance of the same detection-engineering discipline from the SOC modules:
        baseline what "normal" looks like (the approved AP inventory, the expected channel plan), then alert on
        deviation — a rogue AP is, at its core, an anomaly in exactly that baseline.
      </p>

      <p>
        With cryptographic and social/trust-layer wireless attacks both covered, the final lesson moves to a
        physically adjacent but distinct wireless protocol most devices also run: Bluetooth and BLE, and the
        attack classes specific to it.
      </p>
    </div>
  );
}
