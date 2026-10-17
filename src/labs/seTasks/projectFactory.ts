import { pf, type ProjectTask } from '../projectTypes';

export interface PythonProjectSpec {
  id: string;
  title: string;
  difficulty: ProjectTask['difficulty'];
  category: string;
  summary: string;
  prompt: string;
  tags: string[];
  hints: string[];
  starter: string;
  solution: string;
  testCode: string;
  fixtures?: string;
}

/** Build Portal projects run in a browser-hosted Python runtime. These projects deliberately use
 *  deterministic fixtures and standard-library-only code: learners practice engineering and agent
 *  control logic without network access, credentials, cloud changes, repository write access, or live
 *  security testing. Hidden tests grade the learner's implementation; reference files remain an
 *  explicit reveal-only aid, consistent with existing Build Portal tasks. */
export function makePythonProject(spec: PythonProjectSpec): ProjectTask {
  const readme = `# ${spec.title}\n\n${spec.summary}\n\n## Your assignment\n\n${spec.prompt}\n\n## Project constraints\n\n- Implement the TODOs in \`project.py\`; keep the documented public function signatures.\n- Use only the supplied fixture data and Python's standard library.\n- Make output deterministic and validate malformed or incomplete records.\n- Do not make network requests, execute generated code, or perform external actions.\n- Run the project checks and explain your design decisions in your own notes.\n`;
  const starterFiles = [
    pf('README.md', readme, { editable: false }),
    pf('project.py', spec.starter),
    ...(spec.fixtures ? [pf('fixtures.json', spec.fixtures, { editable: false })] : []),
    pf('main.py', `from project import run_demo\n\nif __name__ == "__main__":\n    print(run_demo())\n`, { editable: false }),
  ];
  const solutionFiles = [
    pf('README.md', readme, { editable: false }),
    pf('project.py', spec.solution),
    ...(spec.fixtures ? [pf('fixtures.json', spec.fixtures, { editable: false })] : []),
    pf('main.py', `from project import run_demo\n\nif __name__ == "__main__":\n    print(run_demo())\n`, { editable: false }),
  ];
  return {
    id: spec.id,
    title: spec.title,
    difficulty: spec.difficulty,
    language: 'python',
    track: 'backend',
    category: spec.category,
    tags: spec.tags,
    prompt: spec.prompt,
    hints: spec.hints,
    files: starterFiles,
    solutionFiles,
    targets: [{ id: 'main', label: spec.title, kind: 'python', entry: 'main.py', testCode: spec.testCode }],
  };
}
