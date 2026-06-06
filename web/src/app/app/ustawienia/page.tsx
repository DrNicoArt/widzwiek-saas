"use client";
// Ustawienia — sekcje. Tu mieszka cała konfiguracja techniczna (w tym dawne „Integracje" → Developer).
// Język user-facing: „Silnik transkrypcji", „Rozpoznawanie mówców", „Przechowywanie danych".
// W kodzie/dokumentacji: ASRProvider/DiarizationProvider/SoundEventProvider, BillingProvider.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, type Tone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
import { fadeUp } from "@/lib/motion";
import { getHealth, setConfig, type HealthInfo } from "@/lib/api";

type Mode = "mock" | "api";
type SectionId = "ogolne" | "przetwarzanie" | "ai" | "format" | "dane" | "platnosci" | "bezpieczenstwo" | "developer";

const SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: "ogolne", label: "Ogólne", icon: "settings" },
  { id: "przetwarzanie", label: "Przetwarzanie", icon: "refresh" },
  { id: "ai", label: "Dostawcy AI", icon: "mic" },
  { id: "format", label: "Format napisów", icon: "captions" },
  { id: "dane", label: "Dane i storage", icon: "folder" },
  { id: "platnosci", label: "Metody płatności", icon: "card" },
  { id: "bezpieczenstwo", label: "Bezpieczeństwo", icon: "shield" },
  { id: "developer", label: "Developer", icon: "plug" },
];

// Developer → dawne „Integracje" (status architektoniczny vs runtime).
type Arch = "gotowe" | "placeholder" | "planowane";
const ARCH_TONE: Record<Arch, Tone> = { gotowe: "info", placeholder: "warn", planowane: "neutral" };
const ARCH_LABEL: Record<Arch, string> = { gotowe: "gotowe do podpięcia", placeholder: "placeholder / TBD", planowane: "planowane" };
const DEV_GROUPS: { title: string; rows: { name: string; arch: Arch; runtime: string; env: string }[] }[] = [
  { title: "AI i przetwarzanie", rows: [
    { name: "ASRProvider (OpenAI)", arch: "gotowe", runtime: "mock — realne API po kluczu", env: "OPENAI_API_KEY" },
    { name: "Ekstrakcja audio (ffmpeg)", arch: "gotowe", runtime: "pomijane w mock", env: "—" },
    { name: "DiarizationProvider", arch: "placeholder", runtime: "single-speaker", env: "HUGGINGFACE_TOKEN" },
    { name: "SoundEventProvider", arch: "placeholder", runtime: "noop", env: "—" },
  ]},
  { title: "Dane i operacje", rows: [
    { name: "Storage / persistencja", arch: "placeholder", runtime: "in-memory", env: "WIDZWIEK_STORAGE_DIR" },
    { name: "Baza danych", arch: "planowane", runtime: "brak (PoC)", env: "DATABASE_URL" },
    { name: "Deploy frontend / worker", arch: "planowane", runtime: "localhost", env: "NEXT_PUBLIC_WORKER_URL / WIDZWIEK_CORS_ORIGINS" },
    { name: "Monitoring / rate limit", arch: "planowane", runtime: "brak", env: "—" },
  ]},
  { title: "Billing", rows: [
    { name: "BillingProvider", arch: "placeholder", runtime: "mock — nic nie pobierane", env: "BILLING_PROVIDER" },
    { name: "Adaptery (Stripe/P24/PayU/Tpay…)", arch: "planowane", runtime: "placeholdery", env: "—" },
  ]},
];

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
      <h3 className="text-sm font-medium text-graphite">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}
function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-hair/60 bg-white px-3 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-xs text-graphite">{value}</span>
    </div>
  );
}

export default function Ustawienia() {
  const [section, setSection] = useState<SectionId>("przetwarzanie");
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("mock");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("whisper-1");
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const h = await getHealth(); setHealth(h); setLoading(false);
    if (h) { setMode((h.mode as Mode) ?? "mock"); if (h.transcription_model) setModel(h.transcription_model); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body: Record<string, string> = { pipeline_mode: mode, openai_transcription_model: model };
      if (apiKey.trim()) body.openai_api_key = apiKey.trim();
      const h = await setConfig(body); setHealth(h); setApiKey(""); setShowKey(false);
      setMsg(h.ready
        ? { tone: "ok", text: mode === "api" ? "Zapisano. Tryb API gotowy — przetestuj w Nowym materiale." : "Zapisano. Tryb demo aktywny." }
        : { tone: "warn", text: "Zapisano, ale tryb API nie jest jeszcze gotowy — patrz uwagi." });
    } catch (e) { setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się zapisać." }); }
    finally { setSaving(false); }
  }
  async function clearKey() {
    setSaving(true); setMsg(null);
    try { const h = await setConfig({ openai_api_key: "", pipeline_mode: "mock" }); setHealth(h); setApiKey(""); setMode("mock");
      setMsg({ tone: "info", text: "Klucz wyczyszczony z pamięci silnika. Powrót do trybu demo." }); }
    catch (e) { setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się wyczyścić klucza." }); }
    finally { setSaving(false); }
  }

  const offline = !loading && health === null;
  const statusBadges = offline ? (
    <Badge tone="err" icon="alert">silnik offline</Badge>
  ) : (
    <>
      <Badge tone={health?.mode === "api" ? "info" : "neutral"} icon="sparkles">tryb: {health?.mode === "api" ? "API" : "demo"}</Badge>
      <Badge tone={health?.ready ? "ok" : "warn"} icon={health?.ready ? "checkCircle" : "alert"}>{health?.ready ? "gotowy" : "nie gotowy"}</Badge>
      <Badge tone={health?.api_key_present ? "ok" : "neutral"} icon="shield">{health?.api_key_present ? "klucz w pamięci" : "brak klucza"}</Badge>
    </>
  );

  const KeyField = (
    <div className={`transition-opacity ${mode === "mock" ? "opacity-70" : ""}`}>
      <label htmlFor="apikey" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
        Klucz OpenAI {mode === "mock" && <span className="ml-1 normal-case text-muted/70">(opcjonalny w trybie demo)</span>}
      </label>
      <div className="relative">
        <input id="apikey" type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
          placeholder={health?.api_key_present ? "•••••••••• (ustawiony — wpisz nowy, aby podmienić)" : "sk-..."}
          autoComplete="off" spellCheck={false}
          className="focusring w-full rounded-xl border border-hair bg-white px-3 py-2.5 pr-10 font-mono text-sm text-graphite placeholder:text-muted/70" />
        <button type="button" onClick={() => setShowKey((s) => !s)} aria-label={showKey ? "Ukryj klucz" : "Pokaż klucz"}
          className="focusring absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-graphite"><Icon name={showKey ? "eyeOff" : "search"} size={16} /></button>
      </div>
    </div>
  );

  const SaveRow = (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button onClick={save} loading={saving} disabled={offline} icon="check">Zapisz</Button>
      <Button variant="secondary" onClick={clearKey} disabled={saving || offline} icon="x">Wyczyść klucz</Button>
      {msg && <span className={`text-sm ${msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : msg.tone === "warn" ? "text-warn" : "text-brand-700"}`}>{msg.text}</span>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="settings" title="Ustawienia" desc="Konfiguracja techniczna: przetwarzanie, dostawcy AI, dane, bezpieczeństwo. Sekcja Developer zawiera szczegóły integracji i zmienne środowiskowe." />

      <div className="flex flex-col gap-6 md:flex-row">
        {/* sub-nav */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-52 md:flex-col">
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} aria-current={active ? "true" : undefined}
                className={`focusring inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-brand-50 font-medium text-brand-700" : "text-graphite hover:bg-brand-50/60"}`}>
                <Icon name={s.icon} size={16} className={active ? "text-brand-600" : "text-muted"} /> {s.label}
              </button>
            );
          })}
        </nav>

        {/* content */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">{statusBadges}</div>

          {section === "ogolne" && (
            <Card title="Ogólne" desc="Podstawowe ustawienia interfejsu (w demo poglądowe).">
              <div className="space-y-2">
                <ReadonlyField label="Język interfejsu" value="polski" />
                <ReadonlyField label="Wersja" value="Widźwięk Demo v0.5" />
                <ReadonlyField label="Organizacja" value="SubrosAI" />
              </div>
            </Card>
          )}

          {section === "przetwarzanie" && (
            <Card title="Tryb przetwarzania" desc="Demo działa bez kluczy. API używa realnej transkrypcji dla polskiego audio.">
              <div className="inline-flex rounded-xl border border-hair p-1">
                {(["mock", "api"] as Mode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`focusring rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-brand-600 text-white" : "text-graphite hover:bg-brand-50"}`}>
                    {m === "mock" ? "Demo (mock)" : "API (realne)"}
                  </button>
                ))}
              </div>
              {SaveRow}
              {health?.notes && health.notes.length > 0 && (
                <div className="mt-4 rounded-xl border border-warn/30 bg-warn/5 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-graphite"><Icon name="alert" size={14} /> Co jeszcze trzeba do trybu API</p>
                  <ul className="space-y-1 text-xs text-graphite">{health.notes.map((n, i) => <li key={i} className="flex gap-2"><span className="text-warn">•</span><span>{n}</span></li>)}</ul>
                </div>
              )}
            </Card>
          )}

          {section === "ai" && (
            <div className="space-y-4">
              <Card title="Silnik transkrypcji" desc="Pierwszy adapter: OpenAI / Whisper. Architektura przewiduje wymianę (Deepgram, AssemblyAI, Google/Azure/AWS Speech, lokalny Whisper).">
                {KeyField}
                <div className="mt-3">
                  <label htmlFor="model" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Model</label>
                  <input id="model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="whisper-1"
                    className="focusring w-full max-w-xs rounded-xl border border-hair bg-white px-3 py-2.5 font-mono text-sm text-graphite" />
                </div>
                {SaveRow}
              </Card>
              <Card title="Rozpoznawanie mówców" desc="Kto mówi — kluczowe dla captions (WCAG 1.2.2).">
                <div className="flex items-center justify-between"><span className="text-sm text-graphite">Status</span><Badge tone="warn">placeholder · single-speaker</Badge></div>
                <p className="mt-2 text-xs text-muted">Realny provider (np. pyannote) podłączymy jako kolejny adapter, bez zmiany kontraktu danych.</p>
              </Card>
              <Card title="Dźwięki niewerbalne" desc="[oklaski], [muzyka], [pukanie] — kontekst audio.">
                <div className="flex items-center justify-between"><span className="text-sm text-graphite">Status</span><Badge tone="warn">placeholder · noop</Badge></div>
              </Card>
            </div>
          )}

          {section === "format" && (
            <Card title="Format napisów" desc="Reguły czytelności captions (w demo poglądowe; realnie egzekwowane w walidacji WCAG).">
              <div className="space-y-2">
                <ReadonlyField label="Maks. długość linii" value="42 znaki" />
                <ReadonlyField label="Zalecana długość linii" value="≤ 37 znaków" />
                <ReadonlyField label="Maks. liczba linii na ekranie" value="2" />
                <ReadonlyField label="Domyślny eksport" value="SRT + VTT" />
              </div>
            </Card>
          )}

          {section === "dane" && (
            <Card title="Przechowywanie danych" desc="Gdzie trzymane są materiały i wyniki.">
              <div className="space-y-2">
                <ReadonlyField label="Tryb (demo)" value="w pamięci procesu" />
                <ReadonlyField label="Persistencja" value="planowane (Postgres + storage)" />
                <ReadonlyField label="Retencja" value="polityka — do ustalenia" />
              </div>
              <p className="mt-3 text-xs text-muted">W demo projekty i wyniki nie przetrwają restartu silnika. Trwałe storage to kolejny etap.</p>
            </Card>
          )}

          {section === "platnosci" && (
            <Card title="Metody płatności i rozliczenia" desc="Plan, kredyty, faktury i metody płatności.">
              <p className="text-sm text-muted">Zarządzanie planem, kredytami i metodami płatności (karta, BLIK, faktura B2B) znajdziesz na osobnym ekranie.</p>
              <Link href="/app/plan" className="focusring mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
                <Icon name="card" size={17} /> Otwórz Plan i płatności
              </Link>
              <p className="mt-3 text-xs text-muted">Tryb demo — płatności nieaktywne, nic nie jest pobierane.</p>
            </Card>
          )}

          {section === "bezpieczenstwo" && (
            <Card title="Bezpieczeństwo" desc="Sekrety, klucze i prywatność.">
              <div className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2.5">
                <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-warn" />
                <p className="text-xs text-graphite">Klucz API wpisywany w UI to mechanizm <strong>dev / demo</strong> — żyje wyłącznie w pamięci lokalnego silnika (do restartu), nie trafia na dysk, do repo ani do innych przeglądarek. W produkcji klucze trzymamy w backendzie (secrets manager / zmienne środowiskowe).</p>
              </div>
              <div className="mt-3 space-y-2">
                <ReadonlyField label="Sekret w repo" value="nigdy" />
                <ReadonlyField label="Upload — limity/MIME" value="planowane" />
                <ReadonlyField label="Autoryzacja / konta" value="poza zakresem demo" />
              </div>
            </Card>
          )}

          {section === "developer" && (
            <div className="space-y-4">
              <Card title="Tryb developerski — integracje" desc="Status architektoniczny (dojrzałość) vs runtime (co działa w demo). Live status silnika powyżej i na Przeglądzie.">
                <div className="space-y-4">
                  {DEV_GROUPS.map((g) => (
                    <div key={g.title}>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{g.title}</p>
                      <ul className="divide-y divide-hair/40 rounded-xl border border-hair/50">
                        {g.rows.map((r) => (
                          <li key={r.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                            <span className="min-w-0 flex-1 truncate text-sm text-graphite">{r.name}</span>
                            <span className="text-xs text-muted">{r.runtime}</span>
                            <Badge tone={ARCH_TONE[r.arch]}>{ARCH_LABEL[r.arch]}</Badge>
                            <code className="hidden font-mono text-[11px] text-muted/70 lg:inline">{r.env}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">Pełny opis i zmienne: <code>docs/EXTERNAL_APIS.md</code>. Ustawianie klucza na starcie: <code>worker/.env</code> → <code>PIPELINE_MODE=api</code>, <code>OPENAI_API_KEY=…</code>, sprawdzenie <code>python -m widzwiek.api_check</code>.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
