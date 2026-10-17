import type { LabScenario } from '../labs/types';

export interface ReportLabEntry {
  slug: string;
  scenario: Pick<LabScenario, 'id' | 'title' | 'category' | 'difficulty' | 'totalFlags' | 'briefing' | 'objectives'>;
}
type LabEntry = ReportLabEntry;

export const CATEGORY_HASHTAGS: Record<string, string[]> = {
  Linux: ['LinuxSecurity', 'PrivilegeEscalation'], Network: ['NetworkSecurity'],
  Web: ['WebSecurity', 'AppSec'], 'Active Directory': ['ActiveDirectory', 'IdentitySecurity'],
  'Bug Bounty': ['BugBounty'], Cloud: ['CloudSecurity'], SOC: ['BlueTeam', 'SOC'],
  Forensics: ['DFIR', 'DigitalForensics'], 'Security+': ['SecurityPlus', 'GRC'],
  'Binary Analysis': ['ReverseEngineering'], Malware: ['MalwareAnalysis'],
  'Security Engineering': ['SecurityEngineering', 'AppSec'],
};

export type FindingSeverity = 'Informational' | 'Low' | 'Medium' | 'High' | 'Critical';
export interface LabFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  affectedAsset: string;
  evidence: string;
  impact: string;
  remediation: string;
  retest: string;
}

export interface LabReportEvidence {
  executiveSummary: string;
  scope: string;
  methodology: string;
  findings: LabFinding[];
  cleanup: string;
  reflection: string;
}

export const EMPTY_REPORT: LabReportEvidence = {
  executiveSummary: '', scope: '', methodology: '', findings: [], cleanup: '', reflection: '',
};

export interface LabWriteupOptions {
  learnerName?: string | null;
  labsCompletedTotal?: number;
  labsInModuleTotal?: number;
  moduleTitle?: string;
  /** Completion timestamp from progress, never the export timestamp. */
  completedAt?: number;
  capturedFlags?: number;
  evidence?: LabReportEvidence;
}

export interface LabWriteup {
  linkedin: string;
  twitter: string;
  markdown: string;
  hashtags: string[];
}

export function completionDate(value?: number): string {
  if (!value || !Number.isFinite(value) || Number.isNaN(new Date(value).getTime())) return 'Not recorded';
  return new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Stable display reference, not a signature or a credential verification token. */
export function labRecordReference(entry: LabEntry, opts: LabWriteupOptions): string {
  const seed = `${opts.learnerName ?? 'Learner'}|${entry.scenario.id}|${opts.completedAt ?? 'undated'}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0;
  return `DW-${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function completionStatus(entry: LabEntry, opts: LabWriteupOptions): { count: number; complete: boolean } {
  const count = Number.isFinite(opts.capturedFlags) ? Math.min(entry.scenario.totalFlags, Math.max(0, Math.floor(opts.capturedFlags!))) : 0;
  return { count, complete: entry.scenario.totalFlags > 0 && count >= entry.scenario.totalFlags };
}

/** Scenario objectives describe the exercise, never automatically become findings or claims. */
export function buildLabWriteup(entry: LabEntry, opts: LabWriteupOptions = {}): LabWriteup {
  const { scenario } = entry;
  const report = opts.evidence ?? EMPTY_REPORT;
  const { count, complete } = completionStatus(entry, opts);
  const hashtags = ['CyberSecurity', 'DarkWorld', ...(CATEGORY_HASHTAGS[scenario.category] ?? ['InfoSec'])];
  const describe = (value: string) => value.trim() || '_Not documented by the learner._';
  const outcome = complete ? 'Completed' : 'Practiced';
  const objectiveTexts = scenario.objectives
    .slice(0, 3)
    .map((objective) => (typeof objective === 'string' ? objective : objective.text).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const categoryLabel = scenario.category;
  const difficultySentence = scenario.difficulty.toLowerCase();
  const article = /^[aeiou]/i.test(difficultySentence) ? 'an' : 'a';
  const documentedFindings = report.findings.filter((finding) =>
    [finding.title, finding.evidence, finding.impact, finding.remediation].some((value) => value.trim()),
  );
  const skillsPracticed = [
    `${categoryLabel} concept practice`,
    'Evidence handling',
    'Lab boundary discipline',
    complete ? 'Completion validation' : 'Progress tracking',
  ];
  const scopeSummary = report.scope.trim() || `This was a controlled DarkWorld simulation focused on ${categoryLabel} skills. No real external systems were targeted.`;
  const methodologySummary = report.methodology.trim() || (objectiveTexts.length
    ? `I worked through the guided objectives, validated observations against the simulated environment, and recorded proof points only when the lab accepted the evidence.\n\nKey focus areas:\n${objectiveTexts.map((objective) => `• ${objective}`).join('\n')}`
    : 'I worked through the guided objectives, validated observations against the simulated environment, and recorded proof points only when the lab accepted the evidence.');
  const learningSummary = report.reflection.trim() || `This exercise strengthened my practical process for ${categoryLabel} analysis: read the lab boundary, test carefully, verify evidence, and separate confirmed results from assumptions.`;
  const findingSummary = documentedFindings.length
    ? documentedFindings.slice(0, 3).map((finding, index) => `${index + 1}. ${finding.title.trim() || 'Documented finding'}${finding.severity ? ` (${finding.severity})` : ''}`).join('\n')
    : complete
      ? 'Detailed evidence notes were kept in my notebook. For this public update, I am sharing the learning outcome and the controlled scope rather than sensitive-looking technical claims.'
      : 'This is an in-progress learning update. I am still collecting evidence before turning observations into clearer evidence notes.';
  const nextStep = complete
    ? 'My next step is to repeat the workflow in a related lab and compare how the same evidence process changes across different environments.'
    : 'My next step is to finish the remaining proof points, then turn the evidence into a cleaner evidence note.';
  const linkedin = [
    `${outcome} a DarkWorld cybersecurity lab: ${scenario.title}`,
    '',
    `I worked through ${article} ${difficultySentence} ${categoryLabel} scenario on DarkWorld, focused on building practical, evidence-led security habits in a safe simulated environment.`,
    '',
    `Progress: ${count}/${scenario.totalFlags} proof point${scenario.totalFlags === 1 ? '' : 's'}${complete ? ' captured' : ' recorded so far'} | Recorded completion: ${completionDate(opts.completedAt)}`,
    '',
    'Why this lab mattered',
    report.executiveSummary.trim() || `This exercise was useful because it forced me to slow down, validate each step, and explain what the evidence supports instead of treating the final flag as the whole story.`,
    '',
    'Scope and boundaries',
    scopeSummary,
    '',
    'How I approached it',
    methodologySummary,
    '',
    'Skills practiced',
    skillsPracticed.map((skill) => `• ${skill}`).join('\n'),
    '',
    'Evidence notes',
    findingSummary,
    '',
    'Reflection and next step',
    learningSummary,
    '',
    nextStep,
    '',
    'This post reflects controlled training practice. It is a portfolio note about learning progress, not a claim of authorization to test real systems or an independent professional certification.',
    ...(opts.labsCompletedTotal ? [`${opts.labsCompletedTotal} training labs completed in my learning record.`] : []),
    '',
    hashtags.map((tag) => `#${tag}`).join(' '),
  ].join('\n');
  const suffix = ` | ${count}/${scenario.totalFlags} flags in a simulated lab. #DarkWorld #CyberSecurity`;
  const prefix = `${outcome}: ${scenario.title}`;
  const budget = 280 - suffix.length;
  const twitter = `${prefix.length > budget ? prefix.slice(0, budget - 3) + '...' : prefix}${suffix}`;
  const findings = report.findings.length ? report.findings.flatMap((finding, index) => [
    `### F-${String(index + 1).padStart(2, '0')}: ${finding.title.trim() || 'Untitled finding'}`,
    `**Severity (learner assessed):** ${finding.severity}`, `**Affected asset:** ${finding.affectedAsset.trim() || 'Not documented'}`,
    '', '**Evidence and reproduction**', describe(finding.evidence),
    '', '**Observed impact**', describe(finding.impact),
    '', '**Concept takeaway**', describe(finding.remediation),
    '', '**What I would verify next**', describe(finding.retest), '',
  ]) : ['No learner-authored findings have been added.', ''];
  const markdown = [
    `# ${scenario.title}`, '', '## Training evidence notes',
    `**Prepared by:** ${opts.learnerName?.trim() || 'Learner'}`,
    `**Reference:** ${labRecordReference(entry, opts)}`,
    `**Category:** ${scenario.category} | **Difficulty:** ${scenario.difficulty}`,
    `**Recorded completion (UTC):** ${completionDate(opts.completedAt)}`,
    `**Progress:** ${count}/${scenario.totalFlags} flags | ${complete ? 'Complete in learning record' : 'In progress'}`, '',
    '## 1. Executive summary', describe(report.executiveSummary), '',
    '## 2. Lab boundary and limitations', describe(report.scope), '',
    'All targets are part of the DarkWorld simulation. These notes do not establish authorization for external systems.', '',
    '## 3. Steps followed and evidence', describe(report.methodology), '',
    '## 4. Concept evidence and supporting observations', ...findings,
    '## 5. Notes to remember', describe(report.cleanup), '',
    '## 6. Reflection and next steps', describe(report.reflection), '',
    '## Appendix A. Exercise briefing', scenario.briefing, '',
    '### Intended learning objectives',
    ...scenario.objectives.map((objective, index) => `${index + 1}. ${typeof objective === 'string' ? objective : objective.text}`), '',
    '## Record provenance',
    'Flag counts and completion dates come from the learner\'s saved progress and can be edited locally. Findings and evidence are learner-authored. Objectives describe the exercise; they do not prove specific actions were performed. This is a portfolio training note, not an independently verified assessment or professional certification.', '',
  ].join('\n');
  return { linkedin, twitter, markdown, hashtags };
}
