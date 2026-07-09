import { Link } from 'react-router-dom';
import { MODULES } from '../data/curriculum';
import { LABS } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { IconChart, IconFlask, IconCheck } from '../components/layout/icons';
import ModuleBanner from '../components/layout/ModuleBanner';

export default function HomePage() {
  const progress = useProgress();

  const totalLessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
  const completedLessons = MODULES.reduce(
    (n, m) => n + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length,
    0,
  );
  const totalFlags = LABS.reduce((n, l) => n + l.scenario.totalFlags, 0);
  const capturedFlags = LABS.reduce((n, l) => n + progress.flagCount(l.scenario.id), 0);
  const labsDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-8">
        <div className="text-[var(--color-accent)] font-mono text-xs font-bold uppercase tracking-widest mb-2">
          Learner Portal
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-heading)] mb-2">
          Welcome back{progress.learnerName ? `, ${progress.learnerName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[var(--color-text-dim)] max-w-2xl leading-relaxed">
          A full offensive-security curriculum: networking, Linux, reconnaissance, Python tooling, web app
          hacking, red teaming/Active Directory, cloud security, SOC &amp; threat hunting, digital
          forensics, and bug bounty methodology — every lesson paired with a real interactive lab.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={<IconChart className="w-5 h-5" />} color="var(--color-accent-2)" label="Lessons completed" value={`${completedLessons} / ${totalLessons}`} />
        <StatCard icon={<IconFlask className="w-5 h-5" />} color="var(--color-accent)" label="Labs solved" value={`${labsDone} / ${LABS.length}`} />
        <StatCard icon={<IconCheck className="w-5 h-5" />} color="var(--color-success)" label="Flags captured" value={`${capturedFlags} / ${totalFlags}`} />
      </div>

      <h2 className="text-base font-bold text-[var(--color-heading)] mb-4">Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {MODULES.map((mod) => {
          const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
          const labCount = mod.lessons.length;
          return (
            <Link
              key={mod.id}
              to={mod.lessons.length ? `/module/${mod.slug}/lesson/${mod.lessons[0].slug}` : '/roadmap'}
              className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-md transition-all flex flex-col"
            >
              <ModuleBanner icon={mod.icon} moduleId={mod.id} className="h-28 w-full" />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">Cybersecurity</span>
                  <span className="pill bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]">{mod.lessons.length} lessons</span>
                </div>
                <div className="font-bold text-[var(--color-heading)] mb-1">{mod.title}</div>
                <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-3 flex-1">{mod.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full"
                      style={{ width: `${labCount ? (100 * done) / labCount : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-dim)] shrink-0">{done}/{labCount}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-navy)] p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-white mb-1">Full curriculum roadmap</h2>
          <p className="text-sm text-white/70">
            All {MODULES.length} core modules and {LABS.length} labs are live. Security+, binary analysis, and
            malware analysis are next.
          </p>
        </div>
        <Link to="/roadmap" className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition shrink-0">
          View roadmap &rarr;
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-4">
      <span className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
        {icon}
      </span>
      <div>
        <div className="text-xl font-extrabold text-[var(--color-heading)]">{value}</div>
        <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
