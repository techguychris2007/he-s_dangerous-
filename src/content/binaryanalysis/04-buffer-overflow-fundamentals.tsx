import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BufferOverflowFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Buffer Overflow Fundamentals</h1>
      <p>
        This is the vulnerability class that launched modern exploit development as a discipline, and it's
        the direct payoff of everything this module has built toward: registers, the stack layout, and
        reading disassembly all come together here.
      </p>

      <h2>The vulnerable pattern</h2>
      <CodeBlock label="a classic vulnerable C function">{`void vulnerable_function(char *user_input) {
    char buffer[64];
    strcpy(buffer, user_input);   // no bounds checking — copies however much user_input contains
}`}</CodeBlock>
      <p>
        <code>strcpy</code> copies until it hits a null terminator, with zero regard for the destination
        buffer's actual size. If <code>user_input</code> is longer than 64 bytes, the extra bytes keep
        writing past the end of <code>buffer</code> — directly into adjacent stack memory.
      </p>

      <h2>What actually gets overwritten, in order</h2>
      <CodeBlock label="recall the stack layout from lesson 2">{`[ buffer (64 bytes) ][ saved RBP (8 bytes) ][ return address (8 bytes) ]
     ^ overflow starts here, writes upward through each region in turn`}</CodeBlock>
      <p>
        Send exactly 64 bytes and you fill the buffer with no overflow. Send 72 bytes and you've also
        overwritten the saved RBP. Send more, and you overwrite the <strong>return address</strong> — the
        exact value the CPU jumps to when the function returns. Control that value, and you control where
        execution goes next.
      </p>

      <h2>Finding the exact offset</h2>
      <p>
        Before crafting a real payload, you need to know precisely how many bytes reach the return address.
        The standard technique uses a unique "cyclic pattern" instead of guessing:
      </p>
      <CodeBlock label="the pattern technique (conceptually — pwntools' cyclic() automates this)">{`Send a pattern like: Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1...
Each 4-byte chunk is unique across the whole pattern.

When the program crashes, check what value ended up in the return address / RIP —
e.g. it crashed trying to jump to "Aa3A". Look up where "Aa3A" falls in the original
pattern (say, byte offset 76) — that tells you EXACTLY how many bytes precede the
return address, with no guesswork.`}</CodeBlock>

      <h2>From crash to control</h2>
      <CodeBlock label="the exploit payload structure, once the offset is known">{`[ 76 bytes of padding/junk ][ 8-byte address you want RIP to become ]

If you point that address at your own injected shellcode sitting earlier in the buffer,
execution jumps there instead of returning normally — arbitrary code now runs.`}</CodeBlock>

      <h2>Why this doesn't work as easily anymore — modern mitigations</h2>
      <CodeBlock label="the protections every modern system has by default">{`Stack canaries (/GS on Windows, -fstack-protector on Linux)
  — a random value placed right before the return address; checked before returning.
    If an overflow overwrote it, the value won't match and the program aborts safely
    BEFORE the corrupted return address is ever used.

NX / DEP (No-eXecute / Data Execution Prevention)
  — marks the stack as non-executable, so even if you redirect execution to
    injected shellcode on the stack, the CPU refuses to execute it.

ASLR (Address Space Layout Randomization)
  — randomizes where the stack, heap, and libraries load in memory each run,
    so an attacker can't reliably predict an address to jump to.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Modern exploit development is largely about defeating this specific set of three protections
          together — techniques like ROP (Return-Oriented Programming, chaining together existing code
          fragments instead of injecting new shellcode) exist specifically to bypass NX/DEP without needing
          to execute anything new from the stack at all.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Everything in this lesson describes a vulnerability CLASS for educational understanding.
          Developing and testing exploits against real, unpatched software you don't own or have explicit
          authorization to test is illegal. Practice exclusively against intentionally vulnerable practice
          binaries in an isolated lab environment.
        </p>
      </Callout>

      <p>
        With the vulnerability mechanics understood, the final lesson in this module ties it together with
        a practical introduction to writing a minimal working exploit.
      </p>
    </div>
  );
}
