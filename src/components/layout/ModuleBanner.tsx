import { ModuleIcon } from './icons';
import networkingPhoto from '../../assets/banners/networking.jpg';
import linuxPhoto from '../../assets/banners/linux.jpg';
import reconPhoto from '../../assets/banners/recon.jpg';
import webappPhoto from '../../assets/banners/webapp.jpg';
import redteamPhoto from '../../assets/banners/redteam.jpg';
import pythonPhoto from '../../assets/banners/python.jpg';
import bugbountyPhoto from '../../assets/banners/bugbounty.jpg';
import socPhoto from '../../assets/banners/soc.jpg';
import forensicsPhoto from '../../assets/banners/forensics.jpg';
import cloudPhoto from '../../assets/banners/cloud.jpg';
import securityplusPhoto from '../../assets/banners/securityplus.jpg';
import binaryanalysisPhoto from '../../assets/banners/binaryanalysis.jpg';
import malwarePhoto from '../../assets/banners/malware.jpg';
import secengineeringPhoto from '../../assets/banners/secengineering.jpg';

interface BannerConfig {
  from: string;
  to: string;
  pattern: 'grid' | 'dots' | 'circuit' | 'scan';
  /** background photo rendered under the gradient tint */
  photo?: string;
  /** how the photo should sit in its frame */
  fit?: 'cover' | 'contain';
}

const BANNERS: Record<string, BannerConfig> = {
  networking: { from: '#0f2a4a', to: '#1c4f82', pattern: 'circuit', photo: networkingPhoto, fit: 'cover' },
  linux: { from: '#0d1b12', to: '#1f4d2e', pattern: 'grid', photo: linuxPhoto, fit: 'cover' },
  recon: { from: '#0c2a2e', to: '#125e63', pattern: 'scan', photo: reconPhoto, fit: 'cover' },
  python: { from: '#12294f', to: '#d9a441', pattern: 'dots', photo: pythonPhoto, fit: 'cover' },
  webapp: { from: '#241247', to: '#5b2a8c', pattern: 'grid', photo: webappPhoto, fit: 'cover' },
  redteam: { from: '#3a0d0d', to: '#7a1f1f', pattern: 'circuit', photo: redteamPhoto, fit: 'cover' },
  bugbounty: { from: '#0d2e1f', to: '#1f8a53', pattern: 'dots', photo: bugbountyPhoto, fit: 'cover' },
  soc: { from: '#062633', to: '#0d7d94', pattern: 'scan', photo: socPhoto, fit: 'cover' },
  forensics: { from: '#1a1220', to: '#4a2d63', pattern: 'grid', photo: forensicsPhoto, fit: 'cover' },
  cloud: { from: '#0a2a4f', to: '#2f6fed', pattern: 'dots', photo: cloudPhoto, fit: 'cover' },
  securityplus: { from: '#1a2a1a', to: '#16305c', pattern: 'grid', photo: securityplusPhoto, fit: 'cover' },
  binaryanalysis: { from: '#1a1a2e', to: '#3a1f5c', pattern: 'circuit', photo: binaryanalysisPhoto, fit: 'cover' },
  malware: { from: '#1a0d0d', to: '#4a1f1f', pattern: 'scan', photo: malwarePhoto, fit: 'cover' },
  secengineering: { from: '#0d1a2a', to: '#2a4a6e', pattern: 'dots', photo: secengineeringPhoto, fit: 'cover' },
};

function PatternDefs({ id, pattern }: { id: string; pattern: BannerConfig['pattern'] }) {
  if (pattern === 'grid') {
    return (
      <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M18 0H0V18" fill="none" stroke="white" strokeOpacity="0.08" />
      </pattern>
    );
  }
  if (pattern === 'dots') {
    return (
      <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill="white" fillOpacity="0.14" />
      </pattern>
    );
  }
  if (pattern === 'scan') {
    return (
      <pattern id={id} width="100%" height="10" patternUnits="userSpaceOnUse">
        <rect width="100%" height="1" y="4" fill="white" fillOpacity="0.07" />
      </pattern>
    );
  }
  return (
    <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M0 15h12M18 15h12M15 0v12M15 18v12" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
      <circle cx="15" cy="15" r="2" fill="white" fillOpacity="0.12" />
    </pattern>
  );
}

export default function ModuleBanner({ icon, moduleId, className }: { icon: string; moduleId: string; className?: string }) {
  const cfg = BANNERS[moduleId] ?? BANNERS.linux;
  const gradId = `grad-${moduleId}`;
  const patId = `pat-${moduleId}`;

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ background: cfg.from }}>
      {cfg.photo && (
        <img
          src={cfg.photo}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full ${cfg.fit === 'contain' ? 'object-contain p-6 opacity-80' : 'object-cover opacity-45'}`}
        />
      )}
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={cfg.from} stopOpacity={cfg.photo ? 0.55 : 1} />
            <stop offset="100%" stopColor={cfg.to} stopOpacity={cfg.photo ? 0.55 : 1} />
          </linearGradient>
          <PatternDefs id={patId} pattern={cfg.pattern} />
        </defs>
        <rect width="400" height="160" fill={`url(#${gradId})`} />
        <rect width="400" height="160" fill={`url(#${patId})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
          <ModuleIcon icon={icon} className="w-7 h-7" />
        </span>
      </div>
    </div>
  );
}
