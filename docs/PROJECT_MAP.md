# Widźwięk — mapa projektu (stan repo + produktu, oczami głównego architekta)

> Cel dokumentu: pełny, oparty na kodzie obraz „co realnie działa, co jest mockiem/placeholderem",
> ocena architektury i najefektywniejsza kolejność prac do publicznego wdrożenia.
> Stan na branch `main` (po Krokach 1–9 audytu + reorganizacji Studia).

---

## 1. Stan repozytorium
**Dwa runtime'y, jeden kontrakt:**
- `web/` — Next.js 14 (App Router, TS, Tailwind, framer-motion). Działa w dwóch trybach: (a) **statyczny demo** (`NEXT_PUBLIC_STATIC_DEMO=1`, na Vercelu, bez backendu — cała logika po stronie przeglądarki) i (b) z workerem (`NEXT_PUBLIC_WORKER_URL`).
- `worker/` — Python FastAPI (`widzwiek/`). Pipeline + WCAG + eksport. Joby trzymane jako pliki JSON (`worker/storage/*.json`, gitignored). 48 testów pytest.
- `services/` (nowe, scaffold) — `orchestrator/` (adaptery+Router, 6 testów), `common/` (queue, storage, billing — 5 testów).
- `contracts/` — `caption_document.schema.json` + `wcag_ruleset.json` (kanoniczny, wersjonowany — Krok 1).
- `infra/` (scaffold) — `db/0001_init.sql` (16 tabel), `docker-compose.yml`, `.env.example`.
- `docs/` — strategia, audyt, model danych, deploy, WCAG itp.
- **Repo-higiena:** OK — `worker/storage/`, `web/out/`, `.env*` nie są śledzone.
- **Branche:** `main` (produkcja → Vercel), `feat/client-wcag-engine`, `feat/no-key-engine-quality` + stare codex/*. Vercel deployuje `main`.

**Stack-wniosek:** rdzeń (kontrakt + interfejsy providerów + walidacja WCAG) jest solidny. Brakuje warstwy serwerowej produktu (DB, kolejka, storage, auth) — istnieje jako scaffold, nie jako działający backend.

---

## 2. Stan produktu — ekran po ekranie
Legenda: 🟢 realne · 🟡 częściowe · 🔵 mock/dane demo · ⚪ placeholder/atrapa.

### Landing `/`
🟢 Strona marketingowa. Statyczna treść. Bez zależności.

### Przegląd `/app`
🔵 Pulpit. Statystyki z `listJobs()` (w demo puste → `DEMO_STATS`), skrót raportu z `DEMO_DOC`, „ostatnie projekty" z `DEMO_PROJECTS`. Realny tylko gdy podłączony worker. **Dane demonstracyjne.**

### Studio `/app/studio` (hub)
🟢🟡 Serce wejścia. Zawiera:
- **Upload pliku** (dropzone) — 🟢 realny po stronie klienta: plik → „Transkrybuj bez API" (Whisper w przeglądarce, `localAsr.ts`) **albo** BYO-key (`cloudAsr.ts`) **albo** „Przetwórz" (worker, jeśli podłączony) **albo** demo (sample).
- **Tryb silnika** (Automatyczny/Jakość/Koszt/Szybkość) — 🟡 mapuje się na model Whisper (`engineMode.ts`); to jeszcze nie pełny Router providerów.
- **Link do materiału (YouTube/TikTok/…)** — ⚪ placeholder w demo; 🟡 w workerze: `url_ingest` przez yt-dlp ciągnie **tylko istniejące napisy/auto-captiony** (nie pobiera wideo, nie transkrybuje z linku).
- **Import SRT/VTT** — 🟢 realny (klient `parseSubtitles` / worker `/api/jobs/import`).
- **„Twoje materiały"** — 🔵 `DEMO_PROJECTS`.
- **Kafle: „Sprawdź wiele materiałów", „Wszystkie materiały"** — 🟢 nawigacja.

### Materiał `/app/projekty/[id]` + zakładki
Workspace materiału (nadtytuł „Materiał"). Dla **projektów demo** `doc = DEMO_DOC` (read-only-ish); dla **realnych jobów workera** edytowalny i trwały.
- **Podsumowanie** — 🟢/🔵 werdykt WCAG, Quality Score, ścieżka orkiestratora (w demo: „mock").
- **Napisy** (`CaptionsEditor`) — 🟢 realny edytor prowadzony WCAG: edycja cue, mówcy (paleta+kontrast), dźwięki, styl per-słowo, undo/redo, **„Napraw wszystko"** (timing+zawijanie+tempo, bez API), zapis → ponowna walidacja. Działa też w statycznym demo (`wcagClient`).
- **Mówcy i dźwięki** — 🟢 widok/edycja.
- **Raport** — 🟢 raport WCAG + lista problemów + **druk/PDF** (window.print).
- **Eksport** — 🟢 SRT, VTT, TXT, JSON (worker albo klient).

### Sprawdź wiele materiałów `/app/skaner`
🟢 Realny audyt klientowy: drop wielu SRT/VTT → jeden werdykt WCAG + ranking najczęstszych naruszeń. Działa offline. (URL plików napisów: 🟡 zależny od CORS.)

### Plan i płatności `/app/plan`
⚪ Placeholder. `DEMO_PLAN`, `PLAN_TIERS`, przyciski płatności → toast „placeholder". Logika kredytów dodana w `services/common/billing.py` (🟡 nie wpięta w UI).

### Ustawienia `/app/ustawienia`
🟢🟡 Strategia + status orkiestratora (z `/health`). **BYO-key** (OpenAI/ElevenLabs/Deepgram) — 🟢 realny, klucz w localStorage, transkrypcja w przeglądarce. Sekcja **Developer** (`?dev=1`) — lista providerów (🔵 metadane).

### Stare route'y `/app/napisy|mowcy|eksporty|integracje`
🟢 Redirecty do struktury project-centric / ustawień.

---

## 3. Pipeline i providerzy (worker)
- **Interfejsy ABC** (`pipeline/base.py`): ASR / Diarization / SoundEvent — 🟢 czysta abstrakcja (podmiana modeli bez ruszania reszty).
- **Tryby** (`providers.select_providers`): `mock` (🟢 pełny offline), `auto/local/free` (🟡 faster-whisper — wymaga instalacji + modeli), `api` (🟡 OpenAI — wymaga klucza+pakietu).
- **Orchestrator** (`pipeline/orchestrator.py`): 🟡 `PROVIDER_REGISTRY` + funkcje scoringu (wcag/segmentation/quality). **To metadane + ocena, NIE silnik decyzyjny** — wybór jest wg trybu, nie „uruchom N providerów, zmierz, wybierz najlepszego per materiał".
- **Router v1** (`services/orchestrator/`, nowy) — 🟢 logika scoringu per strategia z testami, ale **nie wpięta** w worker (scaffold).
- **Przetwarzanie** — 🔴 **synchroniczne w wątku HTTP** (`jobs.store.process` inline). Brak kolejki, retry, równoległości.

## 4. Silnik klientowy (web, bez API) — realna przewaga demo
- `localAsr.ts` — 🟢 Whisper w przeglądarce (transformers.js z CDN, 16 kHz, PL, znaczniki czasu). Model tiny/base/small (wybór trybem). *Wymaga testu jakości w realnym użyciu.*
- `localSound.ts` — 🟢 dźwięki niewerbalne (AST/AudioSet w przeglądarce) + fallback heurystyczny.
- `cloudAsr.ts` — 🟢 BYO-key (OpenAI/ElevenLabs/Deepgram), klucz nie opuszcza przeglądarki.
- `wcagClient.ts` — 🟢 klientowa walidacja WCAG (lustro reguł z `wcag_ruleset.json`, oznaczona jako „preview").
- `audit.ts` — 🟢 audyt wielu plików.

---

## 5. Źródła danych — czy „najlepsza ścieżka", czy zawsze ten sam pipeline?
| Źródło | Stan | Uwagi |
|---|---|---|
| Audio/wideo (plik) | 🟢 | klient Whisper / worker; brak ekstrakcji audio z wideo bez ffmpeg w workerze |
| SRT / VTT | 🟢 | import klient + worker |
| Transkrypt / gotowe napisy | 🟢 | przez import |
| YouTube / TikTok (link) | 🟡 | tylko istniejące napisy (yt-dlp); brak transkrypcji z linku; w demo placeholder |
| TXT | 🟡 | tylko eksport; jako wejście niewpięte |
| DOCX | ⚪ | brak |
| PDF | ⚪ | brak (jako wejście) |

**Werdykt:** architektura **nie wybiera jeszcze najlepszej ścieżki per materiał.** Jest jedna ścieżka wg trybu/źródła + (oddzielnie) wybór modelu w przeglądarce. „Captions import → ASR tylko gdy trzeba" jest zadeklarowane w `meta.decision`, ale realnie nie ma orkiestratora, który by skanował materiał, próbował kilku źródeł i scalał wynik. To dziura między obietnicą (Model B) a kodem.

---

## 6. Gotowość do infrastruktury zewnętrznej
| Obszar | Stan | Uwaga |
|---|---|---|
| Upload | 🟡 | przez API/przeglądarkę; brak presigned upload (duże wideo zapcha API) |
| Storage | 🔴 | pliki JSON / localStorage; brak object storage i DB |
| Workery / kolejka | 🔴 | przetwarzanie synchroniczne; brak kolejki i puli workerów |
| Modele AI | 🟡 | lokalne wymagają instalacji/modeli; klientowe z CDN |
| Eksporty | 🟢 | SRT/VTT/TXT/JSON |
| Historia projektów | 🟡 | pliki JSON (worker) / demo |
| Monitoring / logi zdarzeń | 🔴 | brak strukturalnych logów, metryk, error trackingu |
| Wielodostępność (org/user) | 🔴 | brak — `Job` bez właściciela; schemat w `infra/db` (scaffold) |
| Billing / płatności | ⚪/🟡 | UI placeholder; logika kredytów scaffold; brak operatora |
| Skalowanie | 🔴 | jeden proces, FS storage, sync — nie skaluje poziomo |

Scaffoldy z Kroków 2–9 (schemat DB, interfejsy kolejki/storage, compose, billing, hardening) są napisane, ale **nie wpięte** — to plan do uruchomienia, nie działająca infrastruktura.

---

## 7. Mapa decyzyjna

### Największe mocne strony
1. **Kontrakt `CaptionDocument` + interfejsy providerów** — właściwy, rozszerzalny rdzeń.
2. **Realna walidacja WCAG jako osobna warstwa** + wersjonowany ruleset (jedno źródło prawdy) — to jest produkt, nie ozdoba.
3. **Działający edytor prowadzony WCAG + „Napraw wszystko"** — namacalna wartość, działa też offline.
4. **Silnik klientowy bez API** (Whisper + AST + WCAG w przeglądarce) — unikalne demo „działa za darmo, od ręki".
5. **Dojrzałe, spójne UI** i przemyślany słownik orkiestracji.

### Największe słabości / luki
1. **Brak warstwy serwerowej produktu** (DB, kolejka, storage, auth) — jest tylko scaffold.
2. **Orchestrator to metadane, nie silnik decyzyjny** — brak realnego „wybierz najlepszego providera per materiał".
3. **Przetwarzanie synchroniczne** — nie zniesie realnego ruchu.
4. **Dwa silniki (klient vs worker)** — ryzyko rozjazdu (częściowo spięte przez wspólny ruleset; reszta wymaga konwergencji).
5. **Wąskie wejścia** — brak DOCX/PDF/TXT-jako-wejście, brak transkrypcji z linku, brak tłumaczeń.
6. **Brak provenancji per cue i wersjonowania dokumentu** (AI vs człowiek) — fundament audytu i korpusu korekt, dziś go nie ma w danych.

### Największe ryzyka
- **Techniczne:** rozjazd walidacji, brak kolejki, FS jako baza, brak idempotencji (każde uruchomienie providera = koszt).
- **Produktowe:** „nakładka na API" zamiast produktu (Model B niezrealizowany w kodzie); brak rejestru zużycia = brak billingu i marży.
- **Skalowania:** jeden proces + FS storage + sync → ściana przy kilku użytkownikach.
- **AI:** jakość lokalnego Whispera po polsku niezweryfikowana w realu; brak telemetrii providerów = orkiestrator się nie uczy.

### Najcenniejsze przewagi (do obrony)
- Korpus decyzji korekcyjnych (po wpięciu provenancji), system zapisu/dowodu zgodności, ciągły monitoring, jedno źródło reguł. (Szczegóły: `docs/THESIS.md`.)

### Do natychmiastowej poprawy
1. Domknąć rozjazd „dwóch mózgów" — worker jako jedyny autorytet, klient = preview (zaczęte Krokiem 1).
2. Wpiąć Router providerów (`services/orchestrator`) w realny wybór ścieżki, choćby dla 2–3 ASR.
3. Zamienić synchroniczne przetwarzanie na kolejkę + status (nawet prosty in-process worker na start).

### Do rozbudowy (wartość)
- Wejścia: transkrypcja z linku, TXT/DOCX/PDF jako wejście, tłumaczenia.
- Burn-in pionowy (social) jako osobny eksport (worker FFmpeg).
- Raport biblioteki (PDF), eksport hurtowy ZIP.

---

## 8. Najefektywniejsza kolejność prac do publicznego wdrożenia
Kolejność wg zależności (każdy krok zostawia działające demo):

1. **Warstwa danych + tenancy** (Postgres wg `infra/db/0001_init.sql`, `org_id` wszędzie, wersjonowanie dokumentu + provenancja). Migracja store JSON → DB.
2. **Async** — kolejka + pula workerów; API tylko kolejkuje; object storage + presigned upload; idempotencja.
3. **Orchestrator v1 w produkcji** — adaptery + Router + telemetria `provider_runs`; klucze jako sekrety platformy (Model B w kodzie, nie tylko w UI).
4. **Auth + izolacja organizacji** + hardening (CORS allowlist, rate-limit, walidacja plików, `/api/config` wyłączony w prod).
5. **Billing** — `usage_events` (ledger), entitlements, jeden operator (Stripe) za interfejsem; sprzedaż „minut zgodności WCAG".
6. **Rozszerzenie wejść** — link→transkrypcja, TXT/DOCX/PDF, tłumaczenia.
7. **Obserwowalność + RODO** — logi/metryki/tracing/error tracking; retencja/usuwanie mediów, region UE.
8. **Wdrożenie v1** — managed Postgres+Redis+Object Storage+workery+API+frontend; secrets manager; CI/CD; backupy.

**Jedno zdanie:** Widźwięk jest bardzo dobrym PoC z właściwym rdzeniem i unikalnym silnikiem klientowym, ale do roli produktu nr 1 brakuje warstwy serwerowej (dane/kolejka/storage/auth/billing) i realnego orkiestratora providerów — i to jest właściwa kolejność prac.

---

> **Uwaga kierunkowa:** priorytety z sekcji 8 są skorygowane w `docs/QUALITY_THESIS.md` — jakość wyniku, warstwa pewności i pętla uczenia wyprzedzają provider orchestration. Patrz ten dokument jako nadrzędny dla kolejności prac.
