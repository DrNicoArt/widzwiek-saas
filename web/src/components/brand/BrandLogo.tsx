// Oficjalny logotyp Widźwięk (web/public/brand/logotyp.svg). Asset, nie rekonstrukcja.
export default function BrandLogo({
  height = 26, className, alt = "Widźwięk",
}: { height?: number; className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logotyp.svg" alt={alt} style={{ height, width: "auto" }} className={className} draggable={false} />;
}
