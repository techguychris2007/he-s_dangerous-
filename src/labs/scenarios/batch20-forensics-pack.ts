import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 20, part 2c: Forensics (Registry Run key persistence, Amcache.hve execution evidence). Written
 *  from established high-confidence knowledge -- WebSearch was unavailable for this batch (NOTES.md
 *  batch 20). */
export const batch20ForensicsLabs: LabScenario[] = [
  // 1 — Registry Run Key Persistence Analysis
  {
    id: 'forensics-registry-run-key-persistence',
    title: 'Forensics: A Registry Run Key Reveals Malware Persistence',
    difficulty: 'Easy',
    category: 'Forensics',
    briefing:
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run (and its HKLM counterpart) is one of the ' +
      'oldest, most real, most consistently-abused Windows persistence locations: any value written there ' +
      'launches automatically at every user logon, with no scheduled task, no service, nothing beyond a ' +
      'single registry write. A value named "OneDriveUpdater" here would blend into normal startup noise by ' +
      'name alone -- but its actual command points at a script in the user\'s own Downloads folder, not any ' +
      'real Microsoft binary or installation path.',
    objectives: [
      { text: 'cat run-key-registry-export.txt', why: 'The Run key value\'s actual command is the entire finding -- a plausible-sounding name masking a script launched from Downloads, not any real Microsoft install path.' },
    ],
    hints: ['cat run-key-registry-export.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'run-key-registry-export.txt': file(
          'Registry export, HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run, WKSTN-DCHEN-08:\n' +
            '  "OneDriveUpdater" = "wscript.exe C:\\Users\\dchen\\Downloads\\invoice_helper.vbs"\n' +
            '  -- launches automatically at every logon for this user, no scheduled task or service involved --\n' +
            '     the real OneDrive updater never lives in a user\'s Downloads folder, and is never a .vbs script --\n' +
            '  flag{registry_run_key_persistence_downloads_folder_script}\n',
        ),
      }),
    }),
    network: [],
  },

  // 2 — Amcache.hve Reveals Execution of a Since-Deleted Binary
  {
    id: 'forensics-amcache-execution-evidence',
    title: 'Forensics: Amcache.hve Reveals Execution of a Since-Deleted Binary',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'Amcache.hve, a registry hive at %SystemRoot%\\AppCompat\\Programs\\Amcache.hve, records metadata ' +
      'about executables the system has encountered -- including a SHA1 hash of the binary\'s first 31MB, ' +
      'its original full file path, and a first-seen timestamp -- populated by the Application Compatibility ' +
      'subsystem independently of Prefetch. This is a genuinely distinct, independent artifact from this ' +
      'session\'s existing Prefetch execution-evidence lab: Prefetch can be disabled or its cache limited, ' +
      'and is keyed by filename, while Amcache keys by file hash and content metadata, meaning it can still ' +
      'identify a specific malicious binary even after the file itself has been deleted and Prefetch never ' +
      'recorded it at all.',
    objectives: [
      { text: 'cat amcache-parsed-entry.txt', why: 'Amcache records the SHA1 hash, original path, and first-seen time for a binary that no longer exists on disk and was never captured in Prefetch -- an independent artifact surviving both the file deletion and any Prefetch gap.' },
      { text: 'cat threat-intel-hash-lookup.txt', why: 'The recovered SHA1 hash matches a known-malicious sample in threat intelligence, confirming the deleted binary was genuinely malicious, not merely unusual.' },
    ],
    hints: ['cat amcache-parsed-entry.txt', 'cat threat-intel-hash-lookup.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'amcache-parsed-entry.txt': file(
          'Parsed Amcache.hve entry, WKSTN-RVEGA-14:\n' +
            '  Path: C:\\Users\\rvega\\AppData\\Local\\Temp\\svc_helper42.exe (file no longer present on disk)\n' +
            '  SHA1: 8f2a7c41e8b0d3f5c9a1b6e8a4d9f7b2c5e1a8d4\n' +
            '  First seen: 2026-07-30 03:14:02\n' +
            '  -- keyed by file hash and metadata, independent of Prefetch -- identifies this exact binary\n' +
            '     even though the file itself is gone and Prefetch never recorded it running at all --\n',
        ),
        'threat-intel-hash-lookup.txt': file(
          'Threat intelligence lookup, SHA1 8f2a7c41e8b0d3f5c9a1b6e8a4d9f7b2c5e1a8d4:\n' +
            '  MATCH: known commodity infostealer loader, first submitted to public sandboxes 2026-06-11\n' +
            '  flag{amcache_execution_evidence_deleted_binary_threat_intel_match}\n',
        ),
      }),
    }),
    network: [],
  },
];
