/** The DarkWorld mark: a classic heraldic shield, split blue/violet, with a bold "D" monogram cut into it. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="DarkWorld">
      <path
        d="M12 2.2 19.5 5v5.4c0 5.6-3.2 9.3-7.5 11.4C7.7 19.7 4.5 16 4.5 10.4V5L12 2.2Z"
        fill="var(--color-navy)"
      />
      <path d="M12 2.2 19.5 5v5.4c0 5.6-3.2 9.3-7.5 11.4V2.2Z" fill="var(--color-accent)" />
      <path d="M12 2.2 4.5 5v5.4c0 5.6 3.2 9.3 7.5 11.4V2.2Z" fill="var(--color-accent-2)" opacity="0.16" />
      <path
        d="M12 2.2 19.5 5v5.4c0 5.6-3.2 9.3-7.5 11.4C7.7 19.7 4.5 16 4.5 10.4V5L12 2.2Z"
        fill="none"
        stroke="var(--color-navy)"
        strokeOpacity="0.25"
        strokeWidth="0.4"
      />
      <rect x="8.1" y="7.4" width="2.1" height="10" rx="0.4" fill="white" />
      <path d="M10.15 7.9a4.6 4.55 0 0 1 0 9.2" fill="none" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
