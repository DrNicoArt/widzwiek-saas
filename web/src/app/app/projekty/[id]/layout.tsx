"use client";
// Layout projektu — breadcrumb + naglowek materialu (realny job workera albo demo) + zakladki.
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";

const STATUS: Record<string, { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "gotowe" },
  processing: { tone: "info", label: "przetwarzanie" },
  queued: { tone: "info", label: "w kolejce" },
  review: { tone: "warn", label: "do poprawy" },
  error: { tone: "err", label: "błąd" },
};

const TABS: { seg: string; label: string; icon: IconName }[] = [
  { seg: "", label: "Podsumowanie", icon: "grid" },
  { seg: "napisy", label: "Napisy", icon: "captions" },
  { seg: "mowcy", label: "Mówcy i dźwięki", icon: "users" },
  { seg: "raport", label: "Raport WCAG", icon: "shield" },
  { seg: "eksporty", label: "Eksporty", icon: "download" },
];

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const { title, status, found, loading, real, doc } = useProject(id);
  const base = `/app/projekty/${id}`;
  const s = STATUS[status] ?? STATUS.processing;
  const wcag = doc ? doc.wcag : null;

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted" aria-label="Ścieżka">
        <Link href="/app/projekty" className="hover:text-brand-700">Projekty</Link>
        <Icon name="chevron" size={13} />
        <span className="truncate text-graphite">{loading ? "…" : found ? title : "Materiał"}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="captions" size={22} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-medium text-graphite">{loading ? "Wczytywanie…" : found ? title : "Materiał nieznany"}</h1>
          <p className="text-xs text-muted">{real ? "materiał wgrany (edytowalny)" : "materiał przykładowy (demo)"}</p>
        </div>
        {found && <Badge tone={s.tone}>{s.label}</Badge>}
        {wcag && <Badge tone={wcag.compliant ? "ok" : "err"} icon="shield">WCAG {wcag.compliant ? "TAK" : "NIE"}</Badge>}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-hair/70">
        {TABS.map((t) => {
          const href = t.seg ? `${base}/${t.seg}` : base;
          const active = t.seg ? pathname === href : pathname === base;
          return (
            <Link key={t.label} href={href} aria-current={active ? "page" : undefined}
              className={`focusring relative -mb-px inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm transition-colors ${active ? "font-medium text-brand-700" : "text-muted hover:text-graphite"}`}>
              <Icon name={t.icon} size={15} /> {t.label}
              {active && <motion.span layoutId="projtab" className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-gradient-to-r from-brand-600 to-accent-500" />}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
