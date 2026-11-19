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
      {
        heading: 'Worked example: cleaning a batch of readings',
        body: `<p>Say a sensor reports <code>[21.4, None, 22.1, None, 20.9]</code> — two dropped readings
        mixed in with real ones. The fix is exactly the pattern from the coding challenge below: filter out
        <code>None</code> first with a list comprehension, then average what's left:</p>
        <pre>readings = [21.4, None, 22.1, None, 20.9]
valid = [r for r in readings if r is not None]   # [21.4, 22.1, 20.9]
average = sum(valid) / len(valid)                # 21.466...</pre>
        <p>This three-line pattern — filter, then aggregate — reappears constantly once you get to pandas,
        just spelled <code>df.dropna().mean()</code> instead.</p>`,
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
      {
        heading: 'Worked example: standardizing by hand',
        body: `<p>Take <code>[10, 20, 30, 40, 50]</code>. The mean is 30, and the standard deviation works
        out to about 14.14. Standardizing subtracts the mean and divides by that spread, element-wise:</p>
        <pre>arr = np.array([10, 20, 30, 40, 50])
z = (arr - arr.mean()) / arr.std()
# [-1.414, -0.707, 0.0, 0.707, 1.414]</pre>
        <p>Notice the result is symmetric around 0 — that's the point of standardizing: every feature ends
        up on the same scale, centered at 0, regardless of its original units. This is exactly what the
        coding challenge below asks you to implement.</p>`,
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
      {
        heading: 'Worked example: group-by in one line',
        body: `<p>Given a DataFrame of orders with <code>category</code> and <code>price</code> columns,
        the average price per category is a single call:</p>
        <pre>df.groupby("category")["price"].mean()
# category
# A    15.0
# B     5.0</pre>
        <p>Under the hood, <code>groupby</code> splits the rows into groups by the key column, applies
        <code>.mean()</code> to each group separately, then stitches the results back into one Series —
        the "split-apply-combine" pattern that also underlies the pandas group-by coding challenge below.</p>`,
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
      {
        heading: 'Reading a box plot',
        body: `<p>A box plot draws the median as a line inside a box spanning the 25th–75th percentile
        (the "interquartile range"), with whiskers extending to the most extreme non-outlier points and
        individual dots for anything beyond that. Seeing several dots far above the whiskers on a
        "transaction amount" box plot is often the very first hint that fraud or data-entry errors exist in
        a dataset — before a single model has been trained.</p>`,
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
      {
        heading: 'Worked example: mean vs. median under an outlier',
        body: `<p>Five houses sell for $200k, $210k, $205k, $195k, and one mansion at $2,000,000. The mean
        price is $562,000 — higher than every ordinary house on the street. The median is $205,000, which
        actually reflects a typical sale. This is exactly why median household income, not mean, is the
        standard reporting figure: a handful of extreme values can drag the mean far from what "typical"
        looks like.</p>`,
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
      {
        heading: 'Worked example: a linear model as a dot product',
        body: `<p>A house-price model with weights <code>[150, 10000]</code> for [square feet, bedrooms]
        and bias 20,000 predicts a 1,200 sq ft, 3-bedroom house as:</p>
        <pre>[150, 10000] &middot; [1200, 3] + 20000
= (150&times;1200 + 10000&times;3) + 20000
= (180000 + 30000) + 20000 = 230000</pre>
        <p>That dot-product-plus-bias is the entire computation behind linear regression, logistic
        regression, and a single layer of a neural network — only the number of features and what happens
        to the result afterward changes.</p>`,
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
      {
        heading: 'Worked example: three steps by hand',
        body: `<p>Minimizing f(x) = (x - 3)&sup2; from x&#8320; = 0 with learning rate 0.1 — gradient is
        2(x - 3):</p>
        <pre>step 1: grad = 2(0 - 3) = -6      x = 0 - 0.1&times;(-6) = 0.6
step 2: grad = 2(0.6 - 3) = -4.8  x = 0.6 - 0.1&times;(-4.8) = 1.08
step 3: grad = 2(1.08 - 3) = -3.84  x = 1.08 - 0.1&times;(-3.84) = 1.464</pre>
        <p>Each step covers a smaller distance as x approaches 3, because the gradient itself shrinks near
        the minimum — this is exactly the behavior you'll see printed out when you run the coding challenge
        below for 100 steps instead of 3.</p>`,
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
      {
        heading: 'Worked example: a two-minute EDA pass',
        body: `<p>Given a customer dataset: <code>df.shape</code> shows 10,000 rows &times; 12 columns.
        <code>df.isna().sum()</code> shows the "income" column is missing 8% of values — worth an
        imputation strategy, not dropping 800 rows. <code>df["income"].hist()</code> shows a long right
        tail — a candidate for a log transform. <code>df.corr()["churned"]</code> shows "days_since_login"
        is the strongest single predictor of churn — the first feature worth engineering further. Four
        quick calls, and the rest of the project already has direction.</p>`,
      },
    ],
  },
];
