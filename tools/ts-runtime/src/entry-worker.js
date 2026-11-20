// Worker-side test kit: Vitest subset only (no DOM). Loaded by src/features/code-practice/runtimes/tsWorker.ts.
import * as vitest from './testkit.js';
import * as devops from './devops.js';

globalThis.__dw_modules__ = Object.assign(globalThis.__dw_modules__ || {}, { vitest, 'dw:project': devops });
globalThis.__dw_runTests = vitest.runRegisteredTests;
