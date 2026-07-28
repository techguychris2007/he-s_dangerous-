# Code Portal

C++ and JavaScript programming practice — separate from the [`ml-portal`](../ml-portal),
which is Python-based and follows the GCI World course content. This portal is
just for general coding practice in both languages.

## How to practice

1. Pick an exercise folder under `exercises/`, e.g. `exercises/01-sum-array/`, and
   read `problem.md`.
2. Copy the starter file to a `solution` file in the same language folder and edit it:
   ```powershell
   Copy-Item exercises\01-sum-array\cpp\starter.cpp exercises\01-sum-array\cpp\solution.cpp
   Copy-Item exercises\01-sum-array\js\starter.js exercises\01-sum-array\js\solution.js
   ```
3. Check your answer:
   ```powershell
   node check.js 01-sum-array cpp
   node check.js 01-sum-array js
   ```
   The checker runs your program against each test case in `tests.json` and
   reports pass/fail with the expected vs. actual output on failure.

C++ checks compile your `solution.cpp` first (needs `g++` or MSVC `cl.exe` —
same requirement and install instructions as any C++ toolchain; the checker
prints exact `winget install` commands if neither is found). JS checks just
run `node solution.js` directly, no build step.

## Exercises

| # | Exercise | Topic |
|---|----------|-------|
| 01 | `sum-array` | reading input, loops, accumulation |
| 02 | `reverse-string` | strings |
| 03 | `fizzbuzz` | conditionals, modulo |

Both languages solve the same problems so you can compare the same logic
across C++ and JavaScript.

## Adding a new exercise

Create `exercises/<id>/problem.md`, `exercises/<id>/tests.json` (array of
`{ "input": "...", "expected": "..." }`), and starter files at
`exercises/<id>/cpp/starter.cpp` / `exercises/<id>/js/starter.js`. Output
comparison trims trailing whitespace per line and leading/trailing blank
lines, so exact spacing elsewhere still matters.

## Reference solutions

`solutions/` holds one worked solution per exercise in both languages —
useful if you get stuck, but try the exercise yourself first.
