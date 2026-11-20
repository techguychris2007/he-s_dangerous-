import type { LessonDepth } from './types';

/** Beginner depth for the pre-security path — the first lessons a newcomer reads. Every addition
 *  explains the idea in everyday language first, then walks through a concrete example step by step. */
export const PRE_SECURITY_DEPTH: Record<string, LessonDepth> = {
  'pre-intro-1': {
    keyTerms: [
      { term: 'CIA triad', meaning: 'The three security goals every professional works toward: Confidentiality, Integrity, and Availability.' },
      { term: 'MFA', meaning: 'Multi-factor authentication — requiring two or more independent proofs of identity, so a stolen password alone is not enough.' },
    ],
    before: [
      {
        title: 'In plain English: a school records office',
        paragraphs: [
          'Imagine a school records office. It holds student files (secrets), a grade register (records that must be accurate), and a front door that must open every morning (a service staff and students need). Security for that office means three things: strangers cannot read the files, nobody quietly changes a grade, and the door does not get jammed on exam day.',
          'Cybersecurity is exactly that, applied to computers. The files are databases. The register is any record people trust. The front door is a website, an app, or a network. The CIA triad — Confidentiality, Integrity, Availability — names those three goals. Almost every control you will ever study protects at least one of them.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: classify a headline in under 30 seconds',
        paragraphs: [
          'Next time you see a security news story, ask one question: which CIA goal failed? A database of customer emails posted online — Confidentiality. A health app that showed wrong medication doses — Integrity. A bank app offline for two hours — Availability. Many incidents break more than one, but there is usually a primary failure. Practice this until it is automatic.',
        ],
      },
    ],
  },
  'pre-intro-2': {
    keyTerms: [
      { term: 'Risk register', meaning: 'A document that lists known risks, their likelihood and impact, and what the organisation is doing about each one.' },
    ],
    before: [
      {
        title: 'In plain English: open windows and burglars',
        paragraphs: [
          'A burglar is a threat. An open window is a vulnerability. Climbing through the window is the exploit. Risk is how likely a burglary is multiplied by how much you would lose. A house full of valuables on a busy street has more risk than an empty shed in a locked compound, even if both have the same open window.',
          'Controls are what you do about it: lock the window (prevent), install a camera (detect), and keep insurance (recover from). Cybersecurity uses exactly this reasoning — just with servers instead of windows.',
        ],
      },
    ],
    after: [],
  },
  'pre-intro-3': {
    before: [
      {
        title: 'In plain English: the locksmith you hire',
        paragraphs: [
          'A homeowner hires a locksmith to try to get in, so they can find which locks are weak before a burglar does. The locksmith agrees in advance which doors to try, when to come, and not to take anything. Afterwards they hand over a list: "the back window latch opens with a card — here is how, here is the fix."',
          'That is authorised security testing. The skill is real attacker skill. The job is to protect. A locksmith who tries the neighbour\'s door without asking is not a professional — they are a burglar with good tools. Permission is the only thing that changes the story.',
        ],
      },
    ],
    after: [],
  },
  'pre-intro-4': {
    before: [
      {
        title: 'In plain English: skills beat job titles',
        paragraphs: [
          'The cybersecurity job market rewards demonstrable ability. Two candidates apply for a SOC role: one has a certificate name on a CV and nothing else; the other has three lab write-ups, five solved CTF challenges with clear explanations, and a brief home-lab project documented on GitHub. Employers consistently say the second candidate stands out — because they have shown they can think, not just memorise.',
          'The good news is that every exercise on this platform produces portfolio material if you write it up. Every flag, every evidence note, every limitation statement is practice for the kind of clear thinking security employers want.',
        ],
      },
    ],
    after: [],
  },
  'pre-compute-1': {
    keyTerms: [
      { term: 'Lab', meaning: 'A small, safe practice environment with a fixed target and a goal, built so you can learn by doing without touching real systems.' },
      { term: 'Objective', meaning: 'One step the lab wants you to complete, written as an action plus the reason it matters.' },
      { term: 'Hint', meaning: 'An optional clue you can reveal when stuck. Using hints is part of learning, not cheating.' },
      { term: 'Transcript', meaning: 'The record of every command you typed and what the system printed back — your raw evidence.' },
    ],
    before: [
      {
        title: 'In plain English: a lab is a practice pitch',
        paragraphs: [
          'Think of a DarkWorld lab like a football training pitch. The pitch is marked out, the goals are fixed, and nobody gets hurt if you miss. You are not playing a real match against a real team — you are practising moves until they become habits.',
          'A lab gives you three things: a briefing (the situation and the target), objectives (what you must achieve), and a terminal or tool (where you do the work). When you complete a step, the lab gives you a flag — a secret string such as flag{first_steps} — that proves you really did it. Nothing you do inside a lab reaches the real internet.',
          'You do not need to know everything before you start. You need to read carefully, try one thing, look at what happened and write it down. That loop — read, try, observe, record — is the whole method, from your first lab to a professional engagement.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: your first five minutes in a lab',
        paragraphs: [
          'Here is exactly what a calm first five minutes looks like. Type each command, then read the output before typing the next one — the output is the lesson.',
          '1) help lists the commands this lab supports. 2) objectives shows your goals. 3) pwd ("print working directory") tells you which folder you are in. 4) ls -la lists everything in that folder, including hidden files whose names start with a dot. 5) cat prints a text file so you can read it.',
          'In the example output below, notice what each line tells you: you are in /root/training, there is a README and a hidden .notes file, and the README tells you where to look next. A beginner who reads that output carefully finds the flag faster than someone who types fifty random commands.',
        ],
        code: '$ pwd\n/root/training\n\n$ ls -la\ndrwxr-xr-x  2 root root 4096 Mar  3 09:12 .\n-rw-r--r--  1 root root  212 Mar  3 09:12 README.txt\n-rw-r--r--  1 root root   88 Mar  3 09:12 .notes\n\n$ cat README.txt\nWelcome, analyst. Your first checkpoint is in the hidden notes file.',
        label: 'Example output — read every line',
      },
    ],
  },

  'pre-compute-2': {
    keyTerms: [
      { term: 'Filesystem', meaning: 'The way an operating system organises files into folders (directories), starting from one top folder called root, written /.' },
      { term: 'Working directory', meaning: 'The folder your terminal is "standing in" right now. Relative paths start from here.' },
      { term: 'User and group', meaning: 'Every program runs as a user; users belong to groups. Together they decide what that program is allowed to touch.' },
      { term: 'rwx', meaning: 'The three Linux permissions: r = read, w = write (change), x = execute (run). Shown for the owner, the group and everyone else.' },
    ],
    before: [
      {
        title: 'In plain English: folders, addresses and keys',
        paragraphs: [
          'A computer\'s files are organised like a building. The building is the filesystem, floors and rooms are folders, and every file has an address called a path. /home/alex/notes.txt means: start at the front door (/), go to the home floor, into alex\'s room, and pick up notes.txt.',
          'Not everyone has a key to every room. Each person who uses the computer has a user account, and each file says who may read it, change it or run it. That is why the same command can work for one user and fail with "Permission denied" for another — the computer is checking keys, not guessing.',
          'Security work is mostly asking "who could reach what?". Paths tell you where something is; users and permissions tell you who can touch it.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: reading a permission line',
        paragraphs: [
          'Run ls -l and each file gets a line like the one below. It looks cryptic, but it is just a row of facts. Read it from left to right.',
          'The first character is the type: - for a file, d for a directory. The next nine characters are three groups of rwx: rw- for the owner (alex can read and write), r-- for the group (staff can only read), and --- for everyone else (no access at all). Then come the owner (alex), the group (staff), the size in bytes, the date and the name.',
          'So for salary.csv, you can say precisely: "alex can read and change it, members of staff can read it, nobody else can open it." That is the careful, factual style every later lab expects.',
        ],
        code: '$ whoami\nlearner\n\n$ ls -l /home/alex\n-rw-r----- 1 alex staff 1824 Mar  3 09:40 salary.csv\n-rwxr-xr-x 1 alex staff  512 Mar  3 09:41 backup.sh\n\n$ cat /home/alex/salary.csv\ncat: /home/alex/salary.csv: Permission denied',
        label: 'learner is not alex and not in staff, so the read is denied',
      },
    ],
  },

  'pre-compute-3': {
    keyTerms: [
      { term: 'Isolated range', meaning: 'A practice network cut off from the internet, so nothing you do can affect real systems.' },
      { term: 'Synthetic data', meaning: 'Realistic data created for training, such as a packet capture recorded in a lab, rather than evidence taken from a real company.' },
      { term: 'Authorisation', meaning: 'Written permission from the owner of a system to test it. Without it, security testing is illegal in most countries.' },
      { term: 'Disposable', meaning: 'Built to be reset or thrown away, so mistakes cost nothing.' },
    ],
    before: [
      {
        title: 'In plain English: a flight simulator for security',
        paragraphs: [
          'Pilots learn emergencies in a flight simulator before they ever fly a passenger plane. The controls are realistic, the instruments behave correctly, but if they crash, everyone walks away. DarkWorld labs are a flight simulator for security work.',
          'That matters because security tools can do real harm. A scanner pointed at the wrong address can break a hospital\'s printer; a password attack against a real website is a crime. In the lab, every target is yours to practise on and nothing leaves the simulator.',
          'The rule you take with you into your career is simple: only test systems you own or have written permission to test. Labs teach the skill; permission is what makes using it legal.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: labelling evidence honestly',
        paragraphs: [
          'Professionals always say where their evidence came from. Compare the two notes below. The first sounds dramatic but is misleading — the traffic was never from a real company. The second is shorter, honest and still shows real skill.',
          'Use this three-part pattern in every write-up: name the source ("DarkWorld training capture"), state what you saw ("frame 42 shows a DNS answer"), and state what it means ("portal.lab resolves to 10.10.10.20"). Reviewers trust analysts who are precise about sources.',
        ],
        code: '✗ "I intercepted a company\'s network traffic and found their server."\n\n✓ "In the DarkWorld training capture,\n   frame 42 is a DNS response showing portal.lab -> 10.10.10.20.\n   This shows the name mapping inside the lab capture only."',
        label: 'Misleading vs professional evidence wording',
      },
    ],
  },

  'pre-network-1': {
    before: [
      {
        title: 'In plain English: buildings, flats and doors',
        paragraphs: [
          'Picture a network as a city. Every computer is a building with an address — its IP address, such as 10.10.10.20. Inside each building are numbered doors called ports. Different services wait behind different doors: a website usually behind door 443, remote login (SSH) behind door 22.',
          'To talk to a service you need both the building and the door: 10.10.10.20 port 22. A "service" is just a program sitting behind a door, waiting for someone to knock.',
          'Scope is the list of buildings you are allowed to visit. If the briefing says 10.10.10.20, that building is in scope and every other address in the city is off-limits — even if its doors look open.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: reading a simple scan result',
        paragraphs: [
          'A port scanner such as nmap knocks on doors and reports which ones answer. Below is a typical result for one in-scope address. Read it as a table: PORT is the door number and protocol, STATE says whether anything answered, SERVICE is nmap\'s best guess at what is behind it.',
          'From this output you can say: "10.10.10.20 has SSH on 22 and a web server on 80 and 443; port 3306 (a database) did not answer and appears filtered." Notice that you are describing doors, not claiming anything is vulnerable — that comes later, with evidence.',
        ],
        code: '$ nmap 10.10.10.20\nPORT     STATE     SERVICE\n22/tcp   open      ssh\n80/tcp   open      http\n443/tcp  open      https\n3306/tcp filtered  mysql',
        label: 'open = something answered · filtered = a firewall hid the answer',
      },
    ],
  },

  'pre-network-2': {
    before: [
      {
        title: 'In plain English: phone book, phone call, sealed envelope',
        paragraphs: [
          'DNS is the phone book: you know a name (portal.lab) and DNS tells you the number (10.10.10.20). TCP is the phone call: before any talking, both sides agree the line is open (the handshake), and if a word is lost it is repeated. TLS is a sealed envelope inside that call: people listening can see that you are talking, but not what you say.',
          'Netcat (nc) is the simplest possible phone. It connects to an address and port and shows you whatever the service says, with no interpretation. That makes it perfect for meeting a plain-text service for the first time.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: name → connection → banner',
        paragraphs: [
          'First ask DNS for the address. Then use Netcat to "call" the service on the port you were given. Many services greet you with a banner — a line saying what they are.',
          'In the example, the banner tells you the service name and version. Write it down exactly. If you instead connected to port 443 with Netcat, you would see unreadable bytes, because TLS has sealed the envelope — that is a limitation to note, not a failure.',
        ],
        code: '$ dig +short portal.lab\n10.10.10.20\n\n$ nc 10.10.10.20 31337\nDW-TRAINING-SVC v1.2 ready. Type HELP for commands.\nHELP\nCommands: STATUS, TIME, QUIT',
        label: 'Resolve the name, then read the banner exactly as printed',
      },
    ],
  },

  'pre-network-3': {
    before: [
      {
        title: 'In plain English: ordering at a counter',
        paragraphs: [
          'Using a website is like ordering at a counter. Your browser hands over an order slip (the request): which item you want (the path, like /menu), what you want done (the method — GET means "show me", POST means "here is something to process"), plus notes (headers) and maybe your loyalty card (a cookie).',
          'The server hands back a reply (the response): a status code saying how it went (200 "here you go", 404 "we don\'t have that", 403 "you\'re not allowed"), headers, and the body — usually the web page or data.',
          'Every web attack you will learn later is just a carefully changed order slip. Before changing anything, learn to read a normal one.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: one request, line by line',
        paragraphs: [
          'Here is a real-looking request and response. Line 1 of the request is the method, path and protocol version. Host says which website. Cookie carries your session — the server uses it to remember you are logged in.',
          'In the response, the first line gives the status code 200 OK, Content-Type says the body is JSON, and the body itself is the data. If you changed id=7 to id=8 and still got data, you would ask: "should this user see order 8?" — that question is the start of access-control testing.',
        ],
        code: 'GET /api/orders?id=7 HTTP/1.1\nHost: shop.lab\nCookie: session=3f9c1a\nAccept: application/json\n\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id": 7, "item": "keyboard", "owner": "learner"}',
        label: 'Request (top) and response (bottom)',
      },
    ],
  },

  'pre-system-1': {
    before: [{ title: 'In plain English: the building manager', paragraphs: ['Think of a computer as an office building. The hardware is the building itself, the applications are the tenants, and the operating system is the building manager who hands out keys, assigns rooms and decides who may use the lifts.', 'Tenants never rewire the building themselves; they ask the manager. If someone tricks the manager, they get keys to every room. That is why the operating system matters so much in security.'] }],
    after: [{ title: 'Worked example: same program, different damage', paragraphs: ['The same buggy web server is attacked on two machines. On the first it runs as root (full control); on the second as a limited "www-data" account. The bug is identical, but the outcome is not.', 'On the first machine the attacker immediately controls everything. On the second they can only touch the website\'s own files and must find a second weakness to go further, which gives defenders time to notice.'], code: 'Machine A: nginx running as root      -> attacker gets full system control\nMachine B: nginx running as www-data  -> attacker limited to website files', label: 'The account a process runs as decides the damage' }],
  },
  'pre-system-2': {
    before: [{ title: 'In plain English: keys and key cards', paragraphs: ['An administrator account is a master key that opens every door. A standard account is a key card that opens only the rooms you need. Least privilege means handing out key cards, and keeping master keys locked away for the rare jobs that need them.', 'If a key card is stolen, the thief gets a few rooms. If a master key is stolen, they get the whole building.'] }],
    after: [{ title: 'Worked example: separating daily and admin accounts', paragraphs: ['An IT technician has two accounts: "sam" for email and browsing, and "sam-admin" used only to install software or change settings. A phishing link clicked from "sam" can damage only Sam\'s own files.', 'If Sam browsed with "sam-admin", the same click could install malware for every user and switch off protection.'], code: 'sam        -> email, documents, browsing      (standard)\nsam-admin  -> installs and settings only        (administrator)', label: 'Two accounts, two levels of risk' }],
  },
  'pre-system-3': {
    before: [{ title: 'In plain English: locks, fewer doors and a spare key', paragraphs: ['Patching is fixing the locks once a flaw is known. Hardening is bricking up the doors nobody uses. Endpoint protection is the alarm system. Backups are the spare key and the insurance policy for when something gets through anyway.', 'No single measure is enough; together they make an attack harder, louder and less damaging.'] }],
    after: [{ title: 'Worked example: a hardening checklist for a new laptop', paragraphs: ['Before a new laptop is handed to an employee, IT runs through a short list. Each line removes a way in or adds a way to recover.', 'The same thinking applies to servers and phones: remove what is unused, update what remains, watch it, and keep a way back.'], code: '[x] Install all operating system and app updates; enable automatic updates\n[x] Remove trial software and unused apps\n[x] Turn on the firewall and full-disk encryption\n[x] Daily work uses a standard account\n[x] Endpoint protection installed and reporting\n[x] Backups scheduled, with one copy offline', label: 'Each item shrinks the attack surface or speeds recovery' }],
  },
  'pre-script-1': {
    before: [{ title: 'In plain English: ordering at a counter', paragraphs: ['Visiting a website is like ordering at a counter. You hand over an order slip (the request) saying what you want; the counter hands back your food or a note saying why not (the response, with a status code).', 'Anyone can write anything on an order slip, so a good counter checks every slip instead of trusting it.'] }],
    after: [{ title: 'Worked example: one page, many requests', paragraphs: ['Opening a single shop page can trigger dozens of requests. Each has its own status code, and each is a separate chance for the server to check who is asking.', 'When something fails, the status code is the first clue: 404 means it is not there, 403 means you are not allowed, 500 means the server broke.'], code: 'GET /shop            200 OK          (the page)\nGET /styles.css      200 OK          (its design)\nGET /api/basket      401 Unauthorized (not signed in yet)\nGET /old-banner.png  404 Not Found   (missing image)', label: 'Status codes tell the story of each request' }],
  },
  'pre-script-2': {
    before: [{ title: 'In plain English: a cloakroom ticket', paragraphs: ['A session cookie works like a cloakroom ticket. You prove who you are once, get a numbered ticket, and from then on the attendant hands your coat to whoever shows that ticket.', 'That is convenient, and it is also the risk: if someone copies your ticket, the attendant cannot tell them apart from you.'] }],
    after: [{ title: 'Worked example: reading a Set-Cookie header', paragraphs: ['Each part of a Set-Cookie header has a job. Reading it tells you how well a site protects its sessions.', 'If Secure or HttpOnly is missing on a session cookie, that is worth noting as a weakness, even before anything has gone wrong.'], code: 'Set-Cookie: session=8b1f6e2c9a; Secure; HttpOnly; SameSite=Lax; Max-Age=1800\n\nsession=8b1f...  the identifier (long and random)\nSecure           only sent over HTTPS\nHttpOnly         page scripts cannot read it\nSameSite=Lax     not sent on most cross-site requests\nMax-Age=1800     expires after 30 minutes', label: 'Every attribute closes a different gap' }],
  },
  'pre-script-3': {
    before: [{ title: 'In plain English: the front door and the rooms', paragraphs: ['Authentication is the front desk checking your ID. Authorization is every room door checking whether your badge opens it. A building that checks IDs at the front but leaves every room unlocked is not secure.', 'Most web applications get the front desk right. The common mistakes are rooms that forget to check.'] }],
    after: [{ title: 'Worked example: testing your own account safely', paragraphs: ['A developer checks their own app with two test accounts, A and B. Signed in as A, they open A\'s invoice, then change the number in the address to B\'s invoice.', 'The correct result is 403 or 404. Getting B\'s invoice means broken access control, a serious bug to fix on the server. Only test like this on systems you own or are authorised to test.'], code: 'Signed in as A:  GET /invoices/501  -> 200 (A\'s own invoice: correct)\nSigned in as A:  GET /invoices/502  -> 403 (B\'s invoice: correctly refused)\n                                     -> 200 would mean broken access control', label: 'Authorization must be checked on every request' }],
  },
  'pre-security-1': {
    before: [{ title: 'In plain English: a flight recorder', paragraphs: ['Logs are a computer\'s flight recorder. Most of the time nobody reads them, but after something goes wrong they are how investigators work out what happened, in what order and who was involved.', 'A flight recorder is only useful if it was switched on, kept accurate time and survived the crash. The same is true of logs.'] }],
    after: [{ title: 'Worked example: lining up events across systems', paragraphs: ['An analyst collects events from three systems for the same morning. Because all three record UTC, they can be merged into one timeline.', 'The merged view shows a story none of the systems shows alone: a successful sign-in after failures, then a new admin account, then a large upload.'], code: '09:13:02Z  vpn     alice signed in from 203.0.113.25 (after 20 failures)\n09:15:40Z  server  new account "support2" added to Administrators by alice\n09:21:08Z  proxy   9.4 GB uploaded from server to unfamiliar address', label: 'Three systems, one timeline' }],
  },
  'pre-security-2': {
    before: [{ title: 'In plain English: a sealed evidence bag', paragraphs: ['Police put evidence in a sealed bag and sign a label every time it changes hands. If the seal is broken or a signature is missing, a court may not trust what is inside.', 'Digital investigators do the same with hashes (the seal) and chain of custody records (the signatures).'] }],
    after: [{ title: 'Worked example: a chain of custody record', paragraphs: ['Every transfer of a seized laptop is written down. Anyone reviewing the case can see exactly who had it and confirm the hash never changed.', 'If the hash on the last line differed, investigators would know the data changed and would need to explain why.'], code: 'Item: Laptop SN 4471, disk image SHA-256 9f2c...e41a\n14 Mar 10:05  Collected by J. Mensah from Room 12     hash 9f2c...e41a\n14 Mar 11:30  Transferred to A. Owusu (forensics)      hash 9f2c...e41a\n15 Mar 09:00  Image verified before analysis           hash 9f2c...e41a', label: 'Same hash at every step: the evidence is unchanged' }],
  },
  'pre-security-3': {
    before: [{ title: 'In plain English: a fire drill', paragraphs: ['Incident response is like fire safety. You install alarms and plan exits before a fire (prepare), notice smoke (detect), close doors to stop the spread (contain), put it out (eradicate), repair the building (recover) and then ask how it started (lessons learned).', 'Organisations that practise drills respond calmly; those that do not lose precious time.'] }],
    after: [{ title: 'Worked example: a phishing incident from start to finish', paragraphs: ['An employee reports entering their password on a fake sign-in page. The team follows its plan step by step.', 'The final step is what stops the same attack working next month.'], code: 'Detect      User reports the fake page; sign-in logs show a new location\nAnalyse     Attacker signed in once and created a mail forwarding rule\nContain     Reset password, end all sessions, remove the forwarding rule\nEradicate   Block the fake domain; check other users for the same rule\nRecover     Confirm normal sign-ins over the next week\nLearn       Require phishing-resistant MFA; run awareness training', label: 'Each phase has a clear, checkable action' }],
  },

  'pre-ready-1': {
    before: [{ title: 'In plain English: a detective, not a fortune teller', paragraphs: ['A detective does not announce who did it the moment they walk in. They ask a narrow question, look for the clue that can answer it, and only then say what the clue shows. Security work is the same.', 'The tools change every year. The habit of question, evidence, careful conclusion does not.'] }],
    after: [{ title: 'Worked example: from worry to answerable questions', paragraphs: ['A vague worry becomes three questions, each tied to the evidence that can answer it. Anything that cannot be answered yet is written down as unknown, not guessed.', 'This list is also a plan: it tells you what to look at first and when you are done.'], code: 'Worry:     "Our website might be hacked."\nQ1  Any admin sign-ins from unfamiliar addresses this week?   -> sign-in logs\nQ2  Any files on the web server changed since the last update? -> hashes vs known-good copy\nQ3  Any unusual outbound traffic from the server?              -> firewall records\nUnknown:   What visitors saw (no copy of pages served)', label: 'Every question names its evidence' }],
  },
  'pre-ready-2': {
    before: [{ title: 'In plain English: a recipe someone else can follow', paragraphs: ['A good note is like a recipe: someone else should be able to follow it and get the same result. A good report is like a news story: the headline tells busy readers what matters, and the details are there for those who need them.', 'If only you can understand your notes, the work cannot be checked or continued by anyone else.'] }],
    after: [{ title: 'Worked example: one finding, two audiences', paragraphs: ['The same finding is written twice: once for the developers who will fix it, once for the manager who must approve the fix.', 'Both versions are accurate. They differ in what the reader needs to do next.'], code: 'For developers:\n  GET /invoices/502 as user A returned user B\'s invoice (200 OK).\n  The server checks sign-in but not invoice ownership. Fix: verify owner per request.\n\nFor the manager:\n  Any customer can read other customers\' invoices, including addresses.\n  Fixing it is a small code change; we recommend doing it this week.', label: 'Same facts, different readers' }],
  },
  'pre-ready-3': {
    before: [{ title: 'In plain English: one story, every chapter', paragraphs: ['Each module in this path was one chapter: the field, DarkWorld, computers, networks, the web, logs and incidents. A real incident is the whole book at once.', 'The capstone asks you to read that book: follow one attack from start to finish and notice where each chapter would have helped.'] }],
    after: [{ title: 'Worked example: the shop incident as a timeline', paragraphs: ['Putting the scenario into a timeline shows each failed layer and the control that would have stopped it. This is the kind of summary you will write in defensive casebooks and offensive reports alike.', 'Notice that no single control is enough; together they make the attack much harder.'], code: '03:02  Hundreds of failed admin sign-ins        -> rate limiting, MFA\n03:10  Admin sign-in succeeds                    -> MFA, separate admin account\n03:14  New admin account created                 -> alert on admin changes\n03:20  Server sends data to unknown address      -> egress monitoring, least privilege\nLater  Contain, patch, restore, review           -> tested incident response plan', label: 'Every step was a chance to stop the attack' }],
  },
};
