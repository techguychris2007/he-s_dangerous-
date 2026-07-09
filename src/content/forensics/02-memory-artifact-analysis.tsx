import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function MemoryArtifactAnalysis() {
  return (
    <div className="prose-hh">
      <h1>Memory &amp; Artifact Analysis</h1>
      <p>
        This lesson goes deeper on the two artifact types the labs in this module exercise directly:
        memory strings analysis and deleted-file recovery — both classic techniques you'll use in almost
        every incident response engagement.
      </p>

      <h2>Why strings extraction is a forensic examiner's first move</h2>
      <p>
        A raw memory image is mostly binary noise, but human-readable text — URLs, file paths, command
        lines, chat fragments — survives inside it as plain ASCII/Unicode sequences. Running{' '}
        <code>strings</code> against the image surfaces all of that text at once, without needing to
        fully parse the memory structure first.
      </p>
      <CodeBlock label="the real command, for context">{`strings memory.dmp > memdump_strings.txt
grep -i "http" memdump_strings.txt      # look for URLs — a common C2 indicator
grep -iE "password|secret|token" memdump_strings.txt   # look for leaked credentials still in RAM
strings -e l memory.dmp | grep -i "http"     # -e l reads UTF-16LE strings — Windows processes store
                                              #   most in-memory text this way; the default 8-bit mode
                                              #   silently misses it`}</CodeBlock>
      <p>
        The lab attached to this lesson gives you exactly this kind of output — a large, noisy strings
        dump — and the job is the same one a real examiner faces: find the one line that matters among
        hundreds that don't.
      </p>

      <h2>Reading a C2 beacon URL correctly</h2>
      <CodeBlock label="what a beacon URL usually looks like">{`http://185.220.101.47:8443/gate.php?id=WORKSTATION07`}</CodeBlock>
      <p>
        Note the structure: a raw IP (not a domain — attackers often skip DNS to avoid domain-based
        blocklists), a non-standard port, and a query parameter that looks like it's identifying the
        infected host to the C2 server by name. Each of those three details is a small IOC on its own;
        together they're a strong signal. In ATT&amp;CK terms this beacon itself maps to the Command and
        Control tactic — most commonly <code>T1071</code> (Application Layer Protocol) when it rides over
        HTTP/HTTPS like this, or <code>T1573</code> (Encrypted Channel) if the payload itself is encrypted on
        top of the transport. Naming the technique ID in your findings write-up is what lets a SOC analyst
        reading your report turn it directly into a detection rule rather than a one-off note.
      </p>

      <h2>Process and persistence artifacts inside a memory image</h2>
      <p>
        A strings sweep is a first pass, not the whole job — a fuller memory analysis (conceptually, using
        a tool like Volatility) reconstructs the actual process list, parent/child relationships, and
        loaded modules from the raw image. This matters because several of the most common persistence and
        defense-evasion techniques leave no trace on disk at all, only in the live process tree.
      </p>
      <CodeBlock label="what an examiner is looking for in the process tree, mapped to ATT&CK">{`explorer.exe (PID 1400)
  -> powershell.exe (PID 3312)         # unusual: explorer.exe rarely spawns PowerShell directly
       -> rundll32.exe (PID 3400)      # T1218.011 — Signed Binary Proxy Execution (Rundll32)
            [no visible window, network connection open to 185.220.101.47:8443]

svchost.exe (PID 812)
  [injected thread, memory region with PAGE_EXECUTE_READWRITE and no backing file]  # T1055 — Process Injection`}</CodeBlock>
      <p>
        A parent/child relationship that doesn't match how the operating system normally behaves — a
        Microsoft Office process spawning a command shell, or a legitimate system binary like{' '}
        <code>rundll32.exe</code> reaching out over the network on a port it has no ordinary business using
        — is frequently a stronger lead than any single string in the dump. This is also where scheduled
        task and registry Run key artifacts (<code>T1053</code>, <code>T1547.001</code>) surface again: a
        process alive in memory that also has a corresponding autostart entry is confirmation of both the
        immediate infection and the attacker's plan for it to survive a reboot.
      </p>

      <h2>Deleted file recovery: why "deleted" rarely means gone</h2>
      <p>
        When a file is deleted on most filesystems, only its directory entry (the pointer to its data) is
        removed — the actual data blocks aren't zeroed out until something else overwrites them. Recycle
        bin / trash mechanisms make this even easier: the OS deliberately keeps deleted files recoverable
        for a period, along with metadata about their original location and deletion time.
      </p>
      <CodeBlock label="where these artifacts typically live">{`~/.local/share/Trash/files/        # Linux desktop trash
~/.local/share/Trash/info/          # metadata: original path + deletion timestamp
$Recycle.Bin\\<SID>\\                 # Windows recycle bin, per-user
.Trashes/                            # macOS`}</CodeBlock>

      <Callout variant="tip">
        <p>
          A user claiming "I never downloaded that" is one of the most common statements an incident
          responder hears — and trash/recycle metadata, browser download history, and prefetch artifacts
          are exactly what confirms or refutes it independent of what the user remembers or admits to.
        </p>
      </Callout>

      <h2>Putting it together: an investigation narrative</h2>
      <p>
        A real investigation rarely relies on one artifact type alone. The strongest reports correlate
        multiple sources: a timeline anomaly points you to a suspicious file, a memory strings sweep
        reveals the C2 it phones home to, and trash metadata confirms how it originally arrived on the
        system. Each lab in this module gives you one piece of that puzzle — together they mirror how a
        real DFIR (Digital Forensics and Incident Response) engagement actually unfolds: conceptually,
        pulling every timestamped artifact — process creation times from memory, file modification times
        from disk, and authentication events from logs — onto one merged timeline so the sequence of events
        becomes obvious rather than something you have to hold in your head across a dozen separate tools.
      </p>
      <Callout variant="info">
        <p>
          One thing 2025-2026 DFIR engagements increasingly have to account for: as the SOC module's
          threat-hunting lesson covers, AI-accelerated intrusions can compress an entire attack chain — from
          initial access to ransomware deployment — into a matter of hours instead of the days attackers
          traditionally spent. That means the timeline an examiner needs to reconstruct is often much
          denser and narrower than it used to be, which makes precise, correlated timestamps across every
          artifact type in this lesson more important, not less.
        </p>
      </Callout>
    </div>
  );
}
