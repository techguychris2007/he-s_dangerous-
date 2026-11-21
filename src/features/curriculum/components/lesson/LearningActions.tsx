import { Link } from 'react-router-dom';
import '../../../library/components/offline-library.css';
import { IconArrowRight, IconArrowLeft } from '../../../../shared/components/layout/icons';

export default function LearningActions({ back, previous, next, workspace = false, beforeNavigate }: {
  back: { href: string; label: string };
  previous?: string;
  next?: string;
  workspace?: boolean;
  beforeNavigate?: () => boolean;
}) {
  const focusArea = (selector: string) => {
    const node = document.querySelector<HTMLElement>(selector);
    node?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    node?.focus({ preventScroll: true });
  };
  return <nav className="learning-quick-nav" aria-label="Learning controls">
    <Link to={back.href} onClick={event => { if (beforeNavigate && !beforeNavigate()) event.preventDefault(); }}><IconArrowLeft className="dw-arrow-back" />{back.label}</Link>
    {previous && <Link to={previous}>Previous lesson</Link>}
    {next && <Link to={next}>Next lesson<IconArrowRight className="dw-arrow" /></Link>}
    {workspace && <><button type="button" onClick={() => focusArea('.dw-codetask__brief')}>Read brief</button><button type="button" onClick={() => focusArea('.dw-codetask__ide')}>Go to editor</button></>}
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('darkworld:research-term', { detail: '' }))}>Ask dig</button>
  </nav>;
}
