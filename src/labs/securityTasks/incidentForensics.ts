import type { CodeTask } from '../codeTypes';

export const SECURITY_INCIDENT_FORENSICS_TASKS: CodeTask[] = [
  {
    id: 'sec-incident-01',
    title: 'Triage Brute-Force Attempts from SSH Auth Logs',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Incident Response & Forensics (NIST 800-61 / 800-86)',
    prompt:
      'This is the everyday first step of real incident detection: an SSH server logs every failed login ' +
      'to a file in the exact format shown below (this is genuine OpenSSH log wording, not a simplified ' +
      'stand-in), and a SOC analyst — or a script — scans it for source IPs hammering the login prompt.\n\n' +
      'Write find_bruteforce_ips(log_lines, threshold=5) where log_lines is a list of raw log line ' +
      'strings, some of which look like:\n' +
      '  "Jul 28 03:14:07 web01 sshd[2041]: Failed password for admin from 203.0.113.7 port 51514 ssh2"\n' +
      '  "Jul 28 03:14:09 web01 sshd[2041]: Failed password for invalid user root from 198.51.100.9 port 40233 ssh2"\n' +
      'and others are unrelated (successful logins, other services). Extract the source IP from every ' +
      '"Failed password ... from <ip> port ..." line (note the optional "invalid user" wording — both ' +
      'forms must match), count failures per IP, and return the IPs with count >= threshold as a list, ' +
      'sorted by descending attempt count (ties broken alphabetically by IP).',
    starterCode:
      'import re\n' +
      'from collections import Counter\n\n' +
      'def find_bruteforce_ips(log_lines, threshold=5):\n' +
      '    # TODO: regex-extract the source IP from each "Failed password ... from <ip> ..." line,\n' +
      '    # count per IP, and return IPs at/above threshold, sorted by count desc then IP asc\n' +
      '    pass\n',
    hints: [
      'A regex like r"Failed password for (?:invalid user )?\\S+ from (\\d+\\.\\d+\\.\\d+\\.\\d+)" handles both log wordings in one pattern — the (?:...) group is optional and non-capturing.',
      'Use collections.Counter to tally IPs, then filter to items with count >= threshold.',
      'Sort with key=lambda x: (-x[1], x[0]) to get count descending, then IP ascending as a tiebreaker.',
    ],
    solution:
      'import re\n' +
      'from collections import Counter\n\n' +
      'def find_bruteforce_ips(log_lines, threshold=5):\n' +
      '    pattern = re.compile(r"Failed password for (?:invalid user )?\\S+ from (\\d+\\.\\d+\\.\\d+\\.\\d+)")\n' +
      '    counts = Counter()\n' +
      '    for line in log_lines:\n' +
      '        m = pattern.search(line)\n' +
      '        if m:\n' +
      '            counts[m.group(1)] += 1\n' +
      '    suspects = [(ip, c) for ip, c in counts.items() if c >= threshold]\n' +
      '    suspects.sort(key=lambda x: (-x[1], x[0]))\n' +
      '    return [ip for ip, _ in suspects]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'log1 = (\n' +
      '    ["Jul 28 03:14:0{} web01 sshd[2041]: Failed password for admin from 203.0.113.7 port 51514 ssh2".format(i) for i in range(6)]\n' +
      '    + ["Jul 28 03:15:0{} web01 sshd[2041]: Failed password for invalid user root from 198.51.100.9 port 40233 ssh2".format(i) for i in range(2)]\n' +
      '    + ["Jul 28 03:16:00 web01 sshd[2041]: Accepted password for alice from 192.0.2.5 port 51500 ssh2"]\n' +
      ')\n' +
      '__check__("flags IP over threshold, ignores IP under threshold and successful logins", find_bruteforce_ips(log1, threshold=5), ["203.0.113.7"])\n\n' +
      'log2 = (\n' +
      '    ["x sshd: Failed password for bob from 10.0.0.1 port 1 ssh2" for _ in range(10)]\n' +
      '    + ["x sshd: Failed password for invalid user root from 10.0.0.2 port 1 ssh2" for _ in range(7)]\n' +
      ')\n' +
      '__check__("multiple suspects sorted by attempt count descending", find_bruteforce_ips(log2, threshold=5), ["10.0.0.1", "10.0.0.2"])\n\n' +
      '__check__("no suspects when nothing crosses the threshold", find_bruteforce_ips(["x Failed password for a from 1.2.3.4 port 1 ssh2"], threshold=5), [])\n' +
      '__check__("empty log", find_bruteforce_ips([], threshold=5), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-forensics-01',
    title: 'Verify Evidence Integrity with a SHA-256 Hash Manifest',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Incident Response & Forensics (NIST 800-61 / 800-86)',
    prompt:
      'This is real digital-forensics chain-of-custody practice: at the moment evidence (a disk image, a ' +
      'log file, anything) is collected, an investigator computes and records its cryptographic hash. ' +
      'Anyone can later re-hash the file and compare — an exact match proves the bytes have not changed ' +
      'since collection; any mismatch, however tiny, proves tampering or corruption.\n\n' +
      'Write verify_evidence_integrity(evidence_files, manifest) using Python\'s real hashlib.sha256. ' +
      'evidence_files is a dict {filename: bytes} of what you currently have on disk; manifest is a dict ' +
      '{filename: expected_sha256_hex} recorded at collection time. Return a dict {filename: status} for ' +
      'every filename in the manifest, where status is:\n' +
      '- "MISSING" if the filename is not in evidence_files at all\n' +
      '- "TAMPERED" if it is present but hashlib.sha256(bytes).hexdigest() does not match the manifest\n' +
      '- "OK" if the hash matches exactly',
    starterCode:
      'import hashlib\n\n' +
      'def verify_evidence_integrity(evidence_files, manifest):\n' +
      '    # TODO: for each filename in manifest, compare its current SHA-256 to the recorded one\n' +
      '    pass\n',
    hints: [
      'Loop over manifest.items() — you only need to report on files the manifest actually expects.',
      'hashlib.sha256(evidence_files[filename]).hexdigest() gives the current hash as a lowercase hex string, directly comparable to the manifest value.',
      'Check for the filename\'s presence in evidence_files before hashing it, or you will get a KeyError instead of a clean "MISSING" result.',
    ],
    solution:
      'import hashlib\n\n' +
      'def verify_evidence_integrity(evidence_files, manifest):\n' +
      '    result = {}\n' +
      '    for filename, expected_hash in manifest.items():\n' +
      '        if filename not in evidence_files:\n' +
      '            result[filename] = "MISSING"\n' +
      '            continue\n' +
      '        actual_hash = hashlib.sha256(evidence_files[filename]).hexdigest()\n' +
      '        result[filename] = "OK" if actual_hash == expected_hash else "TAMPERED"\n' +
      '    return result\n',
    testCode:
      'import hashlib\n' +
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'disk_image = b"original disk image bytes captured at seizure time"\n' +
      'log_file = b"raw firewall log contents"\n\n' +
      'manifest = {\n' +
      '    "disk_image.dd": hashlib.sha256(disk_image).hexdigest(),\n' +
      '    "firewall.log": hashlib.sha256(log_file).hexdigest(),\n' +
      '    "missing.bin": hashlib.sha256(b"never collected").hexdigest(),\n' +
      '}\n\n' +
      'evidence_files = {\n' +
      '    "disk_image.dd": disk_image,\n' +
      '    "firewall.log": log_file + b" -- edited by someone later",\n' +
      '}\n\n' +
      '__check__(\n' +
      '    "detects intact, tampered, and missing evidence",\n' +
      '    verify_evidence_integrity(evidence_files, manifest),\n' +
      '    {"disk_image.dd": "OK", "firewall.log": "TAMPERED", "missing.bin": "MISSING"},\n' +
      ')\n' +
      '__check__("empty manifest yields empty report", verify_evidence_integrity(evidence_files, {}), {})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
