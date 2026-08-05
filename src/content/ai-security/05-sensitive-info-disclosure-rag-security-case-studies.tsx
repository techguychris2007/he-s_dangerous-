import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SensitiveInfoDisclosureRagSecurityCaseStudies() {
  return (
    <div className="prose-hh">
      <h1>Sensitive Information Disclosure, RAG Security & Case Studies</h1>
      <p>
        This closing lesson covers LLM06 (Sensitive Information Disclosure) — what a fully legitimate,
        untampered, non-jailbroken model can still leak simply by doing exactly what it was trained to do —
        the security-specific risks unique to Retrieval-Augmented Generation (RAG) systems, and a set of
        further real-world incidents that tie this entire module together.
      </p>

      <h2>Training data memorization: models can regurgitate specific training examples</h2>
      <p>
        Large models are trained to generalize, but they don't purely generalize — academic research has
        repeatedly demonstrated that models can memorize and later reproduce verbatim or near-verbatim
        fragments of specific training examples, particularly ones that were rare, unusual, or repeated many
        times in the training corpus. A carefully crafted prompt that resembles the beginning of a memorized
        sequence can sometimes cause the model to complete it with the actual memorized continuation — a real
        finding, not a hypothetical.
      </p>
      <Callout variant="incident">
        <p>
          <strong>Real research — "Extracting Training Data from Large Language Models," Carlini et al.,
          USENIX Security 2021:</strong> researchers from Google, Stanford, Berkeley, and OpenAI demonstrated
          that GPT-2 (then a leading public language model) could be prompted to regurgitate memorized
          training examples verbatim — including, in specific documented cases, an individual's real name,
          phone number, and email address that had appeared in the training data, extracted purely through
          carefully chosen prompts with no access to the model's weights or training pipeline beyond its
          public API. The paper's methodology — generating a large number of samples, then ranking them by
          measures of "how memorized does this look" — became foundational for how the field now tests
          production models for training-data memorization before deployment, and the underlying risk (models
          trained on any data containing PII can potentially leak fragments of it) remains directly relevant
          to every model trained on real-world text.
        </p>
      </Callout>

      <h2>The employee-facing risk: what you type INTO the model matters just as much</h2>
      <Callout variant="incident">
        <p>
          <strong>Real incident — Samsung employees and ChatGPT, disclosed April 2023:</strong> multiple Samsung
          semiconductor division employees reportedly pasted confidential internal material directly into
          ChatGPT on at least three separate occasions — including proprietary source code being debugged and
          notes from an internal meeting — in order to get the chatbot's help with everyday tasks like fixing
          code and summarizing content. Because that input could potentially be retained and used to improve
          the underlying service (depending on the account tier and settings in place at the time), Samsung's
          own confidential data had, in effect, left the company's control the moment it was typed into a
          third-party AI service. Samsung responded by restricting employee use of external generative AI
          tools entirely. This incident is a distinct risk category from every other one in this module — it
          requires no attacker, no injection, and no jailbreak at all; it's simply what happens when sensitive
          organizational data is fed into a third-party AI service with no data-handling agreement covering
          that use case.
        </p>
      </Callout>

      <h2>RAG-specific risks: the retrieval layer has its own authorization surface</h2>
      <p>
        Retrieval-Augmented Generation systems fetch relevant documents from a vector database and inject them
        into the model's context before generating a response — letting a model answer questions about private,
        organization-specific data it was never trained on. This retrieval step has its own distinct security
        surface, structurally identical to the authorization problems from the API Security module.
      </p>
      <CodeBlock label="cross-tenant data leakage — BOLA, at the vector-retrieval layer">{`# a multi-tenant RAG chatbot, one shared vector index across ALL customers:
def answer_question(user_query, tenant_id):
    relevant_docs = vector_db.similarity_search(user_query, top_k=5)
    # ^ BUG: no filter scoping results to tenant_id -- the similarity search
    #   runs across the ENTIRE shared index, every tenant's documents included
    return llm.generate(context=relevant_docs, question=user_query)

# a query crafted to semantically resemble another tenant's confidential
# documents can retrieve and surface THEIR content in the response --
# this is Broken Object Level Authorization (the API Security module's
# BOLA lesson) with the vector database standing in for the database`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The fix is exactly the same fix as BOLA anywhere else in this course: every retrieval query must be
          scoped by the requesting user/tenant's actual authorization, enforced at the query layer itself — not
          left to the LLM to somehow "know" not to mention another tenant's data once it's already sitting in
          its context window. Once sensitive text is in the context, output filtering is a much weaker,
          much later line of defense than never retrieving it in the first place.
        </p>
      </Callout>

      <h2>System prompt leakage as its own disclosure risk</h2>
      <p>
        A system prompt often contains more than instructions — real deployments frequently embed API keys,
        internal tool names, business logic (pricing rules, eligibility criteria), or competitive information
        directly in the prompt text for convenience. Every technique from Lesson 2 that extracts a system
        prompt turns that convenience into a direct LLM06 finding — which is why sensitive configuration
        belongs in the application layer behind the model, never in text the model itself might be persuaded
        to repeat back.
      </p>

      <h2>Module synthesis: the throughline across all five lessons</h2>
      <CodeBlock label="the arc this module walked through">{`Lesson 1  -> natural language is an untrusted input channel with no
             cryptographic separation between developer and user instructions
Lesson 2   -> prompt injection and jailbreaking exploit that gap directly,
             getting the model to SAY something it shouldn't
Lesson 3    -> insecure output handling and excessive agency turn "said
             something bad" into real technical impact, by trusting model
             output/actions the same uncritical way a vulnerable app trusts
             raw user input
Lesson 4     -> the risk exists even before deployment: poisoned training
             data, a malicious model file, or a wholesale-extracted model
Lesson 5      -> even a fully legitimate model leaks: memorized training
             data, careless human input, and unscoped RAG retrieval`}</CodeBlock>
      <p>
        The single idea underneath every lesson in this module: an LLM is a powerful text-processing system
        that cannot, on its own, reliably distinguish trustworthy instructions from untrustworthy ones — which
        means every security decision has to be enforced OUTSIDE the model, in the application layer wrapped
        around it, using the exact same authorization, output-validation, and least-privilege discipline this
        entire course has built toward from its very first module.
      </p>
    </div>
  );
}
