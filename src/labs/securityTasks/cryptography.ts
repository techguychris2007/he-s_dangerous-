import type { CodeTask } from '../codeTypes';

export const SECURITY_CRYPTOGRAPHY_TASKS: CodeTask[] = [
  {
    id: 'sec-crypto-01',
    title: 'Break Single-Byte XOR with Frequency Analysis',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'Single-byte XOR is a real, still-encountered obfuscation scheme — malware authors and CTF setters ' +
      'use it to hide strings and payloads from casual inspection. It is also trivially breakable: try ' +
      'every one of the 256 possible key bytes, decode with each, and score the result by how much it ' +
      'looks like real English text. The highest-scoring decode is (almost always) correct — no ' +
      'brute-forcing of the plaintext itself required, just of the tiny key space.\n\n' +
      'Write crack_single_byte_xor(ciphertext) where ciphertext is a bytes object. XOR it against every ' +
      'key from 0 to 255. For each key, if the result decodes as ASCII, score it by counting characters ' +
      'that are letters or spaces (a simple but effective "looks like English" heuristic). Return a tuple ' +
      '(best_key, best_text) for the highest-scoring decode.',
    starterCode:
      'def crack_single_byte_xor(ciphertext):\n' +
      '    # TODO: try all 256 keys, decode+score each, return (best_key, best_text)\n' +
      '    pass\n',
    hints: [
      'Loop key in range(256); decoded = bytes(b ^ key for b in ciphertext) recovers the candidate plaintext bytes for that key.',
      'Not every key produces valid ASCII — wrap decoded.decode("ascii") in a try/except and skip keys that raise UnicodeDecodeError.',
      'Score with sum(1 for c in text if c.isalpha() or c == " ") — real English scores much higher than garbage.',
      'Track the best (key, text, score) seen so far as you loop, starting best_score at -1 so the first valid decode always wins initially.',
    ],
    solution:
      'def crack_single_byte_xor(ciphertext):\n' +
      '    best_key, best_score, best_text = 0, -1, ""\n' +
      '    for key in range(256):\n' +
      '        decoded = bytes(b ^ key for b in ciphertext)\n' +
      '        try:\n' +
      '            text = decoded.decode("ascii")\n' +
      '        except UnicodeDecodeError:\n' +
      '            continue\n' +
      '        score = sum(1 for c in text if c.isalpha() or c == " ")\n' +
      '        if score > best_score:\n' +
      '            best_key, best_score, best_text = key, score, text\n' +
      '    return best_key, best_text\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'plaintext1 = b"the attack begins at dawn"\n' +
      'key1 = 0x2A\n' +
      'cipher1 = bytes(b ^ key1 for b in plaintext1)\n' +
      '__check__("basic recover", crack_single_byte_xor(cipher1), (key1, plaintext1.decode()))\n\n' +
      'plaintext2 = b"password is hunter2 today"\n' +
      'key2 = 0x5F\n' +
      'cipher2 = bytes(b ^ key2 for b in plaintext2)\n' +
      '__check__("different key", crack_single_byte_xor(cipher2), (key2, plaintext2.decode()))\n\n' +
      'plaintext3 = b"exfiltrate the database now"\n' +
      'key3 = 0x13\n' +
      'cipher3 = bytes(b ^ key3 for b in plaintext3)\n' +
      '__check__("longer message", crack_single_byte_xor(cipher3), (key3, plaintext3.decode()))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
