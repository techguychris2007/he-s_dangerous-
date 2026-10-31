import { IconCheck, IconFlag } from '../layout/icons';
import './completion-notice.css';

export default function CompletionNotice({ title, nextTitle, completedCount, onNext, onDismiss }: {
  title: string;
  nextTitle?: string;
  completedCount: number;
  onNext: () => void;
  onDismiss: () => void;
}) {
  return <aside className="dw-completion" aria-label="Lab completion">
    <div className="dw-completion__header"><span className="dw-completion__seal" aria-hidden="true"><IconCheck /></span><div><span className="dw-completion__eyebrow">Learning milestone</span><strong>Lab complete</strong></div><button type="button" onClick={onDismiss} className="dw-completion__close" aria-label="Dismiss lab completion">×</button></div>
    <div className="dw-completion__body" role="status" aria-live="polite">
      <h2>{title}</h2>
      <p>You’ve collected all required flags for this lab. Before moving on, review your evidence and note what each step demonstrated.</p>
      <div className="dw-completion__record"><IconFlag aria-hidden="true" /><span>{completedCount} {completedCount === 1 ? 'lab completed' : 'labs completed'}</span><span>Progress saved on this device</span></div>
    </div>
    {nextTitle && <div className="dw-completion__next"><span>Suggested next lab</span><strong>{nextTitle}</strong></div>}
    <div className="dw-completion__actions">{nextTitle && <button type="button" onClick={onNext} className="dw-completion__primary">Continue learning <span aria-hidden="true">→</span></button>}<button type="button" onClick={onDismiss} className="dw-completion__secondary">Stay in this lab</button></div>
  </aside>;
}
