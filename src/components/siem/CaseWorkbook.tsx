import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../state/authStore';
import { useProgress } from '../../state/progressStore';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { assessWorkbookAnswer, workbookProof } from '../../labs/workbookAssessment';
import QueryConsole from './QueryConsole';
import RoomHero from '../common/RoomHero';
import TaskList from '../common/TaskList';
import RoomAside from '../common/RoomAside';
import { guideForArea } from '../../data/characters';
import { labXpReward } from '../../data/levels';
import { estimateMinutes } from '../../data/rooms';
import './case-workbook.css';

export default function CaseWorkbook({ scenario }: { scenario: SiemLabScenario }) {
  const { user } = useAuth();
  return <AccountCaseWorkbook key={`${user?.id ?? 'guest'}:${scenario.id}`} scenario={scenario} />;
}

function AccountCaseWorkbook({ scenario }: { scenario: SiemLabScenario }) {
  const book = scenario.workbook!;
  const { user } = useAuth();
  const progress = useProgress();
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
    <section className="dw-case-launch"><div className="dw-room-page"><div className="min-w-0"><RoomHero
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
      />
      <TaskList
        title="Case chapters"
        tasks={book.chapters.map(chapter => ({ text: chapter.title, done: book.questions.every(item => item.chapter !== chapter.id || verified(item.id)) }))}
        onOpen={chapterIndex => {
          const chapterId = book.chapters[chapterIndex].id;
          const first = book.questions.findIndex(item => item.chapter === chapterId && !verified(item.id));
          navigate(first >= 0 ? first : book.questions.findIndex(item => item.chapter === chapterId));
          openCase();
        }}
      /><details><summary>Dataset provenance & offline support</summary><p>{book.provenance}</p><p>The documented query subsets run on your device. Download the app while online before disconnecting. There is no live vendor SIEM connection and no query-server charge.</p></details></div>
      <RoomAside
        difficulty={scenario.difficulty}
        minutes={estimateMinutes(scenario.difficulty, Math.ceil(book.questions.length / 2))}
        xp={labXpReward(scenario.difficulty, scenario.totalFlags)}
        facts={[{ label: 'Findings', value: `${completed}/${book.questions.length}` }, { label: 'Records', value: scenario.entries.length.toLocaleString() }, { label: 'Dialects', value: 'Five (KQL, SPL…)' }]}
        outcomes={book.chapters.map(c => c.title)}
        outcomesTitle="Investigation chapters"
        guide={guideForArea(`${scenario.title} soc`)}
        backTo="/soc-portal"
        backLabel="All SOC casebooks"
      />
      </div></section>
    {createPortal(<dialog ref={room} className="dw-case-room" aria-labelledby="case-title"><header><div><span className="dw-case-kicker">DarkWorld / Incident investigation</span><h2 id="case-title">{scenario.title}</h2></div><div><strong>{completed * 10} points · {completed}/{book.questions.length} verified</strong><button onClick={() => { void room.current?.requestFullscreen().catch(() => setFeedback('Browser fullscreen is unavailable; this workspace still fills the window.')); }}>Fullscreen</button><button onClick={async () => { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); room.current?.close(); }}>Exit workspace</button></div></header>
      <div className="dw-case-layout"><aside className="dw-case-question"><div className="dw-case-question-top"><label htmlFor="dw-case-question">Case questions</label><select id="dw-case-question" value={index} onChange={event => navigate(Number(event.target.value))}>{book.chapters.map(chapter => <optgroup key={chapter.id} label={chapter.title}>{book.questions.map((item, position) => item.chapter === chapter.id ? <option key={item.id} value={position}>{progress.hasFlag(scenario.id, workbookProof(scenario.id, item.id)) ? '✓ ' : ''}{position + 1}. {item.prompt}</option> : null)}</optgroup>)}</select><div><span>Question {index + 1} of {book.questions.length}</span><strong>{done ? 'Verified' : '+10 points'}</strong></div></div>
        <article key={question.id}><p className="dw-case-kicker">{book.chapters.find(chapter => chapter.id === question.chapter)?.title}</p><h3>{question.prompt}</h3><p>{question.teaching}</p>{hints > 0 && <section className="dw-case-clue"><h4>Investigation clue</h4><p>{question.hint}</p></section>}{hints > 1 && <section className="dw-case-clue"><h4>Kusto reference query</h4><p>Switch to Kusto to run this example, or write its equivalent in your selected language. Every dialect searches the same case records.</p><pre>{question.query}</pre></section>}<button className="dw-case-hint" disabled={hints >= 2} onClick={() => setHints(value => value + 1)}>{hints >= 2 ? 'All clues shown' : hints ? 'Show reference query' : 'Show a clue'}</button><details><summary>What are these records?</summary><p>{book.provenance}</p></details></article>
        <footer><form onSubmit={submit}><label className="sr-only" htmlFor="case-answer">Your finding</label><input id="case-answer" value={answer} onChange={event => { setAnswer(event.target.value); try { localStorage.setItem(key + ".answer." + question.id, event.target.value); } catch { setStorageError(true); } }} placeholder={question.answerType === 'number' ? 'Enter the count' : 'Enter your finding'} autoComplete="off" disabled={done}/><button disabled={done || !answer.trim()}>{done ? 'Verified ✓' : 'Submit'}</button></form>{feedback && <p role="status">{feedback}</p>}{storageError && <p role="alert">This browser could not save your current question position.</p>}<nav aria-label="Question navigation"><button disabled={index === 0} onClick={() => navigate(index - 1)}>← Previous</button><span>{completed}/{book.questions.length} verified</span><button disabled={index === book.questions.length - 1} onClick={() => navigate(index + 1)}>Next →</button></nav>{completed === book.questions.length && <p className="dw-case-finished">Case complete. All findings verified. Review any question from the chapter menu.</p>}</footer>
      </aside><section className="dw-case-workbench" aria-label="Case query workspace">{started && <QueryConsole workbook storageKey={key + '.queries'} scenario={scenario} onFlagCaptured={() => { /* Findings, not query matches, award progress. */ }}/>}</section></div>
    </dialog>, document.body)}
  </>;
}
