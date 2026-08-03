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
      <CodeBlock label="doing this for real with pwntools instead of by hand">{`from pwn import *

pattern = cyclic(200)                 # generate a 200-byte non-repeating pattern
# ... send that pattern to the vulnerable program's input, let it crash ...

crashed_value = 0x6161386161374161      # the value GDB shows in $rip after the crash
offset = cyclic_find(crashed_value)      # pwntools looks up exactly where that 8 bytes
                                            # falls in the pattern — this is the real offset`}</CodeBlock>
      <p>
        Notice the two related but distinct bug shapes that get you here: a classic unbounded
        <code> strcpy</code>/<code>gets</code> call is one, but off-by-one errors (a loop bound written as
        <code> &lt;=</code> instead of <code>&lt;</code>) and integer-overflow-driven length checks (a
        signed/unsigned mismatch that lets a negative "length" wrap around to a huge unsigned value before
        being passed to a copy function) produce the exact same stack corruption from a very different root
        cause — worth checking for specifically when a <code>strcpy</code>-style call isn't present but a
        crash still happens.
      </p>

      <h2>From crash to control</h2>
      <CodeBlock label="the exploit payload structure, once the offset is known">{`[ 76 bytes of padding/junk ][ 8-byte address you want RIP to become ]

If you point that address at your own injected shellcode sitting earlier in the buffer,
execution jumps there instead of returning normally — arbitrary code now runs.`}</CodeBlock>

      <h2>The heap's version of the same bug</h2>
      <p>
        Everything above is the STACK-based overflow. Buffers allocated dynamically (<code>malloc</code>)
        live on the heap instead, which has no return address sitting conveniently nearby — but heap
        allocators store their own bookkeeping metadata (chunk size, pointers linking free chunks together)
        immediately adjacent to the allocated data itself. Overflow a heap buffer and you corrupt that
        metadata instead of a return address, which a corrupted allocator can be tricked into using as a
        write-what-where primitive the next time it allocates or frees a chunk — a different mechanism
        arriving at a similar outcome: attacker-controlled memory corruption. Heap exploitation is
        substantially more involved than the stack case this lesson covers (allocator internals vary by
        implementation and change between versions), which is exactly why the stack case is always taught
        first — the underlying instinct, "unchecked write past a buffer's boundary corrupts something the
        program trusts," is identical either way.
      </p>

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
    so an attacker can't reliably predict an address to jump to.

PIE (Position-Independent Executable)
  — the equivalent of ASLR applied to the MAIN executable itself, not just its libraries.
    Without PIE, the binary's own code always loads at the same fixed address even with
    ASLR on elsewhere — a common oversight that leaves a reliable jump target available.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Modern exploit development is largely about defeating this specific set of protections together —
          techniques like ROP (Return-Oriented Programming, chaining together existing code fragments
          already present in the binary or its libraries instead of injecting new shellcode) exist
          specifically to bypass NX/DEP without needing to execute anything new from the stack at all. Each
          protection has its own known bypass approach rather than being individually unbreakable:
        </p>
      </Callout>
      <CodeBlock label="how each mitigation actually gets defeated in practice">{`Stack canary  -> needs an INFORMATION LEAK to read the canary's value before overwriting it
                 (e.g. a format-string bug, or a separate vulnerability that discloses stack memory),
                 or a byte-by-byte brute force if the target forks/restarts with the same canary each time
NX/DEP        -> ROP: reuse existing executable code already mapped in the process (libc functions,
                 gadgets ending in a ret instruction) instead of injecting new shellcode onto a now-non-executable stack
ASLR/PIE      -> needs an information leak to learn ONE real runtime address, then compute every other
                 address as an offset from it (libraries/binaries load at a randomized BASE, but the
                 relative layout of code within them stays fixed)`}</CodeBlock>
      <p>
        This is exactly why real-world exploit chains are rarely "one buffer overflow, one shellcode" — they
        typically combine an information-disclosure bug (to defeat ASLR/canaries) with the memory-corruption
        bug itself (to hijack control flow), then a ROP chain (to defeat NX/DEP) before shellcode ever runs.
        Understanding buffer overflow mechanics in isolation, as this lesson does, is step one of that
        larger chain.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — MS03-026 / the Blaster Worm, August 2003:</strong> a textbook stack-based
          buffer overflow in the RPC DCOM interface of Windows 2000 and XP — an overly long, malformed RPC
          request overflowed a fixed-size stack buffer in the <code>RPCSS</code> service and let an attacker overwrite
          the return address, gaining SYSTEM-level remote code execution with no authentication required at
          all. Microsoft's patch shipped in July 2003; the Blaster worm weaponized the exact same bug and was
          spreading self-propagating infections within weeks, eventually hitting an estimated hundreds of
          thousands of machines worldwide and knocking many organizations' networks offline outright — this
          predates NX/DEP and ASLR being enabled by default on consumer Windows, which is precisely why a
          single overwritten return address was enough to take over the machine with no additional bypass
          work required. It's a large part of the reason Microsoft made these exact mitigations a default,
          shipped platform feature in the years that followed.
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
