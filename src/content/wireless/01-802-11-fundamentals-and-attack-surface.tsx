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

      <h2>Bands, channels, and generations: what "CH 6" and "Wi-Fi 6" actually mean</h2>
      <CodeBlock label="the spectrum this entire module operates in">{`2.4 GHz band  -- channels 1-14 (1-11 in the US), each 20 MHz wide but spaced
                 only 5 MHz apart -- only channels 1, 6, and 11 don't overlap
                 each other at all. Longer range, worse penetration through
                 walls than you'd expect, and crowded: microwaves, Bluetooth,
                 and baby monitors all share this same unlicensed spectrum.
5 GHz band    -- channels 36-165, far more of them and non-overlapping by
                 default, shorter range, better penetration issues (higher
                 frequency = worse at going through walls), effectively the
                 default band for anything performance-sensitive today.
6 GHz band    -- new spectrum opened specifically for Wi-Fi 6E/7 -- clean,
                 empty at time of writing, EXCLUSIVELY WPA3 -- a 6 GHz
                 network cannot legally run WPA2 at all, closing off this
                 entire module's Lesson 2-3 handshake-capture path by
                 protocol mandate rather than just convention.

802.11 generation -> marketing name -> what changed:
  802.11n  -> "Wi-Fi 4"  -- MIMO (multiple antennas), first mainstream 5 GHz
  802.11ac -> "Wi-Fi 5"  -- wider channels, more spatial streams
  802.11ax -> "Wi-Fi 6"  -- efficiency in dense environments (many clients
                             per AP), the generation WPA3 became common on
  802.11be -> "Wi-Fi 7"  -- current generation, multi-link operation across
                             bands simultaneously`}</CodeBlock>
      <p>
        The band and generation in play change what's practically attackable: a 6 GHz-only network mandates WPA3,
        meaning the offline-cracking techniques in Lesson 3 are already off the table before a single frame is
        captured — the strongest wireless hardening covered in this module ships as a default requirement of the
        newest spectrum, not an optional setting.
      </p>

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

      <h2>Hidden networks aren't actually hidden</h2>
      <p>
        "Hiding" a network by disabling SSID broadcast is a common but weak hardening step: it stops the AP's own
        beacon frames from announcing the ESSID, but doesn't stop the network from working at all — and the gap it
        leaves is well understood.
      </p>
      <CodeBlock label="why airodump-ng shows a hidden network's real name within seconds of any client activity">{`BSSID              CH  ENC  ESSID
AA:BB:CC:99:88:77   1  WPA2  <length: 9>          <- hidden: beacon omits the name,
                                                      only its LENGTH leaks for free

# A client that already knows the network (it's saved on their phone/laptop)
# has to ASK for it by name to reconnect -- it sends a directed probe request
# containing the real ESSID in plaintext, and the AP's probe RESPONSE echoes
# it back, also in plaintext. airodump-ng silently fills in the real ESSID
# the instant it observes either side of that exchange:

BSSID              CH  ENC  ESSID
AA:BB:CC:99:88:77   1  WPA2  CorpExec-WiFi          <- revealed, no cracking involved

# Forcing the reveal, rather than waiting for it: a deauth (this module's
# recurring technique) against an already-connected client makes it
# reconnect immediately, producing the giveaway probe request/response pair
# on demand instead of waiting for organic client activity.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a genuinely useful "security theater vs. real control" example to keep in mind throughout this
          module: disabling SSID broadcast raises the bar for a purely passive, unmotivated observer by roughly
          zero — any client that actually uses the network unavoidably leaks its name the moment it tries to
          connect — while still adding real, everyday cost (any client has to be manually configured with the
          exact hidden SSID rather than picking it from a list). The actual control that matters is the
          encryption/authentication covered starting next lesson, not the name being visible.
        </p>
      </Callout>

      <h2>MAC randomization: recon has gotten harder, not impossible</h2>
      <p>
        Every frame in this lesson's examples includes a source MAC address, and older wireless recon relied on
        that address being stable — tracking one physical device's movement and behavior across a whole
        assessment by watching one consistent MAC. Since roughly 2019, every major mobile OS randomizes the MAC
        address used for probe requests (and increasingly, for the actual connection itself) by default, generating
        a new, unrelated-looking address per network or even per connection attempt.
      </p>
      <CodeBlock label="what this changes for an assessment, and what it doesn't">{`Before randomization: one MAC address = one physical device, reliably,
                       for the life of the engagement.
After randomization:  a MAC seen in a scan may only be valid for tracking
                       that ONE device against that ONE specific network,
                       for as long as it stays connected -- reconnecting,
                       or probing a different SSID, can present a completely
                       different, unrelated MAC.

Still stable, and still useful for tracking:
  - the MAC actually used for an ESTABLISHED, ongoing association (most
    implementations only randomize the pre-connection probing MAC, not the
    one used once actually joined to a network for the session's duration)
  - AP-side BSSIDs -- infrastructure doesn't randomize, only client devices do`}</CodeBlock>

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
