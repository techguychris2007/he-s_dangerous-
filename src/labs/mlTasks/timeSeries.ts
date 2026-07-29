import type { CodeTask } from '../codeTypes';

export const ML_TIME_SERIES_TASKS: CodeTask[] = [
  {
    id: 'ml-ts-01',
    title: 'Moving Average Trend',
    difficulty: 'Medium',
    language: 'python',
    category: 'ML: Time Series',
    prompt:
      'Write moving_average(series, window) that returns the trailing moving average: for every index i ' +
      'from window-1 to the end of series, the average of series[i-window+1 : i+1]. The result should ' +
      'have len(series) - window + 1 elements — one classic way to estimate a time series\' trend.',
    starterCode:
      'def moving_average(series, window):\n' +
      '    # TODO: return the trailing moving average, one value per valid window position\n' +
      '    pass\n',
    hints: [
      'The first valid window ends at index window - 1; the last valid window ends at the last index of series.',
      'For each end index i, the window is series[i - window + 1 : i + 1].',
      'sum(...) / window computes the average of one window; loop over every valid end index to build the result list.',
    ],
    solution:
      'def moving_average(series, window):\n' +
      '    result = []\n' +
      '    for i in range(window - 1, len(series)):\n' +
      '        chunk = series[i - window + 1 : i + 1]\n' +
      '        result.append(sum(chunk) / window)\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = all(abs(a - b) < 1e-9 for a, b in zip(actual, expected)) and len(actual) == len(expected)\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("window 3", moving_average([1, 2, 3, 4, 5], 3), [2.0, 3.0, 4.0])\n' +
      '__check__("window equals length", moving_average([10, 20, 30], 3), [20.0])\n' +
      '__check__("window 1 returns series unchanged", moving_average([5, 6, 7], 1), [5.0, 6.0, 7.0])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'ml-ts-02',
    title: 'Differencing a Series',
    difficulty: 'Easy',
    language: 'python',
    category: 'ML: Time Series',
    prompt:
      'Write difference(series) that returns the first difference of a series: [series[1] - series[0], ' +
      'series[2] - series[1], ...] — one shorter than the input. This is the "I" (Integrated) step in ' +
      'ARIMA, used to remove trend and make a series stationary before modeling.',
    starterCode:
      'def difference(series):\n' +
      '    # TODO: return [series[i] - series[i-1] for i in 1..len(series)-1]\n' +
      '    pass\n',
    hints: [
      'The result has exactly one fewer element than the input.',
      'For each i starting at 1, the differenced value is series[i] - series[i - 1].',
      'A list comprehension over range(1, len(series)) covers every valid i.',
    ],
    solution:
      'def difference(series):\n' +
      '    return [series[i] - series[i - 1] for i in range(1, len(series))]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    ok = actual == expected\n' +
      '    __results__.append((name, ok, actual, expected))\n\n' +
      '__check__("linear trend", difference([1, 3, 5, 7]), [2, 2, 2])\n' +
      '__check__("constant series", difference([5, 5, 5]), [0, 0])\n' +
      '__check__("decreasing", difference([10, 7, 3]), [-3, -4])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
