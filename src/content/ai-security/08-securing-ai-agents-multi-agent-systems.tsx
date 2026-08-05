import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SecuringAiAgentsMultiAgentSystems() {
  return (
    <div className="prose-hh">
      <h1>Securing AI Agents & Multi-Agent Systems in Production</h1>
      <p>
        This closing lesson covers the current frontier of AI application architecture — systems where
        multiple AI agents call each other, use shared tool-calling standards, and operate with real
        production access — and synthesizes this entire module's eight lessons into one final throughline.
      </p>

      <h2>Agent-to-agent trust: the excessive-agency problem, compounded</h2>
      <p>
        A single agent's excessive agency (Lesson 3) is dangerous enough. A <strong>multi-agent</strong> system
        — where one agent's output becomes another agent's input, often across several hops, sometimes across
        organizational boundaries — compounds the problem: each agent in the chain has to decide how much to
        trust content that arrived from ANOTHER agent, which itself may have been successfully prompt-injected
        upstream.
      </p>
      <CodeBlock label="an indirect injection propagating across an agent chain">{`[Research Agent] fetches a webpage containing a hidden injection payload
       |  (Lesson 2's indirect injection pattern)
       v
[Summarizer Agent] receives the Research Agent's "summary," which now
                    contains the injected instruction, presented as if it
                    were simply part of the research findings
       |
       v
[Action Agent]      receives the (still-injected) summary and, trusting it
                    as legitimate upstream research, executes the tool call
                    the original injection specified

-- the Action Agent never saw the original malicious webpage at all -- it
   trusted output from another AI agent, exactly the way the Insecure
   Output Handling lesson said any consumer of LLM output should NOT`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This is the multi-agent-native version of a confused deputy problem — a well-established security
          concept (a program tricked into misusing its own legitimate authority on behalf of an attacker) now
          playing out across a chain of AI agents instead of a single privileged process. Every mitigation from
          Lesson 3 still applies, just at every hop: least privilege per agent, no agent trusting another
          agent's output as inherently more authoritative than raw user input, and human confirmation gates
          before any hop in the chain takes a consequential action.
        </p>
      </Callout>

      <h2>MCP and standardized tool-calling: new plumbing, the same LLM07 risks</h2>
      <p>
        The Model Context Protocol (MCP) and similar standardized tool-calling frameworks, which saw rapid
        adoption starting in late 2024, let an AI application connect to external tools and data sources
        through a common protocol rather than bespoke integrations — genuinely useful for interoperability,
        and also a new, standardized surface for exactly the insecure-plugin-design risks from Lesson 3.
      </p>
      <CodeBlock label="why standardization is a double-edged sword here">{`Benefit:     one well-audited MCP server implementation can be reused
             safely across many different AI applications, rather than
             every team building its own bespoke, unaudited tool integration

Risk:          a vulnerable or MALICIOUS MCP server, once connected, is
             immediately available to every agent that connects to it --
             the exact same "widely-shared, one-bug-affects-everyone"
             dynamic as a vulnerable shared library (the Least Common
             Mechanism principle from Security Engineering) or a
             typosquatted package (Lesson 4's supply-chain material),
             just at the protocol-standardization layer for AI tool access`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The practical guidance is unchanged from Lesson 3: treat every MCP server or tool connection exactly
          like any other third-party dependency — reviewed, scoped to least privilege, and never granted more
          capability than the specific agent's task genuinely requires, regardless of how standardized or
          seemingly well-audited the underlying protocol is.
        </p>
      </Callout>

      <h2>Production monitoring: applying the SOC modules to AI systems</h2>
      <CodeBlock label="what an AI-aware SOC actually watches for, extending the SOC Detection Engineering module">{`- Anomalous tool-call PATTERNS (an agent suddenly calling tools/endpoints
  it has never used before, or at unusual volume) -- the UEBA lesson's
  behavioral-baseline approach, applied to agent behavior instead of
  human user behavior
- Prompt/response pairs flagged by automated classifiers for known
  injection/jailbreak signatures, feeding into the same detection-
  engineering tuning loop as any other correlation rule
- Cost and latency anomalies (Lesson 4's model-DoS material) as a
  detection signal in their own right, not just a billing concern`}</CodeBlock>

      <h2>Module synthesis: the complete arc, eight lessons</h2>
      <CodeBlock label="the throughline from Lesson 1 through this closing lesson">{`L1  Fundamentals    -> natural language is untrusted input with no
                       cryptographic separation from developer instructions
L2  Injection         -> attackers exploit that gap directly to make a
                       model SAY something it shouldn't
L3  Output/Agency       -> insecure output handling and excessive agency
                       turn "said something bad" into real technical impact
L4  Supply chain          -> the risk exists before deployment too --
                       poisoned data, malicious model files, model theft
L5  Disclosure              -> even a fully legitimate model leaks:
                       memorization, careless input, unscoped RAG retrieval
L6  Adversarial ML             -> a parallel, older attack class exploiting
                       a model's mathematical structure, not its language
                       understanding
L7  Governance                   -> red teaming and regulatory frameworks
                       that catch this BEFORE production
L8  Multi-agent                    -> every risk from L1-L7 compounds
                       across chains of agents trusting each other's output`}</CodeBlock>
      <p>
        The single idea underneath all eight lessons, restated one final time: an AI model — however
        capable, however many agents or tools are wired around it — cannot reliably police its own trust
        boundaries. Every real security guarantee in this module came from something enforced OUTSIDE the
        model: least privilege on tools, output validation at the point of use, human confirmation on
        consequential actions, and red-teamed, monitored deployment. That is not a limitation specific to
        today's AI systems that a smarter future model will simply outgrow — it is the same lesson this entire
        course has taught from its very first module: trust has to be verified and enforced at a system
        boundary, never assumed from good intentions alone.
      </p>
    </div>
  );
}
