import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { MODULES } from '../data/curriculum';
import Logo from '../components/layout/Logo';
import { IconTerminal, IconShieldCheck, IconRadar, IconArrowRight } from '../components/layout/icons';
import './entry-pages.css';

const PATHS = [
  { number: '01', title: 'Build your foundation', label: 'Pre-security', body: 'Get comfortable with systems, networks, the command line and the tools you’ll use in the labs.', Icon: IconTerminal },
  { number: '02', title: 'Understand the attack', label: 'Offensive security', body: 'Study web, network, cloud and identity security. Apply each concept to a controlled training target.', Icon: IconShieldCheck },
  { number: '03', title: 'Investigate the evidence', label: 'Defensive security', body: 'Read logs, explore SIEM queries and connect evidence across simulated incident investigations.', Icon: IconRadar },
];

export default function IntroPage() {
  const auth = useAuth();
  if (!auth.loading && auth.user) return <Navigate to="/" replace />;
  const showPaths = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('learning-paths')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const lessons = MODULES.reduce((total, module) => total + module.lessons.length, 0);
  return (
    <main className="dw-entry dw-landing">
      <header className="dw-entry-nav dw-entry-container">
        <Link to="/welcome" className="dw-brand"><Logo className="dw-brand-mark" /><span>DARKWORLD<small>CYBERSECURITY ACADEMY</small></span></Link>
        <nav aria-label="Academy navigation"><a href="#learning-paths" onClick={showPaths}>Learning paths</a><Link to="/login">Sign in</Link><Link to="/login?mode=signup" className="dw-button dw-button-primary">Join the academy <IconArrowRight className="h-4 w-4" /></Link></nav>
      </header>
      <section className="dw-entry-hero dw-entry-container" aria-labelledby="entry-title">
        <div className="dw-entry-hero-copy">
          <p className="dw-eyebrow">The DarkWorld learning experience</p>
          <h1 id="entry-title">Understand security.<br /><em>Put it into practice.</em></h1>
          <p className="dw-entry-lead">A focused space to learn cybersecurity, write code and investigate threats. Build your knowledge through detailed lessons, then test it in hands-on simulations.</p>
          <div className="dw-entry-actions"><Link to="/login?mode=signup" className="dw-button dw-button-primary">Start learning <IconArrowRight className="h-4 w-4" /></Link><a href="#learning-paths" onClick={showPaths} className="dw-button dw-button-secondary">Explore learning paths</a></div>
          <p className="dw-entry-caption">Free to begin · Designed for laptops and desktops</p>
        </div>
        <aside className="dw-entry-preview" aria-label="How learning works at DarkWorld">
          <div className="dw-preview-top"><span>DARKWORLD / LEARNING WORKSPACE</span><IconShieldCheck className="h-5 w-5" /></div>
          <div className="dw-entry-world" aria-hidden="true" />
          <h2>A world of skills to explore.</h2>
          <ol>
            <li><span>01</span><div><h3>Learn the concept</h3></div></li>
            <li><span>02</span><div><h3>Put it into practice</h3></div></li>
            <li><span>03</span><div><h3>Build your next skill</h3></div></li>
          </ol>
          <div className="dw-preview-bottom"><IconTerminal className="h-4 w-4" /><span>Lessons · Terminals · Investigations · Code</span></div>
        </aside>
      </section>
      <div className="dw-entry-facts dw-entry-container"><div><strong>{MODULES.length}</strong><span>Learning modules</span></div><div><strong>{lessons}</strong><span>Security lessons</span></div><p>Start with the fundamentals.<br />Progress at your own pace.</p></div>
      <section id="learning-paths" className="dw-entry-paths dw-entry-container" aria-labelledby="paths-title">
        <div className="dw-entry-section-heading"><div><p className="dw-eyebrow">Choose your direction</p><h2 id="paths-title">Learn with a path in mind.</h2></div><p>New to cybersecurity? Begin with pre-security and build from there.</p></div>
        <div className="dw-path-grid">{PATHS.map(({ number, title, label, body, Icon }) => <Link to="/login?mode=signup" className="dw-path" key={number}><div className="dw-path-top"><Icon className="h-6 w-6" /><span>{number}</span></div><p className="dw-eyebrow">{label}</p><h3>{title}</h3><p>{body}</p><span className="dw-path-link">Explore this path <IconArrowRight className="h-4 w-4" /></span></Link>)}</div>
      </section>
      <footer className="dw-entry-footer dw-entry-container"><span>© {new Date().getFullYear()} DarkWorld Academy</span><p>Learn deliberately. Practice responsibly.</p><Link to="/login">Enter your workspace →</Link></footer>
    </main>
  );
}
