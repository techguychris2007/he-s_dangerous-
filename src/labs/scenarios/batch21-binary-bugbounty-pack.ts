import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 21, part 3: Binary Analysis (off-by-one stack overflow, signed/unsigned integer comparison bypass,
 *  uninitialized stack variable leak) and Bug Bounty (a public Postman collection leak, broken link hijacking
 *  via a dangling social-media handle, an exposed Firebase Realtime Database with public rules). Tied for
 *  this platform's next-thinnest categories (19 and 22 labs respectively) after Cryptography/API/Security+/
 *  Security Engineering -- see labs-index.md. Every technique researched via WebSearch before writing -- see
 *  NOTES.md batch 21 for citations. The off-by-one lab's hex/decimal address conversion (0x401932 ->
 *  4200754) was verified independently with Node before being hardcoded, per this file's standing rule since
 *  the batch-4/batch-9 hand-computed-hex mistakes. */
export const batch21BinaryBugbountyLabs: LabScenario[] = [
  // 1 — Binary Analysis: Off-By-One Stack Overflow Overwrites the Saved Return Address's Low Byte
  {
    id: 'binary-off-by-one-stack-overflow-return-address',
    title: 'Reverse Engineering: An Off-By-One Loop Bound Overwrites the Saved Return Address\'s Low Byte',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'notewriter5\'s input loop copies a user-supplied note into a fixed 64-byte stack buffer using ' +
      '`for (i = 0; i <= len; i++)` -- a `<=` where a `<` belongs, CWE-193, off-by-one error -- writing ' +
      'exactly ONE byte past the buffer\'s end on every call, no more, no less. That single stray byte lands ' +
      'precisely on the LOW byte of the saved return address sitting just past the buffer on the stack. ' +
      'Because x86-64 is little-endian, the low byte is the easiest one to control and the cheapest one to ' +
      'predict: overwriting only it can\'t redirect execution anywhere in the whole address space (a full ' +
      'return-address overwrite could), but it CAN redirect to any function whose address shares the same ' +
      'high bytes as the real return address and differs only in that final byte -- exactly the case for a ' +
      'hidden `win_bypass()` function linked into the same binary, at an address one byte-value away.',
    objectives: [
      { text: 'file notewriter5', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=notewriter5', why: 'Confirms the mitigation baseline -- no stack canary present, meaning a return-address overwrite (even a partial, one-byte one) is not detected before the function returns.' },
      { text: 'objdump -d notewriter5', why: 'Shows the off-by-one `<=` loop bound and confirms the fixed 64-byte buffer sits immediately before the saved return address on the stack, with no canary in between.' },
      { text: 'gdb notewriter5', why: 'Confirms the exact address of the hidden win_bypass() function and that it differs from the real return address by only its low byte -- exactly what a single stray byte from the off-by-one write can reach.' },
      { text: 'Supply the computed decimal address to ./notewriter5', why: 'Supplying win_bypass()\'s correct decimal address completes the exploit -- the off-by-one write\'s single extra byte redirects the low byte of the return address to land exactly here.' },
    ],
    hints: [
      'file notewriter5',
      'checksec --file=notewriter5',
      'objdump -d notewriter5',
      'gdb notewriter5',
      './notewriter5 4200754',
    ],
    totalFlags: 1,
    attacker: attacker({
      notewriter5: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO    No canary found    NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401200 <read_note>:\\n  401210: for (i = 0; i <= len; i++)   # off-by-one: should be i < len, CWE-193\\n  401218:   buf[i] = input[i];           # buf is a fixed 64-byte stack array\\n  # buf[64] (the ONE extra byte written) lands exactly on the saved return address\'s low byte\\n0000000000401932 <win_bypass>:\\n  401932: ...    # hidden function, never called by any normal code path',
          '#GDB_SESSION:(gdb) print &buf\\n$1 = (char *) 0x7fffffffe3a0\\n(gdb) print $rbp+8   # saved return address location\\n$2 = (void *) 0x7fffffffe3e0\\n(gdb) # buf[64] writes exactly one byte past buf -- that byte lands on the LOW byte of\\n(gdb) # the saved return address at 0x7fffffffe3e0, since buf is exactly 64 bytes before it\\n(gdb) print win_bypass\\n$3 = {<text variable, no debug info>} 0x401932 <win_bypass>\\n(gdb) # win_bypass differs from the real return address only in its low byte -- exactly what\\n(gdb) # the off-by-one write\'s single stray byte can redirect to, decimal 4200754',
          '#CRACKME_PASSWORD:4200754',
          '#CRACKME_SUCCESS:Off-by-one confirmed -- the loop\'s `<=` wrote one byte past the 64-byte buffer, landing on the saved return address\'s low byte and redirecting execution into win_bypass().\\nflag{off_by_one_stack_overflow_return_address_low_byte_overwrite}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 2 — Binary Analysis: A Signed/Unsigned Integer Comparison Bug Bypasses a Length Bounds Check
  {
    id: 'binary-signed-unsigned-integer-comparison-bypass',
    title: 'Reverse Engineering: A Signed/Unsigned Integer Comparison Bug Bypasses a Length Bounds Check',
    difficulty: 'Medium',
    category: 'Binary Analysis',
    briefing:
      'uploadvalidator2 checks a user-supplied length against a maximum before calling `memcpy` -- ' +
      '`if (len < MAX_LEN) memcpy(dst, src, len);` -- but `len` is declared as a SIGNED `int`, while the ' +
      'value it eventually reaches (as `memcpy`\'s third, `size_t` argument) is UNSIGNED. This is CWE-195, ' +
      'a Signed-to-Unsigned Conversion Error, mechanically distinct from this session\'s existing generic ' +
      'Integer Overflow Authentication Bypass lab: that one is arithmetic wraparound (a value grows too ' +
      'large and wraps back to a small one), this one is a TYPE bug that needs no arithmetic overflow at ' +
      'all. A negative `len`, like -1, passes the signed comparison `len < MAX_LEN` immediately -- any ' +
      'negative number is less than any positive MAX_LEN -- but the moment that same -1 is implicitly ' +
      'converted to the unsigned `size_t` `memcpy` actually expects, it becomes the largest possible unsigned ' +
      'value (4,294,967,295 for a 32-bit conversion), turning a bounds check that looked completely correct ' +
      'into no bounds check at all.',
    objectives: [
      { text: 'file uploadvalidator2', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=uploadvalidator2', why: 'Confirms the mitigation baseline before analysis.' },
      { text: 'objdump -d uploadvalidator2', why: 'Shows `len` declared as a signed int compared with `<` against MAX_LEN, then passed unmodified into a call whose parameter type is unsigned size_t -- the exact CWE-195 signed/unsigned conversion mismatch.' },
      { text: 'gdb uploadvalidator2', why: 'Confirms that supplying a negative length passes the signed bounds check cleanly, then becomes a huge unsigned value once memcpy actually reads it, defeating the check entirely.' },
      { text: 'Supply the bypass value to ./uploadvalidator2', why: 'A negative length passes the signed comparison but converts to an enormous unsigned value at the memcpy call -- the bounds check exists in the source and still does nothing at all.' },
    ],
    hints: [
      'file uploadvalidator2',
      'checksec --file=uploadvalidator2',
      'objdump -d uploadvalidator2',
      'gdb uploadvalidator2',
      './uploadvalidator2 -1',
    ],
    totalFlags: 1,
    attacker: attacker({
      uploadvalidator2: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO       Canary found      NX enabled    PIE enabled',
          '#OBJDUMP:0000000000401400 <validate_upload>:\\n  401410: int len = get_length(input);      # SIGNED int\\n  401418: if (len < MAX_LEN) {              # signed comparison -- any negative len passes trivially\\n  401420:   memcpy(dst, src, len);           # memcpy\'s 3rd param is size_t (UNSIGNED) -- CWE-195\\n  401428: }                                  # implicit signed->unsigned conversion happens right here',
          '#GDB_SESSION:(gdb) call (int)validate_upload(-1)\\n(gdb) # len = -1 (signed) < MAX_LEN (4096) -- TRUE, check passes trivially\\n(gdb) print (unsigned int)-1\\n$1 = 4294967295\\n(gdb) # the exact same -1, once memcpy reads it as size_t, becomes 4294967295 -- the bounds\\n(gdb) # check the source code clearly performs does nothing at all against this value',
          '#CRACKME_PASSWORD:-1',
          '#CRACKME_SUCCESS:Signed/unsigned comparison bug confirmed (CWE-195) -- a negative length passes the signed bounds check, then converts to a huge unsigned value at the memcpy call, bypassing the check entirely.\\nflag{signed_unsigned_integer_comparison_bypasses_length_bounds_check}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 3 — Binary Analysis: An Uninitialized Stack Variable Leaks a Previous Request's Secret
  {
    id: 'binary-uninitialized-stack-variable-secret-leak',
    title: 'Reverse Engineering: An Uninitialized Stack Variable Leaks a Previous Request\'s Secret',
    difficulty: 'Medium',
    category: 'Binary Analysis',
    briefing:
      'sessiontoken3 declares a local `char token_buf[32]` and, on one specific error-handling code path, ' +
      'returns its content WITHOUT ever writing to it first -- CWE-457, Use of Uninitialized Variable. In C, ' +
      'stack-allocated local variables are never zeroed automatically; an uninitialized buffer simply ' +
      'contains whatever bytes were already sitting at that stack address, left behind by whichever function ' +
      'ran there before. Because this process handles one request after another using the same stack frame ' +
      'layout each time, `token_buf`\'s "uninitialized" contents on this error path are, in practice, ' +
      'leftover data from a COMPLETELY DIFFERENT, PREVIOUS request\'s real session token -- a real, ' +
      'well-documented information-disclosure class, mechanically distinct from every buffer-overflow or ' +
      'heap-corruption bug on this platform since no memory is ever corrupted here at all, only read.',
    objectives: [
      { text: 'file sessiontoken3', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=sessiontoken3', why: 'Confirms the mitigation baseline before analysis -- irrelevant to this bug class, since nothing is overflowed or corrupted, only read.' },
      { text: 'objdump -d sessiontoken3', why: 'Shows the error-handling code path that returns token_buf directly, with no prior write to it on this path at all -- CWE-457 in its plainest form.' },
      { text: 'gdb sessiontoken3', why: 'A live memory dump of token_buf on this error path shows a previous request\'s real session token still sitting there, never cleared or overwritten between requests.' },
      { text: 'Supply the leaked token to ./sessiontoken3', why: 'The uninitialized buffer\'s leftover contents are a real, valid, previously-issued session token from an earlier request -- reusable exactly as if it had been stolen directly.' },
    ],
    hints: [
      'file sessiontoken3',
      'checksec --file=sessiontoken3',
      'objdump -d sessiontoken3',
      'gdb sessiontoken3',
      './sessiontoken3 TempAdmin2019!',
    ],
    totalFlags: 1,
    attacker: attacker({
      sessiontoken3: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO       Canary found      NX enabled    PIE enabled',
          '#OBJDUMP:0000000000401600 <handle_error_path>:\\n  401608: char token_buf[32];              # declared, NEVER written on this specific path\\n  401614: if (malformed_request) {\\n  40161c:   return token_buf;               # returns UNINITIALIZED stack memory -- CWE-457\\n  401624: }',
          '#GDB_SESSION:(gdb) break handle_error_path\\n(gdb) run --malformed\\n(gdb) x/32c $rsp-0x20\\n0x7fffffffe3c0: "TempAdmin2019!"...\\n(gdb) # token_buf was never written on this path -- these are leftover bytes from the PREVIOUS\\n(gdb) # request\'s real, valid session token, still sitting at this exact stack address',
          '#CRACKME_PASSWORD:TempAdmin2019!',
          '#CRACKME_SUCCESS:Uninitialized stack variable confirmed (CWE-457) -- the error path returned token_buf without ever writing to it, leaking a previous request\'s real session token straight off the stack.\\nflag{uninitialized_stack_variable_leaks_previous_request_secret}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 4 — Bug Bounty: A Public Postman Collection Leaks Live API Keys
  {
    id: 'bugbounty-leaked-postman-collection-live-api-keys',
    title: 'Bug Bounty: A Public Postman Collection Leaks Live API Keys',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'A developer at MeridianCorp published a Postman workspace publicly (meant only for sharing with a ' +
      'contractor, "Share" defaulted to "Anyone with the link" and was never locked down) -- a real, ' +
      'extensively-documented 2023-2024 exposure class: researchers scanning roughly 200,000 public Postman ' +
      'workspaces found over 4,000 live credentials leaking for real SaaS/cloud providers, mostly from ' +
      'exactly this pattern -- environment variables saved directly inside a shared collection rather than ' +
      'kept locally. Postman collections routinely embed real API keys as saved "environment" variables so ' +
      'requests work with one click for whoever opens them, which is precisely what makes an accidentally- ' +
      'public collection so dangerous: the keys are right there in plaintext, not hidden behind any request ' +
      'that still needs to be sent.',
    objectives: [
      { text: 'cat leaked-postman-collection-export.txt', why: 'The publicly-shared collection\'s saved environment variables include a live production API key, saved directly for one-click convenience by whoever set the collection up.' },
      { text: 'curl http://10.10.318.2:80/api/v2/customers/export -H "Authorization: Bearer mk_prod_7f3a9c2e8b1d6058"', why: 'The leaked key is a real, live, unexpired production credential -- confirms it still works, not merely that it was found.' },
    ],
    hints: [
      'cat leaked-postman-collection-export.txt',
      'curl http://10.10.318.2:80/api/v2/customers/export -H "Authorization: Bearer mk_prod_7f3a9c2e8b1d6058"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'leaked-postman-collection-export.txt': file(
        'Public Postman workspace "MeridianCorp - Customer API" (sharing set to "Anyone with the link"):\n' +
          '  Environment: Production\n' +
          '  Variables:\n' +
          '    base_url = https://api.meridiancorp.example\n' +
          '    api_key  = mk_prod_7f3a9c2e8b1d6058   (saved directly in the collection for one-click requests)\n' +
          '  -- consistent with real, documented 2023-2024 research finding 30,000+ publicly accessible\n' +
          '     Postman workspaces and thousands of live leaked credentials, the overwhelming majority from\n' +
          '     exactly this pattern: real keys saved as environment variables, then the workspace itself\n' +
          '     accidentally shared publicly rather than kept private --\n',
      ),
    }),
    network: [
      {
        hostname: 'api-meridiancorp',
        ip: '10.10.318.2',
        os: 'Ubuntu 22.04 (Express 4.18, customer export API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/v2/customers/export',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['mk_prod_7f3a9c2e8b1d6058'],
                vulnerableResponse: '{"status":200,"exported":"18420 customer records","note":"flag{leaked_postman_collection_public_workspace_live_api_key}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Bug Bounty: Broken Link Hijacking via a Dangling Social-Media Handle
  {
    id: 'bugbounty-broken-link-hijacking-dangling-social-handle',
    title: 'Bug Bounty: Broken Link Hijacking via a Dangling Social-Media Handle',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'MeridianCorp\'s website footer still links to `@MeridianCorpHQ` on a social platform the company ' +
      'stopped using and deleted its account on two years ago -- a real, documented bug bounty finding class ' +
      '(Broken Link Hijacking) distinct from this session\'s existing subdomain-takeover labs: instead of a ' +
      'dangling DNS record pointing at an unclaimed cloud resource, this is a dangling LINK pointing at an ' +
      'unclaimed, now-available social media HANDLE. Because the account was deleted rather than merely gone ' +
      'quiet, the exact same handle is sitting open for anyone to register -- and once registered, whoever ' +
      'controls it controls whatever a visitor sees after clicking a link the company\'s own official website ' +
      'still vouches for, a real, direct phishing/impersonation vector multiple public HackerOne reports ' +
      'document against exactly this pattern.',
    objectives: [
      { text: 'cat website-footer-links-audit.txt', why: 'The official corporate footer still links to @MeridianCorpHQ, presented as the company\'s real, current social presence.' },
      { text: 'cat handle-availability-check.txt', why: 'The account behind that handle was deleted two years ago (not merely inactive) -- and the exact same handle is confirmed available for anyone to register today, ready to be claimed and used to impersonate the company under a link its own website still vouches for.' },
    ],
    hints: [
      'cat website-footer-links-audit.txt',
      'cat handle-availability-check.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'website-footer-links-audit.txt': file(
        'meridiancorp.example footer, "Follow us" section:\n' +
          '  <a href="https://x.com/MeridianCorpHQ">Twitter/X</a>\n' +
          '  -- presented on the company\'s own official site as their real, current social account, unchanged\n' +
          '     since the footer was last updated three years ago --\n',
      ),
      'handle-availability-check.txt': file(
        'Handle availability check, @MeridianCorpHQ:\n' +
          '  GET https://x.com/MeridianCorpHQ -> "This account doesn\'t exist" (deleted, not merely inactive)\n' +
          '  Account deletion date (per platform records): 2 years ago\n' +
          '  Handle registration status: AVAILABLE -- open for anyone to claim right now\n' +
          '  -- once claimed, the new owner controls exactly what a visitor sees after clicking the link the\n' +
          '     company\'s own official website still presents as its real social account, unchanged --\n' +
          '  flag{broken_link_hijacking_dangling_social_media_handle_available}\n',
      ),
    }),
    network: [],
  },

  // 6 — Bug Bounty: An Exposed Firebase Realtime Database With Public Read/Write Rules
  {
    id: 'bugbounty-firebase-realtime-database-public-read-write-rules',
    title: 'Bug Bounty: An Exposed Firebase Realtime Database With Public Read/Write Rules',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'meridian-app-42891\'s Firebase Realtime Database still has its security rules set to `.read: true, ' +
      '.write: true` -- Google\'s own default-adjacent "test mode" setting, meant only for early development ' +
      'and never tightened before the app shipped to real users. This is a real, extensively-documented, ' +
      'currently-active exposure class: any request to a Firebase Realtime Database URL with `.json` appended ' +
      '-- the database\'s real, documented REST interface, no special tooling needed -- returns the FULL ' +
      'contents directly, with zero authentication required, whenever these default-permissive rules are ' +
      'left in place. Real published incidents involving exactly this misconfiguration have exposed the ' +
      'personal data of well over 100,000 users across multiple popular mobile apps.',
    objectives: [
      { text: 'curl http://10.10.319.2:80/.json', why: 'Appending .json to the database root is Firebase\'s real, documented REST API convention -- with .read/.write left at true, this returns the entire database contents with no authentication at all, exactly the real-world exploitation technique.' },
    ],
    hints: ['curl http://10.10.319.2:80/.json'],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'meridian-app-42891-firebaseio',
        ip: '10.10.319.2',
        os: 'Firebase Realtime Database (security rules: .read=true, .write=true)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Firebase Realtime Database REST interface',
            http: {
              '/.json': '{"users":{"u1001":{"email":"jsmith@example.com","phone":"+1-555-0142"},"u1002":{"email":"agarcia@example.com","phone":"+1-555-0198"}},"admin_config":{"support_pin":"4471"},"note":"flag{firebase_realtime_database_public_read_write_rules_exposed}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
