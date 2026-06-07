"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";
import { DEFAULT_PROCESSING_DECISION } from "@/lib/orchestration";
import { estimateCredits } from "@/lib/sampleJob";

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

  const credits = estimateCredits(doc.media.duration_ms, { speakers: true, sounds: true, wcag: true });
  const soundCount = doc.cues.filter((c) => c.kind === "sound").length;
  const nextAction = doc.wcag.compliant ? "Eksportuj materiał albo pobierz raport." : "Napraw wskazane problemy w edytorze.";
  const pipeline = doc.meta.pipeline;
  const cards = [
    { href: `${base}/napisy`, icon: "captions" as const, title: "Edytor napisów", desc: `${doc.cues.length} segmentów, problemy WCAG przypięte do cue` },
    { href: `${base}/mowcy`, icon: "users" as const, title: "Mówcy i dźwięki", desc: `${doc.speakers.length} mówców · ${soundCount} dźwięki dodane do captions` },
    { href: `${base}/napisy`, icon: "shield" as const, title: "Kontrola jakości", desc: doc.wcag.compliant ? "WCAG spełnione, gotowe do publikacji" : `${doc.wcag.stats.error_count} błędów · ${doc.wcag.stats.warning_count} ostrzeżeń` },
    { href: `${base}/eksporty`, icon: "download" as const, title: "Eksporty", desc: "Pobierz SRT, VTT, TXT, JSON" },
  ];

  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ok/30 bg-ok/5 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-ok/10 text-ok"><Icon name="checkCircle" size={20} /></span>
        <div className="flex-1">
          <p className="text-sm font-medium text-graphite">{doc.wcag.compliant ? "Materiał gotowy do publikacji jako dostępny cyfrowo" : "Materiał wymaga poprawek"}</p>
          <p className="text-xs text-muted">{doc.wcag.stats.error_count} błędów · {doc.wcag.stats.warning_count} ostrzeżeń · {doc.wcag.stats.cue_count} napisów. Następny krok: {nextAction}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={doc.wcag.compliant ? "ok" : "warn"}>{doc.wcag.compliant ? "WCAG: spełnia" : "WCAG: do poprawy"}</Badge>
          <Link href={doc.wcag.compliant ? `${base}/eksporty` : `${base}/napisy`}
            className="focusring inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">
            <Icon name={doc.wcag.compliant ? "download" : "check"} size={15} /> {doc.wcag.compliant ? "Eksportuj" : "Napraw problemy"}
          </Link>
        </div>
      </motion.div>
      <motion.div variants={fadeUp} className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="sparkles" size={17} className="text-brand-600" /> Ścieżka orkiestratora</h3>
          <div className="space-y-2">
            <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Strategia</span><span className="text-right font-medium text-graphite">Automatyczna</span></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Źródło transkryptu</span><span className="text-right font-medium text-graphite">{DEFAULT_PROCESSING_DECISION.transcriptSource}</span></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Provider transkrypcji</span><span className="text-right font-medium text-graphite">{pipeline.asr}</span></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Mówcy / dźwięki</span><span className="text-right font-medium text-graphite">{pipeline.diarization} · {pipeline.sound_events}</span></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Koszt demo</span><span className="text-right font-medium text-graphite">≈ {credits} kredytów</span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="shield" size={17} className="text-brand-600" /> Quality layer</h3>
          <p className="text-sm text-graphite">WCAG działa cały czas: w podsumowaniu jako status, w edytorze jako problemy do naprawy, a w eksporcie jako gotowość do publikacji.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DEFAULT_PROCESSING_DECISION.path.slice(2).map((p) => <span key={p} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">{p}</span>)}
          </div>
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
