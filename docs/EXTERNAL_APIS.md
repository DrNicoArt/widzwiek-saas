# Zewnętrzne integracje — źródła, providerzy i placeholdery

Widźwięk Demo działa bez kluczy API, bez nowych SDK i bez live requestów. Architektura jest provider-agnostic:
orkiestrator wybiera źródło transkryptu i providerów, a pipeline normalizuje wynik do `CaptionDocument`.

Statusy:

- `active_demo` — działa w demo,
- `available` — dostępne jako ręczny przepływ lub UI,
- `api_ready` — adapter gotowy do testu po kluczu,
- `missing_key` — wymaga sekretu,
- `placeholder` — zaprojektowane, brak realnej logiki,
- `planned` — planowane,
- `disabled` — wyłączone,
- `failed` — błąd,
- `fallback_used` — użyto fallbacku.

## Darmowe / tanie źródła transkryptu i napisów

Te ścieżki nie są klasycznym ASR, ale mogą znacząco obniżyć koszt i czas.

| Źródło | Status | Capability | Uwagi |
|---|---|---|---|
| Import SRT | `active_demo` | `captions_import` | działa przez `/api/jobs/import` i edytor |
| Import VTT | `active_demo` | `captions_import` | działa przez `/api/jobs/import` i edytor |
| Materiał demo / mock transcript | `active_demo` | `captions_import`, `wcag_validation` | realistyczny `CaptionDocument` bez API |
| Import TXT | `placeholder` | `captions_import`, `forced_alignment` | wymaga alignmentu lub ręcznego timingu |
| Import CSV/JSON | `placeholder` | `captions_import` | docelowo normalizacja do kontraktu |
| Ręcznie wklejony transkrypt | `placeholder` | `captions_import`, `forced_alignment` | UI do dodania |
| Transkrypty Zoom/Teams/Meet/Loom/Riverside | `planned` | `captions_import`, `forced_alignment` | użytkownik dostarcza transcript |
| Platform captions import | `planned` | `captions_import` | tylko jeśli prawnie i technicznie dostępne |
| YouTube captions / auto captions | `planned` | `captions_import` | najpierw gotowe napisy, potem ASR |
| URL resolver | `placeholder` | `captions_import`, `url_audio_extract` | demo nie wykonuje scrapingu |
| yt-dlp captions/audio extraction | `planned` | `captions_import`, `url_audio_extract` | tylko zgodnie z prawem i regulaminami |
| Pobranie audio z linku | `planned` | `url_audio_extract` | etap techniczny, nie user-facing provider |
| Forced alignment na dostarczonym tekście | `placeholder` | `forced_alignment`, `word_timestamps` | tania alternatywa dla pełnego ASR |

## Płatne / commercial ASR

OpenAI jest pierwszym live providerem. Pozostali są placeholderami pod orkiestrację i decyzje koszt/jakość/szybkość.

| Provider | Status | Capability | Uwagi |
|---|---|---|---|
| OpenAI speech-to-text / Whisper / gpt-4o-transcribe / gpt-4o-mini-transcribe | `api_ready` | `batch_asr`, `word_timestamps` | `PIPELINE_MODE=api`, `OPENAI_API_KEY` |
| Deepgram | `placeholder` | `batch_asr`, `streaming_asr`, `word_timestamps` | cloud ASR |
| AssemblyAI | `placeholder` | `batch_asr`, `speaker_diarization` | cloud ASR |
| Google Speech-to-Text | `placeholder` | `batch_asr`, `word_timestamps` | commercial ASR |
| Azure Speech | `placeholder` | `batch_asr`, `speaker_diarization` | commercial ASR |
| AWS Transcribe | `placeholder` | `batch_asr`, `speaker_diarization` | commercial ASR |
| Speechmatics | `placeholder` | `batch_asr`, `word_timestamps` | high-quality ASR candidate |
| Rev.ai | `placeholder` | `batch_asr` | commercial ASR |
| IBM Watson Speech to Text | `placeholder` | `batch_asr` | commercial ASR |
| Oracle / OCI Speech | `placeholder` | `batch_asr` | commercial ASR |
| Gladia | `placeholder` | `batch_asr`, `word_timestamps` | commercial ASR |
| Soniox | `placeholder` | `batch_asr` | commercial ASR |
| Symbl.ai | `placeholder` | `batch_asr`, `speaker_diarization` | conversation intelligence |
| Verbit | `placeholder` | `batch_asr` | enterprise/human captions candidate |
| 3Play Media API | `placeholder` | `batch_asr`, `pdf_report` | accessibility captions service |
| Sonix API | `placeholder` | `batch_asr` | commercial transcription |
| Amberscript API | `placeholder` | `batch_asr` | commercial transcription |
| Happy Scribe API | `placeholder` | `batch_asr` | API availability TBD |
| Trint API | `placeholder` | `batch_asr` | API availability TBD |
| Hugging Face Inference Endpoints | `placeholder` | `batch_asr` | hosted model API |
| Replicate | `placeholder` | `batch_asr` | hosted model API |
| Groq Whisper / hosted Whisper | `placeholder` | `batch_asr` | hosted Whisper API |
| Modal / Baseten / RunPod hosted model API | `placeholder` | `batch_asr` | infrastructure for custom hosted models |

## Dźwięki niewerbalne / audio intelligence

Dźwięki są top-level capability: wykryte, istotne, dodane do captions. Nie każdy wykryty dźwięk musi być opublikowany.

| Provider | Status | Capability | Uwagi |
|---|---|---|---|
| Demo/noop sound events | `active_demo` | `sound_events` | przykładowe cues i workflow |
| Manual sound event labels | `available` | `sound_events` | edytor pozwala dodać opis dźwięku |
| YAMNet placeholder | `placeholder` | `sound_events` | AudioSet-based classifier |
| PANNs placeholder | `placeholder` | `sound_events` | audio tagging |
| AudioSet classifier placeholder | `placeholder` | `sound_events` | klasy dźwięków środowiskowych |
| CLAP-based classifier placeholder | `placeholder` | `sound_events` | semantyczne dopasowanie audio-tekst |
| Custom sound event provider | `placeholder` | `sound_events` | custom model/API |
| Cloud audio intelligence provider | `placeholder` | `sound_events` | commercial audio intelligence |
| Human review placeholder | `planned` | `sound_events` | B2B/manual QA |

## Alignment / postprocess / tekst

| Provider | Status | Capability | Uwagi |
|---|---|---|---|
| Deterministyczny formatter | `active_demo` | `text_cleanup`, `wcag_validation` | line wrapping, cue normalization |
| WhisperX alignment | `placeholder` | `forced_alignment`, `word_timestamps` | alignment po ASR lub transkrypcie |
| Forced alignment provider | `placeholder` | `forced_alignment` | dopasowanie tekstu do audio |
| LanguageTool / text cleanup | `placeholder` | `text_cleanup` | korekta i interpunkcja |
| Translation provider | `planned` | `translation` | poza bieżącym MVP |

## Eksport

| Provider | Status | Capability | Uwagi |
|---|---|---|---|
| SRT export | `active_demo` | `srt_export` | działa z `CaptionDocument` |
| VTT export | `active_demo` | `vtt_export` | działa z `CaptionDocument` |
| TXT/JSON export | `active_demo` | `text_cleanup` | działa jako eksport techniczny |
| PDF WCAG report | `planned` | `pdf_report` | placeholder dokumentu audytowego |

## Billing

Billing jest provider-agnostic. UI mówi językiem: plan, kredyty, zużycie, faktura, przelew, voucher, konto
instytucjonalne. Nie mówimy użytkownikowi "integracje płatności".

| Provider | Status | Uwagi |
|---|---|---|
| MockBillingProvider | `active_demo` | nic nie pobiera |
| StripeBillingProvider | `planned` | karty/subskrypcje |
| PaddleBillingProvider | `planned` | merchant of record/VAT |
| PayPalBillingProvider | `planned` | globalnie |
| PolishPaymentsProvider | `planned` | Przelewy24/PayU/Tpay/BLIK |
| ManualInvoiceProvider | `planned` | faktura/przelew B2B |
| VoucherProvider | `planned` | prepaid/grant/vouchery |

## Jak włączyć live transkrypcję OpenAI

1. `worker/.env`: `PIPELINE_MODE=api`, `OPENAI_API_KEY=...`, opcjonalnie `OPENAI_TRANSCRIPTION_MODEL=whisper-1`.
2. Odkomentuj `openai` w `worker/requirements.txt`, potem `pip install -r requirements.txt`.
3. Dla wideo zainstaluj `ffmpeg` i dodaj do `PATH`.
4. Uruchom `python -m widzwiek.api_check`.
5. Restart workera i test przez `/health`.

Nie dodajemy sekretów do repo. Demo i testy nie wymagają kluczy ani sieci.
