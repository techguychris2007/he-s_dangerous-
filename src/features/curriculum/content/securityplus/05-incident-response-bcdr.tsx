import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IncidentResponseBcdr() {
  return (
    <div className="prose-hh">
      <h1>Incident Response &amp; Business Continuity</h1>
      <p>
        Every technique you've practiced in this course's labs — from a simple FTP-leaked credential to a
        full domain compromise — eventually gets discovered by someone following the process this lesson
        describes. Understanding it from the defender's side makes you better at both roles.
      </p>

      <h2>The incident response lifecycle</h2>
      <CodeBlock label="the six phases Security+ tests by name and order">{`1. Preparation      — policies, tools, and training BEFORE an incident happens
2. Identification    — detecting and confirming an incident is actually occurring
3. Containment       — stopping the spread (short-term: isolate the host; long-term: patch/rebuild)
4. Eradication        — removing the root cause entirely (the malware, the backdoor, the vulnerable config)
5. Recovery            — restoring normal operations, verified clean
6. Lessons Learned      — a post-incident review feeding back into Preparation for next time`}</CodeBlock>
      <p>
        Notice containment splits into short-term (stop the bleeding, e.g. disconnect the host from the
        network) and long-term (fix it properly so reconnecting is safe) — this exact distinction is why
        the SOC labs earlier in this course emphasized identifying scope before acting, since containing
        too early can destroy evidence, and too late lets an incident spread further.
      </p>
      <p>
        Eradication deserves special emphasis because it's the phase most often shortchanged under
        pressure: re-imaging one compromised laptop feels like resolution, but if the actual root cause was
        a stolen service account credential, a missed scheduled task used for persistence, or a web shell
        dropped on a second, undiscovered host, the "resolved" incident simply resumes once attention moves
        on. Mature IR teams treat eradication as unfinished until they can answer, with evidence, exactly
        how the attacker got in, everywhere they went, and everything they touched — not just where they
        were first noticed.
      </p>

      <h2>Evidence handling: chain of custody</h2>
      <p>
        Anything collected during an investigation that might end up in a legal proceeding must maintain a
        documented, unbroken chain of custody — who collected it, when, how it was stored, and who accessed
        it since. This is exactly why the Digital Forensics module in this course emphasized working from a
        verified copy, never the original evidence directly.
      </p>
      <CodeBlock label="order of volatility — collect the most fragile evidence first">{`1. CPU registers, cache
2. RAM (routing table, ARP cache, running processes)
3. Temporary file systems
4. Disk
5. Remote logging / monitoring data
6. Physical configuration / network topology
7. Archival media / backups`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This "order of volatility" is why memory forensics (covered hands-on in the Digital Forensics
          module) is captured before disk imaging whenever possible — RAM contents disappear the moment a
          machine powers off, while a disk image can wait.
        </p>
      </Callout>

      <h2>Confirming real exposure: password auditing during an investigation</h2>
      <p>
        A common moment in a real incident: you've recovered a dump of password hashes — from a
        compromised database, a memory capture, or an attacker's own staging directory found during the
        investigation — and you need to answer a very concrete question fast: how exposed is the
        organization actually? A hash sitting in a file isn't automatically a compromised credential; the
        question is whether it's crackable in practice, and how quickly. This is exactly the job of
        offline password-cracking tools during IR — not offense for its own sake, but a fast, defensible
        way to size the real blast radius of a credential exposure.
      </p>
      <CodeBlock label="Hashcat — GPU-accelerated cracking against a recovered hash dump">{`hashcat -m 1000 hashes.txt rockyou.txt
# -m 1000 tells hashcat the hash format (1000 = NTLM here — the mode number must match
#   the algorithm, e.g. 0 = raw MD5, 1800 = sha512crypt, 13100 = Kerberos 5 TGS-REP)
# hashes.txt   the recovered hash dump
# rockyou.txt   a wordlist — cracked-in-seconds results here mean those accounts are
#               using genuinely weak, previously-breached passwords

hashcat -m 1000 hashes.txt rockyou.txt -r rules/best64.rule
# applying a rule file (case changes, appended digits, leetspeak substitutions) dramatically
# increases crack rate against passwords that are "almost" in the wordlist but not exact`}</CodeBlock>
      <CodeBlock label="John the Ripper — the classic CPU-based alternative, strong format auto-detection">{`john --wordlist=rockyou.txt hashes.txt
# john auto-detects the hash format in most cases, which makes it a fast first pass
# before reaching for hashcat's more precise, GPU-accelerated mode-specific cracking

john --show hashes.txt
# reveals which hashes have already been cracked in a prior run, formatted for a report`}</CodeBlock>
      <p>
        Neither tool is useful without a good wordlist tailored to the target organization, which is where
        <strong> CeWL</strong> comes in — it crawls a company's own website (and can be pointed at other
        text sources) to build a custom wordlist out of the words actually used there, on the theory that
        employees' password choices are influenced by their own company's product names, internal jargon,
        and branding far more than a generic list like rockyou.txt captures:
      </p>
      <CodeBlock label="CeWL — building a target-specific wordlist for the crack attempt">{`cewl https://www.example-corp.com -d 2 -m 5 -w example-corp-wordlist.txt
# -d 2   crawl depth (follow links two levels deep from the starting page)
# -m 5   minimum word length to include
# -w     output file — feed this directly into hashcat or john as a supplemental wordlist`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Framed for IR specifically: if a recovered hash dump cracks against a standard wordlist like
          rockyou.txt in seconds, that's evidence the organization's password policy is failing in
          practice, not just on paper — a finding that belongs directly in the incident's root-cause and
          Lessons Learned writeup, alongside a concrete, measurable recommendation (enforce a password
          manager, raise minimum length/entropy requirements, mandate MFA so a cracked password alone stops
          being sufficient for account access).
        </p>
      </Callout>

      <h2>Cyber insurance: the "Transfer" risk treatment, in practice during IR</h2>
      <p>
        The GRC lesson's four risk-treatment options included "Transfer" — shifting financial impact via
        insurance. During an actual incident, that policy stops being a line item and starts actively shaping
        the response: most cyber insurance policies require notifying the insurer within a specific window of
        discovery, often BEFORE full scoping is complete, and frequently mandate using a pre-approved panel of
        forensics firms and outside breach counsel rather than whichever incident response team the
        organization would otherwise choose. Skipping this step, or bringing in an outside IR firm not on the
        insurer's approved list, can void coverage for the exact incident the policy exists to cover.
      </p>
      <Callout variant="warn">
        <p>
          A practical consequence Security+ expects you to recognize: "call the cyber insurer" belongs
          alongside "call legal" as one of the very first Preparation-phase contacts in an incident response
          plan, not a step that happens once the technical investigation wraps up — treating it as an
          afterthought is a common, costly real-world mistake.
        </p>
      </Callout>

      <h2>Business Continuity Planning (BCP) vs. Disaster Recovery Planning (DRP)</h2>
      <CodeBlock>{`BCP — how the BUSINESS keeps operating during a disruption (alternate processes, alternate locations)
DRP — how IT SYSTEMS specifically get restored (the technical recovery procedures, RTO/RPO targets)

DRP is a subset that supports the broader BCP.`}</CodeBlock>

      <h2>Alternate site strategies</h2>
      <CodeBlock label="ranked by cost vs. recovery speed">{`Hot site   — a fully equipped, staffed, near-real-time mirror of production — fastest recovery, most expensive
Warm site   — hardware in place, but requires some setup/data restoration — moderate cost and speed
Cold site    — basic facility with power/space only, no pre-installed systems — cheapest, slowest recovery`}</CodeBlock>

      <h2>Tabletop exercises</h2>
      <p>
        A tabletop exercise is a discussion-based walkthrough of an incident scenario with key stakeholders
        — no systems are actually touched. This is a low-cost, high-value way to find gaps in a response
        plan (unclear ownership, missing contact information, an assumption that turns out to be wrong)
        before a real incident forces the discovery under pressure.
      </p>

      <h2>Communication during an incident</h2>
      <p>
        Security+ expects you to know that incident communication has legal and regulatory dimensions, not
        just technical ones — breach notification laws (GDPR's 72-hour requirement being the best-known
        example) impose hard deadlines on when affected parties and regulators must be informed, completely
        independent of whether the technical investigation is finished.
      </p>

      <Callout variant="warn">
        <p>
          A common exam trap: choosing an answer that delays notification "until the investigation is
          complete." Many regulations require notification within a fixed window of DISCOVERY, not
          resolution — compliance and technical timelines are often running on two separate clocks
          simultaneously.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the Security+ layer that sits above every technical module in this course: governance
        and risk math, cryptographic foundations, IAM models, resilient architecture, and the formal
        incident response process that ties a real security program together end to end.
      </p>
    </div>
  );
}
