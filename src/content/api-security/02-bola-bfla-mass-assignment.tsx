import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BolaBflaMassAssignment() {
  return (
    <div className="prose-hh">
      <h1>Broken Object &amp; Function Level Authorization at Scale</h1>
      <p>
        BOLA and BFLA are IDOR's two API-native cousins — same root cause (the server trusts an identifier or a
        request path without re-checking who's allowed to touch it), but they show up constantly in APIs
        because every resource is addressed by an explicit id and every action is its own explicit endpoint,
        which makes both mistakes trivially easy to make and trivially easy to test for.
      </p>

      <h2>BOLA: Broken Object Level Authorization</h2>
      <p>
        This is API1 on the OWASP list for a reason — it's the single most commonly reported API vulnerability
        in the wild. The pattern is always the same: an endpoint returns or modifies a specific object by id,
        and checks that you're <em>authenticated</em>, but never checks that the object actually{' '}
        <em>belongs to you</em>.
      </p>
      <CodeBlock label="the BOLA test, in one request">{`# Your own account, with your own valid token:
GET /api/v2/invoices/8841
Authorization: Bearer <your-token>
-> 200 OK, your invoice data

# Same token, someone else's (guessed/sequential) id:
GET /api/v2/invoices/8842
Authorization: Bearer <your-token>
-> if this ALSO returns 200 with someone else's invoice, that's BOLA`}</CodeBlock>
      <p>
        Numeric, sequential ids make this almost mechanical to test — increment or decrement the id and see
        what comes back. UUIDs raise the bar (you can't guess the next one) but don't fix the underlying bug:
        if you can obtain someone else's UUID from anywhere else in the app (a leaked reference in a different
        response, a shared link, an export feature), the same missing ownership check still fires.
      </p>

      <h2>BFLA: Broken Function Level Authorization</h2>
      <p>
        BOLA is about <em>which object</em> you can reach; BFLA is about <em>which action</em> you're allowed
        to perform. A regular user's token calling an endpoint that's supposed to be admin-only is BFLA — and it
        hides well because the endpoint often isn't linked anywhere in the regular user's UI at all. You only
        find it by already knowing (or guessing) that it exists.
      </p>
      <CodeBlock label="a realistic BFLA discovery path">{`1. Log in as a normal user, capture every request the app makes in normal use
2. Log in as an admin (if you have a second test account) and diff the two request lists
3. The admin-only endpoints that show up ONLY in the admin session are your BFLA candidates:
   DELETE /api/v2/users/{id}
   POST   /api/v2/users/{id}/promote
4. Replay each one with the NORMAL user's token instead of the admin's -> if it still succeeds, that's BFLA`}</CodeBlock>
      <p>
        Even without a second admin account, function names leak intent: an endpoint list containing{' '}
        <code>/impersonate</code>, <code>/admin/</code>, <code>/internal/</code>, or an HTTP verb that seems too
        powerful for a "user" role (a <code>DELETE</code> on something a normal user shouldn't be able to
        delete) is worth testing with your own, lower-privileged token regardless of whether you've ever seen
        it called.
      </p>

      <h2>Automating BOLA discovery across an entire ID range</h2>
      <p>
        Confirming BOLA on one guessed id proves the concept; a real engagement needs to know the actual
        blast radius — how many other users' objects are reachable the same way. The same fuzzing tools from
        the IDOR lesson apply directly to an API's numeric id space, just aimed at a JSON endpoint instead of
        an HTML page:
      </p>
      <CodeBlock label="sweeping an id range with ffuf, authenticated as one low-privilege account">{`ffuf -u https://target.com/api/v2/invoices/FUZZ \\
  -H "Authorization: Bearer <your-token>" \\
  -w <(seq 1 5000) -mc 200 -fs 0
# -w <(seq 1 5000)   generates ids 1-5000 on the fly, no wordlist file needed
# -fs 0               filters out empty/zero-length responses, leaving only ids that actually returned data`}</CodeBlock>
      <p>
        The output — every id your single token could read — is exactly the number a report needs to convey
        real impact: "this endpoint is missing an ownership check" is a much weaker finding than "this
        endpoint let one low-privilege token read 4,812 other customers' invoices."
      </p>

      <h2>Mass assignment: when the API accepts more fields than it should</h2>
      <p>
        Many frameworks let a developer bind an entire incoming JSON object directly onto a database model in
        one line, which is fast to write but dangerous the moment that model has fields the client was never
        meant to set directly — a <code>role</code>, an <code>isAdmin</code> flag, an internal{' '}
        <code>account_balance</code>.
      </p>
      <CodeBlock label="mass assignment, from a normal signup request">{`# What the UI's signup form sends:
POST /api/v2/users
{"email": "me@example.com", "password": "hunter2", "name": "Me"}

# What the API model behind it actually has:
{"email": ..., "password": ..., "name": ..., "role": "user", "isVerified": false, "creditBalance": 0}

# The mass-assignment test — add fields the form never sends and see if the API accepts them anyway:
POST /api/v2/users
{"email": "me@example.com", "password": "hunter2", "name": "Me", "role": "admin", "isVerified": true}`}</CodeBlock>
      <p>
        Finding the full field list to test against usually comes from one of: a GraphQL introspection query (next
        lesson), a leaked API schema/OpenAPI/Swagger doc, an error message that echoes back an unrecognized
        field name, or simply the response body of a <code>GET</code> on the same object — if the API returns a{' '}
        <code>role</code> field when reading, it's worth testing whether the corresponding <code>PATCH</code>{' '}
        or <code>PUT</code> accepts writing it.
      </p>

      <Callout variant="tip">
        <p>
          Excessive data exposure is mass assignment's quieter sibling: an endpoint that returns the{' '}
          <em>entire</em> internal object (including fields the UI never displays, like a password hash, an
          internal note, or another user's email on a "team members" list) because the developer serialized the
          whole database row instead of a deliberately trimmed response shape. Always read the full JSON body of
          every response, not just the fields the rendered page happens to show.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Testing BOLA/BFLA means touching data and functions that don't belong to your test account — stay
          strictly inside an authorized program's scope, and if a test successfully reaches someone else's real
          data, stop and report it rather than pulling more than the minimum needed to prove the finding.
        </p>
      </Callout>
    </div>
  );
}
