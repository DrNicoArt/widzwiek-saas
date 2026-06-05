"use client";
// Cockpit sidebar — większy oficjalny logotyp, czysta nawigacja: aktywny "Przegląd"
// + zgrupowane pozycje "Wkrótce" (bez spamu badge'ami). Sygnet jako watermark, status workera.
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/Badge";

const SOON: { label: string; icon: IconName }[] = [
  { label: "Projekty", icon: "folder" },
  { label: "Eksporty", icon: "download" },
  { label: "Integracje", icon: "plug" },
  { label: "Ustawienia", icon: "settings" },
];

export default function Sidebar({ workerUp }: { workerUp: boolean | null }) {
  return (
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden border-r border-hair/70 bg-white/55 backdrop-blur-xl lg:flex">
      <div className="px-5 pb-3 pt-6"><BrandLogo width="170" /></div>

      <nav className="relative z-10 mt-2 flex-1 px-3">
        <button aria-current="page"
          className="relative mb-1 flex w-full items-center gap-3 rounded-xl bg-brand-50/80 px-3 py-2.5 text-sm font-medium text-brand-700 focusring">
          <motion.span layoutId="navactive" className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r bg-brand-600" />
          <Icon name="grid" size={19} className="text-brand-600" />
          <span className="flex-1 text-left">Przegląd</span>
        </button>

        <p className="mb-1 mt-5 px-3 text-[10px] font-medium uppercase tracking-wider text-muted/70">Wkrótce</p>
        {SOON.map((it) => (
          <button key={it.label} disabled title="Wkrótce"
            className="mb-0.5 flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted/55">
            <Icon name={it.icon} size={18} className="text-muted/45" />
            <span className="flex-1 text-left">{it.label}</span>
          </button>
        ))}
      </nav>

      {/* OFICJALNY sygnet jako watermark systemu */}
      <img src="/brand/sygnet.svg" alt="" aria-hidden draggable={false}
        className="pointer-events-none absolute -bottom-6 -left-10 w-[150%] max-w-none opacity-[0.06]" />

      <div className="relative z-10 border-t border-hair/70 px-5 py-4">
        <div className="rounded-xl bg-white/60 px-3 py-2.5 ring-1 ring-hair/60">
          <StatusDot tone={workerUp === false ? "err" : workerUp ? "ok" : "neutral"}
            label={workerUp === false ? "worker offline" : workerUp ? "system online" : "łączenie…"} />
          <p className="mt-1 text-[11px] text-muted">Widźwięk Pracownia · demo</p>
        </div>
      </div>
    </aside>
  );
}
