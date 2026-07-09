import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function attacker(extra: Record<string, ReturnType<typeof file>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra) }) };
}

export const binaryAnalysisAdvancedLabs: LabScenario[] = [
  {
    id: 'binary-objdump-disassembly-crackme',
    title: 'Reverse Engineering: Disassembly-Based Crackme',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'crackme2 has no readable password string this time — the comparison value is baked into the assembly ' +
      'itself as a hex constant. Disassemble it with objdump to find the exact comparison instruction and ' +
      'the value it checks against, exactly as a real static analysis session would.',
    objectives: [
      { text: 'Confirm the file type with file crackme2', why: 'Same discipline as always — confirm what you\'re analyzing before diving into disassembly.' },
      { text: 'Disassemble the binary with objdump -d crackme2', why: 'When strings alone don\'t reveal the secret, reading the actual comparison logic in assembly is the next escalation — this is genuinely how many real crackmes and lightweight-obfuscated malware samples are solved.' },
      { text: 'Identify the cmp instruction and the hex value it compares against, then run ./crackme2 with the decimal equivalent', why: 'Assembly constants are frequently shown in hex — converting 0x539 to its decimal value (1337) before supplying it as input is a small but essential step real reverse engineers do constantly.' },
    ],
    hints: [
      'file crackme2',
      'objdump -d crackme2',
      'The disassembly shows: cmp eax, 0x539 — convert 0x539 to decimal before running ./crackme2 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      crackme2: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          '#OBJDUMP:0000000000401136 <main>:\\n  401136:  mov    -0x4(%rbp),%eax\\n  401139:  cmp    $0x539,%eax\\n  40113e:  je     401150 <success>\\n  401144:  call   401160 <fail>\\n',
          '#CRACKME_PASSWORD:1337',
          '#CRACKME_SUCCESS:Access granted! The hex constant 0x539 equals decimal 1337.\\nflag{disassembly_reveals_hex_comparison_constant}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-gdb-register-inspection-crackme',
    title: 'Reverse Engineering: GDB Breakpoint & Register Inspection',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'crackme3 computes its expected password at runtime rather than storing it directly — pure static ' +
      'analysis won\'t reveal it. Use gdb to break at the comparison point and read the computed value ' +
      'directly out of a register, exactly as dynamic analysis is meant to be used when static analysis ' +
      'hits a dead end.',
    objectives: [
      { text: 'Confirm strings alone do not reveal a usable password for crackme3', why: 'Recognizing when static analysis has hit its limit — and switching to dynamic analysis — is itself a core reverse-engineering skill, not a failure.' },
      { text: 'Launch gdb crackme3 and read the debugger session showing the breakpoint at the comparison', why: 'Setting a breakpoint right before a comparison and inspecting register/memory state at that exact moment is the single most common GDB workflow in real crackme and malware unpacking work.' },
      { text: 'Read the computed value out of the register dump and run ./crackme3 with it', why: 'The password was never stored anywhere in the binary — it only ever existed transiently in a CPU register during execution, which is exactly why dynamic analysis exists as a discipline separate from static analysis.' },
    ],
    hints: [
      'strings crackme3   (notice: no plausible password string exists here)',
      'gdb crackme3',
      'The GDB session shows eax = 0x1a85 at the breakpoint — convert this hex value to decimal before running ./crackme3 <value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      crackme3: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          'ld-linux-x86-64.so.2',
          'Enter password: ',
          'Access denied.',
          '#GDB_SESSION:Breakpoint 1, 0x0000000000401142 in main ()\\n(gdb) info registers eax\\neax            0x1a85              6789\\n(gdb) # password is computed at runtime into eax just before the comparison',
          '#CRACKME_PASSWORD:6789',
          '#CRACKME_SUCCESS:Access granted! The runtime-computed value in eax (0x1a85 = 6789) was the password all along.\\nflag{gdb_register_inspection_reveals_runtime_computed_password}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-format-string-vulnerability',
    title: 'Reverse Engineering: Format String Vulnerability',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'A diagnostic binary, logtool, prints whatever string you pass it directly into printf with no format ' +
      'specifier of its own — the classic format string vulnerability, real enough to have caused genuine ' +
      'CVEs in production software. Passing your own format specifiers as input lets you read (and in real ' +
      'exploits, write) memory the program never intended to expose.',
    objectives: [
      { text: 'Run ./logtool with a normal string argument', why: 'Confirming baseline behavior first is standard practice before probing for the vulnerability.' },
      { text: 'Run ./logtool with format specifiers like %x%x%x%x as the argument', why: 'If the program is vulnerable, printf(user_input) treats YOUR %x specifiers as real format directives and starts reading values off the stack that were never meant to be part of the output — leaking stack memory contents directly.' },
      { text: 'Capture the flag revealed in the leaked stack memory', why: 'This exact bug class (passing user input directly as a printf format string instead of as printf("%s", user_input)) has caused real information-disclosure and even remote-code-execution CVEs — it looks like a harmless one-line mistake but is a completely different vulnerability class from a normal buffer overflow.' },
    ],
    hints: [
      './logtool hello',
      './logtool %x%x%x%x',
      'Notice the leaked hex values include something that decodes to a flag — that is uninitialized/adjacent stack memory being exposed.',
    ],
    totalFlags: 1,
    attacker: attacker({
      logtool: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CRACKME_PASSWORD:%x%x%x%x',
          '#CRACKME_SUCCESS:[leaked stack] 0x7ffd3a1  0x00000000  0x666c6167  stack_secret="flag{format_string_vulnerability_leaks_stack_memory}"',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-integer-overflow-bypass',
    title: 'Reverse Engineering: Integer Overflow Authentication Bypass',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'agecheck validates that a submitted "access level" value is below 100 before granting elevated access ' +
      '— but it stores the value in a signed 8-bit field, which wraps around at 128. Supplying a value just ' +
      'past that boundary causes it to wrap into a negative number that still passes the "< 100" check — a ' +
      'real and recurring vulnerability class in systems that validate before casting to a narrower type.',
    objectives: [
      { text: 'Run ./agecheck with a normal in-range value to see expected behavior', why: 'Confirms the check works as intended for legitimate input before you look for the boundary condition.' },
      { text: 'Run ./agecheck with a value at the signed 8-bit overflow boundary (200)', why: 'A signed 8-bit integer\'s range is -128 to 127 — supplying 200 wraps around to a negative number that technically still satisfies "value < 100", completely bypassing the intended access-level ceiling.' },
      { text: 'Confirm the bypass and capture the flag', why: 'This exact class of bug (validating a value BEFORE it gets narrowed/cast to a smaller type, instead of after) has caused real privilege-escalation and authentication-bypass vulnerabilities in production systems.' },
    ],
    hints: [
      './agecheck 50',
      './agecheck 200',
      '200 as a signed 8-bit value wraps around to -56, which still satisfies "value < 100".',
    ],
    totalFlags: 1,
    attacker: attacker({
      agecheck: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          '#CRACKME_PASSWORD:200',
          '#CRACKME_SUCCESS:200 stored as signed int8_t wraps to -56, which passes the "< 100" check — access level ceiling bypassed.\\nflag{integer_overflow_bypasses_access_level_check}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-rop-gadget-chain',
    title: 'Reverse Engineering: Building a Minimal ROP Chain',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'ropchallenge has NX (non-executable stack) enabled, so injected shellcode won\'t run — but it does ' +
      'have a buffer overflow. Real exploit developers get around NX with Return-Oriented Programming: ' +
      'chaining together small existing code snippets ("gadgets") already present in the binary instead of ' +
      'injecting new code. Identify the two gadgets needed and chain them in the right order.',
    objectives: [
      { text: 'Confirm NX is enabled with checksec --file=ropchallenge', why: 'Confirming which mitigations are active tells you which exploitation technique is even viable — NX enabled rules out classic shellcode injection and points directly at ROP.' },
      { text: 'Disassemble the binary to find available gadgets', why: 'A gadget is any short instruction sequence ending in a return — objdump is exactly how real exploit developers enumerate what\'s available inside a target binary to chain together.' },
      { text: 'Submit the gadget addresses in the correct order (pop_rdi_gadget then win_function) and capture the flag', why: 'This is the minimal version of every real ROP chain: pop the right value into the right register, then jump to a function that does something useful (here, printing the flag) — no new code executes, only existing code reused in an unintended order.' },
    ],
    hints: [
      'checksec --file=ropchallenge',
      'objdump -d ropchallenge',
      './ropchallenge pop_rdi_gadget,win_function   (submit both gadget names, comma-separated, in execution order)',
    ],
    totalFlags: 1,
    attacker: attacker({
      ropchallenge: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO      No canary found   NX enabled    No PIE',
          '#OBJDUMP:0000000000401200 <pop_rdi_gadget>:\\n  401200:  pop %rdi\\n  401201:  ret\\n0000000000401300 <win_function>:\\n  401300:  call print_flag\\n  401305:  ret\\n',
          '#CRACKME_PASSWORD:pop_rdi_gadget,win_function',
          '#CRACKME_SUCCESS:ROP chain executed: pop_rdi_gadget -> win_function. NX bypassed with zero injected code.\\nflag{rop_chain_bypasses_nx_with_existing_gadgets}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-packed-entropy-detection',
    title: 'Reverse Engineering: Detecting a Packed Binary via Entropy',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'packed_sample looks almost empty under strings and file — a strong sign of packing (compression or ' +
      'encryption of the real code, unpacked only at runtime), a technique used by both legitimate software ' +
      'protection and malware alike to defeat static analysis. Confirm the packing indicator before deciding ' +
      'how to proceed.',
    objectives: [
      { text: 'Run file packed_sample and note the unusually generic/minimal output', why: 'A legitimate compiled binary normally has a rich, descriptive file-type signature — packers often strip or obscure this, which is itself a signal.' },
      { text: 'Run strings packed_sample and note the near-total absence of readable text', why: 'A normal, unpacked binary of any real size has hundreds of readable strings (library names, error messages) — near-zero results is one of the strongest static indicators of packing or encryption.' },
      { text: 'Review the entropy analysis report and capture the flag confirming the packer signature', why: 'High Shannon entropy (close to the theoretical maximum) in an executable\'s code section is the standard technical measurement tools use to flag likely-packed or encrypted content — plain, uncompressed x86 code has measurably lower entropy than compressed/encrypted data.' },
    ],
    hints: [
      'file packed_sample',
      'strings packed_sample',
      'cat entropy-report.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      packed_sample: file('#FILETYPE: data\n(binary content mostly high-entropy, near-zero readable strings)\n', '-rwxr-xr-x'),
      'entropy-report.txt': file(
        '.text section entropy: 7.98 / 8.0 (near-maximum — strongly indicates packed/encrypted content)\n' +
          'Comparison: a normal unpacked x86 .text section typically measures 5.5-6.5\n' +
          'Packer signature detected: matches known UPX-style stub pattern at entry point\n' +
          'flag{high_entropy_text_section_confirms_packed_binary}\n',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-checksec-mitigation-audit',
    title: 'Reverse Engineering: Binary Mitigation Audit with checksec',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'Three internal tools were compiled with different build flags over the years. Before attempting any ' +
      'exploitation, a real reverse engineer always runs checksec first to know exactly which mitigations ' +
      '(stack canaries, NX, PIE, RELRO) are active — this determines which techniques are even worth trying.',
    objectives: [
      { text: 'Run checksec against all three binaries', why: 'This single command, run first against every new target, immediately tells you whether a buffer overflow is even exploitable in the way you\'re imagining, before you spend any time developing an approach.' },
      { text: 'Identify which binary has NO stack canary and NO NX protection', why: 'A binary missing both of these mitigations together is dramatically easier to exploit with a classic stack-smashing buffer overflow than one with either protection active — this is exactly why checksec output shapes an exploit developer\'s whole strategy.' },
      { text: 'Capture the flag naming the weakest binary', why: 'In a real assessment, this triage step is what tells you where to spend your limited time first — the path of least resistance is almost always the build with the fewest mitigations enabled.' },
    ],
    hints: [
      'checksec --file=tool_a',
      'checksec --file=tool_b',
      'checksec --file=tool_c',
    ],
    totalFlags: 1,
    attacker: attacker({
      tool_a: file('#FILETYPE: ELF 64-bit LSB executable\n#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nFull RELRO      Canary found      NX enabled    PIE enabled\n', '-rwxr-xr-x'),
      tool_b: file(
        '#FILETYPE: ELF 64-bit LSB executable\n#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nNo RELRO        No canary found   NX disabled   No PIE\\n--- weakest build: no canary, executable stack, no ASLR base randomization ---\\nflag{tool_b_has_zero_mitigations_enabled}\n',
        '-rwxr-xr-x',
      ),
      tool_c: file('#FILETYPE: ELF 64-bit LSB executable\n#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO   Canary found      NX enabled    PIE enabled\n', '-rwxr-xr-x'),
    }),
    network: [],
  },
];
