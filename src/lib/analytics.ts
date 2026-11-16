import { analyticsAllowed } from './analyticsPolicy';

/** Privacy-first page-view counts with SimpleAnalytics: no cookies, no personal data, no consent
 *  banner needed. It records the route (for example /#/labs), referrer, country and browser, and
 *  never the learner's identity or anything they type. See analyticsPolicy.ts for when it runs. */
let loaded = false;

/** Called once sign-in has resolved, so owner visits are never counted. */
export function startAnalytics(owner: boolean) {
  if (loaded) return;
  const allowed = analyticsAllowed({
    hostname: location.hostname,
    expected: import.meta.env.VITE_ANALYTICS_HOSTNAME,
    production: import.meta.env.PROD,
    owner,
    doNotTrack: navigator.doNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1',
  });
  if (!allowed) return;
  loaded = true;
  const script = document.createElement('script');
  script.src = 'https://scripts.simpleanalyticscdn.com/latest.js';
  script.async = true;
  // DarkWorld uses hash routes; without this every page would count as "/".
  script.dataset.mode = 'hash';
  script.referrerPolicy = 'strict-origin-when-cross-origin';
  document.head.appendChild(script);
}
