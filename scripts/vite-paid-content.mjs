// Vite plugin for production builds: keeps Pro and Max content out of the public bundle.
//  * src/data/labScenarios.ts becomes the generated catalogue (paid labs are stubs), so none of the
//    scenario packs, with their hosts, files and flags, are bundled.
//  * Source files holding only paid lesson bodies become an empty component.
//  * Paid lessons defined as data lose their body, quiz and questions; depth notes and question-bank
//    entries keyed by a paid lesson id are removed.
// The full content is published separately (scripts/publish-paid-content.cjs) and downloaded by
// accounts whose plan includes it (src/lib/paidContent.ts). scripts/check-paid-build.cjs then
// proves no paid flag or lesson text reached dist/.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const LESSON_DATA_FIELDS = {
  introduction: "''",
  sections: '[]',
  toolWorkflow: '[]',
  readinessChecklist: '[]',
  table: "{ headers: ['', '', ''], rows: [] }",
  exercise: "{ scenario: '', task: '', answer: '', evidence: '' }",
  misconceptions: '[]',
  sources: '[]',
  quiz: '[]',
  questions: 'undefined',
  keyTerms: 'undefined',
};
const LESSON_META_FIELDS = { quiz: '[]', questions: 'undefined', keyTerms: 'undefined' };
// Defensive case records (src/data/defensiveCurriculum.tsx) that are turned into lessons later.
const LESSON_CASE_FIELDS = { paragraphs: "['', '', '']", scenario: "''", task: "''", answer: "''", question: "''", choices: '[]' };

const nameOf = property => property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined;

/** Returns the edited source, or undefined when the file has nothing paid in it. */
export function stripPaidLessons(code, file, paidIds, { removeKeyed }) {
  if (![...paidIds].some(id => code.includes(id))) return undefined;
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const visit = node => {
    if (removeKeyed && ts.isPropertyAssignment(node) && paidIds.has(nameOf(node))) {
      let end = node.end;
      const after = /^\s*,/.exec(code.slice(end));
      if (after) end += after[0].length;
      edits.push([node.getStart(source), end, '']);
      return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      const props = node.properties.filter(ts.isPropertyAssignment);
      const idProp = props.find(prop => nameOf(prop) === 'id' && ts.isStringLiteralLike(prop.initializer));
      if (idProp && paidIds.has(idProp.initializer.text)) {
        const names = new Set(props.map(nameOf));
        const fields = names.has('Content') ? LESSON_META_FIELDS
          : (names.has('sections') || names.has('introduction')) ? LESSON_DATA_FIELDS
          : (names.has('paragraphs') && names.has('scenario')) ? LESSON_CASE_FIELDS
          : undefined;
        if (fields) {
          for (const prop of props) {
            const replacement = fields[nameOf(prop)];
            if (replacement !== undefined) edits.push([prop.initializer.getStart(source), prop.initializer.end, replacement]);
          }
          edits.push([idProp.end, idProp.end, ', locked: true']);
          // Other properties (title, summary, labs…) are public; nothing inside needs visiting.
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!edits.length) return undefined;
  edits.sort((a, b) => b[0] - a[0]);
  let out = code;
  for (const [start, end, text] of edits) out = out.slice(0, start) + text + out.slice(end);
  return out;
}

export default function paidContentPlugin({ root, enabled }) {
  let data;
  let lessonFiles;
  let paidIds;
  const scenarios = path.join(root, 'src/data/labScenarios.ts');
  const keyed = [path.join(root, 'src/content/depth') + path.sep, path.join(root, 'src/data/questionBank') + path.sep];
  return {
    name: 'darkworld-paid-content',
    apply: 'build',
    enforce: 'pre',
    buildStart() {
      if (!enabled) { this.info?.('paid content: paid plans are off (VITE_PAID_PLANS), every lesson and lab stays in the bundle'); return; }
      const out = path.join(root, 'node_modules/.cache/darkworld/public-content.json');
      execFileSync(process.execPath, [path.join(root, 'scripts/build-public-content.cjs'), out], { stdio: ['ignore', 'ignore', 'inherit'] });
      data = JSON.parse(fs.readFileSync(out, 'utf8'));
      lessonFiles = new Set(data.lessonFiles.map(file => path.normalize(file)));
      paidIds = new Set(data.lessonIds);
      const locked = data.labs.filter(entry => entry.scenario.locked).length;
      this.info?.(`paid content: ${locked} labs and ${paidIds.size} lessons kept out of the public bundle`);
    },
    load(id) {
      if (!enabled) return null;
      const file = path.normalize(id.split('?')[0]);
      if (file === scenarios) return `export const LAB_ENTRIES = JSON.parse(${JSON.stringify(JSON.stringify(data.labs))});`;
      if (lessonFiles.has(file)) return 'export default function LockedLesson() { return null; }';
      return null;
    },
    transform(code, id) {
      if (!enabled) return null;
      const file = path.normalize(id.split('?')[0]);
      if (!/\.(ts|tsx)$/.test(file) || !file.startsWith(path.join(root, 'src') + path.sep)) return null;
      const out = stripPaidLessons(code, file, paidIds, { removeKeyed: keyed.some(dir => file.startsWith(dir)) });
      return out === undefined ? null : { code: out, map: null };
    },
    // Tells scripts/check-paid-build.cjs which kind of build this is.
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'paid-content-build.json', source: JSON.stringify({ paidPlans: Boolean(enabled) }) });
    },
  };
}
