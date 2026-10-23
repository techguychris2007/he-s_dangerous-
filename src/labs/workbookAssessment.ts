import type { InvestigationQuestion, SiemLabScenario } from './siemTypes';
import { executeSiemQuery } from './siemExecution';

export function workbookProof(scenarioId: string, questionId: string) { return `flag{${scenarioId}_${questionId}}`; }
export function assessWorkbookAnswer(scenario: SiemLabScenario, question: InvestigationQuestion, answer: string) {
  const result = executeSiemQuery(scenario.entries, question.query, 'sentinel');
  if (result.error || result.rows.length !== 1 || result.rows[0][question.column] === undefined) return { passed: false, message: 'This question’s reference data could not be verified. Your progress has not changed.' };
  const expected = result.rows[0][question.column];
  const normalize = (value: unknown) => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  const passed = question.answerType === 'number' ? /^\d+$/.test(answer.trim()) && Number(answer) === Number(expected) : question.answerType === 'timestamp' ? Number.isFinite(Date.parse(answer)) && Date.parse(answer) === Date.parse(String(expected)) : normalize(answer) === normalize(expected);
  return { passed, message: passed ? 'Finding verified against the case records. Continue when you are ready.' : 'That finding does not match the case records. Check the source, filters and complete field value.' };
}
