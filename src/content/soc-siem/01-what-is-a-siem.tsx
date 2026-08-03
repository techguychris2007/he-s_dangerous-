import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WhatIsASiem() {
  return (
    <div className="prose-hh">
      <h1>What Is a SIEM? Log Collection, Normalization &amp; Centralization</h1>
      <p>
        A SIEM (Security Information and Event Management) platform is the single tool a SOC organizes its
        entire day around: it collects, normalizes, correlates, and stores security-relevant data from every
        system in an organization, so an analyst can search one place instead of logging into hundreds of
        individual devices. Everything else in this module — correlation rules, dashboards, UEBA, compliance
        reporting — is built on top of the three foundational capabilities this lesson covers.
      </p>

      <h2>Log collection: pulling data from everywhere</h2>
      <p>
        A SIEM ingests logs from firewalls, servers, workstations, network devices, applications, databases,
        cloud services, and endpoint/antivirus tooling — often millions of events a day in a mid-sized
        organization. None of this data is useful sitting on each device individually; the SIEM's job starts
        with getting it all into one place.
      </p>
      <CodeBlock label="a few of the sources a real SIEM ingests continuously">{`Firewalls           -> connection allow/deny decisions
Windows/Linux hosts  -> authentication, process execution, file access
Cloud platforms       -> API calls, IAM changes, storage access (CloudTrail-style logs)
EDR/antivirus          -> process behavior, malware detections
Applications            -> login attempts, transaction records, error logs`}</CodeBlock>

      <h2>Centralized log management: the value of one searchable place</h2>
      <p>
        Before a SIEM, investigating an incident meant SSHing into dozens of individual servers, or asking
        different teams for their own logs in whatever format they happened to keep them in. Centralizing that
        data into one platform is what makes correlation across sources even possible, and it is also the
        reason long-term log retention exists at all — most compliance frameworks require months or years of
        retained authentication history, which no individual device would ever store on its own.
      </p>
      <Callout variant="tip">
        <p>
          The practical benefits compound: faster investigation (one search instead of ten), faster
          troubleshooting, and a single retention policy to manage instead of one per device — this is why
          "get everything into the SIEM" is usually a security program's very first infrastructure investment.
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
        Beyond storing history, a SIEM continuously monitors events as they arrive — an account lockout, a
        malware detection, a firewall rule change — and surfaces them to analysts immediately rather than only
        being discoverable during a later manual search. This real-time layer is what a correlation rule (the
        subject of the next lesson) actually runs against.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Why this matters in practice:</strong> in the 2013 Target breach, the malware detection
          alerts existed and were technically real-time — the failure was in triage, not collection. Having
          the data centralized and normalized is necessary but not sufficient; an analyst still has to look at
          it. That triage gap is exactly what the next several lessons in this module build toward closing.
        </p>
      </Callout>

      <h2>The economics of a SIEM: why "ingest everything" isn't free</h2>
      <p>
        Every log source above sounds like an easy "yes, ingest it" decision until the bill arrives. Most SIEM
        vendors license by volume — typically priced per gigabyte ingested per day or by sustained{' '}
        <strong>events per second (EPS)</strong> — which means the "collect from everywhere" instinct this
        lesson opened with is a real, recurring cost decision, not just an engineering one.
      </p>
      <CodeBlock label="rough 2025-era SIEM cost reality">{`Typical per-GB ingestion pricing:  ~$1-$5 per 1,000 events, or roughly $2-4 per GB/day
At 5 TB/day ingested (a large enterprise):  $3.6M-$7.3M per year on ingestion alone

EPS licensing tiers commonly seen:
  Small        100-5,000 EPS
  Medium      5,000-50,000 EPS
  Large        50,000-200,000 EPS
  Enterprise   200,000+ EPS`}</CodeBlock>
      <p>
        This is precisely why real SIEM deployments tier storage instead of keeping everything on the fastest
        disk forever: a common pattern keeps the most recent data on expensive hot storage for immediate
        search, ages it down to cheaper warm storage after a few days, and finally to cold/archive storage —
        satisfying the retention requirements the previous lesson's compliance module cares about, at a
        fraction of hot-tier cost.
      </p>
      <CodeBlock label="a realistic hot/warm/cold tiering policy">{`HOT   (fast, expensive)   -> most recent ~48 hours, actively searched by analysts
WARM  (slower, cheaper)   -> next ~5 days, still searchable but not instant
COLD  (cheapest, archive) -> everything older, kept only to satisfy retention
                              requirements — rarely queried, must still be producible on request`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is also why mature SOCs don't actually ingest "everything" — they deliberately filter and route
          low-value, high-volume noise (verbose debug logging, routine health-check traffic) away from the
          SIEM entirely, while making sure anything relevant to authentication, privilege changes, or the
          organization's specific detection rules always lands in it. The goal is complete coverage of what
          matters, not maximum ingestion volume for its own sake.
        </p>
      </Callout>

      <p>
        With collection, centralization, and normalization established, the next lesson covers what a SIEM
        actually does with all this unified data: correlation — turning a flood of individually-harmless
        events into the small number of alerts that actually matter.
      </p>
    </div>
  );
}
