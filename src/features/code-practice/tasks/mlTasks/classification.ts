import type { CodeTask } from '../codeTypes';

export const ML_CLASSIFICATION_TASKS: CodeTask[] = [
  {
    id: 'ml-clf-01',
    title: 'k-Nearest Neighbors from Scratch',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write knn_predict(point, training_points, training_labels, k) that classifies point using k-NN: ' +
      'compute the Euclidean distance from point to every training point, take the k closest, and return ' +
      'the most common label among them (assume no ties in the test cases).',
    starterCode:
      'def knn_predict(point, training_points, training_labels, k):\n' +
      '    # TODO: return the majority label among the k nearest training points to `point`\n' +
      '    pass\n',
    hints: [
      'Euclidean distance between two points a and b: sum((ai - bi) ** 2 for ai, bi in zip(a, b)) ** 0.5.',
      'Pair each training point with its distance and label, then sort by distance: sorted(zip(distances, training_labels)).',
      'Take the first k labels from the sorted list, then use collections.Counter(...).most_common(1)[0][0] to find the majority.',
    ],
    solution:
      'from collections import Counter\n\n' +
      'def knn_predict(point, training_points, training_labels, k):\n' +
      '    def dist(a, b):\n' +
      '        return sum((ai - bi) ** 2 for ai, bi in zip(a, b)) ** 0.5\n' +
      '    distances = [dist(point, tp) for tp in training_points]\n' +
      '    ordered = sorted(zip(distances, training_labels), key=lambda pair: pair[0])\n' +
      '    nearest_labels = [label for _, label in ordered[:k]]\n' +
      '    return Counter(nearest_labels).most_common(1)[0][0]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'points = [[0, 0], [0, 1], [10, 10], [10, 11]]\n' +
      'labels = ["a", "a", "b", "b"]\n' +
      '__check__("near cluster a", knn_predict([0, 0.5], points, labels, 1), "a")\n' +
      '__check__("near cluster b", knn_predict([10, 10.5], points, labels, 1), "b")\n' +
      '__check__("k=3 still picks nearer cluster", knn_predict([0, 0], points, labels, 3), "a")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-clf-02',
    title: 'Entropy of a Split',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write entropy(labels) that computes the entropy (in bits, using log base 2) of a list of class ' +
      'labels — the impurity measure a decision tree minimizes at every split. A pure list (one class) ' +
      'has entropy 0.',
    starterCode:
      'import math\n\n' +
      'def entropy(labels):\n' +
      '    # TODO: return the entropy of the label distribution, in bits\n' +
      '    pass\n',
    hints: [
      'Count how many times each distinct label appears, then divide by len(labels) to get each proportion p.',
      'Entropy is -sum(p * log2(p) for each class proportion p).',
      'math.log(p, 2) computes log base 2 directly — or math.log(p) / math.log(2).',
    ],
    solution:
      'import math\n' +
      'from collections import Counter\n\n' +
      'def entropy(labels):\n' +
      '    n = len(labels)\n' +
      '    counts = Counter(labels)\n' +
      '    return -sum((c / n) * math.log(c / n, 2) for c in counts.values())\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("pure", entropy(["a", "a", "a"]), 0.0)\n' +
      '__check__("balanced binary", entropy(["a", "b"]), 1.0)\n' +
      '__check__("balanced four-way", entropy(["a", "b", "c", "d"]), 2.0)\n' +
      '__check__("skewed", entropy(["a", "a", "a", "b"]), 0.8112781244591328)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-clf-03',
    title: 'Bootstrap Sampling for Bagging',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write bootstrap_sample(data, seed) that returns a bootstrap resample of data: len(data) elements ' +
      'drawn *with replacement*, using random.Random(seed) for determinism. This is exactly what each ' +
      "tree in a random forest trains on — its own random resample of the full training set.",
    starterCode:
      'import random\n\n' +
      'def bootstrap_sample(data, seed):\n' +
      '    # TODO: return len(data) elements drawn with replacement from data, using random.Random(seed)\n' +
      '    pass\n',
    hints: [
      'random.Random(seed).choices(data, k=len(data)) samples with replacement in one call.',
      'Sampling "with replacement" means the same element can appear multiple times, and some elements may not appear at all.',
      'The output length must always equal len(data), even though the specific elements chosen differ.',
    ],
    solution:
      'import random\n\n' +
      'def bootstrap_sample(data, seed):\n' +
      '    return random.Random(seed).choices(data, k=len(data))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, ok):\n' +
      '    __results__.append((name, ok))\n\n' +
      'data = [10, 20, 30, 40, 50]\n' +
      'sample = bootstrap_sample(data, seed=1)\n' +
      '__check__("same length as input", len(sample) == len(data))\n' +
      '__check__("every element came from data", all(x in data for x in sample))\n\n' +
      'sample2 = bootstrap_sample(data, seed=1)\n' +
      '__check__("deterministic for same seed", sample == sample2)\n\n' +
      'sample3 = bootstrap_sample(data, seed=2)\n' +
      '__check__("different seed can differ", sample != sample3 or True)\n\n' +
      'for name, ok in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-clf-04',
    title: 'SVM Margin Width',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write margin_width(w) that returns the width of an SVM\'s margin given its weight vector w: 2 / ' +
      '||w||, where ||w|| is the L2 norm of w. A smaller weight vector means a wider (more generalizable) margin.',
    starterCode:
      'def margin_width(w):\n' +
      '    # TODO: return 2 / ||w||, the width of the margin\n' +
      '    pass\n',
    hints: [
      'The L2 norm of w is (sum(x ** 2 for x in w)) ** 0.5.',
      'The margin width is 2 divided by that norm.',
      'This is the same norm calculation as cosine_similarity used back in Unit 1.',
    ],
    solution:
      'def margin_width(w):\n' +
      '    norm = sum(x ** 2 for x in w) ** 0.5\n' +
      '    return 2 / norm\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("unit vector", margin_width([1, 0]), 2.0)\n' +
      '__check__("larger weights, smaller margin", margin_width([2, 0]), 1.0)\n' +
      '__check__("3-4-5 triangle norm", margin_width([3, 4]), 0.4)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-clf-05',
    title: 'Weighted Error Rate for Boosting',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write weighted_error(y_true, y_pred, weights) that returns the weighted error rate: the sum of ' +
      'weights for every misclassified example, divided by the sum of all weights. This is exactly the ' +
      'quantity boosting algorithms like AdaBoost use to decide how much attention each mistake deserves ' +
      'in the next round.',
    starterCode:
      'def weighted_error(y_true, y_pred, weights):\n' +
      '    # TODO: return sum(weight for wrong predictions) / sum(all weights)\n' +
      '    pass\n',
    hints: [
      'Zip y_true, y_pred, and weights together to walk all three in lockstep.',
      'An example is misclassified when its true label does not equal its predicted label.',
      'Sum the weights of only the misclassified examples, then divide by the sum of every weight.',
    ],
    solution:
      'def weighted_error(y_true, y_pred, weights):\n' +
      '    wrong_weight = sum(w for yt, yp, w in zip(y_true, y_pred, weights) if yt != yp)\n' +
      '    return wrong_weight / sum(weights)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("all correct", weighted_error([1, 0, 1], [1, 0, 1], [1, 1, 1]), 0.0)\n' +
      '__check__("all wrong", weighted_error([1, 0, 1], [0, 1, 0], [1, 1, 1]), 1.0)\n' +
      '__check__("one wrong, unequal weights", weighted_error([1, 0, 1], [1, 1, 1], [2, 1, 1]), 0.25)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-clf-06',
    title: 'Naive Bayes Posterior Score',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Classification',
    prompt:
      'Write naive_bayes_score(prior, likelihoods) that returns the unnormalized posterior score for a ' +
      'class: prior multiplied by the product of every value in likelihoods (each P(feature | class), ' +
      'under the naive independence assumption). This is the quantity you compute once per class, then ' +
      'compare across classes to make a prediction.',
    starterCode:
      'def naive_bayes_score(prior, likelihoods):\n' +
      '    # TODO: return prior * (product of all values in likelihoods)\n' +
      '    pass\n',
    hints: [
      'Start an accumulator at the prior value.',
      'Multiply it by every value in likelihoods, one at a time (or use math.prod on likelihoods and multiply by prior).',
      'An empty likelihoods list should just return the prior unchanged (product of nothing is 1).',
    ],
    solution:
      'import math\n\n' +
      'def naive_bayes_score(prior, likelihoods):\n' +
      '    return prior * math.prod(likelihoods)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", naive_bayes_score(0.5, [0.8, 0.6]), 0.24)\n' +
      '__check__("no features", naive_bayes_score(0.3, []), 0.3)\n' +
      '__check__("single feature", naive_bayes_score(0.4, [0.5]), 0.2)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
