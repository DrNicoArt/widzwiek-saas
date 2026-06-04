import type { WcagReport } from "@/lib/contract";

const SEVERITY_STYLE: Record<string, string> = {
  error: "border-red-300 bg-red-50 text-red-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};

const SEVERITY_LABEL: Record<string, string> = {
  error: "BŁĄD",
  warning: "OSTRZEŻENIE",
  info: "INFO",
};

export default function WcagReportView({ report }: { report: WcagReport }) {
  const ok = report.compliant;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Raport zgodności
      </h2>

      <div
        className={`mt-3 flex items-center justify-between rounded-lg p-4 ${
          ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}
      >
        <div>
          <p className="text-xs uppercase tracking-wide opacity-70">{report.target}</p>
          <p className="text-2xl font-bold">
            {ok ? "Spełnia WCAG: TAK" : "Spełnia WCAG: NIE"}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>{report.stats.error_count} błędów</p>
          <p>{report.stats.warning_count} ostrzeżeń</p>
        </div>
      </div>

      {report.issues.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Brak uwag — napisy spełniają sprawdzane reguły.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {report.issues.map((it, i) => (
            <li
              key={i}
              className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLE[it.severity]}`}
            >
              <span className="mr-2 rounded bg-white/60 px-1.5 py-0.5 text-xs font-semibold">
                {SEVERITY_LABEL[it.severity]}
              </span>
              <span className="font-mono text-xs">{it.code}</span>
              {it.cue_id ? <span className="ml-1 text-xs opacity-70">({it.cue_id})</span> : null}
              <p className="mt-1">{it.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
