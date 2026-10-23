import type { TypedQuestion } from '../../types';

/** SOC, SIEM, detection engineering, incident response and forensics lessons. */
export const DEFENSIVE_QUESTIONS: Record<string, TypedQuestion[]> = {
  'soc-1': [
    { prompt: 'An alert on its own does not prove what?', answer: 'compromise' },
    { prompt: 'Which platform combines logs and searches across systems? (acronym)', answer: 'SIEM' },
  ],
  'soc-2': [
    { prompt: 'A testable statement about possible attacker activity is a hunting what?', answer: 'hypothesis' },
    { prompt: 'What does TTPs stand for?', answer: 'Tactics, Techniques, and Procedures', accept: ['tactics techniques procedures'] },
  ],
  'soc-3': [
    { prompt: 'Which ATT&CK term describes why an attacker acts, such as persistence?', answer: 'tactic' },
    { prompt: 'Collecting the data that could reveal a behaviour is called what?', answer: 'visibility' },
  ],
  'soc-4': [
    { prompt: 'What is the variation added to beacon intervals called?', answer: 'jitter' },
    { prompt: 'How regularly connections recur is called what?', answer: 'periodicity' },
  ],
  'soc-siem-1': [
    { prompt: 'What does SIEM stand for?', answer: 'Security Information and Event Management' },
    { prompt: 'Mapping fields from different sources onto one schema is called what?', answer: 'normalization', accept: ['normalisation'] },
  ],
  'soc-siem-2': [
    { prompt: 'What kind of rule combines several harmless-looking events into one finding?', answer: 'correlation rule', accept: ['correlation'] },
    { prompt: 'Tuning a rule mainly reduces which kind of alert?', answer: 'false positives', accept: ['false positive'] },
  ],
  'soc-siem-3': [
    { prompt: 'What is Splunk’s query language called? (acronym)', answer: 'SPL' },
    { prompt: 'What does SPL stand for?', answer: 'Search Processing Language' },
  ],
  'soc-siem-4': [
    { prompt: 'After IDENTIFY, what is step 2 of onboarding a new log source?', answer: 'collect' },
    { prompt: 'When licences are billed by volume, "just ingest ____" stops being viable.', answer: 'everything' },
  ],
  'soc-detection-1': [
    { prompt: 'Which MITRE ATT&CK technique ID is Brute Force?', answer: 'T1110' },
    { prompt: 'Strong detections are written against a technique, not against a what?', answer: 'tool', accept: ['a tool', 'product'] },
  ],
  'soc-detection-2': [
    { prompt: 'What does UEBA stand for?', answer: 'User and Entity Behavior Analytics', accept: ['user & entity behavior analytics', 'user and entity behaviour analytics'] },
    { prompt: 'UEBA compares activity against a learned profile called a what?', answer: 'baseline' },
  ],
  'soc-detection-3': [
    { prompt: 'What does IOC stand for?', answer: 'Indicator of Compromise' },
    { prompt: 'Which IOC type is an exact fingerprint of a known malware sample?', answer: 'file hash', accept: ['hash', 'file hashes', 'hashes'] },
  ],
  'soc-detection-4': [
    { prompt: 'In which format are Sigma rules written?', answer: 'YAML' },
    { prompt: 'Which file-matching rule format is Sigma compared to?', answer: 'YARA' },
  ],
  'soc-ir-1': [
    { prompt: 'Which investigative question is answered last: who, from where, when, what or how?', answer: 'how' },
    { prompt: 'Finding how initial access really happened is called root ____ analysis.', answer: 'cause' },
  ],
  'soc-ir-2': [
    { prompt: 'What does SOAR stand for?', answer: 'Security Orchestration, Automation, and Response', accept: ['security orchestration automation response'] },
    { prompt: 'What is an automated SOAR workflow called?', answer: 'playbook', accept: ['a playbook'] },
  ],
  'soc-ir-3': [
    { prompt: 'Which PCI-DSS requirement mandates daily log review?', answer: '10.6' },
    { prompt: 'What is the minimum PCI-DSS log retention, in years?', answer: '1', accept: ['one', '1 year'] },
  ],
  'soc-ir-4': [
    { prompt: 'Attackers reached Target’s network through which kind of vendor’s credentials?', answer: 'HVAC' },
    { prompt: 'Roughly how many million card numbers were stolen from Target?', answer: '40', accept: ['40 million'] },
  ],
  'for-1': [
    { prompt: 'Never analyse the original evidence — always work from a forensic what?', answer: 'copy', accept: ['image', 'forensic copy'] },
    { prompt: 'The documented record of who held the evidence and when is the chain of what?', answer: 'custody' },
  ],
  'for-2': [
    { prompt: 'Which command surfaces human-readable text from a memory image?', answer: 'strings' },
    { prompt: 'Grepping memory strings for "http" looks for URLs, a common indicator of what? (acronym)', answer: 'C2' },
  ],
  'for-3': [
    { prompt: 'Which Windows Security Event ID records a successful logon?', answer: '4624' },
    { prompt: 'Which Event ID records a failed logon?', answer: '4625' },
  ],
  'for-4': [
    { prompt: 'Which NTFS structure records file metadata (written with a $ prefix)?', answer: '$MFT', accept: ['mft'] },
    { prompt: 'Which tool is used for file carving in this lesson?', answer: 'foremost' },
  ],
  'for-5': [
    { prompt: 'Which framework is the standard open-source memory forensics tool?', answer: 'Volatility' },
    { prompt: 'Which Volatility plugin detects injected code?', answer: 'malfind' },
  ],
  'for-6': [
    { prompt: 'Which serial-killer case shows forensic evidence determining the outcome?', answer: 'BTK', accept: ['btk killer'] },
    { prompt: 'Which darknet-market case closes the lesson?', answer: 'Silk Road' },
  ],
};
