import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useParams } from 'react-router-dom';
import { findLab, type LabEntry } from '../data/labs';
import { useProgress } from '../state/progressStore';
import Terminal, { type TerminalHandle } from '../components/terminal/Terminal';
import type { LabSnapshot } from '../labs/engine';
import LiveWebsiteLab from '../components/labs/LiveWebsiteLab';
import DirectoryAttackGraph from '../components/labs/DirectoryAttackGraph';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabRatingWidget from '../components/labs/LabRatingWidget';
import LabComments from '../components/labs/LabComments';
import BeginnerGlossary from '../components/lesson/BeginnerGlossary';
import RoomHero from '../components/common/RoomHero';
import { estimateMinutes } from '../data/rooms';
import TaskList from '../components/common/MissionPlan';
import RoomAside from '../components/common/RoomAside';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { guideForArea } from '../data/characters';
import { labXpReward } from '../data/levels';
import LabAccess from '../components/labs/LabAccess';
import { labReference } from '../labs/labReference';
import { learningFrameFor } from '../labs/labTeaching';
import { categoryIconKey } from '../data/labIcon';
import { IconShield, IconTerminal } from '../components/layout/icons';
import '../components/labs/lab-mission.css';

const DEFENSIVE_CATEGORIES = new Set(['SOC', 'Forensics', 'Security+', 'Malware', 'Security Engineering']);

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
  const frame = learningFrameFor(scenario, stage);
  const narrative = scenario.narrative;
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
  const selectStage = (next: number) => {
    setStage(Math.max(0, Math.min(scenario.objectives.length - 1, next)));
    setHintCount(0);
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
        icon={categoryIconKey(scenario.category)}
        tone={DEFENSIVE_CATEGORIES.has(scenario.category) ? 'defense' : 'offense'}
      />
      <TaskList
        title="Mission plan"
        tasks={scenario.objectives.map((item, index) => ({ text: typeof item === 'string' ? item : item.text, detail: typeof item === 'string' ? undefined : item.why, done: done || reviewed.has(index), status: done ? 'complete' : reviewed.has(index) ? 'reviewed' : undefined }))}
        onOpen={index => { selectStage(index); setTab('objectives'); openRoom(); }}
      />
      {narrative && <section className="dw-case-file" aria-labelledby="case-file-title">
        <div className="dw-case-file__heading"><span>Case file</span><h2 id="case-file-title">Your role and mission</h2></div>
        <div className="dw-case-file__grid">
          <div><h3>Assignment</h3><p>{narrative.role}</p></div>
          <div><h3>Situation</h3><p>{narrative.scene}</p></div>
          <div><h3>Why it matters</h3><p>{narrative.stakes}</p></div>
          <div><h3>Training basis</h3><p>{narrative.realBasis}</p></div>
        </div>
        {narrative.mission && <p className="dw-case-file__mission"><strong>Mission:</strong> {narrative.mission}</p>}
      </section>}
      <BeginnerGlossary
        text={[scenario.briefing, ...scenario.objectives.map(o => typeof o === 'string' ? o : `${o.text} ${o.why ?? ''}`)].join(' ')}
        resetKey={scenario.id}
      />
      <section className="dw-room-brief" aria-labelledby="room-workspace-title">
        <h2 id="room-workspace-title">Your workspace</h2>
        <div className="dw-room-brief__grid">
          <div><span className="dw-room-brief__icon"><IconTerminal className="h-4 w-4" /></span><h3>Guided, side by side</h3><p>The guide and tools sit together in a focused room. Read the briefing, work through one objective at a time and inspect the results yourself. Checklist marks are your notes; only captured proofs count toward completion.</p></div>
          <div><span className="dw-room-brief__icon"><IconShield className="h-4 w-4" /></span><h3>Safe local simulation</h3><p>A browser simulation with a supported command set, not a full Kali machine. Type <code>help</code> to list commands. Your terminal session is kept when you return to this overview, until you leave or reload the lab.</p></div>
        </div>
        <LabAccess scenario={scenario} />
      </section>
      {done && <LabRatingWidget labId={scenario.id} />}
      <LabComments labId={scenario.id} />
      </div>
      <RoomAside
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, scenario.objectives.length)}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        facts={[{ label: 'Category', value: scenario.category }, { label: 'Tasks', value: String(scenario.objectives.length) }, { label: 'Proofs', value: `${captured}/${scenario.totalFlags}` }]}
        outcomes={[]}
        guide={guideForArea(scenario.category)}
        backTo="/labs"
        backLabel="All rooms"
        percent={percent}
        progressLabel={done ? 'Room complete' : 'Room progress'}
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
            {tab === 'briefing' && <><span className="dw-mission-eyebrow">01 / Situation</span><h3>{narrative ? 'Case briefing' : 'The brief'}</h3>{narrative ? <div className="dw-mission-case"><span>Role</span><p><strong>{narrative.role}</strong></p><span>Scene</span><p>{narrative.scene}</p><span>Stakes</span><p>{narrative.stakes}</p><span>Based on</span><p>{narrative.realBasis}</p>{narrative.mission && <p className="dw-mission-case__mission"><strong>Mission:</strong> {narrative.mission}</p>}</div> : <p>{scenario.briefing}</p>}<h4>Environment & scope</h4><p>You begin as <code>{scenario.attacker.user}</code> on <code>{scenario.attacker.hostname}</code>. {scenario.network.length ? 'Only the following simulated hosts belong to this exercise.' : 'This exercise uses files on your local lab workstation.'}</p>{scenario.network.length > 0 && <ul className="dw-mission-hosts">{scenario.network.map(host => <li key={host.ip}><strong>{host.hostname}</strong><code>{host.ip}</code></li>)}</ul>}<LabAccess scenario={scenario} /><button className="dw-mission-primary" onClick={() => setTab('objectives')}>Enter stage one →</button></>}
            {tab === 'objectives' && <><span className="dw-mission-eyebrow">Stage {stage + 1} of {scenario.objectives.length}</span><h3>{frame.title}</h3><div className="dw-learning-scene"><span>Scene update</span><p>{frame.scene}</p></div><h4>Question to answer</h4><p className="dw-learning-question">{frame.question}</p><h4>Why this method fits</h4><p>{frame.why}</p><h4>Read the output like an analyst</h4><p>{frame.observe}</p><details className="dw-command-method"><summary>Show the practical method</summary><p>Use this after you can explain why it answers the question:</p><pre>{frame.method}</pre></details><div className="dw-learning-decision"><strong>Decision gate</strong><p>{frame.decision}</p></div><p className="dw-mission-note">Run the method in the workspace and explain the result in your own words. Reviewing a stage records learning progress; only evidence proofs complete the room.</p><label className="dw-mission-review"><input type="checkbox" checked={reviewed.has(stage)} onChange={() => setReviewed(previous => { const next = new Set(previous); if (next.has(stage)) next.delete(stage); else next.add(stage); return next; })} />I can explain why this method fits and what its result means</label><div className="dw-mission-stage-nav"><button disabled={stage === 0} onClick={() => selectStage(stage - 1)}>← Previous</button><button disabled={stage >= scenario.objectives.length - 1} onClick={() => selectStage(stage + 1)}>Next stage →</button></div><details><summary>Case stages · {reviewed.size} reviewed</summary><ol className="dw-mission-objective-list">{scenario.objectives.map((_, index) => <li key={index}><button aria-current={stage === index ? 'step' : undefined} onClick={() => selectStage(index)}>{reviewed.has(index) ? '✓ ' : ''}Stage {index + 1}: {learningFrameFor(scenario, index).title}</button></li>)}</ol></details></>}
            {tab === 'hints' && <><span className="dw-mission-eyebrow">Stage {stage + 1} assistance</span><h3>Progressive hints</h3><p>Hints move from reasoning to technique to an exact training command. Stop as soon as you know what to test.</p>{hintCount >= 1 && <section className="dw-mission-hint"><h4>1 · Reframe the question</h4><p>{frame.question}</p></section>}{hintCount >= 2 && <section className="dw-mission-hint"><h4>2 · Choose the evidence</h4><p>{frame.observe}</p></section>}{hintCount >= 3 && <section className="dw-mission-hint dw-mission-hint--exact"><h4>3 · Exact training step</h4><pre>{frame.exactHint ?? frame.method}</pre><p>After running it, return to the decision gate. The command is useful only if you can interpret its result.</p></section>}<button className="dw-mission-primary" disabled={hintCount >= 3} onClick={() => setHintCount(count => Math.min(3, count + 1))}>{hintCount >= 3 ? 'All hints revealed' : hintCount === 0 ? 'Reveal reasoning hint' : hintCount === 1 ? 'Reveal evidence hint' : 'Reveal exact step'}</button></>}
            {tab === 'reference' && <><span className="dw-mission-eyebrow">Field notes</span><h3>Concepts & commands</h3>{reference.length ? reference.map(note => <section key={note.title}><h4>{note.title}</h4><p>{note.body}</p>{note.code && <pre>{note.code}</pre>}</section>) : <p>{scenario.briefing}</p>}<h4>Terminal controls</h4><p>↑ / ↓ recall commands. Tab completes a supported command or path. Ctrl+C interrupts a pending command; selected text can still be copied. Ctrl+L clears the view. Clearing the view does not reset the machine.</p></>}
          </div>
          <footer className="dw-mission-guide-footer"><span>{reviewed.size}/{scenario.objectives.length} stages understood</span><button onClick={() => setSharing(true)}>Case notebook ↗</button></footer>
        </aside>
        <section className="dw-mission-tools" aria-label="Lab tools">
          <div className="dw-mission-tool-tabs"><button aria-pressed={view === 'terminal'} onClick={() => setView('terminal')}>Terminal</button>{hasTarget && <button aria-pressed={view === 'target'} onClick={() => setView('target')}>Visual target</button>}<span>Local sandbox · {busy ? 'Command running' : 'Ready'}</span></div>
          <div className="dw-mission-terminal" hidden={view !== 'terminal'}><Terminal ref={terminalRef} scenario={scenario} onFlagCaptured={flag => progress.captureFlag(scenario.id, flag, scenario.totalFlags)} onStateChange={setSnapshot} onBusyChange={setBusy} onTranscriptChange={value => { transcriptRef.current = value; }} /></div>
          {hasTarget && <div className="dw-mission-target" hidden={view !== 'target'}>{scenario.webApplication && <LiveWebsiteLab application={scenario.webApplication} snapshot={snapshot?.webApplication} onCommand={command => terminalRef.current?.executeCommand(command)} disabled={busy} />}{scenario.directoryMap && <DirectoryAttackGraph map={scenario.directoryMap} snapshot={snapshot} />}</div>}
        </section>
        <CyberLabAI getContext={() => ({ kind: 'lab', title: scenario.title, subtitle: `${scenario.difficulty} · ${scenario.category}`, bodyText: scenario.briefing + '\n' + scenario.objectives.map(item => typeof item === 'string' ? item : `${item.text}\n${item.why ?? ''}`).join('\n'), terminalTranscript: transcriptRef.current })} />
      </div>
      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </dialog>, document.body)}
  </>;
}
