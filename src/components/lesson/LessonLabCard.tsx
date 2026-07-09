import { useState } from 'react';
import { Link } from 'react-router-dom';
import Terminal from '../terminal/Terminal';
import StepChecklist from './StepChecklist';
import ShareWriteupModal from '../labs/ShareWriteupModal';
import { useProgress } from '../../state/progressStore';
import { findLab } from '../../data/labs';
import { IconFlask, IconFlag, IconCheck } from '../layout/icons';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  Medium: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]',
  Hard: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
};

export default function LessonLabCard({ labSlug }: { labSlug: string }) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const progress = useProgress();
  const entry = findLab(labSlug);
  if (!entry) return null;
  const { scenario } = entry;
  const captured = progress.flagCount(scenario.id);
  const done = captured >= scenario.totalFlags;

  return (
    <div className="my-5 rounded-xl overflow-hidden border border-[var(--color-navy)]/20">
      <div className="bg-[var(--color-navy)] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
            <IconFlask className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`pill ${DIFFICULTY_CLASS[scenario.difficulty]}`}>{scenario.difficulty}</span>
              {done && (
                <span className="pill bg-white/15 text-white flex items-center gap-1">
                  <IconCheck className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
            <div className="font-semibold text-white text-sm truncate">{scenario.title}</div>
            <div className="text-xs text-white/60">
              Solve it in the terminal below to reveal the flag — {captured}/{scenario.totalFlags} captured
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/lab/${scenario.id}`}
            className="text-xs text-white/70 hover:text-white underline underline-offset-2"
          >
            Open full screen
          </Link>
          {done && (
            <button
              onClick={() => setSharing(true)}
              className="px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
            >
              Share this win
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
          >
            <IconFlag className="w-3.5 h-3.5" />
            {open ? 'Close lab' : 'Open the lab'} &rarr;
          </button>
        </div>
      </div>
      {open && (
        <div className="bg-[var(--color-surface)]">
          <div className="p-4 border-b border-[var(--color-border)]">
            <StepChecklist steps={scenario.objectives} title="Follow these steps" />
          </div>
          <div className="bg-[#0d1420] p-4 h-[420px]">
            <Terminal scenario={scenario} onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag)} />
          </div>
        </div>
      )}
      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </div>
  );
}
