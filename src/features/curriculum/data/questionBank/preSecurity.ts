import type { TypedQuestion } from '../../../../shared/types/domain';

/** Foundations and Kali workstation lessons. */
export const PRE_SECURITY_QUESTIONS: Record<string, TypedQuestion[]> = {
  'pre-intro-1': [
    { prompt: 'Which CIA goal is broken when ransomware stops a hospital from opening patient records?', answer: 'availability' },
    { prompt: 'Which step of AAA decides what a logged-in user is allowed to do?', answer: 'authorisation', accept: ['authorization'] },
  ],
  'pre-intro-2': [
    { prompt: 'What do we call a weakness — such as a software bug or weak password — that a threat could exploit?', answer: 'vulnerability', accept: ['a vulnerability'] },
    { prompt: 'An alert that fires on 50 failed logins in a minute is which kind of control: preventive, detective, or corrective?', answer: 'detective', accept: ['detective control'] },
  ],
  'pre-intro-3': [
    { prompt: 'What is the written agreement that sets scope, timing, and limits for an authorised test called?', answer: 'rules of engagement', accept: ['rules of engagement document'] },
    { prompt: 'Which NIST CSF 2.0 function covers monitoring alerts and noticing attacks?', answer: 'detect', accept: ['Detect'] },
  ],
  'pre-intro-4': [
    { prompt: 'Which NICE Framework category contains Incident Response and Threat Analysis work roles?', answer: 'protection and defense', accept: ['protection and defence', 'Protection and Defense', 'Protection and Defence'] },
    { prompt: 'What do we call a competition or practice challenge where participants solve security puzzles to find hidden flags?', answer: 'CTF', accept: ['capture the flag', 'Capture The Flag'] },
  ],
  'pre-compute-1': [
    { prompt: 'Which command lists a directory including its hidden files?', answer: 'ls -la', accept: ['ls -a', 'ls -al'] },
    { prompt: 'What does the platform call the checkpoint that proves you completed a specific action?', answer: 'flag', accept: ['a flag', 'flags'] },
  ],
  'pre-compute-2': [
    { prompt: 'What kind of path starts from the filesystem root, such as /root/training/readiness-note.txt?', answer: 'absolute', accept: ['absolute path', 'an absolute path'] },
    { prompt: 'Which command prints the user the terminal is running as?', answer: 'whoami' },
  ],
  'pre-compute-3': [
    { prompt: 'A small capture built for teaching rather than taken from a live network is described as what?', answer: 'synthetic', accept: ['synthetic capture'] },
    { prompt: 'When a lab calls evidence a "training ____", report it exactly that way. What is the missing word?', answer: 'fixture', accept: ['training fixture'] },
  ],
  'kali-foundation-3': [
    { prompt: 'Which apt command refreshes the local package indexes without upgrading anything?', answer: 'apt update', accept: ['sudo apt update'] },
    { prompt: 'Which command reports the installed version of a package, for example nmap?', answer: 'dpkg-query', accept: ['dpkg-query -W nmap', 'dpkg-query -w'] },
  ],
  'kali-foundation-4': [
    { prompt: 'Which ip command asks which route the kernel would choose for a single destination?', answer: 'ip route get' },
    { prompt: 'Which command asks the configured system name service, including /etc/hosts, to resolve a name?', answer: 'getent hosts', accept: ['getent'] },
  ],
  'pre-ready-1': [
    { prompt: 'Which Burp tool do you use to compare responses after editing a request?', answer: 'Repeater', accept: ['Burp Repeater'] },
    { prompt: 'Which tool answers the question "what packets crossed the wire"?', answer: 'Wireshark' },
  ],
  'pre-ready-2': [
    { prompt: 'Which part of a write-up shows you understand where your evidence stops?', answer: 'limitations', accept: ['limitation', 'the limitations'] },
    { prompt: 'How many lines does the beginner note format in this lesson use?', answer: 'five', accept: ['5'] },
  ],
  'pre-ready-3': [
    { prompt: 'How many checkpoints does the pre-security toolkit capstone ask for?', answer: 'nine', accept: ['9'] },
    { prompt: 'Which tool provides the three forensic checkpoints in the capstone?', answer: 'Autopsy' },
  ],
};
