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
(gdb) next                     # step over the current line (doesn't enter function calls)
(gdb) step                      # step into the current line (enters function calls)
(gdb) continue                   # resume execution until the next breakpoint
(gdb) info registers               # dump all register values at the current point
(gdb) x/10xw $rsp                    # examine memory: 10 words, hex format, starting at the stack pointer
(gdb) disassemble check_password       # show disassembly of the current function`}</CodeBlock>

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

      <h2>GEF / PEDA / pwndbg — why nobody uses raw GDB for exploit dev</h2>
      <p>
        In practice, security researchers layer a GDB plugin (GEF, PEDA, or pwndbg being the most common)
        on top of vanilla GDB. These add colorized register/stack views, automatic exploit-relevant context
        (is ASLR on? is the stack executable?), and helper commands for pattern-matching buffer offsets —
        dramatically speeding up the exact workflow this module builds toward.
      </p>

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
