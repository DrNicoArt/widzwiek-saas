# Zewnętrzne integracje — placeholdery i adaptery

Widźwięk Demo Stable działa w 100% lokalnie w trybie **mock**, bez żadnych kluczy API i bez
zależności od zewnętrznej infrastruktury. Każda przyszła integracja jest ukryta za interfejsem
(provider/adapter), ma czytelną nazwę i bezpieczne zachowanie domyślne. Sekrety wyłącznie w `.env`.

## Status integracji

| Integracja | Cel | Status | Gdzie w kodzie | Włączenie |
|---|---|---|---|---|
| **OpenAI transcription** | ASR (transkrypcja PL) | adapter gotowy, bez klucza | `worker/widzwiek/pipeline/asr.py` (`OpenAIASRProvider`) | `PIPELINE_MODE=api` + `OPENAI_API_KEY` |
| **Ekstrakcja audio z wideo** | ffmpeg → audio | adapter gotowy (best-effort) | `worker/widzwiek/pipeline/audio.py` | instalacja `ffmpeg` w systemie |
| **Diaryzacja mówców** | kto mówi | placeholder (single-speaker) | `pipeline/diarization.py` (`SingleSpeakerDiarizationProvider`, `PyannoteDiarizationProvider` = TBD) | przyszły provider + token HF |
| **Dźwięki niewerbalne** | `[oklaski]`, `[muzyka]` | placeholder (noop) | `pipeline/sound_events.py` (`NoopSoundEventProvider`, `AudioTaggingSoundEventProvider` = TBD) | przyszły model audio-tagging |
| **Storage / persistencja** | trwałe joby/pliki | placeholder (in-memory + zrzut JSON) | `worker/widzwiek/jobs.py` | DB (Postgres) + obiektowy storage |
| **Auth** | konta/logowanie | brak (poza zakresem demo) | — | przyszły lekki auth (np. magic link) |
| **Płatności** | billing | brak (poza zakresem demo) | — | po MVP |
| **E-mail / powiadomienia** | dostawa wyników | brak | — | po MVP |
| **Eksport PDF raportu WCAG** | certyfikat | brak (UI ma kafel) | front: `ExportTiles` (SRT/VTT realne) | przyszły renderer PDF |
| **Integracje cloud (Drive/Dropbox)** | dostawa eksportu | brak (UI pokazuje kierunek) | — | po MVP |

## Zasady

- **Brak live requestów w testach.** Testy API mockują wywołanie (`OpenAIASRProvider._request_transcription`).
- **Graceful failure.** Brak `OPENAI_API_KEY` w trybie `api` → czytelny komunikat; demo działa w `mock`.
- **Jeden punkt wyboru.** `pipeline/providers.py::select_providers(settings)` tłumaczy `PIPELINE_MODE` na konkretne providery.
- **/health** pokazuje aktywny `mode`, realne nazwy providerów oraz `ready` (czy tryb api ma klucz).
