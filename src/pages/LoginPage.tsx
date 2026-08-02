import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/authStore';
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
        background: '#0d1420',
        color: '#c9a15f',
        border: '1px solid #c9a15f',
        boxShadow: '0 0 0 3px #06090f, 0 0 0 4px #c9a15f55, 0 10px 24px -10px rgba(0,0,0,0.7)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(201,161,95,0.35), transparent)',
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<Mode>(initialMode);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.loading && auth.user) navigate('/', { replace: true });
  }, [auth.loading, auth.user, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'reset') {
      if (!email.trim()) return setError('Enter your email address.');
      setSubmitting(true);
      const { error: resetError } = await auth.sendPasswordReset(email.trim());
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
      const { error: signUpError, needsEmailConfirm } = await auth.signUp(email.trim(), password, fullName.trim());
      setSubmitting(false);
      if (signUpError) return setError(signUpError);
      if (needsEmailConfirm) {
        // switchMode() itself resets `info` to null — call it FIRST so the success message set right
        // after is what actually survives to the next render, not silently clobbered by the same
        // batched update. (This is exactly the bug that shipped before: the message was computed but
        // never visible, leaving a new user with no idea they needed to check their email.)
        switchMode('signin');
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
    const { error: signInError } = await auth.signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) return setError(signInError);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#060d16]">
      {/* ---------- brand panel (large screens only) ---------- */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden items-center border-r border-[#c9a15f2e]">
        <AgencyBackdrop />
        <div className="relative px-12 xl:px-16 reveal" style={{ '--reveal-delay': '0s' } as React.CSSProperties}>
          <Link to="/welcome" className="inline-flex items-center gap-2.5 mb-14">
            <Logo className="w-8 h-8" />
            <span
              className="font-serif text-xl tracking-wide"
              style={{
                backgroundImage: 'linear-gradient(180deg, #f3e3bd 0%, #c9a15f 60%, #8f7136 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              DARKWORLD
            </span>
          </Link>
          <h2 className="font-serif text-3xl xl:text-4xl leading-tight text-white mb-5">
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
              <div className="text-2xl font-extrabold text-white">142+</div>
              <div className="text-2xs font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">Hands-on labs</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">18</div>
              <div className="text-2xs font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">Real-execution labs</div>
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
          background: 'linear-gradient(180deg, #16283b 0%, #101f30 100%)',
          border: '1px solid #c9a15f88',
          boxShadow: '0 0 0 1px rgba(201,161,95,0.15), 0 0 60px -12px rgba(63,140,255,0.35), 0 30px 60px -20px rgba(0,0,0,0.6)',
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
              background: 'linear-gradient(180deg, #1c2f45 0%, #0e1826 100%)',
              border: '1px solid #c9a15f66',
              boxShadow: 'inset 0 0 18px rgba(63,140,255,0.25), 0 0 22px -6px rgba(63,140,255,0.5)',
            }}
          >
            <Logo className="w-9 h-9" />
          </div>
          <h1
            className="font-serif text-3xl tracking-wide lg:hidden"
            style={{
              backgroundImage: 'linear-gradient(180deg, #f3e3bd 0%, #c9a15f 60%, #8f7136 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DARKWORLD
          </h1>
          <p className="font-serif text-[13px] tracking-[0.2em] uppercase text-[#8fa7c4] mt-1">
            {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in'}
          </p>
        </div>

        {mode !== 'reset' && (
          <div
            className="flex items-center rounded-lg p-1 mb-6"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
          >
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="flex-1 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition"
              style={
                mode === 'signin'
                  ? { background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 100%)', color: '#241a08' }
                  : { color: '#8fa7c4' }
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="flex-1 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition"
              style={
                mode === 'signup'
                  ? { background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 100%)', color: '#241a08' }
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
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
            >
              <IconUser className="w-4 h-4 text-[#c9a15f] shrink-0" />
              <span className="sr-only">Full name</span>
              <input
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
              />
            </label>
          )}

          <label
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
          >
            <IconMail className="w-4 h-4 text-[#c9a15f] shrink-0" />
            <span className="sr-only">Email address</span>
            <input
              autoFocus={mode !== 'signup'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
            />
          </label>

          {mode !== 'reset' && (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
            >
              <IconLock className="w-4 h-4 text-[#c9a15f] shrink-0" />
              <span className="sr-only">{mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
              />
            </label>
          )}

          {mode === 'signup' && (
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
            >
              <IconLock className="w-4 h-4 text-[#c9a15f] shrink-0" />
              <span className="sr-only">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
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
            <div className="text-xs text-[#ff8a7a] bg-[#ff6b5e14] border border-[#ff6b5e4d] rounded-lg px-3 py-2 leading-relaxed">
              {error}
            </div>
          )}
          {info && (
            <div className="text-xs text-[#7ee081] bg-[#7ee08114] border border-[#7ee0814d] rounded-lg px-3 py-2 leading-relaxed">
              {info}
            </div>
          )}

          <StampButton type="submit" disabled={submitting}>
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

        <p className="text-center text-2xs font-mono text-[#4d5e70] mt-6 tracking-wide">
          Secured by Supabase Auth &middot; your password is never stored or seen by this app
        </p>
      </div>
      </div>
    </div>
  );
}
