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

      <h2>Mobile App Reverse Engineering: the same model, a different runtime</h2>
      <p>
        Everything above was built around ELF and PE — native binaries running x86/x64 machine code. But
        the exact same mental model, static analysis first, then dynamic analysis only when needed, applies
        directly to mobile apps. The file format changes (an APK is a signed ZIP archive containing
        compiled Dalvik/JVM bytecode rather than a raw ELF/PE image, and iOS apps ship ARM Mach-O binaries
        wrapped in an IPA), and the tools change, but the discipline doesn't: identify the format, extract
        what you can without running it, disassemble/decompile, and only then move to runtime observation.
      </p>

      <CodeBlock label="static vs. dynamic, restated for mobile">{`Native binary (this lesson)          Mobile app (same idea, different tools)
-----------------------------------  -----------------------------------------
file / header inspection        ->   inspect the APK's manifest and DEX bytecode
strings                          ->   strings still works on an APK's raw bytes,
                                       but a decompiler gets you far more
objdump / disassembler          ->   JADX (decompiler) and APKTool (disassembler)
GDB (lesson 3 of this module)    ->   Frida / Objection (runtime instrumentation)
"never just run unknown code"   ->   same rule — analyze in an isolated device/
                                       emulator, never your daily-driver phone`}</CodeBlock>

      <h3>JADX — decompiling Android to readable(-ish) Java</h3>
      <CodeBlock label="JADX turns Dalvik bytecode back into Java source">{`jadx -d output_dir/ target_app.apk
# produces a browsable Java source tree — often close enough to the original
# source that variable names, string constants, and API keys are directly readable`}</CodeBlock>
      <p>
        JADX is the mobile equivalent of running a disassembler on an ELF binary, except it aims higher —
        because Android apps compile from Java/Kotlin to a well-documented bytecode format (Dalvik/DEX),
        decompilation back to something close to real source code is often possible, unlike decompiling
        optimized native x86 back to C.
      </p>

      <h3>APKTool — unpacking and repacking an APK</h3>
      <CodeBlock label="the disassemble-modify-reassemble workflow">{`apktool d target_app.apk -o app_src/
# unpacks resources and disassembles the DEX bytecode to smali (a human-readable
# assembly-like format for the Dalvik VM) — edit smali or resources here

apktool b app_src/ -o rebuilt.apk
# reassembles everything back into a working, installable APK`}</CodeBlock>
      <p>
        Where JADX is for reading, APKTool is for modifying — it's the mobile equivalent of a
        disassembler-plus-reassembler pair. A common use is patching out a certificate-pinning check or a
        root-detection routine directly in the smali, then rebuilding and re-signing the APK to test the
        patched behavior.
      </p>

      <h3>Frida — dynamic instrumentation for a running app</h3>
      <CodeBlock label="attaching Frida and hooking a function at runtime">{`frida -U -f com.example.targetapp -l hook.js --no-pause
# -U        target a USB-connected device/emulator
# -f        spawn the app fresh (rather than attaching to an already-running process)
# -l        load a JavaScript hook script before the app's own code runs`}</CodeBlock>
      <p>
        Frida is the mobile equivalent of attaching GDB (lesson 3) to a running process, except far more
        flexible: instead of manually setting breakpoints in an interactive session, you write a small
        JavaScript snippet that hooks any function, on Android's Dalvik/JVM runtime or iOS's Objective-C/
        Swift runtime, and repeats that instrumentation identically every time the app runs. That
        scriptability is what makes Frida practical for tasks you need to do over and over — like
        confirming a bypass still works across a dozen app versions.
      </p>

      <h3>Objection — Frida's bypass tasks, pre-built</h3>
      <CodeBlock label="objection wraps common Frida hooks into ready-made commands">{`objection -g com.example.targetapp explore
# drops into an interactive shell attached to the running app via Frida

android sslpinning disable      # defeat certificate pinning without writing a Frida script
android root detection disable  # defeat common root-detection checks the same way`}</CodeBlock>
      <p>
        Objection is built on top of Frida specifically to remove the need to hand-write a custom hook
        script for the handful of bypass tasks that come up on nearly every mobile app assessment —
        certificate pinning and root/jailbreak detection chief among them. It's the difference between
        writing your own exploit from scratch and using a well-tested Metasploit module for a known issue.
      </p>

      <h3>MobSF — tying it all together into one pipeline</h3>
      <p>
        Mobile Security Framework (MobSF) automates much of the above into a single tool: it statically
        decompiles and scans an uploaded APK or IPA for common issues (hardcoded secrets, insecure storage,
        risky permissions), and can also drive a dynamic analysis pass against a running instance,
        capturing network traffic and runtime behavior automatically. It won't replace manually reading
        JADX output or writing a targeted Frida hook, but it's an excellent first-pass triage tool — the
        mobile analogue of running a sample through an automated malware sandbox before committing to deep
        manual analysis.
      </p>

      <Callout variant="tip">
        <p>
          Notice the throughline: JADX and APKTool are <em>static</em> analysis — nothing executes, exactly
          like <code>file</code>, <code>strings</code>, and <code>objdump</code> above. Frida and Objection
          are <em>dynamic</em> analysis — observing and altering real runtime behavior, exactly like GDB in
          lesson 3. MobSF automates a pipeline across both. Same two-phase model, same reasons for
          preferring static analysis first — only the execution environment (JVM/Dalvik bytecode and
          ObjC/Swift, instead of native x86 machine code) has changed.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          The same authorization rule applies here as everywhere else in this course: decompiling,
          instrumenting, or repackaging an app you don't own and don't have explicit permission to test —
          including apps downloaded from an app store for a target you're assessing without a signed
          engagement — is not something this course endorses. Practice against apps you own the rights to
          analyze, deliberately vulnerable training apps, or apps within a written authorization scope.
        </p>
      </Callout>

      <p>
        You now have the static-analysis toolkit: identify the format, extract strings, disassemble the
        code, and hash for correlation — and you've seen that the same toolkit, adapted to a different
        runtime, is exactly how mobile apps get reverse engineered too. The next lesson gives you the
        assembly fundamentals to actually read what that disassembly is doing.
      </p>
    </div>
  );
}
