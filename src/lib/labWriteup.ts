import type { LabEntry } from '../data/labs';
import type { ObjectiveStep } from '../labs/types';

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  Linux: ['LinuxSecurity', 'PrivilegeEscalation'],
  Network: ['NetworkSecurity', 'Nmap'],
  Web: ['WebSecurity', 'AppSec', 'BugBounty'],
  'Active Directory': ['ActiveDirectory', 'RedTeam', 'Kerberos'],
  'Bug Bounty': ['BugBounty', 'BugBountyTips'],
  Cloud: ['CloudSecurity', 'AWS'],
  SOC: ['BlueTeam', 'ThreatHunting', 'SOC'],
  Forensics: ['DFIR', 'DigitalForensics'],
  'Security+': ['SecurityPlus', 'GRC'],
  'Binary Analysis': ['ReverseEngineering', 'ExploitDev'],
  Malware: ['MalwareAnalysis', 'ThreatIntel'],
  'Security Engineering': ['SecurityEngineering', 'AppSec'],
};

function objectiveText(o: string | ObjectiveStep): string {
  return typeof o === 'string' ? o : o.text;
}

function objectiveWhy(o: string | ObjectiveStep): string | undefined {
  return typeof o === 'string' ? undefined : o.why;
}

function extractCve(...sources: string[]): string | null {
  for (const s of sources) {
    const m = s.match(/CVE-\d{4}-\d+/i);
    if (m) return m[0].toUpperCase();
  }
  return null;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
}

function hookLine(briefing: string, maxLen: number): string {
  const firstSentence = briefing.split(/(?<=\.)\s+/)[0] ?? briefing;
  return truncate(firstSentence, maxLen);
}

export interface LabWriteupOptions {
  learnerName?: string | null;
  labsCompletedTotal?: number;
  labsInModuleTotal?: number;
  moduleTitle?: string;
}

export interface LabWriteup {
  linkedin: string;
  twitter: string;
  markdown: string;
  hashtags: string[];
}

export function buildLabWriteup(entry: LabEntry, opts: LabWriteupOptions = {}): LabWriteup {
  const { scenario } = entry;
  const objectives = scenario.objectives.map(objectiveText);
  const whys = scenario.objectives.map(objectiveWhy).filter((w): w is string => Boolean(w));
  const cve = extractCve(scenario.title, scenario.briefing);
  const cveAlreadyInTitle = cve ? scenario.title.toUpperCase().includes(cve) : false;
  const hashtags = ['CyberSecurity', 'EthicalHacking', 'InfoSec', 'DarkWorld', ...(CATEGORY_HASHTAGS[scenario.category] ?? [])];
  const hashtagLine = hashtags.map((h) => `#${h}`).join(' ');
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const keyTakeaway = whys.sort((a, b) => b.length - a.length)[0];
  const cveLine = cve && !cveAlreadyInTitle ? ` (${cve})` : '';

  // ---------- LinkedIn ----------
  const linkedinSteps = objectives.slice(0, 4).map((t) => `• ${t}`).join('\n');
  const linkedin = [
    `\u{1F6A9} Lab completed: ${scenario.title}${cveLine}`,
    '',
    hookLine(scenario.briefing, 240),
    '',
    'What I practiced:',
    linkedinSteps,
    ...(objectives.length > 4 ? [`• …and ${objectives.length - 4} more step(s)`] : []),
    ...(keyTakeaway ? ['', `Key takeaway: "${truncate(keyTakeaway, 260)}"`] : []),
    '',
    `${scenario.difficulty} difficulty · ${scenario.category} · ${scenario.totalFlags} flag${scenario.totalFlags > 1 ? 's' : ''} captured`,
    '',
    opts.labsCompletedTotal
      ? `Working through DarkWorld's hands-on labs — ${opts.labsCompletedTotal} labs completed so far${
          opts.moduleTitle ? ` in the ${opts.moduleTitle} track` : ''
        }.`
      : `Working through DarkWorld's hands-on, in-browser labs — real recon-to-impact chains, not multiple-choice quizzes.`,
    '',
    hashtagLine,
  ].join('\n');

  // ---------- Twitter / X (<=280 chars) ----------
  const twHashtags = `#CyberSecurity #${(CATEGORY_HASHTAGS[scenario.category] ?? ['InfoSec'])[0]}`;
  const twPrefix = `\u{1F6A9} Solved "${scenario.title}"${cveLine} (${scenario.difficulty}) — `;
  const twSuffix = ` ${scenario.totalFlags}/${scenario.totalFlags} flags. ${twHashtags}`;
  const twBudget = 280 - twPrefix.length - twSuffix.length;
  const twitter = `${twPrefix}${truncate(hookLine(scenario.briefing, twBudget), Math.max(0, twBudget))}${twSuffix}`;

  // ---------- Markdown / portfolio ----------
  const mdObjectives = scenario.objectives
    .map((o, i) => {
      const text = objectiveText(o);
      const why = objectiveWhy(o);
      return why ? `${i + 1}. **${text}**\n   → ${why}` : `${i + 1}. ${text}`;
    })
    .join('\n');

  const markdown = [
    `## Lab: ${scenario.title}${cveLine}`,
    '',
    `**Category:** ${scenario.category} · **Difficulty:** ${scenario.difficulty} · **Flags:** ${scenario.totalFlags}/${scenario.totalFlags} · **Date:** ${dateStr}`,
    ...(opts.learnerName ? [`**Learner:** ${opts.learnerName}`] : []),
    '',
    '### Scenario',
    scenario.briefing,
    '',
    '### Methodology',
    mdObjectives,
    '',
    '### Environment',
    '_Completed inside DarkWorld, a browser-based offensive-security training platform — every step above was run against a simulated network and filesystem in an isolated, authorized lab environment._',
  ].join('\n');

  return { linkedin, twitter, markdown, hashtags };
}
