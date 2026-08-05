import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function DebuggingWithGdb() {
  return (
    <div className="prose-hh">
      <h1>Dynamic Analysis: Debugging with GDB</h1>
      <p>
        Static analysis tells you what a binary CAN do. Dynamic analysis — actually running it under a
        debugger, in a controlled way — tells you what it ACTUALLY does with specific inputs, which is
        often the only way to understand obfuscated or self-modifying code, and is essential for developing
        an exploit against it.
      </p>

      <h2>GDB basics: the core command set</h2>
      <CodeBlock label="the commands you'll use in nearly every session">{`gdb ./target              # launch gdb against a binary
(gdb) break check_password  # set a breakpoint at a function name
(gdb) break *0x401166        # set a breakpoint at a specific address
(gdb) run                     # start execution
(gdb) run < input.txt          # start execution, feeding a file as stdin — essential for scripted crash repro
(gdb) next                     # step over the current line (doesn't enter function calls)
(gdb) step                      # step into the current line (enters function calls)
(gdb) continue                   # resume execution until the next breakpoint
(gdb) info registers               # dump all register values at the current point
(gdb) x/10xw $rsp                    # examine memory: 10 words, hex format, starting at the stack pointer
(gdb) x/20i $rip                      # examine memory as 20 INSTRUCTIONS starting at the instruction pointer
(gdb) disassemble check_password       # show disassembly of the current function
(gdb) bt                                # backtrace — show the full call stack (which function called which)
(gdb) info proc mappings                 # show the process's memory map (base addresses, permissions per region)`}</CodeBlock>
      <p>
        <code>x</code> (examine memory) is the single command worth the most practice time — its format is
        <code> x/NFU address</code>: a count (<code>N</code>), a format letter (<code>x</code> hex,
        <code>s</code> string, <code>i</code> instruction, <code>d</code> decimal), and a unit size
        (<code>b</code>yte, <code>h</code>alfword, <code>w</code>ord, <code>g</code>iant/quadword). Once that
        syntax is second nature, you can inspect almost anything in a running process from one command.
      </p>

      <h2>A worked debugging session</h2>
      <p>
        Say you're analyzing the password-check function from the previous lesson, but you don't know the
        expected password from strings alone (perhaps it's obfuscated). You'd set a breakpoint right after
        the comparison and inspect memory directly:
      </p>
      <CodeBlock label="catching the comparison in the act">{`(gdb) break *0x401161    # right at the strcmp call
(gdb) run
(gdb) x/s $rdi             # examine the first argument (your input) as a string
(gdb) x/s $rsi              # examine the second argument (the secret) as a string
$1 = "sup3rs3cr3t_2026"       <- there's the real password, straight from memory`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This technique — breaking right before a comparison and reading both operands directly from
          memory — works even when a password is built at runtime (decoded, decrypted, or concatenated),
          which defeats a plain <code>strings</code> search but can't hide from a debugger watching the
          actual comparison happen.
        </p>
      </Callout>

      <h2>Watchpoints: catching writes to memory</h2>
      <CodeBlock>{`(gdb) watch *0x404050       # break whenever this memory address is WRITTEN to
(gdb) continue`}</CodeBlock>
      <p>
        Watchpoints are how you find exactly which instruction modifies a variable of interest — extremely
        useful when a value changes somewhere in a large, unfamiliar codebase and you need to find where.
      </p>

      <h2>Patching behavior on the fly</h2>
      <CodeBlock label="modifying a register or memory value mid-execution">{`(gdb) set $eax = 1           # force a register to a specific value
(gdb) set {int}0x404050 = 0    # force a memory location to a specific value`}</CodeBlock>
      <p>
        This is how analysts quickly test "what if this check always passed?" without modifying the
        original binary file at all — useful for confirming a hypothesis about program logic before
        committing to a permanent patch.
      </p>

      <h2>Postmortem debugging: analyzing a crash after the fact</h2>
      <p>
        Everything above assumes you're present, running the program live under GDB. Real crashes — a
        production service that died overnight, a fuzzer's crashing test case found hours after the fuzzer
        moved on — often need to be analyzed after the process is long gone. A core dump (a snapshot of the
        process's entire memory at the moment it crashed) makes that possible:
      </p>
      <CodeBlock label="loading a crash after the fact, no live process required">{`ulimit -c unlimited          # enable core dumps for the current shell (often disabled by default)
./vulnerable_binary            # crashes, and now writes a core file (e.g. core.12345) to disk
gdb ./vulnerable_binary core.12345
(gdb) bt                          # backtrace works exactly the same as a live session —
                                    # shows the full call stack at the exact moment of the crash`}</CodeBlock>
      <p>
        Once loaded, a core dump behaves like a frozen live session for inspection purposes — <code>bt</code>,
        <code> x</code>, and <code>info registers</code> all work identically, just against memory as it
        existed at the instant of the crash rather than a process you can single-step further.
      </p>

      <h2>GEF / PEDA / pwndbg — why nobody uses raw GDB for exploit dev</h2>
      <p>
        In practice, security researchers layer a GDB plugin (GEF, PEDA, or pwndbg being the most common)
        on top of vanilla GDB. These add colorized register/stack views, automatic exploit-relevant context
        (is ASLR on? is the stack executable?), and helper commands for pattern-matching buffer offsets —
        dramatically speeding up the exact workflow this module builds toward.
      </p>

      <h2>Beyond GDB: Frida for dynamic instrumentation</h2>
      <p>
        GDB is fundamentally an <em>interactive, stop-the-world</em> debugger — you set a breakpoint, the
        process halts, you inspect it by hand. That's perfect for the kind of one-off investigation this
        lesson has covered so far. But a lot of real reverse-engineering work needs the opposite: observing
        or altering a function's behavior automatically, every single time it's called, without pausing
        execution or recompiling anything. That's the job of <strong>Frida</strong>, a dynamic
        instrumentation toolkit that injects a JavaScript (or Python-controlled) engine directly into a
        running process and lets you hook any function at runtime.
      </p>
      <CodeBlock label="a minimal Frida hook — logging every call to a function's arguments and return value">{`// hook.js — attach with: frida -p <PID> -l hook.js   (or -f ./target -l hook.js to spawn fresh)
Interceptor.attach(Module.getExportByName(null, "check_password"), {
  onEnter(args) {
    console.log("check_password called with input: " + args[0].readCString());
  },
  onLeave(retval) {
    console.log("check_password returned: " + retval);
  }
});`}</CodeBlock>
      <p>
        Where GDB requires you to manually break, inspect, and continue every time you want to see a
        function's arguments, a Frida hook like this fires automatically on every single invocation for the
        life of the process — practical for functions called thousands of times, or for building a
        repeatable instrumentation script you re-run across many binary versions without touching GDB
        commands by hand at all. Frida also works across process boundaries in ways GDB does not: it can
        attach to a process without ever stopping it (no breakpoint, no pause), and the same core engine
        runs on Windows, Linux, macOS, iOS, and Android binaries alike.
      </p>
      <Callout variant="tip">
        <p>
          Frida is not a replacement for GDB — it's a complementary tool for a different job. Use GDB when
          you need to stop and manually reason about a single crash or a single comparison, the way this
          lesson has been doing. Reach for Frida when you need to instrument a function's behavior
          repeatedly, programmatically, or across a runtime GDB doesn't natively understand. That second
          case is overwhelmingly common in one specific domain: mobile application reverse engineering,
          where Frida (often paired with Objection, a tool built directly on top of it) is the de facto
          standard for hooking into a running Android or iOS app — bypassing certificate pinning or
          root-detection checks at runtime exactly the way you'd patch a check here with GDB, just without
          ever needing source access or a recompile. The module's closing lesson covers this mobile side in
          detail.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Always run unknown or suspicious binaries inside an isolated virtual machine with no valuable
          data and no network access to anything sensitive, snapshotted so you can revert cleanly. Dynamic
          analysis means the code executes for real — treat every unknown binary as hostile until proven
          otherwise.
        </p>
      </Callout>

      <p>
        With static and dynamic analysis both covered, the next lesson turns to the classic vulnerability
        class this entire module has been building toward: the stack-based buffer overflow.
      </p>
    </div>
  );
}
