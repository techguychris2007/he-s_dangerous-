// Curriculum content for the ML Portal. Topics and sequencing mirror the
// GCI World course folders (Session1-13); explanations are written fresh
// for teaching purposes, not copied from the course notebooks.

const CURRICULUM = [
  {
    group: 'Foundations',
    lessons: [
      {
        id: 'python-basics',
        title: 'Python Basics',
        source: 'Pre-Lecture · Python 1 & 2',
        sections: [
          {
            heading: 'Why Python for machine learning?',
            body: `<p>Python is the default language for ML because of readability and its
            ecosystem: NumPy for arrays, pandas for tabular data, scikit-learn for models,
            and matplotlib/seaborn for plots all interoperate on the same core data types.</p>`,
          },
          {
            heading: 'The building blocks',
            body: `<ul>
              <li><strong>Variables &amp; types</strong> — numbers, strings, booleans, lists, dicts.</li>
              <li><strong>Control flow</strong> — <code>if</code>/<code>elif</code>/<code>else</code>, <code>for</code>/<code>while</code> loops.</li>
              <li><strong>Functions</strong> — reusable blocks defined with <code>def</code>.</li>
              <li><strong>Error handling</strong> — <code>try</code>/<code>except</code> so one bad row doesn't crash a pipeline.</li>
            </ul>`,
          },
          {
            heading: 'A minimal example',
            body: `<pre><code>def mean(values):
    return sum(values) / len(values)

scores = [72, 88, 91, 65]
print(mean(scores))  # 79.0</code></pre>`,
          },
        ],
      },
      {
        id: 'numpy',
        title: 'NumPy: Efficient Data Manipulation',
        source: 'Session 2',
        sections: [
          {
            heading: 'Why not just use Python lists?',
            body: `<p>NumPy's <code>ndarray</code> stores data in contiguous, typed memory and applies
            operations element-wise in compiled C code, so vectorized math on arrays of
            thousands of numbers runs far faster than an equivalent Python <code>for</code> loop.</p>`,
          },
          {
            heading: 'Core ideas',
            body: `<ul>
              <li><strong>Shape &amp; dtype</strong> — every array has a fixed shape (e.g. <code>(3, 4)</code>) and element type.</li>
              <li><strong>Indexing &amp; slicing</strong> — <code>a[1:3]</code>, <code>a[:, 0]</code> for columns.</li>
              <li><strong>Broadcasting</strong> — operations between differently-shaped arrays are applied automatically without writing loops.</li>
              <li><strong>Aggregation</strong> — <code>a.sum()</code>, <code>a.mean()</code>, <code>a.std()</code> along any axis.</li>
            </ul>`,
          },
          {
            heading: 'Example',
            body: `<pre><code>import numpy as np
a = np.array([1, 2, 3, 4])
b = a * 2 + 1        # vectorized: [3, 5, 7, 9]
print(a.mean(), a.std())</code></pre>`,
          },
        ],
      },
      {
        id: 'pandas',
        title: 'Pandas: Cleaning &amp; Structuring Data',
        source: 'Session 3',
        sections: [
          {
            heading: 'Series and DataFrame',
            body: `<p>A <code>Series</code> is a labeled 1-D array; a <code>DataFrame</code> is a table of
            Series sharing an index — think of it as a spreadsheet with fast, vectorized
            operations layered on top of NumPy.</p>`,
          },
          {
            heading: 'The cleaning workflow',
            body: `<ul>
              <li>Inspect: <code>df.info()</code>, <code>df.describe()</code>, <code>df.head()</code>.</li>
              <li>Handle missing values: <code>df.dropna()</code> or <code>df.fillna(value)</code>.</li>
              <li>Fix types: <code>pd.to_datetime</code>, <code>astype</code>.</li>
              <li>Filter &amp; select: boolean masks (<code>df[df.age &gt; 30]</code>), <code>.loc</code> / <code>.iloc</code>.</li>
            </ul>`,
          },
          {
            heading: 'Why this matters for ML',
            body: `<p>Most of the effort in a real ML project is spent here, not on the model itself.
            A model trained on unfiltered, mistyped, or leaky data will confidently produce
            wrong answers — "garbage in, garbage out."</p>`,
          },
        ],
      },
      {
        id: 'data-viz',
        title: 'Data Visualization',
        source: 'Session 4',
        sections: [
          {
            heading: 'matplotlib fundamentals',
            body: `<p>Every plot has a <code>Figure</code> (the canvas) and one or more <code>Axes</code>
            (the actual plot area). Line, bar, scatter, and histogram plots cover most
            exploratory needs.</p>`,
          },
          {
            heading: 'seaborn for statistical plots',
            body: `<p>Built on matplotlib, seaborn adds high-level plots for distributions
            (<code>histplot</code>, <code>kdeplot</code>) and relationships (<code>scatterplot</code>,
            <code>heatmap</code> for correlation matrices) with sensible defaults.</p>`,
          },
          {
            heading: 'Visualize before you model',
            body: `<p>Exploratory Data Analysis (EDA) — plotting distributions and relationships
            before fitting anything — catches outliers, skew, and correlated features that
            would otherwise silently break assumptions a model depends on.</p>`,
          },
        ],
      },
    ],
  },
  {
    group: 'Machine Learning',
    lessons: [
      {
        id: 'supervised-learning',
        title: 'Supervised Learning',
        source: 'Session 5',
        demo: 'linear_regression',
        sections: [
          {
            heading: 'Learning from labeled data',
            body: `<p>In supervised learning, each training example has a known answer (a
            <em>label</em>). The model learns a function mapping inputs to outputs, then is
            evaluated on how well it predicts labels it hasn't seen. Two flavors:</p>
            <ul>
              <li><strong>Regression</strong> — predict a continuous number (price, temperature).</li>
              <li><strong>Classification</strong> — predict a category (spam / not spam).</li>
            </ul>`,
          },
          {
            heading: 'Linear regression, concretely',
            body: `<p>Linear regression fits a line <code>y = slope&middot;x + intercept</code> that
            minimizes the mean squared error (MSE) between predictions and actual values.
            With one input variable, the best-fit slope and intercept have a closed-form
            solution (ordinary least squares) — no iterative search needed.</p>`,
          },
          {
            heading: 'Try it — powered by a Python engine',
            body: `<p>The panel below sends your data to a small Python script
            (<code>python/linear_regression.py</code>) that computes the least-squares fit
            and returns the slope, intercept, and mean squared error as JSON, which is then
            charted here in the browser.</p>`,
          },
        ],
      },
      {
        id: 'model-evaluation',
        title: 'Model Evaluation',
        source: 'Session 6',
        sections: [
          {
            heading: 'Overfitting vs. underfitting',
            body: `<p>A model that memorizes training data but fails on new data is
            <strong>overfit</strong>; one too simple to capture real patterns is
            <strong>underfit</strong>. This is why models are evaluated on a held-out
            <strong>test set</strong> (or via cross-validation), never on the data they trained on.</p>`,
          },
          {
            heading: 'Classification metrics',
            body: `<p>The confusion matrix (true/false positives and negatives) underlies the
            common metrics:</p>
            <ul>
              <li><strong>Accuracy</strong> — fraction of correct predictions overall.</li>
              <li><strong>Precision</strong> — of predicted positives, how many were correct.</li>
              <li><strong>Recall</strong> — of actual positives, how many were caught.</li>
              <li><strong>F1</strong> — harmonic mean of precision and recall.</li>
            </ul>`,
          },
          {
            heading: 'Regression metrics',
            body: `<p><strong>MSE</strong> (mean squared error) and its square root <strong>RMSE</strong>
            penalize large errors heavily; <strong>R&sup2;</strong> reports the fraction of variance
            in the target explained by the model, where 1.0 is a perfect fit.</p>`,
          },
        ],
      },
      {
        id: 'feature-engineering',
        title: 'Feature Engineering &amp; Ensemble Learning',
        source: 'Session 8',
        sections: [
          {
            heading: 'Turning raw data into signal',
            body: `<p>Feature engineering transforms raw columns into inputs a model can use
            effectively: scaling numeric ranges, encoding categories as numbers (one-hot
            encoding), binning continuous values, and creating interaction terms.</p>`,
          },
          {
            heading: 'Complexity and overfitting',
            body: `<p>Adding more engineered features can improve fit but also raises overfitting
            risk — the same underfit/overfit trade-off from model evaluation applies to how
            much feature complexity a model can support.</p>`,
          },
          {
            heading: 'Ensemble learning',
            body: `<p>Instead of one model, ensembles combine many:</p>
            <ul>
              <li><strong>Bagging</strong> (e.g. Random Forest) — trains many models on random
              subsets and averages their predictions to reduce variance.</li>
              <li><strong>Boosting</strong> (e.g. Gradient Boosting) — trains models sequentially,
              each correcting the previous one's errors, to reduce bias.</li>
            </ul>`,
          },
        ],
      },
      {
        id: 'unsupervised-learning',
        title: 'Unsupervised Learning',
        source: 'Session 11',
        demo: 'kmeans',
        sections: [
          {
            heading: 'Finding structure without labels',
            body: `<p>Unsupervised learning works on unlabeled data, looking for structure —
            groups of similar points (clustering) or lower-dimensional representations
            (dimensionality reduction) — rather than predicting a known answer.</p>`,
          },
          {
            heading: 'k-means clustering',
            body: `<p>k-means partitions points into <em>k</em> clusters by repeating two steps
            until stable:</p>
            <ol>
              <li>Assign every point to its nearest centroid.</li>
              <li>Move each centroid to the average position of its assigned points.</li>
            </ol>
            <p>Choosing <em>k</em> is often done with the "elbow method" — plotting within-cluster
            error against k and picking the point where gains diminish.</p>`,
          },
          {
            heading: 'Try it — powered by a Python engine',
            body: `<p>The panel below sends 2-D points to a Python script
            (<code>python/kmeans.py</code>) implementing Lloyd's k-means algorithm, and plots
            the resulting clusters and centroids.</p>`,
          },
        ],
      },
      {
        id: 'time-series',
        title: 'Time Series Analysis',
        source: 'Session 12',
        sections: [
          {
            heading: 'Why time series is different',
            body: `<p>In time series data, order matters and observations are usually not
            independent — today's value is correlated with yesterday's. Standard random
            train/test splits can leak future information, so splits are typically done
            chronologically instead.</p>`,
          },
          {
            heading: 'Handling time series data',
            body: `<p>Typical steps: parse timestamps into a proper datetime index, resample to
            a consistent frequency (daily, monthly), and handle missing values without
            breaking the time order (e.g. forward-fill rather than dropping rows).</p>`,
          },
          {
            heading: 'Trend, seasonality, and lag features',
            body: `<p>Most series decompose into a long-term <strong>trend</strong>, a repeating
            <strong>seasonal</strong> pattern, and noise. A common forecasting trick is creating
            "lag" features — yesterday's value as a column — so a standard regression model
            can be reused for time series prediction.</p>`,
          },
        ],
      },
    ],
  },
  {
    group: 'Data Engineering',
    lessons: [
      {
        id: 'sql-databases',
        title: 'SQL &amp; Databases',
        source: 'Session 10',
        sections: [
          {
            heading: 'Why ML practitioners need SQL',
            body: `<p>Real-world training data usually lives in a relational database, not a CSV
            on disk. Being able to pull and pre-aggregate exactly the rows and columns you
            need with SQL saves both time and memory compared to loading everything and
            filtering in pandas.</p>`,
          },
          {
            heading: 'Core concepts',
            body: `<p>A relational database (RDBMS) stores data in <strong>tables</strong> linked by
            keys. Normalizing data across related tables (e.g. <code>customers</code> and
            <code>orders</code>) avoids duplicated, inconsistent data.</p>`,
          },
          {
            heading: 'Basic SQL',
            body: `<pre><code>SELECT customer_id, SUM(amount) AS total_spent
FROM orders
WHERE order_date >= '2026-01-01'
GROUP BY customer_id
ORDER BY total_spent DESC;</code></pre>`,
          },
        ],
      },
    ],
  },
];

const LESSON_INDEX = {};
for (const group of CURRICULUM) {
  for (const lesson of group.lessons) {
    LESSON_INDEX[lesson.id] = lesson;
  }
}
