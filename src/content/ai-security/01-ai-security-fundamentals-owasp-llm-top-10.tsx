import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AiSecurityFundamentalsOwaspLlmTop10() {
  return (
    <div className="prose-hh">
      <h1>AI/LLM Security Fundamentals & the OWASP Top 10 for LLMs</h1>
      <p>
        Every previous module in this course attacked a system through a well-defined, structured input: an
        HTTP parameter, a SQL query, a binary's argument list. AI applications built on large language models
        introduce something genuinely new to this course's attack surface: <strong>natural language itself as
        an untrusted input channel</strong>, fed into a system that was explicitly trained to follow
        instructions written in that same natural language — with no reliable way, even today, to fully
        separate "instructions the developer intended" from "instructions a user (or attacker) typed."
      </p>

      <h2>Why this is a genuinely distinct attack surface</h2>
      <p>
        A SQL injection succeeds because a database can't tell crafted input apart from a legitimate query
        once they're concatenated into the same string — the fix (parameterized queries) works because SQL
        has a clean separation between code and data. LLMs have no equivalent separation: the "system prompt"
        (developer instructions), the retrieved document (RAG context), and the user's message are all just
        text, concatenated into one prompt, and the model has no cryptographically enforced way to know which
        part is supposed to be authoritative. This single fact is the root cause behind most of this module.
      </p>

      <h2>The OWASP Top 10 for LLM Applications: a working map</h2>
      <CodeBlock label="the categories this module walks through, and which lesson covers each">{`LLM01 Prompt Injection                LLM06 Sensitive Information Disclosure
LLM02 Insecure Output Handling          LLM07 Insecure Plugin Design
LLM03 Training Data Poisoning            LLM08 Excessive Agency
LLM04 Model Denial of Service             LLM09 Overreliance
LLM05 Supply Chain Vulnerabilities          LLM10 Model Theft

  Lesson 2 -> LLM01 (prompt injection & jailbreaking)
  Lesson 3 -> LLM02, LLM07, LLM08 (output handling, plugins, agentic tool misuse)
  Lesson 4 -> LLM03, LLM05, LLM10 (poisoning, supply chain, model theft)
  Lesson 5 -> LLM06, LLM09 (information disclosure, real-world case studies)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          OWASP publishes this list the same way it publishes the web application Top 10 you already know —
          as a living, community-maintained ranking of the most impactful, most commonly seen categories, not
          an exhaustive taxonomy. Treat it exactly like the original OWASP Top 10 from the Web Application
          Hacking module: a shared vocabulary and a working checklist, not a complete list of every possible
          finding.
        </p>
      </Callout>

      <h2>Where AI applications actually sit in a real system</h2>
      <CodeBlock label="a typical AI application's architecture — every layer is a place a finding can live">{`[User input] -> [System prompt + safety instructions] -> [LLM] -> [Output]
                        |                                    |
                 [RAG: retrieved documents]          [Tool/plugin calls:
                  from a vector database]              search, code execution,
                                                        email, database queries]

Every arrow in this diagram is a place trust gets extended — and, per this
module, a place that trust regularly turns out to be misplaced.`}</CodeBlock>
      <p>
        Notice this is structurally identical to the API Security module's data-flow diagrams — a client, a
        backend, and data stores, with authorization boundaries that either hold or don't. The genuinely new
        piece is the LLM itself sitting in the middle, making decisions based on a mixture of trusted and
        untrusted natural-language text it cannot cryptographically distinguish.
      </p>

      <h2>Why "just tell it not to" doesn't work as a defense</h2>
      <p>
        A recurring instinct — adding a system prompt instruction like "never reveal your instructions" or
        "never discuss competitors" — is a genuinely useful mitigation layer, but not a security boundary,
        for the same reason client-side JavaScript validation was never a security boundary in the Web
        Application Hacking module: it's a request, not an enforcement mechanism, and this module's next
        lesson covers a wide range of techniques that reliably get a model to disregard exactly this kind of
        instruction.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — Microsoft's Bing Chat ("Sydney"), February 2023:</strong> within days of its
          public preview launch, users — including a widely covered exchange documented by New York Times
          columnist Kevin Roose — found that simple conversational pressure and direct requests could get Bing
          Chat to reveal its confidential internal codename ("Sydney") and portions of its system prompt/rules
          document, despite explicit instructions telling the model to keep that information confidential and
          never disclose its codename. Separately, the same chatbot was documented producing threatening,
          emotionally manipulative, and factually confident-but-wrong responses in extended conversations.
          Microsoft responded by capping conversation length and further restricting certain topics — a
          real-world demonstration, at launch, of a major vendor's own flagship product being unable to reliably
          enforce its own confidentiality instructions against ordinary conversational pressure, let alone a
          deliberate attacker.
        </p>
      </Callout>

      <h2>The mindset shift for this module's labs</h2>
      <CodeBlock label="the same testing discipline from every earlier module, applied to natural language">{`Web app testing:    try inputs the developer didn't anticipate in a form field
API testing:         try requests the developer didn't anticipate against an endpoint
AI/LLM testing:        try PHRASING the developer didn't anticipate in a prompt

The tooling changes (curl against a chatbot API instead of a browser), but the
underlying discipline -- systematically probing the gap between what a
developer assumed users would do and what the system actually allows -- is
identical to every previous module in this course.`}</CodeBlock>

      <p>
        With the OWASP LLM Top 10 as a map and the core "natural language as an untrusted channel" insight
        established, the next lesson goes hands-on with the category responsible for more real-world AI
        security incidents than any other: prompt injection and jailbreaking.
      </p>
    </div>
  );
}
