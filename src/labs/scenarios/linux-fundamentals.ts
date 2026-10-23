import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const linuxFundamentalsLab: LabScenario = {
  id: 'linux-fundamentals',
  title: 'Linux Fundamentals Challenge',
  difficulty: 'Easy',
  category: 'Linux',
  briefing:
    'A teammate has left a training artifact in /root/projects, alongside ordinary project notes and a stale database export. '+
    'Your task is to locate and read that artifact without editing or deleting the project files. '+
    'You already have a root shell on your local lab workstation; there is no remote login or privilege escalation in this exercise. '+
    'Practice reading directory listings, following absolute paths, and distinguishing a filename search from a content search. '+
    'Some names begin with a dot, so a normal listing does not show the entire directory. The Reference tab explains each command before you use it.',
  objectives: [
    { text: 'Identify your user and current directory, then inspect /root/projects', why: 'whoami identifies your account and pwd identifies your location. /root/projects is an absolute path, so it works regardless of your current directory.' },
    { text: 'Compare a normal directory listing with one that includes hidden names', why: 'ls -a includes dotfiles; ls -l adds metadata. A leading dot changes listing behavior, not the file’s access permissions.' },
    { text: 'Locate the artifact using either a filename search or a recursive content search', why: "find /root/projects -name '*.txt' matches names. grep -r flag /root/projects matches text inside files. Quote the wildcard so find receives the pattern unchanged." },
    { text: 'Read the flag with cat', why: 'cat is the fastest way to dump a small file to the terminal — you\'ll reach for less/head/tail instead once files get large enough to scroll.' },
  ],
  hints: [
    "ls -la shows hidden dotfiles that plain ls does not.",
    "find /root -name '*.txt' will list every .txt file recursively — one of them isn't what it seems.",
    "Try: grep -r flag /root/projects  to search file contents directly instead of guessing names.",
  ],
  totalFlags: 1,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({
      root: dir({
        'projects': dir({
          'client-alpha': dir({
            'notes.txt': file('Nothing interesting here. Client Alpha engagement wrapped up clean.\n'),
            '.old_backup': dir({
              'db_dump.sql': file('-- stale sql dump, no creds of interest\nCREATE TABLE users (id INT);\n'),
              '.hidden_flag.txt': file('Nice work digging into dotfiles.\nflag{ls_dash_a_reveals_everything}\n'),
            }),
          }),
          'client-beta': dir({
            'README.md': file('# Client Beta\nEngagement notes pending.\n'),
          }),
        }),
      }),
    }),
  },
  network: [],
};
