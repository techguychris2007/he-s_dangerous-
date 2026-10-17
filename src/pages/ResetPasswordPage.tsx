import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import Logo from '../components/layout/Logo';
import AgencyBackdrop from '../components/layout/AgencyBackdrop';
import { IconLock } from '../components/layout/icons';

/** Landing page for a Supabase password-recovery email link. Only reachable with a valid (temporary)
 *  recovery session — authStore.ts's onAuthStateChange forces the app here the moment it detects
 *  Supabase's PASSWORD_RECOVERY event, which is the only way a real recovery session ever exists. */
export default function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    const { error: updateError } = await auth.updatePassword(password).catch(() => ({error: 'Could not update your password. Check your connection and retry.'}));
    setSubmitting(false);
    if (updateError) return setError(updateError);
    setDone(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden bg-[#0d1824]">
      <div className="absolute inset-0">
        <AgencyBackdrop />
      </div>

      <div
        className="relative w-full max-w-[440px] rounded-2xl px-7 py-8 sm:px-9 sm:py-10 reveal"
        style={{
          '--reveal-delay': '0.1s',
          background: 'linear-gradient(180deg, #20394d 0%, #142638 100%)',
          border: '1px solid #79d0d588',
          boxShadow: '0 0 0 1px rgba(121,208,213,0.15), 0 0 60px -12px rgba(63,140,255,0.35), 0 30px 60px -20px rgba(0,0,0,0.6)',
        } as React.CSSProperties}
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(180deg, #20394d 0%, #142638 100%)',
              border: '1px solid #79d0d566',
              boxShadow: 'inset 0 0 18px rgba(63,140,255,0.25), 0 0 22px -6px rgba(63,140,255,0.5)',
            }}
          >
            <Logo className="w-14 h-14" />
          </div>
          <h1
            className="font-display text-3xl tracking-wide"
            style={{
              backgroundImage: 'linear-gradient(180deg, #d1eff0 0%, #79d0d5 60%, #4b929a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DARKWORLD
          </h1>
          <p className="font-display text-[13px] tracking-[0.2em] uppercase text-[#8fa7c4] mt-1">Set a new password</p>
        </div>

        {auth.loading ? <p role="status" className="text-sm text-[#a9c0da]">Checking your recovery session…</p> : !auth.user ? (
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-sm text-[#a9c0da] leading-relaxed">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Link
              to="/login"
              className="text-2xs font-semibold text-[#7c93ae] hover:text-[#c9e0ff] transition-colors"
            >
              &larr; Back to sign in
            </Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-sm text-[var(--term-success)] leading-relaxed">
              Password updated. You're signed in with your new password.
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-2xs font-semibold text-[#7c93ae] hover:text-[#c9e0ff] transition-colors"
            >
              Continue to dashboard &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
            >
              <IconLock className="w-4 h-4 text-[#79d0d5] shrink-0" />
              <span className="sr-only">New password (min. 6 characters)</span>
              <input
                autoFocus
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
              />
            </label>

            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
            >
              <IconLock className="w-4 h-4 text-[#79d0d5] shrink-0" />
              <span className="sr-only">Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
              />
            </label>

            {error && (
              <div role="alert" className="text-xs text-[var(--term-error-text)] bg-[var(--term-error)]/8 border border-[var(--term-error)]/30 rounded-lg px-3 py-2 leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 px-4 py-3.5 font-mono tracking-[0.25em] uppercase text-sm disabled:opacity-45 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
              style={{
                background: '#142638',
                color: '#79d0d5',
                border: '1px solid #79d0d5',
                boxShadow: '0 0 0 3px #06090f, 0 0 0 4px #79d0d555, 0 10px 24px -10px rgba(0,0,0,0.7)',
              }}
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
