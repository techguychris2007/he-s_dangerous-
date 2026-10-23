import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROADMAP, findModule } from '../data/curriculum';
import { LABS } from '../data/labs';
import { SIEM_LABS } from '../labs/siemScenarios';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import './learning-pages.css';
import AcademyHero from '../components/common/AcademyHero';
import LessonPath from '../components/learning/LessonPath';
import type { CharacterId } from '../data/characters';
import DifficultyPill from '../components/common/DifficultyPill';
import {
  IconCheck,
  IconRoute,
  IconRefresh,
  IconBookmark,
  IconFlask,
} from '../components/layout/icons';
import type { RoadmapStage, RoadmapTrack } from '../types';

const PRACTICE_LABS = [
  ...LABS.map(lab => ({ ...lab, href: '/lab/' + lab.slug })),
  ...[...SIEM_LABS, ...OSINT_LABS].map(lab => ({ slug: lab.id, href: '/siem-lab/' + lab.id, scenario: { id: lab.id, title: lab.title, difficulty: lab.difficulty, category: lab.tool } })),
];

type TabId = 'current' | 'recent' | 'saved';

const TABS: { id: TabId; label: string; icon: (p: { className?: string }) => ReactNode }[] = [
  { id: 'current', label: 'Current', icon: IconRoute },
  { id: 'recent', label: 'Recent', icon: IconRefresh },
  { id: 'saved', label: 'Saved', icon: (p) => <IconBookmark {...p} /> },
];

interface StageInfo {
  stage: RoadmapStage;
  mod: ReturnType<typeof findModule>;
  totalLessons: number;
  doneLessons: number;
  complete: boolean;
}

function CurrentPathTab({ track }: { track: RoadmapTrack }) {
  const progress = useProgress();
  const stages = ROADMAP.filter((s) => s.track === track);

  const stageInfo: StageInfo[] = stages.map((stage) => {
    const mod = stage.moduleSlug ? findModule(stage.moduleSlug) : undefined;
    const totalLessons = mod?.lessons.length ?? 0;
    const doneLessons = mod ? mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length : 0;
    const complete = mod ? totalLessons > 0 && doneLessons === totalLessons : false;
    return { stage, mod, totalLessons, doneLessons, complete };
  });

  const currentIndex = stageInfo.findIndex((s) => s.mod && !s.complete);
  const allDone = currentIndex === -1;
  const modulesTotal = stageInfo.filter((s) => s.mod).length;
  const modulesDone = stageInfo.filter((s) => s.complete).length;
  const lessonsTotal = stageInfo.reduce((sum, s) => sum + s.totalLessons, 0);
  const lessonsDone = stageInfo.reduce((sum, s) => sum + s.doneLessons, 0);


  const trackName: Record<string, string> = { presecurity: 'Pre-security', security: 'Offensive security', defensive: 'Defensive security', programming: 'Programming', software: 'Software engineering' };
  const trackGuide: Record<string, CharacterId> = { presecurity: 'byte', security: 'vex', defensive: 'sentinel', programming: 'cipher', software: 'cipher' };

  return (
    <>
      {allDone && (
        <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 mb-6 text-sm text-[var(--color-success)] font-semibold">
          You've completed the lessons on this path. Revisit any module below, or head to the{' '}
          <Link to="/labs" className="underline">rooms</Link>{' '}
          for more practice.
        </div>
      )}
      <LessonPath
        eyebrow={`Learning path · ${modulesDone}/${modulesTotal} modules · ${lessonsDone}/${lessonsTotal} lessons`}
        title={trackName[track] ?? 'Learning path'}
        guide={trackGuide[track]}
        nodes={stageInfo.map((info, i) => ({
          id: info.stage.title,
          title: info.mod?.title ?? info.stage.title,
          to: info.mod ? `/module/${info.mod.slug}` : info.stage.href,
          state: info.complete ? 'done' : i === currentIndex ? 'current' : 'open',
          percent: i === currentIndex && info.totalLessons ? (info.doneLessons / info.totalLessons) * 100 : undefined,
          icon: info.mod?.icon,
          meta: info.mod ? `Module ${i + 1} · ${info.doneLessons}/${info.totalLessons} lessons` : 'Practice',
        }))}
      />
    </>
  );
}

function EmptyState({ icon, text, cta, to }: { icon: ReactNode; text: string; cta: string; to: string }) {
  return (
    <div className="premium-card rounded-2xl border-dashed p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-dim)] flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <div className="text-sm text-[var(--color-text-dim)] mb-3">{text}</div>
      <Link to={to} className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
        {cta} &rarr;
      </Link>
    </div>
  );
}

function RecentTab() {
  const progress = useProgress();
  const recent = PRACTICE_LABS.filter((l) => progress.labCompletedAt[l.scenario.id])
    .sort((a, b) => progress.labCompletedAt[b.scenario.id] - progress.labCompletedAt[a.scenario.id])
    .slice(0, 10);

  if (recent.length === 0) {
    return (
      <EmptyState
        icon={<IconFlask className="w-5 h-5" />}
        text="No labs completed yet — recently finished labs will show up here."
        cta="Browse the lab catalog"
        to="/labs"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {recent.map((l) => (
        <Link
          key={l.slug}
          to={l.href}
          className="flex items-center justify-between gap-3 premium-card rounded-2xl px-4 py-3 hover:border-[var(--color-accent)]/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center justify-center shrink-0">
              <IconCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--color-heading)] truncate">{l.scenario.title}</div>
              <div className="text-2xs text-[var(--color-text-dim)]">
                {new Date(progress.labCompletedAt[l.scenario.id]).toLocaleDateString()}
              </div>
            </div>
          </div>
          <DifficultyPill difficulty={l.scenario.difficulty} className="shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function SavedTab() {
  const progress = useProgress();
  const saved = PRACTICE_LABS.filter((l) => progress.isBookmarked(l.scenario.id));

  if (saved.length === 0) {
    return (
      <EmptyState
        icon={<IconBookmark className="w-5 h-5" />}
        text="Nothing saved yet — bookmark a lab from its page to find it here later."
        cta="Browse the lab catalog"
        to="/labs"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {saved.map((l) => (
        <div
          key={l.slug}
          className="flex items-center justify-between gap-3 premium-card rounded-2xl px-4 py-3"
        >
          <Link to={l.href} className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <IconFlask className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--color-heading)] truncate">{l.scenario.title}</div>
              <div className="text-2xs text-[var(--color-text-dim)] capitalize">{l.scenario.category}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <DifficultyPill difficulty={l.scenario.difficulty} />
            <button
              onClick={() => progress.toggleBookmark(l.scenario.id)}
              title="Remove from saved"
              aria-label="Remove from saved"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-gold-dim)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <IconBookmark className="w-4 h-4" filled />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyLearningPage() {
  const [tab, setTab] = useState<TabId>('current');
  const [params, setParams] = useSearchParams();
  const paths = [['presecurity', 'Pre-security'], ['security', 'Offensive security'], ['defensive', 'Defensive security'], ['programming', 'Programming'], ['software', 'Software engineering']] as const;
  const track = paths.find(([id]) => id === params.get('track'))?.[0] ?? 'presecurity';
  const progress = useProgress();
  const modules = ROADMAP.filter(stage => stage.track === track).map(stage => findModule(stage.moduleSlug)).filter(mod => mod !== undefined);
  const next = modules.find(mod => mod.lessons.some(lesson => !progress.isLessonComplete(lesson.id)));
  const lessons = modules.flatMap(mod => mod.lessons);
  const done = lessons.filter(lesson => progress.isLessonComplete(lesson.id)).length;

  return (
    <div className="relative">

      <div className="learning-page mx-auto max-w-6xl px-4 sm:px-7 py-8 sm:py-12">
        <AcademyHero guide="sentinel" eyebrow="Your personal workspace" title="My Learning" description="A little focused practice goes a long way. Continue your chapter, revisit your work, or find a new skill to build."
          stats={[{label: 'Current path', value: paths.find(([id]) => id === track)?.[1] ?? ''}, {label: 'Lessons complete', value: done + ' / ' + lessons.length}]}
          action={{title: next?.title ?? 'Your next challenge awaits', detail: next?.description ?? 'Explore practical labs and put your knowledge to work.', to: next ? '/module/' + next.slug : '/labs', label: next ? 'Continue your chapter' : 'Find a practice lab'}} />
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[var(--color-border)] mb-6 sm:mb-8 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`relative flex items-center gap-1.5 pb-3 text-sm font-semibold transition-colors ${
                  tab === t.id ? 'text-[var(--color-heading)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--color-accent)]" />}
              </button>
            );
          })}
        </div>

        {tab === 'current' && <><label className="mb-5 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-dim)]">Learning path<select aria-label="Current learning path" value={track} onChange={event => setParams({ track: event.target.value })} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-heading)]">{paths.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><CurrentPathTab track={track} /></>}
        {tab === 'recent' && <RecentTab />}
        {tab === 'saved' && <SavedTab />}
      </div>
    </div>
  );
}
