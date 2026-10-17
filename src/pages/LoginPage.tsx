import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { useLabsData } from '../state/useLabsData';
import Logo from '../components/layout/Logo';
import AgencyBackdrop from '../components/layout/AgencyBackdrop';
import { IconUser, IconLock, IconMail } from '../components/layout/icons';

type Mode = 'signin' | 'signup' | 'reset';

/** A "classified stamp" action button — sharp corners, double border, monospace uppercase, and an
 *  ink-scan sweep on hover — standing in for the old rounded gold-gradient pill button. */
function StampButton({ children, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className="group relative w-full mt-1 px-4 py-3.5 font-mono tracking-[0.25em] uppercase text-sm disabled:opacity-45 disabled:cursor-not-allowed transition-transform active:scale-[0.98] overflow-hidden"
      style={{
        background: '#142638',
        color: '#79d0d5',
        border: '1px solid #79d0d5',
        boxShadow: '0 0 0 3px #06090f, 0 0 0 4px #79d0d555, 0 10px 24px -10px rgba(0,0,0,0.7)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(121,208,213,0.35), transparent)',
          animation: disabled ? 'none' : 'stamp-sweep 1.1s ease-in-out infinite',
        }}
      />
      <span className="relative">{children}</span>
      <style>{`
        @keyframes stamp-sweep {
          0% { transform: translateX(0%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </button>
  );
}

export default function LoginPage() {
  const auth = useAuth();
  const labsData = useLabsData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : searchParams.get('mode') === 'reset' ? 'reset' : 'signin';

  const totalLabs = labsData?.LABS.length ?? '…';
  const totalFlags = labsData?.TOTAL_FLAGS ?? '…';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.loading && auth.user) navigate('/', { replace: true });
  }, [auth.loading, auth.user, navigate]);

  const switchMode = (next: Mode) => {
    if (submitting || guestSubmitting) return;
    setSearchParams(next === 'signin' ? {} : { mode: next });
    setPassword(''); setConfirmPassword('');
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || guestSubmitting) return;
    setError(null);
    setInfo(null);

    if (mode === 'reset') {
      if (!email.trim()) return setError('Enter your email address.');
      setSubmitting(true);
      const { error: resetError } = await auth.sendPasswordReset(email.trim()).catch(() => ({error: 'Could not connect. Check your connection and try again.'}));
      setSubmitting(false);
      if (resetError) return setError(resetError);
      setInfo('Password reset email sent — check your inbox for a link.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) return setError('Enter your full name.');
      if (!email.trim()) return setError('Enter your email address.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirmPassword) return setError('Passwords do not match.');

      setSubmitting(true);
      const { error: signUpError, needsEmailConfirm } = await auth.signUp(email.trim(), password, fullName.trim()).catch(() => ({error: 'Could not create your account. Check your connection and retry.', needsEmailConfirm: false}));
      setSubmitting(false);
      if (signUpError) return setError(signUpError);
      if (needsEmailConfirm) {
        setSearchParams({});
        setPassword(''); setConfirmPassword('');
        setInfo('Account created — check your email to confirm it before signing in.');
        return;
      }
      navigate('/', { replace: true });
      return;
    }

    // signin
    if (!email.trim()) return setError('Enter your email address.');
    if (!password) return setError('Enter your password.');
    setSubmitting(true);
    const { error: signInError } = await auth.signIn(email.trim(), password).catch(() => ({error: 'Could not sign in. Check your connection and retry.'}));
    setSubmitting(false);
    if (signInError) return setError(signInError);
    navigate('/', { replace: true });
  };

  const continueAsGuest = async () => {
    if (guestSubmitting || submitting) return;
    setError(null);
    setInfo(null);
    setGuestSubmitting(true);
    const { error: guestError } = await auth.signInAsGuest().catch(() => ({error: 'Could not start a guest session. Check your connection and retry.'}));
    setGuestSubmitting(false);
    if (guestError) return setError(guestError);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0d1824]">
      {/* ---------- brand panel (large screens only) ---------- */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden items-center border-r border-[#79d0d52e]">
        <AgencyBackdrop />
        <div className="relative px-12 xl:px-16 reveal" style={{ '--reveal-delay': '0s' } as React.CSSProperties}>
          <Link to="/welcome" className="inline-flex items-center gap-2.5 mb-14">
            <Logo className="w-14 h-14" />
            <span
              className="font-display text-3xl font-black tracking-[-0.04em]"
              style={{
                backgroundImage: 'linear-gradient(180deg, #d1eff0 0%, #79d0d5 60%, #4b929a 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              DARKWORLD
            </span>
          </Link>
          <h2 className="font-display text-3xl xl:text-4xl leading-tight text-white mb-5">
            Offensive &amp; defensive
            <br />
            security, hands-on.
          </h2>
          <p className="text-[#a9c0da] leading-relaxed max-w-sm mb-10">
            Real interactive labs, real SIEM consoles, breaches modeled on actual incidents — your progress,
            flags, and certificates travel with your account, on any device.
          </p>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-2xl font-extrabold text-white">{totalLabs}</div>
              <div className="text-2xs font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">Hands-on labs</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{totalFlags}</div>
              <div className="text-2xs font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">Flags to capture</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- form panel ---------- */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="lg:hidden absolute inset-0">
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
        <Link
          to="/welcome"
          className="absolute top-6 left-7 text-2xs font-semibold text-[#7c93ae] hover:text-[#c9e0ff] transition-colors lg:hidden"
        >
          &larr; Back
        </Link>

        <div className="flex flex-col items-center text-center mb-7 mt-4 lg:mt-0">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 lg:hidden"
            style={{
              background: 'linear-gradient(180deg, #20394d 0%, #142638 100%)',
              border: '1px solid #79d0d566',
              boxShadow: 'inset 0 0 18px rgba(63,140,255,0.25), 0 0 22px -6px rgba(63,140,255,0.5)',
            }}
          >
            <Logo className="w-14 h-14" />
          </div>
          <h1
            className="font-display text-3xl tracking-wide lg:hidden"
            style={{
              backgroundImage: 'linear-gradient(180deg, #d1eff0 0%, #79d0d5 60%, #4b929a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DARKWORLD
          </h1>
          <p className="font-display text-[13px] tracking-[0.2em] uppercase text-[#8fa7c4] mt-1">
            {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in'}
          </p>
        </div>

        {mode !== 'reset' && (
          <div
            className="flex items-center rounded-lg p-1 mb-6"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
          >
            <button
              type="button"
              onClick={() => switchMode('signin')}
              disabled={submitting || guestSubmitting}
              aria-pressed={mode === 'signin'}
              className="flex-1 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition"
              style={
                mode === 'signin'
                  ? { background: 'linear-gradient(180deg, #b0e4e7 0%, #79d0d5 100%)', color: '#142638' }
                  : { color: '#8fa7c4' }
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              disabled={submitting || guestSubmitting}
              aria-pressed={mode === 'signup'}
              className="flex-1 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition"
              style={
                mode === 'signup'
                  ? { background: 'linear-gradient(180deg, #b0e4e7 0%, #79d0d5 100%)', color: '#142638' }
                  : { color: '#8fa7c4' }
              }
            >
              Create account
            </button>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
            >
              <IconUser className="w-4 h-4 text-[#79d0d5] shrink-0" />
              <span className="sr-only">Full name</span>
              <input
                autoFocus
                value={fullName}
                autoComplete="name"
                required
                disabled={submitting || guestSubmitting}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
              />
            </label>
          )}

          <label
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
          >
            <IconMail className="w-4 h-4 text-[#79d0d5] shrink-0" />
            <span className="sr-only">Email address</span>
            <input
              autoFocus={mode !== 'signup'}
              type="email"
              autoComplete="email"
              required
              disabled={submitting || guestSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
            />
          </label>

          {mode !== 'reset' && (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
            >
              <IconLock className="w-4 h-4 text-[#79d0d5] shrink-0" />
              <span className="sr-only">{mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}</span>
              <input
                type="password"
                value={password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                disabled={submitting || guestSubmitting}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
              />
            </label>
          )}

          {mode === 'signup' && (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #79d0d54d' }}
            >
              <IconLock className="w-4 h-4 text-[#79d0d5] shrink-0" />
              <span className="sr-only">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                autoComplete="new-password"
                required
                disabled={submitting || guestSubmitting}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#9db5c7]"
              />
            </label>
          )}

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="self-end text-2xs font-semibold text-[#7c93ae] hover:text-[#c9e0ff] transition-colors -mt-1"
            >
              Forgot password?
            </button>
          )}

          {error && (
            <div role="alert" className="text-xs text-[var(--term-error-text)] bg-[var(--term-error)]/8 border border-[var(--term-error)]/30 rounded-lg px-3 py-2 leading-relaxed">
              {error}
            </div>
          )}
          {info && (
            <div role="status" className="text-xs text-[var(--term-success)] bg-[var(--term-success)]/8 border border-[var(--term-success)]/30 rounded-lg px-3 py-2 leading-relaxed">
              {info}
            </div>
          )}

          <StampButton type="submit" disabled={submitting || guestSubmitting}>
            {submitting
              ? 'Processing…'
              : mode === 'signup'
              ? 'Create account'
              : mode === 'reset'
              ? 'Send reset link'
              : 'Sign in'}
            {!submitting && ' →'}
          </StampButton>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="self-center text-2xs font-semibold text-[#7c93ae] hover:text-[#c9e0ff] transition-colors"
            >
              Back to sign in
            </button>
          )}
        </form>

        {mode !== 'reset' && (
          <>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px" style={{ background: '#79d0d533' }} />
              <span className="text-2xs font-mono uppercase tracking-widest text-[#9db5c7]">or</span>
              <div className="flex-1 h-px" style={{ background: '#79d0d533' }} />
            </div>

            <button
              type="button"
              onClick={continueAsGuest}
              disabled={guestSubmitting || submitting}
              className="w-full mt-4 px-4 py-3 rounded-lg text-sm font-semibold text-[#c9e0ff] transition-colors disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#79d0d514]"
              style={{ border: '1px solid #7c93ae66' }}
            >
              {guestSubmitting ? 'Setting up your guest session…' : 'Continue as guest'}
            </button>
            <p className="text-center text-2xs text-[#9db5c7] mt-2.5 leading-relaxed">
              Explore every lab and lesson with no sign-up. Your progress still saves — add an email later
              from your profile to keep it permanently.
            </p>
          </>
        )}

        <p className="text-center text-2xs font-mono text-[#4d5e70] mt-6 tracking-wide">
          Secured by Supabase Auth &middot; password verification is handled by Supabase Auth
        </p>
      </div>
      </div>
    </div>
  );
}
