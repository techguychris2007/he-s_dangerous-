import { IconBook, IconExternal } from '../components/layout/icons';

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
    ],
  },
  {
    title: 'Active Directory & Internal',
    items: [
      { name: 'BloodHound', note: 'AD attack-path graphing' },
      { name: 'PingCastle', note: 'AD security posture scoring' },
      { name: 'CrackMapExec / NetExec', note: 'Post-exploitation swiss-army knife' },
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

function Group({ group }: { group: ResourceGroup }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent-dim)] mb-2">{group.title}</div>
      <div className="flex flex-col gap-1.5">
        {group.items.map((item) => (
          <div key={item.name} className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-[var(--color-border)] last:border-0">
            <span className="font-medium text-[var(--color-heading)]">{item.name}</span>
            <span className="text-[var(--color-text-dim)] text-xs text-right shrink-0 max-w-[55%]">{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ icon, title, groups }: { icon: React.ReactNode; title: string; groups: ResourceGroup[] }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide">{title}</h2>
      </div>
      {groups.map((g) => (
        <Group key={g.title} group={g} />
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// keep learning</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconBook className="w-7 h-7 text-[var(--color-accent)]" /> Resources
      </h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        Every book, site, and real tool referenced throughout this course, gathered in one place. Nothing
        here is affiliate-linked or sponsored — this is the same reading list a working practitioner would
        hand you. <span className="inline-flex items-center gap-1 text-[var(--color-text-dim)]"><IconExternal className="w-3.5 h-3.5" /> None of these are hyperlinked deliberately — search for the exact name, since URLs change.</span>
      </p>

      <Panel icon={<IconBook className="w-4 h-4 text-[var(--color-accent)]" />} title="Recommended Books" groups={BOOKS} />
      <Panel icon={<IconBook className="w-4 h-4 text-[var(--color-accent)]" />} title="Sites & Communities" groups={SITES} />
      <Panel icon={<IconBook className="w-4 h-4 text-[var(--color-accent)]" />} title="Real Tools Referenced In This Course" groups={TOOLS} />
    </div>
  );
}
