import type { CodeTask } from '../codeTypes';

export const ML_MLOPS_TASKS: CodeTask[] = [
  {
    id: 'ml-ops-01',
    title: 'Group-By in Plain Python',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Engineering & MLOps',
    prompt:
      "Write total_spent_by_customer(orders, cutoff_date) mirroring the lesson's SQL query in plain " +
      "Python: from a list of {'customer_id', 'amount', 'order_date'} dicts, keep only orders with " +
      "order_date >= cutoff_date (plain string comparison works for 'YYYY-MM-DD' dates), sum amount per " +
      'customer_id, and return a list of (customer_id, total) tuples sorted by total descending.',
    starterCode:
      'def total_spent_by_customer(orders, cutoff_date):\n' +
      '    # TODO: filter by date, group by customer_id, sum amount, sort descending by total\n' +
      '    pass\n',
    hints: [
      'Filter first: recent = [o for o in orders if o["order_date"] >= cutoff_date] — string comparison works for ISO dates.',
      'Accumulate totals in a dict: totals[o["customer_id"]] = totals.get(o["customer_id"], 0) + o["amount"].',
      'sorted(totals.items(), key=lambda pair: pair[1], reverse=True) gives the final sorted list of tuples.',
    ],
    solution:
      'def total_spent_by_customer(orders, cutoff_date):\n' +
      '    recent = [o for o in orders if o["order_date"] >= cutoff_date]\n' +
      '    totals = {}\n' +
      '    for o in recent:\n' +
      '        totals[o["customer_id"]] = totals.get(o["customer_id"], 0) + o["amount"]\n' +
      '    return sorted(totals.items(), key=lambda pair: pair[1], reverse=True)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'orders = [\n' +
      '    {"customer_id": "A", "amount": 100, "order_date": "2026-01-05"},\n' +
      '    {"customer_id": "B", "amount": 50, "order_date": "2026-01-10"},\n' +
      '    {"customer_id": "A", "amount": 30, "order_date": "2026-01-15"},\n' +
      '    {"customer_id": "C", "amount": 200, "order_date": "2025-12-01"},\n' +
      ']\n' +
      '__check__("basic", total_spent_by_customer(orders, "2026-01-01"), [("A", 130), ("B", 50)])\n' +
      '__check__("cutoff excludes everything", total_spent_by_customer(orders, "2027-01-01"), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-ops-02',
    title: 'Validate an API Request',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Data Engineering & MLOps',
    prompt:
      'Write validate_request(payload, required_fields) that returns True only if every field in ' +
      'required_fields is present in the payload dict and its value is an int or float (not a string, ' +
      'None, or missing) — the basic input validation a model-serving endpoint needs before ever calling ' +
      'model.predict().',
    starterCode:
      'def validate_request(payload, required_fields):\n' +
      '    # TODO: return True only if every required field is present and numeric\n' +
      '    pass\n',
    hints: [
      'Loop over required_fields and check each one is present: field in payload.',
      'Check the type with isinstance(payload[field], (int, float)) — note that in Python, bool is technically a subclass of int, but you can ignore that edge case here.',
      'Return False as soon as any field fails either check; return True only if every field passes.',
    ],
    solution:
      'def validate_request(payload, required_fields):\n' +
      '    for field in required_fields:\n' +
      '        if field not in payload:\n' +
      '            return False\n' +
      '        if not isinstance(payload[field], (int, float)):\n' +
      '            return False\n' +
      '    return True\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      "fields = ['age', 'income']\n" +
      "__check__('valid', validate_request({'age': 30, 'income': 50000.0}, fields), True)\n" +
      "__check__('missing field', validate_request({'age': 30}, fields), False)\n" +
      "__check__('wrong type', validate_request({'age': '30', 'income': 50000}, fields), False)\n" +
      "__check__('extra fields are fine', validate_request({'age': 30, 'income': 50000, 'extra': 'x'}, fields), True)\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-ops-03',
    title: 'Per-Group Accuracy Audit',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Engineering & MLOps',
    prompt:
      'Write group_accuracy(y_true, y_pred, groups) where groups[i] labels which subgroup example i ' +
      'belongs to. Return a dict mapping each distinct group to the model\'s accuracy on just that ' +
      "subgroup — the basic fairness audit that overall accuracy alone can hide.",
    starterCode:
      'def group_accuracy(y_true, y_pred, groups):\n' +
      '    # TODO: return {group: accuracy on just that subgroup}\n' +
      '    pass\n',
    hints: [
      'Get the distinct groups first: set(groups).',
      'For each group, gather the indices belonging to it, or just filter (yt, yp) pairs where the matching group label equals that group.',
      'Accuracy for a subgroup is (number correct) / (number of examples in that subgroup).',
    ],
    solution:
      'def group_accuracy(y_true, y_pred, groups):\n' +
      '    result = {}\n' +
      '    for g in set(groups):\n' +
      '        pairs = [(yt, yp) for yt, yp, grp in zip(y_true, y_pred, groups) if grp == g]\n' +
      '        correct = sum(1 for yt, yp in pairs if yt == yp)\n' +
      '        result[g] = correct / len(pairs)\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(actual[k] - expected[k]) < 1e-9 for k in expected) and set(actual) == set(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'y_true =  [1, 1, 0, 0, 1, 0]\n' +
      'y_pred =  [1, 0, 0, 0, 1, 1]\n' +
      'groups = ["a", "a", "a", "b", "b", "b"]\n' +
      "__check__('basic', group_accuracy(y_true, y_pred, groups), {'a': 2/3, 'b': 2/3})\n\n" +
      "__check__('perfect group', group_accuracy([1, 0], [1, 0], ['x', 'x']), {'x': 1.0})\n\n" +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-ops-04',
    title: 'Validate a Three-Way Data Split',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Engineering & MLOps',
    prompt:
      'Write is_valid_split(train_ids, val_ids, test_ids, all_ids) that returns True only if the three ' +
      'splits are pairwise disjoint (no id appears in more than one split) and their union equals exactly ' +
      'the full set of all_ids (nothing missing, nothing extra) — the sanity check every pipeline should ' +
      'run right after splitting data.',
    starterCode:
      'def is_valid_split(train_ids, val_ids, test_ids, all_ids):\n' +
      '    # TODO: return True only if the three splits are disjoint and their union equals all_ids\n' +
      '    pass\n',
    hints: [
      'Convert each list to a set first — set operations make disjointness and union checks trivial.',
      'Pairwise disjoint means every pair of the three sets has an empty intersection: use .isdisjoint().',
      'The union check is train_set | val_set | test_set == set(all_ids).',
    ],
    solution:
      'def is_valid_split(train_ids, val_ids, test_ids, all_ids):\n' +
      '    train_set, val_set, test_set = set(train_ids), set(val_ids), set(test_ids)\n' +
      '    disjoint = (\n' +
      '        train_set.isdisjoint(val_set)\n' +
      '        and train_set.isdisjoint(test_set)\n' +
      '        and val_set.isdisjoint(test_set)\n' +
      '    )\n' +
      '    complete = (train_set | val_set | test_set) == set(all_ids)\n' +
      '    return disjoint and complete\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      'all_ids = list(range(10))\n' +
      '__check__("valid split", is_valid_split([0,1,2,3,4,5], [6,7], [8,9], all_ids), True)\n' +
      '__check__("overlap between splits", is_valid_split([0,1,2,3,4,5,6], [6,7], [8,9], all_ids), False)\n' +
      '__check__("missing an id", is_valid_split([0,1,2,3], [6,7], [8,9], all_ids), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-ops-05',
    title: 'A Simple Drift Detector',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Data Engineering & MLOps',
    prompt:
      'Write detect_drift(baseline_mean, baseline_std, new_values, threshold) that returns True if the ' +
      'mean of new_values differs from baseline_mean by more than threshold * baseline_std — a simple ' +
      "z-score-style check for whether a new batch of production data looks like it's drifted away from " +
      'what the model was trained on.',
    starterCode:
      'def detect_drift(baseline_mean, baseline_std, new_values, threshold):\n' +
      '    # TODO: return True if the new batch mean is more than threshold * baseline_std away from baseline_mean\n' +
      '    pass\n',
    hints: [
      'Compute the mean of new_values: sum(new_values) / len(new_values).',
      'Compare the absolute difference from baseline_mean: abs(new_mean - baseline_mean).',
      'Drift is flagged when that difference exceeds threshold * baseline_std.',
    ],
    solution:
      'def detect_drift(baseline_mean, baseline_std, new_values, threshold):\n' +
      '    new_mean = sum(new_values) / len(new_values)\n' +
      '    return abs(new_mean - baseline_mean) > threshold * baseline_std\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("no drift", detect_drift(100, 10, [98, 101, 99, 102], 2), False)\n' +
      '__check__("clear drift", detect_drift(100, 10, [150, 148, 152], 2), True)\n' +
      '__check__("borderline stays under threshold", detect_drift(0, 1, [1, 1, 1], 2), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
