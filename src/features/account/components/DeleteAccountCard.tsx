import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useAuth } from '../state/authStore';
import { useEntitlement, isActive } from '../../billing/lib/billing';

/** Device data that belongs to the learner. The theme and downloaded books are not personal and stay. */
function clearLearnerDataOnDevice(userId: string) {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === 'hackerhub.progress.v1' || key === `darkworld.plan.${userId}` || /^sb-.*-auth-token$/.test(key)) localStorage.removeItem(key);
    }
    sessionStorage.clear();
  } catch { /* storage unavailable */ }
}

async function functionError(error: unknown): Promise<string> {
  const response = (error as { context?: Response })?.context;
  if (response && typeof response.json === 'function') {
    const body = await response.json().catch(() => null);
    if (body?.error) return String(body.error);
  }
  return 'Could not reach DarkWorld. Check your connection and try again.';
}

/** Lets a learner permanently delete their account (see supabase/functions/delete-account). */
export default function DeleteAccountCard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { row } = useEntitlement();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const user = auth.user;
  if (!user) return null;
  const expected = user.email ?? 'DELETE';
  const matches = confirm.trim().toLowerCase() === expected.toLowerCase();
  const paid = isActive(row);

  const remove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!matches || busy) return;
    setBusy(true);
    setError('');
    const { error: failure } = await supabase.functions.invoke('delete-account', { body: { confirm: confirm.trim() } });
    if (failure) {
      setError(await functionError(failure));
      setBusy(false);
      return;
    }
    clearLearnerDataOnDevice(user.id);
    // The account no longer exists on the server, so only the local session needs ending.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    navigate('/welcome', { replace: true });
  };

  return (
    <section aria-labelledby="delete-account-title" className="mt-8 rounded-2xl border border-[var(--color-danger)]/40 p-5">
      <h2 id="delete-account-title" className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide mb-2">Delete account</h2>
      <p className="text-sm text-[var(--color-text)] leading-relaxed">
        Permanently delete your DarkWorld account and everything linked to it: progress, flags, XP, achievements, write-ups saved to your account, lab comments, ratings and feedback. This cannot be undone.
      </p>
      {!open
        ? <button type="button" onClick={() => setOpen(true)} className="mt-4 min-h-[44px] rounded-lg border border-[var(--color-danger)]/60 px-4 text-sm font-bold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">Delete my account…</button>
        : <form onSubmit={remove} className="mt-4 grid gap-3 max-w-md">
            {paid && <p className="text-sm text-[var(--color-text)] leading-relaxed rounded-lg bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/30 px-3 py-2">
              You have a paid plan. A card subscription is cancelled first, so you will not be charged again. Unused time is not refunded automatically; see the <a className="underline" href="/refunds.html">Refund Policy</a>.
            </p>}
            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">Payment records are kept for tax purposes without a link to your account. Books you downloaded for offline reading stay on this device until you clear them.</p>
            <label className="grid gap-1.5 text-sm text-[var(--color-heading)]">
              <span>Type {user.email ? <strong>{user.email}</strong> : <strong>DELETE</strong>} to confirm</span>
              <input value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="off" spellCheck={false} className="min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-heading)]" />
            </label>
            {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={!matches || busy} className="min-h-[44px] rounded-lg bg-[var(--color-danger)] px-4 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">{busy ? 'Deleting…' : 'Permanently delete account'}</button>
              <button type="button" onClick={() => { setOpen(false); setConfirm(''); setError(''); }} className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-heading)]">Cancel</button>
            </div>
          </form>}
    </section>
  );
}
