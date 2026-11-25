import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GHS_PER_USD, RATE_DATE, MONTHLY_AMOUNT, MONTHLY_USD, PASS_OFFERS, PLAN_NAMES, PLAN_RANK, formatCedis, formatDollars, rememberReturnTo, startCheckout, useEntitlement,
  type PaidPlan,
} from '../lib/billing';
import { IconCheck, IconCrown } from '../../../shared/components/layout/icons';
import Logo from '../../../shared/components/layout/Logo';
import '../components/billing.css';

type Method = 'card' | 'mobile_money';
type Length = '1m' | '3m' | '12m';

const FEATURES: Record<'free' | PaidPlan, string[]> = {
  free: [
    'All pre-security and foundation modules',
    '159 hands-on labs, including 100+ beginner labs',
    'Networking, Linux, recon, Python, web and SOC basics',
    'The full DarkWorld library of free books',
    'XP, streaks, leaderboard and lab write-ups',
  ],
  pro: [
    'Everything in Free',
    'Every core module: AD, cloud, bug bounty, API, crypto, forensics, Security+',
    '390+ additional Medium and Hard labs',
    'Advanced SOC tracks: SIEM, detection engineering, incident response',
    'Mobile, wireless and IoT security',
  ],
  max: [
    'Everything in Pro',
    '116 flagship labs: capstones, guided full-scope pentests and campaigns',
    'Binary analysis, malware analysis and AI & LLM security',
    'Post-exploitation, identity and software-delivery attack modules',
    'Incident command and security leadership tracks',
  ],
};

const TAGLINES: Record<'free' | PaidPlan, string> = {
  free: 'Learn the foundations and practise every core skill, free for as long as you like.',
  pro: 'The complete curriculum for learners working towards a security role.',
  max: 'Everything DarkWorld offers, including the deepest real-world engagements.',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const entitlement = useEntitlement();
  const [method, setMethod] = useState<Method>('card');
  const [length, setLength] = useState<Length>('1m');
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  // Monthly renewal is card-only; mobile money buys a fixed pass.
  const renewing = method === 'card' && length === '1m';

  const priceFor = (plan: PaidPlan) => {
    if (renewing) return { offer: `${plan}-monthly`, amount: MONTHLY_AMOUNT[plan], usd: MONTHLY_USD[plan], unit: '/ month', note: 'Renews monthly. Cancel anytime.' };
    const pass = PASS_OFFERS.find(item => item.id === `${plan}-${length}`)!;
    const months = Math.round(pass.days / 30);
    const perMonth = `${formatCedis(Math.round(pass.amount / months / 100) * 100)} (≈ ${formatDollars(pass.usd / months)}) a month`;
    return { offer: pass.id, amount: pass.amount, usd: pass.usd, unit: `for ${pass.label}`, note: pass.days > 30 ? `${perMonth} · one-time payment, no renewal` : 'One-time payment, no renewal' };
  };

  const choose = async (plan: PaidPlan) => {
    setError('');
    if (!entitlement.signedIn) {
      rememberReturnTo('/pricing');
      navigate('/login?mode=signup');
      return;
    }
    const { offer } = priceFor(plan);
    setBusy(offer);
    const message = await startCheckout(offer, method);
    if (message) { setError(message); setBusy(''); }
  };

  const current = entitlement.plan;

  return (
    <div className="min-h-full" style={{ background: 'var(--color-bg, var(--color-surface))' }}>
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-[var(--color-border)]">
        <Link to={entitlement.signedIn ? '/' : '/welcome'} className="flex items-center gap-2 font-bold text-[var(--color-heading)]"><Logo className="h-8 w-8" /><span>DarkWorld Academy</span></Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          {entitlement.signedIn ? <Link to="/billing" className="text-[var(--color-accent-dim)]">Billing</Link> : <Link to="/login" className="text-[var(--color-accent-dim)]">Sign in</Link>}
        </nav>
      </header>

      <main className="dw-pricing">
        <div className="dw-pricing__head">
          <p className="dw-pricing__kicker">Plans and pricing</p>
          <h1>Start free. Go further when you are ready.</h1>
          <p>Every plan includes the foundations, the library and the community. Pro and Max unlock the full curriculum and our most realistic labs. Prices are in Ghana cedis.</p>
        </div>

        <div className="dw-pricing__switch">
          <div className="dw-segment" role="group" aria-label="Payment method">
            <button type="button" aria-pressed={method === 'card'} onClick={() => setMethod('card')}>Card</button>
            <button type="button" aria-pressed={method === 'mobile_money'} onClick={() => { setMethod('mobile_money'); }}>Mobile money</button>
          </div>
          <div className="dw-segment" role="group" aria-label="Billing length">
            <button type="button" aria-pressed={length === '1m'} onClick={() => setLength('1m')}>{method === 'card' ? 'Monthly' : '1 month'}</button>
            <button type="button" aria-pressed={length === '3m'} onClick={() => setLength('3m')}>3 months</button>
            <button type="button" aria-pressed={length === '12m'} onClick={() => setLength('12m')}>12 months · save 17%</button>
          </div>
        </div>

        {error && <p role="alert" className="dw-pricing__error">{error}</p>}

        <div className="dw-pricing__grid">
          <article className="dw-plan">
            <h2>Free</h2>
            <p className="dw-plan__tagline">{TAGLINES.free}</p>
            <p className="dw-plan__price"><strong>GH₵0</strong><span className="dw-plan__usd-inline">≈ US$0</span><span>forever</span></p>
            <p className="dw-plan__usd">No card needed</p>
            <ul className="dw-plan__features">{FEATURES.free.map(item => <li key={item}><IconCheck className="h-4 w-4" aria-hidden="true" />{item}</li>)}</ul>
            <div className="dw-plan__cta">
              {entitlement.signedIn
                ? current === 'free' ? <p className="dw-plan__current">Your current plan</p> : <p className="dw-plan__current">Included in your plan</p>
                : <Link to="/login?mode=signup" className="dw-billing-btn">Create a free account</Link>}
            </div>
          </article>

          {(['pro', 'max'] as const).map(plan => {
            const price = priceFor(plan);
            const owned = PLAN_RANK[current] >= PLAN_RANK[plan];
            return (
              <article key={plan} className={`dw-plan ${plan === 'pro' ? 'dw-plan--featured' : 'dw-plan--max'}`}>
                {plan === 'pro' && <span className="dw-plan__flag">Most popular</span>}
                <h2>{plan === 'max' && <IconCrown className="h-5 w-5 text-[var(--color-gold-dim)]" aria-hidden="true" />}{PLAN_NAMES[plan]}</h2>
                <p className="dw-plan__tagline">{TAGLINES[plan]}</p>
                <p className="dw-plan__price"><strong>{formatCedis(price.amount)}</strong><span className="dw-plan__usd-inline">≈ {formatDollars(price.usd)}</span><span>{price.unit}</span></p>
                <p className="dw-plan__usd">{price.note}</p>
                <ul className="dw-plan__features">{FEATURES[plan].map(item => <li key={item}><IconCheck className="h-4 w-4" aria-hidden="true" />{item}</li>)}</ul>
                <div className="dw-plan__cta">
                  {entitlement.owner
                    ? <p className="dw-plan__current">Owner account: everything included</p>
                    : <button type="button" disabled={Boolean(busy) || (owned && current !== plan)} className={`dw-billing-btn ${plan === 'max' ? 'dw-billing-btn--gold' : 'dw-billing-btn--primary'}`} onClick={() => void choose(plan)}>
                      {busy === price.offer ? 'Opening secure checkout…' : owned && current === plan ? `Add time to ${PLAN_NAMES[plan]}` : owned ? `Included in your plan` : `Get ${PLAN_NAMES[plan]}`}
                    </button>}
                </div>
              </article>
            );
          })}
        </div>

        <p className="dw-pricing__legal">
          Payments are processed securely by Paystack. Cards accept Visa and Mastercard; mobile money accepts MTN MoMo, Telecel Cash and AirtelTigo Money.
          Dollar prices are shown for reference; cedi prices were set at GH₵{GHS_PER_USD.toFixed(2)} = US$1 ({RATE_DATE}). You are charged the cedi amount, and a bank outside Ghana may convert it at its own rate. By paying you agree to the <a href="/terms.html">Terms of Service</a> and <a href="/refunds.html">Refund Policy</a>, and we handle your data as described in the <a href="/privacy.html">Privacy Policy</a>.
        </p>

        <section className="dw-pricing__faq" aria-labelledby="pricing-faq">
          <h2 id="pricing-faq">Questions</h2>
          <details><summary>How does mobile money work?</summary><p>Mobile money cannot renew automatically, so you buy a pass for 1, 3 or 12 months. Approve the prompt on your phone and your plan starts as soon as Paystack confirms the payment. Buy another pass at any time to add more time.</p></details>
          <details><summary>Can I cancel a card subscription?</summary><p>Yes. Open Billing and choose “Manage card subscription”. Renewal stops, and you keep access until the end of the month you already paid for.</p></details>
          <details><summary>What happens when my plan ends?</summary><p>You move back to Free. Your progress, XP, flags and write-ups stay on your account, and paid labs unlock again as soon as you renew.</p></details>
          <details><summary>Can I upgrade from Pro to Max?</summary><p>Yes. Max starts straight away and any unused Pro time is carried over, converted by price: each remaining day of Pro becomes a little over half a day of Max.</p></details>
          <details><summary>Do you offer refunds?</summary><p>If you are charged by mistake or cannot access what you paid for, contact us within 14 days. The <a href="/refunds.html">Refund Policy</a> has the details.</p></details>
        </section>
      </main>
    </div>
  );
}
