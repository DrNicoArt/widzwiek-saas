# Widźwięk — Worker (Python / FastAPI)

Pipeline AI + walidacja WCAG + eksport SRT/VTT. Dwa tryby przez `PIPELINE_MODE`:

- **mock** — pełna symulacja (bez kluczy API), do demo i pracy nad UI.
- **api** — realna transkrypcja audio przez OpenAI; diaryzacja i dźwięki niewerbalne to na razie etapy TBD.

Silniki są ukryte za interfejsami (`pipeline/asr.py`, `diarization.py`, `sound_events.py`),
a wybór trybu robi `pipeline/providers.py`. Etapy po ASR (formatowanie → WCAG → eksport)
są wspólne dla obu trybów — ten sam kontrakt `CaptionDocument`.

## Uruchomienie — tryb mock (Windows / PowerShell)

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```

- Health: http://localhost:8000/health  (pokazuje też aktywne providery)
- Swagger: http://localhost:8000/docs

## Uruchomienie — tryb API (realna transkrypcja)

1. Skopiuj `.env.example` do `.env` i ustaw:

   ```
   PIPELINE_MODE=api
   OPENAI_API_KEY=sk-...            # klucz TYLKO w .env, nigdy w kodzie
   OPENAI_TRANSCRIPTION_MODEL=whisper-1
   ```

2. (Opcjonalnie, dla wideo) zainstaluj **ffmpeg** i dodaj do PATH — worker wyekstrahuje
   audio z pliku wideo. Bez ffmpeg plik wideo jest wysyłany wprost do API (limit 25 MB).

3. Uruchom workera jak wyżej. `GET /health` powinno pokazać `"asr": "openai"`.

4. Wgraj plik audio (np. `.mp3`, `.wav`, `.m4a`) przez frontend lub `POST /api/jobs`.
   Wynik (transkrypcja → napisy → raport WCAG → SRT/VTT) trafia w istniejący flow.

> Czytelne błędy: brak `OPENAI_API_KEY` → komunikat o konieczności ustawienia klucza;
> błąd API lub ekstrakcji audio → komunikat trafia do pola `error` joba (status `error`).

## Polecenia pomocnicze

```powershell
pytest                            # testy (pipeline, tryb, WCAG, eksport, API)
python -m widzwiek.demo           # raport WCAG + SRT/VTT dla mocka, bez sieci
python -m widzwiek.export_schema  # regeneracja contracts/caption_document.schema.json
```

## Struktura

```
widzwiek/
├─ contracts.py        # modele pydantic = źródło prawdy kontraktu danych
├─ config.py           # ustawienia z ENV (PIPELINE_MODE, klucze OpenAI)
├─ jobs.py             # in-memory store jobów (PoC)
├─ main.py             # FastAPI: upload / status / eksport
├─ pipeline/
│  ├─ base.py          # interfejsy ASR/Diarization/SoundEvent + typy pośrednie
│  ├─ providers.py     # wybór silników wg PIPELINE_MODE (mock/api)
│  ├─ asr.py           # Mock + OpenAIASRProvider (API) + mapowanie wyniku
│  ├─ diarization.py   # Mock + SingleSpeaker (TBD) + Pyannote (TBD)
│  ├─ sound_events.py  # Mock + Noop (TBD) + AudioTagging (TBD)
│  ├─ audio.py         # obsługa audio + ekstrakcja audio z wideo (ffmpeg)
│  ├─ formatter.py     # łamanie linii ≤42 zn., max 2 linie, timing
│  ├─ mock_data.py     # realistyczny przykład PL
│  └─ runner.py        # orkiestracja etapów
├─ wcag/               # walidacja WCAG 2.1 AA
└─ export/             # eksport SRT / VTT
```

## Wymiana dostawcy transkrypcji

`OpenAIASRProvider` jest jedynym miejscem zależnym od OpenAI. Aby użyć innego dostawcy:
napisz klasę implementującą `ASRProvider.transcribe(...) -> list[SpeechSegment]`
i wepnij ją w `pipeline/providers.py`. Reszta pipeline'u i kontrakt danych pozostają bez zmian.

## Co działa po API, a co jest jeszcze TBD

- **Działa realnie:** transkrypcja audio (+ ekstrakcja audio z wideo przez ffmpeg),
  mapowanie na `CaptionDocument`, formatowanie napisów, walidacja WCAG, eksport SRT/VTT.
- **Placeholdery (kolejny etap):** diaryzacja mówców (`single-speaker-tbd` — jeden mówca),
  detekcja dźwięków niewerbalnych (`noop-tbd` — brak), realny czas trwania przez ffprobe.
