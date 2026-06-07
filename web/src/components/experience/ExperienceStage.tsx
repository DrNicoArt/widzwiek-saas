"use client";
// Widźwięk — immersive entry (route /). Scena-narracja: intro → sygnał → skan → porządek →
// zgodność → akcja. Auto-play w 1. viewportcie. Oficjalny logotyp (duży) + sygnet (centralny).
// prefers-reduced-motion → finalny kadr. Lekkie animacje, build stabilny.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import BrandEye from "@/components/brand/BrandEye";
import Icon from "@/components/ui/Icon";
import { checkHealth } from "@/lib/api";
import SignalWave from "./SignalWave";
import CaptionStream from "./CaptionStream";
import ComplianceRing from "./ComplianceRing";

const WAVE: Record<number, { intensity: number; order: number }> = {
  0: { intensity: 0.45, order: 0 }, 1: { intensity: 1, order: 0 }, 2: { intensity: 1, order: 0.18 },
  3: { intensity: 0.8, order: 0.9 }, 4: { intensity: 0.6, order: 1 }, 5: { intensity: 0.6, order: 1 },
};
const FEATURES = ["Transkrypcja", "Mówcy", "Dźwięki niewerbalne", "Raport WCAG", "Eksport SRT/VTT"];

export default function ExperienceStage() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [step, setStep] = useState(reduce ? 5 : 0);
  const [leaving, setLeaving] = useState(false);
  const [workerUp, setWorkerUp] = useState<boolean | null>(null);

  useEffect(() => {
    if (reduce) return;
    const at = [120, 700, 1800, 3000, 4200, 5200];
    const timers = at.map((ms, i) => setTimeout(() => setStep(i), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  useEffect(() => { checkHealth().then(setWorkerUp).catch(() => setWorkerUp(false)); }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => router.push("/app"), reduce ? 0 : 460);
    return () => clearTimeout(t);
  }, [leaving, reduce, router]);

  const mx = useMotionValue(0.5), my = useMotionValue(0.42);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 }), sy = useSpring(my, { stiffness: 40, damping: 20 });
  const lx = useTransform(sx, (v) => `${v * 100}%`), ly = useTransform(sy, (v) => `${v * 100}%`);
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => { mx.set(e.clientX / innerWidth); my.set(e.clientY / innerHeight); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  const w = WAVE[step];
  const showCaptions = step >= 3, showRing = step >= 4, ready = step >= 5;

  return (
    <motion.div
      animate={leaving ? { opacity: 0, scale: 1.04, filter: "blur(6px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-dvh overflow-hidden bg-ice"
    >
      <motion.div aria-hidden className="pointer-events-none absolute h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: lx, top: ly, background: "radial-gradient(closest-side, rgba(0,87,168,0.12), rgba(0,87,168,0))" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(7,55,99,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(7,55,99,0.04) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(120% 80% at 50% 42%, black 35%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(120% 80% at 50% 42%, black 35%, transparent 78%)",
      }} />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
        <header className="flex items-start justify-between pt-9">
          <motion.div initial={{ opacity: 0, y: -10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <BrandLogo width="min(440px, 46vw)" />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-hair/70 bg-white/60 px-3 py-1.5 text-xs text-muted backdrop-blur-sm">
            <motion.span className={`h-2 w-2 rounded-full ${workerUp === false ? "bg-warn" : "bg-ok"}`}
              animate={workerUp === false || reduce ? undefined : { scale: [1, 1.3, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
            {workerUp === false ? "system uśpiony" : "system online"}
          </motion.div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-7 py-8">
          <div className="text-center">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
              className="text-3xl font-medium leading-tight tracking-tight text-graphite md:text-5xl">
              Zobacz to, <span className="text-brand-600">co inni słyszą.</span>
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
              className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
              Napisy dostępnościowe zgodne z WCAG dla polskiego audio i wideo — transkrypcja, mówcy,
              dźwięki niewerbalne, raport zgodności i eksport SRT/VTT.
            </motion.p>
          </div>

          <div className="grid w-full items-center gap-8 md:grid-cols-2">
            <div className="relative grid h-[300px] place-items-center">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2"><SignalWave intensity={w.intensity} order={w.order} height={240} /></div>
              <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 22 }} className="relative">
                <div className="absolute -inset-10 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.14), rgba(0,87,168,0))" }} />
                <div className="relative overflow-hidden">
                  <BrandEye width={210} breathe />
                  <motion.div aria-hidden className="absolute inset-y-0 w-1/3"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(0,87,168,0.35), transparent)" }}
                    initial={{ x: "-140%", opacity: 0 }}
                    animate={step === 2 && !reduce ? { x: ["-140%", "240%"], opacity: [0, 1, 0] } : { opacity: 0 }}
                    transition={{ duration: 1.15, ease: "easeInOut" }} />
                </div>
              </motion.div>
            </div>
            <div className="flex justify-center md:justify-start"><CaptionStream show={showCaptions} /></div>
          </div>

          <div className="min-h-[112px] w-full max-w-xl"><ComplianceRing show={showRing} /></div>

          {/* pasek funkcji produktu */}
          <motion.ul initial="hidden" animate={ready ? "show" : "hidden"} variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="flex flex-wrap justify-center gap-2">
            {FEATURES.map((f) => (
              <motion.li key={f} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="inline-flex items-center gap-1.5 rounded-full border border-hair/70 bg-white/70 px-3 py-1.5 text-xs text-graphite backdrop-blur-sm">
                <Icon name="check" size={13} className="text-ok" /> {f}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-2">
            <motion.button onClick={() => setLeaving(true)} whileTap={{ scale: 0.97 }}
              animate={ready && !reduce ? { boxShadow: ["0 0 0 0 rgba(0,87,168,0)", "0 0 0 8px rgba(0,87,168,0.10)", "0 0 0 0 rgba(0,87,168,0)"] } : {}}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="focusring inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-medium text-white shadow-lift transition-colors hover:bg-brand-700">
              <Icon name="play" size={18} /> Otwórz demo
            </motion.button>
            <p className="text-xs text-muted">Demo działa w trybie mock — bez kluczy API.</p>
          </motion.div>
        </main>

        <footer className="pb-6 text-center text-xs text-muted">SubrosAI · Widźwięk · inteligentne laboratorium audio</footer>
      </div>
    </motion.div>
  );
}
