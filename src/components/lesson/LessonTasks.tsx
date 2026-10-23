import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LessonMeta } from '../../types';
import { useProgress } from '../../state/progressStore';
import { useLabsData } from '../../state/useLabsData';
import { SIEM_LABS } from '../../labs/siemScenarios';
import { PYTHON_TASKS } from '../../labs/pythonTasks';
import { answerMask, isCapturedFlag, isCorrectAnswer, lessonQuestions } from '../../data/lessonQuestions';
import { IconCheck, IconFlag, IconCode, IconTrophy, IconSearch } from '../layout/icons';
import IsoBlock from '../labs/IsoBlock';
import { LESSON_XP, QUIZ_MAX_XP } from '../../data/levels';
import './lesson-tasks.css';

/** How many of the lesson's paired labs must be solved and flagged to complete it. */
const REQUIRED_LABS = 2;

type LabTask =
  | { kind: 'terminal'; slug: string; id: string; title: string; total: number }
  | { kind: 'siem'; slug: string; id: string; title: string; total: number }
  | { kind: 'code'; slug: string; id: string; title: string };

interface Saved { answered: number[]; flagged: string[] }

const storageKey = (lessonId: string) => `darkworld.lessonTasks.${lessonId}`;
function loadSaved(lessonId: string): Saved {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(lessonId)) ?? '{}') as Partial<Saved>;
    return { answered: Array.isArray(parsed.answered) ? parsed.answered : [], flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [] };
  } catch { return { answered: [], flagged: [] }; }
}
function persist(lessonId: string, saved: Saved) {
  try { localStorage.setItem(storageKey(lessonId), JSON.stringify(saved)); } catch { /* private mode: progress still completes */ }
}

/** TryHackMe-style end of a lesson: typed-answer questions plus flags from the paired labs. The
 *  lesson completes when every question is answered and every required lab flag is submitted.
 *  Flags are checked against the flags the learner actually captured, so no answers ship to the page. */
export default function LessonTasks({ lesson, labSlugs }: { lesson: LessonMeta; labSlugs: string[] }) {
  const progress = useProgress();
  const labsData = useLabsData();
  const questions = useMemo(() => lessonQuestions(lesson), [lesson]);
  const alreadyComplete = progress.isLessonComplete(lesson.id);
  const [saved, setSaved] = useState<Saved>(() => loadSaved(lesson.id));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState('');

  const labTasks = useMemo<LabTask[]>(() => labSlugs.slice(0, REQUIRED_LABS).flatMap((slug): LabTask[] => {
    const siem = SIEM_LABS.find((l) => l.id === slug);
    if (siem) return [{ kind: 'siem', slug, id: siem.id, title: siem.title, total: siem.totalFlags }];
    const code = PYTHON_TASKS.find((t) => t.id === slug);
    if (code) return [{ kind: 'code', slug, id: code.id, title: code.title }];
    const lab = labsData?.findLab(slug);
    if (lab) return [{ kind: 'terminal', slug, id: lab.scenario.id, title: lab.scenario.title, total: lab.scenario.totalFlags }];
    return [];
  }), [labSlugs, labsData]);
  const loadingLabs = !labsData && labSlugs.slice(0, REQUIRED_LABS).some((s) => !SIEM_LABS.some((l) => l.id === s) && !PYTHON_TASKS.some((t) => t.id === s));

  const questionDone = (i: number) => alreadyComplete || saved.answered.includes(i);
  const labDone = (t: LabTask) => {
    if (alreadyComplete) return true;
    if (t.kind === 'code') return progress.isCodeTaskComplete(t.id);
    if (t.kind === 'siem') return progress.flagCount(t.id) >= t.total;
    return saved.flagged.includes(t.id);
  };
  const total = questions.length + labTasks.length;
  const done = questions.filter((_, i) => questionDone(i)).length + labTasks.filter(labDone).length;
  const allDone = !loadingLabs && total > 0 && done === total;

  useEffect(() => {
    if (allDone && !alreadyComplete) {
      progress.recordQuizScore(lesson.id, 100);
      progress.completeLesson(lesson.id);
    }
  }, [allDone, alreadyComplete, lesson.id, progress]);

  const update = (next: Saved) => { setSaved(next); persist(lesson.id, next); };

  const submitAnswer = (i: number) => {
    const key = `q${i}`;
    if (isCorrectAnswer(questions[i], drafts[key] ?? '')) {
      update({ ...saved, answered: [...new Set([...saved.answered, i])] });
      setErrors((e) => ({ ...e, [key]: '' }));
    } else {
      setErrors((e) => ({ ...e, [key]: 'Incorrect — re-read the lesson and try again.' }));
      setShake(key);
    }
  };

  const submitFlag = (t: Extract<LabTask, { kind: 'terminal' }>) => {
    const key = `f${t.id}`;
    const captured = progress.labFlags[t.id] ?? [];
    setShake(key);
    if (captured.length < t.total) setErrors((e) => ({ ...e, [key]: `Solve the lab first — you have captured ${captured.length} of ${t.total} flags.` }));
    else if (isCapturedFlag(captured, drafts[key] ?? '')) {
      update({ ...saved, flagged: [...new Set([...saved.flagged, t.id])] });
      setErrors((e) => ({ ...e, [key]: '' }));
    } else setErrors((e) => ({ ...e, [key]: 'That is not a flag from this lab. Copy it exactly as the terminal printed it.' }));
  };

  if (total === 0 && !loadingLabs) {
    return (
      <button onClick={() => progress.completeLesson(lesson.id)} disabled={alreadyComplete} className="reader-complete">
        <IconCheck className="w-4 h-4" />{alreadyComplete ? 'Lesson completed' : 'Mark lesson complete'}
      </button>
    );
  }

  const reward = LESSON_XP + QUIZ_MAX_XP;
  const itemStates = [...questions.map((_, i) => questionDone(i)), ...labTasks.map(labDone)];
  let n = 0;
  return (
    <div className="lt" data-complete={allDone}>
      <header className="lt__head">
        <IsoBlock width={74} depth={14} tone={allDone ? 'done' : done > 0 ? 'progress' : 'idle'} glow={allDone} crest={<IconTrophy />} className="lt__trophy" />
        <div className="lt__head-copy">
          <p>Room tasks</p>
          <h3>{allDone ? 'Room complete' : labTasks.some((t) => t.kind === 'terminal') ? 'Answer the questions and capture the flags' : labTasks.length ? 'Answer the questions and clear the labs' : 'Answer the questions'}</h3>
          <div className="lt__pips" aria-label={`${done} of ${total} tasks completed`}>
            {itemStates.map((ok, i) => <span key={i} data-done={ok} />)}
            <b aria-live="polite">{done}/{total}</b>
          </div>
        </div>
        <span className="lt__reward" data-earned={allDone} title="XP for completing this lesson's tasks">{allDone ? <IconCheck className="h-3.5 w-3.5" /> : null}+{reward} XP</span>
      </header>

      {allDone && (
        <div className="lt__win" role="status">
          <IconTrophy className="h-5 w-5" />
          <span><b>All tasks cleared.</b> Lesson marked complete and +{reward} XP added to your profile.</span>
        </div>
      )}

      <ol className="lt__list">
        {questions.map((q, i) => {
          const key = `q${i}`;
          const ok = questionDone(i);
          n += 1;
          return (
            <li key={key} className="lt__item" data-kind="question" data-done={ok} data-shake={shake === key && !ok} onAnimationEnd={() => setShake('')}>
              <div className="lt__item-head">
                <span className="lt__num">{ok ? <IconCheck className="h-3.5 w-3.5" /> : n}</span>
                <span className="lt__tag"><IconSearch className="h-3 w-3" />Question</span>
              </div>
              <p className="lt__prompt">{q.prompt}</p>
              {ok ? (
                <div className="lt__answered"><code>{q.answer}</code><em><IconCheck className="h-3.5 w-3.5" />Correct</em></div>
              ) : (
                <form className="lt__form" onSubmit={(e) => { e.preventDefault(); submitAnswer(i); }}>
                  <input value={drafts[key] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))} placeholder={`Answer format: ${answerMask(q.answer)}`} aria-label={`Answer to question ${n}`} aria-invalid={!!errors[key]} autoComplete="off" spellCheck={false} />
                  <button type="submit">Submit</button>
                </form>
              )}
              {!ok && q.hint && <details className="lt__hint"><summary>Need a hint?</summary>{q.hint}</details>}
              {errors[key] && <p className="lt__error" role="alert">{errors[key]}</p>}
            </li>
          );
        })}

        {loadingLabs && <li className="lt__item"><p className="lt__prompt">Loading the lab tasks…</p></li>}
        {labTasks.map((t) => {
          const key = `f${t.id}`;
          const ok = labDone(t);
          n += 1;
          const link = t.kind === 'code' ? `/code-task/${t.slug}` : t.kind === 'siem' ? `/siem-lab/${t.slug}` : `/lab/${t.slug}`;
          const tag = t.kind === 'terminal' ? 'Flag' : t.kind === 'siem' ? 'Case' : 'Code';
          return (
            <li key={key} className="lt__item" data-kind={t.kind} data-done={ok} data-shake={shake === key && !ok} onAnimationEnd={() => setShake('')}>
              <div className="lt__item-head">
                <span className="lt__num">{ok ? <IconCheck className="h-3.5 w-3.5" /> : n}</span>
                <span className="lt__tag">{t.kind === 'code' ? <IconCode className="h-3 w-3" /> : <IconFlag className="h-3 w-3" />}{tag}</span>
                <Link to={link} className="lt__lab">{t.title} <span aria-hidden>↗</span></Link>
              </div>
              <p className="lt__prompt">
                {t.kind === 'terminal' && <>Solve the lab and submit a flag you captured there.</>}
                {t.kind === 'siem' && <>Close the case by answering every finding.</>}
                {t.kind === 'code' && <>Pass every automated test in the coding task.</>}
              </p>
              {ok ? (
                <div className="lt__answered"><code>{t.kind === 'terminal' ? 'Flag accepted' : t.kind === 'siem' ? 'Case closed' : 'All tests passed'}</code><em><IconCheck className="h-3.5 w-3.5" />Complete</em></div>
              ) : t.kind === 'terminal' ? (
                <form className="lt__form lt__form--flag" onSubmit={(e) => { e.preventDefault(); submitFlag(t); }}>
                  <input value={drafts[key] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))} placeholder="flag{...}" aria-label={`Flag from ${t.title}`} aria-invalid={!!errors[key]} autoComplete="off" spellCheck={false} />
                  <button type="submit"><IconFlag className="h-3.5 w-3.5" />Capture flag</button>
                </form>
              ) : (
                <div className="lt__pending">
                  {t.kind === 'siem' ? (
                    <span className="lt__meter"><i><b style={{ width: `${t.total ? (100 * Math.min(progress.flagCount(t.id), t.total)) / t.total : 0}%` }} /></i>{progress.flagCount(t.id)}/{t.total} findings</span>
                  ) : <span>Not solved yet</span>}
                  <Link to={link}>{t.kind === 'code' ? <><IconCode className="h-3.5 w-3.5" />Open task</> : 'Open case'} →</Link>
                </div>
              )}
              {errors[key] && <p className="lt__error" role="alert">{errors[key]}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
