import type { MlLesson } from './types';

export const MLOPS_LESSONS: MlLesson[] = [
  {
    id: 'sql-databases',
    title: 'SQL &amp; Databases',
    source: 'Session 10',
    unit: 'mlops',
    challengeTaskId: 'ml-ops-01',
    sections: [
      {
        heading: 'Why ML practitioners need SQL',
        body: `<p>Real-world training data usually lives in a relational database, not a CSV on disk.
        Pulling and pre-aggregating exactly the rows and columns you need with SQL saves time and memory
        compared to loading everything and filtering in pandas.</p>`,
      },
      {
        heading: 'Core concepts',
        body: `<p>A relational database (RDBMS) stores data in tables linked by keys. Normalizing data
        across related tables (e.g. customers and orders) avoids duplicated, inconsistent data.</p>`,
      },
      {
        heading: 'Basic SQL',
        body: `<pre>SELECT customer_id, SUM(amount) AS total_spent
FROM orders
WHERE order_date >= '2026-01-01'
GROUP BY customer_id
ORDER BY total_spent DESC;</pre>`,
      },
      {
        heading: 'Worked example: the same query in Python',
        body: `<p>Four orders — two from customer A ($100, $30), one from B ($50), one from C ($200 but
        before the cutoff date) — filtered to 2026 and grouped by customer give A=$130, B=$50, sorted
        descending. That's the exact same result the SQL query above produces, and exactly what the
        group-by coding challenge below asks you to build by hand in plain Python: filter, accumulate into
        a dict, then sort.</p>`,
      },
    ],
  },
  {
    id: 'model-deployment',
    title: 'Model Deployment: From Notebook to API',
    source: 'Extension',
    unit: 'mlops',
    challengeTaskId: 'ml-ops-02',
    sections: [
      {
        heading: 'A notebook is not a product',
        body: `<p>A model that only exists as a trained object in a Jupyter notebook can't help anyone. It
        needs to be <strong>serialized</strong> (saved to disk), loaded by a running service, and exposed
        through some interface — usually a web API — that other software can call.</p>`,
      },
      {
        heading: 'The typical shape of a model API',
        body: `<p>A minimal serving endpoint takes a request with feature values, runs the exact same
        preprocessing used during training, calls model.predict(), and returns the result as JSON. Any
        mismatch between training-time and serving-time preprocessing — a classic bug called
        <strong>training/serving skew</strong> — silently produces wrong predictions.</p>`,
      },
      {
        heading: 'Versioning matters',
        body: `<p>As a model gets retrained, keeping track of exactly which version is deployed, what data
        it was trained on, and how it performed is essential for debugging regressions and rolling back
        safely when a new version underperforms.</p>`,
      },
      {
        heading: 'Worked example: validating a request before it reaches the model',
        body: `<p>A request <code>{"age": 30, "income": 50000}</code> against required fields
        [age, income] passes validation — both present, both numeric. A request missing "income" fails
        immediately, before ever reaching <code>model.predict()</code>. A request with
        <code>{"age": "30", ...}</code> — age sent as a string instead of a number — also fails: silently
        letting that through could crash the model or, worse, produce a nonsense prediction. This exact
        present-and-numeric check is what the coding challenge below implements.</p>`,
      },
    ],
  },
  {
    id: 'ml-ethics-fairness',
    title: 'ML Ethics, Bias &amp; Fairness',
    source: 'Extension',
    unit: 'mlops',
    challengeTaskId: 'ml-ops-03',
    sections: [
      {
        heading: 'Models inherit the data\'s biases',
        body: `<p>A model trained on historical data learns whatever patterns — including unfair ones —
        exist in that history. A hiring model trained on past hiring decisions can learn to replicate past
        discrimination, even with no explicit "protected attribute" column in the data, since other
        features often correlate with it.</p>`,
      },
      {
        heading: 'Measuring fairness',
        body: `<p>There's no single definition of "fair" — common formalizations include <strong>demographic
        parity</strong> (equal positive-prediction rates across groups) and <strong>equalized odds</strong>
        (equal true/false positive rates across groups). These can conflict with each other and with overall
        accuracy, which is why fairness is a design decision, not just a metric to maximize.</p>`,
      },
      {
        heading: 'Auditing a model',
        body: `<p>Computing standard metrics (accuracy, precision, recall) <em>separately for each subgroup</em>
        in the data — not just overall — is the most basic and important fairness check: a model can look
        excellent in aggregate while performing far worse for a specific group.</p>`,
      },
      {
        heading: 'Worked example: an audit that catches a problem',
        body: `<p>Overall accuracy on a loan-approval model looks great at 90%. Splitting by group reveals
        group A at 95% accuracy and group B at 78% — a 17-point gap invisible in the aggregate number. That
        gap is exactly what a per-group audit like the coding challenge below is built to surface: compute
        the same metric once per subgroup, then compare, rather than trusting one blended number.</p>`,
      },
    ],
  },
  {
    id: 'ml-project-workflow',
    title: 'A Complete ML Project Workflow',
    source: 'Extension',
    unit: 'mlops',
    challengeTaskId: 'ml-ops-04',
    sections: [
      {
        heading: 'The full pipeline, end to end',
        body: `<ol>
          <li><strong>Define the problem</strong> — what decision will this model actually inform?</li>
          <li><strong>Collect &amp; explore data</strong> — EDA, from Unit 1.</li>
          <li><strong>Clean &amp; engineer features</strong> — Unit 2.</li>
          <li><strong>Split data</strong> — train/validation/test, guarding against leakage.</li>
          <li><strong>Train &amp; tune candidate models</strong> — Units 3–7, using cross-validation from Unit 5.</li>
          <li><strong>Evaluate honestly</strong> — on the untouched test set, with the right metrics for the problem.</li>
          <li><strong>Deploy, monitor, and retrain</strong> — the ongoing work after "done."</li>
        </ol>`,
      },
      {
        heading: 'Most of the work isn\'t modeling',
        body: `<p>In most real projects, data collection, cleaning, and feature engineering take far longer
        than model training — a pattern this whole curriculum has echoed by putting Foundations and Data
        Handling before any model at all.</p>`,
      },
      {
        heading: 'Iteration, not a straight line',
        body: `<p>In practice this pipeline loops constantly: evaluation reveals a data problem, which sends
        you back to feature engineering; a new business requirement changes the problem definition
        entirely. Treating it as a one-way pipeline is a common beginner mistake.</p>`,
      },
      {
        heading: 'Worked example: catching a broken split before it costs you',
        body: `<p>A 10-example dataset split into train=[0-5], val=[6,7], test=[8,9] should have zero overlap
        and cover every index exactly once. If a bug accidentally puts index 6 in both train and val, a
        validity check comparing the three sets as disjoint sets — exactly what the split-validation coding
        challenge below implements — catches it immediately, before a subtly-leaked validation score misleads
        every hyperparameter decision downstream.</p>`,
      },
    ],
  },
  {
    id: 'mlops-intro',
    title: 'Introduction to MLOps',
    source: 'Extension',
    unit: 'mlops',
    challengeTaskId: 'ml-ops-05',
    sections: [
      {
        heading: 'What changes after deployment',
        body: `<p>A deployed model faces a problem training never did: the real world keeps changing.
        <strong>MLOps</strong> is the set of practices for managing models as living systems, not one-time
        artifacts.</p>`,
      },
      {
        heading: 'Data and concept drift',
        body: `<p><strong>Data drift</strong> is when the distribution of incoming data shifts away from
        what the model was trained on (new customer demographics, a changed sensor). <strong>Concept
        drift</strong> is when the relationship between features and target itself changes (fraud patterns
        evolve as fraudsters adapt). Both silently degrade a model that was working fine at launch.</p>`,
      },
      {
        heading: 'Monitoring and retraining',
        body: `<p>Production ML systems track prediction distributions and, where possible, real outcomes
        over time, alerting when performance metrics drift outside expected bounds — triggering a
        retraining cycle that starts the whole pipeline from Unit 10's previous lesson over again with
        fresh data.</p>`,
      },
      {
        heading: 'Worked example: a simple drift alarm',
        body: `<p>A model was trained on transactions averaging $100 with a standard deviation of $10. This
        week's batch averages $105 — within 2 standard deviations, no alarm. Next week's batch averages
        $150 — five standard deviations away, clearly outside normal variation, and worth investigating
        before trusting the model's predictions on it. This mean-and-threshold check is exactly what the
        drift-detector coding challenge below implements.</p>`,
      },
    ],
  },
];
