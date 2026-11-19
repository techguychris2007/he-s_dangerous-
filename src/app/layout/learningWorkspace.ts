/** Work areas use the focused header; browsing pages retain their existing sidebar. */
export function isLearningWorkspace(pathname: string): boolean {
  return /^\/module\/[^/]+\/lesson\/[^/]+\/?$/.test(pathname)
    || /^\/(ml-lesson|code-task|build-task|lab|siem-lab)\/[^/]+\/?$/.test(pathname)
    || /^\/library\/[^/]+\/?$/.test(pathname);
}
