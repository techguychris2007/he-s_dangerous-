import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { assessInvestigationStage } from '../../labs/investigation';
import SiemConsole from './SiemConsole';
import './investigation.css';

type Panel = 'investigate' | 'evidence' | 'decide' | 'debrief' | 'summary' | 'briefing';
const TOOL_NAMES: Record<string, string> = { splunk: 'Splunk', sentinel: 'Microsoft Sentinel', elastic: 'Elastic', shodan: 'Shodan', maltego: 'Maltego', theharvester: 'theHarvester' };
const WORKFLOW = [{ id: 'investigate', title: 'Investigate' }, { id: 'evidence', title: 'Select evidence' }, { id: 'decide', title: 'Decide' }] as const;

export default function InvestigationWorkbench({ scenario, completed, onComplete, onTranscriptChange }: {
  scenario: SiemLabScenario;
  completed: string[];
  onComplete: (proof: string) => void;
  onTranscriptChange: (transcript: string) => void;
}) {
  const investigation = scenario.investigation!;
  const nextIndex = investigation.stages.findIndex(stage => !completed.includes(stage.proof));
  const [index, setIndex] = useState(nextIndex < 0 ? investigation.stages.length - 1 : nextIndex);
  const [panel, setPanel] = useState<Panel>(nextIndex < 0 ? 'summary' : 'investigate');
  const [focused, setFocused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState('');
  const [observed, setObserved] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const launchButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = investigation.stages[index];
  const done = completed.includes(stage.proof);
  const completedCount = investigation.stages.filter(item => completed.includes(item.proof)).length;
  const score = Number((100 * completedCount / investigation.stages.length).toFixed(2));
  const checkpointPoints = Number((100 / investigation.stages.length).toFixed(2));
  const stageScenario: SiemLabScenario = { ...scenario, id: `${scenario.id}-${stage.id}`, tool: stage.tool, datasetLabel: 'Full case telemetry', objectives: [scenario.objectives[index]], entries: scenario.entries, investigation: undefined };
  const inspected = stageScenario.entries.filter(entry => observed.includes(entry.evidenceId ?? ''));

  useLayoutEffect(() => {
    if (!focused) return;
    const root = document.getElementById('root');
    const wasInert = root?.inert ?? false;
    const overflow = document.body.style.overflow;
    const opener = launchButton.current;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (document.fullscreenElement === workspace.current) {
          void document.exitFullscreen().catch(() => setNotice('Use Exit full screen to return to the window.'));
        } else if (!document.fullscreenElement) setFocused(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(workspace.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(element => element.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('keydown', keys);
      if (root) root.inert = wasInert;
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [focused]);
  useLayoutEffect(() => { if (focused) heading.current?.focus(); }, [focused, index, panel]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === workspace.current && workspace.current !== null);
    document.addEventListener('fullscreenchange', update);
    return () => { document.removeEventListener('fullscreenchange', update); };
  }, []);

  function changeStage(next: number) {
    if (next < 0 || next >= investigation.stages.length || next > (nextIndex < 0 ? investigation.stages.length - 1 : nextIndex)) return;
    setIndex(next); setPanel(completed.includes(investigation.stages[next].proof) ? 'debrief' : 'investigate');
    setObserved([]); setSelected([]); setChoice(null); setFeedback(''); setHintShown(false);
  }
  function submit() {
    const result = assessInvestigationStage(investigation, stage.id, completed, observed, selected, choice);
    setFeedback(result.message);
    if (result.passed && result.proof) {
      onComplete(result.proof);
      onTranscriptChange(`Checkpoint: ${stage.title}\nEvidence: ${selected.join(', ')}\nDecision: ${stage.choices[choice!]}\nAssessment: ${result.message}`);
      setPanel('debrief');
    }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === workspace.current) await document.exitFullscreen();
      else await workspace.current?.requestFullscreen();
      setNotice('');
    } catch { setNotice('Browser full screen is unavailable. Focus mode still fills your window.'); }
  }
  function leaveFocus() {
    if (document.fullscreenElement === workspace.current) void document.exitFullscreen().catch(() => {});
    setFocused(false);
  }
  function enterFocus() {
    if (done && nextIndex >= 0) changeStage(nextIndex);
    setFocused(true);
  }
  const stageName = stage.title.split(' · ').slice(1).join(' · ') || stage.title;
  return <>
    <section className="investigation-launch" aria-labelledby="investigation-launch-title">
      <p className="investigation-eyebrow">A focused investigation</p>
      <h2 id="investigation-launch-title">One checkpoint at a time.</h2>
      <p>{scenario.briefing}</p>
      <div className="investigation-launch-progress"><strong>{completedCount} / {investigation.stages.length} checkpoints</strong><span>{score} / 100 points</span></div>
      <progress value={completedCount} max={investigation.stages.length} aria-label="Investigation progress" />
      <div className="investigation-launch-next"><span>{nextIndex < 0 ? 'Ready to review' : 'Your next checkpoint'}</span><strong>{investigation.stages[nextIndex < 0 ? index : nextIndex].title}</strong><p>Search the case records, choose supporting evidence, then make your decision. Your verified checkpoints are saved as you progress.</p></div>
      <button ref={launchButton} type="button" className="investigation-primary" onClick={enterFocus}>{nextIndex < 0 ? 'Review investigation' : completedCount ? 'Continue investigation' : 'Start investigation'} <span aria-hidden="true">↗</span></button>
      <p className="investigation-launch-note">Opens a distraction-free workspace. Use Full screen inside, or press Esc to return.</p>
    </section>
    {focused && createPortal(<section ref={workspace} className="investigation-focus" role="dialog" aria-modal="true" aria-labelledby="focus-case-title">
      <header className="investigation-focus-header">
        <div className="investigation-focus-identity"><span className="investigation-eyebrow">DarkWorld · Incident casefile</span><h1 id="focus-case-title">{scenario.title}</h1></div>
        <div className="investigation-focus-tools"><strong className="investigation-score">{score} / 100 points</strong><button type="button" onClick={() => setPanel('briefing')}>Case briefing</button><button type="button" onClick={toggleFullscreen} aria-pressed={fullscreen}>{fullscreen ? 'Exit full screen' : 'Full screen'}</button><button type="button" onClick={leaveFocus}>Leave focus mode</button></div>
      </header>
      <progress className="investigation-focus-progress" value={completedCount} max={investigation.stages.length} aria-label="Verified checkpoints" />
      <div className="investigation-focus-stagebar"><label>Checkpoint <select aria-label="Current investigation stage" value={index} onChange={event => changeStage(Number(event.target.value))}>{investigation.stages.map((item, i) => <option key={item.id} value={i} disabled={i > (nextIndex < 0 ? investigation.stages.length - 1 : nextIndex)}>{completed.includes(item.proof) ? '✓ ' : ''}{item.title}{i > (nextIndex < 0 ? investigation.stages.length - 1 : nextIndex) ? ' · Locked' : ''}</option>)}</select></label><span>{completedCount}/{investigation.stages.length} verified · {TOOL_NAMES[stage.tool] ?? stage.tool} · Offline simulation</span></div>
      <div className="investigation-focus-task"><div><p className="investigation-eyebrow">Checkpoint {index + 1} of {investigation.stages.length}</p><h2 ref={heading} tabIndex={-1} id="checkpoint-title">{panel === 'summary' ? 'Investigation complete' : panel === 'briefing' ? 'Case briefing & sources' : stageName}</h2></div>
        {!['summary', 'briefing', 'debrief'].includes(panel) && <nav aria-label="Checkpoint workflow">{WORKFLOW.map((step, i) => <button key={step.id} type="button" aria-current={panel === step.id ? 'step' : undefined} disabled={step.id === 'evidence' ? !observed.length : step.id === 'decide' ? !selected.length : false} onClick={() => { setPanel(step.id); setFeedback(''); }}>{i + 1}. {step.title}{step.id === 'evidence' && selected.length ? ` (${selected.length})` : ''}</button>)}</nav>}
      </div>
      {notice && <p className="investigation-notice" role="status">{notice}</p>}
      <main className="investigation-focus-content">
        <section className="investigation-research" hidden={panel !== 'investigate'} aria-label="Investigate the checkpoint">
          <aside className="investigation-task-notes"><h3>Your task</h3><p>{stage.briefing}</p><h3>Question to resolve</h3><p>{stage.question}</p><button type="button" onClick={() => setHintShown(value => !value)} aria-expanded={hintShown}>{hintShown ? 'Hide query hint' : 'Show query hint'}</button>{hintShown && <p className="investigation-query-hint">Try <code>{stage.hint}</code></p>}<p className="investigation-limit">Search the full case dataset. Inspect individual source events before selecting evidence. Query reference explains the supported syntax.</p></aside>
          <div className="investigation-console"><SiemConsole key={stageScenario.id} embedded scenario={stageScenario} onFlagCaptured={() => { /* Only validated decisions award a checkpoint. */ }} onResults={entries => setObserved(current => [...new Set([...current, ...entries.flatMap(entry => entry.evidenceId ? [entry.evidenceId] : [])])])} onTranscriptChange={onTranscriptChange} /></div>
        </section>
        <section className="investigation-evidence-panel" hidden={panel !== 'evidence'} aria-label="Select supporting evidence"><p className="investigation-panel-intro">Select the inspected records that support your conclusion. Include only relevant evidence; unrelated records do not strengthen the case.</p><fieldset disabled={done}><legend className="sr-only">Supporting evidence</legend><div className="investigation-evidence-grid">{inspected.map(entry => <label className="investigation-evidence" key={entry.evidenceId}><span className="investigation-record-heading"><input type="checkbox" checked={selected.includes(entry.evidenceId!)} onChange={event => setSelected(current => event.target.checked ? [...current, entry.evidenceId!] : current.filter(id => id !== entry.evidenceId))} /><strong>{entry.evidenceId}</strong><span>{entry.eventType}</span></span><time>{entry.timestamp}</time><code>{entry.line}</code></label>)}</div></fieldset></section>
        <section className="investigation-decision-panel" hidden={panel !== 'decide'} aria-label="Make your decision"><div className="investigation-decision"><p className="investigation-eyebrow">Your evidence · {selected.join(', ') || 'None selected'}</p><fieldset disabled={done}><legend>{stage.question}</legend>{stage.choices.map((answer, i) => <label className="investigation-answer" key={answer}><input type="radio" name={`decision-${stage.id}`} checked={choice === i} onChange={() => { setChoice(i); setFeedback(''); }} /><span>{answer}</span></label>)}</fieldset>{feedback && !done && <p role="alert" className="investigation-feedback">{feedback}</p>}</div><aside className="investigation-decision-context"><h3>Keep your claim within the evidence</h3><p>{stage.briefing}</p><p>You can return to the search or change your evidence before submitting.</p></aside></section>
        <section className="investigation-debrief" hidden={panel !== 'debrief'} aria-label="Checkpoint review"><p className="investigation-eyebrow">Checkpoint verified · {checkpointPoints} points</p><h3>{done ? 'Evidence checked. Decision supported.' : 'Checkpoint assessment'}</h3><p>{stage.explanation}</p><div className="investigation-debrief-next"><strong>{index < investigation.stages.length - 1 ? 'Next checkpoint' : 'Final checkpoint'}</strong><p>{index < investigation.stages.length - 1 ? investigation.stages[index + 1].title : 'You have reached the end of this investigation.'}</p></div></section>
        <section className="investigation-summary" hidden={panel !== 'summary'} aria-label="Investigation summary"><p className="investigation-eyebrow">Training complete</p><h3>{score} / 100 points</h3><p className="investigation-finished">All {investigation.stages.length} evidence checkpoints are verified and saved with your lab progress.</p><p>You can review completed checkpoints from the stage selector. Follow-up work identified in the case remains part of the scenario; completing the exercise does not erase unresolved findings.</p></section>
        <section className="investigation-case-briefing" hidden={panel !== 'briefing'} aria-label="Case context and sources"><h3>Incident context</h3><p>{investigation.context}</p><h3>Training-data provenance</h3><p>{investigation.reconstruction}</p><h3>Public sources</h3><ul>{investigation.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></section>
      </main>
      <footer className="investigation-focus-footer"><span role="status">{panel === 'investigate' ? observed.length ? `${observed.length} records inspected. Ready to select evidence.` : 'Run a query to inspect the case records.' : panel === 'evidence' ? `${selected.length} records selected` : done ? 'Checkpoint verified and saved' : 'Verified checkpoints save automatically'}{notice ? ` ${notice}` : ''}</span><div>
        {panel === 'investigate' && <button type="button" className="investigation-primary" disabled={!observed.length} onClick={() => setPanel('evidence')}>Select evidence →</button>}
        {panel === 'evidence' && <><button type="button" onClick={() => setPanel('investigate')}>← Back to search</button><button type="button" className="investigation-primary" disabled={!selected.length} onClick={() => setPanel('decide')}>Make a decision →</button></>}
        {panel === 'decide' && <><button type="button" onClick={() => setPanel('evidence')}>← Review evidence</button><button type="button" className="investigation-primary" disabled={choice === null || !selected.length || done} onClick={submit}>Submit evidence &amp; decision</button></>}
        {panel === 'debrief' && <><button type="button" onClick={() => setPanel('investigate')}>Review search</button>{index < investigation.stages.length - 1 ? <button type="button" className="investigation-primary" onClick={() => changeStage(index + 1)}>Next checkpoint →</button> : <button type="button" className="investigation-primary" onClick={() => setPanel('summary')}>View summary →</button>}</>}
        {panel === 'briefing' && <button type="button" className="investigation-primary" onClick={() => setPanel(done ? 'debrief' : 'investigate')}>Back to checkpoint</button>}
        {panel === 'summary' && <button type="button" className="investigation-primary" onClick={leaveFocus}>Return to casefile</button>}
      </div></footer>
    </section>, document.body)}
  </>;
}
