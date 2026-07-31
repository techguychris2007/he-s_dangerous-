export type FsNode =
  | { type: 'file'; content: string; mode?: string }
  | { type: 'dir'; children: Record<string, FsNode>; mode?: string };

export function dir(children: Record<string, FsNode>): FsNode {
  return { type: 'dir', children };
}

export function file(content: string, mode?: string): FsNode {
  return { type: 'file', content, mode };
}

export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** Resolve an input path (absolute, relative, `..`, `.`, `~`) against a cwd stack into a new stack. */
export function resolvePath(cwd: string[], input: string, home: string[]): string[] {
  let segments: string[];
  let working: string[];

  if (input.startsWith('~')) {
    working = [...home];
    input = input.slice(1);
    if (input.startsWith('/')) input = input.slice(1);
    segments = splitPath(input);
  } else if (input.startsWith('/')) {
    working = [];
    segments = splitPath(input);
  } else {
    working = [...cwd];
    segments = splitPath(input);
  }

  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      working.pop();
    } else {
      working.push(seg);
    }
  }
  return working;
}

export function getNode(root: FsNode, path: string[]): FsNode | null {
  let node: FsNode = root;
  for (const seg of path) {
    if (node.type !== 'dir') return null;
    const next = node.children[seg];
    if (!next) return null;
    node = next;
  }
  return node;
}

/** Writes `node` at `path`, creating any missing parent directories along the way (like `mkdir -p`
 *  implied by a shell redirect). Returns false if a path segment along the way exists but isn't a
 *  directory (e.g. `echo hi > /etc/passwd/foo`, where /etc/passwd is a file). */
export function setNode(root: FsNode, path: string[], node: FsNode): boolean {
  if (path.length === 0) return false;
  let cur: FsNode = root;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (cur.type !== 'dir') return false;
    let next = cur.children[seg];
    if (!next) {
      next = { type: 'dir', children: {} };
      cur.children[seg] = next;
    }
    if (next.type !== 'dir') return false;
    cur = next;
  }
  if (cur.type !== 'dir') return false;
  cur.children[path[path.length - 1]] = node;
  return true;
}

export function pathToString(path: string[]): string {
  return '/' + path.join('/');
}
