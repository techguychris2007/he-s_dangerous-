import type { CodeTask } from '../codeTypes';

/** Classical ciphers, encoding, and hashing — the building blocks behind both attacking weak crypto
 *  and understanding why modern crypto is built the way it is. */
export const PYTHON_CRYPTO_TASKS: CodeTask[] = [
  {
    id: 'py-crypto-01',
    title: 'Caesar Cipher Encoder',
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write caesar_encrypt(text, shift) that shifts every letter in text forward by shift positions in the ' +
      'alphabet, wrapping around ("z" shifted by 1 becomes "a"), preserving case, and leaving non-letters ' +
      'untouched. The Caesar cipher is the "hello world" of cryptanalysis — every modern substitution/rotation ' +
      'attack technique traces back to breaking exactly this.',
    starterCode:
      'def caesar_encrypt(text, shift):\n' +
      '    # TODO: shift every letter by `shift` positions, wrapping, preserving case and non-letters\n' +
      '    pass\n',
    hints: [
      'Handle uppercase and lowercase separately, each anchored to its own base ("A" or "a") using ord()/chr().',
      'The wraparound math is (ord(c) - base + shift) % 26 + base.',
      'Any character that isn\'t c.isalpha() should just be appended unchanged.',
    ],
    solution:
      'def caesar_encrypt(text, shift):\n' +
      '    result = []\n' +
      '    for c in text:\n' +
      '        if c.isupper():\n' +
      '            result.append(chr((ord(c) - ord("A") + shift) % 26 + ord("A")))\n' +
      '        elif c.islower():\n' +
      '            result.append(chr((ord(c) - ord("a") + shift) % 26 + ord("a")))\n' +
      '        else:\n' +
      '            result.append(c)\n' +
      '    return "".join(result)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", caesar_encrypt("abc", 3), "def")\n' +
      '__check__("wrap", caesar_encrypt("xyz", 3), "abc")\n' +
      '__check__("case preserved", caesar_encrypt("Hello, World!", 3), "Khoor, Zruog!")\n' +
      '__check__("shift 0", caesar_encrypt("test", 0), "test")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-02',
    title: 'Caesar Cipher Brute-Force Decoder',
    difficulty: 'Medium',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write caesar_crack(ciphertext, common_word) that tries all 26 possible shifts to decode ciphertext, ' +
      'and returns the decoded string that contains common_word (case-insensitive) as a substring. Assume ' +
      'exactly one shift produces a match. This is literally how you break a Caesar cipher without knowing ' +
      'the key — try every shift and recognize real text when you see it.',
    starterCode:
      'def caesar_crack(ciphertext, common_word):\n' +
      '    # TODO: try shifts 0-25 (decoding = shifting backward), return the one containing common_word\n' +
      '    pass\n',
    hints: [
      'Decoding with shift n is the same as encrypting with shift (26 - n) % 26 — reuse that idea, or write a small inline shift helper.',
      'Loop shift from 0 to 25, decode, and check common_word.lower() in decoded.lower().',
      'Return as soon as you find a match — the problem guarantees exactly one will.',
    ],
    solution:
      'def _shift_text(text, shift):\n' +
      '    result = []\n' +
      '    for c in text:\n' +
      '        if c.isupper():\n' +
      '            result.append(chr((ord(c) - ord("A") + shift) % 26 + ord("A")))\n' +
      '        elif c.islower():\n' +
      '            result.append(chr((ord(c) - ord("a") + shift) % 26 + ord("a")))\n' +
      '        else:\n' +
      '            result.append(c)\n' +
      '    return "".join(result)\n\n' +
      'def caesar_crack(ciphertext, common_word):\n' +
      '    for shift in range(26):\n' +
      '        decoded = _shift_text(ciphertext, -shift)\n' +
      '        if common_word.lower() in decoded.lower():\n' +
      '            return decoded\n' +
      '    return None\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", caesar_crack("Khoor, Zruog!", "hello"), "Hello, World!")\n' +
      '__check__("different shift", caesar_crack("Wkh Iodj Lv Khuh", "flag"), "The Flag Is Here")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-03',
    title: 'XOR Cipher Encode/Decode',
    difficulty: 'Medium',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write xor_cipher(data, key) where data is bytes and key is bytes; XOR each byte of data with the ' +
      'corresponding byte of key, cycling the key if it\'s shorter than data. Return the result as bytes. ' +
      'Because XOR is its own inverse, this single function both encrypts and decrypts — exactly how simple ' +
      'malware droppers and CTF crypto challenges obfuscate payloads.',
    starterCode:
      'def xor_cipher(data, key):\n' +
      '    # TODO: XOR each byte of `data` with `key`, cycling key if shorter, return bytes\n' +
      '    pass\n',
    hints: [
      'Index into key with i % len(key) so it cycles/repeats to match data\'s length.',
      'The XOR of two ints is done with the ^ operator: data[i] ^ key[i % len(key)].',
      'Collect the XORed integers into a list, then wrap with bytes(the_list) to get a bytes object back.',
    ],
    solution:
      'def xor_cipher(data, key):\n' +
      '    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'plaintext = b"attack at dawn"\n' +
      'key = b"key"\n' +
      'ciphertext = xor_cipher(plaintext, key)\n' +
      '__check__("roundtrip decrypts back to plaintext", xor_cipher(ciphertext, key), plaintext)\n' +
      '__check__("differs from plaintext", ciphertext != plaintext, True)\n' +
      '__check__("single byte key", xor_cipher(bytes([5, 10, 15]), bytes([1])), bytes([4, 11, 14]))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-04',
    title: 'Base64 Encode/Decode a Secret',
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write b64_roundtrip(secret_text) that base64-encodes secret_text (as UTF-8) and returns the encoded ' +
      'result as a str (not bytes). Base64 shows up everywhere in security work — Basic Auth headers, JWT ' +
      'segments, embedded payloads — and it\'s crucial to remember it is an ENCODING, not encryption: anyone ' +
      'can decode it instantly.',
    starterCode: 'import base64\n\ndef b64_roundtrip(secret_text):\n    # TODO: base64-encode secret_text (UTF-8) and return the result as a str\n    pass\n',
    hints: [
      'You need to encode the string to bytes first: secret_text.encode("utf-8").',
      'base64.b64encode() takes bytes and returns bytes — you still need to .decode("utf-8") the result to get a plain str back.',
      'Chain it: base64.b64encode(secret_text.encode("utf-8")).decode("utf-8").',
    ],
    solution:
      'import base64\n\n' +
      'def b64_roundtrip(secret_text):\n' +
      '    return base64.b64encode(secret_text.encode("utf-8")).decode("utf-8")\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", b64_roundtrip("hello"), "aGVsbG8=")\n' +
      '__check__("returns str not bytes", type(b64_roundtrip("hi")), str)\n' +
      '__check__("known value", b64_roundtrip("flag{test}"), "ZmxhZ3t0ZXN0fQ==")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-05',
    title: 'Hash a Password With SHA-256',
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write sha256_hex(text) that returns the SHA-256 hash of text (UTF-8 encoded) as a lowercase hex ' +
      'string, using the hashlib module. Storing a hash instead of a plaintext password is the single most ' +
      'important habit in all of authentication — this is the primitive every password-storage scheme is built on.',
    starterCode: 'import hashlib\n\ndef sha256_hex(text):\n    # TODO: return the SHA-256 hex digest of text\n    pass\n',
    hints: [
      'hashlib.sha256() needs bytes, so encode the string first: text.encode("utf-8").',
      'Call .hexdigest() on the hash object to get the lowercase hex string directly — no manual formatting needed.',
      'The whole thing is one line: hashlib.sha256(text.encode("utf-8")).hexdigest().',
    ],
    solution: 'import hashlib\n\ndef sha256_hex(text):\n    return hashlib.sha256(text.encode("utf-8")).hexdigest()\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("empty string", sha256_hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")\n' +
      '__check__("known value", sha256_hex("hello"), "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")\n' +
      '__check__("is 64 hex chars", len(sha256_hex("anything")), 64)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-06',
    title: "Verify a File's Integrity via Checksum",
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write verify_integrity(content, expected_hash) where content is a string standing in for file ' +
      'contents; compute its SHA-256 hex digest and return True if it matches expected_hash ' +
      '(case-insensitive comparison). This is exactly the check package managers and download pages run ' +
      'before trusting that a file wasn\'t corrupted or tampered with in transit.',
    starterCode:
      'import hashlib\n\n' +
      'def verify_integrity(content, expected_hash):\n' +
      '    # TODO: return True if sha256(content) matches expected_hash, case-insensitive\n' +
      '    pass\n',
    hints: [
      'Reuse the same hashlib.sha256(...).hexdigest() pattern from the hashing task.',
      'Lowercase both sides before comparing so "ABCD..." and "abcd..." are treated the same.',
      'This should be a single computed-vs-expected string comparison, nothing fancier.',
    ],
    solution:
      'import hashlib\n\n' +
      'def verify_integrity(content, expected_hash):\n' +
      '    actual = hashlib.sha256(content.encode("utf-8")).hexdigest()\n' +
      '    return actual.lower() == expected_hash.lower()\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("matches", verify_integrity("hello", "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"), True)\n' +
      '__check__("case insensitive", verify_integrity("hello", "2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824"), True)\n' +
      '__check__("mismatch", verify_integrity("tampered", "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-07',
    title: 'Dictionary Attack Against a Hash List',
    difficulty: 'Medium',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write crack_hashes(hash_list, wordlist) where hash_list is a list of SHA-256 hex digests and wordlist ' +
      'is a list of candidate plaintext passwords. Return a dict mapping each hash that was cracked to the ' +
      'plaintext word that produced it (skip hashes with no match in the wordlist). This is precisely how ' +
      'tools like hashcat work in dictionary mode, just without the GPU speed.',
    starterCode:
      'import hashlib\n\n' +
      'def crack_hashes(hash_list, wordlist):\n' +
      '    # TODO: return {hash: matching_word} for every hash crackable from wordlist\n' +
      '    pass\n',
    hints: [
      'Precompute the hash for every candidate word once, rather than re-hashing per hash_list entry — build a dict of {computed_hash: word}.',
      'Then for each hash in hash_list, look it up in that precomputed dict.',
      'Only add an entry to the result if the hash was actually found among the precomputed ones.',
    ],
    solution:
      'import hashlib\n\n' +
      'def crack_hashes(hash_list, wordlist):\n' +
      '    lookup = {hashlib.sha256(w.encode("utf-8")).hexdigest(): w for w in wordlist}\n' +
      '    cracked = {}\n' +
      '    for h in hash_list:\n' +
      '        if h in lookup:\n' +
      '            cracked[h] = lookup[h]\n' +
      '    return cracked\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'import hashlib\n' +
      'wordlist = ["password", "123456", "letmein", "qwerty"]\n' +
      'h_password = hashlib.sha256(b"password").hexdigest()\n' +
      'h_letmein = hashlib.sha256(b"letmein").hexdigest()\n' +
      'h_unknown = "0" * 64\n' +
      '__check__("cracks known", crack_hashes([h_password, h_letmein], wordlist), {h_password: "password", h_letmein: "letmein"})\n' +
      '__check__("skips unknown", crack_hashes([h_unknown], wordlist), {})\n' +
      '__check__("mixed", crack_hashes([h_password, h_unknown], wordlist), {h_password: "password"})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-08',
    title: 'Vigenère Cipher Encoder',
    difficulty: 'Hard',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write vigenere_encrypt(text, key) where key is a string of letters. Shift each LETTER in text by an ' +
      'amount determined by the corresponding letter of key (cycled to match), wrapping the key only over ' +
      'letters in text (non-letters pass through unshifted and do not consume a key letter). Preserve case ' +
      'of the text; treat the key as case-insensitive. Vigenère defeats simple frequency analysis by using ' +
      'a different shift per position, which is exactly why it survived as "unbreakable" for centuries.',
    starterCode:
      'def vigenere_encrypt(text, key):\n' +
      '    # TODO: shift each letter of text by the letter of key at the current key-position,\n' +
      '    # cycling through key only as letters are consumed; non-letters pass through unshifted\n' +
      '    pass\n',
    hints: [
      'Keep a separate counter that only increments when you actually shift a letter — that\'s your position into `key`.',
      'The shift amount for a key letter k is ord(k.lower()) - ord("a").',
      'Reuse the same per-character Caesar-style shift math, just with a shift amount that changes every letter instead of staying constant.',
    ],
    solution:
      'def vigenere_encrypt(text, key):\n' +
      '    key = key.lower()\n' +
      '    result = []\n' +
      '    key_pos = 0\n' +
      '    for c in text:\n' +
      '        if c.isalpha():\n' +
      '            shift = ord(key[key_pos % len(key)]) - ord("a")\n' +
      '            base = ord("A") if c.isupper() else ord("a")\n' +
      '            result.append(chr((ord(c) - base + shift) % 26 + base))\n' +
      '            key_pos += 1\n' +
      '        else:\n' +
      '            result.append(c)\n' +
      '    return "".join(result)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", vigenere_encrypt("attackatdawn", "lemon"), "lxfopvefrnhr")\n' +
      '__check__("with space", vigenere_encrypt("hi there", "key"), "rm rripo")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-09',
    title: 'Score Text by English Letter Frequency',
    difficulty: 'Hard',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write english_score(text) that returns a float: the sum, over every alphabetic character in text ' +
      '(case-insensitive), of that letter\'s expected frequency in English from the provided EXPECTED_FREQ ' +
      'table (already defined for you above the function). Higher scores mean text looks more like real ' +
      'English. This scoring function is exactly what lets a program automatically pick the "correct" shift ' +
      'out of 26 candidates without a human reading each one.',
    starterCode:
      'EXPECTED_FREQ = {\n' +
      '    "e": 12.7, "t": 9.1, "a": 8.2, "o": 7.5, "i": 7.0, "n": 6.7, "s": 6.3, "h": 6.1, "r": 6.0,\n' +
      '    "d": 4.3, "l": 4.0, "c": 2.8, "u": 2.8, "m": 2.4, "w": 2.4, "f": 2.2, "g": 2.0, "y": 2.0,\n' +
      '    "p": 1.9, "b": 1.5, "v": 1.0, "k": 0.8, "j": 0.15, "x": 0.15, "q": 0.10, "z": 0.07,\n' +
      '}\n\n' +
      'def english_score(text):\n' +
      '    # TODO: sum EXPECTED_FREQ[letter] for every alphabetic character in text (case-insensitive)\n' +
      '    pass\n',
    hints: [
      'Lowercase the text, then loop over each character, skipping anything that\'s not alphabetic.',
      'EXPECTED_FREQ.get(c, 0) handles any edge case gracefully even though every a-z key is present.',
      'This is just an accumulating sum over a filtered loop — no need for anything fancier.',
    ],
    solution:
      'EXPECTED_FREQ = {\n' +
      '    "e": 12.7, "t": 9.1, "a": 8.2, "o": 7.5, "i": 7.0, "n": 6.7, "s": 6.3, "h": 6.1, "r": 6.0,\n' +
      '    "d": 4.3, "l": 4.0, "c": 2.8, "u": 2.8, "m": 2.4, "w": 2.4, "f": 2.2, "g": 2.0, "y": 2.0,\n' +
      '    "p": 1.9, "b": 1.5, "v": 1.0, "k": 0.8, "j": 0.15, "x": 0.15, "q": 0.10, "z": 0.07,\n' +
      '}\n\n' +
      'def english_score(text):\n' +
      '    total = 0.0\n' +
      '    for c in text.lower():\n' +
      '        if c.isalpha():\n' +
      '            total += EXPECTED_FREQ.get(c, 0)\n' +
      '    return total\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("empty", english_score(""), 0.0)\n' +
      '__check__("single e", english_score("e"), 12.7)\n' +
      '__check__("case insensitive", english_score("E"), 12.7)\n' +
      '__check__("real text scores higher than random-ish text", english_score("the quick brown fox") > english_score("zqxjkv"), True)\n' +
      '__check__("ignores punctuation", english_score("e!!!"), 12.7)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-10',
    title: 'Generate a Cryptographically Random Token',
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write generate_token(num_bytes) using the secrets module to return a random URL-safe token string ' +
      'generated from num_bytes bytes of randomness. Never use the random module for anything ' +
      'security-sensitive (session tokens, password reset links, API keys) — it is NOT cryptographically ' +
      'secure and its output can be predicted; secrets exists specifically to fix that.',
    starterCode: 'import secrets\n\ndef generate_token(num_bytes):\n    # TODO: return a random URL-safe token generated from num_bytes bytes\n    pass\n',
    hints: [
      'secrets.token_urlsafe(num_bytes) does exactly this in one call.',
      'The return type must be a str, which token_urlsafe already gives you.',
      'Nothing else needed here — the whole implementation really is that one line.',
    ],
    solution: 'import secrets\n\ndef generate_token(num_bytes):\n    return secrets.token_urlsafe(num_bytes)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      't1 = generate_token(16)\n' +
      't2 = generate_token(16)\n' +
      '__check__("returns a string", isinstance(t1, str), True)\n' +
      '__check__("non-empty", len(t1) > 0, True)\n' +
      '__check__("two calls differ (astronomically unlikely to collide)", t1 != t2, True)\n' +
      '__check__("url-safe charset only", all(c.isalnum() or c in "-_" for c in t1), True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-11',
    title: 'Implement ROT13 From Scratch',
    difficulty: 'Easy',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write rot13(text) without using str.translate/codecs — implement the shift-by-13 logic directly, ' +
      'preserving case and passing non-letters through unchanged. ROT13 is its own inverse (applying it ' +
      'twice returns the original), which is a useful property to notice while you\'re building it.',
    starterCode: 'def rot13(text):\n    # TODO: implement ROT13 directly (no str.translate/codecs), preserving case\n    pass\n',
    hints: [
      'This is just caesar_encrypt with a fixed shift of 13 — reuse that exact logic inline.',
      'Handle uppercase and lowercase with separate base characters, same as any Caesar-style shift.',
      'Since 13 + 13 = 26, applying your own function twice to its own output should return the original string — a good way to self-check.',
    ],
    solution:
      'def rot13(text):\n' +
      '    result = []\n' +
      '    for c in text:\n' +
      '        if c.isupper():\n' +
      '            result.append(chr((ord(c) - ord("A") + 13) % 26 + ord("A")))\n' +
      '        elif c.islower():\n' +
      '            result.append(chr((ord(c) - ord("a") + 13) % 26 + ord("a")))\n' +
      '        else:\n' +
      '            result.append(c)\n' +
      '    return "".join(result)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", rot13("hello"), "uryyb")\n' +
      '__check__("is its own inverse", rot13(rot13("Attack At Dawn!")), "Attack At Dawn!")\n' +
      '__check__("preserves punctuation", rot13("abc, xyz!"), "nop, klm!")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-crypto-12',
    title: 'Validate a Card Number With the Luhn Algorithm',
    difficulty: 'Medium',
    language: 'python',
    category: 'Cryptography & Encoding',
    prompt:
      'Write luhn_valid(number_str) where number_str is a string of digits (no spaces/dashes). Implement ' +
      'the Luhn checksum: starting from the rightmost digit and moving left, double every second digit; if ' +
      'doubling produces a number > 9, subtract 9. Sum all digits (doubled ones after adjustment, others as ' +
      'is); the number is valid if the total is divisible by 10. Every card issuer uses this exact checksum ' +
      'to catch typos before a transaction even reaches a payment processor.',
    starterCode:
      'def luhn_valid(number_str):\n' +
      '    # TODO: implement the Luhn checksum, return True if the total is divisible by 10\n' +
      '    pass\n',
    hints: [
      'Reverse the string first so you can index from the rightmost digit at position 0.',
      'Every digit at an odd index (1, 3, 5, ...) in the reversed string gets doubled, per the classic Luhn definition.',
      'If a doubled digit exceeds 9, subtract 9 from it (equivalent to summing its own two digits, e.g. 16 -> 1+6 -> 7, and 16-9=7).',
    ],
    solution:
      'def luhn_valid(number_str):\n' +
      '    digits = [int(d) for d in number_str]\n' +
      '    total = 0\n' +
      '    reversed_digits = digits[::-1]\n' +
      '    for i, d in enumerate(reversed_digits):\n' +
      '        if i % 2 == 1:\n' +
      '            d *= 2\n' +
      '            if d > 9:\n' +
      '                d -= 9\n' +
      '        total += d\n' +
      '    return total % 10 == 0\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("valid visa test number", luhn_valid("4532015112830366"), True)\n' +
      '__check__("invalid (typo)", luhn_valid("4532015112830367"), False)\n' +
      '__check__("valid short example", luhn_valid("79927398713"), True)\n' +
      '__check__("invalid short example", luhn_valid("79927398710"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
