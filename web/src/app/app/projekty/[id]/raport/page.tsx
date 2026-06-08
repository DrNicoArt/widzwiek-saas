"use client";
// Raport = dowód zgodności gotowy do druku/PDF (do publikacji albo kontroli).
// Na ekranie: gauge + pełna lista problemów (co dokładnie poprawić). Druk: chowa nawigację, zostaje raport.
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import WcagReport from "@/components/wcag/WcagReport";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { msToTimecode } from "@/lib/contract";
import { fadeUp, inView } from "@/lib/motion";

const SEV_LABEL: Record<string, { t: string; tone: "err" | "warn" | "info" }> = {
  error: { t: "Błąd", tone: "err" },
  warning: { t: "Ostrzeżenie", tone: "warn" },
  info: { t: "Info", tone: "info" },
};

export default function ProjectRaport() {
  const { id } = useParams<{ id: string }>();
  const { loading, doc } = useProject(id);

  if (loading || !doc) return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">{loading ? "Wczytywanie…" : "Raport pojawi się po przetwarzaniu."}</p>
    </div>
  );

  const r = doc.wcag;
  const issues = [...r.issues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : b.severity === "error" ? 1 : a.severity === "warning" ? -1 : 1));
  const today = new Date().toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });

  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-5">
      {/* Pasek akcji — nie drukuje się */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair/70 bg-white/80 px-4 py-3 shadow-card">
        <p className="text-sm text-muted">Raport zgodności WCAG 2.1 AA — dowód gotowości do publikacji albo do kontroli.</p>
        <Button icon="download" onClick={() => window.print()}>Drukuj / zapisz PDF</Button>
      </div>

      {/* Nagłówek dokumentu — widoczny tylko na druku */}
      <div className="print-only mb-4 border-b border-[#d0d7de] pb-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-graphite">Widźwięk — Raport zgodności WCAG 2.1 AA</span>
          <span className="text-sm text-muted">{today}</span>
        </div>
        <p className="mt-1 text-sm text-muted">Materiał: {doc.media.filename} · {(doc.media.duration_ms / 1000 / 60).toFixed(1)} min · język {doc.media.language}</p>
        <p className="mt-0.5 text-sm font-medium">Werdykt: {r.compliant ? "SPEŁNIA WCAG 2.1 AA — gotowe do publikacji" : "NIE SPEŁNIA — wymaga poprawek wskazanych poniżej"}</p>
      </div>

      <div className="print-card"><WcagReport report={r} /></div>

      {/* Pełna lista problemów — co dokładnie poprawić (na ekranie i na druku) */}
      <div className="print-card rounded-2xl border border-hair/70 bg-white/85 p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="shield" size={17} className="text-brand-600" /> Lista problemów do poprawy ({issues.length})</h3>
          <Badge tone={r.stats.error_count ? "err" : r.stats.warning_count ? "warn" : "ok"}>{r.stats.error_count} bł. · {r.stats.warning_count} ostrz.</Badge>
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-ok">Brak problemów. Materiał jest gotowy do publikacji jako dostępny cyfrowo.</p>
        ) : (
          <ol className="space-y-2">
            {issues.map((it, i) => {
              const sev = SEV_LABEL[it.severity] ?? SEV_LABEL.info;
              const cue = it.cue_id ? doc.cues.find((c) => c.id === it.cue_id) : null;
              return (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-hair/50 px-3 py-2 text-sm">
                  <Badge tone={sev.tone}>{sev.t}</Badge>
                  <span className="flex-1 text-graphite">{it.message}</span>
                  {cue && <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{msToTimecode(cue.start_ms)}</span>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-3 text-xs text-muted">Większość z tych problemów naprawia jednym kliknięciem przycisk „Napraw wszystko” w edytorze napisów.</p>
      </div>
    </motion.div>
  );
}
