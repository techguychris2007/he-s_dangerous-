import type { MlLessonSection } from './types';

/** Full, concept-specific teaching that replaces the former repeated SQL lesson template. */
export const SQL_DEEP_DIVE: Record<string, MlLessonSection[]> = {
  'sql-databases': [
    { heading: 'What a database does for an ML project', body: `<p>A relational database stores structured records in tables and allows multiple jobs and services to read or update them under defined rules. It provides durable storage, concurrent access, constraints, transactions, and a query language. A CSV is a file snapshot; a database is a managed system that can answer selective questions across large, related tables while other users continue working.</p><p>In an ML workflow, the database is often the source of customer, transaction, device, or event data. Before extracting it, learn the table owner, row grain, keys, time semantics, retention rules, and access policy. A correct SQL statement can still build the wrong training set if the field definition or population is misunderstood.</p>` },
    { heading: 'Tables, keys, and normalization', body: `<p>A table has rows and typed columns. A primary key uniquely identifies each row; a foreign key points to another table’s key. Suppose a customer table has one row per customer and an events table has many rows per customer. The customer ID in events links each event to its owner. Normalization stores a customer’s email or region once instead of repeating it on every event, reducing inconsistent updates.</p><pre><code>customers(customer_id PRIMARY KEY, created_at, region)
events(event_id PRIMARY KEY, customer_id FOREIGN KEY, event_time, event_type, amount)</code></pre><p>When joining these tables, the result normally has event grain because one customer can match many events. Say the grain before aggregating or exporting data: customer, event, or customer-at-prediction-time.</p>` },
    { heading: 'Read SQL clauses in the order they operate', body: `<p>A basic query uses <code>SELECT</code> to choose fields, <code>FROM</code> to identify the source, <code>WHERE</code> to filter rows, <code>GROUP BY</code> to define aggregate groups, <code>HAVING</code> to filter groups, and <code>ORDER BY</code> to sort the final result. Database logical processing does not simply follow the written order: aliases created in SELECT may not be available in WHERE, and NULL comparisons follow three-valued logic.</p><pre><code>SELECT customer_id, COUNT(*) AS event_count
FROM events
WHERE event_time &gt;= TIMESTAMP '2026-01-01 00:00:00'
  AND event_type = 'purchase'
GROUP BY customer_id
HAVING COUNT(*) &gt;= 3
ORDER BY event_count DESC;</code></pre><p>This returns customers with at least three purchase events since the cutoff, ordered by count. The query’s result is one row per qualifying customer.</p>` },
    { heading: 'Use parameterized queries and least privilege', body: `<p>Applications should pass user-provided values as bound parameters rather than concatenate them into SQL text. Parameterization keeps data separate from query syntax and is the standard defense against SQL injection. A training job should use a read-only database role limited to the required schemas and columns. Do not hard-code credentials in notebooks or commit them to a repository.</p><p>Limit exported personal data, use approved storage, and avoid writing full rows into error logs. A secure data workflow records a query version, data snapshot, row counts, and extraction time so results can be reproduced without granting every learner broad production access.</p>` },
    { heading: 'Measure query cost and validate the export', body: `<p>Indexes and partitions can make filters faster, but they have storage and write costs. Use the database’s explain plan to inspect scans, joins, row estimates, and sorts. Filter and aggregate near the source when appropriate so a notebook does not pull millions of unused rows into memory.</p><p>After extraction, validate expected row count, key uniqueness, null rates, time range, and label distribution. Compare a small set of records against hand-calculated results. A successful query execution proves only that the database accepted the statement; it does not prove the dataset has the intended grain or is leakage-safe.</p>` },
  ],
  'sql-ml-relational-model': [
    { heading: 'A relational database models facts and relationships', body: `<p>A table represents one kind of thing or event. A row is one record at a declared grain: one customer, one payment, or one event. A column is an attribute of that row. A primary key uniquely identifies a row; a foreign key refers to a key in another table. For example, <code>customers(customer_id)</code> can be the parent of <code>events(customer_id)</code>. This relationship lets a query combine facts without copying every customer attribute onto every event.</p><p>Normalization stores each fact in one authoritative place. If a customer’s country is repeated on 500 event rows, a later country correction can update some rows but miss others. Store customer country once, then join it when needed. Analytical systems often also use denormalized warehouse tables for speed, but the modeler still needs to know the grain and lineage of every field.</p>` },
    { heading: 'The grain determines what each row means', body: `<p>Before writing a query, say its grain in one sentence: “one row per customer” or “one row per customer per calendar month.” Aggregating event rows to customer grain changes what a later join means. If you join a customer table to events and then sum a customer-level field, that value is repeated once per event and may be multiplied accidentally.</p><pre><code>-- Example schema: one row per customer and many event rows per customer
SELECT c.customer_id, e.event_id, e.event_time, e.amount
FROM customers AS c
JOIN events AS e ON e.customer_id = c.customer_id;</code></pre><p>This result has event grain, not customer grain. Customer A with 12 events appears 12 times. It is appropriate for event-level analysis; it is not a one-row-per-customer training table until it is aggregated or deduplicated.</p>` },
    { heading: 'Keys, constraints, and ML implications', body: `<p>Primary-key uniqueness prevents two rows from claiming the same identity. Foreign-key integrity helps detect orphan events whose customer does not exist. Nullability and check constraints can enforce required values and valid domains. These controls catch data defects close to where they enter the system.</p><p>For an ML dataset, record the target grain, feature grain, event-time semantics, and label window. A query that outputs one row per event when the label is one row per customer creates duplicated labels and overweights active customers. Always check row counts, distinct keys, and unmatched joins before exporting a feature table.</p>` },
  ],
  'sql-ml-select-filter-sort': [
    { heading: 'SELECT chooses expressions; FROM establishes the input', body: `<p><code>SELECT</code> names columns or computes expressions from rows in the input relation. Prefer an explicit column list over <code>SELECT *</code> in a training query: a schema change should not silently add an unintended feature, and copying unnecessary columns costs bandwidth and can expose sensitive fields. Aliases give derived expressions stable names for downstream code.</p><pre><code>SELECT customer_id,
       amount * 100 AS amount_cents,
       event_time
FROM events;</code></pre><p>This query returns the selected fields for every event. The multiplication is only correct if <code>amount</code> is in currency units and cents are the desired representation; SQL cannot infer units, so the data contract must say so.</p>` },
    { heading: 'WHERE filters rows before grouping', body: `<p><code>WHERE</code> keeps rows whose predicate evaluates to true. Predicates can use comparisons, <code>AND</code>/<code>OR</code>, <code>IN</code>, ranges with <code>BETWEEN</code>, and pattern matching. SQL uses three-valued logic: a comparison with <code>NULL</code> is unknown, not true, so <code>WHERE country = NULL</code> does not find missing countries. Use <code>IS NULL</code> or <code>IS NOT NULL</code>.</p><pre><code>SELECT event_id, customer_id, amount
FROM events
WHERE event_time &gt;= TIMESTAMP '2026-01-01 00:00:00'
  AND event_time &lt;  TIMESTAMP '2026-02-01 00:00:00'
  AND amount IS NOT NULL;</code></pre><p>Half-open time ranges include the beginning and exclude the end, so adjacent monthly windows do not double-count midnight events. Confirm timestamp timezone and use database-native timestamp types rather than comparing formatted text.</p>` },
    { heading: 'ORDER BY and LIMIT do not define a stable sample by themselves', body: `<p><code>ORDER BY</code> sorts the final rows; without it, result order is not guaranteed. <code>LIMIT</code> is useful for inspection, but taking the first 100 rows is not representative sampling unless the sort or sampling policy is deliberate. For repeatable review, order by a unique key. For random sampling, use the database’s documented sampling method and record the seed or sample identifiers when reproducibility matters.</p><p>In ML pipelines, accidental sorting or truncation can bias the training data toward old records or low IDs. Keep exploratory row limits separate from production dataset generation and report how many records were included and excluded.</p>` },
  ],
  'sql-ml-aggregates-groupby': [
    { heading: 'Aggregates summarize many rows', body: `<p><code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, and <code>MAX</code> reduce a set of rows to summary values. <code>COUNT(*)</code> counts rows; <code>COUNT(column)</code> counts only non-NULL values. Most aggregates ignore NULL values, so an average over a partially missing column may use fewer rows than expected. Always compare the denominator with the total group size when missingness matters.</p><pre><code>SELECT customer_id,
       COUNT(*) AS event_count,
       COUNT(amount) AS amount_observations,
       AVG(amount) AS mean_amount,
       SUM(CASE WHEN event_type = 'refund' THEN 1 ELSE 0 END) AS refund_count
FROM events
GROUP BY customer_id;</code></pre><p>The output grain is one row per customer. The explicit conditional count gives a feature that can be interpreted and checked against known totals.</p>` },
    { heading: 'GROUP BY partitions rows into groups', body: `<p>Every selected expression must be grouped, aggregated, or supported by the database’s functional-dependency rules. Grouping by both <code>customer_id</code> and <code>event_type</code> creates one row per customer and event type, a different grain than grouping by customer alone. A feature table can silently become multiple rows per example if the group columns are not chosen carefully.</p><p><code>HAVING</code> filters groups after aggregation; <code>WHERE</code> filters input rows before aggregation. “Customers with at least five qualifying events” uses <code>HAVING COUNT(*) &gt;= 5</code>. Filtering events to the target window first uses <code>WHERE event_time ...</code>.</p>` },
    { heading: 'Aggregate features need a time boundary', body: `<p>A customer’s total lifetime spend can leak future behavior if a model is supposed to predict at an earlier date. Compute aggregates only from events available at the prediction timestamp. A common pattern is to join each example’s cutoff time to the events table with <code>event_time &lt;= cutoff_time</code>, then group by the example identifier. Check for examples with no matching events; they may require a meaningful zero or missing value according to the feature definition.</p><p>Validate aggregate logic with a tiny hand-computable fixture. If three events have amounts 10, 20, and 30, the expected sum is 60 and average 20. Unit tests with known values catch join multiplication and boundary mistakes before large queries run.</p>` },
  ],
  'sql-ml-joins': [
    { heading: 'A join combines rows using a relationship', body: `<p>A join pairs rows according to a predicate, usually matching a foreign key to a primary key. An <code>INNER JOIN</code> keeps only matched pairs. A <code>LEFT JOIN</code> keeps every left-side row and fills right-side columns with NULL when no match exists. Use explicit join conditions; a missing condition can create a Cartesian product where every left row pairs with every right row.</p><pre><code>SELECT c.customer_id, e.event_id, e.amount
FROM customers AS c
LEFT JOIN events AS e
  ON e.customer_id = c.customer_id;</code></pre><p>Customers with no events still appear once with NULL event fields. Customers with five events appear five times. The join’s grain is therefore customer-event, not customer.</p>` },
    { heading: 'Cardinality is the key safety check', body: `<p>A many-to-one join from events to a unique customer table should preserve the number of event rows. If the customer key is duplicated, each event can multiply into several output rows. A one-to-many join intentionally expands rows. A many-to-many join often signals either a valid bridge table or a modeling bug that needs examination.</p><pre><code>SELECT COUNT(*) AS joined_rows,
       COUNT(DISTINCT e.event_id) AS unique_events
FROM events AS e
JOIN customers AS c ON c.customer_id = e.customer_id;</code></pre><p>If these counts differ unexpectedly, inspect key uniqueness and unmatched records. Do not “fix” duplicate results with <code>DISTINCT</code> until you understand why the join multiplied them; deduplication can hide a broken relationship.</p>` },
    { heading: 'Choose the join type based on the population', body: `<p>If the training population is all eligible customers, start from that cohort and left-join features so customers with no activity remain represented. If the population is only customers with events, an inner join may be correct. State the population rule and measure how many rows are lost at each join.</p><p>Join on stable identifiers, not display names or approximate strings. Use the same entity resolution rule during training and serving. Protect personal identifiers in exported datasets, and avoid selecting columns that the model does not need.</p>` },
  ],
  'sql-ml-case-nulls': [
    { heading: 'NULL means unknown or absent, not zero', body: `<p><code>NULL</code> represents missing or unknown information. It is not equal to itself and cannot be tested with ordinary equality. Arithmetic involving NULL usually remains NULL, and aggregates such as <code>AVG</code> skip NULL values. This is different from zero, an empty string, “not applicable,” and a value that was never recorded; those states may have different meanings for a model.</p><pre><code>SELECT customer_id,
       COUNT(*) AS rows_seen,
       COUNT(monthly_spend) AS spend_values,
       AVG(monthly_spend) AS mean_spend
FROM customer_monthly
GROUP BY customer_id;</code></pre><p>The two counts reveal whether an apparently low average comes from actual low spending or from many missing months.</p>` },
    { heading: 'CASE expresses explicit business rules', body: `<p><code>CASE WHEN ... THEN ... ELSE ... END</code> maps conditions to a value. Put the most specific conditions first and include an ELSE branch so unexpected categories do not become accidental NULLs.</p><pre><code>SELECT customer_id,
       CASE
         WHEN status IN ('active', 'trial') THEN 'current'
         WHEN status = 'cancelled' THEN 'former'
         ELSE 'unknown'
       END AS lifecycle_group
FROM customers;</code></pre><p>This mapping should be versioned with the feature definition. A new upstream status is routed to “unknown” and can be monitored instead of silently treated as active.</p>` },
    { heading: 'COALESCE is an assumption, not a cleanup spell', body: `<p><code>COALESCE(value, replacement)</code> returns the first non-NULL argument. Replacing missing numeric values with zero is correct only if zero has the intended meaning. For a count of observed transactions, zero may mean no transactions. For “days since last transaction,” missing may mean no transaction has ever occurred and should perhaps be represented by both a sentinel and a separate indicator.</p><p>Document the reason for each replacement. When exporting to pandas or a model pipeline, check that the SQL NULL behavior matches the application’s missing-value handling and that train/serve use the same rule.</p>` },
  ],
  'sql-ml-ctes-subqueries': [
    { heading: 'A subquery creates a relation for another query', body: `<p>A subquery can appear in <code>FROM</code>, in a scalar expression, or inside predicates such as <code>EXISTS</code>. It allows a calculation to be expressed in stages. A derived table in the FROM clause can first aggregate events, then join the summary to customers. The outer query sees the subquery’s output columns as a temporary relation.</p><pre><code>SELECT customer_id, event_count
FROM (
  SELECT customer_id, COUNT(*) AS event_count
  FROM events
  GROUP BY customer_id
) AS per_customer
WHERE event_count &gt;= 3;</code></pre><p>The inner query has one row per customer; the outer filter keeps customers with at least three events.</p>` },
    { heading: 'CTEs name and separate query stages', body: `<p>A common table expression begins with <code>WITH</code> and names a query result for use later. CTEs improve readability when a feature pipeline has clear stages: eligible population, event aggregation, then final projection. They also make each stage easier to inspect and test.</p><pre><code>WITH eligible AS (
  SELECT customer_id, prediction_time
  FROM scoring_examples
  WHERE prediction_time &gt;= TIMESTAMP '2026-01-01 00:00:00'
), recent_events AS (
  SELECT x.customer_id, x.prediction_time,
         COUNT(e.event_id) AS events_30d
  FROM eligible AS x
  LEFT JOIN events AS e
    ON e.customer_id = x.customer_id
   AND e.event_time &gt; x.prediction_time - INTERVAL '30 days'
   AND e.event_time &lt;= x.prediction_time
  GROUP BY x.customer_id, x.prediction_time
)
SELECT * FROM recent_events;</code></pre><p>The time condition belongs in the join so eligible examples with no events remain in the left-joined result.</p>` },
    { heading: 'Readability does not guarantee speed or correctness', body: `<p>Some database engines inline CTEs; others may materialize them, depending on engine and query shape. Inspect the query plan for expensive scans and joins on large data. More importantly, verify the grain after each stage, especially when CTEs join tables with different cardinalities. A readable query can still leak future events or multiply rows.</p>` },
  ],
  'sql-ml-window-functions': [
    { heading: 'A window keeps rows while adding group context', body: `<p>Unlike <code>GROUP BY</code>, a window function computes a value over related rows without collapsing them. The <code>OVER</code> clause defines the window. <code>PARTITION BY customer_id</code> starts a separate calculation for each customer; <code>ORDER BY event_time</code> establishes sequence; a frame defines which neighboring rows participate.</p><pre><code>SELECT customer_id, event_time, amount,
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY event_time
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS cumulative_spend
FROM events;</code></pre><p>This returns one row per event plus a running sum. Without a deterministic ordering tie-breaker, same-time events may be ordered unpredictably.</p>` },
    { heading: 'Ranking and lag support temporal features', body: `<p><code>ROW_NUMBER</code> assigns a sequential position; <code>RANK</code> preserves ties and can skip rank values; <code>DENSE_RANK</code> preserves ties without gaps. <code>LAG</code> reads an earlier row and <code>LEAD</code> a later one. These functions can find the previous event, most recent record, or change from a prior period.</p><pre><code>SELECT customer_id, event_time, amount,
       LAG(amount) OVER (
         PARTITION BY customer_id ORDER BY event_time, event_id
       ) AS previous_amount
FROM events;</code></pre><p>The first event has no previous amount, so its result is NULL. Do not replace it without defining what “no previous event” means.</p>` },
    { heading: 'Prevent future leakage in rolling windows', body: `<p>For a prediction made at time T, every feature row must use only events at or before T. A centered moving average includes future observations and is invalid for forecasting. A trailing frame is safer, but the frame’s endpoint, timezone, and late-arriving event policy still need to be explicit. If multiple examples share a timestamp, define whether an event at exactly T is available before the decision.</p><p>Validate temporal features on a tiny timeline by hand and compare results at the first row, a middle row, and a row with tied timestamps. Window semantics differ among SQL dialects, especially default frames, so specify <code>ROWS</code> or <code>RANGE</code> deliberately and consult the target engine’s documentation.</p>` },
  ],
  'sql-ml-schema-indexes': [
    { heading: 'Types and constraints protect meaning', body: `<p>Choose database types that match the fact: integer identifiers, exact decimal for currency where arithmetic requires it, timestamps with a documented timezone, and bounded text or enumerated domains for categories. Floating-point types approximate many decimal values; this matters for money and exact equality tests. A NOT NULL constraint, primary key, foreign key, and CHECK constraint can enforce core invariants at write time.</p><pre><code>CREATE TABLE events (
  event_id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
  event_time TIMESTAMPTZ NOT NULL,
  amount NUMERIC(12, 2) CHECK (amount &gt;= 0),
  event_type TEXT NOT NULL
);</code></pre><p>This example rejects missing identity/time, orphan customer references, and negative amounts. The exact syntax and type behavior vary by database.</p>` },
    { heading: 'Indexes trade write/storage cost for lookup speed', body: `<p>An index helps the database find rows without scanning a whole table. A B-tree index often supports equality and range filtering; composite indexes can help queries that filter on multiple columns, but column order matters. Indexes consume storage and slow inserts and updates because the index must also be maintained. An index is not automatically beneficial for a low-selectivity column.</p><p>For a frequent event query filtering by customer and time, a composite index on <code>(customer_id, event_time)</code> may help. Confirm with the database’s query planner and representative data; a small local table may choose a scan even when an index exists.</p>` },
    { heading: 'Inspect query plans and protect training exports', body: `<p>Use the engine’s explain facility to inspect estimated rows, scans, joins, and sorting. A slow feature query often needs a better filter, aggregation, or partition strategy rather than a new model. Avoid indexing every column as a reflex.</p><p>Define least-privilege read access for training jobs, restrict sensitive columns, and audit exports. Database structure is also a security boundary: separate roles for ingestion and analytics, parameterize values in application queries, and avoid embedding credentials in notebooks or saved SQL files.</p>` },
  ],
  'sql-ml-transactions': [
    { heading: 'A transaction groups changes into one logical operation', body: `<p>A transaction begins, performs one or more database operations, then commits or rolls back. Atomicity means all intended writes succeed together or none do. Consistency means constraints remain satisfied. Isolation controls how concurrent transactions observe one another. Durability means committed work survives a failure, subject to the database’s guarantees.</p><pre><code>BEGIN;
UPDATE feature_jobs SET status = 'complete' WHERE job_id = 42;
INSERT INTO feature_job_audit(job_id, action) VALUES (42, 'complete');
COMMIT;</code></pre><p>If the second write fails, the application should roll back so status and audit history do not disagree. Exact syntax and transaction defaults differ among engines.</p>` },
    { heading: 'Isolation affects reproducibility', body: `<p>Concurrent loads can change the rows visible to a query while a training dataset is being assembled. Isolation levels range from weaker behavior that permits some anomalies to stronger snapshots that give a consistent view. Stronger isolation can reduce concurrency or cause retries, so choose deliberately and learn the engine’s actual semantics.</p><p>For reproducible training, prefer immutable or versioned source snapshots, record extraction time and query revision, and make feature-generation jobs idempotent where possible. Retrying an idempotent job should not duplicate records or partially overwrite a previous artifact.</p>` },
    { heading: 'Batch loading patterns for ML data', body: `<p>Use staging tables to validate incoming records before publishing them. A robust load records a batch identifier, source version, received time, row count, rejected count, and validation result. Publish only after required checks succeed. For large loads, chunking can control memory and transaction duration, but chunk boundaries must not leave the official dataset half updated.</p><p>Protect secrets and personal data during exports. Use parameterized SQL for values, short-lived credentials, least-privilege roles, and encrypted transport. Avoid logging entire feature rows when a job fails; log stable record IDs and safe diagnostics instead.</p>` },
  ],
  'sql-ml-feature-store-query': [
    { heading: 'Define the example table and prediction cutoff', body: `<p>A feature dataset begins with examples: the entities and timestamps at which predictions are needed. Suppose <code>scoring_examples(example_id, customer_id, prediction_time, label)</code> has one row per customer decision. The label may describe the following 30 days, while features must use only data available at <code>prediction_time</code>. Keep label construction and feature construction logically separate so future outcomes cannot leak backward.</p>` },
    { heading: 'Build point-in-time features', body: `<pre><code>WITH examples AS (
  SELECT example_id, customer_id, prediction_time, label
  FROM scoring_examples
), event_features AS (
  SELECT x.example_id,
         COUNT(e.event_id) AS events_30d,
         COALESCE(SUM(e.amount), 0) AS spend_30d
  FROM examples AS x
  LEFT JOIN events AS e
    ON e.customer_id = x.customer_id
   AND e.event_time &gt; x.prediction_time - INTERVAL '30 days'
   AND e.event_time &lt;= x.prediction_time
  GROUP BY x.example_id
)
SELECT x.example_id, x.prediction_time, f.events_30d, f.spend_30d, x.label
FROM examples AS x
JOIN event_features AS f USING (example_id);</code></pre><p>The lower bound is open and the upper bound closed; state the convention and use it consistently. The LEFT JOIN preserves examples with no events, and COALESCE sets their spend to zero only if no events truly means zero spend in this domain.</p>` },
    { heading: 'Validate the finished feature table', body: `<p>Check that <code>example_id</code> is unique and the final row count equals the eligible example count. Check for NULLs in required fields, impossible ranges, duplicated examples, and events after the prediction cutoff. Compare several rows against a manual calculation and test a customer with no events, one event exactly at the boundary, and one event just after it.</p><p>Store the query revision, source snapshot, feature definitions, extraction timestamp, and row counts with the dataset. Before the feature goes live, verify that online inference can obtain the same information with the same cutoff and units. A correct offline query is not enough if serving calculates a different value.</p>` },
    { heading: 'Feature store concepts', body: `<p>A feature store is a system for defining, computing, storing, and serving reusable features. An offline store supports historical training and analysis; an online store supports low-latency lookups. Point-in-time joins reconstruct the value that would have been available for each historical example. Feature stores can reduce duplication and training-serving skew, but they do not automatically fix incorrect definitions, late data, privacy problems, or leakage.</p>` },
  ],
};
