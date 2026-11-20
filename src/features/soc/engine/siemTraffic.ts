import type { SiemEntry, SiemLabScenario } from './siemTypes';
import { parseEventTimestamp } from './siemExecution';

const expanded = new WeakMap<SiemLabScenario, SiemLabScenario>();
/** Original, deterministic teaching telemetry. Never presented as a breach victim's actual logs. */
export function withBackgroundTraffic(scenario: SiemLabScenario): SiemLabScenario {
  const previous = expanded.get(scenario); if (previous) return previous;
  const timestamps = scenario.entries.map(entry => parseEventTimestamp(entry.timestamp ?? '')).filter(Number.isFinite);
  const end = timestamps.length ? Math.max(...timestamps) : Date.UTC(2025, 4, 12, 16);
  let seed = [...scenario.id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  const entries: SiemEntry[] = [];
  const kinds = ['AUTH_SUCCESS', 'DNS_QUERY', 'HTTP_ACCESS', 'PROCESS_START', 'DNS_QUERY', 'SIGNIN', 'AUDIT_CHANGE', 'OFFICE_ACCESS', 'HTTP_ACCESS', 'NETWORK_FLOW', 'AUTH_SUCCESS', 'DNS_QUERY'];
  const networkOnly = scenario.tool === 'suricata' || scenario.tool === 'tcpdump';
  for (let index = 0; index < 1024; index++) {
    const asset = (random() >>> 8) % 72, host = 'WS-' + String(10 + asset).padStart(3, '0');
    const user = ['a.mensah', 'j.owusu', 's.patel', 'm.chen', 'e.wilson', 'k.ahmed', 'l.garcia', 't.asante', 'helpdesk.svc', 'backup.svc', 'reports.svc', 'patching.svc'][asset % 12];
    const failure = !networkOnly && index % 43 === 0;
    const kind = failure ? 'AUTH_FAILURE' : networkOnly ? ['DNS_QUERY', 'HTTP_ACCESS', 'NETWORK_FLOW'][index % 3] : kinds[index % kinds.length];
    const timestamp = new Date(end - 86400000 + ((random() >>> 2) % 86300000)).toISOString();
    const source = '10.24.' + Math.floor(asset / 24) + '.' + (20 + asset), destination = kind === 'DNS_QUERY' ? '10.24.0.53' : '192.0.2.' + (10 + asset % 18);
    const fields: NonNullable<SiemEntry['fields']> = { user, Account: user, host, Computer: host, src_ip: source, IPAddress: source, dest_ip: destination, index: 'main', sourcetype: /AUTH|SIGNIN/.test(kind) ? 'auth' : /DNS|HTTP|FLOW/.test(kind) ? 'network' : 'endpoint', Table: /SIGNIN/.test(kind) ? 'SigninLogs' : /OFFICE/.test(kind) ? 'OfficeActivity' : /AUDIT/.test(kind) ? 'AuditLogs' : /PROCESS/.test(kind) ? 'DeviceEvents' : 'SecurityEvent', category: /AUTH|SIGNIN/.test(kind) ? 'Authentication' : /PROCESS/.test(kind) ? 'Process' : 'Network', 'event.category': /AUTH|SIGNIN/.test(kind) ? 'authentication' : /PROCESS/.test(kind) ? 'process' : 'network', 'event.outcome': failure ? 'failure' : 'success' };
    if (/AUTH/.test(kind)) Object.assign(fields, { EventID: failure ? 4625 : 4624, EventCode: failure ? 4625 : 4624, Provider: 'Microsoft-Windows-Security-Auditing', action: failure ? 'failure' : 'success', LogonType: 3, reason: failure ? 'expired_service_password' : 'network_logon' });
    if (kind === 'SIGNIN') Object.assign(fields, { source: 'SigninLogs', ResultType: 0, OperationName: 'Sign-in activity', action: 'success', client_app: 'Browser' });
    if (kind === 'DNS_QUERY') Object.assign(fields, { query: ['updates.software.example', 'mail.academy.example', 'intranet.corp.example'][asset % 3], src_port: 51000 + asset, dest_port: 53, proto: 'UDP' });
    if (kind === 'HTTP_ACCESS') Object.assign(fields, { method: 'GET', url: ['/health', '/assets/app.js', '/api/profile'][asset % 3], status: index % 71 === 0 ? 404 : 200, bytes: 500 + (random() >>> 8) % 4500, src_port: 52000 + asset, dest_port: 80, proto: 'TCP' });
    if (kind === 'NETWORK_FLOW') Object.assign(fields, { src_port: 53000 + asset, dest_port: 443, proto: 'TCP', bytes: 200 + (random() >>> 8) % 20000, action: 'allowed' });
    if (kind === 'PROCESS_START') Object.assign(fields, { Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', ParentImage: 'C:\\Program Files\\CorpUpdater\\updater.exe', CommandLine: 'powershell.exe -File C:\\CorpScripts\\CheckUpdates.ps1', signature: 'trusted-corporate-publisher', change_ticket: 'CHG-240', EventID: 1, ProcessGuid: 'MAINT-' + asset + '-' + index });
    if (kind === 'AUDIT_CHANGE') Object.assign(fields, { OperationName: 'Update device compliance', approver: 'endpoint-management', change_ticket: 'CHG-240' });
    if (kind === 'OFFICE_ACCESS') Object.assign(fields, { Operation: 'FileAccessed', client_app: 'approved-backup', ticket: 'CHG-19' });
    if (networkOnly) {
      // A capture does not reveal the OS account or hostname behind an encrypted flow.
      for (const key of ['user', 'Account', 'host', 'Computer']) delete fields[key];
      fields.Table = 'NetworkEvents';
    }
    if (scenario.tool === 'chronicle') Object.assign(fields, {
      'metadata.event_type': /AUTH|SIGNIN/.test(kind) ? 'USER_LOGIN' : kind === 'DNS_QUERY' ? 'NETWORK_DNS' : kind === 'HTTP_ACCESS' ? 'NETWORK_HTTP' : kind === 'NETWORK_FLOW' ? 'NETWORK_CONNECTION' : kind === 'PROCESS_START' ? 'PROCESS_LAUNCH' : 'GENERIC_EVENT',
      'principal.ip': source, 'principal.hostname': host, 'principal.user.userid': user, 'target.ip': destination,
    });
    let line = Object.entries(fields).filter(([key]) => !['Table', 'Account', 'Computer', 'IPAddress', 'EventCode'].includes(key)).map(([key, value]) => key + '=' + (String(value).includes(' ') ? JSON.stringify(value) : value)).join(' ');
    if (scenario.tool === 'tcpdump') line = 'IP ' + source + '.' + fields.src_port + ' > ' + destination + '.' + fields.dest_port + ': ' + (kind === 'DNS_QUERY' ? 'A? ' + fields.query + '. (42)' : 'Flags [P.], seq 100:250, ack 1, win 64240, length 150');
    if (scenario.tool === 'suricata') line = JSON.stringify({ timestamp, event_type: kind === 'DNS_QUERY' ? 'dns' : kind === 'HTTP_ACCESS' ? 'http' : 'flow', src_ip: source, src_port: fields.src_port, dest_ip: destination, dest_port: fields.dest_port, proto: fields.proto, ...(kind === 'DNS_QUERY' ? { dns: { type: 'query', rrname: fields.query, rrtype: 'A' } } : kind === 'HTTP_ACCESS' ? { http: { hostname: 'updates.software.example', url: fields.url, status: fields.status } } : { flow: { pkts_toserver: 3, bytes_toserver: fields.bytes } }) });
    entries.push({ evidenceId: 'telemetry-' + index, background: true, timestamp, eventType: kind, severity: kind === 'PROCESS_START' || failure ? 'Medium' : 'Low', fields, line });
  }
  const result = { ...scenario, datasetLabel: 'Reconstructed training telemetry · ' + (entries.length + scenario.entries.length).toLocaleString() + ' records', entries: [...entries, ...scenario.entries].sort((a, b) => (parseEventTimestamp(a.timestamp ?? '') || 0) - (parseEventTimestamp(b.timestamp ?? '') || 0)) };
  expanded.set(scenario, result); return result;
}
