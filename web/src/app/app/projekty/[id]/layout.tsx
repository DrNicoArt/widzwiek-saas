"use client";
// Layout projektu — breadcrumb + nagłówek materiału + zakładki (Podsumowanie/Napisy/Mówcy/Raport/Eksporty).
// To tu mieszka kontekst „mój materiał", a nie globalne moduły.
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getProject } from "@/lib/projects";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";

const STATUS: Record<string, { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "gotowe" },
  processing: { tone: "info", label: "przetwarzanie" },
  review: { tone: "warn", label: "do poprawy" },
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
  const project = getProject(id);
  const base = `/app/projekty/${id}`;
  const s = project ? STATUS[project.status] : null;

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted" aria-label="Ścieżka">
        <Link href="/app/projekty" className="hover:text-brand-700">Projekty</Link>
        <Icon name="chevron" size={13} />
        <span className="truncate text-graphite">{project?.title ?? "Materiał"}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="captions" size={22} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-medium text-graphite">{project?.title ?? "Materiał nieznany"}</h1>
          {project && <p className="text-xs text-muted">{project.durationLabel} · {project.updated}</p>}
        </div>
        {s && <Badge tone={s.tone}>{s.label}</Badge>}
        {project && project.status !== "processing" && <Badge tone="ok" icon="shield">WCAG {project.wcag}%</Badge>}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-hair/70">
        {TABS.map((t) => {
          const href = t.seg ? `${base}/${t.seg}` : base;
          const active = t.seg ? pathname === href : pathname === base;
          return (
            <Link key={t.label} href={href} aria-current={active ? "page" : undefined}
              className={`focusring relative -mb-px inline-flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm transition-colors ${
                active ? "font-medium text-brand-700" : "text-muted hover:text-graphite"
              }`}>
              <Icon name={t.icon} size={15} /> {t.label}
              {active && <motion.span layoutId="projtab" className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-brand-600" />}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
