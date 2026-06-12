"use client";
// Ustawienia są user-facing: strategia i status orkiestratora najpierw, providerzy/ENV dopiero w trybie zaawansowanym.
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, type Tone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
import { fadeUp } from "@/lib/motion";
import { getHealth, setConfig, type HealthInfo } from "@/lib/api";
import { ENGINE_MODES, getEngineMode, setEngineMode, type EngineMode } from "@/lib/engineMode";
import {
  DEFAULT_POLICY,
  ORCHESTRATOR_STATUS,
  OTHER_PROVIDER_GROUPS,
  SOUND_EVENT_PROVIDERS,
  STRATEGIES,
  TRANSCRIPT_SOURCE_PROVIDERS,
  TRANSCRIPTION_PROVIDERS,
  type OrchestrationStrategy,
  type ProviderCapabilityProfile,
  type ProviderStatus,
  statusLabel,
} from "@/lib/orchestration";

type Mode = "mock" | "api";
type SectionId = "ogolne" | "strategia" | "zrodla" | "ai" | "dzwieki" | "format" | "platnosci" | "bezpieczenstwo" | "developer";

const SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: "ogolne", label: "Ogólne", icon: "settings" },
  { id: "strategia", label: "Strategia", icon: "sparkles" },
  { id: "zrodla", label: "Źródła transkryptu", icon: "captions" },
  { id: "ai", label: "Silnik AI", icon: "mic" },
  { id: "dzwieki", label: "Dźwięki niewerbalne", icon: "wave" },
  { id: "format", label: "Format napisów", icon: "file" },
  { id: "platnosci", label: "Plan i płatności", icon: "card" },
  { id: "bezpieczenstwo", label: "Bezpieczeństwo", icon: "shield" },
];
const DEV_SECTION = { id: "developer" as SectionId, label: "Developer", icon: "plug" as IconName };

function toneForStatus(status: ProviderStatus): Tone {
  if (status === "active_demo" || status === "available" || status === "api_ready") return "ok";
  if (status === "missing_key" || status === "placeholder" || status === "fallback_used") return "warn";
  if (status === "failed") return "err";
  return "neutral";
}

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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-graphite">{value}</span>
    </div>
  );
}

function ProviderList({ providers, compact = false }: { providers: ProviderCapabilityProfile[]; compact?: boolean }) {
  return (
    <div className="grid gap-2">
      {providers.map((p) => (
        <div key={p.id} className="rounded-xl border border-hair/60 bg-white px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 text-sm font-medium text-graphite">{p.userLabel}</span>
            <Badge tone={toneForStatus(p.status)}>{statusLabel(p.status)}</Badge>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">{p.cost.tier}</span>
          </div>
          {!compact && <p className="mt-1 text-xs text-muted">{p.note}</p>}
        </div>
      ))}
    </div>
  );
}

function UstawieniaInner() {
  const params = useSearchParams();
  const dev = params.get("dev") === "1";
  const visibleSections = dev ? [...SECTIONS, DEV_SECTION] : SECTIONS;
  const [section, setSection] = useState<SectionId>("strategia");
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("mock");
  const [strategy, setStrategy] = useState<OrchestrationStrategy>(DEFAULT_POLICY.strategy);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("whisper-1");
  const [showKey, setShowKey] = useState(false);
  const [soundSensitivity, setSoundSensitivity] = useState(DEFAULT_POLICY.soundSensitivity);
  const [relevantOnly, setRelevantOnly] = useState(DEFAULT_POLICY.addOnlyRelevantSounds);
  const [proposeSounds, setProposeSounds] = useState(DEFAULT_POLICY.proposeSoundsBeforeExport);
  const [requireSounds, setRequireSounds] = useState(DEFAULT_POLICY.requireSoundDescriptions);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);
  const [engineMode, setEngineModeState] = useState<EngineMode>("auto");

  const activeStrategy = useMemo(() => STRATEGIES.find((s) => s.id === strategy) ?? STRATEGIES[0], [strategy]);

  const refresh = useCallback(async () => {
    const h = await getHealth();
    setHealth(h);
    setLoading(false);
    if (h) {
      setMode((h.mode as Mode) ?? "mock");
      if (h.transcription_model) setModel(h.transcription_model);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setEngineModeState(getEngineMode()); }, []);

  async function saveRuntimeConfig() {
    setSaving(true); setMsg(null);
    try {
      const body: Record<string, string> = { pipeline_mode: mode, openai_transcription_model: model };
      if (apiKey.trim()) body.openai_api_key = apiKey.trim();
      const h = await setConfig(body);
      setHealth(h);
      setApiKey("");
      setShowKey(false);
      setMsg(h.ready
        ? { tone: "ok", text: mode === "api" ? "Zapisano. Dostawca transkrypcji gotowy do testu API." : "Zapisano. Demo działa bez zewnętrznych API." }
        : { tone: "warn", text: "Zapisano, ale live API nie jest jeszcze gotowe — sprawdź uwagi workera." });
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się zapisać." });
    } finally { setSaving(false); }
  }

  const offline = !loading && health === null;
  const statusBadges = offline ? (
    <Badge tone="err" icon="alert">silnik offline</Badge>
  ) : (
    <>
      <Badge tone={health?.mode === "api" ? "info" : "neutral"} icon="sparkles">{health?.mode === "api" ? "live API" : "demo bez API"}</Badge>
      <Badge tone={health?.ready ? "ok" : "warn"} icon={health?.ready ? "checkCircle" : "alert"}>{health?.ready ? "system gotowy" : "wymaga konfiguracji"}</Badge>
      <Badge tone={health?.api_key_present ? "ok" : "neutral"} icon="shield">{health?.api_key_present ? "klucz API ustawiony" : "bez kluczy"}</Badge>
    </>
  );

  const advancedProviders = [
    ...TRANSCRIPT_SOURCE_PROVIDERS,
    ...TRANSCRIPTION_PROVIDERS,
    ...SOUND_EVENT_PROVIDERS,
    ...OTHER_PROVIDER_GROUPS,
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon="settings"
        title="Ustawienia"
        desc="Strategia orkiestratora, źródła transkryptu, dźwięki niewerbalne i status systemu. Szczegóły providerów są ukryte w trybie zaawansowanym."
      />

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-56 md:flex-col">
          {visibleSections.map((s) => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} aria-current={active ? "true" : undefined}
                className={`focusring inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-brand-50 font-medium text-brand-700" : "text-graphite hover:bg-brand-50/60"}`}>
                <Icon name={s.icon} size={16} className={active ? "text-brand-600" : "text-muted"} /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-2">{statusBadges}</div>

          {section === "ogolne" && (
            <Card title="Ogólne" desc="Widźwięk to SaaS do captions dostępnościowych, nie ręczny panel wyboru kilkunastu providerów.">
              <div className="space-y-2">
                <ReadonlyField label="Produkt" value="Widźwięk — captions/WCAG/audio intelligence" />
                <ReadonlyField label="Model pracy" value="Orkiestrator przetwarzania" />
                <ReadonlyField label="Domyślny tryb" value="Automatyczna strategia" />
                <ReadonlyField label="Demo" value="mock bez zewnętrznych API" />
              </div>
            </Card>
          )}

          {section === "strategia" && (
            <div className="space-y-4">
              <Card title="Strategia przetwarzania" desc="Użytkownik wrzuca plik albo link. Orkiestrator sam wybiera źródło transkryptu i providerów.">
                <div className="grid gap-2 sm:grid-cols-2">
                  {STRATEGIES.map((s) => {
                    const active = strategy === s.id;
                    return (
                      <button key={s.id} type="button" onClick={() => setStrategy(s.id)}
                        className={`focusring rounded-xl border p-3 text-left transition-colors ${active ? "border-brand-400 bg-brand-50 text-brand-700" : "border-hair bg-white text-graphite hover:border-brand-200 hover:bg-brand-50/50"}`}>
                        <span className="block text-sm font-medium">{s.label}</span>
                        <span className="mt-0.5 block text-xs text-muted">{s.short}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                  <p className="text-sm font-medium text-graphite">{activeStrategy.label}: {activeStrategy.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeStrategy.priorities.map((p) => <span key={p} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-brand-700 ring-1 ring-brand-100">{p}</span>)}
                  </div>
                </div>
              </Card>

              <Card title="Status orkiestratora" desc="Główny widok: strategia i capabilities. Szczegóły providerów są niżej, w Zaawansowanych.">
                <div className="grid gap-2 sm:grid-cols-2">
                  {ORCHESTRATOR_STATUS.map((s) => (
                    <div key={s.label} className="rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-graphite">{s.label}</span>
                        <Badge tone={toneForStatus(s.status)}>{statusLabel(s.status)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">{s.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {section === "zrodla" && (
            <Card title="Źródła transkryptu i napisów" desc="To jest ważniejsze niż sam ASR: najtańsza ścieżka często zaczyna się od gotowych napisów.">
              <p className="text-sm text-graphite">Orkiestrator sam sprawdza źródła w tej kolejności — nie wybierasz dostawców ręcznie.</p>
              <details className="mt-4 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                <summary className="cursor-pointer text-sm font-medium text-graphite">Zaawansowane: kolejność kaskadowa</summary>
                <ol className="mt-3 space-y-1.5 text-xs text-muted">
                  <li>1. Sprawdź gotowe napisy lub auto captions z platformy.</li>
                  <li>2. Użyj importu SRT/VTT/TXT albo wklejonego transkryptu.</li>
                  <li>3. Jeśli trzeba, pobierz/wyciągnij audio jako etap techniczny.</li>
                  <li>4. Uruchom ASR i alignment tylko wtedy, gdy nie ma tańszego źródła.</li>
                </ol>
              </details>
            </Card>
          )}

          {section === "ai" && (
            <div className="space-y-4">
              <Card title="Silnik AI — model i orientacyjny cennik" desc="Nie podajesz żadnego klucza API. Wybierasz tryb/model — to wpływa na jakość, szybkość i cenę. Pod spodem Widźwięk sam dobiera dostawcę i rozlicza minuty zgodności WCAG.">
                <div className="grid gap-2">
                  {ENGINE_MODES.map((m) => (
                    <button key={m.id} type="button" onClick={() => { setEngineMode(m.id); setEngineModeState(m.id); }}
                      className={`focusring flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${engineMode === m.id ? "border-brand-500 bg-brand-50" : "border-hair bg-white hover:bg-slate-50"}`}>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-graphite">{m.label}</span>
                        <span className="block text-xs text-muted">{m.desc}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-medium tabular-nums text-graphite">{m.price}</span>
                        <span className="block text-[11px] text-muted">orientacyjnie / min</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">Ceny orientacyjne (TBD) — finalne stawki ustalimy przy uruchomieniu rozliczeń. Rozliczamy „minuty zgodności WCAG”, nie dostawcę. Pole klucza API zostaje wyłącznie dla firm/developerów w trybie zaawansowanym.</p>
              </Card>
              <Card title="Jak dobieramy dostawcę" desc="Klient nie wybiera providera — Widźwięk dobiera go sam pod materiał i tryb.">
                <div className="rounded-xl border border-ok/30 bg-ok/5 p-4">
                  <p className="text-sm font-medium text-graphite">Orkiestrator wybiera provider dopiero po sprawdzeniu źródła transkryptu.</p>
                  <p className="mt-1 text-xs text-muted">Dzięki temu import napisów, auto captions i gotowe transkrypty mogą obniżać koszt bez ręcznej decyzji użytkownika.</p>
                </div>
                <p className="mt-3 text-xs text-muted">Pełna lista dostawców i ich statusy jest w trybie developerskim.</p>
              </Card>
              <Card title="Rozpoznawanie mówców" desc="Mówcy są osobną capability, nie efektem ubocznym ASR.">
                <p className="text-sm text-graphite">Mówcy są wykrywani automatycznie (w demo na materiale przykładowym). Nazwy i kolory poprawisz w edytorze — bez wyboru dostawców.</p>
              </Card>
            </div>
          )}

          {section === "dzwieki" && (
            <div className="space-y-4">
              <Card title="Dźwięki niewerbalne" desc="Top-level capability produktu: wykryj, oceń istotność i zaproponuj opis do captions.">
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                    <span className="text-sm text-graphite">Wykrywanie dźwięków</span>
                    <Badge tone="warn">demo / automatyczne później</Badge>
                  </div>
                  <label className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                    <span className="text-sm text-graphite">Poziom czułości</span>
                    <select value={soundSensitivity} onChange={(e) => setSoundSensitivity(e.target.value as typeof soundSensitivity)}
                      className="focusring rounded-lg border border-hair bg-white px-2 py-1.5 text-sm text-graphite">
                      <option value="low">niski</option>
                      <option value="standard">standard</option>
                      <option value="high">wysoki</option>
                    </select>
                  </label>
                  {[
                    ["Dodawaj tylko dźwięki istotne dla zrozumienia", relevantOnly, setRelevantOnly],
                    ["Proponuj opisy dźwięków przed eksportem", proposeSounds, setProposeSounds],
                    ["Wymagaj opisów dźwięków w raporcie WCAG", requireSounds, setRequireSounds],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="flex items-center justify-between gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                      <span className="text-sm text-graphite">{label as string}</span>
                      <button type="button" onClick={() => (setter as React.Dispatch<React.SetStateAction<boolean>>)((v) => !v)}
                        className={`focusring relative h-5 w-9 rounded-full transition-colors ${value ? "bg-brand-600" : "bg-slate-300"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {section === "format" && (
            <Card title="Format napisów i quality layer" desc="WCAG jest ciągłą kontrolą jakości, nie osobnym jednorazowym raportem.">
              <div className="space-y-2">
                <ReadonlyField label="Maks. długość linii" value="42 znaki" />
                <ReadonlyField label="Zalecana długość linii" value="≤ 37 znaków" />
                <ReadonlyField label="Maks. linie na ekranie" value="2" />
                <ReadonlyField label="Eksport" value="SRT + VTT teraz, PDF placeholder" />
              </div>
            </Card>
          )}

          {section === "platnosci" && (
            <Card title="Plan, kredyty i rozliczenia" desc="Billing jest mock/placeholder, ale język UI to plan, kredyty, faktury i konto instytucjonalne.">
              <p className="text-sm text-muted">Metody płatności są opisane jako doświadczenie użytkownika, nie jako techniczne integracje.</p>
              <Link href="/app/plan" className="focusring mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
                <Icon name="card" size={17} /> Otwórz Plan i płatności
              </Link>
            </Card>
          )}

          {section === "bezpieczenstwo" && (
            <Card title="Bezpieczeństwo" desc="Sekrety i dostawcy są konfiguracją backendową, nie głównym językiem produktu.">
              <div className="space-y-2">
                <ReadonlyField label="Klucze w repo" value="nigdy" />
                <ReadonlyField label="Live API" value="tylko po kluczu w środowisku" />
                <ReadonlyField label="Auth / storage / produkcja" value="later / production hardening" />
              </div>
            </Card>
          )}

          {section === "developer" && (
            <div className="space-y-4">
              <Card title="Developer: runtime workera" desc="Tylko dla dev/admin. To nie jest podstawowy tryb obsługi materiału.">
                <div className="inline-flex rounded-xl border border-hair p-1">
                  {(["mock", "api"] as Mode[]).map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`focusring rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-brand-600 text-white" : "text-graphite hover:bg-brand-50"}`}>
                      {m === "mock" ? "Demo mock" : "Live API"}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  <label>
                    <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Klucz OpenAI</span>
                    <div className="relative">
                      <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                        placeholder={health?.api_key_present ? "ustawiony — wpisz nowy, aby podmienić" : "sk-..."}
                        className="focusring w-full rounded-xl border border-hair bg-white px-3 py-2.5 pr-10 font-mono text-sm text-graphite" />
                      <button type="button" onClick={() => setShowKey((s) => !s)} aria-label={showKey ? "Ukryj klucz" : "Pokaż klucz"}
                        className="focusring absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-graphite">
                        <Icon name={showKey ? "eyeOff" : "search"} size={16} />
                      </button>
                    </div>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Model transkrypcji</span>
                    <input value={model} onChange={(e) => setModel(e.target.value)}
                      className="focusring w-full max-w-xs rounded-xl border border-hair bg-white px-3 py-2.5 font-mono text-sm text-graphite" />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button onClick={saveRuntimeConfig} loading={saving} disabled={offline} icon="check">Zapisz runtime</Button>
                  {msg && <span className={`text-sm ${msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : msg.tone === "warn" ? "text-warn" : "text-brand-700"}`}>{msg.text}</span>}
                </div>
                {health?.notes?.length ? (
                  <ul className="mt-4 space-y-1 text-xs text-muted">
                    {health.notes.map((n, i) => <li key={i}>• {n}</li>)}
                  </ul>
                ) : null}
              </Card>
              <Card title="Developer: wszystkie provider capabilities" desc="Dokumentacyjna lista adapterów. Placeholdery nie wykonują live requestów.">
                <ProviderList providers={advancedProviders} compact />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Ustawienia() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl py-10 text-sm text-muted">Wczytywanie ustawień…</div>}>
      <UstawieniaInner />
    </Suspense>
  );
}
