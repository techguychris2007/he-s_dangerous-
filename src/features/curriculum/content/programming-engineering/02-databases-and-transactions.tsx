import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function DatabasesAndTransactions() {
  return <div className="prose-hh">
    <h1>SQL, Transactions &amp; Data Access</h1>
    <p>Relational databases store related facts in tables and let SQL select, combine, and update them. Application code must preserve the meaning of those facts when multiple requests run at once or a failure interrupts an operation. This lesson introduces relational modeling, safe query parameters, constraints, transactions, indexes, and the tradeoffs between application-side and database-side work.</p>
    <h2>Tables, keys, and constraints</h2>
    <p>A table represents records of one kind. A primary key identifies a row; a foreign key connects it to another table. A unique constraint prevents duplicate values, a not-null constraint requires a value, and a check constraint can enforce a rule such as a non-negative count. Constraints are valuable because they protect data even when more than one code path writes to the database.</p>
    <CodeBlock label="A normalized schema with enforced relationships">{`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
);

CREATE TABLE findings (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'closed'))
);

CREATE INDEX findings_owner_status_idx ON findings(owner_id, status);`}</CodeBlock>
    <p>Normalization reduces update anomalies by storing a fact once and referencing it. The owner name belongs in <code>users</code>; each finding stores the user's key. Joins reconstruct related information. Indexes speed selected reads at the cost of disk, memory, and slower writes because each change must maintain the index. Index order matters for composite indexes and should reflect actual filters and sort patterns.</p>
    <h2>Parameterized queries prevent SQL injection</h2>
    <p>Never create a query by concatenating user-controlled text. Use the database driver's placeholder syntax to keep SQL structure separate from values. Validation is still useful for business rules, but escaping special characters by hand is not a substitute for parameter binding. Dynamic identifiers such as table names cannot usually be supplied as ordinary values; choose them from a fixed allowlist if they must vary.</p>
    <CodeBlock label="SQLite query parameters and an explicit transaction">{`import sqlite3

def create_finding(db_path, owner_id, title, severity):
    with sqlite3.connect(db_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        cursor = connection.execute(
            "INSERT INTO findings(owner_id, title, severity) VALUES (?, ?, ?)",
            (owner_id, title, severity),
        )
        return cursor.lastrowid`}</CodeBlock>
    <p>SQLite uses <code>?</code> placeholders; other drivers may use different forms. The key property is that the values are bound separately from the query string. A request for title <code>"test'); DROP TABLE users;--"</code> remains a title value rather than becoming executable SQL. Do not include secrets or sensitive personal data in query logs.</p>
    <h2>Transactions provide all-or-nothing units of work</h2>
    <p>A transaction groups changes so they commit together or roll back together. ACID describes atomicity, consistency, isolation, and durability. A transfer, for example, must not debit one account without crediting the other. Isolation levels describe which concurrent intermediate states transactions may observe; the exact guarantees and names vary by database engine.</p>
    <CodeBlock label="Two related updates in one transaction">{`def transfer(connection, source_id, destination_id, amount):
    if amount <= 0:
        raise ValueError("amount must be positive")
    try:
        connection.execute("BEGIN")
        debit = connection.execute(
            "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
            (amount, source_id, amount),
        )
        if debit.rowcount != 1:
            raise ValueError("source account is missing or has insufficient funds")
        credit = connection.execute(
            "UPDATE accounts SET balance = balance + ? WHERE id = ?",
            (amount, destination_id),
        )
        if credit.rowcount != 1:
            raise ValueError("destination account does not exist")
        connection.commit()
    except Exception:
        connection.rollback()
        raise`}</CodeBlock>
    <p>In production, define how deadlocks and transient errors are handled and ensure an operation is safe to retry. Checking affected row counts is important: a syntactically successful update that changed zero rows may still violate the application's intended outcome. The connection's transaction context manager can simplify common cases; the explicit form here makes the commit and rollback decisions visible.</p>
    <h2>Read only what you need</h2>
    <p>Filtering and aggregating in SQL can reduce network transfer and memory use. Use explicit columns instead of <code>SELECT *</code> when the consumer needs a known subset. Add ordering when stable output matters; SQL result order is otherwise unspecified. Use pagination for large result sets, and choose a stable sort key to avoid records moving between pages while data changes.</p>
    <CodeBlock label="Aggregate with filters and deterministic ordering">{`SELECT owner_id, COUNT(*) AS open_high_findings
FROM findings
WHERE status = ? AND severity IN (?, ?)
GROUP BY owner_id
HAVING COUNT(*) >= ?
ORDER BY open_high_findings DESC, owner_id ASC;`}</CodeBlock>
    <h2>Database access is a security boundary</h2>
    <p>Parameterized SQL prevents a query-structure injection bug, but it does not decide whether the current user may read a row. Authorization must be enforced for each requested object and action. Use least-privilege database credentials, protect backups, define retention, and avoid storing credentials in source code. When the database supports row-level security, treat it as an additional guardrail and test it under the real application role.</p>
    <Callout variant="warn"><p>Do not store passwords with a fast general-purpose hash such as SHA-256. Password storage requires a dedicated, salted, work-factor password hashing algorithm such as Argon2id, scrypt, or appropriately configured bcrypt. This lesson's database examples are for relational data, not password storage.</p></Callout>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-14', title: 'Safe Config Parsing With Try/Except' }]} />
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/library/sqlite3.html" target="_blank" rel="noreferrer">Python sqlite3</a>, <a href="https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP SQL Injection Prevention</a>, and <a href="https://www.postgresql.org/docs/current/ddl-constraints.html" target="_blank" rel="noreferrer">PostgreSQL constraints</a>.</p>
  </div>;
}
