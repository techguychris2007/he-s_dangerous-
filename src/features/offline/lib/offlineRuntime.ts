/** Require the interpreter itself as well as packages; a localStorage marker is not proof of a download. */
export function hasOfflinePythonFiles(urls: readonly string[], base: string, manifest: unknown): boolean {
  const current = urls.filter(url => url.startsWith(base));
  const exact = (name: string) => current.includes(base + name);
  if (!(exact('pyodide.js') && exact('pyodide.asm.mjs') && exact('pyodide.asm.wasm')
    && exact('python_stdlib.zip') && exact('pyodide-lock.json'))) return false;
  if (!manifest || typeof manifest !== 'object' || !('packages' in manifest)
    || !manifest.packages || typeof manifest.packages !== 'object') return false;
  const packages = manifest.packages as Record<string, unknown>;
  const checked = new Set<string>();
  function complete(name: string): boolean {
    if (checked.has(name)) return true;
    const pkg = packages[name];
    if (!pkg || typeof pkg !== 'object' || !('file_name' in pkg) || typeof pkg.file_name !== 'string'
      || !('depends' in pkg) || !Array.isArray(pkg.depends) || !exact(pkg.file_name)) return false;
    checked.add(name);
    return pkg.depends.every(dependency => typeof dependency === 'string' && complete(dependency));
  }
  return complete('numpy') && complete('pandas');
}
