import CodeBlock from '../../components/lesson/CodeBlock';

export default function InsecureOutputHandlingAndExcessiveAgency() {
  return (
    <article className="prose-hh">
      <p>
        An AI application produces text or structured proposals that another component consumes. The
        receiving component decides whether those values remain data or become instructions. Improper
        output handling occurs at that conversion boundary. Excessive agency concerns the actions and
        authority available to the system. OWASP's 2025 terminology identifies these as LLM05 and LLM06,
        respectively; older editions used different numbers.
      </p>
      <h2>Text, HTML and executable browser content</h2>
      <p>
        A browser treats a string assigned to textContent as text. Assigning the same string to innerHTML
        asks the browser to parse HTML elements and attributes. An assistant response containing markup
        is not safe merely because the application generated it. The renderer has changed its meaning
        from a displayed value to a document instruction.
      </p>
      <CodeBlock label="Complete harmless browser example — use an isolated local page">{`const response = '<strong>Training reply</strong>';
const textReply = document.createElement('p');
textReply.textContent = response;
document.body.append(textReply);

const htmlReply = document.createElement('p');
htmlReply.innerHTML = response; // parses this fixed harmless fixture only
document.body.append(htmlReply);

// First paragraph displays angle brackets as literal text.
// Second paragraph contains a strong element.
// Never substitute untrusted model output into the second path.`}</CodeBlock>
      <p>
        For a plain-text reply, use a text-rendering API or a framework's ordinary escaped text binding.
        If the product intentionally accepts rich text, use a maintained sanitizer configured for the
        exact allowed elements, attributes and URL schemes. Encoding is context-specific: HTML text,
        attributes, URLs and JavaScript have different rules. Content Security Policy can limit some
        consequences but does not replace correct rendering.
      </p>
      <p>
        XSS impact depends on application context and other controls. HttpOnly cookies cannot be read
        through ordinary document.cookie access, but injected script can still act in the user's page
        context or access other exposed data. One cookie flag is not a complete XSS defense, and not
        every injected script necessarily steals a session cookie.
      </p>
      <h2>JSON syntax is not a permission system</h2>
      <p>
        A model may produce valid JSON requesting an unsupported action or the wrong object. Parsing
        verifies syntax. Schema validation verifies structure and types. Authorization verifies the
        actor's permission for the operation and resource. Each step has a separate job.
      </p>
      <CodeBlock label="Executable Python validation and authorization using synthetic records">{`notes = {
    1: {"owner": "alice", "body": "Alice's training note"},
    2: {"owner": "bob", "body": "Bob's training note"},
}

def read_note_for(actor, proposal):
    if not isinstance(proposal, dict) or set(proposal) != {"tool", "arguments"}:
        raise ValueError("Invalid proposal structure")
    if proposal["tool"] != "read_note":
        raise ValueError("Unsupported tool")
    args = proposal["arguments"]
    if not isinstance(args, dict) or set(args) != {"note_id"}:
        raise ValueError("Invalid argument fields")
    note_id = args["note_id"]
    if type(note_id) is not int or note_id not in notes:
        raise ValueError("Invalid note ID")
    note = notes[note_id]
    if note["owner"] != actor:
        raise PermissionError("Object access denied")
    return note["body"]

print(read_note_for("alice", {"tool": "read_note", "arguments": {"note_id": 1}}))
try:
    read_note_for("alice", {"tool": "read_note", "arguments": {"note_id": 2}})
except PermissionError:
    print("Other owner's note denied")
# actor comes from a verified session in a real server, not the proposal.`}</CodeBlock>
      <p>
        The example permits one tool and one integer argument. Unexpected fields are rejected before
        dispatch; ownership uses an actor from trusted server context. The model cannot grant itself
        another identity by adding an owner or role field. Python bool is a subclass of int: the exact
        type check prevents True from silently serving as record ID 1 under this contract.
      </p>
      <h2>SQL and shell boundaries require their own APIs</h2>
      <p>
        Do not execute a model-generated SQL string with an administrative database account. A constrained
        operation can use fixed query structure and driver-bound values. Reading a note requires both a
        record identifier and the verified owner relationship. Syntactically valid SQL is not proof of
        authorization, and parameterization does not decide whether the actor may access a row.
      </p>
      <CodeBlock label="Complete local SQLite query with bound values and owner policy">{`import sqlite3

with sqlite3.connect(":memory:") as db:
    db.execute("CREATE TABLE notes (id INTEGER, owner TEXT, body TEXT)")
    db.executemany("INSERT INTO notes VALUES (?, ?, ?)", [
        (1, "alice", "Alice fixture"), (2, "bob", "Bob fixture"),
    ])
    verified_actor = "alice"  # real servers obtain this from verified context
    for validated_note_id in (1, 2):
        row = db.execute(
            "SELECT body FROM notes WHERE id = ? AND owner = ?",
            (validated_note_id, verified_actor),
        ).fetchone()
        print(row)
# Expected: ('Alice fixture',) followed by None.`}</CodeBlock>
      <p>
        A shell wrapper has the same distinction. A fixed executable with validated separate arguments
        avoids ordinary shell interpretation, but the program's options and effects still matter.
        Arbitrary command text, filesystem access and privileged credentials are broader capabilities
        than a single bounded read tool. There is no universal sanitizer that makes every shell or SQL
        string safe to execute in every context.
      </p>
      <h2>Functionality, permissions and autonomy</h2>
      <p>
        Functionality is the set of exposed operations: a drafting assistant does not need deletion.
        Permissions are the resources and actions the execution identity may access: a note reader does
        not need every tenant's documents. Autonomy determines when an operation can run without a
        separately authorized decision: preparing a draft and publishing it have different effects.
      </p>
      <p>
        Enforce these restrictions outside the model. Remove unused tools, use narrowly scoped downstream
        identities, validate arguments and check actor/action/resource policy on the server. A prompt
        saying "never delete anything" cannot constrain an endpoint that accepts deletion under a broad
        credential. A model confidence score is also not an authorization result.
      </p>
      <h2>Bind approval to the exact operation</h2>
      <p>
        When policy requires approval, bind it to the actor, action, resource, relevant values and expiry.
        A generic approval message must not authorize a different object later. Changed arguments require
        renewed policy evaluation. Replays and retries need an explicit idempotency contract so a lost
        response does not duplicate an irreversible action.
      </p>
      <p>
        Extend the read-note example with tests for an unsupported tool, unknown field, boolean ID, absent
        object, allowed owner and denied owner. Then implement a separate draft-only operation without
        adding a send function. These exercise actual structure and authority checks without performing
        unsafe email, shell or production-data actions.
      </p>
      <h2>Further reading</h2>
      <ul>
        <li><a href="https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/" target="_blank" rel="noreferrer">OWASP LLM05:2025 Improper Output Handling</a></li>
        <li><a href="https://genai.owasp.org/llmrisk/llm062025-excessive-agency/" target="_blank" rel="noreferrer">OWASP LLM06:2025 Excessive Agency</a></li>
      </ul>
    </article>
  );
}
