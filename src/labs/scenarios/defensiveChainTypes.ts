import type { InvestigationStage } from '../investigation';

export interface DefensiveCheckpoint {
  id: string;
  title: string;
  tool: InvestigationStage['tool'];
  briefing: string;
  records: string[];
  /** Record positions needed for the conclusion; omitted for the original two-record checkpoints. */
  requiredRecordIndexes?: number[];
  question: string;
  choices: [string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface DefensiveChain {
  title: string;
  briefing: string;
  context: string;
  sources: { title: string; url: string }[];
  checkpoints: DefensiveCheckpoint[];
}
