import { useId, type ReactNode } from 'react';
import './iso-block.css';

export type IsoTone = 'idle' | 'progress' | 'done' | 'locked' | 'offense' | 'defense' | 'analysis';

type Pt = [number, number];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

/** Diamond (top face) centred at cx,cy for an isometric footprint `w` wide. */
function diamond(cx: number, cy: number, w: number): { top: Pt; right: Pt; bottom: Pt; left: Pt } {
  return { top: [cx, cy - w / 4], right: [cx + w / 2, cy], bottom: [cx, cy + w / 4], left: [cx - w / 2, cy] };
}

/** An isometric 3D game piece: a lit slab with gradient faces and bright top edges, a raised inner
 *  plate with a glowing rim, light strips on the sides, and a bevelled shield crest floating above.
 *  Tones are built on platform tokens (see iso-block.css). Outer box: `width` wide, slab at the
 *  bottom, crest space above — the same footprint as before so every layout keeps its anchors. */
export default function IsoBlock({ width = 120, depth = 18, tone = 'idle', crest, glow = false, className = '' }: {
  width?: number;
  depth?: number;
  tone?: IsoTone;
  crest?: ReactNode;
  glow?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const W = width;
  const T = W / 2;                 // height of the top diamond
  const H = T + depth;             // slab height in the svg
  const cx = W / 2;
  const top = diamond(cx, T / 2, W);
  const lift = Math.max(2, depth * 0.18);
  const plate = diamond(cx, T / 2 - lift, W * 0.62);
  const plateBase = diamond(cx, T / 2, W * 0.62);
  const lit = tone === 'done' || tone === 'progress';
  const strip = (from: Pt, to: Pt, t0: number, t1: number, y: number): Pt[] => {
    const a: Pt = [from[0] + (to[0] - from[0]) * t0, from[1] + (to[1] - from[1]) * t0 + y];
    const b: Pt = [from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1 + y];
    return [a, b, [b[0], b[1] + Math.max(2, depth * 0.16)], [a[0], a[1] + Math.max(2, depth * 0.16)]];
  };
  const stripY = depth * 0.42;
  const crestW = W * 0.42;
  const crestH = W * 0.5;

  return (
    <span className={`iso-block iso-block--${tone} ${glow ? 'is-glowing' : ''} ${className}`} style={{ width: W, height: H + W * 0.42 }} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="iso-block__svg">
        <defs>
          <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="iso-s-top1" /><stop offset="1" className="iso-s-top2" /></linearGradient>
          <linearGradient id={`${uid}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="iso-s-left1" /><stop offset="1" className="iso-s-left2" /></linearGradient>
          <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="iso-s-right1" /><stop offset="1" className="iso-s-right2" /></linearGradient>
          <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="iso-s-plate1" /><stop offset="1" className="iso-s-plate2" /></linearGradient>
          <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={Math.max(1.2, W / 60)} /></filter>
        </defs>
        {/* slab */}
        <polygon fill={`url(#${uid}l)`} points={pts([top.left, top.bottom, [top.bottom[0], top.bottom[1] + depth], [top.left[0], top.left[1] + depth]])} />
        <polygon fill={`url(#${uid}r)`} points={pts([top.bottom, top.right, [top.right[0], top.right[1] + depth], [top.bottom[0], top.bottom[1] + depth]])} />
        <polygon fill={`url(#${uid}t)`} points={pts([top.top, top.right, top.bottom, top.left])} />
        {/* side light strips */}
        {lit && depth >= 8 && <>
          <polygon className="iso-block__strip" points={pts(strip(top.left, top.bottom, 0.18, 0.42, stripY))} />
          <polygon className="iso-block__strip" points={pts(strip(top.bottom, top.right, 0.58, 0.82, stripY))} />
        </>}
        {/* raised inner plate with glowing rim */}
        <polygon className="iso-block__plate-side" points={pts([plateBase.left, plateBase.bottom, plate.bottom, plate.left])} />
        <polygon className="iso-block__plate-side is-right" points={pts([plateBase.bottom, plateBase.right, plate.right, plate.bottom])} />
        <polygon fill={`url(#${uid}p)`} points={pts([plate.top, plate.right, plate.bottom, plate.left])} />
        {lit && <polygon className="iso-block__rim-glow" filter={`url(#${uid}g)`} points={pts([plate.top, plate.right, plate.bottom, plate.left])} />}
        <polygon className="iso-block__rim" points={pts([plate.top, plate.right, plate.bottom, plate.left])} />
        {/* bright top edges */}
        <polyline className="iso-block__edge" points={pts([top.left, top.top, top.right])} />
        <polyline className="iso-block__edge is-front" points={pts([top.left, top.bottom, top.right])} />
        <line className="iso-block__edge is-corner" x1={top.bottom[0]} y1={top.bottom[1]} x2={top.bottom[0]} y2={top.bottom[1] + depth} />
      </svg>
      {crest && (
        <span className="iso-block__crest" style={{ width: crestW, height: crestH, top: W * 0.18 }}>
          <svg viewBox="0 0 48 56" className="iso-block__shield">
            <defs>
              <linearGradient id={`${uid}ca`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="iso-s-crest1" /><stop offset="1" className="iso-s-crest2" /></linearGradient>
              <linearGradient id={`${uid}cb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="iso-s-crest3" /><stop offset="1" className="iso-s-crest4" /></linearGradient>
            </defs>
            <path d="M24 2 46 9v20c0 12-9 21-22 25C11 50 2 41 2 29V9z" className="iso-block__shield-rim" />
            <path d="M24 5 24 51C13 47 5 39 5 29V11z" fill={`url(#${uid}ca)`} />
            <path d="M24 5 43 11v18c0 10-8 18-19 22z" fill={`url(#${uid}cb)`} />
            <path d="M24 5 43 11v4L24 9 5 15v-4z" className="iso-block__shield-shine" />
          </svg>
          <span className="iso-block__crest-icon">{crest}</span>
        </span>
      )}
    </span>
  );
}
