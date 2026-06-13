"use client";
import { LOCALES, setLocale, useLocale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const loc = useLocale();
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-hair" role="group" aria-label="Język interfejsu">
      {LOCALES.map((l) => (
        <button key={l.code} type="button" onClick={() => setLocale(l.code)} aria-pressed={loc === l.code}
          className={`focusring px-2 py-0.5 text-[11px] font-medium transition-colors ${loc === l.code ? "bg-brand-600 text-white" : "text-muted hover:bg-brand-50"}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
