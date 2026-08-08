export type CodeLanguage = 'python' | 'cpp' | 'javascript';
export type CodeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface CodeTask {
  id: string;
  title: string;
  difficulty: CodeDifficulty;
  language: CodeLanguage;
  /** groups tasks within a language's catalog, e.g. "Fundamentals", "Cryptography & Encoding", "OOP", "Advanced" */
  category: string;
  /** the problem statement — what the learner needs to implement and why it matters for security work */
  prompt: string;
  /** pre-filled editor contents: imports, function/class signatures with a `pass`/TODO body */
  starterCode: string;
  /** progressive nudges, revealed one at a time */
  hints: string[];
  /** a full reference implementation — revealed on demand, never run automatically */
  solution: string;
  /** appended after the learner's code and executed together; calls their function(s)/class(es)
   *  with fixed inputs and prints a PASS/FAIL report line per case, ending in an "N/M tests passed" summary */
  testCode: string;
}
