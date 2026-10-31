import { useId, type ReactNode } from 'react';
import { achievementAward, type AwardFinish } from '../../data/achievementAwards';
import type { AchievementIconName } from '../../data/achievements';
import {
  IconBook, IconBookmark, IconBrain, IconCertificate, IconCheck, IconCode, IconCrown,
  IconCrosshair, IconFlag, IconLightning, IconMap, IconShieldCheck, IconStar, IconTrophy,
} from '../layout/icons';
import './achievement-mark.css';

const ICONS: Record<AchievementIconName, (props: { className?: string }) => ReactNode> = {
  flag: IconFlag,
  book: IconBook,
  target: IconCrosshair,
  trophy: IconTrophy,
  crown: IconCrown,
  code: IconCode,
  brain: IconBrain,
  check: IconCheck,
  certificate: IconCertificate,
  bookmark: IconBookmark,
  shield: IconShieldCheck,
  lightning: IconLightning,
  star: IconStar,
  map: IconMap,
  medal: IconTrophy,
};

interface AchievementMarkProps {
  icon: AchievementIconName;
  achievementId?: string;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<AchievementMarkProps['size']>, string> = {
  sm: 'achievement-mark--sm',
  md: 'achievement-mark--md',
  lg: 'achievement-mark--lg',
};

const METALS: Record<AwardFinish, [string, string, string]> = {
  bronze: ['#f4d0b0', '#bd8457', '#75472f'],
  silver: ['#f1f6ff', '#aab9cd', '#53617b'],
  gold: ['#fff0b9', '#d0a14d', '#795125'],
  platinum: ['#effcff', '#b5d9df', '#4c798b'],
};
function starPoints() {
  return Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 - 90) * Math.PI / 180;
    const radius = i % 2 ? 35 : 46;
    return `${64 + Math.cos(angle) * radius},${91 + Math.sin(angle) * radius}`;
  }).join(' ');
}

/** Original sculpted vector awards: woven ribbons, machined rims and engraved achievement symbols. */
export default function AchievementMark({ icon, achievementId, unlocked, size = 'md' }: AchievementMarkProps) {
  const id = 'award' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const design = achievementAward(achievementId);
  const [light, metal, shade] = unlocked ? METALS[design.finish] : ['#d6dde7', '#8995a7', '#536176'];
  const Mark = ICONS[icon];
  const fill = `url(#${id}metal)`;
  const edge = `url(#${id}edge)`;
  const ribbon = design.finish === 'platinum' ? '#41768b' : design.finish === 'silver' ? '#3a687b' : '#495799';
  return <span aria-hidden="true" data-award={achievementId ?? icon} data-finish={design.finish} data-form={design.form} className={`achievement-mark achievement-mark--${unlocked ? 'earned' : 'locked'} ${SIZE[size]}`}>
    <svg className="achievement-mark__art" viewBox="0 0 128 152" focusable="false">
      <defs>
        <linearGradient id={`${id}metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light}/><stop offset=".22" stopColor={metal}/><stop offset=".46" stopColor={light}/><stop offset=".62" stopColor={metal}/><stop offset="1" stopColor={shade}/></linearGradient>
        <linearGradient id={`${id}edge`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={light}/><stop offset=".5" stopColor={shade}/><stop offset="1" stopColor={metal}/></linearGradient>
        <radialGradient id={`${id}face`} cx=".35" cy=".25"><stop stopColor={light}/><stop offset=".75" stopColor={metal}/><stop offset="1" stopColor={shade}/></radialGradient>
        <linearGradient id={`${id}ribbon`} x1="0" x2="1"><stop stopColor="#172036"/><stop offset=".4" stopColor={ribbon}/><stop offset=".6" stopColor={ribbon}/><stop offset="1" stopColor="#172036"/></linearGradient>
      </defs>
      <ellipse cx="64" cy="144" rx="35" ry="5" fill="#0f1424" opacity=".13"/>
      {design.form === 'trophy' ? <g>
        <path d="M37 44H20v17c0 20 14 28 28 29m43-46h17v17c0 20-14 28-28 29" fill="none" stroke={edge} strokeWidth="8"/>
        <path d="M58 96h12v30H58z" fill={edge}/><path d="M38 123h52l6 13H32z" fill={fill} stroke={shade} strokeWidth="2"/>
        <path d="M35 29h58v35c0 24-12 38-29 38S35 88 35 64z" fill={fill} stroke={shade} strokeWidth="2"/>
        <path d="M41 34h8v30c0 13 2 22 6 27-9-5-14-16-14-30z" fill={light} opacity=".48"/>
        <path d="M36 32h56" stroke={light} strokeWidth="4"/>
        <text x="64" y="69" textAnchor="middle" fill={shade} fontFamily="var(--font-mono)" fontSize={design.inscription.length > 2 ? 18 : 24} fontWeight="700">{design.inscription}</text>
        <path d="m64 77 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" fill={shade} opacity=".65"/>
        <rect x="43" y="125" width="42" height="8" rx="1" fill="#172036"/><text x="64" y="131" textAnchor="middle" fill={light} fontSize="5.4" fontWeight="700" letterSpacing="1">DARKWORLD</text>
      </g> : <g>
        <path d="M29 8h29l20 49-26 15z" fill={`url(#${id}ribbon)`}/><path d="M70 8h29L76 72 50 57z" fill={`url(#${id}ribbon)`}/>
        <path d="m36 8 23 55m32-55L68 63" fill="none" stroke={metal} strokeWidth="3"/>
        <path d="M29 8h29m12 0h29" stroke="#a3aeff" strokeOpacity=".45" strokeWidth="2"/>
        <rect x="53" y="46" width="22" height="11" rx="5" fill={edge} stroke={shade}/>
        {design.form === 'crest' ? <path d="m64 48 41 15v32c0 21-19 37-41 44-22-7-41-23-41-44V63z" fill={edge} stroke={shade} strokeWidth="2"/> : design.form === 'star' ? <polygon points={starPoints()} fill={edge} stroke={shade} strokeWidth="2"/> : <circle cx="64" cy="91" r="44" fill={edge} stroke={shade} strokeWidth="2"/>}
        <circle cx="64" cy="91" r="37" fill={fill} stroke={light} strokeWidth="1.2"/>
        <circle cx="64" cy="91" r="33" fill={`url(#${id}face)`} stroke={shade} strokeWidth=".8"/>
        <circle cx="64" cy="91" r="40" fill="none" stroke={light} strokeWidth="1.5" strokeDasharray=".7 3" opacity=".7"/>
        <path d="M35 80a32 32 0 0 1 45-16" fill="none" stroke={light} strokeWidth="2" opacity=".7"/>
        <g style={{ color: shade }}><svg x="48" y="72" width="32" height="32" viewBox="0 0 24 24"><Mark className="achievement-mark__icon"/></svg></g>
        <path d="M43 109c5 6 12 8 21 8s16-2 21-8" fill="none" stroke={shade} strokeWidth="1" opacity=".65"/>
        <text x="64" y="125" textAnchor="middle" fill={shade} fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="700" letterSpacing="1">{design.inscription}</text>
        <circle cx="40" cy="91" r="1.5" fill={shade}/><circle cx="88" cy="91" r="1.5" fill={shade}/>
      </g>}
      {!unlocked && <g><circle cx="104" cy="126" r="13" fill="#172036" stroke="#aab9cd"/><path d="M100 124v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#d9e2ef" strokeWidth="1.5"/><rect x="98" y="124" width="12" height="9" rx="2" fill="none" stroke="#d9e2ef" strokeWidth="1.5"/></g>}
    </svg>
  </span>;
}
