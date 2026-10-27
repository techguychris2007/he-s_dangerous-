import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { MODULES, ROADMAP } from '../data/curriculum';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { LEAGUES } from '../data/levels';
import { CONTRIBUTORS } from '../data/contributors';
import { useLabsData } from '../state/useLabsData';
import Logo from '../components/layout/Logo';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import IsoBlock, { type IsoTone } from '../components/labs/IsoBlock';
import { IconArrowRight, IconBook, IconCheck, IconCode, IconFlag, IconLightning, IconShieldCheck, IconTerminal, IconTrophy, ModuleIcon } from '../components/layout/icons';
import type { RoadmapTrack } from '../types';
import './entry-pages.css';
import './landing.css';

const PATHS: { track: RoadmapTrack; title: string; label: string; body: string; icon: string; tone: IsoTone; guide: CharacterId }[] = [
  { track: 'presecurity', label: 'Start here', title: 'Pre-security', body: 'Computers, networks, Linux and the tools every lab uses — from zero.', icon: 'terminal', tone: 'progress', guide: 'byte' },
  { track: 'security', label: 'Red team', title: 'Offensive security', body: 'Recon, web, Active Directory and cloud attacks against controlled targets.', icon: 'crosshair', tone: 'offense', guide: 'vex' },
  { track: 'defensive', label: 'Blue team', title: 'Defensive security', body: 'Triage alerts, query telemetry and run KC7-style incident casebooks.', icon: 'shield', tone: 'defense', guide: 'sentinel' },
  { track: 'programming', label: 'Build tools', title: 'Programming', body: 'Python, JavaScript and C++ with auto-graded challenges in the browser.', icon: 'code', tone: 'analysis', guide: 'cipher' },
  { track: 'software', label: 'Engineer', title: 'Software engineering', body: 'Specs, testing, design, delivery and secure development — the full craft.', icon: 'layers', tone: 'done', guide: 'cipher' },
];

const STEPS = [
  { title: 'Learn the concept', body: 'Room-style lessons with worked examples, diagrams and code you can run.', icon: <IconBook />, tone: 'progress' as IsoTone },
  { title: 'Hack the lab', body: 'Real terminals, live websites, SIEM consoles and directory maps — all sandboxed.', icon: <IconTerminal />, tone: 'offense' as IsoTone },
  { title: 'Capture the flag', body: 'Submit flags and typed answers to clear the room and earn XP.', icon: <IconFlag />, tone: 'done' as IsoTone },
];

const CREW: CharacterId[] = ['sentinel', 'ledger', 'beacon', 'vex', 'cipher', 'byte'];

/** The hero scene: an isometric island of rooms joined by a lit path, the DarkWorld crest in the
 *  middle, Sentinel standing guard and floating progress badges. Built from the platform's own
 *  3D tiles so the landing page previews exactly what learners get. */
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
          <IsoBlock width={96} depth={t.depth} tone={t.tone} glow={t.tone === 'progress'} crest={<ModuleIcon icon={t.icon} />} />
        </span>
      ))}
      <img className="ln-scene__sentinel" src={`${import.meta.env.BASE_URL}characters/sentinel-full.webp`} alt="" decoding="async" />
      <div className="ln-chip ln-chip--xp"><IconLightning className="h-4 w-4" /><b>+60 XP</b><span>Room cleared</span></div>
      <div className="ln-chip ln-chip--flag"><IconFlag className="h-4 w-4" /><code>flag&#123;first_blood&#125;</code></div>
      <div className="ln-chip ln-chip--rank"><span className="ln-chip__rank">0x3</span><span><b>Packet Sniffer</b><small>Level 9 · Gold league</small></span></div>
      <div className="ln-chip ln-chip--streak"><IconTrophy className="h-4 w-4" /><b>7-day streak</b></div>
    </div>
  );
}

export default function IntroPage() {
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

  return (
    <main className="dw-entry ln">
      <header className="ln-nav">
        <div className="ln-wrap ln-nav__inner">
          <Link to="/welcome" className="dw-brand ln-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
          <nav aria-label="Academy navigation">
            <a href="#how" onClick={jump('how')}>How it works</a>
            <a href="#paths" onClick={jump('paths')}>Learning paths</a>
            <a href="#levels" onClick={jump('levels')}>Level up</a>
            <Link to="/login">Sign in</Link>
            <Link to="/login?mode=signup" className="ln-btn ln-btn--primary">Join for free <IconArrowRight className="h-4 w-4" /></Link>
          </nav>
        </div>
      </header>

      <section className="ln-hero" aria-labelledby="entry-title">
        <div className="ln-wrap ln-hero__inner">
          <div className="ln-hero__copy">
            <p className="ln-kicker"><span />Hands-on cybersecurity training</p>
            <h1 id="entry-title">Learn security<br />by <em>doing it.</em></h1>
            <p className="ln-lead">Gamified rooms, real terminals and KC7-style investigations. Learn a concept, hack the lab, capture the flag — and level up from Initiate to Operator.</p>
            <div className="ln-actions">
              <Link to="/login?mode=signup" className="ln-btn ln-btn--primary ln-btn--lg">Start learning free <IconArrowRight className="h-4 w-4" /></Link>
              <a href="#paths" onClick={jump('paths')} className="ln-btn ln-btn--ghost ln-btn--lg">Explore paths</a>
            </div>
            <dl className="ln-stats">
              <div><dt>Hands-on rooms</dt><dd>{rooms ?? '600+'}</dd></div>
              <div><dt>Lessons</dt><dd>{lessons}</dd></div>
              <div><dt>Modules</dt><dd>{MODULES.length}</dd></div>
              <div><dt>Casebook episodes</dt><dd>38</dd></div>
            </dl>
          </div>
          <HeroScene />
        </div>
      </section>

      <section id="how" className="ln-section ln-wrap" aria-labelledby="how-title">
        <div className="ln-head"><p className="ln-kicker ln-kicker--ink"><span />How it works</p><h2 id="how-title">Every room is a mission.</h2><p>Read, hack, prove. The same loop takes you from your first terminal to a full incident investigation.</p></div>
        <ol className="ln-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <IsoBlock width={92} depth={16} tone={s.tone} crest={s.icon} />
              <span className="ln-steps__num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="paths" className="ln-band" aria-labelledby="paths-title">
        <div className="ln-wrap">
          <div className="ln-head ln-head--light"><p className="ln-kicker"><span />Learning paths</p><h2 id="paths-title">Choose your side. Clear the map.</h2><p>Five paths, each a roadmap of modules lit tile by tile as you progress. Start with pre-security if you are new.</p></div>
          <div className="ln-paths">
            {PATHS.map((p) => (
              <Link key={p.track} to="/login?mode=signup" className="ln-path">
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
        <div className="ln-head"><p className="ln-kicker ln-kicker--ink"><span />Level up</p><h2 id="levels-title">Progress you can see.</h2><p>Every flag, answer and solved challenge earns XP. Climb hexadecimal ranks, keep your streak alive and rise through the leagues.</p></div>
        <div className="ln-game">
          <article className="ln-card ln-card--rank">
            <span className="ln-card__label">Your rank</span>
            <div className="ln-rank"><span className="ln-rank__hex">0x5</span><div><b>Root Seeker</b><small>Level 17 · 4,180 XP</small></div></div>
            <div className="ln-xp"><i style={{ width: '68%' }} /></div>
            <small className="ln-card__note">320 XP to level 18</small>
          </article>
          <article className="ln-card">
            <span className="ln-card__label">Daily streak</span>
            <div className="ln-week">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} data-on={i < 5}>{i < 5 ? <IconCheck className="h-3.5 w-3.5" /> : d}</span>)}</div>
            <small className="ln-card__note">Streak freezes protect a missed day.</small>
          </article>
          <article className="ln-card">
            <span className="ln-card__label">Leagues</span>
            <ul className="ln-leagues">{LEAGUES.map((l) => <li key={l.name} style={{ '--tone': l.color } as React.CSSProperties}><IconShieldCheck className="h-4 w-4" />{l.name}</li>)}</ul>
          </article>
          <article className="ln-card">
            <span className="ln-card__label">Daily Op</span>
            <div className="ln-op"><IsoBlock width={58} depth={10} tone="offense" crest={<IconCode />} /><div><b>SQL Injection: Product Catalog</b><small>+50 XP bonus today</small></div></div>
          </article>
        </div>
      </section>

      <section className="ln-section ln-wrap" aria-labelledby="crew-title">
        <div className="ln-head"><p className="ln-kicker ln-kicker--ink"><span />Meet the crew</p><h2 id="crew-title">Guides on both sides of the fight.</h2><p>Breach Unit teaches you to attack with permission. Bastion teaches you to detect and respond. They walk with you through every room.</p></div>
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
          <p className="ln-kicker ln-kicker--ink"><span />The people behind DarkWorld</p>
          <h2 id="contributors-title">Built together.</h2>
          <p>DarkWorld grew from friendship, a shared idea and the commitment to make it real. ChrisB and Benedict Adjei built this platform together.</p>
        </div>
        <div className="ln-contributors">
          {CONTRIBUTORS.map((contributor) => (
            <article key={contributor.name} className="ln-contributor">
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
        <div className="ln-cta__art" aria-hidden="true"><IsoBlock width={120} depth={26} tone="done" glow crest={<IconFlag />} /></div>
        <div>
          <h2 id="cta-title">Your first room takes ten minutes.</h2>
          <p>Free to begin. Built for laptops and desktops. Your progress, XP and streak save automatically.</p>
        </div>
        <Link to="/login?mode=signup" className="ln-btn ln-btn--primary ln-btn--lg">Create your account <IconArrowRight className="h-4 w-4" /></Link>
      </section>

      <footer className="ln-footer ln-wrap"><span>© {new Date().getFullYear()} DarkWorld Academy</span><a href="#contributors" onClick={jump('contributors')}>Contributors</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><p>Learn deliberately. Practice responsibly.</p><Link to="/login">Enter your workspace →</Link></footer>
    </main>
  );
}
