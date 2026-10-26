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
    { text: 'Identify your user and current directory, then inspect /root/projects', scene: 'You have a shell, but the prompt alone is not reliable evidence of who you are or which filesystem location you are viewing.', question: 'Which account is executing commands, where did the shell start, and does the assigned project directory exist?', why: 'Use identity and location commands before touching evidence. whoami identifies the account, pwd identifies the current directory, and an absolute path such as /root/projects works regardless of where the shell started.', observe: 'Read the username and full path. In the listing, separate files from directories and note that the visible names do not yet prove the artifact is absent.', decision: 'Confirm the shell context and choose the project directory as the narrowest sensible search scope.' },
    { text: 'Compare a normal directory listing with one that includes hidden names', scene: 'The visible project listing does not contain the promised artifact. That creates two hypotheses: it is deeper in the tree, or its name is hidden by the normal listing view.', question: 'Does the directory contain entries that the default listing omitted, and what does their metadata say?', why: 'Use the all-files option when a normal listing may hide dot-prefixed names. Add the long format when ownership, type and permission evidence matters. A leading dot changes display convention; it is not encryption or access control.', observe: 'Compare the two outputs line by line. Look for names beginning with a dot, directory markers and permission strings, then follow the directory rather than guessing a filename.', decision: 'Name the newly visible lead and explain why it deserves inspection without claiming it is already malicious.' },
    { text: 'Locate the artifact using either a filename search or a recursive content search', scene: 'A hidden backup directory contains more than one ordinary-looking artifact. Opening files one by one would work here, but it does not scale to a real workstation.', question: 'Should you search metadata (names) or content, and which query returns the smallest useful evidence set?', why: "find /root/projects -name '*.txt' answers a filename question. grep -r flag /root/projects answers a content question. Quote wildcards so the search tool receives the pattern, and keep the scope narrow to reduce noise.", observe: 'A filename search returns candidate paths; a content search returns matching lines and their files. Treat either result as a lead until the complete artifact is read.', decision: 'Select the candidate path whose location and content match the brief, then preserve the exact path for the next stage.' },
    { text: 'Read the flag with cat', scene: 'You now have a precise path to a small text artifact. The final step is to verify its contents, not merely report that a suspicious name exists.', question: 'What does the artifact actually say, and which line is the reproducible proof requested by the brief?', why: 'cat is appropriate for a short text file because it prints the complete contents at once. Use head, tail or less instead when a file is large enough that a full dump would hide context or overwhelm the terminal.', observe: 'Read the ordinary explanatory line as well as the proof token. The token completes the simulation; the path and surrounding text explain how it was found.', decision: 'Report the exact proof and the evidence chain: baseline, hidden entry, search result and verified file contents.' },
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
