"use client";
// Ustawienia — jeden elegancki ekran. Mniej = więcej: jedna decyzja klienta (Silnik),
// fakty o prywatności, klucz API schowany głęboko dla firm/developerów. Bez zakładek i telemetrii.
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";
import { ENGINE_MODES, getEngineMode, setEngineMode, type EngineMode } from "@/lib/engineMode";
import { getUserAsr, setUserAsr } from "@/lib/userKey";
import { ASR_PROVIDERS, type AsrProvider } from "@/lib/cloudAsr";

function SettingsInner() {
  const [mode, setMode] = useState<EngineMode>("auto");
  const [provider, setProvider] = useState<AsrProvider>("openai");
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMode(getEngineMode());
    const a = getUserAsr();
    if (a) { setProvider(a.provider); setHasKey(true); }
  }, []);

  function saveKey() { setUserAsr({ provider, key: keyInput }); setHasKey(!!keyInput.trim()); setSaved(true); setKeyInput(""); }
  function clearKey() { setUserAsr(null); setHasKey(false); setSaved(false); }

  const privacy = [
    { icon: "eyeOff" as const, label: "Przetwarzanie", value: "W Twojej przeglądarce — plik nie opuszcza urządzenia" },
    { icon: "folder" as const, label: "Twoje materiały", value: "Zapisane lokalnie, tylko u Ciebie" },
    { icon: "shield" as const, label: "Wersja serwerowa", value: "Region UE, retencja i usuwanie — wkrótce" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader icon="settings" title="Ustawienia" desc="Jakość, prywatność i konto — bez technicznego żargonu." />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
        {/* Silnik — jedyna realna decyzja klienta */}
        <motion.section variants={fadeUp} className="rounded-3xl border border-hair/70 bg-white/80 p-6 shadow-card backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift"><Icon name="sparkles" size={22} /></span>
            <div>
              <h2 className="text-base font-medium text-graphite">Silnik Widźwięk</h2>
              <p className="text-xs text-muted">Wybierasz efekt. Resztę dobieramy sami.</p>
            </div>
          </div>
          <div className="space-y-2">
            {ENGINE_MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button key={m.id} type="button" onClick={() => { setEngineMode(m.id); setMode(m.id); }}
                  className={`focusring flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all ${active ? "border-brand-500 bg-brand-50 shadow-ring" : "border-hair bg-white hover:border-brand-200 hover:bg-brand-50/40"}`}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-brand-600 bg-brand-600 text-white" : "border-hair text-transparent"}`}><Icon name="check" size={13} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-graphite">{m.label}</span>
                      <span className="block text-xs text-muted">{m.desc}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-medium tabular-nums text-graphite">{m.price}</span>
                    <span className="block text-[11px] text-muted">orientacyjnie / min</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">Ceny orientacyjne — rozliczamy minuty zgodności WCAG, nie dostawcę technologii. Finalny cennik ustalimy przy uruchomieniu rozliczeń.</p>
        </motion.section>

        {/* Prywatność — istotne dla instytucji, w języku klienta */}
        <motion.section variants={fadeUp} className="rounded-3xl border border-hair/70 bg-white/80 p-6 shadow-card backdrop-blur-sm">
          <h2 className="mb-4 text-base font-medium text-graphite">Prywatność i Twoje dane</h2>
          <ul className="space-y-3">
            {privacy.map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name={f.icon} size={16} /></span>
                <span><span className="block text-sm font-medium text-graphite">{f.label}</span><span className="block text-xs text-muted">{f.value}</span></span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Zaawansowane — własny klucz, schowany dla firm/developerów */}
        <motion.section variants={fadeUp}>
          <details className="rounded-3xl border border-hair/70 bg-white/60 px-6 py-4">
            <summary className="focusring cursor-pointer list-none text-sm font-medium text-graphite">
              Zaawansowane — własny klucz API <span className="font-normal text-muted">(dla firm i developerów)</span>
            </summary>
            <div className="mt-4 grid gap-3">
              <p className="text-xs text-muted">Domyślnie nie potrzebujesz klucza — silnik Widźwięk działa bez niego. Klucz to opcja ekspercka; zostaje na Twoim urządzeniu i nie trafia na nasz serwer.</p>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Dostawca</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value as AsrProvider)}
                  className="focusring rounded-xl border border-hair bg-white px-3 py-2.5 text-sm text-graphite">
                  {ASR_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Klucz API</span>
                <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={hasKey ? "klucz zapisany — wpisz nowy, aby podmienić" : (ASR_PROVIDERS.find((p) => p.id === provider)?.keyHint ?? "")}
                  autoComplete="off" spellCheck={false}
                  className="focusring w-full rounded-xl border border-hair bg-white px-3 py-2.5 font-mono text-sm text-graphite placeholder:text-muted/70" />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={saveKey} icon="check">Zapisz klucz</Button>
                {hasKey && <Button variant="secondary" icon="x" onClick={clearKey}>Usuń klucz</Button>}
                {saved && <span className="inline-flex items-center gap-1 text-xs text-ok"><Icon name="checkCircle" size={14} /> Zapisano w przeglądarce</span>}
              </div>
            </div>
          </details>
        </motion.section>
      </motion.div>
    </div>
  );
}

export default function Ustawienia() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl py-10 text-sm text-muted">Wczytywanie…</div>}>
      <SettingsInner />
    </Suspense>
  );
}
