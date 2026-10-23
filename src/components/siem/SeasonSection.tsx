import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { useProgress } from '../../state/progressStore';
import { CHARACTERS, guideForArea } from '../../data/characters';
import { workbookProof } from '../../labs/workbookAssessment';
import CharacterAvatar from '../characters/CharacterAvatar';
import IsoBlock, { type IsoTone } from '../labs/IsoBlock';
import { DifficultyBars } from '../common/RoomHero';
import { IconCheck, IconCrown } from '../layout/icons';
import './season-section.css';

function episodeProgress(lab: SiemLabScenario, flagsOf: (id: string) => string[]): { done: number; total: number } {
  const total = lab.workbook?.questions.length ?? lab.totalFlags;
  const flags = flagsOf(lab.id);
  const done = lab.workbook ? lab.workbook.questions.filter((q) => flags.includes(workbookProof(lab.id, q.id))).length : Math.min(flags.length, total);
  return { done, total };
}

const ACT_SIZE = 8;
const ACT_NAMES = ['Opening moves', 'Quiet intruders', 'Escalation', 'Under pressure', 'Endgame', 'Aftermath'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const STEP = 94;      // horizontal distance between tiles
const RISE = 34;      // zig-zag offset

/** Season 1 — Halcyon Freight as a campaign map: acts of eight episodes, each a zig-zag row of 3D
 *  tiles joined by a trail that lights up as you clear them, with the act's final episode as its
 *  boss. Picking a tile opens its briefing; the next unfinished episode glows. */
export default function SeasonSection({ episodes }: { episodes: SiemLabScenario[] }) {
  const progress = useProgress();
  const flagsOf = (id: string) => progress.labFlags[id] ?? [];
  const stats = useMemo(() => episodes.map((e) => episodeProgress(e, flagsOf)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [episodes, progress.labFlags]);
  const cleared = stats.filter((p) => p.total > 0 && p.done === p.total).length;
  const nextIndex = stats.findIndex((p) => p.done < p.total);
  const findings = episodes.reduce((n, e) => n + (e.workbook?.questions.length ?? 0), 0);
  const findingsDone = stats.reduce((n, p) => n + p.done, 0);
  const [picked, setPicked] = useState<number | null>(null);
  const focus = picked ?? (nextIndex >= 0 ? nextIndex : 0);

  const acts = Array.from({ length: Math.ceil(episodes.length / ACT_SIZE) }, (_, a) => episodes.slice(a * ACT_SIZE, (a + 1) * ACT_SIZE));
  const lab = episodes[focus];
  const p = stats[focus];
  const guide = guideForArea(`${lab.title} soc`);
  const pct = Math.round((100 * cleared) / Math.max(1, episodes.length));

  return (
    <section className="dw-camp" aria-labelledby="dw-season-title">
      <header className="dw-camp__head">
        <div>
          <p className="dw-camp__kicker">Season 1 · Defensive campaign</p>
          <h2 id="dw-season-title">Halcyon Freight</h2>
          <p className="dw-camp__lede">A fictional logistics company under pressure from two threat actors across one quarter. Each episode is a real investigation on realistic telemetry — query the evidence, answer the findings, follow the story.</p>
        </div>
        <dl className="dw-camp__stats">
          <div><dt>Episodes</dt><dd>{cleared}/{episodes.length}</dd></div>
          <div><dt>Findings</dt><dd>{findingsDone}/{findings}</dd></div>
          <div className="dw-camp__season"><dt>Season progress</dt><dd>{pct}%</dd><span><i style={{ width: `${pct}%` }} /></span></div>
        </dl>
      </header>

      <div className="dw-camp__body">
        <div className="dw-camp__map">
          {acts.map((act, a) => {
            const base = a * ACT_SIZE;
            const actDone = act.every((_, i) => { const s = stats[base + i]; return s.total > 0 && s.done === s.total; });
            const width = (act.length - 1) * STEP + 100;
            const pts = act.map((_, i) => ({ x: 50 + i * STEP, y: i % 2 === 0 ? 92 : 92 + RISE }));
            return (
              <section key={a} className="dw-act" aria-label={`Act ${ROMAN[a]}: ${ACT_NAMES[a] ?? ''}`}>
                <div className="dw-act__label">
                  <span>Act {ROMAN[a]}</span>
                  <strong>{ACT_NAMES[a] ?? `Act ${a + 1}`}</strong>
                  <small>Episodes {base + 1}–{base + act.length}{actDone && <> · <IconCheck className="inline h-3 w-3" /> cleared</>}</small>
                </div>
                <div className="dw-act__track" style={{ width }}>
                  <svg className="dw-act__trail" viewBox={`0 0 ${width} 200`} width={width} height={200} aria-hidden="true">
                    {pts.slice(1).map((pt, i) => {
                      const s = stats[base + i];
                      const lit = s.total > 0 && s.done === s.total;
                      return <line key={i} x1={pts[i].x} y1={pts[i].y} x2={pt.x} y2={pt.y} className={lit ? 'is-lit' : ''} />;
                    })}
                  </svg>
                  {act.map((ep, i) => {
                    const idx = base + i;
                    const s = stats[idx];
                    const complete = s.total > 0 && s.done === s.total;
                    const boss = i === act.length - 1;
                    const tone: IsoTone = complete ? 'done' : s.done > 0 || idx === nextIndex ? 'progress' : 'idle';
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        className={`dw-ep ${idx === focus ? 'is-focus' : ''} ${idx === nextIndex ? 'is-next' : ''} ${boss ? 'is-boss' : ''}`}
                        style={{ left: pts[i].x, top: pts[i].y }}
                        onClick={() => setPicked(idx)}
                        aria-pressed={idx === focus}
                        aria-label={`Episode ${ep.episode ?? idx + 1}: ${ep.title}, ${ep.difficulty}, ${s.done} of ${s.total} findings`}
                      >
                        <IsoBlock width={boss ? 76 : 64} depth={boss ? 18 : 11} tone={tone} glow={idx === focus || idx === nextIndex} className="dw-ep__block"
                          crest={complete ? <IconCheck /> : boss ? <IconCrown /> : <b className="dw-ep__num">{ep.episode ?? idx + 1}</b>} />
                        <span className="dw-ep__label"><strong>{ep.title}</strong><small>{s.done}/{s.total}</small></span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="dw-camp__brief" aria-live="polite">
          <p className="dw-camp__kicker">Episode {lab.episode ?? focus + 1}{focus === nextIndex && <span className="dw-camp__next">Up next</span>}</p>
          <h3>{lab.title}</h3>
          <div className="dw-camp__meta"><DifficultyBars difficulty={lab.difficulty} /><span>{p.total} findings</span><span>{lab.tool.toUpperCase()}</span></div>
          <p className="dw-camp__briefing">{lab.narrative?.scene ?? lab.briefing}</p>
          <div className="dw-camp__bar" title={`${p.done} of ${p.total} findings`}><i style={{ width: `${p.total ? (100 * p.done) / p.total : 0}%` }} /></div>
          <div className="dw-camp__guide">
            <CharacterAvatar id={guide} size={40} decorative />
            <p><strong>{CHARACTERS[guide].name}</strong>{p.done === p.total && p.total > 0 ? 'Case closed. Review your findings any time.' : p.done > 0 ? `${p.total - p.done} findings still open on this case.` : 'Fresh case. Start with the timeline, then pivot on what stands out.'}</p>
          </div>
          <Link to={`/siem-lab/${lab.id}`} className="dw-camp__cta">{p.total > 0 && p.done === p.total ? 'Review case' : p.done > 0 ? 'Resume case' : 'Open case'} →</Link>
        </aside>
      </div>
    </section>
  );
}
