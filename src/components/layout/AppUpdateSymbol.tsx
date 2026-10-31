/** Original embossed package-and-arrow symbol, shared by navigation and update notices. */
export default function AppUpdateSymbol({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m5 10 11-6 11 6v13l-11 6-11-6z" fill="var(--chrome-raise)" stroke="var(--chrome-highlight)" strokeWidth="1.2"/><path d="m5 10 11 6 11-6-11-6z" fill="var(--chrome-line-strong)"/><path d="M16 16v13l11-6V10z" fill="var(--chrome-bg)" opacity=".65"/><path d="M16 7v13m-4-4 4 4 4-4" stroke="var(--chrome-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m9 8 7-4 7 4" stroke="var(--chrome-text)" strokeLinecap="round" opacity=".6"/></svg>;
}
