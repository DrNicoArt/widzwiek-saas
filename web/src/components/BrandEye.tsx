// BrandEye — sam sygnet oka Widzwiek. Renderuje oficjalny plik SVG z public/brand.
// NIE zastepowac ikona oka z bibliotek (lucide, heroicons itp.) — to element
// identyfikacji wizualnej, nie generyczna ikona. NIE zmieniac ksztaltu.
//
// Uzycie docelowe: ikona aplikacji, loading state, watermark, status procesu.
// Komponent przygotowany pod przyszly UI refresh; nie jest jeszcze wpiety we flow.
// Patrz docs/BRAND_UI_GUIDELINES.md.

type BrandEyeProps = {
  /** Rozmiar boku w px. */
  size?: number;
  className?: string;
  /** true = element dekoracyjny (alt="", aria-hidden). */
  decorative?: boolean;
};

export default function BrandEye({
  size = 32,
  className,
  decorative = true,
}: BrandEyeProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/sygnet.svg"
      alt={decorative ? "" : "Widźwięk"}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
      draggable={false}
    />
  );
}
