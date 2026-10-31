import './lesson-lab-card.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Terminal from '../terminal/Terminal';
import StepChecklist from './StepChecklist';
import ShareWriteupModal from '../labs/ShareWriteupModal';
import { useProgress } from '../../state/progressStore';
import { findLab } from '../../data/labs';
import { IconFlask, IconFlag, IconCheck, IconExternal } from '../layout/icons';

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
    <div className="lesson-lab-card my-5 rounded-xl overflow-hidden shadow-sm">
      <div
        className="lesson-lab-card__header relative overflow-hidden px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="relative flex items-start gap-3 min-w-0">
          <span className="lesson-lab-card__icon w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <IconFlask className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`lesson-lab-card__difficulty lesson-lab-card__difficulty--${scenario.difficulty.toLowerCase()} pill ${DIFFICULTY_CLASS[scenario.difficulty]}`}>{scenario.difficulty}</span>
              {done && (
                <span className="lesson-lab-card__solved pill flex items-center gap-1">
                  <IconCheck className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
            <div className="lesson-lab-card__title font-semibold text-sm">{scenario.title}</div>
            <div className="lesson-lab-card__description text-xs">
              Solve it in the terminal below to reveal the flag — {captured}/{scenario.totalFlags} captured
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <Link
            to={`/lab/${entry.slug}`}
            className="lesson-lab-card__secondary flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <IconExternal className="w-3.5 h-3.5" />
            {scenario.webApplication || scenario.directoryMap ? 'Open visual workspace' : 'Full screen'}
          </Link>
          {done && (
            <button
              onClick={() => setSharing(true)}
              className="lesson-lab-card__secondary px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Share this win
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lesson-lab-card__toggle flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <span className="lesson-lab-card__toggle-symbol w-5 h-5 rounded-md flex items-center justify-center">
              <IconFlag className="w-3 h-3" />
            </span>
            {open ? 'Close lab' : 'Open the lab'} &rarr;
          </button>
        </div>
      </div>
      {open && (
        <div className="bg-[var(--color-surface)]">
          <div className="p-4 border-b border-[var(--color-border)]">
            <StepChecklist steps={scenario.objectives} title="Follow these steps" />
          </div>
          <div className="bg-[var(--chrome-bg)] p-4 h-[420px]">
            <Terminal scenario={scenario} onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag, scenario.totalFlags)} />
          </div>
        </div>
      )}
      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </div>
  );
}
