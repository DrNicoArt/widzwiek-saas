"use client";
// Layout projektu — nagłówek z metadanymi + łagodne statusy + zakładki (WCAG jako warstwa, nie osobny tab).
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";

const PROC: Record<string, { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "Analiza gotowa" },
  processing: { tone: "info", label: "Przetwarzanie" },
  queued: { tone: "info", label: "W kolejce" },
  review: { tone: "ok", label: "Analiza gotowa" },
  error: { tone: "err", label: "Błąd przetwarzania" },
};

function fmtDur(ms: number): string {
  const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
function fmtDate(iso?: string): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; }
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const { title, status, found, loading, real, doc, createdAt } = useProject(id);
  const base = `/app/projekty/${id}`;
  const proc = PROC[status] ?? PROC.processing;
  const wcag = doc?.wcag ?? null;

  const meta: string[] = [];
  if (doc) {
    if (doc.media.duration_ms) meta.push(fmtDur(doc.media.duration_ms));
    meta.push(doc.media.source_kind === "video" ? "wideo" : "audio");
  }
  if (createdAt) meta.push(`utworzono ${fmtDate(createdAt)}`);

  const tabs: { seg: string; label: string; icon: IconName; count?: number }[] = [
    { seg: "", label: "Podsumowanie", icon: "grid" },
    { seg: "napisy", label: "Napisy", icon: "captions", count: doc?.cues.length },
    { seg: "mowcy", label: "Mówcy i dźwięki", icon: "users", count: doc?.speakers.length },
    { seg: "raport", label: "Raport", icon: "shield", count: wcag ? wcag.stats.error_count + wcag.stats.warning_count : undefined },
    { seg: "eksporty", label: "Eksport", icon: "download" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted" aria-label="Ścieżka">
        <Link href="/app/projekty" className="hover:text-brand-700">Projekty</Link>
        <Icon name="chevron" size={13} />
        <span className="truncate text-graphite">{loading ? "…" : found ? title : "Materiał"}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="captions" size={22} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-brand-600">Materiał</p>
          <h1 className="truncate text-xl font-medium text-graphite">{loading ? "Wczytywanie…" : found ? title : "Materiał nieznany"}</h1>
          <p className="text-xs text-muted">{meta.length ? meta.join(" · ") : (real ? "materiał wgrany (edytowalny)" : "materiał przykładowy (demo)")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {found && <Badge tone={proc.tone} icon={proc.tone === "ok" ? "checkCircle" : proc.tone === "err" ? "alert" : "clock"}>{proc.label}</Badge>}
          {wcag && (
            <Badge tone={wcag.compliant ? "ok" : "warn"} icon="shield">
              {wcag.compliant ? "WCAG: spełnia" : `WCAG: do poprawy · ${wcag.stats.error_count} bł. · ${wcag.stats.warning_count} ostrz.`}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-hair/70">
        {tabs.map((t) => {
          const href = t.seg ? `${base}/${t.seg}` : base;
          const active = t.seg ? pathname === href : pathname === base;
          return (
            <Link key={t.label} href={href} aria-current={active ? "page" : undefined}
              className={`focusring relative -mb-px inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm transition-colors ${active ? "font-medium text-brand-700" : "text-muted hover:text-graphite"}`}>
              <Icon name={t.icon} size={15} /> {t.label}
              {typeof t.count === "number" && <span className={`tnum rounded-full px-1.5 text-[10px] ${active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-muted"}`}>{t.count}</span>}
              {active && <motion.span layoutId="projtab" className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-gradient-to-r from-brand-600 to-accent-500" />}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
