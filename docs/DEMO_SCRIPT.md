# Widźwięk — scenariusz prezentacji (demo mock, bez kluczy API)

Demo działa lokalnie, **bez żadnych kluczy API**. Najważniejsze: nawet **bez uruchomionego workera**
można pokazać pełny wynik — przyciskiem **„Użyj przykładowego materiału"**.

Realne trasy: `/` (wejście) → `/app` (Przegląd) → `/app/studio` (Nowy materiał) →
`/app/napisy` · `/app/mowcy` · `/app/eksporty` · `/app/plan` · `/app/integracje` · `/app/ustawienia`.

## 0. Przygotowanie (Windows / PowerShell)
```powershell
# Terminal 1 — worker (opcjonalny dla wariantu „sample")
cd worker; python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt; copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
# Terminal 2 — frontend
cd web; npm install; copy .env.example .env.local
npm run dev   # http://localhost:3000
```

---

## Wariant A — szybkie demo (~3 min, bez workera)
1. **`/app` (Przegląd)** — hero „Napisy zgodne z WCAG — gotowe do publikacji", statystyki, ostatni raport.
   Kliknij **„Użyj przykładowego materiału"**.
2. **`/app/studio`** — automatycznie rusza tryb przykładowy: pipeline → pełny wynik (transkrypcja, napisy,
   mówcy/dźwięki, raport WCAG, eksport). Zwróć uwagę na kartę **szacunku kredytów** („w demo nie pobieramy").
3. **Raport WCAG** — „Spełnia WCAG 2.1 AA: TAK", score, lista reguł. Najmocniejszy ekran sprzedażowy.
4. **Eksport** — pobierz **SRT** i **VTT** (realne pliki, generowane lokalnie z `CaptionDocument`).

> Pointa: „To działa bez backendu i bez kluczy — widzisz docelowy przepływ produktu."

---

## Wariant B — pełne demo (~10 min, z workerem)
1. **Wejście `/`** (30 s) — logotyp, hasło, pasek funkcji (transkrypcja, mówcy, dźwięki, raport, eksport).
   „Demo w trybie mock — bez kluczy." → **Otwórz demo**.
2. **`/app` Przegląd** (1 min) — status **worker online**, badge **tryb demo · mock**, statystyki, skrót raportu,
   ostatnie projekty z akcjami **Otwórz / Raport / Eksport**.
3. **`/app/studio` Materiał** (2 min) — wgraj plik **lub** „Użyj przykładowego materiału". Pokaż **szacunek
   kredytów**. Kliknij **Przetwórz** → pipeline Audio → Transkrypcja → Mówcy → Dźwięki → WCAG → Eksport.
4. **Wynik krok po kroku** (2 min) — Transkrypcja; **Napisy** z **filtrami** (OK/uwaga/błąd) i długością linii;
   **Mówcy i dźwięki** (`[oklaski]`/`[muzyka]`) — „to captions, nie subtitles" (WCAG 1.2.2); **Raport WCAG**.
5. **`/app/eksporty`** (1 min) — duże CTA **Pobierz SRT / Pobierz VTT** + opis formatów (kompatybilność vs web/dostępność).
6. **`/app/plan` Plan i płatności** (1 min) — plan Demo, kredyty (mock), zużycie miesięczne, plany i metody
   płatności jako **placeholdery** (provider-agnostic). „Nic nie pobieramy; pokazujemy kierunek monetyzacji."
7. **`/app/integracje`** (1 min) — pogrupowane integracje, status **architektoniczny** vs **runtime**;
   „każda usługa za adapterem, demo działa bez żadnej".
8. **`/app/ustawienia`** (30 s) — przełącznik mock/API + pole klucza (dev/demo; produkcyjnie sekrety w backendzie).
9. **Stan offline** (opcjonalnie) — ubij workera: baner „Silnik offline — demo działa dalej" + „Zobacz przykład".
10. **Domknięcie** (30 s) — „Wszystkie zewnętrzne API i billing to placeholdery za interfejsami. Realna transkrypcja:
    `PIPELINE_MODE=api` + klucz OpenAI + test live na 30–60 s, **bez zmiany kontraktu danych**."

> Mapy: `docs/ROADMAP.md`, statusy: `docs/PRODUCT_STATUS.md`, integracje: `docs/EXTERNAL_APIS.md`,
> monetyzacja: `docs/MONETIZATION.md`.
