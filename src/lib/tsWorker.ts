/** Hosts the TypeScript compiler (public/ts-runtime/typescript.js) in a long-lived Worker. Loading
 *  and parsing the compiler and the DOM type library is the expensive part (~1 s), so this worker is
 *  kept for the whole session and only compiles; learner code never runs here (see tsExecWorker.ts
 *  and reactRunner.ts), so it can never be hung by an infinite loop. */
import { compileTypeScript, type TsSource, type TsTypeFs } from './tsCompile';

let loaded: Promise<{ ts: unknown; typeFs: TsTypeFs }> | null = null;

async function load(base: string) {
  const [compiler, types] = await Promise.all([
    fetch(new URL('ts-runtime/typescript.js', base)).then((r) => { if (!r.ok) throw new Error(`typescript.js: HTTP ${r.status}`); return r.text(); }),
    fetch(new URL('ts-runtime/types.json', base)).then((r) => { if (!r.ok) throw new Error(`types.json: HTTP ${r.status}`); return r.json() as Promise<TsTypeFs>; }),
  ]);
  // The bundle is an IIFE assigning `var __dw_ts`; indirect eval runs it at global scope.
  (0, eval)(`${compiler}\n;self.__dw_ts = __dw_ts;`);
  const ts = (self as unknown as { __dw_ts: unknown }).__dw_ts;
  // Warm the lib caches so the learner's first real compile is fast.
  compileTypeScript(ts, types, [{ path: '__warmup__.tsx', content: 'export const x: number = 1;' }]);
  return { ts, typeFs: types };
}

self.onmessage = async (e: MessageEvent<{ id: number; base: string; sources?: TsSource[] }>) => {
  const { id, base, sources } = e.data;
  try {
    loaded ??= load(base);
    const { ts, typeFs } = await loaded;
    if (!sources) { self.postMessage({ id, ready: true }); return; }
    self.postMessage({ id, result: compileTypeScript(ts, typeFs, sources) });
  } catch (error) {
    loaded = null;
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
