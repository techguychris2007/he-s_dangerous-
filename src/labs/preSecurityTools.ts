/** Small, explicit teaching models. These do not run the named desktop applications. */
export type TrainingTool = 'wireshark' | 'burp' | 'autopsy';
export interface TrainingPacket { id: number; time: string; source: string; destination: string; protocol: string; info: string; stream?: number; detail: string }
export const trainingPackets: TrainingPacket[] = [
  { id: 1, time: '09:00:00.000', source: '10.10.10.5', destination: '10.10.10.1', protocol: 'DNS', info: 'Query A portal.lab', detail: 'Transaction 0x1201; query name portal.lab; type A (IPv4 address).' },
  { id: 2, time: '09:00:00.012', source: '10.10.10.1', destination: '10.10.10.5', protocol: 'DNS', info: 'Answer portal.lab A 10.10.10.20', detail: 'Transaction 0x1201; response; address 10.10.10.20; TTL 60 seconds.' },
  { id: 3, time: '09:00:00.020', source: '10.10.10.5', destination: '10.10.10.20', protocol: 'TCP', info: '51000 -> 80 [SYN]', stream: 0, detail: 'Client ephemeral port 51000; server port 80; SYN begins a connection.' },
  { id: 4, time: '09:00:00.025', source: '10.10.10.20', destination: '10.10.10.5', protocol: 'TCP', info: '80 -> 51000 [SYN, ACK]', stream: 0, detail: 'Server acknowledges the client SYN and sends its own SYN.' },
  { id: 5, time: '09:00:00.026', source: '10.10.10.5', destination: '10.10.10.20', protocol: 'TCP', info: '51000 -> 80 [ACK]', stream: 0, detail: 'Third handshake packet; the connection is established.' },
  { id: 6, time: '09:00:00.030', source: '10.10.10.5', destination: '10.10.10.20', protocol: 'HTTP', info: 'GET /health HTTP/1.1', stream: 0, detail: 'GET /health HTTP/1.1\r\nHost: portal.lab\r\n\r\n' },
  { id: 7, time: '09:00:00.035', source: '10.10.10.20', destination: '10.10.10.5', protocol: 'HTTP', info: 'HTTP/1.1 200 OK', stream: 0, detail: 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"status":"ready","case":"DW-101"}' },
  { id: 8, time: '09:00:01.000', source: '10.10.10.5', destination: '10.10.10.30', protocol: 'TLS', info: 'Application Data (encrypted)', stream: 1, detail: 'TCP destination port 443. Application data is encrypted; this fixture supplies no decryption keys.' },
];
export function filterTrainingPackets(filter: string): TrainingPacket[] {
  const q = filter.trim().toLowerCase();
  if (!q) return trainingPackets;
  if (['dns', 'http', 'tls'].includes(q)) return trainingPackets.filter(p => p.protocol.toLowerCase() === q);
  if (q === 'tcp') return trainingPackets.filter(p => p.stream !== undefined);
  const address = q.match(/^ip\.addr\s*==\s*(\d+\.\d+\.\d+\.\d+)$/);
  if (address) return trainingPackets.filter(p => p.source === address[1] || p.destination === address[1]);
  const stream = q.match(/^tcp\.stream\s*==\s*(\d+)$/);
  if (stream) return trainingPackets.filter(p => p.stream === Number(stream[1]));
  throw new Error('Supported display filters: dns, http, tcp, tls, ip.addr == 10.10.10.20, tcp.stream == 0. Capture-filter syntax is different.');
}
export const initialTrainingRequest = 'GET /api/profile/alex HTTP/1.1\nHost: portal.lab\nCookie: session=learner-alex\n\n';
export function sendTrainingRequest(raw: string): { status: number; body: string; checkpoint?: string } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const request = lines[0].match(/^(GET) (\/\S*) HTTP\/1\.1$/);
  if (!request) return { status: 400, body: 'Use GET /api/profile/alex HTTP/1.1. This teaching model supports GET only.' };
  const headers = lines.slice(1, lines.indexOf('') < 0 ? undefined : lines.indexOf(''));
  if (!headers.some(h => /^host:\s*portal\.lab\s*$/i.test(h))) return { status: 400, body: 'Host must be portal.lab. Only this synthetic target is in scope.' };
  if (!['/api/profile/alex', '/api/profile/sam'].includes(request[2])) return { status: 404, body: 'Resource not found. Check the path before drawing conclusions about permissions.' };
  if (!headers.some(h => /^cookie:\s*session=learner-alex\s*$/i.test(h))) return { status: 401, body: 'Authentication required. The session cookie is missing or invalid.', checkpoint: 'session' };
  if (request[2].endsWith('/sam')) return { status: 403, body: 'Access denied: authenticated user alex cannot read sam’s profile.', checkpoint: 'boundary' };
  return { status: 200, body: '{"user":"alex","course":"Pre-security","case":"DW-101"}', checkpoint: 'baseline' };
}
export const trainingArtifacts = [
  { id: 'F-01', path: '/Users/alex/Documents/notes.txt', time: '2026-01-15 09:02:00 UTC', state: 'Allocated', content: 'Case DW-101. Training portal health check completed. Reference: BLUE-LANTERN. No password is stored here.' },
  { id: 'F-02', path: '/Users/alex/Downloads/receipt.txt', time: '2026-01-15 09:05:00 UTC', state: 'Deleted entry; content available in fixture', content: 'Synthetic purchase receipt: notebook, quantity 1. Deletion does not establish malicious intent.' },
  { id: 'F-03', path: '/Users/alex/Documents/meeting.txt', time: '2026-01-15 08:45:00 UTC', state: 'Allocated', content: 'Meet the training team at 10:00 UTC. Agenda: packet capture and HTTP practice.' },
];
export interface ToolTrainingState { completed: string[]; ingested: boolean; baseline: boolean; events: string[] }
export const newToolTrainingState = (): ToolTrainingState => ({ completed: [], ingested: false, baseline: false, events: [] });
export type ToolTrainingAction =
  | { type: 'packet'; filter: string; packetId: number }
  | { type: 'stream'; packetId: number }
  | { type: 'request'; raw: string }
  | { type: 'ingest'; caseName: string }
  | { type: 'search'; keyword: string }
  | { type: 'tag'; artifactId: string; interpretation: string };
export function applyToolTraining(state: ToolTrainingState, action: ToolTrainingAction): { state: ToolTrainingState; message: string; checkpoint?: string } {
  let checkpoint: string | undefined;
  let message = '';
  const next = { ...state, completed: [...state.completed], events: [...state.events] };
  if (action.type === 'packet') {
    try {
      const rows = filterTrainingPackets(action.filter);
      const packet = rows.find(p => p.id === action.packetId);
      if (!packet) return { state, message: 'Select a packet from the applied filter results.' };
      message = `Frame ${packet.id}: ${packet.detail}`;
      if (action.filter.trim().toLowerCase() === 'dns' && packet.id === 2) checkpoint = 'wireshark-dns';
      if (action.filter.trim().toLowerCase() === 'http' && packet.id === 6 && state.completed.includes('wireshark-dns')) checkpoint = 'wireshark-http';
    } catch (error) { return { state, message: (error as Error).message }; }
  } else if (action.type === 'stream') {
    const packet = trainingPackets.find(p => p.id === action.packetId);
    if (packet?.stream !== 0) return { state, message: 'Select a packet from TCP stream 0. TLS payloads cannot be read without decryption material.' };
    message = trainingPackets.filter(p => p.stream === 0 && p.protocol === 'HTTP').map(p => p.detail).join('\n\n');
    if (state.completed.includes('wireshark-http')) checkpoint = 'wireshark-stream';
  } else if (action.type === 'request') {
    const response = sendTrainingRequest(action.raw);
    message = `HTTP ${response.status}\n${response.body}`;
    if (response.checkpoint === 'baseline') { next.baseline = true; checkpoint = 'burp-baseline'; }
    if (next.baseline && response.checkpoint === 'boundary') checkpoint = 'burp-boundary';
    if (state.completed.includes('burp-boundary') && response.checkpoint === 'session') checkpoint = 'burp-session';
  } else if (action.type === 'ingest') {
    if (!action.caseName.trim()) return { state, message: 'Name the case before adding its data source.' };
    next.ingested = true; checkpoint = 'autopsy-ingest';
    message = `Case ${action.caseName.trim()}: training-laptop.json loaded read-only; 3 synthetic artifacts indexed. This fixture is not a disk image.`;
  } else if (action.type === 'search') {
    if (!state.ingested) return { state, message: 'Create the case and ingest the supplied fixture first.' };
    const query = action.keyword.trim().toLowerCase();
    if (!query) return { state, message: 'Enter a keyword, such as BLUE-LANTERN.' };
    const matches = trainingArtifacts.filter(a => a.content.toLowerCase().includes(query));
    message = matches.length ? matches.map(a => `${a.id} ${a.path}\n${a.content}`).join('\n') : 'No keyword hits. Check spelling; no hits do not prove absence from unparsed or encrypted data.';
    if (query === 'blue-lantern' && matches.length === 1) checkpoint = 'autopsy-search';
  } else {
    if (!state.completed.includes('autopsy-search')) return { state, message: 'Find the case keyword before tagging evidence.' };
    if (action.artifactId !== 'F-01' || action.interpretation !== 'reference-only') return { state, message: 'Identify the keyword-bearing file and make a claim supported by its text. A reference note does not prove who accessed the portal.' };
    checkpoint = 'autopsy-tag'; message = 'Tagged F-01: case reference found in notes.txt; author and portal access are not established by this artifact alone.';
  }
  if (checkpoint && !next.completed.includes(checkpoint)) next.completed.push(checkpoint);
  next.events.push(`${action.type}: ${message}`);
  return { state: next, message, checkpoint };
}
