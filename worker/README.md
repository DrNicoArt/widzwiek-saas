# Widźwięk — Worker (Python / FastAPI)

Pipeline AI + walidacja WCAG + eksport SRT/VTT. Na PoC działa na mockach
ukrytych za interfejsami (`pipeline/asr.py`, `diarization.py`, `sound_events.py`).

## Uruchomienie (Windows / PowerShell)

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```

- Health: http://localhost:8000/health
- Swagger: http://localhost:8000/docs

## Polecenia pomocnicze

```powershell
pytest                          # testy (pipeline, WCAG, eksport, API)
python -m widzwiek.demo         # raport WCAG + SRT/VTT dla mocka, bez sieci
python -m widzwiek.export_schema  # regeneracja contracts/caption_document.schema.json
```

## Struktura

```
widzwiek/
├─ contracts.py        # modele pydantic = źródło prawdy kontraktu danych
├─ config.py           # ustawienia z ENV (wybór providerów AI)
├─ jobs.py             # in-memory store jobów (PoC)
├─ main.py             # FastAPI: upload / status / eksport
├─ pipeline/
│  ├─ base.py          # interfejsy ASR/Diarization/SoundEvent + typy pośrednie
│  ├─ asr.py           # Mock + WhisperASRProvider (TBD)
│  ├─ diarization.py   # Mock + Pyannote (TBD)
│  ├─ sound_events.py  # Mock + AudioTagging (TBD)
│  ├─ formatter.py     # łamanie linii ≤42 zn., max 2 linie, timing
│  ├─ mock_data.py     # realistyczny przykład PL
│  └─ runner.py        # orkiestracja etapów
├─ wcag/
│  ├─ rules.py         # parametry WCAG 2.1 AA (z briefu PoC)
│  └─ validator.py     # raport TAK/NIE + lista problemów
└─ export/
   ├─ srt.py           # eksport SRT (bez kolorów)
   └─ vtt.py           # eksport VTT (kolory mówców)
```

## Podmiana modelu AI

Ustaw w `.env`, np. `WIDZWIEK_ASR_PROVIDER=whisper`, i zaimplementuj `transcribe()`
w odpowiedniej klasie. Reszta pipeline'u i kontrakt danych pozostają bez zmian.
