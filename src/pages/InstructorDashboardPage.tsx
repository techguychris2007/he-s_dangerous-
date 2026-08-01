import { useEffect, useMemo, useState } from 'react';
import { LABS } from '../data/labs';
import { MODULES } from '../data/curriculum';
import { fetchAllLearnerProgress, type LearnerProgressRow } from '../lib/instructorDashboard';
import { IconUser, IconFlag, IconCheck, IconChart } from '../components/layout/icons';
import StatCard from '../components/common/StatCard';

const TOTAL_LESSONS = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
const TOTAL_LABS = LABS.length;

interface LearnerStats {
  userId: string;
  email: string;
  displayName: string;
  lessonsCompleted: number;
  labsCompleted: number;
  totalFlags: number;
  quizzesTaken: number;
  avgQuizScore: number;
  codeTasksSolved: number;
  lastActive: string;
}

function computeStats(row: LearnerProgressRow): LearnerStats {
  const lessonsCompleted = Object.values(row.completedLessons).filter(Boolean).length;
  const labsCompleted = LABS.filter((l) => (row.labFlags[l.scenario.id]?.length ?? 0) >= l.scenario.totalFlags).length;
  const totalFlags = Object.values(row.labFlags).reduce((sum, flags) => sum + flags.length, 0);
  const quizScoreValues = Object.values(row.quizScores);
  const quizzesTaken = quizScoreValues.length;
  const avgQuizScore = quizzesTaken ? Math.round(quizScoreValues.reduce((a, b) => a + b, 0) / quizzesTaken) : 0;
  const codeTasksSolved = Object.values(row.completedCodeTasks).filter(Boolean).length;

  return {
    userId: row.userId,
    email: row.email,
    displayName: row.fullName?.trim() || row.email,
    lessonsCompleted,
    labsCompleted,
    totalFlags,
    quizzesTaken,
    avgQuizScore,
    codeTasksSolved,
    lastActive: row.updatedAt,
  };
}

type SortKey = 'displayName' | 'lessonsCompleted' | 'labsCompleted' | 'totalFlags' | 'avgQuizScore' | 'codeTasksSolved' | 'lastActive';

function SortHeader({ label, sortKey, active, dir, onClick }: { label: string; sortKey: SortKey; active: SortKey; dir: 1 | -1; onClick: (k: SortKey) => void }) {
  const isActive = sortKey === active;
  return (
    <th className="text-left px-3 py-2 whitespace-nowrap">
      <button
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${
          isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
        }`}
      >
        {label}
        {isActive && <span aria-hidden="true">{dir === 1 ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}

export default function InstructorDashboardPage() {
  const [rows, setRows] = useState<LearnerProgressRow[] | null | undefined>(undefined);
  const [sortKey, setSortKey] = useState<SortKey>('lastActive');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  useEffect(() => {
    fetchAllLearnerProgress().then(setRows);
  }, []);

  const stats = useMemo(() => (rows ?? []).map(computeStats), [rows]);

  const sorted = useMemo(() => {
    const copy = [...stats];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * sortDir;
      return ((av as number) - (bv as number)) * sortDir;
    });
    return copy;
  }, [stats, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === 'displayName' ? 1 : -1);
    }
  };

  const learnerCount = stats.length;
  const avgLabsCompleted = learnerCount ? Math.round((stats.reduce((s, x) => s + x.labsCompleted, 0) / learnerCount) * 10) / 10 : 0;
  const cohortTotalFlags = stats.reduce((s, x) => s + x.totalFlags, 0);
  const scoredLearners = stats.filter((x) => x.quizzesTaken > 0);
  const avgQuizScoreCohort = scoredLearners.length
    ? Math.round(scoredLearners.reduce((s, x) => s + x.avgQuizScore, 0) / scoredLearners.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// cohort overview</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-8">Instructor Dashboard</h1>

      {rows === undefined && <div className="text-sm text-[var(--color-text-dim)]">Loading learner progress&hellip;</div>}

      {rows === null && (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-6 text-sm text-[var(--color-danger)]">
          Couldn't load cohort progress. Either the <code>instructor_dashboard_progress()</code> Supabase
          function hasn't been run yet (see <code>supabase/migrations/0003_instructor_dashboard.sql</code>), or
          something else went wrong — try again in a moment.
        </div>
      )}

      {rows && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Learners" value={learnerCount} icon={<IconUser className="w-5 h-5" />} />
            <StatCard label="Avg. labs completed" value={`${avgLabsCompleted}/${TOTAL_LABS}`} icon={<IconCheck className="w-5 h-5" />} />
            <StatCard label="Cohort flags captured" value={cohortTotalFlags} icon={<IconFlag className="w-5 h-5" />} />
            <StatCard label="Avg. quiz score" value={scoredLearners.length ? `${avgQuizScoreCohort}%` : '—'} icon={<IconChart className="w-5 h-5" />} />
          </div>

          {learnerCount === 0 ? (
            <div className="text-sm text-[var(--color-text-dim)]">No learners have signed in yet.</div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--color-border)]">
                  <tr>
                    <SortHeader label="Learner" sortKey="displayName" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label={`Lessons /${TOTAL_LESSONS}`} sortKey="lessonsCompleted" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label={`Labs /${TOTAL_LABS}`} sortKey="labsCompleted" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Flags" sortKey="totalFlags" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Avg quiz" sortKey="avgQuizScore" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Code tasks" sortKey="codeTasksSolved" active={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Last active" sortKey="lastActive" active={sortKey} dir={sortDir} onClick={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.userId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                      <td className="px-3 py-2.5 min-w-[180px]">
                        <div className="font-semibold text-[var(--color-heading)] truncate">{s.displayName}</div>
                        <div className="text-xs text-[var(--color-text-dim)] truncate">{s.email}</div>
                      </td>
                      <td className="px-3 py-2.5 font-mono">{s.lessonsCompleted}</td>
                      <td className="px-3 py-2.5 font-mono">{s.labsCompleted}</td>
                      <td className="px-3 py-2.5 font-mono">{s.totalFlags}</td>
                      <td className="px-3 py-2.5 font-mono">{s.quizzesTaken ? `${s.avgQuizScore}%` : '—'}</td>
                      <td className="px-3 py-2.5 font-mono">{s.codeTasksSolved}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-text-dim)]">
                        {new Date(s.lastActive).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
