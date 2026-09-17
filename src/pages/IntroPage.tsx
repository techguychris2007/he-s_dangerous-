import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { MODULES } from '../data/curriculum';
import Logo from '../components/layout/Logo';
import AgencyBackdrop from '../components/layout/AgencyBackdrop';
import {
  IconTerminal,
  IconShieldCheck,
  IconChart,
  IconCertificate,
  IconFlask,
  IconRadar,
  IconUser,
  IconFlag,
} from '../components/layout/icons';

// Hardcoded fallback counts to keep main bundle small (~0KB lab import)
const FALLBACK_TOTAL_LABS = 597;
const FALLBACK_TOTAL_FLAGS = 759;

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Free, in under a minute. Your progress syncs to your account so it follows you across devices.' },
  { n: '02', title: 'Pick a module', body: 'Start from Linux and networking fundamentals, or jump straight into web hacking, red teaming, or SOC work.' },
  { n: '03', title: 'Break something', body: 'Every lesson hands you off to a real interactive lab — terminal, SIEM console, or both — until you capture the flag.' },
];

const FEATURES = [
  {
    Icon: IconTerminal,
    title: 'A real in-browser terminal',
    body: 'A simulated Linux shell backed by a full virtual filesystem — navigate, enumerate, exploit, and escalate privilege exactly like a real box, entirely client-side.',
  },
  {
    Icon: IconRadar,
    title: 'SOC & SIEM simulations',
    body: 'Investigate real, publicly documented breaches inside simulated Splunk, Microsoft Sentinel, IBM QRadar, Elastic, Suricata, Chronicle, and tcpdump consoles.',
  },
  {
    Icon: IconShieldCheck,
    title: 'Structured curriculum',
    body: 'Networking and Linux fundamentals through Active Directory, cloud security, malware analysis, and bug bounty methodology — every lesson paired with a hands-on lab.',
  },
  {
    Icon: IconChart,
    title: 'Progress that sticks',
    body: 'Flags, completed lessons, and lab streaks are tracked as you go, with a mentor companion that adapts its pacing to how you actually work.',
  },
  {
    Icon: IconCertificate,
    title: 'Shareable writeups & certificates',
    body: 'Every solved lab can generate a professional PDF writeup or certificate you can actually put in a portfolio.',
  },
  {
    Icon: IconFlask,
    title: 'Learn by breaking things',
    body: 'No lecture-only modules — every concept is immediately followed by a lab where you use it against a real (simulated) target.',
  },
];

export default function IntroPage() {
  const auth = useAuth();

  if (!auth.loading && auth.user) return <Navigate to="/" replace />;

  const totalLessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
  const totalLabs = FALLBACK_TOTAL_LABS;
  const totalFlags = FALLBACK_TOTAL_FLAGS;

  return (
    <div className="min-h-screen w-full bg-[#060d16]">
      {/* ---------- hero ---------- */}
      <div className="relative overflow-hidden min-h-screen flex flex-col">
        <AgencyBackdrop variant="subtle" />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-8 pb-20 flex-1 flex flex-col justify-center w-full">
          <div className="flex items-center justify-between mb-16 sm:mb-24 reveal" style={{ '--reveal-delay': '0s' } as React.CSSProperties}>
            <div className="flex items-center gap-2.5">
              <Logo className="w-8 h-8" />
              <span
                className="font-serif text-xl tracking-wide"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #f3e3bd 0%, #c9a15f 60%, #8f7136 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                DARKWORLD
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#c9e0ff] hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/login?mode=signup"
                className="px-4 py-2 rounded-lg font-semibold text-sm transition hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 45%, #a17f42 100%)',
                  color: '#241a08',
                  border: '1px solid #8f7136',
                }}
              >
                Create free account
              </Link>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto reveal" style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-2xs font-mono tracking-[0.2em] uppercase text-[#c9a15f] border border-[#c9a15f4d] mb-6">
              Offensive &amp; defensive security, hands-on
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-5">
              Stop reading about hacking.
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(90deg, #6fb2ff 0%, #9f7bea 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Start doing it.
              </span>
            </h1>
            <p className="text-[#a9c0da] text-lg leading-relaxed mb-9">
              A full offensive and defensive security curriculum, taught entirely through real interactive
              labs — a simulated terminal, real SIEM consoles, and breaches modeled on actual incidents.
              No lecture slides. No sandboxed toy problems.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login?mode=signup"
                className="px-6 py-3 rounded-lg font-serif tracking-[0.15em] uppercase text-sm transition hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 45%, #a17f42 100%)',
                  color: '#241a08',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 14px -4px rgba(201,161,95,0.6)',
                  border: '1px solid #8f7136',
                }}
              >
                Get started free &rarr;
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-lg font-semibold text-sm text-[#c9e0ff] border border-[#3f8cff4d] hover:bg-[#3f8cff14] transition"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* terminal mockup */}
          <div className="relative max-w-2xl mx-auto mt-14 reveal" style={{ '--reveal-delay': '0.22s' } as React.CSSProperties}>
            <div
              className="rounded-xl overflow-hidden font-mono text-code leading-relaxed"
              style={{
                background: 'var(--term-bg)',
                border: '1px solid #3f8cff4d',
                boxShadow: '0 0 60px -16px rgba(63,140,255,0.4), 0 30px 60px -24px rgba(0,0,0,0.7)',
              }}
            >
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#15171c] border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <span className="ml-2.5 text-2xs text-[#c9a15f]">attacker@darkworld — bash</span>
              </div>
              <div className="px-4 py-4 text-left space-y-1.5">
                <div><span className="text-[var(--term-input)]">$</span> <span className="text-[var(--term-output)]">sudo -l</span></div>
                <div className="text-[var(--term-muted)]">Matching Defaults entries for www-data on target:</div>
                <div className="text-[var(--term-muted)]">User www-data may run the following commands:</div>
                <div className="text-[var(--term-success)]">&nbsp;&nbsp;(root) NOPASSWD: /usr/bin/openssl</div>
                <div className="mt-2"><span className="text-[var(--term-input)]">$</span> <span className="text-[var(--term-output)]">openssl enc -in /root/flag.txt</span></div>
                <div className="text-[var(--term-system)]">[+] privilege escalation path confirmed</div>
                <div><span className="text-[var(--term-input)]">$</span> <span className="animate-pulse text-[var(--term-output)]">_</span></div>
              </div>
            </div>
            <div
              className="absolute -bottom-4 -right-3 sm:-right-8 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#0c2417] shadow-lg"
              style={{ background: 'linear-gradient(180deg, #8ff0a4 0%, #4ade80 100%)' }}
            >
              <IconFlag className="w-3.5 h-3.5" />
              flag captured
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 mt-20 reveal" style={{ '--reveal-delay': '0.32s' } as React.CSSProperties}>
            <Stat value={`${MODULES.length}`} label="Modules" />
            <Stat value={`${totalLessons}+`} label="Lessons" />
            <Stat value={`${totalLabs}+`} label="Hands-on labs" />
            <Stat value={`${totalFlags}+`} label="Flags to capture" />
          </div>
        </div>

        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          aria-label="Scroll down"
          className="relative mx-auto mb-6 flex flex-col items-center gap-1 text-[#7c93ae] hover:text-[#c9e0ff] transition-colors animate-bounce"
        >
          <span className="text-2xs font-mono uppercase tracking-[0.2em]">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ---------- features ---------- */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#6fb2ff] mb-2">
            Why DarkWorld
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Everything a real SOC or pentest engagement throws at you</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl p-5 border border-white/10 bg-white/[0.03] hover:border-[#c9a15f4d] hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-shadow group-hover:shadow-[0_0_18px_-4px_rgba(201,161,95,0.6)]"
                style={{ background: 'linear-gradient(180deg, #1c2f45 0%, #0e1826 100%)', border: '1px solid #c9a15f4d' }}
              >
                <Icon className="w-5 h-5 text-[#c9a15f]" />
              </div>
              <div className="font-bold text-white mb-1.5">{title}</div>
              <p className="text-sm text-[#a9c0da] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- how it works ---------- */}
      <div className="border-t border-white/10 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#6fb2ff] mb-2">
              How it works
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">From zero to first flag, fast</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {STEPS.map(({ n, title, body }, i) => (
              <div key={n} className="relative">
                <div
                  className="font-mono text-4xl font-extrabold mb-3"
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #f3e3bd 0%, #c9a15f 60%, #8f7136 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {n}
                </div>
                <div className="font-bold text-white mb-1.5">{title}</div>
                <p className="text-sm text-[#a9c0da] leading-relaxed">{body}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(100%-0.5rem)] w-6 h-px bg-gradient-to-r from-[#c9a15f66] to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- final CTA ---------- */}
      <div className="border-t border-white/10 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(63,140,255,0.12) 0%, transparent 60%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-2xs font-mono tracking-[0.2em] uppercase text-[#c9a15f] border border-[#c9a15f4d] mb-5">
            <IconUser className="w-3 h-3" /> free account, no credit card
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Create your account and start your first lab in under a minute</h2>
          <p className="text-[#a9c0da] mb-8 max-w-xl mx-auto">
            Your progress, flags, and certificates are tied to your account and synced automatically — pick up
            exactly where you left off, on any device, online or off.
          </p>
          <Link
            to="/login?mode=signup"
            className="inline-block px-7 py-3.5 rounded-lg font-serif tracking-[0.15em] uppercase text-sm transition hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 45%, #a17f42 100%)',
              color: '#241a08',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 14px -4px rgba(201,161,95,0.6)',
              border: '1px solid #8f7136',
            }}
          >
            Create free account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-[#ffffff]">{value}</div>
      <div className="text-2xs font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">{label}</div>
    </div>
  );
}