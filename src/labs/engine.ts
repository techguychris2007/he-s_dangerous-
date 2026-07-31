import { getNode, pathToString, resolvePath, type FsNode } from './vfs';
import type { HostDef, LabScenario, AwsAccountDef, AwsCredential } from './types';

export type LineKind = 'input' | 'output' | 'error' | 'success' | 'system' | 'muted';

export interface OutLine {
  kind: LineKind;
  text: string;
}

interface Session {
  isAttacker: boolean;
  host?: HostDef;
  user: string;
  cwd: string[];
  isRoot: boolean;
}

const FLAG_RE = /flag\{[^}]+\}/i;

function homeOf(session: Session): string[] {
  const user = session.isRoot ? 'root' : session.user;
  return user === 'root' ? ['root'] : ['home', session.user];
}

/** Every real command name this engine recognizes — the single source of truth for both the
 *  dispatch switch below and tab-completion, so the two can never silently drift out of sync. */
const KNOWN_COMMANDS = [
  'help', 'pwd', 'ls', 'cd', 'cat', 'strings', 'file', 'checksec', 'objdump', 'gdb', 'yara',
  'hashcat', 'echo', 'find', 'grep', 'whoami', 'id', 'ifconfig', 'ip', 'netstat', 'ping', 'nmap',
  'curl', 'wget', 'ftp', 'ftp-get', 'ssh', 'hydra', 'crackmapexec', 'cme', 'netexec', 'exploit',
  'secretsdump', 'dig', 'nslookup', 'gobuster', 'ffuf', 'dirsearch', 'nikto', 'whatweb', 'sqlmap',
  'john', 'cewl', 'enum4linux', 'smbclient', 'masscan', 'rustscan', 'nc', 'netcat', 'sudo', 'su',
  'exit', 'logout', 'clear', 'objectives', 'hint', 'chmod', 'history', 'export', 'aws',
];

/** Simulated per-command latency, roughly proportional to how long the real tool actually takes
 *  against a single host — a quick lookup (`cat`, `whoami`, `ls`) is instant, a real network scan
 *  or offline crack is not. Read by the UI layer before revealing a command's output. */
export const COMMAND_LATENCY_MS: Record<string, number> = {
  nmap: 900,
  masscan: 350,
  rustscan: 300,
  hydra: 850,
  gobuster: 800,
  ffuf: 750,
  dirsearch: 800,
  nikto: 700,
  whatweb: 400,
  sqlmap: 900,
  hashcat: 650,
  john: 650,
  enum4linux: 600,
  smbclient: 400,
  crackmapexec: 500,
  cme: 500,
  netexec: 500,
  secretsdump: 550,
  exploit: 750,
  cewl: 500,
  ping: 250,
};

export class TerminalEngine {
  private scenario: LabScenario;
  private attackerRoot: FsNode;
  private stack: Session[];
  private hintIndex = 0;
  private commandHistory: string[] = [];
  /** `export KEY=VALUE` writes here — lives for the whole engine instance (one shell process),
   *  not per ssh session, matching how a real exported env var survives sshing elsewhere. */
  private sessionEnv: Record<string, string> = {};
  private awaitingAuth: { ip: string; user: string; host: HostDef } | null = null;

  constructor(scenario: LabScenario) {
    this.scenario = scenario;
    this.attackerRoot = scenario.attacker.root;
    const base: Session = {
      isAttacker: true,
      user: scenario.attacker.user,
      cwd: scenario.attacker.user === 'root' ? ['root'] : ['home', scenario.attacker.user],
      isRoot: scenario.attacker.user === 'root',
    };
    (base as any).__attackerRoot = this.attackerRoot;
    this.stack = [base];
    this.sessionEnv = { ...(scenario.attacker.env ?? {}) };
  }

  private get session(): Session {
    return this.stack[this.stack.length - 1];
  }

  private fsRoot(): FsNode {
    const s = this.session;
    return s.isAttacker ? this.attackerRoot : (s.host as HostDef).root;
  }

  private effectiveUser(): string {
    const s = this.session;
    return s.isRoot ? 'root' : s.user;
  }

  /** Real Linux: /root is mode 0700, owned by root — no other account can read, list, or traverse
   *  into it, full stop, regardless of what's inside. Every "read the flag before you've actually
   *  escalated" shortcut this engine needs to reject funnels through this one check. Only applies on
   *  remote target hosts — the attacker's own /root is genuinely their own home directory. */
  private isUnderRootDenied(path: string[]): boolean {
    const s = this.session;
    return !s.isAttacker && path[0] === 'root' && this.effectiveUser() !== 'root';
  }

  getPrompt(): string {
    if (this.awaitingAuth) return `Password for ${this.awaitingAuth.user}@${this.awaitingAuth.ip}:`;
    const s = this.session;
    const host = s.isAttacker ? this.scenario.attacker.hostname : (s.host as HostDef).hostname;
    const marker = this.effectiveUser() === 'root' ? '#' : '$';
    return `${this.effectiveUser()}@${host}:${pathToString(s.cwd)}${marker}`;
  }

  isAwaitingPassword(): boolean {
    return this.awaitingAuth !== null;
  }

  private findHostByIp(ip: string): HostDef | undefined {
    return this.scenario.network.find((h) => h.ip === ip);
  }

  private resolveInSession(input: string): string[] {
    const s = this.session;
    return resolvePath(s.cwd, input, homeOf(s));
  }

  private ls(args: string[]): OutLine[] {
    const long = args.includes('-la') || args.includes('-l') || args.includes('-al');
    const positional = args.filter((a) => !a.startsWith('-'));
    const target = positional[0] ? this.resolveInSession(positional[0]) : this.session.cwd;
    if (this.isUnderRootDenied(target)) return [{ kind: 'error', text: `ls: cannot open directory '${positional[0] ?? '.'}': Permission denied` }];
    const node = getNode(this.fsRoot(), target);
    if (!node) return [{ kind: 'error', text: `ls: cannot access '${positional[0] ?? '.'}': No such file or directory` }];
    if (node.type === 'file') return [{ kind: 'output', text: positional[0] ?? '' }];
    const names = Object.keys(node.children);
    if (names.length === 0) return [];
    if (!long) {
      return [{ kind: 'output', text: names.join('  ') }];
    }
    const lines: OutLine[] = names.map((name) => {
      const child = node.children[name];
      const isDir = child.type === 'dir';
      const perms = child.mode ?? (isDir ? 'drwxr-xr-x' : '-rw-r--r--');
      const size = child.type === 'file' ? child.content.length : 4096;
      return {
        kind: 'output',
        text: `${perms} 1 ${this.effectiveUser()} ${this.effectiveUser()} ${String(size).padStart(6)} ${name}${isDir ? '/' : ''}`,
      };
    });
    return lines;
  }

  private cd(args: string[]): OutLine[] {
    const target = args[0] ?? '~';
    const resolved = this.resolveInSession(target);
    if (this.isUnderRootDenied(resolved)) return [{ kind: 'error', text: `bash: cd: ${target}: Permission denied` }];
    const node = getNode(this.fsRoot(), resolved);
    if (!node) return [{ kind: 'error', text: `bash: cd: ${target}: No such file or directory` }];
    if (node.type !== 'dir') return [{ kind: 'error', text: `bash: cd: ${target}: Not a directory` }];
    this.session.cwd = resolved;
    return [];
  }

  private cat(args: string[], onFlag: (flag: string) => void): OutLine[] {
    if (args.length === 0) return [{ kind: 'error', text: 'cat: missing operand' }];
    const out: OutLine[] = [];
    for (const arg of args) {
      const resolved = this.resolveInSession(arg);
      if (this.isUnderRootDenied(resolved)) {
        out.push({ kind: 'error', text: `cat: ${arg}: Permission denied` });
        continue;
      }
      const node = getNode(this.fsRoot(), resolved);
      if (!node) {
        out.push({ kind: 'error', text: `cat: ${arg}: No such file or directory` });
        continue;
      }
      if (node.type === 'dir') {
        out.push({ kind: 'error', text: `cat: ${arg}: Is a directory` });
        continue;
      }
      node.content.split('\n').forEach((l) => out.push({ kind: 'output', text: l }));
      const match = node.content.match(FLAG_RE);
      if (match) onFlag(match[0]);
    }
    return out;
  }

  /** Simulated `strings` — our "binaries" are stored pre-extracted as text, so this surfaces that content. */
  private strings(args: string[], onFlag: (flag: string) => void): OutLine[] {
    if (args.length === 0) return [{ kind: 'error', text: 'strings: missing operand' }];
    const resolved = this.resolveInSession(args[0]);
    if (this.isUnderRootDenied(resolved)) return [{ kind: 'error', text: `strings: ${args[0]}: Permission denied` }];
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') return [{ kind: 'error', text: `strings: ${args[0]}: No such file or directory` }];
    const lines = node.content.split('\n').filter((l) => !l.startsWith('#FILETYPE:') && !l.startsWith('#CRACKME_'));
    const match = node.content.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return lines.map((l) => ({ kind: 'output' as const, text: l }));
  }

  /** Simulated `file` — reads a #FILETYPE: marker line lab authors embed, falling back to a generic guess. */
  private fileCmd(args: string[]): OutLine[] {
    if (args.length === 0) return [{ kind: 'error', text: 'file: missing operand' }];
    const resolved = this.resolveInSession(args[0]);
    const node = getNode(this.fsRoot(), resolved);
    if (!node) return [{ kind: 'error', text: `file: ${args[0]}: No such file or directory` }];
    if (node.type === 'dir') return [{ kind: 'output', text: `${args[0]}: directory` }];
    const marker = node.content.split('\n').find((l) => l.startsWith('#FILETYPE:'));
    const desc = marker ? marker.replace('#FILETYPE:', '').trim() : 'ASCII text';
    return [{ kind: 'output', text: `${args[0]}: ${desc}` }];
  }

  /** Local "crackme" execution: `./binary <guess>` succeeds if the guess matches the password marker,
   *  or (for buffer-overflow-style labs) if its LENGTH reaches a minimum overflow threshold. */
  private tryRunCrackme(cmd: string, args: string[], onFlag: (flag: string) => void): OutLine[] | null {
    const cleaned = cmd.replace(/^\.\//, '');
    const resolved = this.resolveInSession(cleaned);
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') return null;
    const pwLine = node.content.split('\n').find((l) => l.startsWith('#CRACKME_PASSWORD:'));
    const minlenLine = node.content.split('\n').find((l) => l.startsWith('#CRACKME_MINLEN:'));
    if (!pwLine && !minlenLine) return null;
    const guess = args[0];
    if (guess === undefined) return [{ kind: 'error', text: `usage: ${cmd} <input>` }];

    let ok: boolean;
    if (pwLine) {
      ok = guess === pwLine.replace('#CRACKME_PASSWORD:', '').trim();
    } else {
      const minlen = Number(minlenLine!.replace('#CRACKME_MINLEN:', '').trim());
      ok = guess.length >= minlen;
    }
    if (!ok) {
      return [{ kind: 'error', text: pwLine ? 'Access denied: incorrect password.' : `Input accepted (${guess.length} bytes). No crash.` }];
    }
    const successLine = node.content.split('\n').find((l) => l.startsWith('#CRACKME_SUCCESS:'));
    const successText = successLine ? successLine.replace('#CRACKME_SUCCESS:', '').trim() : 'Access granted.';
    const match = successText.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return successText.split('\\n').map((l) => ({ kind: 'success' as const, text: l }));
  }

  /** Generic helper: pull a `#MARKER:` line out of a file's content and unescape its literal \n sequences. */
  private extractMarkerBlock(content: string, marker: string): string | null {
    const line = content.split('\n').find((l) => l.startsWith(marker));
    if (!line) return null;
    return line.replace(marker, '').trim();
  }

  private checksec(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const fileFlag = args.find((a) => a.startsWith('--file='));
    const target = fileFlag ? fileFlag.slice('--file='.length) : args.find((a) => !a.startsWith('-'));
    if (!target) return [{ kind: 'error', text: 'usage: checksec --file=<binary>' }];
    const resolved = this.resolveInSession(target);
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') return [{ kind: 'error', text: `checksec: ${target}: No such file or directory` }];
    const block = this.extractMarkerBlock(node.content, '#CHECKSEC:');
    if (!block) {
      return [{ kind: 'output', text: `RELRO           STACK CANARY      NX            PIE` }, { kind: 'output', text: `Full RELRO      Canary found      NX enabled    PIE enabled` }];
    }
    const match = block.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return block.split('\\n').map((l) => ({ kind: 'output' as const, text: l }));
  }

  private objdump(args: string[]): OutLine[] {
    const target = args.find((a) => !a.startsWith('-'));
    if (!target) return [{ kind: 'error', text: 'usage: objdump -d <binary>' }];
    const resolved = this.resolveInSession(target);
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') return [{ kind: 'error', text: `objdump: ${target}: No such file or directory` }];
    const block = this.extractMarkerBlock(node.content, '#OBJDUMP:');
    if (!block) return [{ kind: 'error', text: `objdump: ${target}: File format not recognized` }];
    return block.split('\\n').map((l) => ({ kind: 'output' as const, text: l }));
  }

  private gdb(args: string[]): OutLine[] {
    const target = args.find((a) => !a.startsWith('-'));
    if (!target) return [{ kind: 'error', text: 'usage: gdb <binary>' }];
    const resolved = this.resolveInSession(target);
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') return [{ kind: 'error', text: `gdb: ${target}: No such file or directory` }];
    const block = this.extractMarkerBlock(node.content, '#GDB_SESSION:');
    if (!block) return [{ kind: 'system', text: `GNU gdb (Ubuntu 12.1) — Reading symbols from ${target}...` }, { kind: 'muted', text: '(no debug info found)' }];
    return [
      { kind: 'system', text: `GNU gdb (Ubuntu 12.1) — Reading symbols from ${target}...` },
      ...block.split('\\n').map((l) => ({ kind: 'output' as const, text: l })),
    ];
  }

  private yara(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const positional = args.filter((a) => !a.startsWith('-'));
    const [ruleArg, targetArg] = positional;
    if (!ruleArg || !targetArg) return [{ kind: 'error', text: 'usage: yara <rulefile.yar> <target>' }];
    const ruleNode = getNode(this.fsRoot(), this.resolveInSession(ruleArg));
    if (!ruleNode) return [{ kind: 'error', text: `yara: can't open rule file ${ruleArg}` }];
    const targetNode = getNode(this.fsRoot(), this.resolveInSession(targetArg));
    if (!targetNode || targetNode.type !== 'file') return [{ kind: 'error', text: `yara: ${targetArg}: No such file or directory` }];
    const block = this.extractMarkerBlock(targetNode.content, '#YARA_MATCH:');
    if (!block) return [{ kind: 'muted', text: '(no matches)' }];
    const match = block.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return block.split('\\n').map((l) => ({ kind: 'success' as const, text: l }));
  }

  private hashcat(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const positional = args.filter((a) => !a.startsWith('-') && !/^\d+$/.test(a));
    const [hashArg, wordlistArg] = positional;
    if (!hashArg || !wordlistArg) return [{ kind: 'error', text: 'usage: hashcat -m <mode> <hashfile> <wordlist>' }];
    const hashNode = getNode(this.fsRoot(), this.resolveInSession(hashArg));
    if (!hashNode || hashNode.type !== 'file') return [{ kind: 'error', text: `hashcat: ${hashArg}: No such file or directory` }];
    const wordlistNode = getNode(this.fsRoot(), this.resolveInSession(wordlistArg));
    if (!wordlistNode || wordlistNode.type !== 'file') return [{ kind: 'error', text: `hashcat: ${wordlistArg}: No such file or directory` }];
    const hashValue = this.extractMarkerBlock(hashNode.content, '#HASHCAT_HASH:');
    const plaintext = this.extractMarkerBlock(hashNode.content, '#HASHCAT_PLAINTEXT:');
    const out: OutLine[] = [
      { kind: 'system', text: 'hashcat (v6.2.6) starting...' },
      { kind: 'muted', text: `Dictionary cache built: ${wordlistNode.content.split('\n').filter(Boolean).length} words` },
    ];
    if (!hashValue || !plaintext) {
      out.push({ kind: 'error', text: 'No hashes loaded.' });
      return out;
    }
    const words = wordlistNode.content.split('\n').map((w) => w.trim()).filter(Boolean);
    if (!words.includes(plaintext)) {
      out.push({ kind: 'error', text: `${hashValue}:?  Status...........: Exhausted (not found in this wordlist)` });
      return out;
    }
    out.push({ kind: 'success', text: `${hashValue}:${plaintext}` });
    out.push({ kind: 'success', text: 'Status...........: Cracked' });
    const flagMarker = this.extractMarkerBlock(hashNode.content, '#HASHCAT_FLAG:');
    if (flagMarker) out.push({ kind: 'success', text: flagMarker });
    const match = (flagMarker ?? '').match(FLAG_RE) ?? plaintext.match(FLAG_RE) ?? hashNode.content.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return out;
  }

  private find(args: string[]): OutLine[] {
    let startArg = args[0] && !args[0].startsWith('-') ? args[0] : '.';
    const nameIdx = args.indexOf('-name');
    const pattern = nameIdx >= 0 ? args[nameIdx + 1]?.replace(/^["']|["']$/g, '') : undefined;
    const wantsSuid = args.includes('-perm') && (args.includes('-4000') || args.includes('/4000') || args.includes('-4000,u+s'));
    const start = this.resolveInSession(startArg);
    const startNode = getNode(this.fsRoot(), start);
    if (!startNode) return [{ kind: 'error', text: `find: '${startArg}': No such file or directory` }];
    const regex = pattern ? new RegExp('^' + pattern.split('*').map(escapeRe).join('.*') + '$', 'i') : null;
    const results: string[] = [];
    const walk = (node: FsNode, path: string[]) => {
      // Real `find /` as a non-root user can't descend into /root (mode 0700) at all — the
      // directory itself is unreadable, so nothing under it is ever discoverable this way,
      // SUID-hunting included. (Learners conventionally pipe this through 2>/dev/null anyway,
      // which is exactly why this stays a silent skip rather than a printed error line.)
      if (this.isUnderRootDenied(path)) return;
      const name = path[path.length - 1] ?? '';
      const nameOk = !regex || regex.test(name);
      const suidOk = !wantsSuid || (node.type === 'file' && /^-rws/.test(node.mode ?? ''));
      if (nameOk && suidOk && (regex || wantsSuid)) results.push(pathToString(path));
      if (node.type === 'dir') {
        for (const [child_name, child] of Object.entries(node.children)) walk(child, [...path, child_name]);
      }
    };
    walk(startNode, start);
    return results.length
      ? results.map((r) => ({ kind: 'output' as const, text: r }))
      : [{ kind: 'muted', text: '(no matches)' }];
  }

  private grep(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const recursive = args.includes('-r') || args.includes('-R');
    const ignoreCase = args.includes('-i');
    const positional = args.filter((a) => !a.startsWith('-'));
    if (positional.length < 2) return [{ kind: 'error', text: 'usage: grep [-r] [-i] [-E] <pattern> <file|dir>' }];
    const [rawPattern, targetPath] = positional;
    const clean = rawPattern.replace(/^["']|["']$/g, '');
    // grep patterns in these labs are sometimes plain literal text and sometimes a real regex
    // (e.g. "any.*any.*any" or -E "[0-9]{3}-[0-9]{2}-[0-9]{4}") — compile as a regex when possible,
    // falling back to a literal substring check if the pattern isn't valid regex syntax.
    let regex: RegExp | null = null;
    try {
      regex = new RegExp(clean, ignoreCase ? 'i' : undefined);
    } catch {
      regex = null;
    }
    const needle = ignoreCase ? clean.toLowerCase() : clean;
    const matchesLine = (l: string) => (regex ? regex.test(l) : (ignoreCase ? l.toLowerCase() : l).includes(needle));
    // A flag surfaced by grep (the whole point of many "find the flag in this log" labs) still has
    // to be reported through onFlag — grep printing the line isn't enough on its own to capture it.
    const reportFlags = (text: string) => {
      const match = text.match(FLAG_RE);
      if (match) onFlag(match[0]);
    };
    const resolved = this.resolveInSession(targetPath);
    if (this.isUnderRootDenied(resolved)) return [{ kind: 'error', text: `grep: ${targetPath}: Permission denied` }];
    const node = getNode(this.fsRoot(), resolved);
    if (!node) return [{ kind: 'error', text: `grep: ${targetPath}: No such file or directory` }];

    if (node.type === 'dir') {
      if (!recursive) return [{ kind: 'error', text: `grep: ${targetPath}: Is a directory` }];
      const out: OutLine[] = [];
      const walk = (n: FsNode, path: string[]) => {
        if (this.isUnderRootDenied(path)) return;
        if (n.type === 'file') {
          n.content.split('\n').forEach((l) => {
            if (matchesLine(l)) {
              out.push({ kind: 'output', text: `${pathToString(path)}:${l}` });
              reportFlags(l);
            }
          });
        } else {
          for (const [name, child] of Object.entries(n.children)) walk(child, [...path, name]);
        }
      };
      walk(node, resolved);
      return out.length ? out : [];
    }

    const matches = node.content.split('\n').filter(matchesLine);
    matches.forEach(reportFlags);
    return matches.length
      ? matches.map((l) => ({ kind: 'output' as const, text: l }))
      : [];
  }

  private nmap(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const verbose = args.includes('-sV');
    const cidrArg = args.find((a) => /^\d+\.\d+\.\d+\.\d+\/\d{1,2}$/.test(a));
    if (cidrArg) return this.nmapSweep(cidrArg);
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!ip) return [{ kind: 'error', text: 'usage: nmap [-sV] [-p-] <ip>[/cidr]' }];
    const host = this.findHostByIp(ip);
    const out: OutLine[] = [];
    out.push({ kind: 'system', text: `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toUTCString()}` });
    if (!host) {
      out.push({ kind: 'error', text: `Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn` });
      out.push({ kind: 'error', text: `Nmap done: 1 IP address (0 hosts up) scanned` });
      return out;
    }
    out.push({ kind: 'output', text: `Nmap scan report for ${host.hostname} (${host.ip})` });
    out.push({ kind: 'output', text: `Host is up (0.0021s latency).` });
    out.push({ kind: 'output', text: verbose ? 'PORT     STATE SERVICE VERSION' : 'PORT     STATE SERVICE' });
    for (const svc of host.services) {
      const portStr = `${svc.port}/tcp`.padEnd(9);
      if (verbose) {
        out.push({ kind: 'output', text: `${portStr}open  ${svc.name.padEnd(7)} ${svc.version}` });
        // A handful of compliance/banner-identification labs embed the flag directly in the version
        // string itself, since the whole point of the exercise is spotting it via -sV fingerprinting.
        const match = svc.version.match(FLAG_RE);
        if (match) onFlag(match[0]);
      } else {
        out.push({ kind: 'output', text: `${portStr}open  ${svc.name}` });
      }
    }
    out.push({ kind: 'system', text: `Nmap done: 1 IP address (1 host up) scanned in 4.21 seconds` });
    return out;
  }

  /** `nmap -sn <ip>/<cidr>` — ping-sweep/host-discovery only (no port scan), used to find undocumented hosts on a subnet. */
  private nmapSweep(cidrArg: string): OutLine[] {
    const [baseIp, prefixStr] = cidrArg.split('/');
    const prefix = Number(prefixStr);
    const out: OutLine[] = [];
    out.push({ kind: 'system', text: `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toUTCString()}` });
    if (Number.isNaN(prefix) || prefix < 0 || prefix > 32 || ipToInt(baseIp) === null) {
      out.push({ kind: 'error', text: `nmap: invalid target specification '${cidrArg}'` });
      return out;
    }
    const found = this.scenario.network.filter((h) => ipInCidr(h.ip, baseIp, prefix));
    if (found.length === 0) {
      out.push({ kind: 'output', text: `Nmap done: ${2 ** (32 - prefix)} IP addresses (0 hosts up) scanned in 2.10 seconds` });
      return out;
    }
    for (const host of found) {
      out.push({ kind: 'output', text: `Nmap scan report for ${host.hostname} (${host.ip})` });
      out.push({ kind: 'output', text: `Host is up (0.0031s latency).` });
    }
    out.push({ kind: 'system', text: `Nmap done: ${2 ** (32 - prefix)} IP addresses (${found.length} host${found.length === 1 ? '' : 's'} up) scanned in 2.10 seconds` });
    return out;
  }

  private ping(args: string[]): OutLine[] {
    const ip = args[0];
    if (!ip) return [{ kind: 'error', text: 'usage: ping <ip>' }];
    const host = this.findHostByIp(ip);
    if (!host) {
      return [
        { kind: 'output', text: `PING ${ip} (${ip}) 56(84) bytes of data.` },
        { kind: 'error', text: `From 10.10.14.1 icmp_seq=1 Destination Host Unreachable` },
        { kind: 'system', text: `--- ${ip} ping statistics ---\n4 packets transmitted, 0 received, 100% packet loss` },
      ];
    }
    return [
      { kind: 'output', text: `PING ${ip} (${ip}) 56(84) bytes of data.` },
      { kind: 'output', text: `64 bytes from ${ip}: icmp_seq=1 ttl=63 time=2.14 ms` },
      { kind: 'output', text: `64 bytes from ${ip}: icmp_seq=2 ttl=63 time=1.98 ms` },
      { kind: 'system', text: `--- ${ip} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss` },
    ];
  }

  private curl(args: string[], onFlag: (flag: string) => void): OutLine[] {
    // Walk args and pull out -H/-d and their values first, so whatever's left is the URL —
    // otherwise a header value that doesn't start with '-' gets mistaken for the target.
    const consumed = new Set<number>();
    let postBody: string | undefined;
    const headers: Record<string, string> = {};
    args.forEach((a, i) => {
      if (a === '-H' && args[i + 1] !== undefined) {
        consumed.add(i);
        consumed.add(i + 1);
        const [name, ...rest] = args[i + 1].replace(/^["']|["']$/g, '').split(':');
        if (name) headers[name.trim().toLowerCase()] = rest.join(':').trim();
      } else if (a === '-d' && args[i + 1] !== undefined) {
        consumed.add(i);
        consumed.add(i + 1);
        postBody = args[i + 1].replace(/^["']|["']$/g, '');
      } else if (a === '-X' && args[i + 1] !== undefined) {
        // HTTP method flag — doesn't change simulated behavior here, but its value must not be mistaken for the URL.
        consumed.add(i);
        consumed.add(i + 1);
      }
    });

    const target = args.find((a, i) => !consumed.has(i) && !a.startsWith('-'));
    if (!target) return [{ kind: 'error', text: 'usage: curl [-H "Name: value"] [-d "a=b&c=d"] <ip>[:port][/path[?query]]' }];

    const m = target.match(/^(?:https?:\/\/)?(\d+\.\d+\.\d+\.\d+)(?::(\d+))?(\/[^?]*)?(?:\?(.*))?$/);
    if (!m) return [{ kind: 'error', text: `curl: (3) URL using bad/illegal format or missing URL` }];
    const [, ip, portStr, rawPath, rawQuery] = m;
    const port = portStr ? Number(portStr) : 80;
    const path = rawPath ?? '/';
    const host = this.findHostByIp(ip);
    if (!host) return [{ kind: 'error', text: `curl: (7) Failed to connect to ${ip} port ${port}: Connection refused` }];
    const svc = host.services.find((s) => s.port === port && (s.http || s.vulnRoutes));
    if (!svc) return [{ kind: 'error', text: `curl: (7) Failed to connect to ${ip} port ${port}: Connection refused` }];

    // A request can carry a query string on the URL AND a -d POST body at the same time (e.g. a POST
    // upload endpoint whose target key is in the query but the payload is in the body) — merge both
    // rather than picking one, so a vulnRoute's tested param is found regardless of which side it's on.
    const params = { ...parseParams(rawQuery ?? ''), ...parseParams(postBody ?? '') };
    const route = svc.vulnRoutes?.find((r) => r.path === path);
    if (route) {
      const value = route.location === 'header' ? headers[route.param.toLowerCase()] : params[route.param];
      const triggered = value !== undefined && route.triggerSubstrings.some((s) => value.toLowerCase().includes(s.toLowerCase()));
      const body = triggered ? route.vulnerableResponse : route.normalResponse;
      const match = body.match(FLAG_RE);
      if (match) onFlag(match[0]);
      return body.split('\n').map((l) => ({ kind: 'output' as const, text: l }));
    }

    const body = svc.http?.[path];
    if (body === undefined) {
      return [{ kind: 'output', text: '<html><body><h1>404 Not Found</h1></body></html>' }];
    }
    const match = body.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return body.split('\n').map((l) => ({ kind: 'output' as const, text: l }));
  }

  /** dig/nslookup — resolves a lab hostname (e.g. shop01) to the IP configured on its HostDef. */
  private dig(args: string[]): OutLine[] {
    const name = args.find((a) => !a.startsWith('-'));
    if (!name) return [{ kind: 'error', text: 'usage: dig <hostname>' }];
    const host = this.scenario.network.find((h) => h.hostname.toLowerCase() === name.toLowerCase());
    if (!host) {
      return [
        { kind: 'system', text: `; <<>> DiG 9.18.1 <<>> ${name}` },
        { kind: 'output', text: ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN' },
      ];
    }
    return [
      { kind: 'system', text: `; <<>> DiG 9.18.1 <<>> ${name}` },
      { kind: 'output', text: ';; ->>HEADER<<- opcode: QUERY, status: NOERROR' },
      { kind: 'output', text: ';; ANSWER SECTION:' },
      { kind: 'success', text: `${name}.\t300\tIN\tA\t${host.ip}` },
    ];
  }

  /** `export KEY=VALUE` — real bash export is silent on success; this is what `aws` reads its
   *  credentials from, the same way it would read them from the real environment. Persists at the
   *  engine level (not per ssh session) since exported vars live in your one shell process,
   *  unaffected by which host you're currently sitting on top of. */
  private exportVar(args: string[]): OutLine[] {
    const joined = args.join(' ');
    const match = joined.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return [{ kind: 'error', text: `export: usage: export [NAME=VALUE]` }];
    const [, name, rawValue] = match;
    this.sessionEnv[name] = rawValue.replace(/^["']|["']$/g, '');
    return [];
  }

  /** Every scenario in this engine models "the cloud environment" as a single reachable host —
   *  good enough for the account-scoped labs this supports (one AWS account per lab). */
  private findAwsAccount(): AwsAccountDef | null {
    for (const h of this.scenario.network) {
      if (h.awsAccount) return h.awsAccount;
    }
    return null;
  }

  /** Resolves whichever AWS identity the current AWS_ACCESS_KEY_ID env var (if any) actually maps
   *  to — `undefined` means no credential exported at all, `null` means an exported key that
   *  doesn't match anything real in this account (a typo, or a key that was never actually valid). */
  private currentAwsCredential(account: AwsAccountDef): AwsCredential | null | undefined {
    const keyId = this.sessionEnv['AWS_ACCESS_KEY_ID'];
    if (!keyId) return undefined;
    return account.credentials.find((c) => c.accessKeyId === keyId) ?? null;
  }

  private awsAccessDenied(operation: string): OutLine {
    return { kind: 'error', text: `An error occurred (AccessDenied) when calling the ${operation} operation: Access Denied` };
  }

  private awsS3(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const account = this.findAwsAccount();
    if (!account) return [{ kind: 'error', text: 'aws: could not connect to the endpoint URL' }];
    const sub = args[0];
    const uri = args.find((a) => a.startsWith('s3://'));
    if (!uri || (sub !== 'ls' && sub !== 'cp')) return [{ kind: 'error', text: 'usage: aws s3 ls s3://<bucket>[/<prefix>]  |  aws s3 cp s3://<bucket>/<key> -' }];
    const withoutScheme = uri.slice('s3://'.length);
    const slashIdx = withoutScheme.indexOf('/');
    const bucketName = slashIdx === -1 ? withoutScheme : withoutScheme.slice(0, slashIdx);
    const keyOrPrefix = slashIdx === -1 ? '' : withoutScheme.slice(slashIdx + 1);
    const bucket = account.buckets.find((b) => b.name === bucketName);
    if (!bucket) return [{ kind: 'error', text: `An error occurred (NoSuchBucket) when calling the ${sub === 'ls' ? 'ListObjectsV2' : 'GetObject'} operation: The specified bucket does not exist` }];

    const cred = this.currentAwsCredential(account);
    const allowed = bucket.publicRead || (cred && cred.role === bucket.requiredRole);
    if (!allowed) return [this.awsAccessDenied(sub === 'ls' ? 'ListObjectsV2' : 'GetObject')];

    if (sub === 'ls') {
      const prefix = keyOrPrefix;
      const seenSubPrefixes = new Set<string>();
      const out: OutLine[] = [];
      for (const obj of bucket.objects) {
        if (!obj.key.startsWith(prefix)) continue;
        const rest = obj.key.slice(prefix.length);
        const nextSlash = rest.indexOf('/');
        if (nextSlash !== -1) {
          const subPrefix = rest.slice(0, nextSlash + 1);
          if (!seenSubPrefixes.has(subPrefix)) {
            seenSubPrefixes.add(subPrefix);
            out.push({ kind: 'output', text: `                           PRE ${subPrefix}` });
          }
          continue;
        }
        out.push({ kind: 'output', text: `2026-07-12 00:00:00 ${String(obj.content.length).padStart(10)} ${obj.key}` });
      }
      return out.length ? out : [{ kind: 'muted', text: '(no objects at this prefix)' }];
    }

    // cp
    const obj = bucket.objects.find((o) => o.key === keyOrPrefix);
    if (!obj) return [{ kind: 'error', text: `An error occurred (404) when calling the GetObject operation: Key "${keyOrPrefix}" does not exist` }];
    const out: OutLine[] = [{ kind: 'system', text: `download: s3://${bucketName}/${keyOrPrefix} to -` }];
    obj.content.split('\n').forEach((l) => out.push({ kind: 'output', text: l }));
    const match = obj.content.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return out;
  }

  private awsSts(args: string[]): OutLine[] {
    if (args[0] !== 'get-caller-identity') return [{ kind: 'error', text: 'usage: aws sts get-caller-identity' }];
    const account = this.findAwsAccount();
    if (!account) return [{ kind: 'error', text: 'aws: could not connect to the endpoint URL' }];
    const cred = this.currentAwsCredential(account);
    if (cred === undefined) return [{ kind: 'error', text: 'Unable to locate credentials. You can configure credentials by running "aws configure".' }];
    if (cred === null) return [{ kind: 'error', text: 'An error occurred (InvalidClientTokenId) when calling the GetCallerIdentity operation: The security token included in the request is invalid.' }];
    return [
      { kind: 'output', text: '{' },
      { kind: 'output', text: `    "UserId": "${cred.accessKeyId}",` },
      { kind: 'output', text: `    "Account": "${cred.accountId}",` },
      { kind: 'output', text: `    "Arn": "${cred.arn}"` },
      { kind: 'output', text: '}' },
    ];
  }

  private awsIam(args: string[]): OutLine[] {
    const account = this.findAwsAccount();
    if (!account) return [{ kind: 'error', text: 'aws: could not connect to the endpoint URL' }];
    if (args[0] !== 'list-attached-role-policies') return [{ kind: 'error', text: 'usage: aws iam list-attached-role-policies --role-name <role>' }];
    const nameIdx = args.indexOf('--role-name');
    const roleName = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
    if (!roleName) return [{ kind: 'error', text: 'usage: aws iam list-attached-role-policies --role-name <role>' }];
    const role = account.roles.find((r) => r.name === roleName);
    if (!role) return [{ kind: 'error', text: `An error occurred (NoSuchEntity) when calling the ListAttachedRolePolicies operation: The role with name ${roleName} cannot be found.` }];
    return [
      { kind: 'output', text: `Role: ${role.name}` },
      { kind: 'output', text: role.policySummary },
    ];
  }

  private awsEc2(args: string[]): OutLine[] {
    const account = this.findAwsAccount();
    if (!account) return [{ kind: 'error', text: 'aws: could not connect to the endpoint URL' }];
    if (args[0] !== 'run-instances') return [{ kind: 'error', text: 'usage: aws ec2 run-instances --iam-instance-profile Name=<role> ...' }];
    const profileArg = args.find((a) => a.startsWith('Name='));
    const roleName = profileArg?.slice('Name='.length);
    if (!roleName) return [{ kind: 'error', text: 'usage: aws ec2 run-instances --iam-instance-profile Name=<role> ...' }];
    const role = account.roles.find((r) => r.name === roleName);
    const cred = this.currentAwsCredential(account);
    // PassRole: the *caller's own* role/identity has to be explicitly allowed to attach this
    // specific role to a new instance — having any valid credentials at all isn't enough.
    const callerRoleName = cred ? cred.role : 'anonymous';
    const allowed = role?.passableBy?.includes(callerRoleName);
    if (!role) return [{ kind: 'error', text: `An error occurred (InvalidParameterValue) when calling the RunInstances operation: IAM instance profile ${roleName} does not exist` }];
    if (!allowed) {
      return [{ kind: 'error', text: `An error occurred (UnauthorizedOperation) when calling the RunInstances operation: You are not authorized to perform this operation. User is not authorized to perform: iam:PassRole on resource: role/${roleName}` }];
    }
    const passedCred = account.credentials.find((c) => c.role === roleName);
    const out: OutLine[] = [
      { kind: 'success', text: '{' },
      { kind: 'success', text: '    "Instances": [{' },
      { kind: 'success', text: `        "InstanceId": "i-0${Math.random().toString(16).slice(2, 10)}",` },
      { kind: 'success', text: `        "IamInstanceProfile": {"Arn": "arn:aws:iam::${account.accountId}:instance-profile/${roleName}"}` },
      { kind: 'success', text: '    }]' },
      { kind: 'success', text: '}' },
    ];
    if (passedCred) {
      out.push(
        { kind: 'system', text: `NOTE: this instance's attached-role credentials would normally be fetched from its own instance` },
        { kind: 'system', text: `metadata service after boot — since booting isn't simulated here, they're provided directly:` },
        { kind: 'output', text: `  AccessKeyId: ${passedCred.accessKeyId}` },
        { kind: 'output', text: `  SecretAccessKey: ${passedCred.secretAccessKey}` },
      );
    }
    return out;
  }

  private aws(args: string[], onFlag: (flag: string) => void): OutLine[] {
    switch (args[0]) {
      case 's3':
        return this.awsS3(args.slice(1), onFlag);
      case 'sts':
        return this.awsSts(args.slice(1));
      case 'iam':
        return this.awsIam(args.slice(1));
      case 'ec2':
        return this.awsEc2(args.slice(1));
      default:
        return [{ kind: 'error', text: `usage: aws <s3|sts|iam|ec2> <subcommand> [options]` }];
    }
  }

  /** gobuster/ffuf/dirsearch — directory/file brute-forcing against a target's HTTP routes using a wordlist file. */
  private webFuzz(tool: string, args: string[]): OutLine[] {
    const urlArg = args.find((a) => /^\d+\.\d+\.\d+\.\d+/.test(a.replace(/^https?:\/\//, '')));
    const wIdx = args.indexOf('-w');
    const wordlistPath = wIdx >= 0 ? args[wIdx + 1] : args.find((a) => a.includes('/') && !/^\d/.test(a) && !a.startsWith('http'));
    if (!urlArg || !wordlistPath) {
      return [{ kind: 'error', text: `usage: ${tool} -u <ip>[:port] -w <wordlist>` }];
    }
    const m = urlArg.match(/^(?:https?:\/\/)?(\d+\.\d+\.\d+\.\d+)(?::(\d+))?/);
    if (!m) return [{ kind: 'error', text: `${tool}: invalid target URL` }];
    const [, ip, portStr] = m;
    const port = portStr ? Number(portStr) : 80;
    const host = this.findHostByIp(ip);
    const svc = host?.services.find((s) => s.port === port && (s.http || s.vulnRoutes));
    if (!host || !svc) return [{ kind: 'error', text: `${tool}: unable to connect to ${ip}:${port}` }];

    const wordlistNode = getNode(this.fsRoot(), this.resolveInSession(wordlistPath));
    if (!wordlistNode || wordlistNode.type !== 'file') return [{ kind: 'error', text: `${tool}: cannot read wordlist '${wordlistPath}'` }];
    const words = wordlistNode.content.split('\n').map((w) => w.trim()).filter(Boolean);

    const knownPaths = new Set<string>([...Object.keys(svc.http ?? {}), ...(svc.vulnRoutes ?? []).map((r) => r.path)]);
    const out: OutLine[] = [{ kind: 'system', text: `${tool} — wordlist: ${words.length} entries, target: ${ip}:${port}` }];
    let found = 0;
    for (const path of knownPaths) {
      const bare = path.replace(/^\//, '');
      if (words.includes(bare)) {
        found += 1;
        out.push({ kind: 'success', text: `${path.padEnd(30)} (Status: 200)` });
      }
    }
    out.push({ kind: found ? 'system' : 'muted', text: found ? `${tool}: ${found} result(s) found.` : `${tool}: no results — nothing in this wordlist matched.` });
    return out;
  }

  /** nikto/whatweb — quick web fingerprint/vuln-scanner flavor, reusing the service banner already modeled for nmap -sV. */
  private webScan(tool: string, args: string[]): OutLine[] {
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!ip) return [{ kind: 'error', text: `usage: ${tool} -h <ip>` }];
    const host = this.findHostByIp(ip);
    const svc = host?.services.find((s) => s.http || s.vulnRoutes);
    if (!host || !svc) return [{ kind: 'error', text: `${tool}: could not connect to ${ip}` }];
    return [
      { kind: 'system', text: `${tool === 'whatweb' ? 'WhatWeb' : 'Nikto'} v2.5 scanning ${ip} ...` },
      { kind: 'output', text: `Target IP: ${ip}` },
      { kind: 'output', text: `Server: ${svc.version}` },
      { kind: 'output', text: `Port: ${svc.port}` },
      { kind: 'muted', text: `(this is a fingerprinting pass only — use curl/gobuster/sqlmap to actually enumerate and exploit specific findings)` },
    ];
  }

  /** sqlmap — automated SQLi confirmation/dump against an existing 'sqli' VulnRoute. */
  private sqlmap(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const uIdx = args.indexOf('-u');
    const target = uIdx >= 0 ? args[uIdx + 1] : args.find((a) => /^https?:\/\//.test(a) || /^\d+\.\d+\.\d+\.\d+/.test(a));
    if (!target) return [{ kind: 'error', text: 'usage: sqlmap -u "<url>" --batch [--dump]' }];
    const m = target.match(/^(?:https?:\/\/)?(\d+\.\d+\.\d+\.\d+)(?::(\d+))?(\/[^?]*)?(?:\?(.*))?$/);
    if (!m) return [{ kind: 'error', text: 'sqlmap: invalid target URL' }];
    const [, ip, portStr, rawPath, rawQuery] = m;
    const port = portStr ? Number(portStr) : 80;
    const path = rawPath ?? '/';
    const host = this.findHostByIp(ip);
    const svc = host?.services.find((s) => s.port === port && s.vulnRoutes);
    const route = svc?.vulnRoutes?.find((r) => r.path === path && r.kind === 'sqli');
    const out: OutLine[] = [{ kind: 'system', text: `sqlmap resuming/starting against ${target}` }];
    if (!host || !svc || !route) {
      out.push({ kind: 'error', text: `[CRITICAL] all tested parameters do not appear to be injectable.` });
      return out;
    }
    out.push({ kind: 'success', text: `[INFO] GET parameter '${route.param}' appears to be injectable` });
    out.push({ kind: 'output', text: `Parameter: ${route.param} (GET)` });
    out.push({ kind: 'output', text: `    Type: UNION query` });
    if (args.includes('--dump')) {
      const params = parseParams(rawQuery ?? '');
      const value = params[route.param] ?? '';
      const triggered = route.triggerSubstrings.some((s) => value.toLowerCase().includes(s.toLowerCase()));
      const body = triggered ? route.vulnerableResponse : route.normalResponse;
      const match = body.match(FLAG_RE);
      if (match) onFlag(match[0]);
      out.push({ kind: 'system', text: '[INFO] fetching data...' });
      body.split('\n').forEach((l) => out.push({ kind: 'success', text: l }));
    } else {
      out.push({ kind: 'muted', text: `re-run with --dump (and the confirmed payload in the URL) to actually extract data.` });
    }
    return out;
  }

  /** john — CPU-based hash cracking, an alternate front-end to the same #HASHCAT_* markers hashcat reads. */
  private john(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const wIdx = args.indexOf('--wordlist');
    const hashArg = args.find((a, i) => !a.startsWith('-') && args[i - 1] !== '--wordlist');
    const wordlistArg = wIdx >= 0 ? args[wIdx + 1]?.replace('--wordlist=', '') : undefined;
    const wordlistPath = args.find((a) => a.startsWith('--wordlist='))?.replace('--wordlist=', '') ?? wordlistArg;
    if (!hashArg || !wordlistPath) return [{ kind: 'error', text: 'usage: john --wordlist=<wordlist> <hashfile>' }];
    const hashNode = getNode(this.fsRoot(), this.resolveInSession(hashArg));
    const wordlistNode = getNode(this.fsRoot(), this.resolveInSession(wordlistPath));
    if (!hashNode || hashNode.type !== 'file') return [{ kind: 'error', text: `john: ${hashArg}: No such file or directory` }];
    if (!wordlistNode || wordlistNode.type !== 'file') return [{ kind: 'error', text: `john: ${wordlistPath}: No such file or directory` }];
    const hashValue = this.extractMarkerBlock(hashNode.content, '#HASHCAT_HASH:');
    const plaintext = this.extractMarkerBlock(hashNode.content, '#HASHCAT_PLAINTEXT:');
    const out: OutLine[] = [{ kind: 'system', text: 'Using default input encoding: UTF-8' }, { kind: 'muted', text: 'Loaded 1 password hash' }];
    if (!hashValue || !plaintext) {
      out.push({ kind: 'error', text: '0g 0:00:00:00 DONE — no hashes loaded' });
      return out;
    }
    const words = wordlistNode.content.split('\n').map((w) => w.trim()).filter(Boolean);
    if (!words.includes(plaintext)) {
      out.push({ kind: 'error', text: '0g 0:00:00:03 DONE (2026) 0g/s — no matches in this wordlist' });
      return out;
    }
    out.push({ kind: 'success', text: `${plaintext}          (?)` });
    out.push({ kind: 'success', text: '1g 0:00:00:01 DONE — use --show to display cracked passwords' });
    const flagMarker = this.extractMarkerBlock(hashNode.content, '#HASHCAT_FLAG:');
    if (flagMarker) out.push({ kind: 'success', text: flagMarker });
    const match = (flagMarker ?? '').match(FLAG_RE) ?? plaintext.match(FLAG_RE) ?? hashNode.content.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return out;
  }

  /** cewl — generates a target-specific wordlist from a site's own HTML content. */
  private cewl(args: string[]): OutLine[] {
    const target = args.find((a) => /^https?:\/\//.test(a) || /^\d+\.\d+\.\d+\.\d+/.test(a));
    if (!target) return [{ kind: 'error', text: 'usage: cewl <url> [-w outputfile]' }];
    const m = target.match(/^(?:https?:\/\/)?(\d+\.\d+\.\d+\.\d+)/);
    const ip = m?.[1];
    const host = ip ? this.findHostByIp(ip) : undefined;
    if (!host) return [{ kind: 'error', text: `cewl: could not connect to ${target}` }];
    const words = new Set<string>();
    for (const svc of host.services) {
      for (const body of Object.values(svc.http ?? {})) {
        (body.match(/[A-Za-z][A-Za-z'-]{3,}/g) ?? []).forEach((w) => words.add(w));
      }
    }
    const list = [...words].slice(0, 12);
    return [
      { kind: 'system', text: `CeWL 6.1 crawling ${target}` },
      ...list.map((w) => ({ kind: 'output' as const, text: w })),
      { kind: 'muted', text: `${list.length} words extracted — combine with a base wordlist for a targeted hydra/hashcat run.` },
    ];
  }

  /** enum4linux/smbclient — lists top-level share-like directories on a host exposing SMB (445). */
  private smbEnum(tool: string, args: string[]): OutLine[] {
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!ip) return [{ kind: 'error', text: `usage: ${tool} <ip>` }];
    const host = this.findHostByIp(ip);
    if (!host || !host.services.some((s) => s.port === 445)) {
      return [{ kind: 'error', text: `${tool}: session setup failed: NT_STATUS_CONNECTION_REFUSED` }];
    }
    const shares = Object.keys(host.root.type === 'dir' ? host.root.children : {});
    return [
      { kind: 'system', text: `${tool === 'smbclient' ? 'Anonymous login successful' : `Starting enum4linux v0.9.1 on ${ip}`}` },
      { kind: 'output', text: `Sharename       Type      Comment` },
      { kind: 'output', text: `---------       ----      -------` },
      ...shares.map((s) => ({ kind: 'output' as const, text: `${s.padEnd(15)} Disk` })),
      { kind: 'muted', text: `Use ftp/ftp-get in this simulated environment to actually pull files from a share.` },
    ];
  }

  /** masscan/rustscan — high-speed port discovery: open ports only, no service/version banner (that's nmap -sV's job). */
  private fastScan(tool: string, args: string[]): OutLine[] {
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!ip) return [{ kind: 'error', text: `usage: ${tool} -p1-65535 <ip>` }];
    const host = this.findHostByIp(ip);
    const out: OutLine[] = [{ kind: 'system', text: `${tool === 'masscan' ? 'Starting masscan 1.3.2' : 'RustScan 2.1.1'} — ultra-fast port scan of ${ip}` }];
    if (!host) {
      out.push({ kind: 'error', text: `${ip} appears to be down.` });
      return out;
    }
    for (const svc of host.services) out.push({ kind: 'success', text: `Discovered open port ${svc.port}/tcp on ${ip}` });
    out.push({ kind: 'muted', text: `${host.services.length} open port(s) — pipe these into nmap -sV for service/version detection.` });
    return out;
  }

  /** nc/netcat — raw TCP connect + banner grab against any modeled service. */
  private netcat(args: string[]): OutLine[] {
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    const port = Number(args.find((a) => /^\d+$/.test(a) && a !== ip));
    if (!ip || !port) return [{ kind: 'error', text: 'usage: nc <ip> <port>' }];
    const host = this.findHostByIp(ip);
    const svc = host?.services.find((s) => s.port === port);
    if (!host || !svc) return [{ kind: 'error', text: `nc: connect to ${ip} port ${port} (tcp) failed: Connection refused` }];
    return [{ kind: 'output', text: svc.banner ?? `${svc.name} ${svc.version}` }];
  }

  private exploit(args: string[]): OutLine[] {
    const moduleName = args[0];
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!moduleName || !ip) return [{ kind: 'error', text: 'usage: exploit <module-name> <target-ip>' }];
    const host = this.findHostByIp(ip);
    if (!host) return [{ kind: 'error', text: `exploit: no route to host ${ip}` }];
    if (!host.exploitableAs || host.exploitableAs !== moduleName) {
      return [
        { kind: 'system', text: `[*] Started reverse handler` },
        { kind: 'error', text: `[-] ${ip}:445 - Exploit failed: target is not vulnerable to '${moduleName}', or the module name is wrong.` },
      ];
    }
    const rootSession: Session = {
      isAttacker: false,
      host,
      user: 'SYSTEM',
      cwd: ['root'],
      isRoot: true,
    };
    this.stack.push(rootSession);
    return [
      { kind: 'system', text: `[*] Started reverse handler on 10.10.14.1:4444` },
      { kind: 'system', text: `[*] ${ip}:445 - Sending exploit packet...` },
      { kind: 'success', text: `[+] ${ip}:445 - Exploit completed, session opened` },
      { kind: 'success', text: `[*] Meterpreter session 1 opened (SYSTEM)` },
    ];
  }

  private ftp(args: string[]): OutLine[] {
    const ip = args[0];
    if (!ip) return [{ kind: 'error', text: 'usage: ftp <ip>' }];
    const host = this.findHostByIp(ip);
    const svc = host?.services.find((s) => s.port === 21);
    if (!host || !svc) return [{ kind: 'error', text: `ftp: connect: Connection refused` }];
    if (!svc.ftpAnonymous) {
      return [
        { kind: 'output', text: `Connected to ${ip}.` },
        { kind: 'output', text: `220 ${svc.banner ?? 'FTP server ready'}` },
        { kind: 'error', text: `530 Login incorrect. (anonymous login disabled)` },
      ];
    }
    const ftpDir = getNode(host.root, ['srv', 'ftp']);
    const names = ftpDir && ftpDir.type === 'dir' ? Object.keys(ftpDir.children) : [];
    return [
      { kind: 'output', text: `Connected to ${ip}.` },
      { kind: 'output', text: `220 ${svc.banner ?? 'FTP server ready'}` },
      { kind: 'success', text: `230 Login successful. (anonymous)` },
      { kind: 'muted', text: `Remote directory /srv/ftp:` },
      ...names.map((n) => ({ kind: 'output' as const, text: n })),
      { kind: 'system', text: `Use: ftp-get ${ip} <file>  to download & view a file` },
    ];
  }

  private ftpGet(args: string[], onFlag: (f: string) => void): OutLine[] {
    const [ip, filename] = args;
    if (!ip || !filename) return [{ kind: 'error', text: 'usage: ftp-get <ip> <file>' }];
    const host = this.findHostByIp(ip);
    if (!host) return [{ kind: 'error', text: 'ftp-get: connection refused' }];
    const node = getNode(host.root, ['srv', 'ftp', filename]);
    if (!node || node.type !== 'file') return [{ kind: 'error', text: `ftp-get: ${filename}: No such file` }];
    const out: OutLine[] = [{ kind: 'system', text: `226 Transfer complete. --- ${filename} ---` }];
    node.content.split('\n').forEach((l) => out.push({ kind: 'output', text: l }));
    const match = node.content.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return out;
  }

  private crackmapexec(args: string[]): OutLine[] {
    const proto = args[0];
    const ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
    const uIdx = args.indexOf('-u');
    const pIdx = args.indexOf('-p');
    if (proto !== 'smb' || !ip || uIdx < 0 || pIdx < 0) {
      return [{ kind: 'error', text: 'usage: crackmapexec smb <ip> -u <user> -p <password>' }];
    }
    const user = args[uIdx + 1];
    const password = args[pIdx + 1];
    const host = this.findHostByIp(ip);
    if (!host || !host.services.some((s) => s.port === 445)) {
      return [{ kind: 'error', text: `SMB         ${ip}      445    -                [-] Connection refused` }];
    }
    const account = host.users.find((u) => u.username === user);
    const ok = account && account.password === password;
    const status = ok ? (account?.sudo ? '(Pwn3d!)' : '[+]') : '[-]';
    return [
      {
        kind: ok ? 'success' : 'error',
        text: `SMB         ${ip}      445    ${host.hostname.toUpperCase().padEnd(15)} ${status} ${host.hostname}\\${user}:${password} ${ok ? (account?.sudo ? 'Pwn3d!' : '') : 'STATUS_LOGON_FAILURE'}`,
      },
    ];
  }

  private secretsdump(args: string[], onFlag: (flag: string) => void): OutLine[] {
    const target = args.find((a) => a.includes('@'));
    const uIdx = args.indexOf('-u');
    const pIdx = args.indexOf('-p');
    let ip: string | undefined;
    let user: string | undefined;
    let password: string | undefined;
    if (target) {
      const m = target.match(/^([^:@]+):?([^@]*)@(\d+\.\d+\.\d+\.\d+)$/);
      if (m) {
        user = m[1];
        password = m[2];
        ip = m[3];
      }
    } else {
      ip = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
      user = uIdx >= 0 ? args[uIdx + 1] : undefined;
      password = pIdx >= 0 ? args[pIdx + 1] : undefined;
    }
    if (!ip || !user || password === undefined) {
      return [{ kind: 'error', text: 'usage: secretsdump user:password@<ip>  (or -u <user> -p <password> <ip>)' }];
    }
    const host = this.findHostByIp(ip);
    if (!host) return [{ kind: 'error', text: `secretsdump: no route to host ${ip}` }];
    const account = host.users.find((u) => u.username === user);
    if (!account || account.password !== password) {
      return [{ kind: 'error', text: `[-] ${ip}: STATUS_LOGON_FAILURE` }];
    }
    if (!account.canDcsync || !host.ntdsHashes) {
      return [{ kind: 'error', text: `[-] ${user} does not have replication rights (DS-Replication-Get-Changes) on ${host.hostname} — DCSync denied.` }];
    }
    const match = host.ntdsHashes.match(FLAG_RE);
    if (match) onFlag(match[0]);
    return [
      { kind: 'system', text: `[*] Dumping Domain Credentials (domain\\uid:rid:lmhash:nthash)` },
      { kind: 'system', text: `[*] Using the DRSUAPI method to get NTDS.DIT secrets` },
      ...host.ntdsHashes.split('\n').map((l) => ({ kind: 'success' as const, text: l })),
    ];
  }

  private beginSsh(args: string[]): OutLine[] {
    const target = args.find((a) => a.includes('@'));
    if (!target) return [{ kind: 'error', text: 'usage: ssh user@ip' }];
    const [user, ip] = target.split('@');
    const host = this.findHostByIp(ip);
    if (!host || !host.services.some((s) => s.port === 22)) {
      return [{ kind: 'error', text: `ssh: connect to host ${ip} port 22: Connection refused` }];
    }
    this.awaitingAuth = { ip, user, host };
    return [{ kind: 'system', text: `The authenticity of host '${ip}' can't be established. Connecting...` }];
  }

  private submitPassword(password: string): OutLine[] {
    if (!this.awaitingAuth) return [];
    const { user, host } = this.awaitingAuth;
    this.awaitingAuth = null;
    const account = host.users.find((u) => u.username === user);
    if (!account || account.password !== password) {
      return [{ kind: 'error', text: `Permission denied, please try again.` }];
    }
    const newSession: Session = {
      isAttacker: false,
      host,
      user,
      cwd: user === 'root' ? ['root'] : ['home', user],
      isRoot: user === 'root',
    };
    this.stack.push(newSession);
    return [
      { kind: 'success', text: `Welcome to ${host.os}` },
      { kind: 'success', text: `Last login: ${new Date().toUTCString()} from 10.10.14.1` },
    ];
  }

  private hydra(args: string[]): OutLine[] {
    const userIdx = args.indexOf('-l');
    const listIdx = args.indexOf('-P');
    const userListIdx = args.indexOf('-L');
    const singlePassIdx = args.indexOf('-p');
    const target = args.find((a) => a.startsWith('ssh://') || a.startsWith('smb://') || /^\d+\.\d+\.\d+\.\d+$/.test(a));
    if (!target) {
      return [{ kind: 'error', text: 'usage: hydra -l <user> -P <wordlist> ssh://<ip>  (or -L <userlist> -p <password> for spraying)' }];
    }
    const ip = target.replace(/^ssh:\/\//, '').replace(/^smb:\/\//, '');
    const host = this.findHostByIp(ip);
    if (!host) return [{ kind: 'error', text: `hydra: target ${ip} unreachable` }];
    const service = target.startsWith('smb://') ? 'smb' : 'ssh';

    // Password spraying: ONE password against MANY usernames — the real-world technique operators
    // use specifically to stay under an account-lockout threshold, unlike -l/-P below which throws
    // many passwords at a single known account.
    if (userListIdx >= 0 && singlePassIdx >= 0) {
      const userlistPath = args[userListIdx + 1];
      const password = args[singlePassIdx + 1];
      const node = getNode(this.fsRoot(), this.resolveInSession(userlistPath));
      if (!node || node.type !== 'file') {
        return [{ kind: 'error', text: `hydra: cannot read userlist '${userlistPath}'` }];
      }
      const usernames = node.content.split('\n').map((w) => w.trim()).filter(Boolean);
      const hits = usernames.filter((u) => {
        const account = host.users.find((acc) => acc.username === u);
        return account && account.password === password;
      });
      const out: OutLine[] = [
        { kind: 'system', text: `Hydra v9.5 starting at ${new Date().toUTCString()}` },
        { kind: 'system', text: `[DATA] max 4 tasks per 1 server, overall 4 tasks, ${usernames.length} login tries (l:${usernames.length}/p:1), ~1 try per task` },
      ];
      usernames.slice(0, 6).forEach((u, i) => out.push({ kind: 'muted', text: `[ATTEMPT] target ${ip} - login "${u}" - pass "${password}" - ${i + 1} of ${usernames.length}` }));
      if (usernames.length > 6) out.push({ kind: 'muted', text: `...` });
      if (hits.length) {
        hits.forEach((u) => out.push({ kind: 'success', text: `[${service === 'smb' ? '445][smb' : '22][ssh'}] host: ${ip}   login: ${u}   password: ${password}` }));
      }
      out.push({ kind: hits.length ? 'system' : 'error', text: `${hits.length} of ${usernames.length} target${usernames.length === 1 ? '' : 's'} successfully completed, ${hits.length} valid password${hits.length === 1 ? '' : 's'} found` });
      return out;
    }

    if (userIdx < 0 || listIdx < 0) {
      return [{ kind: 'error', text: 'usage: hydra -l <user> -P <wordlist> ssh://<ip>  (or -L <userlist> -p <password> for spraying)' }];
    }
    const user = args[userIdx + 1];
    const wordlistPath = args[listIdx + 1];
    const resolved = this.resolveInSession(wordlistPath);
    const node = getNode(this.fsRoot(), resolved);
    if (!node || node.type !== 'file') {
      return [{ kind: 'error', text: `hydra: cannot read wordlist '${wordlistPath}'` }];
    }
    const words = node.content.split('\n').map((w) => w.trim()).filter(Boolean);
    const account = host.users.find((u) => u.username === user);
    const out: OutLine[] = [
      { kind: 'system', text: `Hydra v9.5 starting at ${new Date().toUTCString()}` },
      { kind: 'system', text: `[DATA] max 4 tasks per 1 server, overall 4 tasks, ${words.length} login tries` },
    ];
    words.slice(0, 4).forEach((w, i) => out.push({ kind: 'muted', text: `[ATTEMPT] target ${ip} - login "${user}" - pass "${w}" - ${i + 1} of ${words.length}` }));
    if (words.length > 4) out.push({ kind: 'muted', text: `...` });
    if (account && words.includes(account.password)) {
      out.push({ kind: 'success', text: `[22][ssh] host: ${ip}   login: ${user}   password: ${account.password}` });
      out.push({ kind: 'system', text: `1 of 1 target successfully completed, 1 valid password found` });
    } else {
      out.push({ kind: 'error', text: `0 of 1 target successfully completed, 0 valid passwords found` });
    }
    return out;
  }

  private sudo(args: string[]): OutLine[] {
    const s = this.session;
    if (s.isAttacker) return [{ kind: 'muted', text: `${s.user} is already root on the attack box.` }];
    const host = s.host as HostDef;
    const account = host.users.find((u) => u.username === s.user);
    if (args[0] === '-l') {
      if (!account?.sudo) return [{ kind: 'output', text: `User ${s.user} may not run sudo on ${host.hostname}.` }];
      if (account.sudo.nopasswdAll) {
        return [{ kind: 'output', text: `User ${s.user} may run the following commands:\n    (ALL : ALL) NOPASSWD: ALL` }];
      }
      const cmds = account.sudo.nopasswdCommands ?? [];
      return [{ kind: 'output', text: `User ${s.user} may run the following commands:\n` + cmds.map((c) => `    (root) NOPASSWD: ${c}`).join('\n') }];
    }
    const cmdline = args.join(' ');
    const baseBin = args[0];
    // sudoers rules are written as absolute paths, but a real shell resolves a bare command
    // name (e.g. "sudo find ...") to that exact same binary via $PATH — matching only the
    // literal path string would silently reject the idiomatic, GTFOBins-documented form of
    // every one of these commands.
    const allowed =
      account?.sudo?.nopasswdAll ||
      (account?.sudo?.nopasswdCommands ?? []).some((c) => {
        if (c === baseBin || cmdline.startsWith(c)) return true;
        const baseName = c.split('/').pop();
        return baseName !== undefined && baseName !== '' && (baseBin === baseName || cmdline.startsWith(`${baseName} `) || cmdline === baseName);
      });
    if (!allowed) {
      return [{ kind: 'error', text: `Sorry, user ${s.user} is not allowed to execute '${cmdline}' as root on ${host.hostname}.` }];
    }
    const rootSession: Session = { ...s, isRoot: true };
    this.stack.push(rootSession);
    return [{ kind: 'success', text: `# spawned root shell via '${baseBin}' (GTFOBins)` }];
  }

  /** Directly executing a SUID-root binary (no sudo involved) — a distinct privesc path from misconfigured sudoers. */
  private runSuidBinary(cmd: string): OutLine[] | null {
    const s = this.session;
    if (s.isAttacker || !s.host?.suidBinary || cmd !== s.host.suidBinary) return null;
    const rootSession: Session = { ...s, isRoot: true };
    this.stack.push(rootSession);
    return [{ kind: 'success', text: `# ${cmd} is SUID root — spawned a root shell (GTFOBins)` }];
  }

  private exit(): OutLine[] {
    if (this.stack.length <= 1) {
      return [{ kind: 'muted', text: `This is your attack machine — there's nowhere left to exit to.` }];
    }
    const closing = this.stack.pop() as Session;
    return [{ kind: 'system', text: closing.isAttacker ? 'logout' : `Connection to ${closing.host?.ip} closed.` }];
  }

  private whoami(): OutLine[] {
    return [{ kind: 'output', text: this.effectiveUser() }];
  }

  private id(): OutLine[] {
    const s = this.session;
    if (this.effectiveUser() === 'root') return [{ kind: 'output', text: 'uid=0(root) gid=0(root) groups=0(root)' }];
    const account = !s.isAttacker ? (s.host as HostDef).users.find((u) => u.username === s.user) : undefined;
    const groups = account?.sudo ? `1000(${s.user}),27(sudo)` : `1000(${s.user})`;
    return [{ kind: 'output', text: `uid=1000(${s.user}) gid=1000(${s.user}) groups=${groups}` }];
  }

  private ifconfig(): OutLine[] {
    const s = this.session;
    const ip = s.isAttacker ? '10.10.14.1' : (s.host as HostDef).ip;
    return [
      { kind: 'output', text: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500` },
      { kind: 'output', text: `        inet ${ip}  netmask 255.255.255.0` },
    ];
  }

  private netstat(): OutLine[] {
    const s = this.session;
    if (s.isAttacker) return [{ kind: 'muted', text: '(no listening services on the attack box)' }];
    const host = s.host as HostDef;
    return [
      { kind: 'output', text: 'Active Internet connections (only servers)' },
      { kind: 'output', text: 'Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name' },
      ...host.services.map((svc) => ({
        kind: 'output' as const,
        text: `tcp        0      0 0.0.0.0:${svc.port}${' '.repeat(Math.max(1, 24 - String(svc.port).length))}0.0.0.0:*               LISTEN      -/${svc.name}`,
      })),
    ];
  }

  private help(): OutLine[] {
    return [
      { kind: 'system', text: 'Available commands:' },
      { kind: 'output', text: 'pwd, ls [-la], cd, cat, echo, find, grep      — filesystem' },
      { kind: 'output', text: 'whoami, id, ifconfig, netstat -tulpn          — recon (local)' },
      { kind: 'output', text: 'ping, nmap [-sV] <ip>, dig <hostname>         — recon (network)' },
      { kind: 'output', text: 'masscan/rustscan <ip>, nc <ip> <port>         — fast scan / raw connect' },
      { kind: 'output', text: 'curl <ip>/path, gobuster/ffuf/dirsearch -u.. -w.. — web enum' },
      { kind: 'output', text: 'nikto/whatweb -h <ip>, sqlmap -u ".." --batch — web scanning / SQLi' },
      { kind: 'output', text: 'ftp <ip>, ftp-get <ip> <file>                 — anonymous FTP' },
      { kind: 'output', text: 'enum4linux/smbclient <ip>                     — SMB share enumeration' },
      { kind: 'output', text: 'ssh user@ip, hydra -l user -P list ssh://ip   — access' },
      { kind: 'output', text: 'hashcat/john -m/--wordlist .., cewl <url>     — password cracking' },
      { kind: 'output', text: 'sudo -l, sudo <cmd>, exit                     — privesc / sessions' },
      { kind: 'output', text: 'objectives, hint, clear, history               — lab helpers' },
    ];
  }

  /** Command names for the current word, or filesystem entries in the current directory for a
   *  later argument — real bash resolves completion candidates from $PATH vs. cwd the same way. */
  getCompletions(partial: string, isFirstWord: boolean): string[] {
    if (isFirstWord) {
      return KNOWN_COMMANDS.filter((c) => c.startsWith(partial)).sort();
    }
    const node = getNode(this.fsRoot(), this.session.cwd);
    if (!node || node.type !== 'dir') return [];
    return Object.keys(node.children)
      .filter((name) => name.startsWith(partial))
      .sort();
  }

  run(raw: string, onFlag: (flag: string) => void): OutLine[] {
    const line = raw.trim();
    if (this.awaitingAuth) {
      return this.submitPassword(line);
    }
    if (!line) return [];
    if (line !== 'history') this.commandHistory.push(line);
    const [cmd, ...args] = tokenize(line);

    switch (cmd) {
      case 'history':
        if (this.commandHistory.length === 0) return [{ kind: 'muted', text: '(no commands yet)' }];
        return this.commandHistory.map((c, i) => ({ kind: 'output' as const, text: `  ${String(i + 1).padStart(4)}  ${c}` }));
      case 'help':
        return this.help();
      case 'pwd':
        return [{ kind: 'output', text: pathToString(this.session.cwd) }];
      case 'ls':
        return this.ls(args);
      case 'cd':
        return this.cd(args);
      case 'cat':
        return this.cat(args, onFlag);
      case 'strings':
        return this.strings(args, onFlag);
      case 'file':
        return this.fileCmd(args);
      case 'checksec':
        return this.checksec(args, onFlag);
      case 'objdump':
        return this.objdump(args);
      case 'gdb':
        return this.gdb(args);
      case 'yara':
        return this.yara(args, onFlag);
      case 'hashcat':
        return this.hashcat(args, onFlag);
      case 'echo':
        return [{ kind: 'output', text: args.join(' ').replace(/^["']|["']$/g, '') }];
      case 'find':
        return this.find(args);
      case 'grep':
        return this.grep(args, onFlag);
      case 'whoami':
        return this.whoami();
      case 'id':
        return this.id();
      case 'ifconfig':
      case 'ip':
        return this.ifconfig();
      case 'netstat':
        return this.netstat();
      case 'ping':
        return this.ping(args);
      case 'nmap':
        return this.nmap(args, onFlag);
      case 'curl':
      case 'wget':
        return this.curl(args, onFlag);
      case 'ftp':
        return this.ftp(args);
      case 'ftp-get':
        return this.ftpGet(args, onFlag);
      case 'ssh':
        return this.beginSsh(args);
      case 'hydra':
        return this.hydra(args);
      case 'crackmapexec':
      case 'cme':
      case 'netexec':
        return this.crackmapexec(args);
      case 'exploit':
        return this.exploit(args);
      case 'secretsdump':
        return this.secretsdump(args, onFlag);
      case 'dig':
      case 'nslookup':
        return this.dig(args);
      case 'gobuster':
      case 'ffuf':
      case 'dirsearch':
        return this.webFuzz(cmd, args);
      case 'nikto':
      case 'whatweb':
        return this.webScan(cmd, args);
      case 'sqlmap':
        return this.sqlmap(args, onFlag);
      case 'john':
        return this.john(args, onFlag);
      case 'cewl':
        return this.cewl(args);
      case 'enum4linux':
      case 'smbclient':
        return this.smbEnum(cmd, args);
      case 'masscan':
      case 'rustscan':
        return this.fastScan(cmd, args);
      case 'nc':
      case 'netcat':
        return this.netcat(args);
      case 'sudo':
        return this.sudo(args);
      case 'su':
        return [{ kind: 'muted', text: 'su: use sudo instead in this lab environment.' }];
      case 'exit':
      case 'logout':
        return this.exit();
      case 'clear':
        return [{ kind: 'system', text: '__CLEAR__' }];
      case 'objectives':
        return [
          { kind: 'system', text: 'Objectives:' },
          ...this.scenario.objectives.map((o) => ({ kind: 'output' as const, text: `  - ${typeof o === 'string' ? o : o.text}` })),
        ];
      case 'hint': {
        if (this.scenario.hints.length === 0) return [{ kind: 'muted', text: 'No hints available.' }];
        const h = this.scenario.hints[Math.min(this.hintIndex, this.scenario.hints.length - 1)];
        this.hintIndex = Math.min(this.hintIndex + 1, this.scenario.hints.length - 1);
        return [{ kind: 'system', text: `Hint: ${h}` }];
      }
      case 'chmod':
        return [{ kind: 'output', text: '' }];
      case 'export':
        return this.exportVar(args);
      case 'aws':
        return this.aws(args, onFlag);
      default: {
        const suidResult = this.runSuidBinary(cmd);
        if (suidResult) return suidResult;
        const crackmeResult = this.tryRunCrackme(cmd, args, onFlag);
        if (crackmeResult) return crackmeResult;
        return [{ kind: 'error', text: `${cmd}: command not found` }];
      }
    }
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Converts a dotted-quad IPv4 string to its 32-bit numeric form, or null if malformed. */
function ipToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** True if `ip` falls within the `baseIp/prefix` CIDR range. */
function ipInCidr(ip: string, baseIp: string, prefix: number): boolean {
  const ipNum = ipToInt(ip);
  const baseNum = ipToInt(baseIp);
  if (ipNum === null || baseNum === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

/** Shell-like tokenizer: splits on whitespace but keeps "..."/'...' groups (with spaces) as one token. */
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  return tokens;
}

function parseParams(qs: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of qs.split('&')) {
    if (!pair) continue;
    const eqIdx = pair.indexOf('=');
    const k = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
    const v = eqIdx === -1 ? '' : pair.slice(eqIdx + 1);
    try {
      params[decodeURIComponent(k)] = decodeURIComponent(v);
    } catch {
      params[k] = v;
    }
  }
  return params;
}
