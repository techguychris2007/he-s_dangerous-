import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ForensicsFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Digital Forensics Fundamentals</h1>
      <p>
        Digital forensics is the discipline of reconstructing what happened on a system after the fact —
        from a full incident (ransomware, data theft) down to a single question ("did this employee open
        that attachment?"). It's methodical, evidence-driven, and unlike offensive work, every step must
        be defensible if it ends up in a legal proceeding.
      </p>

      <h2>The core principle: preserve, then analyze</h2>
      <p>
        The first rule of forensics is never analyze the original evidence directly — always work from a
        forensic copy (a bit-for-bit image), preserving the original untouched with a cryptographic hash
        recorded at acquisition time. If your analysis process itself modifies timestamps or file
        contents, you've contaminated the evidence.
      </p>
      <CodeBlock label="chain of custody, conceptually">{`1. IDENTIFY    — what device/data is relevant?
2. ACQUIRE       — create a forensic image (e.g. with dd, FTK Imager), hash it (SHA-256)
3. PRESERVE        — store the original write-protected; work only from copies
4. ANALYZE           — examine the copy; document every step and finding
5. REPORT              — findings must be reproducible by another examiner given the same evidence`}</CodeBlock>

      <h2>Write-blockers: making "don't touch the original" a hardware guarantee</h2>
      <p>
        "Work only from copies" is a discipline; a <strong>write-blocker</strong> is what turns it into a
        physical guarantee. It's a hardware device (or, less commonly, a software equivalent) sitting between
        the original drive and the acquisition machine that physically intercepts and rejects any write
        command sent to it — so even an examiner's own accidental command, or an OS auto-mounting a drive and
        silently updating its own metadata, cannot modify the original evidence, no matter what happens on
        the analysis side. Real forensic acquisition almost never happens without one connected, precisely
        because "I was careful" is not a defensible standard in a legal proceeding — "it was physically
        impossible to write to the original" is.
      </p>

      <h2>The three artifact categories you'll use constantly</h2>
      <ul>
        <li><strong>Filesystem metadata</strong> — creation/modification/access timestamps, file
        permissions, and deleted-file remnants that haven't been overwritten yet.</li>
        <li><strong>Memory (RAM) artifacts</strong> — running processes, network connections, and
        injected code that only exist while the system is powered on — captured via a memory dump.</li>
        <li><strong>Log artifacts</strong> — the same auth/access/application logs from the SOC module,
        now examined for a specific historical timeline rather than a live alert.</li>
      </ul>

      <h2>Timeline analysis: the forensic examiner's favorite technique</h2>
      <p>
        Most operating systems record at least three timestamps per file: when it was created, last
        modified, and last accessed. A file that claims to be part of a routine deployment but carries a
        modification timestamp from three days later than every other file in that deployment is exactly
        the kind of anomaly a timeline reveals — and exactly what the first lab in this module has you
        find.
      </p>
      <CodeBlock label="reading timestamps during an investigation">{`ls -la --time-style=full-iso /var/www/html    # long listing with full timestamp precision
find / -newer /etc/hostname -type f 2>/dev/null   # files modified more recently than a known-good reference
stat /var/www/html/upload.php                       # MAC(B) times for a single file of interest — Modify, Access, Change (and Birth, if the filesystem records it)
find / -mtime -1 -type f 2>/dev/null                  # everything modified in the last 24 hours, system-wide`}</CodeBlock>
      <p>
        A single timestamp is a data point; a <strong>timeline</strong> is dozens of data points from
        different sources — filesystem metadata, log entries, registry key last-write times, browser
        history — laid out on one shared axis so patterns become visible that no individual artifact would
        reveal alone. Conceptually, this is what timeline-correlation tooling in a real DFIR case does: it
        ingests filesystem metadata, event logs, and other timestamped artifacts, normalizes them all to one
        clock, and produces a single merged, sortable timeline (sometimes called a "super timeline"). The
        value isn't the tool itself — it's that correlation across sources turns "this file changed" and
        "this account logged in" from two unrelated facts into "this account logged in, then two minutes
        later this file changed," which is a very different, much more actionable finding. Reconstructing
        that timeline has gotten harder in one specific way industry-wide: as attacker dwell time compresses
        — AI-accelerated intrusions can now move from initial access to impact in hours rather than the
        days-to-weeks that used to be typical — the window of relevant events an examiner needs to correlate
        gets narrower and denser, and second-level timestamp precision across sources matters more than it
        used to.
      </p>

      <Callout variant="tip">
        <p>
          A single out-of-place timestamp rarely proves compromise on its own — but it tells you exactly
          where to look next. Timeline analysis is about narrowing an entire filesystem down to the
          handful of artifacts worth actually reading in detail.
        </p>
      </Callout>

      <h2>Persistence artifacts: what to look for and why</h2>
      <p>
        Once an attacker is in, they rarely want to re-exploit the same vulnerability every time a machine
        reboots — so they install a persistence mechanism, and persistence mechanisms are some of the most
        reliable artifacts a forensic examiner can find, because they're designed to survive precisely so
        they'll still be there when you look.
      </p>
      <CodeBlock label="common persistence locations, mapped to MITRE ATT&CK">{`Registry Run keys / Startup folder     — T1547.001 (Boot or Logon Autostart Execution)
reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
reg query "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"

Scheduled tasks / cron jobs             — T1053 (Scheduled Task/Job)
schtasks /query /fo LIST /v            # Windows
crontab -l -u <username>               # Linux, per-user
cat /etc/cron.d/*                      # Linux, system-wide

New/modified services                  — T1543 (Create or Modify System Process)
sc query state= all                    # Windows service enumeration`}</CodeBlock>
      <p>
        Tying a finding to a specific ATT&amp;CK ID like <code>T1547.001</code> isn't just jargon for its
        own sake — it's what lets this finding slot directly into the same shared vocabulary the SOC module
        covers, so a hunt hypothesis, a detection rule, and a forensic finding about the exact same
        technique can all reference each other unambiguously.
      </p>

      <h2>Memory forensics in one paragraph</h2>
      <p>
        Malware increasingly runs entirely in memory to avoid leaving traces on disk ("fileless" malware) —
        a technique that also frequently pairs with process injection (ATT&amp;CK <code>T1055</code>) to
        hide inside a legitimate process's memory space rather than running as its own visible process.
        Tools like Volatility parse a memory image to reconstruct running processes, open network
        connections, and even recover encryption keys still resident in RAM. The simpler technique covered
        in this module's second lab — running <code>strings</code> across a memory dump to surface
        human-readable text like URLs and file paths — is the fastest way to get an initial lead before
        reaching for heavier tooling.
      </p>

      <Callout variant="danger">
        <p>
          Forensic examination of a real device you don't own or have explicit authorization to investigate
          is both a serious legal exposure and an ethics violation, even with "good intentions." Practice
          exclusively on lab evidence, your own systems, or under a documented incident response engagement.
        </p>
      </Callout>
    </div>
  );
}
