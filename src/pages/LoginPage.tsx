import { useState } from 'react';
import { useProgress } from '../state/progressStore';

export default function LoginPage() {
  const progress = useProgress();
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) progress.login(name.trim());
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="flex justify-center mb-5">
          <svg viewBox="0 0 24 24" className="w-14 h-14">
            <path d="M12 2l8 3.5v6c0 5.2-3.4 8.6-8 10.5-4.6-1.9-8-5.3-8-10.5v-6L12 2Z" fill="var(--color-navy)" />
            <path d="M12 2l8 3.5v6c0 5.2-3.4 8.6-8 10.5V2Z" fill="var(--color-accent)" />
          </svg>
        </div>
        <div className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">
          Cybersecurity Learner Portal
        </div>
        <h1 className="text-center text-2xl font-extrabold text-[var(--color-heading)] mb-2">HackerHub</h1>
        <p className="text-center text-sm text-[var(--color-text-dim)] mb-6 leading-relaxed">
          10 modules, 95 hands-on labs, hidden flags and quizzes. What should we call you?
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-navy)] text-white font-semibold text-sm disabled:opacity-40 hover:brightness-110 transition"
          >
            Start learning &rarr;
          </button>
        </form>
        <p className="text-center text-[11px] text-[var(--color-text-dim)] mt-5">
          Everything runs locally in your browser — no account, no server, no password. Your name just
          personalizes the portal and is stored on this device only.
        </p>
      </div>
    </div>
  );
}
