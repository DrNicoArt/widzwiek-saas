# Kontrakt danych — `CaptionDocument`

Jeden obiekt płynie przez cały pipeline i jest też odpowiedzią API do frontendu. To jedyny kontrakt
między etapami (AI → formatowanie → WCAG → eksport) oraz między **worker ↔ web**.

- **Źródło prawdy:** modele pydantic w `worker/widzwiek/contracts.py`.
- **Schema:** `contracts/caption_document.schema.json` (JSON Schema, generowana z pydantic).
- **Typy frontu:** `web/src/lib/contract.ts` (lustro w TypeScript).

Wersjonowanie pola `schema_version` (`"1.0"`) — zmiana łamiąca = bump wersji.

## Struktura

```jsonc
{
  "schema_version": "1.0",
  "media": {
    "filename": "film_tomka.mp4",
    "source_kind": "video",        // "audio" | "video"
    "duration_ms": 18000,
    "language": "pl"
  },
  "speakers": [
    { "id": "S1", "label": "Lektor", "color": "white" },   // kolory WCAG: white/yellow/cyan/green
    { "id": "S2", "label": "Gość",   "color": "yellow" }
  ],
  "cues": [
    {
      "id": "c1",
      "index": 1,
      "start_ms": 500,
      "end_ms": 3200,
      "kind": "speech",            // "speech" | "sound"
      "speaker_id": "S1",          // null dla "sound" lub nieznanego mówcy
      "lines": ["Dzień dobry, witam w naszym", "kursie o dostępności cyfrowej."],
      "text": "Dzień dobry, witam w naszym kursie o dostępności cyfrowej."
    },
    {
      "id": "c2",
      "index": 2,
      "start_ms": 3400,
      "end_ms": 4600,
      "kind": "sound",
      "speaker_id": null,
      "lines": ["[oklaski]"],
      "text": "[oklaski]"
    }
  ],
  "wcag": {
    "target": "WCAG 2.1 AA",
    "compliant": true,             // ⇐ kluczowa wartość produktu: TAK/NIE
    "generated_at": "2026-06-02T10:00:00Z",
    "stats": { "cue_count": 2, "error_count": 0, "warning_count": 0 },
    "issues": [
      // { "code": "LINE_TOO_LONG", "severity": "error", "message": "...", "cue_id": "c5", "field": "lines" }
    ]
  },
  "meta": {
    "generated_at": "2026-06-02T10:00:00Z",
    "pipeline": { "asr": "mock", "diarization": "mock", "sound_events": "mock" }
  }
}
```

## Reguły kontraktu

- `cues` posortowane rosnąco po `start_ms`; `index` ciągły od 1 (kolejność wyświetlania / numeracja SRT).
- `lines`: 1–2 elementy (limit WCAG 2 linie). Łamanie linii robi formatter, nie eksporter.
- `text`: pełny, niepołamany tekst cue (do podglądu / re-formatowania).
- Cue `kind="sound"`: `lines` zawiera opis w nawiasach kwadratowych, np. `["[muzyka napięcia]"]`; `speaker_id=null`.
- `speakers[].color`: zestaw kolorów WCAG dla VTT (`white`,`yellow`,`cyan`,`green`). SRT ignoruje kolor (używa myślnika/etykiety).
- `wcag.compliant = (error_count == 0)`. Ostrzeżenia (`warning`) **nie** łamią zgodności AA, ale są raportowane do poprawy.

## Dlaczego jeden dokument zamiast osobnych payloadów na etap

Etapy tylko **wzbogacają** ten sam obiekt → brak transformacji „każdy z każdym", łatwa serializacja na
dysk/po sieci, jeden typ do przetestowania, naturalna ewolucja do MVP (dodajemy pola, nie struktury).
