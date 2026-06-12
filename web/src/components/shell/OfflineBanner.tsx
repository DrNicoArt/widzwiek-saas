"use client";
// Offline — komunikat dwuwarstwowy: dla użytkownika (aplikacja działa) + dla developera (jak uruchomić).
// Przygaszony OFICJALNY sygnet + retry. Aplikacja NIE jest zepsuta, gdy worker śpi.
import { motion } from "framer-motion";
import Link from "next/link";
import BrandEye from "@/components/brand/BrandEye";
import Icon from "@/components/ui/Icon";
import { easeOut } from "@/lib/motion";

export default function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={easeOut} role="status"
      className="mx-6 mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-hair/70 bg-white/70 px-4 py-3 backdrop-blur-sm">
      <span className="grid h-11 w-16 place-items-center rounded-lg bg-white/60 ring-1 ring-hair/60">
        <BrandEye width={44} style={{ opacity: 0.35, filter: "grayscale(0.4)" }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-graphite">Silnik przetwarzania jest offline — aplikacja działa dalej</p>
        <p className="text-xs text-muted">
          Możesz obejrzeć pełny przykładowy wynik bez uruchamiania backendu.
          <span className="text-muted/80"> Dla developera: <code className="rounded bg-white/70 px-1">uvicorn widzwiek.main:app --port 8000</code></span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/app/studio?sample=1"
          className="focusring inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700">
          <Icon name="play" size={14} /> Zobacz przykład
        </Link>
        {onRetry && (
          <button onClick={onRetry}
            className="focusring inline-flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 text-xs font-medium text-graphite transition-colors hover:bg-slate-50">
            <Icon name="refresh" size={15} /> Połącz ponownie
          </button>
        )}
      </div>
    </motion.div>
  );
}
