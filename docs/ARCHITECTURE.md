# Architektura — Widźwięk

Widźwięk ma być platformą SaaS do captions dostępnościowych i analizy audio/wideo. Nie jest jednym
dostawcą ASR ani panelem do ręcznego wybierania API. Centralnym elementem jest **Orkiestrator przetwarzania**.

## Cel produktu

Użytkownik podaje plik, link albo napisy/transkrypt. System prowadzi materiał do wyniku:

`źródło → decyzja orkiestratora → CaptionDocument → WCAG quality layer → edytor → eksport → kredyty/audyt`

Końcowym kontraktem jest `CaptionDocument`, niezależnie od tego, czy tekst pochodzi z gotowych napisów,
importu SRT/VTT/TXT, transkrypcji cloud, forced alignment czy demo mocka.

## Warstwy

```
Przeglądarka / Next.js
  upload, URL placeholder, import SRT/VTT, edytor, status WCAG, eksport
        |
        v
Worker / FastAPI
  Provider Orchestrator
    - rozpoznaje źródło
    - wybiera źródło transkryptu
    - wybiera providerów i fallbacki
    - zapisuje decyzję i koszt
        |
        v
Pipeline
  ingest/audio -> transcript/source -> diarization -> sound events -> formatter
        |
        v
CaptionDocument
        |
        v
WCAG quality layer -> editor -> SRT/VTT/TXT/JSON/PDF placeholder -> billing usage
```

## Wejścia

| Wejście | Obecny status | Docelowa decyzja orkiestratora |
|---|---|---|
| Upload audio/wideo | działa z workerem/mockiem | sprawdź audio, potem wybierz transcript source lub ASR |
| Import SRT/VTT | działa | normalizuj do `CaptionDocument`, uruchom WCAG |
| URL YouTube/TikTok/Vimeo/publiczny | placeholder UI | najpierw captions import, potem audio extraction, potem ASR |
| TXT/CSV/JSON/transkrypt spotkania | placeholder | forced alignment albo text cleanup |
| Materiał demo | działa | mock CaptionDocument bez zewnętrznych API |

Demo nie wykonuje scrapingu, nie instaluje SDK platform i nie obchodzi regulaminów. URL resolver jest projektowym
placeholderem pod przyszły legalny i techniczny przepływ.

## Orkiestrator

Modele frontowe/dokumentacyjne: `web/src/lib/orchestration.ts`.

Typy:

- `OrchestrationStrategy`
- `ProviderCapability`
- `ProviderStatus`
- `ProviderCostProfile`
- `ProviderQualityProfile`
- `ProcessingPolicy`
- `ProcessingDecision`
- `ProcessingFallback`
- `ProcessingAuditLog`

Strategie:

- Automatyczna
- Najtańsza
- Najszybsza
- Najdokładniejsza
- Instytucjonalna
- Ręczna zaawansowana

Nie eksponujemy trybu "prywatny/lokalny" jako strategii produktu. Widźwięk jest SaaS z inteligentną orkiestracją
źródeł i providerów. Ewentualne modele lokalne mogą być later/dev eksperymentem, nie główną ścieżką UI.

## Pipeline

| Etap | Odpowiedzialność | Obecny status |
|---|---|---|
| Source ingestion | upload, URL, import SRT/VTT/TXT | upload + SRT/VTT działa, URL/TXT placeholder |
| Transcript source | gotowe napisy, auto captions, import, ASR | demo + SRT/VTT działa |
| Transcription provider | cloud/API ASR tylko gdy potrzebny | OpenAI api-ready, reszta placeholder |
| Diarization provider | speaker labels i przypisanie do cues | mock/single-speaker placeholder |
| Sound event provider | wykryte, istotne i dodane dźwięki | demo/manual, realna detekcja placeholder |
| Formatter | linie, timing, cue normalization | działa deterministycznie |
| WCAG quality layer | problemy per cue i status gotowości | działa deterministycznie |
| Export provider | SRT/VTT/TXT/JSON/PDF | SRT/VTT/TXT/JSON działa, PDF placeholder |
| Billing usage | kredyty i koszt | mock/placeholder |

## Dźwięki niewerbalne

Dźwięki są top-level capability, a nie dopisek do transkrypcji. System docelowo ma wykrywać:

- muzykę,
- śmiech,
- oklaski,
- ciszę,
- pukanie,
- dzwonek/alarm,
- kroki/drzwi,
- szum,
- aplauz,
- płacz/krzyk,
- telefon/sygnał,
- intro/outro,
- zmianę nastroju muzyki.

Warstwa produktu rozdziela trzy stany: wykryte, istotne dla zrozumienia, dodane do captions.

## API workera

| Metoda | Ścieżka | Opis |
|---|---|---|
| GET | `/health` | status workera, mode, provider readiness |
| POST | `/api/jobs` | upload pliku i uruchomienie pipeline |
| GET | `/api/jobs` | lista jobów |
| GET | `/api/jobs/{id}` | status + `CaptionDocument` |
| PUT | `/api/jobs/{id}` | zapis edytowanego dokumentu i ponowna walidacja |
| DELETE | `/api/jobs/{id}` | usunięcie joba |
| POST | `/api/jobs/import` | import napisów do `CaptionDocument` |
| GET | `/api/jobs/{id}/export/srt|vtt|txt|json` | eksport |

## Stack i deploy

- `web/`: Next.js + TypeScript, Vercel-ready.
- `worker/`: Python + FastAPI, osobny backend do pipeline/audio/API.
- `contracts/`: schema `CaptionDocument`.
- `docs/ORCHESTRATOR.md`: mental model i status providerów.

Frontend i worker są rozdzielone. Vercel hostuje UI/statyczne demo, a realny worker wymaga osobnego hostingu.
To jest decyzja infrastrukturalna, nie product strategy "lokalna/prywatna".
