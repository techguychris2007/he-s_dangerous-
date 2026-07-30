import type { CodeTask } from '../codeTypes';

export const SECURITY_NETWORK_TASKS: CodeTask[] = [
  {
    id: 'sec-network-01',
    title: 'Parse a Raw Ethernet Frame Header',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Network Protocol Analysis',
    prompt:
      'Every packet-analysis tool — Wireshark, tcpdump, scapy — starts from the same place: a raw byte ' +
      'buffer with no structure of its own, and a protocol specification that says exactly which byte ' +
      'ranges mean what. An Ethernet frame\'s first 14 bytes are fixed: 6 bytes destination MAC address, ' +
      '6 bytes source MAC address, then a 2-byte EtherType field identifying the next-layer protocol ' +
      '(0x0800 = IPv4, 0x0806 = ARP — real, IEEE-assigned values).\n\n' +
      'Write parse_ethernet_header(frame) where frame is a bytes object at least 14 bytes long. Return a ' +
      'dict: {"dest_mac": ..., "src_mac": ..., "ethertype": ...} where each MAC is a lowercase ' +
      'colon-separated hex string like "aa:bb:cc:dd:ee:ff", and ethertype is an int.',
    starterCode:
      'def parse_ethernet_header(frame):\n' +
      '    # TODO: extract dest MAC (bytes 0-6), src MAC (bytes 6-12), and ethertype (bytes 12-14)\n' +
      '    pass\n',
    hints: [
      'Slice the frame first: dest = frame[0:6], src = frame[6:12], then the 2-byte ethertype is frame[12:14].',
      'To format 6 raw bytes as "aa:bb:cc:dd:ee:ff", use \':\'.join(f\'{b:02x}\' for b in dest) — :02x gives two-digit lowercase hex per byte.',
      'int.from_bytes(frame[12:14], "big") converts the 2-byte EtherType field to a plain int (network byte order is always big-endian).',
    ],
    solution:
      'def parse_ethernet_header(frame):\n' +
      '    dest = frame[0:6]\n' +
      '    src = frame[6:12]\n' +
      '    ethertype = int.from_bytes(frame[12:14], "big")\n' +
      '    return {\n' +
      '        "dest_mac": ":".join(f"{b:02x}" for b in dest),\n' +
      '        "src_mac": ":".join(f"{b:02x}" for b in src),\n' +
      '        "ethertype": ethertype,\n' +
      '    }\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'frame1 = bytes.fromhex("aabbccddeeff001122334455" + "0800") + b"payload data here"\n' +
      '__check__(\n' +
      '    "parses dest/src MAC and IPv4 ethertype",\n' +
      '    parse_ethernet_header(frame1),\n' +
      '    {"dest_mac": "aa:bb:cc:dd:ee:ff", "src_mac": "00:11:22:33:44:55", "ethertype": 0x0800},\n' +
      ')\n\n' +
      'frame2 = bytes.fromhex("112233445566665544332211" + "0806") + b"arp payload"\n' +
      '__check__(\n' +
      '    "parses ARP ethertype",\n' +
      '    parse_ethernet_header(frame2),\n' +
      '    {"dest_mac": "11:22:33:44:55:66", "src_mac": "66:55:44:33:22:11", "ethertype": 0x0806},\n' +
      ')\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-network-02',
    title: 'Parse an IPv4 Header',
    difficulty: 'Hard',
    language: 'python',
    category: 'Security: Network Protocol Analysis',
    prompt:
      'One layer up from Ethernet: the IPv4 header, sitting right after it in the frame. Its first byte ' +
      'packs two 4-bit fields together (version and header length), which is a genuinely common real-world ' +
      'pattern in binary protocols — you\'ll need actual bit manipulation, not just byte slicing, to pull ' +
      'them apart.\n\n' +
      'Write parse_ipv4_header(packet) where packet is a bytes object starting with a standard 20-byte ' +
      '(no-options) IPv4 header. Return a dict with:\n' +
      '- "version": the 4-bit version field (top nibble of byte 0) — should be 4\n' +
      '- "header_length": the 4-bit IHL field (bottom nibble of byte 0), converted from a word count to ' +
      'a byte count (IHL counts 4-byte words, so multiply by 4)\n' +
      '- "ttl": byte 8 (Time To Live) as an int\n' +
      '- "protocol": byte 9 as an int (6 = TCP, 17 = UDP — real IANA-assigned values)\n' +
      '- "src_ip": bytes 12-16 formatted as a dotted-quad string like "192.168.1.10"\n' +
      '- "dst_ip": bytes 16-20 formatted the same way',
    starterCode:
      'def parse_ipv4_header(packet):\n' +
      '    # TODO: unpack version/IHL from byte 0, then TTL, protocol, and both IP addresses\n' +
      '    pass\n',
    hints: [
      'byte 0 packs two 4-bit fields: version = packet[0] >> 4 shifts the top nibble down; ihl_words = packet[0] & 0x0F masks off everything but the bottom nibble.',
      'IHL is a word count (4-byte units), not a byte count — the actual header_length in bytes is ihl_words * 4.',
      'A dotted-quad IP string is just \'.\'.join(str(b) for b in the relevant 4-byte slice) — no need for any networking library.',
    ],
    solution:
      'def parse_ipv4_header(packet):\n' +
      '    version_ihl = packet[0]\n' +
      '    version = version_ihl >> 4\n' +
      '    ihl = (version_ihl & 0x0F) * 4\n' +
      '    ttl = packet[8]\n' +
      '    protocol = packet[9]\n' +
      '    src_ip = ".".join(str(b) for b in packet[12:16])\n' +
      '    dst_ip = ".".join(str(b) for b in packet[16:20])\n' +
      '    return {\n' +
      '        "version": version,\n' +
      '        "header_length": ihl,\n' +
      '        "ttl": ttl,\n' +
      '        "protocol": protocol,\n' +
      '        "src_ip": src_ip,\n' +
      '        "dst_ip": dst_ip,\n' +
      '    }\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'pkt1 = bytes([0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06,\n' +
      '              0xb1, 0xe6, 192, 168, 1, 10, 93, 184, 216, 34])\n' +
      '__check__(\n' +
      '    "parses version/IHL/TTL/protocol/addresses (TCP packet)",\n' +
      '    parse_ipv4_header(pkt1),\n' +
      '    {"version": 4, "header_length": 20, "ttl": 64, "protocol": 6, "src_ip": "192.168.1.10", "dst_ip": "93.184.216.34"},\n' +
      ')\n\n' +
      'pkt2 = bytes([0x45, 0x00, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x00, 0x80, 0x11,\n' +
      '              0x00, 0x00, 10, 0, 0, 5, 8, 8, 8, 8])\n' +
      '__check__(\n' +
      '    "parses UDP packet with different TTL",\n' +
      '    parse_ipv4_header(pkt2),\n' +
      '    {"version": 4, "header_length": 20, "ttl": 128, "protocol": 17, "src_ip": "10.0.0.5", "dst_ip": "8.8.8.8"},\n' +
      ')\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-network-03',
    title: 'Detect a SYN Port Scan from Connection Records',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Network Protocol Analysis',
    prompt:
      'A real TCP connection completes a three-way handshake: SYN, SYN-ACK, ACK. A port scanner (Nmap\'s ' +
      'default "SYN scan," a real and extremely common recon technique) sends a bare SYN to many different ' +
      'ports from one source and never completes the handshake — it just wants to see which ports reply. ' +
      'That leaves a very distinctive signature in connection logs: one source IP hitting an unusually ' +
      'large number of distinct destination ports.\n\n' +
      'Write detect_syn_scan(connections, threshold=10) where connections is a list of dicts like ' +
      '{"src_ip": "203.0.113.50", "dst_port": 22, "flags": "SYN"}. Count, per source IP, the number of ' +
      '*distinct* destination ports it sent a bare "SYN" to (ignore any other flags value, like ' +
      '"SYN-ACK"). Return a sorted list of source IPs whose distinct-port count is >= threshold.',
    starterCode:
      'from collections import defaultdict\n\n' +
      'def detect_syn_scan(connections, threshold=10):\n' +
      '    # TODO: count distinct dst_port values per src_ip among SYN-flagged records,\n' +
      '    # return sorted source IPs at or above threshold\n' +
      '    pass\n',
    hints: [
      'defaultdict(set) is exactly the right shape here: one growing set of ports per source IP, no manual "if key not in dict" checks needed.',
      'Only count a record if conn["flags"] == "SYN" exactly — a completed connection\'s "SYN-ACK" or "ACK" records should not be counted as scan attempts.',
      'Build the final list with a list comprehension checking len(ports) >= threshold, then sort it before returning.',
    ],
    solution:
      'from collections import defaultdict\n\n' +
      'def detect_syn_scan(connections, threshold=10):\n' +
      '    ports_by_src = defaultdict(set)\n' +
      '    for conn in connections:\n' +
      '        if conn["flags"] == "SYN":\n' +
      '            ports_by_src[conn["src_ip"]].add(conn["dst_port"])\n' +
      '    return sorted([ip for ip, ports in ports_by_src.items() if len(ports) >= threshold])\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'scan_traffic = (\n' +
      '    [{"src_ip": "203.0.113.50", "dst_port": p, "flags": "SYN"} for p in range(20, 35)]\n' +
      '    + [{"src_ip": "198.51.100.7", "dst_port": 443, "flags": "SYN"}, {"src_ip": "198.51.100.7", "dst_port": 443, "flags": "SYN-ACK"}]\n' +
      ')\n' +
      '__check__("flags a wide port scan, ignores a normal single connection", detect_syn_scan(scan_traffic, threshold=10), ["203.0.113.50"])\n\n' +
      '__check__(\n' +
      '    "below threshold is not flagged",\n' +
      '    detect_syn_scan([{"src_ip": "1.2.3.4", "dst_port": p, "flags": "SYN"} for p in range(5)], threshold=10),\n' +
      '    [],\n' +
      ')\n\n' +
      'multi = (\n' +
      '    [{"src_ip": "A", "dst_port": p, "flags": "SYN"} for p in range(12)]\n' +
      '    + [{"src_ip": "B", "dst_port": p, "flags": "SYN"} for p in range(15)]\n' +
      ')\n' +
      '__check__("multiple scanners sorted", detect_syn_scan(multi, threshold=10), ["A", "B"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
