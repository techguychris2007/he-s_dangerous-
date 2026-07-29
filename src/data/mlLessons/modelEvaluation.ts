import type { MlLesson } from './types';

export const MODEL_EVALUATION_LESSONS: MlLesson[] = [
  {
    id: 'model-evaluation',
    title: 'Model Evaluation: Why It Matters',
    source: 'Session 6',
    unit: 'model-evaluation',
    sections: [
      {
        heading: 'Overfitting vs. underfitting',
        body: `<p>A model that memorizes training data but fails on new data is <strong>overfit</strong>;
        one too simple to capture real patterns is <strong>underfit</strong>. This is why models are
        evaluated on a held-out test set, never on the data they trained on.</p>`,
      },
      {
        heading: 'No single metric tells the whole story',
        body: `<p>A model can have 99% accuracy and still be useless — if 99% of examples belong to one
        class, a model that always predicts that class scores 99% while catching zero of the cases that
        actually matter. The rest of this unit is about the metrics that catch what accuracy alone misses.</p>`,
      },
      {
        heading: 'Evaluation is a workflow, not a step',
        body: `<p>In a real project, evaluation happens continuously: during development to compare
        candidate models and hyperparameters, and after deployment to catch performance drift as real-world
        data shifts away from what the model was trained on.</p>`,
      },
      {
        heading: 'Worked example: the 99% accuracy trap',
        body: `<p>A fraud dataset has 990 legitimate transactions and 10 fraudulent ones. A model that
        predicts "legitimate" for every single transaction scores 990/1000 = 99% accuracy — while catching
        exactly zero fraud cases, the entire point of building it. This single example is why every lesson
        in the rest of this unit exists: accuracy alone cannot tell this model apart from a genuinely good one.</p>`,
      },
    ],
  },
  {
    id: 'confusion-matrix',
    title: 'Confusion Matrix, Precision &amp; Recall',
    source: 'Session 6',
    unit: 'model-evaluation',
    challengeTaskId: 'ml-eval-01',
    sections: [
      {
        heading: 'The confusion matrix',
        body: `<p>For binary classification, every prediction falls into one of four buckets: <strong>True
        Positive</strong> (predicted positive, actually positive), <strong>True Negative</strong>, <strong>False
        Positive</strong> (predicted positive, actually negative — a false alarm), and <strong>False
        Negative</strong> (predicted negative, actually positive — a miss).</p>`,
      },
      {
        heading: 'Precision and recall',
        body: `<ul>
          <li><strong>Precision</strong> = TP / (TP + FP) — of everything the model flagged positive, how much was
          actually positive? High precision means few false alarms.</li>
          <li><strong>Recall</strong> = TP / (TP + FN) — of everything actually positive, how much did the model
          catch? High recall means few misses.</li>
        </ul>`,
      },
      {
        heading: 'F1 score: balancing both',
        body: `<p>Precision and recall trade off against each other — a model that flags everything as
        positive gets perfect recall but terrible precision. The <strong>F1 score</strong>, their harmonic
        mean (2&middot;precision&middot;recall / (precision + recall)), penalizes models that sacrifice one
        entirely for the other.</p>`,
      },
      {
        heading: 'Worked example: from confusion matrix to F1',
        body: `<p>A model makes 100 predictions on a positive class with 20 true cases: 15 true positives, 5
        false negatives, 10 false positives, 70 true negatives. Precision = 15/(15+10) = 0.6. Recall =
        15/(15+5) = 0.75. F1 = 2&times;0.6&times;0.75/(0.6+0.75) &asymp; 0.667 — noticeably below either
        individual number, exactly because F1 punishes the gap between precision and recall rather than
        just averaging them. This is the same three-number output the coding challenge below computes.</p>`,
      },
    ],
  },
  {
    id: 'roc-auc',
    title: 'ROC Curves &amp; AUC',
    source: 'Session 6',
    unit: 'model-evaluation',
    challengeTaskId: 'ml-eval-02',
    sections: [
      {
        heading: 'Beyond a single threshold',
        body: `<p>Precision, recall, and F1 are all computed at one classification threshold (usually 0.5).
        But a model outputs probabilities — moving the threshold trades recall for precision. The
        <strong>ROC curve</strong> plots this tradeoff across every possible threshold at once.</p>`,
      },
      {
        heading: 'True Positive Rate vs. False Positive Rate',
        body: `<p>The ROC curve plots True Positive Rate (= recall) on the y-axis against False Positive
        Rate (FP / (FP + TN)) on the x-axis, as the threshold sweeps from 1 down to 0. A random classifier
        traces the diagonal; a perfect one hugs the top-left corner.</p>`,
      },
      {
        heading: 'AUC: one number for the whole curve',
        body: `<p><strong>AUC</strong> (Area Under the Curve) summarizes the ROC curve into a single score
        from 0.5 (no better than random) to 1.0 (perfect separation). It has a clean interpretation: the
        probability that a randomly chosen positive example scores higher than a randomly chosen negative
        one — which makes it threshold-independent, unlike accuracy or F1.</p>`,
      },
      {
        heading: 'Worked example: sweeping the threshold',
        body: `<p>With true labels [1,1,0,0] and scores [0.9,0.4,0.6,0.1]: at threshold 0.0, everything is
        predicted positive — TPR=1.0, FPR=1.0 (top-right corner of the ROC curve). At threshold 1.1, nothing
        is predicted positive — TPR=0.0, FPR=0.0 (bottom-left corner). At threshold 0.5, only the 0.9 and
        0.6 scores clear the bar — TPR=0.5, FPR=0.5. Plotting these three (FPR, TPR) points and connecting
        them traces the actual ROC curve — exactly what the coding challenge below computes one threshold at a time.</p>`,
      },
    ],
  },
  {
    id: 'cross-validation',
    title: 'Cross-Validation &amp; Hyperparameter Tuning',
    source: 'Extension',
    unit: 'model-evaluation',
    challengeTaskId: 'ml-eval-03',
    sections: [
      {
        heading: 'One test set isn\'t always enough',
        body: `<p>A single train/test split gives one performance estimate — which could be lucky or
        unlucky depending on which examples happened to land in the test set, especially with smaller
        datasets. <strong>k-fold cross-validation</strong> gives a more reliable estimate by testing on
        every part of the data exactly once.</p>`,
      },
      {
        heading: 'How k-fold works',
        body: `<ol>
          <li>Split the data into k equal folds.</li>
          <li>For each fold: train on the other k-1 folds, evaluate on this one.</li>
          <li>Average the k resulting scores into a single, more stable estimate.</li>
        </ol>`,
      },
      {
        heading: 'Tuning hyperparameters honestly',
        body: `<p>Cross-validation is also how hyperparameters (k in k-NN, &lambda; in ridge regression, tree
        depth) get chosen without touching the final test set: try each candidate value, cross-validate
        each one, and pick whichever scores best — the test set stays reserved for one final, honest check
        at the very end.</p>`,
      },
      {
        heading: 'Worked example: 5-fold assignment',
        body: `<p>With 10 examples (indices 0-9) and k=5, round-robin assignment gives fold 0 = [0,5],
        fold 1 = [1,6], fold 2 = [2,7], fold 3 = [3,8], fold 4 = [4,9] — two examples each. Round 1 trains
        on folds 1-4 (8 examples) and tests on fold 0; round 2 trains on folds 0,2,3,4 and tests on fold 1;
        and so on for all 5 rounds. Averaging the 5 resulting scores is more reliable than any single
        80/20 split, since every example gets used for testing exactly once. This is exactly what the
        make_folds coding challenge below builds.</p>`,
      },
    ],
  },
  {
    id: 'imbalanced-data',
    title: 'Handling Imbalanced Data',
    source: 'Extension',
    unit: 'model-evaluation',
    challengeTaskId: 'ml-eval-04',
    sections: [
      {
        heading: 'When one class dominates',
        body: `<p>Fraud detection, disease screening, and rare-event prediction all share a pattern: the
        class you actually care about is rare. A model can achieve high accuracy by essentially ignoring
        it, which is exactly why accuracy alone is misleading on imbalanced data.</p>`,
      },
      {
        heading: 'Metric choices for imbalance',
        body: `<p>Precision, recall, F1, and AUC (all threshold-aware or class-aware) tell a far more honest
        story than accuracy here. Which of precision or recall to prioritize depends on the cost of each
        error type — missing a fraud case is usually far more costly than a false alarm, so recall often
        matters more.</p>`,
      },
      {
        heading: 'Resampling strategies',
        body: `<p><strong>Oversampling</strong> the minority class (duplicating or synthetically generating
        more examples, e.g. SMOTE) and <strong>undersampling</strong> the majority class are both ways to
        rebalance the training data itself, so the model doesn't learn to just ignore the rare class during
        training.</p>`,
      },
      {
        heading: 'Worked example: rebalancing by the numbers',
        body: `<p>A dataset with 8 "majority" and 2 "minority" examples is 80/20 imbalanced. Oversampling
        duplicates minority examples (sampled with replacement) 6 more times to reach 8-and-8 — a balanced
        50/50 training set the model can no longer trivially ignore the minority class on. Undersampling
        would instead drop 6 of the 8 majority examples to reach 2-and-2 — balanced, but throwing away 75%
        of the majority data in the process. This tradeoff is exactly why oversampling is more common when
        data is already scarce, which is what the coding challenge below implements.</p>`,
      },
    ],
  },
];
