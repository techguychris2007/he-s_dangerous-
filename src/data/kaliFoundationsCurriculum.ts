import { curriculumModule } from '../content/curriculumDefinition';
import { workstationLessons } from '../content/kali-foundations/workstation';
import { validationLessons } from '../content/kali-foundations/validation';
import { accessLessons } from '../content/kali-foundations/access';
import type { RoadmapStage } from '../types';

export const KALI_WORKSTATION_MODULE = curriculumModule({
  id: 'kali-workstation', slug: 'kali-workstation', title: 'Modern Kali Workstation & Lab Setup',
  subtitle: 'Verified downloads, isolated VMs, packages and connection troubleshooting',
  description: 'Build a trustworthy, recoverable workstation before offensive practice. Learn image verification, virtual networking, rolling package maintenance and a real local HTTP experiment.',
  icon: 'terminal', sourceBooks: ['Kali Linux documentation', 'Python documentation', 'iproute2 manuals'],
}, workstationLessons);

export const KALI_VALIDATION_MODULE = curriculumModule({
  id: 'evidence-led-validation', slug: 'evidence-led-validation', title: 'Reconnaissance & Exploit Validation',
  subtitle: 'Asset attribution, scan evidence, service confidence and exploit prerequisites',
  description: 'Interpret reconnaissance evidence, service probes and exploit prerequisites before controlled testing. Distinguish SearchSploit research from Metasploit execution.',
  icon: 'crosshair', sourceBooks: ['Nmap reference guide', 'Exploit-DB SearchSploit manual', 'Metasploit documentation'],
}, validationLessons);

export const KALI_ACCESS_MODULE = curriculumModule({
  id: 'session-access-boundaries', slug: 'session-access-boundaries', title: 'Post-Exploitation Access Boundaries',
  subtitle: 'Session authority, credential exposure, tunnels and durable access state',
  description: 'Understand what a session permits. Practice identity checks, dummy-secret evidence, a controlled SSH forward and read-only access inventories.',
  icon: 'shield', sourceBooks: ['GNU Coreutils', 'OpenSSH manuals', 'systemd manuals', 'OWASP guidance'],
}, accessLessons);

export const KALI_OFFENSIVE_MODULES = [KALI_VALIDATION_MODULE, KALI_ACCESS_MODULE];
export const KALI_OFFENSIVE_ROADMAP: RoadmapStage[] = KALI_OFFENSIVE_MODULES.map(module => ({
  title: module.title, moduleSlug: module.slug, status: module.status, sourceBooks: module.sourceBooks, track: 'security',
}));
export const KALI_FOUNDATION_LESSONS = [...workstationLessons, ...validationLessons, ...accessLessons];
export const KALI_FOUNDATION_LESSON_LABS: Record<string, string[]> = Object.fromEntries(KALI_FOUNDATION_LESSONS.map(lesson => [lesson.id, lesson.labs]));
