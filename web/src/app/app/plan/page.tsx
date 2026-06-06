"use client";
// Plan i płatności — warstwa monetyzacji jako PLACEHOLDER (provider-agnostic). W demo nic nie jest
// pobierane; przyciski są poglądowe. Model i ryzyka: docs/MONETIZATION.md.
import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { DEMO_PLAN, DEMO_USAGE, PLAN_TIERS, PAYMENT_METHODS, PRIMARY_ACTIONS } from "@/lib/billing";
import { fadeUp, stagger, inView } from "@/lib/motion";

export default function Plan() {
  const [hint, setHint] = useState<string | null>(null);
  const left = Math.max(0, DEMO_PLAN.creditsTotal - DEMO_PLAN.creditsUsed);
  const pct = Math.round((DEMO_PLAN.creditsUsed / DEMO_PLAN.creditsTotal) * 100);
  const maxCredits = Math.max(...DEMO_USAGE.map((u) => u.credits));

  const placeholder = (label: string) => { setHint(`„${label}" — placeholder demo. Realny billing podłączymy przez adapter (patrz docs/MONETIZATION.md).`); setTimeout(() => setHint(null), 3200); };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="card" title="Plan i płatności" demo
        desc="Model rozliczeń: kredyty / pay-per-use + subskrypcje + faktura B2B. Architektura neutralna wobec dostawcy. W demo nic nie jest pobierane." />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
        {/* Stan planu + kredyty */}
        <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-graphite">Twój plan</h3>
              <Badge tone="info" icon="sparkles">{DEMO_PLAN.planName}</Badge>
              <Badge tone="neutral">tryb: {DEMO_PLAN.billingMode}</Badge>
              <Badge tone="warn" icon="shield">Tryb demo — płatności nieaktywne</Badge>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="tnum text-3xl font-medium text-graphite">{left}<span className="text-base text-muted"> / {DEMO_PLAN.creditsTotal}</span></div>
                <div className="text-xs text-muted">kredytów pozostało</div>
              </div>
              <div className="text-right text-xs text-muted">zużyto {pct}%</div>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted">{DEMO_PLAN.unitLabel}</p>
          </div>

          <div className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
            <h3 className="mb-3 text-sm font-medium text-graphite">Zużycie miesięczne</h3>
            <div className="flex h-28 items-end gap-2">
              {DEMO_USAGE.map((u) => (
                <div key={u.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
                    <div className="w-full max-w-[28px] rounded-t bg-brand-400/80" style={{ height: `${Math.max(8, (u.credits / maxCredits) * 80)}px` }} title={`${u.credits} kredytów · ${u.minutes} min`} />
                  </div>
                  <span className="text-[10px] text-muted">{u.month.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Akcje */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <div className="flex flex-wrap gap-2.5">
            {PRIMARY_ACTIONS.map((a, i) => (
              <button key={a.id} onClick={() => placeholder(a.label)}
                className={`focusring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  i === 0 ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-hair bg-white text-graphite hover:bg-brand-50"
                }`}>
                <Icon name={a.icon} size={17} /> {a.label}
              </button>
            ))}
          </div>
          {hint && <p className="mt-3 text-xs text-brand-700">{hint}</p>}
        </motion.div>

        {/* Plany */}
        <motion.div variants={fadeUp}>
          <h3 className="mb-3 text-sm font-medium text-graphite">Plany (kierunkowo — ceny TBD)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLAN_TIERS.map((t) => (
              <div key={t.name} className={`rounded-2xl border p-5 shadow-card backdrop-blur-sm ${t.highlight ? "border-brand-300 bg-brand-50/40" : "border-hair/70 bg-white/80"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-graphite">{t.name}</h4>
                  {t.highlight && <Badge tone="info">popularny</Badge>}
                </div>
                <div className="mt-1 text-lg font-medium text-graphite">{t.priceLabel}</div>
                <p className="mt-0.5 text-xs text-muted">{t.forWhom}</p>
                <ul className="mt-3 space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-graphite"><Icon name="check" size={14} className="mt-0.5 shrink-0 text-ok" /> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Metody płatności (provider-agnostic) */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <h3 className="mb-1 text-sm font-medium text-graphite">Metody płatności</h3>
          <p className="mb-3 text-xs text-muted">Architektura provider-agnostic — żaden dostawca nie jest na sztywno wpięty. Wszystkie to placeholdery adapterów.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.id} className="rounded-xl border border-hair/60 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-graphite">{m.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">placeholder</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{m.note}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
