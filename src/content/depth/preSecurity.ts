import type { LessonDepth } from './types';

/** Beginner depth for the pre-security path — the first lessons a newcomer reads. Every addition
 *  explains the idea in everyday language first, then walks through a concrete example step by step. */
export const PRE_SECURITY_DEPTH: Record<string, LessonDepth> = {
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
    before: [
      {
        title: 'In plain English: a security camera for your network cable',
        paragraphs: [
          'Wireshark records every packet that crosses a network connection, like a security camera that films every parcel through a sorting office. Each recorded packet is a frame, numbered in the order it arrived.',
          'A capture can contain thousands of frames, so you use display filters to show only what matters, just like searching camera footage for "red van between 2 and 3pm". The filter dns shows only DNS packets; ip.addr == 10.10.10.20 shows only traffic to or from that address.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: narrowing 2,000 frames to 2',
        paragraphs: [
          'Start broad and narrow down. Type each filter in the bar at the top of Wireshark and press Enter. The status bar shows how many frames are "Displayed" — watch it shrink.',
          'With the last filter you see one DNS query and its answer. Click the answer frame, expand "Answers" in the detail pane, and you can read the name and address. Record the frame number and the filter so anyone can find the same packet again.',
        ],
        code: 'Filter                                  Displayed\n(none)                                  2,047 of 2,047\ndns                                       38 of 2,047\ndns && ip.addr == 10.10.10.53             12 of 2,047\ndns.qry.name == "portal.lab"               2 of 2,047\n\nFrame 412: Standard query response A portal.lab A 10.10.10.20',
        label: 'Each filter removes noise until only the evidence remains',
      },
    ],
  },

  'pre-system-2': {
    before: [
      {
        title: 'In plain English: putting the pages back in order',
        paragraphs: [
          'A conversation between a browser and a server is split into many packets, like a letter cut into strips and posted separately. Looking at one packet is reading one strip. "Follow TCP Stream" collects every strip of that conversation and lays them out in order, so you can read the whole letter.',
          'With plain HTTP (no encryption), the reassembled conversation is readable text: you can see the request your browser sent and the page the server returned. That is exactly why HTTPS exists — and why plain HTTP should never carry passwords.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: following one conversation',
        paragraphs: [
          'Filter for http, right-click the request frame and choose Follow → TCP Stream. Wireshark opens a window showing the conversation, with your side in one colour and the server\'s replies in another, and a stream number such as tcp.stream eq 3.',
          'In the example, you can read the login form being submitted in clear text — including the password. Your evidence note names the stream number, quotes the relevant line, and states the conclusion: "credentials crossed the network unencrypted in stream 3."',
        ],
        code: 'POST /login HTTP/1.1\nHost: intranet.lab\nContent-Type: application/x-www-form-urlencoded\n\nusername=alex&password=Summer2024!\n\nHTTP/1.1 302 Found\nLocation: /dashboard',
        label: 'Follow TCP Stream (tcp.stream eq 3): readable because it is plain HTTP',
      },
    ],
  },

  'pre-system-3': {
    before: [
      {
        title: 'In plain English: you can see the envelope, not the letter',
        paragraphs: [
          'With HTTPS, Wireshark can still see who is talking to whom, when, and how much data moved — the outside of the envelope. It cannot read the letter inside, because TLS encrypted it. That is TLS doing its job, not Wireshark failing.',
          'One useful clue survives: during the TLS handshake the browser usually announces which website it wants, in a field called SNI (Server Name Indication). So you may learn "this laptop connected to bank.example over TLS" without learning anything the user typed.',
          'When a filter shows nothing, do not invent a conclusion. Check the filter spelling, the time range and whether the traffic is encrypted before deciding "it never happened".',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: what an encrypted connection still tells you',
        paragraphs: [
          'Filter tls.handshake.type == 1 to show TLS "Client Hello" messages — the first message of each encrypted connection. Expand it and find the server_name extension.',
          'A careful finding states only what the evidence supports: the destination name and address, the time and the TLS version — and explicitly says the content is not visible. That honesty is what separates analysis from guessing.',
        ],
        code: 'Filter: tls.handshake.type == 1\n\nFrame 88  10.10.10.5 -> 10.10.10.30  TLSv1.3  Client Hello\n  Extension: server_name\n    Server Name: portal.lab\n\nFinding: 10.10.10.5 opened a TLS 1.3 session to portal.lab (frame 88).\nLimitation: the application content is encrypted and not visible.',
        label: 'Metadata is visible; content is not',
      },
    ],
  },

  'pre-script-1': {
    before: [
      {
        title: 'In plain English: a checkpoint between your browser and the website',
        paragraphs: [
          'Normally your browser talks straight to a website. Burp Suite sits in the middle as a checkpoint: every request stops there first, so you can read it, keep a copy in the HTTP history, and even change it before it continues.',
          'Repeater is Burp\'s workbench. You send one request there, change a single detail, press Send, and compare the response with the original. Because you control exactly one change at a time, you learn precisely how the server reacts — without clicking around the site and creating confusing extra traffic.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: from history to Repeater',
        paragraphs: [
          '1) Browse the lab site with Burp\'s browser so requests appear in Proxy → HTTP history. 2) Find the request you care about, right-click it and choose "Send to Repeater". 3) In Repeater, press Send once without changes — this is your baseline. 4) Change one value and press Send again.',
          'Compare the two responses side by side: status code, length and body. In the example, changing the profile ID from 7 to 8 returns another user\'s profile with 200 OK. That single, controlled comparison is the evidence.',
        ],
        code: 'Baseline   GET /api/profile/7   -> 200 OK  length 142  {"id":7,"name":"learner"}\nChanged    GET /api/profile/8   -> 200 OK  length 139  {"id":8,"name":"sam"}\n\nNote: changing only the ID returned a different user\'s profile.',
        label: 'Repeater: one change, two responses, one conclusion',
      },
    ],
  },

  'pre-script-2': {
    before: [
      {
        title: 'In plain English: the bouncer\'s three answers',
        paragraphs: [
          'Think of a club with a bouncer. 200 means "come in". 401 means "I don\'t know who you are — show me ID" (you are not logged in, or your login is wrong). 403 means "I know exactly who you are, and you\'re still not allowed in" (logged in, but not permitted).',
          'That difference matters. A 401 is about authentication (who you are). A 403 is about authorization (what you may do). Other common answers: 404 "no such room", 302 "go to this other door" (a redirect), and 500 "something broke inside" (a server error).',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: the same request three ways',
        paragraphs: [
          'Send the admin page request three times in Repeater: with no session cookie, with a normal user\'s cookie, and with the admin\'s cookie. Write down each status code.',
          'The pattern 401 → 403 → 200 shows the server is checking both identity and permission — this boundary works. If the normal user had received 200, you would have found an authorization bug.',
        ],
        code: 'No cookie            GET /admin  -> 401 Unauthorized\nUser cookie (sam)    GET /admin  -> 403 Forbidden\nAdmin cookie (root)  GET /admin  -> 200 OK\n\nConclusion: authentication and authorization are both enforced on /admin.',
        label: 'Three identities, three different answers',
      },
    ],
  },

  'pre-script-3': {
    before: [
      {
        title: 'In plain English: change one ingredient at a time',
        paragraphs: [
          'If a cake comes out wrong and you changed the flour, the sugar and the oven temperature all at once, you will never know which change mattered. Testing websites works the same way.',
          'One-variable testing means: send a normal request (the baseline), change exactly one thing, send it again, and compare. If the response changes, you know which change caused it. This habit is the foundation of almost every web vulnerability lab that follows.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: a tidy test log',
        paragraphs: [
          'Keep a small table as you test. Each row is one request: what you changed, the status code, the response length and what it means. The baseline row comes first.',
          'Reading the log below, only test 2 changed the outcome — the server returned another user\'s invoice. Tests 3 and 4 behaved safely. A reviewer can repeat any row and get the same result, which is what makes it evidence.',
        ],
        code: '#  Change from baseline            Status  Length  Meaning\n1  (baseline) invoice=41          200     310     my own invoice\n2  invoice=42                     200     298     another customer\'s invoice\n3  invoice=abc                    400      44     input rejected\n4  removed Cookie header          401      30     login required',
        label: 'One variable per row — the finding is row 2',
      },
    ],
  },

  'pre-security-1': {
    before: [
      {
        title: 'In plain English: an evidence locker with a logbook',
        paragraphs: [
          'Digital forensics is careful detective work on computer evidence. Autopsy is the investigator\'s evidence locker: you open a case (the folder for one investigation), add a data source (the evidence, such as a copy of a hard drive), and Autopsy sorts what it finds into searchable artifacts.',
          'Order and honesty matter more than speed. Every finding must say which file it came from, when that file was changed and what it actually shows — so another investigator could check your work and reach the same answer.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: opening a case',
        paragraphs: [
          '1) Create a new case and give it a clear name and number. 2) Add the data source — in DarkWorld, the supplied training fixture. 3) Let the ingest modules run; they extract files, timestamps and keywords. 4) Open the timeline view and sort by time.',
          'Write down each step as you go, like the case log below. Note that the timestamps include the timezone; without it, "09:14" could mean three different moments.',
        ],
        code: 'Case:        DW-101 Training fixture review\nData source: dw-fixture-01 (synthetic training files)\nIngest:      completed 09:02 UTC, 14 files, 2 deleted entries\n\n09:14 UTC  F-03 notes.txt       created\n09:20 UTC  F-07 receipt.pdf     deleted (metadata recoverable)\n09:31 UTC  F-09 browser history  visit to portal.lab',
        label: 'A simple, reviewable case log',
      },
    ],
  },

  'pre-security-2': {
    before: [
      {
        title: 'In plain English: a search hit is a lead, not a verdict',
        paragraphs: [
          'Searching evidence for a word is like a detective finding a name in a diary. It is a good lead — but it does not prove that person wrote the diary, read it, or did anything wrong.',
          'Autopsy\'s keyword search tells you where a word appears. Your job is to say exactly that, and no more, until other evidence (timestamps, other files, logs) supports a bigger conclusion.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: from hit to careful sentence',
        paragraphs: [
          'Search for the keyword, open each hit and look at the surrounding text and the file\'s details. Then write one sentence per hit that states only what is visible.',
          'Compare the two conclusions below. The first jumps from "the word appears" to "the user stole data". The second is factual and still useful — and it tells the next analyst what to check.',
        ],
        code: 'Keyword: "payroll"   Hits: 3\n  F-04 email-draft.txt   "...send the payroll export to my personal address..."\n\n✗ "Alex stole the payroll file."\n✓ "F-04, a draft created 09:12 UTC, contains text proposing to send a payroll\n   export to a personal address. It does not show that anything was sent."',
        label: 'State what the artifact shows — and what it does not',
      },
    ],
  },

  'pre-security-3': {
    before: [
      {
        title: 'In plain English: labelled evidence bags',
        paragraphs: [
          'At a crime scene, each item goes into a labelled bag with a number, a description and who collected it. Tags and an evidence register do the same job in Autopsy: each important artifact gets a label and a row in a table, so the final report can point to exact items.',
          'A good report then turns those rows into plain sentences a manager can understand, with a limitations section that says honestly what the evidence cannot show.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: from register to report paragraph',
        paragraphs: [
          'Tag each relevant artifact in Autopsy (for example "Notable" or a custom tag), then copy its details into a register. Each row needs an ID, the file path, the time and what it supports.',
          'The report paragraph below is built only from register rows, so every claim can be traced to an item. The final sentence is the limitation — it makes the report stronger, not weaker.',
        ],
        code: 'ID    Path                    Time (UTC)  Supports\nE-01  /docs/email-draft.txt   09:12       intent to send an export\nE-02  /tmp/payroll.csv        09:15       export file existed\nE-03  browser history         09:18       visit to a file-sharing site\n\nReport: E-01 to E-03 show an export was created and a file-sharing site was\nvisited within six minutes. Limitation: no evidence shows a file was uploaded.',
        label: 'Every sentence traces back to a register row',
      },
    ],
  },

  'pre-ready-1': {
    keyTerms: [
      { term: 'Evidence question', meaning: 'The specific thing you need to prove right now, e.g. "what service is on port 8080?". Pick the tool that answers it.' },
      { term: 'Baseline', meaning: 'A normal, unchanged result you capture first, so later changes can be compared against it.' },
      { term: 'Banner', meaning: 'The greeting text a network service sends when you connect, often naming the software and version.' },
      { term: 'Stream', meaning: 'In Wireshark, all the packets of one connection put back in order so you can read the conversation.' },
    ],
    before: [
      {
        title: 'In plain English: choose the tool for the question',
        paragraphs: [
          'A plumber does not use a hammer for every job. Each tool you have learned answers one kind of question. Netcat answers "what does this service say?". Wireshark answers "what crossed the network?". Burp answers "how does the website react if I change this request?". Autopsy answers "what do these files show?".',
          'So before reaching for a tool, say the question out loud. If you cannot say what question a tool will answer, it is probably the wrong tool for this moment.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: one scenario, four questions',
        paragraphs: [
          'A briefing says: "portal.lab is behaving strangely; find out what it runs, what clients send it and what a saved file on the server shows." Break that into questions and match each to a tool, as in the plan below.',
          'Working in this order keeps the investigation tidy: each step produces one clear piece of evidence, and each piece of evidence answers one question.',
        ],
        code: 'Question                              Tool            Evidence to save\n1 What address is portal.lab?          dig / Wireshark DNS answer frame\n2 What service is on port 8080?        Netcat          exact banner text\n3 What does a client request look like? Burp history    one baseline request\n4 What does config.bak contain?        Autopsy         artifact ID, path, time',
        label: 'A tool plan written before touching anything',
      },
    ],
  },

  'pre-ready-2': {
    keyTerms: [
      { term: 'Write-up', meaning: 'A short document explaining what you did in a lab, what you found and how you know — your proof of skill.' },
      { term: 'Limitation', meaning: 'A clear statement of what your evidence does not show. Including it makes your work more trustworthy.' },
      { term: 'Caption', meaning: 'One or two sentences under a screenshot saying what it shows and why it matters.' },
      { term: 'Reproducible', meaning: 'Written so that someone else can follow your steps and get the same result.' },
    ],
    before: [
      {
        title: 'In plain English: notes your future self can trust',
        paragraphs: [
          'Imagine reading your own lab notes in six months, or an employer reading them in an interview. "Got the flag lol" helps nobody. "Connected to 10.10.10.20:31337 with Netcat; the banner read DW-SVC v1.2" tells the whole story in one line.',
          'Good notes always answer five things: what was the target, what were you trying to learn, what did you do, what did you see, and what does it mean. Add one more line — what it does not prove — and your notes look like professional analyst work.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: turning a messy note into a professional one',
        paragraphs: [
          'Take a quick scribble and rewrite it into the five-line format. Notice that nothing new was discovered — the same work is simply presented so anyone can follow and check it.',
        ],
        code: 'Before:  "nc to the box, it said some service thing, got flag"\n\nAfter:\nTarget:      10.10.10.20 (DarkWorld Netcat lab)\nQuestion:    What service listens on TCP 31337?\nAction:      nc 10.10.10.20 31337\nEvidence:    Banner "DW-TRAINING-SVC v1.2 ready"; flag captured\nConclusion:  A plain-text training service answers on 31337.\nLimitation:  The banner is self-reported and was not verified another way.',
        label: 'Same work, written so it can be reviewed',
      },
    ],
  },

  'pre-ready-3': {
    keyTerms: [
      { term: 'Capstone', meaning: 'A final exercise that combines everything in a course into one realistic task.' },
      { term: 'Workflow', meaning: 'The repeatable order of steps you follow: scope, baseline, one change, evidence, conclusion, limitation.' },
      { term: 'Checkpoint', meaning: 'A point in a lab where a flag proves you completed a step.' },
      { term: 'Readiness', meaning: 'Being able to do the core tasks calmly and explain them, not just having seen them once.' },
    ],
    before: [
      {
        title: 'In plain English: your driving test',
        paragraphs: [
          'Lessons taught you each control separately — steering, braking, mirrors. The capstone is the driving test: you use them all together on one route. Nothing new is introduced; the challenge is choosing the right skill at the right moment and explaining what you did.',
          'If you feel stuck, go back to the question-first habit: what do I need to prove next, and which tool answers that? The capstone rewards calm, ordered work far more than speed.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: a capstone run sheet',
        paragraphs: [
          'Before you start, write a run sheet like the one below. Tick each row as you capture its evidence. If a step fails, write what you saw and why you think it failed — then move on and come back.',
          'When every row is ticked, you have both the flags and a finished write-up, because the run sheet already is one.',
        ],
        code: '[ ] 1 Scope: confirm target names and addresses from the briefing\n[ ] 2 DNS: prove portal.lab -> address (Wireshark frame #)\n[ ] 3 Service: read the banner on the stated port (Netcat)\n[ ] 4 Web: baseline request + one-change comparison (Burp Repeater)\n[ ] 5 Files: tag the relevant artifact (Autopsy ID + time)\n[ ] 6 Report: five-line notes per step + one limitation each',
        label: 'Plan the evidence before you collect it',
      },
    ],
  },
};
