"use client";
// Spotlight — radialne swiatlo (blekit+koral) podazajace za kursorem po karcie. CSS var --mx/--my.
import { useRef, type ReactNode, type CSSProperties } from "react";

export default function Spotlight({
  children, className = "", as: Tag = "div",
}: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as React.RefObject<HTMLDivElement>} onMouseMove={onMove}
      className={`spotlight ${className}`} style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}>
      {children}
    </Comp>
  );
}
