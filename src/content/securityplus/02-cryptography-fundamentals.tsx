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

      <h2>Block cipher modes: why "AES encrypted" isn't the whole story</h2>
      <p>
        AES is a block cipher — it encrypts fixed-size chunks (128 bits) at a time. How those chunks are
        linked together, the "mode of operation," matters as much as the algorithm itself, and picking the
        wrong mode is a real, still-seen vulnerability class of its own.
      </p>
      <CodeBlock label="the mode that fails visibly vs. the ones that don't">{`ECB (Electronic Codebook) — each block encrypted completely independently
  -> identical plaintext blocks produce identical ciphertext blocks, which means
     patterns in the original data (e.g. large blank regions in an image) remain
     visible in the encrypted output — the classic "ECB penguin" demonstration

CBC (Cipher Block Chaining) — each block is XORed with the previous ciphertext
     block before encryption, breaking the pattern-leakage problem, but requires
     careful padding handling (the exact gap a padding oracle attack exploits)

GCM (Galois/Counter Mode) — the modern standard: encrypts AND authenticates in
     one operation, so tampering with the ciphertext is detected automatically —
     this is what TLS 1.3 uses almost exclusively today`}</CodeBlock>
      <Callout variant="warn">
        <p>
          If you ever see AES-ECB used for anything beyond a single 128-bit block, treat it as a finding —
          the mode itself leaks structural information about the plaintext regardless of key length or
          algorithm strength, which is precisely why "encrypted" alone is never a sufficient answer to "is
          this secure" without also knowing the mode.
        </p>
      </Callout>

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

      <h2>Password auditing tools: putting bcrypt/Argon2 to the test</h2>
      <p>
        The bcrypt/Argon2-vs-SHA-256 distinction above isn't just theoretical — it's exactly what
        password-cracking tools exploit or get defeated by, and knowing the major tools by name is standard
        Security+ and real-world GRC/audit knowledge, since "how strong is our actual password hygiene"
        is a question organizations are expected to test empirically, not just assume.
      </p>
      <CodeBlock label="Hashcat — GPU-accelerated password recovery">{`hashcat -m 1000 hashes.txt wordlist.txt -O
# -m 1000  selects the HASH MODE — 1000 is NTLM (Windows), 1800 is sha512crypt,
#          3200 is bcrypt, 0 is raw MD5 — Hashcat supports hundreds of these
# -O       optimized kernel — faster, with some length limitations
# wordlist.txt   the candidate password list to try, e.g. rockyou.txt

hashcat -m 1000 hashes.txt wordlist.txt -r rules/best64.rule
# -r applies a RULE FILE — mutates each wordlist entry (capitalize, append "123",
#    swap letters for numbers) to catch predictable human password variations
#    without needing a wordlist that already contains every variant literally`}</CodeBlock>
      <CodeBlock label="John the Ripper — the longer-established alternative/complement to Hashcat">{`john --format=nt hashes.txt --wordlist=wordlist.txt
# --format selects the hash type, much like Hashcat's -m — "nt" is NTLM here
# John's "jumbo" community-patched build is particularly strong on exotic/legacy
# hash formats Hashcat doesn't cover out of the box, making the two complementary
# rather than strictly redundant tools in a real audit`}</CodeBlock>
      <CodeBlock label="CeWL — custom wordlist generation from the target's own website">{`cewl https://target.com -d 2 -m 5 -w wordlist.txt
# -d 2   spider depth of 2 links from the starting page
# -m 5   minimum word length of 5 characters
# -w     write the resulting wordlist to a file

# The idea: employees often base passwords on company- or product-specific
# terminology (product names, internal project codenames, founder names) that a
# generic wordlist like rockyou.txt was never built to contain — CeWL builds a
# wordlist from words that actually appear on the target's own site instead.`}</CodeBlock>
      <Callout variant="danger">
        <p>
          Hashcat, John the Ripper, and CeWL are for AUTHORIZED password-policy auditing only — running them
          against credentials you don't own or lack explicit written permission to test is unauthorized
          access. In a legitimate engagement, the output typically feeds a report, not further action: "12%
          of accounts cracked within an hour using a company-specific wordlist" is a finding that drives a
          password-policy fix, not a foothold to keep using unilaterally.
        </p>
      </Callout>

      <p>
        With cryptography's building blocks — and the tools used to test how well password-based controls
        actually hold up — in place, the next lesson turns to Identity &amp; Access Management: the
        practical system that decides who gets to use these cryptographic guarantees in the first place.
      </p>
    </div>
  );
}
