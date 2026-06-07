"use client";
// Żywa fala audio (Canvas). intensity (0..1) = energia sygnału; order (0..1) = "uporządkowanie"
// (fala spłaszcza się i przechodzi w równe słupki — chaos -> napisy). Lekki rAF, DPR-aware.
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export default function SignalWave({
  intensity = 1, order = 0, color = "#0057A8", height = 200, className,
}: { intensity?: number; order?: number; color?: string; height?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const p = useRef({ intensity, order });
  p.current = { intensity, order };
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, t = 0, w = 0, h = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect(); w = r.width; h = r.height || height;
      cv.width = Math.max(1, w * dpr | 0); cv.height = Math.max(1, h * dpr | 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);

    const render = () => {
      const { intensity: I, order: O } = p.current;
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      const amp = (h * 0.34) * I * (1 - O * 0.86);
      // płynne linie fali (chaos)
      const lines = [{ a: 1, f: 0.012, s: 0.6, al: 0.5 }, { a: 0.6, f: 0.02, s: 0.9, al: 0.32 }, { a: 0.35, f: 0.03, s: 1.3, al: 0.22 }];
      for (const L of lines) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) {
          const env = Math.sin((x / w) * Math.PI); // wygaszenie na brzegach
          const y = mid + Math.sin(x * L.f + t * L.s) * amp * L.a * env
            + Math.sin(x * L.f * 0.5 - t * L.s * 0.7) * amp * L.a * 0.4 * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; ctx.globalAlpha = L.al * (0.4 + I * 0.6); ctx.lineWidth = 1.6; ctx.stroke();
      }
      // uporządkowane słupki (porządek) — rosną wraz z O
      if (O > 0.02) {
        const step = 12; ctx.globalAlpha = 0.5 * O;
        for (let x = 0; x < w; x += step) {
          const bh = (Math.abs(Math.sin(x * 0.05)) * 10 + 6) * (0.6 + O);
          ctx.fillStyle = color; ctx.fillRect(x, mid - bh / 2, 2, bh);
        }
      }
      ctx.globalAlpha = 1;
    };

    if (reduce) { render(); return () => ro.disconnect(); }
    const loop = () => { t += 0.03; render(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [color, height, reduce]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height }} aria-hidden />;
}
