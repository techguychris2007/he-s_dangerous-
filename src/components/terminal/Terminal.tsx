import { useEffect, useRef, useState } from 'react';
import { TerminalEngine, COMMAND_LATENCY_MS, type OutLine } from '../../labs/engine';
import type { LabScenario } from '../../labs/types';

interface DisplayLine extends OutLine {
  id: number;
}

interface TerminalProps {
  scenario: LabScenario;
  onFlagCaptured: (flag: string) => void;
  /** Fires once per real command submitted (not password entries) — used to drive the guided-steps
   *  checklist's automatic tick-off, since each step is designed to correspond to roughly one command. */
  onCommandRun?: () => void;
  /** Fires with the full session transcript (input + output, plain text) on every change — lets a
   *  parent (the AI lab tutor) see the learner's real terminal activity without owning any of the
   *  terminal's own rendering/state. */
  onTranscriptChange?: (transcript: string) => void;
}

let idCounter = 0;

/* The terminal keeps its own permanently-dark palette regardless of the site theme —
   a light "terminal" would read as fake. Gold/orange framing ties it back to the site. */
const KIND_CLASS: Record<OutLine['kind'], string> = {
  input: 'text-[#f2c46d]',
  output: 'text-[#d8d0c0]',
  error: 'text-[#ff6b5e]',
  success: 'text-[#7ee081]',
  system: 'text-[#e8a33d]',
  muted: 'text-[#7a7264]',
};

export default function Terminal({ scenario, onFlagCaptured, onCommandRun, onTranscriptChange }: TerminalProps) {
  const engineRef = useRef<TerminalEngine>(new TerminalEngine(scenario));
  const [lines, setLines] = useState<DisplayLine[]>([
    { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
    { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
  ]);
  const [input, setInput] = useState('');
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onTranscriptChange?.(lines.map((l) => (l.kind === 'input' ? l.text : `  ${l.text}`)).join('\n'));
    // onTranscriptChange is a plain callback prop, not reactive state — safe to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    engineRef.current = new TerminalEngine(scenario);
    setLines([
      { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
      { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
    ]);
    setHistoryList([]);
    setHistoryPos(null);
    setBusy(false);
  }, [scenario]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const submit = (raw: string) => {
    if (busy) return;
    const engine = engineRef.current;
    const prompt = engine.getPrompt();
    const isPassword = engine.isAwaitingPassword();
    const echoText = isPassword ? '•'.repeat(raw.length) : raw;

    const newLines: DisplayLine[] = [{ id: idCounter++, kind: 'input', text: `${prompt} ${echoText}` }];
    setLines((prev) => [...prev, ...newLines]);
    setInput('');
    setHistoryPos(null);
    if (!isPassword && raw.trim()) {
      setHistoryList((prev) => [...prev, raw]);
    }

    // The engine itself runs synchronously (state changes — cd, ssh login, etc. — happen right
    // away, exactly when the real command would take effect); only REVEALING the output is
    // delayed, the same way a real nmap/hydra/hashcat run makes you wait before printing results.
    const result = engine.run(raw, (flag) => onFlagCaptured(flag));
    const firstWord = raw.trim().split(/\s+/)[0]?.toLowerCase();
    const latency = isPassword ? 0 : (COMMAND_LATENCY_MS[firstWord] ?? 0);

    const reveal = () => {
      const outLines: DisplayLine[] = [];
      for (const line of result) {
        if (line.text === '__CLEAR__') {
          setLines([]);
          setBusy(false);
          return;
        }
        line.text.split('\n').forEach((t) => outLines.push({ id: idCounter++, kind: line.kind, text: t }));
      }
      setLines((prev) => [...prev, ...outLines]);
      setBusy(false);
    };

    if (latency > 0) {
      setBusy(true);
      setTimeout(reveal, latency);
    } else {
      reveal();
    }
    if (!isPassword && raw.trim()) onCommandRun?.();
  };

  const applyCompletion = (candidates: string[]) => {
    if (candidates.length === 0) return;
    const words = input.split(/\s+/);
    const lastWord = words[words.length - 1] ?? '';
    if (candidates.length === 1) {
      words[words.length - 1] = candidates[0];
      setInput(words.join(' ') + (words.length === 1 ? ' ' : ''));
      return;
    }
    // Multiple matches with no unambiguous completion: real bash prints the candidate list below
    // the prompt (on a second Tab press) rather than guessing — list them and leave the input alone.
    const commonPrefix = candidates.reduce((acc, c) => {
      let i = 0;
      while (i < acc.length && i < c.length && acc[i] === c[i]) i++;
      return acc.slice(0, i);
    });
    if (commonPrefix.length > lastWord.length) {
      words[words.length - 1] = commonPrefix;
      setInput(words.join(' '));
      return;
    }
    setLines((prev) => [
      ...prev,
      { id: idCounter++, kind: 'input', text: `${engineRef.current.getPrompt()} ${input}` },
      { id: idCounter++, kind: 'muted', text: candidates.join('  ') },
    ]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit(input);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Shift+Tab is deliberately left alone (real bash has no meaning for it either) so a
      // keyboard-only user always has a way to tab backward out of the terminal input.
      e.preventDefault();
      if (busy || engineRef.current.isAwaitingPassword()) return;
      const words = input.split(/\s+/);
      const lastWord = words[words.length - 1] ?? '';
      const isFirstWord = words.length <= 1;
      applyCompletion(engineRef.current.getCompletions(lastWord, isFirstWord));
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
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setLines((prev) => [...prev, { id: idCounter++, kind: 'input', text: `${engineRef.current.getPrompt()} ${input}^C` }]);
      setInput('');
    }
  };

  const isPassword = engineRef.current.isAwaitingPassword();

  return (
    <div
      className="flex flex-col h-full bg-[#0c0d10] border-2 border-[var(--color-accent)]/50 rounded-lg overflow-hidden font-mono text-sm shadow-[0_0_40px_-12px_var(--color-accent)]"
      onClick={focusInput}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#15171c] border-b border-[var(--color-accent)]/30">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-xs text-[#c9a15f]">{scenario.attacker.hostname} — bash</span>
        {busy && <span className="ml-auto text-2xs text-[#7a7264] animate-pulse">running&hellip;</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0" role="log" aria-live="polite" aria-label={`${scenario.attacker.hostname} terminal output`}>
        {lines.map((l) => (
          <pre key={l.id} className={`whitespace-pre-wrap break-all ${KIND_CLASS[l.kind]}`}>
            {l.text}
          </pre>
        ))}
        {/* Always mounted, even while busy — a real terminal buffers type-ahead input instead of
            discarding keystrokes typed while a foreground command is still running; submit() already
            no-ops on Enter while busy, so typed text just waits here until the prompt returns. */}
        <div className="flex items-center gap-2">
          <span className="text-[#e8a33d] shrink-0">{isPassword ? '' : busy ? '' : engineRef.current.getPrompt()}</span>
          <input
            ref={inputRef}
            autoFocus
            type={isPassword ? 'password' : 'text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal command input"
            className="flex-1 bg-transparent outline-none text-[#d8d0c0] min-w-0 focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded-sm"
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
