import type { InvestigationQuestion, SiemEntry, SiemLabScenario } from '../siemTypes';
import { Telemetry, workingDays, at } from './world';

/** Declarative KC7-style casebook. A case is a story, a list of chapters, the attacker's records injected
 *  into ordinary Halcyon Freight working days, and ordered questions. Each question carries the reference
 *  query whose single-row result *is* the answer, so answers are always derived from the data the learner
 *  queries and can never drift from it (see workbookAssessment.ts and check-investigation-workbook.cjs). */

export interface CaseQuestion {
  chapter: string;
  prompt: string;
  /** Short lesson shown with the question — the concept first, then how to apply it. */
  teach: string;
  query: string;
  column: string;
  hint: string;
  type?: InvestigationQuestion['answerType'];
}

export interface CasebookSpec {
  /** New, stable id — never reuse a legacy lab id, so existing learner progress is untouched. */
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  /** Season episode number, used for ordering and the case label. */
  episode: number;
  /** One paragraph: who you are, what was reported, what you must establish. */
  briefing: string;
  /** Real-world incident this case's pattern echoes, if any — shown as context, never as attribution. */
  inspiredBy?: string;
  /** The legacy drill this casebook supersedes in the SOC portal. */
  replaces?: string;
  /** First UTC day of the case window (YYYY-MM-DD). */
  date: string;
  days?: number;
  chapters: { id: string; title: string }[];
  /** Adds the incident's records. `when(day, 'HH:MM')` gives a timestamp inside the case window. */
  inject: (t: Telemetry, when: (day: number, time: string) => string) => void;
  questions: CaseQuestion[];
}

const PROVENANCE = 'Original training telemetry generated deterministically for the fictional company Halcyon Freight. Ordinary working-day activity, benign alerts and routine failures surround the incident records. Domains use the reserved .example TLD and public addresses come from documentation ranges; no real organisation, person or network is represented.';

function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function defineCasebook(spec: CasebookSpec): SiemLabScenario {
  const questions: InvestigationQuestion[] = spec.questions.map((q, i) => ({
    id: `q${String(i + 1).padStart(2, '0')}`,
    chapter: q.chapter,
    prompt: q.prompt,
    teaching: q.teach,
    query: q.query,
    column: q.column,
    hint: q.hint,
    answerType: q.type ?? 'text',
  }));
  let cache: SiemEntry[] | null = null;
  const scenario = {
    id: spec.id,
    title: spec.title,
    difficulty: spec.difficulty,
    tool: 'sentinel',
    datasetLabel: `Halcyon Freight telemetry · ${spec.date}`,
    briefing: spec.briefing + (spec.inspiredBy ? ` Pattern inspired by ${spec.inspiredBy}; every name, system and record here is fictional.` : ''),
    objectives: spec.chapters.map((c) => ({ text: c.title })),
    hints: [],
    totalFlags: questions.length,
    workbook: { version: 1, chapters: spec.chapters, questions, provenance: PROVENANCE },
  } as Omit<SiemLabScenario, 'entries'> as SiemLabScenario;
  // Thousands of records per case: build them only when the case is opened, then keep them.
  Object.defineProperty(scenario, 'entries', {
    enumerable: true,
    get() {
      if (!cache) {
        const t = new Telemetry();
        workingDays(t, seedOf(spec.id), spec.date, spec.days ?? 2);
        spec.inject(t, (day, time) => {
          const d = new Date(Date.parse(spec.date + 'T00:00:00Z') + day * 86_400_000).toISOString().slice(0, 10);
          return at(d, time);
        });
        cache = t.records;
      }
      return cache;
    },
  });
  return Object.assign(scenario, { season: 1, episode: spec.episode, replaces: spec.replaces });
}
