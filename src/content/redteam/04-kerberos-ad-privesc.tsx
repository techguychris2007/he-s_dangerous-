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

      <Callout variant="danger">
        <p>
          Kerberoasting, AS-REP Roasting, and Golden Ticket attacks are real, powerful techniques used in
          the majority of major ransomware intrusions. They are for authorized red team engagements and
          dedicated AD lab environments (Hack The Box's Active Directory content, in particular) — never
          against infrastructure without explicit written authorization.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now understand the full internal attack chain: foothold → internal recon → lateral movement →
        AD enumeration → Kerberos-based privilege escalation → domain compromise. This is the exact
        narrative structure a real red team report follows, and the mental model behind The Hacker
        Playbook 3's internal network chapters.
      </p>
    </div>
  );
}
