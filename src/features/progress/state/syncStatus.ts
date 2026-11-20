import { useSyncExternalStore } from 'react';

type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'local';
let status: SyncStatus = 'idle';
const listeners = new Set<() => void>();
export function setSyncStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach(listener => listener());
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useSyncStatus() { return useSyncExternalStore(subscribe, () => status, () => 'idle' as SyncStatus); }
