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
  {
    id: 'sec-crypto-02',
    title: 'Hex-to-Base64 Conversion',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'The very first skill in working with cryptographic data by hand: converting between the ' +
      'encodings it gets passed around in. Ciphertext, hashes, and keys are usually shown as hex in ' +
      'documentation and logs, but transmitted as Base64 in real protocols (HTTP headers, JSON, email) — ' +
      'converting cleanly between them, without ever going through a plaintext string in the middle, is a ' +
      'foundational habit for security scripting.\n\n' +
      'Write hex_to_base64(hex_string) that takes a hex-encoded string and returns its Base64 encoding, ' +
      'using bytes.fromhex() and Python\'s real base64 module — never manual string manipulation, since a ' +
      'single off-by-one there silently corrupts binary data.',
    starterCode:
      'import base64\n\n' +
      'def hex_to_base64(hex_string):\n' +
      '    # TODO: decode the hex string to raw bytes, then base64-encode those bytes\n' +
      '    pass\n',
    hints: [
      'bytes.fromhex(hex_string) turns the hex text into the actual raw bytes it represents.',
      'base64.b64encode() takes bytes and returns bytes — you need .decode("ascii") on the result to get a plain string back.',
      'The whole function is two lines: decode hex to bytes, then base64-encode and decode to a string.',
    ],
    solution:
      'import base64\n\n' +
      'def hex_to_base64(hex_string):\n' +
      '    raw = bytes.fromhex(hex_string)\n' +
      '    return base64.b64encode(raw).decode("ascii")\n',
    testCode:
      'import base64\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'msg1 = b"attack the eastern gate at dawn"\n' +
      '__check__("basic conversion", hex_to_base64(msg1.hex()), base64.b64encode(msg1).decode())\n\n' +
      'msg2 = b"the password is on the sticky note"\n' +
      '__check__("longer message", hex_to_base64(msg2.hex()), base64.b64encode(msg2).decode())\n\n' +
      '__check__("empty string", hex_to_base64(""), "")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-03',
    title: 'Fixed XOR of Two Buffers',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'The one-time pad and every stream cipher reduce to the same core operation: XOR-ing a plaintext ' +
      'against a keystream of the same length, byte by byte. Before building anything that uses XOR ' +
      'encryption (or breaks it), you need the primitive itself, done correctly on raw bytes.\n\n' +
      'Write fixed_xor(buf1, buf2) where both arguments are bytes objects of equal length. Return a new ' +
      'bytes object where each output byte is the XOR of the corresponding input bytes at that position.',
    starterCode:
      'def fixed_xor(buf1, buf2):\n' +
      '    # TODO: XOR buf1 and buf2 byte-by-byte, return the result as bytes\n' +
      '    pass\n',
    hints: [
      'zip(buf1, buf2) pairs up corresponding bytes from each buffer (iterating over a bytes object yields ints, one per byte).',
      'A generator expression bytes(a ^ b for a, b in zip(buf1, buf2)) does the whole operation in one line.',
      'XOR-ing any value with itself always produces 0 — a useful property to check your logic against.',
    ],
    solution: 'def fixed_xor(buf1, buf2):\n' + '    return bytes(a ^ b for a, b in zip(buf1, buf2))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'a = bytes.fromhex("686974207468652062756c6c277320657965")\n' +
      'b = bytes.fromhex("686f77206b696e64206f66206c6f766520697374686174")[:len(a)]\n' +
      'expected = bytes(x ^ y for x, y in zip(a, b))\n' +
      '__check__("basic xor matches manual computation", fixed_xor(a, b), expected)\n\n' +
      'x = b"\\x00\\x01\\x02\\x03"\n' +
      'y = b"\\xff\\xff\\xff\\xff"\n' +
      '__check__("xor with 0xff flips all bits", fixed_xor(x, y), b"\\xff\\xfe\\xfd\\xfc")\n\n' +
      'z = b"\\x5a\\x5a\\x5a"\n' +
      '__check__("xor with self is all zeros", fixed_xor(z, z), b"\\x00\\x00\\x00")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-04',
    title: 'Repeating-Key XOR Encryption',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'Single-byte XOR (the first lab in this shelf) is trivially broken by frequency analysis because ' +
      'every byte of plaintext is scrambled by the exact same key byte. Repeating a multi-byte key over ' +
      'and over across the plaintext is a real, historically-used improvement (and still a real weakness ' +
      '— see the next book on this shelf for why key reuse matters). Symmetric by construction: the same ' +
      'function encrypts and decrypts.\n\n' +
      'Write repeating_key_xor(data, key) where data and key are bytes. XOR each byte of data with the ' +
      'key byte at the corresponding position, cycling the key around (key wraps to its start) once it ' +
      'runs out. Return the result as bytes.',
    starterCode:
      'def repeating_key_xor(data, key):\n' +
      '    # TODO: XOR each byte of data with key, cycling key when it runs out\n' +
      '    pass\n',
    hints: [
      'enumerate(data) gives you both the index i and the byte b for each position — the index is exactly what you need to cycle through key.',
      'key[i % len(key)] picks the right key byte for position i, wrapping back to key[0] once i exceeds len(key).',
      'Because XOR is its own inverse, calling this same function again with the same key on the ciphertext recovers the original plaintext.',
    ],
    solution: 'def repeating_key_xor(data, key):\n' + '    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'plaintext = b"meet at the old bridge after midnight"\n' +
      'key = b"KEY"\n' +
      'cipher = repeating_key_xor(plaintext, key)\n' +
      '__check__("encrypt then decrypt recovers plaintext", repeating_key_xor(cipher, key), plaintext)\n' +
      '__check__("cipher differs from plaintext", cipher != plaintext, True)\n\n' +
      'single_byte_key = b"X"\n' +
      'msg = b"hello"\n' +
      '__check__("single-byte key matches simple XOR", repeating_key_xor(msg, single_byte_key), bytes(c ^ ord("X") for c in msg))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-05',
    title: 'Detect ECB-Mode Encryption by Repeated Blocks',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'AES is a block cipher: it encrypts fixed 16-byte chunks at a time. In ECB (Electronic Codebook) ' +
      'mode, each block is encrypted completely independently with the same key — which means two ' +
      'identical 16-byte plaintext blocks always produce two identical 16-byte ciphertext blocks. That\'s ' +
      'a real, well-known weakness: an attacker who sees repeated ciphertext blocks can be confident the ' +
      'data was encrypted in ECB mode (a famous real illustration is an ECB-encrypted bitmap image where ' +
      'you can still make out the original picture\'s shapes).\n\n' +
      'Write detect_ecb(ciphertexts) where ciphertexts is a list of bytes objects. For each ciphertext, ' +
      'split it into consecutive 16-byte blocks and check whether any block repeats. Return a list ' +
      'containing only the ciphertexts (in their original order) that have at least one repeated block.',
    starterCode:
      'def detect_ecb(ciphertexts):\n' +
      '    # TODO: for each ciphertext, split into 16-byte blocks and check for a repeat;\n' +
      '    # return the list of ciphertexts that have one\n' +
      '    pass\n',
    hints: [
      'ct[i:i+16] for i in range(0, len(ct), 16) splits a ciphertext into a list of 16-byte chunks.',
      'Comparing len(blocks) to len(set(blocks)) tells you if any block repeated — a set collapses duplicates, so a shorter set means a repeat existed.',
      'bytes objects are hashable, so they work directly as set elements — no conversion needed.',
    ],
    solution:
      'def detect_ecb(ciphertexts):\n' +
      '    results = []\n' +
      '    for ct in ciphertexts:\n' +
      '        blocks = [ct[i:i + 16] for i in range(0, len(ct), 16)]\n' +
      '        if len(blocks) != len(set(blocks)):\n' +
      '            results.append(ct)\n' +
      '    return results\n',
    testCode:
      'import os\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'block = os.urandom(16)\n' +
      'ecb_like = block + block + os.urandom(16)\n' +
      'random_ct = os.urandom(48)\n' +
      'other_random = os.urandom(32)\n\n' +
      'result = detect_ecb([random_ct, ecb_like, other_random])\n' +
      '__check__("flags only the ciphertext with a repeated block", result, [ecb_like])\n' +
      '__check__("empty list yields no detections", detect_ecb([]), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-06',
    title: 'Crack Password Hashes with a Real Dictionary Attack',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'This is the exact technique behind tools like John the Ripper and hashcat\'s dictionary mode, and ' +
      'it\'s the reason "just hash the password" was never enough on its own: if an attacker steals a ' +
      'database of unsalted password hashes, they don\'t need to reverse the hash — they just hash every ' +
      'word in a big wordlist and check which hashes match. Millions of guesses a second, zero cryptographic ' +
      'breakthrough required.\n\n' +
      'Write crack_hashes_with_wordlist(hash_list, wordlist) where hash_list is a list of MD5 hex digests ' +
      'and wordlist is a list of candidate passwords. For each hash, try hashing every word in wordlist ' +
      'with hashlib.md5(word.encode()).hexdigest() until one matches, then record it. Return a dict mapping ' +
      'each cracked hash to the password that produced it — hashes with no match in the wordlist should ' +
      'simply be absent from the result.',
    starterCode:
      'import hashlib\n\n' +
      'def crack_hashes_with_wordlist(hash_list, wordlist):\n' +
      '    # TODO: for each hash, try every word in the wordlist until one\'s MD5 matches\n' +
      '    pass\n',
    hints: [
      'hashlib.md5(word.encode()).hexdigest() is exactly what the (insecure, unsalted) password database would have stored.',
      'For each hash in hash_list, loop through wordlist and stop at the first word whose hash matches — no need to keep checking once you\'ve found it.',
      'A hash with no matching word in the wordlist (this happens — real wordlists don\'t cover every password) should just not appear as a key in the returned dict at all.',
    ],
    solution:
      'import hashlib\n\n' +
      'def crack_hashes_with_wordlist(hash_list, wordlist):\n' +
      '    cracked = {}\n' +
      '    for h in hash_list:\n' +
      '        for word in wordlist:\n' +
      '            if hashlib.md5(word.encode()).hexdigest() == h:\n' +
      '                cracked[h] = word\n' +
      '                break\n' +
      '    return cracked\n',
    testCode:
      'import hashlib\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'targets = ["password123", "letmein", "correcthorsebatterystaple"]\n' +
      'pw_hashes = [hashlib.md5(w.encode()).hexdigest() for w in targets]\n' +
      'wl = ["123456", "password123", "qwerty", "letmein", "dragon"]\n' +
      'result = crack_hashes_with_wordlist(pw_hashes, wl)\n' +
      '__check__("cracks password123", result.get(pw_hashes[0]), "password123")\n' +
      '__check__("cracks letmein", result.get(pw_hashes[1]), "letmein")\n' +
      '__check__("leaves the not-in-wordlist hash uncracked", pw_hashes[2] in result, False)\n' +
      '__check__("only 2 of 3 hashes cracked", len(result), 2)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-07',
    title: 'Implement Diffie-Hellman Key Exchange',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'Diffie-Hellman is the real algorithm that lets two parties agree on a shared secret over a channel ' +
      'an eavesdropper can see every message on — the foundation TLS, SSH, and Signal all build key ' +
      'exchange on top of. The trick is modular exponentiation: each side raises a shared public base to ' +
      'their own private exponent, exchanges the results, then raises what they received to their own ' +
      'private exponent again — and both sides land on the exact same number, without ever transmitting it.\n\n' +
      'Write dh_shared_secret(p, g, my_private, their_public) where p is a shared prime modulus, g is a ' +
      'shared base (generator), my_private is this party\'s secret integer, and their_public is the value ' +
      'the other party already sent. Return a tuple (my_public, shared_secret) where my_public = ' +
      'g^my_private mod p (what you\'d send to the other party), and shared_secret = their_public^my_private ' +
      'mod p (the number both parties independently arrive at).',
    starterCode:
      'def dh_shared_secret(p, g, my_private, their_public):\n' +
      '    # TODO: compute my_public = g^my_private mod p, and shared = their_public^my_private mod p\n' +
      '    pass\n',
    hints: [
      "Python's built-in pow(base, exponent, modulus) does modular exponentiation directly and efficiently — never compute base**exponent first and then take % modulus, that overflows into astronomically large numbers for real key sizes.",
      'my_public = pow(g, my_private, p) is exactly what gets transmitted to the other party.',
      'shared_secret = pow(their_public, my_private, p) — note it uses THEIR public value raised to YOUR private exponent, which is what makes both sides converge on the same number.',
    ],
    solution:
      'def dh_shared_secret(p, g, my_private, their_public):\n' +
      '    my_public = pow(g, my_private, p)\n' +
      '    shared_secret = pow(their_public, my_private, p)\n' +
      '    return my_public, shared_secret\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'p, g = 23, 5\n' +
      'alice_public, _ = dh_shared_secret(p, g, 6, 0)\n' +
      'bob_public, _ = dh_shared_secret(p, g, 15, 0)\n' +
      '_, alice_shared = dh_shared_secret(p, g, 6, bob_public)\n' +
      '_, bob_shared = dh_shared_secret(p, g, 15, alice_public)\n' +
      '__check__("both parties derive the identical shared secret", alice_shared == bob_shared, True)\n' +
      '__check__("alice\'s public value matches g^6 mod 23", alice_public, pow(5, 6, 23))\n\n' +
      'p2, g2 = 23, 5\n' +
      'a2_pub, _ = dh_shared_secret(p2, g2, 3, 0)\n' +
      'b2_pub, _ = dh_shared_secret(p2, g2, 9, 0)\n' +
      '_, a2_shared = dh_shared_secret(p2, g2, 3, b2_pub)\n' +
      '_, b2_shared = dh_shared_secret(p2, g2, 9, a2_pub)\n' +
      '__check__("second key pair also converges", a2_shared == b2_shared, True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-crypto-08',
    title: 'Timing-Safe Comparison for Secrets',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Cryptography (Crypto 101)',
    prompt:
      'A naive string/byte comparison (==, or a hand-rolled loop that returns early on the first ' +
      'mismatch) leaks information through timing: it returns faster when the first byte is wrong than ' +
      'when the first ten bytes happen to match. Given enough repeated attempts, that timing difference is ' +
      'real, measurable, and has been used in genuine timing-attack research to recover secrets (API keys, ' +
      'HMAC signatures, session tokens) one byte at a time. The fix is a constant-time comparison that ' +
      'always checks every byte regardless of where the first mismatch is.\n\n' +
      "Python's real hmac module ships exactly this: hmac.compare_digest(a, b). Write " +
      'is_valid_secret(provided, expected) that uses hmac.compare_digest to compare the two strings safely ' +
      'and returns the boolean result — the whole point of this exercise is knowing this function exists ' +
      'and reaching for it instead of writing your own comparison.',
    starterCode:
      'import hmac\n\n' +
      'def is_valid_secret(provided, expected):\n' +
      '    # TODO: use hmac.compare_digest for a constant-time comparison\n' +
      '    pass\n',
    hints: [
      'hmac.compare_digest(a, b) works on both str and bytes (as long as both arguments are the same type) and always runs in time proportional to the length of the inputs, not where the first difference occurs.',
      'This is a one-line function — just return the result of compare_digest directly.',
      'Never use == for comparing secrets, API keys, tokens, or HMAC/signature values in real code — compare_digest is the correct tool every time.',
    ],
    solution:
      'import hmac\n\n' +
      'def is_valid_secret(provided, expected):\n' +
      '    return hmac.compare_digest(provided, expected)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("matching secrets return True", is_valid_secret("sk_live_abc123", "sk_live_abc123"), True)\n' +
      '__check__("mismatched secrets return False", is_valid_secret("sk_live_abc123", "sk_live_xyz789"), False)\n' +
      '__check__("different-length secrets return False", is_valid_secret("short", "much_longer_secret"), False)\n' +
      '__check__("empty strings compare equal", is_valid_secret("", ""), True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
