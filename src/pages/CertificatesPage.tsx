import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../state/progressStore';
import { CERTIFICATE_PATHS, certificateStatus, certificateId } from '../data/pathCertificates';
import PathCertificate from '../components/certificate/PathCertificate';
import ProgressRing from '../components/common/ProgressRing';
import { IconArrowRight, IconDownload, IconCheck } from '../components/layout/icons';
import './learning-pages.css';

export default function CertificatesPage() {
  const progress = useProgress();
  const [name, setName] = useState(progress.learnerName?.trim() || '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const issued = useMemo(
    () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    [],
  );
  const displayName = name.trim() || 'Learner';

  const rows = CERTIFICATE_PATHS.map((path) => ({
    path,
    status: certificateStatus(path.track, (id) => progress.isLessonComplete(id)),
    recordId: certificateId(path.track, displayName),
  }));
  const earned = rows.filter((row) => row.status.earned);
  const inProgress = rows.filter((row) => !row.status.earned).sort((a, b) => b.status.percent - a.status.percent);

  const download = async (row: (typeof rows)[number]) => {
    setBusy(row.path.track);
    setError('');
    try {
      const { downloadPathCertificatePdf } = await import('../lib/pdfGenerator');
      await downloadPathCertificatePdf(
        {
          credential: row.path.credential,
          skills: row.path.skills,
          moduleCount: row.status.moduleCount,
          lessonCount: row.status.total,
          recordId: row.recordId,
          issued,
        },
        displayName,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The certificate PDF could not be created. Reconnect and try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="learning-page mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12">
      <header className="mb-8">
        <p className="gold-eyebrow mb-2">// your credentials</p>
        <h1 className="mb-2 text-3xl font-bold text-[var(--color-heading)] sm:text-4xl">Certificates</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-dim)]">
          Finish every lesson in a learning path to earn its completion certificate. Each one is a self-issued record of your
          simulated coursework on DarkWorld — download it as a PDF for your portfolio.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-sm font-semibold text-[var(--color-heading)]">
            <IconCheck className="h-4 w-4 text-[var(--color-success)]" />
            {earned.length} of {rows.length} earned
          </span>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
            Name on certificate
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              aria-label="Name shown on your certificates"
              className="w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-heading)] outline-none focus-visible:border-[var(--color-accent)]"
            />
          </label>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
      </header>

      {earned.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-dim)]">Earned</h2>
          <div className="flex flex-col gap-10">
            {earned.map((row) => (
              <article key={row.path.track}>
                <PathCertificate path={row.path} learnerName={displayName} status={row.status} issued={issued} recordId={row.recordId} />
                <div className="mx-auto mt-4 flex max-w-[820px] flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-text-dim)]">{row.path.summary}</p>
                  <button
                    type="button"
                    onClick={() => download(row)}
                    disabled={busy === row.path.track}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <IconDownload className="h-4 w-4" />
                    {busy === row.path.track ? 'Preparing…' : 'Download PDF'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-dim)]">
          {earned.length > 0 ? 'Keep going' : 'Paths to complete'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {inProgress.map(({ path, status }) => (
            <div key={path.track} className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-start gap-4">
                <ProgressRing value={status.percent} size={56} stroke={5} label={`${path.credential}: ${status.percent}% complete`} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--color-heading)]">{path.credential}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-dim)]">{path.summary}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-dim)]">
                <span>{status.completed} / {status.total} lessons</span>
                <span>{status.modulesDone} / {status.moduleCount} modules</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                <span className="block h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${status.percent}%` }} />
              </div>
              <Link
                to={`/roadmap?track=${path.track}`}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[var(--color-accent)] hover:underline"
              >
                {status.completed > 0 ? 'Continue this path' : 'Start this path'}
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-2xs uppercase tracking-wide text-[var(--color-text-dim)]">
                {status.remaining} lesson{status.remaining === 1 ? '' : 's'} left to earn this certificate
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
