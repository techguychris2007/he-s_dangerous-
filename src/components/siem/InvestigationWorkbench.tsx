import { useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { assessInvestigationStage } from '../../labs/investigation';
import SiemConsole from './SiemConsole';
import './investigation.css';

export default function InvestigationWorkbench({ scenario, completed, onComplete, onTranscriptChange }: {
  scenario: SiemLabScenario;
  completed: string[];
  onComplete: (proof: string) => void;
  onTranscriptChange: (transcript: string) => void;
}) {
  const investigation = scenario.investigation!;
  const nextIndex = investigation.stages.findIndex(stage => !completed.includes(stage.proof));
  const [index, setIndex] = useState(nextIndex < 0 ? investigation.stages.length - 1 : nextIndex);
  const stage = investigation.stages[index];
  const [observed, setObserved] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const done = completed.includes(stage.proof);
  const completedCount = investigation.stages.filter(item => completed.includes(item.proof)).length;
  const score = Number((100 * completedCount / investigation.stages.length).toFixed(2));
  const checkpointPoints = 100 / investigation.stages.length;
  const stageScenario: SiemLabScenario = { ...scenario, id: `${scenario.id}-${stage.id}`, tool: stage.tool, datasetLabel: `${stage.title} · reconstructed evidence`, entries: scenario.entries.filter(entry => stage.availableEvidence.includes(entry.evidenceId ?? '')), investigation: undefined };

  function changeStage(next: number) {
    setIndex(next); setObserved([]); setSelected([]); setChoice(null); setFeedback(''); setHintShown(false);
  }
  function submit() {
    const result = assessInvestigationStage(investigation, stage.id, completed, observed, selected, choice);
    setFeedback(result.message);
    if (result.passed && result.proof) {
      onComplete(result.proof);
      onTranscriptChange(`Checkpoint: ${stage.title}\nEvidence: ${selected.join(', ')}\nDecision: ${stage.choices[choice!]}\nAssessment: ${result.message}`);
    }
  }
  return <div className="investigation-workbench">
    <header className="investigation-intro">
      <div className="investigation-score"><span>Incident investigation · {completedCount}/{investigation.stages.length} checkpoints</span><strong>{score} / 100 points</strong></div>
      <p>{investigation.context}</p>
      <details><summary>Incident sources &amp; training-data provenance</summary><p>{investigation.reconstruction}</p><ul>{investigation.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details>
    </header>
    <nav className="investigation-stages" aria-label="Investigation checkpoints">
      {investigation.stages.map((item, i) => <button type="button" key={item.id} disabled={i > (nextIndex < 0 ? investigation.stages.length : nextIndex)} aria-current={i === index ? 'step' : undefined} onClick={() => changeStage(i)}><span>{completed.includes(item.proof) ? '✓' : String(i + 1).padStart(2, '0')}</span>{item.title.split(' · ')[1]}</button>)}
    </nav>
    <section className="investigation-checkpoint" aria-labelledby="checkpoint-title">
      <h2 id="checkpoint-title">{stage.title}</h2><p>{stage.briefing}</p>
      <p className="investigation-search-note">Search these records in the console below. Filters support text, quoted phrases, field equality and wildcards. Reporting commands such as stats and joins are not executed in this offline workspace.</p>
      <div className="investigation-console"><SiemConsole key={stageScenario.id} scenario={stageScenario} onFlagCaptured={() => { /* Case proofs are awarded only after evidence and decision validation. */ }} onResults={entries => setObserved(current => [...new Set([...current, ...entries.flatMap(entry => entry.evidenceId ? [entry.evidenceId] : [])])])} onTranscriptChange={onTranscriptChange} /></div>
      <div className="investigation-decision">
        <fieldset disabled={done}><legend>1. Select the supporting evidence</legend><p>Choose the records needed to establish this checkpoint’s conclusion. Unrelated records do not strengthen the case.</p>
          {!observed.length && <p role="status">Run a search to make its results available for selection.</p>}
          {scenario.entries.filter(entry => observed.includes(entry.evidenceId ?? '')).map(entry => <label className="investigation-evidence" key={entry.evidenceId}><input type="checkbox" checked={selected.includes(entry.evidenceId!)} onChange={event => setSelected(current => event.target.checked ? [...current, entry.evidenceId!] : current.filter(id => id !== entry.evidenceId))} /><span><strong>{entry.evidenceId}</strong><span>{entry.timestamp} · {entry.eventType}</span><code>{entry.line}</code></span></label>)}
        </fieldset>
        <fieldset disabled={done}><legend>2. {stage.question}</legend>{stage.choices.map((answer, i) => <label className="investigation-answer" key={answer}><input type="radio" name={`decision-${stage.id}`} checked={choice === i} onChange={() => setChoice(i)} /><span>{answer}</span></label>)}</fieldset>
        <div className="investigation-actions">{!done && <button type="button" className="investigation-submit" onClick={submit}>Submit evidence &amp; decision</button>}<button type="button" onClick={() => setHintShown(current => !current)}>{hintShown ? 'Hide query hint' : 'Show query hint'}</button></div>
        {hintShown && <p className="investigation-hint">Try <code>{stage.hint}</code>. Read the returned records before selecting evidence.</p>}
        {(done || feedback) && <div className={`investigation-feedback ${done ? 'is-complete' : ''}`} role="status"><strong>{done ? `Checkpoint verified · ${Number(checkpointPoints.toFixed(2))} points` : 'Review your submission'}</strong><p>{done ? stage.explanation : feedback}</p></div>}
        {done && index < investigation.stages.length - 1 && <button type="button" className="investigation-submit" onClick={() => changeStage(index + 1)}>Continue to {investigation.stages[index + 1].title.split(' · ')[1]} →</button>}
        {completedCount === investigation.stages.length && <p className="investigation-finished" role="status">Investigation complete. All {investigation.stages.length} evidence checkpoints are verified and saved with your lab progress.</p>}
      </div>
    </section>
  </div>;
}
