import type { SiemEntry } from '../siemTypes';

/** Season 1 world: Halcyon Freight, a fictional logistics company. Everything here is deterministic —
 *  the same seed always yields the same staff, hosts and ordinary working-day telemetry — so a case's
 *  answers never drift between learners, devices or rebuilds. All domains use the reserved `.example`
 *  TLD and all public addresses come from the documentation ranges (RFC 5737) or shared address space
 *  (RFC 6598), so no real organisation, person or network appears in any record. */

export const ORG = {
  name: 'Halcyon Freight',
  domain: 'halcyonfreight.example',
  hq: 'Accra',
} as const;

/** mulberry32 — tiny, fast, good enough for reproducible synthetic data. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Employee {
  name: string;
  username: string;
  email: string;
  department: Department;
  role: string;
  hostname: string;
  ip: string;
  /** The learner's home/remote address range — shared address space, never a real ISP. */
  homeIp: string;
  hireDate: string;
}

export type Department = 'Finance' | 'Logistics' | 'Engineering' | 'IT' | 'HR' | 'Sales' | 'Legal' | 'Executive' | 'Warehouse' | 'Support';

const DEPARTMENTS: { name: Department; code: string; size: number; roles: string[] }[] = [
  { name: 'Finance', code: 'FIN', size: 12, roles: ['Accounts Payable Specialist', 'Payroll Officer', 'Financial Analyst', 'Treasury Manager'] },
  { name: 'Logistics', code: 'LOG', size: 14, roles: ['Freight Coordinator', 'Customs Broker', 'Route Planner', 'Logistics Manager'] },
  { name: 'Engineering', code: 'ENG', size: 12, roles: ['Software Engineer', 'Site Reliability Engineer', 'Data Engineer', 'Engineering Manager'] },
  { name: 'IT', code: 'IT', size: 8, roles: ['Systems Administrator', 'Service Desk Analyst', 'Network Engineer', 'IT Manager'] },
  { name: 'HR', code: 'HR', size: 6, roles: ['HR Generalist', 'Recruiter', 'HR Manager'] },
  { name: 'Sales', code: 'SAL', size: 10, roles: ['Account Executive', 'Marketing Specialist', 'Sales Manager'] },
  { name: 'Legal', code: 'LEG', size: 4, roles: ['Corporate Counsel', 'Compliance Officer'] },
  { name: 'Executive', code: 'EXE', size: 4, roles: ['Chief Executive Officer', 'Chief Financial Officer', 'Chief Operating Officer', 'Chief Information Security Officer'] },
  { name: 'Warehouse', code: 'WHS', size: 14, roles: ['Warehouse Supervisor', 'Inventory Clerk', 'Dock Operator'] },
  { name: 'Support', code: 'SUP', size: 12, roles: ['Customer Support Agent', 'Support Team Lead'] },
];

const FIRST = ['Ama', 'Kwame', 'Efua', 'Kofi', 'Abena', 'Yaw', 'Akosua', 'Kojo', 'Adwoa', 'Kwesi', 'Esi', 'Nana', 'Daniel', 'Grace', 'Samuel', 'Priya', 'Lucas', 'Fatima', 'Oliver', 'Mei', 'Ibrahim', 'Sofia', 'Tunde', 'Hannah', 'Mateo', 'Zainab', 'Ethan', 'Aisha', 'Noah', 'Chloe', 'Kenji', 'Leila', 'David', 'Naomi', 'Emeka', 'Isabel', 'Joseph', 'Ruth', 'Felix', 'Selam'];
const LAST = ['Mensah', 'Owusu', 'Asante', 'Boateng', 'Osei', 'Addo', 'Darko', 'Appiah', 'Agyeman', 'Quaye', 'Tetteh', 'Nkrumah', 'Okafor', 'Adeyemi', 'Haddad', 'Kowalski', 'Nakamura', 'Fernandes', 'Larsen', 'Moreau', 'Silva', 'Chen', 'Patel', 'Reyes', 'Novak', 'Ibrahim', 'Laurent', 'Kim', 'Abebe', 'Murphy'];

function buildStaff(): Employee[] {
  const random = rng(20260901);
  const used = new Set<string>();
  const staff: Employee[] = [];
  let ipIndex = 10;
  for (const dept of DEPARTMENTS) {
    for (let i = 0; i < dept.size; i++) {
      let first = '', last = '';
      do {
        first = FIRST[Math.floor(random() * FIRST.length)];
        last = LAST[Math.floor(random() * LAST.length)];
      } while (used.has(first + last));
      used.add(first + last);
      const username = (first[0] + last).toLowerCase();
      const year = 2015 + Math.floor(random() * 11);
      const month = 1 + Math.floor(random() * 12);
      staff.push({
        name: `${first} ${last}`,
        username,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${ORG.domain}`,
        department: dept.name,
        // The last person in each department holds the senior role.
        role: i === dept.size - 1 ? dept.roles[dept.roles.length - 1] : dept.roles[i % Math.max(1, dept.roles.length - 1)],
        hostname: `HF-${dept.code}-${String(i + 1).padStart(3, '0')}`,
        ip: `10.40.${Math.floor(ipIndex / 250)}.${(ipIndex % 250) + 2}`,
        homeIp: `100.64.${Math.floor(random() * 250) + 1}.${Math.floor(random() * 250) + 2}`,
        hireDate: `${year}-${String(month).padStart(2, '0')}-${String(1 + Math.floor(random() * 27)).padStart(2, '0')}`,
      });
      ipIndex++;
    }
  }
  return staff;
}

/** The whole company, built once per page load (≈100 objects). */
export const STAFF: Employee[] = buildStaff();

export function staffIn(department: Department): Employee[] {
  return STAFF.filter((e) => e.department === department);
}

/** Ordinary sites Halcyon staff visit: SaaS, partners, news. Addresses from 192.0.2.0/24. */
export const BENIGN_SITES = [
  { domain: 'mail.collabsuite.example', ip: '192.0.2.10' },
  { domain: 'docs.collabsuite.example', ip: '192.0.2.11' },
  { domain: 'meet.collabsuite.example', ip: '192.0.2.12' },
  { domain: 'portal.harbourline.example', ip: '192.0.2.20' },
  { domain: 'tracking.cargonet.example', ip: '192.0.2.21' },
  { domain: 'customs.gov-trade.example', ip: '192.0.2.22' },
  { domain: 'bank.westridge.example', ip: '192.0.2.30' },
  { domain: 'news.dailywire.example', ip: '192.0.2.40' },
  { domain: 'weather.skycast.example', ip: '192.0.2.41' },
  { domain: 'cdn.staticnet.example', ip: '192.0.2.50' },
  { domain: 'updates.osvendor.example', ip: '192.0.2.60' },
  { domain: 'intranet.halcyonfreight.example', ip: '10.40.200.10' },
  { domain: 'erp.halcyonfreight.example', ip: '10.40.200.20' },
  { domain: 'files.halcyonfreight.example', ip: '10.40.200.30' },
];

/** Table → normalised metadata so the same records answer Kusto, SPL, AQL, Lucene and UDM queries. */
const TABLE_META: Record<string, { category: string; sourcetype: string; udm: string }> = {
  Employees: { category: 'iam', sourcetype: 'hr', udm: 'USER_RESOURCE_ACCESS' },
  EmailEvents: { category: 'email', sourcetype: 'email', udm: 'EMAIL_TRANSACTION' },
  SigninLogs: { category: 'authentication', sourcetype: 'auth', udm: 'USER_LOGIN' },
  VpnLogs: { category: 'authentication', sourcetype: 'vpn', udm: 'USER_LOGIN' },
  DnsEvents: { category: 'network', sourcetype: 'dns', udm: 'NETWORK_DNS' },
  ProxyEvents: { category: 'web', sourcetype: 'proxy', udm: 'NETWORK_HTTP' },
  WebServerLogs: { category: 'web', sourcetype: 'access_combined', udm: 'NETWORK_HTTP' },
  ProcessEvents: { category: 'process', sourcetype: 'sysmon', udm: 'PROCESS_LAUNCH' },
  FileEvents: { category: 'file', sourcetype: 'sysmon', udm: 'FILE_CREATION' },
  NetworkEvents: { category: 'network', sourcetype: 'firewall', udm: 'NETWORK_CONNECTION' },
  SecurityAlerts: { category: 'intrusion_detection', sourcetype: 'alert', udm: 'SCAN_UNCATEGORIZED' },
  CloudAuditEvents: { category: 'configuration', sourcetype: 'cloudaudit', udm: 'USER_RESOURCE_UPDATE_CONTENT' },
  ThreatIntel: { category: 'threat', sourcetype: 'intel', udm: 'GENERIC_EVENT' },
  ResponseActions: { category: 'configuration', sourcetype: 'soar', udm: 'GENERIC_EVENT' },
  Assets: { category: 'host', sourcetype: 'cmdb', udm: 'GENERIC_EVENT' },
};

export type Fields = Record<string, string | number | boolean | null>;

export class Telemetry {
  readonly records: SiemEntry[] = [];

  add(table: string, timestamp: string, fields: Fields): void {
    const meta = TABLE_META[table] ?? { category: 'other', sourcetype: table.toLowerCase(), udm: 'GENERIC_EVENT' };
    const row: Fields = { timestamp, TimeGenerated: timestamp, Table: table, index: 'main', sourcetype: meta.sourcetype, 'event.category': meta.category, 'metadata.event_type': meta.udm, ...fields };
    this.records.push({ timestamp, eventType: table, fields: row, line: JSON.stringify(row) });
  }
}

const WORK_SUBJECTS = ['Weekly shipment schedule', 'Re: Container delay at Tema', 'Timesheet reminder', 'Updated route plan', 'Customer feedback summary', 'Team standup notes', 'Q3 budget review', 'Invoice approved', 'Warehouse rota', 'Training: safe lifting refresher'];
const EXTERNAL_SENDERS = ['newsletter@dailywire.example', 'billing@harbourline.example', 'noreply@cargonet.example', 'events@logisticsweek.example', 'support@collabsuite.example'];
const OFFICE_PROCESSES = [
  { name: 'outlook.exe', parent: 'explorer.exe', cmd: '"C:\\Program Files\\Office\\outlook.exe"' },
  { name: 'excel.exe', parent: 'explorer.exe', cmd: '"C:\\Program Files\\Office\\excel.exe" /e' },
  { name: 'winword.exe', parent: 'explorer.exe', cmd: '"C:\\Program Files\\Office\\winword.exe"' },
  { name: 'msedge.exe', parent: 'explorer.exe', cmd: '"C:\\Program Files\\Edge\\msedge.exe" --profile-directory=Default' },
  { name: 'teams.exe', parent: 'explorer.exe', cmd: '"C:\\Users\\Public\\Teams\\teams.exe" --system-initiated' },
  { name: 'svchost.exe', parent: 'services.exe', cmd: 'C:\\Windows\\System32\\svchost.exe -k netsvcs' },
];
const BENIGN_ALERTS = ['Unusual sign-in time', 'Multiple failed sign-ins', 'Potentially unwanted application', 'Outdated browser version', 'Large file upload to sanctioned cloud'];

const pad = (n: number) => String(n).padStart(2, '0');

/** One ordinary working day per `days`, starting at `startDate` (YYYY-MM-DD, UTC). Volume is tuned so a
 *  case holds a few thousand records: enough that guessing fails and filtering is the only way in. */
export function workingDays(t: Telemetry, seed: number, startDate: string, days = 2): void {
  const random = rng(seed);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const base = Date.parse(startDate + 'T00:00:00Z');
  const stamp = (day: number, minute: number) => new Date(base + day * 86_400_000 + minute * 60_000 + Math.floor(random() * 59) * 1000).toISOString().replace('.000Z', 'Z');

  for (const e of STAFF) {
    t.add('Employees', `${startDate}T00:00:00Z`, { name: e.name, username: e.username, email_addr: e.email, department: e.department, role: e.role, hostname: e.hostname, ip_addr: e.ip, hire_date: e.hireDate });
  }

  for (let day = 0; day < days; day++) {
    for (const e of STAFF) {
      // Working hours 07:30–18:00 with a few people starting early or staying late.
      const start = 450 + Math.floor(random() * 90);
      const signinTime = stamp(day, start);
      const remote = random() < 0.2;
      if (random() < 0.06) t.add('SigninLogs', stamp(day, start - 2), { UserPrincipalName: e.email, IPAddress: remote ? e.homeIp : e.ip, ResultType: 50126, ResultDescription: 'Invalid username or password', AppName: 'Halcyon Portal', DeviceName: e.hostname, Location: 'GH', MfaResult: 'NotAttempted', SessionId: '' });
      t.add('SigninLogs', signinTime, { UserPrincipalName: e.email, IPAddress: remote ? e.homeIp : e.ip, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: e.hostname, Location: 'GH', MfaResult: remote ? 'Approved' : 'NotRequired', SessionId: `S-${seed % 997}-${day}-${e.username}` });
      if (remote) t.add('VpnLogs', stamp(day, start - 1), { UserPrincipalName: e.email, SourceIP: e.homeIp, AssignedIP: e.ip, Gateway: 'vpn-acc-01', Result: 'Connected', MfaUsed: true });

      const mails = 3 + Math.floor(random() * 5);
      for (let m = 0; m < mails; m++) {
        const internal = random() < 0.65;
        const sender = internal ? pick(STAFF).email : pick(EXTERNAL_SENDERS);
        t.add('EmailEvents', stamp(day, start + 20 + Math.floor(random() * 520)), { MessageId: `M-${seed}-${day}-${e.username}-${m}`, SenderAddress: sender, RecipientAddress: e.email, Subject: internal ? pick(WORK_SUBJECTS) : 'Your weekly digest', Url: internal ? 'https://intranet.halcyonfreight.example/news' : `https://${pick(BENIGN_SITES).domain}/digest`, AttachmentName: random() < 0.15 ? 'rota.xlsx' : '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
      }

      const visits = 4 + Math.floor(random() * 6);
      for (let v = 0; v < visits; v++) {
        const site = pick(BENIGN_SITES);
        const minute = start + 10 + Math.floor(random() * 560);
        t.add('DnsEvents', stamp(day, minute), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: site.domain, QueryType: 'A', Answer: site.ip });
        t.add('ProxyEvents', stamp(day, minute), { DeviceName: e.hostname, UserPrincipalName: e.email, Url: `https://${site.domain}/`, Domain: site.domain, DestinationIP: site.ip, Method: 'GET', StatusCode: random() < 0.04 ? 404 : 200, BytesSent: 600 + Math.floor(random() * 2000), BytesReceived: 4000 + Math.floor(random() * 90000), UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0' });
      }

      const procs = 2 + Math.floor(random() * 3);
      for (let p = 0; p < procs; p++) {
        const proc = pick(OFFICE_PROCESSES);
        t.add('ProcessEvents', stamp(day, start + 5 + Math.floor(random() * 500)), { DeviceName: e.hostname, AccountName: e.username, ProcessName: proc.name, ParentProcessName: proc.parent, CommandLine: proc.cmd, SHA256: `benign-${proc.name.replace('.exe', '')}-2026` });
      }
      if (random() < 0.4) t.add('FileEvents', stamp(day, start + 60 + Math.floor(random() * 400)), { DeviceName: e.hostname, AccountName: e.username, ActionType: 'FileCreated', FileName: pick(['manifest.xlsx', 'notes.docx', 'route.pdf', 'invoice.pdf']), FolderPath: `C:\\Users\\${e.username}\\Documents`, SizeBytes: 20_000 + Math.floor(random() * 400_000), SHA256: 'benign-document' });
      if (random() < 0.3) t.add('NetworkEvents', stamp(day, start + 30 + Math.floor(random() * 500)), { DeviceName: e.hostname, InitiatingProcessFileName: 'msedge.exe', RemoteIP: pick(BENIGN_SITES).ip, RemotePort: 443, ActionType: 'ConnectionSuccess', BytesSent: 1000 + Math.floor(random() * 50000) });
    }
    // The public tracking site gets steady, legitimate customer traffic.
    for (let w = 0; w < 160; w++) {
      t.add('WebServerLogs', stamp(day, Math.floor(random() * 1440)), { Site: 'track.halcyonfreight.example', ClientIP: `100.64.${Math.floor(random() * 250) + 1}.${Math.floor(random() * 250) + 2}`, Method: 'GET', Url: `/track?shipment=HF${100000 + Math.floor(random() * 899999)}`, StatusCode: random() < 0.03 ? 404 : 200, UserAgent: pick(['Mozilla/5.0 (Windows NT 10.0)', 'Mozilla/5.0 (Macintosh)', 'Mozilla/5.0 (Linux; Android 14)']), BytesSent: 2000 + Math.floor(random() * 6000) });
    }
    // A SOC sees benign alerts every day; most are reviewed and dismissed.
    for (let a = 0; a < 8; a++) {
      const e = pick(STAFF);
      t.add('SecurityAlerts', stamp(day, 420 + Math.floor(random() * 600)), { AlertName: pick(BENIGN_ALERTS), Severity: pick(['Low', 'Low', 'Informational', 'Medium']), DeviceName: e.hostname, Entity: e.email, Status: 'Dismissed', Product: 'Halcyon EDR' });
    }
  }
}

export const at = (date: string, time: string) => `${date}T${time.length === 5 ? time + ':00' : time}Z`;
export { pad };
