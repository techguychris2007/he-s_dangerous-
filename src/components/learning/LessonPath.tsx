import { Link } from 'react-router-dom';
import CharacterAvatar from '../characters/CharacterAvatar';
import type { CharacterId } from '../../data/characters';
import { IconCheck, IconLock, ModuleIcon } from '../layout/icons';
import IsoBlock, { type IsoTone } from '../labs/IsoBlock';
import './lesson-path.css';

const TILE = 112;
const TONES: Record<PathNodeState, IsoTone> = { done: 'done', current: 'progress', open: 'idle', locked: 'locked' };

export type PathNodeState = 'done' | 'current' | 'open' | 'locked';

export interface PathNode {
  id: string;
  title: string;
  to?: string;
  state: PathNodeState;
  /** 0-100; drawn as a ring on the current tile. */
  percent?: number;
  /** ModuleIcon key shown on the tile's crest; falls back to the stop number. */
  icon?: string;
  meta?: string;
}

/** Zig-zag columns (percent of board width) the tiles step through, TryHackMe-path style. */
const COLUMNS = [34, 66, 50, 30, 64, 46];
const ROW = 150;
const BINARY = ['10101001', '110001110110110', '--------', '01010111', '010000011', '------------', '10101', '01001000100', '0001000100'];

function Crest({ node, index }: { node: PathNode; index: number }) {
  if (node.state === 'done') return <IconCheck className="h-6 w-6" />;
  if (node.state === 'locked') return <IconLock className="h-5 w-5" />;
  if (node.icon) return <ModuleIcon icon={node.icon} className="h-6 w-6" />;
  return <span>{index + 1}</span>;
}

function Ring({ percent }: { percent: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <span className="lp-ring" aria-hidden="true">
      <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r={r} className="lp-ring__track" /><circle cx="26" cy="26" r={r} className="lp-ring__value" strokeDasharray={`${(c * percent) / 100} ${c}`} /></svg>
      <b>{percent}%</b>
    </span>
  );
}

/** A module (or learning path) drawn as connected isometric tiles: cleared stops glow green, the
 *  current stop is lit in the accent colour with a progress ring, and later stops wait in grey. */
export default function LessonPath({ eyebrow, title, guide, nodes }: { eyebrow: string; title: string; guide?: CharacterId; nodes: PathNode[] }) {
  const height = nodes.length * ROW + 40;
  const points = nodes.map((_, i) => ({ x: COLUMNS[i % COLUMNS.length], y: i * ROW + ROW / 2 + 10 }));
  return (
    <section className="lp-board" aria-label={`${title} lessons`}>
      <header className="lp-banner">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {guide && <CharacterAvatar id={guide} size={84} className="lp-banner__guide" decorative />}
      </header>

      <div className="lp-track" style={{ height }}>
        <pre className="lp-binary lp-binary--left" aria-hidden="true">{BINARY.join('\n')}</pre>
        <pre className="lp-binary lp-binary--right" aria-hidden="true">{[...BINARY].reverse().join('\n')}</pre>
        <svg className="lp-links" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {points.slice(1).map((p, i) => {
            const from = points[i];
            const lit = nodes[i].state === 'done' && nodes[i + 1].state !== 'locked';
            return <line key={i} x1={from.x} y1={from.y} x2={p.x} y2={p.y} className={lit ? 'is-lit' : ''} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
        <ol>
          {nodes.map((node, i) => {
            const { x, y } = points[i];
            const side = x > 50 ? 'left' : 'right';
            const body = (
              <>
                <IsoBlock width={TILE} depth={20} tone={TONES[node.state]} glow={node.state === 'current'} crest={<Crest node={node} index={i} />} className="lp-block" />
                {node.state === 'current' && node.percent !== undefined && <Ring percent={Math.max(0, Math.min(100, Math.round(node.percent)))} />}
                <span className={`lp-label lp-label--${side}`}>
                  <strong>{node.title}</strong>
                  {node.meta && <small>{node.meta}</small>}
                  {node.state === 'current' && <em>{node.percent ? 'Continue' : 'Up next'}</em>}
                </span>
              </>
            );
            return (
              <li key={node.id} className={`lp-node is-${node.state}`} style={{ left: `${x}%`, top: y }}>
                {node.to && node.state !== 'locked'
                  ? <Link to={node.to} aria-label={`${i + 1}. ${node.title}${node.state === 'done' ? ' (complete)' : ''}`}>{body}</Link>
                  : <span>{body}</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
