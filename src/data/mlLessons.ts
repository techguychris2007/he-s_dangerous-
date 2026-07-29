export interface MlLessonSection {
  heading: string;
  /** trusted, hand-authored HTML — never render user input through this field */
  body: string;
}

export interface MlLesson {
  id: string;
  title: string;
  source: string;
  group: string;
  demo?: 'linear-regression' | 'kmeans';
  sections: MlLessonSection[];
}

export const ML_LESSONS: MlLesson[] = [
  {
    id: 'python-basics',
    title: 'Python Basics',
    source: 'Pre-Lecture · Python 1 & 2',
    group: 'Foundations',
    sections: [
      {
        heading: 'Why Python for machine learning?',
        body: `<p>Python is the default language for ML because of readability and its ecosystem: NumPy for
        arrays, pandas for tabular data, scikit-learn for models, and matplotlib/seaborn for plots all
        interoperate on the same core data types.</p>`,
      },
      {
        heading: 'The building blocks',
        body: `<ul>
          <li><strong>Variables &amp; types</strong> — numbers, strings, booleans, lists, dicts.</li>
          <li><strong>Control flow</strong> — if/elif/else, for/while loops.</li>
          <li><strong>Functions</strong> — reusable blocks defined with def.</li>
          <li><strong>Error handling</strong> — try/except so one bad row doesn't crash a pipeline.</li>
        </ul>`,
      },
    ],
  },
  {
    id: 'numpy',
    title: 'NumPy: Efficient Data Manipulation',
    source: 'Session 2',
    group: 'Foundations',
    sections: [
      {
        heading: 'Why not just use Python lists?',
        body: `<p>NumPy's ndarray stores data in contiguous, typed memory and applies operations
        element-wise in compiled C code, so vectorized math on arrays of thousands of numbers runs far
        faster than an equivalent Python for loop.</p>`,
      },
      {
        heading: 'Core ideas',
        body: `<ul>
          <li><strong>Shape &amp; dtype</strong> — every array has a fixed shape and element type.</li>
          <li><strong>Broadcasting</strong> — operations between differently-shaped arrays apply automatically.</li>
          <li><strong>Aggregation</strong> — a.sum(), a.mean(), a.std() along any axis.</li>
        </ul>`,
      },
    ],
  },
  {
    id: 'pandas',
    title: 'Pandas: Cleaning &amp; Structuring Data',
    source: 'Session 3',
    group: 'Foundations',
    sections: [
      {
        heading: 'Series and DataFrame',
        body: `<p>A Series is a labeled 1-D array; a DataFrame is a table of Series sharing an index —
        a spreadsheet with fast, vectorized operations layered on top of NumPy.</p>`,
      },
      {
        heading: 'Why cleaning matters for ML',
        body: `<p>Most of the effort in a real ML project is spent handling missing values, fixing types,
        and filtering rows — a model trained on unfiltered, mistyped, or leaky data will confidently
        produce wrong answers.</p>`,
      },
    ],
  },
  {
    id: 'data-viz',
    title: 'Data Visualization',
    source: 'Session 4',
    group: 'Foundations',
    sections: [
      {
        heading: 'matplotlib &amp; seaborn',
        body: `<p>matplotlib covers the fundamentals: line, bar, scatter, histogram plots. seaborn adds
        high-level statistical plots — distributions and correlation heatmaps — with sensible defaults.</p>`,
      },
      {
        heading: 'Visualize before you model',
        body: `<p>Exploratory Data Analysis (EDA) — plotting distributions and relationships before fitting
        anything — catches outliers, skew, and correlated features that would otherwise silently break a
        model's assumptions.</p>`,
      },
    ],
  },
  {
    id: 'supervised-learning',
    title: 'Supervised Learning',
    source: 'Session 5',
    group: 'Machine Learning',
    demo: 'linear-regression',
    sections: [
      {
        heading: 'Learning from labeled data',
        body: `<p>In supervised learning, each training example has a known answer (a label). The model
        learns a function mapping inputs to outputs, then is evaluated on how well it predicts labels it
        hasn't seen. Two flavors: <strong>regression</strong> predicts a continuous number, <strong>classification</strong>
        predicts a category.</p>`,
      },
      {
        heading: 'Linear regression, concretely',
        body: `<p>Linear regression fits a line y = slope&middot;x + intercept that minimizes the mean
        squared error (MSE) between predictions and actual values. With one input variable, the best-fit
        slope and intercept have a closed-form solution (ordinary least squares) — no iterative search
        needed.</p>`,
      },
      {
        heading: 'Try it below',
        body: `<p>The panel below runs ordinary least squares on your data entirely in your browser (pure
        TypeScript, no server) and charts the fit against the data.</p>`,
      },
    ],
  },
  {
    id: 'model-evaluation',
    title: 'Model Evaluation',
    source: 'Session 6',
    group: 'Machine Learning',
    sections: [
      {
        heading: 'Overfitting vs. underfitting',
        body: `<p>A model that memorizes training data but fails on new data is <strong>overfit</strong>;
        one too simple to capture real patterns is <strong>underfit</strong>. This is why models are
        evaluated on a held-out test set, never on the data they trained on.</p>`,
      },
      {
        heading: 'Classification metrics',
        body: `<p>The confusion matrix underlies the common metrics: <strong>accuracy</strong> (fraction
        correct overall), <strong>precision</strong> (of predicted positives, how many were correct),
        <strong>recall</strong> (of actual positives, how many were caught), and <strong>F1</strong> (their
        harmonic mean).</p>`,
      },
      {
        heading: 'Regression metrics',
        body: `<p><strong>MSE</strong>/<strong>RMSE</strong> penalize large errors heavily; <strong>R&sup2;</strong>
        reports the fraction of variance in the target explained by the model, where 1.0 is a perfect fit.</p>`,
      },
    ],
  },
  {
    id: 'feature-engineering',
    title: 'Feature Engineering &amp; Ensemble Learning',
    source: 'Session 8',
    group: 'Machine Learning',
    sections: [
      {
        heading: 'Turning raw data into signal',
        body: `<p>Feature engineering transforms raw columns into inputs a model can use effectively:
        scaling numeric ranges, encoding categories as numbers, binning continuous values, and creating
        interaction terms.</p>`,
      },
      {
        heading: 'Ensemble learning',
        body: `<p>Instead of one model, ensembles combine many: <strong>bagging</strong> (e.g. Random
        Forest) trains many models on random subsets and averages predictions to reduce variance;
        <strong>boosting</strong> (e.g. Gradient Boosting) trains models sequentially, each correcting the
        previous one's errors, to reduce bias.</p>`,
      },
    ],
  },
  {
    id: 'unsupervised-learning',
    title: 'Unsupervised Learning',
    source: 'Session 11',
    group: 'Machine Learning',
    demo: 'kmeans',
    sections: [
      {
        heading: 'Finding structure without labels',
        body: `<p>Unsupervised learning works on unlabeled data, looking for structure — groups of
        similar points (clustering) or lower-dimensional representations — rather than predicting a known
        answer.</p>`,
      },
      {
        heading: 'k-means clustering',
        body: `<p>k-means partitions points into k clusters by repeating two steps until stable: assign
        every point to its nearest centroid, then move each centroid to the average position of its
        assigned points. Choosing k is often done with the "elbow method" — plotting within-cluster error
        against k and picking the point where gains diminish.</p>`,
      },
      {
        heading: 'Try it below',
        body: `<p>The panel below runs Lloyd's k-means algorithm on your data entirely in your browser and
        plots the resulting clusters and centroids.</p>`,
      },
    ],
  },
  {
    id: 'time-series',
    title: 'Time Series Analysis',
    source: 'Session 12',
    group: 'Machine Learning',
    sections: [
      {
        heading: 'Why time series is different',
        body: `<p>In time series data, order matters and observations are usually not independent —
        today's value is correlated with yesterday's. Standard random train/test splits can leak future
        information, so splits are typically done chronologically instead.</p>`,
      },
      {
        heading: 'Trend, seasonality, and lag features',
        body: `<p>Most series decompose into a long-term trend, a repeating seasonal pattern, and noise. A
        common forecasting trick is creating "lag" features — yesterday's value as a column — so a standard
        regression model can be reused for time series prediction.</p>`,
      },
    ],
  },
  {
    id: 'sql-databases',
    title: 'SQL &amp; Databases',
    source: 'Session 10',
    group: 'Data Engineering',
    sections: [
      {
        heading: 'Why ML practitioners need SQL',
        body: `<p>Real-world training data usually lives in a relational database, not a CSV on disk.
        Pulling and pre-aggregating exactly the rows and columns you need with SQL saves time and memory
        compared to loading everything and filtering in pandas.</p>`,
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
];

export function findMlLesson(id: string): MlLesson | undefined {
  return ML_LESSONS.find((l) => l.id === id);
}
