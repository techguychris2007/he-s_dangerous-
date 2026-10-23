/** Shared grader for Software Engineering tasks: `checks` is Python source calling
 *  __check__(name, actual, expected); the footer prints PASS/FAIL lines and the __RESULT__ summary
 *  that the Code Portal parses. A check that raises counts as a failure instead of aborting. */
export function grader(checks: string): string {
  return [
    '__results__ = []',
    'def __check__(name, actual, expected):',
    '    __results__.append((name, actual == expected, actual, expected))',
    'def __raises__(name, fn, exc):',
    '    try:',
    '        fn()',
    '        __results__.append((name, False, "no exception", exc.__name__))',
    '    except exc:',
    '        __results__.append((name, True, exc.__name__, exc.__name__))',
    '    except Exception as e:',
    '        __results__.append((name, False, type(e).__name__, exc.__name__))',
    '',
    // Checks run verbatim through exec so multi-line strings inside them keep their indentation;
    // JSON string syntax is also a valid Python string literal.
    `__checks__ = ${JSON.stringify(checks.trim())}`,
    'try:',
    '    exec(__checks__, globals())',
    'except Exception as __e__:',
    '    __results__.append(("ran without crashing", False, repr(__e__), "no exception"))',
    '',
    'for name, ok, actual, expected in __results__:',
    '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")',
    'print(f"__RESULT__ {sum(1 for _, ok, _, _ in __results__ if ok)}/{len(__results__)}")',
    '',
  ].join('\n');
}
