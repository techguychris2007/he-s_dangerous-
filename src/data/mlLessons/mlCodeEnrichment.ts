import type { MlLesson, MlLessonSection } from './types';

const code = (value: string) => `<pre><code>${value.trim()}</code></pre>`;

const pythonSections: Record<string, MlLessonSection[]> = {
  'py-ml-vars-types': [
    {
      heading: 'Actual Python: convert raw values into ML-ready values',
      body:
        code(`
raw_age = "42"
raw_income = "1250.50"
raw_country = " Ghana "
raw_clicked = "yes"

age = int(raw_age)
income = float(raw_income)
country = raw_country.strip().lower()
clicked = raw_clicked.lower() == "yes"

feature_row = {
    "age": age,
    "income": income,
    "country": country,
    "clicked": clicked,
}

print(type(age), type(income), type(clicked))
print(feature_row)
`) +
        '<p><strong>What this teaches:</strong> Python variables are names pointing to values. The values have types. ML code must convert raw text into numbers, booleans, and normalized categories before those values can become dependable model features.</p>',
    },
    {
      heading: 'Practice like an engineer',
      body:
        'Write a function named <code>build_feature_row</code> that receives raw age, price, city, and label strings. Convert the numeric fields, normalize the city, convert the label into a boolean, and return one clean dictionary.',
    },
  ],
  'py-ml-strings-text': [
    {
      heading: 'Actual Python: clean and parse text',
      body:
        code(`
message = "  ERROR: Payment Failed for USER_ID=9281  "

clean = message.strip()
lower = clean.lower()
level, details = lower.split(":", 1)

has_payment_issue = "payment" in details
user_id = details.split("user_id=")[-1].strip()

print(level)
print(details)
print(has_payment_issue)
print(user_id)
`) +
        '<p><strong>What this teaches:</strong> text cleaning usually means removing accidental spaces, normalizing case, splitting predictable structure, and extracting the useful signal. This same pattern appears in NLP, log analytics, fraud monitoring, and security event processing.</p>',
    },
  ],
  'py-ml-control-flow': [
    {
      heading: 'Actual Python: validate a row before training',
      body:
        code(`
def validate_training_row(row):
    if row.get("label") not in {"fraud", "legit"}:
        return False

    amount = row.get("amount")
    if amount is None:
        return False

    if amount < 0:
        raise ValueError("amount cannot be negative")

    return True

rows = [
    {"amount": 99.5, "label": "legit"},
    {"amount": None, "label": "fraud"},
    {"amount": 12.0, "label": "unknown"},
]

clean_rows = []
for row in rows:
    if validate_training_row(row):
        clean_rows.append(row)

print(clean_rows)
`) +
        '<p><strong>What this teaches:</strong> control flow protects the model from bad data. A model trained on invalid labels, missing numeric values, or impossible records can look fine in a demo and fail badly in production.</p>',
    },
  ],
  'py-ml-data-structures': [
    {
      heading: 'Actual Python: use containers to build simple features',
      body:
        code(`
rows = [
    {"user_id": 1, "country": "GH", "amount": 20.0},
    {"user_id": 2, "country": "NG", "amount": 35.5},
    {"user_id": 3, "country": "GH", "amount": 10.0},
]

amounts = [row["amount"] for row in rows]
countries = {row["country"] for row in rows}
user_amount_pairs = [(row["user_id"], row["amount"]) for row in rows]

average_amount = sum(amounts) / len(amounts)

print(amounts)
print(countries)
print(user_amount_pairs)
print(average_amount)
`) +
        '<p><strong>What this teaches:</strong> lists preserve ordered values, dictionaries represent named fields, sets keep unique values, and tuples hold fixed pairs. These are the building blocks behind later pandas and NumPy work.</p>',
    },
  ],
  'py-ml-functions': [
    {
      heading: 'Actual Python: write a reusable feature function',
      body:
        code(`
def build_transaction_features(row):
    amount = float(row["amount"])
    hour = int(row["hour"])

    return {
        "amount": amount,
        "is_large_amount": amount >= 1000,
        "is_night_transaction": hour < 6 or hour > 22,
    }

raw_rows = [
    {"amount": "2500.00", "hour": "23"},
    {"amount": "19.99", "hour": "14"},
]

features = [build_transaction_features(row) for row in raw_rows]
print(features)
`) +
        '<p><strong>What this teaches:</strong> a feature function should accept clear input and return clear output. Keeping the function pure makes it easier to test and reuse inside notebooks, APIs, and batch jobs.</p>',
    },
  ],
  'py-ml-comprehensions-iterators': [
    {
      heading: 'Actual Python: filter, transform, and stream rows',
      body:
        code(`
rows = [
    {"id": 1, "amount": 50, "label": 0},
    {"id": 2, "amount": None, "label": 1},
    {"id": 3, "amount": 900, "label": 0},
]

valid_rows = [row for row in rows if row["amount"] is not None]
amount_by_id = {row["id"]: row["amount"] for row in valid_rows}
large_amount_ids = [row["id"] for row in valid_rows if row["amount"] >= 500]

def stream_amounts(records):
    for record in records:
        if record["amount"] is not None:
            yield record["amount"]

print(valid_rows)
print(amount_by_id)
print(large_amount_ids)
print(sum(stream_amounts(rows)))
`) +
        '<p><strong>What this teaches:</strong> comprehensions are compact when the logic is simple. Generators are useful when data is large because they produce values one at a time instead of keeping everything in memory.</p>',
    },
  ],
  'py-ml-files-exceptions': [
    {
      heading: 'Actual Python: load JSON lines with useful errors',
      body:
        code(`
import json

def load_json_lines(path):
    records = []

    with open(path, "r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue

            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(f"bad JSON on line {line_number}") from error

    return records
`) +
        '<p><strong>What this teaches:</strong> production data contains broken lines and missing values. Good file-loading code gives the learner a useful error message instead of silently training on corrupted data.</p>',
    },
  ],
  'py-ml-oop': [
    {
      heading: 'Actual Python: build a small transformer class',
      body:
        code(`
class AmountScaler:
    def __init__(self):
        self.mean_ = None

    def fit(self, rows):
        amounts = [float(row["amount"]) for row in rows]
        self.mean_ = sum(amounts) / len(amounts)
        return self

    def transform(self, row):
        if self.mean_ is None:
            raise RuntimeError("call fit before transform")

        return {
            **row,
            "amount_centered": float(row["amount"]) - self.mean_,
        }

training_rows = [{"amount": 10}, {"amount": 20}, {"amount": 30}]
scaler = AmountScaler().fit(training_rows)
print(scaler.transform({"amount": 40}))
`) +
        '<p><strong>What this teaches:</strong> many ML libraries use the <code>fit</code> and <code>transform</code> pattern. The object learns state during fitting, then applies that same state consistently later.</p>',
    },
  ],
  'py-ml-dataclasses-typing': [
    {
      heading: 'Actual Python: define a clear experiment config',
      body:
        code(`
from dataclasses import dataclass

@dataclass
class TrainingConfig:
    model_name: str
    learning_rate: float
    test_size: float
    random_seed: int

def describe_run(config: TrainingConfig) -> str:
    return (
        f"Training {config.model_name} "
        f"with lr={config.learning_rate}, "
        f"test_size={config.test_size}, "
        f"seed={config.random_seed}"
    )

config = TrainingConfig("logistic-regression", 0.01, 0.2, 42)
print(describe_run(config))
`) +
        '<p><strong>What this teaches:</strong> dataclasses make experiment settings explicit. Type hints help readers and editors understand what kind of value each field expects.</p>',
    },
  ],
  'py-ml-testing-debugging': [
    {
      heading: 'Actual Python: test a feature function',
      body:
        code(`
def is_high_value_customer(row):
    return row["monthly_spend"] >= 100 and row["months_active"] >= 6

def test_high_value_customer():
    assert is_high_value_customer({"monthly_spend": 120, "months_active": 8}) is True
    assert is_high_value_customer({"monthly_spend": 80, "months_active": 8}) is False
    assert is_high_value_customer({"monthly_spend": 120, "months_active": 2}) is False

test_high_value_customer()
print("tests passed")
`) +
        '<p><strong>What this teaches:</strong> tests catch mistakes before a model is trained. If a feature is wrong, the model may learn the wrong pattern confidently.</p>',
    },
  ],
  'py-ml-async-concurrency': [
    {
      heading: 'Actual Python: run concurrent API-style calls',
      body:
        code(`
import asyncio

async def fetch_profile(user_id):
    await asyncio.sleep(0.1)  # simulates network delay
    return {"user_id": user_id, "active": True}

async def main():
    user_ids = [101, 102, 103]
    profiles = await asyncio.gather(
        *(fetch_profile(user_id) for user_id in user_ids)
    )
    print(profiles)

asyncio.run(main())
`) +
        '<p><strong>What this teaches:</strong> async helps when code waits on APIs, databases, queues, or model services. It is useful for ML services that collect external features before scoring.</p>',
    },
  ],
  'py-ml-packaging-envs': [
    {
      heading: 'Actual structure: a professional ML project',
      body:
        code(`
ml_project/
  pyproject.toml
  README.md
  data/
    raw/
    processed/
  src/
    ml_project/
      __init__.py
      features.py
      train.py
      evaluate.py
  tests/
    test_features.py
`) +
        code(`
# src/ml_project/features.py
def normalize_amount(amount):
    return float(amount) / 1000

# src/ml_project/train.py
from ml_project.features import normalize_amount

print(normalize_amount("2500"))
`) +
        '<p><strong>What this teaches:</strong> reusable code belongs in source files, not only in notebooks. Notebooks are useful for exploration, but tested modules make ML projects easier to maintain.</p>',
    },
  ],
};

const sqlSections: Record<string, MlLessonSection[]> = {
  'sql-ml-relational-model': [
    {
      heading: 'Actual SQL thinking: labels, entities, and events',
      body:
        code(`
customers
---------
customer_id | country | signup_date

transactions
------------
transaction_id | customer_id | amount | transaction_time

labels
------
customer_id | prediction_time | churned
`) +
        '<p><strong>What this teaches:</strong> the label table defines what the model learns to predict. Event tables provide historical behavior. A correct ML dataset uses only information available before the prediction time.</p>',
    },
  ],
  'sql-ml-select-filter-sort': [
    {
      heading: 'Actual SQL: inspect rows safely',
      body:
        code(`
SELECT
  customer_id,
  country,
  signup_date,
  account_status
FROM customers
WHERE account_status = 'active'
  AND signup_date >= DATE '2026-01-01'
ORDER BY signup_date DESC
LIMIT 20;
`) +
        '<p><strong>What this teaches:</strong> <code>SELECT</code> chooses columns, <code>WHERE</code> filters rows, <code>ORDER BY</code> sorts the result, and <code>LIMIT</code> keeps exploration manageable.</p>',
    },
  ],
  'sql-ml-aggregates-groupby': [
    {
      heading: 'Actual SQL: turn event history into features',
      body:
        code(`
SELECT
  customer_id,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount,
  AVG(amount) AS average_amount,
  MAX(transaction_time) AS last_transaction_time
FROM transactions
WHERE transaction_time < TIMESTAMP '2026-06-01 00:00:00'
GROUP BY customer_id;
`) +
        '<p><strong>What this teaches:</strong> aggregates convert many events into one feature row per entity. The time filter prevents future data from leaking into training.</p>',
    },
  ],
  'sql-ml-joins': [
    {
      heading: 'Actual SQL: join labels to features',
      body:
        code(`
WITH transaction_features AS (
  SELECT
    customer_id,
    COUNT(*) AS transaction_count,
    AVG(amount) AS average_amount
  FROM transactions
  WHERE transaction_time < TIMESTAMP '2026-06-01 00:00:00'
  GROUP BY customer_id
)
SELECT
  l.customer_id,
  l.churned,
  COALESCE(f.transaction_count, 0) AS transaction_count,
  COALESCE(f.average_amount, 0) AS average_amount
FROM labels AS l
LEFT JOIN transaction_features AS f
  ON l.customer_id = f.customer_id;
`) +
        '<p><strong>What this teaches:</strong> <code>LEFT JOIN</code> keeps every labeled row, even if a customer has no matching feature history. <code>COALESCE</code> makes the missing-value decision explicit.</p>',
    },
  ],
  'sql-ml-case-nulls': [
    {
      heading: 'Actual SQL: handle NULL and create buckets',
      body:
        code(`
SELECT
  customer_id,
  COALESCE(country, 'unknown') AS country,
  CASE
    WHEN monthly_spend IS NULL THEN 'missing'
    WHEN monthly_spend >= 500 THEN 'high'
    WHEN monthly_spend >= 100 THEN 'medium'
    ELSE 'low'
  END AS spend_bucket,
  CASE
    WHEN last_login_at IS NULL THEN 1
    ELSE 0
  END AS missing_last_login
FROM customers;
`) +
        '<p><strong>What this teaches:</strong> missing values should be handled deliberately. Sometimes missingness itself becomes a useful feature.</p>',
    },
  ],
  'sql-ml-ctes-subqueries': [
    {
      heading: 'Actual SQL: use CTEs to make feature logic readable',
      body:
        code(`
WITH base_labels AS (
  SELECT customer_id, prediction_time, churned
  FROM labels
),
recent_events AS (
  SELECT customer_id, event_time
  FROM events
  WHERE event_time >= TIMESTAMP '2026-05-01 00:00:00'
    AND event_time < TIMESTAMP '2026-06-01 00:00:00'
),
event_features AS (
  SELECT customer_id, COUNT(*) AS events_30d
  FROM recent_events
  GROUP BY customer_id
)
SELECT
  b.customer_id,
  b.churned,
  COALESCE(e.events_30d, 0) AS events_30d
FROM base_labels AS b
LEFT JOIN event_features AS e
  ON b.customer_id = e.customer_id;
`) +
        '<p><strong>What this teaches:</strong> each named CTE is one understandable step: labels, valid events, aggregate features, and final training rows.</p>',
    },
  ],
  'sql-ml-window-functions': [
    {
      heading: 'Actual SQL: compare each row with previous behavior',
      body:
        code(`
SELECT
  customer_id,
  transaction_id,
  transaction_time,
  amount,
  ROW_NUMBER() OVER (
    PARTITION BY customer_id
    ORDER BY transaction_time
  ) AS transaction_number,
  LAG(amount) OVER (
    PARTITION BY customer_id
    ORDER BY transaction_time
  ) AS previous_amount
FROM transactions;
`) +
        '<p><strong>What this teaches:</strong> window functions keep the original rows while adding sequence-aware features such as previous amount, event number, rank, or time since last event.</p>',
    },
  ],
  'sql-ml-schema-indexes': [
    {
      heading: 'Actual SQL: design a table for reliable data',
      body:
        code(`
CREATE TABLE login_events (
  event_id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  event_time TIMESTAMP NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL
);

CREATE INDEX idx_login_events_user_time
ON login_events (user_id, event_time);
`) +
        '<p><strong>What this teaches:</strong> constraints protect data quality, and indexes make feature queries faster when filtering by user and time.</p>',
    },
  ],
  'sql-ml-transactions': [
    {
      heading: 'Actual SQL: refresh features safely',
      body:
        code(`
BEGIN;

DELETE FROM customer_features
WHERE feature_date = DATE '2026-06-01';

INSERT INTO customer_features (
  customer_id,
  feature_date,
  transaction_count,
  total_amount
)
SELECT
  customer_id,
  DATE '2026-06-01' AS feature_date,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount
FROM transactions
WHERE transaction_time < TIMESTAMP '2026-06-01 00:00:00'
GROUP BY customer_id;

COMMIT;
`) +
        '<p><strong>What this teaches:</strong> a transaction protects the table from being left half-updated if the refresh fails. The delete-then-insert pattern also makes reruns predictable for one feature date.</p>',
    },
  ],
  'sql-ml-feature-store-query': [
    {
      heading: 'Actual SQL: build a full training dataset',
      body:
        code(`
WITH labels AS (
  SELECT customer_id, prediction_time, churned
  FROM churn_labels
  WHERE prediction_time = TIMESTAMP '2026-06-01 00:00:00'
),
past_transactions AS (
  SELECT
    l.customer_id,
    t.amount
  FROM labels AS l
  LEFT JOIN transactions AS t
    ON l.customer_id = t.customer_id
   AND t.transaction_time < l.prediction_time
   AND t.transaction_time >= l.prediction_time - INTERVAL '30 days'
),
transaction_features AS (
  SELECT
    customer_id,
    COUNT(amount) AS transaction_count_30d,
    COALESCE(SUM(amount), 0) AS total_amount_30d,
    COALESCE(AVG(amount), 0) AS avg_amount_30d
  FROM past_transactions
  GROUP BY customer_id
)
SELECT
  l.customer_id,
  l.churned,
  f.transaction_count_30d,
  f.total_amount_30d,
  f.avg_amount_30d
FROM labels AS l
LEFT JOIN transaction_features AS f
  ON l.customer_id = f.customer_id;
`) +
        '<p><strong>What this teaches:</strong> real ML SQL starts from labels, respects prediction time, builds past-looking features, handles missing values, and returns one row per training example.</p>',
    },
  ],
};

export const enrichMlLessonWithCode = (lesson: MlLesson): MlLesson => {
  const extraSections = pythonSections[lesson.id] ?? sqlSections[lesson.id];
  if (!extraSections?.length) {
    return lesson;
  }

  const existingHeadings = new Set(lesson.sections.map((section) => section.heading));
  const additions = extraSections.filter((section) => !existingHeadings.has(section.heading));

  if (!additions.length) {
    return lesson;
  }

  return {
    ...lesson,
    sections: [...lesson.sections, ...additions],
  };
};
