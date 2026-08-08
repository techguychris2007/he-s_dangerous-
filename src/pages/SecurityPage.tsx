import { IconShieldCheck, IconLock } from '../components/layout/icons';

const POINTS: { title: string; body: string }[] = [
  {
    title: 'Every command you type stays 100% client-side',
    body: 'The terminal, labs, and SIEM consoles all run as client-side JavaScript against an in-memory simulated filesystem/network. There is no backend that executes your commands, checks a flag, or scores a lab — every "network" you attack is a plain data structure in your own browser tab.',
  },
  {
    title: 'Real accounts, protected by Row Level Security',
    body: 'Signing in uses real Supabase Auth (email + password, or a guest session — see below) — a genuine credential store with hashed passwords and session tokens, not a display-name-only login. Your lesson/lab/quiz/streak/achievement progress is stored server-side so it follows you across devices, but Row Level Security means your account can only ever read or write its own row — not another learner\'s, not even an admin\'s, without an explicit, narrowly-scoped exception (see below).',
  },
  {
    title: '"Continue as guest" is a real account too, just without a password yet',
    body: 'Guest sign-in creates a genuine Supabase Auth user (Row Level Security applies to it identically), so your progress saves for the length of your session exactly like a full account\'s does. The only difference is there is no email/password to sign back in with — clearing this browser\'s site data loses that identity permanently. Add an email and password from your Profile page at any point to convert it into a normal account without losing anything already saved.',
  },
  {
    title: 'Two deliberately narrow exceptions to "only you can see your data"',
    body: 'An opt-in leaderboard (off by default) can show your name and score to other learners — nothing else, and never unless you turn it on yourself. Separately, one specific instructor account can view cohort-wide progress for teaching purposes, enforced by a server-side check on the caller\'s identity, not a setting the app\'s frontend controls.',
  },
  {
    title: 'No analytics, no tracking scripts, no third-party requests',
    body: 'This build ships with zero third-party analytics or tracking pixels. Your click-path and time-on-lesson are not observed by anyone — the only network calls this app makes are to Supabase, for the account/progress sync described above.',
  },
];

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// how your data is handled</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconShieldCheck className="w-7 h-7 text-[var(--color-accent)]" /> Security &amp; Privacy
      </h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        The honest, complete answer to "what happens to my data here" — because a cybersecurity platform
        that can't answer this plainly has no business teaching the subject.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <IconLock className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
              <h2 className="font-semibold text-[var(--color-heading)] text-sm">{p.title}</h2>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/5 p-5">
        <div className="text-xs font-bold tracking-wide mb-1.5 text-[var(--color-warn)]">RESPONSIBLE USE</div>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          Every technique, tool, and command taught in this course is for authorized security testing,
          defensive work, CTF practice, and your own lab environments only. Never run these techniques
          against systems you do not own or do not have explicit written authorization to test.
        </p>
      </div>
    </div>
  );
}
