/** Single canonical difficulty badge — previously reimplemented three different ways (LabCard,
 *  CodeTaskPage, LabPage) with slightly different opacity/border styling, so the same difficulty
 *  looked visually different depending on which page you were on. */
const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30',
  Medium: 'bg-[var(--color-warn)]/20 text-[var(--color-warn)] border border-[var(--color-warn)]/30',
  Hard: 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
};

export default function DifficultyPill({ difficulty, className = '' }: { difficulty: string; className?: string }) {
  return <span className={`pill ${DIFFICULTY_CLASS[difficulty] ?? DIFFICULTY_CLASS.Medium} ${className}`}>{difficulty}</span>;
}
