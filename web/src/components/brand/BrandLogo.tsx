// Oficjalny logotyp Widźwięk (web/public/brand/logotyp.svg). Asset, nie rekonstrukcja.
// Sterowanie wysokością lub szerokością (width ma pierwszeństwo — do wyrównania do panelu sceny).
import type { CSSProperties } from "react";

export default function BrandLogo({
  height, width, className, alt = "Widźwięk",
}: { height?: number; width?: number | string; className?: string; alt?: string }) {
  const style: CSSProperties = width != null
    ? { width, height: "auto" }
    : { height: height ?? 26, width: "auto" };
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logotyp.svg" alt={alt} style={style} className={className} draggable={false} />;
}
