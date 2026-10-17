import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const localPasswordDemo = [
  'import hashlib',
  'import hmac',
  'import secrets',
  '',
  '# Demonstration only: this small work factor keeps a lesson example quick.',
  '# Production systems should use a maintained framework and tuned Argon2id.',
  'password = "training-only example phrase"',
  'salt = secrets.token_bytes(16)',
  'params = {"n": 2**14, "r": 8, "p": 1}',
  '',
  'verifier = hashlib.scrypt(',
  '    password.encode("utf-8"),',
  '    salt=salt,',
  '    dklen=32,',
  '    **params,',
  ')',
  '',
  '# Store the algorithm/parameters, salt, and derived verifier; never the password.',
  'stored_record = (salt, verifier)',
  '',
  'candidate = "training-only example phrase"',
  'candidate_verifier = hashlib.scrypt(',
  '    candidate.encode("utf-8"),',
  '    salt=stored_record[0],',
  '    dklen=32,',
  '    **params,',
  ')',
  'valid = hmac.compare_digest(candidate_verifier, stored_record[1])',
  'print("match" if valid else "no match")',
].join('\n');

const syntheticEvents = [
  'from collections import Counter, defaultdict',
  'from datetime import datetime, timezone',
  '',
  'events = [',
  '    {"time": "2026-10-15T10:00:00Z", "user": "alex", "src": "198.51.100.8", "result": "fail"},',
  '    {"time": "2026-10-15T10:00:08Z", "user": "sam", "src": "198.51.100.8", "result": "fail"},',
  '    {"time": "2026-10-15T10:00:15Z", "user": "jo", "src": "198.51.100.8", "result": "fail"},',
  '    {"time": "2026-10-15T10:02:00Z", "user": "alex", "src": "203.0.113.4", "result": "success"},',
  ']',
  '',
  '# These RFC 5737 addresses and names are synthetic training evidence.',
  'failures_by_source = Counter()',
  'users_by_source = defaultdict(set)',
  'failures_by_user = Counter()',
  'successes_after_failure = []',
  'last_failure_by_user = {}',
  '',
  'for event in events:',
  '    timestamp = datetime.fromisoformat(event["time"].replace("Z", "+00:00"))',
  '    if timestamp.tzinfo is None:',
  '        raise ValueError("event timestamps must include a timezone")',
  '    if event["result"] == "fail":',
  '        failures_by_source[event["src"]] += 1',
  '        users_by_source[event["src"]].add(event["user"])',
  '        failures_by_user[event["user"]] += 1',
  '        last_failure_by_user[event["user"]] = (timestamp, event["src"])',
  '    elif event["result"] == "success" and event["user"] in last_failure_by_user:',
  '        failure_time, failure_source = last_failure_by_user[event["user"]]',
  '        if timestamp > failure_time:',
  '            successes_after_failure.append(',
  '                (event["user"], failure_source, event["src"], failure_time, timestamp)',
  '            )',
  '',
  '# A threshold is a tuning parameter, not a universal incident definition.',
  'for source, count in failures_by_source.most_common():',
  '    account_count = len(users_by_source[source])',
  '    if count >= 3 and account_count >= 3:',
  '        print("review possible distributed-account guessing:", source, count, account_count)',
  '',
  'for user, failure_source, success_source, failure_time, success_time in successes_after_failure:',
  '    print("review success after prior failure:", user, failure_source, "->", success_source)',
  '    print("  interval:", (success_time - failure_time).total_seconds(), "seconds")',
].join('\n');

export default function CredentialAttacks() {
  return (
    <article className="prose-hh">
      <h1>Credential Abuse: Password Attacks, Storage, and Detection</h1>
      <p>
        A credential is evidence used to authenticate an identity: a password, passkey, one-time code, recovery
        code, API token, or session secret. Credential abuse targets that evidence or the account-recovery
        process around it. This lesson separates online login attacks from offline password-hash auditing,
        explains the language analysts use, introduces modern authentication defenses, and shows how to
        investigate synthetic sign-in logs without testing real accounts.
      </p>

      <h2>Prerequisites: authentication, authorization, and sessions</h2>
      <p>
        <strong>Authentication</strong> checks an identity claim. <strong>Authorization</strong> decides what
        the authenticated identity can access. A successful sign-in therefore does not prove that the account
        should be able to read a particular record or administer a system. A <strong>session</strong> is the
        continuing authenticated state established after sign-in, often represented by a cookie or token.
        Stealing a valid session can bypass the password prompt until the session expires or is revoked.
      </p>
      <p>
        A multi-factor authentication (MFA) flow asks for evidence from different factor categories, such as
        something you know and something you possess. Two passwords are not two factors. MFA can reduce the
        value of a stolen password, but the strength depends on the authenticator and recovery process. A
        phishing-resistant passkey binds a public-key authentication response to the legitimate service origin;
        a reusable password or one-time code can be relayed by a phishing site.
      </p>

      <h2>1. Four password-attack terms that sound alike</h2>
      <ul>
        <li><strong>Online guessing:</strong> an attacker submits candidate passwords to a live authentication
          service. The service can rate-limit, alert, challenge, or lock the account. This activity may affect
          user availability and is explicitly scoped in professional testing.</li>
        <li><strong>Dictionary attack:</strong> a type of guessing that tries candidates from a list. The list
          may contain common patterns or synthetic examples; real breach corpora contain sensitive personal
          data and are not appropriate general-purpose training material.</li>
        <li><strong>Brute-force search:</strong> systematically enumerates character combinations or a defined
          key space. Search cost grows rapidly with password length and the size of the character set.</li>
        <li><strong>Credential stuffing:</strong> tests username/password pairs leaked from one service against
          another, relying on password reuse. Its input is a pair list, not a generated wordlist.</li>
        <li><strong>Password spraying:</strong> tries a small number of candidate passwords across many
          accounts. Defenders correlate failures across users and sources; attackers may distribute attempts,
          so a single-account lockout rule does not provide complete protection.</li>
      </ul>
      <p>
        These categories can overlap. A spray is an online guessing strategy, while stuffing reuses known pairs.
        A breach of a password database creates a different situation: an attacker may test guesses offline
        against password verifiers without sending requests to the original login service. Online controls such
        as throttling cannot slow offline work; secure password storage makes offline work more expensive.
      </p>

      <h2>2. Password storage: salted, adaptive verification</h2>
      <p>
        A server should not store a user's plain password or use reversible encryption as its password database.
        Instead, it stores a verifier produced by a password-hashing function. During sign-in, the server
        retrieves the user's salt and parameters, derives a candidate verifier from the submitted password, and
        compares the values. The salt is unique random data stored with the verifier; it prevents identical
        passwords from producing identical stored records and defeats reusable precomputed tables.
      </p>
      <p>
        A general-purpose hash such as SHA-256 is designed to be fast. That is desirable for file integrity but
        makes each offline password guess cheap. Password-storage functions deliberately use configurable time
        and memory costs. OWASP currently prefers Argon2id for new systems, with scrypt or an appropriately
        configured PBKDF2 for specific compatibility or compliance needs. bcrypt remains common in existing
        systems, with implementation-specific constraints. Tune a work factor on production-class hardware and
        plan upgrades as hardware and requirements change.
      </p>
      <CodeBlock label="A local Python demonstration of salt and slow key derivation">{localPasswordDemo}</CodeBlock>
      <p>
        This uses Python's standard-library scrypt to make the verifier process visible. The parameters are
        intentionally small for a quick lesson example and are not a production recommendation. A real
        application should use its framework's maintained password-verification API, Argon2id where available,
        unique random salts, parameters stored alongside each verifier, safe migration on successful login, and
        rate controls around verification so an attacker cannot exhaust server memory or CPU.
      </p>
      <p>
        A <strong>pepper</strong> is an optional secret kept separately from the password database, often in a
        secrets manager or hardware-backed service. It can add defense in depth if the database alone is
        exposed, but it does not replace a slow salted password hash. If the pepper is compromised, rotation
        requires a deliberate migration strategy because the server cannot simply recover users' original
        passwords.
      </p>

      <h2>3. Online defenses and their trade-offs</h2>
      <p>
        Effective login protection uses several signals and controls together. Per-account throttling limits
        guesses against one identity; network and device signals help identify distributed activity; step-up
        authentication adds proof when risk increases. IP-only blocks are easy to evade and can harm users behind
        shared networks. Hard account lockouts can let an attacker deny service to a victim by intentionally
        submitting wrong passwords. A system should balance abuse resistance with recovery and availability.
      </p>
      <ul>
        <li><strong>Throttle:</strong> use progressive delay, bounded retries, and risk-aware challenges with
          controls at the identity provider or application. Do not expose whether an account exists through
          different error text or timing.</li>
        <li><strong>Block weak choices:</strong> reject passwords on a blocklist of common, expected, or known
          compromised values when users create or change passwords. Check the whole password rather than
          rejecting every phrase that contains a short dictionary word.</li>
        <li><strong>Support long unique passwords:</strong> permit password managers, paste, autofill, and
          long passphrases. Avoid arbitrary composition rules that encourage predictable suffixes.</li>
        <li><strong>Use stronger authenticators:</strong> prefer phishing-resistant passkeys/security keys for
          high-value access. Protect enrollment, fallback, recovery codes, device replacement, and help-desk
          reset processes with controls comparable to the account itself.</li>
        <li><strong>Remove weak alternate paths:</strong> inventory legacy protocols and applications that
          bypass modern MFA or conditional access. A strong primary login does not help if an older path still
          accepts the password alone.</li>
        <li><strong>Protect sessions:</strong> rotate session identifiers after authentication, use secure
          cookie attributes, set appropriate lifetime and reauthentication rules, and provide a way to revoke
          sessions after suspected compromise.</li>
      </ul>
      <p>
        NIST's current digital-identity guidance requires rate limiting and compromised-password blocklist
        checks for centrally verified passwords; its password guidance also advises against periodic forced
        changes absent evidence of compromise. These recommendations are a useful baseline, but organizations
        must apply the standards and laws that govern their environment.
      </p>

      <h2>4. Modern MFA and account-recovery risks</h2>
      <p>
        MFA changes the attack path rather than making account compromise impossible. Attackers may target
        push-approval fatigue, one-time-code relay, SIM or email recovery, help-desk impersonation, stolen
        browser sessions, OAuth grants, or a legacy application exempt from MFA. Treat a correct password
        followed by repeated MFA denials as a meaningful signal: it may indicate that someone has the password
        but has not completed the second factor.
      </p>
      <p>
        Passkeys use public-key cryptography and are bound to a relying-party origin through WebAuthn/FIDO2.
        This prevents a fake look-alike web origin from simply collecting a reusable secret. The security
        outcome still depends on enrollment policy, device protection, account recovery, synchronization
        settings, and whether the service allows a weaker fallback. Monitor for new authenticator enrollment,
        recovery changes, session creation, and unexpected OAuth consent in addition to failed passwords.
      </p>

      <h2>5. Tool roles: online audit versus offline verification</h2>
      <p>
        Hydra is an online login-auditing tool used to test a designated service in an authorized lab. Every
        attempt reaches the service and may trigger lockouts, alerts, or account disruption; use only the
        supplied test identity, endpoint, candidate fixture, and rate limit. Never point it at an employer,
        public service, or account list without explicit written authorization. John the Ripper and Hashcat are
        commonly used for authorized offline password-hash audits. They operate on supplied hash material and
        do not authenticate to the original service, but the hash file itself is highly sensitive and must be
        handled as restricted data.
      </p>
      <p>
        Use a tiny synthetic fixture in a disposable environment. Do not download or circulate real breached
        passwords for a class exercise. A clean lab workflow records the hash algorithm and parameters,
        confirms the fixture contains no production data, bounds runtime and hardware use, and securely deletes
        generated outputs after the exercise.
      </p>

      <h2>6. Detect credential abuse from authentication events</h2>
      <p>
        A single failed sign-in can be a mistyped password. Patterns become more meaningful when correlated
        across account, source, device, time, authentication method, and result. A spray may show failures across
        many accounts with a small set of sources; credential stuffing may show a high rate of unique accounts
        and distributed networks; a compromised account may show a successful sign-in after a failure burst,
        new authenticator enrollment, or an unusual session. These are indicators to investigate, not proof of
        malicious intent by themselves.
      </p>
      <p>
        Normalize timestamps to UTC, preserve the original event, map aliases to stable account identifiers,
        and distinguish an authentication failure from a conditional-access or MFA denial. Avoid alerting on a
        single universal count. Tune thresholds by application, normal user behavior, shared network patterns,
        business hours, and the cost of a missed event. The sample below uses only synthetic records and a
        deliberately tiny demonstration threshold.
      </p>
      <CodeBlock label="Python: correlate synthetic failures across users and sources">{syntheticEvents}</CodeBlock>
      <p>
        This example counts failed events by source and account, then marks a successful event after an earlier
        failure for analyst review. It does not implement a production detector: it lacks a rolling time window,
        distributed-source correlation, account normalization, MFA events, deduplication, and business context.
        Add those fields and compare behavior with a reviewed baseline before using any alert in a real SOC.
      </p>

      <h2>7. Worked investigation: repeated failures followed by a valid sign-in</h2>
      <p>
        Synthetic identity logs show one source failing against three test accounts over a short period, then a
        successful sign-in from a different source for one of those users. The analyst first confirms that the
        source and accounts belong to the training dataset, normalizes event times, and checks whether the
        successful session completed MFA. The pattern is consistent with possible password spraying followed
        by access, but it could also reflect a shared egress network or unrelated user mistakes. The analyst
        compares device, ASN, session, MFA, and authenticator-enrollment evidence before assigning a conclusion.
        If the training scenario confirms compromise, the response owner follows the lab's contained procedure;
        the logs alone do not justify claiming that a real account was breached.
      </p>

      <h2>8. Evidence to capture in a lab</h2>
      <ol>
        <li>Identify the supplied test service and approved user fixture; record the exact authorized target.</li>
        <li>Observe baseline success and failure behavior without using personal or reused credentials.</li>
        <li>Review the lab's synthetic authentication records and note timestamp, account, source, factor, and
          result.</li>
        <li>Explain whether the evidence resembles guessing, spraying, stuffing, or an ordinary failure, and
          state what additional evidence would change that assessment.</li>
        <li>Describe the relevant control: throttling, phishing-resistant MFA, legacy-path removal, password
          verifier quality, session revocation, or recovery protection.</li>
      </ol>

      <Callout variant="warn">
        <p>
          Do not use real people's credentials, leaked password lists, or public login endpoints in this lesson.
          Even a low-volume attempt can lock someone out, create an incident, or violate law and service terms.
          Keep active testing inside the supplied disposable lab and stop if it returns evidence belonging to a
          real user or system.
        </p>
      </Callout>

      <h2>Common misconceptions</h2>
      <ul>
        <li><strong>“MFA means the password does not matter.”</strong> Passwords can be reused, bypassed on
          legacy paths, relayed with some factors, or used to steal sessions and alter recovery settings.</li>
        <li><strong>“A password hash is encrypted and can be decrypted.”</strong> A modern password verifier is
          derived with a one-way password-hashing function; offline guessing tests candidates against it.</li>
        <li><strong>“A large wordlist is always better.”</strong> Online attempt budgets and account impact make
          uncontrolled lists unsafe; offline audits depend on hash type, parameters, and a lawful dataset.</li>
        <li><strong>“Locking accounts after a few failures solves spraying.”</strong> It may enable denial of
          service and does not catch distributed patterns across multiple identities.</li>
        <li><strong>“A login succeeded, so the user was authorized.”</strong> Authentication and application
          authorization are separate decisions.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>Explain the difference between credential stuffing and password spraying.</li>
        <li>Why can online throttling not protect a weak password hash after a database breach?</li>
        <li>What do a unique salt and a memory-hard password-hashing function each contribute?</li>
        <li>Why is an IP-only block an incomplete defense for distributed login abuse?</li>
        <li>Why can phishing-resistant passkeys reduce risk while recovery paths still need protection?</li>
        <li>What additional evidence is needed before labeling a failure-and-success sequence a compromise?</li>
      </ol>

      <h2>References</h2>
      <ul>
        <li><a href="https://pages.nist.gov/800-63-4/sp800-63b/authenticators/" target="_blank" rel="noreferrer">NIST SP 800-63B: authenticators and password-verifier requirements</a></li>
        <li><a href="https://pages.nist.gov/800-63-4/sp800-63b/passwords/" target="_blank" rel="noreferrer">NIST SP 800-63B: password strength and online/offline attack models</a></li>
        <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP Password Storage Cheat Sheet</a></li>
        <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP Authentication Cheat Sheet</a></li>
        <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html" target="_blank" rel="noreferrer">OWASP Credential Stuffing Prevention Cheat Sheet</a></li>
        <li><a href="https://fidoalliance.org/specifications/" target="_blank" rel="noreferrer">FIDO Alliance authentication specifications</a></li>
      </ul>
    </article>
  );
}
