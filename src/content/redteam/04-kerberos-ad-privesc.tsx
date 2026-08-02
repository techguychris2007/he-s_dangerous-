import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function KerberosAdPrivesc() {
  return (
    <div className="prose-hh">
      <h1>Kerberos Attacks &amp; AD Privilege Escalation</h1>
      <p>
        This closing lesson covers the specific techniques that turn "I have a domain user account" into
        "I have Domain Admin" — the objective of nearly every AD-focused engagement.
      </p>

      <h2>A one-paragraph Kerberos primer</h2>
      <p>
        Kerberos authentication issues time-limited "tickets" instead of repeatedly sending passwords. A
        user gets a Ticket Granting Ticket (TGT) after authenticating to the Domain Controller, then uses
        it to request Service Tickets for specific resources. Both major attacks below abuse how these
        tickets are encrypted, not a flaw in the protocol's cryptography itself.
      </p>

      <h2>Kerberoasting</h2>
      <p>
        Any authenticated domain user can request a service ticket for any service account in the domain —
        that ticket is encrypted with a hash derived from the <em>service account's own password</em>.
        Because any domain user can request this ticket, an attacker can grab it and crack it completely
        offline, with no further interaction with the domain controller.
      </p>
      <CodeBlock label="the attack sequence, conceptually">{`1. Authenticate as any low-privilege domain user
2. Request service tickets for accounts with a registered Service Principal Name (SPN)
3. Take the encrypted ticket offline
4. Crack it with hashcat/john against a wordlist — success reveals the SERVICE ACCOUNT's plaintext password
5. Service accounts are very frequently over-privileged (sometimes Domain Admin) — instant escalation`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Kerberoasting is popular precisely because step 2 requires zero elevated privileges and generates
          normal-looking Kerberos traffic — it's quiet by default, which is exactly why red teams favor it
          over louder brute-force techniques.
        </p>
      </Callout>

      <h2>Detecting Kerberoasting from the blue-team side</h2>
      <p>
        Kerberoasting is quiet, but it is not invisible. Every service ticket request generates Windows
        Security Event ID 4769 on the domain controller, and legitimate users request tickets only for the
        handful of services they actually use. A Kerberoasting tool (Rubeus, Impacket's
        <code>GetUserSPNs.py</code>) instead requests tickets for <em>every</em> registered SPN on the
        domain in rapid succession — and specifically requests them using legacy RC4 encryption rather than
        modern AES, because RC4-encrypted tickets crack dramatically faster offline. That RC4 preference,
        combined with one account suddenly requesting dozens of unrelated service tickets within a few
        minutes, is exactly the detection heuristic Microsoft and MITRE ATT&amp;CK document for this
        technique (T1558.003) — and it is precisely why this platform's own SOC track includes a Kerberoasting
        <em>detection</em> lab as the direct counterpart to the offensive technique taught here.
      </p>
      <CodeBlock label="the blue-team query, conceptually">{`grep "0x17" tgs-requests.log      # isolate legacy-RC4 ticket requests — a red flag on its own
# then check: does any single account appear dozens of times, for unrelated services,
# within the same few-minute window? That volume-plus-encryption-type combination has no
# legitimate explanation and is the exact signature an automated Kerberoasting sweep leaves behind.`}</CodeBlock>

      <h2>AS-REP Roasting</h2>
      <p>
        A smaller subset of accounts have "Kerberos pre-authentication" disabled (a legacy setting). For
        those accounts, an attacker doesn't even need valid credentials — they can request an
        authentication response directly and crack it offline the same way, extracting that account's
        password with zero prior access to the domain at all.
      </p>

      <h2>From Kerberoasting to Domain Admin</h2>
      <CodeBlock label="the typical escalation chain in a real engagement">{`1. Phishing foothold as a regular employee (no special privileges)
2. Kerberoast every SPN account in the domain, crack the weakest one offline
3. That service account turns out to be a member of a group with rights over a higher-privilege group
   (exactly the kind of path BloodHound surfaces automatically)
4. Use those escalated rights to reset a Domain Admin's password, or add yourself to Domain Admins
5. Full domain compromise — the red team objective is achieved`}</CodeBlock>

      <h2>Golden &amp; Silver Tickets (post-compromise persistence)</h2>
      <p>
        Once an attacker has compromised the account that encrypts all Kerberos tickets domain-wide (the
        KRBTGT account), they can forge a "Golden Ticket" — a completely valid-looking Kerberos ticket for
        any user, including ones that don't exist, with a validity period they choose. This is why a full
        AD compromise almost always requires a KRBTGT password reset (twice) as part of incident response,
        not just resetting the one compromised admin account.
      </p>

      <h2>DCSync and Pass-the-Ticket</h2>
      <p>
        Two more techniques round out the standard AD privilege escalation toolkit. <strong>DCSync</strong>{' '}
        abuses a legitimate Active Directory replication permission — if an attacker-controlled account has
        replication rights (often obtained via the same kind of ACL-abuse path BloodHound surfaces), they
        can impersonate a Domain Controller and simply ask a real DC to "replicate" the password hashes of
        any account, including <code>krbtgt</code>, without ever touching the DC's disk directly.{' '}
        <strong>Pass-the-Ticket</strong> is Kerberos's version of pass-the-hash: once you have a valid
        ticket (stolen from memory on a compromised host, or forged as described above), you inject it into
        your own session and authenticate as that user or computer without ever knowing their password.
      </p>
      <Callout variant="warn">
        <p>
          Kerberoasting, DCSync, and Pass-the-Ticket are not rare, exotic techniques — public incident
          response reporting on major ransomware intrusions repeatedly names this exact chain (a low-priv
          foothold, Kerberoasting a service account, then DCSync or ticket abuse to reach Domain Admin) as
          the path from initial access to full domain compromise. This module's techniques are not
          hypothetical; they are the default playbook.
        </p>
      </Callout>

      <h2>Unconstrained delegation: when logging into the wrong server is the attack</h2>
      <p>
        Some computer objects in a domain are flagged "Trusted for Delegation" — an older, unconstrained
        delegation setting originally meant to let a front-end server (say, a print or application server)
        act on a user's behalf against a back-end resource. The side effect: whenever ANY account, including
        a Domain Admin, authenticates to that server for any reason at all — even something as mundane as
        mapping a network printer — Windows caches a full, reusable copy of that account's Kerberos TGT in
        memory on the delegation-enabled server itself.
      </p>
      <CodeBlock label="why compromising one unremarkable server can mean full domain compromise">{`1. Recon finds PRINTSRV01 has TrustedForDelegation=True
2. Compromise PRINTSRV01 with nothing more than a low-privilege foothold (no exploit needed)
3. Wait -- or trigger -- a privileged account authenticating to it (printing, a scheduled task, etc.)
4. That account's full TGT is now sitting in memory on a server you already control
5. Extract and reuse it -- you are now that account, domain-wide`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is exactly why unconstrained delegation has been considered a legacy anti-pattern in AD
          hardening guidance for years, and why modern AD deployments should use constrained or
          resource-based constrained delegation instead — both scope exactly which service an account can be
          impersonated FOR, instead of caching a fully reusable copy of whatever credential happens to pass
          through.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Kerberoasting, AS-REP Roasting, Golden Ticket attacks, and unconstrained delegation abuse are real,
          powerful techniques used in the majority of major ransomware intrusions. They are for authorized
          red team engagements and dedicated AD lab environments (Hack The Box's Active Directory content, in
          particular) — never against infrastructure without explicit written authorization.
        </p>
      </Callout>

      <p>
        You now understand the full internal attack chain: foothold → internal recon → lateral movement → AD
        enumeration → Kerberos-based privilege escalation → domain compromise. This is the exact narrative
        structure a real red team report follows, and the mental model behind The Hacker Playbook 3's
        internal network chapters. The final lesson turns to what an operator does <em>during</em> and after
        this chain: the C2 framework that keeps a compromised host connected, and the persistence mechanisms
        that survive a reboot.
      </p>
    </div>
  );
}
