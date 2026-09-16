import { useState, useMemo } from 'react';
import { LABS, findLab } from '../data/labs';
import { MODULES } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../state/authStore';
import { ACHIEVEMENTS, computeStreak } from '../data/achievements';
import { IconUser, IconFlag, IconCheck, IconBookmark, IconCode, IconLock } from '../components/layout/icons';
import StatCard from '../components/common/StatCard';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

/** Shown only to a guest (`auth.isGuest`) — lets them attach an email + password to their existing
 *  anonymous account via upgradeGuestAccount(), which keeps the same user id (and therefore every
 *  row of progress already synced under it) instead of starting a brand-new account from zero. */
function GuestUpgradeCard() {
  const auth = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await auth.upgradeGuestAccount(email, password, fullName);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 p-4 mb-6 text-sm text-[var(--color-text)] leading-relaxed">
        Confirmation link sent to <span className="font-semibold text-[var(--color-heading)]">{email}</span>.
        Click it to permanently link this email and password to your account — all your progress will
        carry over automatically.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)] p-5 mb-8">
      <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-gold-dim)] mb-1">
        <IconLock className="w-4 h-4" /> Guest account — save your progress
      </div>
      <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-4">
        You're signed in as a guest. Your progress is saving to this browser, but adding an email and
        password lets you log in from other devices and guarantees you never lose your flags or streak.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          aria-label="Full name"
          required
          className="flex-1 px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          required
          className="flex-1 px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          aria-label="Password"
          minLength={6}
          required
          className="flex-1 px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2.5 rounded-lg bg-[var(--color-gold)] text-[#241a08] text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
        >
          {submitting ? 'Saving…' : 'Save my progress'}
        </button>
      </form>
      {error && (
        <div className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/30 rounded-lg px-3 py-2 leading-relaxed mt-2.5">
          {error}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const progress = useProgress();
  const auth = useAuth();
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();

  const totalLessons = useMemo(() => MODULES.reduce((sum, m) => sum + m.lessons.length, 0), []);
  const completedLessons = useMemo(
    () => Object.values(progress.completedLessons).filter(Boolean).length,
    [progress.completedLessons],
  );

  const { labsCompleted, totalFlags, points } = useMemo(() => {
    let completed = 0;
    let flagsTotal = 0;
    let pts = 0;
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      flagsTotal += flags.length;
      const lab = findLab(labId);
      if (lab && flags.length >= lab.scenario.totalFlags) {
        completed += 1;
        pts += POINTS[lab.scenario.difficulty] ?? 10;
      }
    }
    return { labsCompleted: completed, totalFlags: flagsTotal, points: pts };
  }, [progress.labFlags]);

  const bookmarked = useMemo(
    () => Object.values(progress.bookmarkedLabs).filter(Boolean).length,
    [progress.bookmarkedLabs],
  );

  const { quizzesTaken, avgQuizScore } = useMemo(() => {
    const count = Object.keys(progress.quizScores).length;
    const avg = count ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / count) : 0;
    return { quizzesTaken: count, avgQuizScore: avg };
  }, [progress.quizScores]);

  const streak = useMemo(() => computeStreak(progress.activityDates), [progress.activityDates]);

  const { unlockedAchievements, sortedAchievements } = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter((a) => a.isUnlocked(progress));
    const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(b.isUnlocked(progress)) - Number(a.isUnlocked(progress)));
    return { unlockedAchievements: unlocked, sortedAchievements: sorted };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags, progress.completedLessons, progress.activityDates]);

  const { attemptedTaskIds, avgAttemptsPerSolve, cleanSolveRate, solvedTaskIds, cleanSolves, noSolutionSolves } = useMemo(() => {
    const attempted = Object.keys(progress.codeTaskAttempts);
    const totalAttempts = Object.values(progress.codeTaskAttempts).reduce((a, b) => a + b, 0);
    const solved = Object.keys(progress.completedCodeTasks).filter((id) => progress.completedCodeTasks[id]);
    const avgAttempts = solved.length ? Math.round((totalAttempts / solved.length) * 10) / 10 : 0;
    const clean = solved.filter((id) => !progress.codeTaskHintsUsed[id]).length;
    const noSolution = solved.filter((id) => !progress.codeTaskSolutionRevealed[id]).length;
    const rate = solved.length ? Math.round((clean / solved.length) * 100) : 0;
    return {
      attemptedTaskIds: attempted,
      avgAttemptsPerSolve: avgAttempts,
      cleanSolveRate: rate,
      solvedTaskIds: solved,
      cleanSolves: clean,
      noSolutionSolves: noSolution,
    };
  }, [progress.codeTaskAttempts, progress.completedCodeTasks, progress.codeTaskHintsUsed, progress.codeTaskSolutionRevealed]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="gold-eyebrow mb-1.5 sm:mb-2">// your progress</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-6 sm:mb-8">Profile</h1>

      {auth.isGuest && <GuestUpgradeCard />}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-4 mb-8 flex-wrap">
        <span className="w-16 h-16 rounded-full bg-[var(--color-accent)] text-white text-2xl font-bold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold text-[var(--color-heading)] truncate">{progress.learnerName}</div>
          <div className="text-sm text-[var(--color-text-dim)]">Cybersecurity &middot; Offensive Security track</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)] px-3.5 py-1.5">
            <span className="text-sm font-mono font-bold text-[var(--color-gold-dim)]">{points}</span>
            <span className="text-xs text-[var(--color-text-dim)]">pts</span>
          </div>
          {streak.current > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-1.5">
              <span className="text-sm leading-none">🔥</span>
              <span className="text-sm font-bold text-[var(--color-heading)]">{streak.current}</span>
              <span className="text-xs text-[var(--color-text-dim)]">day streak</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Lessons completed" value={`${completedLessons}/${totalLessons}`} icon={<IconCheck className="w-5 h-5" />} color="var(--color-accent-2)" />
        <StatCard label="Labs completed" value={`${labsCompleted}/${LABS.length}`} icon={<IconFlag className="w-5 h-5" />} color="var(--color-accent)" />
        <StatCard label="Total flags captured" value={totalFlags} icon={<IconFlag className="w-5 h-5" />} color="var(--color-success)" />
        <StatCard label="Bookmarked labs" value={bookmarked} icon={<IconBookmark className="w-5 h-5" />} color="var(--color-gold)" />
        <StatCard label="Quizzes taken" value={quizzesTaken} icon={<IconUser className="w-5 h-5" />} color="var(--color-accent-2)" />
        <StatCard label="Average quiz score" value={`${avgQuizScore}%`} icon={<IconUser className="w-5 h-5" />} color="var(--color-accent)" />
        <StatCard
          label={streak.current > 0 ? 'Current streak' : 'Longest streak'}
          value={`${streak.current > 0 ? streak.current : streak.longest} day${(streak.current > 0 ? streak.current : streak.longest) === 1 ? '' : 's'}`}
          icon={<span className="text-lg leading-none">🔥</span>}
          color="var(--color-warn)"
        />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide">Achievements</h2>
          <span className="text-xs font-mono text-[var(--color-text-dim)]">
            {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sortedAchievements.map((a) => {
            const unlocked = a.isUnlocked(progress);
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                  unlocked
                    ? 'border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-50'
                }`}
              >
                <span className="text-2xl leading-none shrink-0" aria-hidden>
                  {unlocked ? a.icon : '🔒'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--color-heading)] leading-tight">{a.title}</div>
                  <div className="text-xs text-[var(--color-text-dim)] leading-snug mt-0.5">{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide mb-3">
          How You Actually Learn
        </h2>
        <p className="text-xs text-[var(--color-text-dim)] mb-3 leading-relaxed">
          Real signal from the Code Portal, not just pass/fail — how many tries things actually took, and
          how often you got there without leaning on a hint or the reference solution.
        </p>
        {attemptedTaskIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-dim)]">
            Attempt a Code Portal task to start building this picture.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Tasks attempted" value={attemptedTaskIds.length} icon={<IconCode className="w-5 h-5" />} />
              <StatCard label="Avg. attempts per solve" value={avgAttemptsPerSolve || '—'} icon={<IconCode className="w-5 h-5" />} />
              <StatCard label="Solved with zero hints" value={`${cleanSolves}/${solvedTaskIds.length}`} icon={<IconCode className="w-5 h-5" />} />
              <StatCard label="Clean-solve rate" value={solvedTaskIds.length ? `${cleanSolveRate}%` : '—'} icon={<IconCode className="w-5 h-5" />} />
            </div>
            {solvedTaskIds.length > 0 && (
              <p className="text-xs text-[var(--color-text-dim)] mt-3">
                {noSolutionSolves}/{solvedTaskIds.length} solved tasks were solved without ever opening the reference solution.
              </p>
            )}
          </>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-dim)] leading-relaxed">
        Everything here — lessons, labs, quizzes, your streak, achievements, and Code Portal learning-insight
        stats — syncs to your account, so it follows you across devices as long as you're signed in. Your
        display name is taken straight from your account rather than stored separately.
      </div>
    </div>
  );
}
