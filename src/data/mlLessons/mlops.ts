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
    ],
  },
];
