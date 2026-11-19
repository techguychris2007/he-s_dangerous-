import { executeSiemQuery } from './siemExecution';
import type { SiemEntry, SiemTool } from './siemTypes';
let entries: SiemEntry[] = [];
self.onmessage = (event: MessageEvent<{ kind: 'load'; entries: SiemEntry[] } | { kind: 'run'; id: number; query: string; tool: SiemTool }>) => {
  const message = event.data;
  if (message.kind === 'load') { entries = message.entries; return; }
  const start = performance.now();
  const result = executeSiemQuery(entries, message.query, message.tool);
  self.postMessage({ id: message.id, result, duration: performance.now() - start });
};
