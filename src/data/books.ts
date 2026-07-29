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
  /** groups the security track into a guided learning path (rendered as section headers) —
   *  unused for the programming track, which has no meaningful phases */
  stage?:
    | 'Foundations'
    | 'Governance & Risk Management'
    | 'Network & Systems Hardening'
    | 'Offensive Testing & Ethical Hacking'
    | 'Response & Forensics'
    | 'Advanced & Specialized Security Engineering';
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
  {
    id: 'a-byte-of-python',
    title: 'A Byte of Python',
    subtitle: 'A Beginner-Friendly Python Tutorial',
    author: 'Swaroop C H',
    track: 'programming',
    language: 'python',
    order: 5,
    filename: 'a-byte-of-python.pdf',
    fileSizeMb: '1.1',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    officialUrl: 'https://python.swaroopch.com/',
    description:
      'A shorter, faster-paced second take on Python for readers who found Think Python\'s pace slow — ' +
      'one of the most widely translated free Python tutorials, hosted on Wikimedia Commons under CC BY-SA.',
  },
  {
    id: 'python-for-everybody',
    title: 'Python for Everybody',
    subtitle: 'Exploring Data Using Python 3',
    author: 'Dr. Charles R. Severance',
    track: 'programming',
    language: 'python',
    order: 6,
    filename: 'python-for-everybody.pdf',
    fileSizeMb: '2.3',
    license: 'CC BY-NC-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    officialUrl: 'https://www.py4e.com/book.php',
    description:
      'A third angle on Python, aimed squarely at using it as a tool rather than studying it as a ' +
      'subject — built around a university course, using data (files, databases, the web) as the ' +
      'motivating problem for every concept instead of abstract exercises.',
  },

  // --- Cybersecurity track: a 6-stage, beginner-to-advanced self-teaching path. Sourced from
  // NIST (csrc.nist.gov, all public domain U.S. government works) and OWASP (github.com/OWASP,
  // all CC BY-SA 4.0) — never a commercial/copyrighted title, regardless of how well-known it is.

  // === Stage 1: Foundations ===
  {
    id: 'nist-intro-to-infosec',
    title: 'An Introduction to Information Security',
    subtitle: 'NIST Special Publication 800-12 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
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
    id: 'nist-fips-199',
    title: 'Standards for Security Categorization',
    subtitle: 'FIPS Publication 199',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
    order: 2,
    filename: 'nist-fips-199.pdf',
    fileSizeMb: '0.08',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/fips/199/final',
    description:
      'A short, foundational idea worth internalizing early: not everything needs the same level of ' +
      'protection. This defines the low/moderate/high categorization that every later risk decision on ' +
      'this shelf builds on.',
  },
  {
    id: 'nist-fips-200',
    title: 'Minimum Security Requirements for Federal Information and Information Systems',
    subtitle: 'FIPS Publication 200',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
    order: 3,
    filename: 'nist-fips-200.pdf',
    fileSizeMb: '0.21',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/fips/200/final',
    description:
      'The 17-topic-area minimum security bar every system should clear — a compact map of the ' +
      'territory (access control, incident response, risk assessment, and more) that this whole shelf fills in.',
  },
  {
    id: 'nist-cybersecurity-framework',
    title: 'The NIST Cybersecurity Framework 2.0',
    subtitle: 'NIST CSWP 29',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
    order: 4,
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
    id: 'nist-security-awareness-training',
    title: 'Building a Cybersecurity and Privacy Awareness and Training Program',
    subtitle: 'NIST Special Publication 800-50 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
    order: 5,
    filename: 'nist-security-awareness-training.pdf',
    fileSizeMb: '4.1',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/50/r1/final',
    description:
      'Security is a people problem as much as a technical one. Covers how real organizations teach ' +
      'everyone, not just specialists, to recognize threats — the human layer underneath every control on this shelf.',
  },
  {
    id: 'nist-security-plans-guide',
    title: 'Guide for Developing Security Plans for Federal Information Systems',
    subtitle: 'NIST Special Publication 800-18 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Foundations',
    order: 6,
    filename: 'nist-security-plans-guide.pdf',
    fileSizeMb: '0.36',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/18/r1/final',
    description:
      'How security actually gets planned and documented for a real system before a single control is ' +
      'implemented — the paperwork-and-planning skill that turns "we should be secure" into an executable plan.',
  },
  {
    id: 'crypto101',
    title: 'Crypto 101',
    subtitle: 'An Introductory Course on Cryptography',
    author: 'Laurens Van Houtven',
    track: 'security',
    stage: 'Foundations',
    order: 7,
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
    stage: 'Foundations',
    order: 8,
    filename: 'nist-digital-identity-guidelines.pdf',
    fileSizeMb: '1.5',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://pages.nist.gov/800-63-3/',
    description:
      'The authoritative reference for authentication and identity proofing — passwords, MFA, and ' +
      'federation, applying the cryptography from the previous book to the problem of "who is this?"',
  },

  // === Stage 2: Governance & Risk Management ===
  {
    id: 'nist-risk-assessment-guide',
    title: 'Guide for Conducting Risk Assessments',
    subtitle: 'NIST Special Publication 800-30 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Governance & Risk Management',
    order: 9,
    filename: 'nist-risk-assessment-guide.pdf',
    fileSizeMb: '0.8',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/30/r1/final',
    description:
      'The Cybersecurity Framework said "manage risk" — this is how that actually gets done: identifying ' +
      'threats, vulnerabilities, likelihood, and impact in a structured, repeatable way.',
  },
  {
    id: 'nist-risk-management-framework',
    title: 'Risk Management Framework for Information Systems and Organizations',
    subtitle: 'NIST Special Publication 800-37 Rev. 2',
    author: 'NIST',
    track: 'security',
    stage: 'Governance & Risk Management',
    order: 10,
    filename: 'nist-risk-management-framework.pdf',
    fileSizeMb: '2.2',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/37/r2/final',
    description:
      'The end-to-end process — categorize, select, implement, assess, authorize, monitor — that turns a ' +
      'risk assessment into an actual authorized, running, continuously-checked system.',
  },
  {
    id: 'nist-800-53-controls',
    title: 'Security and Privacy Controls for Information Systems and Organizations',
    subtitle: 'NIST Special Publication 800-53 Rev. 5',
    author: 'NIST',
    track: 'security',
    stage: 'Governance & Risk Management',
    order: 11,
    filename: 'nist-800-53-controls.pdf',
    fileSizeMb: '5.8',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final',
    description:
      'The master catalog: over a thousand specific, numbered security and privacy controls, organized ' +
      'into families, that the Risk Management Framework selects from. The reference every later book in ' +
      'this shelf ultimately points back to.',
  },
  {
    id: 'nist-protecting-cui',
    title: 'Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations',
    subtitle: 'NIST Special Publication 800-171 Rev. 3',
    author: 'NIST',
    track: 'security',
    stage: 'Governance & Risk Management',
    order: 12,
    filename: 'nist-protecting-cui.pdf',
    fileSizeMb: '1.5',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/171/r3/final',
    description:
      'A concrete, real-world application of everything above: the actual requirements a private company ' +
      '(a defense contractor, for example) must meet to legally handle sensitive government data.',
  },

  // === Stage 3: Network & Systems Hardening ===
  {
    id: 'nist-firewall-guidelines',
    title: 'Guidelines on Firewalls and Firewall Policy',
    subtitle: 'NIST Special Publication 800-41 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 13,
    filename: 'nist-firewall-guidelines.pdf',
    fileSizeMb: '0.33',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/41/r1/final',
    description:
      'Governance decided what to protect and how much risk is acceptable — now the hands-on work of ' +
      'actually locking systems down begins, starting with the oldest network control there is.',
  },
  {
    id: 'nist-server-security-guide',
    title: 'Guide to General Server Security',
    subtitle: 'NIST Special Publication 800-123',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 14,
    filename: 'nist-server-security-guide.pdf',
    fileSizeMb: '0.26',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/123/final',
    description:
      'The baseline hardening checklist for any server: patching, minimal services, secure configuration, ' +
      'and administration — the boring, essential work most real breaches happen because someone skipped.',
  },
  {
    id: 'nist-wireless-lan-security',
    title: 'Guidelines for Securing Wireless Local Area Networks (WLANs)',
    subtitle: 'NIST Special Publication 800-153',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 15,
    filename: 'nist-wireless-lan-security.pdf',
    fileSizeMb: '0.6',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/153/final',
    description:
      'Wi-Fi is a network perimeter you can\'t see — rogue access points, weak authentication, and ' +
      'unmanaged client devices. Practical guidance for locking down the wireless layer specifically.',
  },
  {
    id: 'nist-bluetooth-security',
    title: 'Guide to Bluetooth Security',
    subtitle: 'NIST Special Publication 800-121 Rev. 2',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 16,
    filename: 'nist-bluetooth-security.pdf',
    fileSizeMb: '2.1',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/121/r2/final',
    description:
      'A second, easy-to-forget wireless attack surface: pairing vulnerabilities, eavesdropping, and the ' +
      'security modes actually built into the Bluetooth standard, most of which go unused by default.',
  },
  {
    id: 'nist-key-management',
    title: 'Recommendation for Key Management, Part 1: General',
    subtitle: 'NIST Special Publication 800-57 Part 1 Rev. 5',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 17,
    filename: 'nist-key-management.pdf',
    fileSizeMb: '1.6',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final',
    description:
      'Crypto 101 taught how encryption works; this is the unglamorous, essential problem every real ' +
      'system built on it faces — generating, distributing, rotating, and retiring keys without ever ' +
      'leaking one.',
  },
  {
    id: 'nist-log-management',
    title: 'Guide to Computer Security Log Management',
    subtitle: 'NIST Special Publication 800-92',
    author: 'NIST',
    track: 'security',
    stage: 'Network & Systems Hardening',
    order: 18,
    filename: 'nist-log-management.pdf',
    fileSizeMb: '1.8',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/92/final',
    description:
      'A hardened system that isn\'t being watched is still blind. Closes out this stage with the ' +
      'visibility layer — generating, storing, and actually using logs — that the offensive-testing and ' +
      'incident-response stages ahead both depend on.',
  },

  // === Stage 4: Offensive Testing & Ethical Hacking ===
  {
    id: 'nist-security-testing-guide',
    title: 'Technical Guide to Information Security Testing and Assessment',
    subtitle: 'NIST Special Publication 800-115',
    author: 'NIST',
    track: 'security',
    stage: 'Offensive Testing & Ethical Hacking',
    order: 19,
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
    id: 'owasp-wstg',
    title: 'OWASP Web Security Testing Guide',
    subtitle: 'Version 4.2',
    author: 'OWASP Foundation &amp; Contributors',
    track: 'security',
    stage: 'Offensive Testing & Ethical Hacking',
    order: 20,
    filename: 'owasp-wstg.pdf',
    fileSizeMb: '9.7',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    officialUrl: 'https://owasp.org/www-project-web-security-testing-guide/',
    description:
      'The methodology the NIST testing guide points at but doesn’t itemize: hundreds of concrete, ' +
      'named test cases for finding real vulnerabilities in real web applications — injection, auth, ' +
      'session management, and more — maintained on GitHub by working penetration testers.',
  },
  {
    id: 'owasp-asvs',
    title: 'OWASP Application Security Verification Standard',
    subtitle: 'Version 5.0.0',
    author: 'OWASP Foundation &amp; Contributors',
    track: 'security',
    stage: 'Offensive Testing & Ethical Hacking',
    order: 21,
    filename: 'owasp-asvs.pdf',
    fileSizeMb: '0.5',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    officialUrl: 'https://owasp.org/www-project-application-security-verification-standard/',
    description:
      'The checklist that turns everything else on this shelf into a pass/fail bar: hundreds of ' +
      'numbered, testable security requirements for authentication, session management, access ' +
      'control, and more, used by real organizations to verify real applications before shipping.',
  },
  {
    id: 'owasp-mastg',
    title: 'OWASP Mobile Application Security Testing Guide',
    subtitle: 'Version 1.6.0',
    author: 'OWASP Foundation &amp; Contributors',
    track: 'security',
    stage: 'Offensive Testing & Ethical Hacking',
    order: 22,
    filename: 'owasp-mastg.pdf',
    fileSizeMb: '29.6',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    officialUrl: 'https://mas.owasp.org/MASTG/',
    description:
      'Everything above this applies to a browser tab; a phone is a different attack surface. A ' +
      'complete manual for testing and reverse-engineering Android and iOS apps — insecure storage, ' +
      'weak cryptography, reverse engineering with real tools, and how apps try (and fail) to detect ' +
      'tampering — closing out the offensive-testing arc of this shelf.',
  },

  // === Stage 5: Response & Forensics ===
  {
    id: 'nist-malware-incident-prevention',
    title: 'Guide to Malware Incident Prevention and Handling for Desktops and Laptops',
    subtitle: 'NIST Special Publication 800-83 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Response & Forensics',
    order: 23,
    filename: 'nist-malware-incident-prevention.pdf',
    fileSizeMb: '0.6',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/83/r1/final',
    description:
      'When offensive testing finds what could go wrong, this is what actually happens when it does: ' +
      'detecting, containing, and eradicating malware on real endpoints, plus preventing the next infection.',
  },
  {
    id: 'nist-forensics-guide',
    title: 'Guide to Integrating Forensic Techniques into Incident Response',
    subtitle: 'NIST Special Publication 800-86',
    author: 'NIST',
    track: 'security',
    stage: 'Response & Forensics',
    order: 24,
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
    id: 'nist-mobile-forensics',
    title: 'Guidelines on Mobile Device Forensics',
    subtitle: 'NIST Special Publication 800-101 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Response & Forensics',
    order: 25,
    filename: 'nist-mobile-forensics.pdf',
    fileSizeMb: '1.3',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/101/r1/final',
    description:
      'The forensics guide applied to the device most incidents now involve somewhere in the chain — ' +
      'acquisition, preservation, and examination techniques specific to phones and tablets.',
  },
  {
    id: 'nist-media-sanitization',
    title: 'Guidelines for Media Sanitization',
    subtitle: 'NIST Special Publication 800-88 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Response & Forensics',
    order: 26,
    filename: 'nist-media-sanitization.pdf',
    fileSizeMb: '0.7',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/88/r1/final',
    description:
      'The mirror image of forensic recovery: how to make sure data on retired drives and devices is ' +
      'actually, verifiably gone — because "deleted" and "unrecoverable" are very different things.',
  },
  {
    id: 'nist-incident-handling-guide',
    title: 'Computer Security Incident Handling Guide',
    subtitle: 'NIST Special Publication 800-61 Rev. 2',
    author: 'NIST',
    track: 'security',
    stage: 'Response & Forensics',
    order: 27,
    filename: 'nist-incident-handling-guide.pdf',
    fileSizeMb: '1.7',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/61/r2/final',
    description:
      'This stage\'s capstone: how a real incident response team actually operates end to end — ' +
      'preparation, detection, containment, eradication, and recovery — bringing malware handling, ' +
      'forensics, and mobile forensics together into one process.',
  },

  // === Stage 6: Advanced & Specialized Security Engineering ===
  {
    id: 'nist-ics-security',
    title: 'Guide to Operational Technology (OT) Security',
    subtitle: 'NIST Special Publication 800-82 Rev. 3',
    author: 'NIST',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 28,
    filename: 'nist-ics-security.pdf',
    fileSizeMb: '8.6',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/82/r3/final',
    description:
      'Everything so far assumed IT systems. Industrial control systems — power grids, water treatment, ' +
      'manufacturing — run on different protocols with a different priority order (availability and safety ' +
      'over confidentiality), covered here as a specialization of its own.',
  },
  {
    id: 'nist-zero-trust-architecture',
    title: 'Zero Trust Architecture',
    subtitle: 'NIST Special Publication 800-207',
    author: 'NIST',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 29,
    filename: 'nist-zero-trust-architecture.pdf',
    fileSizeMb: '1.0',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/207/final',
    description:
      'The modern rethink of the firewall-and-perimeter model from Stage 3: "never trust, always verify," ' +
      'evaluated per-request rather than assumed once you\'re inside the network. The architecture behind ' +
      'most current enterprise security roadmaps.',
  },
  {
    id: 'nist-config-management',
    title: 'Guide for Security-Focused Configuration Management of Information Systems',
    subtitle: 'NIST Special Publication 800-128',
    author: 'NIST',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 30,
    filename: 'nist-config-management.pdf',
    fileSizeMb: '1.1',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/128/final',
    description:
      'How a hardened baseline (Stage 3) stays hardened over time instead of drifting — tracking, ' +
      'controlling, and auditing every configuration change across a system\'s whole lifecycle.',
  },
  {
    id: 'nist-systems-security-engineering',
    title: 'Engineering Trustworthy Secure Systems',
    subtitle: 'NIST Special Publication 800-160 Volume 1 Rev. 1',
    author: 'NIST',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 31,
    filename: 'nist-systems-security-engineering.pdf',
    fileSizeMb: '7.8',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final',
    description:
      'A dense, advanced systems-engineering treatment of security as a first-class design property ' +
      'engineered in from the start, not bolted on after — the discipline behind building the next system ' +
      'instead of just assessing an existing one.',
  },
  {
    id: 'nist-secure-software-dev-framework',
    title: 'Secure Software Development Framework (SSDF)',
    subtitle: 'NIST Special Publication 800-218',
    author: 'NIST',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 32,
    filename: 'nist-secure-software-dev-framework.pdf',
    fileSizeMb: '0.7',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/800/218/final',
    description:
      'Secure engineering applied specifically to how software gets built: practices for the whole ' +
      'development lifecycle that reduce vulnerabilities before code ever ships — the connective tissue ' +
      'between this shelf and the Code Portal\'s programming track.',
  },
  {
    id: 'nist-ransomware-data-integrity',
    title: 'Data Integrity: Identifying and Protecting Assets Against Ransomware and Other Destructive Events',
    subtitle: 'NIST Special Publication 1800-25',
    author: 'NIST National Cybersecurity Center of Excellence',
    track: 'security',
    stage: 'Advanced & Specialized Security Engineering',
    order: 33,
    filename: 'nist-ransomware-data-integrity.pdf',
    fileSizeMb: '42.2',
    license: 'Public Domain (U.S. Government Work)',
    licenseUrl: 'https://www.nist.gov/nist-research-library/nist-technical-series-publications-author-instructions#pubid',
    officialUrl: 'https://csrc.nist.gov/pubs/sp/1800/25/final',
    description:
      'The capstone of this whole shelf: a real, practical NIST reference architecture for defending ' +
      'against ransomware specifically — tying risk management, hardening, logging, backups, and incident ' +
      'response together against one of the most common real-world threats an organization will face.',
  },
];

export function findBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

export function booksInTrack(track: BookTrack): Book[] {
  return BOOKS.filter((b) => b.track === track).sort((a, b) => a.order - b.order);
}
