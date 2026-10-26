import type { LessonDepth } from './types';

const plain = (title: string, ...paragraphs: string[]) => [{ title: `In plain English: ${title}`, paragraphs }];

/** Beginner on-ramps for the densest advanced offensive, cloud and engineering lessons: the core idea
 *  in everyday language, plus the vocabulary the lesson assumes. */
export const ADVANCED_DEPTH: Record<string, LessonDepth> = {
  'cloud-modern-5': {
    keyTerms: [
      { term: 'VPC', meaning: 'Virtual Private Cloud: your own private network inside a cloud provider, with your own address ranges and routes.' },
      { term: 'Route table', meaning: 'Rules that decide where traffic from a subnet goes next — to the internet gateway, another network or nowhere.' },
      { term: 'Security group', meaning: 'A stateful firewall attached to a cloud resource: allow rules only, and replies to allowed traffic are automatically permitted.' },
      { term: 'Private endpoint', meaning: 'A way to reach a cloud service (such as storage) over your private network instead of across the public internet.' },
    ],
    before: plain('roads, gates and guest lists',
      'Think of a cloud network as a gated estate. Subnets are the streets, route tables are the road signs that say which way traffic may drive, and security groups are guards at each house checking a guest list. Traffic only arrives if a road leads there AND the guard lets it in.',
      'So "can A reach B?" always has two halves: is there a route, and do the firewalls allow it? A private endpoint builds a private road to a service, but the service\'s own permissions still decide what you may do once you arrive.'),
  },
  'msf-collection-1': {
    keyTerms: [
      { term: 'Metasploit database', meaning: 'An optional store where Metasploit saves hosts, services and findings from your scans.' },
      { term: 'Workspace', meaning: 'A named folder inside that database that keeps one engagement\'s records separate from another\'s.' },
      { term: 'Service record', meaning: 'A saved note that a port on a host was running a service when it was scanned.' },
      { term: 'Stale data', meaning: 'Information that was true when recorded but may no longer be true now.' },
    ],
    before: plain('a notebook, not a live map',
      'Metasploit can remember what you found — which hosts exist and which ports were open — in a database. A workspace is a separate notebook for each job, so findings from one client never mix with another\'s.',
      'But a notebook only says what was true when you wrote it. A port that was open last week might be closed today, and a workspace does not stop you typing the wrong address. Always confirm a record is current and in scope before acting on it.'),
  },
  'post-network-1': {
    keyTerms: [
      { term: 'Lateral access', meaning: 'Using a foothold on one machine to reach and log in to another machine in the same network.' },
      { term: 'Reachability', meaning: 'Whether network traffic can travel from one host to another at all.' },
      { term: 'Access matrix', meaning: 'A table of which source can reach which destination, on which ports, with which identity.' },
      { term: 'Segment', meaning: 'A separated part of a network, often with firewalls controlling traffic between segments.' },
    ],
    before: plain('a road and a key are two different things',
      'Getting into a second computer needs two things: a road to it (the network allows the connection) and a key that fits (the account is allowed to log in there). Having one without the other gets you nowhere.',
      'Good testers check and report each separately — "port 445 on FILE01 is reachable from the workstation subnet, but the help-desk account was refused" — instead of the vague "we could access the internal network".'),
  },
  'linux-collection-1': {
    keyTerms: [
      { term: 'Package', meaning: 'A bundle containing a program and its information, installed by a package manager such as APT.' },
      { term: 'Repository', meaning: 'A server that publishes packages, signed so your system can verify they really came from it.' },
      { term: 'Provenance', meaning: 'Where something came from and who produced it.' },
      { term: 'Signing key', meaning: 'A cryptographic key the repository uses to sign its package lists, so tampering can be detected.' },
    ],
    before: plain('buy from the shop, not from a stranger in the car park',
      'Installing software gives it power over your computer. APT installs packages from repositories whose lists are digitally signed — like buying from an official shop where the receipt proves where the goods came from.',
      'A random download from a forum post is the stranger in the car park: it might be fine, but you cannot prove who made it. This lesson shows how to check where a tool came from and which exact version you have.'),
  },
  'cloud-modern-7': {
    keyTerms: [
      { term: 'Secret', meaning: 'A sensitive value such as a password, API key or private key that grants access to something.' },
      { term: 'KMS', meaning: 'Key Management Service: a cloud service that stores encryption keys and performs encryption without revealing the keys.' },
      { term: 'Terraform state', meaning: 'A file Terraform keeps describing everything it built — which can contain secrets in plain text.' },
      { term: 'Revocation', meaning: 'Making a credential stop working, so a leaked copy becomes useless.' },
    ],
    before: plain('deleting the note does not change the lock',
      'If you write your door code on a sticky note and someone photographs it, throwing the note away does not help — you must change the code. Leaked passwords and API keys work the same way: deleting the file or Git commit that exposed them does not make them safe. They must be revoked and replaced.',
      'Clouds offer secret stores (to hold passwords safely) and key services like KMS (to hold encryption keys). Infrastructure tools such as Terraform keep a "state" file that can quietly contain those secrets, so it needs the same protection.'),
  },
  'post-host-4': {
    keyTerms: [
      { term: 'Evidence minimisation', meaning: 'Collecting only the smallest proof needed, not copying sensitive data you do not need.' },
      { term: 'Target marker', meaning: 'A harmless file or change a tester leaves to prove access, which must be recorded and removed.' },
      { term: 'Closeout', meaning: 'The final step of a test: confirming every change was reverted and access removed.' },
      { term: 'Remediation', meaning: 'The fix applied by the system owner to remove the weakness.' },
    ],
    before: plain('a good guest leaves the house as they found it',
      'A professional tester proves a point with the smallest possible evidence — for example, showing they could read a sensitive file by recording its name and size, not copying all its contents.',
      'Every change made during a test (a test file, an added account, an open session) is written down and undone at the end. Leaving the house tidy is part of the job, not an afterthought.'),
  },
  'mobile-modern-4': {
    keyTerms: [
      { term: 'Static analysis', meaning: 'Reading an app\'s files and code without running it.' },
      { term: 'Runtime analysis', meaning: 'Watching what an app actually does while it runs.' },
      { term: 'Instrumentation', meaning: 'Tools like Frida that hook into a running app to observe or change its behaviour.' },
      { term: 'Negative control', meaning: 'A test where you expect nothing to happen, proving your setup is not causing a false result.' },
    ],
    before: plain('the recipe vs the meal you actually ate',
      'Reading an app\'s code (static analysis) tells you what it could do, like reading a recipe. Running it and watching (runtime analysis) tells you what it did this time, like eating the meal. Both are useful, but they prove different things.',
      'When you use a tool to tamper with a running app, remember the tool changed the experiment. A strong finding records what you changed, what you saw and a control test that shows the result was not caused by your tools.'),
  },
  'adv-delivery-3': {
    keyTerms: [
      { term: 'Artifact', meaning: 'A built output of software delivery, such as a container image or installer.' },
      { term: 'Digest', meaning: 'A hash (e.g. SHA-256) that uniquely identifies an artifact\'s exact bytes.' },
      { term: 'Signature', meaning: 'Cryptographic proof that a particular key vouched for an artifact.' },
      { term: 'Promotion policy', meaning: 'Rules deciding which artifacts may move from testing to production.' },
    ],
    before: plain('fingerprint, seal and birth certificate',
      'A digest is a fingerprint: it identifies these exact bytes. A signature is a wax seal: it shows a particular key approved them. Provenance is a birth certificate: it describes how and where the software was built.',
      'None of these says the software is safe. A malicious program can have a perfect fingerprint and a valid seal. That is why teams also need a policy for which signed, well-built artifacts are allowed into production.'),
    after: [{
      title: 'Worked example: four checks, four different answers',
      paragraphs: [
        'Before deploying a build, ask the four questions separately. The release below passes the first three and still fails — because "signed by a trusted key" and "allowed into production" are not the same thing.',
        'The promotion policy is the human decision the cryptography cannot make for you: these exact bytes, from this key, built this way, are approved for this environment.',
      ],
      code: 'Release: payments-api:2.4.0\n  Digest matches the published value?        yes  (these exact bytes)\n  Signature from the release key?            yes  (our key signed it)\n  Provenance shows our build pipeline?       yes  (built in CI, not a laptop)\n  Promotion policy says OK for production?   NO   (only v2.3.x is approved)\n\n-> Hold. Valid and genuine is not the same as approved to deploy.',
      label: 'Cryptography answers three questions; policy answers the fourth',
    }],
  },
  'post-host-3': {
    keyTerms: [
      { term: 'SUID bit', meaning: 'A Linux file permission that makes a program run as its owner, often root, whoever starts it.' },
      { term: 'Linux capabilities', meaning: 'Small slices of root\'s power (like binding to low ports) that can be given to a program without full root.' },
      { term: 'Effective user', meaning: 'The identity whose permissions a process is actually using right now.' },
      { term: 'Isolation', meaning: 'Limits (containers, sandboxes) that restrict what a process can reach even if it has privileges.' },
    ],
    before: plain('a staff badge works only on certain doors',
      'Some Linux programs carry a special badge (the SUID bit or a capability) that gives them extra power when they run. Whether that is dangerous depends on what the program can be made to do with the badge.',
      'So the real question is never "does this file have a scary permission?" but "what protected action can I actually perform through it?". Test that one action carefully, and you have real evidence instead of a guess.'),
  },
  'adv-delivery-1': {
    keyTerms: [
      { term: 'CI/CD pipeline', meaning: 'The automated chain that builds, tests and deploys code after a change is pushed.' },
      { term: 'Build runner', meaning: 'The machine that executes the pipeline\'s build steps — often holding powerful credentials.' },
      { term: 'Trust boundary', meaning: 'A point where low-trust input (like an outside pull request) meets higher-trust machinery.' },
      { term: 'Invariant', meaning: 'A rule that must always hold, e.g. "untrusted code never runs with deploy credentials".' },
    ],
    before: plain('a factory line from sketch to shop shelf',
      'Software delivery is a factory line: someone writes a change, a machine builds it, another packages it and another ships it to customers. Each station has different keys to the building.',
      'Attackers look for a place where something low-trust — say, a stranger\'s suggested change — can influence a station holding powerful keys. Mapping who can affect which station is more useful than knowing the brand of the factory equipment.'),
    after: [{
      title: 'Worked example: who can influence the deploy keys?',
      paragraphs: [
        'List each stage, who can affect it, and what secrets it holds. The danger is a short path from "anyone can suggest a change" to "runs with the deploy key".',
        'In the map below, the build stage both accepts outside pull requests and holds the publish token. That is the invariant being broken: untrusted input must never reach a stage with production credentials. Splitting the build so untrusted PRs run with no secrets closes the path.',
      ],
      code: 'Stage      Who can affect it            Secrets it holds\nContribute anyone (pull request)        none\nBuild      anyone (PR triggers it)  <-- publish token   *** risk ***\nPublish    maintainers only            registry key\nDeploy     release managers only       production deploy key\n\nFix: run untrusted-PR builds in an isolated job with NO secrets.',
      label: 'Trace the shortest path from "anyone" to a powerful key',
    }],
  },
  'msf-collection-2': {
    keyTerms: [
      { term: 'Module', meaning: 'A Metasploit component that does one job: an exploit, a scanner (auxiliary) or a post-exploitation task.' },
      { term: 'Options', meaning: 'Settings a module needs, such as RHOSTS (target) and LHOST (your listening address).' },
      { term: 'Session', meaning: 'An open, interactive connection to a target created by a successful module.' },
      { term: 'Meterpreter', meaning: 'Metasploit\'s advanced payload that provides a feature-rich session with built-in commands.' },
    ],
    before: plain('fill in the form before posting it',
      'A Metasploit module is like an official form: it needs the right boxes filled (target, ports, your address) before it can do anything. Settings can be global (apply everywhere) or local (this module only), and old ones can linger from earlier work.',
      'When a module succeeds you get a session — an open line to the target, running as a specific account. When it fails, there can be several reasons: wrong option, unreachable target, patched service. Check your form before blaming the exploit.'),
  },
  'web-collection-2': {
    keyTerms: [
      { term: 'SSRF', meaning: 'Server-Side Request Forgery: tricking a server into fetching a URL of the attacker\'s choosing.' },
      { term: 'Egress control', meaning: 'Rules limiting where a server is allowed to connect out to.' },
      { term: 'Workload identity', meaning: 'Credentials a cloud server has automatically, which its outgoing requests may carry.' },
      { term: 'URL parser', meaning: 'Code that splits a URL into scheme, host, port and path — different parsers can disagree.' },
    ],
    before: plain('asking the receptionist to fetch something from the back office',
      'You cannot walk into a company\'s back office, but the receptionist can. SSRF is persuading the receptionist (the server) to fetch something for you from a place only staff can reach — internal systems or the cloud\'s credential service.',
      'Defences therefore need two layers: careful checking of which URLs the server will fetch, and network rules that stop the server reaching sensitive places even if the URL check is fooled.'),
  },
  'post-network-2': {
    keyTerms: [
      { term: 'Persistence', meaning: 'Access that survives a logout, reboot or password change.' },
      { term: 'Lifecycle control', meaning: 'Processes that remove access when it should end, such as revoking sessions after a password reset.' },
      { term: 'Reversible change', meaning: 'A test action that can be cleanly undone, leaving no lasting effect.' },
      { term: 'Grant', meaning: 'A recorded permission, such as a role assignment or an API token, that gives ongoing access.' },
    ],
    before: plain('does the old key still work after the locks change?',
      'Persistence asks a simple question: if someone\'s access is supposed to end — they log out, the server restarts, the password is reset — does any route back in survive?',
      'You do not need to plant hidden backdoors to answer that. Review the existing grants and tokens, then run small, agreed, reversible tests to see whether old access really stops working.'),
  },
  'web-collection-3': {
    keyTerms: [
      { term: 'MIME type', meaning: 'A label such as image/png describing a file\'s format — easily faked by the uploader.' },
      { term: 'Magic bytes', meaning: 'The first bytes of a file that reveal its real format, regardless of its name.' },
      { term: 'Path traversal', meaning: 'Using ../ in a filename to write or read outside the intended folder.' },
      { term: 'Zip bomb', meaning: 'A tiny archive that expands to an enormous size, exhausting disk or memory.' },
    ],
    before: plain('a parcel label can lie about what is inside',
      'When someone uploads "cat.png", the name, the declared type and the actual contents can all disagree — like a parcel labelled "books" that contains something else. Checking only the name is not checking the contents.',
      'Uploads are risky at three moments: where the file is stored, what program opens it, and who is allowed to download it later. Each moment needs its own check.'),
  },
  'adv-delivery-4': {
    keyTerms: [
      { term: 'Workload', meaning: 'A running unit of software, such as a container, VM or serverless function.' },
      { term: 'Mount', meaning: 'A folder or socket from the host made available inside a workload.' },
      { term: 'Control socket', meaning: 'A special file (like /var/run/docker.sock) that lets whoever can use it control the container platform.' },
      { term: 'Credential lifetime', meaning: 'How long a credential remains valid before it expires or must be rotated.' },
    ],
    before: plain('the label on the box does not decide what it can do',
      'Calling something a "container" or "serverless function" does not make it isolated. What it can really do depends on what was connected to it: shared folders, a control socket, network routes and the credentials it holds.',
      'So assess a workload from the inside out: list what it can reach and what keys it carries, and how long those keys keep working if they leak.'),
    after: [{
      title: 'Worked example: two "containers", very different power',
      paragraphs: [
        'The two workloads below are both "just containers", but what they were given makes one harmless and the other able to control the whole host.',
        'Container B mounts the Docker control socket — anyone inside it can start new privileged containers on the host, so the "isolation" is an illusion. The lesson: judge a workload by what it can reach, not by its label.',
      ],
      code: 'Container A (web)        Container B (ci-runner)\n  mounts: none             mounts: /var/run/docker.sock  <-- controls the host\n  network: app subnet      network: all internal\n  creds: short-lived (1h)  creds: long-lived admin token\n\nA: contained.   B: effectively host-level, despite being "a container".',
      label: 'Same label, different reach — B can control the host',
    }],
  },
  'kali-access-2': {
    keyTerms: [
      { term: 'Credential exposure', meaning: 'A password, hash or key becoming visible to someone who should not have it.' },
      { term: 'Hash vs password', meaning: 'A hash is a one-way scramble of a password; some systems accept the hash itself, others need the original.' },
      { term: 'Validity', meaning: 'Whether an exposed credential still works today.' },
      { term: 'Minimum proof', meaning: 'The smallest action that demonstrates the risk without accessing unrelated data.' },
    ],
    before: plain('finding a key is not the same as opening every door',
      'Finding a password in a file shows that a key was lying around. It does not prove the key still works, or which doors it opens. Different credential types behave differently too — some can be replayed directly, others must first be cracked.',
      'A professional proves only what is needed: "this account\'s password was readable in backup.conf" — not a tour of everything the account could see.'),
  },
  'post-host-1': {
    keyTerms: [
      { term: 'Foothold', meaning: 'Your first working access on a target system.' },
      { term: 'Session baseline', meaning: 'A quick record of who you are, where you are and what you can do, taken as soon as access begins.' },
      { term: 'Authorised objective', meaning: 'The specific goal the client approved, which defines what you may do next.' },
      { term: 'Stop rule', meaning: 'A pre-agreed point at which you stop and report rather than going further.' },
    ],
    before: plain('look around before you move',
      'When you first gain access to a system, the first job is to understand your position: which account you are, which machine this is, what it is connected to. That is your baseline.',
      'Access is not permission to wander. You check what the client asked you to prove, collect what helps that decision, and stop when you reach the agreed point.'),
  },
  'py-collection-2': {
    keyTerms: [
      { term: 'subprocess', meaning: 'Python\'s module for running other programs from a script.' },
      { term: 'Argument vector', meaning: 'A list of separate arguments passed to a program, e.g. ["ping", "-c", "1", host], rather than one string.' },
      { term: 'Shell injection', meaning: 'Smuggling extra commands into a command string, e.g. a hostname of "x; rm -rf /".' },
      { term: 'Timeout', meaning: 'A limit on how long you wait for a program before stopping it.' },
    ],
    before: plain('hand over a filled form, not a sentence to interpret',
      'When Python runs another program, you can pass it either one long sentence to interpret (a shell string) or a neat list of separate items (an argument list). The sentence can be hijacked: a "hostname" containing ; can sneak in a second command.',
      'Passing a list such as ["ping", "-c", "1", host] means the host is treated purely as data. Add a timeout so a hung program cannot freeze your script, and check the output before trusting it.'),
  },
  'iot-modern-3': {
    keyTerms: [
      { term: 'Provisioning', meaning: 'Setting a new device up and binding it to its owner and cloud account.' },
      { term: 'Default credential', meaning: 'A password shipped identical on many devices — dangerous because it is widely known.' },
      { term: 'Debug interface', meaning: 'Hardware connections like UART or JTAG left for factory testing that can give deep access.' },
      { term: 'Ownership transfer', meaning: 'Moving a device to a new owner securely, removing every trace of the old owner\'s access.' },
    ],
    before: plain('a house key that stays with the house, not the old owner',
      'A smart device lives through stages: built in a factory, set up by its first owner, maybe resold. If every device shipped with the same password, or a resold device still talks to the old owner\'s app, the nicest login screen will not save it.',
      'Factory debug pins on the circuit board are another back door: anyone holding the device may be able to use them. Security means each device gets its own secrets and each handover truly resets access.'),
  },
  'linux-collection-2': {
    keyTerms: [
      { term: 'Unit file', meaning: 'A systemd configuration file describing how to start and run a service.' },
      { term: 'Enabled vs active', meaning: 'Enabled means it starts at boot; active means it is running right now. One can be true without the other.' },
      { term: 'Restart policy', meaning: 'What systemd does when a service crashes, such as restart it automatically.' },
      { term: 'Boot ID', meaning: 'An identifier for each boot, letting journalctl show only logs from a particular start-up.' },
    ],
    before: plain('the timetable vs the train on the platform',
      'On Linux, systemd manages background services. "Enabled" means a service is on the timetable to start at boot; "active" means the train is actually at the platform now. Mixing them up is a common beginner mistake.',
      'Each service is defined by a unit file that says which program runs, as which user, and what happens if it crashes. journalctl shows its logs — and can filter by service and by boot, which makes troubleshooting precise.'),
  },
  'adv-identity-4': {
    keyTerms: [
      { term: 'Effective authority', meaning: 'Everything an identity can actually do, from all sources combined: groups, roles, sessions and grants.' },
      { term: 'Trust graph', meaning: 'A map of identities and the relationships that give one power over another.' },
      { term: 'Revocation', meaning: 'Removing access so that existing tokens and sessions stop working, not just the visible permission.' },
      { term: 'Handback', meaning: 'Returning systems to the owner at the end of a test with all temporary access removed.' },
    ],
    before: plain('changing the password does not take back the spare keys',
      'An account\'s power comes from many places: its password, group memberships, roles, open sessions and tokens issued to apps. Resetting the password closes one door but may leave sessions logged in and tokens working.',
      'So proper removal of access follows every source of authority and confirms each one has really stopped working.'),
    after: [{
      title: 'Worked example: a revocation checklist',
      paragraphs: [
        'When access should end, go through every source of authority — not just the password — and confirm each is actually dead. A single missed item leaves a working way back in.',
        'The checklist below is the difference between "we reset the password" and "we removed the access". Note that existing sessions and app tokens often survive a password reset unless you explicitly revoke them.',
      ],
      code: 'Removing access for: contractor-temp\n  [x] password reset\n  [x] active sessions revoked      (else they stay logged in)\n  [x] API / app tokens revoked     (else integrations keep working)\n  [x] removed from admin groups    (group membership = standing power)\n  [x] temporary roles expired\n  [ ] cached SSH key on bastion    <-- still present: NOT fully revoked\n\nAccess is removed only when every box is ticked.',
      label: 'Password reset alone is not revocation',
    }],
  },
  'post-network-3': {
    keyTerms: [
      { term: 'Purple team', meaning: 'Attackers (red) and defenders (blue) working together to test and improve detection.' },
      { term: 'Observation chain', meaning: 'The path from an action to a log, to the SIEM, to an alert, to an analyst.' },
      { term: 'Detection coverage', meaning: 'Which attacker behaviours the defenders can actually see and alert on.' },
      { term: 'Controlled behaviour', meaning: 'A harmless, agreed action performed specifically to test whether it is detected.' },
    ],
    before: plain('testing the alarm is different from fixing the lock',
      'A penetration test asks "is this door weak?". A detection test asks "if someone tries this door, does the alarm ring and does anyone respond?". These are separate questions with separate answers.',
      'In a purple-team exercise, the tester performs an agreed, harmless action while defenders check each link of the chain: was it logged, did the log reach the SIEM, did a rule fire and did someone act?'),
    after: [{
      title: 'Worked example: where the alarm chain broke',
      paragraphs: [
        'A detection "pass" needs every link to work: the action must be logged, the log must reach the SIEM, a rule must match, and someone must respond. Testing the whole chain finds which link is missing.',
        'In the run below the behaviour was logged and ingested, but no rule matched — so a real attacker doing the same thing would go unnoticed. The finding is "add a detection rule", not "the endpoint is secure".',
      ],
      code: 'Controlled action: create a new local admin account on TESTHOST\n  1 Action performed                      ok\n  2 Logged on the host (event 4720/4732)   ok\n  3 Log reached the SIEM                    ok\n  4 A detection rule matched                NO   <-- chain breaks here\n  5 Analyst alerted and responded           n/a\n\nCoverage gap found: no rule for privileged-group changes. Add one, re-test.',
      label: 'The chain is only as strong as its weakest link',
    }],
  },
  'adv-identity-3': {
    keyTerms: [
      { term: 'Confused deputy', meaning: 'A trusted service tricked into using its own powers on behalf of someone who should not have them.' },
      { term: 'Delegation', meaning: 'Allowing one identity or service to act on behalf of another.' },
      { term: 'Service identity', meaning: 'The account a service or agent runs as, often with broad permissions.' },
      { term: 'On-behalf-of check', meaning: 'Verifying that the original requester is allowed the action, not just the service performing it.' },
    ],
    before: plain('the assistant with the master key',
      'Imagine an office assistant with a master key who will fetch any file you ask for. If they never check whether you are allowed to see it, anyone can read anything — by asking the assistant. The assistant is a "confused deputy".',
      'Build systems, preview services, cloud functions and AI agents all act as assistants. The question to test is always the same: does the service check the original requester\'s rights, or only its own?'),
    after: [{
      title: 'Worked example: the two authorization checks a deputy needs',
      paragraphs: [
        'When a service acts for a user, two separate questions must both be answered yes. Is the service itself allowed to perform the action? And is the original requester allowed to have it done for them?',
        'The confused-deputy bug is checking only the first. Below, the report service may read any file (it needs to), but it forgot to confirm the requester owned the file — so a normal user asks it to fetch someone else\'s document and it obliges.',
      ],
      code: 'Request: user "sam" asks the report service for /exports/finance-q3.pdf\n\n  Can the report service read that file?   yes  (it can read all exports)\n  Is "sam" allowed to read that file?       NOT CHECKED  <-- the bug\n\n-> It returns the file. Fix: the deputy must verify the ORIGINAL caller\'s\n   rights (on-behalf-of), not just its own.',
      label: 'Check the caller\'s rights, not only the service\'s',
    }],
  },
  'iot-modern-2': {
    keyTerms: [
      { term: 'MQTT broker', meaning: 'The central server that receives MQTT messages and passes them to subscribers.' },
      { term: 'Topic', meaning: 'The named channel a message is published to, such as home/livingroom/lamp/set.' },
      { term: 'Publish / subscribe', meaning: 'Clients publish messages to topics and subscribe to receive messages from topics.' },
      { term: 'Topic ACL', meaning: 'Rules limiting which client may publish or subscribe to which topics.' },
    ],
    before: plain('a radio station anyone can broadcast on',
      'MQTT works like a set of radio channels (topics). Devices tune in to channels they care about and broadcast on others. The broker is the radio mast that relays everything.',
      'Being allowed to connect to the mast should not mean you can broadcast "unlock the door" on someone else\'s channel or listen to every home\'s sensors. Test separately who may publish and who may subscribe to each topic.'),
  },
  'post-host-2': {
    keyTerms: [
      { term: 'sudo rule', meaning: 'A line in /etc/sudoers allowing a user to run a specific command as another user, often root.' },
      { term: 'Shell escape', meaning: 'A feature of a program (like an editor) that lets you start a shell — inheriting its privileges.' },
      { term: 'GTFOBins', meaning: 'A public catalogue of Unix programs that can be misused to escalate privileges when given extra rights.' },
      { term: 'Narrow helper', meaning: 'A small purpose-built program that performs only the one privileged action needed.' },
    ],
    before: plain('lending your car, not your whole garage',
      'Giving someone permission to run a program as an administrator gives them everything that program can do. If the program is a text editor that can open a shell, you have effectively given them the whole garage, not just the car.',
      'The fix is to allow only a narrow, specific action — a small helper that does exactly one job — rather than a flexible program with many hidden abilities.'),
  },
  'eng-collection-2': {
    keyTerms: [
      { term: 'SPF', meaning: 'Sender Policy Framework: a DNS record listing which servers may send email for a domain.' },
      { term: 'DKIM', meaning: 'DomainKeys Identified Mail: a signature proving an email was sent by, and not altered since leaving, a domain\'s mail system.' },
      { term: 'DMARC', meaning: 'A policy telling receivers what to do when SPF/DKIM do not align with the visible From domain.' },
      { term: 'Display name', meaning: 'The friendly name shown in an inbox, such as "IT Support" — which anyone can set to anything.' },
    ],
    before: plain('the name on the envelope vs the postmark',
      'An email can show a friendly name like "Bank Support" while actually coming from a completely different domain. SPF, DKIM and DMARC are postmark checks: they verify whether the sending servers are allowed to send for a domain.',
      'Even a message that passes every check only proves which domain sent it — not that the sender is honest or that its links are safe.'),
  },
  'cloud-modern-4': {
    keyTerms: [
      { term: 'Instance metadata service', meaning: 'An internal address (169.254.169.254) where a cloud server can look up information about itself, including temporary credentials.' },
      { term: 'IMDSv2', meaning: 'The hardened AWS version of the metadata service that requires a session token obtained with a PUT request first.' },
      { term: 'Link-local address', meaning: 'An address reachable only from the machine itself or its immediate network segment.' },
      { term: 'Hop limit', meaning: 'A setting that limits how many network hops the metadata token response can travel, blocking some relayed requests.' },
    ],
    before: plain('the staff room only staff should enter',
      'Every cloud server has a private "staff room" address where it can ask for its own details, including keys that let it use other cloud services. If an attacker can make the server fetch a URL (SSRF), they may be able to fetch those keys from the staff room.',
      'IMDSv2 adds a rule: you must first ask for a temporary pass using a special type of request before entering. That blocks many simple SSRF bugs — but not every one.'),
  },
  'cloud-modern-2': {
    keyTerms: [
      { term: 'Access key', meaning: 'A long-term AWS credential pair (key ID + secret) for programmatic access.' },
      { term: 'Session token', meaning: 'The third part of a temporary credential set that proves it is a short-lived session.' },
      { term: 'AssumeRole', meaning: 'Requesting temporary credentials for an IAM role you are allowed to use.' },
      { term: 'PassRole', meaning: 'Permission to hand a role to an AWS service (like an EC2 instance), letting that service act with the role.' },
    ],
    before: plain('a visitor badge that expires tonight',
      'A permanent access key is like a staff ID card: it works until someone cancels it. Temporary credentials are visitor badges: they include an extra token and expire after hours, so a leaked one is far less useful.',
      'AssumeRole is borrowing a badge for yourself. PassRole is handing a badge to a machine or service so it can work on your behalf — powerful, because the service gains everything that badge allows.'),
  },
  'cloud-modern-3': {
    keyTerms: [
      { term: 'Object', meaning: 'A file stored in S3 together with its metadata, identified by a key such as reports/2024/q1.pdf.' },
      { term: 'Bucket policy', meaning: 'A permission document attached to a bucket saying who may list, read or write its objects.' },
      { term: 'Block Public Access', meaning: 'An S3 safety setting that overrides policies to prevent public access.' },
      { term: 'Server-side encryption', meaning: 'S3 encrypting objects when storing them — which protects the disks, not who may read through S3.' },
    ],
    before: plain('a storage unit with separate rules for looking, taking and adding',
      'An S3 bucket is a storage unit full of labelled boxes (objects). "Public" is not one switch: someone might be able to see the list of boxes, open some boxes, or add new ones — each controlled separately.',
      'Encryption keeps the boxes safe if the warehouse floor is stolen, but anyone S3 allows to read the object still gets it decrypted. Permissions, not encryption, decide who can read.'),
  },
  'mobile-modern-2': {
    keyTerms: [
      { term: 'App component', meaning: 'A part of an Android app — activity, service, receiver or provider — that the system can start.' },
      { term: 'Exported component', meaning: 'A component other apps are allowed to start directly.' },
      { term: 'Deep link', meaning: 'A link that opens a specific screen inside an app, e.g. myapp://orders/42.' },
      { term: 'Backend authorization', meaning: 'The server checking that the user may perform an action, no matter how the app was opened.' },
    ],
    before: plain('side doors into the app',
      'You usually enter an app through its front door: the home screen. But other apps and links can open specific rooms directly — through exported components and deep links — skipping the normal route.',
      'That is only safe if every room checks who came in and whether they are allowed to be there, and if the server re-checks permission for every action, no matter which door was used.'),
  },
};
