import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AiGovernanceRedTeamingSafetyEvaluation() {
  return (
    <div className="prose-hh">
      <h1>AI Governance, Red Teaming & Safety Evaluation</h1>
      <p>
        Every previous lesson covered a specific technical attack. This lesson covers the organizational
        discipline that finds these attacks BEFORE deployment — AI red teaming, adapted from the Red Teaming &
        Active Directory module's methodology — and the governance frameworks increasingly requiring it.
      </p>

      <h2>AI red teaming: the same discipline, a genuinely different target</h2>
      <p>
        The Red Teaming module's core methodology — objective-driven testing, operating like a real adversary
        rather than checking a fixed list — transfers directly to AI systems, but the target itself is
        different in a way that changes the work: instead of a network with a defined topology, the "attack
        surface" is a probabilistic model whose behavior can vary between runs, making reproducibility and
        systematic coverage a genuinely harder problem than red-teaming a fixed network.
      </p>
      <CodeBlock label="what an AI red team actually tests, mapped to this module's own lessons">{`Prompt injection resistance (L2)   -- systematic testing across a large,
                                     evolving set of known jailbreak/
                                     injection patterns, not just a fixed
                                     checklist run once
Output safety (L3)                    -- does the model produce genuinely
                                     harmful content (weapons synthesis
                                     instructions, csam, extremist content)
                                     under adversarial pressure, not just
                                     during ordinary use
Agentic action boundaries (L3)          -- for any deployed agent, does it
                                     ever take a consequential action
                                     (Lesson 3's excessive-agency material)
                                     outside its intended scope under
                                     adversarial prompting
Bias and fairness evaluation              -- does the model produce
                                     systematically different quality/tone
                                     of output across protected
                                     characteristics -- a distinct concern
                                     from this module's other lessons,
                                     rooted in training data composition`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real precedent — OpenAI's GPT-4 external red teaming, disclosed 2023:</strong> ahead of GPT-4's
          public release, OpenAI engaged over 50 external experts across domains including cybersecurity,
          biosecurity, and international security to systematically probe the model for dangerous capabilities
          and safety failures — including testing whether the model could meaningfully assist with tasks like
          synthesizing dangerous biological or chemical materials, and extensive adversarial prompting to
          surface jailbreak techniques before public release. The publicly released GPT-4 System Card documents
          specific categories of red-team findings and the mitigations subsequently applied in response —
          establishing a widely referenced template that other major model providers (Anthropic, Google, and
          others) have since adopted variations of for their own frontier model releases, typically now paired
          with independent third-party evaluation organizations in addition to internal and contracted external
          red teams.
        </p>
      </Callout>

      <h2>NIST AI Risk Management Framework: a structured governance model</h2>
      <CodeBlock label="the NIST AI RMF's four core functions">{`GOVERN   -- organizational policies, accountability structures, and culture
            around AI risk -- the AI-specific analog to the GRC Fundamentals
            lesson's policy hierarchy from the Security+ module
MAP        -- identifying context and categorizing risks specific to a
            given AI system's actual use case (a medical-diagnosis model
            and a marketing-copy generator carry very different risk profiles)
MEASURE      -- the actual technical evaluation: red teaming, adversarial
            testing, bias/fairness metrics, the concrete work this lesson
            and this whole module cover
MANAGE         -- risk response: mitigation, acceptance, monitoring in
            production, and incident response when something is found
            post-deployment`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice GOVERN-MAP-MEASURE-MANAGE is structurally the same risk-management loop as the Security+
          module's GRC Fundamentals lesson — identify context, measure/assess, respond, monitor — the NIST AI
          RMF isn't inventing a new risk-management philosophy so much as applying the established one to
          AI-specific risk categories this module has spent six lessons detailing.
        </p>
      </Callout>

      <h2>The regulatory landscape catching up</h2>
      <CodeBlock label="AI-specific regulation, paralleling the IoT module's regulatory response to Mirai">{`EU AI Act (phased implementation 2025-2027)  -- risk-tiered regulation:
                                              "unacceptable risk" AI is
                                              banned outright, "high-risk"
                                              systems (e.g. those used in
                                              hiring, credit, law
                                              enforcement) face mandatory
                                              risk assessment, documentation,
                                              and human oversight requirements
US state-level AI legislation                 -- a growing patchwork
                                              (Colorado's AI Act among the
                                              first comprehensive examples)
                                              requiring risk assessments and
                                              consumer disclosure for
                                              "high-risk" automated decisions
Sector-specific AI guidance                      -- e.g. FDA guidance for
                                              AI/ML-based medical devices,
                                              requiring evidence of ongoing
                                              performance monitoring post-
                                              deployment, not just a one-time
                                              pre-market evaluation`}</CodeBlock>
      <p>
        This mirrors the IoT module's Lesson 5 exactly: a wave of incidents and well-documented failure modes
        (this module's entire lesson set, for AI) drives regulation that turns what was previously
        best-practice guidance into a legal requirement — the same pattern, a different technology category.
      </p>

      <h2>Building AI red teaming into a real development lifecycle</h2>
      <CodeBlock label="where red teaming fits, not as a one-time gate but a recurring practice">{`Pre-deployment  -- comprehensive red team pass before initial release
                  (the GPT-4 System Card pattern)
Pre-major-update  -- re-testing before any significant model or system
                  prompt change -- a fine-tune, a new tool/plugin added
                  to an agent, or an updated system prompt can all
                  reopen previously-mitigated findings
Continuous          -- production monitoring for novel jailbreak patterns
                  observed in real traffic, feeding back into the next
                  red-team cycle -- the AI-specific version of the SOC
                  Detection Engineering module's continuous-tuning loop`}</CodeBlock>

      <p>
        With governance and red-teaming methodology covered, the final lesson turns to production: how
        multi-agent AI systems introduce a new trust dimension — agent-to-agent trust — and closes this module
        with its final synthesis.
      </p>
    </div>
  );
}
