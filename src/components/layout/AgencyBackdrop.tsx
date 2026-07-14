import worldMapPhoto from '../../assets/banners/world-map.svg';

/** A dark "intelligence agency dossier" backdrop — world map + blueprint grid + a slow radar-style
 *  scan sweep + redacted-document bars + HUD corner reticles. Entirely original CSS/SVG composition
 *  (no real agency insignia, seals, or trademarks) built for the login/intro pages' visual identity. */
export default function AgencyBackdrop({ variant = 'full' }: { variant?: 'full' | 'subtle' }) {
  const dim = variant === 'subtle';

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* base wash */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, #16293e 0%, #0a1420 55%, #060d16 100%)' }}
      />

      {/* world map, tinted and desaturated */}
      <img
        src={worldMapPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: dim ? 0.06 : 0.1, mixBlendMode: 'screen', filter: 'saturate(0.4) brightness(1.4)' }}
      />

      {/* blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: dim ? 0.22 : 0.32,
          backgroundImage:
            'linear-gradient(rgba(148,180,214,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,180,214,0.09) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />

      {/* slow radar scan sweep */}
      <div
        className="absolute inset-x-0 h-40"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(63,140,255,0.1) 50%, transparent 100%)',
          animation: 'agency-scan 9s linear infinite',
        }}
      />

      {/* redacted-document bars, scattered like a declassified dossier page */}
      <div className="absolute top-[12%] left-[6%] w-28 h-2.5 rounded-sm bg-[#c9a15f]/[0.14]" />
      <div className="absolute top-[18%] left-[6%] w-40 h-2.5 rounded-sm bg-white/[0.05]" />
      <div className="absolute bottom-[16%] right-[7%] w-32 h-2.5 rounded-sm bg-[#c9a15f]/[0.14]" />
      <div className="absolute bottom-[10%] right-[7%] w-20 h-2.5 rounded-sm bg-white/[0.05]" />
      <div className="absolute top-[45%] right-[4%] w-24 h-2.5 rounded-sm bg-white/[0.04] hidden sm:block" />

      {/* HUD corner reticles */}
      {(['top-6 left-6 border-t border-l', 'top-6 right-6 border-t border-r', 'bottom-6 left-6 border-b border-l', 'bottom-6 right-6 border-b border-r'] as const).map(
        (pos) => (
          <div key={pos} className={`absolute ${pos} w-8 h-8 border-[#c9a15f]/25`} />
        ),
      )}

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 180px 40px rgba(0,0,0,0.55)' }}
      />

      <style>{`
        @keyframes agency-scan {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(110vh); }
        }
      `}</style>
    </div>
  );
}
