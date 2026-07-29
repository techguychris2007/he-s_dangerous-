import type { CodeTask } from '../codeTypes';

export const ML_MODEL_EVALUATION_TASKS: CodeTask[] = [
  {
    id: 'ml-eval-01',
    title: 'Precision, Recall &amp; F1 from Scratch',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Model Evaluation',
    prompt:
      "Write precision_recall_f1(y_true, y_pred) for two equal-length lists of 0/1 labels. Return a dict " +
      "with keys 'precision', 'recall', 'f1', computed from the confusion matrix counts. If a denominator " +
      'would be zero (no predicted positives, or no actual positives), use 0.0 for that metric instead of ' +
      'dividing by zero.',
    starterCode:
      'def precision_recall_f1(y_true, y_pred):\n' +
      "    # TODO: return {'precision': ..., 'recall': ..., 'f1': ...}\n" +
      '    pass\n',
    hints: [
      'TP = both 1; FP = predicted 1 but actually 0; FN = predicted 0 but actually 1. Count each with a generator expression over zip(y_true, y_pred).',
      'precision = TP / (TP + FP) if TP + FP > 0 else 0.0; recall = TP / (TP + FN) if TP + FN > 0 else 0.0.',
      'F1 is the harmonic mean: 2 * precision * recall / (precision + recall), or 0.0 if both are 0.',
    ],
    solution:
      'def precision_recall_f1(y_true, y_pred):\n' +
      '    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)\n' +
      '    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)\n' +
      '    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)\n' +
      '    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0\n' +
      '    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0\n' +
      '    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0\n' +
      "    return {'precision': precision, 'recall': recall, 'f1': f1}\n",
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(actual[k] - expected[k]) < 1e-6 for k in expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "__check__('perfect', precision_recall_f1([1, 0, 1, 0], [1, 0, 1, 0]),\n" +
      "    {'precision': 1.0, 'recall': 1.0, 'f1': 1.0})\n" +
      "__check__('one false positive', precision_recall_f1([0, 0, 1], [1, 0, 1]),\n" +
      "    {'precision': 0.5, 'recall': 1.0, 'f1': 2/3})\n" +
      "__check__('no positive predictions', precision_recall_f1([1, 1], [0, 0]),\n" +
      "    {'precision': 0.0, 'recall': 0.0, 'f1': 0.0})\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-eval-02',
    title: 'TPR and FPR at a Threshold',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Model Evaluation',
    prompt:
      'Write tpr_fpr(y_true, scores, threshold) where y_true is a list of 0/1 labels and scores is a list ' +
      'of predicted probabilities. Classify an example as positive when its score >= threshold, then ' +
      "return (TPR, FPR) — True Positive Rate and False Positive Rate at that threshold. This is exactly " +
      'the calculation swept across every threshold to trace out a ROC curve.',
    starterCode:
      'def tpr_fpr(y_true, scores, threshold):\n' +
      '    # TODO: classify by threshold, then return (TPR, FPR) as a tuple\n' +
      '    pass\n',
    hints: [
      'First turn scores into predictions: preds = [1 if s >= threshold else 0 for s in scores].',
      'TPR = TP / (TP + FN) — of the actual positives, how many did we catch?',
      'FPR = FP / (FP + TN) — of the actual negatives, how many did we wrongly flag? Guard both against a zero denominator, returning 0.0 in that case.',
    ],
    solution:
      'def tpr_fpr(y_true, scores, threshold):\n' +
      '    preds = [1 if s >= threshold else 0 for s in scores]\n' +
      '    tp = sum(1 for yt, yp in zip(y_true, preds) if yt == 1 and yp == 1)\n' +
      '    fn = sum(1 for yt, yp in zip(y_true, preds) if yt == 1 and yp == 0)\n' +
      '    fp = sum(1 for yt, yp in zip(y_true, preds) if yt == 0 and yp == 1)\n' +
      '    tn = sum(1 for yt, yp in zip(y_true, preds) if yt == 0 and yp == 0)\n' +
      '    tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0\n' +
      '    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0\n' +
      '    return (tpr, fpr)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = abs(actual[0] - expected[0]) < 1e-6 and abs(actual[1] - expected[1]) < 1e-6\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'y_true = [1, 1, 0, 0]\n' +
      'scores = [0.9, 0.4, 0.6, 0.1]\n' +
      "__check__('low threshold catches everything positive', tpr_fpr(y_true, scores, 0.0), (1.0, 1.0))\n" +
      "__check__('high threshold catches nothing', tpr_fpr(y_true, scores, 1.1), (0.0, 0.0))\n" +
      "__check__('mid threshold', tpr_fpr(y_true, scores, 0.5), (0.5, 0.5))\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-eval-03',
    title: 'Build k-Fold Assignments',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Model Evaluation',
    prompt:
      'Write make_folds(n, k) that returns a list of k lists, assigning each index from 0 to n-1 to ' +
      'exactly one fold using round-robin assignment (index i goes to fold i % k). Every index must appear ' +
      'in exactly one fold, and fold sizes should differ by at most 1.',
    starterCode:
      'def make_folds(n, k):\n' +
      '    # TODO: return k lists partitioning range(n) via round-robin (index i -> fold i % k)\n' +
      '    pass\n',
    hints: [
      'Start with k empty lists: folds = [[] for _ in range(k)].',
      'Loop i from 0 to n - 1, appending i to folds[i % k].',
      'Return the list of folds once every index has been placed.',
    ],
    solution:
      'def make_folds(n, k):\n' +
      '    folds = [[] for _ in range(k)]\n' +
      '    for i in range(n):\n' +
      '        folds[i % k].append(i)\n' +
      '    return folds\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, ok):\n' +
      '    __results__.append((name, ok))\n\n' +
      'folds = make_folds(10, 3)\n' +
      "__check__('correct number of folds', len(folds) == 3)\n" +
      "__check__('every index covered exactly once', sorted(i for f in folds for i in f) == list(range(10)))\n" +
      "__check__('sizes differ by at most 1', max(len(f) for f in folds) - min(len(f) for f in folds) <= 1)\n\n" +
      "__check__('exact split when n divisible by k', make_folds(6, 3) == [[0, 3], [1, 4], [2, 5]])\n\n" +
      'for name, ok in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-eval-04',
    title: 'Oversample the Minority Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Model Evaluation',
    prompt:
      'Write oversample(labels, seed) where labels is a list containing exactly two distinct classes with ' +
      'unequal counts. Return a new list containing all original labels, plus extra copies of the minority ' +
      'class (sampled with replacement from the minority examples using random.Random(seed)) until both ' +
      'classes have equal counts.',
    starterCode:
      'import random\n\n' +
      'def oversample(labels, seed):\n' +
      '    # TODO: return labels + extra minority-class copies until both classes are equally represented\n' +
      '    pass\n',
    hints: [
      'Find the two distinct classes and count each: use collections.Counter(labels).',
      'The minority class has the smaller count; figure out how many extra copies are needed to match the majority count.',
      'random.Random(seed).choices([minority_class], k=needed) generates the extra copies; concatenate them onto a copy of the original list.',
    ],
    solution:
      'import random\n' +
      'from collections import Counter\n\n' +
      'def oversample(labels, seed):\n' +
      '    counts = Counter(labels)\n' +
      '    majority_class, majority_count = counts.most_common(1)[0]\n' +
      '    minority_class = [c for c in counts if c != majority_class][0]\n' +
      '    minority_count = counts[minority_class]\n' +
      '    needed = majority_count - minority_count\n' +
      '    extra = random.Random(seed).choices([minority_class], k=needed)\n' +
      '    return list(labels) + extra\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, ok):\n' +
      '    __results__.append((name, ok))\n\n' +
      'from collections import Counter\n' +
      'labels = ["majority"] * 8 + ["minority"] * 2\n' +
      'result = oversample(labels, seed=7)\n' +
      'counts = Counter(result)\n' +
      "__check__('classes now balanced', counts['majority'] == counts['minority'])\n" +
      "__check__('majority count unchanged', counts['majority'] == 8)\n" +
      "__check__('no majority examples lost', all(l == 'majority' for l in labels if l == 'majority') and result[:10] == labels)\n\n" +
      'for name, ok in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok in __results__ if ok)}/{len(__results__)}")\n',
  },
];
