# Widźwięk — plan strategiczny

> Cel: zostać **numerem 1 w niszy napisów dostępnościowych (WCAG) dla polskiego (i potem europejskiego) audio/wideo**.
> Nie „kolejna transkrypcja", lecz **silnik zgodności WCAG**, który z dowolnego źródła robi materiał gotowy do publikacji.

## 1. Wizja w jednym zdaniu
Wrzucasz plik lub link i dostajesz **publikowalne, zgodne z WCAG napisy** — z mówcami, dźwiękami niewerbalnymi, raportem zgodności i eksportem — **bez wiedzy, jaki model zrobił robotę**.

## 2. Wedge (klin wejścia) — dlaczego wygramy
- **Transkrypcja to komodyta.** Wartością nie jest „AI zrobiło tekst", tylko **„materiał jest zgodny z WCAG i gotowy do publikacji"**. To jest warstwa, której nikt nie zrobił dobrze end-to-end dla polskiego.
- **No-API-first.** Produkt jest świetny **od pierwszego uruchomienia, bez kluczy i bez kosztów**: import napisów/auto-captionów, walidacja WCAG, auto-mówcy, auto-zawijanie, dźwięki, edytor prowadzony przez problemy, eksport. Klucz/API to **akcelerator jakości**, nie fundament.
- **Orkiestrator, nie wybór providera.** User nigdy nie wybiera „Whisper vs Deepgram". System sam dobiera najtańszą/najlepszą ścieżkę. To jest UX, którego konkurencja (techniczna, droga, US-centryczna) nie ma.

## 3. Dlaczego teraz (wiatr w żagle)
- **European Accessibility Act** (dyrektywa 2019/882) — wymogi dostępności obowiązują od **28 czerwca 2025** dla szerokiej grupy produktów i usług cyfrowych w UE.
- **Polska, sektor publiczny:** ustawa o dostępności cyfrowej (2019, transpozycja dyrektywy 2016/2102) — strony i aplikacje podmiotów publicznych muszą spełniać **WCAG 2.1 AA / EN 301 549**; multimedia wymagają napisów.
- **Efekt:** uczelnie, instytucje, media, e-learning, agencje **muszą** publikować dostępne materiały — z karą/ryzykiem za brak. To zmienia napisy z „miło mieć" w **obowiązek z deadline'em**.
- (Dokładny zakres obowiązków danego podmiotu warto potwierdzić prawnie — ale kierunek rynkowy jest jednoznaczny.)

## 4. Klient i dlaczego zapłaci
| Segment | Ból | Dlaczego Widźwięk |
|---|---|---|
| Uczelnie / e-learning | setki nagrań wykładów do udostępnienia | masowy, tani obieg + raport audytowy |
| Instytucje publiczne | wymóg prawny WCAG, kontrole | „WCAG: TAK" + PDF jako dowód zgodności |
| Agencje wideo / produkcja | klienci żądają captions, nie subtitles | mówcy + dźwięki + style + szybki eksport |
| Firmy szkoleniowe / HR | materiały muszą być dostępne | self-serve, bez działu IT |
| Media / wydawcy | wolumen + deadline | orkiestrator obniża koszt na minucie |

Kupują **rozwiązanie problemu zgodności**, nie listę funkcji.

## 5. Fosa (czego nie skopiują w tydzień)
1. **Silnik jakości WCAG** — realne reguły (linie, tempo czytania, nakładanie, mówcy, dźwięki) + Quality Score + werdykt + audyt PDF.
2. **Głębia captions ≠ subtitles** — mówcy z kolorami, dźwięki niewerbalne jako pierwszoklasowa funkcja, czytelność.
3. **Orkiestracja provider-agnostic** — kaskada źródeł (import → tanie → płatne API) sterowana strategią, nie ręcznie.
4. **No-API-first** — działa za darmo od startu; konkurencja sprzedaje drogie minuty.
5. **Polski first** — język, prawo, wsparcie; globalni gracze są drodzy i ang-centryczni.

## 6. Architektura strategiczna
```
Wejście (upload / link / import napisów)
        │
   ORKIESTRATOR  ── wybiera źródło i providerów wg strategii (koszt/jakość/szybkość)
        │           no-API-first: istniejące napisy → lokalny silnik → płatne API (premium/fallback)
        ▼
   Normalizacja → JEDEN CaptionDocument (kontrakt)
        │
   WARSTWA JAKOŚCI WCAG (zawsze) → walidacja + Quality Score + werdykt
        │
   Edytor prowadzony przez problemy (mówcy, dźwięki, styl, timing)
        │
   Eksport (SRT / VTT / TXT / JSON / PDF-audyt) + rozliczenie zużycia
```
- **Front (Vercel):** statyczne demo działa bez backendu — silnik WCAG liczy w przeglądarce; transkrypcja z kluczem usera robi się client-side.
- **Worker (osobny serwer):** realna transkrypcja no-key (faster-whisper + ffmpeg), diaryzacja, dźwięki — moc serwera, nie opłata za API.
- **API zewnętrzne:** wyłącznie dodatek jakości/szybkości (OpenAI/ElevenLabs/Deepgram/…), nigdy warunek działania.

## 7. Roadmapa fazowa
**Faza 0 — Demo (TERAZ, na SubrosAI):** ✅ w większości gotowe
- statyczne demo na Vercelu; import→WCAG→edytor→eksport bez API; transkrypcja z kluczem usera; Quality Score; czyste UX bez ściany providerów.
- Cel: pokazać kierunek, zebrać 3–5 zainteresowanych pilotów.

**Faza 1 — MVP użyteczny (tygodnie):**
- hostowany worker (no-key faster-whisper + ffmpeg) → realne „wrzuć wideo → napisy" online,
- persistencja (Postgres + storage) + lekkie konta,
- **PDF raport audytowy** (dowód zgodności — kluczowy dla instytucji),
- 2–3 piloty (uczelnia + instytucja + agencja).

**Faza 2 — Monetyzacja + jakość:**
- kredyty / subskrypcje / faktura B2B (jednostka = minuta),
- realna diaryzacja i detekcja dźwięków (modele), import platform captions,
- batch, historia, foldery projektów.

**Faza 3 — Skala:**
- workspaces zespołowe, API dla partnerów, integracje (LMS, YouTube, Vimeo), kolejne języki, EU expansion.

## 8. Model biznesowy
- **Hybryda:** kredyty/pay-per-use (twórcy) + subskrypcje (zespoły) + faktura/przelew B2B (instytucje).
- **Jednostka:** minuta materiału; mnożniki za mówców/dźwięki/raport.
- **Marża:** ścieżka no-API = tylko Twój compute (tanio); ścieżka API = koszt dostawcy + marża. Klient nie widzi providerów.

## 9. Ryzyka i mitigacje
| Ryzyko | Mitigacja |
|---|---|
| Jakość AI dla PL | no-API-first + import napisów obniżają zależność; test na realnych 30–60 s przed obietnicami |
| Koszt infry workera | start na taniej instancji CPU; GPU dopiero przy wolumenie |
| RODO / dane nagrań | jasna polityka retencji, przetwarzanie minimalne, umowy powierzenia |
| CORS/ToS dostawców | klucz usera client-side; brak scrapingu platform |
| Konkurencja (3Play, Verbit, Amberscript, Rev) | PL-first + EAA + self-serve + no-API + cena |

## 10. Najbliższe 2 tygodnie (po środzie)
1. Zmerguj branch z silnikiem no-API + Quality Score (gotowe).
2. Postaw hostowanego workera (Render/Railway/Fly) z faster-whisper + ffmpeg → realne „wideo → napisy".
3. Dodaj **PDF raport audytowy** (największy argument dla instytucji).
4. Persistencja + lekkie konta.
5. Zdobądź 3 piloty (1 uczelnia, 1 instytucja, 1 agencja) i zbieraj feedback na realnych materiałach.

## 11. Punkty na spotkanie SubrosAI (środa)
- „Transkrypcję ma każdy. My robimy **zgodność z WCAG** — gotowy do publikacji materiał i **dowód** (raport)."
- „Działa **bez API, od razu, za darmo**. Klucz/API tylko przyspiesza i podbija jakość."
- „Wpisujesz plik/link, **nie wybierasz modeli** — orkiestrator robi to za Ciebie."
- „**EAA + polskie prawo** robią z tego obowiązek, nie ciekawostkę — to rynek z deadline'em."
- Live: import napisów → problemy WCAG → Quality Score → poprawa → eksport. (Bez zależności od sieci/kluczy.)

## 12. Metryki sukcesu
- Faza 0: 3–5 zainteresowanych pilotów po demo.
- Faza 1: 1 płacący pilot; czas „plik → zgodny eksport" < 10 min.
- Faza 2: MRR > 0; retencja pilotów; koszt/minutę pod kontrolą.
- North star: **minuty materiału doprowadzone do zgodności WCAG**.
