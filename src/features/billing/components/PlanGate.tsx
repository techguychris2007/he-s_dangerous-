import { Link, useNavigate } from 'react-router-dom';
import { PLAN_NAMES, useEntitlement, type PlanId } from '../lib/billing';
import { IconCheck, IconCrown, IconLock } from '../../../shared/components/layout/icons';
import './billing.css';

const PLAN_PERKS: Record<'pro' | 'max', string[]> = {
  pro: ['Every core module in the curriculum', '390+ Medium and Hard labs across all 18 categories', 'Advanced SOC, cloud, mobile, wireless and IoT tracks'],
  max: ['Everything in Pro', 'Capstones and guided full-scope pentests', 'Advanced offensive campaigns', 'Expert modules: binary, malware, AI security, incident command'],
};

/** A small "PRO" / "MAX" chip for cards and lists. Renders nothing for free items. */
export function PlanBadge({ plan, locked = false }: { plan: PlanId; locked?: boolean }) {
  if (plan === 'free') return null;
  return (
    <span className={`dw-plan-badge dw-plan-badge--${plan}`} title={locked ? `Included with ${PLAN_NAMES[plan]}` : `${PLAN_NAMES[plan]} content`}>
      {locked ? <IconLock className="h-3 w-3" aria-hidden="true" /> : <IconCrown className="h-3 w-3" aria-hidden="true" />}
      {PLAN_NAMES[plan]}
    </span>
  );
}

/** Shown in place of a lesson or lab the learner's plan does not include. */
export function UpgradePanel({ required, kind, title, backTo, backLabel }: { required: 'pro' | 'max'; kind: 'lab' | 'lesson'; title: string; backTo: string; backLabel: string }) {
  const navigate = useNavigate();
  const { plan } = useEntitlement();
  return (
    <section className="dw-upgrade" aria-labelledby="dw-upgrade-title">
      <div className="dw-upgrade__icon" aria-hidden="true"><IconLock className="h-6 w-6" /></div>
      <p className="dw-upgrade__kicker">{PLAN_NAMES[required]} {kind}</p>
      <h1 id="dw-upgrade-title">{title}</h1>
      <p className="dw-upgrade__lead">
        This {kind} is included with DarkWorld {PLAN_NAMES[required]}.{' '}
        {plan === 'free' ? 'Your free plan keeps every foundation module, the library and 159 labs.' : `Your ${PLAN_NAMES[plan]} plan covers everything except the Max flagship content.`}
      </p>
      <ul className="dw-upgrade__perks">
        {PLAN_PERKS[required].map(perk => <li key={perk}><IconCheck className="h-4 w-4" aria-hidden="true" />{perk}</li>)}
      </ul>
      <div className="dw-upgrade__actions">
        <button type="button" className="dw-billing-btn dw-billing-btn--primary" onClick={() => navigate('/pricing')}>See plans and prices</button>
        <Link to={backTo} className="dw-billing-btn">{backLabel}</Link>
      </div>
      <p className="dw-upgrade__note">Pay by card or mobile money (MTN, Telecel, AirtelTigo).</p>
    </section>
  );
}

/** Holding state while the plan loads, so paying learners never see a lock flash. */
export function PlanLoading() {
  return <div role="status" className="dw-upgrade dw-upgrade--loading"><span className="dw-billing-spinner" aria-hidden="true" />Checking your plan…</div>;
}
