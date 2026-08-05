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

      <h2>BloodHound: attack paths, not just misconfigurations</h2>
      <p>
        BloodHound is the industry-standard tool for visualizing AD as a graph — users, groups, computers,
        and sessions as nodes, permissions and trust relationships as edges connecting them. Data collection
        happens via its companion collector, <strong>SharpHound</strong>, which runs on a domain-joined host
        (or remotely with just domain credentials) and pulls the raw relationship data — group memberships,
        ACLs, active sessions, local admin rights — that BloodHound then renders as a graph.
      </p>
      <CodeBlock label="the typical BloodHound workflow">{`# 1. collect data from inside the domain (or remotely with valid creds)
SharpHound.exe -c All

# 2. import the resulting JSON into the BloodHound GUI
# 3. query: "Shortest Paths to Domain Admins" from the node representing your current foothold`}</CodeBlock>
      <p>
        The mental model that makes BloodHound so effective is "attack paths, not just misconfigurations."
        A single misconfigured permission in isolation (one account with GenericAll rights over one group)
        often looks harmless when reviewed on its own — it's the <em>chain</em> of individually
        unremarkable permissions across multiple hops that adds up to a route to Domain Admin. Manual review
        checks configurations one at a time; BloodHound's graph traversal finds the multi-hop path that no
        human reviewing an access control list line by line would ever piece together.
      </p>

      <Callout variant="tip">
        <p>
          A shockingly common BloodHound finding: a help-desk account with no obvious special privileges
          turns out to have "GenericAll" rights over a group that's nested inside Domain Admins — a path
          invisible to manual review but immediately visible on the graph.
        </p>
      </Callout>

      <h2>PingCastle: the defender's-eye view of the same terrain</h2>
      <p>
        Where BloodHound is built for the red team question — "what's my path to Domain Admin from here?"
        — <strong>PingCastle</strong> is built for the blue team question: "how healthy is our AD
        environment overall, and where should we invest hardening effort first?" It runs a broad battery of
        checks against a domain — stale trusts, weak password policies, dangerous delegation settings,
        obsolete protocol support — and produces a scored, risk-graded health-check report rather than an
        interactive attack-path graph.
      </p>
      <p>
        The two tools are complementary rather than competing: a defensive team runs PingCastle
        periodically as an audit/scoring exercise to track risk trend over time, while a red team runs
        BloodHound against the same domain to find the specific exploitable path an attacker with a single
        foothold would take. Seeing both perspectives on the same domain is one of the fastest ways to
        understand why "no critical CVEs" and "actually secure" are not the same thing in AD environments.
      </p>

      <h2>When BloodHound isn't available: raw LDAP enumeration</h2>
      <p>
        BloodHound needs its collector to actually run, and some engagements (a heavily monitored host, a
        restricted foothold) make that too risky. Active Directory is fundamentally an LDAP directory
        underneath its Windows-specific tooling, which means the same data is reachable with nothing more
        than a standard LDAP query — slower to work with than a graph, but works from any host with network
        reach to a Domain Controller and zero special tooling installed:
      </p>
      <CodeBlock label="ldapsearch — the manual, no-special-tools alternative">{`ldapsearch -x -H ldap://10.10.40.5 -D "jdoe@corp.local" -w 'Password123!' \\
  -b "DC=corp,DC=local" "(objectClass=user)" sAMAccountName memberOf
# -b sets the search base (the domain's distinguished name); the filter pulls every user
# object and prints their username plus group memberships — the same raw data
# SharpHound collects, just queried directly instead of through a purpose-built collector`}</CodeBlock>
      <p>
        Knowing this fallback exists matters beyond just OPSEC caution: it's also the technique that works
        from a non-Windows attack box with no BloodHound/SharpHound setup at all, and it's a useful sanity
        check to confirm what a domain account can actually see before trusting a GUI tool's interpretation
        of it.
      </p>

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
