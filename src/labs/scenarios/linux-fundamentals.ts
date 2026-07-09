import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const linuxFundamentalsLab: LabScenario = {
  id: 'linux-fundamentals',
  title: 'Linux Fundamentals Challenge',
  difficulty: 'Easy',
  category: 'Linux',
  briefing:
    'Your attack box has a leftover project directory from a previous engagement. Somewhere inside it ' +
    'is a flag left by a teammate, hidden behind ordinary Linux misdirection: a dotfile buried inside a ' +
    'nested backup directory. Use navigation, cat, find, and grep to track it down.',
  objectives: [
    { text: 'Explore the /root/projects directory tree with ls -la', why: 'plain ls silently skips dotfiles — real engagements hide notes, credentials, and backups behind a leading dot constantly, so -a is never optional during recon.' },
    { text: "Locate the hidden flag file with find /root -name '*.txt' or grep -r flag /root/projects", why: 'find and grep -r are how you search a filesystem faster than clicking through directories by hand — the same technique you\'ll use to hunt for SUID binaries and credentials later in this course.' },
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
