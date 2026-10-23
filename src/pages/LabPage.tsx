import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useParams } from 'react-router-dom';
import { findLab, type LabEntry } from '../data/labs';
import { useProgress } from '../state/progressStore';
import Terminal, { type TerminalHandle } from '../components/terminal/Terminal';
import type { LabSnapshot } from '../labs/engine';
import LiveWebsiteLab from '../components/labs/LiveWebsiteLab';
import DirectoryAttackGraph from '../components/labs/DirectoryAttackGraph';
import PreSecurityWorkbench from '../components/labs/PreSecurityWorkbench';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabRatingWidget from '../components/labs/LabRatingWidget';
import LabComments from '../components/labs/LabComments';
import RoomHero from '../components/common/RoomHero';
import { estimateMinutes } from '../data/rooms';
import TaskList from '../components/common/TaskList';
import RoomAside from '../components/common/RoomAside';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { guideForArea } from '../data/characters';
import { labXpReward } from '../data/levels';
import LabAccess from '../components/labs/LabAccess';
import { labReference } from '../labs/labReference';
import '../components/labs/lab-mission.css';

export default function LabPage() {
  const { labSlug } = useParams();
  const entry = findLab(labSlug);
  return entry ? <LabMission key={entry.scenario.id} entry={entry} /> : <Navigate to="/labs" replace />;
}

function LabMission({ entry }: { entry: LabEntry }) {
  const { scenario } = entry;
  const progress = useProgress();
  const roomRef = useRef<HTMLDialogElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const terminalRef = useRef<TerminalHandle>(null);
  const transcriptRef = useRef('');
  const [started, setStarted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [tab, setTab] = useState<'briefing' | 'objectives' | 'hints' | 'reference'>('briefing');
  const [stage, setStage] = useState(0);
  const [reviewed, setReviewed] = useState<Set<number>>(() => new Set());
  const [hintCount, setHintCount] = useState(0);
  const [view, setView] = useState<'terminal' | 'target'>('terminal');
  const [snapshot, setSnapshot] = useState<LabSnapshot>();
  const [busy, setBusy] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const captured = progress.flagCount(scenario.id);
  const done = captured >= scenario.totalFlags;
  const percent = Math.min(100, Math.round(captured / Math.max(1, scenario.totalFlags) * 100));
  const step = scenario.objectives[stage];
  const objective = typeof step === 'string' ? { text: step } : step;
  const reference = labReference[scenario.id] ?? scenario.objectives.flatMap(item => typeof item !== 'string' && item.why ? [{ title: item.text, body: item.why, code: undefined }] : []);
  const hasTarget = Boolean(scenario.webApplication || scenario.directoryMap);

  useEffect(() => () => { if (roomRef.current?.open) roomRef.current.close(); }, []);
  useEffect(() => {
    const changed = () => setIsFullscreen(document.fullscreenElement === roomRef.current && roomRef.current !== null);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);

  const openRoom = () => {
    roomRef.current?.showModal();
    setStarted(true);
  };
  const closeRoom = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    roomRef.current?.close();
    startRef.current?.focus();
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await roomRef.current?.requestFullscreen();
      setFullscreenError('');
    } catch { setFullscreenError('Browser fullscreen is unavailable. The focused workspace remains open.'); }
  };

  return <>
    <section className="dw-mission-launch">
      <div className="dw-room-page"><div className="min-w-0">
      <RoomHero
        ref={startRef}
        guide={guideForArea(scenario.category)}
        crumbs={[{ label: 'Rooms', to: '/labs' }, { label: scenario.category, to: `/labs?category=${encodeURIComponent(scenario.category)}` }, { label: scenario.title }]}
        title={scenario.title}
        summary={scenario.briefing}
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, scenario.objectives.length)}
        facts={[`${scenario.objectives.length} tasks`, `${scenario.totalFlags} proof${scenario.totalFlags === 1 ? '' : 's'}`]}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        percent={percent}
        progressLabel={done ? 'Room complete' : 'Room progress'}
        saved={progress.isBookmarked(scenario.id)}
        onToggleSave={() => progress.toggleBookmark(scenario.id)}
        primaryLabel={done ? 'Review workspace' : started ? 'Resume workspace' : captured > 0 ? 'Continue lab' : 'Start lab'}
        onPrimary={openRoom}
      />
      <TaskList
        title="Tasks"
        tasks={scenario.objectives.map((item, index) => ({ text: typeof item === 'string' ? item : item.text, done: done || reviewed.has(index) }))}
        onOpen={index => { setStage(index); setTab('objectives'); openRoom(); }}
      />
      <div className="dw-mission-preflight"><h2>Your workspace</h2><p>The guide and tools sit side by side in a focused room. Read the briefing, work through one objective at a time, and inspect the results yourself. Checklist marks are your notes; only captured proofs count toward lab completion.</p><p>This is a local browser simulation with a supported command set, rather than a full Kali virtual machine. Type <code>help</code> to see available commands. Your live terminal session is kept when you return to this overview, until you leave or reload this lab.</p><LabAccess scenario={scenario} /></div>
      {done && <LabRatingWidget labId={scenario.id} />}
      <LabComments labId={scenario.id} />
      </div>
      <RoomAside
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, scenario.objectives.length)}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        facts={[{ label: 'Category', value: scenario.category }, { label: 'Tasks', value: String(scenario.objectives.length) }, { label: 'Proofs', value: `${captured}/${scenario.totalFlags}` }]}
        outcomes={scenario.objectives.map(item => typeof item === 'string' ? item : item.text)}
        outcomesTitle="Tasks in this room"
        guide={guideForArea(scenario.category)}
        backTo="/labs"
        backLabel="All rooms"
      />
      </div>
    </section>

    {createPortal(<dialog ref={roomRef} className="dw-mission-room" aria-labelledby="mission-room-title" onCancel={event => { if (sharing) { event.preventDefault(); setSharing(false); } }}>
      <header className="dw-mission-header">
        <div><CharacterAvatar id={guideForArea(scenario.category)} size={42} decorative /><div className="min-w-0"><span className="dw-mission-eyebrow">{scenario.category} · {scenario.difficulty}</span><h2 id="mission-room-title">{scenario.title}</h2></div></div>
        <div className="dw-mission-header-actions"><span className={done ? 'dw-mission-complete' : ''} role="status">{done ? 'Lab complete · ' : ''}{captured}/{scenario.totalFlags} proofs</span>{document.fullscreenEnabled && <button onClick={fullscreen} aria-pressed={isFullscreen}>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>}<button onClick={() => void closeRoom()}>Return to overview</button></div>
      </header>
      <div className="dw-mission-progress" role="progressbar" aria-label="Verified lab progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /><b>Room progress: {percent}%</b></div>
      {fullscreenError && <p className="dw-mission-notice" role="status">{fullscreenError}</p>}
      <div className="dw-mission-body">
        <aside className="dw-mission-guide" aria-label="Lab guide">
          <nav aria-label="Guide sections">{(['briefing', 'objectives', 'hints', 'reference'] as const).map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item === 'objectives' ? 'Objectives' : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
          <div className="dw-mission-guide-content" key={tab}>
            {tab === 'briefing' && <><span className="dw-mission-eyebrow">01 / Situation</span><h3>The brief</h3><p>{scenario.briefing}</p><h4>Environment & scope</h4><p>You begin as <code>{scenario.attacker.user}</code> on <code>{scenario.attacker.hostname}</code>. {scenario.network.length ? 'Only the following simulated hosts belong to this exercise.' : 'This exercise uses files on your local lab workstation.'}</p>{scenario.network.length > 0 && <ul className="dw-mission-hosts">{scenario.network.map(host => <li key={host.ip}><strong>{host.hostname}</strong><code>{host.ip}</code></li>)}</ul>}<LabAccess scenario={scenario} /><button className="dw-mission-primary" onClick={() => setTab('objectives')}>Read the first objective →</button></>}
            {tab === 'objectives' && <><span className="dw-mission-eyebrow">Objective {stage + 1} of {scenario.objectives.length}</span><h3>{objective?.text ?? 'Explore the evidence'}</h3>{objective?.why && <><h4>Why this matters</h4><p>{objective.why}</p></>}<p className="dw-mission-note">Try the task in the workspace, read its output, then mark it reviewed when you can explain the result. This checklist does not award a proof.</p><label className="dw-mission-review"><input type="checkbox" checked={reviewed.has(stage)} onChange={() => setReviewed(previous => { const next = new Set(previous); if (next.has(stage)) next.delete(stage); else next.add(stage); return next; })} />I have practiced and understood this objective</label><div className="dw-mission-stage-nav"><button disabled={stage === 0} onClick={() => setStage(value => value - 1)}>← Previous</button><button disabled={stage >= scenario.objectives.length - 1} onClick={() => setStage(value => value + 1)}>Next objective →</button></div><details><summary>All objectives · {reviewed.size} reviewed</summary><ol className="dw-mission-objective-list">{scenario.objectives.map((item, index) => <li key={index}><button aria-current={stage === index ? 'step' : undefined} onClick={() => setStage(index)}>{reviewed.has(index) ? '✓ ' : ''}{typeof item === 'string' ? item : item.text}</button></li>)}</ol></details></>}
            {tab === 'hints' && <><span className="dw-mission-eyebrow">Optional assistance</span><h3>A nudge when you need it</h3><p>Reveal one hint at a time. Compare it with what you have already observed before revealing another.</p>{scenario.hints.slice(0, hintCount).map((hint, index) => <section className="dw-mission-hint" key={index}><h4>Hint {index + 1}</h4><p>{hint}</p></section>)}<button className="dw-mission-primary" disabled={hintCount >= scenario.hints.length} onClick={() => setHintCount(count => count + 1)}>{hintCount >= scenario.hints.length ? 'All hints revealed' : 'Reveal next hint'}</button></>}
            {tab === 'reference' && <><span className="dw-mission-eyebrow">Field notes</span><h3>Concepts & commands</h3>{reference.length ? reference.map(note => <section key={note.title}><h4>{note.title}</h4><p>{note.body}</p>{note.code && <pre>{note.code}</pre>}</section>) : <p>{scenario.briefing}</p>}<h4>Terminal controls</h4><p>↑ / ↓ recall commands. Tab completes a supported command or path. Ctrl+C interrupts a pending command; selected text can still be copied. Ctrl+L clears the view. Clearing the view does not reset the machine.</p></>}
          </div>
          <footer className="dw-mission-guide-footer"><span>{reviewed.size}/{scenario.objectives.length} objectives reviewed</span><button onClick={() => setSharing(true)}>Optional notebook ↗</button></footer>
        </aside>
        <section className="dw-mission-tools" aria-label="Lab tools">
          <div className="dw-mission-tool-tabs"><button aria-pressed={view === 'terminal'} onClick={() => setView('terminal')}>{scenario.preSecurityTool ? 'Tool bench' : 'Terminal'}</button>{hasTarget && <button aria-pressed={view === 'target'} onClick={() => setView('target')}>Visual target</button>}<span>Local sandbox · {busy ? 'Command running' : 'Ready'}</span></div>
          <div className="dw-mission-terminal" hidden={view !== 'terminal'}>{scenario.preSecurityTool ? <PreSecurityWorkbench mode={scenario.preSecurityTool} scenarioId={scenario.id} onFlagCaptured={flag => progress.captureFlag(scenario.id, flag, scenario.totalFlags)} onTranscriptChange={value => { transcriptRef.current = value; }} /> : <Terminal ref={terminalRef} scenario={scenario} onFlagCaptured={flag => progress.captureFlag(scenario.id, flag, scenario.totalFlags)} onStateChange={setSnapshot} onBusyChange={setBusy} onTranscriptChange={value => { transcriptRef.current = value; }} />}</div>
          {hasTarget && <div className="dw-mission-target" hidden={view !== 'target'}>{scenario.webApplication && <LiveWebsiteLab application={scenario.webApplication} snapshot={snapshot?.webApplication} onCommand={command => terminalRef.current?.executeCommand(command)} disabled={busy} />}{scenario.directoryMap && <DirectoryAttackGraph map={scenario.directoryMap} snapshot={snapshot} />}</div>}
        </section>
        <CyberLabAI getContext={() => ({ kind: 'lab', title: scenario.title, subtitle: `${scenario.difficulty} · ${scenario.category}`, bodyText: scenario.briefing + '\n' + scenario.objectives.map(item => typeof item === 'string' ? item : `${item.text}\n${item.why ?? ''}`).join('\n'), terminalTranscript: transcriptRef.current })} />
      </div>
      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </dialog>, document.body)}
  </>;
}
