import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CryptographicEngineeringPitfalls() {
  return (
    <div className="prose-hh">
      <h1>Cryptographic Engineering Pitfalls</h1>
      <p>
        Almost no real-world cryptographic break comes from someone finding a flaw in AES or RSA
        mathematics itself. Nearly every real break comes from how crypto gets USED — key management,
        protocol composition, and implementation details the underlying algorithm's security proof never
        covered in the first place.
      </p>

      <h2>"Don't roll your own crypto" — and why that's not enough advice alone</h2>
      <p>
        This is famous advice for good reason, but it's incomplete: using a well-vetted algorithm
        (AES, RSA, SHA-256) doesn't protect you from misusing it. The overwhelming majority of real crypto
        failures happen in the surrounding engineering, not the primitive itself.
      </p>

      <h2>Key management: where most real failures live</h2>
      <CodeBlock label="the recurring pattern across nearly every crypto-adjacent lab in this course">{`- Hardcoded keys in source code or config files (the exposed Terraform state, leaked JS bundle labs)
- Keys with no rotation policy — a compromised key stays useful to an attacker indefinitely
- Reused keys/IVs across multiple messages (catastrophic for several encryption modes — see below)
- Keys stored alongside the data they protect (defeats the purpose entirely if both are stolen together)`}</CodeBlock>

      <h2>IV/nonce reuse — a small mistake with a total-break consequence</h2>
      <p>
        Many encryption modes (like AES-CTR, or the keystream generation in stream ciphers) require a
        unique nonce/IV for every single message encrypted under the same key. Reuse that nonce even once,
        and an attacker who has two ciphertexts encrypted with the same key+nonce can typically recover the
        XOR of the two plaintexts directly — often enough to fully recover both messages, especially if
        either one has predictable structure (like a known file header).
      </p>
      <Callout variant="warn">
        <p>
          This is precisely why modern authenticated encryption modes (AES-GCM, ChaCha20-Poly1305) are
          strongly preferred over manually composing encryption + a separate MAC — they make correct nonce
          handling closer to foolproof by design, closing off exactly this class of implementation mistake.
        </p>
      </Callout>

      <h2>Padding oracle attacks</h2>
      <p>
        Block ciphers require padding to fill the last block to the correct size. If a system reveals —
        even indirectly, through a different error message or response timing — whether decrypted padding
        was valid or invalid, an attacker can use that oracle to decrypt an entire ciphertext byte by byte,
        without ever knowing the key. This was a real, repeatedly-rediscovered vulnerability class across
        many different products for over a decade, purely because "tell the user why decryption failed"
        felt like reasonable, helpful error handling.
      </p>

      <h2>Protocol composition errors</h2>
      <p>
        Two individually secure cryptographic building blocks, composed incorrectly, can produce an
        insecure system. Classic examples: encrypting then authenticating vs. authenticating then
        encrypting produce meaningfully different security guarantees (encrypt-then-MAC is generally
        preferred specifically because it lets you reject tampered ciphertext before ever attempting
        decryption); signing a hash without a proper domain separator can let a signature meant for one
        context be replayed as valid in a different, unintended context.
      </p>

      <h2>Side-channel attacks: leaking through the implementation, not the math</h2>
      <CodeBlock label="what actually leaks">{`Timing side channels    — a comparison that returns "as soon as it finds a mismatch" leaks information
                          through how LONG the comparison took, byte by byte (why constant-time string
                          comparison functions exist specifically for secrets like password hashes/HMACs)
Power analysis           — measuring a device's power draw during a cryptographic operation can leak
                          key material, particularly relevant for smart cards and embedded/IoT hardware
Cache-timing attacks      — inferring secret data from CPU cache access patterns during encryption`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The fix for timing side channels in comparisons is deceptively simple in concept — always compare
          the FULL length of both values regardless of where a mismatch occurs, taking constant time no
          matter what — but easy to get wrong by accident with an ordinary, "obviously correct" early-return
          string comparison.
        </p>
      </Callout>

      <p>
        With cryptographic engineering pitfalls covered, the final lesson synthesizes this entire module —
        and much of this course — into a set of recurring patterns behind why security systems fail in
        practice, again and again, across completely different technologies.
      </p>
    </div>
  );
}
