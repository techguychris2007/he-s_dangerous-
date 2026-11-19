import { Component, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import CharacterAvatar from '../../../shared/characters/CharacterAvatar';
import DigAvatar from '../../../shared/characters/DigAvatar';
import { CHARACTERS } from '../../../shared/characters/characters';
import { useHandle } from '../../account/state/useHandle';
import { useModalA11y } from '../../../shared/hooks/useModalA11y';
import {
  TOUR_EVENT, TOUR_START_PATH, TOUR_STEPS, fillTourText, placeTourCard, readTourRecord, shouldAutoStart, writeTourRecord,
  type TourGuide, type TourPlacement, type TourRect, type TourRecord, type TourStep,
} from '../lib/guidedTour';
import './guided-tour.css';

/** How long the Overview gets to settle before the tour opens over it. */
const START_DELAY_MS = 700;
/** Matches the width of .dw-tour__card in guided-tour.css. */
const ANCHORED_CARD_WIDTH = 400;

const storage = () => { try { return window.localStorage; } catch { return undefined; } };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** The search shortcut, only where there is a keyboard to press it: none on touch-only devices. */
const shortcut = () => (window.matchMedia('(any-pointer: fine)').matches ? (/Mac/.test(navigator.platform) ? '⌘ K' : 'Ctrl K') : '');

/** An element counts only when it is actually drawn: hidden tabs and closed panels have no boxes. */
function findTarget(selector: string | undefined): HTMLElement | null {
  if (!selector) return null;
  const element = document.querySelector<HTMLElement>(selector);
  return element && element.getClientRects().length > 0 ? element : null;
}

/** Another dialog on screen (the cyber-name welcome, search, a lab modal) owns the moment. */
function anotherDialogIsOpen(): boolean {
  return Boolean(document.querySelector('dialog[open], .dw-handle-backdrop, [role="dialog"][aria-modal="true"]:not(.dw-tour__card)'));
}

/** First visit on a device: the DarkWorld cast walks a new learner through the academy. Starts by
 *  itself once, on the Overview, after the cyber-name welcome; replays from the account menu. */
export default function GuidedTour() {
  return <TourErrorBoundary><TourHost /></TourErrorBoundary>;
}

function TourHost() {
  const { seed, handle, seen } = useHandle();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const pendingReplay = useRef(false);

  const begin = useCallback(() => {
    if (anotherDialogIsOpen()) return false;
    // Sentinel's portrait is an image (the rest of the cast is drawn inline); fetch it now so it is
    // ready by the time the crew line-up and Sentinel's own step appear.
    new Image().src = `${import.meta.env.BASE_URL}characters/sentinel-portrait.webp`;
    // dig's launcher only exists on some pages; a step whose element is missing is left out.
    setSteps(TOUR_STEPS.filter(step => !step.optional || findTarget(step.target)));
    return true;
  }, []);

  // Automatic start: once, on the Overview, after the welcome dialog. While another dialog is open
  // (search, the mobile menu) it waits and tries again rather than opening on top of it.
  useEffect(() => {
    if (steps || !shouldAutoStart({ pathname, handleSeen: seen, record: readTourRecord(storage(), seed) })) return;
    let timer = 0;
    const attempt = () => { if (!begin()) timer = window.setTimeout(attempt, 1500); };
    timer = window.setTimeout(attempt, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, seen, seed, steps, begin]);

  // Replay on request. The tour points at the Overview's controls, so it opens there.
  useEffect(() => {
    const replay = () => {
      if (steps) return;
      if (pathname !== '/') { pendingReplay.current = true; navigate('/'); return; }
      window.setTimeout(() => { begin(); }, 150);
    };
    window.addEventListener(TOUR_EVENT, replay);
    return () => window.removeEventListener(TOUR_EVENT, replay);
  }, [pathname, steps, navigate, begin]);

  useEffect(() => {
    if (!pendingReplay.current || pathname !== '/') return;
    pendingReplay.current = false;
    const timer = window.setTimeout(() => { begin(); }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, begin]);

  // Leaving the Overview mid-tour (back button, a link from elsewhere) ends it quietly.
  useEffect(() => { if (steps && pathname !== '/') setSteps(null); }, [pathname, steps]);

  const finish = useCallback((record: TourRecord, then?: string) => {
    writeTourRecord(storage(), seed, record);
    setSteps(null);
    if (then) navigate(then);
  }, [seed, navigate]);

  if (!steps) return null;
  return createPortal(<Tour steps={steps} handle={handle} onFinish={finish} />, document.body);
}

function Tour({ steps, handle, onFinish }: { steps: TourStep[]; handle: string; onFinish: (record: TourRecord, then?: string) => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<TourRect | null>(null);
  const [placement, setPlacement] = useState<TourPlacement | null>(null);
  const cardRef = useModalA11y(() => onFinish('skipped'));
  const primaryRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const step = steps[index];
  const last = index === steps.length - 1;
  const values = { handle, shortcut: shortcut() };
  const title = fillTourText(step.title, values);
  const body = fillTourText(step.body, values);

  const next = useCallback(() => setIndex(current => Math.min(current + 1, steps.length - 1)), [steps.length]);
  const back = useCallback(() => setIndex(current => Math.max(current - 1, 0)), []);

  // Follow the spotlighted element through scrolling, resizing and layout changes.
  useLayoutEffect(() => {
    const target = findTarget(step.target);
    if (!target) { setRect(null); return; }
    target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    let frame = 0;
    const read = () => {
      const box = target.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    const measure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(read); };
    // Read at once, so the card never points at the previous step's element for a frame.
    read();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    // Smooth scrolling moves the element after this first measurement.
    const settle = window.setTimeout(measure, 400);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  // Place the card once its size is known, and again whenever the spotlight moves or the card's own
  // size changes (new step text, or switching between the centred and the anchored layout).
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const place = () => setPlacement(placeTourCard(
      step.target ? rect : null,
      // Anchored cards are always this wide (see .dw-tour__card), whatever layout is showing now.
      { width: Math.min(ANCHORED_CARD_WIDTH, window.innerWidth - 32), height: card.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
    ));
    place();
    const observer = new ResizeObserver(place);
    observer.observe(card);
    window.addEventListener('resize', place);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); };
  }, [rect, step, cardRef]);

  // Keyboard users land on the main action of every step. The card is hidden while it measures
  // itself on first open, and hidden elements cannot take focus, so wait until it is placed.
  const placed = placement !== null;
  useEffect(() => { if (placed) primaryRef.current?.focus({ preventScroll: true }); }, [index, placed]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight' && !last) { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); back(); }
    };
    document.addEventListener('keydown', keys);
    return () => document.removeEventListener('keydown', keys);
  }, [index, last, next, back]);

  const spotlight = step.target && rect ? rect : null;
  const pad = 6;
  const style = cardStyle(placement);

  return (
    <div className="dw-tour">
      {/* Holds the page still: nothing behind the tour responds to clicks while it is open. */}
      <div className={`dw-tour__shade${spotlight ? '' : ' is-dim'}`} aria-hidden="true" />
      {spotlight && <div className="dw-tour__spotlight" aria-hidden="true" style={{ top: spotlight.top - pad, left: spotlight.left - pad, width: spotlight.width + pad * 2, height: spotlight.height + pad * 2 }} />}
      <div
        ref={cardRef}
        className={`dw-tour__card ${placement ? `is-${placement.mode}${placement.mode === 'sheet' ? ` is-${placement.edge}` : ''}` : 'is-measuring'}`}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        tabIndex={-1}
      >
        {(placement?.mode === 'below' || placement?.mode === 'above') && <span className={`dw-tour__arrow is-${placement.mode}`} style={{ left: placement.arrowLeft }} aria-hidden="true" />}
        <p className="sr-only" aria-live="polite">{`Step ${index + 1} of ${steps.length}: ${title}`}</p>
        <header className="dw-tour__head">
          <Guide guide={step.guide} />
          <div className="dw-tour__who">
            <strong>{guideName(step.guide)}</strong>
            <small>{guideRole(step.guide)}</small>
          </div>
          <span className="dw-tour__count" aria-hidden="true">{index + 1} / {steps.length}</span>
          <button type="button" className="dw-tour__close" onClick={() => onFinish(last ? 'completed' : 'skipped')} aria-label="Close the tour">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>
        {step.id === 'welcome' && <Crew ids={['sentinel', 'vex', 'cipher', 'ledger', 'beacon']} />}
        {step.id === 'finish' && <Crew ids={['byte', 'vex', 'cipher', 'ledger', 'beacon']} />}
        <h2 id={`${id}-title`} className="dw-tour__title">{title}</h2>
        <p id={`${id}-body`} className="dw-tour__body">{body}</p>
        <footer className="dw-tour__foot">
          <ol className="dw-tour__dots" aria-hidden="true">
            {steps.map((item, position) => <li key={item.id} className={position === index ? 'is-current' : position < index ? 'is-done' : ''} />)}
          </ol>
          <div className="dw-tour__actions">
            {index === 0 && <button type="button" className="dw-tour__button is-quiet" onClick={() => onFinish('skipped')}>Skip tour</button>}
            {index > 0 && !last && <button type="button" className="dw-tour__button is-quiet" onClick={back}>Back</button>}
            {last && <button type="button" className="dw-tour__button is-quiet" onClick={() => onFinish('completed')}>Explore on my own</button>}
            {last
              ? <button ref={primaryRef} type="button" className="dw-tour__button is-primary" onClick={() => onFinish('completed', TOUR_START_PATH)}>Start with Pre-security</button>
              : <button ref={primaryRef} type="button" className="dw-tour__button is-primary" onClick={next}>{index === 0 ? 'Show me around' : 'Next'}</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function cardStyle(placement: TourPlacement | null): CSSProperties | undefined {
  if (placement?.mode === 'below' || placement?.mode === 'above') return { top: placement.top, left: placement.left };
  return undefined;
}

function Guide({ guide }: { guide: TourGuide }) {
  return <span className="dw-tour__guide">{guide === 'dig' ? <DigAvatar size={56} /> : <CharacterAvatar id={guide} size={56} decorative />}</span>;
}

const guideName = (guide: TourGuide) => (guide === 'dig' ? 'dig' : CHARACTERS[guide].name);
const guideRole = (guide: TourGuide) => (guide === 'dig' ? 'Learning assistant' : CHARACTERS[guide].role);

/** The rest of the crew, side by side, beside the guide who is speaking: on the welcome and the finish. */
function Crew({ ids }: { ids: Exclude<TourGuide, 'dig'>[] }) {
  return (
    <div className="dw-tour__crew" aria-hidden="true">
      {ids.map(id => <CharacterAvatar key={id} id={id} size={48} decorative />)}
    </div>
  );
}

/** The tour is a guide, never a gate: if it fails, it disappears and the academy keeps working. */
class TourErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[DarkWorld] Guided tour stopped:', error);
  }
  render() { return this.state.failed ? null : this.props.children; }
}
