import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LinuxLoggingAndAuditing() {
  return (
    <div className="prose-hh">
      <h1>Linux Logging &amp; Auditing</h1>
      <p>A Linux investigation often begins with a practical question: what did this account or service do, and when? The answer is rarely in one file. Programs emit application messages, system services report state changes, the kernel reports its own events, and the audit subsystem records only behavior selected by configured rules. Each source has different fields, time semantics, retention and blind spots. This lesson teaches how to find available evidence, interpret it cautiously and explain what records establish.</p>
      <h2>Understand the logging path before searching</h2>
      <p>On a systemd distribution, <code>systemd-journald</code> collects structured messages from the kernel, services and applications. A syslog daemon may route selected messages to text files or remote collectors. Applications can also write directly to their own files or a container logging driver. The arrangement depends on distribution, software, configuration and whether persistent journal storage is enabled. An empty file does not prove an event did not occur: the host may use another service name, destination, retention window, or no rule that records it.</p>
      <CodeBlock label="Common locations and their purpose">{`/var/log/auth.log   common on Debian/Ubuntu: authentication messages
/var/log/secure      common on RHEL-family systems: authentication messages
/var/log/syslog      common on Debian/Ubuntu: general system messages
/var/log/messages    common on RHEL-family systems: general messages
/var/log/audit/      auditd records, when that service is configured

journalctl           query the systemd journal
journalctl -k        kernel messages in the journal
journalctl -u NAME   entries attributed to one systemd unit`}</CodeBlock>
      <p>These paths are conventions, not a universal Linux standard. SSH might be named <code>ssh.service</code> or <code>sshd.service</code>; some hosts write authentication messages only to the journal. Identify the OS, logging services, relevant units and available boots before concluding that data is missing. Record timezone and host identity with every time range.</p>
      <CodeBlock label="A bounded first look at journal data">{`cat /etc/os-release
journalctl --list-boots
systemctl list-units --type=service | grep -E 'ssh(d)?\\.service'

# Substitute the unit and time range observed on this host.
journalctl --since "2026-10-15 08:00:00" --until "2026-10-15 09:00:00" \\
  -u ssh.service --no-pager

# Inspect structured fields for a small result set.
journalctl --since "2026-10-15 08:00:00" -u ssh.service \\
  -o json --no-pager | head -n 5`}</CodeBlock>
      <p>JSON output can expose fields such as <code>_HOSTNAME</code>, <code>_SYSTEMD_UNIT</code>, <code>_PID</code>, <code>MESSAGE</code> and journal timestamps. A timestamp from one host cannot automatically be compared with another; inspect clock synchronization and timezone, and distinguish event time from collector receive time. When exporting records, preserve the query, host, time window and a cryptographic hash. An export is a derived artifact, so retain acquisition details and source data where policy permits.</p>
      <h2>Read authentication events as evidence, not a session transcript</h2>
      <p>Authentication logs may record an SSH attempt, PAM decision, sudo authorization or session opening. These answer different questions. Successful authentication does not prove that a command ran, and a sudo record may not include full program output or every later action. Correlate it with login UID, process ID, source address, service logs, shell history and remote telemetry where available. Confirm whether an address field refers to the remote peer, local socket or collector before describing it as an origin.</p>
      <p>Repeated failures can result from a typo, expired automation secret, health check or hostile activity. Compare account, source, cadence, authentication method, success events and expected maintenance. Group related attempts, but do not label a pattern malicious from one threshold alone. State the observations, baseline and remaining uncertainty.</p>
      <h2>Use the Linux Audit Framework for selected behavior</h2>
      <p>The Linux Audit Framework records events selected by rules loaded into the kernel audit subsystem; <code>auditd</code> reads and stores resulting records. It can capture selected system calls, identities, executable paths and file operations even when an application does not write its own explanatory log. It does not automatically capture every command or file read. Coverage depends on loaded rules, architecture, kernel and userspace support, exclusions, backlog capacity and storage. Broad rules can generate substantial volume and affect performance, so design them around a detection question and test them on the target distribution.</p>
      <CodeBlock label="Check audit health, then test one scoped rule in a lab">{`sudo auditctl -s                 # enabled state and lost/backlog counters
sudo auditctl -l                 # rules currently loaded in the kernel
sudo ausearch -ts today -m USER_AUTH,USER_LOGIN
sudo aureport --summary

# In an authorized disposable lab, record execve for /usr/bin/id.
sudo auditctl -a always,exit -F arch=b64 -S execve \\
  -F exe=/usr/bin/id -k lesson_exec_id

# Trigger /usr/bin/id yourself, then inspect the grouped event.
sudo ausearch -k lesson_exec_id -i`}</CodeBlock>
      <p>Audit events may contain several records sharing one event serial number. A syscall record can be accompanied by path, user, process and credential records; read the group instead of treating one line as the entire action. On multi-architecture systems, rules may need architecture-specific coverage. Verify a rule by performing a controlled test action, searching by its key, and checking that actor, operation and result fields appear.</p>
      <p>Rules entered through <code>auditctl</code> are runtime rules and may not survive reboot. Persistent configuration is normally managed through the distribution's audit rules directory and loader, often <code>/etc/audit/rules.d/</code> and <code>augenrules</code>. Follow configuration management and change control. The older <code>-w</code> file-watch syntax is deprecated in current auditctl documentation; syscall-form rules are preferred for new configurations. Review loaded rules after changes and monitor lost-event counters so a logging outage is not mistaken for a quiet host.</p>
      <Callout variant="tip"><p>Audit policy is a measurement design: define the behavior to observe, the identity and resource context needed to explain it, and the expected volume. Test whether the event is generated, retained and forwarded. This is the same detection-engineering loop used for SIEM rules, applied to one host.</p></Callout>
      <h2>Shell history is a convenience feature, not an audit log</h2>
      <p>Bash history helps users recall interactive commands. It may omit non-interactive shell commands, be written only when a shell exits, or reflect user configuration. It does not reliably establish the process that executed a command, complete arguments, exit status or exact time. Missing or unexpectedly small history is an investigative lead, not proof that a user did or concealed a specific action.</p>
      <CodeBlock label="Compare history with independent host sources">{`# Read metadata and a limited number of entries without modifying the file.
stat ~/.bash_history
tail -n 40 ~/.bash_history

# Compare a known time range with service and audit sources.
journalctl --since "2026-10-15 08:00:00" --until "2026-10-15 09:00:00" \\
  -u ssh.service --no-pager
sudo ausearch -ts today -m USER_AUTH,USER_LOGIN,EXECVE -i

# Note what each source can and cannot establish.`}</CodeBlock>
      <Callout variant="warn"><p>An administrator-level compromise can undermine records stored on that host. Forwarding selected logs to a separately administered collector reduces dependence on local files, but does not make collection complete or automatically immutable. Restrict collector access, monitor forwarding failures and dropped events, protect retention controls separately, and preserve source identity and time context. A detection can only find behavior represented in events the collector actually receives.</p></Callout>
      <h2>Investigate gaps without assuming intent</h2>
      <p>Gaps can result from normal rotation, reboot, retention settings, service reconfiguration, full disks, queue overflow, forwarding outages or deliberate interference. Identify the missing host, source, time range and expected event volume. Compare the local journal, audit counters, rotated files, remote collector and other systems that observed the activity. A gap alone does not prove anti-forensics; record competing explanations and evidence that would distinguish them.</p>
      <CodeBlock label="A practical logging-health checklist">{`sudo auditctl -s              # enabled state and lost-record counters
journalctl --list-boots       # retained boot history
journalctl --disk-usage       # journal storage usage
timedatectl status            # clock synchronization state

# Validate collector receipt and retention for this host and time range.
# Compare event time, receive time, hostname and boot/session identifiers.`}</CodeBlock>
      <p>In case notes, separate an observation (“the journal records a successful SSH authentication at 08:14 UTC”) from an inference (“the account may have been used interactively”) and an unknown (“the command after login is absent from retained sources”). This keeps the investigation reproducible and prevents missing records from becoming unsupported conclusions.</p>
      <h2>References</h2>
      <p>Read local manuals for <code>journalctl</code>, <code>auditctl</code>, <code>ausearch</code> and <code>aureport</code>, because installed versions and distribution defaults matter. The upstream <a href="https://man7.org/linux/man-pages/man8/auditctl.8.html" target="_blank" rel="noreferrer">auditctl manual</a> explains rule fields and deprecated watch syntax; the <a href="https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/risk_reduction_and_recovery_operations/auditing-the-system" target="_blank" rel="noreferrer">Red Hat audit guide</a> describes persistent rule configuration. Adapt examples only in an authorized lab or managed host.</p>
    </div>
  );
}
