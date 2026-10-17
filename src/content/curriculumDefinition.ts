import { createElement } from 'react';
import type { ModuleMeta, QuizQuestion } from '../types';
import CurriculumArticle from './CurriculumArticle';

export interface CurriculumLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  prerequisite: string;
  outcomes: string[];
  introduction: string;
  sections: { title: string; paragraphs: string[]; code?: string; label?: string }[];
  toolWorkflow?: { tool: string; when: string; actions: string[]; evidence: string }[];
  keyTerms?: { term: string; meaning: string }[];
  readinessChecklist?: string[];
  table: { headers: [string, string, string]; rows: [string, string, string][] };
  exercise: { scenario: string; task: string; answer: string; evidence: string };
  misconceptions: string[];
  sources: { title: string; url: string }[];
  labs: string[];
  quiz: (Omit<QuizQuestion, 'id'> | { question: string; options: string[]; answer: number; explanation?: string })[];
}


export function curriculumModule(meta: Omit<ModuleMeta, 'lessons' | 'status'>, lessons: CurriculumLesson[]): ModuleMeta {
  return { ...meta, status: 'available', lessons: lessons.map(lesson => ({
    id: lesson.id, slug: lesson.slug, title: lesson.title, summary: lesson.summary, minutes: lesson.minutes,
    objectives: lesson.outcomes, prerequisite: lesson.prerequisite,
    Content: () => createElement(CurriculumArticle, { lesson }),
    quiz: lesson.quiz.map((question, index) => 'prompt' in question
      ? { ...question, id: `${lesson.id}-q${index + 1}` }
      : {
        id: `${lesson.id}-q${index + 1}`,
        prompt: question.question,
        choices: question.options,
        correctIndex: question.answer,
        explanation: question.explanation ?? question.options[question.answer],
      }),
  })) };
}

export const primarySources = {
  http: { title: 'MDN â€” HTTP overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview' },
  python: { title: 'Python â€” official tutorial', url: 'https://docs.python.org/3/tutorial/' },
  bash: { title: 'GNU â€” Bash reference manual', url: 'https://www.gnu.org/software/bash/manual/bash.html' },
  powershell: { title: 'Microsoft â€” PowerShell 101', url: 'https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/00-introduction' },
  testing: { title: 'NIST SP 800-115 â€” security testing and assessment', url: 'https://csrc.nist.gov/pubs/sp/800/115/final' },
  authorization: { title: 'OWASP â€” Authorization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
  ir: { title: 'NIST SP 800-61 Rev. 3 â€” incident response and risk management', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final' },
  csf: { title: 'NIST â€” Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework' },
  attack: { title: 'MITRE â€” ATT&CK knowledge base', url: 'https://attack.mitre.org/' },
  nice: { title: 'NIST â€” NICE Framework Resource Center', url: 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center' },
  wireshark: { title: 'Wireshark â€” User Guide', url: 'https://www.wireshark.org/docs/wsug_html/' },
  burp: { title: 'PortSwigger â€” Burp Suite Repeater', url: 'https://portswigger.net/burp/documentation/desktop/tools/repeater' },
  autopsy: { title: 'Autopsy â€” User Documentation', url: 'https://www.sleuthkit.org/autopsy/docs/user-docs/4.21.0/' },
  ncat: { title: 'Nmap â€” Ncat Guide', url: 'https://nmap.org/ncat/guide/ncat-usage.html' },
};
