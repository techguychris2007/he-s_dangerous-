import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../state/progressStore';
import Logo from '../components/layout/Logo';
import { IconUser, IconLock, IconRadar, IconShield, IconBounty, IconGear, IconBinary, IconSearch } from '../components/layout/icons';

const ROLES = [
  { label: 'Analyst', Icon: IconRadar },
  { label: 'Infiltrator', Icon: IconShield },
  { label: 'Bounty Hunter', Icon: IconBounty },
  { label: 'Engineer', Icon: IconGear },
  { label: 'Cryptographer', Icon: IconBinary },
  { label: 'Responder', Icon: IconSearch },
];

function IconFingerprint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M12 3a7 7 0 0 0-7 7v2c0 3 1 5 2 6.5" strokeLinecap="round" />
      <path d="M12 3a7 7 0 0 1 7 7v2c0 1.2-.1 2.2-.3 3.1" strokeLinecap="round" />
      <path d="M8.5 19.5C7 17.5 6.5 15.3 6.5 13v-3a5.5 5.5 0 0 1 11 0v3c0 .8-.05 1.5-.15 2.2" strokeLinecap="round" />
      <path d="M9.5 20.5C8.3 18.6 8 16.5 8 14v-4a4 4 0 0 1 8 0" strokeLinecap="round" />
      <path d="M11 21c-1.4-1.6-2-3.6-2-6v-5a3 3 0 0 1 6 0" strokeLinecap="round" />
      <path d="M13.5 21.3c-.8-1-1.3-2.6-1.3-4.3v-6.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (progress.learnerName) navigate('/', { replace: true });
  }, [progress.learnerName, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) progress.login(name.trim());
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% -10%, #16293e 0%, #0a1420 55%, #060d16 100%)',
      }}
    >
      {/* blueprint grid + faint schematic texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,180,214,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,180,214,0.09) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none select-none font-serif text-[#7fa0c4]"
        style={{ opacity: 0.08 }}
      >
        <span className="absolute top-[6%] left-[6%] text-5xl">&Sigma;</span>
        <span className="absolute top-[14%] right-[10%] text-4xl">&int;</span>
        <span className="absolute bottom-[18%] left-[8%] text-4xl">&pi;</span>
        <span className="absolute bottom-[8%] right-[8%] text-5xl">&infin;</span>
        <span className="absolute top-[45%] left-[3%] text-3xl">01001</span>
        <span className="absolute top-[50%] right-[2%] text-3xl">10110</span>
      </div>

      {/* card */}
      <div
        className="relative w-full max-w-[440px] rounded-2xl px-7 py-8 sm:px-9 sm:py-10"
        style={{
          background: 'linear-gradient(180deg, #16283b 0%, #101f30 100%)',
          border: '1px solid #c9a15f88',
          boxShadow: '0 0 0 1px rgba(201,161,95,0.15), 0 0 60px -12px rgba(63,140,255,0.35), 0 30px 60px -20px rgba(0,0,0,0.6)',
        }}
      >
        {/* corner flourishes */}
        <span aria-hidden className="absolute -top-2.5 -left-2.5 text-[#c9a15f] text-lg select-none">&#9670;</span>
        <span aria-hidden className="absolute -top-2.5 -right-2.5 text-[#c9a15f] text-lg select-none">&#9670;</span>
        <span aria-hidden className="absolute -bottom-2.5 -right-2.5 text-[#c9a15f] text-lg select-none">&#9670;</span>

        {/* header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(180deg, #1c2f45 0%, #0e1826 100%)',
              border: '1px solid #c9a15f66',
              boxShadow: 'inset 0 0 18px rgba(63,140,255,0.25), 0 0 22px -6px rgba(63,140,255,0.5)',
            }}
          >
            <Logo className="w-9 h-9" />
          </div>
          <h1
            className="font-serif text-3xl tracking-wide"
            style={{
              backgroundImage: 'linear-gradient(180deg, #f3e3bd 0%, #c9a15f 60%, #8f7136 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            HACKERHUB
          </h1>
          <p className="font-serif text-[13px] tracking-[0.2em] uppercase text-[#8fa7c4] mt-1">
            Cybersecurity Learning &middot; Login System
          </p>
        </div>

        {/* role grid (decorative — mirrors the platform's real learning tracks) */}
        <div className="mb-2">
          <div className="text-center text-[10px] font-mono tracking-[0.3em] uppercase text-[#c9a15f] mb-3">Roles</div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {ROLES.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-[#9fc1ea]"
                  style={{
                    background: 'linear-gradient(180deg, #1a2c40 0%, #0e1826 100%)',
                    border: '1px solid #c9a15f4d',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#b9c7da] text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #c9a15f66)' }} />
          <span className="font-serif text-xs tracking-[0.25em] uppercase text-[#8fa7c4]">Login System</span>
          <span className="h-px flex-1" style={{ background: 'linear-gradient(270deg, transparent, #c9a15f66)' }} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <label
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
          >
            <IconUser className="w-4 h-4 text-[#c9a15f] shrink-0" />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
            />
          </label>

          <label
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(6,13,22,0.55)', border: '1px solid #c9a15f4d' }}
          >
            <IconLock className="w-4 h-4 text-[#c9a15f] shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (not required — no accounts here)"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#e8edf5] placeholder:text-[#5f7284]"
            />
          </label>

          <button
            type="button"
            onClick={() => progress.login('Guest')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition hover:brightness-125"
            style={{ background: 'rgba(63,140,255,0.08)', border: '1px solid #3f8cff4d' }}
          >
            <IconFingerprint className="w-4 h-4 text-[#6fb2ff] shrink-0" />
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#a9c8ec]">Fingerprint Auth &mdash; Continue as Guest</span>
          </button>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-1 px-4 py-3 rounded-lg font-serif tracking-[0.2em] uppercase text-sm disabled:opacity-40 transition hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg, #e9c98a 0%, #c9a15f 45%, #a17f42 100%)',
              color: '#241a08',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 14px -4px rgba(201,161,95,0.6)',
              border: '1px solid #8f7136',
            }}
          >
            Login &rarr;
          </button>
        </form>

        <p className="text-center text-[11px] text-[#7c8ea3] mt-6 leading-relaxed">
          Everything runs locally in your browser — no account, no server, no password check. Your name just
          personalizes the portal and is stored on this device only.
        </p>
        <p className="text-center text-[10px] font-mono text-[#4d5e70] mt-2 tracking-wide">
          Session scope: local-only &middot; no data leaves this device
        </p>
      </div>
    </div>
  );
}
