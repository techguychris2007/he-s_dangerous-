import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WritingReports() {
  return (
    <div className="prose-hh">
      <h1>Reading &amp; Writing High-Quality Reports</h1>
      <p>
        A brilliant finding with a confusing report gets triaged slowly, downgraded in severity, or
        outright closed as "unable to reproduce." Report writing is a skill in its own right, and it
        directly determines how much you get paid.
      </p>

      <h2>The anatomy of a great report</h2>
      <CodeBlock label="the standard structure triagers expect">{`Title:            Clear, specific — "IDOR in /api/invoice allows viewing any user's invoices"
                  (not: "Security Issue Found")

Summary:          2-3 sentences: what's broken, what an attacker can do with it

Steps to reproduce: Numbered, exact, copy-pasteable — assume the triager has zero context
                    1. Log in as user A, note session cookie
                    2. Request GET /api/invoice?id=1002 (belonging to user B)
                    3. Observe user B's full invoice data returned

Impact:            What a real attacker achieves — "any authenticated user can enumerate
                   and read every other user's billing history and address"

Suggested fix:      Optional but valued — "verify invoice.user_id matches the session's user_id
                    server-side before returning data"

Proof:               Screenshot, curl command + response, or short video`}</CodeBlock>

      <h2>Why "steps to reproduce" is the single most important section</h2>
      <p>
        Triagers handle dozens of reports a day, often across products they don't personally maintain.
        A report that requires them to guess at missing steps gets deprioritized or bounced back with
        questions — burning days of turnaround time. Write reproduction steps as if the reader has never
        seen the application before, because often they haven't.
      </p>

      <h2>Framing impact correctly</h2>
      <CodeBlock label="weak vs. strong impact statements">{`WEAK:   "This could be bad if exploited."
STRONG: "Any authenticated user can access this endpoint with an arbitrary ID parameter to read
        every other customer's name, address, and total historical spend — a full customer PII leak
        affecting an estimated 50,000+ accounts based on the sequential ID range observed."`}</CodeBlock>
      <p>
        Quantify impact wherever you can (how many accounts, what data classes, whether it's read-only or
        allows modification) — this is exactly the difference between a Medium and a Critical severity
        rating in most triage rubrics.
      </p>

      <h2>Reading disclosed reports to calibrate your own</h2>
      <p>
        HackerOne's public disclosure database (reports companies have agreed to make public) is the best
        free training resource in this entire field — read reports in categories you're targeting, and
        pay attention to how the strongest ones frame impact and reproduction steps, not just the technical
        payload used.
      </p>

      <Callout variant="tip">
        <p>
          Before submitting, read your own report as if you'd never seen the app: can someone with zero
          context reproduce this from your steps alone, with no follow-up questions needed? If not, add
          detail until the answer is yes.
        </p>
      </Callout>

      <h2>Handling triage disagreements professionally</h2>
      <p>
        Severity downgrades and "not applicable" responses happen even to strong reports. Respond with
        additional evidence and calm, specific pushback (not frustration) — triagers reward researchers who
        engage constructively, and reputation compounds across a program relationship over time.
      </p>

      <Callout variant="warn">
        <p>
          Never threaten public disclosure to pressure a faster response or higher payout — this violates
          nearly every program's rules and can get you permanently banned from the platform, regardless of
          how valid the underlying finding was.
        </p>
      </Callout>

      <p>
        The final lesson in this module closes the loop: where to actually spend your limited hunting time
        for the best return, based on the skills-priority list that opens this course's roadmap.
      </p>
    </div>
  );
}
