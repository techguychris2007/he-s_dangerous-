import type React from 'react';
import type { ReactNode } from 'react';
import { achievementAward, type AwardDesign, type AwardFinish } from '../data/achievementAwards';
import type { AchievementIconName } from '../data/achievements';
import {
  IconBook, IconBookmark, IconBrain, IconCertificate, IconCheck, IconCode, IconCrown,
  IconCrosshair, IconFlag, IconLightning, IconMap, IconShieldCheck, IconStar, IconTrophy,
} from '../../../shared/components/layout/icons';
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

/** Flat metal tones: [rim, engraving]. One colour per finish; no sheens or gradients. */
const METALS: Record<AwardFinish, [string, string]> = {
  bronze: ['#b9804f', '#ecc7a3'],
  silver: ['#9eacbf', '#e6ecf4'],
  gold: ['#c9a15f', '#f3dfae'],
  platinum: ['#86bcc6', '#d9f2f5'],
};
const LOCKED: [string, string] = ['#4a5261', '#8a93a3'];
const ENAMEL = '#151a24';

function polygon(points: number, outer: number, inner = outer) {
  return Array.from({ length: points * (inner === outer ? 1 : 2) }, (_, i) => {
    const step = inner === outer ? 360 / points : 180 / points;
    const angle = (i * step - 90) * Math.PI / 180;
    const radius = inner !== outer && i % 2 ? inner : outer;
    return `${(64 + Math.cos(angle) * radius).toFixed(1)},${(60 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' ');
}

/** The emblem outline for each award form, centred on (64, 60). */
function Shape({ form, ...rest }: { form: AwardDesign['form'] } & React.SVGProps<SVGElement>) {
  const props = rest as React.SVGProps<SVGPathElement & SVGCircleElement & SVGPolygonElement>;
  if (form === 'crest') return <path d="M64 6 112 21v37c0 28-21 46-48 56-27-10-48-28-48-56V21z" {...props}/>;
  if (form === 'star') return <polygon points={polygon(8, 56, 47)} {...props}/>;
  if (form === 'trophy') return <polygon points={polygon(6, 56)} {...props}/>;
  return <circle cx="64" cy="60" r="53" {...props}/>;
}

/** Flat enamel insignia: a metal rim in the award's finish, a dark enamel field, an engraved tick ring,
 *  the achievement symbol and an inscription tab. The form (disc, crest, rosette, hexagon) tells awards
 *  apart at a glance; the finish tells their tier. */
export default function AchievementMark({ icon, achievementId, unlocked, size = 'md' }: AchievementMarkProps) {
  const design = achievementAward(achievementId);
  const [rim, engraving] = unlocked ? METALS[design.finish] : LOCKED;
  const Mark = ICONS[icon];
  const tab = 16 + design.inscription.length * 7;
  return <span aria-hidden="true" data-award={achievementId ?? icon} data-finish={design.finish} data-form={design.form} className={`achievement-mark achievement-mark--${unlocked ? 'earned' : 'locked'} ${SIZE[size]}`}>
    <svg className="achievement-mark__art" viewBox="0 0 128 128" focusable="false">
      <Shape form={design.form} fill={rim}/>
      <g transform="translate(64 60) scale(.84) translate(-64 -60)"><Shape form={design.form} fill={ENAMEL}/></g>
      <g transform="translate(64 60) scale(.74) translate(-64 -60)"><Shape form={design.form} fill="none" stroke={rim} strokeWidth="1.6" strokeOpacity=".55"/></g>
      <circle cx="64" cy="58" r="27" fill="none" stroke={rim} strokeWidth="3" strokeDasharray="1.2 5.8" strokeOpacity=".8"/>
      <g style={{ color: engraving }}><svg x="47" y="41" width="34" height="34" viewBox="0 0 24 24"><Mark className="achievement-mark__icon"/></svg></g>
      <rect x={64 - tab / 2} y="99" width={tab} height="19" rx="4" fill={rim} stroke={ENAMEL} strokeWidth="2.5"/>
      <text x="64" y="112.5" textAnchor="middle" fill={ENAMEL} fontFamily="var(--font-sans, inherit)" fontSize="10.5" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>{design.inscription}</text>
      {!unlocked && <g><circle cx="103" cy="99" r="12" fill={ENAMEL} stroke={engraving} strokeWidth="1.5"/><path d="M99.5 97.5v-2.5a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke={engraving} strokeWidth="1.6"/><rect x="97.5" y="97.5" width="11" height="8" rx="1.5" fill={engraving}/></g>}
    </svg>
  </span>;
}
