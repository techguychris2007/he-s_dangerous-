import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function attacker(extra: Record<string, ReturnType<typeof file>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra) }) };
}

/** Binary Analysis module capstone: one continuous five-flag reverse-engineering series across four
 *  progressively harder challenge binaries — static strings, Base64 decoding, a checksec-revealed weak
 *  protection profile exploited via buffer overflow, and a gdb-revealed hidden comparison value — instead
 *  of four isolated single-technique crackmes. Every mechanic (`strings`/`checksec`/`gdb`/`./binary <input>`
 *  marker convention) is already established by `binaryanalysis-pack.ts`. */
export const binaryAnalysisCapstoneLabs: LabScenario[] = [
  {
    id: 'binary-capstone-four-stage-crackme-series',
    title: 'Capstone: A Four-Stage Reverse-Engineering Challenge Series',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'A CTF organizer left behind a four-binary challenge series, each one intentionally harder than the ' +
      'last, exercising a different static or dynamic analysis technique from the module in order: plain ' +
      'strings extraction, Base64 decoding, exploiting a weak protection profile confirmed by checksec, and ' +
      'a hidden comparison value only visible under a debugger. Clear all four in order — each one\'s solution ' +
      'depends on nothing from the ones before it except practice.',
    objectives: [
      { text: 'strings stage1 to recover the plaintext password and capture the first flag', why: 'The highest-value, lowest-effort static analysis technique — many real crackmes and even real malware leave the actual check value in plain text.' },
      { text: 'strings stage2, decode the Base64 value by hand, then ./stage2 <decoded> for the second flag', why: 'Confirms you can recognize and reverse a trivial encoding layer — the same fundamental skill obfuscated malware droppers abuse far more aggressively.' },
      { text: 'checksec --file=stage3 and capture the third flag', why: 'Confirming exactly which protections are (and are not) enabled is the standard first step before attempting any memory-corruption technique — here, the missing stack canary is the finding itself.' },
      { text: './stage3 with an input long enough to overflow its unprotected 64-byte buffer, and capture the fourth flag', why: "This is the direct payoff of the checksec finding: no canary means no runtime check catches the overflow before it happens." },
      { text: 'gdb stage4 to find the hidden comparison value, then ./stage4 <that value> for the final flag', why: "Some checks are never printed anywhere static analysis can find — only visible by actually running the binary under a debugger and inspecting what it compares against at runtime." },
    ],
    hints: [
      'strings stage1',
      './stage1 st4g3_0n3_pl41ntext',
      'strings stage2',
      'ENCODED_CHECK_VALUE is standard Base64 — decode it by hand before supplying it.',
      './stage2 stage_two_base64',
      'checksec --file=stage3',
      'strings stage3',
      './stage3 AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'gdb stage4',
      './stage4 f1n4l_st4g3_runtime_0nly',
    ],
    totalFlags: 5,
    attacker: attacker({
      stage1: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          'Enter password: ',
          'Access denied.',
          'Access granted!',
          '#CRACKME_PASSWORD:st4g3_0n3_pl41ntext',
          '#CRACKME_SUCCESS:Access granted! Stage 1 of 4 complete.\\nflag{capstone_stage1_plaintext_strings_recovered}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
      stage2: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'Password required: ',
          'Incorrect.',
          'ENCODED_CHECK_VALUE=c3RhZ2VfdHdvX2Jhc2U2NA==',
          '#CRACKME_PASSWORD:stage_two_base64',
          '#CRACKME_SUCCESS:Correct! Stage 2 of 4 complete.\\nflag{capstone_stage2_base64_decoded}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
      stage3: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'char buffer[64];  // local stack buffer, no bounds checking on the copy below',
          'strcpy(buffer, argv[1]);  // classic unbounded copy',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO   No canary found   NX enabled    No PIE\\nflag{capstone_stage3_checksec_reveals_no_stack_canary}',
          '#CRACKME_MINLEN:80',
          '#CRACKME_SUCCESS:*** stack smashing NOT detected (no canary) *** Segmentation fault (core dumped)\\nStage 3 of 4 complete.\\nflag{capstone_stage3_buffer_overflow_confirmed_no_canary}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
      stage4: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, stripped',
          'Access denied.',
          'Access granted!',
          '#GDB_SESSION:(gdb) break *0x0000000000401189\\n(gdb) run AAAA\\nBreakpoint 1, 0x0000000000401189 in main ()\\n(gdb) x/s $rsi\\n0x404040: "f1n4l_st4g3_runtime_0nly"\\n--- this value is never printed by the binary itself, only visible via the debugger ---',
          '#CRACKME_PASSWORD:f1n4l_st4g3_runtime_0nly',
          '#CRACKME_SUCCESS:Access granted! All 4 stages complete.\\nflag{capstone_stage4_gdb_runtime_only_value_recovered}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
];
