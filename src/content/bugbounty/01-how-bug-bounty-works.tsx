import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function HowBugBountyWorks() {
  return (
    <div className="prose-hh">
      <h1>How Bug Bounty Hunting Actually Works</h1>
      <p>
        Bug bounty programs pay independent researchers for responsibly disclosing vulnerabilities in a
        company's systems. It's the same technical skillset as pentesting, applied against a self-selected
        target list, competing against every other hunter with access to the same program.
      </p>

      <h2>The platforms</h2>
      <ul>
        <li><strong>HackerOne</strong> — the largest platform, hosts programs from companies of every size.</li>
        <li><strong>Bugcrowd</strong> — similar model, slightly different program mix and triage process.</li>
        <li><strong>Company-run programs</strong> — some large companies (Google, Meta, etc.) run their
        own program infrastructure directly.</li>
      </ul>

      <h2>Public vs. private programs</h2>
      <p>
        Public programs are open to any registered researcher — high competition, but no application
        process. Private programs are invite-only, usually earned by demonstrating skill on public programs
        first — less competition, often better payouts, and companies use them specifically because they
        want a smaller, more trusted pool of researchers.
      </p>

      <h2>The realistic economics</h2>
      <p>
        Most hunters do not make a living from bounties alone in their first year — this is a skill that
        compounds. Early wins are usually low-severity findings (a few hundred dollars); the real payouts
        come once you've built deep expertise on specific target types (a particular CMS, a particular
        API framework) and can spot patterns others miss.
      </p>
      <Callout variant="tip">
        <p>
          The single best predictor of bug bounty success isn't finding the most exotic vulnerability
          classes — it's consistency: testing methodically, reading disclosed reports constantly, and
          treating recon as seriously as exploitation.
        </p>
      </Callout>

      <h2>How researchers actually think (the mindset shift)</h2>
      <p>
        <em>Real-World Bug Hunting</em>'s central lesson is that top researchers aren't smarter at exploit
        development than average testers — they're more disciplined about three habits:
      </p>
      <ul>
        <li><strong>Reading disclosed reports obsessively</strong> — HackerOne's public disclosure
        database is a training library nobody should skip.</li>
        <li><strong>Understanding the target deeply before testing</strong> — what framework, what third-party
        integrations, what does the changelog/commit history reveal about recent changes.</li>
        <li><strong>Testing the same handful of vulnerability classes relentlessly across every endpoint</strong>
        — IDOR and auth flaws over and over, rather than chasing novelty.</li>
      </ul>

      <h2>Program scope: read it like a contract, because it is one</h2>
      <CodeBlock label="a typical scope entry">{`In scope:     *.example.com, api.example.com
Out of scope: blog.example.com (third-party hosted), physical attacks, social engineering
Rewards:      Critical: $5,000-$15,000 | High: $1,500-$5,000 | Medium: $500-$1,500 | Low: $100-$500`}</CodeBlock>
      <Callout variant="danger">
        <p>
          Testing anything outside the documented scope — even a subdomain that "looks" related — is not
          authorized, even under an active bug bounty program. Scope documents are legally meaningful; read
          them fully before touching anything.
        </p>
      </Callout>

      <p>
        The next lesson covers the actual work of finding targets within scope efficiently — recon at
        scale — followed by how to write the report that actually gets a fast, well-paid triage response.
      </p>
    </div>
  );
}
