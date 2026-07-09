import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ThreatModeling() {
  return (
    <div className="prose-hh">
      <h1>Threat Modeling</h1>
      <p>
        Threat modeling is the structured practice of asking "what could go wrong with this system, and
        what should we do about it" BEFORE it ships — turning the intuitive design review from the previous
        lesson into a repeatable process a whole engineering team can run consistently.
      </p>

      <h2>STRIDE: a category checklist for finding threats</h2>
      <CodeBlock label="six threat categories, and where you've seen each one in this course">{`Spoofing                  — pretending to be something/someone else
                            (the OAuth redirect bypass and BEC phishing labs)
Tampering                  — modifying data or code without authorization
                            (the SQL injection and public-write bucket labs)
Repudiation                 — denying having performed an action, with no evidence to disprove it
                            (weak/absent audit logging — the disabled-logging cloud lab)
Information Disclosure       — exposing information to unauthorized parties
                            (nearly every IDOR, SSRF, and exposed-bucket lab in this course)
Denial of Service              — degrading or denying legitimate access
                            (largely out of scope for this course's labs, but a core STRIDE category)
Elevation of Privilege           — gaining capabilities beyond what was authorized
                            (every privesc lab from Module 2 onward)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice STRIDE isn't abstract theory — every single category maps directly onto lab categories
          you've already practiced hands-on in this course. That's not a coincidence: STRIDE was designed
          specifically to be a complete, memorable checklist covering the actual space of things that go
          wrong in real systems.
        </p>
      </Callout>

      <h2>Data flow diagrams: where you actually apply STRIDE</h2>
      <p>
        Threat modeling starts by diagramming how data moves through a system — external entities, processes,
        data stores, and the trust boundaries between them (where data crosses from a less-trusted zone
        into a more-trusted one, like "internet" into "internal network"). STRIDE gets applied at each
        trust boundary crossing specifically, since that's where an assumption about trust could be wrong.
      </p>
      <CodeBlock label="a simplified example: a login flow">{`[User's Browser] --(username/password)--> [TRUST BOUNDARY] --> [Auth Service] --> [User Database]

At the trust boundary: can this input be spoofed (fake login form)? Tampered with (modified request)?
Does the auth service properly authenticate before touching the database (elevation of privilege)?
Is every failed/successful login attempt logged (repudiation)?`}</CodeBlock>

      <h2>DREAD: scoring threats once you've found them</h2>
      <CodeBlock label="a simple 1-10 scoring model for prioritization">{`Damage           — how bad is the impact if this is exploited?
Reproducibility   — how reliably can it be triggered?
Exploitability     — how much skill/resources does exploiting it require?
Affected users       — how many users/systems does this impact?
Discoverability        — how easily would an attacker find this on their own?

Average the five scores -> a rough priority ranking across many identified threats`}</CodeBlock>
      <p>
        DREAD has known weaknesses (it's subjective, different reviewers score the same threat
        differently) but remains useful as a structured starting point, especially compared to purely
        gut-feel prioritization across a long list of findings.
      </p>

      <h2>Attack trees: modeling an attacker's goal-directed reasoning</h2>
      <CodeBlock label="working backward from a goal, the way an attacker actually thinks">{`GOAL: Compromise the domain controller (recall the AD module's capstone lab)
  ├── Phish an employee for credentials
  │     ├── Spear-phishing email with a malicious attachment
  │     └── Fake login page harvesting credentials
  ├── Exploit an unpatched vulnerability (Zerologon, PrintNightmare)
  └── Abuse a misconfiguration (DCSync rights on a service account)`}</CodeBlock>
      <p>
        This is exactly the mental model the Red Teaming module's attack chains were built to teach
        hands-on — an attack tree is the same reasoning, formalized as a design-review artifact produced
        BEFORE an attacker ever tries any of these branches for real.
      </p>

      <Callout variant="warn">
        <p>
          Threat modeling done once at launch and never revisited quickly goes stale — new features add new
          data flows and trust boundaries the original model never considered. Mature security programs
          treat threat modeling as a recurring practice tied to major design changes, not a one-time
          checkbox.
        </p>
      </Callout>

      <p>
        With a systematic method for finding and prioritizing threats established, the next lesson applies
        this specifically to cryptographic systems — where threat modeling failures have historically caused
        some of the most severe real-world security breaks.
      </p>
    </div>
  );
}
