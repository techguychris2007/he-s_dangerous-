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

      <h2>Technical terms explained</h2>
      <ul>
        <li><strong>Buffer, bounds, and overflow:</strong> A buffer is a region reserved for data. Its bounds define the valid positions within that region. A buffer overflow writes beyond those bounds; an out-of-bounds read is a different error that can disclose data or crash.</li>
        <li><strong>Offset and memory corruption:</strong> An offset is a distance from a reference point, often measured in bytes. Memory corruption means data is changed outside the intended object or lifetime. An offset measured in one build may change with architecture, compiler settings, or surrounding code.</li>
        <li><strong>Stack canary, NX, and PIE:</strong> A stack canary is a value checked to detect some stack overwrites. Non-Executable (NX) memory prevents instruction execution from designated pages. Position-Independent Executable (PIE) code allows an executable's base address to vary with ASLR. Each addresses a different part of an attack.</li>
        <li><strong>Use-after-free and exploitability:</strong> A use-after-free accesses an object after its allocation has been released. Exploitability asks whether a bug can produce a meaningful security impact under the actual environment and mitigations. A reproducible crash is evidence of a bug, rather than proof of arbitrary code execution.</li>
      </ul>

      <h2>The vulnerable pattern</h2>
      <CodeBlock label="a classic vulnerable C function">{`void vulnerable_function(char *user_input) {
    char buffer[64];
    strcpy(buffer, user_input);   // no bounds checking — copies however much user_input contains
}`}</CodeBlock>
      <p>
        <code>strcpy</code> copies until it hits a null terminator, with zero regard for the destination
        buffer's actual size. If <code>user_input</code> has 64 or more nonzero characters, its copied
        terminator already needs a byte beyond this 64-byte object; further bytes keep
        writing past the end of <code>buffer</code> — directly into adjacent stack memory.
      </p>

      <h2>What actually gets overwritten, in order</h2>
      <CodeBlock label="recall the stack layout from lesson 2">{`[ buffer (64 bytes) ][ saved RBP (8 bytes) ][ return address (8 bytes) ]
     ^ overflow starts here, writes upward through each region in turn`}</CodeBlock>
      <p>
        This diagram is illustrative, not a guaranteed compiler layout. A 64-byte array can hold at most
        63 nonzero characters plus a terminator under this string-copy contract. Padding, canaries,
        optimization, architecture and frame-pointer decisions affect neighboring storage. Measure the
        actual build before stating a saved-register or return-address offset. Corruption of a return
        address also does not by itself establish usable execution control under the active protections.
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

pattern = cyclic(200, n=8)            # choose an 8-byte unique subsequence size explicitly
# ... send that pattern to the vulnerable program's input, let it crash ...

fragment = pattern[72:80]             # a worked lookup example, not an observed crash
offset = cyclic_find(fragment, n=8)   # matching n=8 returns 72 for these bytes
# For a real fixture, recover the actual matching bytes from the fault context.
# RIP itself may not contain the pattern, especially for a noncanonical target.`}</CodeBlock>
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

This is an illustrative shape for a deliberately configured fixture. The actual offset,
address validity and execution permissions must be established from that build.
A corrupted return value does not by itself prove arbitrary code execution.`}</CodeBlock>

      <h2>Heap bounds and allocator context</h2>
      <p>
        Dynamically allocated buffers have bounds and lifetimes just like other objects. An overflow can
        damage neighboring application data or allocator state, depending on the actual layout.
        Metadata placement and integrity checks vary by allocator and version; historical unlink
        examples are not universal recipes. A crash does not establish an arbitrary-write primitive.
        Identify the violated bound, allocation lifetime and observed effect before claiming impact.
      </p>

      <h2>Why this doesn't work as easily anymore — modern mitigations</h2>
      <CodeBlock label="common protections — verify the actual build and runtime">{`Stack canaries (/GS on Windows, -fstack-protector on Linux)
  — a guard included in selected protected stack frames; layout depends on the build.
    A failed guard check terminates that execution before normal return.
    It does not detect every overwrite, disclosure or lifetime error.

NX / DEP (No-eXecute / Data Execution Prevention)
  — marks the stack as non-executable, so even if you redirect execution to
    injected shellcode on the stack, the CPU refuses to execute it.

ASLR (Address Space Layout Randomization)
  — randomizes where the stack, heap, and libraries load in memory each run,
    so an attacker can't reliably predict an address to jump to.

PIE (Position-Independent Executable)
  — a build property allowing the executable to be relocated.
    ASLR is a separate runtime policy; inspect both rather than treating PIE as ASLR itself.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Analyze the actual bug and active protection layers together. Code reuse such as ROP can be
          relevant to particular control-flow failures, while modern control-flow checks impose further
          constraints. No mitigation label implies a universal bypass or a proof that the program is safe.
          Treat each proposed effect as a hypothesis that needs evidence from the specific fixture:
        </p>
      </Callout>
      <CodeBlock label="protection limits to evaluate in the actual fixture">{`Stack canary  -> guards selected stack-corruption paths; not all data or heap errors.
                 Any proposed bypass depends on the exact corruption and available observations.
NX/DEP        -> ROP: reuse existing executable code already mapped in the process (libc functions,
                 gadgets ending in a ret instruction) instead of injecting new shellcode onto a now-non-executable stack
ASLR/PIE      -> an observed address may identify a mapping base when its build/offset is known.
                 It does not automatically identify every independently randomized mapping;
                 usable effects depend on the actual bug, binary and additional protections.`}</CodeBlock>
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
      <h2>Reason about the boundary before the crash</h2>
      <p>An eight-byte character array can store at most seven single-byte characters plus a null terminator when used as a C string. Copying eight characters and then writing a terminator requires nine bytes. The first incorrect write may alter another variable, trigger a protection check, or appear harmless depending on the actual layout. Do not assume every local buffer sits directly beside a return address. In a controlled local exercise, compare input length with allocation size and inspect the first invalid access using a debugger or memory diagnostic tool. Fix the length handling and verify both boundary-size input and oversized input. A mitigation can stop an exploitation path while the underlying bounds error remains.</p>
      <Callout variant="tip">
        <p><strong>Check your understanding:</strong> Why can an input that fits eight visible characters still overflow an eight-byte C string buffer?</p>
      </Callout>

    </div>
  );
}
