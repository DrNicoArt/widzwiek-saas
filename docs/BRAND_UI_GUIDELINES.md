# Widźwięk — zasady brandingu i UI

Dokument zabezpiecza kierunek wizualny, żeby kolejne prace nad frontendem były spójne.
**To nie jest redesign** — pełny refresh UI zrobimy później na osobnym branchu. Tu ustalamy reguły,
assety i tokeny, na których ten refresh ma się oprzeć.

Charakter marki: **instytucjonalny, nowoczesny, czytelny, elegancki**. Niebieski jest **akcentem
funkcjonalnym, nie tapetą** — dominują biel, lód i grafit, a niebieski prowadzi wzrok do akcji i statusów.

---

## 1. Assety

Pliki źródłowe (oficjalne, nie odtwarzać):

```
web/public/brand/
├─ logotyp.svg   # pełny logotyp: wordmark „widźwięk" + sygnet oka
└─ sygnet.svg    # sam sygnet oka
```

Kolor grafiki w plikach: **#0051A1**.

> **TBD dla projektantki (Agnieszka):** oba pliki to eksporty z CorelDRAW na kanwie A4
> (`viewBox 0 0 21000 29700`), z grafiką przesuniętą względem kanwy. Przed produkcją trzeba
> **znormalizować `viewBox`** (skadrować do obrysu grafiki) i usunąć watermark „Wersja próbna”
> oraz osadzony font. To **kadrowanie/optymalizacja eksportu, nie zmiana kształtu** — glify i
> proporcje zostają nietknięte. Do czasu normalizacji `BrandLogo`/`BrandEye` mogą renderować się
> mało czytelnie.

### Zasady użycia

Pełny **logotyp** (`logotyp.svg`):
- sidebar, header aplikacji, splash screen, ekrany startowe / logowania,
- zawsze na jasnym, spokojnym tle (White / Ice / Soft Blue),
- zachować obszar ochronny ≈ wysokość sygnetu z każdej strony,
- minimalna wysokość ekranowa ≈ 28–32 px (poniżej wordmark traci czytelność).

Sam **sygnet oka** (`sygnet.svg`):
- ikona aplikacji (favicon, PWA), loading state, watermark, status procesu, element identyfikacyjny,
- używać, gdy brak miejsca na pełny logotyp lub gdy potrzeba samego znaku.

### Czego nie robić

- ❌ **Nie odrysowywać logo ani sygnetu CSS-em / kształtami** — zawsze plik SVG.
- ❌ **Nie zastępować sygnetu ikoną oka z bibliotek** (lucide, heroicons, FontAwesome itp.). Sygnet to znak marki, nie generyczna ikona.
- ❌ **Nie zmieniać kształtu, proporcji, krzywizn** logo/sygnetu.
- ❌ Nie rozciągać niejednorodnie, nie obracać, nie dodawać cieni/obrysów/gradientów do znaku.
- ❌ Nie zmieniać koloru znaku poza dozwolonymi wariantami (granat/biel na tłach o wystarczającym kontraście).

---

## 2. Paleta (tokeny robocze)

| Token | HEX | Rola w UI |
|-------|-----|-----------|
| Brand Blue | `#0057A8` | główny akcent funkcjonalny: przyciski primary, linki, aktywne stany |
| Deep Navy | `#073763` | nagłówki, sidebar, hover na Brand Blue, akcenty instytucjonalne |
| Soft Blue | `#E7F1FB` | tła wyróżnień, podświetlenia, chip/badge informacyjny |
| Ice Background | `#F7FAFD` | tło aplikacji (główne płótno) |
| White | `#FFFFFF` | tło kart, powierzchnie |
| Graphite | `#151515` | tekst podstawowy, nagłówki |
| Text Gray | `#5F6670` | tekst drugorzędny, opisy, placeholdery |
| Border Gray | `#DDE5EE` | obramowania kart, inputów, separatory |
| Success | `#1F7A4D` | stan poprawny, „WCAG: TAK” |
| Warning | `#B7791F` | ostrzeżenia (do poprawy, nie blokujące) |
| Error | `#B42318` | błędy krytyczne, „WCAG: NIE” |

> **Uwaga o kolorze marki (TBD):** logo ma w pliku `#0051A1`, a paleta robocza UI używa Brand Blue
> `#0057A8`. Różnica jest minimalna i celowo zostawiona zespołowi do uzgodnienia: rekomendacja —
> **nie ruszać pliku logo**, a token UI ustalić jako jedną wartość (proponowane `#0057A8`).

Zasada kontrastu (spójna z misją produktu): tekst na tle ma spełniać **WCAG AA ≥ 4.5:1**.
Brand Blue na bieli i Graphite na Ice są bezpieczne; jasne akcenty (Soft Blue) tylko jako tło, nie jako tekst.

---

## 3. Komponenty UI (reguły, jeszcze nie wdrożenie)

### Przyciski
- **Primary:** tło Brand Blue, tekst biały, hover → Deep Navy, promień ~8 px. Jedna akcja główna na ekran.
- **Secondary:** tło białe, obramowanie Border Gray, tekst Graphite, hover → tło Soft Blue.
- **Ghost/tekstowy:** sam tekst Brand Blue, do akcji drugorzędnych.
- Stany `:focus-visible` zawsze widoczne (outline w Brand Blue) — dostępność to rdzeń produktu.

### Karty
- Tło White, obramowanie 1 px Border Gray, promień ~12 px, delikatny cień.
- Nagłówek sekcji: krótki, wersaliki rozstrzelone, kolor Text Gray.
- Karty oddzielają sekcje (raport, napisy, eksport) — bez ciężkich linii i bez koloru tła „na całość”.

### Statusy
- Sukces → Success + jasnozielone tło, Ostrzeżenie → Warning + jasnobursztynowe tło, Błąd → Error + jasnoczerwone tło.
- Status procesu może towarzyszyć **sygnetowi oka** (np. subtelny puls przy „przetwarzanie”).

---

## 4. Raport WCAG (kluczowy element produktu)

To najważniejszy ekran — ma komunikować werdykt natychmiast i instytucjonalnie:

- **Werdykt** jako duży, jednoznaczny baner:
  - „Spełnia WCAG 2.1 AA: **TAK**” → tło zielone (Success), lub
  - „Spełnia WCAG 2.1 AA: **NIE**” → tło czerwone (Error).
- Pod werdyktem licznik: liczba błędów (Error) i ostrzeżeń (Warning).
- Lista problemów: każdy wpis jako „pigułka” w kolorze severity (error/warning/info), z kodem reguły,
  identyfikatorem napisu i opisem. Błędy nad ostrzeżeniami.
- Ton: rzeczowy, audytorski. Bez emoji, bez krzykliwych grafik — to dokument zgodności.

(Obecna implementacja `WcagReportView` już realizuje ten układ na palecie roboczej; refresh dostroi kolory do tokenów powyżej.)

---

## 5. Splash screen / ekran startowy

Prosto i spokojnie:
- jasne tło (White lub Ice),
- **sam sygnet** lub **pełny logotyp** wyśrodkowany,
- subtelny loader pod znakiem (np. cienki pasek/spinner w Brand Blue),
- **bez rozbijania „mrugania oka” na etapy animacji** — żadnej rozbudowanej sekwencji; maks. delikatny puls/fade sygnetu,
- brak tekstu marketingowego; ewentualnie krótki podpis „SubrosAI”.

---

## 6. Co jest przygotowane pod przyszły UI refresh

- Assety marki w `web/public/brand/` (logotyp + sygnet), gotowe do podłączenia.
- Komponenty `web/src/components/BrandLogo.tsx` i `BrandEye.tsx` — cienkie wrappery na oficjalne SVG,
  **świadomie niewpięte** w obecny flow (aplikacja działa bez zmian). Refresh wystarczy, że je zaimportuje.
- Tokeny palety i reguły komponentów (ten dokument) jako podstawa design-tokens (np. zmienne CSS / Tailwind theme).

### TODO przed/na refresh (osobny branch)
- Normalizacja `viewBox` plików SVG + usunięcie watermarku i osadzonego fontu (projektant).
- Decyzja o jednej wartości Brand Blue (`#0051A1` vs `#0057A8`).
- Przeniesienie palety do design-tokens i przepięcie istniejących komponentów na tokeny.
- Favicon / ikona aplikacji z `sygnet.svg`.
- Wpięcie `BrandLogo` w header i `BrandEye` w loading/splash.

---

SubrosAI · Widźwięk · zasady brandingu (wersja robocza pod refresh)
