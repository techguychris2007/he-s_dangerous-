import { MODULES } from '../../data/curriculum';

export interface AcademyDestination {
  title: string;
  to: string;
  group: string;
  description: string;
  keywords?: string;
  staff?: boolean;
}
export const LEARNING_PATHS = [
  { title: 'Pre-security', to: '/roadmap?track=presecurity', track: 'presecurity' },
  { title: 'Offensive security', to: '/roadmap?track=security', track: 'security' },
  { title: 'Defensive security', to: '/roadmap?track=defensive', track: 'defensive' },
  { title: 'Programming', to: '/roadmap?track=programming', track: 'programming' },
] as const;
export const ACADEMY_DESTINATIONS: AcademyDestination[] = [
  { title: 'Overview', to: '/', group: 'Your workspace', description: 'Your academy dashboard', keywords: 'home dashboard' },
  { title: 'My learning', to: '/my-learning', group: 'Your workspace', description: 'Continue your learning sequence', keywords: 'resume recent saved' },
  { title: 'Learning paths', to: '/roadmap', group: 'Learn', description: 'Explore every cybersecurity learning path', keywords: 'roadmap modules courses' },
  ...LEARNING_PATHS.map(path => ({ title: path.title, to: path.to, group: 'Learning paths', description: 'Open the ' + path.title.toLowerCase() + ' roadmap' })),
  { title: 'Machine learning', to: '/ml-portal', group: 'Learn', description: 'Python, data science and model engineering', keywords: 'ml ai statistics' },
  { title: 'Lab catalog', to: '/labs', group: 'Practice', description: 'Terminal, website and directory labs', keywords: 'pentest linux kali' },
  { title: 'SOC investigations', to: '/soc-portal', group: 'Practice', description: 'SIEM casefiles and defensive investigations', keywords: 'blue team sentinel splunk' },
  { title: 'Coding practice', to: '/code-portal', group: 'Practice', description: 'Programming exercises and tests', keywords: 'python javascript cpp code portal' },
  { title: 'Build projects', to: '/build-portal', group: 'Practice', description: 'Software engineering and agentic AI assignments', keywords: 'projects build portal' },
  { title: 'Library', to: '/library', group: 'Reference', description: 'Read and save technical books' },
  { title: 'Resources', to: '/resources', group: 'Reference', description: 'Curated references and communities' },
  { title: 'My tasks', to: '/tasks', group: 'Activity', description: 'Practice checklist and saved work' },
  { title: 'Progress', to: '/progress', group: 'Activity', description: 'Learning progress and achievements' },
  { title: 'Leaderboard', to: '/leaderboard', group: 'Community', description: 'Community learning rankings' },
  { title: 'Schedule', to: '/schedule', group: 'Activity', description: 'Plan your study sessions' },
  { title: 'Announcements', to: '/announcements', group: 'Community', description: 'Academy updates' },
  { title: 'Profile', to: '/profile', group: 'Account', description: 'Your identity, badge and achievements' },
  { title: 'Security', to: '/security', group: 'Account', description: 'Account security settings' },
  { title: 'Help & FAQ', to: '/help', group: 'Support', description: 'Answers and platform guidance' },
  { title: 'Feedback', to: '/feedback', group: 'Support', description: 'Share feedback with the academy' },
  { title: 'Instructor dashboard', to: '/instructor', group: 'Staff', description: 'Authorized instructor workspace', staff: true },
];
const moduleDestinations: AcademyDestination[] = MODULES.flatMap(module => [
  { title: module.title, to: '/module/' + module.slug, group: 'Modules', description: module.description ?? 'Open module' },
  ...module.lessons.map(lesson => ({
    title: lesson.title, to: '/module/' + module.slug + '/lesson/' + lesson.slug,
    group: 'Lessons', description: module.title, keywords: lesson.summary,
  })),
]);
const normalize = (value: string) => value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export function searchAcademy(query: string, staff = false): AcademyDestination[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const candidates = terms.length ? [...ACADEMY_DESTINATIONS, ...moduleDestinations] : ACADEMY_DESTINATIONS.slice(0, 3).concat(ACADEMY_DESTINATIONS.filter(item => ['/labs', '/soc-portal', '/code-portal'].includes(item.to)));
  return candidates.filter(item => (!item.staff || staff) && terms.every(term =>
    normalize([item.title, item.group, item.description, item.keywords ?? ''].join(' ')).includes(term)
  )).sort((a, b) => {
    const score = (item: AcademyDestination) => {
      if (!terms.length) return 0;
      const title = normalize(item.title);
      const phrase = terms.join(' ');
      if (title === phrase) return 0;
      if (title.startsWith(phrase)) return 1;
      const words = title.split(/[^\p{L}\p{N}]+/u);
      if (terms.every(term => words.includes(term))) return 2;
      return title.includes(phrase) ? 3 : 4;
    };
    return score(a) - score(b);
  }).slice(0, 9);
}

