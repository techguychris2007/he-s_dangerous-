import { useEffect, useRef, useState } from 'react';
import type { ReportLabEntry as LabEntry } from '../../lib/labWriteup';
import { buildLabWriteup, EMPTY_REPORT, type LabReportEvidence, type LabFinding } from '../../lib/labWriteup';
import { useProgress } from '../../state/progressStore';
import { useAuth } from '../../state/authStore';
import { useModalA11y } from '../../hooks/useModalA11y';

type Tab = 'evidence' | 'markdown' | 'linkedin' | 'twitter';
const fields = [['executiveSummary', 'Executive summary'], ['scope', 'Scope and constraints'], ['methodology', 'Method and evidence log'], ['cleanup', 'Cleanup and handoff'], ['reflection', 'Lessons, limitations and next steps']] as const;
const inputClass = 'mt-2 block w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-relaxed text-[var(--color-heading)] outline-none transition-colors placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20';
function loadDraftFromValue(value: unknown): LabReportEvidence {
  const report = { ...EMPTY_REPORT, findings: [] as LabFinding[] };
  if (!value || typeof value !== 'object') return report;
  const input = value as Record<string, unknown>;
  for (const [field] of fields) if (typeof input[field] === 'string') report[field] = input[field];
  if (Array.isArray(input.findings)) report.findings = input.findings.filter((finding: unknown): finding is LabFinding => {
    if (!finding || typeof finding !== 'object') return false;
    const f = finding as Record<string, unknown>;
    return ['id', 'title', 'severity', 'affectedAsset', 'evidence', 'impact', 'remediation', 'retest'].every(k => typeof f[k] === 'string') && ['Informational', 'Low', 'Medium', 'High', 'Critical'].includes(f.severity as string);
  });
  return report;
}
function loadDraft(key: string): LabReportEvidence {
  try {
    return loadDraftFromValue(JSON.parse(localStorage.getItem(key) ?? 'null'));
  } catch { return { ...EMPTY_REPORT, findings: [] }; }
}
export default function ShareWriteupModal(props: { entry: LabEntry; onClose: () => void }) {
  const { user } = useAuth();
  const key = `darkworld.report.v1.${user?.id ?? 'guest'}.${props.entry.scenario.id}`;
  return <ReportEditor key={key} {...props} storageKey={key} />;
}
function ReportEditor({ entry, onClose, storageKey }: { entry: LabEntry; onClose: () => void; storageKey: string }) {
  const progress = useProgress();
  const [tab, setTab] = useState<Tab>('evidence');
  const [report, setReport] = useState(() => loadDraft(storageKey));
  const [status, setStatus] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overrides, setOverrides] = useState<Partial<Record<Exclude<Tab, 'evidence'>, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useModalA11y(onClose);
  const capturedFlags = progress.flagCount(entry.scenario.id);
  const complete = capturedFlags >= entry.scenario.totalFlags;
  const opts = { learnerName: progress.learnerName, capturedFlags, completedAt: progress.labCompletedAt[entry.scenario.id], evidence: report };
  const writeup = buildLabWriteup(entry, opts);
  const activeText = tab === 'evidence' ? '' : overrides[tab] ?? writeup[tab];
  const shareMeta: Record<Exclude<Tab, 'evidence'>, { title: string; helper: string; limit?: number; rows: number }> = {
    markdown: {
      title: 'Markdown evidence notes',
      helper: 'Use this for a README, portfolio artifact, instructor review, or blog draft. It is generated from the structured evidence notebook.',
      rows: 22,
    },
    linkedin: {
      title: 'Professional LinkedIn post',
      helper: 'A polished public learning update. Personalize the reflection, remove anything you do not want public, then copy it to LinkedIn.',
      limit: 3000,
      rows: 24,
    },
    twitter: {
      title: 'Short X / Twitter post',
      helper: 'A compact progress update for short-form sharing.',
      limit: 280,
      rows: 8,
    },
  };
  const activeMeta = tab === 'evidence' ? null : shareMeta[tab];
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(report)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [report, storageKey]);
  const update = (field: keyof Omit<LabReportEvidence, 'findings'>, value: string) => setReport(old => ({ ...old, [field]: value }));
  const findingUpdate = (id: string, field: keyof LabFinding, value: string) => setReport(old => ({ ...old, findings: old.findings.map(f => f.id === id ? { ...f, [field]: value } : f) }));
  const perform = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setStatus('');
    try { await action(); setStatus(success); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'The export could not be completed. Please try again.'); }
    finally { setBusy(false); }
  };
  const markdownDownload = () => {
    const url = URL.createObjectURL(new Blob([overrides.markdown ?? writeup.markdown], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `darkworld-report-${entry.slug}.md`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const jsonDownload = () => {
    const payload = JSON.stringify({ version: 1, labId: entry.scenario.id, labSlug: entry.slug, exportedAt: new Date().toISOString(), evidence: report }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `darkworld-evidence-${entry.slug}.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const downloadPdf = async () => {
    const { downloadWriteupPdf } = await import('../../lib/pdfGenerator');
    await downloadWriteupPdf(entry, opts);
  };
  const downloadCertificate = async () => {
    const { downloadCertificatePdf } = await import('../../lib/pdfGenerator');
    await downloadCertificatePdf(entry, progress.learnerName || 'Learner', opts);
  };
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const candidate = parsed && typeof parsed === 'object' && 'evidence' in parsed ? (parsed as { evidence: unknown }).evidence : parsed;
      setReport(loadDraftFromValue(candidate));
      setStatus('Evidence JSON imported and saved on this device.');
    } catch {
      setStatus('That JSON file could not be read. Export a fresh DarkWorld evidence JSON and try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const submitLocal = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(report));
      setStatus('Evidence submitted locally for this lab. You can export JSON, Markdown or PDF any time.');
    } catch {
      setStatus('Device storage is unavailable, so submission could not be saved locally. Download the JSON file instead.');
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-[2px] sm:p-4" onClick={onClose}>
    <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="share-writeup-title" tabIndex={-1} onClick={event => event.stopPropagation()} className="flex h-[min(94dvh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(10,20,40,.24)] outline-none">
      <div className="h-1 shrink-0 bg-[var(--color-accent)]" />
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-7"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--color-accent)]">DarkWorld · Evidence portfolio</p><h2 id="share-writeup-title" className="mt-1 text-xl font-bold tracking-tight text-[var(--color-heading)]">Evidence notebook</h2><p className="mt-1 truncate text-sm text-[var(--color-text-dim)]">{entry.scenario.title}</p></div><div className="flex shrink-0 items-center gap-3"><span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-dim)]">{capturedFlags}/{entry.scenario.totalFlags} proof points</span><button type="button" onClick={onClose} aria-label="Close evidence notebook" className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]">×</button></div></header>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--color-border)] px-4 pt-3" aria-label="Report sections">{(['evidence', 'markdown', 'linkedin', 'twitter'] as const).map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)} className={`shrink-0 px-3 py-2 border-b-2 text-sm ${tab === item ? 'border-[var(--color-accent)] text-[var(--color-heading)]' : 'border-transparent text-[var(--color-text-dim)]'}`}>{({ evidence: 'Evidence notebook', markdown: 'Markdown notes', linkedin: 'LinkedIn', twitter: 'X / Twitter' })[item]}</button>)}</div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-[var(--color-bg)]/35 p-5 overscroll-contain sm:p-7">
        {tab === 'evidence' ? <>
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <div><p className="text-sm font-semibold text-[var(--color-heading)]">Build a clear record of your work</p><p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--color-text-dim)]">Write only what your lab observations support. Your draft is saved on this device for this account. Export JSON to back it up or move it to another browser.</p></div>
            <span className="shrink-0 rounded-md bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-dim)]">Local draft</span>
          </div>
          {storageError && <p role="alert" className="text-sm text-[var(--color-danger)]">Device storage is unavailable. Export your Markdown notes before closing.</p>}
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">01 · Report narrative</p><h3 className="mt-1 text-base font-bold text-[var(--color-heading)]">Context, scope and method</h3></div>
            <div className="grid gap-4 p-4 sm:p-5">
              {fields.slice(0, 3).map(([field, label]) => <label key={field} className="block text-sm font-semibold text-[var(--color-heading)]">{label}<textarea className={inputClass} rows={field === 'methodology' ? 6 : 4} value={report[field]} onChange={event => update(field, event.target.value)} /></label>)}
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">02 · Supporting observations</p><h3 className="mt-1 text-base font-bold text-[var(--color-heading)]">Evidence items</h3><p className="mt-1 text-xs text-[var(--color-text-dim)]">Separate confirmed output from interpretation and note any limits.</p></div><button type="button" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]" onClick={() => setReport(old => ({ ...old, findings: [...old.findings, { id: crypto.randomUUID(), title: '', severity: 'Informational', affectedAsset: '', evidence: '', impact: '', remediation: '', retest: '' }] }))}>Add evidence item</button></div>
            <div className="space-y-4 p-4 sm:p-5">
            {!report.findings.length && <p className="rounded-lg bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-text-dim)]">No observations documented yet. Add an item when you have evidence to support it.</p>}
            {report.findings.map((finding, index) => <fieldset key={finding.id} className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/45 p-4"><legend className="px-2 text-sm font-bold text-[var(--color-heading)]">Observation {String(index + 1).padStart(2, '0')}</legend>
              <label className="block text-sm font-semibold text-[var(--color-heading)]">Observation title<input className={inputClass} value={finding.title} onChange={event => findingUpdate(finding.id, 'title', event.target.value)} /></label>
              <label className="block text-sm font-semibold text-[var(--color-heading)]">Severity (learner assessed)<select className={inputClass} value={finding.severity} onChange={event => findingUpdate(finding.id, 'severity', event.target.value)}>{['Informational', 'Low', 'Medium', 'High', 'Critical'].map(value => <option key={value}>{value}</option>)}</select></label>
              {([['affectedAsset', 'Affected asset or artifact'], ['evidence', 'Commands, tool output and observations'], ['impact', 'Observed impact and its limits'], ['remediation', 'Recommended control or concept takeaway'], ['retest', 'Retest result or next verification']] as const).map(([field, label]) => <label key={field} className="block text-sm font-semibold text-[var(--color-heading)]">{label}<textarea className={inputClass} rows={3} value={finding[field]} onChange={event => findingUpdate(finding.id, field, event.target.value)} /></label>)}
              <button className="text-sm text-[var(--color-danger)]" onClick={() => setReport(old => ({ ...old, findings: old.findings.filter(f => f.id !== finding.id) }))}>Remove evidence item {index + 1}</button>
            </fieldset>)}
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">03 · Closeout</p><h3 className="mt-1 text-base font-bold text-[var(--color-heading)]">Disposition and reflection</h3></div>
            <div className="grid gap-4 p-4 sm:p-5">{fields.slice(3).map(([field, label]) => <label key={field} className="block text-sm font-semibold text-[var(--color-heading)]">{label}<textarea className={inputClass} rows={4} value={report[field]} onChange={event => update(field, event.target.value)} /></label>)}</div>
          </section>
        </> : activeMeta && <>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--color-heading)]">{activeMeta.title}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-text-dim)]">{activeMeta.helper}</p>
              </div>
              {activeMeta.limit && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeText.length > activeMeta.limit ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}>{activeText.length}/{activeMeta.limit}</span>}
            </div>
          </div>
          <label className="block text-sm font-semibold">Editable draft<textarea className={`${inputClass} font-mono leading-relaxed`} rows={activeMeta.rows} value={activeText} onChange={event => setOverrides(old => ({ ...old, [tab]: event.target.value }))} /></label>
          <p className="text-xs text-[var(--color-text-dim)]">PDF exports use the structured evidence notebook. Edits here affect only this text export and remain temporary until copied or downloaded.</p>
          <div className="flex flex-wrap gap-3"><button className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold" onClick={() => setOverrides(old => ({ ...old, [tab]: undefined }))}>Regenerate from notebook</button><button disabled={busy} className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void perform(() => navigator.clipboard.writeText(activeText), `${activeMeta.title} copied to clipboard.`)}>Copy draft</button></div>
        </>}
      </div>
      <footer className="shrink-0 space-y-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6"><p role="status" aria-live="polite" className="min-h-5 text-sm text-[var(--color-text-dim)]">{status}</p><div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
        <button type="button" onClick={submitLocal} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-95">Save notebook</button>
        <button type="button" onClick={jsonDownload} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:bg-[var(--color-surface-2)]">Export JSON</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={event => void importJson(event.target.files?.[0])} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:bg-[var(--color-surface-2)]">Import JSON</button>
        </div>
        <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void perform(downloadPdf, 'PDF evidence export downloaded.')} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50">{busy ? 'Preparing…' : 'PDF report'}</button>
        <button type="button" onClick={markdownDownload} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] transition-colors hover:bg-[var(--color-surface-2)]">Markdown</button>
        <button type="button" disabled={busy || !complete} title={complete ? 'Download your training completion record' : 'Capture every lab proof to unlock the certificate'} onClick={() => void perform(downloadCertificate, 'Certificate downloaded.')} className="rounded-lg border border-[var(--color-gold)] px-3 py-2 text-sm font-semibold text-[var(--color-gold-dim)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40">Certificate</button>
        </div>
      </div><p className="text-xs text-[var(--color-text-dim)]">Your notebook is stored on this device. Certificates record simulated training completion; they are not an independent professional certification.</p></footer>
    </div>
  </div>;
}
