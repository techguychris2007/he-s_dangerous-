import { useEffect, useState } from 'react';
import { loadChosenCrew, saveChosenCrew, type Crew } from '../data/characters';

/** The learner's chosen crew, kept in sync across every component that shows it. */
export function useCrew(): [Exclude<Crew, 'rival'> | null, (crew: Exclude<Crew, 'rival'>) => void] {
  const [crew, setCrew] = useState(loadChosenCrew);
  useEffect(() => {
    const update = () => setCrew(loadChosenCrew());
    window.addEventListener('darkworld:crew', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('darkworld:crew', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return [crew, saveChosenCrew];
}
