import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../account/state/authStore';
import { useProgress } from '../../progress/state/progressStore';
import type { SiemLabScenario } from '../engine/siemTypes';
import { assessWorkbookAnswer, workbookProof } from '../engine/workbookAssessment';
import QueryConsole from './QueryConsole';
import RoomHero from '../../labs/components/room/RoomHero';
import TaskList from '../../labs/components/room/MissionPlan';
import RoomAside from '../../labs/components/room/RoomAside';
import { guideForArea } from '../../../shared/characters/characters';
import { labXpReward } from '../../progress/data/levels';
import { estimateMinutes } from '../../labs/data/rooms';
import { IconShield, IconTerminal, IconArrowRight, IconArrowLeft } from '../../../shared/components/layout/icons';
import '../../labs/components/lab-mission.css';
import './case-workbook.css';
import { isOwnerEmail } from '../../account/lib/ownerAccess';

export default function CaseWorkbook({ scenario }: { scenario: SiemLabScenario }) {
  const { user } = useAuth();
  return <AccountCaseWorkbook key={`${user?.id ?? 'guest'}:${scenario.id}`} scenario={scenario} />;
}

function AccountCaseWorkbook({ scenario }: { scenario: SiemLabScenario }) {
  const book = scenario.workbook!;
  const { user } = useAuth();
  const progress = useProgress();
  const owner = isOwnerEmail(user?.email);
  const key = `dw.workbook.v${book.version}.${user?.id ?? 'guest'}.${scenario.id}`;
  const [index, setIndex] = useState(() => {
    try { const saved = Number(localStorage.getItem(key + '.question')); return Number.isInteger(saved) && saved >= 0 && saved < book.questions.length ? saved : 0; } catch { return 0; }
  });
  const [answer, setAnswer] = useState(() => {
    try { return localStorage.getItem(key + '.answer.' + book.questions[index].id) ?? ''; } catch { return ''; }
  });
  const [feedback, setFeedback] = useState('');
  const [hints, setHints] = useState(0);
  const [started, setStarted] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const room = useRef<HTMLDialogElement>(null);
  const question = book.questions[index];
  const verified = (questionId: string) => progress.hasFlag(scenario.id, workbookProof(scenario.id, questionId));
  const completed = book.questions.filter(item => verified(item.id)).length;
  const openCase = () => { setStarted(true); room.current?.showModal(); };
  const done = progress.hasFlag(scenario.id, workbookProof(scenario.id, question.id));
  function navigate(next: number) {
    if (next < 0 || next >= book.questions.length) return;
    setIndex(next); setFeedback(''); setHints(0);
    try { localStorage.setItem(key + '.question', String(next)); setAnswer(localStorage.getItem(key + '.answer.' + book.questions[next].id) ?? ''); } catch { setAnswer(''); setStorageError(true); }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const assessment = assessWorkbookAnswer(scenario, question, answer);
    setFeedback(assessment.message);
    if (assessment.passed) progress.captureFlag(scenario.id, workbookProof(scenario.id, question.id), scenario.totalFlags);
  }
  return <>
    <section className="dw-mission-launch"><div className="dw-room-page"><div className="min-w-0"><RoomHero
        guide={guideForArea(`${scenario.title} soc`)}
        crumbs={[{ label: 'SOC casebooks', to: '/soc-portal' }, { label: 'Analyst casebook' }, { label: scenario.title }]}
        title={scenario.title}
        summary={scenario.briefing}
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, Math.ceil(book.questions.length / 2))}
        facts={[`${book.questions.length} findings`, `${book.chapters.length} chapters`, `${scenario.entries.length.toLocaleString()} records`, 'Five query dialects']}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        percent={(100 * completed) / book.questions.length}
        progressLabel={completed === book.questions.length ? 'Case closed' : 'Investigation progress'}
        saved={progress.isBookmarked(scenario.id)}
        onToggleSave={() => progress.toggleBookmark(scenario.id)}
        primaryLabel={completed === book.questions.length ? 'Review case' : started || completed > 0 ? 'Resume investigation' : 'Open investigation'}
        onPrimary={openCase}
        icon="soc"
        tone="defense"
      />
      <TaskList
        title="Case chapters"
        tasks={book.chapters.map(chapter => {
          const items = book.questions.filter(item => item.chapter === chapter.id);
          const solved = items.filter(item => verified(item.id)).length;
          const complete = items.every(item => verified(item.id));
          return { text: chapter.title, detail: `${items.length} finding${items.length === 1 ? '' : 's'} to verify in this chapter (${solved} verified).${items[0] ? ` It opens with: ${items[0].prompt}` : ''}`, done: complete, status: complete ? 'complete' as const : undefined };
        })}
        onOpen={chapterIndex => {
          const chapterId = book.chapters[chapterIndex].id;
          const first = book.questions.findIndex(item => item.chapter === chapterId && !verified(item.id));
          navigate(first >= 0 ? first : book.questions.findIndex(item => item.chapter === chapterId));
          openCase();
        }}
      />
      <section className="dw-case-file" aria-labelledby="case-file-title">
        <div className="dw-case-file__heading"><span>Case file</span><h2 id="case-file-title">Your role and mission</h2></div>
        <div className="dw-case-file__grid">
          <div><h3>Assignment</h3><p>SOC analyst on the case. Answer each finding from the evidence in the records, and only claim what that evidence supports.</p></div>
          <div><h3>Situation</h3><p>{scenario.narrative?.scene ?? scenario.briefing}</p></div>
          <div><h3>Evidence</h3><p>{scenario.entries.length.toLocaleString()} records across {book.chapters.length} chapters, searchable in five query dialects (KQL, SPL and more). {book.questions.length} findings close the case.</p></div>
          <div><h3>Training basis</h3><p>{book.provenance}</p></div>
        </div>
        {scenario.narrative?.mission && <p className="dw-case-file__mission"><strong>Mission:</strong> {scenario.narrative.mission}</p>}
      </section>
      <section className="dw-room-brief" aria-labelledby="case-workspace-title">
        <h2 id="case-workspace-title">Your workspace</h2>
        <div className="dw-room-brief__grid">
          <div><span className="dw-room-brief__icon"><IconTerminal className="h-4 w-4" /></span><h3>Questions beside the queries</h3><p>Each finding sits next to a query console over the same case records. Pick any dialect, run your search and submit what the evidence shows. Only verified findings count toward closing the case.</p></div>
          <div><span className="dw-room-brief__icon"><IconShield className="h-4 w-4" /></span><h3>Runs on your device</h3><p>The documented query subsets run locally in your browser.{owner ? ' Download the app while online before disconnecting.' : ''} There is no live vendor SIEM connection and no query-server charge.</p></div>
        </div>
      </section></div>
      <RoomAside
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, Math.ceil(book.questions.length / 2))}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        facts={[{ label: 'Findings', value: `${completed}/${book.questions.length}` }, { label: 'Records', value: scenario.entries.length.toLocaleString() }, { label: 'Dialects', value: 'Five (KQL, SPL…)' }]}
        outcomes={[]}
        guide={guideForArea(`${scenario.title} soc`)}
        backTo="/soc-portal"
        backLabel="All SOC casebooks"
        percent={(100 * completed) / book.questions.length}
        progressLabel={completed === book.questions.length ? 'Case closed' : 'Investigation progress'}
      />
      </div></section>
    {createPortal(<dialog ref={room} className="dw-case-room" aria-labelledby="case-title"><header><div><span className="dw-case-kicker">DarkWorld / Incident investigation</span><h2 id="case-title">{scenario.title}</h2></div><div><strong>{completed * 10} points · {completed}/{book.questions.length} verified</strong><button onClick={() => { void room.current?.requestFullscreen().catch(() => setFeedback('Browser fullscreen is unavailable; this workspace still fills the window.')); }}>Fullscreen</button><button onClick={async () => { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); room.current?.close(); }}>Exit workspace</button></div></header>
      <div className="dw-case-layout"><aside className="dw-case-question"><div className="dw-case-question-top"><label htmlFor="dw-case-question">Case questions</label><select id="dw-case-question" value={index} onChange={event => navigate(Number(event.target.value))}>{book.chapters.map(chapter => <optgroup key={chapter.id} label={chapter.title}>{book.questions.map((item, position) => item.chapter === chapter.id ? <option key={item.id} value={position}>{progress.hasFlag(scenario.id, workbookProof(scenario.id, item.id)) ? '✓ ' : ''}{position + 1}. {item.prompt}</option> : null)}</optgroup>)}</select><div><span>Question {index + 1} of {book.questions.length}</span><strong>{done ? 'Verified' : '+10 points'}</strong></div></div>
        <article key={question.id}><p className="dw-case-kicker">{book.chapters.find(chapter => chapter.id === question.chapter)?.title}</p><h3>{question.prompt}</h3><p>{question.teaching}</p>{hints > 0 && <section className="dw-case-clue"><h4>Investigation clue</h4><p>{question.hint}</p></section>}{hints > 1 && <section className="dw-case-clue"><h4>Kusto reference query</h4><p>Switch to Kusto to run this example, or write its equivalent in your selected language. Every dialect searches the same case records.</p><pre>{question.query}</pre></section>}<button className="dw-case-hint" disabled={hints >= 2} onClick={() => setHints(value => value + 1)}>{hints >= 2 ? 'All clues shown' : hints ? 'Show reference query' : 'Show a clue'}</button><details><summary>What are these records?</summary><p>{book.provenance}</p></details></article>
        <footer><form onSubmit={submit}><label className="sr-only" htmlFor="case-answer">Your finding</label><input id="case-answer" value={answer} onChange={event => { setAnswer(event.target.value); try { localStorage.setItem(key + ".answer." + question.id, event.target.value); } catch { setStorageError(true); } }} placeholder={question.answerType === 'number' ? 'Enter the count' : 'Enter your finding'} autoComplete="off" disabled={done}/><button disabled={done || !answer.trim()}>{done ? 'Verified ✓' : 'Submit'}</button></form>{feedback && <p role="status">{feedback}</p>}{storageError && <p role="alert">This browser could not save your current question position.</p>}<nav aria-label="Question navigation"><button disabled={index === 0} onClick={() => navigate(index - 1)}><IconArrowLeft className="dw-arrow-back" />Previous</button><span>{completed}/{book.questions.length} verified</span><button disabled={index === book.questions.length - 1} onClick={() => navigate(index + 1)}>Next<IconArrowRight className="dw-arrow" /></button></nav>{completed === book.questions.length && <p className="dw-case-finished">Case complete. All findings verified. Review any question from the chapter menu.</p>}</footer>
      </aside><section className="dw-case-workbench" aria-label="Case query workspace">{started && <QueryConsole workbook storageKey={key + '.queries'} scenario={scenario} onFlagCaptured={() => { /* Findings, not query matches, award progress. */ }}/>}</section></div>
    </dialog>, document.body)}
  </>;
}
