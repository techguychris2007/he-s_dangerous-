// Isolated development review; no authentication changes, account data or saved progress writes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { ADVANCED_OFFENSIVE_MODULES, ADVANCED_LESSONS } from '../src/data/advancedOffensiveCurriculum';
import { advancedOffensiveCampaigns } from '../src/labs/scenarios/advanced-offensive-campaigns';
import LessonArticle from '../src/content/advanced-offensive/LessonArticle';
import EngagementOverview from '../src/components/labs/EngagementOverview';
import Terminal from '../src/components/terminal/Terminal';
import '../src/academy-system.css';

export function Preview() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const scenario = advancedOffensiveCampaigns[campaignIndex];
  return <main className="mx-auto max-w-6xl p-4 sm:p-8">
    <header className="mb-8"><p className="gold-eyebrow">Isolated development preview</p><h1 className="text-3xl font-bold text-[var(--color-heading)]">Offensive Security · Advanced & Post-Exploitation</h1><p className="mt-2 text-[var(--color-text-dim)]">5 modules · 20 lessons · 10 complete simulated campaigns</p></header>
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ADVANCED_OFFENSIVE_MODULES.map(mod => <div key={mod.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><h2 className="font-bold text-[var(--color-heading)]">{mod.title}</h2><p className="mt-1 text-xs text-[var(--color-text-dim)]">{mod.subtitle}</p><p className="mt-3 text-sm text-[var(--color-text)]">{mod.description}</p></div>)}</div>
    <label htmlFor="lesson" className="block text-sm font-semibold text-[var(--color-heading)]">Review lesson</label>
    <select id="lesson" value={lessonIndex} onChange={e => setLessonIndex(Number(e.target.value))} className="mb-6 mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-text)]">{ADVANCED_LESSONS.map((lesson, index) => <option key={lesson.id} value={index}>{lesson.title}</option>)}</select>
    <div className="max-w-3xl"><LessonArticle lesson={ADVANCED_LESSONS[lessonIndex]} /></div>
    <label htmlFor="campaign" className="mt-10 block text-sm font-semibold text-[var(--color-heading)]">Review campaign</label>
    <select id="campaign" value={campaignIndex} onChange={e => { setCampaignIndex(Number(e.target.value)); setFlags([]); }} className="mb-6 mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-text)]">{advancedOffensiveCampaigns.map((campaign, index) => <option key={campaign.id} value={index}>{campaign.title}</option>)}</select>
    <div className="grid gap-4 lg:grid-cols-[350px_1fr]"><EngagementOverview scenario={scenario} flags={flags} /><div className="h-[650px] min-w-0"><Terminal key={scenario.id} scenario={scenario} onFlagCaptured={flag => setFlags(current => current.includes(flag) ? current : [...current, flag])} /></div></div>
  </main>;
}
const previewRoot = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
previewRoot.render(<Preview />);
if (import.meta.hot) {
  import.meta.hot.data.root = previewRoot;
  import.meta.hot.accept();
}
