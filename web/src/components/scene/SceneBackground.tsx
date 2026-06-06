"use client";
// Warstwa głębi (immersive L3) — fixed, za całym UI:
//  • gradient + radialne światło błękitne podążające za kursorem,
//  • DRUGA aurora w kolorze akcentu (koral), dryfująca w przeciwfazie — przełamanie błękitu,
//  • półprzezroczysty OFICJALNY sygnet (parallax + oddech),
//  • żywy waveform (błękit + pasmo akcentu) na dole, subtelne scan-lines.
// pointer-events: none; respektuje prefers-reduced-motion.
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import WaveformField from "./WaveformField";

export default function SceneBackground() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.3);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  const lightX = useTransform(sx, (v) => `${v * 100}%`);
  const lightY = useTransform(sy, (v) => `${v * 100}%`);
  // aurora akcentu — w przeciwfazie do kursora
  const accX = useTransform(sx, (v) => `${(1 - v) * 100}%`);
  const accY = useTransform(sy, (v) => `${(1 - v) * 100}%`);
  const eyeX = useTransform(sx, (v) => (v - 0.5) * 26);
  const eyeY = useTransform(sy, (v) => (v - 0.5) * 18);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* radialne światło błękitne podążające za akcją/kursorem */}
      <motion.div
        className="absolute h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: lightX, top: lightY, background: "radial-gradient(closest-side, rgba(0,87,168,0.10), rgba(0,87,168,0))" }}
      />
      {/* aurora akcentu (koral) */}
      <motion.div
        className="absolute h-[52vh] w-[52vh] -translate-x-1/2 -translate-y-1/2 rounded-full animate-aurora"
        style={{ left: accX, top: accY, background: "radial-gradient(closest-side, rgba(251,94,38,0.10), rgba(251,94,38,0))" }}
      />
      {/* trzecia plama mgly (fiolet) - bogatsza aurora, wolny dryf */}
      <div className="absolute left-[8%] top-[18%] h-[40vh] w-[40vh] rounded-full animate-meshA"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.07), rgba(124,58,237,0))" }} aria-hidden />
      <div className="absolute right-[12%] bottom-[14%] h-[36vh] w-[36vh] rounded-full animate-meshB"
        style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.07), rgba(0,87,168,0))" }} aria-hidden />
      {/* OFICJALNY sygnet jako watermark systemu */}
      <motion.img
        src="/brand/sygnet.svg" alt="" draggable={false}
        className="absolute -right-24 top-10 w-[44vw] max-w-[760px] opacity-[0.05]"
        style={{ x: eyeX, y: eyeY }}
        animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* żywy waveform na dole (błękit + pasmo akcentu) */}
      <div className="absolute inset-x-0 bottom-0">
        <WaveformField live={!reduce} accentColor="#FB5E26" baseOpacity={0.07} height={260} />
      </div>
      {/* scan-lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(7,55,99,0.025) 0px, rgba(7,55,99,0.025) 1px, transparent 1px, transparent 4px)",
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }} />
    </div>
  );
}
