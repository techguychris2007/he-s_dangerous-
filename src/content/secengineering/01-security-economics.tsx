import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SecurityEconomics() {
  return (
    <div className="prose-hh">
      <h1>Security Economics: Why Systems Actually Fail</h1>
      <p>
        This closing module steps back from any single technique and asks the harder question: why do
        well-funded organizations, staffed with competent engineers, keep shipping insecure systems? The
        answer is almost never "nobody knew better" — it's economics. Whoever bears the cost of a security
        failure, and whoever controls the budget to prevent it, are very often different people.
      </p>

      <h2>The core insight: misaligned incentives</h2>
      <CodeBlock label="a pattern you'll recognize from nearly every lab in this course">{`Who benefits from cutting a security corner?    -> usually whoever ships faster/cheaper
Who bears the cost when it goes wrong?           -> usually someone else: customers, a different
                                                     department, society at large, a future employee

When these two parties are different, the rational economic decision for the first party
is often to under-invest in security — not out of negligence, but because they don't
carry the downside.`}</CodeBlock>
      <p>
        Recall the Cloud module's over-permissioned Lambda role, or the wildcard IAM policy "to save time"
        — in both cases, someone made a locally rational decision (ship faster) that externalized risk onto
        the rest of the organization. This is the pattern security economics studies systematically, rather
        than treating each incident as an isolated engineering mistake.
      </p>

      <h2>Why "just add more security" doesn't work as a strategy</h2>
      <p>
        Security has real costs beyond direct spend: usability friction, developer velocity, and false
        positives that train users to ignore warnings entirely. A control that's technically stronger but
        gets bypassed or disabled by frustrated users in practice provides less real-world security than a
        weaker control people actually follow. This is why "psychological acceptability" is treated as a
        first-class design principle in the next lesson, not an afterthought.
      </p>

      <h2>The lemons market problem in security products</h2>
      <p>
        Borrowed from a classic economics concept about used cars: when buyers can't easily tell a
        high-quality product from a low-quality one, and both are priced similarly, the market tends toward
        the cheaper, lower-quality option — because quality isn't easily verifiable before purchase. Security
        products suffer exactly this problem: a customer often can't tell whether a security tool actually
        works until after a breach reveals it didn't, by which point the purchase decision is long past.
      </p>
      <Callout variant="tip">
        <p>
          This is part of why independent, verifiable signals matter so much in security purchasing —
          third-party audits, published CVE response times, bug bounty program transparency — they exist
          specifically to counteract the "can't verify quality before buying" problem that would otherwise
          push the whole market toward cheaper, weaker products.
        </p>
      </Callout>

      <h2>Externalities: who really pays for a breach</h2>
      <CodeBlock label="the classic externality pattern in security incidents">{`Company X has a data breach.
Direct cost to Company X: some reputational damage, possibly a fine, incident response costs.
Cost to the actual BREACH VICTIMS (customers whose data leaked): identity theft risk, fraud,
years of exposure — often far larger in aggregate than what Company X itself pays.`}</CodeBlock>
      <p>
        Regulation (GDPR, breach notification laws, covered in the Security+ module) exists largely as a
        deliberate policy tool to internalize this externality — forcing the company that made the
        security decisions to bear more of the true cost, changing the economic calculation in favor of
        stronger security investment.
      </p>

      <h2>Moral hazard: when the fix for one incentive problem creates another</h2>
      <p>
        Cyber insurance (covered from the process side in the Security+ module) is the textbook policy
        response to the externality problem above — but it introduces a classic economics problem of its own:{' '}
        <strong>moral hazard</strong>, where being insured against a risk reduces the insured party's own
        incentive to prevent it. An organization that knows a breach's financial fallout is largely covered
        has measurably less pressure to fund the security control that would have prevented it in the first
        place — the same shifted-incentive pattern this lesson opened with, just relocated rather than solved.
      </p>
      <p>
        Insurers have responded exactly the way the "lemons market" section predicts a rational market
        eventually does: requiring evidence of baseline controls (MFA everywhere, tested backups, an incident
        response retainer) before underwriting a policy at all, and pricing premiums against an
        organization's actual security posture rather than treating every applicant as equally risky. This is
        the market slowly re-aligning the incentive the insurance itself had loosened.
      </p>

      <h2>Why this matters for you practically</h2>
      <p>
        Understanding security economics changes how you make a business case for a fix. "This is
        technically insecure" rarely moves a budget decision on its own. "This vulnerability creates
        $X in expected annual loss (recall the ALE calculation from the Security+ module), and the fix
        costs $Y" is the argument that actually competes for resources against every other line item in an
        engineering roadmap.
      </p>

      <h2>A 2026 postscript: AI-orchestrated attack chains</h2>
      <p>
        A newer pattern worth naming through this exact economic lens: by 2026, security teams began
        reporting intrusions where an AI/LLM orchestrator, not a human operator, chained together
        familiar individual techniques — exploiting an exposed service, harvesting credentials, moving
        laterally, and destroying backups — end to end, faster and more consistently than a typical human-
        driven attack chain. None of the individual techniques were new; every one of them appears
        elsewhere in this course.
      </p>
      <p>
        What changed is exactly what this lesson argues matters most: not a new vulnerability, but the
        economics of attack. Automating the orchestration of already-known techniques collapses the cost,
        time, and skill an attack chain requires — the same "who benefits, who bears the cost" calculus
        above, except now the cost of executing a full multi-stage intrusion has dropped sharply, which
        shifts the whole incentive landscape toward more frequent, more automated attempts. Security
        economics predicts this is precisely the kind of shift that matters more over time than any single
        clever new exploit — because it changes the attacker's cost structure at scale, not just one
        target's exposure.
      </p>

      <p>
        With the economic lens established, the next lesson turns to the actual engineering principles —
        the design patterns that hold up well specifically because they account for these economic and
        human realities, not just the theoretical threat model.
      </p>
    </div>
  );
}
