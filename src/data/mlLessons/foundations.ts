import type { MlLesson } from './types';

export const FOUNDATIONS_LESSONS: MlLesson[] = [
  {
    id: 'python-basics',
    title: 'Python Basics',
    source: 'Pre-Lecture · Python 1 & 2',
    unit: 'foundations',
    challengeTaskId: 'ml-found-01',
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
      {
        heading: 'Why this matters before ML',
        body: `<p>Every ML technique you'll learn from here on is expressed as ordinary Python functions
        operating on lists, arrays, and dictionaries. There's no separate "ML syntax" to learn — just more
        powerful data structures (NumPy arrays, DataFrames) built on these same fundamentals.</p>`,
      },
    ],
  },
  {
    id: 'numpy',
    title: 'NumPy: Efficient Data Manipulation',
    source: 'Session 2',
    unit: 'foundations',
    challengeTaskId: 'ml-found-02',
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
      {
        heading: 'Example',
        body: `<pre>import numpy as np
a = np.array([1, 2, 3, 4])
b = a * 2 + 1        # vectorized: [3, 5, 7, 9]
print(a.mean(), a.std())</pre>`,
      },
    ],
  },
  {
    id: 'pandas',
    title: 'Pandas: Cleaning &amp; Structuring Data',
    source: 'Session 3',
    unit: 'foundations',
    challengeTaskId: 'ml-found-03',
    sections: [
      {
        heading: 'Series and DataFrame',
        body: `<p>A Series is a labeled 1-D array; a DataFrame is a table of Series sharing an index —
        a spreadsheet with fast, vectorized operations layered on top of NumPy.</p>`,
      },
      {
        heading: 'The cleaning workflow',
        body: `<ul>
          <li>Inspect: df.info(), df.describe(), df.head().</li>
          <li>Handle missing values: df.dropna() or df.fillna(value).</li>
          <li>Fix types: pd.to_datetime, astype.</li>
          <li>Filter &amp; select: boolean masks (df[df.age &gt; 30]), .loc / .iloc.</li>
        </ul>`,
      },
      {
        heading: 'Why cleaning matters for ML',
        body: `<p>Most of the effort in a real ML project is spent here, not on the model itself. A model
        trained on unfiltered, mistyped, or leaky data will confidently produce wrong answers — "garbage
        in, garbage out."</p>`,
      },
    ],
  },
  {
    id: 'data-viz',
    title: 'Data Visualization',
    source: 'Session 4',
    unit: 'foundations',
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
      {
        heading: 'Choosing the right chart',
        body: `<ul>
          <li><strong>Histogram / KDE</strong> — shape of a single numeric variable's distribution.</li>
          <li><strong>Scatter plot</strong> — relationship between two numeric variables.</li>
          <li><strong>Box plot</strong> — spread and outliers, often split by category.</li>
          <li><strong>Correlation heatmap</strong> — pairwise relationships across many numeric columns at once.</li>
        </ul>`,
      },
    ],
  },
  {
    id: 'stats-probability',
    title: 'Statistics &amp; Probability Basics',
    source: 'Extension',
    unit: 'foundations',
    challengeTaskId: 'ml-found-04',
    sections: [
      {
        heading: 'Why ML is built on statistics',
        body: `<p>Every model is, underneath, a statement about probability: "given these inputs, what's the
        most likely output?" Understanding mean, variance, and distributions isn't optional background —
        it's the language every ML concept from here on is written in.</p>`,
      },
      {
        heading: 'Describing a distribution',
        body: `<ul>
          <li><strong>Mean</strong> — the average; sensitive to outliers.</li>
          <li><strong>Median</strong> — the middle value; robust to outliers.</li>
          <li><strong>Variance &amp; standard deviation</strong> — how spread out the values are around the mean.</li>
          <li><strong>Skew</strong> — whether the distribution leans left or right of its center.</li>
        </ul>`,
      },
      {
        heading: 'Probability essentials',
        body: `<p>A <strong>probability distribution</strong> assigns a likelihood to every possible outcome.
        The <strong>normal (Gaussian) distribution</strong> — the familiar bell curve — shows up constantly
        because of the Central Limit Theorem: sums of many small independent effects tend toward it, which
        is why so many natural measurements (heights, errors, noise) are approximately normal.</p>`,
      },
      {
        heading: 'Correlation is not causation',
        body: `<p>Two variables can move together (correlation) without one causing the other — both might
        be driven by a third, hidden factor. This distinction matters enormously in ML: a model can learn
        a correlation that's real in the training data but meaningless (or actively misleading) once
        conditions change.</p>`,
      },
    ],
  },
  {
    id: 'linear-algebra',
    title: 'Linear Algebra for ML',
    source: 'Extension',
    unit: 'foundations',
    challengeTaskId: 'ml-found-05',
    sections: [
      {
        heading: 'Why linear algebra?',
        body: `<p>A row of data — every feature for one example — is a <strong>vector</strong>. A whole
        dataset is a <strong>matrix</strong>. Nearly every ML algorithm, from linear regression to neural
        networks, is expressed as operations on vectors and matrices, which is exactly why NumPy (built
        around these objects) is the foundation of the Python ML stack.</p>`,
      },
      {
        heading: 'Vectors and the dot product',
        body: `<p>The <strong>dot product</strong> of two vectors multiplies corresponding elements and sums
        the results: [1,2,3]&middot;[4,5,6] = 1&times;4 + 2&times;5 + 3&times;6 = 32. This single operation
        is how a linear model computes its prediction — multiply each feature by its weight and sum.</p>`,
      },
      {
        heading: 'Matrices as transformations',
        body: `<p>A matrix multiplying a vector transforms it — stretching, rotating, or projecting it into
        a new space. A whole layer of a neural network is just "multiply the input vector by a weight
        matrix, then add a bias vector."</p>`,
      },
      {
        heading: 'Norms: measuring vector size',
        body: `<p>The <strong>L2 norm</strong> (Euclidean length) is &radic;(x&sup1;&sup2; + x&sup2;&sup2; + ...) —
        the straight-line distance from the origin. It shows up everywhere: as the "distance" in k-NN and
        k-means, and as the penalty term in ridge regression.</p>`,
      },
    ],
  },
  {
    id: 'calculus-gradient-descent',
    title: 'Calculus &amp; Gradient Descent Intuition',
    source: 'Extension',
    unit: 'foundations',
    challengeTaskId: 'ml-found-06',
    sections: [
      {
        heading: 'The one calculus idea that matters most',
        body: `<p>A <strong>derivative</strong> tells you the slope of a function at a point — which
        direction it's increasing, and how steeply. Almost every model-training algorithm is, underneath,
        "compute the derivative of the error with respect to each parameter, then nudge the parameter in
        the direction that reduces error."</p>`,
      },
      {
        heading: 'Gradient descent, step by step',
        body: `<ol>
          <li>Start with random parameter values.</li>
          <li>Compute the error (loss) the model currently makes.</li>
          <li>Compute the gradient — the derivative of the loss with respect to each parameter.</li>
          <li>Move each parameter a small step opposite the gradient (downhill on the loss surface).</li>
          <li>Repeat until the loss stops improving.</li>
        </ol>`,
      },
      {
        heading: 'The learning rate',
        body: `<p>The step size in gradient descent is the <strong>learning rate</strong>. Too large, and
        training overshoots and diverges; too small, and training takes forever to converge. Tuning it is
        one of the most common practical decisions in training any model, from linear regression to deep
        neural networks.</p>`,
      },
    ],
  },
  {
    id: 'eda-workflow',
    title: 'The Exploratory Data Analysis Workflow',
    source: 'Extension',
    unit: 'foundations',
    challengeTaskId: 'ml-found-07',
    sections: [
      {
        heading: 'EDA is not optional',
        body: `<p>Before fitting any model, a practitioner spends real time just looking at the data:
        shapes, types, missing values, distributions, and relationships. Skipping this step is the single
        most common reason a "working" model turns out to be broken in production.</p>`,
      },
      {
        heading: 'A repeatable checklist',
        body: `<ol>
          <li><strong>Shape &amp; types</strong> — how many rows/columns, and what type is each column?</li>
          <li><strong>Missing values</strong> — which columns have gaps, and how many?</li>
          <li><strong>Distributions</strong> — histograms for numeric columns, value counts for categorical ones.</li>
          <li><strong>Relationships</strong> — scatter plots and correlations against the target variable.</li>
          <li><strong>Outliers &amp; anomalies</strong> — values that look like data-entry errors or edge cases.</li>
        </ol>`,
      },
      {
        heading: 'From EDA to feature engineering',
        body: `<p>Everything you find in EDA feeds directly into the next stage of the pipeline: a skewed
        distribution suggests a log transform, a column with many missing values needs an imputation
        strategy, and a strong nonlinear relationship hints that a raw linear model won't be enough.</p>`,
      },
    ],
  },
];
