import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function Fundamentals80211AndAttackSurface() {
  return (
    <div className="prose-hh">
      <h1>802.11 Fundamentals & the Wireless Attack Surface</h1>
      <p>
        Wireless networking removes an assumption every previous module quietly relied on: that reaching a target
        requires a wire, a routed path, or at least a connected network segment. An 802.11 (Wi-Fi) network
        broadcasts its traffic through open air to anyone with a radio in range — meaning the entire attack surface
        starts before you're even associated with the network, at the level of raw radio frames anyone nearby can
        already see.
      </p>

      <h2>The three 802.11 frame types</h2>
      <CodeBlock label="every Wi-Fi frame on the air is one of these three categories">{`Management frames  — network discovery and connection setup: beacons, probe
                       requests/responses, authentication, association, and
                       deauthentication. Critically, these were UNENCRYPTED and
                       UNAUTHENTICATED in the original 802.11 standard and WPA2 —
                       anyone in range can read them, and (this is the important
                       part) forge them.
Control frames      — low-level radio coordination (RTS/CTS, ACK) that manages
                       who's allowed to transmit on the shared medium.
Data frames         — the actual payload traffic, encrypted once you're
                       associated and the encryption handshake (Lesson 2) is done.`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Management frames being unauthenticated is the single fact behind the most common wireless attack in
          this module — deauthentication (Lesson 2) and evil twin attacks (Lesson 4) both exploit exactly this
          gap. It's not a bug in any one product; it's a property of the base 802.11 standard itself, only
          partially addressed by later amendments (802.11w, Protected Management Frames).
        </p>
      </Callout>

      <h2>Monitor mode: seeing every frame in the air, not just your own traffic</h2>
      <CodeBlock label="the mode switch that unlocks wireless attack tooling">{`# A wireless adapter normally operates in "managed" mode -- associated with one
# AP, seeing only its own traffic. Monitor mode instead captures every 802.11
# frame on a channel, from every device, associated or not.

airmon-ng check kill              # stop processes that interfere with monitor mode
airmon-ng start wlan0             # creates wlan0mon in monitor mode
airodump-ng wlan0mon              # now sniffing every frame on the current channel`}</CodeBlock>
      <p>
        Not every Wi-Fi chipset/driver supports monitor mode or packet injection — this is why wireless
        assessments depend on specific, known-good adapters (Alfa AWUS036ACH and similar chipsets built around
        Atheros/Ralink/Realtek drivers with confirmed injection support) rather than whatever adapter happens to
        ship in a laptop.
      </p>

      <h2>SSID, BSSID, and channels: reading an airodump-ng scan</h2>
      <CodeBlock label="the fields that matter in a live scan">{`BSSID              CH  ENC  ESSID
AA:BB:CC:11:22:33   6  WPA2  CorpGuest-WiFi
AA:BB:CC:11:22:34   6  WPA2  CorpGuest-WiFi        <- same ESSID, different BSSID:
                                                       could be a second legitimate
                                                       AP (multi-AP roaming) -- or
                                                       an evil twin (Lesson 4)
DD:EE:FF:44:55:66  11  OPEN  Free_Airport_WiFi

BSSID  = the AP's actual MAC address (unique per radio)
ESSID  = the human-readable network name — NOT unique, trivially spoofable`}</CodeBlock>
      <p>
        The distinction between BSSID and ESSID matters immediately: any attacker can broadcast beacons
        advertising an identical ESSID to a legitimate network. Nothing about the SSID name itself proves which
        physical AP — or attacker — is actually behind it.
      </p>

      <h2>The standard wireless assessment toolkit</h2>
      <CodeBlock label="the tools this module builds on, by role">{`aircrack-ng suite   — airmon-ng (mode switching), airodump-ng (capture), aireplay-ng
                       (frame injection/deauth), aircrack-ng (cracking, Lesson 3)
hcxdumptool/hcxtools — modern PMKID-based capture workflow (Lesson 2)
hashcat              — GPU-accelerated cracking, far faster than CPU-bound aircrack-ng
                        for large wordlists (Lesson 3)
Wireshark             — deep per-frame inspection once a capture exists
Kismet                 — passive wireless detection/IDS, useful defensively too`}</CodeBlock>

      <h2>Why wireless assessments require explicit, careful authorization</h2>
      <Callout variant="danger">
        <p>
          Unlike a web app or an internal network segment, radio frequency doesn't respect a client's property
          line — a deauth attack or a rogue AP broadcast is physically radiating beyond the boundary of whatever
          building or floor is actually in scope, and can affect neighboring networks and unrelated devices that
          were never part of the engagement. Wireless assessments require unusually explicit written authorization
          covering physical location, timing, and exactly which SSIDs/BSSIDs are in scope — and even then, care to
          avoid disrupting neighboring, out-of-scope networks that happen to share the same physical space.
        </p>
      </Callout>

      <p>
        With the frame-level fundamentals established, the next lesson gets into the actual encryption: how WPA2's
        4-way handshake works, why capturing it is the goal of nearly every wireless attack, and the newer
        PMKID technique that captures the same target without needing a client to deauthenticate at all.
      </p>
    </div>
  );
}
