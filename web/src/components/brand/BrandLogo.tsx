// Oficjalny logotyp (ścieżka z brand.config → public). Asset, nie rekonstrukcja.
// Sterowanie wysokością lub szerokością (width ma pierwszeństwo).
import type { CSSProperties } from "react";
import { BRAND } from "@/lib/brand";

export default function BrandLogo({
  height, width, className, alt = BRAND.name,
}: { height?: number; width?: number | string; className?: string; alt?: string }) {
  const style: CSSProperties = width != null
    ? { width, height: "auto" }
    : { height: height ?? 26, width: "auto" };
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={BRAND.assets.logo} alt={alt} style={style} className={className} draggable={false} />;
}
