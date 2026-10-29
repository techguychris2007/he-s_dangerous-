import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const preSecurityLabs: LabScenario[] = [
  {
    id: 'pre-lab-orientation',
    title: 'Pre-Security Lab Orientation',
    difficulty: 'Easy',
    category: 'Linux',
    briefing: 'Learn how DarkWorld labs behave before a real offensive challenge asks you to move quickly. You will read objectives, inspect files, search evidence, and capture a flag from a harmless training folder.',
    objectives: [
      { text: 'Run help and objectives to learn how the lab terminal explains itself', why: 'A good operator reads the environment before trying commands at random.' },
      { text: 'Use pwd, ls -la, cat, and grep inside /root/training', why: 'These four commands are the foundation for nearly every later Linux lab.' },
      { text: 'Capture the flag from the readiness note', why: 'The same flag capture flow records progress, unlocks completion, and feeds your evidence notebook.' },
      { text: 'Open workflow-checklist.txt and explain the three-step lab rhythm', why: 'Beginners need a repeatable pattern: read the task, prove the fact, then record only what the evidence supports.' },
      { text: 'Search hidden-notes with grep -r flag /root/training', why: 'Later labs hide evidence in nested folders, so recursive search must feel normal before the pressure increases.' },
    ],
    hints: [
      'Start with help and objectives.',
      'Use ls -la /root/training to see every training file.',
      'Try grep -r flag /root/training when you know the folder but not the exact file.',
      'Read workflow-checklist.txt, then search recursively again after you notice hidden-notes.',
    ],
    totalFlags: 2,
    attacker: {
      hostname: 'darkbox',
      user: 'learner',
      root: dir({
        root: dir({
          training: dir({
            'README.txt': file('DarkWorld training folder. Inspect notes before making claims.\n'),
            'commands.txt': file('pwd shows where you are. ls lists names. cat reads a small file. grep searches text.\n'),
            'readiness-note.txt': file('You found the lab workflow checkpoint.\nflag{pre_lab_workflow_ready}\n'),
          }),
        }),
      }),
    },
    network: [],
  },
  {
    id: 'pre-netcat-services',
    title: 'Netcat and Service Banners',
    difficulty: 'Easy',
    category: 'Network',
    briefing: 'The training portal at 10.10.10.20 has two services: a plain TCP banner listener and an HTTP application. You are checking which services answer and whether the application health endpoint is ready. Discover the services, read the banner, then request /health using the protocol appropriate to the web service. Compare a refused connection with a successful one. This is service discovery, not exploitation: no credentials or payloads are needed. Each service has its own training proof, so reading one proof repeatedly cannot complete the exercise. The Reference tab explains ports, service probing, Netcat and HTTP requests.',
    objectives: [
      { text: 'Identify the listening services on the in-scope host', why: 'nmap -sV probes service behavior. A port number is a convention, while the returned banner provides an additional clue about the application.' },
      { text: 'Read the plain TCP service banner', why: 'nc connects to a TCP listener. The banner service sends text immediately; it does not require an HTTP request. Inspect its response rather than assuming every port serves a website.' },
      { text: 'Request the web application’s /health endpoint and read its response', why: 'curl constructs an HTTP request. The URL supplies the host and resource path. A ready health response establishes readiness for this endpoint, not the security of the entire application.' },
      { text: 'Compare the banner service to the HTTP service in your own words', why: 'Beginners must learn that different services speak different protocols even when they live on the same host.' },
      { text: 'Compare a connection to closed port 9999 with the working services', why: 'A refused connection supplies no banner or proof. On real networks, a refusal and a timeout are different observations; do not treat either as a successful service check.' },
    ],
    hints: [
      'Use nmap -sV 10.10.10.20.',
      'Try nc 10.10.10.20 31337 after you see the training banner service.',
      'Use curl http://10.10.10.20/health for the web readiness check.',
      'Your final notes should say which fact came from nmap, nc, and curl.',
    ],
    totalFlags: 2,
    attacker: { hostname: 'darkbox', user: 'learner', root: dir({ root: dir({}) }) },
    network: [
      {
        hostname: 'portal-lab',
        ip: '10.10.10.20',
        os: 'Ubuntu 24.04 LTS',
        services: [
          { port: 80, name: 'http', version: 'DarkWorld Training HTTP', http: { '/': '<h1>Training Portal</h1>', '/health': '{"status":"ready","flag":"flag{pre_http_health_checked}"}' } },
          { port: 31337, name: 'training-banner', version: 'dw-banner 1.0', banner: 'DarkWorld TCP banner ready\nflag{pre_netcat_banner_read}\n' },
        ],
        users: [],
        root: dir({ srv: dir({}) }),
      },
    ],
  },
];
