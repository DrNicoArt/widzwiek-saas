# Zewnętrzne integracje — placeholdery, adaptery i punkty rozszerzenia

**Widźwięk Demo działa w 100% lokalnie w trybie `mock` — bez kluczy API, bez ffmpeg, bez bazy,
bez storage, bez żadnej płatnej usługi.** Każda przyszła integracja jest ukryta za interfejsem
(provider/adapter), ma czytelną nazwę, status i bezpieczny fallback. Sekrety wyłącznie w `.env`.

Statusy: **mock** (działa w demo) · **api-ready** (adapter gotowy, czeka na klucz/test) ·
**placeholder** (interfejs/stub, brak realnej logiki) · **planned** (zaprojektowane, nie kodowane) ·
**later** (po MVP).

## Pipeline AI

| Integracja | Status | Do czego | Gdzie w kodzie | ENV | Wymagane do demo | Fallback w mock |
|---|---|---|---|---|---|---|
| Transkrypcja (OpenAI) | **api-ready** | mowa → segmenty z czasami | `pipeline/asr.py::OpenAIASRProvider` | `OPENAI_API_KEY`, `OPENAI_TRANSCRIPTION_MODEL` | nie | `MockASRProvider` (przykład PL) |
| Transkrypcja (inny dostawca) | planned | alternatywa (faster-whisper lokalnie) | `pipeline/asr.py` (nowa klasa) | TBD | nie | mock |
| Ekstrakcja audio z wideo | **api-ready** | wideo → audio (ffmpeg) | `pipeline/audio.py::ensure_audio` | — (ffmpeg w PATH) | nie | pomijane (mock nie czyta pliku) |
| Diaryzacja mówców | **placeholder** | kto mówi | `pipeline/diarization.py` (`SingleSpeakerDiarizationProvider`; `PyannoteDiarizationProvider`=TBD) | `HUGGINGFACE_TOKEN` (przyszłość) | nie | mock: 2 mówców; api: 1 mówca |
| Dźwięki niewerbalne | **placeholder** | `[oklaski]`, `[muzyka]` | `pipeline/sound_events.py` (`NoopSoundEventProvider`; `AudioTaggingSoundEventProvider`=TBD) | TBD (model/API) | nie | mock: przykładowe dźwięki; api: brak |

## Dane / infrastruktura

| Integracja | Status | Do czego | Gdzie w kodzie | ENV | Wymagane do demo | Fallback w mock |
|---|---|---|---|---|---|---|
| Storage plików | **placeholder** | upload/wyniki | upload: `main.py` (temp file); brak trwałego | TBD (S3/R2/Supabase) | nie | plik tymczasowy, kasowany po jobie |
| Persistencja jobów | **placeholder** | trwałe joby/historia | `jobs.py` (in-memory + zrzut JSON) | `WIDZWIEK_STORAGE_DIR` | nie | in-memory store |
| Baza danych | planned | metadane, użytkownicy | — | `DATABASE_URL` (przyszłość) | nie | brak (in-memory) |
| Auth | later | konta/logowanie | — | TBD | nie | brak (demo otwarte) |
| Płatności | later | billing/subskrypcje | — | TBD | nie | brak |
| E-mail / powiadomienia | later | dostawa wyników | — | TBD (SMTP/provider) | nie | brak |
| Eksport PDF raportu WCAG | planned | certyfikat do pobrania | front `ExportTiles` (SRT/VTT realne) | — | nie | brak (SRT/VTT działają) |
| Integracje cloud (Drive/Dropbox) | later | dostawa eksportu | — | TBD (OAuth) | nie | brak |

## Operacje / bezpieczeństwo

| Integracja | Status | Do czego | Gdzie w kodzie | ENV | Wymagane do demo | Fallback w mock |
|---|---|---|---|---|---|---|
| Deploy frontendu | planned | Vercel (Root=`web`) | — | `NEXT_PUBLIC_WORKER_URL` | nie | localhost |
| Deploy workera | planned | VPS/GPU lub tunel | — | `WIDZWIEK_HOST/PORT/CORS_ORIGINS` | nie | localhost:8000 |
| Monitoring / logging | planned | błędy, metryki | — | TBD (Sentry/OTel) | nie | logi lokalne |
| Rate limiting | planned | ochrona API | warstwa przed `main.py` | TBD | nie | brak (lokalnie zbędne) |
| Limity plików | **planned** | maks. rozmiar/format uploadu | `main.py` (walidacja przy `create_job`) | TBD (np. `MAX_UPLOAD_MB`) | nie | brak twardego limitu |
| Bezpieczeństwo uploadu | planned | walidacja typu/treści, skan | `main.py` / `pipeline/audio.py` | — | nie | przyjmuje audio/wideo |

## Jak włączyć tryb API (przyszłość, skrót)
1. `worker/.env`: `PIPELINE_MODE=api`, `OPENAI_API_KEY=...`, opcjonalnie `OPENAI_TRANSCRIPTION_MODEL=whisper-1`.
2. Odkomentuj `openai` w `worker/requirements.txt`, `pip install -r requirements.txt`.
3. (Wideo) zainstaluj `ffmpeg` i dodaj do PATH.
4. Restart workera. `GET /health` pokaże `"mode":"api"`, `"api_key_present":true`, `"ready":true`.
Brak klucza w trybie api → czytelny błąd w polu `error` joba; demo zawsze może wrócić do `mock`.
