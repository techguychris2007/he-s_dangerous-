import type { WebApplicationDef } from '../../labs/types';
import type { WebApplicationSnapshot } from '../../labs/webApplication';

interface Props {
  application: WebApplicationDef;
  snapshot?: WebApplicationSnapshot;
  onCommand: (command: string) => void;
  disabled: boolean;
}

export default function LiveWebsiteLab({ application: app, snapshot, onCommand, disabled }: Props) {
  const request = snapshot?.requests.at(-1);
  const ownRecord = app.records.find(record => record.tenant === app.tenant)!;
  const auth = `-H "Authorization: Bearer ${app.token}"`;
  const inspect = (path: string) => onCommand(`curl ${auth} http://${app.ip}${path}`);
  const record = request?.status === 200 && request.body.id ? request.body : null;
  const visible = record ?? ownRecord;
  const isOtherTenant = record && record.tenant !== app.tenant;

  return (
    <section aria-label="Interactive target website" className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--color-text-dim)]">Target website · isolated simulation</span>
        <code className="max-w-full truncate rounded-md bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]">http://{app.ip}{request?.path ?? '/'}</code>
      </div>
      <div className="bg-[#f5f6f8] text-[#263342]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce2e9] bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-[#193d49] text-sm font-black text-white">{app.name[0]}</span>
            <span className="text-sm font-bold tracking-tight">{app.name}</span>
          </div>
          <span className="rounded-full bg-[#eef2f5] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">Tenant {app.tenant} · {snapshot?.role ?? 'member'}</span>
        </header>
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#66778a]">Your workspace</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-bold tracking-tight">Good morning, Alex.</h2><p className="mt-1 text-xs text-[#66778a]">{app.tagline}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${snapshot?.repaired ? 'bg-[#d9f0e5] text-[#176743]' : 'bg-[#e9edf3] text-[#586779]'}`}>Concept lab</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Target application pages">
            {[['My record', `/api/records/${ownRecord.id}`], ['My profile', '/api/profile'], ['Admin audit', '/api/admin/audit'], ['API reference', '/api/docs']].map(([label, path]) => (
              <button key={path} type="button" disabled={disabled} onClick={() => inspect(path)} className="rounded-lg border border-[#d8e0e8] bg-white px-3 py-2 text-xs font-semibold text-[#344d60] transition hover:border-[#527680] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#193d49] disabled:opacity-50">{label}</button>
            ))}
          </div>
          <div className={`mt-4 rounded-xl border bg-white p-4 ${isOtherTenant ? 'border-[#d99961]' : 'border-[#dce2e9]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#66778a]">{app.kind === 'tenant-billing' ? 'Invoice detail' : 'Case detail'}</span><span className="font-mono text-xs text-[#66778a]">{String(visible.id)}</span></div>
            <div className="mt-3 flex flex-wrap justify-between gap-2"><div><h3 className="text-sm font-semibold">{String(visible.title)}</h3><p className="mt-1 text-xs text-[#66778a]">Record owner · Tenant {String(visible.tenant)}</p></div><strong className="text-lg font-semibold">{String(visible.amount)}</strong></div>
            {isOtherTenant && <p className="mt-3 border-t border-[#ead3bd] pt-3 text-xs font-medium text-[#915020]">Cross-tenant exposure confirmed by the last HTTP response.</p>}
          </div>
          {request && <div className="mt-4 rounded-lg border border-[#dce2e9] bg-white p-3" aria-live="polite">
            <div className="flex items-center gap-2 text-xs"><span className={`rounded px-1.5 py-0.5 font-bold ${request.status >= 400 ? 'bg-[#f9e5e4] text-[#a33232]' : 'bg-[#dff1e8] text-[#176743]'}`}>{request.status}</span><span className="min-w-0 truncate font-mono">{request.method} {request.path}</span></div>
            {request.body.error ? <p className="mt-2 text-xs text-[#a33232]">{String(request.body.error)}</p> : request.body.audit ? <p className="mt-2 text-xs font-medium text-[#344d60]">{String(request.body.audit)} · {String(request.body.impact)}</p> : <p className="mt-2 text-xs text-[#66778a]">The response below is from the same engine as the terminal.</p>}
            <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-[#344d60]">Inspect response</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-[#eef2f5] p-3 text-[11px] leading-relaxed text-[#344d60]">{JSON.stringify(request.body, null, 2)}</pre></details>
          </div>}
        </div>
      </div>
      <footer className="border-t border-[var(--color-border)] px-4 py-3 text-xs leading-relaxed text-[var(--color-text-dim)]">
        Use <code className="text-[var(--color-accent-2)]">curl</code> in the terminal to change methods, headers and fields. Page buttons issue the same requests and appear in your transcript. The inspector never executes returned HTML or scripts.
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wider"><span>{snapshot?.requests.length ?? 0} recent requests</span><span>{snapshot?.evidence.length ?? 0}/3 concept proofs</span></div>
      </footer>
    </section>
  );
}
