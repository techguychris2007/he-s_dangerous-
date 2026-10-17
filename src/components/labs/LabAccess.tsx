import type { LabScenario } from '../../labs/types';
import { starterAccessFor } from '../../labs/starterAccess';

export default function LabAccess({ scenario }: { scenario: LabScenario }) {
  const access = starterAccessFor(scenario);
  if (!access) return null;
  return <section aria-label="Supplied lab credentials" className="my-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-4">
    <h2 className="text-sm font-bold text-[var(--color-heading)]">Your lab access</h2>
    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-dim)]">This exercise starts with an authorized account. Use these credentials in the lab terminal.</p>
    <dl className="mt-3 space-y-2 text-xs">
      <div><dt className="text-[var(--color-text-dim)]">Connect</dt><dd className="mt-1 break-all font-mono text-[var(--color-heading)] select-all">{access.command}</dd></div>
      <div><dt className="text-[var(--color-text-dim)]">Password</dt><dd className="mt-1 break-all font-mono text-[var(--color-heading)] select-all">{access.password}</dd></div>
    </dl>
    <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-dim)]">Run the connect command first. When the password prompt appears, enter the password and press Enter. Password characters stay hidden while you type.</p>
  </section>;
}
