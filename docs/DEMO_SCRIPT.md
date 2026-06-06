# Widźwięk — scenariusz prezentacji (demo mock, bez kluczy API)

Demo działa lokalnie, **bez żadnych kluczy API**. Nawet **bez uruchomionego silnika przetwarzania**
można pokazać pełny wynik — przyciskiem **„Uruchom demo na przykładzie"**.

## Architektura nawigacji (project-centric)
Główny sidebar (praca użytkownika): **Przegląd · Nowy materiał · Projekty · Plan i płatności · Ustawienia**.
Wynik konkretnego materiału żyje wewnątrz projektu jako zakładki:

```
/app                          Przegląd
/app/studio                   Nowy materiał
/app/projekty                 Lista materiałów
/app/projekty/[id]            Podsumowanie projektu
/app/projekty/[id]/napisy     Transkrypcja i captions
/app/projekty/[id]/mowcy      Mówcy i dźwięki niewerbalne
/app/projekty/[id]/raport     Raport WCAG
/app/projekty/[id]/eksporty   SRT, VTT (PDF/TXT/JSON — później)
/app/plan                     Plan, kredyty, metody płatności
/app/ustawienia               Ogólne / Przetwarzanie / Dostawcy AI / Format / Dane / Płatności / Bezpieczeństwo / Developer
```
Dawne globalne ekrany (`/app/napisy`, `/app/mowcy`, `/app/eksporty`) przekierowują do zakładek projektu;
`/app/integracje` → `Ustawienia → Developer`.

## 0. Przygotowanie (Windows / PowerShell)
```powershell
# Terminal 1 — silnik przetwarzania (opcjonalny dla wariantu „przykład")
cd worker; python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt; copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
# Terminal 2 — frontend
cd web; npm install; copy .env.example .env.local
npm run dev   # http://localhost:3000
```

---

## Wariant A — szybkie demo (~3 min, bez silnika)
1. **`/app` Przegląd** — hero „Napisy zgodne z WCAG — gotowe do publikacji". Kliknij **„Użyj przykładowego materiału"**.
2. **`/app/studio`** — rusza tryb przykładowy: pipeline → pełny wynik + karta **szacunku kredytów** („w demo nie pobieramy").
3. **Raport WCAG** — „Spełnia WCAG 2.1 AA: TAK", score, lista reguł — najmocniejszy ekran sprzedażowy.
4. **Eksport** — pobierz **SRT** i **VTT** (realne pliki z `CaptionDocument`).

> Pointa: „Działa bez backendu i bez kluczy — to docelowy przepływ produktu."

---

## Wariant B — pełne demo (~10 min, z silnikiem)
1. **Wejście `/`** (30 s) — logotyp, hasło, pasek funkcji. „Demo w trybie mock — bez kluczy." → **Otwórz demo**.
2. **`/app` Przegląd** (1 min) — status online, badge **tryb demo**, statystyki, skrót raportu, ostatnie materiały
   (karty klikalne: **Otwórz / Raport / Eksport**).
3. **`/app/studio` Nowy materiał** (2 min) — wgraj plik **lub** „Uruchom demo na przykładzie". Pokaż **szacunek
   kredytów**. Pipeline Audio → Transkrypcja → Mówcy → Dźwięki → WCAG → Eksport.
4. **`/app/projekty`** (1 min) — biblioteka materiałów; wejdź w „Konferencja o dostępności 2024".
5. **Projekt → Podsumowanie** (30 s) — werdykt WCAG + skróty do zakładek (breadcrumb „Projekty / …").
6. **Projekt → Napisy** (1.5 min) — transkrypcja + captions z **filtrami** (OK/uwaga/błąd) i długością linii.
   „Podgląd i walidacja, nie edytor."
7. **Projekt → Mówcy i dźwięki** (1 min) — `[oklaski]`/`[muzyka]` — „to captions, nie subtitles" (WCAG 1.2.2).
8. **Projekt → Raport WCAG** (1 min) — werdykt TAK/NIE + score + reguły.
9. **Projekt → Eksporty** (30 s) — duże CTA **Pobierz SRT/VTT** + opis formatów; karta „Raport PDF (wkrótce)".
10. **`/app/plan`** (1 min) — plan Demo, kredyty (mock), zużycie, plany, **metody płatności** (placeholdery).
    „Tryb demo — płatności nieaktywne."
11. **`/app/ustawienia`** (1 min) — sekcje; **Przetwarzanie** (mock/API), **Dostawcy AI** (Silnik transkrypcji =
    pierwszy adapter, klucz dev/demo), **Developer** (integracje + ENV). „OpenAI to jeden z wymienialnych silników."
12. **Stan offline** (opcjonalnie) — ubij silnik: baner „Silnik offline — demo działa dalej" + „Zobacz przykład".

> Mapy: `docs/ROADMAP.md`, statusy: `docs/PRODUCT_STATUS.md`, integracje: `docs/EXTERNAL_APIS.md`,
> monetyzacja: `docs/MONETIZATION.md`.
