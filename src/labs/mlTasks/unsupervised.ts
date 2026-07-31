import type { CodeTask } from '../codeTypes';

export const ML_UNSUPERVISED_TASKS: CodeTask[] = [
  {
    id: 'ml-unsup-01',
    title: 'Compute Clustering Inertia',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Unsupervised Learning',
    prompt:
      'Write inertia(points, centroids, assignments) where points and centroids are lists of [x, y] ' +
      'coordinates, and assignments[i] is the index into centroids that points[i] belongs to. Return the ' +
      'total within-cluster sum of squared distances — the quantity the elbow method plots against k.',
    starterCode:
      'def inertia(points, centroids, assignments):\n' +
      '    # TODO: sum the squared distance from each point to its assigned centroid\n' +
      '    pass\n',
    hints: [
      'For point i, its assigned centroid is centroids[assignments[i]].',
      'Squared Euclidean distance between two [x, y] points a and b is (a[0]-b[0])**2 + (a[1]-b[1])**2.',
      'Sum that squared distance across every point, using zip(points, assignments) to walk both together.',
    ],
    solution:
      'def inertia(points, centroids, assignments):\n' +
      '    total = 0.0\n' +
      '    for point, cluster_idx in zip(points, assignments):\n' +
      '        cx, cy = centroids[cluster_idx]\n' +
      '        total += (point[0] - cx) ** 2 + (point[1] - cy) ** 2\n' +
      '    return total\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-9\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'points = [[0, 0], [2, 0], [10, 10]]\n' +
      'centroids = [[1, 0], [10, 10]]\n' +
      'assignments = [0, 0, 1]\n' +
      '__check__("basic", inertia(points, centroids, assignments), 2.0)\n\n' +
      '__check__("perfect fit", inertia([[5, 5]], [[5, 5]], [0]), 0.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-unsup-02',
    title: 'Single-Linkage Cluster Distance',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Unsupervised Learning',
    prompt:
      'Write single_linkage(cluster_a, cluster_b) where both are lists of [x, y] points. Return the ' +
      'smallest Euclidean distance between any point in cluster_a and any point in cluster_b — the ' +
      "distance hierarchical clustering with single linkage uses to decide which two clusters to merge next.",
    starterCode:
      'def single_linkage(cluster_a, cluster_b):\n' +
      '    # TODO: return the smallest distance between any pair of points across the two clusters\n' +
      '    pass\n',
    hints: [
      'You need to compare every point in cluster_a against every point in cluster_b — a nested loop or a generator expression over both.',
      'Euclidean distance between points p and q: ((p[0]-q[0])**2 + (p[1]-q[1])**2) ** 0.5.',
      'min(...) over all those pairwise distances gives the single-linkage distance.',
    ],
    solution:
      'def single_linkage(cluster_a, cluster_b):\n' +
      '    def dist(p, q):\n' +
      '        return ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) ** 0.5\n' +
      '    return min(dist(a, b) for a in cluster_a for b in cluster_b)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual - expected) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", single_linkage([[0, 0]], [[3, 4]]), 5.0)\n' +
      '__check__("closest pair wins", single_linkage([[0, 0], [10, 10]], [[1, 0], [20, 20]]), 1.0)\n' +
      '__check__("touching clusters", single_linkage([[0, 0]], [[0, 0]]), 0.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-unsup-03',
    title: 'Explained Variance Ratio',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Unsupervised Learning',
    prompt:
      'Write explained_variance_ratio(variances) where variances is a list of variance values, one per ' +
      "principal component, ordered from largest to smallest. Return a list of what fraction of the total " +
      'variance each component explains — the numbers a scree plot visualizes.',
    starterCode:
      'def explained_variance_ratio(variances):\n' +
      '    # TODO: return [v / sum(variances) for each v in variances]\n' +
      '    pass\n',
    hints: [
      'Compute the total first: total = sum(variances).',
      'Each ratio is just that component\'s variance divided by the total.',
      'A list comprehension over variances handles all of them at once: [v / total for v in variances].',
    ],
    solution:
      'def explained_variance_ratio(variances):\n' +
      '    total = sum(variances)\n' +
      '    return [v / total for v in variances]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    if isinstance(expected, (int, float)):\n' +
      '        ok = abs(actual - expected) < 1e-9\n' +
      '    else:\n' +
      '        ok = len(actual) == len(expected) and all(abs(a - b) < 1e-9 for a, b in zip(actual, expected))\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("basic", explained_variance_ratio([8, 2]), [0.8, 0.2])\n' +
      '__check__("three components", explained_variance_ratio([6, 3, 1]), [0.6, 0.3, 0.1])\n' +
      '__check__("ratios sum to 1", sum(explained_variance_ratio([5, 3, 2])), 1.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-unsup-04',
    title: 'Support, Confidence &amp; Lift',
    difficulty: 'Hard',
    language: 'python',
    category: 'ML: Unsupervised Learning',
    prompt:
      'Write association_metrics(transactions, item_a, item_b) where transactions is a list of sets of ' +
      "item names. Return a dict with 'support' (fraction of transactions containing both items), " +
      "'confidence' (fraction of item_a's transactions that also contain item_b), and 'lift' (confidence " +
      'divided by the overall fraction of transactions containing item_b) for the rule item_a &rarr; item_b.',
    starterCode:
      'def association_metrics(transactions, item_a, item_b):\n' +
      "    # TODO: return {'support': ..., 'confidence': ..., 'lift': ...} for item_a -> item_b\n" +
      '    pass\n',
    hints: [
      'both_count = number of transactions containing both item_a and item_b; a_count = number containing item_a; b_count = number containing item_b.',
      'support = both_count / total_transactions; confidence = both_count / a_count.',
      'lift = confidence / (b_count / total_transactions) — i.e. confidence divided by item_b\'s overall support.',
    ],
    solution:
      'def association_metrics(transactions, item_a, item_b):\n' +
      '    n = len(transactions)\n' +
      '    both = sum(1 for t in transactions if item_a in t and item_b in t)\n' +
      '    a_count = sum(1 for t in transactions if item_a in t)\n' +
      '    b_count = sum(1 for t in transactions if item_b in t)\n' +
      '    support = both / n\n' +
      '    confidence = both / a_count if a_count > 0 else 0.0\n' +
      '    b_support = b_count / n\n' +
      '    lift = confidence / b_support if b_support > 0 else 0.0\n' +
      "    return {'support': support, 'confidence': confidence, 'lift': lift}\n",
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(actual[k] - expected[k]) < 1e-6 for k in expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'transactions = [\n' +
      '    {"bread", "butter"},\n' +
      '    {"bread", "butter", "milk"},\n' +
      '    {"bread"},\n' +
      '    {"milk"},\n' +
      ']\n' +
      "__check__('bread -> butter', association_metrics(transactions, 'bread', 'butter'),\n" +
      "    {'support': 0.5, 'confidence': 2/3, 'lift': (2/3) / 0.5})\n\n" +
      "__check__('milk -> bread', association_metrics(transactions, 'milk', 'bread'),\n" +
      "    {'support': 0.25, 'confidence': 0.5, 'lift': 0.5 / 0.75})\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
