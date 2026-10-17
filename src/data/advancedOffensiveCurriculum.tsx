import type { ModuleMeta, RoadmapStage } from '../types';
import { createElement } from 'react';
import LessonArticle, { type AdvancedLesson } from '../content/advanced-offensive/LessonArticle';
import { methodologyLessons } from '../content/advanced-offensive/methodology';
import { identityLessons } from '../content/advanced-offensive/identity';
import { supplyChainLessons } from '../content/advanced-offensive/supply-chain';
import { postexHostLessons } from '../content/advanced-offensive/postex-host';
import { postexNetworkLessons } from '../content/advanced-offensive/postex-network';

export const ADVANCED_LESSONS = [...methodologyLessons, ...identityLessons, ...supplyChainLessons, ...postexHostLessons, ...postexNetworkLessons];

function makeModule(meta: Omit<ModuleMeta, 'lessons' | 'status'>, lessons: AdvancedLesson[]): ModuleMeta {
  return {
    ...meta, status: 'available',
    lessons: lessons.map(lesson => ({
      id: lesson.id, slug: lesson.slug, title: lesson.title, summary: lesson.summary, minutes: 18,
      Content: () => createElement(LessonArticle, { lesson }),
      quiz: lesson.quiz.map((question, index) => ({ ...question, id: `${lesson.id}-q${index + 1}` })),
    })),
  };
}

export const ADVANCED_OFFENSIVE_MODULES: ModuleMeta[] = [
  makeModule({
    id: 'advanced-pentest-methodology', slug: 'advanced-pentest-methodology',
    title: 'Advanced Pentest Methodology', subtitle: 'Scope, experimental design, attack paths and evidence',
    description: 'Continue beyond single vulnerabilities into complete assessments: design the engagement, test matched controls, build evidence-backed attack paths and deliver repairable findings. Two complete campaigns connect initial exposure to separately scoped privilege assessment, fresh-session retest and handback.',
    icon: 'crosshair', sourceBooks: ['NIST SP 800-115', 'OWASP Web Security Testing Guide'],
  }, methodologyLessons),
  makeModule({
    id: 'identity-trust-boundaries', slug: 'identity-trust-boundaries',
    title: 'Identity & Trust Boundary Testing', subtitle: 'Authorization matrices, claims, deputies and revocation',
    description: 'Learn to assess actor-resource-action policies, tenant isolation, identity assertions and delegated authority. Follow identity from issuance through use and revocation, then prove both allowed and denied behavior. The concepts apply across applications, service identities and agent tools.',
    icon: 'key', sourceBooks: ['OWASP Authorization Cheat Sheet', 'RFC 9700', 'OWASP Authorization Regression Testing'],
  }, identityLessons),
  makeModule({
    id: 'software-delivery-security', slug: 'software-delivery-security',
    title: 'Software Delivery & Workload Security', subtitle: 'Build inputs, runner authority, artifacts and deployment',
    description: 'Assess the chain from contributor input to build execution and deployment authority. Review delivery artifacts, distinguish signatures from provenance, and reason about workload capabilities and credential lifecycles. Labs model artifact exposure and confused-deputy behavior; real pipeline verification exercises are clearly separated.',
    icon: 'engineering', sourceBooks: ['SLSA Specification', 'GitHub Actions Security Documentation'],
  }, supplyChainLessons),
  makeModule({
    id: 'post-exploitation-host', slug: 'post-exploitation-host',
    title: 'Post-Exploitation: Host Assessment', subtitle: 'Foothold triage, privilege delegation and minimal impact',
    description: 'Start from an authorized foothold and establish its actual authority. Review interpreters, special executable permissions, process context and sensitive artifacts; validate a protected synthetic read before repairing the follow-on privilege boundary. Two complete local-privilege campaigns include evidence, retest and cleanup.',
    icon: 'terminal', sourceBooks: ['Linux man-pages: credentials and capabilities', 'MITRE ATT&CK', 'NIST SP 800-115'],
  }, postexHostLessons),
  makeModule({
    id: 'post-exploitation-operations', slug: 'post-exploitation-operations',
    title: 'Post-Exploitation: Lateral Access & Handback', subtitle: 'Segmentation, identity lifecycle, detection and closeout',
    description: 'Separate reachability from authentication while moving through an explicitly scoped gateway. Review persistence and revocation without unnecessary executable state, plan detection validation and complete a substantive report plus verified handback. The capstone enforces actual negative checks and bounded cleanup.',
    icon: 'network', sourceBooks: ['MITRE ATT&CK', 'NIST SP 800-115'],
  }, postexNetworkLessons),
];

export const ADVANCED_OFFENSIVE_ROADMAP: RoadmapStage[] = ADVANCED_OFFENSIVE_MODULES.map(mod => ({
  title: mod.title, moduleSlug: mod.slug, status: mod.status, sourceBooks: mod.sourceBooks, track: 'security',
}));

export const ADVANCED_LESSON_LABS: Record<string, string[]> = Object.fromEntries(ADVANCED_LESSONS.map(lesson => [lesson.id, lesson.labs]));
