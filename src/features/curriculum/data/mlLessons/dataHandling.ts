import type { MlLesson } from './types';

export const DATA_HANDLING_LESSONS: MlLesson[] = [
  {
    id: 'missing-data',
    title: 'Handling Missing Data',
    source: 'Extension',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-01',
    sections: [
      {
        heading: 'Missing data is never random by accident',
        body: `<p>Values go missing for reasons — a sensor failed, a survey question was skipped, a join
        didn't match. Understanding <em>why</em> data is missing matters, because the fix that's safe for
        one reason can quietly corrupt your model for another.</p>`,
      },
      {
        heading: 'Three common strategies',
        body: `<ul>
          <li><strong>Drop rows</strong> — safe when missingness is rare and random; wasteful otherwise.</li>
          <li><strong>Drop the column</strong> — appropriate when a feature is missing so often it carries little signal.</li>
          <li><strong>Impute</strong> — fill gaps with the column's mean/median (numeric) or mode (categorical), or a
          more informed estimate from related columns.</li>
        </ul>`,
      },
      {
        heading: 'The leakage trap',
        body: `<p>Whatever imputation strategy you choose, compute the fill value (mean, median, etc.) from
        the <strong>training set only</strong>, then apply that same value to the test set. Computing it from
        the whole dataset leaks information from test data into training — a subtle but common bug.</p>`,
      },
      {
        heading: 'Worked example: choosing a strategy',
        body: `<p>A 10,000-row loan dataset has "annual_income" missing in 2% of rows and "co_applicant_income"
        missing in 95% of rows. The first is a good imputation candidate — fill with the training set's
        median income. The second is missing so often (likely meaning "no co-applicant") that a smarter fix
        is a new binary column "has_co_applicant" plus filling the income with 0, rather than dropping a
        column that's actually carrying real signal about the applicant's situation.</p>`,
      },
    ],
  },
  {
    id: 'feature-scaling',
    title: 'Feature Scaling: Standardization &amp; Normalization',
    source: 'Session 8',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-02',
    sections: [
      {
        heading: 'Why scale is a real problem',
        body: `<p>If one feature ranges 0–1 and another ranges 0–1,000,000, many algorithms (k-NN, SVM,
        gradient descent-based models, anything using distance or dot products) will let the
        large-magnitude feature dominate — not because it's more predictive, just because of its units.</p>`,
      },
      {
        heading: 'Standardization vs. normalization',
        body: `<ul>
          <li><strong>Standardization (z-score)</strong> — (x - mean) / std. Centers data at 0 with unit variance;
          the standard default for most models.</li>
          <li><strong>Min-max normalization</strong> — (x - min) / (max - min). Squeezes values into [0, 1]; useful
          when you need a bounded range, but sensitive to outliers.</li>
        </ul>`,
      },
      {
        heading: 'Which models actually need it?',
        body: `<p>Distance-based and gradient-based models (k-NN, k-means, SVM, linear/logistic regression,
        neural networks) need scaling. Tree-based models (decision trees, random forests, gradient
        boosting) split on raw thresholds and are invariant to monotonic scaling, so they don't.</p>`,
      },
      {
        heading: 'Worked example: unscaled k-NN goes wrong',
        body: `<p>Comparing two houses with [square_feet, bedrooms] = [1500, 3] and [1520, 5], the squared
        Euclidean distance is (1520-1500)&sup2; + (5-3)&sup2; = 400 + 4 = 404 — square footage alone
        decides almost the entire distance, even though "2 extra bedrooms" is arguably the bigger real
        difference. After standardizing both features to comparable scales, the bedroom difference finally
        carries proportional weight in the distance calculation, exactly as it should.</p>`,
      },
    ],
  },
  {
    id: 'encoding-categorical',
    title: 'Encoding Categorical Variables',
    source: 'Session 8',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-03',
    sections: [
      {
        heading: 'Models need numbers',
        body: `<p>A column like "color" with values red/green/blue can't go into a model as text. Encoding
        converts categories into numbers — but naively assigning red=1, green=2, blue=3 invents a false
        ordering the model will treat as meaningful.</p>`,
      },
      {
        heading: 'Label encoding vs. one-hot encoding',
        body: `<ul>
          <li><strong>Label encoding</strong> — assigns each category an integer. Fine for ordinal data with a
          real order (low/medium/high), risky for unordered categories.</li>
          <li><strong>One-hot encoding</strong> — creates one binary column per category ("is_red", "is_green",
          "is_blue"). No false ordering, at the cost of more columns.</li>
        </ul>`,
      },
      {
        heading: 'Cross features',
        body: `<p>Combining two categorical columns into one ("city" &times; "day_of_week" &rarr;
        "city_day") can expose interaction effects a model couldn't learn from the two columns separately
        — at the cost of many more possible category combinations.</p>`,
      },
      {
        heading: 'Worked example: one-hot in a table',
        body: `<p>A "color" column with values [red, blue, red] one-hot encodes to two binary columns
        (three distinct categories would need three, though one is often dropped to avoid redundancy):</p>
        <pre>color  ->  is_red  is_blue
red         1        0
blue        0        1
red         1        0</pre>
        <p>This is exactly the transformation the one-hot-encoding coding challenge below asks you to
        implement — one dict per row, one key per distinct category seen in the column.</p>`,
      },
    ],
  },
  {
    id: 'feature-engineering',
    title: 'Feature Engineering &amp; Domain Knowledge',
    source: 'Session 8',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-04',
    sections: [
      {
        heading: 'Turning raw data into signal',
        body: `<p>Feature engineering transforms raw columns into inputs a model can use effectively —
        creating ratios, differences, or interaction terms that make a relationship linear or otherwise
        easier for the model to find, even when the raw columns hide it.</p>`,
      },
      {
        heading: 'Domain knowledge beats brute force',
        body: `<p>A data scientist who understands the problem domain can engineer a single feature (e.g.
        "days since last purchase" for a churn model) that outperforms dozens of raw columns fed
        automatically to a model. The best features usually come from understanding <em>why</em> the
        target variable behaves the way it does.</p>`,
      },
      {
        heading: 'Underfitting and overfitting, revisited',
        body: `<p>Too few, too-simple features and a model underfits — it can't capture real patterns. Too
        many redundant or noisy features and it overfits — it memorizes quirks of the training set instead
        of learning generalizable structure. Feature engineering is a constant balance between the two.</p>`,
      },
      {
        heading: 'Worked example: a ratio beats two raw columns',
        body: `<p>Predicting ad click-through fraud from raw "clicks" and "impressions" columns, a model has
        to learn the relationship between the two on its own. Engineering a single "click_through_rate" =
        clicks / impressions feature hands it the signal directly — a rate of 40% is suspicious regardless
        of whether it came from 2 clicks on 5 impressions or 4,000 on 10,000, something the two raw columns
        don't express on their own.</p>`,
      },
    ],
  },
  {
    id: 'train-test-split',
    title: 'Train/Test Split &amp; Data Leakage',
    source: 'Extension',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-05',
    sections: [
      {
        heading: 'Why you can\'t evaluate on training data',
        body: `<p>A model evaluated on the same data it trained on will always look better than it really
        is — it has had a chance to simply memorize that data. Splitting off a held-out <strong>test
        set</strong> the model never sees during training gives an honest estimate of real-world performance.</p>`,
      },
      {
        heading: 'The standard split',
        body: `<p>A common default is 80% train / 20% test, chosen randomly (with a fixed random seed for
        reproducibility). For larger datasets, an even smaller test fraction is fine since it still
        contains plenty of examples to estimate performance reliably.</p>`,
      },
      {
        heading: 'Data leakage: the split\'s biggest threat',
        body: `<p><strong>Leakage</strong> happens when information from the test set influences training —
        scaling using statistics from the whole dataset, imputing missing values using the full dataset's
        mean, or (in time series) letting future data appear in the training set. Leakage makes test
        performance look great while the real-world model quietly fails.</p>`,
      },
      {
        heading: 'Worked example: a leakage bug, caught',
        body: `<p>A team standardizes their whole 10,000-row dataset — computing mean and std once — then
        splits into train/test. Test accuracy looks great. In production, accuracy drops sharply. The bug:
        the test set's own values quietly influenced the mean/std used to scale the training data. The
        fix is to call <code>fit</code> (compute mean/std) only on the training split, then <code>transform</code>
        the test split with those same numbers — never re-fit on test data.</p>`,
      },
    ],
  },
  {
    id: 'bias-variance-tradeoff',
    title: 'The Bias-Variance Tradeoff',
    source: 'Session 8',
    unit: 'data-handling',
    challengeTaskId: 'ml-data-06',
    sections: [
      {
        heading: 'Two ways to be wrong',
        body: `<p><strong>Bias</strong> is error from a model being too simple to capture the true
        relationship (underfitting). <strong>Variance</strong> is error from a model being too sensitive to
        the specific training data it saw (overfitting) — a small change in training data would produce a
        very different model.</p>`,
      },
      {
        heading: 'Why you can\'t minimize both freely',
        body: `<p>A very flexible model (a deep decision tree, a high-degree polynomial) can fit training
        data almost perfectly — low bias, but high variance, since it's fitting noise as much as signal. A
        very rigid model (a straight line) is stable across different training sets — low variance, but
        high bias if the true relationship is curved.</p>`,
      },
      {
        heading: 'Managing the tradeoff in practice',
        body: `<p>Regularization, cross-validation, ensembling, and simply gathering more training data are
        all tools for finding the sweet spot — a model complex enough to capture real structure, but not so
        complex it memorizes noise.</p>`,
      },
      {
        heading: 'Worked example: watching both errors move',
        body: `<p>Fitting polynomials of degree 1, 4, and 15 to the same noisy data: degree 1 has high
        training error and similarly high test error (underfitting — high bias). Degree 4 has low training
        error and low test error (a good fit). Degree 15 has near-zero training error but test error far
        worse than degree 4 (overfitting — high variance). Plotting train vs. test error against model
        complexity, and watching test error start rising while training error keeps falling, is the single
        most common way this tradeoff gets diagnosed in practice.</p>`,
      },
    ],
  },
];
