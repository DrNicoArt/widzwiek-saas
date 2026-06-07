# Orkiestrator przetwarzania

Widźwięk nie jest panelem do ręcznego wybierania kilkunastu API. Użytkownik ma wkleić link, wgrać plik albo
zaimportować napisy/transkrypt, a system ma wybrać najlepszą ścieżkę do gotowego materiału dostępnościowego.

## Cel

Orkiestrator jest centralną warstwą decyzyjną pomiędzy wejściem użytkownika a pipeline. Jego zadanie:

1. Rozpoznać źródło: upload audio/wideo, URL, SRT/VTT/TXT, transkrypt spotkania, materiał demo.
2. Sprawdzić, czy istnieją gotowe napisy lub transkrypt.
3. Jeśli trzeba, przygotować audio jako etap techniczny.
4. Wybrać provider transkrypcji.
5. Dobrać rozpoznawanie mówców.
6. Dobrać rozpoznawanie dźwięków niewerbalnych.
7. Znormalizować wynik do `CaptionDocument`.
8. Uruchomić WCAG quality layer.
9. Pokazać edytor, rekomendacje i eksport.
10. Zarejestrować koszt/kredyty i decyzję w audycie.

## Strategie

| Strategia | Znaczenie |
|---|---|
| Automatyczna | Balans kosztu, jakości, szybkości, typu źródła i statusu providerów. |
| Najtańsza | Najpierw gotowe napisy/import transkryptu, tanie źródła i płatne API dopiero jako fallback. |
| Najszybsza | Gotowe caption tracks, szybki cloud provider i minimalny postprocess. |
| Najdokładniejsza | Lepszy ASR, dokładniejsze timestampy, diarizacja, sound events i pełna walidacja. |
| Instytucjonalna | Stabilność, raportowalność, historia, eksporty i bezpieczne przepływy B2B. |
| Ręczna zaawansowana | Tylko dev/admin, do wymuszenia konkretnego providera lub testu adaptera. |

Nie ma strategii "prywatna/lokalna" jako trybu produktu. Ewentualne modele lokalne mogą istnieć wyłącznie jako
later/dev eksperyment lub infrastruktura hostowana, nie jako główna narracja SaaS.

## Provider groups

Modele frontowe są w `web/src/lib/orchestration.ts`:

- `TranscriptSourceProvider`
- `TranscriptionProvider`
- `DiarizationProvider`
- `SoundEventProvider`
- `AlignmentProvider`
- `TextCleanupProvider`
- `TranslationProvider`
- `ExportProvider`
- `BillingProvider`

Statusy:

- `active_demo`
- `available`
- `api_ready`
- `missing_key`
- `placeholder`
- `planned`
- `disabled`
- `failed`
- `fallback_used`

Capability tags:

- `captions_import`
- `url_audio_extract`
- `batch_asr`
- `streaming_asr`
- `word_timestamps`
- `speaker_diarization`
- `sound_events`
- `forced_alignment`
- `translation`
- `text_cleanup`
- `wcag_validation`
- `srt_export`
- `vtt_export`
- `pdf_report`

## Dźwięki niewerbalne

Dźwięki są pierwszoklasową capability Widźwięku. System rozdziela:

- dźwięk wykryty,
- dźwięk istotny dla zrozumienia,
- dźwięk dodany do captions.

Przykłady decyzji:

- wykryto muzykę w tle, rekomendowany opis: `[muzyka spokojna w tle]`,
- wykryto oklaski, dodaj do napisów,
- wykryto szum tła, pomiń jako nisko istotny.

## Obecny status

Demo działa na mocku i nie wykonuje live requestów. OpenAI jest pierwszym providerem transkrypcji gotowym do testu
po kluczu. Pozostałe providery są placeholderami lub planowane. SRT/VTT, edytor, import SRT/VTT i walidacja WCAG
działają jako realny workflow demonstracyjny.
