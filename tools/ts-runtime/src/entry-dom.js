// Grading-iframe kit: React 19 (development build, so act() and helpful warnings work), react-dom,
// the Vitest subset and the Testing Library subset. Inlined into the sandboxed srcdoc frame by
// src/lib/reactRunner.ts — the frame is opaque-origin and cannot fetch anything itself.
import * as React from 'react';
import * as JsxRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as vitest from './testkit.js';
import * as testing from './dom-testing.js';
import * as router from './router.js';

const esm = (ns, extra) => Object.assign({ __esModule: true }, ns, extra);

globalThis.__dw_modules__ = Object.assign(globalThis.__dw_modules__ || {}, {
  react: esm(React, { default: React }),
  'react/jsx-runtime': JsxRuntime,
  'react/jsx-dev-runtime': JsxRuntime,
  'react-dom': esm(ReactDOM, { default: ReactDOM }),
  'react-dom/client': esm(ReactDOMClient, { default: ReactDOMClient }),
  vitest,
  'react-router': esm(router),
  'react-router-dom': esm(router),
  '@testing-library/react': esm({
    render: testing.render, screen: testing.screen, within: testing.within, waitFor: testing.waitFor,
    waitForElementToBeRemoved: testing.waitForElementToBeRemoved, cleanup: testing.cleanup, act: testing.act, fireEvent: testing.fireEvent,
  }),
  '@testing-library/user-event': esm({ userEvent: testing.userEvent, default: testing.userEvent }),
});
globalThis.__dw_runTests = vitest.runRegisteredTests;
