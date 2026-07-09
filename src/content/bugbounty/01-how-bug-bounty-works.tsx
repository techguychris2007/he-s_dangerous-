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
        <li><strong>HackerOne</strong> — the largest platform by researcher count and program volume, with a
        heavy skew toward large public programs (tech companies, US federal vulnerability disclosure
        programs) and its own in-house triage team.</li>
        <li><strong>Bugcrowd</strong> — a similar model with a comparable mix of public and private programs;
        historically leaned harder into managed/curated private programs and its own "Bugcrowd University"
        training content.</li>
        <li><strong>Intigriti</strong> — Europe-based, with a program mix weighted toward European
        companies and GDPR-conscious organizations; pays in a mix of points-based and direct cash rewards
        depending on the program.</li>
        <li><strong>YesWeHack</strong> — another Europe-based platform (French), strong presence with
        European public-sector and enterprise programs, plus its own "Dojo" free training platform.</li>
        <li><strong>Company-run programs</strong> — some large companies (Google, Meta, Apple, Microsoft,
        etc.) run their own program infrastructure directly rather than through a third-party platform,
        often with the highest ceiling payouts (Google and Apple's top-tier awards run well into six
        figures for the most severe classes of bugs).</li>
      </ul>
      <p>
        The platforms differ less in the underlying technical work than in program mix and payout
        mechanics: HackerOne and Bugcrowd have the largest catalogs of major US tech company programs and
        the deepest public disclosure archives to learn from; Intigriti and YesWeHack have a higher
        concentration of European enterprises and public-sector programs, which matters if you're
        targeting industries (finance, government) that skew toward those regions. Payout models vary too
        — some programs pay flat bounties per severity tier, others run point-based leaderboard systems
        that convert to cash or prizes, and a growing number blend a bounty with a revenue-share or
        "managed bug bounty" retainer paid to the platform itself rather than the researcher.
      </p>

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
      <p>
        The distribution of earnings across the hunter population is heavily skewed, not evenly spread —
        a small number of top researchers (HackerOne and Bugcrowd both publish leaderboards and, at times,
        aggregate earnings figures) account for a disproportionate share of total payouts, largely because
        severity, not volume, drives income: one Critical-rated report often pays more than dozens of Low
        or Informational ones combined. This is why experienced hunters increasingly specialize — going
        deep on GraphQL APIs, or OAuth implementations, or a specific SaaS platform's admin panels — rather
        than spreading thin across every program and vulnerability class available.
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
