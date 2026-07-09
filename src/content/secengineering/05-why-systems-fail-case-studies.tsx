import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WhySystemsFailCaseStudies() {
  return (
    <div className="prose-hh">
      <h1>Why Security Systems Actually Fail: Recurring Patterns</h1>
      <p>
        This closing lesson of the closing module pulls back to the widest possible view: across every
        technique, every lab, and every historical incident referenced throughout this entire course, the
        same handful of root-cause patterns keep recurring. Recognizing these patterns is worth more than
        memorizing any single technique, because it transfers to systems and technologies that don't exist
        yet.
      </p>

      <h2>Pattern 1: the human factor is the actual attack surface</h2>
      <p>
        Nearly every intrusion chain in this course started with a human decision, not a purely technical
        flaw: a phished credential, a reused password, an overly broad permission granted "to save time," a
        developer disabling a security check because it was blocking a deadline. Technology can reduce how
        much a single human mistake costs, but it has never eliminated the human factor as the leading root
        cause of real breaches.
      </p>

      <h2>Pattern 2: complexity is where security dies</h2>
      <p>
        Every system in this course that failed, failed at a point where complexity exceeded someone's
        ability to reason about it correctly — an IAM policy too complex to audit by eye, a codebase too
        large for any one engineer to hold the full security model in their head, a network too flat and
        unsegmented for anyone to reason about blast radius. Economy of Mechanism (from the design
        principles lesson) exists precisely because complexity is not a neutral cost — it is where
        vulnerabilities hide most effectively.
      </p>

      <h2>Pattern 3: security debt compounds silently until it doesn't</h2>
      <CodeBlock label="the shape of nearly every incident narrative in this course">{`A shortcut gets taken under time pressure ("we'll fix the permissions later")
          ↓
No immediate consequence — the system works fine for months or years
          ↓
The shortcut is forgotten, or the person who made it has moved on
          ↓
An unrelated event (an SSRF bug, a phished credential, a scan by an attacker) finally
exercises that old shortcut
          ↓
Full-scope incident, disproportionate to how "small" the original shortcut felt`}</CodeBlock>
      <p>
        This is exactly the shape of the WAF-to-full-breach chain from the Cloud module, and the NotPetya-
        style lateral spread lab — a single deferred decision, compounding silently, until an unrelated
        trigger cashes it in all at once.
      </p>

      <h2>Pattern 4: incentives shape outcomes more than intentions do</h2>
      <p>
        Revisiting the Security Economics lesson: teams rarely ship insecure systems because they don't
        care about security. They ship them because the organizational incentives — ship dates, feature
        velocity, cost pressure — are measured and rewarded far more immediately and visibly than security
        outcomes, which mostly show up as an absence of bad news. Fixing this durably requires changing what
        gets measured and rewarded, not just running more training.
      </p>

      <h2>Pattern 5: detection and response matter as much as prevention</h2>
      <p>
        Every prevention control in this course can, and eventually will, fail against a sufficiently
        determined or lucky attacker. The SOC and Digital Forensics modules exist because mature security
        programs assume this and invest comparably in detecting and responding to a breach already in
        progress — not just in trying to prevent one perfectly, which no real system has ever achieved
        indefinitely.
      </p>

      <Callout variant="tip">
        <p>
          If you take exactly one idea from this entire course into your career, make it this: security is
          not a checklist of features to implement once. It's a continuous discipline of aligning
          incentives, managing complexity, and assuming failure is possible — applied consistently, to
          systems that never stop changing.
        </p>
      </Callout>

      <h2>Course complete</h2>
      <p>
        You've now covered the full curriculum this course was built from: networking and Linux
        fundamentals, reconnaissance methodology, Python tooling, web application vulnerabilities, red team
        and Active Directory tradecraft, bug bounty methodology, SOC and digital forensics, cloud security,
        CompTIA Security+ domain knowledge, binary analysis and exploit development, malware analysis, and
        finally the systems-level security engineering principles tying all of it together. Every module
        paired real conceptual depth with a genuine hands-on lab — the same combination that makes security
        expertise actually transfer to systems you haven't seen before.
      </p>
    </div>
  );
}
