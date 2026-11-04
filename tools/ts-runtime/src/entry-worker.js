// Worker-side test kit: Vitest subset only (no DOM). Loaded by src/lib/tsWorker.ts.
import * as vitest from './testkit.js';

globalThis.__dw_modules__ = Object.assign(globalThis.__dw_modules__ || {}, { vitest });
globalThis.__dw_runTests = vitest.runRegisteredTests;
