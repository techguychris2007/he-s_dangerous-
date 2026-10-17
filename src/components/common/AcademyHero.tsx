import { Link } from 'react-router-dom';
import { IconArrowRight } from '../layout/icons';
import './academy.css';

interface AcademyHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  action: { label: string; to: string; title: string; detail: string };
  stats: { label: string; value: string | number }[];
}

export default function AcademyHero({ eyebrow, title, description, action, stats }: AcademyHeroProps) {
  return <header className="academy-hero">
    <div className="academy-hero-copy">
      <div className="academy-eyebrow"><span />{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="academy-hero-stats">{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
    </div>
    <div className="academy-resume">
      <span className="academy-resume-label">Your next chapter</span>
      <h2>{action.title}</h2>
      <p>{action.detail}</p>
      <Link to={action.to} className="academy-primary-action">{action.label}<IconArrowRight className="h-4 w-4" /></Link>
    </div>
  </header>;
}
