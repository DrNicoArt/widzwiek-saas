# Widźwięk — MVP checklist

Kolejność jest product-centric: najpierw źródła materiału i orkiestracja, potem providerzy, jakość, eksport,
rozliczenia i hardening. Szczegóły providerów: `docs/EXTERNAL_APIS.md`.

## 1. Source ingestion

- [x] Upload audio/wideo.
- [x] Import SRT/VTT.
- [ ] Import TXT/CSV/JSON.
- [ ] Ręcznie wklejony transkrypt.
- [ ] URL input jako realny resolver tam, gdzie legalne i technicznie możliwe.

**DoD:** każde źródło trafia do jednego `CaptionDocument`, a UI pokazuje użytą ścieżkę.

## 2. First cloud transcription provider: OpenAI

- [x] Adapter OpenAI przygotowany do testu API.
- [ ] Live smoke test z realnym plikiem 30-60 s.
- [ ] Obsługa modelu `whisper-1` / `gpt-4o-transcribe` / `gpt-4o-mini-transcribe` według dostępności.

**DoD:** realne audio PL -> `CaptionDocument`, WCAG działa, eksport SRT/VTT działa.

## 3. Orchestrator strategy MVP

- [x] Model strategii i providerów w `web/src/lib/orchestration.ts`.
- [x] UI strategii: Automatyczna, Najtańsza, Najszybsza, Najdokładniejsza, Instytucjonalna, Ręczna zaawansowana.
- [ ] Backendowy `ProviderOrchestrator`.
- [ ] `ProcessingDecision` i `ProcessingAuditLog` zapisywane przy jobie.

**DoD:** system potrafi wybrać ścieżkę bez ręcznego wskazywania 15 providerów.

## 4. Existing captions import MVP

- [x] SRT/VTT import.
- [ ] Platform captions import.
- [ ] Meeting transcript import.
- [ ] Forced alignment dla dostarczonego tekstu.

**DoD:** najtańsza strategia używa gotowych napisów/transkryptu przed płatnym ASR.

## 5. Sound events MVP

- [x] Dźwięki widoczne jako top-level capability w UI.
- [x] Edytor pozwala dodawać opisy dźwięków do captions.
- [x] Panel projektu rozdziela wykryte / istotne / dodane.
- [ ] Realny `SoundEventProvider`.
- [ ] Istotność i confidence z realnego provider output.

**DoD:** co najmniej 3 klasy dźwięków z timestampami, rekomendacją i możliwością akceptacji/pominięcia.

## 6. Project-centric editor

- [x] Sidebar: Przegląd, Nowy materiał, Projekty, Plan i płatności, Ustawienia.
- [x] Zakładki projektu: Podsumowanie, Edytor napisów, Mówcy i dźwięki, Eksporty.
- [x] Pełny edytor także w statycznym demo Vercel.
- [ ] Media playback/audio waveform powiązany z cue.

**DoD:** użytkownik pracuje w kontekście jednego projektu/materiału.

## 7. WCAG quality layer

- [x] Raport jako model danych.
- [x] Status w nagłówku projektu.
- [x] Problemy w edytorze per cue.
- [x] Gotowość do publikacji w podsumowaniu i eksporcie.
- [ ] Drawer/modal szczegółowego raportu.

**DoD:** WCAG prowadzi workflow, nie jest tylko osobnym kafelkiem.

## 8. Export SRT/VTT/PDF

- [x] SRT.
- [x] VTT.
- [x] TXT/JSON.
- [ ] PDF WCAG report.
- [ ] Historia ostatniego eksportu.

**DoD:** materiał można pobrać w formatach publikacyjnych i audytowych.

## 9. Billing credits/usage

- [x] UI planu, kredytów i metod płatności jako placeholder.
- [x] Usage estimate w Nowym materiale.
- [ ] Realne saldo kredytów.
- [ ] Egzekwowanie limitów przy `create_job`.
- [ ] Faktura/przelew B2B i voucher provider.

**DoD:** job ma przewidywany i rozliczony koszt, bez SDK/sekretów w repo.

## 10. Production hardening

- [ ] Auth.
- [ ] Storage plików i trwałe projekty.
- [ ] Presigned upload.
- [ ] Limity rozmiaru/formatu.
- [ ] Monitoring/logging.
- [ ] Rate limiting.
- [ ] Security review.

**DoD:** SaaS gotowy do użytkowników instytucjonalnych, a demo nadal działa bez API.
