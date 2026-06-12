// Kliencki eksport SRT/VTT z CaptionDocument — lustro logiki workera (export/srt.py, vtt.py).
// Pozwala pobrać napisy w przeglądarce bez uruchomionego workera. Pliki generowane w przeglądarce.
import type { CaptionDocument } from "./contract";

const COLOR_CSS: Record<string, string> = { white: "#ffffff", yellow: "#ffff00", cyan: "#00ffff", green: "#00ff00" };

function ts(ms: number, sep: "," | "."): string {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / 3_600_000); ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000); ms -= m * 60_000;
  const s = Math.floor(ms / 1000); const msr = ms - s * 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(msr, 3)}`;
}

export function toSrt(doc: CaptionDocument): string {
  const multi = doc.speakers.length >= 2;
  const byId = Object.fromEntries(doc.speakers.map((s) => [s.id, s]));
  return doc.cues.map((c) => {
    const lines = [...c.lines];
    if (c.kind === "speech" && multi) {
      const sp = c.speaker_id ? byId[c.speaker_id] : undefined;
      lines[0] = `[${sp?.label ?? "Mówca"}] ${lines[0]}`;
    }
    return `${c.index}\n${ts(c.start_ms, ",")} --> ${ts(c.end_ms, ",")}\n${lines.join("\n")}`;
  }).join("\n\n") + "\n";
}

export function toVtt(doc: CaptionDocument): string {
  const byId = Object.fromEntries(doc.speakers.map((s) => [s.id, s]));
  const style = doc.speakers.length
    ? "STYLE\n" + doc.speakers.map((s) => `::cue(v[voice="${s.label}"]) { color: ${COLOR_CSS[s.color] ?? (s.color.startsWith("#") ? s.color : "#fff")}; }`).join("\n") + "\n\n"
    : "";
  const blocks = doc.cues.map((c) => {
    let text = c.lines.join("\n");
    if (c.kind === "speech") {
      const sp = c.speaker_id ? byId[c.speaker_id] : undefined;
      if (sp) text = `<v ${sp.label}>${text}</v>`;
    }
    return `${c.index}\n${ts(c.start_ms, ".")} --> ${ts(c.end_ms, ".")}\n${text}`;
  });
  return "WEBVTT\n\n" + style + blocks.join("\n\n") + "\n";
}

export function toTxt(doc: CaptionDocument): string {
  const byId = Object.fromEntries(doc.speakers.map((s) => [s.id, s]));
  return doc.cues.map((c) => {
    if (c.kind === "speech") {
      const sp = c.speaker_id ? byId[c.speaker_id] : undefined;
      return (sp ? `${sp.label}: ` : "") + c.text;
    }
    return c.text;
  }).join("\n") + "\n";
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
