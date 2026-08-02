import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BusinessLogicChaining() {
  return (
    <div className="prose-hh">
      <h1>Business Logic Flaws &amp; Chaining Low-Severity Bugs</h1>
      <p>
        Every bug class taught elsewhere on this platform — SQLi, XSS, IDOR, SSRF — has a name because it's a
        technical implementation mistake: escaping done wrong, a check left out. Business logic flaws are
        different. The code works exactly as written; the <em>workflow itself</em> is missing an assumption
        the developer never thought to defend. These bugs don't show up in an automated scanner at all —
        finding them is closer to reading a rulebook and asking "what happens if I do the steps out of
        order, or skip one entirely?"
      </p>

      <h2>What makes a bug "business logic" instead of a technical vulnerability</h2>
      <CodeBlock label="the distinguishing question">{`Technical vuln:    Is input handled unsafely? (unescaped SQL, unsanitized HTML, unvalidated redirect)
Business logic:    Does the WORKFLOW enforce the rules it's supposed to, in every possible order?`}</CodeBlock>
      <p>
        A checkout flow that correctly escapes every input can still let you apply a "first order only" 10%
        discount code to your fifth order, simply because nothing on the backend actually checks order
        history before applying it. There's no injection, no XSS, no broken authentication — the logic that
        was supposed to enforce "first order only" just isn't there.
      </p>

      <h2>Common business logic patterns worth specifically testing for</h2>
      <ul>
        <li>
          <strong>Sequence bypass</strong> — can you call step 3 of a multi-step flow (e.g. "confirm
          payment") without ever completing step 2 ("verify amount")? Multi-step wizards are frequently
          enforced only in the frontend, with the backend trusting whichever request arrives.
        </li>
        <li>
          <strong>Negative or zero values</strong> — a quantity field, discount amount, or transfer amount
          that accepts a negative number can sometimes flip a subtraction into an addition (e.g. "transfer
          -$100" adding $100 to your own balance instead of removing it).
        </li>
        <li>
          <strong>State assumptions</strong> — does the application assume a coupon, invite, or password-reset
          token can only ever be used once, and actually enforce that server-side, or does it just stop
          <em> showing</em> the option once used while the endpoint itself still accepts it?
        </li>
        <li>
          <strong>Race conditions</strong> — the TOCTOU (time-of-check-to-time-of-use) gap this platform's
          own labs demonstrate directly: a coupon or balance check-then-write split into two steps can be
          abused by firing many requests at nearly the same instant, so every request passes the check
          before any of them completes the write.
        </li>
      </ul>
      <Callout variant="tip">
        <p>
          The single highest-leverage question to ask of any multi-step flow: "what does the server actually
          verify, versus what does the client just choose not to show me?" Business logic bugs live almost
          entirely in that gap.
        </p>
      </Callout>

      <h2>Chaining: why two Low findings can be worth more than one Medium</h2>
      <p>
        Triage rubrics score a single finding in isolation, but real impact often comes from combining two
        individually unimpressive bugs. An IDOR that leaks another user's internal ID, chained with a mass
        assignment bug that accepts an arbitrary <code>user_id</code> field, becomes full account takeover —
        neither bug alone gets you there.
      </p>
      <CodeBlock label="a realistic chain, step by step">{`1. Low-severity: /api/users/search?name=jsmith leaks internal numeric user_ids in its response
   (information disclosure — mildly interesting on its own, easy to under-value)

2. Low-severity: /api/account/update blindly accepts a "target_user_id" field with no ownership check
   (looks like just a validation gap in isolation)

3. CHAINED: use finding #1 to learn a target's internal user_id, then use finding #2 to update
   THEIR account instead of your own — full account takeover, reported and scored as Critical`}</CodeBlock>
      <p>
        This is exactly why a strong report doesn't just list a bug in isolation — it's worth explicitly
        asking, for every finding, "what does this let me learn or do that feeds into something else I've
        already found?"
      </p>

      <h2>A minimal recon habit that surfaces chains</h2>
      <p>
        Keep a running scratch file of every "boring," sub-Critical observation as you test — a leaked
        internal ID, an endpoint that accepts an unexpected field, a status code that differs when a
        parameter is missing. Most individual entries in that file go nowhere. The ones that eventually
        connect to each other are exactly how the highest-paid reports actually get built — not from one
        brilliant single finding, but from noticing that two "meh" observations fit together.
      </p>

      <Callout variant="danger">
        <p>
          Testing business logic flaws — placing negative-value orders, bypassing workflow steps, or racing
          endpoints — still means sending real requests against a real application. Stay strictly inside an
          authorized program's published scope and rules of engagement; a "logic bug" is not exempt from the
          same authorization requirements as any other testing technique.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the full bug bounty methodology this course teaches: how programs and payouts actually
        work, recon at scale, writing reports that get fast triage, prioritizing where the real bounties are,
        and — closing the loop — finding and chaining the logic flaws that automated scanners never catch at
        all.
      </p>
    </div>
  );
}
