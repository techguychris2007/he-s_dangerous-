import type { WebApplicationDef } from './types';

export interface WebRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  params: Record<string, string>;
}

export interface WebResponse {
  sequence: number;
  method: string;
  path: string;
  status: number;
  body: Record<string, unknown>;
}

export interface WebApplicationSnapshot {
  role: 'member' | 'admin';
  repaired: boolean;
  requests: WebResponse[];
  evidence: string[];
  verifiedChecks: string[];
}

/** A deliberately bounded HTTP application, not an HTML renderer or network proxy. */
export class WebApplicationEngine {
  private role: 'member' | 'admin' = 'member';
  private repaired = false;
  private requests: WebResponse[] = [];
  private sequence = 0;
  private evidence = new Set<string>();
  private checks = new Set<string>();

  private definition: WebApplicationDef;
  constructor(definition: WebApplicationDef) { this.definition = definition; }

  snapshot(): WebApplicationSnapshot {
    return structuredClone({ role: this.role, repaired: this.repaired, requests: this.requests,
      evidence: [...this.evidence], verifiedChecks: [...this.checks] });
  }

  request(request: WebRequest, onFlag: (flag: string) => void): WebResponse {
    const { method, path, headers, params } = request;
    const app = this.definition;
    const reply = (status: number, body: Record<string, unknown>): WebResponse => {
      const response = { sequence: ++this.sequence, method, path, status, body };
      this.requests = [...this.requests.slice(-11), response];
      return response;
    };
    const proof = (flag: string) => { this.evidence.add(flag); onFlag(flag); return flag; };
    if (path === '/' && method === 'GET') return reply(200, { application: app.name, message: app.tagline, documentation: '/api/docs' });
    if (path === '/api/docs' && method === 'GET') return reply(200, { principal: app.principal, tenant: app.tenant,
      endpoints: app.kind === 'tenant-billing'
        ? ['GET /api/records/:id', 'GET /api/profile', 'PATCH /api/profile (displayName)', 'GET /api/admin/audit']
        : ['GET /api/records/:id', 'GET /api/profile', 'POST /api/admin/approve (ticket=change-101)', 'GET /api/admin/audit'],
      testRecords: app.records.map(record => ({ id: record.id, owner: record.tenant })),
      authentication: 'Authorization: Bearer <provided test token>',
      boundary: app.kind === 'support-desk' ? 'The proxy should establish X-Verified-Role. The origin is reachable in this lab.' : 'Tenant ownership and role changes must be authorized server-side.' });
    if (headers.authorization !== `Bearer ${app.token}`) return reply(401, { error: 'A valid supplied test token is required.' });
    if (path === '/api/profile' && method === 'GET') return reply(200, { principal: app.principal, tenant: app.tenant, role: this.role });
    if (path.startsWith('/api/records/')) {
      if (method !== 'GET') return reply(405, { error: 'Only GET is supported for records.' });
      const record = app.records.find(item => item.id === path.slice('/api/records/'.length));
      if (!record) return reply(404, { error: 'No synthetic record with this identifier.' });
      if (record.tenant !== app.tenant) {
        if (this.repaired) { this.checks.add('cross-tenant-denied'); return reply(403, { error: 'Record owner differs from the authenticated tenant.' }); }
        return reply(200, { ...record, warning: 'Another tenant record was disclosed.', proof: proof(app.flags.disclosure) });
      }
      if (this.repaired) this.checks.add('own-record-allowed');
      return reply(200, { ...record });
    }
    const roleChange = app.kind === 'tenant-billing' && path === '/api/profile' && method === 'PATCH';
    const proxyChange = app.kind === 'support-desk' && path === '/api/admin/approve' && method === 'POST';
    if (roleChange || proxyChange) {
      const attemptedEscalation = roleChange ? params.role === 'admin' : headers['x-verified-role'] === 'operator' && params.ticket === 'change-101';
      if (attemptedEscalation && this.repaired) {
        this.checks.add('role-change-denied');
        return reply(403, { error: 'The server rejected a caller-controlled privilege claim.' });
      }
      if (attemptedEscalation) {
        this.role = 'admin';
        return reply(200, { principal: app.principal, role: this.role, approvedChange: proxyChange ? 'change-101' : undefined,
          proof: proof(app.flags.escalation) });
      }
      if (proxyChange) return reply(403, { error: 'A verified operator is required to approve this change.' });
      return reply(200, { displayName: params.displayName ?? app.principal, role: this.role });
    }
    if (path === '/api/admin/audit' && method === 'GET') {
      if (this.role !== 'admin') {
        if (this.repaired) this.checks.add('admin-read-denied');
        return reply(403, { error: 'Administrator permission required.' });
      }
      return reply(200, { audit: 'Synthetic organization-wide audit report', impact: 'The member account can now read privileged audit records.', proof: proof(app.flags.impact) });
    }
    if (['/api/profile', '/api/admin/approve', '/api/admin/audit'].includes(path)) return reply(405, { error: 'Method not allowed for this endpoint.' });
    return reply(404, { error: 'Endpoint not found.' });
  }

  control(action: string, onFlag: (flag: string) => void): { ok: boolean; text: string } {
    void onFlag;
    if (action === 'status') return { ok: true, text: `Application: ${this.definition.name}
Identity role: ${this.role}
Observed concept proofs: ${this.evidence.size}
Verified concept checks: ${[...this.checks].join(', ') || 'none'}
Use curl requests from the lab guide to capture the required evidence.` };
    if (action === 'remediate' || action === 'retest') {
      return { ok: false, text: 'This is a concept lab. Capture the HTTP evidence that proves the boundary behavior; repair and retest workflows are saved for later professional-methodology training.' };
    }
    return { ok: false, text: 'Concept application control: webapp status. HTTP requests use curl.' };
  }
}
