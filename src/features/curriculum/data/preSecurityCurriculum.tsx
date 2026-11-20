import type { RoadmapStage } from '../../../shared/types/domain';
import { curriculumModule } from '../content/curriculumDefinition';
import { introductionLessons } from '../content/pre-security/introduction';
import { computingLessons } from '../content/pre-security/computing';
import { beginnerNetworkLessons } from '../content/pre-security/networking';
import { beginnerSystemLessons } from '../content/pre-security/systems';
import { beginnerScriptingLessons } from '../content/pre-security/scripting';
import { beginnerSecurityLessons } from '../content/pre-security/security';
import { readinessLessons } from '../content/pre-security/readiness';
import { KALI_WORKSTATION_MODULE } from './kaliFoundationsCurriculum';
import { workstationLessons } from '../content/kali-foundations/workstation';

export const PRE_SECURITY_LESSONS = [...introductionLessons, ...computingLessons, ...workstationLessons, ...beginnerNetworkLessons, ...beginnerSystemLessons, ...beginnerScriptingLessons, ...beginnerSecurityLessons, ...readinessLessons];

export const PRE_SECURITY_MODULES = [
  curriculumModule({ id: 'pre-introduction', slug: 'pre-introduction', title: 'Introduction to Cybersecurity', subtitle: 'What the field protects, the threat landscape, and how both sides of the profession work', description: 'Build the conceptual vocabulary every security professional uses: CIA triad, threats and risk, the defensive and offensive sides of the field, careers and how to choose a direction. No technical tools yet — just the ideas that make every later lesson make sense.', icon: 'shield', sourceBooks: ['NIST Cybersecurity Framework 2.0', 'NIST SP 800-30', 'NICE Workforce Framework', 'PTES'] }, introductionLessons),
  curriculumModule({ id: 'pre-computing', slug: 'pre-computing', title: 'How DarkWorld Works & Lab Basics', subtitle: 'Labs, casebooks, coding practice, proofs, scope and your first commands', description: 'Start with DarkWorld itself: where lessons, labs, SOC casebooks, coding practice and the library fit, how proofs and findings record progress, how to stay in scope, and the files, paths and permissions every lab uses.', icon: 'terminal', sourceBooks: ['GNU Bash manual', 'NIST SP 800-115'] }, computingLessons),
  KALI_WORKSTATION_MODULE,
  curriculumModule({ id: 'pre-networks-web', slug: 'pre-networks-web', title: 'Networking, HTTP & Netcat', subtitle: 'IP addresses, ports, DNS, TCP, TLS and service banners', description: 'Learn the network language offensive and defensive labs assume: IPs, ports, services, DNS, TCP, TLS visibility, Netcat banners and the HTTP request parts Burp will later expose.', icon: 'network', sourceBooks: ['Nmap Ncat guide', 'MDN Web Docs', 'Wireshark User Guide'] }, beginnerNetworkLessons),
  curriculumModule({ id: 'pre-operating-systems', slug: 'pre-operating-systems', title: 'Computers & Operating Systems', subtitle: 'What an operating system does, accounts and least privilege, updates and hardening', description: 'Learn how computers are organised from hardware to applications, why the operating system is the key security boundary, how accounts and privileges limit damage, and how patching, hardening, endpoint protection and backups keep systems safe.', icon: 'terminal', sourceBooks: ['NIST SP 800-123', 'CISA patching guidance'] }, beginnerSystemLessons),
  curriculumModule({ id: 'pre-scripting-data', slug: 'pre-scripting-data', title: 'How the Web Works', subtitle: 'Requests and responses, cookies and sessions, logging in versus permissions', description: 'Understand what happens between a browser and a server: URLs, HTTP requests, status codes and HTTPS; how sessions keep you signed in and how they are stolen; and the difference between authentication and authorization behind the most common web risks.', icon: 'code', sourceBooks: ['MDN Web Docs', 'OWASP Cheat Sheet Series', 'OWASP Top 10'] }, beginnerScriptingLessons),
  curriculumModule({ id: 'pre-security-principles', slug: 'pre-security-principles', title: 'Logs, Evidence & Incident Basics', subtitle: 'What systems record, handling digital evidence, and responding to incidents', description: 'Learn what logs record and why accurate time and central collection matter, how investigators protect digital evidence with hashes and chain of custody, and how organisations prepare for, contain and recover from security incidents.', icon: 'shield', sourceBooks: ['NIST SP 800-92', 'NIST SP 800-86', 'NIST SP 800-61'] }, beginnerSecurityLessons),
  curriculumModule({ id: 'pre-lab-readiness', slug: 'pre-lab-readiness', title: 'Foundations Capstone', subtitle: 'Think like a professional, write it up clearly, and put the whole path together', description: 'Practise the habits every security role shares: precise questions, evidence before conclusions, honest limitations and clear reports. Then work one realistic incident through every module of the path and choose where to go next.', icon: 'crosshair', sourceBooks: ['NIST SP 800-115', 'NIST SP 800-61', 'NIST NICE Framework'] }, readinessLessons),
];

export const PRE_SECURITY_ROADMAP: RoadmapStage[] = PRE_SECURITY_MODULES.map(mod => ({ title: mod.title, moduleSlug: mod.slug, status: mod.status, sourceBooks: mod.sourceBooks, track: 'presecurity' }));
export const PRE_SECURITY_LESSON_LABS: Record<string, string[]> = Object.fromEntries(PRE_SECURITY_LESSONS.map(lesson => [lesson.id, lesson.labs]));
