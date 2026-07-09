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
RSP  — STACK POINTER — points to the top of the current stack frame
RBP  — BASE POINTER — points to the base of the current stack frame (a stable reference within a function)
RIP  — INSTRUCTION POINTER — points to the next instruction to execute (this is what exploits ultimately hijack)`}</CodeBlock>

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

      <h2>Reading common instructions</h2>
      <CodeBlock label="instructions you'll see constantly in disassembly">{`mov  %rax, %rbx      # copy value from rax into rbx (AT&T syntax: source, destination... reversed from Intel!)
push %rbp             # push a value onto the stack (RSP decreases)
pop  %rbp              # pop a value off the stack into rbp (RSP increases)
call check_password     # push the return address, then jump to check_password
ret                       # pop the return address off the stack, jump to it
cmp  %eax, %ebx           # compare two values (sets CPU flags based on the result)
je   label                 # jump if equal (based on flags cmp just set)
jne  label                  # jump if not equal`}</CodeBlock>
      <Callout variant="warn">
        <p>
          AT&amp;T syntax (used by objdump/gdb by default on Linux) writes <code>source, destination</code>
          — the opposite order from Intel syntax, which most Windows-focused tools and textbooks use
          (<code>destination, source</code>). Mixing them up is the single most common beginner confusion —
          always confirm which syntax you're reading.
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
