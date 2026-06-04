"use client";
// Cockpit sidebar — oficjalny logotyp, nawigacja z aktywnym stanem, OFICJALNY sygnet
// jako duży półprzezroczysty watermark, status workera.
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/Badge";

type Item = { label: string; icon: IconName; active?: boolean; soon?: boolean };
const NAV: Item[] = [
  { label: "Przegląd", icon: "grid", active: true },
  { label: "Projekty", icon: "folder", soon: true },
  { label: "Napisy", icon: "captions", soon: true },
  { label: "Mówcy i dźwięki", icon: "users", soon: true },
  { label: "Eksporty", icon: "download", soon: true },
  { label: "Integracje", icon: "plug", soon: true },
  { label: "Ustawienia", icon: "settings", soon: true },
];

export default function Sidebar({ workerUp }: { workerUp: boolean | null }) {
  return (
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden border-r border-hair/70 bg-white/55 backdrop-blur-xl lg:flex">
      <div className="px-5 py-6"><BrandLogo height={24} /></div>

      <nav className="relative z-10 mt-1 flex-1 px-3">
        {NAV.map((it) => (
          <button
            key={it.label} aria-current={it.active ? "page" : undefined} disabled={it.soon}
            title={it.soon ? "Wkrótce" : undefined}
            className={[
              "relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focusring",
              it.active ? "bg-brand-50/80 font-medium text-brand-700"
                : it.soon ? "text-muted/55 hover:bg-white/60" : "text-graphite hover:bg-brand-50/60",
            ].join(" ")}
          >
            {it.active && <motion.span layoutId="navactive" className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r bg-brand-600" />}
            <Icon name={it.icon} size={19} className={it.active ? "text-brand-600" : "text-muted"} />
            <span className="flex-1 text-left">{it.label}</span>
            {it.soon && <span className="rounded bg-slate-100/80 px-1.5 py-0.5 text-[10px] text-muted">wkrótce</span>}
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
          <p className="mt-1 text-[11px] text-muted">Widźwięk Pracownia · PoC</p>
        </div>
      </div>
    </aside>
  );
}
