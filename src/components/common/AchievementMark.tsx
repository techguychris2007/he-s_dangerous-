import type { ReactNode } from 'react';
import type { AchievementIconName } from '../../data/achievements';
import {
  IconBook, IconBookmark, IconBrain, IconCertificate, IconCheck, IconCode, IconCrown,
  IconCrosshair, IconFlag, IconLightning, IconLock, IconMap, IconShieldCheck, IconStar, IconTrophy,
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
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<AchievementMarkProps['size']>, string> = {
  sm: 'achievement-mark--sm',
  md: 'achievement-mark--md',
  lg: 'achievement-mark--lg',
};

/** A consistent, scalable insignia for unlocked and locked platform achievements. */
export default function AchievementMark({ icon, unlocked, size = 'md' }: AchievementMarkProps) {
  const Mark = unlocked ? ICONS[icon] : IconLock;
  return (
    <span
      aria-hidden="true"
      className={`achievement-mark achievement-mark--${unlocked ? 'earned' : 'locked'} ${SIZE[size]}`}
    >
      <Mark className="achievement-mark__icon" />
    </span>
  );
}
