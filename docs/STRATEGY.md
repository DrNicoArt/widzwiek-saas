# Widźwięk — strategia (wersja operatorska)

> **Jedno zdanie:** Widźwięk to *compliance engine* dla mediów dostępnych — z dowolnego nagrania, linku lub napisów robi materiał **gotowy do publikacji zgodnie z WCAG**, z dowodem zgodności. Działa **bez API od pierwszego uruchomienia**; API jest tylko akceleratorem.
>
> **Teza (dlaczego wygramy):** Wszyscy konkurenci optymalizują *dokładność transkrypcji*. To komodyta. Niezagospodarowana jest warstwa **„publikowalna zgodność WCAG + dowód + self-serve + polski + bez wymogu płatnego API"**. To jest nasza kategoria — i nikt jej nie posiada.

---

## 0. Brutalna ocena stanu (bez hype)
- **Działa naprawdę (no-API, dziś):** walidacja WCAG + Quality Score w przeglądarce, import SRT/VTT, auto-rozpoznanie i nazwanie mówców, auto-zawijanie linii, heurystyczne dźwięki z audio, edytor prowadzony przez problemy, eksport SRT/VTT/TXT/JSON. Statyczne demo na Vercelu bez backendu.
- **Działa jako dodatek (klucz usera, w przeglądarce):** transkrypcja własnych plików (OpenAI/ElevenLabs/Deepgram).
- **Jeszcze NIE (świadomie):** hostowany worker z no-key faster-whisper (realne „wideo→napisy" bez klucza), trwała baza + konta, PDF raport audytowy, realne modele diaryzacji/dźwięków, billing produkcyjny. To Faza 1+.
- **Wniosek:** mamy działający *rdzeń wartości* (zgodność), brakuje *infrastruktury skali*. To dobra kolejność — wartość przed infrą.

## 1. Pozycjonowanie — tworzymy kategorię
- **Nie** „transcription tool". **Tak** „silnik zgodności mediów dostępnych" (accessible-media compliance).
- **Przed/po:** zamiast „dostałeś transkrypt, ogarnij sobie resztę" → „dostałeś materiał, który wolno opublikować, i dokument który to potwierdza".
- **Tagline (do testów):** „Napisy, które wolno opublikować." / „Zgodność WCAG w 10 minut, nie 10 dni." / „Widzisz to, co inni słyszą — i masz na to papier."
- **Obietnica produktu:** wrzucasz plik/link, nie wybierasz modeli, dostajesz **werdykt TAK/NIE + co poprawić + gotowy eksport**.

## 2. Insight (nieoczywista prawda)
1. **Captions ≠ subtitles.** Rynek myli transkrypcję z napisami dostępnościowymi. Dostępne napisy to mowa **+ mówcy + dźwięki niewerbalne + czytelność + timing**. Tu jest głębia, której tanie narzędzia nie robią, a drogie robią ręcznie (człowiek).
2. **Kupujący nie chce „AI", chce „spełniam prawo".** Dlatego **raport/dowód** jest produktem premium, nie dodatkiem.
3. **Zgodność to proces, nie przycisk.** Narzędzie ma *prowadzić* do zgodności (problemy→naprawa→werdykt), a nie tylko wypluć plik.

## 3. Rynek i timing — z liczbami (DO WERYFIKACJI)
- **EAA (dyrektywa 2019/882):** wymogi dostępności obowiązują w UE od **28.06.2025** dla szerokiej grupy usług cyfrowych. Polska transpozycja — analogiczny termin.
- **Sektor publiczny PL (od 2019):** podmioty publiczne muszą spełniać **WCAG 2.1 AA / EN 301 549**; multimedia wymagają napisów.
- **Skala obligowanych podmiotów w PL (rzędy wielkości, zweryfikuj):** ~2 800 gmin/JST, kilkaset uczelni, setki instytucji centralnych i kulturalnych, tysiące firm objętych EAA, media i e-learning. Każdy ma rosnący archiwalny dług nagrań do udostępnienia.
- **TAM/SAM/SOM (szkic, zweryfikuj):**
  - TAM: globalny rynek captioning/transkrypcji liczony w mld USD i rosnący dwucyfrowo.
  - SAM: PL + CEE, podmioty z obowiązkiem WCAG + agencje/e-learning.
  - SOM (12–18 mies.): 50–200 płacących kont po stronie instytucji/agencji + długi ogon self-serve.
- **Pilność:** to nie „nice to have", to **deadline z ryzykiem sankcji i skarg**. Sprzedajemy spokój i papier.

## 4. ICP i kto pierwszy (design partners)
| Segment | Kupujący | Champion | Ból |
|---|---|---|---|
| Uczelnia | kanclerz/IT/pełnomocnik ds. dostępności (BON) | wykładowca/BON | setki godzin wykładów, brak rąk |
| Instytucja publiczna | dyrektor/koordynator dostępności | specjalista ds. dostępności | kontrole, skargi, deadline |
| Agencja wideo/produkcja | właściciel/PM | montażysta | klient wymaga captions, ręcznie drogo |

**Pierwszy ruch:** 3 design-partnerzy (1 uczelnia + 1 instytucja + 1 agencja). Darmowy pilot w zamian za realne materiały, feedback i case study/referencję.

## 5. Konkurencja — teardown (gdzie wygrywamy)
| Gracz | Model | Słabość vs my |
|---|---|---|
| 3Play / Verbit | enterprise, człowiek-w-pętli, drogo, US | wolne, drogie, ang-centryczne, brak self-serve PL |
| Rev / Sonix / Happy Scribe / Amberscript | self-serve transkrypcja, płatne minuty | „subtitles" nie „captions"; brak realnej warstwy WCAG/audytu; płacisz od startu |
| YouTube/platform auto-captions | darmowe, słabe | brak mówców/dźwięków/raportu; nie dla publikacji prawnej |
| CaptionHub itp. | workflow zespołowy, drogo | enterprise, nie PL-first, nie no-API |

**Nasza luka:** PL-first **×** realny silnik WCAG + audyt **×** self-serve **×** no-API-first **×** orkiestracja (user nie wybiera modeli). Nikt nie ma wszystkich pięciu naraz.

## 6. Zasady produktu (Jobs) + magic moment
- **Opinionated defaults:** preset „WCAG czytelny" działa od razu; user nie konfiguruje 15 rzeczy.
- **Jeden werdykt:** wielkie „WCAG: TAK / do poprawy", nie tabela liczb.
- **It just works bez API.** Klucz to opcja, nie warunek.
- **Magic moment (≤60 s):** wrzucasz/importujesz materiał → po chwili: kolorowi mówcy, `[oklaski]`, podgląd na ciemnym ekranie, **Quality Score 84% / WCAG: do poprawy: 2 rzeczy** → klik „napraw" → **TAK** → pobierasz SRT/VTT/PDF. To jest demo, które sprzedaje.

## 7. Fosa i flywheel (compounding)
1. **Dane korekt → lepsze heurystyki.** Każda poprawka mówcy/dźwięku/linii uczy domyślnych reguł i **buduje polski korpus** etykiet dźwięków i wzorców dialogu — czego globalni nie mają dla PL.
2. **Audyt = lock-in.** Instytucja, która ma w Widźwięku historię zgodności i raporty, nie migruje.
3. **Workspace = retencja.** Projekty, foldery, historia eksportów → koszt zmiany rośnie.
4. **Orkiestrator = przewaga kosztowa.** Im więcej tanich źródeł (import/captiony), tym niższy koszt/minutę przy tej samej jakości — marża rośnie z wolumenem.

## 8. Architektura jako broń (skrót)
`Wejście → ORKIESTRATOR (no-API-first: import→lokalny→API) → CaptionDocument → WARSTWA WCAG (zawsze) → edytor prowadzony → eksport + audyt + rozliczenie`. Front (Vercel) liczy WCAG client-side; worker (osobny serwer) robi no-key ASR mocą serwera; API zewnętrzne tylko jako premium. Szczegóły: `docs/ARCHITECTURE.md`, `docs/ORCHESTRATOR.md`.

## 9. Model i unit economics (liczby przykładowe — zweryfikuj cenniki)
- **Jednostka:** minuta materiału; mnożnik za captions pełne (mówcy+dźwięki+raport).
- **Plany (robocze):** Free (demo/import, znak wodny w PDF) · Starter (~X zł/mies + pula minut) · Pro (więcej minut, batch, historia) · **Instytucje** (faktura/przelew, limity, audyt, wsparcie wdrożenia — najwyższa marża).
- **Koszt/minutę:**
  - *no-API* (import/lokalny worker) ≈ tylko Twój compute → **grosze**; marża brutto docelowo **>85%**.
  - *API premium* (np. OpenAI ~ $0.006/min — zweryfikuj) → koszt dostawcy + marża; user widzi cenę w kredytach, nie providera.
- **Zasada:** orkiestrator zawsze próbuje najtańszej ścieżki → niska średnia kosztu/minutę → zdrowa marża nawet w niskich cenach.
- **Monetyzacja papieru:** **PDF raport audytowy = funkcja płatna** (instytucje płacą za dowód, nie za tekst).

## 10. Go-to-market
- **Ruch wedge:** self-serve free (import + WCAG) → „aha" → płatne minuty/raport → konto instytucjonalne.
- **Kanały:** (1) outreach pod deadline (EAA/kontrole) do koordynatorów dostępności; (2) uczelnie przez BON/pełnomocników; (3) przetargi/instytucje; (4) partnerstwa z agencjami wideo (white-label/resell); (5) treści: „przewodnik WCAG dla wideo", darmowy audyt 1 pliku jako lead magnet.
- **Psychologia ceny:** darmowo „sprawdź zgodność", płatnie „dostań zgodny eksport + raport". Wartość = uniknięcie kary i czasu, nie „minuta audio".

## 11. Roadmapa + plan 90 dni (tydzień po tygodniu)
**Faza 0 (teraz):** demo no-API + Quality Score + BYO-key — ✅; cel: 3–5 pilotów ze środy.
- T1: hostowany worker (faster-whisper + ffmpeg) — realne „wideo→napisy" online.
- T2: **PDF raport audytowy** (logo, werdykt, lista problemów, data) — argument dla instytucji.
- T3: persistencja (Postgres + storage) + lekkie konta (magic link).
- T4: onboarding 3 design-partnerów na realnych materiałach; pomiar „plik→zgodny eksport".
- T5–T6: billing kredyty/subskrypcja (1 dostawca PL: P24/Tpay) + faktura B2B.
- T7–T8: realna diaryzacja + lepsze dźwięki (model) za orkiestratorem; import platform captions.
- T9–T12: batch, foldery, historia, pierwszy płacący klient, case study, decyzja o skali/finansowaniu.

## 12. Ryzyka, założenia do walidacji, kryteria kill
**Założenia do potwierdzenia:** dokładny zakres obowiązków EAA per segment; liczby obligowanych podmiotów; cenniki dostawców; gotowość instytucji do płacenia za self-serve (vs przetarg).
**Ryzyka/mitigacje:** jakość PL → no-API-first + import obniżają zależność, test prawdy na 30–60 s przed obietnicami; koszt infry → CPU start; RODO → retencja + umowy powierzenia; CORS/ToS → klucz client-side, zero scrapingu.
**Kill criteria (bądź uczciwy):** jeśli po 5–8 rozmowach z instytucjami nikt nie chce pilota mimo deadline'u → zła nisza/ICP, pivot kanału. Jeśli „test prawdy" PL daje słabą jakość i import nie ratuje → przesuń ciężar na workflow/audyt, nie na ASR.

## 13. North star + metryki wejściowe
- **North star:** **minuty materiału doprowadzone do zgodności WCAG** (i wyeksportowane).
- **Input:** % materiałów osiągających „WCAG: TAK", mediana czasu plik→zgodny eksport, koszt/minutę (orkiestrator), retencja pilotów, liczba raportów PDF.

## 14. Ekspansja kategorii (po captions)
Land: napisy WCAG. Expand: **transkrypty dostępne, audiodeskrypcja (tekst), alt/opisy, dashboard zgodności dla całych bibliotek mediów, API dla LMS/CMS**. Cel końcowy: **platforma zgodności mediów** dla instytucji w UE — captions to drzwi, nie cały dom.

---
*Dokument żywy. Liczby oznaczone „zweryfikuj" potwierdź przed użyciem w ofercie/pitchu.*
