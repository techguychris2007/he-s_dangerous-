import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import Logo from '../components/layout/Logo';
import { IconLock } from '../components/layout/icons';
import './entry-pages.css';
import CharacterAvatar from '../components/characters/CharacterAvatar';

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
    <main className="dw-entry dw-auth">
      <aside className="dw-auth-story">
        <Link to="/welcome" className="dw-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
        <div className="dw-auth-story-copy">
          <div className="dw-entry-world dw-auth-world" aria-hidden="true" />
          <p className="dw-eyebrow">Account recovery</p>
          <h2>Back in<br />the field,<br /><em>securely.</em></h2>
          <p>Choose a new password for your workspace. Your progress, XP and streak stay exactly as you left them.</p>
          <div className="dw-auth-crew"><CharacterAvatar id="sentinel" size={52} decorative /><p><strong>SENTINEL · SOC LEAD</strong>New credentials, same operator. Lock it down and get back to the case board.</p></div>
        </div>
        <p className="dw-auth-footnote">Use a password you don’t use anywhere else.</p>
      </aside>
      <section className="dw-auth-main" aria-labelledby="reset-title">
        <Link to="/login" className="dw-back">← Back to sign in</Link>
        <div className="dw-auth-form">
          <p className="dw-eyebrow">Your learning workspace</p>
          <h1 id="reset-title">Set a new password.</h1>
          {auth.loading ? <p role="status" className="dw-auth-description">Checking your recovery session…</p> : !auth.user ? (
            <>
              <p className="dw-auth-description">This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
              <Link to="/login" className="dw-button dw-button-primary dw-auth-wide">Back to sign in<span aria-hidden="true">→</span></Link>
            </>
          ) : done ? (
            <>
              <p role="status" className="dw-auth-info dw-auth-gap">Password updated. You’re signed in with your new password.</p>
              <button type="button" className="dw-button dw-button-primary dw-auth-wide" onClick={() => navigate('/', { replace: true })}>Continue to dashboard<span aria-hidden="true">→</span></button>
            </>
          ) : (
            <>
              <p className="dw-auth-description">Pick something at least 6 characters long.</p>
              <form onSubmit={submit} className="dw-auth-fields" aria-busy={submitting}>
                <label><span>New password</span><div className="dw-field"><IconLock className="h-4 w-4" /><input autoFocus type="password" autoComplete="new-password" required minLength={6} disabled={submitting} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div></label>
                <label><span>Confirm new password</span><div className="dw-field"><IconLock className="h-4 w-4" /><input type="password" autoComplete="new-password" required disabled={submitting} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" /></div></label>
                {error && <p role="alert" className="dw-auth-error">{error}</p>}
                <button className="dw-button dw-button-primary" type="submit" disabled={submitting}>{submitting ? 'Updating…' : 'Update password'}<span aria-hidden="true">→</span></button>
              </form>
            </>
          )}
        </div>
        <p className="dw-auth-footer">DarkWorld Academy · Learn with purpose.</p>
      </section>
    </main>
  );
}
