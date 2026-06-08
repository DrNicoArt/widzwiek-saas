# Widźwięk — realne problemy i łamiące schemat odpowiedzi

> Najpierw prawda o tym, co nas naprawdę boli. Potem dla każdego problemu rozwiązanie, które **zmienia
> reguły gry**, a nie dokłada funkcję. (Nie kopiujemy trików Spotify — bierzemy ich poziom kreatywności.)

---

## CZĘŚĆ A — Nasze realne problemy (bez ściemy)

**P1. „Instant" dla wideo jest fizycznie trudny.** Transkrypcja godzinnego wykładu to minuty pracy modelu. User oczekuje natychmiast. Bez płatnego API i bez farmy GPU „instant" wygląda na niemożliwe.

**P2. Zaufanie: „czy to NA PEWNO zgodne z WCAG?"** Automatyczne „WCAG: TAK" jest bezwartościowe, jeśli audytor/koordynator dostępności się nie zgodzi. To problem **wiarygodności i odpowiedzialności**, nie tekstu.

**P3. Mówcy i dźwięki bez API są słabe.** Diaryzacja i detekcja dźwięków z samego sygnału, bez modeli, to zgadywanie. A to jest rdzeń „captions ≠ subtitles".

**P4. Ostatnia mila = człowiek.** Pełna automatyzacja nigdy nie jest idealna. Realny koszt/czas to ręczne poprawki. Jeśli edycja jest mozolna, produkt jest wolny mimo „AI".

**P5. Po co przełączać z darmowych auto-captionów / drogiego inkumbenta?** YouTube daje captiony za darmo. 3Play/Verbit mają kontrakty. Musimy dać powód, by w ogóle nas dotknąć.

**P6. Sprzedaż do instytucji jest wolna.** Przetargi, faktury, decyzje komisji. Self-serve kartą to inny świat niż zakup instytucjonalny.

**P7. Jakość polskiego.** Akcenty, terminologia, słaby dźwięk. Globalne modele bywają ang-centryczne.

**P8. Wrażliwość danych.** Nagrania wykładów (ze studentami), materiały wewnętrzne — RODO i opór przed wysyłaniem w chmurę.

---

## CZĘŚĆ B — Łamiące schemat odpowiedzi (1:1)

### Na P1 (instant) → „Diagnoza w 3 sekundy, nie transkrypcja w 3 minuty" + przetwarzanie równoległe
- **Przeformułowanie:** user nie potrzebuje natychmiast *transkrypcji*. Potrzebuje natychmiast **werdyktu i planu**: czy ten plik ma dźwięk? czy już ma napisy? ile go jest? co będzie trzeba poprawić? To liczy się w **sekundy** (metadane + szybka próbka audio + sprawdzenie istniejących napisów). Sprzedajemy **diagnozę zgodności od ręki**, a transkrypcja dolatuje w tle.
- **Plus inżynieria:** dziel audio na N kawałków i transkrybuj **równolegle** → czas zegarowy ≈ długość kawałka, nie całości. „Instant" staje się prawdziwe nawet dla długiego wideo.
- **Efekt:** konkurencja pokazuje spinner; my w 3 s mówimy „to nagranie nie ma napisów, 42 min, brak mówców, szac. 6 problemów — zaczynam".
- *Bez API: tak (diagnoza). Równoległe chunki: na hostowanym workerze.*

### Na P2 (zaufanie) → „Red team własnych napisów" + podpis człowieka = dowód, nie obietnica
- **Przeformułowanie:** nie mów „zaufaj, że zgodne". **Zagraj audytora przeciw sobie** — wygeneruj dokładnie te zarzuty, które podniósłby kontroler WCAG, i pokaż je z gotową poprawką. Produkt = *adwersarz, który próbuje oblać Twoje napisy*, więc realny audyt już nie ma czego znaleźć.
- **Model zaufania:** maszyna **znajduje**, człowiek **zatwierdza** → odznaka „sprawdzone (maszyna + człowiek)". To jest **obronne** w sposób, w jaki „AI powiedziało OK" nigdy nie będzie. Sprzedajemy koordynatorowi dostępności **mnożnik jego pracy**, nie zamiennik jego podpisu.
- *Bez API: tak — to czysta logika reguł + UX podpisu.*

### Na P3 (mówcy/dźwięki bez API) → „Tożsamość z metadanych, nie z głosu"
- **Przeformułowanie:** nie zgaduj mówców z sygnału. **Weź imiona stamtąd, gdzie człowiek już je napisał:** slajdy/agenda („Prelegenci: ..."), opis wideo, etykiety mówców z nagrania spotkania, lista gości. Większość materiałów instytucjonalnych ma to w metadanych.
- **Dźwięki:** użyj struktury, nie tylko ML — markery rozdziałów, powtarzalne intro/outro kanału, cue-sheet muzyki. Rozpoznajemy *wzorzec*, nie „nasłuchujemy".
- **Efekt:** mówcy z nazwiskami i dźwięki bez modelu, tam gdzie konkurencja odpala drogie API i tak nie zna imion.
- *Bez API: tak (parsowanie metadanych/struktury).*

### Na P4 (ostatnia mila) → „Akceptuj, nie pisz"
- **Przeformułowanie:** nie pokazuj błędu — pokaż **gotową poprawkę do zatwierdzenia**. Każdy problem WCAG ma jednym kliknięciem zastosowywaną korektę (skróć pod tempo, podziel linię, popraw timing, dodaj prefiks mówcy). Człowiek **mówi „tak", nie pisze.**
- **Batch po regule:** „popraw wszystkie za szybkie" = 1 klik naprawia 40 cue. Czas edycji spada z godzin do minut.
- *Bez API: tak — mamy reguły i auto-fixy, trzeba je domknąć jako „approve-flow".*

### Na P5 (po co przełączać) → „Bądź warstwą NA WIERZCHU, nie zamiennikiem"
- **Przeformułowanie:** nie konkuruj z darmowymi captionami — **dokończ je**. Zaimportuj auto-captiony z YouTube/platformy i **doprowadź do zgodności** (mówcy, dźwięki, czytelność, audyt) — czyli zrób to, czego darmowe nie robią.
- **Efekt:** koszt przełączenia ≈ 0 („już masz captiony? wklej link, my je naprawimy"), a my zajmujemy *warstwę zgodności*, której nikt nie obsadził.
- *Bez API: tak (import + nasz silnik). Pobieranie z platform — zgodnie z ToS/prawem.*

### Na P6 (sprzedaż wolna) → „Wejście dołem, ekspansja górą" + raport długu jako lead magnet
- **Przeformułowanie:** nie czekaj na przetarg. Daj **jednemu wykładowcy/montażyście** darmowe, natychmiastowe narzędzie. Wartość rozlewa się w instytucji oddolnie, a **deadline (EAA) + dashboard długu** uruchamiają zakup górą.
- **Lead magnet:** darmowy **„raport długu dostępności"** dla ich kanału/biblioteki (ile materiałów niezgodnych, jakie ryzyko) — kwantyfikuje problem i tworzy pilność.
- *Bez API: tak.*

### Na P7 (polski) → flywheel korekt jako polski korpus + metadata-first
- **Przeformułowanie:** nie ścigaj globalnych modeli na ich polu. **Zbieraj korekty** (nazwy mówców, etykiety dźwięków, kondensacje) → polski korpus i pamięć kontekstu (per kanał/instytucja), którego globalni nie mają. Plus metadata-first (P3) omija słabość ASR tam, gdzie tekst już istnieje.
- *Bez API: tak (pamięć per-konto na start).*

### Na P8 (RODO) → „Nagranie nie opuszcza urządzenia" jako fosa
- **Przeformułowanie:** zamień największe tarcie w atut. Ekstrakcja i transkrypcja kluczem usera **w przeglądarce** — media nie trafiają na nasz serwer. To jednocześnie **argument prywatności** (sprzedaż do instytucji) i **zero kosztu storage** dla nas. (Już to robimy dla BYO-key.)
- *Bez API: tak (działa teraz, do podkreślenia).*

---

## Pointa
Nasz problem to nie „bufor". To **czas-do-werdyktu, zaufanie, ostatnia mila i powód przełączenia.** Łamiemy je tak:
*diagnozą w sekundy zamiast czekania na transkrypcję; red-teamem własnych napisów zamiast obietnicy zgodności;
tożsamością z metadanych zamiast zgadywania z głosu; „akceptuj, nie pisz" zamiast mozolnej edycji;
warstwą na wierzchu cudzych captionów zamiast walki z darmowym; wejściem dołem zamiast czekania na przetarg.*
Każde z tych jest do zbudowania **bez płatnego API** — API tylko podbija jakość tam, gdzie sami chcemy.

## Co budujemy najpierw (największa dźwignia, bez API)
1. **Diagnoza zgodności w sekundy** (metadane + szybka próbka + check istniejących napisów) — natychmiastowy werdykt na ekranie „Nowy materiał".
2. **„Akceptuj, nie pisz" + batch-fix po regule** — domknięcie auto-poprawek jako jeden-klik-akceptacja.
3. **Tożsamość mówców z metadanych** (wklej listę prelegentów / opis → auto-przypisanie i nazwanie).
4. **Import + „dokończ do zgodności"** jako główny wedge (warstwa na wierzchu).
