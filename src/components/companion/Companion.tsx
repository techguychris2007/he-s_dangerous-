import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../state/progressStore';
import { LABS, LABS_IN_ROADMAP_ORDER, type LabEntry } from '../../data/labs';
import { computeSpeedTier, buildCongratsMessage, pickEncouragement, type SpeedTier } from '../../data/companionMessages';
import { pickHackerLegend } from '../../data/hackerLegends';
import { IconFlag, IconLightning } from '../layout/icons';

function isDone(progress: ReturnType<typeof useProgress>, lab: LabEntry): boolean {
  return progress.flagCount(lab.scenario.id) >= lab.scenario.totalFlags;
}

function findNextLab(progress: ReturnType<typeof useProgress>, justCompletedId: string): LabEntry | null {
  const idx = LABS_IN_ROADMAP_ORDER.findIndex((l) => l.scenario.id === justCompletedId);
  const rest = idx >= 0 ? LABS_IN_ROADMAP_ORDER.slice(idx + 1) : LABS_IN_ROADMAP_ORDER;
  return rest.find((l) => !isDone(progress, l)) ?? LABS_IN_ROADMAP_ORDER.find((l) => !isDone(progress, l)) ?? null;
}

interface Toast {
  lab: LabEntry;
  headline: string;
  isMilestone: boolean;
  tier: SpeedTier;
  legendLine: string | null;
  encouragement: string;
  nextLab: LabEntry | null;
}

/** ECHO — the platform's mentor persona. Mounted once globally; watches progress for any lab that just
 *  flipped from incomplete to complete (regardless of which page triggered it) and surfaces a congratulations
 *  toast with pacing-based flavor and a "next lab on your roadmap" nudge. */
export default function Companion() {
  const progress = useProgress();
  const navigate = useNavigate();
  const prevCompletedIds = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentCompleted = new Set(LABS.filter((l) => isDone(progress, l)).map((l) => l.scenario.id));

    if (prevCompletedIds.current === null) {
      // first mount / first render after a full reload — never show a celebration toast for something
      // the learner may have actually finished hours or days ago, BUT still record completion for
      // anything already done: markLabCompleted is the only place labCompletedAt is ever written, so
      // a lab that crossed its flag threshold while the app wasn't open (e.g. a multi-lab remote
      // merge on a fresh device) would otherwise silently never get recorded on this device at all —
      // it's already a guarded no-op for anything that's genuinely already recorded.
      for (const id of currentCompleted) progress.markLabCompleted(id);
      prevCompletedIds.current = currentCompleted;
      return;
    }

    const newlyDone = [...currentCompleted].filter((id) => !prevCompletedIds.current!.has(id));
    prevCompletedIds.current = currentCompleted;
    if (newlyDone.length === 0) return;

    // Record completion for every lab that just crossed the finish line in this update, not just the
    // one the toast below celebrates — labCompletedAt is what the "N labs completed" achievements key
    // off, and prevCompletedIds has already advanced past all of them above, so any lab left out here
    // could never trigger this again on a later render.
    for (const id of newlyDone) progress.markLabCompleted(id);

    const lab = LABS.find((l) => l.scenario.id === newlyDone[0]);
    if (!lab) return;

    const now = Date.now();
    const otherTimestamps = Object.entries(progress.labCompletedAt)
      .filter(([id]) => id !== lab.scenario.id)
      .map(([, t]) => t);
    const prevCompletedAt = otherTimestamps.length ? Math.max(...otherTimestamps) : null;
    const tier = computeSpeedTier(prevCompletedAt, now);

    const totalCompleted = currentCompleted.size;
    const seed = totalCompleted + lab.scenario.id.length;
    const { headline, isMilestone } = buildCongratsMessage(tier, totalCompleted, seed);
    const legendLine = tier === 'lightning' || (tier === 'swift' && totalCompleted % 3 === 0) ? (() => {
      const legend = pickHackerLegend(totalCompleted);
      return `You're moving at the pace of ${legend.name} — who ${legend.blurb}.`;
    })() : null;

    setToast({
      lab,
      headline,
      isMilestone,
      tier,
      legendLine,
      encouragement: pickEncouragement(seed + 1),
      nextLab: findNextLab(progress, lab.scenario.id),
    });

    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToast(null), 12000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-[26rem] z-50">
      <div
        className="rounded-xl border shadow-lg p-4 flex items-start gap-3 bg-[var(--color-surface)]"
        style={{ borderColor: 'var(--color-accent)' }}
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))' }}
        >
          E
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-[var(--color-heading)] text-sm">ECHO</span>
            <span className="text-2xs font-mono uppercase tracking-wide text-[var(--color-text-dim)]">mentor</span>
            {toast.isMilestone && (
              <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent-dim)] text-2xs">Milestone</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] mb-1.5">
            <IconFlag className="w-3 h-3 text-[var(--color-success)]" />
            <span className="truncate">{toast.lab.scenario.title} — complete</span>
          </div>
          <p className="text-sm text-[var(--color-heading)] leading-relaxed mb-2">{toast.headline}</p>
          {toast.legendLine && (
            <p className="flex items-start gap-1.5 text-xs text-[var(--color-accent-dim)] leading-relaxed mb-2">
              <IconLightning className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{toast.legendLine}</span>
            </p>
          )}
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">{toast.encouragement}</p>
          <div className="flex items-center gap-2">
            {toast.nextLab && (
              <button
                onClick={() => {
                  setToast(null);
                  navigate(`/lab/${toast.nextLab!.slug}`);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 transition"
              >
                Next lab &rarr;
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
            >
              Keep going
            </button>
          </div>
        </div>
        <button
          onClick={() => setToast(null)}
          aria-label="Dismiss"
          className="text-[var(--color-text-dim)] hover:text-[var(--color-heading)] text-lg leading-none shrink-0"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
