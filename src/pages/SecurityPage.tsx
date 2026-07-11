import { IconShieldCheck, IconLock } from '../components/layout/icons';

const POINTS: { title: string; body: string }[] = [
  {
    title: 'Nothing you type is sent anywhere',
    body: 'The terminal, labs, and lessons all run as client-side JavaScript. There is no backend API this app calls to execute a command, check a flag, or record a completion — every "network" you attack is a plain in-memory data structure.',
  },
  {
    title: 'No account, no password, no server-side identity',
    body: 'Your "login" is a display name stored in localStorage. There is nothing to breach because there is no credential store, no session token, and no server holding your data in the first place.',
  },
  {
    title: 'No analytics, no tracking scripts, no third-party requests',
    body: 'This build ships with zero third-party analytics or tracking pixels. Your click-path, time-on-lesson, and lab attempts are not observed by anyone, including the people who built this platform.',
  },
  {
    title: 'Your data lives and dies with your browser storage',
    body: 'Progress persists only in localStorage on the device and browser profile you used. Clearing site data, using a private/incognito window, or switching browsers starts you over — there is no cloud backup because there is no cloud component at all.',
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
