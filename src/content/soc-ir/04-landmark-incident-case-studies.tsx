import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LandmarkIncidentCaseStudies() {
  return (
    <div className="prose-hh">
      <h1>Landmark Incident Case Studies: Target &amp; the Bangladesh Bank SWIFT Heist</h1>
      <p>
        Every principle in this module — timeline-building, scoping, root cause analysis — reads cleanly in
        the abstract. Real breaches are messier, and two of the most-cited case studies in SOC training show
        exactly why: one where the detection technology worked perfectly and the process around it still
        failed, and one where a billion-dollar heist was stopped not by a firewall but by a typo.
      </p>

      <h2>Target, November–December 2013: when the alert fires and nobody escalates it</h2>
      <p>
        Attackers who had compromised an HVAC vendor's credentials pivoted into Target's network and deployed
        memory-scraping point-of-sale malware, ultimately stealing roughly 40 million card numbers over about
        three weeks. The detail that makes this THE textbook alert-fatigue case study: Target's own FireEye
        malware detection system genuinely flagged the malware — twice, on separate registers, correctly
        identifying the exact malware family — while the breach was still ongoing and weeks before it became
        public.
      </p>
      <CodeBlock label="the two alerts that were correct and still didn't stop anything">{`2013-11-30 18:47  severity=HIGH  category=malware.binary  source=POS-REGISTER-114
  "Malware binary detected: memory-scraping process behavior matching a
   BlackPOS-family signature; upload to external FTP staging host was blocked"

2013-12-02 03:15  severity=HIGH  category=malware.binary  source=POS-REGISTER-119
  "Same malware family detected on a second point-of-sale register
   — lateral spread confirmed"

...breach publicly disclosed 2013-12-18, roughly two weeks later, after the malware
   had continued exfiltrating card data the entire gap between detection and action.`}</CodeBlock>
      <p>
        The technology did its job. What failed was everything downstream of it: the alerts were buried in a
        high-volume queue alongside dozens of low-severity policy notifications, and an auto-quarantine
        feature that could have acted automatically had reportedly been left disabled. This is why "we have a
        detection for it" and "we caught it" are not the same claim — a correct alert that never gets triaged
        protects nobody.
      </p>

      <Callout variant="incident">
        <p>
          <strong>The transferable lesson:</strong> alert-queue design is itself a security control. A queue
          where two correctly-classified HIGH-severity malware alerts sit indistinguishable from routine
          policy noise is a process failure, not a technology failure — exactly the gap the ATT&amp;CK
          coverage-mapping and correlation-rule-tuning work earlier in this curriculum exists to close.
        </p>
      </Callout>

      <h2>Bangladesh Bank, February 2016: a billion-dollar heist stopped by a typo</h2>
      <p>
        Attackers who had compromised Bangladesh Bank's SWIFT payment infrastructure submitted fraudulent
        transfer instructions attempting to move $951 million out through the Federal Reserve Bank of New
        York — one of the largest attempted bank robberies in history. The timing was deliberate: the
        transfers were submitted around a weekend (Bangladesh's weekend falls on Friday–Saturday), buying the
        attackers extra time before anyone at the bank would notice.
      </p>
      <p>
        Most of the transfers were caught by automated sanctions-list filters. Roughly $81 million still
        reached accounts in the Philippines before being laundered through casinos — but one transfer, out of
        dozens, was frozen by a routing bank's compliance officer for a strikingly mundane reason:
      </p>
      <CodeBlock label="the detail that broke the case">{`Beneficiary name on the fraudulent transfer:  "Shalika Fandation"
Correct spelling should have been:            "Shalika Foundation"

-> a single misspelled word triggered a manual compliance review,
   which froze that transfer before it could be laundered.`}</CodeBlock>
      <p>
        Submitting dozens of high-value transfers in one unusually tight window is itself the kind of pattern
        an analyst should flag on timing alone — the same "volume and timing, not any single event" principle
        covered earlier in this curriculum for beaconing and DNS tunneling applies just as directly to
        financial fraud detection.
      </p>

      <Callout variant="tip">
        <p>
          Not every catch comes from a technical signature match. A billion-dollar, technically sophisticated
          attack chain was ultimately blocked in part by a human reviewer's ordinary attention to detail — a
          reminder that manual review of anomalies still matters even inside heavily automated systems, and
          that "boring" checks (spelling, formatting, does this look like every other legitimate request)
          catch things purely statistical detection sometimes doesn't.
        </p>
      </Callout>

      <h2>Maersk, June 2017: when recovery, not detection, is the story</h2>
      <p>
        Target and Bangladesh Bank are both stories about a signal someone failed (or barely managed) to
        act on. Maersk's NotPetya incident is different in kind — detection was never really the issue,
        since the wiper malware announced itself immediately and catastrophically, encrypting roughly 49,000
        laptops and thousands of servers within about seven minutes of first execution, effectively taking
        down the shipping giant's entire global IT infrastructure at once. The story that matters here is
        recovery, and it turned on a single stroke of luck: a domain controller in Maersk's Ghana office
        happened to be offline during the outbreak due to a local power cut, meaning it was never connected
        to the network at the moment NotPetya swept through — and it survived as the ONLY intact copy of
        Maersk's Active Directory anywhere in the company.
      </p>
      <CodeBlock label="why one surviving domain controller mattered this much">{`Every other domain controller, globally:  encrypted, unrecoverable
Ghana office domain controller:            offline during the outbreak (unrelated power cut)
                                             -> the single surviving copy of Maersk's entire AD forest

Without it: rebuilding identity/authentication for a multinational company from
            zero would have taken vastly longer than the ~10 days recovery actually took
With it:    IT staff physically flew the drive from Ghana to a recovery site, and
            Maersk's AD forest was rebuilt FROM that one surviving copy`}</CodeBlock>
      <p>
        Maersk's own leadership later estimated the incident cost the company $200-300 million — even with
        that lucky break. The transferable lesson is squarely about resilience architecture, not detection:
        an organization's disaster-recovery plan should never depend on a single points-of-failure
        assumption ("all our domain controllers are always reachable and always in sync") holding true
        during exactly the kind of event that violates it hardest — which is precisely why real DR planning
        tests offline, air-gapped, or otherwise isolated backup copies deliberately, rather than treating
        Maersk's outcome as luck worth replicating instead of a gap worth designing around.
      </p>

      <h2>What all three incidents actually have in common</h2>
      <p>
        None of these breaches succeeded because detection was impossible, and none were ultimately solved by
        a purely technical fix either. Target's system correctly identified the malware; Bangladesh Bank's
        automated filters correctly blocked most of the fraud; Maersk's outcome hinged on an unrelated power
        cut, not a security control at all. All three turned on what happens in the gap between a system (or
        pure chance) producing a usable signal or a usable surviving asset, and a human process acting on it
        in time — the exact gap SOAR automation, covered in the previous lesson, exists to close for the cases
        that can be safely automated, and disciplined triage and DR planning exist to close for the cases that
        still need a human judgment call or a resilience decision made well before the incident ever starts.
      </p>

      <p>
        This closes out the four-module SOC curriculum: alert triage and threat hunting, the SIEM platforms
        themselves, the detection-engineering techniques that generate real findings, and the investigation,
        automation, reporting, and — as these three case studies show — the very human factors and resilience
        decisions that determine whether a correct detection, or even a stroke of luck, actually stops
        anything. The SOC Portal's SIEM labs let you practice every one of these mechanics directly, inside
        real platform-style consoles, against both realistic essentials scenarios and reconstructions of major
        real-world breaches.
      </p>
    </div>
  );
}
