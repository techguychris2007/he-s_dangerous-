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
    <div className="my-5 rounded-xl overflow-hidden border border-[var(--color-accent)]/20 shadow-sm">
      <div
        className="relative overflow-hidden px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-2) 130%)' }}
      >
        {/* soft decorative glow, purely cosmetic */}
        <div
          aria-hidden
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"
        />

        <div className="relative flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
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
            <div className="text-xs text-white/70">
              Solve it in the terminal below to reveal the flag — {captured}/{scenario.totalFlags} captured
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <Link
            to={`/lab/${scenario.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IconExternal className="w-3.5 h-3.5" />
            Full screen
          </Link>
          {done && (
            <button
              onClick={() => setSharing(true)}
              className="px-3.5 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              Share this win
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 pl-2 pr-4 py-2 rounded-full bg-white text-blue-600 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-150"
          >
            <span className="w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center">
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
          <div className="bg-[#0d1420] p-4 h-[420px]">
            <Terminal scenario={scenario} onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag)} />
          </div>
        </div>
      )}
      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </div>
  );
}
