import { useMemo, useState } from 'react';
import type { LabEntry } from '../../data/labs';
import { buildLabWriteup } from '../../lib/labWriteup';
import { useProgress } from '../../state/progressStore';
import { LABS, MODULE_TO_LAB_CATEGORY } from '../../data/labs';
import { findModule } from '../../data/curriculum';
import { IconCheck } from '../layout/icons';

const MODULE_SLUG_FOR_CATEGORY = Object.fromEntries(
  Object.entries(MODULE_TO_LAB_CATEGORY).map(([slug, category]) => [category, slug]),
);

type Tab = 'linkedin' | 'twitter' | 'markdown';

const TABS: { key: Tab; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'markdown', label: 'Markdown (blog/README)' },
];

export default function ShareWriteupModal({ entry, onClose }: { entry: LabEntry; onClose: () => void }) {
  const progress = useProgress();
  const [tab, setTab] = useState<Tab>('linkedin');
  const [copied, setCopied] = useState(false);

  const moduleForLab = findModule(MODULE_SLUG_FOR_CATEGORY[entry.scenario.category]);

  const labsCompletedTotal = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;

  const writeup = useMemo(
    () =>
      buildLabWriteup(entry, {
        learnerName: progress.learnerName,
        labsCompletedTotal,
        moduleTitle: moduleForLab?.title,
      }),
    [entry, progress.learnerName, labsCompletedTotal, moduleForLab],
  );

  const [edited, setEdited] = useState<Record<Tab, string>>({
    linkedin: writeup.linkedin,
    twitter: writeup.twitter,
    markdown: writeup.markdown,
  });

  const activeText = edited[tab];
  const twitterLen = edited.twitter.length;

  const copy = async () => {
    await navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-accent)] mb-0.5">
              Auto-generated
            </div>
            <h2 className="font-bold text-[var(--color-heading)]">Share this win</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[var(--color-accent)] text-[var(--color-heading)]'
                  : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <textarea
            value={activeText}
            onChange={(e) => setEdited((s) => ({ ...s, [tab]: e.target.value }))}
            rows={tab === 'twitter' ? 6 : 14}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm p-3 font-mono leading-relaxed outline-none focus:border-[var(--color-accent)] resize-y"
          />
          {tab === 'twitter' && (
            <div className={`text-xs mt-1.5 text-right font-mono ${twitterLen > 280 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-dim)]'}`}>
              {twitterLen}/280 characters
            </div>
          )}
          <p className="text-xs text-[var(--color-text-dim)] mt-3 leading-relaxed">
            Edit freely before posting — this was generated from your actual lab data (objectives, category,
            difficulty, flags captured). Swap in your own voice, add a screenshot of your terminal session,
            and it's ready to publish.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
          >
            Close
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-navy)] text-white text-sm font-semibold hover:brightness-110 transition"
          >
            {copied ? (
              <>
                <IconCheck className="w-4 h-4" /> Copied
              </>
            ) : (
              'Copy to clipboard'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
