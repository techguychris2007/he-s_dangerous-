# Modern security content review — 14 October 2026

## Scope and evidence

Reviewed the supplied collection through PDF outlines, contents pages and selected relevant chapter pages, then checked the resulting topics against current primary documentation. This was a topic and curriculum-gap review, not a claim to have read every page of every book. The two Ghost in the Wires files have identical hashes and were treated as one source. The previously implemented Erickson additions remain in place rather than being duplicated.

Books inform topic selection. Newly written lessons are original explanations with current documentation as technical references; book excerpts and PDFs are not distributed with the platform. Historical exploit offsets, unsupported operating systems, private Gmail interfaces and obsolete mobile claims are not taught as current procedures.

## Additions

Added 26 lessons: five database, four mobile, three IoT, three web, four Python automation, two Linux operations, two Metasploit, two identity/email security and one native-code review lesson. They contain 208 teaching paragraphs and 28 code/configuration examples, with prerequisites and quizzes. Database Security begins with an executable SQL fixture covering schema, keys, filtering, NULL, joins, aggregation and rollback. Other lessons extend existing modules. Current security curriculum: 46 modules and 248 lessons. There are still 669 existing terminal labs; this pass adds content, not new target environments. Practice links use related existing labs or code tasks; three automation lessons use their embedded coding assignments rather than incorrectly linking an unrelated terminal lab.

### Source decisions

| Supplied source | Relevant foundation | Modern treatment implemented |
| --- | --- | --- |
| The Database Hacker's Handbook (528 pages) | Database identities, privileges, unsafe queries and stored data | PostgreSQL/MySQL role semantics, certificate verification, driver-bound queries, tenant policies, pooled context and backup verification. Legacy database-specific exploits are not reused. |
| Mobile Application Penetration Testing (312 pages) | Mobile components, storage, transport and runtime inspection | Android Keystore/Apple Keychain, exported components, App Links, WebView boundaries, network security configuration, signing and bounded runtime inspection. Old jailbreak recipes and outdated certification labels are not represented as modern requirements. |
| Mastering Kali Linux for Advanced Penetration Testing (356 pages) | Workstation preparation and service inspection | Package provenance and supported repository configuration, process/service separation and current systemd/journal inspection. Earlier Kali setup lessons remain in pre-security. |
| Metasploit: The Penetration Tester's Guide (439 pages) | Workspaces, module configuration and session context | Current workspace/import commands, option inspection and session context. Old msfpayload/msfencode-era workflows are not presented as current tooling. |
| Hacking Gmail (310 pages) | Mail automation and message processing | Documented Gmail OAuth scopes, metadata-only local fixtures, token lifecycle and synchronization state. Password scripts and reverse-engineered private browser endpoints are excluded. |
| Automate the Boring Stuff with Python (505 pages) | Parsing, files, automation and subprocesses | Complete CSV validation, argument-vector subprocess execution, timeout/error handling, cursor pagination and duplicate handling, with synthetic inputs and explained output. |
| CEH All-in-One, Fourth Edition (935 pages) | Identity, network and email security foundations | Independent identity verification, passkeys/recovery, SPF/DKIM/DMARC and trusted Authentication-Results boundaries. This book is not used as a current certification exam specification. |
| Kali Linux Revealed (341 pages) | Package management and Linux administration | Current Kali repository trust and service inspection. Historic single-root-user assumptions are not recommended. |
| Hacking: The Art of Exploitation, Second Edition (622 pages) | C, memory, debugging and network behavior | Existing modern binary/network additions retained; new native-code chapter complements them without copying historic shellcode or offsets. |
| The Web Application Hacker's Handbook, Second Edition (914 pages) | Access control, input interpretation and server-side request behavior | Object/property/workflow authorization, SSRF URL parsing and network policy limits, upload storage/download authorization. Obsolete PHP settings are not taught as current defaults. |
| Ghost in the Wires (211 pages; duplicate files) | Social trust and impersonation failures | Independent verified approval and account recovery controls. A memoir is not treated as a technical specification or evidence that an attack always succeeds. |
| The IoT Hacker's Handbook (330 pages) | Firmware, device interfaces and connected services | Signature versus hash, rollback/recovery, MQTT topic permissions/QoS/retention, device identity, ownership transfer and debug lifecycle. Device-specific legacy bypasses are not generalized. |
| The Shellcoder's Handbook (745 pages) | Parser boundaries, source auditing and memory faults | A complete bounds-checked C decoder, endian arithmetic, current compiler diagnostics/static analysis and test cases. Historical platform addresses and old fuzzing recipes are not reused. |
| Penetration Testing: A Hands-On Introduction to Hacking (531 pages) | Test environment, services and controlled validation | Modern package provenance, bounded tool inspection and supported workstation practices. Windows XP and dated application stacks are not the prescribed learning environment. |

## Removed repeated material

The security reader no longer injects the generic senior-educator panels, reasoning comparisons, repeated portfolio instructions or module-wide padding of lesson objectives/summaries. The advanced offensive reader no longer displays its generic methodology/report contract. The ML loader no longer appends the same roadmap, professional-workflow and ticket case-study paragraphs to every lesson. Authored lesson sections, actual code enrichment, task links and progress identifiers remain.

The AI output-handling lesson was rewritten with a harmless DOM example, complete Python schema/ownership checks and a complete SQLite query. AI lessons now distinguish the OWASP 2025 categories from historical numbering. The mobile architecture lesson's incorrect claim that Android apps can simply be unsigned was corrected. A prior comment-only JWT checklist was replaced by a complete current PyJWT fixture demonstrating verified claims, expiry rejection and audience rejection.

## Validation and limits

- Platform integrity, account progress, visual-lab state and coding-result checks pass.
- Route audit validates all 248 security lessons and their existing practice links.
- All 26 new lessons render on the server with their authored sections and code blocks.
- Fourteen self-contained Python fixtures, including the combined SQL primer, are executed locally; no mailbox credentials or live external target are used.
- Android Kotlin, PostgreSQL role-policy commands, Kali services, Metasploit, the separately installed PyJWT library and hardware-dependent instructions require their documented environments. They are documentation-reviewed examples, not claims of locally executed device/server tests.
- The old deployment URL could not be accessed in this session. A visual comparison against it has not been completed. Full platform redesign remains a separate phase after content, as requested.

## Remaining curriculum work

This pass addresses the supplied collection's major gaps and removes automatic filler. It does not certify that every pre-existing lesson is complete. Older lesson bodies still need an individual subject review and expansion where explanations, runnable fixtures or output interpretation are missing. Content changes should preserve existing lesson IDs and learner progress; later design work should use a shared reader and consistent navigation rather than adding decorative substitute content.
