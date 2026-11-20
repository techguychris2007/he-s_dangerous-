import type { CurriculumLesson } from '../curriculumDefinition';

const sources = {
  kernel: { title: 'The Linux Kernel documentation', url: 'https://docs.kernel.org/' },
  ps: { title: 'Linux manual page — ps(1)', url: 'https://man7.org/linux/man-pages/man1/ps.1.html' },
  leastPrivilege: { title: 'NIST Glossary — least privilege', url: 'https://csrc.nist.gov/glossary/term/least_privilege' },
  serverSecurity: { title: 'NIST SP 800-123 — Guide to General Server Security', url: 'https://csrc.nist.gov/pubs/sp/800/123/final' },
  patches: { title: 'CISA — Understanding Patches and Software Updates', url: 'https://www.cisa.gov/news-events/news/understanding-patches-and-software-updates' },
};

/** A quiz item with the correct option placed at `position`, so answers are not always first. */
const q = (question: string, correct: string, wrong: string[], position: number) => ({ question, options: [...wrong.slice(0, position), correct, ...wrong.slice(position)], answer: position });

/** Foundations module "Computers & Operating Systems": general concepts, no single tool. */
export const beginnerSystemLessons: CurriculumLesson[] = [
  {
    id: 'pre-system-1', slug: 'linux-navigation-and-streams', title: 'What an Operating System Does', summary: 'Understand the layers between hardware and the apps you use, and why the operating system is the part attackers most want to control.', minutes: 20,
    prerequisite: 'None — this lesson starts from how a computer is put together.',
    outcomes: ['Describe the hardware, operating system and application layers', 'Explain what a process is and why processes are kept apart', 'Explain why control of the operating system means control of everything above it'],
    introduction: "Every phone, laptop and server runs an operating system: Windows, macOS, Linux, Android or iOS. It sits between the physical hardware and the programs you use, deciding which program may use the processor, memory, files and network at any moment. Security professionals care about it because whoever controls the operating system controls every program and file on the machine.",
    keyTerms: [
      { term: 'Operating system', meaning: 'The software that manages hardware and gives programs a safe, shared way to use it.' },
      { term: 'Kernel', meaning: 'The core of the operating system that runs with full control of the hardware.' },
      { term: 'Process', meaning: 'A running program, with its own memory and the permissions of the account that started it.' },
      { term: 'Service', meaning: 'A program that runs in the background without a window, such as a web server; called a daemon on Linux.' },
    ],
    readinessChecklist: ['You can name the three layers of a computer from hardware to apps.', 'You can explain the difference between a program file and a running process.', 'You can say why the kernel is the most valuable target on a machine.'],
    sections: [
      { title: 'Three layers: hardware, operating system, applications', paragraphs: ['At the bottom is hardware: the processor (CPU), memory (RAM), storage and network card. At the top are applications: a browser, a chat app, a game. Applications never talk to the hardware directly. They ask the operating system, which checks the request and carries it out.', 'That middle position is what makes the operating system a security boundary. It decides whether a program may open a file, use the camera or connect to the internet. If those decisions can be tricked or bypassed, every protection above it fails.'] },
      { title: 'The kernel and user space', paragraphs: ['The kernel is the core of the operating system. It runs with complete control over memory and devices. Ordinary programs run in "user space" with limited rights and must ask the kernel for anything sensitive, through requests called system calls.', 'This split is deliberate. A bug in a browser should crash the browser, not the whole machine. A bug in the kernel is far more serious, because code running there is not limited by anything.'] },
      { title: 'Processes, memory and services', paragraphs: ['A program is a file on disk. When it runs, it becomes a process: the operating system gives it memory, a process ID and the permissions of the user who started it. The operating system keeps processes apart, so one cannot read another\'s memory without permission.', 'Some processes run in the background with no window. These services (daemons on Linux) do things like serve websites, sync files or accept remote logins. Services often run with high privileges and listen on the network, which is why they are a common entry point for attackers and something defenders keep a close inventory of.'], code: 'PID   USER      COMMAND\n1     root      systemd          (starts and supervises services)\n812   root      sshd             (accepts remote logins)\n1440  www-data  nginx            (serves the website)\n2301  alice     firefox          (an ordinary user application)', label: 'A simplified process list: every process runs as some user' },
    ],
    table: { headers: ['Layer', 'Example', 'Why it matters for security'], rows: [['Hardware', 'CPU, RAM, disk, network card', 'Physical access can bypass software controls'], ['Operating system', 'Windows, Linux, macOS', 'Enforces who may do what on the machine'], ['Applications', 'Browser, email client, web server', 'Most attacks start here, then try to reach the OS']] },
    exercise: { scenario: 'A web server process is running as a normal low-privilege user. An attacker finds a bug in the website and runs commands through it.', task: 'What can the attacker most likely do at first, and why?', answer: 'Only what that low-privilege user is allowed to do, because the operating system gives the process the permissions of the account it runs as. To do more, the attacker would need a second weakness to gain higher privileges.', evidence: 'Name the account the process runs as and the permissions that account has.' },
    misconceptions: ['A program file and a running process are not the same thing.', 'Applications do not talk to hardware directly; the operating system mediates.', 'Running everything as an administrator is convenient, not safe.'],
    sources: [sources.kernel, sources.ps],
    labs: [],
    questions: [{ prompt: 'What is the core part of the operating system that runs with full control of the hardware called?', answer: 'kernel', hint: 'Ordinary programs ask it for anything sensitive.' }],
    quiz: [
      q('What is a process?', 'A running program with its own memory and permissions', ['A file stored on the disk', 'A type of network cable', 'A password policy'], 1),
      q('Why is the operating system an important security boundary?', 'It decides which programs may use files, memory and the network', ['It makes the screen brighter', 'It only matters for games', 'It replaces the need for passwords'], 3),
      q('What permissions does a process usually have?', 'Those of the account that started it', ['Always full administrator rights', 'None at all', 'Whatever the website visitor chooses'], 2),
    ],
  },
  {
    id: 'pre-system-2', slug: 'windows-powershell-and-identity', title: 'Users, Privileges and Least Privilege', summary: 'Learn how accounts and privileges decide what each person and program can do, and why giving less access limits the damage of any mistake or attack.', minutes: 20,
    prerequisite: 'Know what a process is and that it runs as a user.',
    outcomes: ['Explain the difference between standard and administrative accounts', 'Apply the principle of least privilege to everyday examples', 'Describe privilege escalation in plain language'],
    introduction: 'Every action on a computer is done on behalf of some account. The account decides what is allowed: reading a file, installing software, changing settings. Security depends heavily on giving each person and program only the access they actually need, so one stolen password or one buggy program cannot open everything.',
    keyTerms: [
      { term: 'Account', meaning: 'An identity the operating system recognises, for a person or a program.' },
      { term: 'Administrator', meaning: 'An account allowed to change the whole system; called root on Linux and macOS.' },
      { term: 'Least privilege', meaning: 'Giving each account only the access it needs for its job, and no more.' },
      { term: 'Privilege escalation', meaning: 'Gaining more access than an account was given, usually by exploiting a weakness.' },
    ],
    readinessChecklist: ['You can explain why daily work should use a standard account.', 'You can give one example of least privilege for a person and one for a program.', 'You can describe privilege escalation without naming any tool.'],
    sections: [
      { title: 'Accounts and groups', paragraphs: ['Operating systems track accounts for people (alice, bob) and for programs (a web server or database account). Accounts can be placed in groups, so permissions can be given to "Finance" or "Developers" instead of one person at a time.', 'Files, folders and settings carry permissions that say which accounts or groups may read, change or run them. When a process tries to open a file, the operating system compares the process\'s account with those permissions.'] },
      { title: 'Standard and administrative access', paragraphs: ['A standard account can use the computer but cannot change how it works for everyone. An administrator (root on Linux and macOS) can install software, change security settings and read any file.', 'Modern systems make administrators confirm before using that power: a User Account Control prompt on Windows, or sudo and a password on Linux and macOS. The pause exists so that malware or a mistaken click cannot silently use full rights.'] },
      { title: 'Least privilege and privilege escalation', paragraphs: ['Least privilege means each account gets the minimum access needed for its job. A receptionist does not need access to payroll; a web server does not need to read users\' home folders. When something goes wrong, the damage stops at that account\'s limits.', 'Attackers usually start with limited access, perhaps one user\'s password or a low-privilege service. They then look for privilege escalation: a misconfiguration or bug that lets them become an administrator. Defenders make this hard by removing unnecessary rights, patching, and watching for unusual use of admin accounts.'] },
    ],
    table: { headers: ['Who or what', 'Needs', 'Should not have'], rows: [['Office worker', 'Their documents and email', 'Administrator rights for daily work'], ['Web server account', 'Its website files', 'Access to other users\' files or system settings'], ['IT administrator', 'Admin rights when doing admin tasks', 'An admin session for reading email and browsing']] },
    exercise: { scenario: 'A small company gives every employee an administrator account so nobody has to ask IT to install software. One employee opens a malicious email attachment.', task: 'Explain how the account setup changes the impact, and what you would recommend.', answer: 'Because the attachment runs with administrator rights, the malware can install itself, disable protection and change the whole machine. Using standard accounts for daily work, with a separate admin account for installs, would have limited it to that user\'s files.', evidence: 'State which account the attachment ran as and what that account could change.' },
    misconceptions: ['Being an administrator is not the same as being trusted to do everything all the time.', 'Least privilege applies to programs and services, not only to people.', 'A confirmation prompt is a safety step, not an annoyance to switch off.'],
    sources: [sources.leastPrivilege, sources.serverSecurity],
    labs: [],
    questions: [{ prompt: 'What principle says every account should get only the access it needs for its job?', answer: 'least privilege', accept: ['principle of least privilege'], hint: 'Two words: the minimum access needed.' }],
    quiz: [
      q('What is the safest way to use a computer day to day?', 'With a standard account, using admin rights only when needed', ['Always as administrator', 'With no password', 'With a shared account for everyone'], 0),
      q('What is privilege escalation?', 'Gaining more access than an account was given', ['Changing a desktop wallpaper', 'Logging out', 'Backing up files'], 2),
      q('Which example follows least privilege?', 'A web server account that can read only its own website files', ['Every employee being an administrator', 'A shared admin password on a sticky note', 'Giving interns access to payroll'], 1),
    ],
  },
  {
    id: 'pre-system-3', slug: 'logs-processes-and-troubleshooting', title: 'Updates, Hardening and Endpoint Protection', summary: 'See why software has vulnerabilities, how patching and hardening shrink the attack surface, and what endpoint protection and backups add.', minutes: 22,
    prerequisite: 'Know what an operating system, process and service are.',
    outcomes: ['Explain what a vulnerability and a patch are', 'Describe hardening and attack surface with examples', 'Explain the role of endpoint protection and backups'],
    introduction: 'All software has bugs, and some bugs are security vulnerabilities. Keeping systems safe is not about perfect software; it is about fixing known weaknesses quickly, turning off what you do not need, watching for bad behaviour, and being able to recover when something still goes wrong.',
    keyTerms: [
      { term: 'Vulnerability', meaning: 'A weakness in software or configuration that an attacker could use.' },
      { term: 'Patch', meaning: 'An update that fixes a bug or vulnerability.' },
      { term: 'Attack surface', meaning: 'Everything an attacker could try to reach: open services, accounts, software and settings.' },
      { term: 'Hardening', meaning: 'Reducing the attack surface by removing, disabling or locking down what is not needed.' },
      { term: 'Endpoint protection', meaning: 'Security software on a device that detects and blocks malicious activity, such as antivirus or EDR.' },
    ],
    readinessChecklist: ['You can explain why a patched vulnerability is still dangerous on unpatched machines.', 'You can list three hardening steps for a computer.', 'You can explain why backups are part of security.'],
    sections: [
      { title: 'Vulnerabilities and patches', paragraphs: ['A vulnerability is a weakness that lets someone do something they should not, such as run code or read private data. When a vendor fixes it, they release a patch. Publicly known vulnerabilities get an identifier (a CVE number) so everyone can track them.', 'Once a patch is public, attackers can study it to learn exactly what was broken. Unpatched machines then become easy targets. That is why fast, regular updates are one of the most effective defences that exist.'] },
      { title: 'Hardening: shrink the attack surface', paragraphs: ['The attack surface is everything an attacker could try: open network services, user accounts, installed programs and settings. Each one is a possible way in.', 'Hardening removes what is not needed and secures the rest: uninstall unused software, stop unneeded services, close unused network ports, change default passwords, turn on the firewall and disk encryption, and follow a security baseline from the vendor or a standards body.'] },
      { title: 'Endpoint protection and backups', paragraphs: ['Endpoint protection watches the device itself. Traditional antivirus looks for known malicious files; endpoint detection and response (EDR) also watches behaviour, such as a document suddenly launching a command shell, and helps responders investigate.', 'No defence is perfect, so recovery matters too. Backups let you restore after ransomware, hardware failure or mistakes. A common rule is 3-2-1: three copies, on two kinds of storage, with one kept offline or offsite where malware cannot reach it.'] },
    ],
    table: { headers: ['Control', 'What it does', 'Example'], rows: [['Patching', 'Fixes known vulnerabilities', 'Install the monthly operating system update'], ['Hardening', 'Removes unnecessary attack surface', 'Disable a remote login service nobody uses'], ['Endpoint protection', 'Detects and blocks malicious activity', 'EDR stops a document from running a script'], ['Backups', 'Allow recovery after an incident', 'Restore files after ransomware from an offline copy']] },
    exercise: { scenario: 'A school laptop has automatic updates turned off, a remote access service enabled that nobody uses, and no backups.', task: 'Prioritise three changes and explain what each one prevents or fixes.', answer: 'Turn on automatic updates so known vulnerabilities get fixed; disable the unused remote access service to shrink the attack surface; set up regular backups with an offline copy so the school can recover from ransomware or loss.', evidence: 'For each change, name the risk it reduces.' },
    misconceptions: ['Antivirus alone does not make a system secure.', 'A vulnerability does not stop being dangerous because a patch exists; it stops when the patch is installed.', 'Backups that are always connected can be encrypted by ransomware too.'],
    sources: [sources.patches, sources.serverSecurity],
    labs: [],
    questions: [{ prompt: 'What is the name for everything an attacker could try to reach on a system?', answer: 'attack surface', hint: 'Hardening makes it smaller.' }],
    quiz: [
      q('Why should patches be installed quickly?', 'Attackers can study public patches and target unpatched machines', ['Patches make the computer slower on purpose', 'Patches are only cosmetic', 'They replace the need for passwords'], 3),
      q('Which is an example of hardening?', 'Disabling a service nobody uses', ['Installing more browser toolbars', 'Sharing the admin password', 'Turning off the firewall'], 0),
      q('What does the 3-2-1 backup rule recommend?', 'Three copies, two kinds of storage, one offline or offsite', ['One copy on the same disk', 'Two passwords and one username', 'Backing up only once a year'], 1),
    ],
  },
];
