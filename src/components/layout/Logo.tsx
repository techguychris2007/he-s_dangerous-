/** Shared vector mark: teal, platinum and a legible ivory monogram. */
export default function Logo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}darkworld-mark.svg`} className={className} width={64} height={64} alt="DarkWorld" decoding="async" />;
}
