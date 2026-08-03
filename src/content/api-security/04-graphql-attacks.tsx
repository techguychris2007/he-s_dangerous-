import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function GraphqlAttacks() {
  return (
    <div className="prose-hh">
      <h1>GraphQL-Specific Attacks: Introspection, Batching &amp; Depth Limits</h1>
      <p>
        GraphQL trades REST's many small endpoints for one endpoint and a query language that lets the client
        describe exactly what it wants back. That flexibility is the whole point of GraphQL — and it's also
        where its distinct vulnerability classes live, because a query language this expressive gives an
        attacker far more to work with than a fixed URL path ever could.
      </p>

      <h2>Introspection: asking the API to hand you its own map</h2>
      <p>
        GraphQL supports a built-in introspection query that asks the schema to describe itself — every type,
        every field, every mutation, including ones with no legitimate reason to be reachable by an
        unauthenticated caller. It's meant for internal tooling and should be disabled in production, but is
        left enabled far more often than you'd expect.
      </p>
      <CodeBlock label="the introspection query">{`POST /graphql
{"query": "query IntrospectionQuery { __schema { types { name fields { name } } } } "}

# A successful response hands you the ENTIRE schema — every query, mutation, and field name
# that exists, whether or not the app's own UI ever calls it. This is reconnaissance, not
# exploitation by itself, but it turns "guess the API's shape" into "read the API's shape."`}</CodeBlock>
      <p>
        Even with introspection disabled, GraphQL error messages are often unusually chatty by default — a
        typo'd field name frequently triggers a "did you mean: internalDebugFlag?" suggestion, leaking schema
        information one wrong guess at a time.
      </p>

      <h2>Batching abuse: turning one request into thousands</h2>
      <p>
        Most GraphQL servers accept an <em>array</em> of queries in a single HTTP request, executing all of them
        server-side and returning all the results together. This is a legitimate performance feature — and a
        near-perfect way to defeat a rate limiter that only counts HTTP requests, not the queries inside them.
      </p>
      <CodeBlock label="batching an OTP brute-force past a per-request rate limit">{`# A rate limiter capped at "5 requests per minute" counts THIS as one request:
POST /graphql
[
  {"query": "mutation { verifyOtp(code: \\"0000\\") { success } }"},
  {"query": "mutation { verifyOtp(code: \\"0001\\") { success } }"},
  {"query": "mutation { verifyOtp(code: \\"0002\\") { success } }"},
  ... up to however many the server will batch in one call ...
]
# Thousands of guesses, one "request" by the rate limiter's count — the exact technique behind
# this platform's own GraphQL alias-batching OTP-bypass lab.`}</CodeBlock>
      <p>
        A close cousin is <strong>alias-based batching</strong> within a single GraphQL document: instead of an
        array of separate query objects, the same effect is achieved by giving many copies of the same query
        different aliases inside one query body, which some batching-aware rate limiters still fail to count
        correctly.
      </p>

      <h2>Resource-exhaustion queries: deeply nested and circular queries</h2>
      <p>
        Because GraphQL lets a query request related objects inside related objects, a schema with circular
        relationships (a user has posts, each post has an author, that author has posts...) can be asked to
        nest arbitrarily deep in a single request — forcing the server to do exponentially more work resolving
        one query than any REST endpoint could ever be asked to do in one call.
      </p>
      <CodeBlock label="a deeply nested query">{`query {
  user(id: 1) {
    posts {
      author {
        posts {
          author {
            posts { author { posts { author { name } } } }
          }
        }
      }
    }
  }
}
# Without a query-depth limit, this can be nested dozens of levels deep — a denial-of-service
# vector distinct from anything traditional REST rate-limiting was built to catch.`}</CodeBlock>

      <Callout variant="tip">
        <p>
          A schema-first mindset speeds up every GraphQL engagement: get the introspection result (or the
          schema from a public repo, a leaked <code>.graphql</code> file, or client-bundle string search) before
          testing anything, then work through mutations specifically — they're where state actually changes,
          and therefore where BOLA/BFLA/mass-assignment findings from the earlier lessons in this module are
          most likely to live.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Batch-based brute-forcing and depth-abuse queries can generate a very large volume of backend load
          extremely fast. Even inside an authorized scope, throttle yourself deliberately and stop well short of
          anything that could be mistaken for — or actually cause — a denial-of-service condition.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the core API security toolkit: how REST and GraphQL differ as attack surfaces, the
        OWASP API Top 10's most common findings (BOLA, BFLA, mass assignment), the specific ways JSON Web
        Tokens get forged, and GraphQL's own introspection/batching/depth-abuse patterns — the layer sitting
        underneath almost every modern web and mobile app you'll ever test.
      </p>
    </div>
  );
}
