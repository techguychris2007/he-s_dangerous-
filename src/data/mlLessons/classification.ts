import type { MlLesson } from './types';

export const CLASSIFICATION_LESSONS: MlLesson[] = [
  {
    id: 'knn',
    title: 'k-Nearest Neighbors',
    source: 'Session 5',
    unit: 'classification',
    challengeTaskId: 'ml-clf-01',
    sections: [
      {
        heading: 'The simplest classifier that works',
        body: `<p>k-NN makes no assumptions and does no real "training" — it just remembers every training
        point. To classify a new point, it finds the k closest training points (by distance) and predicts
        whichever class is most common among them.</p>`,
      },
      {
        heading: 'Choosing k',
        body: `<p>Small k (like k=1) makes predictions very sensitive to individual noisy points — high
        variance. Large k smooths predictions out, potentially blurring real boundaries between classes —
        higher bias. k is a hyperparameter tuned via validation, exactly like polynomial degree or
        regularization strength.</p>`,
      },
      {
        heading: 'Why scaling matters here especially',
        body: `<p>Because k-NN's entire decision is based on distance, an unscaled feature with a huge
        numeric range will dominate the distance calculation regardless of its actual predictive value —
        this is the textbook case for why feature scaling (from Unit 2) exists.</p>`,
      },
    ],
  },
  {
    id: 'decision-trees',
    title: 'Decision Trees',
    source: 'Session 5',
    unit: 'classification',
    challengeTaskId: 'ml-clf-02',
    sections: [
      {
        heading: 'Learning a flowchart',
        body: `<p>A decision tree learns a sequence of yes/no questions on features ("is age &gt; 30?", "is
        income &gt; $50k?") that split the data into increasingly pure groups, ending in a prediction at
        each leaf. It's one of the few ML models whose decisions a human can read directly.</p>`,
      },
      {
        heading: 'Entropy: measuring impurity',
        body: `<p><strong>Entropy</strong> measures how mixed a group's classes are: 0 when a group is
        perfectly pure (all one class), highest when classes are evenly split. For a binary split with
        proportion p of one class: entropy = -p&middot;log&#8322;(p) - (1-p)&middot;log&#8322;(1-p).</p>`,
      },
      {
        heading: 'Information gain: choosing the best split',
        body: `<p>At each step, the tree considers every possible feature/threshold split and picks the one
        that reduces entropy the most — the <strong>information gain</strong>. Left unconstrained, trees
        keep splitting until every leaf is pure, which is a direct road to overfitting; limiting tree depth
        is the usual fix.</p>`,
      },
    ],
  },
  {
    id: 'random-forests',
    title: 'Random Forests &amp; Bagging',
    source: 'Session 8',
    unit: 'classification',
    challengeTaskId: 'ml-clf-03',
    sections: [
      {
        heading: 'Many weak trees beat one strong one',
        body: `<p>A single deep decision tree overfits easily. A <strong>random forest</strong> trains many
        trees — each on a random bootstrap sample of the data, and each considering only a random subset of
        features at every split — then averages (regression) or votes (classification) across all of them.</p>`,
      },
      {
        heading: 'Why bagging works',
        body: `<p><strong>Bagging</strong> (bootstrap aggregating) reduces variance: individual trees are
        noisy and overfit differently to their own random samples, but their errors are mostly uncorrelated,
        so averaging many of them cancels most of the noise out while keeping the low bias of deep trees.</p>`,
      },
      {
        heading: 'A genuinely strong default',
        body: `<p>Random forests need almost no feature scaling, handle nonlinear relationships and feature
        interactions natively, and resist overfitting far better than a single tree — which is why they're
        often the first "real" model tried on a new tabular dataset.</p>`,
      },
    ],
  },
  {
    id: 'svm',
    title: 'Support Vector Machines',
    source: 'Session 5',
    unit: 'classification',
    challengeTaskId: 'ml-clf-04',
    sections: [
      {
        heading: 'Maximizing the margin',
        body: `<p>Where logistic regression finds any line separating two classes, an SVM finds the line
        that maximizes the <strong>margin</strong> — the distance to the nearest points of each class (the
        "support vectors"). Intuitively, it picks the most confident possible boundary, not just any
        boundary that works.</p>`,
      },
      {
        heading: 'The kernel trick',
        body: `<p>Real classes are often not linearly separable. SVMs handle this with <strong>kernels</strong> —
        functions that implicitly map data into a higher-dimensional space where a straight-line separator
        does exist, without ever explicitly computing that expensive high-dimensional transformation. The
        RBF kernel is the most common default for nonlinear boundaries.</p>`,
      },
      {
        heading: 'The C hyperparameter',
        body: `<p>C controls the tradeoff between a wide margin and correctly classifying every training
        point. Small C tolerates more margin violations for a wider, more robust margin; large C tries hard
        to classify every training point correctly, risking overfitting to outliers.</p>`,
      },
    ],
  },
  {
    id: 'boosting',
    title: 'Boosting &amp; Gradient Boosting',
    source: 'Session 8',
    unit: 'classification',
    challengeTaskId: 'ml-clf-05',
    sections: [
      {
        heading: 'Learning from mistakes, sequentially',
        body: `<p>Where bagging trains many trees independently and averages them, <strong>boosting</strong>
        trains trees one at a time, each new tree focused specifically on the examples the previous trees
        got wrong. The trees aren't independent — each one is a correction to the ensemble so far.</p>`,
      },
      {
        heading: 'Why boosting works',
        body: `<p>Boosting reduces <strong>bias</strong>: it starts with a simple model (often high bias)
        and iteratively adds capacity exactly where it's needed, guided by the errors actually being made,
        rather than blindly adding complexity everywhere.</p>`,
      },
      {
        heading: 'Gradient boosting and XGBoost',
        body: `<p><strong>Gradient boosting</strong> generalizes this idea: each new tree is fit to the
        <em>gradient</em> of the loss function with respect to the current predictions — literally gradient
        descent, but taking "steps" in the space of trees instead of numeric weights. XGBoost and similar
        libraries are highly optimized implementations of this idea, and are consistently among the
        strongest performers on tabular data competitions.</p>`,
      },
    ],
  },
  {
    id: 'naive-bayes',
    title: 'Naive Bayes Classifier',
    source: 'Extension',
    unit: 'classification',
    challengeTaskId: 'ml-clf-06',
    sections: [
      {
        heading: 'A classifier built on one theorem',
        body: `<p>Naive Bayes applies Bayes' theorem directly: P(class | features) &prop; P(class) &times;
        P(features | class). It's called "naive" because it assumes every feature is independent of every
        other feature given the class — an assumption that's almost never exactly true, yet works
        surprisingly well in practice.</p>`,
      },
      {
        heading: 'Why it\'s still widely used',
        body: `<p>Naive Bayes is extremely fast to train (no iterative optimization — just counting), works
        well with high-dimensional sparse data, and is a classic strong baseline for text classification
        (spam filtering, sentiment) where "independent word probabilities" turns out to be a good enough
        approximation.</p>`,
      },
      {
        heading: 'A worked intuition',
        body: `<p>For spam detection: P(spam | contains "free", "winner") is estimated from how often "free"
        and "winner" appear in spam vs. non-spam training emails, multiplied together under the
        independence assumption, then combined with the overall base rate of spam.</p>`,
      },
    ],
  },
];
