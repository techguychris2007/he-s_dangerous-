/** Runs SQL project targets on SQLite compiled to WebAssembly (sql.js) inside a dedicated Worker, so a
 *  runaway query can be stopped by terminating the worker. The wasm file is bundled with the app. */
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { runSqlTarget, type SqlFile, type SqlJsStatic } from './sqlHarness';

const sqlPromise = initSqlJs({ locateFile: () => wasmUrl }) as Promise<SqlJsStatic>;

self.onmessage = async (e: MessageEvent<{ files: SqlFile[]; entry: string; testCode?: string }>) => {
  try {
    const SQL = await sqlPromise;
    self.postMessage(runSqlTarget(SQL, e.data.files, e.data.entry, e.data.testCode));
  } catch (error) {
    self.postMessage({ stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false });
  }
};
