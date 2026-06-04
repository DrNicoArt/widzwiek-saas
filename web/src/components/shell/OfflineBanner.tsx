"use client";
// Offline — elegancko: przygaszony OFICJALNY sygnet + "zatrzymany sygnał" + retry.
import { motion } from "framer-motion";
import BrandEye from "@/components/brand/BrandEye";
import Icon from "@/components/ui/Icon";
import { easeOut } from "@/lib/motion";

export default function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={easeOut} role="status"
      className="mx-6 mt-4 flex items-center gap-4 rounded-2xl border border-warn/30 bg-warn/5 px-4 py-3 backdrop-blur-sm">
      <span className="grid h-11 w-16 place-items-center rounded-lg bg-white/60 ring-1 ring-hair/60">
        <BrandEye width={44} style={{ opacity: 0.35, filter: "grayscale(0.4)" }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-graphite">Brak sygnału — worker nie odpowiada</p>
        <p className="truncate text-xs text-muted">Uruchom backend: <code className="rounded bg-white/70 px-1">uvicorn widzwiek.main:app --port 8000</code></p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="focusring inline-flex items-center gap-1.5 rounded-lg border border-warn/30 px-3 py-1.5 text-xs font-medium text-warn transition-colors hover:bg-warn/10">
          <Icon name="refresh" size={15} /> Połącz ponownie
        </button>
      )}
    </motion.div>
  );
}
