import { IconMegaphone } from '../components/layout/icons';

interface Announcement {
  date: string;
  title: string;
  body: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    date: 'This update',
    title: 'SOC track finished, Module page redesigned, 3 new offensive labs (198 total)',
    body: 'The SOC curriculum (SOC Fundamentals, SIEM Platforms, Detection Engineering, Incident Response — 4 modules, 14 lessons total) now has every one of its 16 labs reachable from a lesson, including two new ones: "Detecting C2: Beaconing, DNS Tunneling & LOLBin Abuse" and "Landmark Incident Case Studies: Target & the Bangladesh Bank SWIFT Heist." The Module page got a design pass (banner, stat tiles, breadcrumb) to match the rest of the portal. New labs cover Zip Slip archive extraction, a GitHub Actions pull_request_target secret leak, and a GraphQL rate-limit bypass.',
  },
  {
    date: 'Earlier',
    title: 'Current-threats lab pack: 8 new labs modeled on real 2025-2026 incidents',
    body: 'New labs walk through CVE-2025-53770 ("ToolShell" SharePoint RCE), CVE-2025-3248 (Langflow unauth RCE), CVE-2025-32433 (Erlang/OTP SSH pre-auth RCE), CVE-2025-64446 (FortiWeb path traversal), the Shai-Hulud npm/PyPI supply-chain worm, a Salesloft Drift-style SaaS OAuth token theft chain, a Scattered Spider help-desk-to-DCSync chain, and an AI-orchestrated ransomware timing investigation. 142 labs total at the time.',
  },
  {
    date: 'Earlier',
    title: 'Every lesson enriched with real tools, real syntax, real incidents',
    body: 'All 58 lessons across all 14 modules now reference the actual tools practitioners use daily — Amass, Subfinder, Shodan, Nuclei, ffuf, BloodHound, Frida, Hashcat, and dozens more — plus new case-study callouts on Capital One, SolarWinds, Target, WannaCry, and other real breaches.',
  },
  {
    date: 'Earlier',
    title: 'Portal redesigned: dark mode, My Tasks, bookmarks, and a full resource library',
    body: 'The whole learner portal was restyled with a proper sidebar, dark/light theme toggle, a My Tasks view for tracking lab progress, lab bookmarking, and a Resources page collecting every book, tool, and site referenced in the course.',
  },
  {
    date: 'Earlier',
    title: 'Security+ Deep Dive, Binary Analysis, Malware Analysis, and Security Engineering modules shipped',
    body: 'The curriculum now runs the full arc from networking fundamentals through exploit development, malware analysis, and systems-level security engineering — 14 modules in total, with zero "coming soon" placeholders left on the roadmap.',
  },
  {
    date: 'Earlier',
    title: 'Every lab pushed to a genuine multi-stage chain',
    body: 'The network services, web vulnerabilities, bug bounty recon, cloud security, digital forensics, SOC threat-hunting, Active Directory, and Linux privilege-escalation packs were rebuilt so no lab resolves on a single command — every one now models a real recon-to-impact chain.',
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// changelog</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconMegaphone className="w-7 h-7 text-[var(--color-accent)]" /> Announcements
      </h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        What actually changed on the platform, most recent first.
      </p>

      <div className="flex flex-col gap-4">
        {ANNOUNCEMENTS.map((a, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent-dim)] mb-1.5">{a.date}</div>
            <h2 className="font-semibold text-[var(--color-heading)] text-sm mb-1.5">{a.title}</h2>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
