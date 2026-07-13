import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function RealSiemPlatformsCompared() {
  return (
    <div className="prose-hh">
      <h1>Real SIEM Platforms Compared: Splunk, Sentinel, QRadar, Elastic &amp; Chronicle</h1>
      <p>
        The underlying concepts — collection, normalization, correlation — are the same everywhere, but every
        real SIEM platform wraps them in its own query language and interface conventions. Knowing the rough
        shape of each is what lets you walk into a SOC running any one of them and be productive within a day,
        instead of needing weeks to learn "a whole new tool." The labs in the SOC Portal give you hands-on
        practice in five of the most widely deployed ones.
      </p>

      <h2>Splunk Enterprise Security — SPL</h2>
      <p>
        Splunk popularized log search with its own query language, SPL (Search Processing Language), which
        pipes data through a chain of commands much like a Unix shell pipeline.
      </p>
      <CodeBlock label="a representative SPL query">{`index=auth sourcetype="linux_secure" "Failed password"
| stats count by src_ip
| where count > 20`}</CodeBlock>
      <p>
        The <code>|</code> (pipe) is the defining feature of SPL — each stage filters, transforms, or
        aggregates the output of the stage before it, ending in a stats table an analyst can read directly.
      </p>

      <h2>Microsoft Sentinel — KQL</h2>
      <p>
        Sentinel is Microsoft's cloud-native SIEM, built on Azure and using KQL (Kusto Query Language) — the
        same query language used across Azure Monitor and Log Analytics generally, which means skills transfer
        directly between Sentinel and other Microsoft observability tooling.
      </p>
      <CodeBlock label="a representative KQL query">{`SecurityEvent
| where EventID == 4625
| summarize FailureCount = count() by Account, bin(TimeGenerated, 5m)
| where FailureCount > 20`}</CodeBlock>
      <p>
        Sentinel organizes findings into <strong>Incidents</strong> — a triage queue that groups related
        alerts together automatically, rather than presenting every individual alert as its own item.
      </p>

      <h2>IBM QRadar — AQL and Offenses</h2>
      <p>
        QRadar uses AQL (Ariel Query Language, deliberately SQL-like) and organizes correlated findings as{' '}
        <strong>Offenses</strong> — each one carries a <strong>Magnitude</strong> score (roughly 1-10) computed
        from severity, relevance, and credibility, giving analysts an at-a-glance priority ranking across a
        long queue instead of having to open every item to judge its importance.
      </p>
      <CodeBlock label="a representative AQL query">{`SELECT sourceip, COUNT(*) AS event_count
FROM events
WHERE category = 'Authentication' AND eventtype = 'Failure'
LAST 1 HOURS
GROUP BY sourceip
ORDER BY event_count DESC`}</CodeBlock>

      <h2>Elastic Security — KQL over Kibana Discover</h2>
      <p>
        Elastic Security is built on the same Elasticsearch/Kibana stack widely used for general-purpose log
        analytics, giving it a natural advantage in raw search speed and flexible, document-oriented queries.
        Its own query syntax (also commonly called KQL, unrelated to Microsoft's) reads close to natural
        language field comparisons.
      </p>
      <CodeBlock label="a representative Elastic query">{`event.category: "authentication" and event.outcome: "failure" and source.ip: "185.220.101.9"`}</CodeBlock>
      <p>
        The <strong>Discover</strong> view is Elastic's primary investigation surface — a scrollable document
        table over whatever index and time range is selected, closer in feel to a raw database browser than a
        purpose-built security console, which is exactly why Elastic Security is so often chosen by teams that
        already run Elasticsearch for other purposes.
      </p>

      <h2>Google Security Operations (Chronicle) — UDM</h2>
      <p>
        Chronicle is Google's cloud-native security operations platform, built around UDM (Unified Data
        Model) — its own normalization schema that every ingested log source gets mapped into, so a single
        field name like <code>target.ip</code> or <code>principal.hostname</code> means the same thing
        regardless of which vendor originally produced the log.
      </p>
      <CodeBlock label="a representative UDM search">{`target.ip = "185.220.101.7" AND metadata.event_type = "NETWORK_CONNECTION"`}</CodeBlock>

      <h2>What actually differs, and what doesn't</h2>
      <CodeBlock label="same concept, five different surfaces">{`Splunk    -> pipeline-style SPL, "events" as the base unit
Sentinel  -> KQL, findings grouped into "Incidents"
QRadar    -> SQL-like AQL, findings scored as "Offenses" with a Magnitude
Elastic   -> field-comparison KQL, raw document search via "Discover"
Chronicle -> UDM search over a single unified schema across all ingested sources`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Every one of these platforms still runs on the same three fundamentals from the previous two
          lessons: collect everything, normalize it into a common schema, and correlate multiple weak signals
          into one strong finding. Learning a fourth or fifth platform after your first is mostly learning a
          new syntax for concepts you already understand — which is exactly why this module has you practice
          across all five rather than mastering just one.
        </p>
      </Callout>

      <p>
        With the platform landscape covered, the next module goes deeper on the actual craft of detection:
        writing and tuning your own rules, building behavioral baselines with UEBA, and integrating external
        threat intelligence feeds directly into your search workflow.
      </p>
    </div>
  );
}
