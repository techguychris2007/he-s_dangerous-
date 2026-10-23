/** Shared world-and-orbit mark in cobalt, ink and white. */
export default function Logo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}darkworld-mark.svg`} className={className} width={64} height={64} alt="DarkWorld" decoding="async" />;
}
