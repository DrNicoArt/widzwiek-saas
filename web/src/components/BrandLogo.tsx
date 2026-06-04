// BrandLogo — pelny logotyp Widzwiek (wordmark + sygnet oka).
// Renderuje oficjalny plik SVG z public/brand. NIE odrysowywac logo CSS-em,
// NIE zmieniac ksztaltu. Komponent jest przygotowany pod przyszly UI refresh
// i celowo NIE jest jeszcze wpiety w obecny flow aplikacji.
//
// Uzycie docelowe: sidebar, header, splash screen, ekrany startowe.
// Patrz docs/BRAND_UI_GUIDELINES.md.

type BrandLogoProps = {
  /** Wysokosc w px (szerokosc skaluje sie proporcjonalnie). */
  height?: number;
  className?: string;
  /** Tekst alternatywny; gdy logo jest dekoracyjne, ustaw "". */
  alt?: string;
};

export default function BrandLogo({
  height = 40,
  className,
  alt = "Widźwięk",
}: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logotyp.svg"
      alt={alt}
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      draggable={false}
    />
  );
}
