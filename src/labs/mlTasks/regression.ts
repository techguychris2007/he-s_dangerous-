import type { CodeTask } from '../codeTypes';

export const ML_REGRESSION_TASKS: CodeTask[] = [
  {
    id: 'ml-reg-01',
    title: 'Evaluate a Polynomial Model',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Regression',
    prompt:
      'Write predict_polynomial(x, weights) where weights = [w0, w1, w2, ...] represents a fitted ' +
      'polynomial model. Return w0 + w1*x + w2*x**2 + ... — the prediction the model makes for input x.',
    starterCode:
      'def predict_polynomial(x, weights):\n' +
      '    # TODO: return w0 + w1*x + w2*x**2 + ... using the coefficients in weights\n' +
      '    pass\n',
    hints: [
      'weights[i] is the coefficient for x**i.',
      'enumerate(weights) gives you both the index (the power) and the coefficient together.',
      'sum(w * x ** i for i, w in enumerate(weights)) computes the whole polynomial in one line.',
    ],
    solution:
      'def predict_polynomial(x, weights):\n' +
      '    return sum(w * x ** i for i, w in enumerate(weights))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("linear (degree 1)", predict_polynomial(3, [1, 2]), 7)\n' +
      '__check__("quadratic", predict_polynomial(2, [1, 0, 1]), 5)\n' +
      '__check__("constant only", predict_polynomial(100, [5]), 5)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-reg-02',
    title: 'Ridge and Lasso Regularized Loss',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Regression',
    prompt:
      "Write regularized_loss(mse, weights, lam, kind) that returns mse plus a penalty term: for " +
      "kind='ridge', add lam * sum(w**2 for w in weights); for kind='lasso', add lam * sum(abs(w) for w " +
      'in weights). The bias/intercept is not included in weights — only penalize the feature weights.',
    starterCode:
      "def regularized_loss(mse, weights, lam, kind):\n" +
      '    # TODO: return mse + the ridge (L2) or lasso (L1) penalty, based on kind\n' +
      '    pass\n',
    hints: [
      "kind will always be exactly the string 'ridge' or 'lasso'.",
      'Ridge penalty: lam * sum(w ** 2 for w in weights).',
      'Lasso penalty: lam * sum(abs(w) for w in weights). Add whichever applies to mse and return it.',
    ],
    solution:
      'def regularized_loss(mse, weights, lam, kind):\n' +
      "    if kind == 'ridge':\n" +
      '        penalty = lam * sum(w ** 2 for w in weights)\n' +
      '    else:\n' +
      '        penalty = lam * sum(abs(w) for w in weights)\n' +
      '    return mse + penalty\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('ridge basic', regularized_loss(1.0, [2, 3], 0.1, 'ridge'), 1.0 + 0.1 * (4 + 9))\n" +
      "__check__('lasso basic', regularized_loss(1.0, [2, -3], 0.1, 'lasso'), 1.0 + 0.1 * (2 + 3))\n" +
      "__check__('zero lambda', regularized_loss(2.5, [10, -10], 0.0, 'ridge'), 2.5)\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-reg-03',
    title: 'Fit Linear Regression with Gradient Descent',
    difficulty: 'Hard',
    language: 'python',
    category: 'ML: Regression',
    prompt:
      'Write fit_linear_regression(xs, ys, learning_rate, steps) that fits y = w*x + b to the data using ' +
      'batch gradient descent, starting from w=0, b=0. On each step, compute predictions for all points, ' +
      'then update w and b using the average gradient of the mean squared error across the whole dataset. ' +
      'Return (w, b).',
    starterCode:
      'def fit_linear_regression(xs, ys, learning_rate, steps):\n' +
      '    w, b = 0.0, 0.0\n' +
      '    n = len(xs)\n' +
      '    # TODO: run `steps` iterations of batch gradient descent, updating w and b each time\n' +
      '    return w, b\n',
    hints: [
      'On each step, first compute the predictions: preds = [w * x + b for x in xs].',
      'The MSE gradients are averages: grad_w = sum(-2 * x * (y - p) for x, y, p in zip(xs, ys, preds)) / n, and similarly grad_b = sum(-2 * (y - p) for y, p in zip(ys, preds)) / n.',
      'Update both parameters together: w -= learning_rate * grad_w; b -= learning_rate * grad_b.',
    ],
    solution:
      'def fit_linear_regression(xs, ys, learning_rate, steps):\n' +
      '    w, b = 0.0, 0.0\n' +
      '    n = len(xs)\n' +
      '    for _ in range(steps):\n' +
      '        preds = [w * x + b for x in xs]\n' +
      '        grad_w = sum(-2 * x * (y - p) for x, y, p in zip(xs, ys, preds)) / n\n' +
      '        grad_b = sum(-2 * (y - p) for y, p in zip(ys, preds)) / n\n' +
      '        w -= learning_rate * grad_w\n' +
      '        b -= learning_rate * grad_b\n' +
      '    return w, b\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected, tol):\n' +
      '    ok = abs(actual - expected) < tol\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'xs = [1, 2, 3, 4, 5]\n' +
      'ys = [3, 5, 7, 9, 11]  # y = 2x + 1, no noise\n' +
      'w, b = fit_linear_regression(xs, ys, 0.01, 5000)\n' +
      "__check__('slope converges near 2', w, 2.0, 0.05)\n" +
      "__check__('intercept converges near 1', b, 1.0, 0.1)\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected ~{expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-reg-04',
    title: 'The Sigmoid Function',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Regression',
    prompt:
      'Write sigmoid(z) that computes 1 / (1 + e**-z) using math.exp — the function that turns logistic ' +
      "regression's linear output into a probability between 0 and 1.",
    starterCode:
      'import math\n\n' +
      'def sigmoid(z):\n' +
      '    # TODO: return 1 / (1 + e**-z)\n' +
      '    pass\n',
    hints: [
      'math.exp(x) computes e**x.',
      'The formula is exactly 1 / (1 + math.exp(-z)).',
      'Sanity-check yourself: sigmoid(0) should be exactly 0.5.',
    ],
    solution:
      'import math\n\n' +
      'def sigmoid(z):\n' +
      '    return 1 / (1 + math.exp(-z))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("z=0", sigmoid(0), 0.5)\n' +
      '__check__("large positive z is near 1", sigmoid(20), 1.0)\n' +
      '__check__("large negative z is near 0", sigmoid(-20), 0.0)\n' +
      '__check__("z=2", sigmoid(2), 0.8807970779778823)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-reg-05',
    title: 'Regression Metrics from Scratch',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Regression',
    prompt:
      "Write regression_metrics(y_true, y_pred) returning a dict with keys 'mse', 'rmse', 'mae', and " +
      "'r2', computed manually (no libraries) from the two equal-length lists.",
    starterCode:
      'def regression_metrics(y_true, y_pred):\n' +
      "    # TODO: return {'mse': ..., 'rmse': ..., 'mae': ..., 'r2': ...}\n" +
      '    pass\n',
    hints: [
      'MSE is the average of (y_true - y_pred) ** 2; RMSE is just MSE ** 0.5.',
      'MAE is the average of abs(y_true - y_pred).',
      'R2 is 1 - (sum of squared errors) / (sum of squared deviations from the mean of y_true) — compute mean(y_true) first.',
    ],
    solution:
      'def regression_metrics(y_true, y_pred):\n' +
      '    n = len(y_true)\n' +
      '    errors = [yt - yp for yt, yp in zip(y_true, y_pred)]\n' +
      '    mse = sum(e ** 2 for e in errors) / n\n' +
      '    mae = sum(abs(e) for e in errors) / n\n' +
      '    mean_y = sum(y_true) / n\n' +
      '    ss_res = sum(e ** 2 for e in errors)\n' +
      '    ss_tot = sum((yt - mean_y) ** 2 for yt in y_true)\n' +
      '    r2 = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0\n' +
      "    return {'mse': mse, 'rmse': mse ** 0.5, 'mae': mae, 'r2': r2}\n",
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(actual[k] - expected[k]) < 1e-6 for k in expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('perfect predictions', regression_metrics([1, 2, 3], [1, 2, 3]),\n" +
      "    {'mse': 0.0, 'rmse': 0.0, 'mae': 0.0, 'r2': 1.0})\n" +
      "__check__('constant offset', regression_metrics([1, 2, 3], [2, 3, 4]),\n" +
      "    {'mse': 1.0, 'rmse': 1.0, 'mae': 1.0, 'r2': -0.5})\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
