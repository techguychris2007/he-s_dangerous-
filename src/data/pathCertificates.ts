import { ROADMAP, findModule } from './curriculum';
import type { RoadmapTrack } from '../types';

/** The learning-path completion certificates. One per career track on the roadmap (ML is portal-based
 *  and has no roadmap modules, so it is intentionally not a path certificate). These are self-issued
 *  records of completed simulated coursework on DarkWorld — not independently accredited credentials. */
export type CertificateAccent = 'foundation' | 'offense' | 'defense' | 'analysis';

export interface CertificatePath {
  track: Exclude<RoadmapTrack, 'ml'>;
  /** Short label for cards and navigation. */
  name: string;
  /** The credential title printed on the certificate itself. */
  credential: string;
  /** One line describing what completing the path proves. */
  summary: string;
  /** Representative skills, shown on the certificate and its card. */
  skills: string[];
  accent: CertificateAccent;
}

export const CERTIFICATE_PATHS: CertificatePath[] = [
  {
    track: 'presecurity',
    name: 'Pre-Security',
    credential: 'Pre-Security Foundations',
    summary: 'Computer, network and operating-system foundations with safe, disciplined lab practice.',
    skills: ['Networking fundamentals', 'Linux & Windows', 'Web & scripting basics', 'Lab safety'],
    accent: 'foundation',
  },
  {
    track: 'security',
    name: 'Offensive Security',
    credential: 'Offensive Security Practitioner',
    summary: 'Reconnaissance, exploitation, web attacks, Active Directory and red-team methodology.',
    skills: ['Recon & enumeration', 'Web exploitation', 'Active Directory', 'Post-exploitation'],
    accent: 'offense',
  },
  {
    track: 'defensive',
    name: 'Defensive Security',
    credential: 'Defensive Security Analyst',
    summary: 'SOC operations, SIEM investigation, threat hunting, digital forensics and incident response.',
    skills: ['SIEM & detection', 'Threat hunting', 'Digital forensics', 'Incident response'],
    accent: 'defense',
  },
  {
    track: 'programming',
    name: 'Programming',
    credential: 'Security Programming',
    summary: 'Python and tooling for security automation, data handling and proof-of-concept scripting.',
    skills: ['Python', 'Automation & tooling', 'Data handling', 'PoC scripting'],
    accent: 'analysis',
  },
  {
    track: 'software',
    name: 'Software Engineering',
    credential: 'Software Engineering',
    summary: 'Python from first principles through object-oriented programming, then testing, design, APIs, data and concurrency.',
    skills: ['Python & OOP', 'Testing', 'Design & APIs', 'Data & concurrency'],
    accent: 'analysis',
  },
  {
    track: 'dotnet',
    name: 'C# & .NET Engineering',
    credential: 'C# & .NET Software Engineering',
    summary: 'Six months from C# foundations to production: ASP.NET Core APIs and databases, architecture, TypeScript and React, Azure DevOps, system design and a capstone.',
    skills: ['C# & ASP.NET Core', 'Architecture & DDD', 'TypeScript & React', 'Azure, DevOps & system design'],
    accent: 'foundation',
  },
];

export function certificatePath(track: string): CertificatePath | undefined {
  return CERTIFICATE_PATHS.find((path) => path.track === track);
}

export interface TrackModules {
  all: string[];
  byModule: { slug: string; title: string; ids: string[] }[];
}

/** Every lesson id in a track's available roadmap modules — the denominator a certificate is earned
 *  against. Only `available` stages that resolve to a real module with lessons count, so a planned or
 *  link-only stage can never make a path unearnable. */
export function trackLessons(track: RoadmapTrack): TrackModules {
  const byModule: TrackModules['byModule'] = [];
  for (const stage of ROADMAP) {
    if (stage.track !== track || stage.status !== 'available' || !stage.moduleSlug) continue;
    const mod = findModule(stage.moduleSlug);
    if (!mod || mod.lessons.length === 0) continue;
    byModule.push({ slug: mod.slug, title: mod.title, ids: mod.lessons.map((lesson) => lesson.id) });
  }
  return { all: byModule.flatMap((m) => m.ids), byModule };
}

export interface CertificateStatus {
  total: number;
  completed: number;
  percent: number;
  earned: boolean;
  moduleCount: number;
  modulesDone: number;
  remaining: number;
}

export function certificateStatus(track: RoadmapTrack, isLessonComplete: (id: string) => boolean): CertificateStatus {
  const { all, byModule } = trackLessons(track);
  const completed = all.filter(isLessonComplete).length;
  const total = all.length;
  const modulesDone = byModule.filter((m) => m.ids.every(isLessonComplete)).length;
  return {
    total,
    completed,
    percent: total ? Math.round((100 * completed) / total) : 0,
    earned: total > 0 && completed === total,
    moduleCount: byModule.length,
    modulesDone,
    remaining: Math.max(0, total - completed),
  };
}

/** A stable, self-issued record id shown on the certificate, derived only from the learner name and
 *  track so it is identical every time the same person views or downloads the same path certificate.
 *  FNV-1a over the seed — purely for display; it attests to completed coursework, not accreditation. */
export function certificateId(track: RoadmapTrack, learnerName: string): string {
  const seed = `${track}:${learnerName.trim().toLowerCase() || 'learner'}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `DW-${track.slice(0, 3).toUpperCase()}-${hex}`;
}
