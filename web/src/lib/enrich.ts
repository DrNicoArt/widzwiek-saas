// Wzbogacanie napisów BEZ API (deterministycznie). Auto-rozpoznanie i nazwanie mówców na podstawie
// prefiksów "IMIĘ:" albo dialogowych myślników. Zero modeli — czysta analiza tekstu.
import type { CaptionDocument, Cue, Speaker } from "./contract";

const PALETTE = ["#f5f5f5", "#ffd400", "#22d3ee", "#4ade80", "#ff8a5b", "#c084fc"];
const NAME_RE = /^([\p{Lu}][\p{L}.'-]{1,20}(?:\s[\p{Lu}][\p{L}.'-]{1,20})?)\s*:\s*(.+)$/u;

export function autoSpeakers(doc: CaptionDocument): CaptionDocument {
  if (doc.speakers.length > 1) return doc; // już rozpoznani
  const speech = doc.cues.filter((c) => c.kind === "speech");
  if (speech.length < 2) return doc;

  // Strategia A: prefiksy "IMIĘ:"
  const names = new Map<string, string>(); // label -> id
  let matched = 0;
  for (const c of speech) {
    const m = c.text.match(NAME_RE);
    if (m && m[1].length <= 22) matched++;
  }
  const speakers: Speaker[] = [];
  const idFor = (label: string): string => {
    const key = label.trim();
    if (names.has(key)) return names.get(key)!;
    const id = `S${speakers.length + 1}`;
    speakers.push({ id, label: key, color: PALETTE[speakers.length % PALETTE.length] });
    names.set(key, id);
    return id;
  };

  let cues: Cue[];
  if (matched >= Math.max(2, Math.floor(speech.length * 0.4))) {
    // dość prefiksów -> użyj nazw, zdejmij prefiks z tekstu
    cues = doc.cues.map((c) => {
      if (c.kind !== "speech") return c;
      const m = c.text.match(NAME_RE);
      if (!m) return c;
      const sid = idFor(m[1]);
      const text = m[2].trim();
      return { ...c, speaker_id: sid, text, lines: [text] };
    });
  } else {
    // Strategia B: dialog z myślnikami -> dwóch mówców naprzemiennie
    const dash = speech.filter((c) => /^[-–—]\s/.test(c.text)).length;
    if (dash < Math.max(2, Math.floor(speech.length * 0.4))) return doc; // brak sygnału -> nie zmyślamy
    const a: Speaker = { id: "S1", label: "Mówca 1", color: PALETTE[0] };
    const b: Speaker = { id: "S2", label: "Mówca 2", color: PALETTE[1] };
    speakers.push(a, b);
    let turn = 0;
    cues = doc.cues.map((c) => {
      if (c.kind !== "speech") return c;
      if (/^[-–—]\s/.test(c.text)) turn ^= 1; // myślnik = zmiana mówcy
      const text = c.text.replace(/^[-–—]\s*/, "");
      return { ...c, speaker_id: turn === 0 ? "S1" : "S2", text, lines: [text] };
    });
  }

  if (!speakers.length) return doc;
  return { ...doc, speakers, cues };
}


// Heurystyczne tury mówców dla transkrypcji bez diaryzacji (brak API): długie pauzy = zmiana mówcy.
// Konserwatywnie: zakładamy 2 mówców tylko gdy są wyraźne, powtarzalne zmiany — inaczej nie zmyślamy.
export function heuristicTurns(doc: CaptionDocument): CaptionDocument {
  if (doc.speakers.length) return doc;
  const GAP = 2000;
  const speech = doc.cues.filter((c) => c.kind === "speech");
  if (speech.length < 4) return doc;
  let cur = 0, turns = 0, prevEnd = -Infinity;
  const map = new Map<string, number>();
  for (const c of speech) {
    if (prevEnd !== -Infinity && c.start_ms - prevEnd >= GAP) { cur ^= 1; turns++; }
    map.set(c.id, cur);
    prevEnd = c.end_ms;
  }
  if (turns < 2) return doc; // za mało zmian -> jeden mówca
  const speakers: Speaker[] = [
    { id: "S1", label: "Mówca 1", color: PALETTE[0] },
    { id: "S2", label: "Mówca 2", color: PALETTE[1] },
  ];
  const cues = doc.cues.map((c) => (c.kind === "speech" ? { ...c, speaker_id: map.get(c.id) === 1 ? "S2" : "S1" } : c));
  return { ...doc, speakers, cues };
}


// Gwarancja: po transkrypcji bez diaryzacji zawsze jest co najmniej jeden mowca ("Mówca 1"),
// a wszystkie wypowiedzi sa do niego przypisane. Inaczej edytor pokazuje "(bez mowcy)".
export function ensureDefaultSpeaker(doc: CaptionDocument): CaptionDocument {
  if (doc.speakers.length > 0) return doc;
  const hasSpeech = doc.cues.some((c) => c.kind === "speech");
  if (!hasSpeech) return doc;
  const sp: Speaker = { id: "S1", label: "Mówca 1", color: PALETTE[0] };
  const cues = doc.cues.map((c) => (c.kind === "speech" && !c.speaker_id ? { ...c, speaker_id: "S1" } : c));
  return { ...doc, speakers: [sp], cues };
}
