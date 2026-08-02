import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function HashCrackingStrategy() {
  return (
    <div className="prose-hh">
      <h1>Cracking Strategy: Identifying Hash Types &amp; Choosing the Right Attack</h1>
      <p>
        You've already run hashcat and john against specific hashes elsewhere on this platform — this lesson
        is about the decision-making that happens <em>before</em> you run either tool: identifying exactly what
        you're looking at, and picking an attack mode that actually fits the time you have, instead of running
        the slowest possible approach by default and waiting far longer than necessary.
      </p>

      <h2>Fast hashes vs. slow hashes — why the distinction changes your whole strategy</h2>
      <CodeBlock label="the practical speed difference">{`MD5 / SHA-1 / SHA-256 (general-purpose, FAST):
  Designed for speed — checksums, not password storage. A modern GPU tries billions of MD5
  candidates per second. A weak password behind a bare MD5 hash falls in seconds to minutes.

bcrypt / scrypt / argon2 (purpose-built for passwords, DELIBERATELY SLOW):
  Designed with a tunable cost factor specifically to make each guess expensive. The same GPU
  might manage only thousands of bcrypt guesses per second — a difference of 6+ orders of
  magnitude for the exact same wordlist.`}</CodeBlock>
      <p>
        This single distinction should drive your very first decision: cracking a fast hash with a weak
        password is often a wordlist attack away from success; cracking a well-configured bcrypt hash with
        anything beyond a tiny, highly-targeted wordlist is frequently not worth the compute time at all — your
        effort is better spent elsewhere (a different vulnerability, or a targeted list built from that
        specific person/company instead of a generic wordlist).
      </p>

      <h2>Choosing an attack mode</h2>
      <CodeBlock label="the four attack modes, in the order you should usually try them">{`1. Wordlist attack       — try every entry in a real leaked-password list (rockyou.txt and similar).
                           Catches the huge fraction of real passwords that are simply reused/common.
   hashcat -m <mode> -a 0 hash.txt rockyou.txt

2. Rule-based attack     — apply mutation rules (capitalize, append "123", leetspeak substitutions)
                           to every wordlist entry. Catches "Password1!" when "password" alone missed.
   hashcat -m <mode> -a 0 hash.txt rockyou.txt -r best64.rule

3. Targeted/custom list  — build a small wordlist from what you know about the SPECIFIC target:
                           company name + year, product names, a person's pet/kids' names from OSINT.
                           Small list, high hit rate, when generic lists have already failed.

4. Mask/brute-force      — only for hashes you have strong reason to believe follow a known pattern
                           (e.g. "8 digits", a PIN, a specific format) — otherwise combinatorially
                           hopeless for anything resembling a real password's full character space.
   hashcat -m <mode> -a 3 hash.txt ?d?d?d?d?d?d?d?d`}</CodeBlock>

      <h2>Salting: why the same password doesn't always crack the same way</h2>
      <p>
        A salt is random data mixed into the hash input before hashing, unique per user, stored alongside the
        hash. It doesn't make an individual password harder to crack once you have that user's specific salt —
        but it defeats <strong>rainbow tables</strong> (precomputed hash-to-password lookup tables) entirely,
        since a precomputed table for one salt value is useless against a different salt, and it prevents{' '}
        <strong>cross-account pattern matching</strong> — without salts, two users with the same password would
        have identical hashes, immediately revealing the reuse even before either is cracked.
      </p>

      <h2>Putting it together: a realistic triage workflow</h2>
      <CodeBlock label="from a dumped hash file to a cracking decision">{`1. Identify the hash type from its format (length, prefix, salt presence) — see the Field Guide lesson
2. Fast hash + no visible rate limiting anywhere it's used?
     -> straight to wordlist + rule-based attack, expect fast results on weak passwords
3. Slow/purpose-built hash (bcrypt/argon2)?
     -> skip generic wordlists, go straight to a small, highly-targeted list, or move on
4. Multiple hashes from the same dump?
     -> crack the weakest-looking ones first (short, matches a common-password hash you recognize) —
        one recovered password often reveals the org's whole password POLICY (length, complexity
        rules), which turns into a far better targeted wordlist for the harder remaining hashes`}</CodeBlock>

      <Callout variant="tip">
        <p>
          The most efficient thing you can do before cracking anything is figure out how many hashes you're
          actually dealing with and sort by suspected strength. Spending an hour brute-forcing one strong
          bcrypt hash while ten weak MD5 hashes from the same dump sit unattempted is a common, entirely
          avoidable waste of a limited engagement window.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Cracking credentials recovered during an authorized engagement is standard methodology — using any
          recovered password against systems outside that engagement's scope, or against a person's other
          accounts, is not, and crosses well outside legitimate security testing.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the applied-cryptography half of offensive testing: the four implementation-failure
        patterns that produce almost every real crypto finding, padding oracle attacks against CBC mode, ECB
        mode's block-pattern leakage and hash length extension's exploitation of Merkle-Damgard construction,
        and a real cracking-strategy workflow instead of running the slowest possible attack by default.
      </p>
    </div>
  );
}
