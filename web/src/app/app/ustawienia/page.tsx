"use client";
// Ustawienia — realna konfiguracja workera w czasie działania (runtime).
// Klucz API trafia POST /api/config do PAMIĘCI workera; nie jest zapisywany na dysk ani w repo.
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, type Tone } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";
import { getHealth, setConfig, type HealthInfo } from "@/lib/api";

type Mode = "mock" | "api";

export default function Ustawienia() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("mock");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("whisper-1");
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const h = await getHealth();
    setHealth(h);
    setLoading(false);
    if (h) {
      setMode((h.mode as Mode) ?? "mock");
      if (h.transcription_model) setModel(h.transcription_model);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, string> = { pipeline_mode: mode, openai_transcription_model: model };
      // wyślij klucz tylko jeśli user coś wpisał (puste pole = nie zmieniaj)
      if (apiKey.trim()) body.openai_api_key = apiKey.trim();
      const h = await setConfig(body);
      setHealth(h);
      setApiKey(""); // nie trzymamy sekretu w stanie UI po zapisie
      setShowKey(false);
      setMsg(
        h.ready
          ? { tone: "ok", text: mode === "api" ? "Zapisano. Tryb API gotowy — przetestuj w Studio." : "Zapisano. Tryb mock aktywny." }
          : { tone: "warn", text: "Zapisano, ale tryb API nie jest jeszcze gotowy — patrz uwagi poniżej." }
      );
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się zapisać konfiguracji." });
    } finally {
      setSaving(false);
    }
  }

  async function clearKey() {
    setSaving(true);
    setMsg(null);
    try {
      const h = await setConfig({ openai_api_key: "", pipeline_mode: "mock" });
      setHealth(h);
      setApiKey("");
      setMode("mock");
      setMsg({ tone: "info", text: "Klucz wyczyszczony z pamięci workera. Wróciłeś do trybu mock." });
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się wyczyścić klucza." });
    } finally {
      setSaving(false);
    }
  }

  const offline = !loading && health === null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon="settings"
        title="Ustawienia"
        desc="Wklej klucz OpenAI, aby włączyć realną transkrypcję. Klucz żyje tylko w pamięci workera — nie zapisujemy go na dysk ani w repo."
      />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-4">
        {/* Status workera */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-medium text-graphite">Status workera</h3>
          {offline ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="err" icon="alert">worker offline</Badge>
              <span className="text-sm text-muted">
                Uruchom workera: <code className="rounded bg-slate-100 px-1.5 py-0.5">uvicorn widzwiek.main:app --port 8000</code>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge tone={health?.mode === "api" ? "info" : "neutral"} icon="sparkles">
                Tryb: {health?.mode ?? "—"}
              </Badge>
              <Badge tone={health?.ready ? "ok" : "warn"} icon={health?.ready ? "checkCircle" : "alert"}>
                {health?.ready ? "gotowy" : "nie gotowy"}
              </Badge>
              <Badge tone={health?.api_key_present ? "ok" : "neutral"} icon="shield">
                {health?.api_key_present ? "klucz w pamięci" : "brak klucza"}
              </Badge>
              <Badge tone={health?.openai_installed ? "ok" : "warn"} icon="plug">
                openai SDK: {health?.openai_installed ? "tak" : "nie"}
              </Badge>
              <Badge tone="neutral">ASR: {health?.providers.asr ?? "—"}</Badge>
            </div>
          )}
        </motion.div>

        {/* Formularz konfiguracji */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-medium text-graphite">Tryb przetwarzania i klucz API</h3>

          {/* Wybór trybu */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Tryb</label>
            <div className="inline-flex rounded-xl border border-hair p-1">
              {(["mock", "api"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`focusring rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                    mode === m ? "bg-brand-600 text-white" : "text-graphite hover:bg-brand-50"
                  }`}
                >
                  {m === "mock" ? "Mock (demo)" : "API (OpenAI)"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Mock działa bez kluczy. API używa realnej transkrypcji OpenAI dla polskiego audio.
            </p>
          </div>

          {/* Klucz API */}
          <div className="mb-4">
            <label htmlFor="apikey" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
              Klucz OpenAI API
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="apikey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={health?.api_key_present ? "•••••••••• (klucz ustawiony — wpisz nowy, aby podmienić)" : "sk-..."}
                  autoComplete="off"
                  spellCheck={false}
                  className="focusring w-full rounded-xl border border-hair bg-white px-3 py-2.5 pr-10 font-mono text-sm text-graphite placeholder:text-muted/70"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  aria-label={showKey ? "Ukryj klucz" : "Pokaż klucz"}
                  className="focusring absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-graphite"
                >
                  <Icon name={showKey ? "eyeOff" : "search"} size={16} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              Klucz wysyłany jest do lokalnego workera i przechowywany wyłącznie w jego pamięci (do restartu). Nigdy nie trafia na dysk, do repo ani do przeglądarki innych osób.
            </p>
          </div>

          {/* Model */}
          <div className="mb-5">
            <label htmlFor="model" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
              Model transkrypcji
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="whisper-1"
              className="focusring w-full max-w-xs rounded-xl border border-hair bg-white px-3 py-2.5 font-mono text-sm text-graphite"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} loading={saving} disabled={offline} icon="check">
              Zapisz konfigurację
            </Button>
            <Button variant="secondary" onClick={clearKey} disabled={saving || offline} icon="x">
              Wyczyść klucz
            </Button>
            {msg && (
              <span
                className={`text-sm ${
                  msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : msg.tone === "warn" ? "text-warn" : "text-brand-700"
                }`}
              >
                {msg.text}
              </span>
            )}
          </div>
        </motion.div>

        {/* Uwagi gotowości (z workera) */}
        {health?.notes && health.notes.length > 0 && (
          <motion.div variants={fadeUp} className="rounded-2xl border border-warn/30 bg-warn/5 p-5">
            <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite">
              <Icon name="alert" size={16} /> Co jeszcze trzeba, by tryb API był gotowy
            </h3>
            <ul className="space-y-1 text-sm text-graphite">
              {health.notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-warn">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Po włączeniu trybu API przetestuj realną transkrypcję w sekcji <strong>Studio</strong>. Szczegóły: <code>docs/API_LIVE_TEST.md</code>.
            </p>
          </motion.div>
        )}

        {/* Zmienne środowiskowe (alternatywa: ustawienie na starcie) */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite">
            <Icon name="file" size={16} /> Alternatywa: zmienne środowiskowe
          </h3>
          <p className="text-sm text-muted">
            Zamiast wpisywać klucz w UI, możesz go ustawić na starcie workera w <code>worker/.env</code>:
            <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">PIPELINE_MODE=api</code>,
            <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">OPENAI_API_KEY=sk-...</code>. Sprawdzenie:
            <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">python -m widzwiek.api_check</code>.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
