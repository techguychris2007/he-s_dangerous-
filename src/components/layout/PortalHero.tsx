import type { ReactNode } from 'react';
import IsoBlock, { type IsoTone } from '../labs/IsoBlock';
import CharacterAvatar from '../characters/CharacterAvatar';
import { CHARACTERS, type CharacterId } from '../../data/characters';
import { ModuleIcon } from './icons';
import './portal-hero.css';

export interface PortalStation {
  id: string;
  label: string;
  sub: string;
  icon: string;
  done: number;
  total: number;
  active?: boolean;
  onSelect?: () => void;
}

/** Board positions (percent of the board) for 1–6 stations, laid out as an isometric island. */
const LAYOUTS: [number, number][][] = [
  [[50, 50]],
  [[30, 42], [70, 58]],
  [[50, 30], [25, 66], [75, 66]],
  [[50, 22], [22, 52], [78, 52], [50, 84]],
  [[50, 14], [20, 40], [80, 40], [32, 80], [68, 80]],
  [[34, 14], [66, 14], [16, 48], [84, 48], [34, 82], [66, 82]],
];

function toneFor(station: PortalStation): IsoTone {
  if (station.total > 0 && station.done >= station.total) return 'done';
  if (station.done > 0) return 'progress';
  return 'idle';
}

/** Navy portal masthead shared by the Build and Code portals: copy, stats and a guide on the left,
 *  and an isometric board of "stations" (tracks or languages) on the right that light up with
 *  progress. Stations with onSelect act as filters for the catalogue below. */
export default function PortalHero({ eyebrow, title, description, actions, stats, stations, guide, guideLine, boardLabel }: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  stats: { value: ReactNode; label: string }[];
  stations: PortalStation[];
  guide: CharacterId;
  guideLine: string;
  boardLabel: string;
}) {
  const layout = LAYOUTS[Math.min(stations.length, LAYOUTS.length) - 1] ?? LAYOUTS[0];
  const character = CHARACTERS[guide];
  return (
    <section className="dw-phero">
      <div className="dw-phero__inner">
        <div className="dw-phero__copy">
          <p className="dw-phero__eyebrow"><span />{eyebrow}</p>
          <h1>{title}</h1>
          <div className="dw-phero__lede">{description}</div>
          {actions && <div className="dw-phero__actions">{actions}</div>}
          <dl className="dw-phero__stats">
            {stats.map((s) => (
              <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
            ))}
          </dl>
          <div className="dw-phero__guide">
            <CharacterAvatar id={guide} size={44} decorative />
            <p><b>{character.name}</b><span>{guideLine}</span></p>
          </div>
        </div>

        <div className="dw-phero__board" role="group" aria-label={boardLabel}>
          <svg className="dw-phero__grid" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
            <path d="M200 8 L392 150 L200 292 L8 150 Z" />
            <path d="M104 79 L296 221 M296 79 L104 221 M200 8 L200 292 M8 150 L392 150" className="is-faint" />
          </svg>
          {stations.slice(0, LAYOUTS.length).map((st, i) => {
            const [x, y] = layout[i];
            const pct = st.total ? Math.round((100 * st.done) / st.total) : 0;
            const tone = toneFor(st);
            const body = (
              <>
                <IsoBlock width={92} depth={12 + Math.min(20, Math.round(st.total / 6))} tone={tone} glow={!!st.active} crest={<ModuleIcon icon={st.icon} />} />
                <span className="dw-phero__label">
                  <strong>{st.label}</strong>
                  <small>{st.sub}</small>
                  <i><em style={{ width: `${pct}%` }} /></i>
                </span>
              </>
            );
            const style = { left: `${x}%`, top: `${y}%`, zIndex: 10 + y };
            return st.onSelect ? (
              <button key={st.id} type="button" className="dw-phero__station" style={style} aria-pressed={!!st.active} onClick={st.onSelect} title={`${st.label}: ${st.done}/${st.total} solved`}>
                {body}
              </button>
            ) : (
              <div key={st.id} className="dw-phero__station" style={style} title={`${st.label}: ${st.done}/${st.total} solved`}>{body}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
