"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

function Note({ icon, text }: { icon: "clock" | "alert"; text: string }) {
  return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon} size={24} /></span>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

export default function ProjectSummary() {
  const { id } = useParams<{ id: string }>();
  const { loading, found, doc } = useProject(id);
  const base = `/app/projekty/${id}`;

  if (loading) return <Note icon="clock" text="Wczytywanie materiału…" />;
  if (!found) return <Note icon="alert" text="Nie znaleziono materiału." />;
  if (!doc) return <Note icon="clock" text="Materiał jest w trakcie przetwarzania. Wynik pojawi się po zakończeniu." />;

  const cards = [
    { href: `${base}/napisy`, icon: "captions" as const, title: "Napisy", desc: `${doc.cues.length} segmentów z timingiem i statusem zgodności` },
    { href: `${base}/mowcy`, icon: "users" as const, title: "Mówcy i dźwięki", desc: `${doc.speakers.length} mówców + opisy dźwięków niewerbalnych` },
    { href: `${base}/raport`, icon: "shield" as const, title: "Szczegóły audytu WCAG", desc: doc.wcag.compliant ? "Spełnia WCAG 2.1 AA" : `${doc.wcag.stats.error_count} błędów · ${doc.wcag.stats.warning_count} ostrzeżeń` },
    { href: `${base}/eksporty`, icon: "download" as const, title: "Eksporty", desc: "Pobierz SRT, VTT, TXT, JSON" },
  ];

  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ok/30 bg-ok/5 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-ok/10 text-ok"><Icon name="checkCircle" size={20} /></span>
        <div className="flex-1">
          <p className="text-sm font-medium text-graphite">{doc.wcag.compliant ? "Materiał gotowy do publikacji jako dostępny cyfrowo" : "Materiał wymaga poprawek"}</p>
          <p className="text-xs text-muted">{doc.wcag.stats.error_count} błędów · {doc.wcag.stats.warning_count} ostrzeżeń · {doc.wcag.stats.cue_count} napisów.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={doc.wcag.compliant ? "ok" : "warn"}>{doc.wcag.compliant ? "WCAG: spełnia" : "WCAG: do poprawy"}</Badge>
          <Link href={doc.wcag.compliant ? `${base}/eksporty` : `${base}/napisy`}
            className="focusring inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">
            <Icon name={doc.wcag.compliant ? "download" : "check"} size={15} /> {doc.wcag.compliant ? "Eksportuj" : "Napraw problemy"}
          </Link>
        </div>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <motion.div key={c.title} variants={fadeUp}>
            <Link href={c.href} className="spotlight focusring group flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm transition-all hover:border-brand-200 hover:shadow-lift">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={c.icon} size={20} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-graphite">{c.title}</p><p className="mt-0.5 text-xs text-muted">{c.desc}</p></div>
              <Icon name="chevron" size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
