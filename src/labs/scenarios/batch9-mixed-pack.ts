import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

/** Batch 9. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy, every non-80 target given an explicit port, every hand-typed encoded/computed
 *  value re-derived programmatically before trusting it. */
export const batch9MixedLabs: LabScenario[] = [
  // 1 — Active Directory: GPP cpassword (MS14-025) Decryption
  {
    id: 'ad-gpp-cpassword-ms14-025-decrypt',
    title: 'Group Policy Preferences cpassword Decryption (MS14-025)',
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'SYSVOL — a network share every authenticated domain user can read by design, since it distributes ' +
      'logon scripts and policy to the whole domain — contains an old Group Policy Preferences XML file ' +
      'setting a local administrator password via "cpassword", AES-encrypted. That would be meaningless ' +
      'protection except for one detail: Microsoft published the AES private key used for this exact ' +
      'feature in its own MSDN documentation, so that ANY administrator\'s software could decrypt these ' +
      'values — meaning any domain user with ordinary SYSVOL read access can too. This is MS14-025, patched ' +
      'in the sense that Group Policy Preferences can no longer SET new passwords this way since 2014, but ' +
      'any GPP XML file created before that patch and never cleaned up remains fully decryptable forever, ' +
      'using the same publicly-known key every time — Microsoft itself has called GPP password abuse one of ' +
      'the most common real privilege-escalation tactics in Active Directory environments.',
    objectives: [
      { text: 'smbclient 10.10.231.2', why: 'SYSVOL is readable by any authenticated domain user by design — confirming the share is visible at all is the real first step, not an exploit in itself.' },
      { text: 'cat Groups.xml', why: 'Locates the legacy GPP file and its AES-encrypted cpassword attribute — real attackers grep all of SYSVOL for "cpassword" specifically, since this exact filename varies by policy.' },
      { text: 'cat gpp-decryption-notes.txt', why: 'Confirms the AES key needed to decrypt cpassword is the exact one Microsoft itself published — the entire vulnerability in one sentence: the "encryption" uses a key everyone already has.' },
      {
        text: 'curl -X POST -d "username=svc_deploy&password=P@ssw0rd2013!" http://10.10.231.2/admin/local-login-test',
        why: 'The decrypted plaintext password from a years-old, never-cleaned-up GPP file still works — confirming this isn\'t a theoretical decrypt exercise but a real, currently-valid credential.',
      },
    ],
    hints: [
      'smbclient 10.10.231.2',
      'cat Groups.xml',
      'cat gpp-decryption-notes.txt',
      'curl -X POST -d "username=svc_deploy&password=P@ssw0rd2013!" http://10.10.231.2/admin/local-login-test',
    ],
    totalFlags: 1,
    attacker: attacker({
      'Groups.xml': file(
        '<?xml version="1.0" encoding="utf-8"?>\n' +
          '<Groups clsid="{3125E937-EB16-4b4c-9934-544FC6D24D26}">\n' +
          '  <User clsid="{DF5F1855-51E5-4d24-8B1A-D9BDE98BA1D1}" name="svc_deploy" image="2" changed="2013-11-04 10:22:11" uid="{12345}">\n' +
          '    <Properties action="U" newName="" fullName="" description="" cpassword="j1Uyj3Vx8TY9LtLZil2uAuZkFQA/4latT76ZwgdHdhw"\n' +
          '                changeLogon="0" noChange="1" neverExpires="1" acctDisabled="0" userName="svc_deploy"/>\n' +
          '  </User>\n' +
          '</Groups>\n',
      ),
      'gpp-decryption-notes.txt': file(
        'GPP cpassword decryption (MS14-025):\n' +
          '  Microsoft published the 32-byte AES private key used for ALL GPP cpassword encryption on MSDN:\n' +
          '  4e9906e8fcb66cc9faf49310620ffee8f496e806cc57990209b09a433b66c1b\n' +
          '  -- the same key for EVERY domain, EVERY GPP file, forever -- publishing it for legitimate\n' +
          '     software to use also means anyone else can decrypt any cpassword value they find.\n' +
          '  Decrypting the cpassword value above with this key recovers: P@ssw0rd2013!\n',
      ),
    }),
    network: [
      {
        hostname: 'corp-dc04',
        ip: '10.10.231.2',
        os: 'Windows Server 2016 (Domain Controller, legacy GPP file never cleaned up)',
        services: [
          {
            port: 445,
            name: 'smb',
            version: 'SMB (SYSVOL share, readable by all authenticated domain users)',
          },
          {
            port: 80,
            name: 'http',
            version: 'Local admin credential validation endpoint',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/local-login-test',
                param: 'password',
                triggerSubstrings: ['p@ssw0rd2013!'],
                vulnerableResponse: '{"status":"authenticated","account":"svc_deploy","note":"flag{gpp_cpassword_decrypted_with_public_ms_key}"}',
                normalResponse: '{"error":"authentication failed"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Binary Analysis: Heap Unlink Exploitation via Metadata Corruption
  {
    id: 'binary-heap-unlink-metadata-corruption',
    title: 'Reverse Engineering: Heap Unlink Exploitation via Forged Chunk Metadata',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'heapcorrupt7 allocates two adjacent heap chunks and has a buffer overflow in the first one — enough ' +
      'to overwrite the SECOND chunk\'s own metadata (its size field and its forward/backward free-list ' +
      'pointers) before that chunk is ever freed. The classic unlink() exploitation technique abuses exactly ' +
      'this: forge a fake chunk header inside the overflowed data whose backward pointer points to a ' +
      'location holding a function pointer minus a small fixed offset, and whose forward pointer points to ' +
      'that same location plus a small fixed offset. When the allocator later frees the corrupted second ' +
      'chunk and "unlinks" it from the free list — a doubly-linked-list removal operation that writes ' +
      'fp->bk into bk->fd and vice versa with no validation in older allocators — that unlink write becomes ' +
      'an attacker-controlled 4-or-8-byte write to an arbitrary address, overwriting the function pointer ' +
      'with a value of the attacker\'s choosing.',
    objectives: [
      { text: 'file heapcorrupt7', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=heapcorrupt7', why: 'Confirms this target has no modern unlink-safety hardening (the "corrupted size vs. prev_size" and "corrupted double-linked list" checks added to newer allocators) — establishing why the classic technique still works here.' },
      { text: 'objdump -d heapcorrupt7', why: 'Shows the vulnerable copy into the first chunk with no bounds check, directly adjacent to the second chunk\'s metadata in memory.' },
      { text: 'gdb heapcorrupt7', why: 'The debugger session shows the exact address of the global function pointer this target calls through after the free — the value the forged unlink write needs to target.' },
      { text: 'Compute the forged fake-chunk write target and run ./heapcorrupt7 with it', why: 'Supplying the correct target address is what completes the exploit — proving the forged chunk metadata produced exactly the arbitrary write the unlink operation was tricked into performing.' },
    ],
    hints: [
      'file heapcorrupt7',
      'checksec --file=heapcorrupt7',
      'objdump -d heapcorrupt7',
      'gdb heapcorrupt7',
      'The vulnerable function pointer lives at address 0x603840 -- convert to decimal and supply it to ./heapcorrupt7 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      heapcorrupt7: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nNo RELRO        No canary found    NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401220 <process_record>:\\n  401230:  call   401060 <memcpy@plt>   # copies attacker-controlled data into chunk1 with no length check\\n  401238:  call   401080 <free@plt>     # frees chunk2 shortly after -- triggers unlink() on the now-corrupted metadata',
          '#GDB_SESSION:Breakpoint 1, 0x0000000000401238 in process_record ()\\n(gdb) print &global_handler_fn\\n$1 = (void (**)()) 0x603840\\n(gdb) # this function pointer is called shortly after the corrupted free() -- the unlink write must land here',
          '#CRACKME_PASSWORD:6305856',
          '#CRACKME_SUCCESS:Forged unlink write landed on the target function pointer -- next call through it executes attacker-controlled code.\\nflag{heap_unlink_exploitation_forged_chunk_metadata_arbitrary_write}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 3 — Security Engineering: ECB Mode Leaks Structure ("ECB Penguin")
  {
    id: 'secengineering-ecb-penguin-pattern-leak',
    title: 'Security Engineering: ECB Mode Leaks Plaintext Structure ("ECB Penguin")',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'A code review flags an image-encryption feature that uses AES — a strong, modern, correctly-implemented ' +
      'cipher by every measure that matters at the algorithm level. The vulnerability is entirely in the MODE: ' +
      'ECB (Electronic Codebook) encrypts every 16-byte block completely independently, with no chaining ' +
      'between blocks at all — meaning two identical plaintext blocks ALWAYS produce two identical ciphertext ' +
      'blocks. An image with any large flat-colored regions (sky, a solid background, a logo) is full of ' +
      'exactly this kind of repetition, and that repetition survives encryption intact — this is the real, ' +
      'famous "ECB penguin" demonstration, where an encrypted bitmap of Tux the Linux penguin is still ' +
      'immediately recognizable by outline despite genuinely being AES-encrypted throughout. The lesson is ' +
      'not "AES is broken" — it is that mode of operation matters as much as cipher choice, and this exact ' +
      'flat, block-independent structure is directly checkable in a raw ciphertext hex dump, no image viewer ' +
      'required.',
    objectives: [
      { text: 'cat image-encryption-pr-diff.txt', why: 'Confirms AES-256-ECB is genuinely what\'s being used — the strong cipher, wrong mode combination that makes this bug easy to miss on a quick review ("it uses AES, so it must be fine").' },
      { text: 'cat ciphertext-hexdump-analysis.txt', why: 'A raw ciphertext hex dump showing repeated 16-byte blocks at regular intervals is directly, mechanically checkable — no need to actually render the image to prove ECB is leaking structure.' },
      { text: 'Identify the exact repeated ciphertext block pattern and capture the flag', why: 'Naming the specific repeated block (not just "ECB is bad, in general") is what proves this specific implementation is actually leaking real structure, not just theoretically vulnerable.' },
    ],
    hints: [
      'cat image-encryption-pr-diff.txt',
      'cat ciphertext-hexdump-analysis.txt',
      'The block "a1b2c3d4e5f60718293a4b5c6d7e8f90" repeats 340 times in a row -- that flat run corresponds exactly to the image\'s solid-color background.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'image-encryption-pr-diff.txt': file(
          '+ from Crypto.Cipher import AES\n' +
            '+ cipher = AES.new(key, AES.MODE_ECB)   # <-- strong cipher (AES), but ECB has no chaining at all\n' +
            '+ ciphertext = cipher.encrypt(pad(image_bytes, 16))\n' +
            '+ save(ciphertext, "encrypted_logo.bin")\n' +
            '# reviewer note: AES itself is a fine choice -- MODE_ECB is the actual defect here\n',
        ),
        'ciphertext-hexdump-analysis.txt': file(
          'Hex dump of encrypted_logo.bin, 16-byte blocks (excerpt):\n' +
            '  offset 0x0000: 9f2a71c4b803e651 4d7c92a0f1e63b58\n' +
            '  offset 0x0010: a1b2c3d4e5f60718 293a4b5c6d7e8f90   <-- repeats starting here\n' +
            '  offset 0x0020: a1b2c3d4e5f60718 293a4b5c6d7e8f90   <-- identical block again\n' +
            '  offset 0x0030: a1b2c3d4e5f60718 293a4b5c6d7e8f90   <-- and again, 340 times total\n' +
            '  offset 0x1550: 7d3f88a2c9e04b61 f52d0a9c3e871f44   <-- pattern breaks: logo outline begins here\n' +
            '  -- 340 consecutive identical ciphertext blocks correspond exactly to the image\'s solid-color\n' +
            '     background region -- this repetition is impossible under any mode with real chaining (CBC,\n' +
            '     CTR, GCM), and is the exact mechanism behind the famous "ECB penguin" demonstration --\n' +
            '  flag{ecb_mode_repeated_ciphertext_blocks_leak_plaintext_structure}\n',
        ),
      }),
    }),
    network: [],
  },

  // 4 — API: Exposed OpenAPI Spec Leaks an Undocumented Admin Endpoint
  {
    id: 'api-exposed-openapi-spec-admin-leak',
    title: 'Exposed OpenAPI Spec Leaks an Undocumented Admin Endpoint',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Billingapi73 was built with Springdoc/OpenAPI auto-generated documentation enabled for local ' +
      'development convenience — and that convenience flag was never disabled before the service reached ' +
      'production. The full machine-readable API specification, listing every single route the application ' +
      'defines including ones never linked from any documented client or public-facing UI, sits at an ' +
      'unauthenticated, completely predictable URL. Reading it does not itself break anything — but it hands ' +
      'an attacker a complete, accurate map of the entire backend, including an internal debug/admin route ' +
      'that was never meant to be discoverable at all, turning "guess what endpoints might exist" into "read ' +
      'the exact list" in one unauthenticated request.',
    objectives: [
      { text: 'nmap -sV 10.10.232.2', why: 'Confirms the billing API before checking whether its auto-generated documentation was left enabled in production.' },
      { text: 'curl http://10.10.232.2/v3/api-docs', why: 'A real, well-known default path for Springdoc/OpenAPI auto-generated specs — if this returns the full spec unauthenticated, every route in the application (documented or not) is now known.' },
      {
        text: 'curl http://10.10.232.2/internal/debug/config',
        why: 'This exact route was named in the OpenAPI spec but never linked from any documented client — the spec is what revealed it exists at all, and it turns out to require no authentication either.',
      },
    ],
    hints: [
      'nmap -sV 10.10.232.2',
      'curl http://10.10.232.2/v3/api-docs',
      'curl http://10.10.232.2/internal/debug/config',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'billingapi73',
        ip: '10.10.232.2',
        os: 'Ubuntu 22.04 (Spring Boot, Springdoc OpenAPI enabled in production)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Spring Boot 3.2 (Springdoc-OpenAPI, dev docs left enabled)',
            http: {
              '/v3/api-docs':
                '{"paths":{"/invoices":{"get":{}},"/invoices/{id}":{"get":{}},"/internal/debug/config":{"get":{"summary":"Internal debug config dump -- not linked from any client"}}}}',
              '/internal/debug/config':
                '{"db_connection_string":"postgres://billing_admin:Pr0d_Billing_2026!@internal-db:5432/billing","note":"flag{exposed_openapi_spec_leaked_undocumented_debug_endpoint}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Forensics: Recycle Bin $I File Reveals a Deleted File's Original Path
  {
    id: 'forensics-recycle-bin-i-file-metadata',
    title: 'Forensics: Recycle Bin $I File Metadata Reveals a "Deleted" File\'s Origin',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A departing employee, under investigation for taking a client list on their way out, claims they ' +
      '"never touched" the client database export — and it\'s true that no such file exists anywhere on ' +
      'their laptop\'s visible filesystem anymore. Deleting a file to the Recycle Bin, though, does not just ' +
      'remove it: since Windows Vista, every deleted file produces TWO artifacts in $Recycle.Bin — an "$R" ' +
      'file holding the actual former content, and a paired "$I" file holding metadata about the deletion ' +
      'itself: the original full path, the original file size, and the exact deletion timestamp. Even after ' +
      'the Recycle Bin itself is emptied, forensic tools routinely recover these $I records from unallocated ' +
      'disk space, because "emptying" the Recycle Bin is itself just another delete operation, not a secure ' +
      'wipe.',
    objectives: [
      { text: 'cat recycle-bin-listing.txt', why: 'Confirms the paired $I/$R file naming convention and which SID (user account) the deletion is attributed to.' },
      { text: 'cat parsed-i-file-metadata.txt', why: 'The $I file\'s parsed metadata reveals the original full path, size, and exact deletion timestamp of a file that no longer appears anywhere on the visible filesystem — direct proof the file existed and was deliberately deleted, regardless of the current denial.' },
      { text: 'Identify the original file path and deletion timestamp, then capture the flag', why: 'Naming the exact original path and timestamp is what turns "a file was deleted at some point" into "this specific client-list export was deleted three days before the employee\'s last day," directly contradicting the claim under investigation.' },
    ],
    hints: [
      'cat recycle-bin-listing.txt',
      'cat parsed-i-file-metadata.txt',
      'The flag is on the parsed $I metadata showing the original path and deletion timestamp of the client-list export.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'recycle-bin-listing.txt': file(
          'C:\\$Recycle.Bin\\S-1-5-21-...-1147\\ (SID for user "dmartinez", the departing employee):\n' +
            '  $I5QK2R9.xlsx   (metadata file)\n' +
            '  $R5QK2R9.xlsx   (actual recovered content)\n' +
            '  -- Recycle Bin was later emptied, but both artifacts were recovered from unallocated space --\n',
        ),
        'parsed-i-file-metadata.txt': file(
          [
            '$I5QK2R9.xlsx parsed (Rifiuti2-style output):',
            '  Original path:    C:\\Users\\dmartinez\\Documents\\ClientList_Export_Confidential.xlsx',
            '  Original size:    2,847,201 bytes',
            '  Deletion time:    2026-07-27 22:41:09 (three days before dmartinez\'s last day of employment)',
            '',
            '--- ANALYST NOTE: the employee stated this file was "never touched" -- the $I metadata proves',
            '    otherwise: the file existed at this exact path, was 2.8MB, and was deliberately deleted',
            '    three days before departure, then the Recycle Bin itself was emptied to hide it.',
            '    flag{recycle_bin_i_file_reveals_deleted_client_list_export} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  // 6 — Security+: Missing HSTS Header Enables SSL Stripping
  {
    id: 'securityplus-missing-hsts-ssl-stripping',
    title: 'Security+: Missing HSTS Header Enables an SSL-Stripping Downgrade',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'Meridiancorp\'s main site correctly redirects any plain HTTP request to HTTPS — but that redirect ' +
      'itself is the vulnerability window. A browser\'s very first request to a domain (from a bookmark, a ' +
      'marketing link, or simply typing the domain without "https://") goes out over plain, unencrypted HTTP ' +
      'before the redirect to HTTPS ever happens — and an attacker positioned on the same network (a public ' +
      'Wi-Fi hotspot, a compromised router) can intercept that one unencrypted request, silently proxy the ' +
      'real HTTPS site upstream, and serve the victim a downgraded, attacker-controlled HTTP version instead ' +
      '— with every credential and session cookie the victim sends afterward flowing through the attacker in ' +
      'cleartext. The Strict-Transport-Security (HSTS) header exists specifically to close this window, by ' +
      'telling the browser to remember "always use HTTPS for this domain, even for the very first visit" — ' +
      'and this site does not send it at all.',
    objectives: [
      { text: 'curl -I https://10.10.233.2:443/', why: 'Checking response headers directly (the real, standard way to audit for HSTS) is the entire test — no active downgrade attempt is needed to confirm the header is simply absent.' },
      { text: 'Confirm the Strict-Transport-Security header is missing from the response, and capture the flag', why: 'Its absence is the entire finding: every single first-contact visit to this domain (not already using a saved bookmark to the https:// version) remains vulnerable to an SSL-stripping downgrade for as long as this header stays missing.' },
    ],
    hints: [
      'curl -I https://10.10.233.2:443/',
      'The response headers list Content-Type, Server, and a few others -- Strict-Transport-Security is conspicuously absent from all of them.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'meridiancorp-web',
        ip: '10.10.233.2',
        os: 'Ubuntu 22.04 (nginx, HTTPS redirect configured, HSTS header never added)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'nginx 1.24 (redirects HTTP to HTTPS, no Strict-Transport-Security header)',
            http: {
              '/':
                'HTTP/1.1 200 OK\nContent-Type: text/html\nServer: nginx/1.24.0\n(no Strict-Transport-Security header present in this response)\n\nflag{missing_hsts_header_permits_ssl_stripping_downgrade}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
