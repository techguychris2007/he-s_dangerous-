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
find / -newer /etc/hostname -type f 2>/dev/null   # files modified more recently than a known-good reference`}</CodeBlock>

      <Callout variant="tip">
        <p>
          A single out-of-place timestamp rarely proves compromise on its own — but it tells you exactly
          where to look next. Timeline analysis is about narrowing an entire filesystem down to the
          handful of artifacts worth actually reading in detail.
        </p>
      </Callout>

      <h2>Memory forensics in one paragraph</h2>
      <p>
        Malware increasingly runs entirely in memory to avoid leaving traces on disk ("fileless" malware).
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
