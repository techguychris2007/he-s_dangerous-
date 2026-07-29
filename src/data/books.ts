export type BookTrack = 'programming' | 'security';

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  track: BookTrack;
  /** only meaningful for track: 'programming' */
  language?: 'python' | 'cpp' | 'java' | 'javascript';
  /** position in this track's recommended reading sequence, 1-based */
  order: number;
  /** served from public/books/ — the exact, unmodified official PDF, cached locally so reading
   *  and downloading never require leaving the portal */
  filename: string;
  fileSizeMb: string;
  license: string;
  licenseUrl: string;
  /** the book's own official site — credited for attribution, not required for reading */
  officialUrl: string;
  description: string;
}

/** Every PDF here is the exact, unmodified file downloaded directly from each book's official
 *  source — verified as a valid, complete PDF (correct %PDF header and %%EOF trailer, matching
 *  Content-Length) before being added. Every one is either a U.S. federal government work (public
 *  domain, no restriction at all) or released under a Creative Commons license that explicitly
 *  permits free copying and redistribution. Nothing here is paraphrased, summarized, or otherwise
 *  altered from the original — well-known commercial/copyrighted security titles (the kind sold
 *  by O'Reilly, No Starch, etc.) are deliberately not included, since those aren't legally free
 *  to redistribute regardless of how easy unauthorized copies are to find online. */
export const BOOKS: Book[] = [
  // --- Programming track ---
  {
    id: 'think-python',
    title: 'Think Python',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey',
    track: 'programming',
    language: 'python',
    order: 1,
    filename: 'think-python.pdf',
    fileSizeMb: '0.9',
    license: 'CC BY-NC-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    officialUrl: 'https://greenteapress.com/wp/think-python-2e/',
    description:
      'A widely-used introduction to Python and programming itself — variables, functions, ' +
      'recursion, and data structures, building toward real programs rather than just syntax.',
  },
  {
    id: 'think-cpp',
    title: 'Think C++',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey',
    track: 'programming',
    language: 'cpp',
    order: 2,
    filename: 'think-cpp.pdf',
    fileSizeMb: '0.8',
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    officialUrl: 'https://greenteapress.com/wp/think-c/',
    description:
      'The C++ companion to Think Python — the same clear, problem-first teaching style applied ' +
      'to C++ fundamentals: types, pointers, classes, and vectors.',
  },
  {
    id: 'think-java',
    title: 'Think Java',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey &amp; Chris Mayfield',
    track: 'programming',
    language: 'java',
    order: 3,
    filename: 'think-java.pdf',
    fileSizeMb: '2.0',
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    officialUrl: 'https://greenteapress.com/wp/think-java-2e/',
    description:
      'A full introduction to Java and object-oriented programming, used in college courses ' +
      'worldwide — one chapter per week, from Hello World through classes and objects.',
  },
  {
    id: 'eloquent-javascript',
    title: 'Eloquent JavaScript',
    subtitle: '4th Edition',
    author: 'Marijn Haverbeke',
    track: 'programming',
    language: 'javascript',
    order: 4,
    filename: 'eloquent-javascript.pdf',
    fileSizeMb: '2.0',
    license: 'CC BY-NC 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/',
    officialUrl: 'https://eloquentjavascript.net/',
    description:
      'A modern, respected deep dive into JavaScript — from language fundamentals through the ' +
      'browser DOM, async programming, and Node.js — with a well-known project-based teaching style.',
  },

  // --- Cybersecurity track, in recommended reading order ---
  {
    id: 'nist-intro-to-infosec',
    title: 'An Introduction to Information Security',
    subtitle: 'NIST Special Publication 800-12 Rev. 1',
    author: 'NIST',
    track: 'security',
    order: 1,
    filename: 'nist-intro-to-infosec.pdf',
    fileSizeMb: '1.3',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/12/r1/final',
    description:
      'Start here. A foundational, vendor-neutral overview of information security concepts, ' +
      'principles, and controls — the vocabulary every other book in this shelf assumes you already have.',
  },
  {
    id: 'nist-cybersecurity-framework',
    title: 'The NIST Cybersecurity Framework 2.0',
    subtitle: 'NIST CSWP 29',
    author: 'NIST',
    track: 'security',
    order: 2,
    filename: 'nist-cybersecurity-framework.pdf',
    fileSizeMb: '1.4',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://www.nist.gov/cyberframework',
    description:
      'The industry-standard framework for thinking about cybersecurity risk at an organizational ' +
      'level — Govern, Identify, Protect, Detect, Respond, Recover. The map for everything that follows.',
  },
  {
    id: 'crypto101',
    title: 'Crypto 101',
    subtitle: 'An Introductory Course on Cryptography',
    author: 'Laurens Van Houtven',
    track: 'security',
    order: 3,
    filename: 'crypto101.pdf',
    fileSizeMb: '14.9',
    license: 'CC BY-NC 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
    officialUrl: 'https://www.crypto101.io/',
    description:
      'Every security topic eventually touches cryptography. A genuinely readable, no-prerequisites ' +
      'introduction to how encryption, hashing, and signatures actually work — and how they fail.',
  },
  {
    id: 'nist-digital-identity-guidelines',
    title: 'Digital Identity Guidelines',
    subtitle: 'NIST Special Publication 800-63-3',
    author: 'NIST',
    track: 'security',
    order: 4,
    filename: 'nist-digital-identity-guidelines.pdf',
    fileSizeMb: '1.5',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://pages.nist.gov/800-63-3/',
    description:
      'The authoritative reference for authentication and identity proofing — passwords, MFA, and ' +
      'federation, applying the cryptography from the previous book to the problem of "who is this?"',
  },
  {
    id: 'nist-security-testing-guide',
    title: 'Technical Guide to Information Security Testing and Assessment',
    subtitle: 'NIST Special Publication 800-115',
    author: 'NIST',
    track: 'security',
    order: 5,
    filename: 'nist-security-testing-guide.pdf',
    fileSizeMb: '0.5',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/115/final',
    description:
      'The offensive side: how vulnerability scanning, penetration testing, and security assessments ' +
      'are actually planned and run — the methodology behind "hacking," done properly and legally.',
  },
  {
    id: 'nist-forensics-guide',
    title: 'Guide to Integrating Forensic Techniques into Incident Response',
    subtitle: 'NIST Special Publication 800-86',
    author: 'NIST',
    track: 'security',
    order: 6,
    filename: 'nist-forensics-guide.pdf',
    fileSizeMb: '2.7',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/86/final',
    description:
      'Once you know how systems get compromised, this covers how to prove it: collecting and ' +
      'preserving digital evidence from files, operating systems, network traffic, and applications.',
  },
  {
    id: 'nist-incident-handling-guide',
    title: 'Computer Security Incident Handling Guide',
    subtitle: 'NIST Special Publication 800-61 Rev. 2',
    author: 'NIST',
    track: 'security',
    order: 7,
    filename: 'nist-incident-handling-guide.pdf',
    fileSizeMb: '1.7',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/61/r2/final',
    description:
      'The capstone: how a real incident response team actually operates end to end — preparation, ' +
      'detection, containment, eradication, and recovery — bringing every earlier book together.',
  },
];

export function findBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

export function booksInTrack(track: BookTrack): Book[] {
  return BOOKS.filter((b) => b.track === track).sort((a, b) => a.order - b.order);
}
