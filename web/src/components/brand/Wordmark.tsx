// Logotyp tekstowy "[widźwięk]" — czytelny i ostry (oficjalny SVG logotypu to eksport A4,
// trzymany w /public/brand do docelowej normalizacji). TODO(brand): podmiana na znormalizowany SVG.
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`select-none font-medium tracking-tight text-brand-700 ${className}`}>
      <span className="text-brand-400">[</span>widźwięk<span className="text-brand-400">]</span>
    </span>
  );
}
