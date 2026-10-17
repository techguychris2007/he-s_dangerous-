import type { RoadmapStage } from '../types';
import { curriculumModule } from '../content/curriculumDefinition';
import { computingLessons } from '../content/pre-security/computing';
import { beginnerNetworkLessons } from '../content/pre-security/networking';
import { beginnerSystemLessons } from '../content/pre-security/systems';
import { beginnerScriptingLessons } from '../content/pre-security/scripting';
import { beginnerSecurityLessons } from '../content/pre-security/security';
import { readinessLessons } from '../content/pre-security/readiness';
import { KALI_WORKSTATION_MODULE } from './kaliFoundationsCurriculum';
import { workstationLessons } from '../content/kali-foundations/workstation';

export const PRE_SECURITY_LESSONS = [...computingLessons, ...workstationLessons, ...beginnerNetworkLessons, ...beginnerSystemLessons, ...beginnerScriptingLessons, ...beginnerSecurityLessons, ...readinessLessons];

export const PRE_SECURITY_MODULES = [
  curriculumModule({ id: 'pre-computing', slug: 'pre-computing', title: 'Lab Orientation & Evidence Basics', subtitle: 'Flags, scope, paths, permissions and safe practice spaces', description: 'Start with the DarkWorld lab workflow itself: objectives, flags, transcripts, evidence notes, filesystem basics, user permissions and the difference between safe simulations and real systems.', icon: 'terminal', sourceBooks: ['GNU Bash manual', 'NIST SP 800-115'] }, computingLessons),
  KALI_WORKSTATION_MODULE,
  curriculumModule({ id: 'pre-networks-web', slug: 'pre-networks-web', title: 'Networking, HTTP & Netcat', subtitle: 'IP addresses, ports, DNS, TCP, TLS and service banners', description: 'Learn the network language offensive and defensive labs assume: IPs, ports, services, DNS, TCP, TLS visibility, Netcat banners and the HTTP request parts Burp will later expose.', icon: 'network', sourceBooks: ['Nmap Ncat guide', 'MDN Web Docs', 'Wireshark User Guide'] }, beginnerNetworkLessons),
  curriculumModule({ id: 'pre-operating-systems', slug: 'pre-operating-systems', title: 'Wireshark Packet Reading', subtitle: 'Display filters, DNS answers, HTTP streams and encrypted limits', description: 'Practice reading packet evidence with a focused Wireshark-style workflow: filter, inspect fields, follow TCP streams, and write honest limitations when TLS hides payload content.', icon: 'terminal', sourceBooks: ['Wireshark User Guide', 'MDN Web Docs'] }, beginnerSystemLessons),
  curriculumModule({ id: 'pre-scripting-data', slug: 'pre-scripting-data', title: 'Burp Suite & Web Requests', subtitle: 'Proxy history, Repeater, cookies, status codes and one-variable tests', description: 'Build the request literacy needed before web exploitation: send baselines, compare object changes, remove sessions, distinguish 401 from 403 and document what each response proves.', icon: 'code', sourceBooks: ['PortSwigger Burp Suite docs', 'OWASP Authorization Cheat Sheet'] }, beginnerScriptingLessons),
  curriculumModule({ id: 'pre-security-principles', slug: 'pre-security-principles', title: 'Autopsy & Evidence Handling', subtitle: 'Cases, data sources, keyword search, deleted entries and supported claims', description: 'Learn beginner forensic workflow in Autopsy-style labs: create a case, ingest a fixture, search keywords, tag artifacts and avoid overclaiming from one file or one hit.', icon: 'shield', sourceBooks: ['Autopsy User Documentation', 'NIST Incident Response'] }, beginnerSecurityLessons),
  curriculumModule({ id: 'pre-lab-readiness', slug: 'pre-lab-readiness', title: 'Toolkit Readiness Capstone', subtitle: 'Choose the right tool and produce professional proof-of-experience notes', description: 'Bring terminal, Netcat, Wireshark, Burp and Autopsy together in a nine-checkpoint capstone. Finish with a report-ready evidence note that prepares learners for offensive and defensive labs.', icon: 'crosshair', sourceBooks: ['NIST SP 800-115', 'Wireshark', 'PortSwigger', 'Autopsy'] }, readinessLessons),
];

export const PRE_SECURITY_ROADMAP: RoadmapStage[] = PRE_SECURITY_MODULES.map(mod => ({ title: mod.title, moduleSlug: mod.slug, status: mod.status, sourceBooks: mod.sourceBooks, track: 'presecurity' }));
export const PRE_SECURITY_LESSON_LABS: Record<string, string[]> = Object.fromEntries(PRE_SECURITY_LESSONS.map(lesson => [lesson.id, lesson.labs]));
