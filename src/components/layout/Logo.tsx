/** The HackerHub mark: a navy/coral split shield with a bold "H" monogram cut into it. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="HackerHub">
      <path d="M12 2l8 3.5v6c0 5.2-3.4 8.6-8 10.5-4.6-1.9-8-5.3-8-10.5v-6L12 2Z" fill="var(--color-navy)" />
      <path d="M12 2l8 3.5v6c0 5.2-3.4 8.6-8 10.5V2Z" fill="var(--color-accent)" />
      <rect x="7.9" y="7" width="2.3" height="11" rx="0.5" fill="white" />
      <rect x="13.8" y="7" width="2.3" height="11" rx="0.5" fill="white" />
      <rect x="7.9" y="11.4" width="8.2" height="2.2" rx="0.5" fill="white" />
    </svg>
  );
}
