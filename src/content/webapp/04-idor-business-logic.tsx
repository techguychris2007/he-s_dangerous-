import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IdorBusinessLogic() {
  return (
    <div className="prose-hh">
      <h1>Authentication, IDOR &amp; Business Logic Flaws</h1>
      <p>
        This is the category with arguably the best effort-to-payout ratio in bug bounty: no exotic
        payloads, no encoding tricks — just noticing that the application doesn't check whether you're
        allowed to do the thing you're doing.
      </p>

      <h2>IDOR: Insecure Direct Object Reference</h2>
      <p>
        IDOR happens when an application uses a value you control (an ID in a URL, a hidden form field) to
        look up a resource, without verifying that resource actually belongs to you.
      </p>
      <CodeBlock label="the classic IDOR test">{`# you're logged in as user id 1001, viewing your own invoice
curl "http://10.10.60.7/invoice?id=1001" -H "Cookie: session=<your-session>"

# now just change the id
curl "http://10.10.60.7/invoice?id=1002" -H "Cookie: session=<your-session>"
# if this returns someone ELSE's invoice, that's IDOR — full stop`}</CodeBlock>
      <p>
        No payload, no injection — you're simply proving the server trusts the client-supplied ID instead
        of checking session ownership server-side. This is exactly the technique you'll use in this
        module's lab.
      </p>

      <h2>Where IDOR hides beyond obvious IDs</h2>
      <ul>
        <li>Sequential IDs in URLs (<code>?id=1002</code>) — the easiest to spot</li>
        <li>Non-sequential but guessable IDs (UUIDs leaked elsewhere in the app, e.g. in an API response)</li>
        <li>Hidden form fields (<code>&lt;input type="hidden" name="account_id" value="1001"&gt;</code>)</li>
        <li>API endpoints never meant to be called directly, found via JS file analysis</li>
      </ul>

      <h2>Fuzzing for IDOR and hidden endpoints at scale</h2>
      <p>
        Manually incrementing an ID by one and re-requesting it proves the concept, but real APIs can have
        millions of possible IDs, and UUIDs can't be "incremented" at all. <strong>ffuf</strong> is a fast
        web fuzzer built for exactly this: point it at a wordlist of IDs (sequential numbers, leaked UUIDs,
        common usernames) and let it substitute each one into the request automatically.
      </p>
      <CodeBlock label="fuzzing a numeric/UUID ID parameter with ffuf">{`ffuf -u https://target.com/api/user/FUZZ -w ids.txt -mc 200
# -w   the wordlist of candidate IDs to substitute in place of FUZZ
# -mc  only show responses matching this status code (200 = found something) — filters the noise`}</CodeBlock>
      <p>
        The same tool works for discovering endpoints that were never linked anywhere in the app's visible
        UI. <strong>Gobuster</strong> and <strong>dirsearch</strong> serve a related purpose — directory and
        file brute-forcing to surface hidden paths a generic crawler would never find:
      </p>
      <CodeBlock label="directory/file brute-forcing">{`gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt -x php,txt
dirsearch -u https://target.com -e php`}</CodeBlock>
      <p>
        Gobuster is written in Go and prized for raw speed and simplicity; dirsearch is Python-based and
        ships with a larger default wordlist and more built-in output/reporting options out of the box. Most
        testers pick whichever is already installed and comfortable — the two overlap enough in practice
        that neither is a wrong choice. Either one turns up admin panels, backup files, and forgotten API
        versions that a business-logic review then has to check for exactly the IDOR-style flaws this
        lesson covers.
      </p>

      <h2>Authentication flaws worth checking on every target</h2>
      <CodeBlock label="the standard auth checklist">{`- Can you register with an already-taken username/email and get a different error than expected?
- Does the password reset token predictable, reusable, or leaked in a Referer header?
- Is there no rate limiting on login -> brute-forceable
- Does changing "role":"user" to "role":"admin" in a request body get honored by the server?
- Does the app trust a client-side "isAdmin" cookie/localStorage value instead of a server-side check?`}</CodeBlock>

      <h2>Business logic flaws: the category with no checklist</h2>
      <p>
        Business logic vulnerabilities are application-specific — they don't show up in scanners because
        the request is technically "valid," it just does something the business rules never anticipated.
        Real examples repeatedly found in bug bounty reports:
      </p>
      <ul>
        <li>Applying a discount coupon multiple times by replaying the same request</li>
        <li>Negative quantities in a shopping cart producing a negative total (the store pays you)</li>
        <li>Skipping a required workflow step by calling a later API endpoint directly</li>
        <li>Race conditions: submitting the same "redeem gift card" request twice simultaneously before
        the balance updates, redeeming it twice</li>
      </ul>

      <Callout variant="tip">
        <p>
          The mindset shift for business logic testing: stop asking "can I break the input validation?"
          and start asking "what does the business assume I won't do, and what happens if I do it anyway?"
        </p>
      </Callout>

      <h2>Practicing IDOR in the lab</h2>
      <p>
        This module's lab has you enumerate a simple invoice API and confirm IDOR exactly the way shown
        above — changing a resource ID and observing the server return data that doesn't belong to your
        account, then capturing the flag from the leaked record.
      </p>

      <Callout variant="danger">
        <p>
          IDOR testing on a real target still touches other users' real data — always scope this
          explicitly with the client, use dedicated test accounts, and stop the instant you confirm the
          issue rather than continuing to pull more records than needed to prove it.
        </p>
      </Callout>
    </div>
  );
}
