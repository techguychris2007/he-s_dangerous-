import { IconHelp } from '../components/layout/icons';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is this real hacking, or a simulation?',
    a: 'Every lab runs against a simulated network and filesystem built into your browser — there are no real remote hosts, and nothing you type here ever leaves your machine or touches another computer. The commands, tool behavior, and vulnerability mechanics are modeled as realistically as possible so the muscle memory and reasoning transfer directly to real tools like nmap, curl, hydra, and Metasploit-style exploitation.',
  },
  {
    q: 'Do I need Kali Linux or any real tools installed?',
    a: 'No. The in-browser terminal understands a real subset of Linux/security-tool syntax (nmap, curl, ssh, hydra, crackmapexec, secretsdump, hashcat, gdb, objdump, yara, and more) well enough to practice the workflow. Once you are comfortable here, install a real Kali VM or use Hack The Box / TryHackMe to apply the same commands against real infrastructure.',
  },
  {
    q: 'Where is my progress saved?',
    a: 'Your lesson, lab, and quiz progress is saved to your account — real Supabase Auth plus a database row that Row Level Security guarantees only you can read — so it follows you across devices as long as you\'re signed in. A few signals stay local to this specific browser instead: your streak, unlocked achievements, display name, and Code Portal learning-insight stats (hints used, attempts per solve). Clearing this browser\'s site data resets those specifically, without touching your synced progress.',
  },
  {
    q: 'What do the flags actually verify?',
    a: 'Each lab is a small scenario with one or more hidden flag{...} strings placed behind a realistic chain of commands — recon, exploitation, and often privilege escalation. Capturing a flag means the terminal engine matched the exact string in a file, command output, or captured session, confirming you actually executed the intended technique rather than guessing.',
  },
  {
    q: 'Why do some labs need 2+ flags?',
    a: 'The harder labs model a full attack chain rather than a single vulnerability: an initial-access flag (foothold) plus a second, harder-won flag for privilege escalation or lateral movement — mirroring how a real penetration test report separates "got a shell" from "got domain admin."',
  },
  {
    q: 'The labs mention real CVEs — are those real vulnerabilities?',
    a: 'Yes. Where a lab references a CVE number (e.g. the SharePoint ToolShell RCE or the Erlang/OTP SSH pre-auth RCE), the briefing, root cause, and impact described are accurate to the real, publicly disclosed vulnerability. The exploitation itself is modeled at the "you send the same category of request" level rather than reproducing exact working exploit code.',
  },
  {
    q: 'Can I reset my progress?',
    a: 'There\'s a per-module reset — the "Reset this module\'s progress" button on any module page clears just that module\'s completed lessons and quiz scores. There\'s currently no single button that wipes everything at once. Signing out does not clear anything: your synced lesson/lab/quiz progress stays in your account, and this browser\'s local-only signals (streak, achievements, name) aren\'t touched by signing out either.',
  },
  {
    q: 'Is there a certificate at the end?',
    a: 'Yes — once a lab\'s flags are all captured, its page offers a real downloadable PDF certificate with your name and the lab\'s details, plus a separate PDF write-up you can put in a portfolio. It\'s a genuine record of what you actually did, not a third-party-accredited credential.',
  },
];

export default function HelpFaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// support</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconHelp className="w-7 h-7 text-[var(--color-accent)]" /> Help &amp; FAQ
      </h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        Straight answers about how this portal actually works — no support ticket required.
      </p>

      <div className="flex flex-col gap-3">
        {FAQS.map((item) => (
          <details key={item.q} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 group">
            <summary className="font-semibold text-[var(--color-heading)] text-sm cursor-pointer list-none flex items-center justify-between gap-3">
              {item.q}
              <span className="text-[var(--color-text-dim)] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mt-3">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
