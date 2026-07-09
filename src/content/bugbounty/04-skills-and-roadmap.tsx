import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SkillsAndRoadmap() {
  return (
    <div className="prose-hh">
      <h1>Prioritization: Where the Real Bounties Are</h1>
      <p>
        This closing lesson is a practical prioritization guide — which skills to sharpen first, and a
        realistic six-month plan for going from zero to submitting real reports.
      </p>

      <h2>Skills ranked by real-world payout leverage</h2>
      <CodeBlock label="prioritized skill list for bug bounty ROI">{`1. HTTP fundamentals       — you cannot test what you don't understand at the protocol level
2. Linux                    — every tool you'll run assumes comfort with a Linux shell
3. Networking                — understanding what's actually happening beneath the HTTP layer
4. Burp Suite (or curl)       — intercepting and replaying requests is the daily-driver skill
5. JavaScript                  — reading minified app bundles for endpoints/logic reveals real bugs
6. Recon automation             — covered in the previous lesson; scale is a competitive advantage
7. OWASP Top 10                  — covered in the Web Application Hacking module
8. Authentication flaws            — consistently high-value, low-competition category
9. IDOR                              — the best effort-to-payout ratio of any single technique
10. SSRF                               — high severity when found, increasingly common in modern APIs
11. Race conditions                     — advanced, but severely under-tested by most hunters
12. Business logic bugs                   — scanner-proof, requires genuine understanding of the app
13. Cloud security                          — S3 buckets, IAM misconfigurations, an entire growing category`}</CodeBlock>
      <p>
        Notice the order: the first four items are foundational skills, not vulnerability classes — this
        mirrors exactly how this entire course is structured, starting with networking and Linux before any
        exploitation technique.
      </p>

      <h2>A realistic 6-month roadmap</h2>
      <CodeBlock label="month by month">{`Month 1:  Networking, Linux, HTTP fundamentals (Modules 1-2 of this course)
Month 2:  Burp Suite/curl workflow, OWASP Top 10 (Web Application Hacking module)
Month 3:  PortSwigger Web Security Academy — work through every free lab category
Month 4:  TryHackMe "Jr Penetration Tester" path — structured, guided practice
Month 5:  Hack The Box — Easy/Medium boxes, then Active Directory-focused machines
Month 6:  Start submitting on HackerOne and Bugcrowd; read disclosed public reports daily`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice month 6 is the first month actually submitting bounty reports — the first five months are
          entirely skill-building. Hunters who skip straight to live targets without this foundation
          overwhelmingly burn out on frustration within weeks; the ones who invest in fundamentals first
          have a dramatically higher long-term success rate.
        </p>
      </Callout>

      <h2>Free labs worth mastering (referenced throughout this roadmap)</h2>
      <ul>
        <li><strong>PortSwigger Web Security Academy</strong> — free, extremely thorough, the closest thing
        to an academic curriculum for web vulnerabilities specifically (XSS, SQLi, SSRF, XXE, IDOR,
        deserialization, OAuth flaws).</li>
        <li><strong>TryHackMe</strong> — structured learning paths (Pre Security, Jr Penetration Tester, Web
        Fundamentals, OWASP Top 10) ideal for the guided, step-by-step phase of learning.</li>
        <li><strong>Hack The Box</strong> — less hand-holding, more realistic machines; start with Starting
        Point, move to Easy/Medium boxes, and use the Active Directory-labeled machines to apply the Red
        Team module directly.</li>
      </ul>

      <Callout variant="warn">
        <p>
          This course's interactive labs are designed to build the exact muscle memory these external
          platforms assume you already have — commands, methodology, and mindset — so that when you get to
          PortSwigger, THM, or HTB, you're applying skills, not learning syntax for the first time.
        </p>
      </Callout>

      <h2>Course complete (for now)</h2>
      <p>
        You've now covered networking, Linux, reconnaissance methodology, Python tooling, web application
        vulnerabilities, red team/Active Directory tradecraft, and bug bounty methodology — the full
        foundation mapped from the reading list this course was built from. The labs ahead let you apply
        every one of these skills directly, and the roadmap page shows what's still ahead as this course
        continues to grow.
      </p>
    </div>
  );
}
