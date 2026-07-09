import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BinaryFormatsStaticAnalysis() {
  return (
    <div className="prose-hh">
      <h1>Binary Formats &amp; Static Analysis Fundamentals</h1>
      <p>
        Reverse engineering starts with a question every analyst asks first, before running anything:
        "what am I even looking at?" Static analysis answers that without ever executing the file — the
        safest possible first step, and the foundation this whole module builds on.
      </p>

      <h2>The two executable formats you need to know</h2>
      <CodeBlock label="ELF (Linux) vs. PE (Windows)">{`ELF (Executable and Linkable Format) — Linux/Unix
  - ELF header -> Program headers -> Sections (.text, .data, .bss, .rodata) -> Section headers

PE (Portable Executable) — Windows
  - DOS header (legacy compatibility stub) -> PE header -> Section table -> Sections (.text, .data, .rsrc)`}</CodeBlock>
      <p>
        Both formats share the same core idea: a header describing the file, followed by named sections —
        <code> .text</code> holds executable code, <code>.data</code> holds initialized variables,
        <code> .bss</code> holds uninitialized variables reserved at load time, and (PE-specific)
        <code> .rsrc</code> holds embedded resources like icons and version info.
      </p>

      <h2>Identifying a file without executing it</h2>
      <CodeBlock label="the first command you run on anything unknown">{`file suspicious_binary
suspicious_binary: ELF 64-bit LSB executable, x86-64, dynamically linked`}</CodeBlock>
      <p>
        This single command tells you architecture (32 vs 64-bit), format, and whether it's statically or
        dynamically linked — dynamically linked binaries depend on shared libraries present on the system,
        which itself is useful intelligence (what libraries, what versions, what known vulnerabilities).
      </p>

      <h2>Extracting strings: the highest-value low-effort technique</h2>
      <CodeBlock label="strings — often the fastest path to real intelligence">{`strings suspicious_binary
/lib64/ld-linux-x86-64.so.2
libc.so.6
Enter password:
Access granted!
Access denied.
GLIBC_2.2.5`}</CodeBlock>
      <p>
        Malware authors and CTF challenge designers alike routinely leave meaningful strings behind —
        hardcoded passwords, C2 URLs, debug messages, error strings that reveal internal logic. This is
        exactly the technique you already used in the Digital Forensics module's memory-strings lab,
        applied here directly to an executable file instead of a memory dump.
      </p>

      <Callout variant="tip">
        <p>
          Before touching a debugger, always run <code>file</code> then <code>strings</code>. Half of real
          beginner-to-intermediate CTF reverse-engineering challenges are solvable from strings output
          alone — the hardcoded password or flag is sitting in plain text, no disassembly required.
        </p>
      </Callout>

      <h2>Disassembly: turning machine code back into instructions</h2>
      <CodeBlock label="objdump — a static disassembler">{`objdump -d suspicious_binary

0000000000401136 <check_password>:
  401136: 55                    push   %rbp
  401137: 48 89 e5              mov    %rsp,%rbp
  40113a: 48 83 ec 20           sub    $0x20,%rsp
  40113e: 48 8d 05 bf 0e 00 00  lea    0xebf(%rip),%rax        # reference to a string constant`}</CodeBlock>
      <p>
        Each line shows the memory address, the raw machine code bytes, and the human-readable assembly
        instruction (in AT&amp;T syntax here — Intel syntax reads operand order in reverse). You don't need
        to read every instruction fluently yet; the next lesson builds exactly that skill.
      </p>

      <h2>Hashing for identification and threat intel correlation</h2>
      <CodeBlock>{`md5sum suspicious_binary       # legacy but still widely used for quick lookups
sha256sum suspicious_binary     # the modern standard for integrity/identification

# A file's hash can be checked against public malware databases (VirusTotal and similar)
# to instantly learn if this exact file has been seen and classified before —
# often skipping hours of manual analysis entirely.`}</CodeBlock>

      <Callout variant="danger">
        <p>
          Never execute an unknown or suspicious binary on your own primary machine — even "just to see
          what it does." Static analysis is safe specifically because nothing runs; dynamic analysis
          (covered in the Malware Analysis module) requires an isolated, disposable sandbox environment.
        </p>
      </Callout>

      <p>
        You now have the static-analysis toolkit: identify the format, extract strings, disassemble the
        code, and hash for correlation. The next lesson gives you the assembly fundamentals to actually
        read what that disassembly is doing.
      </p>
    </div>
  );
}
