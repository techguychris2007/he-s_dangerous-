import { useState } from 'react';
import { IconStar } from '../layout/icons';

interface StarRatingProps {
  /** current rating, 0-5. For a read-only average this can be fractional — it's rounded to the
   *  nearest star for display since this renders whole stars, not partial fills. */
  value: number;
  /** omit for a read-only display (e.g. an aggregate average); provide to make it clickable input. */
  onChange?: (rating: number) => void;
  size?: string;
}

/** Shared 5-star control — read-only when `onChange` is omitted (rounds `value` to the nearest
 *  star), interactive with hover preview when provided. One component for both the aggregate-average
 *  display on lab cards and the "rate this lab" input widget, so the two never visually drift apart. */
export default function StarRating({ value, onChange, size = 'w-4 h-4' }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onChange;
  const displayValue = hovered ?? value;

  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          aria-label={interactive ? `Rate ${star} star${star === 1 ? '' : 's'}` : undefined}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} text-[var(--color-gold)] disabled:cursor-default`}
        >
          <IconStar className={size} filled={Math.round(displayValue) >= star} />
        </button>
      ))}
    </span>
  );
}
