# Widźwięk — audyt produktu i architektury (PoC → publiczny SaaS)

> Zakres: cała aplikacja jako **produkt SaaS**, nie projekt lokalny. Widźwięk = **provider i warstwa
> orkiestrująca** nad wieloma dostawcami (Model B), sprzedająca **rezultat (minuty zgodności WCAG)**,
> nie dostęp do cudzego API. Analiza oparta na realnym kodzie repo (worker/ + web/).

---

## 0. Decyzja strategiczna, która porządkuje resztę
Potwierdzam Twój kierunek: **Model B**. Klient płaci Widźwiękowi, Widźwięk płaci providerom; klient nie wybiera silnika, tylko **tryb** (Automatyczny / Jakość / Koszt / Szybkość). BYO‑key zostaje, ale głęboko w „Zaawansowane → Własny provider (dla firm/developerów)". Jednostka sprzedaży to **minuta zgodności WCAG**, nie „minuta transkrypcji" — bo pozwala podmieniać silniki pod spodem bez zmiany oferty.

Wszystkie rekomendacje niżej wynikają z tej jednej decyzji. Jeśli to fundament, to dzisiejszy kod ma **trzy luki, które trzeba zamknąć, zanim cokolwiek pójdzie publicznie**: brak jednego źródła prawdy, brak realnego routera providerów, brak warstwy danych/wielodostępności.

---

## 1. Mocne strony (na czym budować, nie wyrzucać)
- **Kontrakt danych `CaptionDocument`** (worker/contracts.py + web/contract.ts + contracts/caption_document.schema.json) jest dobry i centralny: media, speakers, cues, wcag, style, meta{decision, quality}. To właściwy „rdzeń", wokół którego stoi cały produkt.
- **Interfejsy providerów AI** (worker/pipeline/base.py): `ASRProvider`, `DiarizationProvider`, `SoundEventProvider` jako ABC — silniki są już za abstrakcją. To realny fundament pod Model B.
- **Rejestr providerów z metadanymi** (orchestrator.py `PROVIDER_REGISTRY` + web/orchestration.ts) opisuje koszt/szybkość/jakość/wymaga‑klucza/capabilities. Słownik orkiestracji już istnieje.
- **Walidacja WCAG jako osobna warstwa** (worker/wcag/) — oddzielona od eksportu i pipeline'u. Zgodnie z zasadą „WCAG ≠ transkrypcja".
- **Eksport rozdzielony per format** (worker/export/srt|vtt|txt). Łatwo dołożyć nowe formaty.
- **Tryby pipeline'u** (auto/local/free/mock/api) + no‑API‑first jako domyślny — właściwa filozofia kosztowa.
- **Job ma już maszynę stanów** (queued/processing/done/error) — gotowy szkielet pod asynchroniczność.

## 2. Słabe strony (realne, z kodu)
- **Dwa równoległe „mózgi" (krytyczne).** Logika WCAG i pipeline istnieją podwójnie: w Pythonie (`wcag/validator.py`, `pipeline/orchestrator.py`, `jobs.normalize_document`) i w TypeScript w przeglądarce (`wcagClient.ts`, `localAsr.ts`, `audit.ts`, `autofix.ts`). To dwa źródła prawdy dla reguł WCAG — **na pewno się rozjadą**. A skoro produktem jest „przewidywalny, zaufany wynik", dwie różne walidacje to porażka rdzenia.
- **Orkiestrator to metadane, nie silnik.** `select_providers()` wybiera **jeden** zestaw wg trybu. Nie ma równoległego uruchamiania kilku providerów, scoringu jakości/kosztu per materiał ani scalania wyników. „Provider Orchestrator → Quality Scoring → Best Provider Selection", o którym piszesz, **nie istnieje** — istnieje tylko jego słownictwo.
- **Przetwarzanie synchroniczne w wątku HTTP.** `jobs.store.process()` woła pipeline inline w handlerze `POST /api/jobs`. 30‑minutowy plik blokuje workera, brak kolejki, retry, równoległości, realnego progresu. Pod realnym ruchem to się składa natychmiast.
- **Brak warstwy danych.** Joby to płaskie pliki JSON (`worker/storage/*.json`, ładowane do RAM przy starcie). Brak bazy, transakcji, zapytań, indeksów.
- **Brak modelu wielodostępności.** `Job` nie ma właściciela ani organizacji. Wszystko jest globalne. To nie jest „brak auth" — to brak **tenancy**, a doklejenie go później do płaskiego store'u to przepisanie połowy backendu.
- **Brak rejestru zużycia (usage ledger).** Nie ma gdzie zapisać: ile minut, jaki provider, jaki koszt, ile kredytów. Bez tego nie ma billingu ani rozliczenia kosztów providerów.
- **Frontend ma dwie rzeczywistości.** Ścieżka przez workera (`api.ts`) i pełna ścieżka klientowa (`localAsr/cloudAsr/wcagClient/audit`) na statyczny Vercel. Świetne na demo, ale **ścieżka klientowa nie może być silnikiem produktu** (brak gwarancji jakości, brak multi‑providera, brak billingu, zależność od urządzenia i pobierania modelu).
- **Endpoint `/api/config` bez auth** ustawia klucz API i tryb w pamięci procesu przez nieuwierzytelniony POST. W produkcji to dziura.
- **CORS otwarty (`allow_origins=*`-podobnie), brak rate‑limitu, brak walidacji plików po stronie serwera, brak skanu AV.**

## 3. Ryzyka

### 3.1 Techniczne
- **Rozjazd dwóch silników WCAG** → niespójne raporty zależnie od ścieżki. Najpoważniejsze ryzyko dla „zaufania".
- **Synchroniczny pipeline** → timeouty, brak skalowania poziomego, brak retry, utrata zadań przy restarcie.
- **Pliki JSON jako baza** → brak współbieżności, korupcja przy równoległym zapisie, brak zapytań po użytkowniku/organizacji.
- **Brak idempotencji i wersjonowania dokumentu** → edycje nadpisują; brak rozróżnienia „wynik AI" vs „zatwierdzone przez człowieka".
- **Modele AI w przeglądarce** jako ścieżka produkcyjna → niedeterministyczna jakość, zależna od sprzętu klienta.

### 3.2 Biznesowe
- **Brak ledgera zużycia** = nie da się fakturować ani liczyć marży (koszt providera vs cena dla klienta).
- **BYO‑key jako główny model** (dzisiejsze Ustawienia/Integracje) = sprzedajesz nakładkę, nie produkt; klient widzi koszt i odchodzi do źródła.
- **Brak telemetrii providerów** = orkiestrator nigdy się nie nauczy, który provider jest najlepszy dla jakiego materiału → przewaga „auto‑wybór" pozostaje marketingiem.
- **Brak modelu organizacji** = nie sprzedasz uczelni/instytucji (oni kupują na organizację, z wieloma użytkownikami i jednym rozliczeniem).

### 3.3 UX / produkt
- **Dwa „domy"**: `studio` (upload) i workspace materiału — częściowo już scalone w „Studio", dokończyć.
- **Duplikacja odpowiedzialności**: providerzy i klucze są i w „Integracje", i w „Ustawienia". Dla klienta to panel administratora systemu, nie produkt.
- **„Skaner/Audyt" (poziom organizacji) żyje obok pracy na pojedynczym materiale** — docelowo jeden spójny model: Biblioteka materiałów → Audyt → Studio materiału.
- **Język sprzedaży**: „minuty transkrypcji" zamiast „minuty zgodności" — to nie kosmetyka, to fundament cennika.

### 3.4 Skalowanie
- **API i przetwarzanie w jednym procesie** → nie rozdzielisz workerów bez zmiany przepływu.
- **Pliki na lokalnym dysku** (storage_dir, tempfile) → nie działa przy wielu instancjach; potrzebny object storage.
- **Upload przez serwer API** → duże wideo zapcha aplikację; potrzebny upload bezpośrednio do storage (presigned URL).

### 3.5 AI
- **Brak warstwy provenancji** (który provider, jaka pewność, czy poprawione ręcznie) per segment → nie da się ani audytować, ani budować korpusu korekt (Twojej realnej fosy).
- **Reguły WCAG niewersjonowane i zaszyte w dwóch miejscach** → brak „raport zwalidowany wg zestawu reguł vX", co jest istotne prawnie i przy zmianie standardu (WCAG 2.2/3.0, EN 301 549).
- **Język zaszyty na sztywno (`pl`)** → routing providerów powinien być świadomy języka (najlepszy silnik różni się per język), bo EAA jest ogólnoeuropejskie.

## 4. Czego dziś nie widać (głębsze pułapki „za pół roku")
1. **Provenancja i wersjonowanie dokumentu to nie „feature", to fundament.** Bez „wersja oryginalna AI" vs „wersja zatwierdzona przez człowieka" i bez `source/confidence/edited_by` per cue nie zbudujesz ani audytu (dowodu), ani korpusu korekt (fosy). To trzeba zaprojektować w kontrakcie **zanim** wejdą realni klienci, bo migracja danych później boli.
2. **Usage ledger jest jednocześnie billingiem, rozliczeniem providerów i danymi do routingu.** Jedna append‑only tabela `usage_events`/`provider_runs` obsługuje trzy potrzeby naraz. Brak jej teraz = trzy przebudowy później.
3. **Tenancy trzeba wprowadzić przed auth.** Sam login jest łatwy; trudne jest to, że **każde** zapytanie musi być filtrowane po organizacji. Lepiej dodać `org_id` do modelu danych od początku (nawet z jedną domyślną organizacją), niż retrofitować izolację do płaskich jobów.
4. **Router providerów potrzebuje pętli zwrotnej.** „Auto‑wybór najlepszego" wymaga zapisu wyników (jakość osiągnięta, koszt, ile człowiek poprawił) → to zasila i decyzje, i korpus. Bez telemetrii orkiestrator zostanie na zawsze statyczną heurystyką.
5. **Reguły WCAG jako wersjonowany, pinowany zestaw.** Raport powinien mówić „zwalidowano wg Widźwięk Ruleset v1 (WCAG 2.1 AA / EN 301 549)". To czyni dowód obronnym i odpornym na zmianę standardu.
6. **Prywatność/RODO jako element architektury, nie dodatek.** Upload mediów = dane osobowe (głos, wizerunek). Potrzebne: retencja, twarde usuwanie, region przechowywania, zgody. Instytucje publiczne tego wymagają na wejściu.
7. **Idempotencja i koszty providerów.** Re‑processing, retry i podwójne kliknięcia muszą być idempotentne, bo każde uruchomienie providera kosztuje realne pieniądze.

## 5. Rekomendowana architektura docelowa
Rozdzielenie na usługi, każda skalowalna osobno; start może być jednym VPS‑em (docker‑compose), ale granice już narysowane:

```
[ Frontend (Next/Vercel) ]  — cienki klient, tylko API
            │ HTTPS (JWT/sesja)
[ API Gateway / BFF ]       — auth, tenancy, walidacja, presigned upload, status, billing
            │
   ┌────────┼─────────────┬───────────────┐
[ Postgres ]   [ Queue (Redis/RQ→SQS) ]  [ Object Storage (S3/R2) ]
   │                  │                          │
   │            [ Worker Pool ]  — pipeline (ingest→ASR→diar→sounds→WCAG→export)
   │                  │
   │          [ Provider Orchestrator ] — registry + adapters + Router + scoring + telemetry
   │                  │
   │     OpenAI · Deepgram · Speechmatics · AssemblyAI · ElevenLabs · Google · Azure · faster-whisper
   │
[ Billing Service ] — usage ledger + entitlements + adaptery płatności (Stripe/Paddle/P24/PayU/Tpay/faktura)
[ Observability ] — logi strukturalne, metryki, traces, error tracking
```

Zasady:
- **Jedno źródło prawdy = serwer.** Walidacja WCAG, normalizacja, scoring żyją **tylko** w workerze. Klientowy silnik (transformers.js) degradujemy do trybu „szybki podgląd / offline / darmowy", wyraźnie oznaczonego, nie do rdzenia.
- **Klucze providerów to sekrety platformy** (server‑side, secrets manager), nie pole w UI klienta.
- **Wszystko, co kosztuje (provider), przechodzi przez Router + zapis do ledgera.**

## 6. Rekomendowana struktura katalogów (monorepo)
```
widzwiek/
├─ apps/
│  ├─ web/                      # Next (cienki klient): UI, brak logiki AI/WCAG
│  └─ api/                      # API Gateway / BFF (FastAPI lub Nest): auth, tenancy, jobs, billing
├─ services/
│  ├─ worker/                   # pula workerów: pipeline (przeniesione z dzisiejszego worker/)
│  └─ orchestrator/             # registry + adapters + router + scoring + telemetry
├─ packages/
│  ├─ contracts/                # JEDNO źródło: CaptionDocument, ruleset WCAG, typy (gen TS+Py)
│  ├─ wcag-engine/              # JEDEN walidator (port referencyjny; klient go tylko konsumuje)
│  └─ providers/                # interfejsy + adaptery providerów (per kind)
├─ infra/                       # docker-compose, IaC, migracje, CI/CD
└─ docs/
```
Klucz: `contracts/` i `wcag-engine/` są **wspólne i jednoznaczne** — koniec z dwoma mózgami. Jeśli klient ma walidować lokalnie (podgląd), robi to przez WASM/port tego samego silnika, nie przez drugą implementację.

## 7. Rekomendowana struktura providerów (serce Modelu B)
Trzy warstwy:

1. **Adapter (per dostawca, per zdolność).** Jednolity interfejs, np.:
   ```
   interface ASRAdapter {
     id; languagesSupported; costPerMinute; profile{quality,latency,reliability};
     transcribe(audioRef, {language, hints}) -> {segments[], confidence, costEstimate}
   }
   ```
   Analogicznie `DiarizationAdapter`, `SoundEventAdapter`, `TranslationAdapter`, `CleanupAdapter`. Adaptery zawijają OpenAI/Deepgram/Speechmatics/AssemblyAI/ElevenLabs/Google/Azure/faster‑whisper.
2. **Registry** — żywe metadane zdolności + koszt + jakość + język + status (rozszerzenie dzisiejszego `PROVIDER_REGISTRY`, ale z realnymi liczbami, nie opisami).
3. **Router (Decision Engine)** — wejście: profil materiału (język, długość, domena, plan klienta, strategia trybu) → wybiera/uruchamia 1..N adapterów, **scoruje wynik** (jakość + zgodność + koszt + czas wg wag trybu), **scala** (np. ASR z jednego, dźwięki z innego), **zapisuje telemetrię** (provider, jakość, koszt, korekty człowieka). Telemetria zasila kolejne decyzje i korpus.

Strategia trybu → wagi: `automatic` (zbalansowane), `most_accurate` (jakość↑, koszt ignorowany), `cheapest` (koszt↑), `fastest` (czas↑), `institutional` (jakość + audytowalność + retencja).

## 8. Rekomendowana struktura danych (Postgres, szkic)
```
orgs(id, name, plan_id, created_at)
users(id, email, ...)                          memberships(org_id, user_id, role)
projects(id, org_id, title, language, created_by, created_at)
media_assets(id, project_id, storage_key, mime, duration_ms, checksum, status, retention_until)
jobs(id, org_id, project_id, media_id, type, status, strategy, created_by, created_at, finished_at, error)
documents(id, job_id, project_id, current_version_id)         # logiczny dokument napisów
document_versions(id, document_id, kind['ai'|'human'|'merged'], ruleset_version,
                  wcag_compliant, error_count, warning_count, payload JSONB, created_by, created_at)
cue_provenance(version_id, cue_id, source_provider, confidence, edited_by)   # fosa: korpus korekt
provider_runs(id, job_id, kind, provider, language, quality_score, cost_cents, latency_ms, chosen bool, created_at)
usage_events(id, org_id, job_id, unit['wcag_minute'], quantity, credits_charged, cost_cents, created_at)  # append-only
subscriptions(org_id, plan, status, period_start, period_end)   entitlements(org_id, key, limit, used)
payment_accounts(org_id, provider, external_id)   invoices(id, org_id, amount, status, provider, ...)
wcag_rulesets(version, definition JSONB, effective_from)        # wersjonowany standard
```
`CaptionDocument` zostaje jako `payload` w `document_versions` + dochodzi provenancja per cue. To daje audyt, wersjonowanie „AI vs człowiek" i korpus korekt naraz.

## 9. Model providera płatności (przygotowanie, bez implementacji)
Jeden interfejs `PaymentProvider` (intent, checkout, webhook, refund, invoice) + adaptery: Stripe, Paddle, Przelewy24, PayU, Tpay, BLIK (zwykle przez P24/PayU), przelew/faktura B2B (ręczne potwierdzenie). Rozliczenie liczone **z `usage_events`**, niezależnie od operatora. Plany: kredyty, minuty, subskrypcja, limity organizacyjne — wszystkie jako `entitlements` nad tym samym ledgerem. Dzisiejszy `billing.ts` to dobry placeholder UI; brakuje ledgera i interfejsu adaptera po stronie serwera.

## 10. Kolejność prac: od dziś do pierwszego publicznego wdrożenia
Kolejność wg zależności (nie dat). Każdy krok zostawia działające demo.

**Krok 1 — Jedno źródło prawdy.** Uznaj worker za jedyny autorytet WCAG/normalizacji/scoringu. Klientowy silnik (transformers.js, wcagClient) zostaje jako tryb „szybki podgląd / offline", wyraźnie oznaczony; przestaje być ścieżką produktową. Wyciągnij `contracts/` i `wcag-engine/` do wspólnych pakietów.

**Krok 2 — Warstwa danych + tenancy (przed auth).** Postgres + schemat z §8 (z jedną domyślną organizacją na start). Migracja job store → DB. Każde zapytanie filtrowane po `org_id`. Dokument z wersjonowaniem (AI vs human) i provenancją.

**Krok 3 — Asynchroniczne przetwarzanie.** Kolejka + pula workerów; API tylko kolejkuje i zwraca status. Object storage (S3/R2) + upload presigned (duże wideo nie idzie przez API). Idempotencja zadań.

**Krok 4 — Orchestrator v1.** Interfejs adaptera + registry + Router (start: faster‑whisper + 2 płatne ASR) + scoring jakość/koszt + zapis `provider_runs`. Klucze providerów = sekrety platformy.

**Krok 5 — Auth + egzekwowanie wielodostępności.** Logowanie, role (właściciel/edytor/widz), izolacja organizacji na każdym endpointcie. Hardening: zamknięcie `/api/config`, CORS allowlist, rate‑limit, walidacja i limity plików, skan AV.

**Krok 6 — Billing foundation.** `usage_events` jako append‑only, entitlements/limity, **jeden** adapter płatności (Stripe) za interfejsem multi‑provider. Sprzedaż w „minutach zgodności WCAG".

**Krok 7 — Reframe produktu/UX (Model B).** „Silnik AI: Automatyczny / Jakość / Koszt / Szybkość" zamiast listy providerów; BYO‑key głęboko w „Zaawansowane (firmy/developerzy)". Dokończone Studio (materiał = jedno miejsce). Pulpit organizacji: zużycie, limity, audyt biblioteki.

**Krok 8 — Obserwowalność + prywatność.** Logi strukturalne, metryki, traces, error tracking; retencja/usuwanie mediów (RODO), region danych, zgody.

**Krok 9 — Publiczne wdrożenie v1.** Managed Postgres + Redis + Object Storage + kontenery workerów + API + frontend na Vercel; secrets manager; CI/CD; kopie zapasowe; status/monitoring.

---

### Jedno zdanie na koniec
Dzisiejsze repo jest **bardzo dobrym PoC z właściwym rdzeniem** (kontrakt danych, interfejsy providerów, rozdzielony WCAG). Żeby stało się produktem nr 1, trzeba zamknąć trzy luki w tej kolejności: **jeden silnik prawdy → warstwa danych z wielodostępnością i wersjonowaniem → realny Router providerów z telemetrią**. Billing, płatności i UX‑reframe nakładają się naturalnie na ten fundament i nie wymagają przepisywania, jeśli fundament powstanie najpierw.
