/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Sentry project DSN; error reporting stays off when unset (src/lib/monitoring.ts). */
  readonly VITE_SENTRY_DSN?: string;
  /** Set at build time from Vercel's commit SHA (vite.config.ts). */
  readonly VITE_APP_RELEASE?: string;
  /** SimpleAnalytics hostname to report as; analytics stays off when unset (src/lib/analytics.ts). */
  readonly VITE_ANALYTICS_HOSTNAME?: string;
  /** "on" limits DarkWorld to laptops and desktops (src/components/layout/ComputerAccessGate.tsx).
   *  Anything else, the default, lets phones and tablets in. */
  readonly VITE_COMPUTER_ONLY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
