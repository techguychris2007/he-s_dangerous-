import { IconLock } from '../components/layout/icons';
import WorkspaceHeader from '../components/common/WorkspaceHeader';

const POINTS: { title: string; body: string }[] = [
  {
    title: 'Training targets run inside your browser',
    body: 'Terminals, target websites, directory maps, and SIEM consoles operate on simulated files and networks in your browser. Terminal commands do not attack external machines. If you ask the AI tutor for help, relevant lesson content, hints, and session excerpts can be sent to the tutor service to answer your question.',
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
    title: 'Services used by the platform',
    body: 'After the first online visit has installed the app shell, lessons, saved progress, and browser-based simulations can continue offline on that device. Account sign-in refresh and progress sync, AI tutoring, leaderboards, external references, and runtimes or books that have not been cached need an internet connection. Your saved progress syncs when connectivity returns. Supabase provides authentication and progress storage; exported certificates describe simulated training progress, and learner-authored reports contain only evidence you choose to share.',
  },
];

export default function SecurityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <WorkspaceHeader eyebrow="Trust & privacy" title={'Security & Privacy'} guide="ledger" description={<>The honest, complete answer to "what happens to my data here" — because a cybersecurity platform that can't answer this plainly has no business teaching the subject.</>} />

      <div className="flex flex-col gap-4 mb-8">
        {POINTS.map((p) => (
          <div key={p.title} className="premium-card rounded-2xl p-5">
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
