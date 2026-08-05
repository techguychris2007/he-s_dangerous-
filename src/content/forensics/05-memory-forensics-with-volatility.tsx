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

      <h2>Why structured memory analysis finds what strings alone misses</h2>
      <CodeBlock label="the core capability gap between the two approaches">{`strings memory.dmp | grep -i password
  -- fast, but only finds PLAINTEXT strings that happen to still be
     sitting in memory -- misses encrypted/obfuscated malware entirely,
     and gives no structural context (which process, what relationship to
     other processes) for anything it does find

vol.py -f memory.dmp windows.pslist
  -- Volatility instead parses the operating system's own internal
     process-management data structures directly out of the raw memory
     image -- recovering the FULL process tree, parent-child
     relationships, and process metadata regardless of whether any
     plaintext string related to it happens to still be resident`}</CodeBlock>

      <h2>Process tree analysis: finding what doesn't belong</h2>
      <CodeBlock label="the classic Volatility triage workflow">{`vol.py -f memory.dmp windows.pstree
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

vol.py -f memory.dmp windows.cmdline
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

      <h2>Detecting injected code: malfind and its purpose</h2>
      <CodeBlock label="finding process injection directly in memory structure, not just behaviorally">{`vol.py -f memory.dmp windows.malfind
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

      <h2>Extracting credentials directly from memory</h2>
      <CodeBlock label="why memory frequently holds recoverable credential material">{`vol.py -f memory.dmp windows.hashdump
  -- recovers LM/NTLM password hashes directly from the memory-resident
     copy of the SAM database and related registry hives, without ever
     touching the disk-based files at all

vol.py -f memory.dmp windows.lsadump
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
        With both disk and memory forensics now covered in structural depth, the final lesson closes this
        module with the legal and reporting dimension of DFIR work, and two real, widely-documented cases
        showing digital forensics evidence directly determining a real-world outcome.
      </p>
    </div>
  );
}
