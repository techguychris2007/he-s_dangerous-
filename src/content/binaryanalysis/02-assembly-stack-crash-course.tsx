import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AssemblyStackCrashCourse() {
  return (
    <div className="prose-hh">
      <h1>x86 Assembly &amp; the Stack: A Crash Course</h1>
      <p>
        You don't need to write assembly fluently to reverse engineer effectively — you need to recognize
        patterns. This lesson teaches exactly enough x86/x86-64 to read a disassembly listing and understand
        what a function is actually doing, which is also the exact foundation buffer overflow exploitation
        depends on later in this module.
      </p>

      <h2>The registers that matter</h2>
      <CodeBlock label="x86-64 general-purpose registers">{`RAX  — accumulator, commonly holds a function's return value
RBX  — base register, general purpose
RCX  — counter register, often used in loops
RDX  — data register, general purpose
RSI  — source index, general purpose (2nd argument in the Linux calling convention)
RDI  — destination index, general purpose (1st argument in the Linux calling convention)
R8-R15 — added when AMD64 extended the original 32-bit x86 register set to 64-bit and eight more slots
RSP  — STACK POINTER — points to the top of the current stack frame
RBP  — BASE POINTER — points to the base of the current stack frame (a stable reference within a function)
RIP  — INSTRUCTION POINTER — points to the next instruction to execute (this is what exploits ultimately hijack)`}</CodeBlock>
      <p>
        Every register above also exists in smaller widths that overlap the SAME physical storage — this
        matters because disassembly of 32-bit code, or code that deliberately operates on a smaller slice of
        a value, uses these narrower names constantly.
      </p>
      <CodeBlock label="the same physical register, addressed at different widths">{`64-bit   32-bit   16-bit   8-bit
 RAX      EAX      AX       AL
 RBX      EBX      BX       BL
 RCX      ECX      CX       CL
 RDX      EDX      DX       DL

# writing to a 32-bit sub-register (EAX) on x86-64 zero-extends and clears the
# upper 32 bits of RAX automatically — a quirk that trips up a lot of beginners
# reading mixed 32/64-bit disassembly`}</CodeBlock>

      <h2>EFLAGS/RFLAGS: the register that drives every conditional jump</h2>
      <p>
        Instructions like <code>cmp</code> and <code>test</code> don't just silently compare values — they
        write the result into the flags register, and every conditional jump afterward reads those flags to
        decide whether to branch. You never address this register directly by name in most disassembly, but
        understanding it is what makes <code>cmp</code> immediately followed by <code>je</code> make sense
        as a single logical unit rather than two unrelated instructions.
      </p>
      <CodeBlock label="the flags that matter for reverse engineering">{`ZF (Zero Flag)       — set when a result was exactly zero (the flag je/jne actually check)
SF (Sign Flag)        — set when a result was negative (mirrors the sign bit of the result)
CF (Carry Flag)        — set on unsigned overflow/borrow (what ja/jb, unsigned comparisons, check)
OF (Overflow Flag)      — set on signed overflow (what jg/jl, signed comparisons, check)`}</CodeBlock>

      <h2>The stack: how function calls actually work</h2>
      <p>
        The stack grows DOWNWARD in memory (toward lower addresses) as things are pushed onto it. Every
        function call sets up a "stack frame" holding its local variables, saved registers, and critically,
        the return address — where execution resumes once the function finishes.
      </p>
      <CodeBlock label="a stack frame, from a buffer-overflow-relevant perspective">{`Higher memory addresses
+-------------------------+
| Return address           |  <- where execution jumps back to after this function returns
+-------------------------+
| Saved RBP (previous frame)|
+-------------------------+
| Local variables           |  <- e.g. char buffer[64] lives here
| (e.g. char buf[64])        |
+-------------------------+
Lower memory addresses     <- RSP points around here (the "top" of the stack)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice the layout: local variables sit BELOW the return address in memory, and the stack grows
          downward. If a local buffer can be written past its own boundary (a buffer overflow), the
          overflow writes UPWARD in memory — directly into the saved RBP, then the return address. This one
          diagram is the entire root cause of classic stack-based buffer overflow exploitation, covered in
          depth two lessons from now.
        </p>
      </Callout>

      <h2>The function prologue and epilogue</h2>
      <p>
        Almost every non-trivial function begins and ends with a near-identical instruction pair — recognize
        these two patterns and you can instantly spot where a function starts and ends in a raw disassembly
        listing, even with no symbol names present.
      </p>
      <CodeBlock label="the standard prologue/epilogue pattern">{`# Prologue — runs at the START of a function, sets up its own stack frame
push   %rbp             # save the CALLER's base pointer so it can be restored later
mov    %rsp,%rbp          # establish THIS function's base pointer at the current stack top
sub    $0x40,%rsp          # reserve 0x40 bytes of local variable space (e.g. char buffer[64])

# ... function body runs here ...

# Epilogue — runs at the END, tears the frame back down
leave                      # equivalent to: mov %rbp,%rsp  then  pop %rbp — restores caller's frame
ret                         # pop the return address and jump to it`}</CodeBlock>
      <p>
        The <code>sub $0x40,%rsp</code> line is worth lingering on: that literal number is usually the exact
        total size of every local variable in the function, rounded up for stack alignment. Seeing
        <code> sub $0x48,%rsp</code> right before a <code>char buffer[64]</code> declaration in source (or a
        suspiciously round allocation in a stripped binary) is often your first clue about exactly how much
        room an overflow has to work with before it starts overwriting saved registers.
      </p>

      <h2>Calling conventions: how arguments actually get passed</h2>
      <p>
        Before x86-64, arguments were pushed onto the stack. Modern 64-bit calling conventions pass the
        first several arguments in registers instead — much faster, but it means you read function arguments
        directly out of specific registers at the moment of a <code>call</code> instruction, and which
        registers depends on the operating system's ABI (Application Binary Interface).
      </p>
      <CodeBlock label="the two conventions you'll actually encounter">{`System V AMD64 ABI (Linux, macOS, BSD):
  1st-6th integer/pointer args:  RDI, RSI, RDX, RCX, R8, R9   (further args go on the stack)
  Return value:                  RAX

Microsoft x64 calling convention (Windows):
  1st-4th integer/pointer args:  RCX, RDX, R8, R9              (further args go on the stack)
  Return value:                  RAX
  Also reserves 32 bytes of "shadow space" on the stack for the callee's use`}</CodeBlock>
      <p>
        This is exactly why the same conceptual call — <code>strcmp(user_input, secret)</code> — looks like
        it loads into RDI/RSI in a Linux disassembly (see the worked example below) but would load into
        RCX/RDX on a Windows binary. Knowing which ABI you're reading tells you where to look for "the first
        argument" without needing symbol names or source code at all.
      </p>

      <h2>ARM, briefly: what changes on a phone or an IoT device</h2>
      <p>
        Everything above is x86-64 — what you'll meet on desktop/server Linux and Windows binaries. ARM
        (nearly every phone, and a large share of embedded/IoT devices, including the native{' '}
        <code>.so</code> libraries inside an APK from lesson 1) uses a genuinely different instruction set,
        though the same core concepts — registers, a stack, a return address — still apply underneath:
      </p>
      <CodeBlock label="the same ideas, different names and syntax">{`x86-64          ARM (AArch64)     role
RAX-R15          X0-X30              general-purpose registers (ARM has more of them)
RSP               SP                   stack pointer
RIP                PC                    program counter (ARM's name for the instruction pointer)
(none)              X30 / LR               ARM keeps the return address in a dedicated Link Register
                                            instead of always pushing it onto the stack like x86 does`}</CodeBlock>
      <p>
        That last row is the detail worth remembering even at a glance-only level of ARM fluency: because the
        return address often lives in a register (LR) rather than always sitting on the stack, classic
        stack-smashing mechanics don't transfer to ARM completely unchanged — a function has to explicitly
        push LR onto the stack itself before a nested call can overwrite it, which shapes how ARM-specific
        exploitation differs from the x86 stack layout this lesson has focused on.
      </p>

      <h2>Reading common instructions</h2>
      <CodeBlock label="instructions you'll see constantly in disassembly">{`mov  %rax, %rbx      # copy value from rax into rbx (AT&T syntax: source, destination... reversed from Intel!)
push %rbp             # push a value onto the stack (RSP decreases)
pop  %rbp              # pop a value off the stack into rbp (RSP increases)
lea  0x10(%rbp),%rax    # LOAD EFFECTIVE ADDRESS — computes an address (rbp+0x10) WITHOUT dereferencing it;
                          # used both for "&variable" style address math and as a fast general add/multiply
add  $0x8,%rax           # rax = rax + 8
sub  $0x8,%rax            # rax = rax - 8
xor  %eax,%eax             # a very common IDIOM for "set eax to 0" — smaller encoding than "mov $0,%eax"
call check_password         # push the return address, then jump to check_password
ret                           # pop the return address off the stack, jump to it
cmp  %eax, %ebx                # compare two values (sets CPU flags based on the result — see EFLAGS above)
test %eax,%eax                  # bitwise AND of eax with itself, discarding the result — sets ZF if eax == 0,
                                  # the standard idiom compilers use to check "is this pointer/value zero?"
je   label                        # jump if equal / if ZF is set
jne  label                         # jump if not equal / if ZF is clear
jg   label                          # jump if greater (signed comparison, checks SF/OF)
jl   label                           # jump if less (signed comparison)
ja   label                            # jump if above (UNSIGNED comparison — checks CF instead of SF/OF)
endbr64                                 # a no-op-like marker required at valid indirect-call/jump targets
                                          # under Intel CET (Control-flow Enforcement Technology) — you'll see
                                          # this at the start of nearly every function in a modern compiled
                                          # binary; its presence is itself a mitigation against some
                                          # code-reuse exploitation techniques`}</CodeBlock>
      <Callout variant="warn">
        <p>
          AT&amp;T syntax (used by objdump/gdb by default on Linux) writes <code>source, destination</code>
          — the opposite order from Intel syntax, which most Windows-focused tools and textbooks use
          (<code>destination, source</code>). Mixing them up is the single most common beginner confusion —
          always confirm which syntax you're reading. Note also the important distinction between signed
          jumps (<code>jg</code>/<code>jl</code>, checking SF/OF) and unsigned jumps (<code>ja</code>/
          <code>jb</code>, checking CF) — compilers pick one or the other based on the C variable's
          declared signedness, and misreading which one is in play is a classic source of exploit-dev
          mistakes when reasoning about buffer length checks.
        </p>
      </Callout>

      <h2>A worked example: recognizing a password check</h2>
      <CodeBlock label="disassembly of a simple password check function">{`401150: lea    0x2e5d(%rip),%rax    # load address of a string constant into rax
401157: mov    %rax,%rsi             # set up second argument
40115a: lea    -0x40(%rbp),%rax        # load address of local buffer (user's input)
40115e: mov    %rax,%rdi               # set up first argument
401161: call   strcmp@plt               # call strcmp(user_input, secret_string)
401166: test   %eax,%eax                # test strcmp's return value (0 = match)
401168: jne    401175 <fail>              # if not equal (non-zero), jump to fail
40116e: <success path continues here>`}</CodeBlock>
      <p>
        Even without full fluency, the pattern is recognizable: two values get loaded, <code>strcmp</code>
        is called, and the result determines which branch executes. This exact pattern-recognition skill —
        "this looks like a comparison, and here's the value it's comparing against" — is what lets you find
        a hardcoded password in a disassembly listing even faster than reading strings output alone.
      </p>

      <p>
        With registers, the stack, and basic instruction reading covered, the next lesson puts this into
        practice with an actual debugger — stepping through a running program instruction by instruction.
      </p>
    </div>
  );
}
