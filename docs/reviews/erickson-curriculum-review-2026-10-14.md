# Native-code and security curriculum enrichment

Reviewed 14 October 2026 against the supplied *Hacking: The Art of Exploitation*, second edition, Jon Erickson. The supplied PDF has 622 PDF pages. Its text and outline were inspected locally; original DarkWorld explanations and examples are added rather than copied book passages or source programs. The book is not redistributed through platform assets.

## Content added to existing modules

| Module | New lessons | Main gap addressed |
| --- | --- | --- |
| Binary analysis | C objects/pointers/strings/lifetimes; integer and format contracts; ABI/endianness/debugger interpretation; modern mitigations and evidence; sanitizers/fuzzing/reproducers | Missing prerequisite semantics and current build/runtime context |
| Networking | Socket streams, message framing and parser limits | The boundary between packets and actual application receive behavior |
| Security engineering | Race conditions and object-based file access | Check/use gaps, pathname identity and atomic contracts |
| Applied cryptography | Randomness, password storage and AEAD | Current APIs, cost/lifecycle requirements and negative validation cases |

Each of the eight lessons contains prerequisites, objectives, explanatory sections, original code or inspection examples, an applied exercise, a comparison table, misconceptions, two quiz questions and links to existing concept labs. Local exercises are identified separately from simulated browser terminals. Learners write the framed-receiver and harness assignments themselves.

## Book-to-modern comparison

| Book topic | Durable concept | Current treatment |
| --- | --- | --- |
| Programming: variables, pointers, strings and memory | Understand ordinary execution before bugs | Explain array-versus-pointer size, terminators, ownership and lifetime with current type-correct C examples. |
| Signed/unsigned values and formats | Representation and interpretation can change semantics | Validate conversions and arithmetic; distinguish undefined signed overflow from unsigned wrap; use %zu/%p and fixed format strings. |
| Stack and heap examples | Out-of-bounds/lifetime violations | Remove universal layout and allocator assumptions. Explain compiler, architecture and allocator context. |
| GDB and x86 assembly | Connect source operations to observed machine state | Include ABI distinctions, optimization, explicit memory-unit widths and debugger randomization settings. No fixed historical addresses are taught as modern constants. |
| Socket examples and byte order | Protocol parsing needs explicit contracts | Teach short reads, EOF, timeouts, message framing, maximum sizes and address-family awareness. A local socket-pair example is explicitly not represented as a TCP capture. |
| Shellcode and control flow | Execution depends on platform and context | Existing exploit-development concepts remain; additional lessons focus on ABI, mitigations and evidence. Historical 32-bit shellcode is not presented as portable modern payload code. |
| Countermeasures | Build/runtime controls change outcomes | Teach NX, canaries, PIE versus ASLR, RELRO and deployment-dependent control-flow checks. Preserve protections rather than prescribing machine-wide disabling. |
| Log and daemon examples | Process, file and state semantics matter | Extend to object-based file access and check/use races. Covert log suppression and camouflage are not copied into general learner workflows. |
| Pseudorandom values | Predictability threatens secret material | Use Python secrets for security-sensitive bytes and explain entropy, encoding and token purpose/lifecycle. |
| DES-era password verification | Password guesses can be checked against stored verifiers | Use current adaptive salted password-storage guidance and recorded parameters/migration. No DES crypt default is recommended. |
| Hybrid encryption / SSH trust | Peer authentication and key distribution matter | Retain the preceding modern SSH host-identity lessons; do not recreate SSHv1 downgrade examples as current defaults. |
| WEP / RC4 / IV reuse | Reusing key-stream material can reveal relationships | Link nonce-reuse concepts to current authenticated-encryption contracts. WEP remains historical context, not a deployment option. |
| Quantum discussion | Long-lived secrets require migration planning | Point to current NIST post-quantum standards and cryptographic inventory rather than repeating dated adoption predictions. |
| Flooding, legacy network attacks and stealth scans | Protocol behavior and availability have security impact | Existing bounded scanning/traffic lessons cover the fundamentals. No flood generator or obsolete “stealth” guarantee is added. |

## Corrections to existing material

- A 64-byte destination with strcpy has room for at most 63 visible nonzero characters plus the terminator; an input of 64 characters already overflows by its terminator.
- Illustrative stack drawings do not determine saved-frame or return-address offsets across builds.
- Cyclic generation/lookup now uses a consistent explicit subsequence size and separates a worked lookup from an actual debugger observation.
- Heap metadata placement, integrity checks and derived primitives depend on the allocator/version.
- PIE is a build property; ASLR is a separate runtime policy. One leaked address does not establish every independently randomized mapping.
- Return-address corruption is not automatically usable code execution under active protections.

## Primary references

- [GNU C manual](https://www.gnu.org/software/c-intro-and-ref/manual/c-intro-and-ref.html)
- [GDB memory inspection](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Memory.html)
- [GDB execution/randomization](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Starting.html)
- [GCC instrumentation/hardening](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html)
- [Clang AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [LLVM libFuzzer status and harness guidance](https://llvm.org/docs/LibFuzzer.html)
- [Socket receive contract](https://man7.org/linux/man-pages/man2/recv.2.html)
- [Python socket APIs](https://docs.python.org/3/library/socket.html)
- [Linux open contracts](https://man7.org/linux/man-pages/man2/open.2.html)
- [Python secrets](https://docs.python.org/3/library/secrets.html)
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [cryptography AEAD APIs](https://cryptography.io/en/latest/hazmat/primitives/aead/)
- [NIST post-quantum standards](https://csrc.nist.gov/projects/post-quantum-cryptography)

## Verification scope

Platform/route audits pass with 45 modules, 222 lessons and 669 existing terminal labs, with no invalid lesson IDs or lab links. Existing account isolation, visual-lab reset/negative controls and coding-result checks pass. Existing lab engines, grading and learner progress IDs are preserved. Lint passes with previously existing warnings.

All eight new lessons render successfully, with valid practice mappings and distinct heading IDs. Binary analysis now has ten lessons; networking has thirteen. C prerequisites are placed before assembly, with ABI and mitigation depth following their corresponding core lessons.

The four Python example blocks pass with the bundled runtime: the stream experiment reassembles HELLO from multiple reads; exclusive creation rejects an existing name; token generation uses security randomness; AEAD rejects tampering. The restricted sandbox blocked loopback/temp-file operations, so these benign examples were verified under normal local permissions.

Local Linux compiler, GDB and sanitizer commands are documentation-checked, not executed: no Linux C toolchain is available in this Windows workspace. The production TypeScript/Vite/PWA build passes with existing third-party and large-chunk warnings. No test result is represented as execution of a historical exploit or new backend lab engine.
