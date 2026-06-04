"use client";
// Żywy waveform (Canvas) — warstwa ruchu tła i ekranu processing. Lekki rAF, DPR-aware.
// L2/L3. prefers-reduced-motion -> statyczny kształt.
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export default function WaveformField({
  className, color = "#0057A8", baseOpacity = 0.10, live = true, height = 220,
}: { className?: string; color?: string; baseOpacity?: number; live?: boolean; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let raf = 0, t = 0, w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height || height;
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);

    const wave = (phase: number, amp: number, freq: number, yBase: number, alpha: number) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = yBase
          + Math.sin(x * freq + phase) * amp
          + Math.sin(x * freq * 0.5 + phase * 1.7) * amp * 0.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1.5; ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.5;
      const e = live ? 1 : 0.5;
      wave(t * 0.6, 16 * e, 0.012, mid, baseOpacity * 1.4);
      wave(t * 0.9 + 2, 26 * e, 0.018, mid, baseOpacity);
      wave(t * 0.4 + 4, 12 * e, 0.009, mid, baseOpacity * 0.8);
      // delikatne słupki sygnału
      ctx.globalAlpha = baseOpacity * 1.2;
      for (let x = 0; x < w; x += 16) {
        const bh = (Math.abs(Math.sin(x * 0.02 + t * (live ? 1 : 0.3))) * (live ? 36 : 14) + 4);
        ctx.fillStyle = color;
        ctx.fillRect(x, mid - bh / 2, 2, bh);
      }
      ctx.globalAlpha = 1;
    };

    if (reduce) { draw(); return () => ro.disconnect(); }
    const loop = () => { t += 0.02; draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [color, baseOpacity, live, height, reduce]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height }} aria-hidden />;
}
