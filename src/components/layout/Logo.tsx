import { useId } from 'react';

/** The DarkWorld mark: a heavy academy shield with a bold DW monogram and metallic depth. */
export default function Logo({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const rim = `${id}-rim`;
  const face = `${id}-face`;
  const accent = `${id}-accent`;
  const shadow = `${id}-shadow`;

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="DarkWorld">
      <defs>
        <linearGradient id={rim} x1="14" x2="50" y1="4" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff4cf" />
          <stop offset="0.38" stopColor="#d6a84f" />
          <stop offset="0.72" stopColor="#8f6423" />
          <stop offset="1" stopColor="#f3d58a" />
        </linearGradient>
        <linearGradient id={face} x1="13" x2="51" y1="8" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#182844" />
          <stop offset="0.48" stopColor="#070d18" />
          <stop offset="1" stopColor="#0d1628" />
        </linearGradient>
        <linearGradient id={accent} x1="20" x2="48" y1="12" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6fb2ff" />
          <stop offset="0.52" stopColor="#9f7bea" />
          <stop offset="1" stopColor="#c9a15f" />
        </linearGradient>
        <filter id={shadow} x="-20%" y="-16%" width="140%" height="148%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#c9a15f" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <path
          d="M32 3.8 56 12.7v18.1c0 15.7-9.8 25.9-24 31.1C17.8 56.7 8 46.5 8 30.8V12.7L32 3.8Z"
          fill={`url(#${rim})`}
        />
        <path
          d="M32 8.1 51.7 15.4v15.1c0 12.9-7.7 21.7-19.7 26.5-12-4.8-19.7-13.6-19.7-26.5V15.4L32 8.1Z"
          fill={`url(#${face})`}
        />
        <path d="M32 8.1 51.7 15.4v15.1c0 12.9-7.7 21.7-19.7 26.5V8.1Z" fill={`url(#${accent})`} opacity="0.28" />
        <path d="M15.8 18.1 32 12.1l16.2 6v3.2H15.8v-3.2Z" fill="#ffffff" opacity="0.06" />
        <path d="M18.5 24.8h27" stroke="#c9a15f" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18.5 48.6c3.5 3.9 8 6.7 13.5 8.8 5.5-2.1 10-4.9 13.5-8.8" stroke="#f3d58a" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M20.6 20.2h10.2c8.8 0 14.3 4.8 14.3 12.2 0 7.8-5.7 12.6-14.7 12.6h-9.8V20.2Zm7 6.3v12.2h3.2c4.5 0 7.1-2.3 7.1-6.2 0-3.8-2.6-6-7.1-6h-3.2Z"
          fill="#f8efe0"
        />
        <path
          d="M35.9 20.2 40 36.1l4.4-15.9h5.8l-7.7 24.8h-5.1l-4.1-14.2-4 14.2h-5.1l-7.7-24.8h5.9l4.4 15.9 4-15.9h5.1Z"
          fill="#f8efe0"
          opacity="0.94"
        />
        <path
          d="M32 8.1 51.7 15.4v15.1c0 12.9-7.7 21.7-19.7 26.5-12-4.8-19.7-13.6-19.7-26.5V15.4L32 8.1Z"
          fill="none"
          stroke="#fff5cf"
          strokeOpacity="0.35"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  );
}
