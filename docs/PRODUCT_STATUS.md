# Widźwięk — status produktu

Widźwięk jest platformą SaaS do captions dostępnościowych, WCAG i analizy audio/wideo. Rdzeniem produktu jest
**Orkiestrator przetwarzania**, który wybiera źródło transkryptu i providerów. OpenAI jest pierwszym providerem
transkrypcji, ale produkt nie jest zaprojektowany jako "OpenAI integration".

## Działa teraz

- Project-centric UI: Przegląd, Nowy materiał, Projekty, Plan i płatności, Ustawienia.
- Import SRT/VTT do `CaptionDocument`.
- Pełny edytor napisów: cue, timing, mówcy, dźwięki, style, kontrast, undo/redo, zapis.
- WCAG quality layer: problemy per cue, status zgodności, rewalidacja po zapisie.
- Eksport SRT/VTT/TXT/JSON.
- Worker FastAPI: `/health`, joby, import, update document, eksport.
- Mock demo bez zewnętrznych API.
- Tryb statycznego demo na Vercel przez `NEXT_PUBLIC_STATIC_DEMO=1`.
- Dokumentacyjny i frontendowy model orkiestratora w `web/src/lib/orchestration.ts`.

## Działa w demo / mock

- Transkrypcja, mówcy i dźwięki dla przykładowego materiału.
- Szacunek kredytów i usage.
- Billing UI: plan, kredyty, metody płatności, faktura B2B jako placeholder.
- Dźwięki niewerbalne jako workflow: wykryte, istotne, dodane do captions.

Demo nie wymaga klucza API, sieci, SDK providerów, bazy danych ani realnego checkoutu.

## API-ready

- OpenAI speech-to-text po `PIPELINE_MODE=api` i `OPENAI_API_KEY`.
- Ekstrakcja audio z wideo przez ffmpeg jako etap techniczny.

## Placeholdery

- Orkiestrator backendowy z realną decyzją providerów.
- URL resolver i import captions z platform.
- Import TXT/CSV/JSON i transkrypty spotkań.
- Realna diaryzacja mówców.
- Realne sound events / audio intelligence.
- PDF WCAG report.
- Billing credits z realnym saldem i checkoutem.
- Auth, storage produkcyjny, monitoring, rate limiting.

## Sound events jako wyróżnik

Dźwięki niewerbalne są strategicznym wyróżnikiem Widźwięku. Produkt ma docelowo wykrywać i oceniać:

- muzykę,
- śmiech,
- oklaski,
- ciszę,
- pukanie,
- alarmy/dzwonki,
- kroki/drzwi,
- szum,
- emocjonalne reakcje,
- intro/outro,
- zmianę nastroju muzyki.

Nie każdy wykryty dźwięk trafia do napisów. System powinien proponować opisy tylko dla dźwięków istotnych dla
zrozumienia materiału.

## Co jest mockiem

- Automatyczna decyzja orkiestratora jest modelem UI/dokumentacji, nie pełnym backendowym routerem.
- Providerzy poza OpenAI są placeholderami.
- Detekcja dźwięków i diarizacja są mock/manual.
- Billing i kredyty nie pobierają pieniędzy.
- URL ingestion nie wykonuje live requestów.

## Co wymaga realnych API

- Transkrypcja live: pierwszy krok OpenAI.
- Alternatywni providerzy ASR: Deepgram, AssemblyAI, Google, Azure, AWS, Speechmatics itd.
- Import captions z platform i URL extraction.
- Realne sound events.
- Realna diarizacja.
- Realny billing.

## Kolejny etap MVP

1. Backendowy Orchestrator Strategy MVP.
2. Source ingestion: upload + URL placeholder -> realny resolver tam, gdzie legalne.
3. Existing captions import MVP.
4. OpenAI live transcription.
5. Sound events MVP.
6. Persistent projects/storage.
7. PDF report and institutional audit trail.
8. Billing credits/usage.
9. Production hardening.
