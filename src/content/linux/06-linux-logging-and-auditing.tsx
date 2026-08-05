import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LinuxLoggingAndAuditing() {
  return (
    <div className="prose-hh">
      <h1>Linux Logging & Auditing</h1>
      <p>
        Every previous lesson in this module focused on the offensive side — navigating, escalating, scripting.
        This lesson flips to what a Linux system actually records about everything you just learned to do,
        connecting directly to the SOC modules' log-analysis material and giving you the defender's view of
        your own attack techniques.
      </p>

      <h2>syslog and journald: where Linux logs actually live</h2>
      <CodeBlock label="the modern Linux logging stack">{`/var/log/auth.log (Debian/Ubuntu) or /var/log/secure (RHEL/CentOS)
  -- authentication events: SSH logins, sudo usage, su, PAM events
/var/log/syslog or /var/log/messages
  -- general system messages, kernel events, service start/stop

journalctl                    # modern systemd-based distros centralize
                                 logs in a structured binary journal instead
                                 of (or alongside) plain text files
journalctl -u sshd              # logs for one specific systemd unit
journalctl --since "1 hour ago"   # time-filtered, exactly like grep-ing a
                                     timestamp range out of a flat log file
journalctl -f                       # follow mode, the journald equivalent
                                     of tail -f`}</CodeBlock>

      <h2>auditd: the kernel-level audit framework</h2>
      <p>
        Where syslog captures what services choose to report, the Linux Audit Framework (auditd) hooks
        directly into the kernel's syscall layer — capable of logging specific system calls, file access, or
        command execution regardless of whether the responsible process ever writes its own log line at all.
      </p>
      <CodeBlock label="auditd rules — watching exactly what an attacker touches">{`# Watch a specific sensitive file for any write access, tagged for search:
auditctl -w /etc/shadow -p wa -k shadow_changes

# Watch for execution of a specific binary anywhere on the system:
auditctl -a always,exit -F arch=b64 -F path=/usr/bin/nc -F perm=x -k netcat_exec

ausearch -k shadow_changes         # search logged events by the tag above
aureport --summary                   # a summarized view across all
                                        collected audit events`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is the exact detection-engineering discipline from the SOC Detection Engineering module, applied
          at the single-host level: <code>auditctl</code> rules are, structurally, the same idea as a Sigma
          rule or a SIEM correlation rule — define what SPECIFIC behavior is worth flagging, then have the
          system surface it automatically rather than relying on someone to notice it in a raw log stream.
        </p>
      </Callout>

      <h2>Bash history: a log an attacker can trivially manipulate — and why that itself is a signal</h2>
      <CodeBlock label="the attacker's-eye view of this module's own Lesson 4 material">{`unset HISTFILE                    # disables history logging for this session
export HISTSIZE=0                   # or set it to zero going forward
history -c                            # clears the in-memory history buffer
rm ~/.bash_history                      # or just delete the file directly

-- ".bash_history is empty or missing on an account that clearly performed
   significant activity" is ITSELF a detection signal a defender should
   treat with suspicion -- the absence of an expected log is frequently as
   diagnostically useful as the log's presence, echoing the SOC Incident
   Response module's investigation-methodology lesson`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This is precisely why mature environments forward logs to a centralized, remote SIEM in near-real-time
          (the SOC SIEM module's entire premise) rather than trusting a local log file alone — once an attacker
          has root, EVERY local log source in this lesson, including auditd's own logs, is something they can
          tamper with or delete. A remote, append-only log destination the compromised host can't reach back
          into is the actual defense against this, not a stronger local logging configuration alone.
        </p>
      </Callout>

      <h2>Common attacker anti-forensics techniques, and their traces</h2>
      <CodeBlock label="what to check for during a Linux compromise investigation">{`- Log file TIMESTAMPS with gaps or resets (touch can forge mtimes, but
  rarely resets EVERY related timestamp consistently)
- Log file SIZE that doesn't match expected activity volume for the time
  period (a log that should show hours of activity but is suspiciously
  small or empty)
- utmp/wtmp tampering (the binary files backing "who"/"last") -- tools
  exist to selectively remove login records, but doing so consistently
  across every place a login is recorded is easy to get wrong`}</CodeBlock>

      <p>
        With how Linux actually records (and how attackers try to un-record) activity covered, the next lesson
        goes deeper into the kernel itself — privilege escalation techniques that exploit the kernel directly
        rather than misconfiguration, and the CVE research process behind them.
      </p>
    </div>
  );
}
