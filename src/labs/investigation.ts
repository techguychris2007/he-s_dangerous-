import type { SiemEntry, SiemTool } from './siemTypes';

export interface InvestigationStage {
  id: string;
  title: string;
  tool: Extract<SiemTool, 'splunk' | 'sentinel' | 'elastic'>;
  briefing: string;
  question: string;
  choices: string[];
  correctIndex: number;
  availableEvidence: string[];
  requiredEvidence: string[];
  hint: string;
  explanation: string;
  proof: string;
}
export interface InvestigationCase {
  context: string;
  reconstruction: string;
  sources: { title: string; url: string }[];
  stages: InvestigationStage[];
}
export interface InvestigationEvidence extends SiemEntry { evidenceId: string }

export function assessInvestigationStage(investigation: InvestigationCase, stageId: string, completed: readonly string[], observed: readonly string[], selected: readonly string[], choice: number | null) {
  const index = investigation.stages.findIndex(stage => stage.id === stageId);
  const stage = investigation.stages[index];
  if (!stage) return { passed: false, message: 'This checkpoint is unavailable.' };
  if (investigation.stages.slice(0, index).some(previous => !completed.includes(previous.proof))) return { passed: false, message: 'Complete the earlier checkpoints before submitting this decision.' };
  if (choice === null) return { passed: false, message: 'Choose the conclusion supported by your evidence.' };
  if (!selected.length) return { passed: false, message: 'Run a search, then select the records that support your conclusion.' };
  if (selected.some(id => !observed.includes(id) || !stage.availableEvidence.includes(id))) return { passed: false, message: 'Inspect every selected record in this checkpoint’s console before submitting.' };
  const selectedSet = new Set(selected);
  if (selectedSet.size !== stage.requiredEvidence.length || stage.requiredEvidence.some(id => !selectedSet.has(id))) return { passed: false, message: 'Your evidence set is incomplete or includes an unrelated record. Correlate the source, identity, host and time before trying again.' };
  if (choice !== stage.correctIndex) return { passed: false, message: 'Those records do not support that conclusion. Review the event outcomes and the limits of each source.' };
  return { passed: true, message: stage.explanation, proof: stage.proof };
}
