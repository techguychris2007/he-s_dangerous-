import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function MemoryForensicsWithVolatility() {
  return (
    <div className="prose-hh">
      <h1>Memory Forensics Deep Dive with Volatility</h1>
      <p>
        Lesson 2 introduced memory analysis at the strings-extraction level — fast, useful, but blind to a
        memory dump's actual STRUCTURE. This lesson goes deeper with Volatility, the standard open-source
        memory forensics framework, which parses a memory image's internal data structures directly rather
        than just scanning for readable text.
      </p>
      <p>
        By the end you should be able to acquire a memory image without spoiling it, run a repeatable
        Volatility 3 triage, explain why two plugins that both "list processes" can disagree, and write down
        findings in a way another analyst can reproduce.
      </p>

      <h2>Step zero: acquiring memory without spoiling it</h2>
      <p>
        Analysis can only be as good as the image. RAM changes every millisecond, so you never get a
        perfect snapshot — the goal is a <strong>documented, minimally invasive</strong> capture. Every tool
        you run on a live host changes some memory, so run as little as possible, run it from external
        media, and write the image to external storage rather than the suspect disk.
      </p>
      <CodeBlock label="a typical acquisition record (Windows host, WinPmem)">{`# 1. Run the acquisition tool from a trusted USB device, writing to that device
E:\\> winpmem_mini_x64.exe E:\\case-0412\\host-ws17.raw

# 2. Hash the image immediately and record the value in your case notes
E:\\> certutil -hashfile E:\\case-0412\\host-ws17.raw SHA256

# 3. Record: who captured it, when (UTC), which tool and version, the host
#    name, and anything you ran on the host before the capture`}</CodeBlock>
      <p>
        Common acquisition tools are WinPmem, DumpIt, Magnet RAM Capture and FTK Imager on Windows, and LiME
        or Microsoft's AVML on Linux. A virtual machine is easier still: pausing or snapshotting the VM gives
        you its memory file without running anything inside the guest.
      </p>

      <h2>Why structured memory analysis finds what strings alone misses</h2>
      <CodeBlock label="the core capability gap between the two approaches">{`strings memory.dmp | grep -i password
  -- fast, but only finds PLAINTEXT strings that happen to still be
     sitting in memory -- misses encrypted/obfuscated malware entirely,
     and gives no structural context (which process, what relationship to
     other processes) for anything it does find

vol -f memory.dmp windows.pslist
  -- Volatility instead parses the operating system's own internal
     process-management data structures directly out of the raw memory
     image -- recovering the FULL process tree, parent-child
     relationships, and process metadata regardless of whether any
     plaintext string related to it happens to still be resident`}</CodeBlock>
      <p>
        Volatility 3 needs <strong>symbol tables</strong> that describe the exact layout of the kernel's
        structures for the Windows build in the image. It identifies the build itself and downloads the
        matching symbols the first time it sees it, so an analysis workstation that will be offline needs the
        symbol packs downloaded in advance. Start every case with <code>windows.info</code>: if it cannot
        identify the kernel, no other plugin will give trustworthy output.
      </p>
      <CodeBlock label="confirm the image is readable before anything else">{`$ vol -f host-ws17.raw windows.info
Variable                Value
Kernel Base             0xf8066b000000
Is64Bit                 True
NtMajorVersion          10
NtBuildLab              19041.1.amd64fre.vb_release.191206-1406
SystemTime              2026-04-12 09:41:07+00:00`}</CodeBlock>
      <p>
        Note <code>SystemTime</code> — it is the moment of capture, and every timestamp you report later should
        be read against it.
      </p>

      <h2>Process tree analysis: finding what doesn't belong</h2>
      <CodeBlock label="the classic Volatility triage workflow">{`vol -f memory.dmp windows.pstree
  -- rendered as an actual parent-child TREE, not just a flat list --
     immediately surfaces obviously-wrong relationships:

  explorer.exe (PID 4102)
    └─ powershell.exe (PID 5588)         <- unusual: explorer.exe rarely
                                              spawns PowerShell directly in
                                              normal user activity
         └─ rundll32.exe (PID 5602)          <- rundll32 with NO visible
                                                  DLL argument is a classic
                                                  process-injection/LOLBin
                                                  pattern from the Malware
                                                  module's persistence lesson

vol -f memory.dmp windows.cmdline
  -- recovers the FULL command line each process was launched with,
     often revealing an attacker's exact PowerShell one-liner or
     encoded command in full, unredacted detail`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This directly extends the Malware module's Dynamic Analysis & Sandboxing lesson — the same
          "look for a process tree relationship that shouldn't exist" instinct, applied retroactively to a
          memory snapshot from a real incident instead of a live sandboxed detonation.
        </p>
      </Callout>
      <p>
        "Doesn't belong" only means something if you know what normal looks like. Core Windows processes
        have predictable parents, counts and paths, and attackers routinely name malware after them hoping
        nobody checks:
      </p>
      <div className="lesson-table-wrap">
        <table className="lesson-table">
          <thead><tr><th scope="col">Process</th><th scope="col">Expected parent</th><th scope="col">What should make you look twice</th></tr></thead>
          <tbody>
            <tr><th scope="row">smss.exe</th><td>System (PID 4)</td><td>More than one long-running instance; any path outside System32</td></tr>
            <tr><th scope="row">wininit.exe</th><td>smss.exe (which then exits)</td><td>More than one instance</td></tr>
            <tr><th scope="row">services.exe</th><td>wininit.exe</td><td>More than one instance, or a different parent</td></tr>
            <tr><th scope="row">lsass.exe</th><td>wininit.exe</td><td>More than one lsass, child processes of lsass, misspellings such as lsas.exe</td></tr>
            <tr><th scope="row">svchost.exe</th><td>services.exe</td><td>Any other parent; missing <code>-k</code> argument; path outside System32</td></tr>
            <tr><th scope="row">explorer.exe</th><td>userinit.exe (which then exits)</td><td>Several instances for one user; office or shell children doing network work</td></tr>
          </tbody>
        </table>
      </div>

      <h2>pslist versus psscan: catching hidden processes</h2>
      <p>
        <code>windows.pslist</code> walks the kernel's linked list of active processes — the same list Task
        Manager trusts. A rootkit can unlink its own process from that list (direct kernel object
        manipulation), and it disappears from pslist while it keeps running. <code>windows.psscan</code>
        ignores the list and instead scans the whole image for the memory signatures of process objects, so it
        also finds unlinked processes and processes that have already exited.
      </p>
      <CodeBlock label="compare the two views: the difference is the finding">{`$ vol -f host-ws17.raw windows.pslist | awk '{print $1}' | sort > pslist.txt
$ vol -f host-ws17.raw windows.psscan | awk '{print $1}' | sort > psscan.txt
$ comm -13 pslist.txt psscan.txt
6120        <- present in psscan, absent from pslist

$ vol -f host-ws17.raw windows.psscan | grep 6120
6120  952  updsvc.exe  0x9d0a1c2e3080  ...  2026-04-12 08:57:31  N/A
#                                          created            exit time: none, still running`}</CodeBlock>
      <p>
        A PID that psscan finds with <strong>no exit time</strong> but that pslist cannot see is a running,
        deliberately hidden process — one of the strongest single indicators memory forensics can give you.
        A PID with an exit time is usually just a process that finished; it is still useful for building a
        timeline.
      </p>

      <h2>Network activity recovered from memory</h2>
      <CodeBlock label="which process was talking to whom">{`$ vol -f host-ws17.raw windows.netscan
Proto  LocalAddr     LocalPort  ForeignAddr     ForeignPort  State        PID   Owner
TCPv4  10.0.4.17     49832      185.220.101.4   443          ESTABLISHED  5602  rundll32.exe
TCPv4  10.0.4.17     49801      10.0.0.5        445          CLOSED       4      System`}</CodeBlock>
      <p>
        <code>windows.netscan</code> ties each socket to its owning PID. Here the suspicious rundll32 from the
        process tree holds an outbound HTTPS connection to an external address — a link between "odd process"
        and "external control channel" that disk evidence alone could not prove. Record the foreign address
        and hand it to network monitoring so you can check what else talked to it.
      </p>

      <h2>Detecting injected code: malfind and its purpose</h2>
      <CodeBlock label="finding process injection directly in memory structure, not just behaviorally">{`vol -f memory.dmp windows.malfind
  -- scans every process's memory regions for characteristics consistent
     with injected code: a memory region marked EXECUTABLE that has NO
     corresponding file on disk backing it (a legitimately loaded DLL/EXE
     always maps back to a real file; injected shellcode does not), often
     additionally flagged by containing a recognizable PE header or
     shellcode-like byte patterns sitting in an otherwise unremarkable
     memory region

-- this is the memory-forensics-native detection for EXACTLY the
   VirtualAllocEx/WriteProcessMemory/CreateRemoteThread injection pattern
   the Mobile Security module's banking-trojan lesson and the Malware
   module both referenced -- confirming after the fact, from a memory
   image, that injection actually occurred`}</CodeBlock>
      <Callout variant="warn">
        <p>
          malfind produces false positives. Programs that compile code at run time — the .NET runtime,
          JavaScript engines in browsers, some security products — legitimately create private executable
          memory. A malfind hit is a lead to examine, not a verdict. Look for the combination that matters: an
          executable, non-file-backed region that starts with an <code>MZ</code> header or shellcode, inside a
          process that also looks wrong in the tree or on the network.
        </p>
      </Callout>
      <p>
        When a region looks real, extract it with <code>windows.malfind --dump</code> and hash the dumped file.
        The hash lets malware analysts and threat-intelligence services recognise the payload without anyone
        re-running it.
      </p>

      <h2>Extracting credentials directly from memory</h2>
      <CodeBlock label="why memory frequently holds recoverable credential material">{`vol -f memory.dmp windows.hashdump
  -- recovers LM/NTLM password hashes directly from the memory-resident
     copy of the SAM database and related registry hives, without ever
     touching the disk-based files at all

vol -f memory.dmp windows.lsadump
  -- recovers LSA secrets, including in some configurations cached
     domain credentials and service account passwords held in memory
     for active use by the operating system`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This is precisely why a real incident response plan treats "the compromised host is still logged in
          and powered on" as a genuine forensic OPPORTUNITY rather than purely a risk to shut down
          immediately — memory contents (running malware, injected code, and credential material) are entirely
          lost the moment the system powers off, echoing the order-of-volatility principle from the Security+
          module's incident-response lesson: RAM sits at the very top of that ordering for exactly this reason.
        </p>
      </Callout>
      <p>
        For defenders, the practical outcome of finding credential material in an attacker-controlled
        process is a scoping decision: every account whose secrets were present in that memory must be treated
        as exposed and reset, not only the account that was first seen misbehaving.
      </p>

      <h2>Worked triage: from one image to a written finding</h2>
      <ol>
        <li><strong>Validate.</strong> Hash the image and confirm it matches the acquisition record; run <code>windows.info</code>.</li>
        <li><strong>Enumerate.</strong> Run <code>pslist</code>, <code>psscan</code> and <code>pstree</code>; diff the first two.</li>
        <li><strong>Compare with normal.</strong> Check core processes against the expected parents, counts and paths.</li>
        <li><strong>Explain the odd ones.</strong> Pull <code>cmdline</code>, <code>dlllist</code> and <code>netscan</code> for each suspicious PID.</li>
        <li><strong>Look for injection.</strong> Run <code>malfind</code>, dump only regions that survive the false-positive checks, and hash them.</li>
        <li><strong>Write it down.</strong> One finding per fact, each with the plugin and PID that proves it.</li>
      </ol>
      <CodeBlock label="a finding another analyst can reproduce">{`Finding 3 — hidden process with external connection
Evidence:  host-ws17.raw (SHA-256 4be1…9c0a), captured 2026-04-12 09:41 UTC
Observed:  PID 6120 updsvc.exe present in windows.psscan with no exit time,
           absent from windows.pslist (unlinked from the active process list).
           windows.netscan shows PID 6120 with an ESTABLISHED connection to
           185.220.101.4:443.
Meaning:   a running process deliberately hidden from standard tools and
           holding an outbound channel. Consistent with rootkit-assisted
           command and control.
Next:      dump the process image, block the address, scope other hosts for
           connections to it.`}</CodeBlock>

      <h2>Practice exercise</h2>
      <p>
        You are given a memory image from a workstation. <code>pstree</code> shows <code>winword.exe</code>
        with a child <code>cmd.exe</code>, which has a child <code>powershell.exe</code>. <code>malfind</code>
        reports executable private memory in <code>powershell.exe</code> and in <code>msedge.exe</code>.
        <code>netscan</code> shows only <code>powershell.exe</code> connecting to an external address.
      </p>
      <p><strong>Your task:</strong> decide which malfind hit is the stronger lead, and say what you would run next.</p>
      <details>
        <summary>Worked explanation</summary>
        <p>
          The powershell.exe hit is the strong lead: Word spawning a shell is a classic malicious-document
          chain, and that same process holds an external connection. The msedge.exe hit is most likely the
          browser's JavaScript engine compiling code — a known false-positive source — unless something else
          about that process is wrong. Next: <code>windows.cmdline</code> for the PowerShell PID to recover the
          command, <code>windows.malfind --dump</code> for its region, hash the dump, and record the external
          address for scoping.
        </p>
      </details>

      <h2>Common misconceptions</h2>
      <ul>
        <li>"A clean pslist means no hidden malware." pslist trusts a list the attacker can edit; always compare with psscan.</li>
        <li>"Every malfind result is malware." JIT compilers create executable private memory legitimately; corroborate before concluding.</li>
        <li>"Pull the plug first, analyse later." Powering off destroys the evidence this lesson relies on; capture memory first when the incident plan allows it.</li>
        <li>"The image proves itself." Without a hash and an acquisition record, a memory image is hard to defend in a report or in court.</li>
      </ul>

      <h2>References and further practice</h2>
      <ul>
        <li><a href="https://volatility3.readthedocs.io/en/latest/" target="_blank" rel="noreferrer">Volatility 3 documentation</a></li>
        <li><a href="https://github.com/volatilityfoundation/volatility3" target="_blank" rel="noreferrer">Volatility 3 source and symbol-table instructions</a></li>
        <li><a href="https://csrc.nist.gov/pubs/sp/800/86/final" target="_blank" rel="noreferrer">NIST SP 800-86 — Integrating Forensic Techniques into Incident Response</a></li>
        <li><a href="https://www.sans.org/posters/hunt-evil/" target="_blank" rel="noreferrer">SANS — Hunt Evil poster (normal Windows process relationships)</a></li>
      </ul>

      <p>
        With both disk and memory forensics now covered in structural depth, the final lesson closes this
        module with the legal and reporting dimension of DFIR work, and two real, widely-documented cases
        showing digital forensics evidence directly determining a real-world outcome.
      </p>
    </div>
  );
}
