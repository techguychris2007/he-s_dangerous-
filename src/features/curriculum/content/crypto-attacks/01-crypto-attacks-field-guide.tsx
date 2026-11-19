import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CryptoAttacksFieldGuide() {
  return (
    <div className="prose-hh">
      <h1>Applied Cryptography Attacks: A Pentester's Field Guide</h1>
      <p>
        Breaking real, correctly-implemented AES or RSA is not a realistic pentest finding — the math is sound
        and the key spaces are astronomically large. Almost every "crypto bug" you'll actually find in the wild
        isn't a flaw in the algorithm at all; it's a flaw in how a developer <em>used</em> it: the wrong mode,
        a key derived from something guessable, an oracle that leaks one bit of information at a time, or a
        signature scheme trusting metadata it should have ignored. This module is about that gap — attacking
        the implementation, not the mathematics.
      </p>

      <h2>The four failure patterns almost every real finding falls into</h2>
      <ul>
        <li>
          <strong>Wrong mode of operation.</strong> AES itself might be fine, but ECB mode encrypts identical
          plaintext blocks to identical ciphertext blocks every time — leaking structure even though the cipher
          is "secure." Covered in lesson 3.
        </li>
        <li>
          <strong>An oracle that answers a yes/no question it shouldn't.</strong> A padding oracle, covered in
          lesson 2, is the canonical example: the server doesn't leak the plaintext directly, but it leaks
          whether your guess was "padding-valid" or not — and that single bit, asked enough times, recovers the
          entire plaintext.
        </li>
        <li>
          <strong>Weak or predictable key material.</strong> A short password used directly as an AES key, a
          key derived from a timestamp, or a hardcoded key shipped inside a mobile app's binary all defeat
          strong cryptography by making the <em>key</em> the weak point instead of the algorithm.
        </li>
        <li>
          <strong>Trusting client-supplied metadata about the crypto itself.</strong> The JWT{' '}
          <code>alg=none</code> attack from the API Security module is exactly this pattern: the verifier
          trusted the token's own claim about which algorithm to use.
        </li>
      </ul>

      <h2>Hash vs. encryption vs. encoding — the confusion that causes real bugs</h2>
      <p>
        Developers occasionally use these three interchangeably in ways that create real vulnerabilities:
      </p>
      <CodeBlock label="three different things, often confused">{`Encoding (Base64, hex, URL-encoding):
  - Fully reversible, no key needed, NOT security — "aGVsbG8=" decodes to "hello" instantly.
  - Bug pattern: storing a password "encrypted" as base64 — it isn't encrypted at all.

Hashing (MD5, SHA-256, bcrypt):
  - One-way by design — meant to be irreversible, used to verify integrity or store passwords.
  - Bug pattern: using a fast general-purpose hash (MD5/SHA-256) for PASSWORDS instead of a slow,
    purpose-built one (bcrypt/argon2/scrypt) — fast hashes are exactly what makes offline cracking fast.

Encryption (AES, RSA):
  - Reversible ONLY with the correct key — the only one of the three meant to hide data from someone
    who doesn't have that key.
  - Bug pattern: using ECB mode, a weak/reused key, or no authentication tag (letting ciphertext be
    tampered with undetected).`}</CodeBlock>

      <h2>Identifying what you're looking at before attacking it</h2>
      <p>
        A string's length and character set are usually enough to narrow down what you're facing before you
        write a single line of attack code:
      </p>
      <CodeBlock label="quick identification by eye">{`32 hex chars           -> likely MD5
40 hex chars           -> likely SHA-1
64 hex chars           -> likely SHA-256
$2a$/$2b$/$2y$ prefix  -> bcrypt (has its own embedded cost factor + salt)
$1$ prefix             -> old md5crypt
ends in "=" or "=="    -> base64 (encoding, not hashing — decode it, don't crack it)
three base64 segments
  separated by dots    -> a JWT (see the API Security module)`}</CodeBlock>
      <p>
        Tools like <code>hashid</code> and hashcat's own <code>--identify</code> flag automate this, but
        recognizing the shape by eye is faster for anything you'll see repeatedly, and prevents wasting time
        running a cracking attack against something that was never hashed in the first place (like a base64-
        encoded string someone mistook for a hash).
      </p>

      <h2>A fifth pattern: non-constant-time comparison</h2>
      <p>
        Even a correct algorithm with a correct key can leak through <em>how</em> a comparison is coded.
        Standard string/byte equality (<code>==</code>, most languages' default <code>equals</code>) returns
        as soon as it finds the first mismatched byte — which means comparing a submitted token against the
        real one takes measurably longer the more LEADING bytes happen to match. Given enough requests and
        precise enough timing, an attacker can recover a secret token one byte at a time by trying every
        possible next byte and keeping whichever one made the response take fractionally longer.
      </p>
      <CodeBlock label="the vulnerable pattern vs. the fix">{`# vulnerable — early-exit comparison leaks timing information
if submitted_token == real_token: ...

# fixed — constant-time comparison always examines every byte, regardless of where a mismatch is
import hmac
if hmac.compare_digest(submitted_token, real_token): ...`}</CodeBlock>
      <p>
        This is a genuinely subtle bug class — the timing difference per byte is often microseconds, requiring
        many samples averaged together to detect over a real network — but it's a standard, real category
        auditors specifically check for on anything comparing API keys, HMAC signatures, or session tokens.
      </p>

      <Callout variant="tip">
        <p>
          Every technique in this module targets an <em>implementation choice</em>, not the underlying math.
          If you ever find yourself trying to brute-force a full AES-256 key directly, or factor a real
          2048-bit RSA modulus, stop — that's not a realistic attack path, and a finding write-up claiming it
          is will cost you credibility with anyone technical who reviews it.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Cracking hashes, forging tokens, and probing crypto oracles all still count as active testing against
          a system — stay inside an authorized scope for every technique in this module, exactly as with any
          other offensive-security work on this platform.
        </p>
      </Callout>
    </div>
  );
}
