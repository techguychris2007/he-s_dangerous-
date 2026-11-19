import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AdversarialMachineLearningEvasion() {
  return (
    <div className="prose-hh">
      <h1>Adversarial Machine Learning: Evasion & Adversarial Examples</h1>
      <p>
        Every previous lesson in this module attacked a large language model through natural-language text.
        This lesson steps back to the broader field of adversarial machine learning — attacks against ANY
        trained model (image classifiers, malware detectors, spam filters, fraud-detection systems), predating
        the LLM-specific prompt injection material by nearly a decade and rooted in a genuinely different
        mechanism: exploiting the mathematical structure of the model itself, rather than its language
        understanding.
      </p>

      <h2>Adversarial examples: inputs crafted to fool a classifier, imperceptibly</h2>
      <p>
        A classic adversarial example takes a correctly-classified input and adds a small, carefully computed
        perturbation — often small enough to be visually or statistically imperceptible to a human — that
        causes the model to misclassify it with high confidence. This isn't a prompt-wording trick; it's a
        mathematical attack exploiting the fact that a trained model's decision boundary, however accurate on
        average, has exploitable gaps a gradient-based search can find.
      </p>
      <CodeBlock label="the conceptual mechanism behind a gradient-based evasion attack">{`Given a model M and a correctly-classified input x (M(x) = "stop sign"):

Compute the gradient of the model's loss function WITH RESPECT TO THE INPUT
itself (not the model's weights, which is how the model was originally
trained) -- this gradient tells you exactly which direction to nudge each
pixel to MAXIMIZE the model's error.

x_adversarial = x + epsilon * sign(gradient)
  -- a small, bounded perturbation (epsilon controls how small/imperceptible)
     added in exactly the direction that most confuses the model

Result: x_adversarial looks visually identical to x to a human, but
M(x_adversarial) = "speed limit 45" -- with high model confidence`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real research — adversarial stop-sign stickers, Eykholt et al., 2018 ("Robust Physical-World
          Attacks on Deep Learning Visual Classification"):</strong> researchers demonstrated that small,
          deliberately positioned black-and-white stickers applied directly to a physical stop sign caused a
          standard road-sign classifier (representative of systems used in autonomous-vehicle research) to
          misclassify it as a speed limit sign with high confidence, across a range of viewing angles and
          distances approximating real-world driving conditions. The attack required no digital access to the
          vehicle's systems at all — just a printed sticker on physical infrastructure — and became one of the
          most widely cited demonstrations that adversarial examples are a genuine physical-world safety
          concern for computer-vision systems, not merely a digital laboratory curiosity confined to pixel-level
          perturbations invisible outside a research paper.
        </p>
      </Callout>

      <h2>Evasion attacks against security-relevant classifiers</h2>
      <p>
        The same technique applies directly against the security tooling this course has covered elsewhere —
        malware classifiers (the Malware module's static/dynamic analysis material) and spam/phishing filters
        are both, underneath, trained classifiers with their own exploitable decision boundaries.
      </p>
      <CodeBlock label="evasion applied to a malware classifier, conceptually">{`A ML-based antivirus engine flags files based on learned features (byte
n-gram frequencies, header structure, imported API patterns). An attacker
who has query access to the classifier (or a similar surrogate model) can
iteratively perturb a malicious file's NON-FUNCTIONAL bytes -- padding,
unused resource sections, benign-looking added imports -- searching for a
modification that flips the classifier's decision from "malicious" to
"benign" while leaving the payload's actual malicious functionality
completely intact.

-- this is structurally the exact same technique as the stop-sign
   attack: small, carefully chosen perturbations to the INPUT, not the
   underlying malicious behavior, exploiting gaps in the classifier's
   learned decision boundary`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This connects directly back to the Anti-Analysis & Evasion Techniques lesson from the Malware module
          — packing, string encryption, and anti-VM checks are evasion techniques targeting a HUMAN analyst or
          a signature-based detector; adversarial perturbation is the mathematically-grounded evasion technique
          specifically targeting a machine-learning-based detector, a distinct but complementary evasion
          category malware authors increasingly combine with the traditional techniques.
        </p>
      </Callout>

      <h2>Membership inference: a quieter adversarial ML attack</h2>
      <p>
        A membership inference attack asks a narrower question: given a specific data record, was it part of
        this model's training set? By observing how confidently a model classifies a given input (models
        typically respond with subtly higher confidence to examples they were trained on versus genuinely new
        ones), an attacker can infer training set membership without ever seeing the training data directly —
        a real privacy risk when training data includes sensitive records, and one of the foundational
        techniques underlying the training-data-extraction research from Lesson 5.
      </p>

      <h2>Defenses: an ongoing arms race, not a solved problem</h2>
      <CodeBlock label="the current state of adversarial ML defense, honestly stated">{`Adversarial training  -- deliberately including adversarial examples in
                         training data, improving robustness against KNOWN
                         attack techniques, at some cost to normal accuracy
Input preprocessing     -- transformations (compression, smoothing) that can
                         disrupt some perturbations, with no guarantee against
                         an adaptive attacker aware of the specific defense
Certified defenses        -- a small set of techniques with formal
                         mathematical robustness guarantees within a bounded
                         perturbation size, at real accuracy/performance cost

-- no defense here provides the kind of complete guarantee a cryptographic
   proof does; this remains a genuinely open, actively researched problem,
   the same honest framing this course applies to jailbreak defenses in
   Lesson 2`}</CodeBlock>

      <p>
        With classical adversarial ML covered as a complement to this module's LLM-specific material, the next
        lesson moves to how organizations actually GOVERN and test AI systems for these risks before
        deployment — AI red teaming methodology and the emerging regulatory landscape.
      </p>
    </div>
  );
}
