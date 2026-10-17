import type { CurriculumLesson } from '../curriculumDefinition';

export const sqlPrimer: CurriculumLesson = {
  id: 'db-modern-0', slug: 'sql-tables-queries-joins-and-transactions',
  title: 'SQL: Tables, Queries, Joins and Transactions',
  summary: 'Create a small database and learn the SQL needed to understand database security examples.',
  minutes: 55,
  prerequisite: 'Know how to run a Python file. No SQL knowledge or external database server is required.',
  outcomes: ['Create tables with keys and constraints', 'Filter, join and aggregate records', 'Explain NULL and transactions using actual results'],
  introduction: 'SQL is a language for defining and querying relational data. A table holds rows; each column describes one field. An invoice row might contain an identifier, a customer identifier and an amount. This lesson uses SQLite through Python so you can run the entire example locally without credentials, a cloud account or a database installation.',
  sections: [
    {
      title: 'Tables, keys and constraints',
      paragraphs: [
        'A primary key uniquely identifies a row. A foreign key connects a row to a row in another table. NOT NULL requires a value, UNIQUE prevents repeated non-NULL values under the engine’s rules, and CHECK restricts allowed values. These constraints reject invalid stored states; they do not authenticate a user. SQLite requires foreign-key enforcement to be enabled for each connection, which this fixture does explicitly.',
        'Save the example below as sql_practice.py and run it with Python 3. sqlite3.connect(":memory:") creates a disposable database for this process. executescript executes our fixed schema and fixtures, not untrusted input. Amounts are integer cents to avoid binary floating-point rounding. The customer relationship is stored once in customers and referenced by invoices rather than copying the email into every invoice. Keep this file open: the second code block is appended to it.',
      ],
      label: 'Runnable Python and SQL — create four synthetic invoices',
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE
);
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    status TEXT NOT NULL CHECK (status IN ('open', 'paid')),
    paid_at TEXT
);
INSERT INTO customers VALUES (1, 'alice@example.test'), (2, 'bob@example.test');
INSERT INTO invoices VALUES
    (101, 1, 2500, 'paid', '2026-01-02T10:00:00Z'),
    (102, 1, 1200, 'open', NULL),
    (103, 2, 5000, 'paid', '2026-01-03T10:00:00Z'),
    (104, 2, 800, 'open', NULL);
""")
print(db.execute("SELECT COUNT(*) FROM invoices").fetchone())
# Expected: (4,) — one result row containing one column.`,
    },
    {
      title: 'SELECT, WHERE, ordering and missing values',
      paragraphs: [
        'SELECT id, amount_cents FROM invoices requests two columns. WHERE status = ? restricts the returned rows; the placeholder receives a bound value from the driver. AND requires both conditions, while OR allows either. Parentheses make mixed conditions explicit. SQL uses single quotes for literal strings in fixed queries. Placeholder syntax is driver-specific: SQLite uses question marks here. Do not concatenate a web request value into query text.',
        'ORDER BY specifies result order, and LIMIT bounds the returned row count. Without ORDER BY, do not depend on an observed row order. NULL represents a missing or unknown value, not the empty string or zero. paid_at = NULL does not test for missingness: use IS NULL. Comparisons involving NULL usually produce unknown, which WHERE does not accept as true. The following open-invoice query returns the larger open invoice first; the missing-payment query returns IDs 102 and 104.',
      ],
      label: 'Append to sql_practice.py — filter, join, aggregate and roll back',
      code: `open_rows = db.execute(
    "SELECT id, amount_cents FROM invoices WHERE status = ? ORDER BY amount_cents DESC, id LIMIT ?",
    ("open", 10),
).fetchall()
print(open_rows)  # [(102, 1200), (104, 800)]

print(db.execute(
    "SELECT id FROM invoices WHERE paid_at IS NULL ORDER BY id"
).fetchall())  # [(102,), (104,)]
print(db.execute(
    "SELECT id FROM invoices WHERE paid_at = NULL"
).fetchall())  # [] — equality is not a NULL test

balances = db.execute("""
SELECT c.email, SUM(i.amount_cents) AS open_cents, COUNT(*) AS invoice_count
FROM customers AS c
JOIN invoices AS i ON i.customer_id = c.id
WHERE i.status = ?
GROUP BY c.id, c.email
HAVING SUM(i.amount_cents) >= ?
ORDER BY c.email
""", ("open", 1000)).fetchall()
print(balances)  # [('alice@example.test', 1200, 1)]

db.execute("BEGIN")
db.execute("UPDATE invoices SET status = ? WHERE id = ?", ("paid", 102))
print(db.execute("SELECT status FROM invoices WHERE id = 102").fetchone())
db.rollback()
print(db.execute("SELECT status FROM invoices WHERE id = 102").fetchone())
# Expected: ('paid',), then ('open',) after rollback.
db.close()`,
    },
    {
      title: 'JOIN connects relationships; GROUP BY forms result groups',
      paragraphs: [
        'An INNER JOIN retains pairs satisfying its ON condition. Here invoices.customer_id = customers.id connects each invoice to its customer. Aliases i and c identify each column’s source table. Joining without the intended relationship can multiply rows and produce incorrect totals. A LEFT JOIN retains every left-side row, using NULL for right-side values when there is no match. Filtering right-side columns in WHERE can remove those unmatched rows: distinguish the join condition from a later filter.',
        'GROUP BY creates a result group per specified key. SUM totals values in each group; COUNT(*) counts result rows. HAVING filters groups after aggregation. The fixture groups open invoices by customer, retaining only a total of at least 1000 cents. This is why Alice appears and Bob does not. The query does not verify a user’s right to view either customer. A web application must also enforce the authenticated actor’s ownership or tenant policy.',
      ],
    },
    {
      title: 'Transactions and indexes have specific jobs',
      paragraphs: [
        'UPDATE changes existing rows, INSERT adds rows and DELETE removes rows. A missing WHERE on an UPDATE or DELETE can affect the whole table. BEGIN starts the explicit transaction in this fixture; COMMIT makes successful changes durable and ROLLBACK cancels uncommitted changes. The example changes one invoice, observes the new value, rolls back and observes the original value. Our CHECK restricts status labels and nonnegative amounts, but does not require paid_at when status is paid. That business invariant needs another deliberate design; a schema does not automatically enforce every rule.',
        'An index is an additional structure the database can use to locate rows efficiently. Indexing invoices.customer_id can help some customer queries but adds storage and write-maintenance cost. An index is not an access rule. SQLite is embedded in your process and does not reproduce server database roles or PostgreSQL row-level policies. For practice, add a third customer with no invoices and write a LEFT JOIN retaining that customer. Compare COUNT(*) with COUNT(i.id): the unmatched result row counts once for COUNT(*), while its NULL invoice ID is ignored by COUNT(i.id).',
      ],
    },
  ],
  table: { headers: ['SQL feature', 'Purpose', 'Not guaranteed'], rows: [['JOIN', 'Relate matching rows', 'Actor permission'], ['Constraint', 'Reject invalid stored state', 'All business invariants'], ['Transaction', 'Group changes', 'Identical isolation across engines']] },
  exercise: {
    scenario: 'You must list every customer and their invoice count, including customers without invoices.',
    task: 'Add a customer with ID 3, then write a LEFT JOIN query grouped by customer. Compare COUNT(*) with COUNT(i.id).',
    answer: 'Join invoices on its customer_id and group by customer ID and email. COUNT(i.id) returns counts 2, 2 and 0. COUNT(*) returns 1 for the unmatched customer because the LEFT JOIN preserves a result row containing NULL on the invoice side.',
    evidence: 'Your own query and expected results for the three customers.',
  },
  misconceptions: ['NULL is not zero or an empty string.', 'A join does not authorize access to related rows.', 'Indexes are not permission policies.'],
  sources: [
    { title: 'Python sqlite3: transactions and placeholders', url: 'https://docs.python.org/3/library/sqlite3.html' },
    { title: 'SQLite SELECT', url: 'https://www.sqlite.org/lang_select.html' },
    { title: 'SQLite foreign-key enforcement', url: 'https://www.sqlite.org/foreignkeys.html' },
  ],
  labs: ['web-sqli-product'],
  quiz: [
    { question: 'How do you select rows with an unknown paid_at?', options: ['WHERE paid_at IS NULL', 'WHERE paid_at = NULL', 'WHERE paid_at = 0'], answer: 0 },
    { question: 'Why use COUNT(i.id) for the unmatched customer?', options: ['It ignores the missing invoice represented by NULL', 'It authenticates the customer', 'It counts every joined result row'], answer: 0 },
    { question: 'What does ROLLBACK do in this fixture?', options: ['Cancels the uncommitted update', 'Deletes the schema permanently', 'Approves a payment'], answer: 0 },
  ],
};
