/** Platform identity badge. This is a community mark, not an independently verified credential. */
export default function DarkWorldBadge({ className = 'h-28 w-28' }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}darkworld-badge.svg`} className={`${className} object-contain`} width={320} height={360} alt="DarkWorld Learning Guild badge" decoding="async" />;
}
