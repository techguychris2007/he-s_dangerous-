// A React Router (v7, declarative mode) compatible subset for the in-browser runner. The sandboxed
// frame has no real URL to push to, so every router here keeps its history in memory; the API is the
// same one learners use in a real Vite app (`import { Routes, Route, Link } from 'react-router'`).
// Only what is declared in testkit.d.ts exists.
import { createContext, createElement, Children, Fragment, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NavigationContext = createContext(null);
const RouteContext = createContext({ outlet: null, params: {}, pathnameBase: '/' });

let keySeed = 0;

function parsePath(to) {
  const value = typeof to === 'string' ? to : (to.pathname || '') + (to.search || '') + (to.hash || '');
  let rest = value;
  let hash = '';
  let search = '';
  const h = rest.indexOf('#');
  if (h >= 0) { hash = rest.slice(h); rest = rest.slice(0, h); }
  const q = rest.indexOf('?');
  if (q >= 0) { search = rest.slice(q); rest = rest.slice(0, q); }
  return { pathname: rest, search: search === '?' ? '' : search, hash };
}

function joinPaths(...parts) {
  return ('/' + parts.join('/')).replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
}

function resolvePathname(relative, from) {
  if (relative.startsWith('/')) return normalize(relative);
  const segments = from.split('/').filter(Boolean);
  for (const part of relative.split('/')) {
    if (part === '..') segments.pop();
    else if (part !== '.' && part !== '') segments.push(part);
  }
  return normalize('/' + segments.join('/'));
}

function normalize(pathname) {
  const p = ('/' + pathname).replace(/\/{2,}/g, '/');
  return p.length > 1 ? p.replace(/\/$/, '') : p;
}

function makeLocation(to, base, state) {
  const parsed = parsePath(to);
  return {
    pathname: parsed.pathname === '' ? base : resolvePathname(parsed.pathname, base),
    search: parsed.search,
    hash: parsed.hash,
    state: state === undefined ? null : state,
    key: 'k' + ++keySeed,
  };
}

function useNavigation(hook) {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error(hook + '() may be used only in the context of a <Router> component (wrap your app in <MemoryRouter> or <BrowserRouter>).');
  return ctx;
}

export function MemoryRouter({ initialEntries = ['/'], initialIndex, children }) {
  const [history, setHistory] = useState(() => {
    const entries = initialEntries.map((e) => makeLocation(e, '/', typeof e === 'object' ? e.state : undefined));
    return { entries, index: initialIndex ?? entries.length - 1 };
  });
  const location = history.entries[history.index];
  const locationRef = useRef(location);
  locationRef.current = location;

  const navigate = useCallback((to, options = {}) => {
    setHistory((h) => {
      if (typeof to === 'number') {
        const index = Math.min(Math.max(h.index + to, 0), h.entries.length - 1);
        return { ...h, index };
      }
      const next = makeLocation(to, options.relativeTo ?? h.entries[h.index].pathname, options.state);
      if (options.replace) {
        const entries = h.entries.slice();
        entries[h.index] = next;
        return { entries, index: h.index };
      }
      return { entries: [...h.entries.slice(0, h.index + 1), next], index: h.index + 1 };
    });
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return createElement(NavigationContext.Provider, { value }, children);
}

/** In the sandbox there is no address bar to sync with, so BrowserRouter keeps its history in memory. */
export function BrowserRouter({ children }) {
  return createElement(MemoryRouter, { initialEntries: ['/'] }, children);
}

export function useLocation() {
  return useNavigation('useLocation').location;
}

export function useNavigate() {
  const { navigate } = useNavigation('useNavigate');
  const { pathnameBase } = useContext(RouteContext);
  return useCallback((to, options = {}) => {
    if (typeof to === 'number') return navigate(to);
    const path = parsePath(to).pathname;
    return navigate(to, path.startsWith('/') ? options : { ...options, relativeTo: pathnameBase });
  }, [navigate, pathnameBase]);
}

export function useParams() {
  return useContext(RouteContext).params;
}

export function useSearchParams() {
  const { location, navigate } = useNavigation('useSearchParams');
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const set = useCallback((next, options = {}) => {
    const value = typeof next === 'function' ? next(new URLSearchParams(location.search)) : next;
    const search = new URLSearchParams(value).toString();
    navigate({ pathname: location.pathname, search: search ? '?' + search : '' }, options);
  }, [location.pathname, location.search, navigate]);
  return [params, set];
}

export function Route() {
  throw new Error('A <Route> is only ever used as a child of <Routes>, never rendered directly.');
}

export function Outlet() {
  return useContext(RouteContext).outlet;
}

function createRoutes(children, parentPath, parents, out) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) { createRoutes(child.props.children, parentPath, parents, out); return; }
    if (child.type !== Route) throw new Error('<Routes> children must be <Route> elements (or fragments of them).');
    const props = child.props;
    const fullPath = props.index ? parentPath : props.path === undefined ? parentPath : props.path.startsWith('/') ? normalize(props.path) : joinPaths(parentPath, props.path);
    const route = { element: props.element, path: props.path, index: !!props.index, fullPath };
    const chain = [...parents, route];
    const hasChildren = Children.count(props.children) > 0;
    if (hasChildren) createRoutes(props.children, fullPath, chain, out);
    if (props.index || props.path !== undefined || !hasChildren) out.push(chain);
  });
  return out;
}

function matchPattern(pattern, pathname) {
  const pat = pattern.split('/').filter(Boolean);
  const path = pathname.split('/').filter(Boolean);
  const params = {};
  let score = 0;
  for (let i = 0; i < pat.length; i++) {
    const seg = pat[i];
    if (seg === '*') {
      params['*'] = path.slice(i).map(decodeURIComponent).join('/');
      return { params, score: score + 1 };
    }
    if (i >= path.length) return null;
    if (seg.startsWith(':')) {
      params[seg.slice(1)] = decodeURIComponent(path[i]);
      score += 3;
    } else if (seg.toLowerCase() === path[i].toLowerCase()) {
      score += 10;
    } else {
      return null;
    }
  }
  return pat.length === path.length ? { params, score: score + 2 } : null;
}

export function Routes({ children, location: locationOverride }) {
  const { location } = useNavigation('Routes');
  const parent = useContext(RouteContext);
  const pathname = (locationOverride ? parsePath(locationOverride).pathname : location.pathname);
  const branches = useMemo(() => createRoutes(children, parent.pathnameBase === '/' ? '/' : parent.pathnameBase, [], []), [children, parent.pathnameBase]);

  let best = null;
  for (const chain of branches) {
    const leaf = chain[chain.length - 1];
    const m = matchPattern(leaf.fullPath, pathname);
    if (!m) continue;
    const score = m.score + (leaf.index ? 1 : 0);
    if (!best || score > best.score) best = { chain, params: m.params, score };
  }
  if (!best) return null;

  const params = { ...parent.params, ...best.params };
  let element = null;
  for (let i = best.chain.length - 1; i >= 0; i--) {
    const route = best.chain[i];
    const own = route.element === undefined ? createElement(Outlet) : route.element;
    element = createElement(RouteContext.Provider, { value: { outlet: element, params, pathnameBase: route.fullPath.replace(/\/\*$/, '') || '/' } }, own);
  }
  return element;
}

export function Navigate({ to, replace, state }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to, { replace, state }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function isModified(e) {
  return e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.button !== 0;
}

function hrefFor(to, base) {
  const loc = makeLocation(to, base);
  return loc.pathname + loc.search + loc.hash;
}

export function Link({ to, replace, state, onClick, children, ...rest }) {
  const navigate = useNavigate();
  const { location } = useNavigation('Link');
  const { pathnameBase } = useContext(RouteContext);
  const base = parsePath(to).pathname.startsWith('/') ? location.pathname : pathnameBase;
  return createElement('a', {
    ...rest,
    href: hrefFor(to, base),
    onClick: (e) => {
      if (onClick) onClick(e);
      if (e.defaultPrevented || isModified(e) || (rest.target && rest.target !== '_self')) return;
      e.preventDefault();
      navigate(to, { replace, state });
    },
  }, children);
}

export function NavLink({ to, end, className, style, children, ...rest }) {
  const { location } = useNavigation('NavLink');
  const { pathnameBase } = useContext(RouteContext);
  const target = makeLocation(to, parsePath(to).pathname.startsWith('/') ? location.pathname : pathnameBase).pathname.toLowerCase();
  const current = location.pathname.toLowerCase();
  const isActive = current === target || (!end && target !== '/' && current.startsWith(target + '/'));
  const props = { isActive, isPending: false, isTransitioning: false };
  return createElement(Link, {
    ...rest,
    to,
    'aria-current': isActive ? 'page' : undefined,
    className: typeof className === 'function' ? className(props) : [className, isActive ? 'active' : ''].filter(Boolean).join(' ') || undefined,
    style: typeof style === 'function' ? style(props) : style,
  }, typeof children === 'function' ? children(props) : children);
}
