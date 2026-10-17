import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconBook } from '../components/layout/icons';
import './resources.css';

interface ResourceGroup {
  title: string;
  items: { name: string; note: string }[];
}

const BOOKS: ResourceGroup[] = [
  {
    title: 'Beginner',
    items: [
      { name: "The Web Application Hacker's Handbook", note: 'Dafydd Stuttard & Marcus Pinto' },
      { name: 'Hacking: The Art of Exploitation', note: 'Jon Erickson' },
      { name: 'Black Hat Python', note: 'Justin Seitz' },
    ],
  },
  {
    title: 'Intermediate',
    items: [
      { name: 'Real-World Bug Hunting', note: 'Peter Yaworski' },
      { name: 'Bug Bounty Bootcamp', note: 'Vickie Li' },
      { name: 'Web Security for Developers', note: 'Malcolm McDonald' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { name: 'The Tangled Web', note: 'Michal Zalewski' },
      { name: 'Practical Binary Analysis', note: 'Dennis Andriesse' },
      { name: 'The Art of Software Security Assessment', note: 'Mark Dowd et al.' },
    ],
  },
];

const SITES: ResourceGroup[] = [
  {
    title: 'Learning',
    items: [
      { name: 'PortSwigger Web Security Academy', note: 'Free, hands-on web security training' },
      { name: 'OWASP', note: 'Top 10, testing guides, cheat sheets' },
      { name: 'Hack The Box Academy', note: 'Guided offensive security modules' },
      { name: 'TryHackMe', note: 'Guided rooms across every discipline' },
      { name: 'OverTheWire', note: 'Wargames for Linux/binary fundamentals' },
      { name: 'PentesterLab', note: 'Exercise-driven web/exploit training' },
    ],
  },
  {
    title: 'Bug Bounty Platforms',
    items: [
      { name: 'HackerOne', note: 'Largest public/private program marketplace' },
      { name: 'Bugcrowd', note: 'Crowdsourced programs + managed triage' },
      { name: 'Intigriti', note: 'EU-based platform, strong web/mobile scope' },
      { name: 'YesWeHack', note: 'EU-based platform, growing enterprise base' },
    ],
  },
  {
    title: 'Research',
    items: [
      { name: 'Google Project Zero Blog', note: 'Deep vulnerability research write-ups' },
      { name: 'PortSwigger Research', note: 'Web security research from the Burp Suite team' },
      { name: 'Microsoft Security Research', note: 'MSRC blog and threat intelligence' },
      { name: 'Trail of Bits Blog', note: 'Applied security engineering research' },
    ],
  },
  {
    title: 'News',
    items: [
      { name: 'The Hacker News', note: 'Daily breach/vuln coverage' },
      { name: 'BleepingComputer', note: 'Malware, ransomware, breach reporting' },
      { name: 'Dark Reading', note: 'Enterprise security news & analysis' },
      { name: 'Krebs on Security', note: 'Investigative security journalism' },
      { name: 'SecurityWeek', note: 'Industry news and vendor coverage' },
      { name: 'SANS Internet Storm Center', note: 'Daily handler diaries on live threats' },
    ],
  },
  {
    title: 'CVEs & Threat Intelligence',
    items: [
      { name: 'MITRE CVE Database', note: 'The canonical CVE record' },
      { name: 'NIST National Vulnerability Database (NVD)', note: 'CVSS scoring & enrichment' },
      { name: 'Exploit Database', note: 'Public PoC exploit archive' },
      { name: 'CISA Known Exploited Vulnerabilities Catalog', note: 'Confirmed in-the-wild exploitation' },
      { name: 'MITRE ATT&CK Framework', note: 'Standardized adversary technique taxonomy' },
    ],
  },
];

const TOOLS: ResourceGroup[] = [
  {
    title: 'Reconnaissance',
    items: [
      { name: 'Amass, Subfinder, Assetfinder, Findomain', note: 'Subdomain enumeration' },
      { name: 'theHarvester', note: 'Emails, hosts, public info' },
      { name: 'Shodan, Censys', note: 'Internet-wide device/asset search' },
      { name: 'SpiderFoot, Recon-ng', note: 'Automated/modular recon frameworks' },
    ],
  },
  {
    title: 'Web Application Testing',
    items: [
      { name: 'Burp Suite, OWASP ZAP', note: 'Intercepting proxies' },
      { name: 'Nuclei', note: 'Template-based vulnerability scanning' },
      { name: 'ffuf, dirsearch, Gobuster', note: 'Fuzzing & directory brute-forcing' },
      { name: 'httpx, Katana', note: 'Web probing & crawling' },
      { name: 'Dalfox, SQLMap', note: 'XSS scanning, SQL injection testing' },
    ],
  },
  {
    title: 'Network Analysis',
    items: [
      { name: 'Nmap, Masscan, RustScan', note: 'Port scanning at every speed tier' },
      { name: 'Wireshark, tcpdump', note: 'Packet capture & analysis' },
    ],
  },
  {
    title: 'API Testing',
    items: [
      { name: 'Postman, Insomnia', note: 'Manual API exploration' },
      { name: 'Kiterunner', note: 'Undocumented API route brute-forcing' },
      { name: 'JWT Tool', note: 'JWT decoding & attack automation' },
    ],
  },
  {
    title: 'Mobile Security',
    items: [
      { name: 'MobSF', note: 'Automated mobile static/dynamic analysis' },
      { name: 'Frida, Objection', note: 'Runtime instrumentation' },
      { name: 'JADX, APKTool', note: 'APK decompilation & resource decoding' },
    ],
  },
  {
    title: 'Cloud Security',
    items: [
      { name: 'Prowler (AWS)', note: 'AWS security best-practice auditing' },
      { name: 'ScoutSuite, CloudSploit', note: 'Multi-cloud config auditing' },
      { name: 'Pacu', note: 'AWS exploitation framework (authorized use only)' },
      { name: 'kube-hunter, kube-bench', note: 'Kubernetes-specific misconfiguration probing & CIS benchmark audit' },
    ],
  },
  {
    title: 'Active Directory & Internal',
    items: [
      { name: 'BloodHound', note: 'AD attack-path graphing' },
      { name: 'PingCastle', note: 'AD security posture scoring' },
      { name: 'CrackMapExec / NetExec', note: 'Post-exploitation swiss-army knife' },
      { name: 'Rubeus', note: 'Kerberos ticket abuse (Kerberoasting, AS-REP roasting, ticket manipulation)' },
      { name: 'Impacket', note: 'GetUserSPNs.py, secretsdump.py, and the rest of the Python AD attack suite' },
    ],
  },
  {
    title: 'SIEM & Detection Engineering',
    items: [
      { name: 'SigmaHQ / sigma-cli', note: 'Vendor-neutral detection rules, compiled to any SIEM backend' },
      { name: 'Cribl Stream, Logstash, Fluentd', note: 'Log routing/shaping between raw sources and a SIEM' },
    ],
  },
  {
    title: 'OSINT',
    items: [
      { name: 'Maltego', note: 'Link-analysis OSINT graphing' },
      { name: 'GHunt, Holehe', note: 'Google account & email-registration OSINT' },
      { name: 'PhoneInfoga', note: 'Phone number OSINT' },
      { name: 'Sherlock', note: 'Username enumeration across platforms' },
    ],
  },
  {
    title: 'Password Auditing (Authorized Only)',
    items: [
      { name: 'Hashcat, John the Ripper', note: 'Offline hash cracking' },
      { name: 'CeWL', note: 'Target-derived custom wordlist generation' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { name: 'Python, Go, Bash, PowerShell', note: 'Tooling & scripting languages' },
      { name: 'jq', note: 'JSON parsing in shell pipelines' },
    ],
  },
];

const COLLECTIONS = [
  { id: 'books', label: 'Reading list', title: 'The reading room', description: 'Books to deepen your understanding alongside the lessons. Choose a subject that supports your current practice.', groups: BOOKS },
  { id: 'sites', label: 'Sites & communities', title: 'Beyond the classroom', description: 'Learning platforms, research, and reference sources to explore alongside your work.', groups: SITES },
  { id: 'tools', label: 'Tool directory', title: 'Know your toolkit', description: 'Find the tools mentioned in the curriculum and understand the purpose each one serves.', groups: TOOLS },
] as const;

export default function ResourcesPage() {
  const [collection, setCollection] = useState<string>('books');
  const [search, setSearch] = useState('');
  const active = COLLECTIONS.find(item => item.id === collection) ?? COLLECTIONS[0];
  const query = search.trim().toLowerCase();
  const groups = active.groups.map(group => ({ ...group, items: group.items.filter(item => (item.name + ' ' + item.note + ' ' + group.title).toLowerCase().includes(query)) })).filter(group => group.items.length);
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);
  return <div className="resource-page mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-12">
    <header className="resource-masthead">
      <div><p className="resource-eyebrow">DarkWorld / Field notes</p><h1>Security resources</h1><p className="resource-introduction">Good practice starts with good sources. Explore the books, communities, and tools referenced across your learning journey.</p></div>
      <aside><IconBook className="h-6 w-6" /><h2>Keep a book beside your lab.</h2><p>Use these references to explore a question in more depth, then return to your lesson and put it into practice.</p><Link to="/library">Open the platform library<IconArrowRight className="h-4 w-4" /></Link><small>Availability and access vary by title.</small></aside>
    </header>
    <div className="resource-controls"><nav aria-label="Resource collections">{COLLECTIONS.map(item => <button key={item.id} onClick={() => { setCollection(item.id); setSearch(''); }} aria-pressed={collection === item.id}>{item.label}<span>{item.groups.reduce((sum, group) => sum + group.items.length, 0)}</span></button>)}</nav><input type="search" aria-label="Search resources" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles, authors, or topics…" /></div>
    <div className="resource-section-heading"><div><h2>{active.title}</h2><p>{active.description}</p></div><span>{count} {count === 1 ? 'reference' : 'references'}</span></div>
    {groups.map((group, index) => <section key={group.title} className="resource-group" aria-labelledby={'resource-group-' + index}><div className="resource-group-heading"><span>{String(index + 1).padStart(2, '0')}</span><h3 id={'resource-group-' + index}>{group.title}</h3></div><div className={collection === 'books' ? 'resource-book-grid' : 'resource-directory'}>{group.items.map((item, itemIndex) => <article key={item.name} className="resource-item">{collection === 'books' && <div className="resource-book-mark" aria-hidden="true"><span>DW</span><i>{String(itemIndex + 1).padStart(2, '0')}</i></div>}<div><h4>{item.name}</h4><p>{item.note}</p></div></article>)}</div></section>)}
    {count === 0 && <div className="resource-empty"><h3>No references found</h3><p>Try a broader subject or a different title.</p><button onClick={() => setSearch('')}>Clear search</button></div>}
    <footer className="resource-footer">Reference titles are listed by name. Search the exact title or tool name to find its publisher or official documentation.</footer>
  </div>;
}
