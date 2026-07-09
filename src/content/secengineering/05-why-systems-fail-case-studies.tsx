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

      <h2>Case study: Scattered Spider and the help desk as an unpatched attack surface</h2>
      <p>
        Scattered Spider (also tracked as Octo Tempest, or UNC3944) built its reputation on a technique
        that bypasses essentially every technical MFA control in existence: calling or SMS-ing a target
        company's own IT help desk, impersonating a real employee using personal details gathered from
        social media or prior breaches, and simply asking for a password reset or an MFA re-enrollment onto
        a device the attacker controls. No exploit, no malware, no phishing page — just a phone call to a
        process that exists on paper as an identity-verification control.
      </p>
      <p>
        Once inside, the group abuses identity providers to mint backdoor admin accounts and forge SAML
        tokens, escalates to Domain Admin, and deploys ransomware — in this case DragonForce, used in the
        April-May 2025 intrusions against major UK retailers Marks &amp; Spencer and Harrods, which caused
        significant operational disruption.
      </p>
      <Callout variant="warn">
        <p>
          This is Pattern 1 in its purest form. The help desk's password-reset procedure is, on paper, an
          identity-verification security boundary. In practice, the actual verification step is a human
          under time pressure making a judgment call about whether a caller "sounds legitimate" — not a
          technical control at all. A boundary that exists in a policy document but is trivially bypassable
          by anyone willing to make a confident phone call is not a real boundary, no matter how strong the
          MFA behind it looks on an architecture diagram.
        </p>
      </Callout>

      <h2>Case study: the Salesloft Drift OAuth breach and transitive trust</h2>
      <p>
        In August 2025, attackers tracked as UNC6395 compromised Salesloft's GitHub environment, used that
        foothold to pivot into Drift's AWS environment, and stole OAuth refresh tokens that Drift held on
        behalf of every customer using the Drift-Salesforce integration. With those tokens, the attackers
        could impersonate the trusted Drift application itself and access Salesforce data across more than
        700 downstream organizations — none of whom had been directly breached themselves.
      </p>
      <p>
        This is a distinct failure pattern from the other four in this lesson, worth naming on its own:
        transitive trust. Each individual victim organization may well have correctly secured their own
        Salesforce instance, their own users, their own endpoints. But every one of them implicitly trusted
        the Drift integration's entire security posture wholesale, with no way to observe, limit, or
        contain what that trusted third party could do on their behalf once granted access. This is exactly
        the Secure Design Principles lesson's Least Privilege and blast-radius containment ideas, just
        applied to a third-party integration instead of an internal account or process — and it's a
        reminder that a system is only as secure as the weakest link in every chain of trust it accepts,
        including chains it never directly reviewed.
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

      <h2>Where to go next: books, sites, and communities</h2>
      <p>
        Finishing this course is a starting point, not an end point — the field moves fast, and staying
        current means continuing to read and practice past today. The list below is organized by category
        so you can pick up where your own interests point.
      </p>

      <h3>Books</h3>
      <p><strong>Beginner</strong></p>
      <ul>
        <li>The Web Application Hacker's Handbook &mdash; Dafydd Stuttard &amp; Marcus Pinto</li>
        <li>Hacking: The Art of Exploitation &mdash; Jon Erickson</li>
        <li>Black Hat Python &mdash; Justin Seitz</li>
      </ul>
      <p><strong>Intermediate</strong></p>
      <ul>
        <li>Real-World Bug Hunting &mdash; Peter Yaworski</li>
        <li>Bug Bounty Bootcamp &mdash; Vickie Li</li>
        <li>Web Security for Developers &mdash; Malcolm McDonald</li>
      </ul>
      <p><strong>Advanced</strong></p>
      <ul>
        <li>The Tangled Web &mdash; Michal Zalewski</li>
        <li>Practical Binary Analysis &mdash; Dennis Andriesse</li>
        <li>The Art of Software Security Assessment &mdash; Mark Dowd, John McDonald &amp; Justin Schuh</li>
      </ul>

      <h3>Learning platforms</h3>
      <ul>
        <li><a href="https://portswigger.net/web-security" target="_blank" rel="noreferrer">PortSwigger Web Security Academy</a></li>
        <li><a href="https://owasp.org" target="_blank" rel="noreferrer">OWASP</a></li>
        <li><a href="https://academy.hackthebox.com" target="_blank" rel="noreferrer">Hack The Box Academy</a></li>
        <li><a href="https://tryhackme.com" target="_blank" rel="noreferrer">TryHackMe</a></li>
        <li><a href="https://overthewire.org" target="_blank" rel="noreferrer">OverTheWire</a></li>
        <li><a href="https://pentesterlab.com" target="_blank" rel="noreferrer">PentesterLab</a></li>
      </ul>

      <h3>Bug bounty platforms</h3>
      <ul>
        <li><a href="https://hackerone.com" target="_blank" rel="noreferrer">HackerOne</a></li>
        <li><a href="https://bugcrowd.com" target="_blank" rel="noreferrer">Bugcrowd</a></li>
        <li><a href="https://intigriti.com" target="_blank" rel="noreferrer">Intigriti</a></li>
        <li><a href="https://yeswehack.com" target="_blank" rel="noreferrer">YesWeHack</a></li>
      </ul>

      <h3>Research blogs</h3>
      <ul>
        <li><a href="https://googleprojectzero.blogspot.com" target="_blank" rel="noreferrer">Google Project Zero Blog</a></li>
        <li><a href="https://portswigger.net/research" target="_blank" rel="noreferrer">PortSwigger Research</a></li>
        <li><a href="https://www.microsoft.com/en-us/security/blog/" target="_blank" rel="noreferrer">Microsoft Security Research</a></li>
        <li><a href="https://blog.trailofbits.com" target="_blank" rel="noreferrer">Trail of Bits Blog</a></li>
      </ul>

      <h3>News</h3>
      <ul>
        <li><a href="https://thehackernews.com" target="_blank" rel="noreferrer">The Hacker News</a></li>
        <li><a href="https://www.bleepingcomputer.com" target="_blank" rel="noreferrer">BleepingComputer</a></li>
        <li><a href="https://www.darkreading.com" target="_blank" rel="noreferrer">Dark Reading</a></li>
        <li><a href="https://krebsonsecurity.com" target="_blank" rel="noreferrer">Krebs on Security</a></li>
        <li><a href="https://www.securityweek.com" target="_blank" rel="noreferrer">SecurityWeek</a></li>
        <li><a href="https://isc.sans.edu" target="_blank" rel="noreferrer">SANS Internet Storm Center</a></li>
      </ul>

      <h3>CVE &amp; threat intel references</h3>
      <ul>
        <li><a href="https://www.cve.org" target="_blank" rel="noreferrer">MITRE CVE Database</a></li>
        <li><a href="https://nvd.nist.gov" target="_blank" rel="noreferrer">NIST National Vulnerability Database (NVD)</a></li>
        <li><a href="https://www.exploit-db.com" target="_blank" rel="noreferrer">Exploit Database</a></li>
        <li><a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer">CISA Known Exploited Vulnerabilities Catalog</a></li>
        <li><a href="https://attack.mitre.org" target="_blank" rel="noreferrer">MITRE ATT&amp;CK Framework</a></li>
      </ul>

      <p>
        This course's own labs and lessons drew on exactly these kinds of sources — real research blogs,
        real CVE and ATT&amp;CK references, real incident write-ups from outlets like these. Continuing to
        follow them, long after finishing this course, is how a working security practitioner keeps their
        skills current in a field that never stops moving.
      </p>
    </div>
  );
}
