import type { CodeTask } from '../codeTypes';

export const ML_FOUNDATIONS_TASKS: CodeTask[] = [
  {
    id: 'ml-found-01',
    title: 'Clean and Average Sensor Readings',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      'Write clean_average(readings) where readings is a list that may contain None values mixed in with ' +
      'numbers (e.g. a sensor that occasionally failed to report). Return the average of only the non-None ' +
      'values, using no libraries — just core Python. If there are no valid readings, return None.',
    starterCode:
      'def clean_average(readings):\n' +
      '    # TODO: return the average of the non-None values, or None if there are none\n' +
      '    pass\n',
    hints: [
      'Filter first: valid = [r for r in readings if r is not None].',
      'Guard the empty case before dividing — an empty list has no average.',
      'sum(valid) / len(valid) is the average once you have the filtered list.',
    ],
    solution:
      'def clean_average(readings):\n' +
      '    valid = [r for r in readings if r is not None]\n' +
      '    if not valid:\n' +
      '        return None\n' +
      '    return sum(valid) / len(valid)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", clean_average([1, 2, None, 3]), 2.0)\n' +
      '__check__("no gaps", clean_average([10, 20, 30]), 20.0)\n' +
      '__check__("all missing", clean_average([None, None]), None)\n' +
      '__check__("single value", clean_average([None, 5]), 5.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-02',
    title: 'Standardize a Feature with NumPy',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      'Write standardize(values) that takes a Python list of numbers and returns a NumPy array of ' +
      'z-scores: (x - mean) / std for every element. This is the single most common preprocessing step ' +
      'before feeding numeric features into a model — it puts every feature on the same scale.',
    starterCode:
      'import numpy as np\n\n' +
      'def standardize(values):\n' +
      '    # TODO: return a numpy array of z-scores: (x - mean) / std\n' +
      '    pass\n',
    hints: [
      'Convert first: arr = np.array(values).',
      'NumPy arrays have .mean() and .std() methods built in — no manual loop needed.',
      'The whole function is one vectorized expression: (arr - arr.mean()) / arr.std().',
    ],
    solution:
      'import numpy as np\n\n' +
      'def standardize(values):\n' +
      '    arr = np.array(values, dtype=float)\n' +
      '    return (arr - arr.mean()) / arr.std()\n',
    testCode:
      'import numpy as np\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = np.allclose(actual, expected, atol=1e-6)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", standardize([1, 2, 3, 4, 5]), np.array([-1.41421356, -0.70710678, 0., 0.70710678, 1.41421356]))\n' +
      '__check__("constant shift", standardize([10, 20, 30]), np.array([-1.22474487, 0., 1.22474487]))\n' +
      '__check__("mean is zero", float(np.mean(standardize([3, 7, 11, 2]))), 0.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-03',
    title: 'Average Price by Category with Pandas',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      "Write average_by_category(rows) where rows is a list of dicts like {'category': 'A', 'price': 10}. " +
      'Build a pandas DataFrame from rows and return a plain dict mapping each category to its average ' +
      'price. This is the pandas groupby pattern you will use constantly for summarizing raw data.',
    starterCode:
      'import pandas as pd\n\n' +
      'def average_by_category(rows):\n' +
      '    # TODO: build a DataFrame from rows, group by "category", and return {category: avg_price}\n' +
      '    pass\n',
    hints: [
      'pd.DataFrame(rows) turns a list of same-shaped dicts straight into a table.',
      'df.groupby("category")["price"].mean() gives you a Series indexed by category.',
      '.to_dict() converts that Series into a plain Python dict, which is what the function should return.',
    ],
    solution:
      'import pandas as pd\n\n' +
      'def average_by_category(rows):\n' +
      '    df = pd.DataFrame(rows)\n' +
      '    return df.groupby("category")["price"].mean().to_dict()\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'rows1 = [{"category": "A", "price": 10}, {"category": "A", "price": 20}, {"category": "B", "price": 5}]\n' +
      '__check__("basic", average_by_category(rows1), {"A": 15.0, "B": 5.0})\n\n' +
      'rows2 = [{"category": "X", "price": 100}]\n' +
      '__check__("single row", average_by_category(rows2), {"X": 100.0})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-04',
    title: 'Summarize a Distribution',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      "Write summarize(values) that returns a dict with keys 'mean', 'median', and 'variance' for a list " +
      'of numbers — computed manually, no statistics library. Use the population variance (divide by n, ' +
      'not n-1).',
    starterCode:
      'def summarize(values):\n' +
      "    # TODO: return {'mean': ..., 'median': ..., 'variance': ...}\n" +
      '    pass\n',
    hints: [
      'Mean is sum(values) / len(values).',
      'Median needs the values sorted first; for an even-length list, average the two middle elements.',
      'Population variance is the average of (x - mean) squared: sum((x - mean) ** 2 for x in values) / n.',
    ],
    solution:
      'def summarize(values):\n' +
      '    n = len(values)\n' +
      '    mean = sum(values) / n\n' +
      '    s = sorted(values)\n' +
      '    mid = n // 2\n' +
      '    median = s[mid] if n % 2 == 1 else (s[mid - 1] + s[mid]) / 2\n' +
      '    variance = sum((x - mean) ** 2 for x in values) / n\n' +
      "    return {'mean': mean, 'median': median, 'variance': variance}\n",
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(actual[k] - expected[k]) < 1e-9 for k in expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('odd length', summarize([1, 2, 3, 4, 5]), {'mean': 3.0, 'median': 3, 'variance': 2.0})\n" +
      "__check__('even length', summarize([1, 2, 3, 4]), {'mean': 2.5, 'median': 2.5, 'variance': 1.25})\n" +
      "__check__('constant', summarize([7, 7, 7]), {'mean': 7.0, 'median': 7, 'variance': 0.0})\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-05',
    title: 'Cosine Similarity',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      'Write cosine_similarity(a, b) for two equal-length lists of numbers, returning the cosine of the ' +
      'angle between them: (a&middot;b) / (||a|| &times; ||b||), where a&middot;b is the dot product and ' +
      '||a|| is the vector\'s L2 norm. This is the standard way to measure how "similar" two vectors are ' +
      "regardless of their magnitude — it's used everywhere from recommendation systems to comparing text embeddings.",
    starterCode:
      'def cosine_similarity(a, b):\n' +
      '    # TODO: return the cosine similarity between vectors a and b\n' +
      '    pass\n',
    hints: [
      'The dot product is sum(x * y for x, y in zip(a, b)).',
      'The L2 norm of a vector v is (sum(x ** 2 for x in v)) ** 0.5.',
      'Divide the dot product by the product of the two norms.',
    ],
    solution:
      'def cosine_similarity(a, b):\n' +
      '    dot = sum(x * y for x, y in zip(a, b))\n' +
      '    norm_a = sum(x ** 2 for x in a) ** 0.5\n' +
      '    norm_b = sum(x ** 2 for x in b) ** 0.5\n' +
      '    return dot / (norm_a * norm_b)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("identical vectors", cosine_similarity([1, 2, 3], [1, 2, 3]), 1.0)\n' +
      '__check__("orthogonal", cosine_similarity([1, 0], [0, 1]), 0.0)\n' +
      '__check__("opposite", cosine_similarity([1, 0], [-1, 0]), -1.0)\n' +
      '__check__("scaled copy", cosine_similarity([2, 4], [1, 2]), 1.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-06',
    title: 'Minimize a Function with Gradient Descent',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      'Write minimize(x0, learning_rate, steps) that minimizes f(x) = (x - 3) ** 2 using gradient descent, ' +
      'starting from x0. The gradient of this function is 2 * (x - 3). Update x by subtracting ' +
      'learning_rate * gradient, steps times, and return the final x. Run it and watch x converge toward 3 ' +
      '— the same update rule trains everything from linear regression to neural networks.',
    starterCode:
      'def minimize(x0, learning_rate, steps):\n' +
      '    # TODO: run `steps` iterations of gradient descent on f(x) = (x - 3) ** 2, return final x\n' +
      '    pass\n',
    hints: [
      'The gradient at the current x is 2 * (x - 3) — recompute it fresh on every step.',
      'Each step: x = x - learning_rate * gradient.',
      'Loop exactly `steps` times and return x afterward.',
    ],
    solution:
      'def minimize(x0, learning_rate, steps):\n' +
      '    x = x0\n' +
      '    for _ in range(steps):\n' +
      '        gradient = 2 * (x - 3)\n' +
      '        x = x - learning_rate * gradient\n' +
      '    return x\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected, tol=1e-3):\n' +
      '    ok = abs(actual - expected) < tol\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("converges near minimum", minimize(0, 0.1, 100), 3.0)\n' +
      '__check__("starts above target", minimize(10, 0.1, 100), 3.0)\n' +
      '__check__("already close", minimize(2.9, 0.1, 50), 3.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected ~{expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-found-07',
    title: 'Missing Value Report',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Foundations',
    prompt:
      'Write missing_report(rows) where rows is a list of dicts representing table rows (all with the ' +
      'same keys). Return a dict mapping each column name to how many rows have None for that column — ' +
      'step 2 of the EDA checklist, done in code.',
    starterCode:
      'def missing_report(rows):\n' +
      '    # TODO: return {column: count_of_None_values}\n' +
      '    pass\n',
    hints: [
      'Get the column names from the first row: rows[0].keys() (handle the empty-rows case separately).',
      'For each column, count how many rows have None: sum(1 for r in rows if r[col] is None).',
      'Build the result as a dict comprehension over the columns.',
    ],
    solution:
      'def missing_report(rows):\n' +
      '    if not rows:\n' +
      '        return {}\n' +
      '    columns = rows[0].keys()\n' +
      '    return {col: sum(1 for r in rows if r[col] is None) for col in columns}\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'rows1 = [{"a": 1, "b": None}, {"a": None, "b": 2}, {"a": 3, "b": None}]\n' +
      '__check__("basic", missing_report(rows1), {"a": 1, "b": 2})\n\n' +
      'rows2 = [{"x": 1}, {"x": 2}]\n' +
      '__check__("no missing", missing_report(rows2), {"x": 0})\n\n' +
      '__check__("empty input", missing_report([]), {})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
