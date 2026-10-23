import type { SiemTool } from './siemTypes';

export const QUERY_LANGUAGES: Partial<Record<SiemTool, { name: string; sample: string; help: string }>> = {
  sentinel: { name: 'Kusto KQL · Sentinel', sample: 'EmailEvents\n| take 10', help: 'Table | where condition | project fields | summarize count() by field | sort by field desc. Tabular let statements, in, between, has_any and the listed operators are supported offline.' },
  splunk: { name: 'SPL · Splunk', sample: 'index=main sourcetype=email\n| head 10', help: 'index=main sourcetype=email | search field=value | stats count by field | table fields. SPL and Kusto use different commands; use stats, table and head in this mode.' },
  qradar: { name: 'AQL · QRadar', sample: "SELECT * FROM events WHERE Table = 'EmailEvents' LIMIT 10", help: 'SELECT fields FROM events WHERE condition GROUP BY field ORDER BY field DESC LIMIT n. This offline AQL subset does not implement vendor functions.' },
  elastic: { name: 'Kibana KQL · Elastic', sample: 'event.category: email', help: 'field: value AND other: value. Kibana KQL filters events; it is not Kusto KQL and does not support summarize or SPL stats pipelines.' },
  chronicle: { name: 'UDM search · Google SecOps', sample: 'metadata.event_type = "EMAIL_TRANSACTION"', help: 'Use UDM field paths, comparisons and boolean filters. This is an event-search subset, not YARA-L detection-rule execution.' },
  suricata: { name: 'EVE event filter', sample: 'event_type = "dns"', help: 'Filter EVE JSON fields. These filters are not Suricata detection rules.' },
  tcpdump: { name: 'BPF · Packet filters', sample: 'udp and dst port 53', help: 'tcp/udp/icmp, [src|dst] host ADDRESS, [src|dst] port NUMBER and boolean groups. Numeric IPv4 addresses only in the offline capture.' },
};
