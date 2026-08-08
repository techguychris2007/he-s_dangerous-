import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Grid Operations

A fixed-width 2D array (\`int grid[][3]\`) — the C++ way to represent a small matrix or game board.
Sum every cell, and find the maximum value in each row.
`;

const SOLUTION_CPP_STARTER = `int gridSum(int grid[][3], int rows) {
    // TODO: return the sum of every cell in grid (rows rows, 3 columns each).
    return 0;
}

void rowMax(int grid[][3], int rows, int* outMaxes) {
    // TODO: fill outMaxes[i] with the maximum value in row i of grid, for each of the rows rows.
    // outMaxes must already have space for that many ints.
}
`;

const SOLUTION_CPP_SOLUTION = `int gridSum(int grid[][3], int rows) {
    int total = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < 3; c++) {
            total += grid[r][c];
        }
    }
    return total;
}

void rowMax(int grid[][3], int rows, int* outMaxes) {
    for (int r = 0; r < rows; r++) {
        int best = grid[r][0];
        for (int c = 1; c < 3; c++) {
            if (grid[r][c] > best) best = grid[r][c];
        }
        outMaxes[r] = best;
    }
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
    cout << "sum: " << gridSum(grid, 2) << endl;
    int maxes[2];
    rowMax(grid, 2, maxes);
    cout << "row maxes: " << maxes[0] << " " << maxes[1] << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
    total++;
    if (gridSum(grid, 2) == 21) { passed++; cout << "[PASS] sums a 2x3 grid" << endl; }
    else { cout << "[FAIL] sums a 2x3 grid: got " << gridSum(grid, 2) << ", expected 21" << endl; }

    int grid2[1][3];
    grid2[0][0] = 5; grid2[0][1] = 5; grid2[0][2] = 5;
    total++;
    if (gridSum(grid2, 1) == 15) { passed++; cout << "[PASS] sums a single-row grid" << endl; }
    else { cout << "[FAIL] sums a single-row grid" << endl; }

    int maxes[2];
    rowMax(grid, 2, maxes);
    total++;
    if (maxes[0] == 3 && maxes[1] == 6) { passed++; cout << "[PASS] finds each row's max" << endl; }
    else { cout << "[FAIL] finds each row's max: got " << maxes[0] << " " << maxes[1] << endl; }

    int grid3[3][3] = {{9, 1, 2}, {3, 9, 4}, {5, 6, 9}};
    int maxes3[3];
    rowMax(grid3, 3, maxes3);
    total++;
    if (maxes3[0] == 9 && maxes3[1] == 9 && maxes3[2] == 9) {
        passed++; cout << "[PASS] handles the max in any column position" << endl;
    } else {
        cout << "[FAIL] handles the max in any column position: got " << maxes3[0] << " " << maxes3[1] << " " << maxes3[2] << endl;
    }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-013',
  title: 'Grid Operations',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Multi-Dimensional Arrays',
  tags: ['2d-arrays', 'grids'],
  prompt: 'Sum every cell in a fixed-width 2D array and find the maximum value in each row — the C++ way to work with a small matrix or game board.',
  hints: [
    'A 2D array needs nested loops: outer `for (int r = 0; r < rows; r++)`, inner `for (int c = 0; c < 3; c++)` — `grid[r][c]` reads one cell.',
    '`gridSum` just accumulates every cell it visits in the nested loop.',
    'For `rowMax`, start `best` at `grid[r][0]` (the first column), then compare columns 1 and 2 against it — that avoids needing a sentinel value like -infinity.',
    "`outMaxes[r] = best;` writes each row's answer into the output array at the matching row index — the function signature already declares `outMaxes` has room for `rows` ints.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('solution.cpp', SOLUTION_CPP_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('solution.cpp', SOLUTION_CPP_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Grid Operations', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
