/** When page-view analytics may run. Kept free of imports so scripts/check-monitoring.cjs can test it. */
export interface AnalyticsContext {
  /** The page's hostname. */
  hostname: string;
  /** VITE_ANALYTICS_HOSTNAME: the one production hostname to count. Unset means analytics is off. */
  expected?: string;
  production: boolean;
  owner: boolean;
  doNotTrack: boolean;
}

/** Counts only real learners on the real site: never in development, on preview deployments or any
 *  other hostname, for the owner accounts, or for visitors who ask not to be tracked. */
export function analyticsAllowed(context: AnalyticsContext): boolean {
  const expected = context.expected?.trim().toLowerCase();
  return Boolean(
    expected
    && context.production
    && context.hostname.toLowerCase() === expected
    && !context.owner
    && !context.doNotTrack,
  );
}
