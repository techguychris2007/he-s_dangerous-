import type { Plugin } from 'vite';

/** See scripts/vite-paid-content.mjs. */
export default function paidContentPlugin(options: { root: string; enabled: boolean }): Plugin;

export function stripPaidLessons(code: string, file: string, paidIds: Set<string>, options: { removeKeyed: boolean }): string | undefined;
