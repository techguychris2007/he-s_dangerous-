import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CellularSecurityFundamentalsAndSynthesis() {
  return (
    <div className="prose-hh">
      <h1>5G/Cellular Security Fundamentals & Closing Synthesis</h1>
      <p>
        Every phone falls back to cellular the moment Wi-Fi is unavailable — a second radio network most users
        trust even more implicitly than Wi-Fi, on the assumption that a carrier-operated tower is inherently
        more trustworthy than a random access point. This closing lesson covers why that trust has real,
        well-documented gaps, and synthesizes this entire module's throughline.
      </p>

      <h2>IMSI catchers ("Stingrays"): the cellular evil twin</h2>
      <p>
        A phone connects to whichever tower advertises the strongest signal claiming to be its carrier — with,
        historically, very little cryptographic verification that the tower is genuine. An IMSI catcher
        (commonly known by the brand name Stingray, one widely deployed commercial product line) exploits
        exactly this: it impersonates a legitimate cell tower, and nearby phones connect to it automatically,
        with no user-visible indication anything unusual happened at all.
      </p>
      <CodeBlock label="the direct parallel to this module's wireless evil twin technique">{`Wi-Fi evil twin (Lesson 4)     -- clone a trusted SSID, victim devices with
                                  "auto-connect to known networks" enabled
                                  associate automatically
IMSI catcher                     -- impersonate a trusted cell tower, victim
                                  phones connect automatically by design
                                  (a phone has no equivalent of "only
                                  connect to towers I've manually approved")

Both exploit the exact same underlying pattern: a device configured to
trust ANY broadcaster of a specific identity (an SSID, a carrier's network
ID), with no way to cryptographically verify which physical transmitter is
actually behind it.`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real-world documented use — IMSI catcher deployment reporting, ongoing since the early
          2010s:</strong> the ACLU and other civil liberties organizations have documented, through public
          records requests, IMSI catcher use by well over 75 law enforcement agencies across the United States
          alone, and independent researchers have separately documented suspected unauthorized IMSI catcher
          activity detected near sensitive locations in Washington, D.C., reported by the Department of
          Homeland Security in 2018. Beyond location tracking (an IMSI catcher can determine which phones are
          in range without any cooperation from the carrier at all), older-generation IMSI catchers could
          additionally force a downgrade to less-secure 2G connections specifically to enable call/SMS
          interception — directly paralleling this module's WPA3-to-WPA2 downgrade material, just one network
          generation up.
        </p>
      </Callout>

      <h2>SS7 and Diameter: the signaling-layer trust problem</h2>
      <p>
        Beneath the radio layer, carriers interconnect using signaling protocols (SS7 for older networks,
        Diameter for 4G/5G) originally designed in an era when only a small number of trusted state telecom
        monopolies had access to the network — with authentication assumptions that have aged very poorly now
        that far more parties hold SS7/Diameter access. Researchers have repeatedly demonstrated that SS7
        access can be used to track a phone's location and, under some circumstances, intercept SMS messages —
        including SMS-based two-factor authentication codes, the same 2FA-interception outcome from the Mobile
        Security module's banking-trojan lesson, reached at the carrier-signaling layer instead of the device.
      </p>
      <Callout variant="warn">
        <p>
          This is precisely why security guidance has shifted away from SMS-based two-factor authentication
          toward app-based TOTP or hardware security keys wherever possible — SMS delivery depends on trusting
          the entire cellular signaling chain end to end, a much larger and more historically porous trust
          boundary than most users realize.
        </p>
      </Callout>

      <h2>5G's improvements — and what they don't fully fix</h2>
      <CodeBlock label="what changed, and what's still an open concern">{`Improved:
  - Mutual authentication between device and network (closer to this
    module's EAP-TLS material than earlier generations' weaker checks)
  - Encrypted subscriber identity (SUPI) in normal operation, specifically
    to prevent the kind of passive IMSI-catching described above

Still a concern:
  - Backward compatibility: a 5G phone can still be forced to fall back to
    4G/3G/2G by an attacker jamming or blocking the 5G signal specifically
    -- a downgrade attack with a strong family resemblance to this module's
    WPA3-to-WPA2 downgrade material
  - Real-world 5G deployments are frequently NON-STANDALONE, meaning core
    signaling still transits older-generation infrastructure with its
    weaker assumptions intact underneath a 5G radio layer`}</CodeBlock>

      <h2>Module synthesis: the pattern across every layer, every generation</h2>
      <CodeBlock label="the single idea underneath all eight lessons of this module">{`802.11 management frames unauthenticated  -> deauth attacks, evil twins
WPA2's PBKDF2-based handshake               -> offline cracking, strength
                                              entirely dependent on password
WPA3-SAE                                      -> closes the offline-cracking
                                              door via a genuinely stronger
                                              cryptographic design
Enterprise EAP/RADIUS                           -> the same trust-the-server
                                              problem, one layer up, when
                                              certificate validation is
                                              skipped
Cellular/IMSI catchers                            -> the identical "trust
                                              whichever broadcaster claims
                                              this identity" gap, one radio
                                              technology up from Wi-Fi entirely`}</CodeBlock>
      <p>
        Across every lesson in this module — Wi-Fi, Bluetooth, and now cellular — the recurring finding has been
        the same one from Security Engineering's cryptographic-pitfalls lesson: the cryptography, where
        genuinely modern (WPA3-SAE, EAP-TLS, 5G's mutual authentication), tends to actually hold up. What
        fails, again and again, is a device's willingness to trust whichever nearby transmitter claims a
        familiar identity, with no cryptographic way to verify that claim — a single pattern repeating across
        four completely different radio technologies and three completely different decades of protocol design.
      </p>
    </div>
  );
}
