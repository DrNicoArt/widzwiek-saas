"use client";
// Ustawienia — widok demonstracyjny (read-only). Tryb pipeline i zmienne pochodzą z workera/.env.
import { motion } from "framer-motion";
import { useWorkerUp } from "@/components/shell/AppShell";
import PageHeader from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

const ENV = [
  { k: "PIPELINE_MODE", v: "mock (domyślny) / api", note: "tryb przetwarzania" },
  { k: "OPENAI_API_KEY", v: "— (tylko tryb api)", note: "klucz w .env, nigdy w repo" },
  { k: "OPENAI_TRANSCRIPTION_MODEL", v: "whisper-1", note: "model transkrypcji" },
  { k: "WIDZWIEK_CORS_ORIGINS", v: "http://localhost:3000", note: "dozwolone originy" },
  { k: "NEXT_PUBLIC_WORKER_URL", v: "http://localhost:8000", note: "adres workera (frontend)" },
];

export default function Ustawienia() {
  const workerUp = useWorkerUp();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader icon="settings" title="Ustawienia" desc="Konfiguracja workera (read-only w demo). Sekrety wyłącznie w .env." />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-4">
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-medium text-graphite">System</h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info" icon="sparkles">Tryb: mock</Badge>
            <Badge tone={workerUp === false ? "err" : "ok"} icon="shield">{workerUp === false ? "worker offline" : "worker online"}</Badge>
            <Badge tone="neutral">Widźwięk Demo v0.4</Badge>
          </div>
          <p className="mt-3 text-sm text-muted">Aby włączyć realną transkrypcję: ustaw <code>PIPELINE_MODE=api</code> + <code>OPENAI_API_KEY</code> w <code>worker/.env</code> i sprawdź <code>python -m widzwiek.api_check</code>. Procedura: <code>docs/API_LIVE_TEST.md</code>.</p>
        </motion.div>

        <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
          <div className="border-b border-hair/60 px-5 py-3"><h3 className="text-sm font-medium text-graphite">Zmienne środowiskowe</h3></div>
          <table className="w-full text-sm">
            <tbody>
              {ENV.map((e) => (
                <tr key={e.k} className="border-b border-hair/40">
                  <td className="px-5 py-2.5 font-mono text-xs text-brand-700">{e.k}</td>
                  <td className="px-3 py-2.5 text-graphite">{e.v}</td>
                  <td className="px-5 py-2.5 text-xs text-muted">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="file" size={16} /> Dokumentacja</h3>
          <p className="text-sm text-muted"><code>README.md</code> · <code>docs/PRODUCT_STATUS.md</code> · <code>docs/EXTERNAL_APIS.md</code> · <code>docs/DEMO_SCRIPT.md</code> · <code>docs/MVP_CHECKLIST.md</code> · <code>docs/ROADMAP.md</code></p>
        </motion.div>
      </motion.div>
    </div>
  );
}
