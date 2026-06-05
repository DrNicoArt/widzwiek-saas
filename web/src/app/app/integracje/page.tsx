"use client";
// Integracje — pogrupowane wg obszaru, z rozdzieleniem statusu ARCHITEKTONICZNEGO (dojrzałość
// integracji) od RUNTIME (co realnie dzieje się w trybie demo). Live status workera jest na
// Przeglądzie i w Ustawieniach. ENV-y to szczegół developerski. Lustro docs/EXTERNAL_APIS.md.
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

type Arch = "gotowe" | "placeholder" | "planowane";
const ARCH_TONE: Record<Arch, Tone> = { gotowe: "info", placeholder: "warn", planowane: "neutral" };
const ARCH_LABEL: Record<Arch, string> = { gotowe: "gotowe do podpięcia", placeholder: "placeholder / TBD", planowane: "planowane" };

interface Row { name: string; icon: IconName; arch: Arch; runtime: string; runtimeOk: boolean; env: string }
interface Group { title: string; desc: string; rows: Row[] }

const GROUPS: Group[] = [
  {
    title: "AI i przetwarzanie",
    desc: "Sercem produktu jest transkrypcja i analiza audio. W demo wszystko liczy się lokalnie (mock).",
    rows: [
      { name: "Transkrypcja (OpenAI)", icon: "mic", arch: "gotowe", runtime: "mock — realne API po kluczu", runtimeOk: true, env: "OPENAI_API_KEY" },
      { name: "Ekstrakcja audio (ffmpeg)", icon: "file", arch: "gotowe", runtime: "pomijane w mock; wymagane dla wideo w trybie API", runtimeOk: true, env: "—" },
      { name: "Diaryzacja mówców", icon: "users", arch: "placeholder", runtime: "uproszczone (single-speaker)", runtimeOk: true, env: "HUGGINGFACE_TOKEN" },
      { name: "Dźwięki niewerbalne", icon: "wave", arch: "placeholder", runtime: "z danych demo (noop)", runtimeOk: true, env: "—" },
    ],
  },
  {
    title: "Dane i storage",
    desc: "Trwałość projektów i wyników. W demo dane żyją w pamięci procesu.",
    rows: [
      { name: "Storage / persistencja", icon: "folder", arch: "placeholder", runtime: "in-memory", runtimeOk: true, env: "WIDZWIEK_STORAGE_DIR" },
      { name: "Baza danych", icon: "grid", arch: "planowane", runtime: "brak (PoC)", runtimeOk: false, env: "DATABASE_URL" },
    ],
  },
  {
    title: "Operacje i deploy",
    desc: "Uruchomienie produkcyjne: frontend i worker hostowane osobno.",
    rows: [
      { name: "Deploy frontend (Vercel)", icon: "plug", arch: "planowane", runtime: "localhost", runtimeOk: false, env: "NEXT_PUBLIC_WORKER_URL" },
      { name: "Deploy worker (VPS/Render)", icon: "plug", arch: "planowane", runtime: "localhost", runtimeOk: false, env: "WIDZWIEK_CORS_ORIGINS" },
      { name: "Eksport PDF raportu", icon: "file", arch: "planowane", runtime: "obecnie SRT/VTT", runtimeOk: false, env: "—" },
      { name: "Monitoring / kolejka / rate limit", icon: "clock", arch: "planowane", runtime: "brak", runtimeOk: false, env: "—" },
    ],
  },
  {
    title: "Billing i płatności",
    desc: "Architektura neutralna wobec dostawcy (provider-agnostic). Szczegóły: ekran Plan i płatności.",
    rows: [
      { name: "Rozliczenia / kredyty", icon: "card", arch: "placeholder", runtime: "mock — nic nie pobierane", runtimeOk: true, env: "BILLING_PROVIDER" },
      { name: "Dostawcy płatności (Stripe/P24/PayU…)", icon: "card", arch: "planowane", runtime: "placeholdery adapterów", runtimeOk: false, env: "—" },
    ],
  },
  {
    title: "Bezpieczeństwo i konta",
    desc: "Świadomie poza zakresem PoC — demo jest otwarte.",
    rows: [
      { name: "Autoryzacja / konta", icon: "shield", arch: "planowane", runtime: "otwarte (bez logowania)", runtimeOk: false, env: "—" },
      { name: "Sekrety / klucze API", icon: "shield", arch: "placeholder", runtime: "runtime key w pamięci (dev/demo)", runtimeOk: true, env: "OPENAI_API_KEY" },
    ],
  },
];

export default function Integracje() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="plug" title="Integracje"
        desc="Każda usługa zewnętrzna jest ukryta za adapterem — demo działa bez żadnej z nich. Poniżej status architektoniczny (dojrzałość), nie live status workera (ten jest w Przeglądzie i Ustawieniach)." />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
        {GROUPS.map((g) => (
          <motion.section key={g.title} variants={fadeUp}
            className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
            <div className="border-b border-hair/60 px-5 py-3">
              <h3 className="text-sm font-medium text-graphite">{g.title}</h3>
              <p className="mt-0.5 text-xs text-muted">{g.desc}</p>
            </div>
            <ul className="divide-y divide-hair/40">
              {g.rows.map((r) => (
                <li key={r.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <span className="inline-flex min-w-0 flex-1 items-center gap-2 font-medium text-graphite">
                    <Icon name={r.icon} size={16} className="shrink-0 text-muted" /> <span className="truncate">{r.name}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${r.runtimeOk ? "bg-ok" : "bg-slate-300"}`} />
                    {r.runtime}
                  </span>
                  <Badge tone={ARCH_TONE[r.arch]}>{ARCH_LABEL[r.arch]}</Badge>
                  <code className="hidden font-mono text-[11px] text-muted/70 sm:inline">{r.env}</code>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </motion.div>

      <p className="mt-4 text-center text-xs text-muted">
        Kropka oznacza, czy element działa w trybie demo. Szczegóły techniczne i zmienne środowiskowe: <code>docs/EXTERNAL_APIS.md</code>.
      </p>
    </div>
  );
}
