# Widźwięk — głos i komunikacja marki

> Źródło tożsamości technicznej: `web/src/lib/brand.ts` (nazwa, tagline, kolory→Tailwind tokeny).
> Ten dokument definiuje JAK mówimy. Wizualną stronę opisuje `BRAND_UI_GUIDELINES.md`.

## Esencja

**Widźwięk daje pewność, że materiał jest gotowy do publikacji jako dostępny cyfrowo.**
Nie sprzedajemy „AI, które robi tekst". Sprzedajemy spokój: *to spełnia WCAG / wymaga poprawek tu i tu*.

Tagline: „zobacz to, co inni słyszą".

## Dla kogo (i co ich boli)

- **Instytucje / sektor publiczny / uczelnie** — mają *obowiązek prawny* (ustawa o dostępności cyfrowej, EN 301 549 = WCAG 2.1 AA, EAA). Boją się kontroli i kompromitacji. Chcą dowodu zgodności, nie technologii.
- **Twórcy, freelancerzy, agencje** — chcą szybko i tanio dostarczyć klientowi napisy, które „przejdą", bez ręcznej dłubaniny (~10 zł/min).

## Ton głosu — cztery wymiary

| Wymiar | Jesteśmy | Nie jesteśmy |
|--------|----------|--------------|
| **Konkretny** | mówimy wynikiem („spełnia WCAG", „2 błędy do poprawki w tych miejscach") | mgliści, marketingowi, „rewolucyjni" |
| **Spokojny ekspert** | rzeczowo, bez paniki, prowadzimy za rękę | onieśmielający żargonem ani straszący karami |
| **Ludzki, nie techniczny** | „materiał", „napisy dostępnościowe", „gotowe do publikacji" | „pipeline", „provider", „mock", „orkiestrator", „API" w UI |
| **Uczciwy** | nazywamy etap wprost (np. „uruchomimy przy starcie wersji płatnej") | nie udajemy gotowości, nie obiecujemy na wyrost |

## Zasady pisania (dos / don'ts)

**Rób:**
- Mów o wartości dla klienta przy każdym elemencie UI — jeśli coś nie robi nic dla użytkownika, wytnij lub scal.
- Najpierw wynik, potem szczegół. Nagłówek = korzyść, nie nazwa funkcji.
- Polski naturalny, krótkie zdania. Liczby konkretne, nie „setki".
- Captions, nie „napisy" gdy mowa o dostępności: zaznaczaj różnicę (mowa + mówcy + dźwięki niewerbalne).

**Nie rób:**
- Słów: „demo", „mock", „placeholder", „provider", „orkiestrator", „runtime" w treściach dla użytkownika.
- Straszenia karami jako głównego argumentu — sprzedajemy gotowość i spokój, nie strach.
- Pustych wypełniaczy (zakładka/sekcja, w którą nie da się kliknąć i nic nie wnosi).
- Żargonu AI jako wartości („nasze modele", „LLM") — klienta obchodzi efekt i cena, nie silnik.

## Komunikaty kluczowe (per audytorium)

**Instytucje:** „Dowód zgodności z WCAG 2.1 AA dla Twoich nagrań — gotowy do publikacji i do kontroli. Dane w UE, z polityką retencji."

**Twórcy/agencje:** „Wgraj materiał, dostań napisy dostępnościowe i raport WCAG w minuty — zamiast godzin ręcznej roboty."

**Wspólny dowód wartości:** „X minut przetworzonego materiału ≈ Y zł zaoszczędzone vs ręczne napisy (~10 zł/min)."

## Słownik (mówimy / nie mówimy)

| Mówimy | Zamiast |
|--------|---------|
| materiał | plik / asset / job |
| napisy dostępnościowe (captions) | subtitles / transkrypt |
| gotowe do publikacji | przetworzone / done |
| tryb / jakość | model / provider / silnik AI (w UI) |
| wartość / oszczędność | kredyty / tokeny (jako pojęcie techniczne) |
| przetwarzanie w Twojej przeglądarce | static demo / client-side mock |

## Spójność wizualna (skrót)

- Kolory: tokeny Tailwind `brand-*` (błękit `#0057A8`) + `accent-*` (koral `#FB5E26`). Zmiana = jedno miejsce.
- Logo: `brand.assets.logo` / `sygnet` z `brand.config` — używać oficjalnego SVG, nie odrysowywać.
- Mniej = więcej: jeden główny CTA na ekran; reszta podrzędna.

## Checklist przed publikacją treści

- [ ] Czy nagłówek mówi korzyścią, nie nazwą funkcji?
- [ ] Czy zniknął żargon dev/AI z treści dla użytkownika?
- [ ] Czy każdy element coś robi dla klienta (albo jest wycięty)?
- [ ] Czy ton jest spokojny i konkretny, bez straszenia?
- [ ] Czy nazwa/marka i kolory idą z `brand.config` / tokenów, nie z literałów?
