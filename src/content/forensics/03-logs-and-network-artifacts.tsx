import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LogsAndNetworkArtifacts() {
  return (
    <div className="prose-hh">
      <h1>Windows Event Logs, Browser History &amp; Web Shell Artifacts</h1>
      <p>
        The previous lesson covered what's still in memory. This one covers what gets written down —
        four artifact sources that between them answer the questions every incident report has to answer:
        who logged in, what did they download, what did they plug in, and did the attacker leave anything
        behind on the server itself.
      </p>

      <h2>Windows Security Event Logs: the authentication record</h2>
      <p>
        Every logon attempt on a Windows host — successful or not, local or over the network — generates a
        Security Event Log entry with a specific Event ID. Knowing the handful that matter turns a raw,
        enormous log file into a short list of exactly the moments worth investigating.
      </p>
      <CodeBlock label="the event IDs worth knowing by number">{`4624   Successful logon
4625   Failed logon
4648   Logon using explicit credentials (a red flag when it's NOT an admin doing routine work)
4672   Special privileges assigned to new logon (admin-level access granted)
4768   Kerberos TGT requested (initial authentication)
4769   Kerberos service ticket requested (this is exactly what a Kerberoasting sweep floods)`}</CodeBlock>
      <p>
        <strong>Logon type</strong> is the second field that turns a bare "successful logon" into a real
        finding — it tells you <em>how</em> the authentication happened, and some types are far more
        significant than others:
      </p>
      <CodeBlock label="logon types that matter most">{`Type 2   Interactive       — physically at the keyboard
Type 3   Network            — this is what pass-the-hash and most lateral movement produces
Type 10  RemoteInteractive  — RDP`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The single strongest pass-the-hash indicator: a Type 3 (Network) logon (Event ID 4624) for a
          privileged account, from a source host that account has no ordinary business logging in from,
          with no corresponding interactive logon anywhere nearby. Real credentials typically show a mix of
          logon types across a normal workday — an account that's <em>only</em> ever seen as Type 3, in
          bursts, is behaving like a replayed hash, not a human.
        </p>
      </Callout>

      <h2>Browser history &amp; download artifacts: reconstructing what actually happened</h2>
      <p>
        "I never downloaded that" is one of the most common claims an incident responder hears — and
        browser artifacts are exactly what confirms or refutes it independent of what the user remembers.
        Every major browser keeps a local SQLite database of history and downloads that survives even after
        the user clears their visible history from the UI (the underlying database file is rarely actually
        wiped).
      </p>
      <CodeBlock label="where these databases live">{`Chrome/Edge (Windows):  %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History
Firefox (Windows):      %APPDATA%\\Mozilla\\Firefox\\Profiles\\<profile>\\places.sqlite

sqlite3 History "SELECT url, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 20;"
sqlite3 History "SELECT target_path, tab_url, start_time FROM downloads;"`}</CodeBlock>
      <p>
        The <code>downloads</code> table specifically records the exact URL a file was downloaded from
        alongside the local path it was saved to — pairing "a suspicious .exe appeared in Downloads" with
        "here's the exact page that served it" is what turns a vague suspicion into a documented delivery
        vector.
      </p>

      <h2>USB device history: proving physical media touched the machine</h2>
      <p>
        Windows records every USB storage device ever connected to a machine in the registry — vendor ID,
        product ID, serial number, and first/last connection times — regardless of whether the device is
        still attached. This is the standard way to prove (or rule out) a USB-based exfiltration or malware
        delivery vector after the fact.
      </p>
      <CodeBlock label="the registry keys that matter">{`HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\           # every USB storage device ever connected,
                                                          # keyed by vendor/product/version + serial number

HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\Disk&Ven_...&Prod_...\\<SERIAL>\\Properties\\...\\0064
                                                          # first-connected timestamp for that exact device

HKLM\\SOFTWARE\\Microsoft\\Windows Portable Devices\\Devices\\
                                                          # a second, independent record — cross-referencing
                                                          # against USBSTOR catches a device that was
                                                          # deliberately removed from one location but not the other`}</CodeBlock>
      <Callout variant="info">
        <p>
          Because the device serial number is recorded, this evidence is specific enough to say "this exact
          physical USB drive, not just some USB drive" — strong enough to correlate the same device across
          multiple machines in a wider investigation, not just confirm a single connection event.
        </p>
      </Callout>

      <h2>Web shell discovery: finding what an attacker left running</h2>
      <p>
        A web shell is a small script an attacker uploads to a compromised web server that gives them a
        persistent, browser-accessible command interface — the single most common way attackers maintain
        access to a compromised web application long after the original vulnerability that got them in is
        patched.
      </p>
      <CodeBlock label="what makes a file worth investigating on a web server">{`grep -rl "eval(\\$_POST\\|eval(\\$_GET\\|system(\\$_REQUEST" /var/www/     # classic PHP web shell signature —
                                                                       # executing arbitrary code straight
                                                                       # from an HTTP parameter

find /var/www/uploads -name "*.php"          # PHP files in an "uploads" directory (meant for images/docs)
                                              # are almost never legitimate — a strong standalone red flag

stat suspicious.php                          # a modification time that doesn't match any known deployment
                                              # is exactly what separates "part of the real application"
                                              # from "planted afterward"`}</CodeBlock>
      <p>
        Real web shells are frequently obfuscated (base64-encoded payloads, string concatenation to avoid
        the exact literal <code>eval($_POST</code> pattern) specifically to evade this kind of grep sweep —
        which is why file-integrity monitoring against a known-good baseline (the same idea the redteam
        module's persistence lesson applies to Autoruns entries) catches what a signature search alone
        misses: <em>any</em> new or modified file in a web root, obfuscated or not, is worth a look.
      </p>

      <Callout variant="danger">
        <p>
          Everything in this lesson — reading Security Event Logs, browser history databases, USB registry
          keys, and scanning for web shells — is standard, legitimate incident response and forensic
          analysis. It requires the same authorization any forensic examination does: you're either the
          system owner, or you have explicit written authorization to investigate the specific machine in
          front of you.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        Between this lesson and the last, you now have the four artifact categories nearly every real DFIR
        engagement draws from: memory (strings, process trees, C2 indicators), disk (deleted files, trash
        metadata), logs (Windows Security Events, browser history), and hardware/persistence (USB history,
        web shells). The labs in this module exercise each of these directly — this lesson is the
        conceptual map connecting them.
      </p>
    </div>
  );
}
