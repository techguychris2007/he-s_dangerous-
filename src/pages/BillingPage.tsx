import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PLAN_NAMES, formatCedis, formatUsd, isActive, openSubscriptionManager, paymentHistory, useEntitlement, type Payment } from '../lib/billing';
import { PlanBadge } from '../components/billing/PlanGate';
import '../components/billing/billing.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const CHANNEL: Record<string, string> = { card: 'Card', mobile_money: 'Mobile money' };

export default function BillingPage() {
  const entitlement = useEntitlement();
  const [params, setParams] = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [confirming, setConfirming] = useState(Boolean(reference));
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refreshRef = useRef(entitlement.refresh);
  refreshRef.current = entitlement.refresh;

  useEffect(() => { void paymentHistory().then(setPayments); }, []);

  // Back from Paystack: the webhook usually lands within seconds. Poll briefly until the payment shows.
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let tries = 0;
    const check = async () => {
      const history = await paymentHistory();
      if (cancelled) return;
      setPayments(history);
      if (history.some(payment => payment.reference === reference)) {
        await refreshRef.current();
        if (cancelled) return;
        setConfirming(false);
        setConfirmed(true);
        setParams({}, { replace: true });
        return;
      }
      if (++tries >= 15) { setConfirming(false); return; }
      window.setTimeout(() => { void check(); }, 3000);
    };
    void check();
    return () => { cancelled = true; };
  }, [reference, setParams]);

  const row = entitlement.row;
  const active = isActive(row);
  const manage = async () => {
    setBusy(true);
    setError(await openSubscriptionManager());
    setBusy(false);
  };

  return (
    <div className="dw-billing">
      <h1>Plan and billing</h1>

      {confirming && <p role="status" className="dw-billing__notice"><span className="dw-billing-spinner" aria-hidden="true" />Confirming your payment with Paystack. This usually takes a few seconds…</p>}
      {confirmed && <p role="status" className="dw-billing__notice dw-billing__notice--ok">Payment received. Your {PLAN_NAMES[entitlement.plan]} plan is active. Thank you for supporting DarkWorld.</p>}
      {!confirming && !confirmed && reference && <p role="status" className="dw-billing__notice">We have not received confirmation for this payment yet. If you approved it, refresh this page in a minute. If money left your account and your plan does not update, contact support with reference <code>{reference}</code>.</p>}
      {error && <p role="alert" className="dw-pricing__error">{error}</p>}

      <section className="dw-billing__card" aria-labelledby="billing-plan">
        <h2 id="billing-plan">Current plan</h2>
        <div className="dw-billing__plan">{PLAN_NAMES[entitlement.plan]}<PlanBadge plan={entitlement.plan} /></div>
        {entitlement.owner && <p>Owner account: every plan feature is included.</p>}
        {!entitlement.owner && !active && <p>You are on the free plan. Foundation modules, 159 labs and the library are included.</p>}
        {!entitlement.owner && active && row && (
          <>
            {row.source === 'card_subscription' && !row.cancel_at_period_end && <p>Renews by card on <strong>{dateFormat.format(new Date(row.current_period_end))}</strong>.</p>}
            {row.source === 'card_subscription' && row.cancel_at_period_end && <p>Renewal is cancelled. Your access continues until <strong>{dateFormat.format(new Date(row.current_period_end))}</strong>.</p>}
            {row.source === 'pass' && <p>Paid until <strong>{dateFormat.format(new Date(row.current_period_end))}</strong>. Passes do not renew; buy another to add time.</p>}
            {row.status === 'past_due' && <p>Your last card renewal did not go through. Paystack will try again; update your card to keep access.</p>}
          </>
        )}
        <div className="dw-billing__actions">
          {!entitlement.owner && <Link to="/pricing" className="dw-billing-btn dw-billing-btn--primary">{active ? 'Change plan or add time' : 'See Pro and Max'}</Link>}
          {row?.paystack_subscription_code && <button type="button" className="dw-billing-btn" disabled={busy} onClick={() => void manage()}>{busy ? 'Opening…' : 'Manage card subscription'}</button>}
        </div>
      </section>

      <section className="dw-billing__card" aria-labelledby="billing-history">
        <h2 id="billing-history">Payment history</h2>
        {payments.length === 0
          ? <p>No payments yet.</p>
          : <div className="dw-billing__scroll"><table className="dw-billing__table">
              <thead><tr><th scope="col">Date</th><th scope="col">Plan</th><th scope="col">Access</th><th scope="col">Method</th><th scope="col">Amount</th><th scope="col">Reference</th></tr></thead>
              <tbody>{payments.map(payment => (
                <tr key={payment.reference}>
                  <td>{dateFormat.format(new Date(payment.paid_at))}</td>
                  <td>{PLAN_NAMES[payment.plan]}</td>
                  <td>{payment.days} days{payment.source === 'card_subscription' ? ' (renewal)' : ''}</td>
                  <td>{CHANNEL[payment.channel ?? ''] ?? payment.channel ?? '—'}</td>
                  <td>{payment.currency === 'GHS' ? <>{formatCedis(payment.amount)} <span className="text-[var(--color-text-dim)]">(≈ {formatUsd(payment.amount)})</span></> : `${payment.amount / 100} ${payment.currency}`}</td>
                  <td><code>{payment.reference}</code></td>
                </tr>
              ))}</tbody>
            </table></div>}
        <p className="mt-3 text-xs text-[var(--color-text-dim)]">Paystack emails a receipt for every payment. Questions about a charge? See the <a className="underline" href="/refunds.html">Refund Policy</a>.</p>
      </section>
    </div>
  );
}
