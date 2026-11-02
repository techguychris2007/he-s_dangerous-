/** Minimal typing for sql.js (SQLite compiled to WebAssembly); see src/lib/sqlHarness.ts for the API used. */
declare module 'sql.js' {
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<unknown>;
}
