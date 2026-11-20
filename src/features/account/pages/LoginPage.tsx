import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { takeReturnTo } from '../../billing/lib/billing';
import Logo from '../../../shared/components/layout/Logo';
import '../../../shared/styles/entry-pages.css';
import CharacterAvatar from '../../../shared/characters/CharacterAvatar';
import { IconUser, IconLock, IconMail } from '../../../shared/components/layout/icons';

type Mode = 'signin' | 'signup' | 'reset';

/** Provider marks for the social sign-in buttons, drawn in each provider's own colours. */
function GoogleMark() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.8Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.58.38-2.3V6.6H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.4l4-3.1Z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.6l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"/></svg>;
}
function GitHubMark() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z"/></svg>;
}

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
  const [oauthSubmitting, setOauthSubmitting] = useState<'google' | 'github' | null>(null);

  useEffect(() => {
    // Establish DNS/TLS before the click; do not request an OAuth session or
    // start sign-in until the learner explicitly chooses a provider.
    const links = [new URL(import.meta.env.VITE_SUPABASE_URL).origin, 'https://accounts.google.com'].map(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
      return link;
    });
    const onReturn = () => setOauthSubmitting(null);
    window.addEventListener('pageshow', onReturn);
    return () => {
      links.forEach(link => link.remove());
      window.removeEventListener('pageshow', onReturn);
    };
  }, []);

  useEffect(() => {
    if (!oauthSubmitting) return;
    const timer = window.setTimeout(() => {
      setInfo('The sign-in page is taking longer than usual to open. Check your connection. If navigation fails, reload this page and try again.');
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [oauthSubmitting]);

  useEffect(() => {
    if (!auth.loading && auth.user) navigate(takeReturnTo(), { replace: true });
  }, [auth.loading, auth.user, navigate]);

  const switchMode = (next: Mode) => {
    if (submitting || oauthSubmitting) return;
    setSearchParams(next === 'signin' ? {} : { mode: next });
    setPassword(''); setConfirmPassword('');
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
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
      navigate(takeReturnTo(), { replace: true });
      return;
    }

    // signin
    if (!email.trim()) return setError('Enter your email address.');
    if (!password) return setError('Enter your password.');
    setSubmitting(true);
    const { error: signInError } = await auth.signIn(email.trim(), password).catch(() => ({error: 'Could not sign in. Check your connection and retry.'}));
    setSubmitting(false);
    if (signInError) return setError(signInError);
    navigate(takeReturnTo(), { replace: true });
  };

  const continueWithOAuth = async (provider: 'google' | 'github') => {
    if (busy || oauthSubmitting) return;
    setError(null);
    setInfo(null);
    setOauthSubmitting(provider);
    const { error: oauthError } = await auth.signInWithOAuth(provider).catch(() => ({ error: `Could not start ${provider} sign in. Check your connection and retry.` }));
    if (oauthError) {
      setOauthSubmitting(null);
      setError(oauthError);
    }
  };

  const busy = submitting || Boolean(oauthSubmitting);
  return (
    <main className="dw-entry dw-auth">
      <aside className="dw-auth-story">
        <Link to="/welcome" className="dw-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
        <div className="dw-auth-story-copy">
          <div className="dw-entry-world dw-auth-world" aria-hidden="true" />
          <h2>Build skills<br />that stand up<br /><em>to practice.</em></h2>
          <p>Learn the foundations, work through guided challenges and investigate security incidents in a dedicated learning workspace.</p>
          <ul className="dw-auth-benefits"><li>Structured lessons, from fundamentals onward</li><li>Terminal, coding and investigation labs</li><li>Saved progress and a portfolio of your work</li></ul>
          <div className="dw-auth-crew"><CharacterAvatar id="sentinel" size={52} decorative /><p><strong>SENTINEL · SOC LEAD</strong>Your desk is ready, operator. Sign in and pick up the case where you left it.</p></div>
        </div>
        <p className="dw-auth-footnote">Works on your computer, tablet and phone. Your progress follows you.</p>
      </aside>
      <section className="dw-auth-main" aria-labelledby="auth-title">
        <div className="dw-auth-topbar">
          <Link to="/welcome" className="dw-brand dw-auth-mobile-brand" aria-label="DarkWorld home"><Logo className="dw-brand-mark" /><span>DARKWORLD</span></Link>
          <Link to="/welcome" className="dw-back">← Back to academy</Link>
        </div>
        <div className="dw-auth-form">
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
            <div className="dw-auth-divider"><span>or</span></div>
            <div className="dw-auth-socials" aria-label="Social sign in options">
              <button type="button" className="dw-button dw-button-secondary" disabled={busy} onClick={() => continueWithOAuth('google')}>
                <GoogleMark />{oauthSubmitting === 'google' ? 'Connecting…' : 'Continue with Google'}
              </button>
              <button type="button" className="dw-button dw-button-secondary" disabled={busy} onClick={() => continueWithOAuth('github')}>
                <GitHubMark />{oauthSubmitting === 'github' ? 'Connecting…' : 'Continue with GitHub'}
              </button>
            </div>
          </>}
        </div>
        <p className="dw-auth-footer">DarkWorld Academy · Learn with purpose.<br /><a href="/privacy.html">Privacy policy</a> · <a href="/terms.html">Terms of service</a></p>
      </section>
    </main>
  );
}
