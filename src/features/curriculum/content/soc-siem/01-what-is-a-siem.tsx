import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WhatIsASiem() {
  return (
    <div className="prose-hh">
      <h1>What Is a SIEM? Log Collection, Normalization &amp; Centralization</h1>
      <p>
        A SIEM (Security Information and Event Management) platform collects and analyzes security
        telemetry so analysts can search across systems, build detections, and investigate alerts. It is a
        central part of many SOC workflows, but it is not the whole SOC: endpoint, identity, cloud, ticketing,
        and response tools may keep their own data and actions. This lesson explains how events reach a
        SIEM, how field mapping enables useful queries, and how to judge whether the resulting data is fit
        for an investigation.
      </p>

      <h2>Log collection: pulling data from everywhere</h2>
      <p>
        Common sources include firewalls, servers, workstations, identity providers, network devices,
        applications, databases, cloud control planes, and endpoint detection products. Each source has its
        own event vocabulary, clock, retention behavior, and failure modes. Local logs remain useful for
        troubleshooting and forensic collection; central collection adds cross-system search, correlation,
        access control, and managed retention. The design must preserve the source and collection context
        so analysts can trace an event back to its origin.
      </p>
      <CodeBlock label="a few of the sources a real SIEM ingests continuously">{`Firewalls           -> connection allow/deny decisions
Windows/Linux hosts  -> authentication, process execution, file access
Cloud platforms       -> API calls, IAM changes, storage access (CloudTrail-style logs)
EDR/antivirus          -> process behavior, malware detections
Applications            -> login attempts, transaction records, error logs`}</CodeBlock>

      <h2>Centralized log management: the value of one searchable place</h2>
      <p>
        Central search can reduce the time spent collecting records from separate consoles and enables an
        analyst to compare a sign-in, endpoint process, firewall decision, and cloud API call on one
        timeline. Retention periods come from the organization’s incident-response needs, contracts, laws,
        and specific control requirements; there is no single period that every framework universally
        requires. The organization must document which records it retains, for how long, who can access
        them, and how they are produced for an investigation or audit.
      </p>
      <Callout variant="tip">
        <p>
          Centralization helps only when the records are timely, searchable, protected, and retained for the
          right reason. Define those requirements before adding a source; a searchable store is not a
          substitute for endpoint evidence collection or a tested incident-response process.
        </p>
      </Callout>

      <h2>Normalization: making incompatible formats speak the same language</h2>
      <p>
        A firewall and a Windows domain controller describe completely unrelated concepts in completely
        unrelated syntaxes. A SIEM's ingestion pipeline parses each source's native format and maps it onto a
        common schema — shared field names like <code>src_ip</code>, <code>user</code>, and{' '}
        <code>action</code> — so a single query can join events from sources that have nothing in common
        except the fact that they both mention the same IP address.
      </p>
      <CodeBlock label="two completely different native formats, normalized to the same schema">{`RAW FIREWALL LOG:  deny tcp src=203.0.113.5 dst=10.10.5.20 dport=22 action=DENY
RAW WINDOWS LOG:   EventID=4625 Account Name: jsmith Source Network Address: 203.0.113.5

NORMALIZED:        src_ip=203.0.113.5 dest_ip=10.10.5.20 action=denied
                    src_ip=203.0.113.5 user=jsmith event=failed_logon

-> both records now share the same src_ip field and can be searched/joined together,
   even though their original formats had nothing whatsoever in common.`}</CodeBlock>
      <p>
        This is precisely the mechanic the "SIEM Essentials: Log Normalization" lab in the SOC Portal has you
        confirm hands-on — finding the normalized event that ties two raw, differently-formatted logs
        together on a shared field.
      </p>

      <h2>Real-time monitoring: seeing events as they happen</h2>
      <p>
        Some detections run as events arrive; others run on a schedule or over a defined look-back window.
        Ingestion delay, clock skew, late-arriving events, and backfills affect when a detection can fire.
        An account lockout or firewall change may be searchable before a rule processes it, and an alert may
        be delayed by queueing or suppression. The rule’s schedule, data latency, and alert routing are
        therefore part of the detection’s actual coverage.
      </p>

      <Callout variant="incident">
        <p>
          Centralized logs make an event discoverable; they do not automatically create a useful alert or
          ensure a human responds. Detection logic, alert routing, analyst ownership, escalation criteria,
          and response authority must all work together. NIST's current incident-response guidance treats
          response as part of ongoing cybersecurity risk management rather than a stand-alone cleanup phase.
        </p>
      </Callout>

      <h2>How a modern telemetry pipeline works</h2>
      <p>
        A SIEM is usually one part of a larger security-analytics pipeline. A source emits an event; an
        agent, cloud integration, API connector, or collector transports it; processors parse and enrich it;
        the platform routes it to searchable storage; scheduled or streaming detections evaluate it; and an
        alert may create a case for an analyst. Some deployments send the same event to a data lake, a
        security data platform, or an observability system as well. The components and product names vary,
        but the data-quality questions do not.
      </p>
      <CodeBlock label="example of one event after parsing and normalization">{`{
  "timestamp": "2026-10-15T09:42:18.231Z",
  "observed_timestamp": "2026-10-15T09:42:19.004Z",
  "severity": "WARN",
  "event_name": "authentication.failure",
  "body": "Interactive sign-in rejected",
  "resource": {
    "service.name": "identity-provider",
    "cloud.region": "eu-west-1"
  },
  "attributes": {
    "user.name": "mira.chen",
    "source.address": "198.51.100.24",
    "authentication.method": "password",
    "outcome": "failure"
  }
}`}</CodeBlock>
      <p>
        Here, <code>timestamp</code> is when the source says the event happened; the observed time is when
        the collector saw it. Their difference is ingestion delay. If clocks drift or queues back up, a
        time-window detection can miss events or order them incorrectly. Keep timestamps with time zones,
        monitor source clock health, and distinguish event time from processing time when building a
        timeline. The resource fields identify the relatively stable emitting service; the attributes
        describe this particular event.
      </p>
      <p>
        OpenTelemetry defines a vendor-neutral log record model with timestamp, observed timestamp,
        severity, body, resource information, and event attributes. Security products also use schemas
        such as Elastic Common Schema or Microsoft ASIM; those are not interchangeable field dictionaries.
        A mapping must preserve meaning. For example, an account name, a process user ID, and an email
        address should not all be forced into a generic <code>user</code> field if doing so loses identity
        context.
      </p>

      <h2>Measure coverage and data quality</h2>
      <p>
        “The source is connected” is not a coverage measure. Verify that the expected event types arrive,
        required fields parse, timestamps are plausible, and records remain searchable for the required
        period. Track last-seen time per source, event counts against a baseline, parse failures, dropped
        records, duplicate rates, and changes in schema or volume. A quiet authentication source may mean
        there were no logins—or that a forwarder stopped working. A health check and an independent signal
        help distinguish the two.
      </p>
      <CodeBlock label="field checklist for onboarding a source">{`Source: identity provider sign-in audit
Owner: Identity Operations
Expected events: success, failure, MFA challenge, account disable
Required fields: event time, actor, source address, outcome, application
Time basis: UTC; retain both source and collector timestamps
Validation: known test sign-in appears with correct actor and outcome
Health: alert if no events arrive within the source's normal interval
Privacy: exclude secrets and minimize personal fields not needed for detection`}</CodeBlock>
      <p>
        Onboarding should include a controlled test event and a failure test, such as pausing a lab
        forwarder. Confirm that a detection can find the known event, then confirm that the health monitor
        notices missing telemetry. Keep source ownership and a contact path alongside the technical
        configuration; without an owner, parsing changes and outages can remain unresolved.
      </p>

      <h2>Retention, routing, and cost are design decisions</h2>
      <p>
        SIEM pricing and storage models differ by vendor, cloud, contract, query pattern, and product tier,
        so a fixed per-gigabyte price or universal hot/warm/cold schedule quickly becomes misleading.
        Estimate a deployment from measured event volume and size, expected growth, searchable retention,
        archive requirements, query demand, replication, and the cost of moving or restoring data. A lower
        ingest bill is not a win if it removes the evidence needed to investigate an incident or prove a
        control worked.
      </p>
      <p>
        Apply filtering only with a documented reason and a test. Redact credentials and unnecessary
        sensitive fields at or before collection. Route high-volume diagnostic records to an appropriate
        cheaper store when policy permits, while preserving security-relevant events and a retrieval path.
        Define hot, warm, and archive tiers by the organization’s response needs and retention obligations,
        not by a generic number of days. Revisit the design when new services, regulations, or detection
        requirements change.
      </p>
      <Callout variant="tip">
        <p>
          A good onboarding question is not merely “Can we ingest it?” Ask: “Which decision will this
          telemetry support, what fields must be reliable, how do we know collection is healthy, who owns
          it, how long must it remain available, and what sensitive data should never be stored?”
        </p>
      </Callout>

      <p>
        With collection, centralization, and normalization established, the next lesson covers what a SIEM
        actually does with all this unified data: correlation — turning a flood of individually-harmless
        events into the small number of alerts that actually matter.
      </p>
      <p>
        Further reading: <a href="https://opentelemetry.io/docs/specs/otel/logs/data-model/" target="_blank" rel="noreferrer">OpenTelemetry Logs Data Model</a> and <a href="https://csrc.nist.gov/pubs/sp/800/61/r3/final" target="_blank" rel="noreferrer">NIST SP 800-61 Rev. 3</a>.
      </p>
    </div>
  );
}
