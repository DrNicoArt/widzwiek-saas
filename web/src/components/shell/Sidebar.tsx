"use client";
import { motion } from "framer-motion";
import EyeMark from "@/components/brand/EyeMark";
import Wordmark from "@/components/brand/Wordmark";
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
    <aside className="relative hidden w-64 shrink-0 flex-col border-r border-hair bg-white/70 backdrop-blur-md lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <EyeMark size={26} pulse={false} />
        <Wordmark className="text-lg" />
      </div>

      <nav className="mt-2 flex-1 px-3">
        {NAV.map((it) => (
          <button
            key={it.label}
            aria-current={it.active ? "page" : undefined}
            disabled={it.soon}
            title={it.soon ? "Wkrótce" : undefined}
            className={[
              "focusring group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              it.active
                ? "bg-brand-50 font-medium text-brand-700"
                : it.soon
                ? "text-muted/60 hover:bg-slate-50"
                : "text-graphite hover:bg-brand-50",
            ].join(" ")}
          >
            {it.active && (
              <motion.span layoutId="navactive" className="absolute left-0 h-7 w-1 rounded-r bg-brand-600" />
            )}
            <Icon name={it.icon} size={19} className={it.active ? "text-brand-600" : "text-muted"} />
            <span className="flex-1 text-left">{it.label}</span>
            {it.soon && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-muted">wkrótce</span>}
          </button>
        ))}
      </nav>

      <div aria-hidden className="pointer-events-none absolute -left-6 bottom-24 opacity-[0.06]">
        <EyeMark size={190} pulse={false} />
      </div>

      <div className="border-t border-hair px-5 py-4">
        <div className="rounded-xl bg-brand-50/60 px-3 py-2.5">
          <StatusDot tone={workerUp === false ? "err" : workerUp ? "ok" : "neutral"}
            label={workerUp === false ? "worker offline" : workerUp ? "worker online" : "łączenie…"} />
          <p className="mt-1 text-[11px] text-muted">Widźwięk Pracownia · PoC</p>
        </div>
      </div>
    </aside>
  );
}
