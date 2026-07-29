import type { MlLesson } from './types';

export const REGRESSION_LESSONS: MlLesson[] = [
  {
    id: 'supervised-learning',
    title: 'Supervised Learning &amp; Linear Regression',
    source: 'Session 5',
    unit: 'regression',
    demo: 'linear-regression',
    sections: [
      {
        heading: 'Learning from labeled data',
        body: `<p>In supervised learning, each training example has a known answer (a label). The model
        learns a function mapping inputs to outputs, then is evaluated on how well it predicts labels it
        hasn't seen. Two flavors: <strong>regression</strong> predicts a continuous number,
        <strong>classification</strong> predicts a category.</p>`,
      },
      {
        heading: 'Linear regression, concretely',
        body: `<p>Linear regression fits a line y = slope&middot;x + intercept that minimizes the mean
        squared error (MSE) between predictions and actual values. With one input variable, the best-fit
        slope and intercept have a closed-form solution (ordinary least squares) — no iterative search
        needed. With many input variables, the same idea generalizes to <strong>multiple regression</strong>:
        y = w&#8321;x&#8321; + w&#8322;x&#8322; + ... + b.</p>`,
      },
      {
        heading: 'Try it below',
        body: `<p>The panel below runs ordinary least squares on your data entirely in your browser (pure
        TypeScript, no server) and charts the fit against the data.</p>`,
      },
      {
        heading: 'Worked example: the least-squares formula',
        body: `<p>For points (1,2), (2,4), (3,5), (4,9), the closed-form slope is
        &Sigma;(x-x&#772;)(y-y&#772;) / &Sigma;(x-x&#772;)&sup2;. With x&#772;=2.5 and y&#772;=5, the
        numerator is (-1.5)(-3)+(-0.5)(-1)+(0.5)(0)+(1.5)(4) = 4.5+0.5+0+6 = 11, and the denominator is
        2.25+0.25+0.25+2.25 = 5. Slope &asymp; 2.2, intercept = y&#772; - slope&middot;x&#772; &asymp; -0.5 —
        the exact formula the "Try it" demo above and the linear-regression coding challenge both implement.</p>`,
      },
    ],
  },
  {
    id: 'polynomial-regression',
    title: 'Polynomial Regression &amp; Overfitting',
    source: 'Session 5',
    unit: 'regression',
    challengeTaskId: 'ml-reg-01',
    sections: [
      {
        heading: 'When a line isn\'t enough',
        body: `<p>Many real relationships curve. Polynomial regression fits y = w&#8321;x + w&#8322;x&sup2; +
        w&#8323;x&sup3; + ... + b — which is still, mathematically, a <em>linear</em> model, just one fit on
        engineered polynomial features instead of the raw x. This is exactly the polynomial feature
        expansion from the previous unit.</p>`,
      },
      {
        heading: 'The overfitting trap',
        body: `<p>A high-enough degree polynomial can pass through every single training point exactly —
        achieving zero training error while wiggling wildly between points and predicting nonsense on new
        data. This is the textbook picture of overfitting: excellent training performance, poor
        generalization.</p>`,
      },
      {
        heading: 'Choosing the degree',
        body: `<p>The right polynomial degree is a model-complexity choice, tuned the same way any
        hyperparameter is: try a few degrees, evaluate each on a held-out validation set (never the
        training set), and pick the one that generalizes best — not the one that fits training data best.</p>`,
      },
      {
        heading: 'Worked example: expanding one feature into four',
        body: `<p>A single feature x = 3 with degree-3 polynomial regression expands to the feature vector
        [1, 3, 9, 27] (powers 0 through 3) — exactly the output of the <code>polynomial_features</code>
        function from Unit 2's coding challenge. The model then just runs ordinary linear regression on
        these four columns instead of one, which is why a "polynomial model" is really a linear model in
        disguise, fit on nonlinear features.</p>`,
      },
    ],
  },
  {
    id: 'regularization',
    title: 'Regularization: Ridge &amp; Lasso',
    source: 'Session 5',
    unit: 'regression',
    challengeTaskId: 'ml-reg-02',
    sections: [
      {
        heading: 'Penalizing complexity directly',
        body: `<p>Instead of hoping a model doesn't overfit, <strong>regularization</strong> adds a penalty
        term to the loss function that discourages large weights. A model with smaller, more conservative
        weights generalizes better — it's less able to swing wildly to fit noise in the training data.</p>`,
      },
      {
        heading: 'Ridge (L2) vs. Lasso (L1)',
        body: `<ul>
          <li><strong>Ridge regression</strong> adds &lambda;&middot;&Sigma;w&sup2; to the loss — shrinks all weights
          toward zero, but rarely to exactly zero.</li>
          <li><strong>Lasso regression</strong> adds &lambda;&middot;&Sigma;|w| to the loss — can shrink weights all the
          way to exactly zero, effectively performing feature selection.</li>
        </ul>`,
      },
      {
        heading: 'The regularization strength &lambda;',
        body: `<p>&lambda; (sometimes called alpha) controls how strongly the penalty is applied. &lambda;=0
        recovers ordinary linear regression; very large &lambda; shrinks every weight toward zero,
        underfitting. Like the polynomial degree, the right &lambda; is chosen via validation, not guessed.</p>`,
      },
      {
        heading: 'Worked example: the penalty in numbers',
        body: `<p>With weights [4, -3] and &lambda;=0.1: the ridge penalty is 0.1&times;(16+9)=2.5, added
        directly to the MSE. The lasso penalty is 0.1&times;(4+3)=0.7. If MSE alone is 1.0, ridge pushes the
        total loss to 3.5 — a strong incentive to shrink those weights on the next gradient step. This is
        exactly the calculation in the regularized-loss coding challenge below.</p>`,
      },
    ],
  },
  {
    id: 'gradient-descent-from-scratch',
    title: 'Fitting Linear Regression with Gradient Descent',
    source: 'Extension',
    unit: 'regression',
    challengeTaskId: 'ml-reg-03',
    sections: [
      {
        heading: 'Beyond the closed-form solution',
        body: `<p>Ordinary least squares has an exact formula for the best slope and intercept — but most
        models (regularized regression, logistic regression, neural networks) don't have one. Instead,
        they're trained with gradient descent: start with random weights, and repeatedly nudge them in the
        direction that reduces error.</p>`,
      },
      {
        heading: 'The update rule for linear regression',
        body: `<p>For y = wx + b, the mean squared error's gradients work out to simple averages over the
        training set: the gradient with respect to w involves the average of -2x(y - &#375;), and with
        respect to b, the average of -2(y - &#375;). Each step: w -= lr &middot; grad_w, b -= lr &middot; grad_b.</p>`,
      },
      {
        heading: 'Same idea, every model',
        body: `<p>This exact loop — predict, measure error, compute gradients, update weights, repeat — is
        how virtually every model in this course past linear regression gets trained, right up through deep
        neural networks. Understanding it here pays off for the rest of the curriculum.</p>`,
      },
      {
        heading: 'Worked example: batch vs. one example',
        body: `<p>The coding challenge below uses <strong>batch</strong> gradient descent — averaging the
        gradient over every training point before each update, which is stable but requires a full pass
        through the data per step. Two common variants: <strong>stochastic</strong> gradient descent updates
        after every single example (noisy but fast to start moving), and <strong>mini-batch</strong> (used
        by virtually all real deep learning training) splits the difference, averaging over small batches
        of 32–256 examples at a time.</p>`,
      },
    ],
  },
  {
    id: 'logistic-regression',
    title: 'Logistic Regression',
    source: 'Session 5',
    unit: 'regression',
    challengeTaskId: 'ml-reg-04',
    sections: [
      {
        heading: 'Regression for classification',
        body: `<p>Despite the name, logistic regression is a <strong>classification</strong> algorithm. It
        takes the linear regression output wx + b and squashes it through the <strong>sigmoid
        function</strong> &sigma;(z) = 1 / (1 + e&#8315;&#7488;), which maps any real number into (0, 1) — a
        probability.</p>`,
      },
      {
        heading: 'From probability to decision',
        body: `<p>The model outputs a probability that the example belongs to the positive class. A
        threshold (commonly 0.5) turns that probability into a hard 0/1 prediction — though for imbalanced
        problems, that threshold is itself a tunable choice, not a law of nature.</p>`,
      },
      {
        heading: 'Why not just use linear regression?',
        body: `<p>Linear regression's output is unbounded and treats a prediction of 1.8 as "more positive"
        than 1.2, which makes no sense for a 0/1 label. The sigmoid keeps outputs bounded in a valid
        probability range and makes the loss function (log loss, not MSE) properly penalize confident wrong
        answers.</p>`,
      },
      {
        heading: 'Worked example: sigmoid in action',
        body: `<p>A spam classifier computes wx + b = 2.0 for one email. &sigma;(2.0) = 1/(1+e&#8315;&sup2;)
        &asymp; 0.881 — an 88.1% predicted probability of spam, comfortably over the 0.5 threshold. For a
        borderline email with wx + b = 0.1, &sigma;(0.1) &asymp; 0.525 — barely over the threshold, and a
        case where looking at the raw probability (not just the final 0/1 label) matters for deciding how
        much to trust the prediction.</p>`,
      },
    ],
  },
  {
    id: 'regression-metrics',
    title: 'Evaluating Regression Models',
    source: 'Session 6',
    unit: 'regression',
    challengeTaskId: 'ml-reg-05',
    sections: [
      {
        heading: 'MSE and RMSE',
        body: `<p><strong>Mean Squared Error</strong> averages the squared difference between predictions
        and actual values — squaring makes large errors count disproportionately more. <strong>RMSE</strong>
        (its square root) puts the error back in the same units as the target, making it easier to
        interpret ("off by $3,200 on average" instead of "off by 10,240,000 dollars-squared").</p>`,
      },
      {
        heading: 'Mean Absolute Error',
        body: `<p><strong>MAE</strong> averages the absolute (not squared) difference. Unlike MSE/RMSE, it
        doesn't disproportionately punish large errors — useful when outliers shouldn't dominate the
        evaluation.</p>`,
      },
      {
        heading: 'R&sup2;: how much variance is explained',
        body: `<p>R&sup2; reports the fraction of variance in the target explained by the model, where 1.0
        is a perfect fit and 0.0 means the model does no better than always predicting the mean. It's the
        most common single-number summary of "how good is this regression model," though it should always
        be read alongside RMSE for an interpretable error scale.</p>`,
      },
      {
        heading: 'Worked example: same errors, three metrics',
        body: `<p>Predicting [1, 2, 3] as [2, 3, 4] — every prediction is off by exactly 1. MSE = 1.0
        (average of 1&sup2;, 1&sup2;, 1&sup2;), RMSE = 1.0, MAE = 1.0. Now predict [1, 2, 3] as [1, 2, 6] —
        two perfect predictions and one wildly wrong one. MAE stays a moderate 1.0, but MSE jumps to 3.0
        because squaring the single large error (3&sup2;=9) dominates the average. This is exactly why MSE
        is more outlier-sensitive than MAE, as the coding challenge's test cases show directly.</p>`,
      },
    ],
  },
];
