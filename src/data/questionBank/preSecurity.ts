import type { TypedQuestion } from '../../types';

/** Pre-security and Kali workstation lessons. */
export const PRE_SECURITY_QUESTIONS: Record<string, TypedQuestion[]> = {
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
