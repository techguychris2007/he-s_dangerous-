import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SigmaRules() {
  return (
    <div className="prose-hh">
      <h1>Sigma Rules: Vendor-Neutral Detection-as-Code</h1>
      <p>
        The first lesson in this module covered writing detection rules and storing them as version-controlled
        code. It left one problem unsolved: a rule written in Splunk's SPL only runs on Splunk. A SOC that
        migrates SIEM vendors — or simply wants to share a detection with the wider security community —
        needs a way to express "this technique, this data source, this logic" independently of any one
        platform's query language. That's exactly what Sigma exists to solve.
      </p>

      <h2>What Sigma actually is</h2>
      <p>
        Sigma is an open, YAML-based generic signature format for log-based detections — the same underlying
        idea as YARA for files or Snort rules for network traffic, but for SIEM search queries. A single Sigma
        rule describes a detection's <em>logic</em> (what log source, what field values, what condition) without
        committing to any specific query syntax.
      </p>
      <CodeBlock label="a real Sigma rule, simplified — detecting the exact certutil LOLBin abuse from an earlier lesson">{`title: Certutil Download via -urlcache
id: 3838e0e6-1f3a-4b1a-9f2b-example
status: stable
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\certutil.exe'
    CommandLine|contains: '-urlcache'
  condition: selection
level: high`}</CodeBlock>
      <p>
        Notice what's absent: no SPL, no KQL, no Splunk-specific field names. Just a plain description of the
        process name, the command-line substring, and the condition that combines them.
      </p>

      <h2>One rule, many backends</h2>
      <p>
        A Sigma rule isn't executed directly — it gets <strong>converted</strong> into a real query for
        whatever platform actually runs it, using a conversion tool (<code>sigma-cli</code>, built on the
        <code>pySigma</code> library) and a platform-specific "backend." The same rule above compiles to
        meaningfully different, platform-native syntax:
      </p>
      <CodeBlock label="the same detection logic, compiled three different ways">{`# sigma-cli convert -t splunk certutil-urlcache.yml
Image="*\\\\certutil.exe" CommandLine="*-urlcache*"

# sigma-cli convert -t sentinel_alert_rules certutil-urlcache.yml  (KQL)
DeviceProcessEvents
| where FolderPath endswith "\\\\certutil.exe" and ProcessCommandLine has "-urlcache"

# sigma-cli convert -t elasticsearch_lucene certutil-urlcache.yml
process.name:certutil.exe AND process.command_line:*-urlcache*`}</CodeBlock>
      <p>
        This is the direct payoff of the SIEM-platform comparison from the previous module: the same detection
        intent now maps cleanly onto Splunk's SPL, Microsoft Sentinel's KQL, and Elastic's Lucene/EQL syntax —
        exactly the three query languages that lesson walked through individually.
      </p>

      <Callout variant="tip">
        <p>
          This is also why Sigma matters for the detection-as-code workflow from lesson one: a Sigma rule is
          just a text file, reviewable in a pull request like any other code change, that can then be compiled
          to whichever backend a given environment actually runs — decoupling "how do we write and review a
          detection" from "which SIEM happens to run it this year."
        </p>
      </Callout>

      <h2>SigmaHQ: detections as a shared commons</h2>
      <p>
        The single largest practical benefit is community reuse. SigmaHQ maintains a public, continuously
        updated repository of thousands of Sigma rules covering ATT&amp;CK techniques, contributed by
        researchers and SOC teams across the industry — a new technique gets publicly disclosed, someone
        writes a Sigma rule for it, and every SOC using Sigma can pull that rule and compile it for their own
        platform within hours, instead of every organization independently reinventing the same detection
        logic in isolation.
      </p>
      <CodeBlock label="pulling and compiling a community rule, conceptually">{`git clone https://github.com/SigmaHQ/sigma
sigma-cli convert -t splunk sigma/rules/windows/process_creation/proc_creation_win_lolbin_certutil_download.yml
# a detection written and reviewed by the wider community, running on your specific SIEM within minutes`}</CodeBlock>
      <p>
        Vendor adoption has followed: Microsoft Sentinel, Elastic Security, and Splunk (via Sigma-to-SPL
        translation) all support Sigma rules directly or through official conversion tooling — Sigma has
        become close to a de facto standard interchange format for SIEM-agnostic detection content, the same
        role STIX/TAXII plays for threat intelligence feeds, covered in the next lesson.
      </p>

      <Callout variant="warn">
        <p>
          A converted Sigma rule is a starting point, not a finished product — the backtesting and tuning
          discipline from lesson one still applies in full. A community rule was written against someone
          else's environment and log schema; confirm the field mappings and thresholds actually match your
          own data before trusting it in production, the same as any rule you'd write from scratch.
        </p>
      </Callout>

      <p>
        This closes out the module's three complementary detection approaches — rules, behavioral baselining,
        and now vendor-neutral detection-as-code — plus the external threat-intelligence layer from the
        previous lesson. Together they're the full toolkit a detection engineer draws on: write a
        technique-specific rule when you know exactly what to look for, lean on UEBA when you don't, share and
        reuse Sigma rules instead of reinventing detection logic per platform, and layer in threat intel for
        the findings that depend on knowledge no internal telemetry could ever generate on its own. The next
        module turns to what happens once one of these detections fires for real: investigating it properly,
        automating the response, and reporting on all of it for compliance.
      </p>
    </div>
  );
}
