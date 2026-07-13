import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { MODULES } from '../data/curriculum';
import { LABS } from '../data/labs';
import { SIEM_LABS } from '../labs/siemScenarios';
import Logo from '../components/layout/Logo';
import {
  IconTerminal,
  IconShieldCheck,
  IconChart,
  IconCertificate,
  IconFlask,
  IconRadar,
} from '../components/layout/icons';

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
  const totalLabs = LABS.length + SIEM_LABS.length;
  const totalFlags = LABS.reduce((n, l) => n + l.scenario.totalFlags, 0) + SIEM_LABS.reduce((n, l) => n + l.totalFlags, 0);

  return (
    <div className="min-h-screen w-full" style={{ background: 'var(--color-bg, #0a1420)' }}>
      {/* ---------- hero ---------- */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, #16293e 0%, #0a1420 55%, #060d16 100%)' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.3]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,180,214,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,180,214,0.09) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 pt-8 pb-20">
          <div className="flex items-center justify-between mb-16 sm:mb-24">
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

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-[0.2em] uppercase text-[#c9a15f] border border-[#c9a15f4d] mb-6">
              Offensive &amp; defensive security, hands-on
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
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

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 mt-16">
            <Stat value={`${MODULES.length}`} label="Modules" />
            <Stat value={`${totalLessons}+`} label="Lessons" />
            <Stat value={`${totalLabs}+`} label="Hands-on labs" />
            <Stat value={`${totalFlags}+`} label="Flags to capture" />
          </div>
        </div>
      </div>

      {/* ---------- features ---------- */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[var(--color-accent-dim, #6fb2ff)] mb-2">
            Why DarkWorld
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Everything a real SOC or pentest engagement throws at you</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl p-5 border border-white/10 bg-white/[0.03] hover:border-[#c9a15f4d] hover:bg-white/[0.05] transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
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

      {/* ---------- final CTA ---------- */}
      <div className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Create your account and start your first lab in under a minute</h2>
          <p className="text-[#a9c0da] mb-8 max-w-xl mx-auto">
            Free to use. Your progress, flags, and certificates are tied to your account so you never lose them.
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
      <div className="text-2xl sm:text-3xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7c93ae] mt-1">{label}</div>
    </div>
  );
}
