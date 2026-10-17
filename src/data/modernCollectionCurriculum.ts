import { curriculumModule } from '../content/curriculumDefinition';
import { databaseLessons } from '../content/modern-security-collection/database';
import { collectionMobileLessons } from '../content/modern-security-collection/mobile';
import { collectionIotLessons } from '../content/modern-security-collection/iot';
import { collectionWebLessons } from '../content/modern-security-collection/web';
import { collectionAutomationLessons } from '../content/modern-security-collection/automation';
import { collectionLinuxLessons, collectionMetasploitLessons } from '../content/modern-security-collection/operations';
import { collectionEngineeringLessons, collectionBinaryLessons } from '../content/modern-security-collection/engineering';
import { cloudContinuationLessons } from '../content/cloud/cloudContinuation';
import { protocolLessons } from '../content/modern-security-collection/protocols';
import { passwordVerifierLesson } from '../content/modern-security-collection/passwordVerifiers';
import { metasploitDepthLessons } from '../content/modern-security-collection/metasploitDepth';
import { metasploitAdvancedLessons } from '../content/modern-security-collection/metasploitAdvanced';

export const MODERN_DATABASE_MODULE = curriculumModule({
  id: 'database-security', slug: 'database-security', title: 'Database Security',
  subtitle: 'SQL foundations, roles, safe queries, tenant policies and recovery',
  description: 'Build a local SQL database, query and join records, then learn how database identities and policies enforce data access. Study parameter binding, row policies, pooled context and secure copies with concrete SQL and Python examples.',
  icon: 'shield', sourceBooks: ['Current PostgreSQL and MySQL documentation', 'OWASP database guidance', 'Python SQLite documentation'],
}, databaseLessons);

export const COLLECTION_EXTENSIONS = [
  { slug: 'evidence-led-validation', lessons: [...metasploitDepthLessons.slice(0, 2), metasploitAdvancedLessons[0], metasploitAdvancedLessons[2]], sources: ['Metasploit: The Penetration Testers Guide (2011), modernized against current Framework documentation', 'Current Metasploit Framework documentation'] },
  { slug: 'session-access-boundaries', lessons: [...metasploitDepthLessons.slice(2), metasploitAdvancedLessons[1]], sources: ['Metasploit: The Penetration Testers Guide (2011), modernized against current Framework documentation', 'Current Metasploit Framework documentation'] },
  { slug: 'crypto-attacks', lessons: [passwordVerifierLesson], sources: ['Current NIST and OWASP password-verifier guidance'] },
  { slug: 'python', lessons: [protocolLessons[0]], sources: ['Current Python socket and encoding documentation'] },
  { slug: 'webapp', lessons: [protocolLessons[1]], sources: ['Current HTTP and URL parsing documentation'] },
  { slug: 'cloud', lessons: cloudContinuationLessons, sources: ['Current AWS IAM, S3, EC2 and CloudTrail documentation'] },
  { slug: 'mobile', lessons: collectionMobileLessons, sources: ['OWASP MASVS', 'Current Android and Apple security documentation'] },
  { slug: 'iot', lessons: collectionIotLessons, sources: ['NIST IoT/firmware guidance', 'MQTT and broker documentation'] },
  { slug: 'webapp', lessons: collectionWebLessons, sources: ['OWASP application and API security guidance'] },
  { slug: 'python', lessons: collectionAutomationLessons, sources: ['Current Python documentation', 'Google Gmail API documentation'] },
  { slug: 'linux', lessons: collectionLinuxLessons, sources: ['Current Kali and systemd documentation'] },
  { slug: 'evidence-led-validation', lessons: [collectionMetasploitLessons[0]], sources: ['Current Metasploit documentation'] },
  { slug: 'session-access-boundaries', lessons: [collectionMetasploitLessons[1]], sources: ['Current Metasploit documentation'] },
  { slug: 'secengineering', lessons: collectionEngineeringLessons, sources: ['FIDO identity guidance', 'Current email authentication guidance'] },
  { slug: 'binaryanalysis', lessons: collectionBinaryLessons, sources: ['Current Clang and GCC documentation'] },
];

export const MODERN_COLLECTION_LESSONS = [...databaseLessons, ...COLLECTION_EXTENSIONS.flatMap(item => item.lessons)];
export const MODERN_COLLECTION_LESSON_LABS = Object.fromEntries(MODERN_COLLECTION_LESSONS.map(lesson => [lesson.id, lesson.labs]));
