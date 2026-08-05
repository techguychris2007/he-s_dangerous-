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

      <h2>Key derivation: turning one secret into many, safely</h2>
      <p>
        A real system rarely needs just one key — encryption, authentication (a MAC key), and different
        subsystems often each want their own. The unsafe shortcut is reusing the same master key directly for
        multiple purposes, or deriving related keys through an ad hoc method (like simple concatenation or a
        single hash). A <strong>KDF (Key Derivation Function)</strong> — HKDF being the modern standard —
        exists specifically to take one high-entropy master secret and derive as many independent,
        cryptographically separated keys as needed, each provably unrelated to the others even though they
        all trace back to the same root secret.
      </p>
      <CodeBlock label="the pattern HKDF replaces, and why it matters">{`UNSAFE:  encryption_key = master_secret
         mac_key        = master_secret          # same key reused for two DIFFERENT purposes —
                                                    # a break in one context can leak information
                                                    # useful against the other

SAFE:    encryption_key = HKDF(master_secret, info="encryption")
         mac_key        = HKDF(master_secret, info="authentication")
         # the "info" parameter cryptographically separates the outputs — knowing one
         # derived key reveals nothing about the other, even though both trace to the
         # same master secret`}</CodeBlock>
      <p>
        This is exactly the mechanism TLS 1.3 uses internally to derive its many separate traffic keys from
        a single handshake secret — the same "one root secret, many safely-separated derived keys" pattern,
        just applied at the scale of an entire protocol rather than one application's key management.
      </p>

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

      <Callout variant="incident">
        <p>
          <strong>Real incident — Sony PlayStation 3, 2010:</strong> Sony used ECDSA to sign code and
          firmware so only Sony-approved software would run on the console, a well-chosen algorithm applied
          correctly in every respect except one — the "random" nonce (<code>k</code>) required for every
          ECDSA signature was implemented as a fixed, constant value instead of a fresh random number per
          signature. The hacking group fail0verflow demonstrated that reusing the same nonce across two or
          more ECDSA signatures lets an attacker solve directly for the private signing key using basic
          algebra, no brute-forcing required. The result: Sony's entire root code-signing private key was
          recoverable from public signatures Sony itself had shipped, permanently defeating the console's
          entire software-authenticity model. Nothing was wrong with ECDSA the algorithm — the entire break
          was one implementation detail, exactly the class of failure this lesson opened with.
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
      <Callout variant="incident">
        <p>
          <strong>Real incident — the ASP.NET padding oracle attack, 2010:</strong> researchers Juliano
          Rizzo and Thai Duong showed that ASP.NET's default error handling leaked exactly this signal —
          a distinguishable server response when decrypted padding was invalid versus when it was valid but
          the underlying data was malformed. Because ASP.NET used this same encryption to protect
          <code>ViewState</code> and other internal tokens across effectively every ASP.NET web application
          in existence at the time, the technique let an attacker decrypt encrypted data and, in many
          configurations, forge valid encrypted tokens from scratch — enough in some deployments to read
          arbitrary files off the server. Microsoft shipped an out-of-band patch (MS10-070) rather than
          waiting for its normal update cycle, underscoring how severe a "the error message is slightly too
          informative" bug can become at that scale.
        </p>
      </Callout>

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
