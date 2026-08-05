import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ForensicReportingLegalAndCaseStudies() {
  return (
    <div className="prose-hh">
      <h1>Forensic Reporting, Legal Considerations & Closing Case Studies</h1>
      <p>
        Every technique across this module's six lessons produces evidence that ultimately has to survive
        scrutiny outside a lab environment — in a courtroom, a regulatory inquiry, or an internal disciplinary
        process. This closing lesson covers what that actually requires, and closes with two real, extensively
        documented cases where digital forensic evidence directly determined the outcome.
      </p>

      <h2>Chain of custody, revisited with real consequences</h2>
      <p>
        Lesson 1 introduced chain of custody conceptually. In practice, a broken chain of custody — any
        undocumented gap in who held the evidence, when, and what was done to it — can be enough for a defense
        attorney to get evidence excluded entirely, regardless of how technically sound the underlying forensic
        analysis was. The documentation discipline matters exactly as much as the technical work.
      </p>
      <CodeBlock label="what a defensible chain-of-custody record actually contains">{`- Exact acquisition timestamp, examiner name, and the tool/method used
  (write-blocker model, imaging software version)
- A cryptographic hash (SHA-256, typically) of the acquired image, taken
  IMMEDIATELY after acquisition and verified to match at every subsequent
  handling step -- proving the evidence was never altered after collection
- Every single transfer of custody: who had physical/logical access to the
  evidence, when, and why, with no unexplained gaps`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The hash-verification step is the direct forensic-evidence analog of the Applied Cryptography
          module's integrity-verification material — a hash mismatch between acquisition and later analysis is
          definitive, unambiguous proof the evidence was altered somewhere in between, exactly the same
          integrity guarantee a code-signing hash provides for a software artifact.
        </p>
      </Callout>

      <h2>Expert witness considerations: writing for a non-technical audience</h2>
      <p>
        A forensic report ultimately written for a courtroom or a jury has to explain the SAME technical
        findings from this module's six lessons — MFT timestamps, malfind detections, hash verification — in
        language a non-technical reader can follow and a technical expert can independently verify, echoing the
        Bug Bounty Methodology module's report-writing lesson: reproducible, evidence-backed, and clear about
        exactly what was found versus what is being inferred from it.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real case — the BTK Killer, captured 2005:</strong> Dennis Rader, responsible for at least ten
          murders in Kansas over three decades under the self-given name "BTK" (Bind, Torture, Kill), evaded
          identification for over 30 years. His capture was directly triggered by a digital forensics finding:
          after Rader sent police a floppy disk containing a document, investigators recovered metadata embedded
          in the file showing it had last been modified by a user named "Dennis" and identified the document as
          having been created at Christ Lutheran Church — where Dennis Rader was later confirmed to serve as
          congregation council president. This single piece of embedded document metadata, of exactly the kind
          this module's forensic tools are built to recover and examine, provided the specific lead that ended
          a three-decade investigation. It remains one of the most widely cited real-world illustrations that
          metadata a user never sees or thinks about can carry decisive evidentiary weight.
        </p>
      </Callout>

      <Callout variant="incident">
        <p>
          <strong>Real case — the Silk Road / Ross Ulbricht laptop seizure, October 2013:</strong> FBI agents
          arrested Ross Ulbricht, the operator of the dark-web marketplace Silk Road, in a San Francisco public
          library, timing the arrest specifically to catch him actively logged into the site's administrator
          panel on his open, unlocked laptop. Agents physically distracted Ulbricht and seized the laptop while
          it remained powered on and unlocked, preserving it in that state — deliberately avoiding the need to
          break any disk encryption at all, since the live, running session already held everything
          investigators needed. This is a direct, high-stakes real-world application of this module's Lesson 5
          order-of-volatility principle: the decision to seize a system LIVE, preserving its memory and active
          session state, rather than powering it down and losing that evidence entirely, is exactly the
          tradeoff this course's memory-forensics material has emphasized throughout.
        </p>
      </Callout>

      <h2>Module synthesis: the complete DFIR arc, six lessons</h2>
      <CodeBlock label="the throughline across this module">{`L1  Fundamentals       -> chain of custody, artifact categories, timelines
L2    Memory/artifacts    -> a first, strings-based pass at memory and
                            deleted-file evidence
L3      Logs/network         -> Windows Event Logs, browser history, and
                            what an attacker left behind in application data
L4        Disk forensics        -> the $MFT structure underneath "deleted
                            file recovery," and carving when even that's gone
L5          Memory deep dive       -> structured analysis with Volatility:
                            process trees, injected code, live credentials
L6            Reporting/legal         -> making all five prior lessons'
                            findings survive scrutiny outside the lab, closing
                            with two real cases evidence actually decided`}</CodeBlock>
      <p>
        Across all six lessons, the recurring lesson has been that digital evidence is everywhere — in a file
        system's own bookkeeping structures, in a document's embedded metadata, in memory that survives only as
        long as a system stays powered on — and that finding it is only half the job. The other half, this
        closing lesson's focus, is preserving and presenting it well enough that the finding actually holds up
        under scrutiny.
      </p>
    </div>
  );
}
