import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function InternalNetworkAttacks() {
  return (
    <div className="prose-hh">
      <h1>Internal Network Attacks &amp; Lateral Movement</h1>
      <p>
        Once you have a foothold inside a corporate network — via phishing, an exposed service, or a
        pentest handoff — the game changes completely. External recon is done from the outside looking in;
        internal recon means you're standing inside the building looking for the next door.
      </p>

      <h2>Internal network enumeration</h2>
      <CodeBlock label="the first things to run from a new foothold">{`ip a                            # what subnet am I actually on?
arp -a                          # what other hosts has this machine already talked to?
nmap -sn 10.10.30.0/24            # ping sweep the internal subnet
cat /etc/hosts                     # sometimes internal hostnames are hardcoded here
netstat -antp                       # what is THIS box already connected to?`}</CodeBlock>
      <p>
        The ARP cache and existing network connections are gold on an internal engagement — they show you
        real traffic patterns without sending a single new packet, an OPSEC-friendly way to map the
        environment before you start actively scanning.
      </p>

      <h2>Credential reuse: the internal network's biggest weakness</h2>
      <p>
        Real environments overwhelmingly reuse local admin passwords across many machines (a leftover
        habit from imaging every workstation from the same template). Once you have one set of local admin
        credentials, checking whether they work elsewhere is often the fastest path to more access:
      </p>
      <CodeBlock label="credential spraying across the internal subnet">{`crackmapexec smb 10.10.30.0/24 -u administrator -p 'CapturedPassword123!'
# a hit means that same local admin password works on another host too`}</CodeBlock>

      <h2>CrackMapExec and NetExec: the Swiss-army knife for credential validation</h2>
      <p>
        <strong>CrackMapExec</strong> (often abbreviated CME) became the standard tool for exactly the
        credential-spraying workflow above — checking one set of credentials against an entire subnet over
        SMB, WinRM, and other Windows management protocols in a single command, then using whatever hosts
        say "yes" to execute commands, dump hashes, or enumerate shares. Its original development slowed
        down, so the community forked it and now actively maintains the same tool under the name{' '}
        <strong>NetExec</strong> (often invoked as <code>nxc</code>) — same core workflow, actively patched
        and extended.
      </p>
      <CodeBlock label="NetExec: the modern CrackMapExec workflow">{`netexec smb 10.10.10.0/24 -u user -p pass
# validates one credential pair against every host answering on SMB across the whole /24 in one pass

netexec smb 10.10.10.0/24 -u user -p pass --local-auth -x "whoami"
# on every host where those creds work, execute a command remotely and return the output

netexec smb 10.10.10.5 -u user -p pass --sam
# dump the local SAM database (local account hashes) from a host you've authenticated to`}</CodeBlock>
      <p>
        This single tool covers credential validation, spraying across a range, remote command execution,
        and post-auth enumeration (shares, sessions, logged-on users) — which is why it's usually the very
        first thing run against a subnet the moment any valid credential, even a low-privilege one, is
        obtained.
      </p>

      <h2>Password spraying: the inverse of credential reuse</h2>
      <p>
        Credential spraying above starts with ONE working credential and asks "where else does it work."
        Password <strong>spraying</strong> starts with no valid credential at all and inverts the ratio
        entirely: one common, policy-plausible password (a seasonal string like <code>Summer2026!</code>)
        tried against MANY different usernames, instead of many passwords against one username. The reason
        this distinction matters operationally is account lockout: a normal brute force against a single
        account trips the lockout threshold (commonly 5-10 attempts) almost immediately and pages the SOC.
        A spray gives every single account exactly one login attempt — invisible to a per-account lockout
        counter, because no individual account ever approaches its threshold.
      </p>
      <CodeBlock label="hydra in spray mode — note -L (userlist) and -p (single password), the inverse of a normal brute force">{`hydra -L harvested-usernames.txt -p 'Summer2026!' ssh://10.10.30.5
# every username gets exactly ONE login attempt with the same password —
# this is what keeps a spray under the radar of any reasonable lockout policy`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Password spraying is one of the most common real initial-access techniques against
          externally-exposed VPN, RDP, and webmail portals precisely because it exploits a policy gap, not a
          technical one — the defense is not a better lockout threshold (spraying is designed to slip under
          any reasonable one), it's banning exactly the predictable seasonal/company-name password patterns
          the technique depends on.
        </p>
      </Callout>

      <h2>Lateral movement techniques</h2>
      <ul>
        <li><strong>Pass-the-hash</strong> — authenticate using a captured NTLM hash directly, without ever
        cracking it to plaintext (Windows accepts the hash itself as proof of knowledge in many auth flows).</li>
        <li><strong>Remote service execution</strong> — using valid admin credentials to remotely execute
        commands (historically <code>psexec</code>-style tools, or WMI/WinRM based equivalents).</li>
        <li><strong>RDP/SSH with reused creds</strong> — simplest and still extremely common in practice.</li>
      </ul>

      <h2>Pivoting: reaching networks you can't reach directly</h2>
      <p>
        Once you control a host that sits on two networks (your foothold segment and an internal-only
        segment), you can route traffic through it to reach hosts you otherwise couldn't:
      </p>
      <CodeBlock label="conceptual — SSH local port forwarding as a simple pivot">{`ssh -L 8080:10.10.40.5:80 user@foothold-box
# now http://localhost:8080 on YOUR machine tunnels through foothold-box to reach
# 10.10.40.5:80, a host on a network segment you can't route to directly`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Before attempting any lateral movement, always ask: does this action require dropping a new
          binary on disk (higher detection risk) or can it be done with tools already present on the box
          ("living off the land")? Built-in tools blend into normal admin activity far better.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Pass-the-hash, credential spraying, and pivoting are precisely the techniques that turn a single
          compromised laptop into a full domain compromise in real ransomware incidents. Practicing these
          is only legitimate against your own lab environment or a signed, in-scope engagement.
        </p>
      </Callout>

      <Callout variant="incident">
        <p>
          <strong>The 2017 Shadow Brokers leak — EternalBlue and DoublePulsar:</strong> in April 2017, a
          group calling itself the Shadow Brokers publicly leaked a cache of NSA "Equation Group" tooling,
          including EternalBlue (an SMB remote code execution exploit, later assigned CVE-2017-0144 / patched
          as MS17-010) and DoublePulsar, a covert kernel-mode backdoor implant EternalBlue was used to
          deliver. Within days, independent security vendors (Countercept and Microsoft among the first)
          published full public technical breakdowns of both — showing DoublePulsar hooked the SMB driver
          and answered only a specific, otherwise-unremarkable crafted "ping check" request, which is
          exactly why it had stayed hidden for so long before the leak forced it into the open. One month
          later, WannaCry weaponized EternalBlue into a self-propagating worm that hit hundreds of thousands
          of machines across 150 countries in days; a few weeks after that, NotPetya used the same exploit
          combined with reused local-admin credentials (the exact pattern earlier in this lesson) to cause
          billions of dollars in damage at Maersk, Merck, and others. The lesson within the lesson: patching
          the delivery exploit is not the same as removing a backdoor already planted through it — real
          incident response after EternalBlue required both patching MS17-010 <em>and</em> actively sweeping
          for DoublePulsar on every host that might already have been infected before the patch landed.
        </p>
      </Callout>

      <p>
        Credential reuse and lateral movement inside a Windows environment lead almost inevitably to one
        place: Active Directory, the identity backbone of nearly every corporate network — and the subject
        of the next two lessons.
      </p>
    </div>
  );
}
