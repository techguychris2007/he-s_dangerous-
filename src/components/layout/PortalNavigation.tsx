import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import AcademySearch from './AcademySearch';
import InstallAppButton from './InstallAppButton';
import './navigation.css';

const links = [['/roadmap', 'Learn'], ['/labs', 'Labs'], ['/soc-portal', 'Investigate'], ['/code-portal', 'Code'], ['/build-portal', 'Build'], ['/ml-portal', 'ML'], ['/library', 'Library']] as const;
const titles: Record<string, string> = { '/code-portal': 'Code Portal', '/build-portal': 'Build Portal', '/ml-portal': 'Machine Learning', '/soc-portal': 'SOC Investigations', '/library': 'Library' };
export default function PortalNavigation() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = (titles[pathname] ?? 'Academy') + ' · DarkWorld'; }, [pathname]);
  return <header className="dw-portal-navigation">
    <NavLink to="/" className="dw-portal-brand" aria-label="DarkWorld overview"><Logo className="h-9 w-9"/><span>DarkWorld</span></NavLink>
    <nav aria-label="Portal navigation">{links.map(([to, title]) => <NavLink key={to} to={to} className={({isActive}) => isActive ? 'is-active' : ''}>{title}</NavLink>)}</nav>
    <InstallAppButton/><AcademySearch compact />
  </header>;
}

