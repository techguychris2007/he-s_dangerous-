import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WirelessIdsAndDefensiveMonitoring() {
  return (
    <div className="prose-hh">
      <h1>Wireless IDS/IPS & Defensive Monitoring</h1>
      <p>
        Every previous lesson in this module took the attacker's seat. This lesson flips to the defender's:
        how a Wireless Intrusion Detection/Prevention System (WIDS/WIPS) actually detects the deauth floods,
        rogue APs, and evil twins this module has spent six lessons building — the same baseline-then-alert
        discipline from the SOC modules, applied to 802.11 radio traffic specifically.
      </p>

      <h2>What a WIDS actually watches for</h2>
      <CodeBlock label="mapping this module's own attacks to their defensive signatures">{`Deauth flood (Lesson 2, 4)      -- an abnormal RATE of deauth/disassociation
                                    frames, far exceeding what legitimate
                                    roaming/reconnection ever produces —
                                    the single most reliable WIDS signature,
                                    since 802.11 management frames being
                                    unauthenticated (Lesson 1) means an
                                    attacker can never make forged deauth
                                    frames blend into truly normal volume
Rogue AP / evil twin (Lesson 4)   -- a new BSSID broadcasting a known-good
                                    ESSID from a vendor OUI/MAC prefix not
                                    in the approved AP inventory (exactly
                                    the detection this module's Lesson-4
                                    lab already modeled from the analyst's
                                    side)
KARMA-style probe response
  (Lesson 4)                        -- an AP responding to an unusually wide
                                    range of different probed SSIDs, rather
                                    than consistently advertising one fixed
                                    identity
WPS brute-force/Pixie Dust
  (this module's WPS lab)             -- an abnormal volume of WPS
                                    registration attempts against one BSSID
                                    in a short window`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice every single one of these is the same anomaly-detection principle from the SOC Detection
          Engineering module's UEBA lesson: establish what NORMAL looks like for this specific environment
          (typical deauth rate, the approved AP/BSSID inventory, typical WPS registration volume), then alert
          on statistically significant deviation from that baseline — not a fixed signature for "the exact
          attack tool being used."
        </p>
      </Callout>

      <h2>Kismet: the open-source reference implementation</h2>
      <CodeBlock label="what a defensive WIDS deployment actually runs, continuously">{`kismet -c wlan1mon                # dedicated monitoring radio, passive,
                                    never associates to any network
# Kismet builds and maintains a running inventory:
  - every BSSID/ESSID pair ever observed, with first-seen/last-seen times
  - client MAC association history across the whole monitored area
  - alerts.log entries the moment a monitored signature fires:
      "ALERT: DEAUTHFLOOD - excessive deauthentication from AA:BB:CC:11:22:33"
      "ALERT: BCASTDISCON - broadcast deauth affecting multiple clients at once"
      "ALERT: APSPOOF - BSSID broadcasting SSID 'MeridianCorp-Guest' not on
       the configured trusted-BSSID allowlist"`}</CodeBlock>
      <p>
        This is directly analogous to the SIEM Platforms module's log-collection-and-correlation model, just
        with 802.11 frames as the log source instead of syslog/Windows Event Logs — Kismet's alerting rules
        are, structurally, the same kind of threshold and pattern-matching correlation rules covered in the
        SOC SIEM module's correlation-rules lesson.
      </p>

      <h2>Enterprise WIPS: active containment, not just detection</h2>
      <p>
        A full commercial WIPS deployment (built into enterprise AP controllers from vendors like Cisco,
        Aruba, and others) goes beyond passive alerting into active containment — automatically sending
        deauthentication frames AT a detected rogue AP's clients to actively prevent association, the
        defender using the exact same unauthenticated-management-frame weakness from Lesson 1 that made the
        attack possible in the first place, now turned into a countermeasure.
      </p>
      <Callout variant="warn">
        <p>
          Active WIPS containment is legally and ethically fraught outside an organization's own controlled
          environment — sending deauth frames at a device you don't control, even a "rogue" one, can affect
          neighboring, entirely unrelated networks that happen to share the same physical space, echoing
          exactly the authorization concerns Lesson 1 raised about wireless assessments generally. Enterprise
          WIPS containment features are typically scoped tightly to an organization's own verified airspace and
          documented AP inventory for exactly this reason.
        </p>
      </Callout>

      <h2>Spectrum analysis: catching what packet-level monitoring can't</h2>
      <p>
        A dedicated spectrum analyzer measures raw RF energy across the Wi-Fi frequency bands, independent of
        whether the traffic on it is even valid 802.11 at all — catching non-Wi-Fi interference sources
        (microwave ovens, cordless phones, and occasionally deliberate RF jamming equipment) that a purely
        packet-based WIDS, which only parses valid 802.11 frames, would never see at all. This is a useful
        complementary layer precisely because it operates one level below the frame-parsing this entire module
        has worked at.
      </p>

      <h2>Closing the loop: this module's attacks, mapped to their defenses</h2>
      <CodeBlock label="the complete attacker/defender pairing across this module">{`802.11 fundamentals    -> baseline the approved AP/BSSID inventory
WPA2 handshake capture   -> deauth-rate alerting catches the forcing step
WPA3/cracking              -> (largely defeats offline cracking already,
                              per Lesson 3's own analysis)
Evil twin/rogue AP           -> BSSID-vs-inventory mismatch alerting
Bluetooth/BLE                  -> (outside typical WIDS scope -- a genuinely
                                  separate monitoring domain)`}</CodeBlock>

      <p>
        With both the offensive and defensive sides of Wi-Fi and enterprise wireless covered, the final lesson
        zooms out one layer further — to the cellular/5G network most phones fall back to the moment Wi-Fi
        isn't available, and the surprisingly similar trust assumptions it shares with everything in this
        module.
      </p>
    </div>
  );
}
