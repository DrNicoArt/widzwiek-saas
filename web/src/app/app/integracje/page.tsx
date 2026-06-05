"use client";
// Integracje — status integracji zewnętrznych (lustro docs/EXTERNAL_APIS.md). Demo nie wymaga żadnej.
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

type St = "mock" | "api-ready" | "placeholder" | "planned" | "later";
const TONE: Record<St, Tone> = { mock: "ok", "api-ready": "info", placeholder: "warn", planned: "neutral", later: "neutral" };
const ROWS: { name: string; icon: IconName; status: St; env: string; demo: string }[] = [
  { name: "Transkrypcja (OpenAI)", icon: "mic", status: "api-ready", env: "OPENAI_API_KEY", demo: "mock" },
  { name: "Ekstrakcja audio (ffmpeg)", icon: "file", status: "api-ready", env: "—", demo: "pomijane" },
  { name: "Diaryzacja mówców", icon: "users", status: "placeholder", env: "HUGGINGFACE_TOKEN", demo: "single-speaker" },
  { name: "Dźwięki niewerbalne", icon: "wave", status: "placeholder", env: "—", demo: "noop" },
  { name: "Storage / persistencja", icon: "folder", status: "placeholder", env: "WIDZWIEK_STORAGE_DIR", demo: "in-memory" },
  { name: "Baza danych", icon: "grid", status: "planned", env: "DATABASE_URL", demo: "—" },
  { name: "Auth", icon: "shield", status: "later", env: "—", demo: "otwarte" },
  { name: "Płatności", icon: "shield", status: "later", env: "—", demo: "—" },
  { name: "Eksport PDF raportu", icon: "file", status: "planned", env: "—", demo: "SRT/VTT" },
  { name: "Deploy frontend (Vercel)", icon: "plug", status: "planned", env: "NEXT_PUBLIC_WORKER_URL", demo: "localhost" },
  { name: "Deploy worker", icon: "plug", status: "planned", env: "WIDZWIEK_CORS_ORIGINS", demo: "localhost" },
  { name: "Monitoring / rate limit / security", icon: "shield", status: "planned", env: "—", demo: "—" },
];

export default function Integracje() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="plug" title="Integracje" desc="Każda usługa zewnętrzna jest ukryta za adapterem. Demo działa bez żadnej z nich. Pełny opis: docs/EXTERNAL_APIS.md." />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
        className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
        <div className="overflow-x-auto">
          <motion.table variants={stagger} className="w-full text-sm">
            <thead>
              <tr className="border-b border-hair/60 text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-medium">Integracja</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">ENV</th>
                <th className="px-5 py-2.5 font-medium">W demo</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <motion.tr key={r.name} variants={fadeUp} className="border-b border-hair/40">
                  <td className="px-5 py-2.5"><span className="inline-flex items-center gap-2 font-medium text-graphite"><Icon name={r.icon} size={16} className="text-muted" /> {r.name}</span></td>
                  <td className="px-3 py-2.5"><Badge tone={TONE[r.status]}>{r.status}</Badge></td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted">{r.env}</td>
                  <td className="px-5 py-2.5 text-muted">{r.demo}</td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      </motion.div>
    </div>
  );
}
