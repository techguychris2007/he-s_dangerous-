import type { LessonDepth } from './types';

const plain = (title: string, ...paragraphs: string[]) => [{ title: `In plain English: ${title}`, paragraphs }];

/** Beginner depth for the intermediate security/cloud/web/data lessons that are precise but
 *  vocabulary-dense. Each adds the key words, an everyday comparison, and (where a concrete picture
 *  helps most) a worked example built from benign, illustrative data — never a live exploit. */
export const INTERMEDIATE_DEPTH: Record<string, LessonDepth> = {
  // ── Databases ────────────────────────────────────────────────────────────────────────────────
  'db-modern-1': {
    keyTerms: [
      { term: 'Database', meaning: 'A service that stores data and answers queries. Programs connect to it and ask it to read or change data.' },
      { term: 'Service account', meaning: 'The database login an application uses to connect — not the person using the app. One app account usually serves every user.' },
      { term: 'Connection pool', meaning: 'A set of ready-made database connections an app reuses, so it does not reconnect for every request.' },
      { term: 'Control plane', meaning: 'The management side of a cloud database (creating, configuring, backing it up) — separate from reading and writing the data itself.' },
    ],
    before: plain('three different "who" questions',
      'When you use a website that stores data, several different identities are involved, and beginners often blur them. You log in as yourself to the app. The app then connects to the database using its own single account. The database program itself runs on the server as an operating-system user. In the cloud, there is also a separate account for managing the database.',
      'These are not the same "who". Logging in as yourself does not mean your actions reach the database as you — they almost always arrive as the app\'s shared service account. Knowing which identity does what is the first step in understanding database security.'),
    after: [{
      title: 'Worked example: following one request\'s identities',
      paragraphs: [
        'Trace a single "show my invoices" click down the stack. Notice that four different identities are involved, and the database only ever sees the third one.',
        'This is why a bug in the app can expose everyone\'s data: the database trusts app_svc completely and relies on the app to ask only for the right rows. The database cannot tell "Ama" from "Kofi" — it only sees app_svc.',
      ],
      code: 'You (browser)      logged in as  ama@corp        -> talks to the app\nApp server         connects as    app_svc          -> talks to the database\nDatabase process   runs as        postgres (OS user) on the server\nCloud management   managed by     admin IAM role    -> can resize/back up the DB\n\nThe database sees every query as "app_svc", never as "ama".',
      label: 'One click, four identities — the DB only sees the app account',
    }],
  },
  'db-modern-2': {
    keyTerms: [
      { term: 'Query', meaning: 'An instruction sent to a database, such as "give me the user whose id is 7".' },
      { term: 'Parameterised query', meaning: 'A query where values are sent separately from the instruction, so the database always treats them as data, never as commands.' },
      { term: 'Placeholder', meaning: 'A marker (? or $1 or :name) in the query where a value will be slotted in safely by the driver.' },
      { term: 'Injection', meaning: 'A bug where attacker-supplied data is read as part of the instruction, changing what the query does.' },
    ],
    before: plain('keep the order separate from the ingredients',
      'Imagine phoning a kitchen: "Make me a pizza with — ignore that, cancel all orders — mushrooms." If the cook treats your whole sentence as instructions, your "ingredient" just cancelled every order. That is injection: data being read as commands.',
      'A parameterised query fixes this by handing the instruction and the ingredients over separately: "Make a pizza with [this exact topping]", and the topping is always just a topping, even if it contains the words "cancel all orders". The database never re-reads a value as part of the command.'),
    after: [{
      title: 'Worked example: the unsafe way vs the safe way',
      paragraphs: [
        'Both snippets below look up a user by name. The first builds the query by gluing text together, so a crafted name changes the query. The second sends the name as a separate parameter, so it can only ever be a value.',
        'With the unsafe version, a username of  x\' OR \'1\'=\'1  turns the WHERE clause into something always true. With the parameterised version, that same text is searched for literally as a (nonsensical) username and simply matches nothing.',
      ],
      code: '# Unsafe: value is glued into the instruction\nq = "SELECT * FROM users WHERE name = \'" + name + "\'"\n\n# Safe: value travels separately; ? is a placeholder\ncur.execute("SELECT * FROM users WHERE name = ?", (name,))\n\n# name = "x\' OR \'1\'=\'1"\n#   unsafe -> WHERE name = \'x\' OR \'1\'=\'1\'   (matches everyone)\n#   safe   -> searches for the literal name "x\' OR \'1\'=\'1" (matches no one)',
      label: 'The placeholder keeps the value a value',
    }],
  },

  // ── Web ──────────────────────────────────────────────────────────────────────────────────────
  'web-protocol-1': {
    keyTerms: [
      { term: 'Percent-encoding', meaning: 'Writing special characters in a URL as %XX, e.g. a space is %20 and a slash is %2F. Also called URL-encoding.' },
      { term: 'Form body', meaning: 'The data a form sends in the body of a POST request, usually as name=value pairs joined by &.' },
      { term: 'Parser', meaning: 'Code that reads a format (a URL, JSON, a form body) and turns it into values the program can use.' },
      { term: 'Duplicate parameter', meaning: 'The same name appearing twice in a request (id=1&id=2) — different frameworks may pick the first, the last, or both.' },
    ],
    before: plain('the same letter can be written several ways',
      'Before a web app uses your input, it decodes it — often more than once, in different formats. A space might arrive as %20 in the URL, as + in a form, or as a literal space in JSON. These are different "alphabets" for writing the same thing.',
      'Security gaps appear when two parts of the system decode differently: a filter checks the encoded form, but the application acts on the decoded form, and they disagree. So you have to know exactly which decoding happens at which step, instead of assuming one generic "clean the input" exists.'),
  },
  'web-collection-1': {
    keyTerms: [
      { term: 'Authorization', meaning: 'The server deciding whether a specific user may do a specific action to specific data.' },
      { term: 'Object-level check', meaning: 'Verifying the user is allowed to touch this particular record (this invoice, this account).' },
      { term: 'Function-level check', meaning: 'Verifying the user is allowed to perform this kind of action at all (e.g. issue a refund).' },
      { term: 'Property-level check', meaning: 'Verifying the user may change this specific field (e.g. owner_id or approval status), even on a record they own.' },
    ],
    before: plain('owning the form is not permission to fill in every box',
      'Think of a bank form you are allowed to submit. Checking that it is your form (object-level) is not enough. Can you tick the "approved by manager" box (property-level)? Can you use the "issue refund" form at all (function-level)? Each is a separate permission.',
      'Many real breaches happen because an app checks only the first — "is this your invoice?" — and then lets the same request quietly change a field it should not, like who owns the invoice or whether it is marked paid.'),
    after: [{
      title: 'Worked example: one owner, three different answers',
      paragraphs: [
        'A user owns invoice 42 and sends an update. The app correctly confirms ownership, but the request also changes fields it should not. Good authorization checks each part separately.',
        'The fix is to decide, per field and per action, what this user may change — not to assume that "it is their record" settles everything.',
      ],
      code: 'PATCH /invoices/42   (user owns invoice 42)\n{\n  "note": "please rush",      <- allowed: own record, editable field\n  "owner_id": 99,             <- must be BLOCKED: changing ownership\n  "status": "paid"            <- must be BLOCKED: only finance may approve\n}\n\nObject check:   is 42 theirs?            yes\nProperty check: may they set owner_id?    NO\nFunction check: may they mark it paid?    NO',
      label: 'Ownership passes; the field and action checks must still run',
    }],
  },

  // ── Identity & authorization ──────────────────────────────────────────────────────────────────
  'adv-identity-1': {
    keyTerms: [
      { term: 'Actor', meaning: 'Who is making the request — a person, a service account or an automated agent.' },
      { term: 'Resource', meaning: 'The specific thing being acted on — a particular invoice, file or account.' },
      { term: 'Horizontal vs vertical access', meaning: 'Horizontal = reaching another user\'s data at your level; vertical = reaching a higher privilege level (admin).' },
      { term: 'Tenant', meaning: 'One customer\'s isolated space in a shared system; crossing tenants means seeing another company\'s data.' },
    ],
    before: plain('four questions, not one',
      'Authentication asks "who are you?". Authorization asks a bigger question made of four parts: which actor, doing which action, to which resource, in which context? "Alex is an admin" does not answer whether Alex may delete this particular file belonging to another tenant right now.',
      'Writing the rule as actor + action + resource + context forces you to notice the cases a simple "admin vs user" split misses — like a clerk who may read invoices but only within their own company.'),
    after: [{
      title: 'Worked example: an authorization test matrix',
      paragraphs: [
        'To test authorization properly, list the actors down the side and the actions across the top, and fill in what should happen. Then try each cell. A single wrong "allow" is a finding.',
        'The grid below checks both horizontal access (clerk reaching tenant B) and vertical access (clerk doing admin actions). Testing cell by cell beats poking around at random.',
      ],
      code: 'Actor \\ Action   read own-tenant   read other-tenant   change bank details\nClerk (tenant A)      allow              DENY                  DENY\nManager (tenant A)    allow              DENY                  allow (tenant A)\nPlatform admin        allow              allow                 allow\n\nEach DENY that actually returns data is an authorization bug.',
      label: 'Fill the grid, then test every cell',
    }],
  },
  'adv-identity-2': {
    keyTerms: [
      { term: 'Claim', meaning: 'A statement inside a token, such as "this user is an admin" or "expires at 5pm".' },
      { term: 'Issuer', meaning: 'The system that created and signed a token. You trust claims only as much as you trust the issuer.' },
      { term: 'Audience', meaning: 'Which service a token was meant for. A token for API A should not be accepted by API B.' },
      { term: 'Expiry / freshness', meaning: 'When a token stops being valid. An old token should be rejected even if its signature is still correct.' },
    ],
    before: plain('a signed note is only as good as who signed it',
      'A token is like a signed note that says "the bearer is a manager, valid until 5pm, for the finance office". Before trusting it you ask: who signed it (issuer), was it meant for me (audience), and is it still in date (freshness)?',
      'A valid signature alone is not enough. A genuine note written for a different office, or one that expired an hour ago, should still be refused. And a header someone simply typed ("Role: admin") with no trusted signer behind it proves nothing at all.'),
  },

  // ── Networking / Linux ────────────────────────────────────────────────────────────────────────
  'net-modern-4': {
    keyTerms: [
      { term: 'Stateful firewall', meaning: 'A firewall that remembers connections, so replies to traffic you allowed out are automatically let back in.' },
      { term: 'NAT', meaning: 'Network Address Translation: rewriting addresses so many devices share one public IP. It hides addresses; it is not a permission check.' },
      { term: 'INPUT / OUTPUT / FORWARD', meaning: 'Linux firewall paths: traffic TO this machine, FROM this machine, and routed THROUGH it to somewhere else.' },
      { term: 'Segmentation', meaning: 'Separating a network into zones so a problem in one zone cannot freely reach another.' },
    ],
    before: plain('being hidden is not the same as being protected',
      'Two ideas get confused here. NAT lets many computers share one public address — like a building with one street address and many internal flat numbers. That hides the flats, but the front-desk rules about who may visit which flat are a separate thing: the firewall.',
      'A private address behind NAT is not a security policy. To know whether a boundary actually holds, you read the firewall rules: which direction, which transport, from where to where, and in which order the rules apply.'),
    after: [{
      title: 'Worked example: reading three firewall paths',
      paragraphs: [
        'The same machine treats traffic differently depending on where it is headed. A rule allowing SSH INTO the box says nothing about traffic passing THROUGH it to a server behind it.',
        'Reading the paths separately prevents the classic mistake of assuming "SSH is allowed" means a jump host can reach everything on the far side.',
      ],
      code: 'INPUT   (to this host)     allow tcp 22 from 10.0.0.0/24      -> admins can SSH in\nFORWARD (through this host) allow tcp 443 to 10.0.5.10          -> only HTTPS to one server\nFORWARD (through this host) default DROP                        -> nothing else crosses\n\n"I can SSH to the jump host" does NOT mean "the jump host can reach the database".',
      label: 'INPUT and FORWARD are different decisions',
    }],
  },
  'lin-modern-1': {
    keyTerms: [
      { term: 'chmod bits', meaning: 'The basic Linux permissions (rwx for owner/group/other) shown by ls -l.' },
      { term: 'ACL', meaning: 'Access Control List: extra per-user or per-group permissions beyond the basic owner/group/other, shown by getfacl.' },
      { term: 'Capability', meaning: 'A small slice of root\'s power granted to a program on its own (e.g. bind a low port) without making it fully root.' },
      { term: 'UID', meaning: 'The numeric user ID a process runs as. It is only part of what a process is allowed to do.' },
    ],
    before: plain('the username is not the whole story',
      'Beginners learn that Linux permissions are the rwx letters from ls -l and the user a process runs as. On a modern system that is only part of the picture. A service can also have extra ACL permissions, a limited set of capabilities instead of full root, and a restricted view of the filesystem.',
      'So "it runs as root" or "the file is 644" can be misleading on its own. To understand what a process can really do, you look at several layers together rather than one line of output.'),
  },

  // ── Python protocols ──────────────────────────────────────────────────────────────────────────
  'py-protocol-1': {
    keyTerms: [
      { term: 'Bytes vs text', meaning: 'Text (str) is human characters; bytes are the raw numbers sent over a network. Encoding converts one to the other.' },
      { term: 'UTF-8', meaning: 'The common way to encode text as bytes. Some characters take one byte, others several, so character count ≠ byte count.' },
      { term: 'TCP stream', meaning: 'TCP delivers an ordered flow of bytes with no message boundaries. Your code must decide where each message ends.' },
      { term: 'Framing', meaning: 'A rule for marking message boundaries in a byte stream, e.g. "first 4 bytes are the length of the message".' },
    ],
    before: plain('the network sends a river, not envelopes',
      'When you send messages over TCP, it is tempting to imagine each one arriving in its own envelope. It does not. TCP gives you a continuous river of bytes; two messages can arrive stuck together, or one message can arrive in pieces. One recv() is not one message.',
      'So protocols add framing — a rule for where each message starts and ends. A common rule: send the length first, then that many bytes. Also remember that text must be encoded to bytes (UTF-8), and a character is not always one byte, so lengths count bytes, not letters.'),
    after: [{
      title: 'Worked example: length-prefix framing',
      paragraphs: [
        'The sender writes a 4-byte length, then the message bytes. The receiver reads exactly 4 bytes to learn the length, then keeps reading until it has that many bytes — even if they arrive in several pieces.',
        'Notice the text "café" is 4 characters but 5 bytes in UTF-8 (é takes two), so the length prefix is 5, not 4. Counting characters here would read one byte too few and corrupt every message after it.',
      ],
      code: 'text = "café"\nbody = text.encode("utf-8")     # b"caf\\xc3\\xa9"  -> 5 bytes, not 4\nframe = len(body).to_bytes(4, "big") + body\n\n# receiver\nn = int.from_bytes(recv_exactly(4), "big")   # read the 4-byte length\nbody = recv_exactly(n)                        # keep reading until n bytes\ntext = body.decode("utf-8")',
      label: 'Length first, then exactly that many bytes',
    }],
  },

  // ── IoT / mobile / binary ─────────────────────────────────────────────────────────────────────
  'iot-modern-1': {
    keyTerms: [
      { term: 'Firmware', meaning: 'The low-level software built into a device (camera, router) that controls how it works.' },
      { term: 'Signed firmware', meaning: 'An update carrying a cryptographic signature, so the device can check it came from the real manufacturer before installing.' },
      { term: 'Checksum', meaning: 'A short value proving a file was not corrupted in transit. It detects accidents, not deliberate tampering.' },
      { term: 'Rollback / recovery', meaning: 'A safe fallback so a device still works if an update is bad — e.g. keeping the previous firmware.' },
    ],
    before: plain('three different safety questions about an update',
      'When a device updates itself, three separate things must be true, and beginners often merge them. Was the download protected in transit (encryption)? Did it arrive uncorrupted (checksum)? And was it really made by the manufacturer, not an attacker (signature)?',
      'A checksum catches a garbled download but not a malicious one — an attacker can fake a matching checksum. Only a signature the device verifies proves authorship. And if an update fails, the device still needs a recovery path so it does not become a brick.'),
  },
  'mobile-modern-3': {
    keyTerms: [
      { term: 'TLS trust', meaning: 'Which certificate authorities an app believes when making HTTPS connections. Apps can add or (dangerously) relax this.' },
      { term: 'Cleartext policy', meaning: 'Whether an app is allowed to make unencrypted HTTP connections at all.' },
      { term: 'WebView', meaning: 'An embedded browser inside a native app. It can be given access to native device features.' },
      { term: 'JavaScript bridge', meaning: 'A link that lets web code inside a WebView call native app functions — powerful, and risky if the page is untrusted.' },
    ],
    before: plain('one app, several different front doors',
      'A phone app is not a single network client. It may make normal HTTPS calls, but it can also embed a mini-browser (a WebView) that loads web pages, and that WebView can be wired to call native code on the device.',
      'So testing one HTTPS request tells you about one door. Other requests might allow plain HTTP, trust the wrong certificates, or let a loaded web page reach device features through the JavaScript bridge. Each door needs checking separately.'),
  },
  'binary-depth-4': {
    keyTerms: [
      { term: 'Memory bug', meaning: 'A programming mistake where code reads or writes memory it should not, such as past the end of a buffer.' },
      { term: 'Crash vs impact', meaning: 'A bug may crash a program (denial of service) or, more seriously, let an attacker control it. These are different severities.' },
      { term: 'Mitigation', meaning: 'A built-in protection (ASLR, DEP/NX, stack canaries) that makes a bug harder to exploit, even if the bug remains.' },
      { term: 'Exploitability', meaning: 'How realistically a bug can be turned into attacker control, given the protections in place.' },
    ],
    before: plain('the same bug, a different outcome',
      'Old tutorials often show a memory bug on a "stripped-down" machine with no protections, so the attack is easy to see. A real modern program can have the exact same bug but a very different outcome, because the compiler and operating system add layers of defence.',
      'So the useful skill is judging a bug with those protections switched on: does it merely crash, or can it actually be controlled? That assessment — not memorising one old technique — is what matters today.'),
  },

  // ── Cloud ─────────────────────────────────────────────────────────────────────────────────────
  'cloud-modern-6': {
    keyTerms: [
      { term: 'Audit log', meaning: 'A record the cloud keeps of actions taken in an account — who did what, when (AWS calls this CloudTrail).' },
      { term: 'Management vs data events', meaning: 'Management events record changes to resources (create a bucket); data events record access to contents (read an object). They are logged separately.' },
      { term: 'Coverage', meaning: 'Which actions are actually being logged. If data events are off, reading a file leaves no trace.' },
      { term: 'Timeline', meaning: 'Events placed in time order (in UTC) so you can see what happened first and what followed.' },
    ],
    before: plain('the camera only records what it was set to record',
      'Cloud audit logs are like CCTV for your account. But there are two kinds of footage: changes to the building (someone created a storage bucket) and people entering rooms (someone read a file). By default, the second kind is often switched off to save cost.',
      'So "nothing in the logs" can mean "nothing happened" — or "that kind of action was never being recorded". A good investigation first checks what coverage existed, then builds a timeline in UTC from what was captured.'),
  },
  'cloud-modern-8': {
    keyTerms: [
      { term: 'Serverless function', meaning: 'A small piece of code the cloud runs on demand (AWS Lambda), without you managing a server.' },
      { term: 'Invoke permission', meaning: 'Who or what is allowed to trigger the function to run.' },
      { term: 'Execution role', meaning: 'The cloud identity the function runs as, which decides what other services its code can reach.' },
      { term: 'Deploy permission', meaning: 'Who is allowed to change the function\'s code — a separate, powerful right.' },
    ],
    before: plain('three separate keys to one function',
      'A serverless function raises three different "who can…" questions that beginners often merge. Who can trigger it to run (invoke)? Who can change its code (deploy)? And what can the running code itself reach (its execution role)?',
      'These are independent. Someone able to change the code inherits whatever the execution role can do; someone able only to invoke it does not. Mapping all three separately is how you reason about a function\'s real blast radius.'),
  },
  'cloud-modern-9': {
    keyTerms: [
      { term: 'Configuration review', meaning: 'Reading settings to find problems before deploying, rather than testing a live system.' },
      { term: 'Fixture', meaning: 'A small, safe, made-up sample set up for practice, instead of a real environment.' },
      { term: 'Bounded check', meaning: 'A test deliberately limited in scope so it cannot affect anything outside the exercise.' },
      { term: 'Dry run', meaning: 'Asking a tool what it WOULD do, without actually doing it.' },
    ],
    before: plain('read the plans before pouring concrete',
      'Before spinning up real cloud resources (which cost money and can be misconfigured), you can learn a lot from reviewing configuration, practising on small local fixtures, and running tools in a limited, read-only way.',
      'This lesson is about that safe-first habit: validate the configuration and your tooling on bounded examples, so that when you do deploy a real practice environment, you already understand what it should look like.'),
  },

  // ── Secure engineering / delivery / methodology / sessions / capstone ───────────────────────────
  'eng-collection-1': {
    keyTerms: [
      { term: 'Account recovery', meaning: 'The process for getting back into an account when the normal login fails — a favourite target for attackers.' },
      { term: 'Impersonation', meaning: 'Pretending to be someone (a customer, a colleague) to talk support or a system into acting for them.' },
      { term: 'Phishing-resistant authentication', meaning: 'Login methods (like security keys / passkeys) that cannot be handed over even if the user is tricked.' },
      { term: 'Out-of-band verification', meaning: 'Confirming identity through a separate trusted channel, not just what the caller claims.' },
    ],
    before: plain('confidence is not proof of identity',
      'An attacker on the phone can sound calm, use the right internal words, even mimic a familiar voice — none of which proves they are who they claim. The weak points are usually the human paths: support desks, password resets and "approve this transaction" calls.',
      'Strong design keeps identity and approval tied to something that cannot simply be talked out of someone: a security key, a verified callback, a code the real account holder must produce. Recovery and support must be as carefully designed as the front-door login.'),
  },
  'adv-delivery-2': {
    keyTerms: [
      { term: 'Pipeline', meaning: 'The automated steps that build, test and publish software after a change.' },
      { term: 'Untrusted input', meaning: 'Content from someone with low privilege — an outside contributor\'s pull request, a filename, a document.' },
      { term: 'Code/data confusion', meaning: 'When something meant as data (a value, a template) gets executed as instructions by a more powerful process.' },
      { term: 'Privileged runner', meaning: 'The build machine that runs pipeline steps, often holding secrets and publish rights.' },
    ],
    before: plain('do not let the intern\'s note run as the manager',
      'A build pipeline often runs with powerful credentials. The danger is when something low-trust — a suggested change from an outside contributor, a filename, a template value — gets treated as a command by that powerful process. The intern\'s sticky note ends up being executed with the manager\'s keys.',
      'The same shape appears everywhere: shell commands built from input, templates that evaluate their contents, document converters, AI tool calls. The enduring question is always: at what point does this data become a command, and under whose authority?'),
  },
  'adv-method-2': {
    keyTerms: [
      { term: 'Hypothesis', meaning: 'A specific, testable guess about how a system behaves, e.g. "this port is filtered, not closed".' },
      { term: 'Negative control', meaning: 'A test you expect to fail/return nothing, proving your method is not producing false results.' },
      { term: 'Coverage ledger', meaning: 'A running list of what you have and have not tested, so nothing important is silently skipped.' },
      { term: 'Reproducible', meaning: 'Written so someone else can repeat the exact steps and get the same result.' },
    ],
    before: plain('a scientist, not a button-masher',
      'Running every tool and scrolling through pages of output feels productive but proves little — it is hard to repeat and easy to over-read. The skilled approach is like science: form one clear hypothesis, then run the smallest test that can tell competing explanations apart.',
      'Add a negative control (something that should come back empty, confirming your test works) and keep a ledger of what you have covered. That turns enumeration from guesswork into evidence anyone can reproduce.'),
  },
  'kali-access-1': {
    keyTerms: [
      { term: 'Session', meaning: 'An active access channel you have obtained to a system — a shell, a connection, a prompt.' },
      { term: 'Context', meaning: 'The full picture of that access: which account, which machine, which privileges, which shell.' },
      { term: 'Interpreter', meaning: 'What is actually reading your commands (bash, a limited shell, a Python prompt) — it changes what works.' },
      { term: 'Baseline', meaning: 'The first facts you record about a new session before doing anything else.' },
    ],
    before: plain('a prompt does not tell you where you are standing',
      'Getting a prompt feels like success, but a blinking cursor tells you almost nothing by itself. Which account are you? On which machine? With what privileges? Inside a full shell or a restricted one?',
      'So the first move after gaining access is not to charge ahead — it is to describe your situation accurately. That baseline (who, where, what powers, what interpreter) decides everything you can sensibly do next.'),
  },
  'kali-access-3': {
    keyTerms: [
      { term: 'Tunnel', meaning: 'Carrying one connection inside another, e.g. reaching an internal service through an SSH session.' },
      { term: 'Local port forward', meaning: 'Making a remote service appear on a port of your own machine, through a tunnel.' },
      { term: 'Reachability', meaning: 'Whether traffic can get to a service. Separate from whether the service will accept your identity.' },
      { term: 'Route', meaning: 'The network path traffic takes. A tunnel changes the path, not who the destination trusts.' },
    ],
    before: plain('a tunnel moves you to the door, not through it',
      'A tunnel lets your traffic reach a service it otherwise could not — like a corridor that leads you to a locked office door. But arriving at the door is not the same as being allowed in: the application still checks your identity and permissions.',
      'Keeping "I can reach it" separate from "it accepts me" prevents a common wrong conclusion. Being able to connect to a database port through a tunnel does not mean you have a valid database login.'),
  },
  'post-network-4': {
    keyTerms: [
      { term: 'Engagement', meaning: 'A complete, authorised security test from start to finish, ending in a report the client can act on.' },
      { term: 'Retest', meaning: 'Re-checking a finding after it was supposedly fixed, to confirm the fix actually works.' },
      { term: 'Cleanup', meaning: 'Removing every change the test made — test accounts, files, sessions — so nothing is left behind.' },
      { term: 'Handback', meaning: 'Formally returning systems to the owner with temporary access removed and state restored.' },
    ],
    before: plain('finishing is more than getting in',
      'A real engagement does not end at "we got root". It ends when the client can act on clear evidence and everything temporary has been cleaned up and handed back. Getting access, proving privilege, retesting fixes and cleaning up each answer a different question.',
      'This capstone asks you to run the whole chain in order and, importantly, to keep stating the limits of what your evidence shows — the mark of a professional rather than someone who just captured a flag.'),
  },
};
