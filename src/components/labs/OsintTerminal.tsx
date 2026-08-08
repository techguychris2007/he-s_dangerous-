import { useEffect, useRef, useState } from 'react';
import type { OsintLabScenario } from '../../labs/osintTerminalTypes';
import { extractFlag } from '../../labs/osintTerminalTypes';

interface DisplayLine {
  id: number;
  kind: 'input' | 'output' | 'system' | 'muted';
  text: string;
}

let idCounter = 0;

const TOOL_BINARY: Record<OsintLabScenario['tool'], string> = {
  shodan: 'shodan',
  sherlock: 'sherlock',
  maltego: 'maltego-cli',
  eyewitness: 'eyewitness',
  theharvester: 'theHarvester',
};

const KIND_CLASS: Record<DisplayLine['kind'], string> = {
  input: 'text-[var(--term-input)]',
  output: 'text-[var(--term-output)]',
  system: 'text-[var(--term-system)]',
  muted: 'text-[var(--term-muted)]',
};

export default function OsintTerminal({
  scenario,
  onFlagCaptured,
  onTranscriptChange,
}: {
  scenario: OsintLabScenario;
  onFlagCaptured: (flag: string) => void;
  onTranscriptChange?: (transcript: string) => void;
}) {
  const [lines, setLines] = useState<DisplayLine[]>([
    { id: idCounter++, kind: 'system', text: `Connected to attacker box — recon tools installed: ${TOOL_BINARY[scenario.tool]}` },
    { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // See Terminal.tsx — tracked via a scroll listener so the check reflects the pre-update position.
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    onTranscriptChange?.(lines.map((l) => (l.kind === 'input' ? l.text : `  ${l.text}`)).join('\n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setLines([
      { id: idCounter++, kind: 'system', text: `Connected to attacker box — recon tools installed: ${TOOL_BINARY[scenario.tool]}` },
      { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
    ]);
    setHistoryList([]);
    setHistoryPos(null);
    setHintIndex(0);
    setBusy(false);
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [scenario]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Only follow the tail if the learner was already near the bottom — see Terminal.tsx for why.
  useEffect(() => {
    if (isNearBottomRef.current) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();
  const prompt = 'attacker@kali:~$';

  const push = (kind: DisplayLine['kind'], text: string) => {
    text.split('\n').forEach((t) => setLines((prev) => [...prev, { id: idCounter++, kind, text: t }]));
  };

  const submit = (raw: string) => {
    if (busy) return;
    const trimmed = raw.trim();
    setLines((prev) => [...prev, { id: idCounter++, kind: 'input', text: `${prompt} ${raw}` }]);
    setInput('');
    if (!trimmed) return;
    setHistoryList((prev) => [...prev, raw]);
    setHistoryPos(null);

    if (trimmed === 'help') {
      push('output', `Available: ${TOOL_BINARY[scenario.tool]} <args>, objectives, hint, clear`);
      return;
    }
    if (trimmed === 'objectives') {
      push('system', 'Objectives:');
      scenario.objectives.forEach((o) => push('output', `  - ${o.text}`));
      return;
    }
    if (trimmed === 'hint') {
      if (hintIndex >= scenario.hints.length) {
        push('muted', 'No more hints available.');
        return;
      }
      push('system', `Hint: ${scenario.hints[hintIndex]}`);
      setHintIndex((i) => Math.min(i + 1, scenario.hints.length));
      return;
    }
    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    const step = scenario.commands.find((c) => c.match.test(trimmed));
    if (!step) {
      const firstWord = trimmed.split(/\s+/)[0];
      if (firstWord.toLowerCase().includes(TOOL_BINARY[scenario.tool].toLowerCase().slice(0, 4))) {
        push('muted', `${firstWord}: no results for this query — try a different filter, or check 'hint'.`);
      } else {
        push('output', `bash: ${firstWord}: command not found`);
      }
      return;
    }

    setBusy(true);
    let elapsed = 0;
    step.chunks.forEach((chunk) => {
      elapsed += chunk.delayMs;
      const t = setTimeout(() => {
        chunk.lines.forEach((line) => {
          push('output', line);
          const flag = extractFlag(line);
          if (flag) onFlagCaptured(flag);
        });
      }, elapsed);
      timersRef.current.push(t);
    });
    const doneTimer = setTimeout(() => setBusy(false), elapsed + 50);
    timersRef.current.push(doneTimer);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyList.length === 0) return;
      const nextPos = historyPos === null ? historyList.length - 1 : Math.max(0, historyPos - 1);
      setHistoryPos(nextPos);
      setInput(historyList[nextPos]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPos === null) return;
      const nextPos = historyPos + 1;
      if (nextPos >= historyList.length) {
        setHistoryPos(null);
        setInput('');
      } else {
        setHistoryPos(nextPos);
        setInput(historyList[nextPos]);
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      // Cancel whatever this tool's still-queued output chunks are — otherwise they'd print anyway,
      // moments after a ^C that was supposed to mean "stop."
      if (timersRef.current.length > 0) {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setBusy(false);
      }
      push('input', `${prompt} ${input}^C`);
      setInput('');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[var(--term-bg)] border-2 border-[var(--color-accent)]/50 rounded-lg overflow-hidden font-mono text-sm shadow-[0_0_40px_-12px_var(--color-accent)]"
      onClick={focusInput}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#15171c] border-b border-[var(--color-accent)]/30">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-xs text-[#c9a15f]">kali — bash — {scenario.datasetLabel}</span>
        {busy && <span className="ml-auto text-2xs text-[var(--term-muted)] animate-pulse">running&hellip;</span>}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0" role="log" aria-live="polite" aria-label="OSINT terminal output">
        {lines.map((l) => (
          <pre key={l.id} className={`whitespace-pre-wrap break-all ${KIND_CLASS[l.kind]}`}>
            {l.text}
          </pre>
        ))}
        {/* Always mounted, even while busy — a real terminal buffers type-ahead input instead of
            discarding keystrokes typed while a command is still running; submit() already no-ops
            on Enter while busy, so typed text just waits here until the prompt returns. */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--term-system)] shrink-0">{busy ? '' : prompt}</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal command input"
            className="flex-1 bg-transparent outline-none text-[var(--term-output)] min-w-0 focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded-sm"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
