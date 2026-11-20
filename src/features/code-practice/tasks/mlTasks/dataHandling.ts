import type { CodeTask } from '../codeTypes';

export const ML_DATA_HANDLING_TASKS: CodeTask[] = [
  {
    id: 'ml-data-01',
    title: 'Impute Missing Values with the Mean',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      'Write impute_mean(values) that returns a new list where every None in values is replaced by the ' +
      'mean of the non-None values (computed from that same list). Leave the non-None values unchanged.',
    starterCode:
      'def impute_mean(values):\n' +
      '    # TODO: replace every None with the mean of the non-None values\n' +
      '    pass\n',
    hints: [
      'First compute the mean of just the non-None values, same as clean_average from the Foundations unit.',
      'Then build a new list: for each element, use the mean if it is None, otherwise keep the value.',
      'A list comprehension with a conditional expression does this in one line: [mean if v is None else v for v in values].',
    ],
    solution:
      'def impute_mean(values):\n' +
      '    valid = [v for v in values if v is not None]\n' +
      '    mean = sum(valid) / len(valid)\n' +
      '    return [mean if v is None else v for v in values]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(a - b) < 1e-9 for a, b in zip(actual, expected)) and len(actual) == len(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", impute_mean([1, None, 3]), [1, 2.0, 3])\n' +
      '__check__("no gaps", impute_mean([5, 10, 15]), [5, 10, 15])\n' +
      '__check__("multiple gaps", impute_mean([10, None, None, 20]), [10, 15.0, 15.0, 20])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-data-02',
    title: 'Min-Max Normalization',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      'Write min_max_normalize(values) that scales a list of numbers into the range [0, 1] using ' +
      '(x - min) / (max - min). If every value is identical (max equals min), return 0.0 for every element ' +
      'instead of dividing by zero.',
    starterCode:
      'def min_max_normalize(values):\n' +
      '    # TODO: scale values into [0, 1]; return all 0.0 if every value is identical\n' +
      '    pass\n',
    hints: [
      'Find lo = min(values) and hi = max(values) first.',
      'Guard the degenerate case: if hi == lo, every output should be 0.0.',
      'Otherwise, map each x to (x - lo) / (hi - lo).',
    ],
    solution:
      'def min_max_normalize(values):\n' +
      '    lo, hi = min(values), max(values)\n' +
      '    if hi == lo:\n' +
      '        return [0.0 for _ in values]\n' +
      '    return [(x - lo) / (hi - lo) for x in values]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(a - b) < 1e-9 for a, b in zip(actual, expected)) and len(actual) == len(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", min_max_normalize([0, 5, 10]), [0.0, 0.5, 1.0])\n' +
      '__check__("negative range", min_max_normalize([-10, 0, 10]), [0.0, 0.5, 1.0])\n' +
      '__check__("constant", min_max_normalize([4, 4, 4]), [0.0, 0.0, 0.0])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-data-03',
    title: 'One-Hot Encode a Category Column',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      "Write one_hot_encode(categories) that takes a list of category strings (e.g. ['red', 'blue', " +
      "'red']) and returns a list of dicts, one per input element, with a 0/1 key for every distinct " +
      'category seen across the whole list (in sorted order). Each dict should have exactly one key set to 1.',
    starterCode:
      'def one_hot_encode(categories):\n' +
      '    # TODO: return a list of {category: 0 or 1} dicts, one per input element\n' +
      '    pass\n',
    hints: [
      'Find the distinct categories first: sorted(set(categories)).',
      'For each input element, build a dict with every distinct category as a key, all 0 except the matching one.',
      'A dict comprehension per row works well: {cat: (1 if cat == value else 0) for cat in distinct}.',
    ],
    solution:
      'def one_hot_encode(categories):\n' +
      '    distinct = sorted(set(categories))\n' +
      '    return [{cat: (1 if cat == value else 0) for cat in distinct} for value in categories]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('basic', one_hot_encode(['red', 'blue']), [{'blue': 0, 'red': 1}, {'blue': 1, 'red': 0}])\n" +
      "__check__('repeats', one_hot_encode(['a', 'a']), [{'a': 1}, {'a': 1}])\n" +
      "__check__('three categories', one_hot_encode(['b', 'a', 'c']),\n" +
      "    [{'a': 0, 'b': 1, 'c': 0}, {'a': 1, 'b': 0, 'c': 0}, {'a': 0, 'b': 0, 'c': 1}])\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-data-04',
    title: 'Engineer a Ratio Feature',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      "Write add_ratio_feature(rows, num_key, denom_key, new_key) where rows is a list of dicts. For each " +
      "row, add a new key new_key equal to row[num_key] / row[denom_key], or None if the denominator is 0. " +
      "Return the modified list. This is the ratio-feature pattern from feature engineering — e.g. " +
      "'clicks' / 'impressions' to get a click-through rate.",
    starterCode:
      'def add_ratio_feature(rows, num_key, denom_key, new_key):\n' +
      '    # TODO: add row[new_key] = row[num_key] / row[denom_key] to every row (None if denom is 0)\n' +
      '    pass\n',
    hints: [
      'Loop over rows and mutate (or build a new dict for) each one.',
      'Guard division by zero: if row[denom_key] == 0, set new_key to None instead of dividing.',
      'Return the same list object (or a new list of updated dicts) — either is fine as long as new_key is set correctly.',
    ],
    solution:
      'def add_ratio_feature(rows, num_key, denom_key, new_key):\n' +
      '    for row in rows:\n' +
      '        denom = row[denom_key]\n' +
      '        row[new_key] = None if denom == 0 else row[num_key] / denom\n' +
      '    return rows\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'rows1 = [{"clicks": 10, "impressions": 100}, {"clicks": 5, "impressions": 0}]\n' +
      'result1 = add_ratio_feature(rows1, "clicks", "impressions", "ctr")\n' +
      '__check__("basic", result1, [{"clicks": 10, "impressions": 100, "ctr": 0.1}, {"clicks": 5, "impressions": 0, "ctr": None}])\n\n' +
      'rows2 = [{"a": 8, "b": 2}]\n' +
      '__check__("simple division", add_ratio_feature(rows2, "a", "b", "ratio"), [{"a": 8, "b": 2, "ratio": 4.0}])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-data-05',
    title: 'Train/Test Split',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      'Write train_test_split(data, test_ratio, seed) that splits a list into (train, test) sublists. ' +
      'Use random.Random(seed) to shuffle a *copy* of data deterministically, then take the last ' +
      'round(len(data) * test_ratio) elements as the test set and the rest as train. Every original ' +
      'element must end up in exactly one of the two lists.',
    starterCode:
      'import random\n\n' +
      'def train_test_split(data, test_ratio, seed):\n' +
      '    # TODO: shuffle a copy of data with random.Random(seed), split off the last\n' +
      '    # round(len(data) * test_ratio) elements as the test set\n' +
      '    pass\n',
    hints: [
      'Never shuffle the caller\'s list in place — copy it first: shuffled = list(data).',
      'random.Random(seed).shuffle(shuffled) shuffles deterministically for a given seed.',
      'test_size = round(len(data) * test_ratio); the test set is shuffled[-test_size:] (or all of it if test_size is 0, slicing handles that automatically), train is everything before that.',
    ],
    solution:
      'import random\n\n' +
      'def train_test_split(data, test_ratio, seed):\n' +
      '    shuffled = list(data)\n' +
      '    random.Random(seed).shuffle(shuffled)\n' +
      '    test_size = round(len(data) * test_ratio)\n' +
      '    if test_size == 0:\n' +
      '        return shuffled, []\n' +
      '    return shuffled[:-test_size], shuffled[-test_size:]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, ok):\n' +
      '    __results__.append((name, ok))\n\n' +
      'data = list(range(20))\n' +
      'train, test = train_test_split(data, 0.25, seed=42)\n' +
      '__check__("sizes add up", len(train) + len(test) == len(data))\n' +
      '__check__("test size matches ratio", len(test) == 5)\n' +
      '__check__("no overlap", set(train).isdisjoint(set(test)))\n' +
      '__check__("union is complete", set(train) | set(test) == set(data))\n\n' +
      'train2, test2 = train_test_split(data, 0.25, seed=42)\n' +
      '__check__("deterministic for same seed", train == train2 and test == test2)\n\n' +
      'for name, ok in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-data-06',
    title: 'Polynomial Feature Expansion',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Data Handling',
    prompt:
      'Write polynomial_features(x, degree) that returns [1, x, x**2, ..., x**degree] — the classic way ' +
      'to let a linear model fit curves by expanding a single feature into powers of itself. Higher ' +
      'degree means a more flexible (and more variance-prone) model, straight from the bias-variance ' +
      'tradeoff you just read about.',
    starterCode:
      'def polynomial_features(x, degree):\n' +
      '    # TODO: return [x**0, x**1, ..., x**degree]\n' +
      '    pass\n',
    hints: [
      'You need degree + 1 terms in total, starting from the 0th power.',
      'A list comprehension over range(degree + 1) computing x ** i covers every term.',
      'x ** 0 is 1 for any x, which is exactly the first (bias) term.',
    ],
    solution:
      'def polynomial_features(x, degree):\n' +
      '    return [x ** i for i in range(degree + 1)]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("degree 2", polynomial_features(3, 2), [1, 3, 9])\n' +
      '__check__("degree 0", polynomial_features(5, 0), [1])\n' +
      '__check__("degree 3, x=2", polynomial_features(2, 3), [1, 2, 4, 8])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
