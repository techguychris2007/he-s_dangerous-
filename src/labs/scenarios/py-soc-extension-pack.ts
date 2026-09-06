import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'sec-workstation', user: 'root', root: dir({ root: dir(files) }) };
}

export const pySocExtensionLabs: LabScenario[] = [
  // py-5: Building a Simple Network Sniffer & Packet Parser
  {
    id: 'py-packet-sniffer-scapy-credential-parser',
    title: 'Python: Building a Packet Sniffer & Cleartext Credential Parser',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Raw sockets and packet manipulation libraries like Scapy let security engineers inspect network traffic ' +
      'at Layer 2/3/4 directly. When legacy services transmit credentials in cleartext (HTTP Basic Auth, FTP, Telnet), ' +
      'a passive sniffer can extract usernames and passwords without sending a single probe. Review the Python sniffer ' +
      'implementation and the captured authentication stream to extract the harvested credentials.',
    objectives: [
      {
        text: 'cat /root/sniffer.py',
        why: 'Review the Python raw socket and struct parsing implementation that extracts IP/TCP headers and application payloads.',
      },
      {
        text: 'cat /root/captured_auth_stream.log',
        why: 'Inspect the captured HTTP Basic Auth and FTP plaintext credentials intercepted by the sniffer.',
      },
      {
        text: 'Decode the HTTP Authorization header from Base64 and capture the flag',
        why: 'Basic Auth headers are merely Base64-encoded strings (Authorization: Basic ...), providing zero encryption.',
      },
    ],
    hints: [
      'cat /root/sniffer.py — shows how struct.unpack("!BBHHH", ...) decodes the 20-byte IPv4 header.',
      'cat /root/captured_auth_stream.log — inspect intercepted HTTP Authorization and FTP USER/PASS transactions.',
      'echo "YWRtaW46U3VwZXJTZWNyZXRQYXNzMjAyNiE=" | base64 -d — decodes the cleartext credentials.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'sniffer.py': file(
        '#!/usr/bin/env python3\n' +
          '# Python Layer 3/4 Packet Sniffer with Scapy & Raw Sockets\n' +
          'import socket\n' +
          'import struct\n' +
          'import base64\n' +
          'import re\n\n' +
          'def parse_ip_header(raw_data):\n' +
          '    version_ihl = raw_data[0]\n' +
          '    ihl = (version_ihl & 0xF) * 4\n' +
          '    ttl, proto, src, target = struct.unpack("! 8x B B 2x 4s 4s", raw_data[:20])\n' +
          '    return socket.inet_ntoa(src), socket.inet_ntoa(target), proto, raw_data[ihl:]\n\n' +
          'def parse_tcp_payload(data):\n' +
          '    # Extract HTTP Basic Auth or FTP credentials from TCP data\n' +
          '    payload = data.decode("utf-8", errors="ignore")\n' +
          '    auth_match = re.search(r"Authorization:\\s*Basic\\s+([A-Za-z0-9+/=]+)", payload)\n' +
          '    if auth_match:\n' +
          '        encoded = auth_match.group(1)\n' +
          '        decoded = base64.b64decode(encoded).decode("utf-8", errors="ignore")\n' +
          '        return f"CRACKED HTTP BASIC AUTH: {decoded}"\n' +
          '    return None\n\n' +
          'if __name__ == "__main__":\n' +
          '    print("[*] Sniffer initialized on eth0. Listening for cleartext credential exchanges...")\n',
      ),
      'captured_auth_stream.log': file(
        '[2026-08-29 10:14:02 UTC] PACKET SNIFFED on eth0 (10.0.4.15 -> 10.0.4.80:80 [TCP])\n' +
          'GET /admin/dashboard HTTP/1.1\n' +
          'Host: internal-portal.corp.local\n' +
          'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n' +
          'Authorization: Basic YWRtaW46U3VwZXJTZWNyZXRQYXNzMjAyNiE=\n\n' +
          '[2026-08-29 10:14:03 UTC] PARSER EXTRACTED CREDENTIALS:\n' +
          '  Source: 10.0.4.15\n' +
          '  Destination: 10.0.4.80 (internal-portal.corp.local:80)\n' +
          '  Auth Type: HTTP Basic Authentication\n' +
          '  Raw Header: Authorization: Basic YWRtaW46U3VwZXJTZWNyZXRQYXNzMjAyNiE=\n' +
          '  Decoded Credential: admin:SuperSecretPass2026!\n' +
          '  -- Cleartext authentication over unencrypted HTTP exposes credentials to any Layer 2 listener --\n' +
          'flag{python_raw_socket_packet_sniffer_scapy_basic_auth_extracted}\n',
      ),
    }),
    network: [],
  },

  // soc-3: MITRE ATT&CK Coverage Mapping in Practice
  {
    id: 'soc-mitre-attack-coverage-mapping-audit',
    title: 'SOC: MITRE ATT&CK Detection Coverage Gap Analysis',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'A defensive team cannot protect against what it cannot observe. Turning MITRE ATT&CK into an operational ' +
      'framework requires systematically mapping existing detection rules against specific techniques (T1059 Command ' +
      'and Scripting Interpreter, T1053 Scheduled Task, T1078 Valid Accounts, T1003 OS Credential Dumping), ' +
      'identifying blind spots where telemetry exists but no detections are active, and remediating high-risk gaps.',
    objectives: [
      {
        text: 'cat /root/attack-coverage-matrix.json',
        why: 'Review the organizational ATT&CK coverage matrix across the 14 Enterprise tactics.',
      },
      {
        text: 'cat /root/uncovered-tactics-gap-report.txt',
        why: 'Identify which critical sub-techniques currently have 0% detection coverage despite high adversary prevalence.',
      },
      {
        text: 'cat /root/sigma-remediation-rules.yml',
        why: 'Review the Sigma detection-as-code rule developed to close the primary ATT&CK gap and capture the flag.',
      },
    ],
    hints: [
      'cat /root/attack-coverage-matrix.json',
      'cat /root/uncovered-tactics-gap-report.txt',
      'cat /root/sigma-remediation-rules.yml',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'attack-coverage-matrix.json': file(
        '{\n' +
          '  "organization": "Apex Enterprise Defense",\n' +
          '  "framework_version": "MITRE ATT&CK Enterprise v15",\n' +
          '  "tactics_coverage": {\n' +
          '    "TA0001_Initial_Access": {"total_techniques": 10, "covered": 8, "percentage": 80.0},\n' +
          '    "TA0002_Execution": {"total_techniques": 14, "covered": 12, "percentage": 85.7},\n' +
          '    "TA0003_Persistence": {"total_techniques": 20, "covered": 17, "percentage": 85.0},\n' +
          '    "TA0004_Privilege_Escalation": {"total_techniques": 14, "covered": 12, "percentage": 85.7},\n' +
          '    "TA0005_Defense_Evasion": {"total_techniques": 44, "covered": 38, "percentage": 86.4},\n' +
          '    "TA0006_Credential_Access": {"total_techniques": 18, "covered": 11, "percentage": 61.1},\n' +
          '    "TA0007_Discovery": {"total_techniques": 32, "covered": 20, "percentage": 62.5},\n' +
          '    "TA0008_Lateral_Movement": {"total_techniques": 9, "covered": 8, "percentage": 88.9},\n' +
          '    "TA0009_Collection": {"total_techniques": 17, "covered": 9, "percentage": 52.9},\n' +
          '    "TA0011_Command_and_Control": {"total_techniques": 16, "covered": 14, "percentage": 87.5},\n' +
          '    "TA0010_Exfiltration": {"total_techniques": 9, "covered": 7, "percentage": 77.8},\n' +
          '    "TA0040_Impact": {"total_techniques": 14, "covered": 12, "percentage": 85.7}\n' +
          '  }\n' +
          '}\n',
      ),
      'uncovered-tactics-gap-report.txt': file(
        'GAP ANALYSIS REPORT: PRIORITY ATT&CK BLIND SPOTS\n' +
          '=================================================\n' +
          'Assessment Date: 2026-08-20\n' +
          'Lead Threat Hunting Engineer: SOC Tier 3\n\n' +
          '[CRITICAL GAP #1] T1003.006 (DCSync / Replication Abuse)\n' +
          '  - Telemetry: Directory Service Access (Event 4662) is collected\n' +
          '  - Rule Status: MISSING. No alert configured when non-DC accounts request DS-Replication-Get-Changes-All\n' +
          '  - Risk: Domain Admin compromise without interactive logon\n\n' +
          '[CRITICAL GAP #2] T1059.001 (PowerShell EncodedCommand Execution)\n' +
          '  - Telemetry: Script Block Logging (Event 4104) is collected\n' +
          '  - Rule Status: Remediated via Sigma rule below\n\n' +
          'RECOMMENDATION: Deploy vendor-neutral Sigma rules to map detection coverage directly to ATT&CK technique IDs.\n',
      ),
      'sigma-remediation-rules.yml': file(
        'title: Suspicious PowerShell EncodedCommand Execution\n' +
          'id: 7b89f564-9f20-4a81-bb06-d218408544e3\n' +
          'status: production\n' +
          'description: Detects PowerShell executing with base64 encoded command arguments (T1059.001)\n' +
          'tags:\n' +
          '  - attack.execution\n' +
          '  - attack.t1059.001\n' +
          'logsource:\n' +
          '  category: process_creation\n' +
          '  product: windows\n' +
          'detection:\n' +
          '  selection:\n' +
          '    Image|endswith: "\\powershell.exe"\n' +
          '    CommandLine|contains:\n' +
          '      - " -enc "\n' +
          '      - " -encodedcommand "\n' +
          '      - " -e "\n' +
          '  condition: selection\n' +
          'falsepositives:\n' +
          '  - Legitimate administrative orchestration (Ansible/SCCM)\n' +
          'level: high\n' +
          '-- Closing the gap: ATT&CK technique T1059.001 is now covered across SIEM and EDR platforms --\n' +
          'flag{mitre_attack_coverage_mapping_matrix_gap_analysis_remediated}\n',
      ),
    }),
    network: [],
  },
];

