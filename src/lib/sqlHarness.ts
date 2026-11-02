import type { RunResult } from './runResult';

/** The parts of sql.js the harness uses (kept structural so this file has no runtime import). */
interface SqlDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[];
  close(): void;
}
export interface SqlJsStatic { Database: new () => SqlDatabase }

export interface SqlFile { path: string; content: string }

/** Rows as plain objects, column name → value. */
type Row = Record<string, unknown>;

function rowsOf(db: SqlDatabase, sql: string, params?: unknown[]): Row[] {
  const [result] = db.exec(sql, params);
  if (!result) return [];
  return result.values.map(values => Object.fromEntries(result.columns.map((c, i) => [c, values[i]])));
}

function table(result: { columns: string[]; values: unknown[][] }): string {
  const cells = [result.columns, ...result.values.map(v => v.map(x => (x === null ? 'NULL' : String(x))))];
  const widths = result.columns.map((_, i) => Math.max(...cells.map(r => String(r[i]).length)));
  const line = (r: unknown[]) => r.map((c, i) => String(c).padEnd(widths[i])).join(' | ');
  return [line(cells[0]), widths.map(w => '-'.repeat(w)).join('-+-'), ...cells.slice(1).map(line)].join('\n');
}

/** Runs one SQL project target against a fresh in-memory SQLite database with foreign keys enabled.
 *
 *  Plain run (no testCode): executes the entry file and prints every result set as a table.
 *  Test run: executes every .sql file listed in testCode's own setup, then evaluates testCode — a
 *  JavaScript function body that receives { db, files, rows, exec, tryExec, check } and records checks with
 *  check(name, ok, detail). The harness prints [PASS]/[FAIL] lines and the trailing __RESULT__ line, the
 *  same contract every other runner uses. */
export function runSqlTarget(SQL: SqlJsStatic, files: SqlFile[], entry: string, testCode?: string): RunResult {
  const db = new SQL.Database();
  const out: string[] = [];
  try {
    db.run('PRAGMA foreign_keys = ON;');
    const byPath = new Map(files.map(f => [f.path, f.content]));
    if (testCode === undefined) {
      const sql = byPath.get(entry);
      if (sql === undefined) return { stdout: '', stderr: `No file named ${entry}.`, ok: false };
      for (const result of db.exec(sql)) out.push(table(result), '');
      return { stdout: out.join('\n') || '(statements ran; no rows returned)', stderr: '', ok: true };
    }

    let passed = 0;
    let total = 0;
    const check = (name: string, ok: boolean, detail = '') => {
      total++;
      if (ok) passed++;
      out.push(`[${ok ? 'PASS' : 'FAIL'}] ${name}${!ok && detail ? `: ${detail}` : ''}`);
    };
    const exec = (sql: string, params?: unknown[]) => { db.run(sql, params); };
    const tryExec = (sql: string, params?: unknown[]): string | null => {
      try { db.run(sql, params); return null; } catch (error) { return error instanceof Error ? error.message : String(error); }
    };
    const rows = (sql: string, params?: unknown[]) => rowsOf(db, sql, params);
    const fileText = (path: string) => byPath.get(path) ?? '';
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const body = new Function('db', 'file', 'rows', 'exec', 'tryExec', 'check', testCode);
    try {
      body(db, fileText, rows, exec, tryExec, check);
    } catch (error) {
      check('setup', false, error instanceof Error ? error.message : String(error));
    }
    out.push(`__RESULT__ ${passed}/${total}`);
    return { stdout: out.join('\n'), stderr: '', ok: true };
  } catch (error) {
    return { stdout: out.join('\n'), stderr: error instanceof Error ? error.message : String(error), ok: false };
  } finally {
    db.close();
  }
}
