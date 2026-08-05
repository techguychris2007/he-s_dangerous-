import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LogOnboardingAndVolume() {
  return (
    <div className="prose-hh">
      <h1>Log Source Onboarding &amp; Managing Data Volume at Scale</h1>
      <p>
        The first lesson in this module covered normalization as a concept — mapping a firewall log and a
        Windows event onto the same schema. This lesson covers the operational reality behind that: how a new
        log source actually gets onboarded in the first place, what happens when a vendor silently changes
        their log format, and why "just ingest everything" stops being viable the moment a SIEM's licensing
        is billed by data volume.
      </p>

      <h2>Onboarding a new log source: the real workflow</h2>
      <CodeBlock label="what actually happens when a new application needs to feed the SIEM">{`1. IDENTIFY   -- what log format does this source produce natively? (JSON, syslog, CSV, proprietary)
2. COLLECT      -- configure a forwarder/agent to ship it (Splunk UF, Elastic Beats, syslog-ng, etc.)
3. PARSE          -- write or configure the field extraction: which raw fields map to which
                     normalized schema fields (src_ip, user, action)?
4. VALIDATE         -- confirm the parsed fields are actually populated correctly, not just present
5. BACKFILL           -- ingest historical data if compliance retention requires continuity
6. MONITOR             -- alert if this source's volume drops to near-zero (a silent forwarder
                           failure is functionally identical to a blind spot no one notices)`}</CodeBlock>
      <p>
        Step 6 is the one new SOCs skip most often, and it's the one that turns a onetime onboarding task into
        an ongoing operational responsibility: a log source that silently stops sending data doesn't announce
        the outage — it just quietly disappears from search results, and nobody notices until an
        investigation goes looking for it and finds nothing.
      </p>

      <Callout variant="warn">
        <p>
          A source-health monitor (alerting when any previously-active log source's volume drops
          unexpectedly) closes exactly this gap — treat "is this source still sending data at all" as its own
          detection rule, not just an assumption that holds forever once onboarding is done.
        </p>
      </Callout>

      <h2>When a parser breaks: the other half of maintenance</h2>
      <p>
        Vendors update their products, and log formats change with them — a field gets renamed, a new
        optional field gets added, a timestamp format shifts. None of this is announced to the SIEM team in
        advance. When it happens, the parser that used to correctly extract <code>src_ip</code> either starts
        populating it as empty, or silently maps the wrong field into it.
      </p>
      <CodeBlock label="a parser silently breaking after a vendor update, and why it's dangerous specifically because it's silent">{`BEFORE vendor update:  src_ip=203.0.113.5 user=jsmith action=denied
AFTER vendor update:   src_ip=(empty)      user=jsmith action=denied

-> the log is still arriving, still being indexed, still technically "collected" --
   but every correlation rule keyed on src_ip now silently stops matching this source.
   No error, no alert -- just quietly degraded detection coverage.`}</CodeBlock>
      <p>
        This is why mature detection-engineering practices (the backtesting discipline from the next module)
        periodically re-validate that existing rules still fire correctly against current data, not just when
        the rule was first written — a rule that worked perfectly six months ago can go silently blind today
        because of a parser break nobody has connected to that specific rule yet.
      </p>

      <h2>OpenTelemetry: a vendor-neutral answer to step 2</h2>
      <p>
        The "configure a forwarder/agent" step above has historically meant picking a vendor-specific agent
        (Splunk's Universal Forwarder, Elastic's Beats) tied to wherever that data ultimately lands.{' '}
        <strong>OpenTelemetry (OTel)</strong> — now a CNCF-graduated, industry-backed standard — offers a
        vendor-neutral alternative: a single collector and instrumentation standard for logs, metrics, and
        traces that can fan the same collected data out to multiple destinations (a SIEM, a separate
        observability platform, cold storage) at once, without instrumenting the source application
        differently for each one.
      </p>
      <CodeBlock label="why this matters for the vendor-migration problem specifically">{`WITHOUT OTel:  switching SIEM vendors means re-instrumenting every application's logging
                 agent to point at the new vendor's proprietary forwarder
WITH OTel:      applications emit data in one standard format to an OTel Collector once;
                 changing SIEM vendors is a routing config change in the collector, not a
                 re-instrumentation project touching every single application`}</CodeBlock>
      <p>
        This is the log-collection-layer version of exactly the problem Sigma (covered in the next module)
        solves for detection rules — decoupling "how do we collect/describe this" from "which specific
        vendor product consumes it this year."
      </p>

      <h2>Data volume and cost: why "ingest everything" doesn't survive contact with a bill</h2>
      <p>
        Most commercial SIEM licensing is priced by ingested data volume — dollars per gigabyte-per-day, or
        per events-per-second. That single fact shapes real SIEM architecture more than almost anything else
        covered in this module: every log source is implicitly a cost decision, not just a security decision.
      </p>
      <CodeBlock label="the tradeoff every SOC eventually has to make explicit">{`HIGH SECURITY VALUE, LOW VOLUME    -> ingest fully into the SIEM (auth logs, EDR alerts, firewall denies)
HIGH VOLUME, LOWER PER-EVENT VALUE -> route to cheaper storage, sample, or filter before the SIEM
                                       (verbose debug logs, full DNS query logs, raw network flow data)`}</CodeBlock>
      <p>
        <strong>Cribl Stream</strong>, <strong>Logstash</strong>, and <strong>Fluentd</strong> are the tools
        built specifically to sit between raw log sources and the SIEM to make that routing decision
        programmatically — parsing, filtering, and reshaping data in flight, sending the security-relevant
        subset to the (expensive) SIEM and the rest to (cheap) long-term object storage where it's still
        available if an investigation needs to reach further back, just not paying premium per-gigabyte SIEM
        pricing to sit there by default.
      </p>

      <Callout variant="tip">
        <p>
          This connects directly back to the retention economics from the Incident Response module: hot,
          immediately-searchable storage for the recent window investigations actually run against, cheaper
          cold storage for the longer compliance-retention tail — a log-shaping layer like Cribl is often the
          actual mechanism that routes data into each tier automatically, rather than that split happening by
          accident.
        </p>
      </Callout>

      <p>
        With log onboarding, parser maintenance, and the volume/cost tradeoff all covered, this closes out the
        module's coverage of what a SIEM actually is and how it's kept running day to day. The next module
        goes deeper on the actual craft of detection: writing and tuning your own rules, building behavioral
        baselines with UEBA, and integrating external threat intelligence feeds directly into your search
        workflow.
      </p>
    </div>
  );
}
