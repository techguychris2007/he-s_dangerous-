import { Link } from 'react-router-dom';
import { PAID_PLANS_LIVE, PLAN_NAMES, useEntitlement } from '../lib/billing';
import { IconCrown } from '../../../shared/components/layout/icons';
import './billing.css';

/** Top-bar shortcut: "Upgrade" for free learners, the plan name for paying ones. */
export default function PlanChip() {
  const { plan, loading, owner } = useEntitlement();
  if (!PAID_PLANS_LIVE || loading || owner) return null;
  const free = plan === 'free';
  return (
    <Link
      to={free ? '/pricing' : '/billing'}
      className={`dw-plan-badge ${free ? 'dw-plan-badge--pro' : `dw-plan-badge--${plan}`}`}
      style={{ minHeight: 32, padding: '0 .75rem', fontSize: '.72rem' }}
      title={free ? 'See Pro and Max plans' : 'Plan and billing'}
    >
      <IconCrown className="h-3.5 w-3.5" aria-hidden="true" />
      {free ? 'Upgrade' : PLAN_NAMES[plan]}
    </Link>
  );
}
