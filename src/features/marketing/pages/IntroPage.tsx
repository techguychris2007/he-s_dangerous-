import type { CSSProperties } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../account/state/authStore';
import { MODULES, ROADMAP } from '../../curriculum/data/curriculum';
import { CHARACTERS, type CharacterId } from '../../../shared/characters/characters';
import { LEAGUES, RANK_STEP, rankForLevel } from '../../progress/data/levels';
import { CONTRIBUTORS } from '../data/contributors';
import { useLabsData } from '../../labs/state/useLabsData';
import Logo from '../../../shared/components/layout/Logo';
import CharacterAvatar from '../../../shared/characters/CharacterAvatar';
import IsoBlock, { type IsoTone } from '../../../shared/components/IsoBlock';
import { IconArrowRight, IconBook, IconFlag, IconTerminal, ModuleIcon } from '../../../shared/components/layout/icons';
import type { RoadmapTrack } from '../../../shared/types/domain';
import '../../../shared/styles/entry-pages.css';
import './landing.css';
import { OWNER_TRACKS, useIsOwner } from '../../account/lib/ownerAccess';
import { PAID_PLANS_LIVE } from '../../billing/lib/billing';
import { COMPUTER_ONLY } from '../../../app/guards/ComputerAccessGate';

const PATHS: { track: RoadmapTrack; title: string; label: string; body: string; icon: string; tone: IsoTone; guide: CharacterId }[] = [
  { track: 'presecurity', label: 'Start here', title: 'Foundations', body: 'Computers, networks, Linux and the tools every lab uses — from zero.', icon: 'terminal', tone: 'progress', guide: 'byte' },
  { track: 'security', label: 'Red team', title: 'Offensive security', body: 'Recon, web, Active Directory and cloud attacks against controlled targets.', icon: 'crosshair', tone: 'offense', guide: 'vex' },
  { track: 'defensive', label: 'Blue team', title: 'Defensive security', body: 'Triage alerts, query telemetry and work story-driven incident casebooks.', icon: 'shield', tone: 'defense', guide: 'sentinel' },
  { track: 'programming', label: 'Build tools', title: 'Programming', body: 'Python, JavaScript and C++ with auto-graded challenges in the browser.', icon: 'code', tone: 'analysis', guide: 'cipher' },
  { track: 'software', label: 'Engineer', title: 'Software engineering', body: 'Specs, testing, design, delivery and secure development — the full craft.', icon: 'layers', tone: 'done', guide: 'cipher' },
];

const STEPS = [
  { title: 'Read the lesson', body: 'Short lessons with worked examples, diagrams and code you can run, written for the lab that follows.', icon: <IconBook /> },
  { title: 'Work the lab', body: 'A real terminal, a live website, a SIEM console or a directory map, all sandboxed in your browser.', icon: <IconTerminal /> },
  { title: 'Submit the flag', body: 'Flags and typed answers are checked as you go. Clearing a lab earns XP and lights its tile on the map.', icon: <IconFlag /> },
];

/** The real rank ladder from the progression rules: a new rank every RANK_STEP levels. */
const RANKS = Array.from({ length: 13 }, (_, i) => ({ level: 1 + i * RANK_STEP, ...rankForLevel(1 + i * RANK_STEP) }));

const CREW: CharacterId[] = ['sentinel', 'ledger', 'beacon', 'vex', 'cipher', 'byte'];

/** The hero scene: an isometric island of lab tiles joined by a lit path, with Sentinel standing
 *  guard. Built from the platform's own tiles, so it previews the map learners actually clear. */
function HeroScene() {
  const tiles: { x: number; y: number; tone: IsoTone; icon: string; depth: number }[] = [
    { x: 150, y: 250, tone: 'done', icon: 'terminal', depth: 16 },
    { x: 250, y: 190, tone: 'done', icon: 'network', depth: 22 },
    { x: 350, y: 250, tone: 'progress', icon: 'web', depth: 28 },
    { x: 250, y: 310, tone: 'idle', icon: 'soc', depth: 14 },
    { x: 350, y: 370, tone: 'idle', icon: 'cloud', depth: 18 },
    { x: 450, y: 310, tone: 'idle', icon: 'crown', depth: 24 },
  ];
  return (
    <div className="ln-scene" aria-hidden="true">
      <svg className="ln-scene__trail" viewBox="0 0 600 480">
        <polyline points="150,250 250,190 350,250" className="is-lit" />
        <polyline points="350,250 250,310 350,370 450,310" />
      </svg>
      {tiles.map((t, i) => (
        <span key={i} className="ln-scene__tile" style={{ left: t.x, top: t.y, zIndex: 10 + Math.round(t.y / 10) }}>
          <IsoBlock width={96} depth={t.depth} tone={t.tone} crest={<ModuleIcon icon={t.icon} />} />
        </span>
      ))}
      <img className="ln-scene__sentinel" src={`${import.meta.env.BASE_URL}characters/sentinel-full.webp`} alt="" decoding="async" />
    </div>
  );
}

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);

export default function IntroPage() {
  const owner = useIsOwner();
  const auth = useAuth();
  const labsData = useLabsData();
  if (!auth.loading && auth.user) return <Navigate to="/" replace />;
  const lessons = MODULES.reduce((total, module) => total + module.lessons.length, 0);
  const rooms = labsData?.LABS.length;
  const modulesIn = (track: RoadmapTrack) => ROADMAP.filter((s) => s.track === track && s.moduleSlug).length;
  const jump = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  // Owner-only paths stay hidden from everyone else, so the copy and grid count what this visitor sees.
  const visiblePaths = PATHS.filter((p) => owner || !OWNER_TRACKS.has(p.track));

  return (
    <main className="dw-entry ln">
      <header className="ln-nav">
        <div className="ln-wrap ln-nav__inner">
          <Link to="/welcome" className="dw-brand ln-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
          <nav aria-label="Academy navigation">
            <Link to="/roadmap">Learning paths</Link>
            <Link to="/labs">Labs</Link>
            <Link to="/library">Library</Link>
            {PAID_PLANS_LIVE && <Link to="/pricing">Pricing</Link>}
            <Link to="/login" className="ln-nav__signin">Sign in</Link>
            <Link to="/login?mode=signup" className="ln-btn ln-btn--primary">Join for free</Link>
          </nav>
        </div>
      </header>

      <section className="ln-hero" aria-labelledby="entry-title">
        <div className="ln-wrap ln-hero__inner">
          <div className="ln-hero__copy">
            <h1 id="entry-title">Learn security<br />by <em>doing it.</em></h1>
            <p className="ln-lead">Hands-on labs, in-browser terminals and incident casebooks. Read a short lesson, work the lab, submit the flag, and move up thirteen ranks from Initiate to DarkWorld Legend.</p>
            <div className="ln-actions">
              <Link to="/login?mode=signup" className="ln-btn ln-btn--primary ln-btn--lg">Start learning free <IconArrowRight className="h-4 w-4" /></Link>
              <Link to="/labs" className="ln-btn ln-btn--ghost ln-btn--lg">Browse the labs</Link>
            </div>
            <p className="ln-facts">{rooms ?? '600+'} labs · {lessons} lessons · {MODULES.length} modules · 38 casebook episodes. You can look through all of it before you sign up.</p>
          </div>
          <HeroScene />
        </div>
      </section>

      <section id="how" className="ln-section ln-wrap ln-how" aria-labelledby="how-title">
        <div className="ln-head">
          <h2 id="how-title">How a lab works</h2>
          <p>The same three steps take you from your first terminal command to a full incident investigation.</p>
          <Link to="/labs" className="ln-link">See all {rooms ?? '600+'} labs <IconArrowRight className="h-4 w-4" /></Link>
        </div>
        <ol className="ln-how__steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <span className="ln-how__icon" aria-hidden="true">{step.icon}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="paths" className="ln-band" aria-labelledby="paths-title">
        <div className="ln-wrap">
          <div className="ln-head ln-head--light"><h2 id="paths-title">Pick a path</h2><p>{countWord(visiblePaths.length)} paths, each a sequence of modules. Open any of them to see every module and lesson before you sign up. New to security? Start with Foundations.</p></div>
          <div className="ln-paths" style={{ '--ln-paths': visiblePaths.length } as CSSProperties}>
            {visiblePaths.map((p) => (
              <Link key={p.track} to={`/roadmap?track=${p.track}`} className="ln-path">
                <div className="ln-path__top">
                  <IsoBlock width={74} depth={14} tone={p.tone} crest={<ModuleIcon icon={p.icon} />} />
                  <CharacterAvatar id={p.guide} size={40} decorative />
                </div>
                <small>{p.label}</small>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <span className="ln-path__foot">{modulesIn(p.track)} modules <IconArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="levels" className="ln-section ln-wrap" aria-labelledby="levels-title">
        <div className="ln-head"><h2 id="levels-title">Ranks and leagues</h2><p>Flags, answers and solved challenges earn XP. Every {RANK_STEP} levels brings a new rank, and lab points place you in a league on the leaderboard. Every seven active days in a row earns a rest day, which covers one missed day in your streak.</p></div>
        <div className="ln-progression">
          <div>
            <h3>Ranks</h3>
            <ol className="ln-ranks">
              {RANKS.map((rank) => <li key={rank.code}><b>{rank.code}</b><span>{rank.title}</span><small>Level {rank.level}</small></li>)}
            </ol>
          </div>
          <div>
            <h3>Leagues</h3>
            <ul className="ln-leagues">
              {LEAGUES.map((league) => <li key={league.name} style={{ '--tone': league.color } as CSSProperties}><span>{league.name}</span><small>{league.min ? `${league.min.toLocaleString()} lab points` : 'Where everyone starts'}</small></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="ln-section ln-wrap" aria-labelledby="crew-title">
        <div className="ln-head"><h2 id="crew-title">Your guides</h2><p>Breach Unit teaches you to attack with permission. Bastion teaches you to detect and respond. One of them walks you through every lab.</p></div>
        <div className="ln-crew">
          {CREW.map((id) => (
            <article key={id} className="ln-crew__card" data-crew={CHARACTERS[id].crew}>
              <CharacterAvatar id={id} size={72} decorative />
              <h3>{CHARACTERS[id].name}</h3>
              <small>{CHARACTERS[id].role}</small>
              <p>“{CHARACTERS[id].bio}”</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contributors" className="ln-section ln-wrap" aria-labelledby="contributors-title">
        <div className="ln-head">
          <h2 id="contributors-title">Who builds DarkWorld</h2>
          <p>DarkWorld grew from friendship, a shared idea and the commitment to make it real. Benedict Adjei and Bondam Christopher Kweku founded and built this platform together.</p>
        </div>
        <div className="ln-contributors">
          {CONTRIBUTORS.map((contributor) => (
            <article key={contributor.name} className="ln-contributor">
              {contributor.photo && (
                <img src={contributor.photo} alt={`Portrait of ${contributor.name}`} className="ln-contributor__photo" width={96} height={96} loading="lazy" decoding="async" />
              )}
              <p className="ln-contributor__role">{contributor.role}</p>
              <h3>{contributor.name}</h3>
              <p className="ln-contributor__story">{contributor.contribution}</p>
              {contributor.linkedin && (
                <a href={contributor.linkedin} target="_blank" rel="noopener noreferrer" className="ln-contributor__link" aria-label={`${contributor.name} on LinkedIn (opens in a new tab)`}>
                  Connect on LinkedIn <IconArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="ln-cta ln-wrap" aria-labelledby="cta-title">
        <div>
          <h2 id="cta-title">Start with Foundations</h2>
          <p>Free to begin. {COMPUTER_ONLY ? 'Built for laptops and desktops.' : 'Works on phones, tablets and computers.'} Your progress, XP and streak save automatically.</p>
        </div>
        <div className="ln-cta__actions">
          <Link to="/login?mode=signup" className="ln-btn ln-btn--primary ln-btn--lg">Create your account</Link>
          <Link to="/roadmap?track=presecurity" className="ln-btn ln-btn--ghost ln-btn--lg">See the Foundations path</Link>
        </div>
      </section>

      <footer className="ln-footer ln-wrap"><span>© {new Date().getFullYear()} DarkWorld Academy</span><nav aria-label="Site links"><a href="#contributors" onClick={jump('contributors')}>Contributors</a>{PAID_PLANS_LIVE && <Link to="/pricing">Pricing</Link>}<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a>{PAID_PLANS_LIVE && <a href="/refunds.html">Refunds</a>}<Link to="/login">Sign in</Link></nav></footer>
    </main>
  );
}
