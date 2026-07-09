import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ActiveDirectoryFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Active Directory Fundamentals &amp; Enumeration</h1>
      <p>
        Active Directory (AD) is Microsoft's directory service — the system that manages users, computers,
        groups, and permissions across almost every mid-to-large Windows corporate network. If you're
        doing internal red team work, you are doing AD work, full stop.
      </p>

      <h2>The core concepts</h2>
      <CodeBlock label="AD vocabulary you need cold">{`Domain            — the administrative boundary (e.g. CORP.LOCAL)
Domain Controller  — the server holding the directory database and handling authentication (DC)
Organizational Unit (OU) — a folder-like container organizing users/computers/groups
User / Computer objects  — every person and every machine is an object in the directory
Security Group      — collections of users granted permissions together (e.g. "Domain Admins")
GPO (Group Policy)    — centrally-pushed configuration/security settings
Kerberos               — the authentication protocol AD uses (replaces older NTLM where possible)`}</CodeBlock>

      <h2>Why AD is the single highest-value target in an internal engagement</h2>
      <p>
        Compromise the domain, and you effectively own every machine and user in it. This is why "Domain
        Admin" is the canonical objective in almost every AD-focused red team engagement — it's not a
        specific machine, it's the credential that controls all of them.
      </p>

      <h2>Enumerating AD once you have any valid domain credential</h2>
      <CodeBlock label="what a foothold with domain creds unlocks">{`crackmapexec smb 10.10.40.0/24 -u jdoe -p 'Password123!'    # find every host these creds work on
crackmapexec smb 10.10.40.5 -u jdoe -p 'Password123!' --users   # dump the full domain user list
enum4linux -a 10.10.40.5                                          # classic SMB/AD enumeration
smbclient -L //10.10.40.5/ -U jdoe%Password123!                    # list accessible shares`}</CodeBlock>
      <p>
        Even a single low-privilege domain account (which is what most phishing footholds give you) opens
        up enormous visibility — by design, most domain users can read most of the directory structure,
        because normal business operations need that (looking up a colleague's email, checking group
        membership, etc).
      </p>

      <h2>BloodHound: mapping attack paths, conceptually</h2>
      <p>
        BloodHound is the industry-standard tool for visualizing AD as a graph — users, groups, computers,
        and sessions as nodes, permissions and trust relationships as edges. It answers the question no
        manual enumeration easily can: "what is the shortest path from the account I have right now to
        Domain Admin?" Real engagements almost always run BloodHound immediately after gaining any domain
        foothold, because the answer is rarely obvious from just reading group names.
      </p>

      <Callout variant="tip">
        <p>
          A shockingly common BloodHound finding: a help-desk account with no obvious special privileges
          turns out to have "GenericAll" rights over a group that's nested inside Domain Admins — a path
          invisible to manual review but immediately visible on the graph.
        </p>
      </Callout>

      <h2>Common AD misconfigurations to always check</h2>
      <ul>
        <li>Overly-permissive group nesting (a "low privilege" group nested inside a high-privilege one)</li>
        <li>Accounts with <code>Password Never Expires</code> or weak/default passwords</li>
        <li>Service accounts running with Domain Admin privileges unnecessarily</li>
        <li>Unconstrained delegation configured on a computer object (lets it impersonate any user
        who authenticates to it)</li>
      </ul>

      <Callout variant="danger">
        <p>
          Enumerating a real organization's AD structure without authorization is both a serious crime and
          exposes sensitive personal/organizational data — practice AD enumeration only in dedicated lab
          environments (like Hack The Box's Active Directory tracks) or authorized engagements.
        </p>
      </Callout>

      <p>
        The final lesson in this module covers the specific attack techniques — Kerberoasting, AS-REP
        Roasting, and privilege escalation paths — that turn this enumeration into an actual domain
        compromise.
      </p>
    </div>
  );
}
