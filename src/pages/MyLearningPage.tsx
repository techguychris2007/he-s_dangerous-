import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROADMAP, findModule } from '../data/curriculum';
import { LABS } from '../data/labs';
import { useProgress } from '../state/progressStore';
import ModuleBanner from '../components/layout/ModuleBanner';
import DifficultyPill from '../components/common/DifficultyPill';
import {
  ModuleIcon,
  IconCheck,
  IconCrosshair,
  IconChest,
  IconRoute,
  IconRefresh,
  IconBookmark,
  IconFlask,
  IconArrowRight,
} from '../components/layout/icons';
import type { RoadmapStage } from '../types';

type TabId = 'current' | 'recent' | 'saved';

const TABS: { id: TabId; label: string; icon: (p: { className?: string }) => ReactNode }[] = [
  { id: 'current', label: 'Current', icon: IconRoute },
  { id: 'recent', label: 'Recent', icon: IconRefresh },
  { id: 'saved', label: 'Saved', icon: (p) => <IconBookmark {...p} /> },
];

/** A loose, decorative wave connecting each stop — deliberately not pixel-locked to card centers
 *  (the stack's real height comes from flex layout, not this SVG), same spirit as the reference
 *  design's winding path. Purely ambient background art. */
function buildWavePath(stops: number): string {
  if (stops <= 0) return '';
  let d = 'M50,0 ';
  for (let i = 0; i < stops; i++) {
    const cx = i % 2 === 0 ? 78 : 22;
    const yTop = i * 100;
    d += `C ${cx},${yTop + 25} ${cx},${yTop + 75} 50,${yTop + 100} `;
  }
  return d.trim();
}

function BinaryDecoration({ className }: { className: string }) {
  const lines = ['0101101', '111011001101', '—', '1010111', '0111101', '10010101', '—', '00001001', '01101'];
  return (
    <div
      aria-hidden="true"
      className={`hidden 2xl:block absolute select-none pointer-events-none font-mono text-[10px] leading-[1.5] text-[var(--color-text-dim)] opacity-40 ${className}`}
    >
      {lines.map((line, i) =>
        line === '—' ? <div key={i} className="my-1.5 h-px w-8 bg-[var(--color-border)]" /> : <div key={i}>{line}</div>,
      )}
    </div>
  );
}

function FloatingGlyph({ icon, className, slow }: { icon: string; className: string; slow?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`hidden 2xl:flex absolute w-16 h-16 rounded-2xl items-center justify-center bg-[var(--color-accent)]/5 text-[var(--color-accent)]/25 ${
        slow ? 'my-learning-float-slow' : 'my-learning-float'
      } ${className}`}
    >
      <ModuleIcon icon={icon} className="w-8 h-8" />
    </div>
  );
}

interface StageInfo {
  stage: RoadmapStage;
  mod: ReturnType<typeof findModule>;
  totalLessons: number;
  doneLessons: number;
  complete: boolean;
}

function BonusChestCard({ stage, align }: { stage: RoadmapStage; align: 'left' | 'right' }) {
  return (
    <div className={`relative w-[88%] ${align === 'left' ? 'mr-auto' : 'ml-auto'}`}>
      <Link
        to={stage.href ?? '/labs'}
        className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)] px-4 py-4 hover:border-[var(--color-gold)] transition-colors"
      >
        <span className="w-14 h-14 rounded-2xl bg-[var(--color-gold)]/20 flex items-center justify-center text-[var(--color-gold-dim)] shrink-0 my-learning-float">
          <IconChest className="w-7 h-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-gold-dim)] mb-0.5">
            Bonus stop
          </div>
          <div className="font-extrabold text-[var(--color-heading)] text-sm leading-tight">{stage.title}</div>
          <div className="text-2xs text-[var(--color-text-dim)] mt-0.5">A matching guided lab for every module above.</div>
        </div>
        <IconArrowRight className="w-4 h-4 text-[var(--color-gold-dim)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  );
}

function PathStopCard({
  index,
  info,
  isHere,
  align,
}: {
  index: number;
  info: StageInfo;
  isHere: boolean;
  align: 'left' | 'right';
}) {
  const { stage, mod, doneLessons, totalLessons, complete } = info;
  if (!mod) return <BonusChestCard stage={stage} align={align} />;

  return (
    <div className={`relative w-[88%] ${align === 'left' ? 'mr-auto' : 'ml-auto'}`}>
      <Link
        to={`/module/${mod.slug}`}
        className="group block rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] hover:border-[var(--color-accent)]/50 transition-colors"
      >
        <div className="relative h-32">
          <ModuleBanner icon={mod.icon} moduleId={mod.slug} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <div className="text-2xs font-mono font-bold uppercase tracking-widest text-white/75 mb-0.5">
              Stop {index + 1}
            </div>
            <div className="font-extrabold text-white text-base leading-tight drop-shadow-sm">{stage.title}</div>
          </div>
          <div
            className={`absolute top-3 right-3 w-9 h-9 rounded-full border-2 flex items-center justify-center text-2xs font-bold ${
              complete
                ? 'bg-[var(--color-success)] border-white/80 text-white'
                : isHere
                ? 'bg-[var(--color-accent)] border-white/80 text-white here-pulse-ring'
                : 'bg-white/15 border-white/40 text-white backdrop-blur-sm'
            }`}
          >
            {complete ? <IconCheck className="w-4 h-4" /> : isHere ? <IconCrosshair className="w-4 h-4" /> : index + 1}
          </div>
        </div>
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <span className="text-2xs text-[var(--color-text-dim)] font-mono">
            {totalLessons > 0 ? `${doneLessons}/${totalLessons} lessons` : 'Guided practice'}
          </span>
          {isHere && <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)]">Continue</span>}
          {complete && <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)]">Complete</span>}
        </div>
      </Link>
    </div>
  );
}

function CompletedStrip({ items }: { items: StageInfo[] }) {
  const withModules = items.filter((i) => i.mod);
  if (withModules.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <span className="text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)] shrink-0">
        Already done
      </span>
      {withModules.map((info) => (
        <Link
          key={info.stage.title}
          to={`/module/${info.mod!.slug}`}
          title={info.stage.title}
          className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center justify-center hover:bg-[var(--color-success)]/25 transition-colors"
        >
          <ModuleIcon icon={info.mod!.icon} className="w-4 h-4" />
        </Link>
      ))}
    </div>
  );
}

function CurrentPathTab() {
  const progress = useProgress();
  const stages = ROADMAP.filter((s) => s.track === 'security');

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

  const windowStart = allDone ? Math.max(0, stageInfo.length - 4) : Math.max(0, currentIndex - 1);
  const windowEnd = Math.min(stageInfo.length, windowStart + 5);
  const before = stageInfo.slice(0, windowStart);
  const windowed = stageInfo.slice(windowStart, windowEnd);
  const after = stageInfo.slice(windowEnd);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-lg font-bold text-[var(--color-heading)]">
            {modulesDone}/{modulesTotal}
          </div>
          <div className="text-2xs text-[var(--color-text-dim)] uppercase tracking-wide">Modules complete</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-lg font-bold text-[var(--color-heading)]">
            {lessonsDone}/{lessonsTotal}
          </div>
          <div className="text-2xs text-[var(--color-text-dim)] uppercase tracking-wide">Lessons complete</div>
        </div>
      </div>

      {allDone && (
        <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 mb-6 text-sm text-[var(--color-success)] font-semibold">
          You've cleared every stop on the Offensive Security path. Nice work — revisit any stop below, or head to the{' '}
          <Link to="/labs" className="underline">
            lab catalog
          </Link>{' '}
          for more practice.
        </div>
      )}

      <CompletedStrip items={before} />

      <div className="relative">
        <svg
          viewBox={`0 0 100 ${windowed.length * 100}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <path
            d={buildWavePath(windowed.length)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeDasharray="1 7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex flex-col gap-6 relative z-10">
          {windowed.map((info, i) => (
            <PathStopCard
              key={info.stage.title}
              index={windowStart + i}
              info={info}
              isHere={windowStart + i === currentIndex}
              align={i % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      </div>

      {after.length > 0 && (
        <Link
          to="/roadmap"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline"
        >
          {after.length} more stop{after.length === 1 ? '' : 's'} on the full path <IconArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </>
  );
}

function EmptyState({ icon, text, cta, to }: { icon: ReactNode; text: string; cta: string; to: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
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
  const recent = LABS.filter((l) => progress.labCompletedAt[l.scenario.id])
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
          to={`/lab/${l.slug}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-accent)]/50 transition-colors"
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
  const saved = LABS.filter((l) => progress.isBookmarked(l.scenario.id));

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
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <Link to={`/lab/${l.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
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

  return (
    <div className="relative">
      <BinaryDecoration className="left-3 top-24" />
      <BinaryDecoration className="right-3 top-[38rem]" />
      <FloatingGlyph icon="shield" className="left-6 top-8" />
      <FloatingGlyph icon="terminal" className="right-6 top-[26rem]" slow />

      <div className="max-w-3xl mx-auto px-8 py-14 relative z-10">
        <div className="gold-eyebrow mb-2">// my learning</div>
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2">My Learning</h1>
        <p className="text-[var(--color-text-dim)] mb-6 leading-relaxed max-w-2xl">
          Your Offensive Security path, a few stops at a time — plus the labs you've recently finished and saved for
          later.
        </p>

        <div className="flex items-center gap-6 border-b border-[var(--color-border)] mb-8">
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

        {tab === 'current' && <CurrentPathTab />}
        {tab === 'recent' && <RecentTab />}
        {tab === 'saved' && <SavedTab />}
      </div>
    </div>
  );
}
