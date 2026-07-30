import { SECURITY_CRYPTOGRAPHY_TASKS } from './cryptography';
import { SECURITY_IDENTITY_ACCESS_TASKS } from './identityAccess';
import { SECURITY_INCIDENT_FORENSICS_TASKS } from './incidentForensics';
import { SECURITY_TESTING_RISK_TASKS } from './testingRisk';
import { SECURITY_NETWORK_TASKS } from './networkForensics';
import { SECURITY_WEBAPP_TASKS } from './webAppSecurity';
import { SECURITY_BINARY_TASKS } from './binaryExploitation';
import { SECURITY_MALWARE_TASKS } from './malwareAnalysis';
import type { CodeTask } from '../codeTypes';

export const SECURITY_TASKS: CodeTask[] = [
  ...SECURITY_CRYPTOGRAPHY_TASKS,
  ...SECURITY_IDENTITY_ACCESS_TASKS,
  ...SECURITY_INCIDENT_FORENSICS_TASKS,
  ...SECURITY_TESTING_RISK_TASKS,
  ...SECURITY_NETWORK_TASKS,
  ...SECURITY_WEBAPP_TASKS,
  ...SECURITY_BINARY_TASKS,
  ...SECURITY_MALWARE_TASKS,
];

export const SECURITY_TASK_CATEGORIES = [
  'Security: Cryptography (Crypto 101)',
  'Security: Identity & Access (NIST 800-63 / OWASP ASVS)',
  'Security: Incident Response & Forensics (NIST 800-61 / 800-86)',
  'Security: Testing & Risk (NIST 800-115 / CSF / OWASP WSTG)',
  'Security: Network Protocol Analysis',
  'Security: Web Application Security (OWASP)',
  'Security: Binary Exploitation & Reverse Engineering',
  'Security: Malware Analysis',
] as const;

/** Maps a book id (see src/data/books.ts) to the security-lab task ids that put its concepts into
 *  practice — rendered as "Real-world labs for this book" on the book reader page. */
export const BOOK_LAB_TASK_IDS: Record<string, string[]> = {
  'crypto101': ['sec-crypto-01', 'sec-crypto-02', 'sec-crypto-03', 'sec-crypto-04', 'sec-crypto-05', 'sec-crypto-06', 'sec-crypto-07', 'sec-crypto-08'],
  'nist-digital-identity-guidelines': ['sec-idaccess-01', 'sec-idaccess-03'],
  'nist-intro-to-infosec': ['sec-idaccess-03'],
  'nist-incident-handling-guide': ['sec-incident-01'],
  'nist-forensics-guide': ['sec-forensics-01'],
  'nist-security-testing-guide': ['sec-testing-01', 'sec-testing-02', 'sec-testing-03', 'sec-network-03'],
  'nist-cybersecurity-framework': ['sec-risk-01'],
  'owasp-asvs': ['sec-idaccess-02'],
  'owasp-wstg': ['sec-testing-01', 'sec-testing-02', 'sec-webapp-01', 'sec-webapp-02', 'sec-webapp-03', 'sec-webapp-04', 'sec-webapp-05', 'sec-webapp-06', 'sec-webapp-07'],
  'nist-firewall-guidelines': ['sec-network-01', 'sec-network-02'],
  'nist-log-management': ['sec-network-03', 'sec-network-04', 'sec-network-06'],
  'web-application-hackers-handbook': ['sec-webapp-04', 'sec-webapp-05', 'sec-webapp-07'],
  'basics-of-web-hacking': ['sec-network-05', 'sec-testing-03', 'sec-webapp-06'],
  'hacking-art-of-exploitation': ['sec-binary-01', 'sec-binary-02', 'sec-binary-03'],
  'black-hat-python': ['sec-malware-01', 'sec-malware-02', 'sec-network-04', 'sec-network-05', 'sec-network-06'],
};
