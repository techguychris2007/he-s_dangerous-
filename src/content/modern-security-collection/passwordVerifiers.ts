import type { CurriculumLesson } from '../curriculumDefinition';

export const passwordVerifierLesson: CurriculumLesson = {
  id: 'crypto-password-1', slug: 'password-verifiers-salts-costs-and-migration',
  title: 'Password Verifiers: Salts, Costs and Migration',
  summary: 'Build a complete local verification fixture and understand the security properties missing from ordinary SHA-256 exercises.',
  minutes: 55,
  prerequisite: 'Python strings and bytes, functions and hashing. Hashing, encoding and authentication are explained before the example.',
  outcomes: ['Distinguish fast digests from password verifiers', 'Store salt and scheme metadata', 'Verify without plaintext logging', 'Explain cost migration and account protections'],
  introduction: 'A password verifier stores information used to check a future password attempt. It should make offline guesses expensive while allowing the service to verify legitimate attempts within its resource budget. A general-purpose digest exercise does not implement that complete requirement.',
  sections: [
    { title: 'A fast hash does not make a guessed password expensive', paragraphs: [
      'A cryptographic hash maps input bytes to a fixed-size digest. It is not encryption, and the verifier does not decrypt the digest during login. Instead it applies the same declared transformation to the submitted candidate and checks the result. If an attacker obtains unsalted fast hashes, the attacker can cheaply hash many candidates and compare them without contacting the login server.',
      'Password-hashing schemes deliberately add cost, with memory-hard designs also requiring substantial memory under their configured parameters. OWASP prefers Argon2id for suitable new deployments; compatibility and approved-cryptography requirements can justify other supported schemes. Use a maintained implementation and current guidance rather than writing a new password algorithm. SHA-256 remains useful for many integrity tasks, but fast SHA-256 alone is not appropriate password storage.',
    ] },
    { title: 'A salt separates records; a pepper is a separate secret', paragraphs: [
      'A salt is a randomly generated per-record value supplied to the password-hashing scheme. Store it with the verifier. Two accounts using the same password should not automatically have the same stored verifier because their salts differ. A salt is not secret and does not prevent an attacker from testing guesses against each stolen record.',
      'A pepper is an additional protected secret in a supported design, stored separately from the password database. Losing or rotating that secret has consequences for verification and migration. It is not an interchangeable replacement for a salt, nor a password string hardcoded in source. Protect algorithm configuration and parameter records too: they tell the verifier how a stored record must be interpreted.',
    ] },
    { title: 'Run a complete synthetic PBKDF2 fixture', paragraphs: [
      'The local example uses the standard Python PBKDF2 API with HMAC-SHA-256, random 16-byte salts and an explicitly recorded iteration count. Its 600000 iteration value illustrates the current OWASP PBKDF2-HMAC-SHA-256 baseline; it is not a universal performance guarantee or a claim that this snippet implements a full production login service. It performs no network operation and uses a synthetic password only.',
      'encode converts the candidate to UTF-8 bytes. pbkdf2_hmac derives the verifier using the specified password, salt, iteration count and output length. compare_digest performs the supported comparison on same-type verifier bytes. The example prints booleans, not passwords, salts or stored verifiers. Run it as a normal Python file; deliberate computational cost makes it slower than an ordinary digest.',
    ], label: 'Complete local Python verification fixture; no real account credentials', code: `import hashlib
import hmac
import secrets

ITERATIONS = 600_000

def make_record(password):
    if not isinstance(password, str):
        raise TypeError("password must be text")
    salt = secrets.token_bytes(16)
    verifier = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, ITERATIONS, dklen=32
    )
    return {
        "scheme": "pbkdf2-sha256",
        "iterations": ITERATIONS,
        "salt": salt,
        "verifier": verifier,
    }

def verify_record(candidate, record):
    if not isinstance(candidate, str):
        return False
    if not isinstance(record, dict):
        return False
    if record.get("scheme") != "pbkdf2-sha256":
        return False
    if type(record.get("iterations")) is not int or record["iterations"] != ITERATIONS:
        return False  # this small fixture supports one bounded configuration
    salt = record.get("salt")
    verifier = record.get("verifier")
    if not isinstance(salt, bytes) or len(salt) != 16:
        return False
    if not isinstance(verifier, bytes) or len(verifier) != 32:
        return False
    derived = hashlib.pbkdf2_hmac(
        "sha256", candidate.encode("utf-8"), salt, ITERATIONS, dklen=32
    )
    return hmac.compare_digest(derived, verifier)

first = make_record("synthetic training password")
second = make_record("synthetic training password")
print(verify_record("synthetic training password", first))  # True
print(verify_record("wrong synthetic attempt", first))      # False
print(first["verifier"] != second["verifier"])              # True with overwhelming probability
` },
    { title: 'Bound work and plan migration deliberately', paragraphs: [
      'A stored work factor must be interpreted through a supported, bounded scheme contract. Never let an arbitrary request choose an enormous memory or iteration cost. Login throttling and resource limits are needed because expensive legitimate verification can also become a service-exhaustion target. Benchmark the deployment environment, including concurrent requests, rather than tuning only one successful local login.',
      'A production migration can verify an older supported record, then create a new verifier using the accepted candidate after successful authentication. Store scheme/version and parameters so the server can distinguish old and new records. You cannot generally turn an old hash into a strong new password verifier without the password or a supported reset flow. The fixture intentionally accepts one configuration to keep its behavior explicit; it does not implement migration.',
    ] },
    { title: 'Password policy, storage and online protections differ', paragraphs: [
      'Password policy concerns what a user may choose. Password storage concerns the verifier if stored data is stolen. Online protections limit repeated authentication attempts. Under NIST SP 800-63B-4, the minimum for a password used as a single factor is 15 characters; passwords used only within MFA may have a shorter minimum of at least eight. These requirements have a defined standards scope and should not be replaced by a generic uppercase/digit/symbol checklist.',
      'The same guideline supports blocklist checks, password managers and appropriate failed-attempt limits rather than routine forced periodic changes without evidence of compromise. A salted verifier does not stop phishing or credential stuffing with an already known password. Phishing-resistant authenticators, recovery controls and session lifecycle remain separate parts of account security.',
    ] },
    { title: 'Write failure cases before calling the design complete', paragraphs: [
      'Add tests for an incorrect candidate, missing salt, wrong verifier type, unsupported scheme and an unapproved iteration configuration. Keep the input record unchanged. Test that expected verification succeeds, but never include a real learner password in the fixture. A serialization layer would need a declared bytes representation and validation; dumping Python objects into pickle is not an acceptable untrusted-record parser.',
      'The existing SHA-256 and User-class coding exercises remain useful for digest and encapsulation practice, but their descriptions now state the limits. Use them to compare the simplified digest with this full local verifier contract. Implement your own verification wrapper and tests from the requirements; do not mistake any one exercise for a deployable identity provider.',
    ] },
  ],
  table: { headers: ['Property', 'Mechanism', 'Limit'], rows: [] },
  exercise: { scenario: 'Two synthetic accounts use the same password, but their verifier bytes differ.', task: 'Explain why a correct login still verifies and why the differing bytes do not prove the password is strong.', answer: 'Each record stores its own salt and scheme configuration. The candidate is derived with that record’s salt, producing its matching verifier. Different salts separate records but do not prevent guesses against weak passwords.', evidence: 'Correct and incorrect local verification results without printing secrets.' },
  misconceptions: ['Salts are non-secret values, not password-strength guarantees.', 'Fast SHA-256 is not a complete password-storage scheme.', 'Storage protections do not replace throttling, phishing resistance or recovery controls.'],
  sources: [
    { title: 'OWASP password storage guidance', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
    { title: 'NIST SP 800-63B-4 password requirements', url: 'https://pages.nist.gov/800-63-4/sp800-63b.html' },
    { title: 'Python hashlib key derivation', url: 'https://docs.python.org/3/library/hashlib.html#key-derivation' },
  ],
  labs: ['py-crypto-05', 'py-oop-01'],
  quiz: [
    { question: 'Why can two correct records for the same password differ?', options: ['The password is automatically stronger', 'Each record can use a different salt', 'One record must be corrupt'], answer: 1 },
    { question: 'Does a salt replace a costly password-hashing scheme?', options: ['Yes', 'Only when encoded in base64', 'No'], answer: 2 },
  ],
};
