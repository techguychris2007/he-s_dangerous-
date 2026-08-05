/** A single pulsing placeholder block — the shared building block behind every loading skeleton in
 *  the app (LeaderboardPage rolled its own inline version first; this is the reusable version of
 *  that same pattern for pages that didn't have one yet). */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-[var(--color-surface-2)] animate-pulse ${className}`} />;
}

/** A row-shaped skeleton (avatar + two lines of text) for list/table placeholders — the shape most
 *  "loading a list of accounts/entries" screens in this app need. */
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-4 ${className}`}>
      <SkeletonBlock className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <SkeletonBlock className="h-3.5 w-1/3" />
        <SkeletonBlock className="h-2.5 w-1/5" />
      </div>
    </div>
  );
}

/** `count` stacked SkeletonRows — the common case of "we don't know how many entries are coming,
 *  show a plausible handful while we wait." */
export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
