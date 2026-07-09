import { useEffect, useRef, useState } from 'react';
import { TerminalEngine, type OutLine } from '../../labs/engine';
import type { LabScenario } from '../../labs/types';

interface DisplayLine extends OutLine {
  id: number;
}

interface TerminalProps {
  scenario: LabScenario;
  onFlagCaptured: (flag: string) => void;
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

export default function Terminal({ scenario, onFlagCaptured }: TerminalProps) {
  const engineRef = useRef<TerminalEngine>(new TerminalEngine(scenario));
  const [lines, setLines] = useState<DisplayLine[]>([
    { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
    { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
  ]);
  const [input, setInput] = useState('');
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    engineRef.current = new TerminalEngine(scenario);
    setLines([
      { id: idCounter++, kind: 'system', text: `Connected to lab environment: ${scenario.title}` },
      { id: idCounter++, kind: 'muted', text: `Type 'help' for commands, 'objectives' to see goals, 'hint' if stuck.` },
    ]);
    setHistoryList([]);
    setHistoryPos(null);
  }, [scenario]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const submit = (raw: string) => {
    const engine = engineRef.current;
    const prompt = engine.getPrompt();
    const isPassword = engine.isAwaitingPassword();
    const echoText = isPassword ? '•'.repeat(raw.length) : raw;

    const newLines: DisplayLine[] = [{ id: idCounter++, kind: 'input', text: `${prompt} ${echoText}` }];

    const result = engine.run(raw, (flag) => onFlagCaptured(flag));

    for (const line of result) {
      if (line.text === '__CLEAR__') {
        setLines([]);
        setInput('');
        return;
      }
      line.text.split('\n').forEach((t) => newLines.push({ id: idCounter++, kind: line.kind, text: t }));
    }

    setLines((prev) => [...prev, ...newLines]);
    if (!isPassword && raw.trim()) {
      setHistoryList((prev) => [...prev, raw]);
    }
    setHistoryPos(null);
    setInput('');
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
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0">
        {lines.map((l) => (
          <pre key={l.id} className={`whitespace-pre-wrap break-all ${KIND_CLASS[l.kind]}`}>
            {l.text}
          </pre>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-[#e8a33d] shrink-0">{isPassword ? '' : engineRef.current.getPrompt()}</span>
          <input
            ref={inputRef}
            autoFocus
            type={isPassword ? 'password' : 'text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent outline-none text-[#d8d0c0] min-w-0"
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
