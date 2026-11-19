import { useRef, type PointerEvent } from 'react';
import './darkworld-badge.css';

const EDGE_LAYERS = 10;

/** Platform identity badge. This is a community mark, not an independently verified credential.
 *  Rendered as a coin with real thickness: stacked edge layers behind the face, tilting toward the
 *  pointer with a moving glare, and a slow idle float when nobody is interacting with it. */
export default function DarkWorldBadge({ className = 'h-28 w-28' }: { className?: string }) {
  const coin = useRef<HTMLDivElement>(null);

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    const style = coin.current?.style;
    if (!style) return;
    style.setProperty('--dw-badge-ry', `${(x * 36).toFixed(2)}deg`);
    style.setProperty('--dw-badge-rx', `${(-y * 36).toFixed(2)}deg`);
    style.setProperty('--dw-badge-gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    style.setProperty('--dw-badge-gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const settle = () => {
    for (const name of ['--dw-badge-rx', '--dw-badge-ry', '--dw-badge-gx', '--dw-badge-gy']) coin.current?.style.removeProperty(name);
  };

  return (
    <div className={`dw-badge3d ${className}`} onPointerMove={tilt} onPointerLeave={settle}>
      <div ref={coin} className="dw-badge3d__coin">
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <span key={i} aria-hidden className="dw-badge3d__edge" style={{ transform: `translateZ(${-(i + 1)}px)` }} />
        ))}
        <span aria-hidden className="dw-badge3d__back" />
        <img src={`${import.meta.env.BASE_URL}darkworld-badge.svg`} className="dw-badge3d__face" width={320} height={320} alt="DarkWorld Cyber Academy community badge" decoding="async" />
        <span aria-hidden className="dw-badge3d__glare" />
      </div>
    </div>
  );
}
