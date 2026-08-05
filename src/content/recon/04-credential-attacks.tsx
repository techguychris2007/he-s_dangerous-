import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CredentialAttacks() {
  return (
    <div className="prose-hh">
      <h1>Credential Attacks: Wordlists &amp; Brute Forcing</h1>
      <p>
        You have a username from enumeration. Now you need a password. This lesson covers wordlists,
        brute-forcing tools, and — just as importantly — when to stop and reconsider your approach.
      </p>

      <h2>Wordlists</h2>
      <CodeBlock label="the ones you'll reach for constantly">{`/usr/share/wordlists/rockyou.txt              # 14M real leaked passwords, the default choice
/usr/share/seclists/Usernames/                 # common username lists
/usr/share/seclists/Passwords/                  # curated password lists by category
cewl http://target.com -w custom-wordlist.txt   # generate a wordlist from a website's own content`}</CodeBlock>
      <p>
        <strong>rockyou.txt</strong> comes from a real 2009 breach and remains the single most useful
        password list in security testing because human password habits haven't changed much — build the
        habit of trying it first.
      </p>
      <p>
        <strong>CeWL</strong> solves a different problem: instead of a generic breach list, it spiders a
        target's own website and builds a wordlist out of the words actually used there — product names,
        employee names, internal jargon, a company slogan. Organizations frequently base passwords on words
        specific to themselves, so a wordlist generated from <code>cewl https://target.com -d 2 -m 5 -w
        custom.txt</code> (crawl depth 2, minimum word length 5) often succeeds where rockyou.txt alone
        fails — it's the standard lead-in step before reaching for the general-purpose password-auditing
        tools this course covers elsewhere (Hashcat/John the Ripper for cracking hashes offline, once you've
        got something to crack).
      </p>

      <h2>Attack types</h2>
      <ul>
        <li><strong>Dictionary attack</strong> — try every word in a wordlist against one username.</li>
        <li><strong>Brute force</strong> — try every possible character combination (only feasible for
        short/weak passwords, extremely slow otherwise).</li>
        <li><strong>Credential stuffing</strong> — try known breached username:password pairs against a
        new target, banking on password reuse.</li>
        <li><strong>Password spraying</strong> — try one or two common passwords against <em>many</em>
        usernames, to avoid account lockout thresholds that a per-user brute force would trigger.</li>
      </ul>

      <h2>Hydra: the standard brute-forcing tool</h2>
      <CodeBlock label="single username, full wordlist">{`hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.10.10.5`}</CodeBlock>
      <CodeBlock label="username list x password list, against HTTP form auth">{`hydra -L users.txt -P passwords.txt 10.10.10.5 http-post-form \\
  "/login:username=^USER^&password=^PASS^:Invalid credentials"`}</CodeBlock>
      <CodeBlock label="password spraying — one password, many users">{`hydra -L users.txt -p 'Summer2024!' ssh://10.10.10.5`}</CodeBlock>

      <h2>Reading hydra's output</h2>
      <CodeBlock>{`[22][ssh] host: 10.10.10.5   login: admin   password: letmein123`}</CodeBlock>
      <p>
        That single line is the whole point of the attack — a confirmed working credential pair. You'll
        run this exact command pattern against a simulated SSH service in the enumeration lab.
      </p>

      <Callout variant="warn">
        <p>
          Brute forcing is noisy and slow, and many services implement account lockout after N failed
          attempts — which means a careless brute force can lock out a legitimate user or trip alerting
          before you succeed. Always check for lockout policies and prefer password spraying over aggressive
          per-account brute force when the target volume allows it.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Credential attacks are the most obviously "attack-shaped" activity in this whole methodology.
          Only ever run these against systems in your signed scope of engagement, a CTF/training
          environment, or infrastructure you personally own.
        </p>
      </Callout>

      <h2>Why password spraying specifically targets MFA-less accounts</h2>
      <p>
        Multi-factor authentication is the real reason password spraying (rather than classic brute force)
        became the dominant real-world credential attack: a correct password against an account with MFA
        enabled still doesn't grant access, which makes MFA coverage gaps — a shared service account, a
        legacy application that was never onboarded, a break-glass admin account exempted "temporarily" — the
        actual target. Spraying one weak, plausible password across every username in an organization is
        precisely how an attacker finds that one account nobody remembered to enroll.
      </p>

      <h2>Beyond brute force</h2>
      <p>
        Default credentials (admin:admin, root:toor), credentials found in config files during earlier
        enumeration, and credentials leaked in public breaches (checked via services like
        Have I Been Pwned) are all faster and quieter than brute forcing. Always check these first — real
        engagements are won far more often by finding a password in a config file than by cracking one.
      </p>
    </div>
  );
}
