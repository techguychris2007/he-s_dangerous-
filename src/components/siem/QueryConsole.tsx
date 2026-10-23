import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { SiemLabScenario, SiemTool } from '../../labs/siemTypes';
import { extractFlag } from '../../labs/siemTypes';
import { eventRow, executeSiemQuery, type QueryExecution } from '../../labs/siemExecution';
import { QUERY_LANGUAGES } from '../../labs/queryLanguages';
import type { InvestigationEditorHandle } from './InvestigationEditor';
const InvestigationEditor = lazy(() => import('./InvestigationEditor'));
import SiemQueryGuide from './SiemQueryGuide';
import './query-console.css';

export default function QueryConsole({ scenario, onFlagCaptured, onTranscriptChange, onResults, workbook = false, onQueryRun, storageKey }: { scenario: SiemLabScenario; onFlagCaptured: (flag: string) => void; onTranscriptChange?: (value: string) => void; onResults?: (entries: SiemLabScenario['entries']) => void; workbook?: boolean; onQueryRun?: () => void; storageKey?: string }) {
  const [saved] = useState(() => {
    try {
      const data = storageKey ? JSON.parse(localStorage.getItem(storageKey) ?? '{}') : {};
      const drafts: Record<string, string> = {};
      for (const [key, value] of Object.entries(data?.drafts ?? {})) if (typeof value === 'string' && value.length <= 100000) drafts[key] = value;
      return { tool: (['sentinel', 'splunk', 'qradar', 'elastic', 'chronicle'].includes(data?.tool) ? data.tool : scenario.tool) as SiemTool, drafts };
    } catch { return { tool: scenario.tool, drafts: {} as Record<string, string> }; }
  });
  const [tool, setTool] = useState<SiemTool>(saved.tool);
  const [saveError, setSaveError] = useState(false);
  const editor = useRef<InvestigationEditorHandle>(null);
  const worker = useRef<Worker | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const drafts = useRef<Record<string, string>>(saved.drafts);
  useEffect(() => () => { worker.current?.terminate(); clearTimeout(deadline.current); }, []);
  const [query, setQuery] = useState(saved.drafts[saved.tool] ?? (workbook ? QUERY_LANGUAGES[saved.tool]?.sample ?? '*' : ''));
  const [result, setResult] = useState<QueryExecution | null>(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [history, setHistory] = useState<{ query: string; summary: string }[]>([]);
  const [reference, setReference] = useState(false);
  const [schema, setSchema] = useState(false);
  useEffect(() => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ tool, drafts: { ...drafts.current, [tool]: query } })); setSaveError(false); }
    catch { setSaveError(true); }
  }, [query, tool, storageKey]);
  const sources = useMemo(() => {
    const tables = new Map<string, number>(), fields = new Set<string>(), schemas = new Map<string, Map<string, string>>();
    for (const entry of scenario.entries) { const row = eventRow(entry), table = String(row.Table); tables.set(table, (tables.get(table) ?? 0) + 1); const schema = schemas.get(table) ?? new Map<string, string>(); Object.entries(row).filter(([key]) => !key.startsWith('_')).forEach(([key, value]) => { fields.add(key); if (value !== null) schema.set(key, typeof value === 'number' ? Number.isInteger(value) ? 'long' : 'real' : typeof value === 'boolean' ? 'bool' : /time|date/i.test(key) && !Number.isNaN(Date.parse(String(value))) ? 'datetime' : 'string'); }); schemas.set(table, schema); }
    return { tables: [...tables], fields: [...fields].sort(), schemas };
  }, [scenario.entries]);
  const sample = tool === 'sentinel' ? 'SecurityEvent\n| where EventID == 4625\n| summarize Failures=count() by Account\n| sort by Failures desc' : tool === 'splunk' ? 'index=main EventCode=4625 | stats count by user | sort -count' : tool === 'qradar' ? "SELECT user, COUNT(*) AS failures FROM events WHERE EventID = 4625 GROUP BY user ORDER BY failures DESC" : tool === 'elastic' ? 'event.category: authentication AND event.outcome: failure' : '*';
  const rows = result?.rows ?? [];
  const columns = useMemo(() => {
    if (!result) return [];
    const available = result.columns.filter(column => !['_raw', '_time', 'Table'].includes(column));
    const preferred = ['TimeGenerated', 'EventType', 'user', 'host', 'src_ip', 'EventID', 'action'];
    return (result.aggregated ? available : [...preferred.filter(column => available.includes(column)), ...available.filter(column => !preferred.includes(column))]);
  }, [result]);
  const run = () => {
    if (busy) { worker.current?.terminate(); worker.current = null; clearTimeout(deadline.current); setBusy(false); return; }
    const text = workbook ? editor.current?.getRunnableQuery() ?? query : query;
    const start = performance.now();
    const finish = (execution: QueryExecution, elapsed: number) => {
      clearTimeout(deadline.current); setBusy(false); setResult(execution); setDuration(elapsed); setPage(0); setExpanded(null);
      const next = [...history.slice(-29), { query: text, summary: execution.error ?? `${execution.rows.length} result rows` }];
      setHistory(next); onTranscriptChange?.(next.map(item => item.query + '\n' + item.summary).join('\n\n'));
      if (!execution.error) onQueryRun?.();
    };
    if (!workbook) { finish(executeSiemQuery(scenario.entries, text, tool), performance.now() - start); return; }
    if (!worker.current) {
      worker.current = new Worker(new URL('../../labs/queryWorker.ts', import.meta.url), { type: 'module' });
      worker.current.postMessage({ kind: 'load', entries: scenario.entries });
    }
    setBusy(true); setExpanded(null);
    const failed = (message: string) => { worker.current?.terminate(); worker.current = null; finish({ rows: [], columns: [], entries: [], scanned: scenario.entries.length, aggregated: false, error: message }, performance.now() - start); };
    worker.current.onmessage = event => finish(event.data.result, event.data.duration);
    worker.current.onerror = () => failed('The query worker stopped. Your draft is preserved; try running it again.');
    deadline.current = setTimeout(() => failed('Query stopped after 8 seconds. Narrow the time window or source table.'), 8000);
    worker.current.postMessage({ kind: 'run', id: Date.now(), query: text, tool });
  };
  function inspect(index: number) {
    setExpanded(expanded === index ? null : index);
    const raw = rows[index]?._raw;
    const entry = scenario.entries.find(item => item.line === raw);
    if (entry) onResults?.([entry]);
  }
  return <div className="dw-query-console">
    <header><div><strong>Investigation workbench</strong><span>{scenario.entries.length.toLocaleString()} records · Original training dataset · UTC</span></div><div>{workbook ? <select aria-label="Query language" value={tool} disabled={busy} onChange={event => { drafts.current[tool] = query; const next = event.target.value as SiemTool; setTool(next); setQuery(drafts.current[next] ?? QUERY_LANGUAGES[next]?.sample ?? '*'); setResult(null); setExpanded(null); }}>
      {(['sentinel', 'splunk', 'qradar', 'elastic', 'chronicle'] as const).map(language => <option key={language} value={language}>{QUERY_LANGUAGES[language]?.name}</option>)}
    </select> : <span>{QUERY_LANGUAGES[tool]?.name}</span>}<button type="button" onClick={() => setSchema(value => !value)} aria-expanded={schema}>Tables</button><button type="button" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen}>History</button><button type="button" onClick={() => setReference(value => !value)} aria-expanded={reference}>Query help</button></div></header>
    {historyOpen && <section className="dw-query-reference" aria-label="Query history"><h3>Recent queries</h3>{history.length ? history.map((item, index) => <button key={index} onClick={() => { setQuery(item.query); setHistoryOpen(false); }}><pre>{item.query}</pre><span>{item.summary}</span></button>) : <p>Run a query to start your investigation history.</p>}</section>}
    {schema && <section className="dw-query-reference" aria-label="Dataset schema"><h3>Available sources and fields</h3><div className="dw-query-table-browser">{sources.tables.map(([table, count]) => <details key={table}><summary>{table} <span>{count.toLocaleString()} records</span></summary><dl>{[...(sources.schemas.get(table) ?? [])].map(([field, type]) => <div key={field}><dt>{field}</dt><dd>{type}</dd></div>)}</dl></details>)}</div><p>Fields observed in this dataset:</p><div className="dw-query-field-list">{sources.fields.map(key => <code key={key}>{key}</code>)}</div><p>Not every source provides every field. Use Inspect event to read a source record and verify what a value means.</p></section>}
    {reference && <section className="dw-query-reference"><h3>Query the evidence</h3><p>Start broadly, compare normal and unusual activity, then narrow your search. Open a returned source event to inspect its fields. Supported syntax depends on the selected language.</p><p>{QUERY_LANGUAGES[tool]?.help}</p><details><summary>Local engine capabilities</summary><p>Supported: field comparisons (=, ==, !=, &gt;, &lt;), AND / OR / NOT and parentheses, contains / has / startswith, in (...), wildcards for =, where, stats / summarize with count, sum, avg, min, max, dc / dcount, values, table / project / fields, distinct / dedup, sort / order, head / take / limit. Sentinel tables and basic QRadar SELECT / WHERE / GROUP BY are supported. Unsupported operators produce an error.</p><p>Times belong to the case; <code>ago(1h)</code> is relative to the latest event in this dataset. This is a local query engine, not a connection to the vendor’s live SIEM. Packet filters support tcp/udp/icmp, source/destination host and port, and boolean groups; the full BPF language is not implemented.</p></details><pre>{QUERY_LANGUAGES[tool]?.sample ?? sample}</pre><p>These records are original training reconstructions with generated routine activity. They are not private production logs from a victim organization.</p><SiemQueryGuide tool={tool}/></section>}
    <div className={`dw-query-editor ${workbook ? 'dw-query-editor-monaco' : ''}`}><label htmlFor={workbook ? undefined : 'siem-query-input'}>Investigation query</label>{workbook ? <Suspense fallback={<p>Opening the local query editor…</p>}><InvestigationEditor ref={editor} value={query} onChange={setQuery} onRun={() => document.getElementById('dw-query-run')?.click()} /></Suspense> : <textarea id="siem-query-input" value={query} onChange={event => setQuery(event.target.value)} rows={3} spellCheck={false} placeholder={sample} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); } }}/>}<div><button id="dw-query-run" type="button" onClick={run}>{busy ? 'Cancel query' : 'Run query'}</button><span>{QUERY_LANGUAGES[tool]?.name} · {workbook ? 'Shift + Enter runs the active block or selection' : 'Ctrl / ⌘ + Enter'} · Offline subset</span></div></div>
    {result?.error && <div className="dw-query-error" role="alert">{result.error}</div>}
    <div className="dw-query-results">{!result ? <div className="dw-query-empty"><h3>Begin with the dataset, not the answer.</h3><p>Run <code>*</code> to inspect source events, or start with a source table. Field names appear in each event. Use the reference above when you need syntax help.</p></div> : !result.error && <><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}{!result.aggregated && <th>Source event</th>}</tr></thead><tbody>{rows.slice(page * 50, (page + 1) * 50).map((row, offset) => { const index = page * 50 + offset; return <tr key={index}>{columns.map(column => <td key={column}>{String(row[column] ?? '—')}</td>)}{!result.aggregated && <td>{typeof row._raw === 'string' ? <><button type="button" className="dw-query-inspect" aria-expanded={expanded === index} onClick={() => inspect(index)}>Inspect event</button></> : <span>Run the filter without projection to inspect raw events.</span>}</td>}</tr>; })}</tbody></table>{!rows.length && <p className="dw-query-empty">No events matched. Check the table, field names, time range and filter.</p>}</>}</div>
    {expanded !== null && rows[expanded] && <aside className="dw-query-detail" aria-label="Event details"><header><strong>Row {expanded + 1}</strong><button type="button" onClick={() => setExpanded(null)}>Close</button></header><pre>{JSON.stringify(Object.fromEntries(Object.entries(rows[expanded]).filter(([key]) => key !== '_raw')), null, 2)}</pre>{!workbook && typeof rows[expanded]._raw === 'string' && extractFlag(rows[expanded]._raw) && <button type="button" onClick={() => onFlagCaptured(extractFlag(rows[expanded]._raw as string)!)}>Record this proof</button>}</aside>}
    <footer><span role="status">{result && !result.error ? rows.length.toLocaleString() + (result.aggregated ? ' calculated rows' : ' result rows') : 'Ready'}{saveError ? ' · Draft could not be saved' : ''} · {duration.toFixed(1)} ms · {scenario.entries.length.toLocaleString()} source events</span><div><button type="button" disabled={page === 0} onClick={() => { setPage(value => value - 1); setExpanded(null); }}>Previous</button><span>{page + 1} / {Math.max(1, Math.ceil(rows.length / 50))}</span><button type="button" disabled={(page + 1) * 50 >= rows.length} onClick={() => { setPage(value => value + 1); setExpanded(null); }}>Next</button></div></footer>
  </div>;
}
