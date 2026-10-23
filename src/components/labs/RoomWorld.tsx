import { useEffect, useRef, useState } from 'react';
import IsoBlock, { type IsoTone } from './IsoBlock';
import { ModuleIcon } from '../layout/icons';
import { categoryIconKey } from '../../data/labIcon';
import './room-world.css';

export interface District {
  category: string;
  total: number;
  done: number;
  started: number;
}

const COLS = 6;
const STEP_X = 118;    // half the horizontal distance between neighbouring plots
const STEP_Y = 78;     // half the vertical distance (room for labels between rows)
const TILE = 104;
const MIN_SCALE = 0.62; // below this the map scrolls sideways instead of shrinking further

/** The room catalog as an isometric world: one district per category, built taller the more rooms
 *  it holds, lit green when cleared and indigo while in progress. Selecting a district filters.
 *  The map scales to fit its column; labels sit on their own layer so tiles never hide them. */
export default function RoomWorld({ districts, selected, onSelect }: { districts: District[]; selected: string; onSelect: (category: string) => void }) {
  const rows = Math.ceil(districts.length / COLS);
  const maxTotal = Math.max(1, ...districts.map((d) => d.total));
  const width = (COLS - 1 + rows - 1) * STEP_X + TILE + 60;
  const height = (COLS - 1 + rows - 1) * STEP_Y + 230;
  const originX = (rows - 1) * STEP_X + TILE / 2 + 30;
  const originY = 120;

  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.max(MIN_SCALE, Math.min(1, entry.contentRect.width / width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  const plots = districts.map((d, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    return { d, c, r, x: originX + (c - r) * STEP_X, y: originY + (c + r) * STEP_Y };
  });

  return (
    <div ref={frame} className="rw-frame">
      <div className="rw-scroll" style={{ height: height * scale }}>
        <div className="rw-map" style={{ width, height, transform: `scale(${scale})` }} role="group" aria-label="Room districts">
          <svg className="rw-ground" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
            {plots.map(({ x, y }, i) => (
              <polygon key={i} points={`${x},${y - STEP_Y + 8} ${x + STEP_X - 8},${y} ${x},${y + STEP_Y - 8} ${x - STEP_X + 8},${y}`} />
            ))}
          </svg>
          {plots.map(({ d, c, r, x, y }) => {
            const depth = 10 + Math.round(30 * Math.sqrt(d.total / maxTotal));
            const tone: IsoTone = d.total > 0 && d.done >= d.total ? 'done' : d.started > 0 ? 'progress' : 'idle';
            const isOn = selected === d.category;
            return (
              <button
                key={d.category}
                type="button"
                className={`rw-district ${isOn ? 'is-selected' : ''}`}
                style={{ left: x, top: y, zIndex: 10 + c + r }}
                onClick={() => onSelect(isOn ? 'All' : d.category)}
                aria-pressed={isOn}
                aria-label={`${d.category}: ${d.total} rooms, ${d.done} cleared`}
              >
                <IsoBlock width={TILE} depth={depth} tone={tone} glow={isOn} crest={<ModuleIcon icon={categoryIconKey(d.category)} />} className="rw-district__block" />
              </button>
            );
          })}
          {plots.map(({ d, x, y }) => {
            const pct = d.total ? Math.round((100 * d.done) / d.total) : 0;
            return (
              <span key={d.category} className={`rw-label ${selected === d.category ? 'is-selected' : ''}`} style={{ left: x, top: y + 30 }} aria-hidden="true">
                <strong>{d.category}</strong>
                <small>{d.done}/{d.total} · {pct}%</small>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
