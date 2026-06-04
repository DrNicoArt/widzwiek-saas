"use client";
// Elegancki stan offline workera — przygaszony sygnet + retry (nie agresywny).
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { easeOut } from "@/lib/motion";

export default function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}
      role="status"
      className="mx-6 mt-4 flex items-center gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-warn/10 text-warn"><Icon name="eyeOff" size={18} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-graphite">Worker nie odpowiada</p>
        <p className="truncate text-xs text-muted">Uruchom backend lokalnie: <code className="rounded bg-white px-1">uvicorn widzwiek.main:app --port 8000</code></p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="focusring inline-flex items-center gap-1.5 rounded-lg border border-warn/30 px-3 py-1.5 text-xs font-medium text-warn transition-colors hover:bg-warn/10">
          <Icon name="refresh" size={15} /> Spróbuj ponownie
        </button>
      )}
    </motion.div>
  );
}
