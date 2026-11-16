import { isPrivateBreadcrumb, scrubReport, scrubText, scrubUrl } from './monitoringScrub';

/** Error reporting with Sentry. Off unless this is a production build and VITE_SENTRY_DSN is set,
 *  so local development and forks send nothing. The SDK loads after the app has rendered, in its
 *  own chunk. No session replay, no performance tracing, no learner identity: every report passes
 *  through scrubReport (src/lib/monitoringScrub.ts) first. */

type Sentry = typeof import('@sentry/react');
let sentry: Sentry | undefined;

export async function startMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!import.meta.env.PROD || !dsn || sentry) return;
  try {
    const sdk = await import('@sentry/react');
    sdk.init({
      dsn,
      release: import.meta.env.VITE_APP_RELEASE || undefined,
      environment: location.hostname.endsWith('.vercel.app') ? 'preview' : 'production',
      // Collect nothing about the learner or their requests in the first place; scrubReport below
      // is a second layer for anything that still reaches a report (messages, breadcrumbs).
      dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
      tracesSampleRate: 0,
      // Only errors from DarkWorld's own scripts, not browser extensions.
      allowUrls: [location.origin],
      beforeBreadcrumb: (crumb) => {
        if (isPrivateBreadcrumb(crumb)) return null;
        if (crumb.message) crumb.message = scrubText(crumb.message);
        if (crumb.data && typeof crumb.data.url === 'string') crumb.data = { ...crumb.data, url: scrubUrl(crumb.data.url) };
        return crumb;
      },
      beforeSend: (event) => scrubReport(event),
    });
    sentry = sdk;
  } catch {
    // Monitoring must never stop a lesson from loading.
  }
}

/** Reports an error the app caught itself, such as a render error behind the error boundary. */
export function reportError(error: unknown, componentStack?: string | null) {
  sentry?.captureException(error, componentStack ? { contexts: { react: { componentStack } } } : undefined);
}
