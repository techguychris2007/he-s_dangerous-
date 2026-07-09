import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CryptographyFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Cryptography Fundamentals</h1>
      <p>
        You've used TLS, hashes, and certificates constantly throughout this course without stopping to
        unpack the mechanics. This lesson fills that in — the conceptual foundation Security+ requires and
        that every later module (PKI misconfigurations, weak cipher identification) depends on.
      </p>

      <h2>Symmetric vs. asymmetric encryption</h2>
      <CodeBlock label="the core tradeoff">{`SYMMETRIC (one shared key)              ASYMMETRIC (public/private key pair)
- Same key encrypts and decrypts         - Public key encrypts, private key decrypts (or vice versa for signing)
- Fast — used for bulk data              - Slow — used for key exchange & signatures, not bulk data
- Key distribution is the hard problem   - Solves key distribution, at a performance cost
- Examples: AES, ChaCha20                - Examples: RSA, ECC, Diffie-Hellman`}</CodeBlock>
      <p>
        This is exactly why TLS uses both: an asymmetric handshake negotiates a shared symmetric key, then
        all the actual bulk data transfer uses fast symmetric encryption with that negotiated key.
      </p>

      <h2>Hashing: one-way fingerprints</h2>
      <CodeBlock label="hashing vs. encryption — a distinction the exam tests directly">{`Encryption  — reversible (with the right key)
Hashing     — irreversible by design; a fixed-length "fingerprint" of input data

Common algorithms:
MD5      — broken, collision-prone, still seen in legacy systems (never use for new work)
SHA-1     — broken for collision resistance, deprecated
SHA-256   — current standard for integrity checking, digital signatures
bcrypt/Argon2 — purpose-built for PASSWORD hashing specifically (slow by design, with built-in salting)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A generic fast hash like SHA-256 is the WRONG choice for storing passwords, even though it's a
          fine choice for file-integrity checking — its speed is a security weakness in that specific
          context, since it makes brute-forcing billions of password guesses per second cheap. bcrypt and
          Argon2 are deliberately slow specifically to defeat that.
        </p>
      </Callout>

      <h2>PKI: how trust actually gets established</h2>
      <CodeBlock label="the certificate chain">{`Root CA (self-signed, trusted by your OS/browser out of the box)
   └─ Intermediate CA (signed by the root)
        └─ Your server's certificate (signed by the intermediate)

Your browser verifies this chain top-down every time it connects over HTTPS.`}</CodeBlock>
      <p>
        A certificate itself contains: the public key, the domain(s) it's valid for, an expiration date,
        and the issuing CA's digital signature over all of that. If any link in the chain is broken —
        expired, revoked, or signed by an untrusted CA — the browser throws a warning.
      </p>

      <h2>Certificate revocation: OCSP vs. CRL</h2>
      <CodeBlock>{`CRL (Certificate Revocation List)  — a downloadable list of revoked certificate serial numbers
OCSP (Online Certificate Status Protocol) — a live, per-certificate "is this still valid?" query

OCSP is faster and more current; CRLs don't require a live connection to the CA but can be stale.`}</CodeBlock>

      <h2>Digital signatures: authenticity + integrity, not confidentiality</h2>
      <p>
        Signing a message means hashing it, then encrypting that hash with your PRIVATE key. Anyone with
        your PUBLIC key can decrypt the signature and compare it to their own hash of the message — if they
        match, the message is provably from you and unmodified. Note what this does NOT do: it doesn't hide
        the message content at all, which is exactly why signing and encrypting are separate operations
        often used together, not substitutes for each other.
      </p>

      <h2>Common cryptographic attacks worth recognizing by name</h2>
      <CodeBlock label="what each one actually targets">{`Brute force        — try every possible key; defeated by key length
Rainbow table      — precomputed hash lookups; defeated by salting
Downgrade attack   — force a connection to use a weaker, older protocol version
Birthday attack    — exploits hash collision probability, not the algorithm's core weakness directly
Padding oracle     — exploits how a system responds differently to valid vs. invalid padding, leaking info`}</CodeBlock>

      <Callout variant="tip">
        <p>
          The exam pattern to watch for: a scenario describes a system still supporting SSLv3 or an old
          TLS version "for compatibility" — that's almost always the wrong answer being tested, since it
          reintroduces exactly the downgrade-attack surface modern protocol versions were designed to close.
        </p>
      </Callout>

      <p>
        With cryptography's building blocks in place, the next lesson turns to Identity &amp; Access
        Management — the practical system that decides who gets to use these cryptographic guarantees in
        the first place.
      </p>
    </div>
  );
}
