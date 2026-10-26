import { useCallback, useEffect, useState } from 'react';

/** v2: the platform became dark-first (TryHackMe style); the new key resets earlier light defaults. */
const THEME_KEY = 'darkworld.theme.v2';

/** Sets the theme attribute before the first render on every entry point, so pages without the app
 *  shell (portals, previews) are dark from the first frame. Dark unless the learner chose light. */
export function applyInitialTheme() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked: stay dark */ }
  document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
}

function getInitialTheme(): 'light' | 'dark' {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark' || attr === 'light') return attr;
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
