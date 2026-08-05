import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function EnumerationMethodology() {
  return (
    <div className="prose-hh">
      <h1>Putting It Together: The Enumeration Methodology</h1>
      <p>
        This closing lesson of Module 3 assembles every prior lesson into the single repeatable
        methodology used in the RTFM, The Hacker Playbook 3, and every real penetration test: recon,
        foothold, privilege escalation, reporting. This exact loop is what you'll execute end-to-end in the
        four labs that follow.
      </p>

      <h2>The full methodology</h2>
      <CodeBlock label="the loop you will run on every box, every engagement">{`1. RECON
   - Passive: WHOIS, DNS, cert transparency, OSINT
   - Active:  nmap -sn (host discovery) -> nmap -sV -sC -p- (deep scan)

2. ENUMERATION
   - Per open port: identify service+version, check for anon/default access,
     pull banners, browse web content, list SMB/FTP shares

3. INITIAL ACCESS / FOOTHOLD
   - Exploit a known CVE for the identified version, OR
   - Use discovered/brute-forced/default credentials, OR
   - Abuse an intentional misconfiguration (writable share, exposed admin panel)

4. PRIVILEGE ESCALATION
   - Enumerate: sudo -l, SUID binaries, cron jobs, writable files owned by root,
     kernel version against known privesc CVEs
   - Exploit the first viable path to root/SYSTEM

5. POST-EXPLOITATION / REPORTING
   - Capture proof (flags in training; evidence + screenshots in real engagements)
   - Document exactly how you got in, in reproducible steps, with remediation advice`}</CodeBlock>

      <h2>A worked example, narrated</h2>
      <p>
        Say <code>nmap -sV</code> shows ports 21 (FTP, anonymous allowed), 22 (SSH), and 80 (HTTP). Your
        methodology says: try FTP anonymous login first (fast, often free data) → browse the FTP directory
        → find a file that leaks a username or password → try that credential over SSH → once in, run
        <code>sudo -l</code> → find a NOPASSWD rule on a GTFOBins binary → escalate to root → read the
        flag. That is <em>exactly</em> the shape of the capstone lab waiting for you at the end of this
        module — nothing about it is contrived; it mirrors real HTB/THM "easy" box paths almost exactly.
      </p>

      <Callout variant="tip">
        <p>
          Keep notes as you go — target IP, open ports, versions, every credential you find, every path you
          tried (even failed ones). On real engagements this becomes your report; in labs it's what keeps
          you from re-doing work you already did an hour ago.
        </p>
      </Callout>

      <Callout variant="info">
        <p>
          <strong>Further reading &amp; real-world references:</strong> the modular framework approach in
          <code> Recon-ng</code> is worth revisiting once these fundamentals are automatic — it's built
          around exactly this recon-to-report loop. For how this methodology plays out against real,
          currently-patched vulnerabilities, the <strong>Google Project Zero blog</strong> and
          <strong> PortSwigger Research</strong> publish detailed technical write-ups of real bugs found
          using this same enumerate-everything mindset. And when you're ready to apply it against realistic
          web targets, the <strong>OWASP</strong> project and the <strong>PortSwigger Web Security
          Academy</strong> are the two most respected free places to practice — both are referenced again in
          this course's Web Application Hacking module.
        </p>
      </Callout>

      <h2>This loop has a name: PTES</h2>
      <p>
        The methodology above isn't something this course invented — it's a compressed version of the{' '}
        <strong>Penetration Testing Execution Standard (PTES)</strong>, the widely-referenced framework the
        industry uses to structure engagements: Pre-engagement, Intelligence Gathering, Threat Modeling,
        Vulnerability Analysis, Exploitation, Post-Exploitation, and Reporting. This lesson's five-step loop
        maps directly onto PTES's middle five phases; the two PTES adds on either end (formal
        pre-engagement scoping, and reporting as a fully separate discipline) are exactly why later modules
        in this course cover rules-of-engagement discipline and report writing as distinct skills in their
        own right, not just an afterthought tacked onto exploitation.
      </p>

      <h2>You're ready for the labs</h2>
      <p>
        You now have the full foundation: networking (Module 1), Linux (Module 2), and the recon/
        enumeration methodology (this module). The next section is entirely hands-on — a real interactive
        terminal, real simulated hosts, and flags to capture using precisely the commands you've just
        learned. Good luck, and enumerate everything.
      </p>
    </div>
  );
}
