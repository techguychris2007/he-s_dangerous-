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
grep -iE "password|secret|token" memdump_strings.txt   # look for leaked credentials still in RAM`}</CodeBlock>
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
        together they're a strong signal.
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
        real DFIR (Digital Forensics and Incident Response) engagement actually unfolds.
      </p>
    </div>
  );
}
