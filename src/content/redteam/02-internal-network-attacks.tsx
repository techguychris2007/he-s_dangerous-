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

      <p>
        Credential reuse and lateral movement inside a Windows environment lead almost inevitably to one
        place: Active Directory, the identity backbone of nearly every corporate network — and the subject
        of the next two lessons.
      </p>
    </div>
  );
}
