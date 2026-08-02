import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ApiSecurityFundamentals() {
  return (
    <div className="prose-hh">
      <h1>API Security Fundamentals: REST, GraphQL &amp; Where the Vulnerabilities Live</h1>
      <p>
        Every technique in the Web Application module still applies here — SQL injection doesn't care whether
        the vulnerable parameter arrives via an HTML form or a JSON body. What's different about testing an API
        directly, instead of the web app sitting in front of it, is that the browser's guardrails disappear.
        There's no client-side validation to fight through, no CSS hiding fields you're not "supposed" to see,
        and often no rate limiting the frontend would normally trigger. You're talking straight to the backend's
        actual trust boundary — which is exactly why APIs consistently produce a different, often more severe,
        class of findings than the web pages built on top of them.
      </p>

      <h2>Why APIs are a distinct testing surface, not just "web testing without a UI"</h2>
      <ul>
        <li>
          <strong>The client-side check is gone.</strong> A web form might disable the "quantity" field above
          10 — the API endpoint behind it almost never re-enforces that limit, because the developer trusted the
          UI to do it.
        </li>
        <li>
          <strong>Undocumented fields still work.</strong> A mobile app's API calls routinely accept fields the
          app's own UI never exposes (an internal flag, a role field, a debug parameter) — because the backend
          schema was built first and the UI only ever used a subset of it.
        </li>
        <li>
          <strong>Machine-to-machine traffic gets less scrutiny.</strong> Teams that carefully review
          user-facing pages often ship API endpoints for a mobile app or third-party integration with far less
          security review, on the (false) assumption that "only our app calls this."
        </li>
      </ul>

      <h2>The OWASP API Security Top 10 — how it maps to what you already know</h2>
      <CodeBlock label="OWASP API Security Top 10 (2023), condensed">{`API1  Broken Object Level Authorization (BOLA)   -> IDOR, but at the API's object-id layer
API2  Broken Authentication                       -> weak/missing token validation, credential stuffing
API3  Broken Object Property Level Authorization  -> mass assignment + excessive data exposure, merged
API4  Unrestricted Resource Consumption           -> missing rate limits, pagination abuse, huge queries
API5  Broken Function Level Authorization (BFLA)   -> a low-privilege token calling an admin-only endpoint
API6  Unrestricted Access to Sensitive Business Flows -> automatable actions with no anti-abuse control
API7  Server Side Request Forgery                 -> the same SSRF you already know, via an API parameter
API8  Security Misconfiguration                   -> verbose errors, exposed debug endpoints, permissive CORS
API9  Improper Inventory Management                -> old/undocumented API versions still live and unpatched
API10 Unsafe Consumption of APIs                    -> trusting a third-party API's response without validation`}</CodeBlock>
      <p>
        Notice how many of these are the exact bugs you already know how to find (IDOR, SSRF, misconfiguration)
        — just relocated to a layer where there's no UI to hide the request shape, and often no WAF tuned for
        JSON bodies the way one might be tuned for HTML form fields.
      </p>

      <h2>REST vs. GraphQL: two different attack surfaces</h2>
      <p>
        A REST API exposes many small, purpose-specific endpoints — <code>GET /users/42</code>,{' '}
        <code>POST /orders</code> — so testing is largely about walking the endpoint list and probing each one's
        authorization independently. GraphQL exposes a single endpoint (usually <code>/graphql</code>) that
        accepts a query describing exactly what data to return, which shifts the attack surface toward the{' '}
        <em>query itself</em>: what fields can be requested that shouldn't be publicly readable, how deeply can
        queries nest, and whether introspection (a query that asks the API to describe its own entire schema) is
        left enabled in production.
      </p>
      <CodeBlock label="finding the real API behind a web/mobile app">{`# Browser DevTools -> Network tab, filter by XHR/Fetch while using the app normally
# Mobile app -> a proxy (Burp/mitmproxy) with the phone's traffic routed through it
# Look specifically for:
#   - a Bearer token or API key in request headers
#   - the exact JSON shape of a request body (more fields than the UI form shows?)
#   - an api.target.com or /api/v2/ path distinct from the main site
#   - a GraphQL query body — POST to /graphql with {"query": "..."}`}</CodeBlock>

      <Callout variant="tip">
        <p>
          The single most valuable habit when starting on any API: capture one real, successful request from
          the legitimate app first, then modify it. Trying to guess an API's shape from scratch wastes far more
          time than intercepting one working call and asking "what happens if I change this field, remove this
          header, or use someone else's id here?"
        </p>
      </Callout>

      <h2>API versioning and the inventory problem</h2>
      <p>
        Because breaking an API breaks every client depending on it, teams almost never delete an old version —
        they add <code>/v2/</code> and quietly leave <code>/v1/</code> running, sometimes still on outdated
        authorization logic that <code>/v2/</code> fixed. Checking whether <code>/api/v1/</code>,{' '}
        <code>/api/beta/</code>, or an internal-sounding <code>/api/internal/</code> path still responds is
        often the fastest way to find a vulnerability that was already "fixed" in the version everyone actually
        uses.
      </p>

      <Callout variant="danger">
        <p>
          Everything in this module assumes an API you're explicitly authorized to test — a bug bounty program's
          published scope, or a lab/CTF environment. Sending modified requests against a production API you
          don't have permission to test is unauthorized access, full stop, regardless of how "just curious"
          the request looks.
        </p>
      </Callout>
    </div>
  );
}
