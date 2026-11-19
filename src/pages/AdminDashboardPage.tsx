import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LABS, findLab, LAB_CATEGORIES } from '../data/labs';
import type { LabEntry } from '../data/labs';
import { MODULES, ROADMAP } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import type { RoadmapTrack } from '../types';
import {
  fetchAdminData, AdminLoadError, toCsv, downloadCsv,
  type AdminData, type AdminAccount, type AdminFeedback,
} from '../lib/adminDashboard';
import StatCard from '../components/common/StatCard';
import AdminAnalystPanel from '../components/admin/AdminAnalystPanel';
import { SkeletonBlock, SkeletonList } from '../components/common/Skeleton';
import { IconUser, IconFlag, IconCheck, IconChart, IconMessage, IconLightning, IconRefresh, IconDownload } from '../components/layout/icons';

// ─── Derived data ────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const TOTAL_LESSONS = () => MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
const TRACK_LABELS: Record<RoadmapTrack, string> = {
  presecurity: 'Pre-security', security: 'Offensive', defensive: 'Defensive', programming: 'Programming',
  software: 'Software engineering', dotnet: 'C# & .NET', ml: 'Machine learning',
};

function isLabComplete(lab: LabEntry, account: AdminAccount) {
  return (account.labFlags[lab.scenario.id]?.length ?? 0) >= lab.scenario.totalFlags;
}

function lastActive(a: AdminAccount): number {
  const day = a.activityDates[a.activityDates.length - 1];
  const fromDates = day ? Date.parse(day + 'T23:59:59') : 0;
  const fromSync = a.progressUpdatedAt ? Date.parse(a.progressUpdatedAt) : 0;
  return Math.max(fromDates || 0, fromSync || 0);
}

function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface LearnerRow {
  account: AdminAccount;
  name: string;
  lessons: number;
  labs: number;
  flags: number;
  avgQuiz: number | null;
  codeTasks: number;
  lastActive: number;
}

function toLearnerRow(a: AdminAccount): LearnerRow {
  const quiz = Object.values(a.quizScores);
  return {
    account: a,
    name: a.fullName?.trim() || a.email || (a.isAnonymous ? 'Guest' : '—'),
    lessons: Object.values(a.completedLessons).filter(Boolean).length,
    labs: LABS.filter((lab) => isLabComplete(lab, a)).length,
    flags: Object.values(a.labFlags).reduce((sum, f) => sum + (f?.length ?? 0), 0),
    avgQuiz: quiz.length ? Math.round(quiz.reduce((x, y) => x + y, 0) / quiz.length) : null,
    codeTasks: Object.values(a.completedCodeTasks).filter(Boolean).length,
    lastActive: lastActive(a),
  };
}

function relTime(ms: number | null | undefined) {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < DAY) return `${Math.round(diff / 3_600_000)} h ago`;
  if (diff < 30 * DAY) return `${Math.round(diff / DAY)} d ago`;
  return new Date(ms).toLocaleDateString();
}

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}

// ─── Small building blocks ───────────────────────────────────────────────────

function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`premium-card rounded-2xl p-5 min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-heading)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={label}>
      <div className="h-1.5 flex-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono text-xs text-[var(--color-text-dim)] w-9 text-right">{value}%</span>
    </div>
  );
}

/** Single-series column chart with a per-bar hover/focus readout. */
function ColumnChart({ points, label }: { points: { key: string; label: string; value: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const shown = hover ?? points.length - 1;
  const current = points[shown];
  return (
    <figure className="m-0">
      <div className="flex items-baseline justify-between mb-2 text-xs">
        <span className="text-[var(--color-text-dim)]">{current?.label}</span>
        <span className="font-mono font-bold text-[var(--color-heading)]">{current?.value ?? 0}</span>
      </div>
      <div className="flex items-end gap-[2px] h-32 border-b border-[var(--color-border)]" role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        {points.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className="flex-1 h-full flex items-end group focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`${p.label}: ${p.value}`}
          >
            <span
              className={`block w-full rounded-t-[4px] transition-opacity ${hover === null || hover === i ? 'opacity-100' : 'opacity-50'}`}
              style={{ height: p.value ? `${Math.max(3, (p.value / max) * 100)}%` : '2px', background: p.value ? 'var(--color-accent)' : 'var(--color-border)' }}
            />
          </button>
        ))}
      </div>
      <figcaption className="flex justify-between mt-1.5 text-[11px] text-[var(--color-text-dim)] font-mono">
        <span>{points[0]?.label}</span><span>{points[points.length - 1]?.label}</span>
      </figcaption>
    </figure>
  );
}

type SortDir = 1 | -1;
function useSort<K extends string>(initial: K, dir: SortDir = -1) {
  const [key, setKey] = useState<K>(initial);
  const [d, setD] = useState<SortDir>(dir);
  const toggle = (k: K) => {
    if (k === key) setD((x) => (x === 1 ? -1 : 1));
    else { setKey(k); setD(-1); }
  };
  return { key, dir: d, toggle };
}

function Th<K extends string>({ label, k, sort, align = 'left' }: { label: string; k?: K; sort?: { key: K; dir: SortDir; toggle: (k: K) => void }; align?: 'left' | 'right' }) {
  const base = `px-3 py-2 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-${align}`;
  if (!k || !sort) return <th className={`${base} text-[var(--color-text-dim)]`}>{label}</th>;
  const active = sort.key === k;
  return (
    <th className={base} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => sort.toggle(k)} className={active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'}>
        {label}{active && <span aria-hidden="true"> {sort.dir === 1 ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}

function sortBy<T>(rows: T[], get: (row: T) => string | number | null, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = get(a), bv = get(b);
    if (av === bv) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return (typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv) : (av as number) - (bv as number)) * dir;
  });
}

const inputClass = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]';
const smallButton = 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]';

// ─── Tabs ────────────────────────────────────────────────────────────────────

function OverviewTab({ data, learners }: { data: AdminData; learners: LearnerRow[] }) {
  const registered = data.accounts.filter((a) => !a.isAnonymous);
  const now = Date.now();
  const signups7 = registered.filter((a) => now - Date.parse(a.createdAt) < 7 * DAY).length;
  const signups30 = registered.filter((a) => now - Date.parse(a.createdAt) < 30 * DAY).length;
  const members = learners.filter((l) => !l.account.isAnonymous);
  const active7 = members.filter((l) => now - l.lastActive < 7 * DAY).length;
  const active30 = members.filter((l) => now - l.lastActive < 30 * DAY).length;
  const labsCompleted = members.reduce((s, l) => s + l.labs, 0);
  const lessonsCompleted = members.reduce((s, l) => s + l.lessons, 0);
  const unconfirmed = registered.filter((a) => !a.emailConfirmed).length;
  const paid = registered.filter((a) => a.plan).length;

  const weeks = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 11 * 7);
    return Array.from({ length: 12 }, (_, i) => {
      const from = start.getTime() + i * 7 * DAY;
      const value = registered.filter((a) => { const t = Date.parse(a.createdAt); return t >= from && t < from + 7 * DAY; }).length;
      return { key: String(from), label: `Week of ${new Date(from).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`, value };
    });
  }, [registered]);

  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = localDay(d);
    return { key, label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), value: registered.filter((a) => a.activityDates.includes(key)).length };
  }), [registered]);

  const topLabs = useMemo(() => LABS
    .map((lab) => ({ lab, done: registered.filter((a) => isLabComplete(lab, a)).length }))
    .filter((x) => x.done > 0)
    .sort((a, b) => b.done - a.done)
    .slice(0, 6), [registered]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={`Accounts · ${signups30} new in 30 d`} value={registered.length} icon={<IconUser className="w-5 h-5" />} />
        <StatCard label="Signups, last 7 days" value={signups7} icon={<IconLightning className="w-5 h-5" />} color="var(--color-gold)" />
        <StatCard label={`Active 7 d · ${active30} in 30 d`} value={active7} icon={<IconChart className="w-5 h-5" />} color="var(--color-success)" />
        <StatCard label={`Labs completed · ${lessonsCompleted} lessons`} value={labsCompleted} icon={<IconFlag className="w-5 h-5" />} color="var(--color-accent-2)" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Panel title="Signups per week"><ColumnChart points={weeks} label="New registered accounts per week, last 12 weeks" /></Panel>
        <Panel title="Daily active learners"><ColumnChart points={days} label="Learners with recorded activity per day, last 30 days" /></Panel>
      </div>
      <LearningNow data={data} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Accounts">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--color-text-dim)]">Email not confirmed</dt><dd className="text-right font-mono">{unconfirmed}</dd>
            <dt className="text-[var(--color-text-dim)]">Guest sessions</dt><dd className="text-right font-mono">{data.accounts.length - registered.length}</dd>
            <dt className="text-[var(--color-text-dim)]">Never synced progress</dt><dd className="text-right font-mono">{registered.filter((a) => !a.progressUpdatedAt).length}</dd>
            <dt className="text-[var(--color-text-dim)]">Leaderboard opt-ins</dt><dd className="text-right font-mono">{registered.filter((a) => a.leaderboardOptIn).length}</dd>
            <dt className="text-[var(--color-text-dim)]">Active paid plans</dt><dd className="text-right font-mono">{paid}</dd>
          </dl>
        </Panel>
        <Panel title="Most completed labs">
          {topLabs.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">No lab has been completed yet.</p> : (
            <ol className="space-y-2 text-sm">
              {topLabs.map(({ lab, done }) => (
                <li key={lab.slug} className="flex justify-between gap-3">
                  <Link to={`/lab/${lab.slug}`} className="truncate text-[var(--color-heading)] hover:text-[var(--color-accent)]">{lab.scenario.title}</Link>
                  <span className="font-mono text-[var(--color-text-dim)]">{done}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Inbox">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--color-text-dim)]">Feedback, last 7 days</dt><dd className="text-right font-mono">{data.feedback.filter((f) => now - Date.parse(f.createdAt) < 7 * DAY).length}</dd>
            <dt className="text-[var(--color-text-dim)]">Bug reports, total</dt><dd className="text-right font-mono">{data.feedback.filter((f) => f.category === 'bug').length}</dd>
            <dt className="text-[var(--color-text-dim)]">Lab comments, 7 days</dt><dd className="text-right font-mono">{data.comments.filter((c) => now - Date.parse(c.createdAt) < 7 * DAY).length}</dd>
            <dt className="text-[var(--color-text-dim)]">Lab ratings</dt><dd className="text-right font-mono">{data.ratings.reduce((s, r) => s + r.ratingCount, 0)}</dd>
          </dl>
        </Panel>
      </div>
    </>
  );
}

function LearningNow({ data }: { data: AdminData }) {
  const now = Date.now();
  const today = localDay(new Date());
  const members = data.accounts.filter((a) => !a.isAnonymous);
  const activeToday = members.filter((a) => a.activityDates.includes(today)).length;
  const recent = useMemo(() => {
    const out: { at: number; lab: LabEntry | undefined; labId: string }[] = [];
    for (const a of members) for (const [labId, at] of Object.entries(a.labCompletedAt)) {
      if (now - Number(at) < DAY) out.push({ at: Number(at), lab: findLab(labId), labId });
    }
    return out.sort((x, y) => y.at - x.at);
  }, [members, now]);
  const byCategory = new Map<string, number>();
  for (const r of recent) { const c = r.lab?.scenario.category ?? 'Other'; byCategory.set(c, (byCategory.get(c) ?? 0) + 1); }
  return (
    <Panel title="Learning right now · last 24 hours" className="mb-4">
      <div className="grid md:grid-cols-[200px_1fr] gap-5">
        <dl className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
          <div><dt className="text-[var(--color-text-dim)] text-xs">Learners active today</dt><dd className="font-mono text-2xl font-bold text-[var(--color-heading)]">{activeToday}</dd></div>
          <div><dt className="text-[var(--color-text-dim)] text-xs">Labs completed, 24 h</dt><dd className="font-mono text-2xl font-bold text-[var(--color-heading)]">{recent.length}</dd></div>
        </dl>
        <div className="min-w-0">
          {recent.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">No lab completions in the last 24 hours.</p> : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {[...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([c, k]) => (
                  <span key={c} className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs"><span className="text-[var(--color-heading)] font-semibold">{c}</span> <span className="font-mono text-[var(--color-text-dim)]">{k}</span></span>
                ))}
              </div>
              <ol className="space-y-1.5 text-sm max-h-40 overflow-y-auto pr-1">
                {recent.slice(0, 12).map((r, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    {r.lab ? <Link to={`/lab/${r.lab.slug}`} className="truncate hover:text-[var(--color-accent)]">{r.lab.scenario.title}</Link> : <span className="truncate font-mono">{r.labId}</span>}
                    <span className="shrink-0 font-mono text-xs text-[var(--color-text-dim)]">{relTime(r.at)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

type UserFilter = 'registered' | 'unconfirmed' | 'active' | 'inactive' | 'guests' | 'all';
type UserSort = 'name' | 'joined' | 'signIn' | 'lessons' | 'labs' | 'flags' | 'quiz' | 'lastActive';

function UsersTab({ learners }: { learners: LearnerRow[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('registered');
  const sort = useSort<UserSort>('joined');
  const now = Date.now();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = learners.filter((l) => {
      const a = l.account;
      if (filter !== 'all' && filter !== 'guests' && a.isAnonymous) return false;
      if (filter === 'guests' && !a.isAnonymous) return false;
      if (filter === 'unconfirmed' && a.emailConfirmed) return false;
      if (filter === 'active' && now - l.lastActive >= 30 * DAY) return false;
      if (filter === 'inactive' && now - l.lastActive < 30 * DAY) return false;
      return !q || l.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    });
    const get: Record<UserSort, (l: LearnerRow) => string | number | null> = {
      name: (l) => l.name.toLowerCase(), joined: (l) => Date.parse(l.account.createdAt),
      signIn: (l) => (l.account.lastSignInAt ? Date.parse(l.account.lastSignInAt) : null),
      lessons: (l) => l.lessons, labs: (l) => l.labs, flags: (l) => l.flags, quiz: (l) => l.avgQuiz, lastActive: (l) => l.lastActive || null,
    };
    return sortBy(filtered, get[sort.key], sort.dir);
  }, [learners, query, filter, sort.key, sort.dir, now]);

  const exportCsv = () => downloadCsv(`darkworld-users-${localDay(new Date())}.csv`, toCsv(
    ['name', 'email', 'joined', 'last_sign_in', 'email_confirmed', 'plan', 'lessons', 'labs', 'flags', 'avg_quiz', 'code_tasks', 'last_active'],
    rows.map((l) => [l.account.fullName, l.account.email, l.account.createdAt, l.account.lastSignInAt, l.account.emailConfirmed, l.account.plan, l.lessons, l.labs, l.flags, l.avgQuiz, l.codeTasks, l.lastActive ? new Date(l.lastActive).toISOString() : '']),
  ));

  return (
    <Panel title={`Users · ${rows.length}`} action={<button type="button" className={smallButton} onClick={exportCsv}><IconDownload className="w-3.5 h-3.5" />Export CSV</button>}>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" aria-label="Search users" className={`${inputClass} flex-1 min-w-[200px]`} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as UserFilter)} aria-label="Filter users" className={inputClass}>
          <option value="registered">Registered</option>
          <option value="active">Active in 30 days</option>
          <option value="inactive">Inactive 30+ days</option>
          <option value="unconfirmed">Email not confirmed</option>
          <option value="guests">Guests</option>
          <option value="all">Everyone</option>
        </select>
      </div>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              <Th label="User" k="name" sort={sort} />
              <Th label="Joined" k="joined" sort={sort} />
              <Th label="Last sign-in" k="signIn" sort={sort} />
              <Th label={`Lessons /${TOTAL_LESSONS()}`} k="lessons" sort={sort} align="right" />
              <Th label={`Labs /${LABS.length}`} k="labs" sort={sort} align="right" />
              <Th label="Flags" k="flags" sort={sort} align="right" />
              <Th label="Quiz" k="quiz" sort={sort} align="right" />
              <Th label="Last active" k="lastActive" sort={sort} />
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 500).map((l) => (
              <tr key={l.account.userId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                <td className="px-3 py-2.5 min-w-[200px] max-w-[280px]">
                  <div className="font-semibold text-[var(--color-heading)] truncate">{l.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)] truncate">
                    {l.account.email || 'no email'}
                    {!l.account.emailConfirmed && !l.account.isAnonymous && <span className="ml-1.5 text-[var(--color-warn)]">· unconfirmed</span>}
                    {l.account.isBanned && <span className="ml-1.5 text-[var(--color-danger)]">· banned</span>}
                    {l.account.plan && <span className="ml-1.5 text-[var(--color-gold)]">· {l.account.plan}</span>}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">{new Date(l.account.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-[var(--color-text-dim)]">{relTime(l.account.lastSignInAt ? Date.parse(l.account.lastSignInAt) : null)}</td>
                <td className="px-3 py-2.5 font-mono text-right">{l.lessons}</td>
                <td className="px-3 py-2.5 font-mono text-right">{l.labs}</td>
                <td className="px-3 py-2.5 font-mono text-right">{l.flags}</td>
                <td className="px-3 py-2.5 font-mono text-right">{l.avgQuiz === null ? '—' : `${l.avgQuiz}%`}</td>
                <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-[var(--color-text-dim)]">{relTime(l.lastActive)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-text-dim)]">No users match.</p>}
        {rows.length > 500 && <p className="px-5 py-3 text-xs text-[var(--color-text-dim)]">Showing the first 500. Narrow the search or export the CSV for all {rows.length}.</p>}
      </div>
    </Panel>
  );
}

type LabSort = 'title' | 'category' | 'started' | 'completed' | 'rate' | 'rating';

function ProgressTab({ data }: { data: AdminData }) {
  const learners = data.accounts.filter((a) => !a.isAnonymous);
  const ratingByLab = useMemo(() => {
    const map = new Map<string, AdminData['ratings'][number]>();
    for (const r of data.ratings) { const lab = findLab(r.labId); map.set(lab?.scenario.id ?? r.labId, r); }
    return map;
  }, [data.ratings]);

  const modules = useMemo(() => MODULES.filter((m) => m.lessons.length).map((m) => {
    let started = 0, finished = 0, totalDone = 0;
    for (const a of learners) {
      const done = m.lessons.filter((l) => a.completedLessons[l.id]).length;
      if (done) started++;
      if (done === m.lessons.length) finished++;
      totalDone += done;
    }
    return { m, started, finished, avg: started ? pct(totalDone, started * m.lessons.length) : 0 };
  }), [learners]);

  const labs = useMemo(() => LABS.map((lab) => {
    const started = learners.filter((a) => (a.labFlags[lab.scenario.id]?.length ?? 0) > 0).length;
    const completed = learners.filter((a) => isLabComplete(lab, a)).length;
    return { lab, started, completed, rate: started ? pct(completed, started) : null, rating: ratingByLab.get(lab.scenario.id) ?? null };
  }), [learners, ratingByLab]);

  const sort = useSort<LabSort>('started');
  const [category, setCategory] = useState('all');
  const sortedLabs = useMemo(() => {
    const get: Record<LabSort, (x: (typeof labs)[number]) => string | number | null> = {
      title: (x) => x.lab.scenario.title, category: (x) => x.lab.scenario.category, started: (x) => x.started,
      completed: (x) => x.completed, rate: (x) => x.rate, rating: (x) => x.rating?.avgRating ?? null,
    };
    return sortBy(labs.filter((x) => category === 'all' || x.lab.scenario.category === category), get[sort.key], sort.dir);
  }, [labs, category, sort.key, sort.dir]);

  const exportLabs = () => downloadCsv(`darkworld-lab-progress-${localDay(new Date())}.csv`, toCsv(
    ['lab', 'category', 'difficulty', 'flags', 'started', 'completed', 'completion_rate', 'avg_rating', 'ratings', 'too_easy', 'just_right', 'too_hard'],
    sortedLabs.map((x) => [x.lab.scenario.title, x.lab.scenario.category, x.lab.scenario.difficulty, x.lab.scenario.totalFlags, x.started, x.completed, x.rate, x.rating?.avgRating, x.rating?.ratingCount, x.rating?.tooEasy, x.rating?.justRight, x.rating?.tooHard]),
  ));

  return (
    <div className="grid gap-4">
      <Panel title="Labs" action={<button type="button" className={smallButton} onClick={exportLabs}><IconDownload className="w-3.5 h-3.5" />Export CSV</button>}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter labs by category" className={`${inputClass} mb-4`}>
          <option value="all">All categories</option>
          {LAB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="overflow-x-auto -mx-5 max-h-[560px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)]">
              <tr>
                <Th label="Lab" k="title" sort={sort} />
                <Th label="Category" k="category" sort={sort} />
                <Th label="Started" k="started" sort={sort} align="right" />
                <Th label="Completed" k="completed" sort={sort} align="right" />
                <Th label="Finish rate" k="rate" sort={sort} />
                <Th label="Rating" k="rating" sort={sort} align="right" />
                <Th label="Difficulty votes" />
              </tr>
            </thead>
            <tbody>
              {sortedLabs.map((x) => (
                <tr key={x.lab.slug} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                  <td className="px-3 py-2 min-w-[220px]"><Link to={`/lab/${x.lab.slug}`} className="text-[var(--color-heading)] hover:text-[var(--color-accent)]">{x.lab.scenario.title}</Link>
                    <span className="ml-2 text-xs text-[var(--color-text-dim)]">{x.lab.scenario.difficulty}</span></td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-dim)] whitespace-nowrap">{x.lab.scenario.category}</td>
                  <td className="px-3 py-2 font-mono text-right">{x.started}</td>
                  <td className="px-3 py-2 font-mono text-right">{x.completed}</td>
                  <td className="px-3 py-2">{x.rate === null ? <span className="text-xs text-[var(--color-text-dim)]">—</span> : <Meter value={x.rate} label={`${x.lab.scenario.title} finish rate`} />}</td>
                  <td className="px-3 py-2 font-mono text-right whitespace-nowrap">{x.rating ? `${x.rating.avgRating.toFixed(1)} ★ (${x.rating.ratingCount})` : '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-[var(--color-text-dim)]">{x.rating ? `${x.rating.tooEasy} easy · ${x.rating.justRight} right · ${x.rating.tooHard} hard` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Modules">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)]">
              <tr><Th label="Module" /><Th label="Lessons" align="right" /><Th label="Learners started" align="right" /><Th label="Finished" align="right" /><Th label="Avg. progress of starters" /></tr>
            </thead>
            <tbody>
              {modules.map(({ m, started, finished, avg }) => (
                <tr key={m.slug} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]">
                  <td className="px-3 py-2 min-w-[220px]"><Link to={`/module/${m.slug}`} className="text-[var(--color-heading)] hover:text-[var(--color-accent)]">{m.title}</Link></td>
                  <td className="px-3 py-2 font-mono text-right">{m.lessons.length}</td>
                  <td className="px-3 py-2 font-mono text-right">{started}</td>
                  <td className="px-3 py-2 font-mono text-right">{finished}</td>
                  <td className="px-3 py-2">{started ? <Meter value={avg} label={`${m.title} average progress`} /> : <span className="text-xs text-[var(--color-text-dim)]">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ContentTab({ data }: { data: AdminData }) {
  const learners = data.accounts.filter((a) => !a.isAnonymous);
  const tracks = useMemo(() => {
    const byTrack = new Map<RoadmapTrack, { stages: number; available: number; lessons: number; quizzes: number; withLab: number }>();
    for (const stage of ROADMAP) {
      const t = byTrack.get(stage.track) ?? { stages: 0, available: 0, lessons: 0, quizzes: 0, withLab: 0 };
      t.stages++;
      if (stage.status === 'available') t.available++;
      const module = stage.moduleSlug ? MODULES.find((m) => m.slug === stage.moduleSlug) : undefined;
      for (const lesson of module?.lessons ?? []) {
        t.lessons++;
        if (lesson.quiz?.length || lesson.questions?.length) t.quizzes++;
        if (lesson.labId || labsForLesson(lesson.id).length) t.withLab++;
      }
      byTrack.set(stage.track, t);
    }
    return [...byTrack.entries()];
  }, []);

  const categories = useMemo(() => LAB_CATEGORIES.map((c) => {
    const labs = LABS.filter((l) => l.scenario.category === c);
    return { c, labs: labs.length, flags: labs.reduce((s, l) => s + l.scenario.totalFlags, 0), easy: labs.filter((l) => l.scenario.difficulty === 'Easy').length, medium: labs.filter((l) => l.scenario.difficulty === 'Medium').length, hard: labs.filter((l) => l.scenario.difficulty === 'Hard').length };
  }).filter((x) => x.labs), []);

  const untouched = useMemo(() => LABS.filter((lab) => !learners.some((a) => (a.labFlags[lab.scenario.id]?.length ?? 0) > 0)), [learners]);
  const rated = new Set(data.ratings.map((r) => findLab(r.labId)?.scenario.id ?? r.labId));
  const unrated = LABS.filter((l) => !rated.has(l.scenario.id)).length;
  const lessons = TOTAL_LESSONS();
  const comingSoon = ROADMAP.filter((s) => s.status === 'coming-soon').length;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={`Modules · ${comingSoon} coming soon`} value={MODULES.length} icon={<IconChart className="w-5 h-5" />} />
        <StatCard label="Lessons" value={lessons} icon={<IconCheck className="w-5 h-5" />} color="var(--color-success)" />
        <StatCard label={`Labs · ${LABS.reduce((s, l) => s + l.scenario.totalFlags, 0)} flags`} value={LABS.length} icon={<IconFlag className="w-5 h-5" />} color="var(--color-gold)" />
        <StatCard label={`Labs never started · ${unrated} unrated`} value={untouched.length} icon={<IconLightning className="w-5 h-5" />} color="var(--color-warn)" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Learning paths">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)]"><tr><Th label="Track" /><Th label="Stages" align="right" /><Th label="Lessons" align="right" /><Th label="Checked" /><Th label="Linked lab" /></tr></thead>
              <tbody>
                {tracks.map(([track, t]) => (
                  <tr key={track} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-2 text-[var(--color-heading)] whitespace-nowrap">{TRACK_LABELS[track]}</td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap">{t.available}/{t.stages}</td>
                    <td className="px-3 py-2 font-mono text-right">{t.lessons}</td>
                    <td className="px-3 py-2"><Meter value={pct(t.quizzes, t.lessons)} label={`${TRACK_LABELS[track]} lessons with a quiz or questions`} /></td>
                    <td className="px-3 py-2"><Meter value={pct(t.withLab, t.lessons)} label={`${TRACK_LABELS[track]} lessons linked to a lab`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-dim)]">Stages: available / total. Checked: lessons with a quiz or typed questions.</p>
        </Panel>
        <Panel title="Labs by category">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)]"><tr><Th label="Category" /><Th label="Labs" align="right" /><Th label="Flags" align="right" /><Th label="Easy / Med / Hard" align="right" /></tr></thead>
              <tbody>
                {categories.map((x) => (
                  <tr key={x.c} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-1.5 text-[var(--color-heading)]">{x.c}</td>
                    <td className="px-3 py-1.5 font-mono text-right">{x.labs}</td>
                    <td className="px-3 py-1.5 font-mono text-right">{x.flags}</td>
                    <td className="px-3 py-1.5 font-mono text-right text-[var(--color-text-dim)]">{x.easy} / {x.medium} / {x.hard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <Panel title={`Labs no learner has started · ${untouched.length}`}>
        {untouched.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">Every lab has at least one learner.</p> : (
          <ul className="flex flex-wrap gap-2">
            {untouched.map((lab) => (
              <li key={lab.slug}><Link to={`/lab/${lab.slug}`} className="inline-block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">{lab.scenario.title}</Link></li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

interface ActivityEvent { at: number; kind: 'signup' | 'lab' | 'feedback' | 'comment'; who: string; text: string; href?: string }
const KIND_LABEL: Record<ActivityEvent['kind'], string> = { signup: 'Signup', lab: 'Lab completed', feedback: 'Feedback', comment: 'Comment' };
const KIND_COLOR: Record<ActivityEvent['kind'], string> = { signup: 'var(--color-gold)', lab: 'var(--color-success)', feedback: 'var(--color-accent)', comment: 'var(--color-accent-2)' };

function ActivityTab({ data }: { data: AdminData }) {
  const [kind, setKind] = useState<'all' | ActivityEvent['kind']>('all');
  const events = useMemo(() => {
    const out: ActivityEvent[] = [];
    const emailById = new Map(data.accounts.map((a) => [a.userId, a.fullName?.trim() || a.email]));
    for (const a of data.accounts) {
      if (a.isAnonymous) continue;
      const who = a.fullName?.trim() || a.email;
      out.push({ at: Date.parse(a.createdAt), kind: 'signup', who, text: 'created an account' });
      for (const [labId, at] of Object.entries(a.labCompletedAt)) {
        const lab = findLab(labId);
        out.push({ at: Number(at), kind: 'lab', who, text: lab?.scenario.title ?? labId, href: lab ? `/lab/${lab.slug}` : undefined });
      }
    }
    for (const f of data.feedback) out.push({ at: Date.parse(f.createdAt), kind: 'feedback', who: f.email ?? emailById.get(f.userId) ?? 'deleted account', text: `${f.category}: ${f.message}` });
    for (const c of data.comments) {
      const lab = findLab(c.labId);
      out.push({ at: Date.parse(c.createdAt), kind: 'comment', who: c.email ?? emailById.get(c.userId) ?? 'deleted account', text: `on ${lab?.scenario.title ?? c.labId}: ${c.message}`, href: lab ? `/lab/${lab.slug}` : undefined });
    }
    return out.filter((e) => Number.isFinite(e.at)).sort((a, b) => b.at - a.at);
  }, [data]);
  const shown = events.filter((e) => kind === 'all' || e.kind === kind).slice(0, 150);

  return (
    <Panel title="Recent activity" action={
      <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Filter activity" className={`${inputClass} py-1.5 text-xs`}>
        <option value="all">Everything</option><option value="signup">Signups</option><option value="lab">Lab completions</option><option value="feedback">Feedback</option><option value="comment">Comments</option>
      </select>
    }>
      {shown.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">Nothing yet.</p> : (
        <ol className="divide-y divide-[var(--color-border)]">
          {shown.map((e, i) => (
            <li key={i} className="flex gap-3 py-2.5 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[e.kind] }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--color-text-dim)]"><span className="font-semibold text-[var(--color-heading)]">{KIND_LABEL[e.kind]}</span> · {e.who}</div>
                <div className="truncate">{e.href ? <Link to={e.href} className="hover:text-[var(--color-accent)]">{e.text}</Link> : e.text}</div>
              </div>
              <time className="shrink-0 font-mono text-xs text-[var(--color-text-dim)]" dateTime={new Date(e.at).toISOString()} title={new Date(e.at).toLocaleString()}>{relTime(e.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function FeedbackTab({ data }: { data: AdminData }) {
  const [category, setCategory] = useState<'all' | AdminFeedback['category']>('all');
  const feedback = data.feedback.filter((f) => category === 'all' || f.category === category);
  const counts = (c: AdminFeedback['category']) => data.feedback.filter((f) => f.category === c).length;
  const exportCsv = () => downloadCsv(`darkworld-feedback-${localDay(new Date())}.csv`, toCsv(
    ['created_at', 'category', 'email', 'page', 'message'], feedback.map((f) => [f.createdAt, f.category, f.email, f.pagePath, f.message]),
  ));
  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-4 items-start">
      <Panel title={`Feedback · ${feedback.length}`} action={<button type="button" className={smallButton} onClick={exportCsv}><IconDownload className="w-3.5 h-3.5" />Export CSV</button>}>
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter feedback by category">
          {(['all', 'bug', 'suggestion', 'content', 'other'] as const).map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${category === c ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}>
              {c}{c !== 'all' && ` · ${counts(c)}`}
            </button>
          ))}
        </div>
        {feedback.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">No feedback in this category.</p> : (
          <ul className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-xl border border-[var(--color-border)] p-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-dim)] mb-1.5">
                  <span className={`rounded px-1.5 py-0.5 font-bold uppercase tracking-wide ${f.category === 'bug' ? 'text-[var(--color-danger)]' : 'text-[var(--color-gold)]'}`}>{f.category}</span>
                  <span className="truncate">{f.email ?? 'deleted account'}</span>
                  {f.pagePath && <span className="font-mono truncate">{f.pagePath}</span>}
                  <time className="ml-auto font-mono" dateTime={f.createdAt}>{new Date(f.createdAt).toLocaleString()}</time>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={`Lab comments · ${data.comments.length}`}>
        {data.comments.length === 0 ? <p className="text-sm text-[var(--color-text-dim)]">No comments yet.</p> : (
          <ul className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {data.comments.map((c) => {
              const lab = findLab(c.labId);
              return (
                <li key={c.id} className="rounded-xl border border-[var(--color-border)] p-3.5">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-dim)] mb-1.5">
                    {lab ? <Link to={`/lab/${lab.slug}`} className="font-semibold text-[var(--color-heading)] hover:text-[var(--color-accent)] truncate">{lab.scenario.title}</Link> : <span className="font-mono">{c.labId}</span>}
                    <time className="ml-auto font-mono shrink-0" dateTime={c.createdAt}>{relTime(Date.parse(c.createdAt))}</time>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{c.message}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-dim)] truncate">{c.email ?? 'deleted account'}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analyst', label: 'Analyst' },
  { id: 'users', label: 'Users' },
  { id: 'progress', label: 'Progress' },
  { id: 'content', label: 'Content' },
  { id: 'activity', label: 'Activity' },
  { id: 'feedback', label: 'Feedback' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<AdminLoadError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [tab, setTab] = useState<TabId>(() => {
    try { const saved = sessionStorage.getItem('dw-admin-tab'); return (TABS.some((t) => t.id === saved) ? saved : 'overview') as TabId; } catch { return 'overview'; }
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAdminData()
      .then((result) => { if (active) { setData(result); setError(null); setBackgroundFailed(false); } })
      .catch((e: unknown) => { if (active) setError(e instanceof AdminLoadError ? e : new AdminLoadError(String(e), 'network')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  // Live: refresh quietly every minute while the tab is visible, keeping the current data on screen.
  useEffect(() => {
    if (!data) return;
    let active = true;
    const tick = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      fetchAdminData()
        .then((result) => { if (active) { setData(result); setBackgroundFailed(false); } })
        .catch(() => { if (active) setBackgroundFailed(true); });
    };
    const timer = window.setInterval(tick, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible' && Date.now() - data.loadedAt.getTime() > 60_000) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [data]);

  const selectTab = (id: TabId) => {
    setTab(id);
    try { sessionStorage.setItem('dw-admin-tab', id); } catch { /* storage unavailable */ }
  };

  const learners = useMemo(() => (data?.accounts ?? []).map(toLearnerRow), [data]);
  const newFeedback = data ? data.feedback.filter((f) => Date.now() - Date.parse(f.createdAt) < 7 * DAY).length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="gold-eyebrow mb-2">// operations</div>
          <h1 className="text-3xl font-bold text-[var(--color-heading)]">Admin Dashboard</h1>
          {data && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${backgroundFailed ? 'bg-[var(--color-warn)]' : 'bg-[var(--color-success)] animate-pulse motion-reduce:animate-none'}`} />
              {backgroundFailed ? 'Live refresh paused' : 'Live'} · read-only · updated {data.loadedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button type="button" className={smallButton} disabled={loading} onClick={() => setReloadKey((k) => k + 1)}>
          <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />{loading ? 'Loading' : 'Refresh'}
        </button>
      </div>

      <div role="tablist" aria-label="Admin sections" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[var(--color-border)] mb-6">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" id={`admin-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="admin-panel"
            onClick={() => selectTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t.id ? 'border-[var(--color-accent)] text-[var(--color-heading)]' : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'}`}>
            {t.label}
            {t.id === 'feedback' && newFeedback > 0 && <span className="ml-1.5 rounded-full bg-[var(--color-gold)] px-1.5 text-[11px] font-bold text-[var(--color-navy)]">{newFeedback}</span>}
          </button>
        ))}
      </div>

      {!data && loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" aria-hidden="true">{[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-[4.5rem]" />)}</div>
          <SkeletonList count={4} />
        </>
      )}

      {error && !loading && !data && (
        <section className="premium-card rounded-2xl p-8 mb-6" role="alert">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-2">
            {error.kind === 'denied' ? 'Admin access required' : error.kind === 'missing' ? 'Admin data is not set up yet' : navigator.onLine ? 'Admin data is unavailable' : 'Connect to load admin data'}
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-5">
            {error.kind === 'denied' ? 'The server did not accept this account as an admin. Sign out and sign in again with an admin account.'
              : error.kind === 'missing' ? 'Apply supabase/migrations/0015_admin_dashboard.sql in the Supabase SQL editor, then refresh.'
              : 'We could not load the latest data. Try again in a moment.'}
          </p>
          <button type="button" className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </section>
      )}

      {data && (
        <div id="admin-panel" role="tabpanel" aria-labelledby={`admin-tab-${tab}`}>
          {tab === 'overview' && <OverviewTab data={data} learners={learners} />}
          <div hidden={tab !== 'analyst'}><AdminAnalystPanel data={data} /></div>
          {tab === 'users' && <UsersTab learners={learners} />}
          {tab === 'progress' && <ProgressTab data={data} />}
          {tab === 'content' && <ContentTab data={data} />}
          {tab === 'activity' && <ActivityTab data={data} />}
          {tab === 'feedback' && <FeedbackTab data={data} />}
        </div>
      )}

      <p className="mt-8 flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
        <IconMessage className="w-3.5 h-3.5" aria-hidden="true" />
        Learner data shown here is personal information. Do not share exports outside the DarkWorld team.
      </p>
    </div>
  );
}
