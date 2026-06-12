"use client";
// Plan i płatności. Stan planu i wykres liczone z REALNYCH materiałów użytkownika (listJobs).
// Stawka pokazywana wg wybranego trybu silnika. Płatności na PoC nieaktywne — uruchomimy je
// przy starcie płatnej wersji; przyciski zbierają zainteresowanie, nic nie jest pobierane.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import PaymentLogo from "@/components/billing/PaymentLogo";
import { listJobs } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { getEngineMode, ENGINE_MODES } from "@/lib/engineMode";
import { PLAN_TIERS, PAYMENT_METHODS, PRIMARY_ACTIONS, REGION_LABEL, type PayRegion } from "@/lib/billing";
import { fadeUp, stagger, inView } from "@/lib/motion";

const RATE_PER_MIN = 10; // ręczne napisy ~10 zł/min — baza wartości

type Bucket = { label: string; minutes: number };
function buildMonths(jobs: Job[]): Bucket[] {
  const now = new Date();
  const keys: { key: string; label: string; minutes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("pl-PL", { month: "short" }), minutes: 0 });
  }
  for (const j of jobs) {
    if (!j.result) continue;
    const d = new Date(j.created_at);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const b = keys.find((x) => x.key === k);
    if (b) b.minutes += Math.max(1, Math.ceil((j.result.media.duration_ms || 0) / 60000));
  }
  return keys.map(({ label, minutes }) => ({ label, minutes }));
}

export default function Plan() {
  const [hint, setHint] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => { listJobs().then(setJobs).catch(() => setJobs([])); }, []);

  const engine = ENGINE_MODES.find((m) => m.id === getEngineMode()) ?? ENGINE_MODES[0];
  const done = useMemo(() => (jobs ?? []).filter((j) => j.result), [jobs]);
  const minutes = useMemo(() => done.reduce((a, j) => a + Math.max(1, Math.ceil((j.result!.media.duration_ms || 0) / 60000)), 0), [done]);
  const materials = jobs?.length ?? 0;
  const compliant = useMemo(() => done.filter((j) => j.result!.wcag.compliant).length, [done]);
  const savings = minutes * RATE_PER_MIN;
  const months = useMemo(() => buildMonths(jobs ?? []), [jobs]);
  const maxM = Math.max(1, ...months.map((m) => m.minutes));
  const hasData = materials > 0;

  const soon = (label: string) => { setHint(`„${label}" — uruchomimy przy starcie płatnej wersji. Chcesz wcześniejszy dostęp? Daj znać zespołowi SubrosAI.`); setTimeout(() => setHint(null), 4000); };

  const groups: PayRegion[] = ["PL", "global", "b2b"];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="card" title="Plan i płatności"
        desc="Rozliczamy minuty gotowego, zgodnego z WCAG materiału. Płatności uruchomimy przy starcie wersji płatnej — w trybie demo nic nie jest pobierane." />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
        {/* Stan planu (realne dane) + wykres */}
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-graphite">Twój plan</h3>
              <Badge tone="info" icon="sparkles">Demo</Badge>
              <Badge tone="warn" icon="shield">Bez opłat w trybie demo</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><div className="tnum text-2xl font-medium text-graphite">{materials}</div><div className="text-xs text-muted">materiały</div></div>
              <div><div className="tnum text-2xl font-medium text-graphite">{minutes}</div><div className="text-xs text-muted">minuty</div></div>
              <div><div className="tnum text-2xl font-medium text-graphite">{compliant}</div><div className="text-xs text-muted">zgodne z WCAG</div></div>
            </div>

            {hasData ? (
              <div className="mt-4 rounded-xl border border-ok/30 bg-ok/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted">Wartość, którą już uzyskałeś</p>
                <p className="tnum mt-0.5 text-xl font-medium text-graphite">≈ {savings} zł zaoszczędzone</p>
                <p className="text-xs text-muted">vs ręczne napisy ~{RATE_PER_MIN} zł/min · {minutes} min przetworzonego materiału</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-hair/70 bg-slate-50/70 px-4 py-3">
                <p className="text-sm text-graphite">Brak materiałów w tej przeglądarce.</p>
                <Link href="/app/studio" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">Wgraj pierwszy materiał <Icon name="chevron" size={15} /></Link>
              </div>
            )}

            <p className="mt-3 text-xs text-muted">Aktualna stawka (tryb <span className="font-medium text-graphite">{engine.label}</span>): orientacyjnie <span className="font-medium text-graphite">{engine.price}/min</span>. Zmienisz ją w Ustawieniach.</p>
          </div>

          <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
            <h3 className="mb-3 text-sm font-medium text-graphite">Zużycie miesięczne <span className="text-xs font-normal text-muted">(min)</span></h3>
            <div className="flex h-28 items-end gap-2">
              {months.map((m, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
                    <div className={`w-full max-w-[28px] rounded-t ${m.minutes ? "bg-brand-400/80" : "bg-slate-200"}`} style={{ height: `${Math.max(4, (m.minutes / maxM) * 80)}px` }} title={`${m.minutes} min`} />
                  </div>
                  <span className="text-[10px] text-muted">{m.label}</span>
                </div>
              ))}
            </div>
            {!hasData && <p className="mt-2 text-[11px] text-muted">Wykres wypełni się, gdy zaczniesz przetwarzać materiały.</p>}
          </div>
        </motion.div>

        {/* Akcje */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <div className="flex flex-wrap gap-2.5">
            {PRIMARY_ACTIONS.map((a, i) => (
              <button key={a.id} onClick={() => soon(a.label)}
                className={`focusring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${i === 0 ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-hair bg-white text-graphite hover:bg-brand-50"}`}>
                <Icon name={a.icon} size={17} /> {a.label}
              </button>
            ))}
          </div>
          {hint && <p className="mt-3 text-xs text-brand-700">{hint}</p>}
        </motion.div>

        {/* Plany */}
        <motion.div variants={fadeUp}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-medium text-graphite">Plany</h3>
            <Badge tone="neutral">ceny ustalane</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLAN_TIERS.map((t) => (
              <div key={t.name} className={`flex flex-col rounded-2xl border p-5 shadow-card backdrop-blur-sm transition-shadow hover:shadow-lift ${t.highlight ? "border-brand-300 bg-brand-50/40" : "border-hair/70 bg-white/80"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-graphite">{t.name}</h4>
                  {t.highlight && <Badge tone="info">popularny</Badge>}
                </div>
                <div className="mt-1 text-lg font-medium text-graphite">{t.priceLabel}</div>
                <p className="mt-0.5 text-xs text-muted">{t.forWhom}</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-graphite"><Icon name="check" size={14} className="mt-0.5 shrink-0 text-ok" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => t.name === "Demo" ? undefined : soon(`${t.name}: ${t.cta}`)} disabled={t.name === "Demo"}
                  className={`focusring mt-4 w-full rounded-xl px-3 py-2 text-xs font-medium transition-colors ${t.name === "Demo" ? "cursor-default border border-ok/40 bg-ok/10 text-ok" : t.highlight ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-hair text-graphite hover:bg-brand-50"}`}>
                  {t.cta}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Metody płatności z logami */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-1 text-sm font-medium text-graphite">Metody płatności</h3>
          <p className="mb-4 text-xs text-muted">Obsłużymy popularne metody w Polsce i na świecie oraz fakturę dla instytucji. Włączymy je przy starcie wersji płatnej — kolejność zależy od potrzeb pierwszych klientów.</p>
          <div className="space-y-4">
            {groups.map((g) => {
              const items = PAYMENT_METHODS.filter((m) => m.region === g);
              if (!items.length) return null;
              return (
                <div key={g}>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{REGION_LABEL[g]}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="flex h-6 items-center"><PaymentLogo id={m.id} label={m.label} brand={m.brand} /></span>
                          <span className="truncate text-[11px] text-muted">{m.note}</span>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">wkrótce</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
