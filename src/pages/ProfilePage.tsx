import { useState } from 'react';
import { LABS } from '../data/labs';
import { MODULES } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../state/authStore';
import { ACHIEVEMENTS, computeStreak } from '../data/achievements';
import { IconUser, IconFlag, IconCheck, IconBookmark, IconCode, IconLock, IconMail } from '../components/layout/icons';
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
    if (!fullName.trim()) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setSubmitting(true);
    const { error: upgradeError } = await auth.upgradeGuestAccount(email.trim(), password, fullName.trim());
    setSubmitting(false);
    if (upgradeError) return setError(upgradeError);
    setSent(true);
  };

  return (
    <div className="rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)] p-5 mb-8">
      <div className="flex items-center gap-2 mb-1.5">
        <IconLock className="w-4 h-4 text-[var(--color-gold-dim)] shrink-0" />
        <h2 className="font-bold text-[var(--color-heading)] text-sm">You're browsing as a guest</h2>
      </div>
      <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-4">
        Everything above is already saving to this session, but a guest identity only lives in this browser —
        there's no password to sign back in with elsewhere, and clearing site data loses it for good. Add an
        email and password to turn it into a permanent account with the exact same progress, no restart.
      </p>

      {sent ? (
        <div className="text-sm text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg px-3.5 py-2.5">
          Check your inbox and confirm the link — your progress stays exactly as it is, this just adds a way
          to sign back in.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex-1 min-w-0">
            <IconUser className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
            <span className="sr-only">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex-1 min-w-0">
            <IconMail className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
            <span className="sr-only">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex-1 min-w-0">
            <IconLock className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 characters)"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg bg-[var(--color-gold)] text-[#241a08] text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
          >
            {submitting ? 'Saving…' : 'Save my progress'}
          </button>
        </form>
      )}
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

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = Object.values(progress.completedLessons).filter(Boolean).length;
  const labsCompleted = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const totalFlags = LABS.reduce((sum, l) => sum + progress.flagCount(l.scenario.id), 0);
  const bookmarked = Object.values(progress.bookmarkedLabs).filter(Boolean).length;
  const quizzesTaken = Object.keys(progress.quizScores).length;
  const avgQuizScore = quizzesTaken
    ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / quizzesTaken)
    : 0;
  const points = LABS.reduce((sum, l) => {
    const done = progress.flagCount(l.scenario.id) >= l.scenario.totalFlags;
    return sum + (done ? POINTS[l.scenario.difficulty] ?? 10 : 0);
  }, 0);
  const streak = computeStreak(progress.activityDates);
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.isUnlocked(progress));
  // Unlocked-first so the reward is immediately visible instead of scattered through a mostly-locked grid.
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => Number(b.isUnlocked(progress)) - Number(a.isUnlocked(progress)));

  const attemptedTaskIds = Object.keys(progress.codeTaskAttempts);
  const totalAttempts = Object.values(progress.codeTaskAttempts).reduce((a, b) => a + b, 0);
  const solvedTaskIds = Object.keys(progress.completedCodeTasks).filter((id) => progress.completedCodeTasks[id]);
  const avgAttemptsPerSolve = solvedTaskIds.length ? Math.round((totalAttempts / solvedTaskIds.length) * 10) / 10 : 0;
  const cleanSolves = solvedTaskIds.filter((id) => !progress.codeTaskHintsUsed[id]).length;
  const noSolutionSolves = solvedTaskIds.filter((id) => !progress.codeTaskSolutionRevealed[id]).length;
  const cleanSolveRate = solvedTaskIds.length ? Math.round((cleanSolves / solvedTaskIds.length) * 100) : 0;

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
