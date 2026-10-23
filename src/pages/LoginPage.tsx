import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import Logo from '../components/layout/Logo';
import './entry-pages.css';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { IconUser, IconLock, IconMail } from '../components/layout/icons';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : searchParams.get('mode') === 'reset' ? 'reset' : 'signin';

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

  const busy = submitting || guestSubmitting;
  return (
    <main className="dw-entry dw-auth">
      <aside className="dw-auth-story">
        <Link to="/welcome" className="dw-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
        <div className="dw-auth-story-copy">
          <div className="dw-entry-world dw-auth-world" aria-hidden="true" />
          <p className="dw-eyebrow">Knowledge. Practice. Progress.</p>
          <h2>Build skills<br />that stand up<br /><em>to practice.</em></h2>
          <p>Learn the foundations, work through guided challenges and investigate security incidents in a dedicated learning workspace.</p>
          <ul className="dw-auth-benefits"><li>Structured lessons, from fundamentals onward</li><li>Terminal, coding and investigation labs</li><li>Saved progress and a portfolio of your work</li></ul>
          <div className="dw-auth-crew"><CharacterAvatar id="sentinel" size={52} decorative /><p><strong>SENTINEL · SOC LEAD</strong>Your desk is ready, operator. Sign in and pick up the case where you left it.</p></div>
        </div>
        <p className="dw-auth-footnote">Purpose-built for learning on your computer.</p>
      </aside>
      <section className="dw-auth-main" aria-labelledby="auth-title">
        <Link to="/welcome" className="dw-back">← Back to academy</Link>
        <div className="dw-auth-form">
          <p className="dw-eyebrow">Your learning workspace</p>
          <h1 id="auth-title">{mode === 'signup' ? 'Start your journey.' : mode === 'reset' ? 'Reset your password.' : 'Welcome back.'}</h1>
          <p className="dw-auth-description">{mode === 'signup' ? 'Create an account to save your progress as you learn.' : mode === 'reset' ? 'Enter your account email. We’ll send you a reset link.' : 'Sign in to pick up where you left off.'}</p>
          {mode !== 'reset' && <div className="dw-auth-tabs" aria-label="Account options">
            <button type="button" disabled={busy} aria-pressed={mode === 'signin'} onClick={() => switchMode('signin')}>Sign in</button>
            <button type="button" disabled={busy} aria-pressed={mode === 'signup'} onClick={() => switchMode('signup')}>Create account</button>
          </div>}
          <form onSubmit={submit} className="dw-auth-fields" aria-busy={busy}>
            {mode === 'signup' && <label><span>Full name</span><div className="dw-field"><IconUser className="h-4 w-4" /><input autoFocus autoComplete="name" required disabled={busy} value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your full name" /></div></label>}
            <label><span>Email address</span><div className="dw-field"><IconMail className="h-4 w-4" /><input autoFocus={mode !== 'signup'} type="email" autoComplete="email" required disabled={busy} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
            {mode !== 'reset' && <label><span>Password</span><div className="dw-field"><IconLock className="h-4 w-4" /><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 6 : undefined} required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} /></div></label>}
            {mode === 'signup' && <label><span>Confirm password</span><div className="dw-field"><IconLock className="h-4 w-4" /><input type="password" autoComplete="new-password" required disabled={busy} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" /></div></label>}
            {mode === 'signin' && <button type="button" disabled={busy} className="dw-forgot" onClick={() => switchMode('reset')}>Forgot password?</button>}
            {error && <p role="alert" className="dw-auth-error">{error}</p>}
            {info && <p role="status" className="dw-auth-info">{info}</p>}
            <button className="dw-button dw-button-primary" type="submit" disabled={busy}>{submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}<span aria-hidden="true">→</span></button>
          </form>
          {mode === 'reset' ? <button type="button" disabled={busy} className="dw-text-button" onClick={() => switchMode('signin')}>Back to sign in</button> : <>
            <div className="dw-auth-divider"><span>or explore first</span></div>
            <button type="button" className="dw-button dw-button-secondary" disabled={busy} onClick={continueAsGuest}>{guestSubmitting ? 'Opening your workspace…' : 'Continue as guest'}</button>
            <p className="dw-auth-note">Try the lessons and labs before creating an account. Add an email from your profile to keep access to your progress.</p>
          </>}
        </div>
        <p className="dw-auth-footer">DarkWorld Academy · Learn with purpose.</p>
      </section>
    </main>
  );
}
