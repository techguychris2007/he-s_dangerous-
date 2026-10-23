import type { SiemEntry } from './siemTypes';

/** Evaluate the common host/port/protocol subset of BPF against the captured packet summary. */
export function packetFilter(expression: string): (entry: SiemEntry) => boolean {
  const tokens = expression.match(/\(|\)|[^\s()]+/g) ?? [];
  let index = 0;
  const pop = () => { const value = tokens[index++]; if (!value) throw new Error('Incomplete packet filter.'); return value.toLowerCase(); };
  const peek = () => tokens[index]?.toLowerCase();
  function atom(): (entry: SiemEntry) => boolean {
    let token = pop();
    if (token === '(') { const child = or(); if (pop() !== ')') throw new Error('Close the packet filter group.'); return child; }
    if (token === 'not' || token === '!') { const child = atom(); return entry => !child(entry); }
    let direction = '';
    if (token === 'src' || token === 'dst') { direction = token; token = pop(); }
    if (token === 'host' || token === 'port') {
      const expected = pop();
      if (token === 'port' && (!/^\d+$/.test(expected) || Number(expected) > 65535)) throw new Error('Use a port number from 0 to 65535.');
      if (token === 'host' && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(expected)) throw new Error('Use a numeric IPv4 address in an offline host filter.');
      return entry => {
        const match = entry.line.match(/\bIP\s+([\d.]+)\s*>\s*([\d.]+):/);
        const parse = (text: string | undefined) => { const parts = (text ?? '').split('.'); return { ip: parts.slice(0, 4).join('.'), port: parts[4] }; };
        const source = parse(match?.[1]), dest = parse(match?.[2]);
        const values = direction === 'src' ? [source] : direction === 'dst' ? [dest] : [source, dest];
        return values.some(value => (token === 'host' ? value.ip : value.port) === expected);
      };
    }
    if (direction) throw new Error('Follow src or dst with host or port.');
    if (token === 'tcp') return entry => /Flags\s*\[|\bTCP\b/i.test(entry.line);
    if (token === 'udp') return entry => /\bUDP\b|\b[AS]\?\s|\.53:/i.test(entry.line) && !/Flags\s*\[/i.test(entry.line);
    if (token === 'icmp') return entry => /\bICMP\b/i.test(entry.line);
    if (token === 'ip') return entry => /\bIP\s/i.test(entry.line);
    throw new Error('Supported packet filters: tcp, udp, icmp, ip, [src|dst] host ADDRESS, [src|dst] port NUMBER, and/or/not with parentheses.');
  }
  function and(): (entry: SiemEntry) => boolean { let left = atom(); while (index < tokens.length && !['or', ')', '||'].includes(peek()!)) { if (['and', '&&'].includes(peek()!)) pop(); const previous = left, right = atom(); left = entry => previous(entry) && right(entry); } return left; }
  function or(): (entry: SiemEntry) => boolean { let left = and(); while (peek() === 'or' || peek() === '||') { pop(); const previous = left, right = and(); left = entry => previous(entry) || right(entry); } return left; }
  const test = or(); if (index !== tokens.length) throw new Error('Unexpected packet filter token.'); return test;
}
