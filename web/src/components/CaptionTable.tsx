import type { CaptionDocument } from "@/lib/contract";
import { SPEAKER_CSS_COLOR, msToTimecode } from "@/lib/contract";

export default function CaptionTable({ doc }: { doc: CaptionDocument }) {
  const speakerById = Object.fromEntries(doc.speakers.map((s) => [s.id, s]));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Napisy ({doc.cues.length})
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {doc.speakers.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5"
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-slate-300"
                style={{ background: SPEAKER_CSS_COLOR[s.color] ?? "#999" }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <ol className="mt-4 divide-y divide-slate-100">
        {doc.cues.map((cue) => {
          const sp = cue.speaker_id ? speakerById[cue.speaker_id] : undefined;
          const isSound = cue.kind === "sound";
          return (
            <li key={cue.id} className="flex gap-3 py-2.5">
              <span className="w-6 shrink-0 text-right text-xs text-slate-400">{cue.index}</span>
              <span className="w-28 shrink-0 font-mono text-xs text-slate-400">
                {msToTimecode(cue.start_ms)}
                <br />
                {msToTimecode(cue.end_ms)}
              </span>
              <div className="min-w-0">
                {isSound ? (
                  <p className="italic text-slate-500">{cue.text}</p>
                ) : (
                  <>
                    {sp ? (
                      <span
                        className="mr-2 text-xs font-semibold"
                        style={{ color: SPEAKER_CSS_COLOR[sp.color] ?? "#555" }}
                      >
                        {sp.label}:
                      </span>
                    ) : null}
                    {cue.lines.map((l, i) => (
                      <span key={i} className="block">
                        {l}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
