import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ApiSecurityFundamentals() {
  return (
    <div className="prose-hh">
      <h1>API Security Fundamentals: REST, GraphQL &amp; Where the Vulnerabilities Live</h1>
      <p>
        An API is a contract through which software exchanges data and requests actions. Its clients may be a
        browser, mobile app, another service, an IoT device or a command-line integration. The server must
        validate every request independently: client-side controls improve usability but cannot enforce access
        because a caller can construct a request without the official interface. Injection vulnerabilities
        also apply to API parameters, headers and serialized bodies. API security therefore focuses on the
        server's identity, authorization, validation, resource limits, business rules and dependency trust.
      </p>

      <h2>Why APIs are a distinct testing surface, not just "web testing without a UI"</h2>
      <ul>
        <li>
          <strong>Client validation is not an authorization boundary.</strong> A form may limit a quantity
          field for usability, but the server must validate type, range, ownership and business constraints on
          every request.
        </li>
        <li>
          <strong>The request schema can be broader than the visible interface.</strong> Test whether the
          server accepts properties that the documented contract does not permit, especially when they alter
          ownership, role, price or approval state. Do not assume that an undocumented property exists; verify
          behavior with the scoped lab's expected result.
        </li>
        <li>
          <strong>Every client is an untrusted caller.</strong> A mobile or service client can be inspected,
          modified or replaced. A secret embedded in a distributed client should not be treated as a server-side
          secret, and the server must enforce permissions even if the official client hides an operation.
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
        The OWASP list is an awareness taxonomy, not a complete vulnerability checklist or a risk rating for
        your application. Generic problems such as injection and vulnerable components still affect APIs even
        though they are not separate categories in this API-specific list. Assess the business impact and the
        actual behavior of the service instead of treating the category labels as proof of severity.
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

      <h2>Separate authentication, function authorization and object authorization</h2>
      <p>
        Authentication answers “which principal is making this request?” Authorization answers “may this
        principal perform this action on this resource in this context?” A valid bearer token proves only that
        the server accepted the token under its authentication rules. It does not prove that the user may read
        order 1042, call an administrator operation, or change a protected property. Check authorization at
        each meaningful boundary: route/function, object, and property.
      </p>
      <p>
        Broken Object Level Authorization (BOLA) occurs when a caller can reach a legitimate endpoint but the
        server fails to check whether the selected record belongs to, or is otherwise accessible by, that
        caller. Sequential numeric IDs, UUIDs and opaque strings are all identifiers; unpredictability can
        reduce guessing but does not replace an authorization check. Broken Function Level Authorization
        (BFLA) concerns permission to perform an operation such as an admin export. Broken Object Property
        Level Authorization concerns which fields a caller may read or change. These failures need separate
        tests because hiding a route does not protect a record, and filtering a response does not prevent an
        unauthorized update.
      </p>
      <CodeBlock label="Read-only ownership check using two lab accounts">{`# Use only the lab URL, record ID and test tokens supplied by the lab.
LAB_URL=https://api.training.local
ORDER_ID=order-1042

# Capture the same read request as two distinct authorized lab users.
curl --include "$LAB_URL/api/v1/orders/$ORDER_ID" \\
  -H "Authorization: Bearer $USER_A_TOKEN"
curl --include "$LAB_URL/api/v1/orders/$ORDER_ID" \\
  -H "Authorization: Bearer $USER_B_TOKEN"

# Compare status, response body, owner, and server-side audit evidence.
# A different ID is not a finding unless the data/action is unauthorized.`}</CodeBlock>
      <p>
        For this controlled comparison, first establish which account owns the seeded order and what each
        account is expected to access. A secure result might be a denial, a not-found response that avoids
        disclosing existence, or a permitted result for a collaborator with an explicit grant. Do not conclude
        from status alone: compare returned data and verify the application's intended policy. Avoid modifying
        another user's data unless the lab explicitly provides a disposable write-test fixture.
      </p>
      <p>
        A sound server-side design loads the authenticated principal from a verified session, applies the
        organization's authorization policy to the requested action and object, and limits returned or
        mutable properties using an explicit schema. Tests should cover owner, unrelated user, delegated
        collaborator and administrator roles, including both allow and deny cases. Add regression tests at the
        service or API layer so future route changes cannot silently remove the check.
      </p>

      <h2>Read a request as a structured object</h2>
      <p>
        An HTTP API request contains a method, path, headers and optionally a body. The method expresses the
        requested operation but is not itself an access control rule. The path may contain identifiers; query
        parameters may affect filtering or pagination; headers carry content type, authentication and
        conditional-request metadata; and a JSON body is untrusted input. Record the complete request/response
        pair in a lab notebook with secrets redacted. Preserve authorization headers in a secure local note only
        when the exercise requires them; do not include bearer tokens in screenshots, shared comments or
        public reports.
      </p>
      <CodeBlock label="What to record for one API request">{`Request: method + path + query + relevant headers + body
Response: status + relevant headers + body + elapsed time
Context: lab account/role + object owner + expected policy + timestamp

Compare one variable at a time:
- same request, different authorized account
- same account, different object owned by that account
- same object, read versus allowed update in the lab
- documented property versus a property the schema should reject`}</CodeBlock>
      <p>
        Changing one variable makes results easier to interpret. If you change the user, object ID, method and
        body at once, a denial does not tell you which control caused it. Include a baseline request that
        succeeds, a negative control that should fail, and the expected outcome before testing. If the result
        differs, repeat it once, preserve both responses and investigate application state, caching and role
        setup before reporting a vulnerability.
      </p>

      <h2>The fastest recon shortcut: the API's own published spec</h2>
      <p>
        An OpenAPI document describes paths, methods, parameters, request and response schemas, and sometimes
        authentication requirements. Teams may publish one for developers, keep it behind authentication,
        generate it during a build, or not use OpenAPI at all. Its presence is not automatically a
        vulnerability. In an authorized assessment, obtain the specification from the owner or a documented
        lab location first. Do not probe guessed documentation paths on an unrelated public service.
      </p>
      <CodeBlock label="Validate a lab-provided OpenAPI file locally">{`# Use the file supplied by the authorized lab or application owner.
openapi-generator-cli validate -i ./spec/openapi.yaml

# Search documented paths and methods without sending requests.
grep -nE '^  /|^    (get|post|put|patch|delete):' ./spec/openapi.yaml

# Compare the spec with one captured, normal lab request.
# A spec is documentation; it does not prove the server behaves as described.`}</CodeBlock>
      <p>
        Use the file to build an inventory of expected routes and input shapes, then compare it with
        owner-provided route inventories and the traffic captured through normal, authorized lab use. A spec
        can be stale, incomplete or intentionally omit internal operations. Document discrepancies and ask
        whether they are in scope before sending additional requests.
      </p>

      <h2>API versioning and the inventory problem</h2>
      <p>
        Because breaking an API breaks every client depending on it, teams almost never delete an old version —
        they add <code>/v2/</code> and quietly leave <code>/v1/</code> running, sometimes still on outdated
        authorization logic that <code>/v2/</code> fixed. Checking whether <code>/api/v1/</code>,{' '}
        <code>/api/beta/</code>, or an internal-sounding <code>/api/internal/</code> path still responds is
        often the fastest way to find a vulnerability that was already "fixed" in the version everyone actually
        uses.
      </p>

      <h2>Primary references</h2>
      <p>
        The <a href="https://api-security.owasp.org/editions/2023/en/" target="_blank" rel="noreferrer">OWASP API Security Top 10 (2023)</a>
        is an awareness taxonomy rather than a complete risk assessment. Its guidance for
        <a href="https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/" target="_blank" rel="noreferrer"> Broken Object Level Authorization</a>
        explains why each object operation needs an authorization check based on the caller's policy.
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
