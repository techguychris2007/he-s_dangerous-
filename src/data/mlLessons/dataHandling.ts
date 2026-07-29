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
    ],
  },
];
