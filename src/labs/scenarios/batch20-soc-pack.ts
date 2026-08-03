import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 20, part 2d: SOC (Event 4720 new user, Event 4732 privileged group add, Sysmon 13 Run-key
 *  modification, Sysmon 22 DNS beacon). Written from established high-confidence knowledge -- WebSearch was
 *  unavailable for this batch (NOTES.md batch 20). */
export const batch20SocLabs: LabScenario[] = [
  // 1 — Event ID 4720: New User Account Creation for Persistence
  {
    id: 'soc-event-4720-new-user-account-persistence',
    title: 'SOC: Event ID 4720 Reveals a Backdoor Account Creation',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'Event ID 4720 ("A user account was created") fires every single time, with no exception, whenever a ' +
      'new local or domain account is created -- a genuinely rare, high-signal event on an already-deployed ' +
      'production server, where new legitimate accounts are provisioned through change-controlled processes, ' +
      'not created ad hoc by a database administrator account at 2 AM.',
    objectives: [
      { text: 'cat event-4720-user-created.txt', why: 'The creator account and timestamp are the entire finding -- a database admin account with no business reason to create user accounts, doing so outside business hours.' },
    ],
    hints: ['cat event-4720-user-created.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'event-4720-user-created.txt': file(
          'Windows Security Event Log, Event ID 4720, DB-PRODSQL07:\n' +
            '  New Account Name: svc_backup2\n' +
            '  Creator Subject: CORP\\dbadmin_svc (a service account, not an interactive admin identity)\n' +
            '  Time: 2026-08-01 02:14:07 (outside all documented change windows)\n' +
            '  -- Event ID 4720 fires unconditionally on every account creation -- a genuinely rare event on\n' +
            '     an already-deployed production server, and dbadmin_svc has no legitimate reason to create\n' +
            '     accounts at all --\n' +
            '  flag{event_4720_backdoor_account_created_outside_change_window}\n',
        ),
      }),
    }),
    network: [],
  },

  // 2 — Event ID 4732: Addition to a Privileged Local Group
  {
    id: 'soc-event-4732-privileged-group-membership-change',
    title: 'SOC: Event ID 4732 Reveals an Unauthorized Addition to Local Administrators',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'Event ID 4732 ("A member was added to a security-enabled local group") is the real, standard event ' +
      'for exactly this action -- and when the target group is the built-in Administrators group, this is ' +
      'one of the most direct real privilege-escalation indicators available: the newly-added account ' +
      'inherits full local administrative control the instant this event fires, no further exploitation ' +
      'needed at all.',
    objectives: [
      { text: 'cat event-4732-group-membership-change.txt', why: 'Confirms exactly which account was added to the local Administrators group, by whom, and when -- the account added has no documented business justification for administrative access on this host.' },
    ],
    hints: ['cat event-4732-group-membership-change.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'event-4732-group-membership-change.txt': file(
          'Windows Security Event Log, Event ID 4732, ACCT-WKS-19:\n' +
            '  Member Added: CORP\\jsmith\n' +
            '  Group: BUILTIN\\Administrators\n' +
            '  Subject (who made the change): CORP\\jsmith  (added themselves)\n' +
            '  -- a standard accounts-payable user account granted itself full local administrative rights --\n' +
            '     no helpdesk ticket, no change record, no legitimate process behind this action at all --\n' +
            '  flag{event_4732_self_added_to_local_administrators_group}\n',
        ),
      }),
    }),
    network: [],
  },

  // 3 — Sysmon Event ID 13 Flags a Malicious Run Key Modification
  {
    id: 'soc-sysmon-event13-registry-run-key-modification',
    title: 'SOC: Sysmon Event ID 13 Flags a Malicious Registry Run Key Write',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Sysmon Event ID 13 (RegistryEvent, Value Set) logs every write to a monitored registry value -- and a ' +
      'default Sysmon configuration specifically watches the Run/RunOnce persistence keys, since a write ' +
      'there is one of the most common real persistence mechanisms. The event captures both the process that ' +
      'made the write and the exact value written, turning "a Run key entry appeared" from something an ' +
      'analyst would only notice on a later manual registry review into something logged the instant it ' +
      'happens.',
    objectives: [
      { text: 'cat sysmon-event13-registry-value-set.txt', why: 'Captures both the writing process and the exact Run key value at the moment of the write -- confirming this specific process, not merely "something," created the persistence entry, and exactly when.' },
    ],
    hints: ['cat sysmon-event13-registry-value-set.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'sysmon-event13-registry-value-set.txt': file(
          'Sysmon Event ID 13 (RegistryEvent, Value Set), FIN-WKS-22:\n' +
            '  Image: C:\\Users\\Public\\update_helper.exe\n' +
            '  TargetObject: HKU\\S-1-5-21-...\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SecurityHealthSvc\n' +
            '  Details: "C:\\Users\\Public\\update_helper.exe -silent"\n' +
            '  -- logged the instant the write occurred, capturing exactly which process made it -- a genuine\n' +
            '     Windows Security Health Service never runs from C:\\Users\\Public\\ --\n' +
            '  flag{sysmon_event13_registry_run_key_malicious_write_captured} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 4 — Sysmon Event ID 22 Reveals C2 Beaconing via DNS Query
  {
    id: 'soc-sysmon-event22-dns-query-c2-beacon',
    title: 'SOC: Sysmon Event ID 22 Reveals C2 Beaconing via a DNS Query Pattern',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Sysmon Event ID 22 (DNSEvent, DNS query) logs every DNS resolution a monitored host performs, ' +
      'including which process issued the query -- a real, standard telemetry source specifically valuable ' +
      'because DNS is one of the few protocols nearly every outbound-blocking firewall rule still permits by ' +
      'default. A regular, unusually-precise interval (a query to the same domain every exactly 60 seconds, ' +
      'day and night, weekends included) is a real, classic C2 beaconing signature -- human-driven traffic is ' +
      'never this mechanically regular, and the querying process here is not a browser or any known ' +
      'application at all.',
    objectives: [
      { text: 'cat sysmon-event22-dns-query-pattern.txt', why: 'The exact 60-second interval and the unrecognized querying process together are the finding -- no legitimate application produces DNS queries this mechanically regular, and this process has no documented purpose on this host at all.' },
    ],
    hints: ['cat sysmon-event22-dns-query-pattern.txt'],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'sysmon-event22-dns-query-pattern.txt': file(
          'Sysmon Event ID 22 (DNSEvent), ACCT-WKS-51, filtered to one querying process over 10 minutes:\n' +
            '  Image: C:\\Windows\\Temp\\svchost32.exe  (note: NOT the real svchost.exe path, System32)\n' +
            '  QueryName: telemetry-collect.net\n' +
            '  09:00:01, 09:01:01, 09:02:01, 09:03:01, 09:04:01, 09:05:01 ... (exactly every 60 seconds, no drift)\n' +
            '  -- human/application-driven DNS traffic is never this mechanically regular -- a fixed-interval\n' +
            '     beacon to the same domain, from a process masquerading as (but not actually) svchost.exe --\n' +
            '  flag{sysmon_event22_dns_beacon_fixed_interval_masquerading_process} ---\n',
        ),
      }),
    }),
    network: [],
  },
];
