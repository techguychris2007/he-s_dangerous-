/** Pages a signed-out visitor may browse before deciding to sign up: the catalogues and module
 *  overviews. Workspaces (lessons, labs, casebooks, coding tasks, the book reader) and everything
 *  personal stay behind sign-in; opening one sends the visitor to sign up and then straight back
 *  (src/shared/lib/returnTo.ts). Data in these pages is the public catalogue only. */
const VISITOR_PATHS = [
  /^\/roadmap\/?$/,
  /^\/module\/[^/]+\/?$/,
  /^\/labs\/?$/,
  /^\/library\/?$/,
  /^\/soc-portal\/?$/,
  /^\/code-portal\/?$/,
];

export function isVisitorPath(pathname: string): boolean {
  return VISITOR_PATHS.some(pattern => pattern.test(pathname));
}
