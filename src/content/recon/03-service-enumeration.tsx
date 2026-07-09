import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ServiceEnumeration() {
  return (
    <div className="prose-hh">
      <h1>Service Enumeration: HTTP, FTP, SSH &amp; SMB</h1>
      <p>
        Nmap tells you what's open. Enumeration is digging into each open service until you find a way in.
        This is the highest-leverage skill in the whole methodology — most real compromises come from
        thorough enumeration, not exotic exploits.
      </p>

      <h2>HTTP enumeration</h2>
      <CodeBlock label="directory / content discovery">{`curl -s http://10.10.10.5/robots.txt        # often lists paths admins want hidden from search engines
gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/dirb/common.txt
whatweb http://10.10.10.5                     # fingerprint CMS/framework/server
nikto -h http://10.10.10.5                     # automated vuln/misconfig scanner`}</CodeBlock>
      <p>
        <code>robots.txt</code> is deceptively valuable: it's meant to tell search engine crawlers what
        <em> not</em> to index — which means it's effectively a hand-written list of paths the
        administrators considered sensitive enough to hide.
      </p>

      <h3>Probing web services at scale: httpx &amp; Katana</h3>
      <p>
        The tools above work great against one host. Once you've enumerated a subdomain list with the
        tools from the previous lesson, you need something that checks HTTP(S) status, titles, and tech
        stack across hundreds of hosts in one pass — that's exactly what <strong>httpx</strong> (from
        ProjectDiscovery, not to be confused with the Python HTTP client of the same name) is built for.
      </p>
      <CodeBlock label="httpx — bulk HTTP probing">{`subfinder -d target.com -silent | httpx -silent -status-code -title -tech-detect
# feeds a subdomain list straight in, prints only the hosts that actually respond,
# along with status code, page title, and fingerprinted technology per host`}</CodeBlock>
      <p>
        <strong>Katana</strong> (also ProjectDiscovery) is the crawling complement to httpx — instead of
        just checking if a host responds, it follows links, forms, and JavaScript-referenced endpoints to
        map out everything reachable on a site, which is often where the interesting attack surface (API
        routes, forgotten admin paths, JS files leaking endpoint names) actually lives.
      </p>
      <CodeBlock label="katana — endpoint discovery via crawling">{`katana -u https://target.com -jc -d 3
# -jc also parses JavaScript files for additional endpoints, -d 3 limits crawl depth`}</CodeBlock>
      <p>
        The natural pipeline: subdomain enumeration → httpx (which hosts are alive, what are they running)
        → katana (what's actually reachable on the interesting ones) → gobuster/nikto for deeper brute
        forcing on specific targets that stood out.
      </p>

      <h2>FTP enumeration</h2>
      <CodeBlock>{`ftp 10.10.10.5
Name: anonymous
Password: (blank, or anonymous@)
ftp> ls
ftp> get interesting-file.txt`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Anonymous FTP login being enabled is one of the most common "free win" misconfigurations you'll
          find in the wild — always try it before anything else on port 21. You'll practice exactly this
          login flow with <code>ftp</code> and <code>ftp-get</code> in the lab terminal.
        </p>
      </Callout>

      <h2>SSH enumeration</h2>
      <CodeBlock>{`ssh -V                       # your client version
nc -nv 10.10.10.5 22           # grab the SSH banner directly
ssh user@10.10.10.5             # version + auth method (password vs. key-only) becomes visible immediately`}</CodeBlock>
      <p>
        SSH itself is rarely exploitable directly (modern versions), but weak or reused passwords on valid
        usernames are extremely common — which is exactly what credential attacks (next lesson) target.
      </p>

      <h2>SMB enumeration (Windows file sharing)</h2>
      <CodeBlock>{`smbclient -L //10.10.10.5/ -N          # list shares, -N = no password (anonymous/null session)
smbclient //10.10.10.5/share -N
enum4linux -a 10.10.10.5                # user lists, share lists, password policy, OS version
crackmapexec smb 10.10.10.0/24           # sweep a whole subnet for SMB info + auth checks`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Null/anonymous SMB sessions being allowed is a legacy Windows misconfiguration that still shows
          up constantly on internal engagements — it can leak usernames, share names, and sometimes entire
          file shares without any credentials at all.
        </p>
      </Callout>

      <h2>The enumeration mindset</h2>
      <p>
        For every open port: identify the exact version → check for known CVEs → check for default/anon
        access → check for information disclosure (banners, default pages, exposed files) → note anything
        for later (usernames, paths, technology hints) even if it's not immediately exploitable. The next
        lesson turns discovered usernames into a credential attack; the lab after this module has you run
        this exact loop against a simulated multi-service target.
      </p>
    </div>
  );
}
