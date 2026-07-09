import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function attacker(extra: Record<string, ReturnType<typeof file>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra) }) };
}

export const binaryAnalysisLabs: LabScenario[] = [
  {
    id: 'binary-static-strings-crackme',
    title: 'Reverse Engineering: Static Strings Crackme',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'A small challenge binary, crackme1, sits on your attack box. It asks for a password when run. ' +
      'Recover the correct password using pure static analysis — no debugger required — exactly as taught ' +
      'in the Binary Analysis module\'s first lesson.',
    objectives: [
      { text: 'Identify the file format with file crackme1', why: 'Confirming what you\'re dealing with before analysis prevents wasted effort — always the first move.' },
      { text: 'Extract readable strings with strings crackme1', why: 'Many real crackmes and even real malware samples leave the actual comparison value in plain text — the highest-value, lowest-effort static analysis technique.' },
      { text: 'Run ./crackme1 <password> with the recovered password to confirm and capture the flag', why: 'Confirming the recovered value actually works is what separates "found something interesting in strings" from "confirmed the vulnerability/solution."' },
    ],
    hints: [
      'file crackme1',
      'strings crackme1',
      'One of the extracted strings looks exactly like a password check value — try it directly: ./crackme1 <that value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      crackme1: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, statically linked, not stripped',
          '/lib64/ld-linux-x86-64.so.2',
          'GLIBC_2.2.5',
          'Enter password: ',
          'Access denied.',
          'Access granted!',
          '__libc_start_main',
          'strcmp',
          '#CRACKME_PASSWORD:sup3rs3cr3t_static_2026',
          '#CRACKME_SUCCESS:Access granted! Password verified via direct string comparison.\\nflag{static_strings_analysis_recovers_password}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-encoded-password-crackme',
    title: 'Reverse Engineering: Obfuscated Password Crackme',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'A second challenge binary, crackme2, was compiled with a slightly more careful author — the ' +
      'password isn\'t sitting in plain text this time. It\'s Base64-encoded in the binary\'s data section, ' +
      'decoded only at runtime. You\'ll need to extract it and decode it yourself before it will work.',
    objectives: [
      { text: 'Extract strings from crackme2 and locate the encoded value', why: 'Even "obfuscated" samples usually leave the encoded form somewhere static — obfuscation is rarely airtight without real encryption and key management.' },
      { text: 'Decode the Base64 string to recover the real password', why: 'This is the exact technique from the Malware Analysis module\'s PowerShell decoding lesson, applied here to a binary instead of a script.' },
      { text: 'Run ./crackme2 with the decoded password and capture the flag', why: 'Confirms your decoding was correct — an incorrect decode simply won\'t match, the same feedback loop real reverse engineers rely on.' },
    ],
    hints: [
      'strings crackme2',
      'One string looks like standard Base64 (letters, numbers, +, /, possibly = padding).',
      'Decode it (base64 -d, or any Base64 decoder) before supplying it to the binary: ./crackme2 <decoded value>',
    ],
    totalFlags: 1,
    attacker: attacker({
      crackme2: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'Password required: ',
          'Incorrect.',
          'Correct! Unlocking...',
          'ENCODED_CHECK_VALUE=cjNfZW5nMW4zM3JfcjBja3Mh',
          '#CRACKME_PASSWORD:r3_eng1n33r_r0cks!',
          '#CRACKME_SUCCESS:Correct! Unlocking...\\nflag{base64_decoded_password_recovered}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
  {
    id: 'binary-buffer-overflow-crash',
    title: 'Reverse Engineering: Triggering a Buffer Overflow Crash',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'The third challenge, vuln_service, is a deliberately vulnerable practice binary matching the exact ' +
      'pattern from the Buffer Overflow Fundamentals lesson: a fixed-size stack buffer with no bounds ' +
      'checking. You don\'t need a specific password here — you need to send an input long enough to ' +
      'overflow the buffer and crash past the intended check entirely.',
    objectives: [
      { text: 'Run strings vuln_service to find the buffer size hint left in the binary', why: 'Real analysts often find size constants, buffer names, or debug strings in a binary that hint at the vulnerable buffer\'s exact size — reducing guesswork before crafting an overflow.' },
      { text: 'Run ./vuln_service with an input long enough to overflow the 64-byte buffer', why: 'Recall the stack layout from the Assembly & Stack lesson — sending fewer bytes than the buffer size never reaches the return address; you need to exceed it by a meaningful margin.' },
      { text: 'Confirm the crash/overflow message and capture the flag', why: 'This is the exact "confirm the vulnerability is triggerable" step from the exploit development workflow, before ever worrying about controlling WHERE execution redirects to.' },
    ],
    hints: [
      'strings vuln_service',
      'The buffer is documented as 64 bytes — try an input noticeably longer than that, e.g. 100+ characters.',
      './vuln_service AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    ],
    totalFlags: 1,
    attacker: attacker({
      vuln_service: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'char buffer[64];  // local stack buffer, no bounds checking on the copy below',
          'strcpy(buffer, argv[1]);  // classic unbounded copy — the exact vulnerable pattern',
          'Waiting for input...',
          '#CRACKME_MINLEN:65',
          '#CRACKME_SUCCESS:*** SEGMENTATION FAULT — stack buffer overflowed past its 64-byte bound ***\\nReturn address corrupted. Execution would redirect here in a real exploit.\\nflag{buffer_overflow_triggered_64_byte_stack_buffer}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
];
