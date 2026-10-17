import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { TerminalEngine, COMMAND_LATENCY_MS, type OutLine, type LabSnapshot } from '../../labs/engine';
import type { LabScenario } from '../../labs/types';

interface DisplayLine extends OutLine {
  id: number;
}

interface TerminalProps {
  ref?: Ref<TerminalHandle>;
  scenario: LabScenario;
  onFlagCaptured: (flag: string) => void;
  /** Fires with the full session transcript (input + output, plain text) on every change — lets a
   *  parent (the AI lab tutor) see the learner's real terminal activity without owning any of the
   *  terminal's own rendering/state. */
  onTranscriptChange?: (transcript: string) => void;
  onStateChange?: (snapshot: LabSnapshot) => void;
  onBusyChange?: (busy: boolean) => void;
}

export interface TerminalHandle { executeCommand: (command: string) => void }

let idCounter = 0;

/* The terminal keeps its own permanently-dark palette regardless of the site theme —
   a light "terminal" would read as fake. Gold/orange framing ties it back to the site. */
const KIND_CLASS: Record<OutLine['kind'], string> = {
  input: 'text-[var(--term-input)]',
  output: 'text-[var(--term-output)]',
  error: 'text-[var(--term-error)]',
  success: 'text-[var(--term-success)]',
  system: 'text-[var(--term-system)]',
  muted: 'text-[var(--term-muted)]',
};

export default function Terminal({ ref, scenario, onFlagCaptured, onTranscriptChange, onStateChange, onBusyChange }: TerminalProps) {
  const [initialEngine] = useState(() => new TerminalEngine(scenario));
  const engineRef = useRef<TerminalEngine>(initialEngine);
  const [lines, setLines] = useState<DisplayLine[]>([
    { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
    { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
  ]);
  const [input, setInput] = useState('');
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRevealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks "was the learner already at the bottom" continuously via a scroll listener, so the
  // auto-follow check below reflects their position from *before* new lines got appended — checking
  // scrollTop only inside the [lines] effect would always measure against the already-taller post-
  // update DOM (React commits the new lines before that effect runs), which makes "am I near the
  // bottom" spuriously false for the exact case it needs to catch: someone parked at the bottom who
  // just submitted a command that immediately appended output.
  const isNearBottomRef = useRef(true);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  useEffect(() => {
    onTranscriptChange?.(lines.map((l) => (l.kind === 'input' ? l.text : `  ${l.text}`)).join('\n'));
    // onTranscriptChange is a plain callback prop, not reactive state — safe to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    if (pendingRevealRef.current) {
      clearTimeout(pendingRevealRef.current);
      pendingRevealRef.current = null;
    }
    engineRef.current = new TerminalEngine(scenario);
    onStateChangeRef.current?.(engineRef.current.getSnapshot());
    setLines([
      { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
      { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
    ]);
    setHistoryList([]);
    setHistoryPos(null);
    setBusy(false);
    setInput('');
  }, [scenario]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (pendingRevealRef.current) {
        clearTimeout(pendingRevealRef.current);
        pendingRevealRef.current = null;
      }
    };
  }, []);

  // Only follow the tail if the learner was already near the bottom — otherwise a delayed command's
  // output (or the next thing anyone types) would yank them back down mid-scroll while they're
  // reading earlier output, exactly the thing a real terminal never does to you.
  useEffect(() => {
    const viewport = scrollRef.current;
    if (isNearBottomRef.current && viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [lines]);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

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
    onStateChangeRef.current?.(engine.getSnapshot());
    const firstWord = raw.trim().split(/\s+/)[0]?.toLowerCase();
    const latency = isPassword ? 0 : (COMMAND_LATENCY_MS[firstWord] ?? 0);

    const reveal = () => {
      pendingRevealRef.current = null;
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
      pendingRevealRef.current = setTimeout(reveal, latency);
    } else {
      reveal();
    }
  };

  useImperativeHandle(ref, () => ({ executeCommand: (command: string) => {
    if (busy || engineRef.current.isAwaitingPassword()) return;
    submit(command);
  } }));

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

  const runShortcut = (command: string) => {
    if (busy || engineRef.current.isAwaitingPassword()) return;
    submit(command);
    focusInput();
  };

  const clearTerminal = () => {
    if (pendingRevealRef.current) {
      clearTimeout(pendingRevealRef.current);
      pendingRevealRef.current = null;
      setBusy(false);
    }
    setLines([]);
    focusInput();
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
      // If a command is still "running" (its output delayed to mimic real latency), actually cancel
      // that pending reveal instead of just echoing ^C and letting the output show up moments later
      // anyway — a real terminal killing a foreground process doesn't let it print after the fact.
      if (pendingRevealRef.current) {
        clearTimeout(pendingRevealRef.current);
        pendingRevealRef.current = null;
        setBusy(false);
      }
      const engine = engineRef.current;
      const interruptedInput = engine.isAwaitingPassword() ? '' : input;
      setLines((prev) => [...prev, { id: idCounter++, kind: 'input', text: `${engine.getPrompt()} ${interruptedInput}^C` }]);
      engine.cancelAuthentication();
      setInput('');
    }
  };

  const isPassword = engineRef.current.isAwaitingPassword();

  return (
    <div
      className="flex flex-col h-full min-h-0 min-w-0 bg-[var(--term-bg)] border border-[var(--color-accent)]/40 rounded-xl overflow-hidden font-mono text-xs sm:text-sm shadow-[0_0_40px_-12px_var(--color-accent)]"
      onClick={focusInput}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#15171c] border-b border-[var(--color-accent)]/30">
        <span className="text-xs text-[var(--term-input)] truncate">{scenario.attacker.hostname} — bash</span>
        <div className="ml-auto hidden sm:flex items-center gap-1">
          {['help', 'hint', 'objectives'].map(command => (
            <button
              key={command}
              type="button"
              onClick={(event) => { event.stopPropagation(); runShortcut(command); }}
              disabled={busy || engineRef.current.isAwaitingPassword()}
              className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--term-muted)] hover:border-[var(--color-accent)]/50 hover:text-[var(--term-output)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {command}
            </button>
          ))}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); clearTerminal(); }}
            className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--term-muted)] hover:border-[var(--color-accent)]/50 hover:text-[var(--term-output)]"
          >
            clear
          </button>
        </div>
        {busy && <span className="ml-auto text-2xs text-[var(--term-muted)] animate-pulse shrink-0">running&hellip;</span>}
      </div>
      <div className="grid grid-cols-4 gap-1 border-b border-[var(--color-accent)]/20 bg-[#11141a] p-1.5 sm:hidden">
        {['help', 'hint', 'objectives'].map(command => (
          <button
            key={command}
            type="button"
            onClick={(event) => { event.stopPropagation(); runShortcut(command); }}
            disabled={busy || engineRef.current.isAwaitingPassword()}
            className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--term-muted)] disabled:opacity-40"
          >
            {command === 'objectives' ? 'goals' : command}
          </button>
        ))}
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); clearTerminal(); }}
          className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--term-muted)]"
        >
          clear
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3 space-y-0.5 min-h-0"
        role="log"
        aria-live="polite"
        aria-label={`${scenario.attacker.hostname} terminal output`}
      >
        {lines.map((l) => (
          <pre key={l.id} className={`whitespace-pre-wrap break-all text-xs sm:text-sm leading-relaxed ${KIND_CLASS[l.kind]}`}>
            {l.text}
          </pre>
        ))}
        {lines.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-[var(--term-muted)]">
            Terminal cleared. Type <span className="text-[var(--term-output)]">help</span>, use the shortcut buttons, or continue your current command sequence.
          </div>
        )}
        {/* Always mounted, even while busy — a real terminal buffers type-ahead input instead of
            discarding keystrokes typed while a foreground command is still running; submit() already
            no-ops on Enter while busy, so typed text just waits here until the prompt returns. */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[var(--term-system)] max-w-[55%] break-all text-xs sm:text-sm font-semibold">{isPassword ? '' : busy ? '' : engineRef.current.getPrompt()}</span>
          <input
            ref={inputRef}
            type={isPassword ? 'password' : 'text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal command input"
            className="flex-1 bg-transparent outline-none text-[var(--term-output)] text-xs sm:text-sm min-w-0 focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded-sm"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); focusInput(); }}
            className="sm:hidden rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--term-muted)]"
          >
            focus
          </button>
        </div>
      </div>
    </div>
  );
}
