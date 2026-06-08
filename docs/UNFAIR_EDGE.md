# Widźwięk — nieuczciwe przewagi (myślenie Spotify P2P / „przejazd na pomarańczowym")

> Zasada: nie dokładać funkcji, tylko **przeformułować ograniczenie**, które wszyscy konkurenci traktują jako stałe.
> Konkurencja walczy o „dokładniejszą transkrypcję". To zła wojna. Poniżej osiem dźwigni, które robią z Widźwięku coś,
> czego nie da się dogonić feature'em.

---

## 1. „Nie generuj tego, co już istnieje" — Transkrypt-P2P (forced alignment)
**Insight:** 80% materiałów, które muszą być zgodne z WCAG, **już ma gdzieś tekst**: skrypt prelegenta, slajdy/PDF wykładu, auto-captiony z YouTube, transkrypt ze spotkania (Zoom/Teams), artykuł, na podstawie którego powstał film. Konkurencja **spala compute ASR, żeby od zera odtworzyć tekst, który już jest.**
**Ruch (analog P2P Spotify — weź dane stamtąd, gdzie już są):** najpierw zbierz istniejący tekst, a potem zrób **forced alignment** (dopasowanie znanego tekstu do czasów audio) zamiast transkrypcji.
**Dlaczego to broń:** alignment jest ~darmowy, **dokładniejszy niż ASR** i **zero halucynacji** (tekst jest prawdziwy, dokładasz tylko timing). „Wklej skrypt / wrzuć slajdy → my zsynchronizujemy."
**Status:** do zbudowania **bez API** (alignment to czas, nie model językowy). Killer dla uczelni (mają skrypty/slajdy).

## 2. „Przejazd na pomarańczowym" — celowa niedoskonałość jako zaleta dostępności
**Insight:** WCAG i osoba niesłysząca **nie potrzebują transkrypcji słowo-w-słowo.** Potrzebują czytelności: tempo ≤ ~21 zn/s, ≤2 linie, mówcy, dźwięki. Verbatim często jest **za szybkie do przeczytania** — czyli gorsze. Telewizja od dekad robi „edited captions" (kondensację), nie verbatim.
**Ruch:** Widźwięk **celowo kondensuje/parafrazuje**, żeby trafić w limit prędkości czytania. To jak zgubienie kilku pakietów u Spotify — „strata" jest **niezauważalna albo wręcz korzystna**, a wynik szybszy i lepszy.
**Dlaczego to broń:** konkurencja goni verbatim (drogo, wolno, często nieczytelnie). My optymalizujemy **realny cel** (zrozumiałość), nie metrykę zastępczą.
**Status:** rdzeń **bez API** (reguły czytelności już liczymy; kondensacja heurystyczna teraz, modelowa z kluczem później).

## 3. „0 sekund bufora" — instant draft + cicha aktualizacja w tle
**Insight:** czekanie na pełny job to UX z 2010 roku. Spotify grał, zanim dograł.
**Ruch:** pokaż **natychmiast zgodny szkic** z najtańszego źródła (import/captiony/szybki pass), a w tle uruchom lepszy pass (dokładniejszy ASR/diaryzacja) i **na żywo łataj** edytor — cue po cue.
**Dlaczego to broń:** user „ma wynik" w sekundę i już edytuje, podczas gdy konkurencja pokazuje spinner. Postrzegana szybkość = przewaga sprzedażowa.
**Status:** architektura już to umożliwia (CaptionDocument + orkiestrator); szkielet teraz, pełny streaming-patch później.

## 4. „Compute tylko tam, gdzie boli" — confidence-routed effort
**Insight:** płacenie za drogie API dla **całego** pliku jest głupie, gdy 90% jest pewne.
**Ruch:** zrób tani/darmowy pass, niech **silnik jakości WCAG wskaże tylko niepewne / niezgodne cue**, a płatne API odpal **wyłącznie na tych kilku fragmentach** (re-transkrypcja punktowa). Jak JPEG: detal tylko tam, gdzie potrzeba.
**Dlaczego to broń:** jakość bliska premium za ułamek kosztu → niższy koszt/minutę → marża, której drodzy gracze nie utrzymają.
**Status:** wymaga workera + orkiestratora; logika confidence już jest (Quality Score per etap).

## 5. „P2P korekt" — napisy, które uczą się od wszystkich
**Insight:** każda ręczna poprawka (nazwa mówcy, etykieta dźwięku, kondensacja) to **darmowa wiedza**, którą dziś wszyscy wyrzucają.
**Ruch:** anonimizowane korekty zasilają domyślne reguły i **pamięć kontekstu**: ten sam jingiel intro na kanale → opisany raz, rozpoznawany wszędzie; **voiceprint mówcy → auto-nazwa** „prof. Kowalski" we wszystkich jego wykładach; powtarzalne dźwięki danej instytucji → gotowe etykiety.
**Dlaczego to broń:** **polski korpus dźwięków/dialogu i głosów**, którego globalni gracze nie mają — i flywheel: im więcej użycia, tym mniej edycji.
**Status:** zaczyna się od per-projekt/per-konto pamięci (bez API); cross-user później (z prywatnością).

## 6. „Pasek SSL dostępności" — dowód jako marketing i lock-in
**Insight:** instytucja kupuje **dowód zgodności**, nie tekst. A dowód można zamienić w dystrybucję.
**Ruch:** generuj **weryfikowalną odznakę/raport** („Widźwięk Verified — WCAG 2.1 AA") + publiczny link audytu, który instytucja osadza przy materiale.
**Dlaczego to broń:** (a) zaufanie i argument na przetarg, (b) **odznaka rozsiewa markę** za darmo (jak plakietka SSL), (c) historia audytów = **lock-in** (nikt nie migruje swojego rejestru zgodności).
**Status:** PDF raport teraz; publiczny weryfikowalny link później.

## 7. „Twoje nagranie nie opuszcza urządzenia" — zero-upload jako fosa
**Insight:** RODO i wrażliwość nagrań to **największe tarcie** w instytucjach — i największy koszt infry dla konkurencji.
**Ruch:** ekstrakcja audio, a nawet transkrypcja kluczem usera dzieją się **w przeglądarce**; media nie trafiają na nasz serwer. (Już to robimy dla BYO-key.)
**Dlaczego to broń:** jednocześnie **argument prywatności** (sprzedaż do instytucji) i **trik kosztowy** (ich compute, nie nasz). Konkurencja z chmurowym uploadem ma RODO-problem i rachunek za storage.
**Status:** działa teraz (client-side), do podkreślenia w narracji i UI.

## 8. „Spal dług, nie plik" — triage całej biblioteki
**Insight:** instytucja nie ma „jednego pliku", ma **archiwum** i deadline. Konkurencja sprzedaje obróbkę pojedynczych plików.
**Ruch:** wskaż Widźwiękowi kanał/bibliotekę → narzędzie **triażuje**: co już ma dobre napisy (zgodne — pomiń), co wymaga pracy, posortowane wg luki WCAG. **Dashboard długu zgodności** do wypalenia.
**Dlaczego to broń:** sprzedajesz **program**, nie usługę per-plik → większy kontrakt, retencja, „one throat to choke" dla dyrektora ds. dostępności.
**Status:** koncept po persistencji; pierwszy krok — lista projektów z luką WCAG (mamy już Quality/WCAG per materiał).

---

## Jak to spina się w jeden ruch (the unfair loop)
1. **Najpierw bierz tekst, który istnieje** (P2P transkryptu) → 0 kosztu, 0 halucynacji.
2. **Optymalizuj pod czytelność/WCAG, nie verbatim** (pomarańczowe światło) → lepszy wynik taniej.
3. **Pokaż natychmiast, ulepszaj w tle** (0 bufora) → wygrana na percepcji.
4. **Płać tylko za niepewne fragmenty** (confidence routing) → marża nie do pobicia.
5. **Ucz się z korekt** (P2P korekt) → flywheel jakości po polsku.
6. **Sprzedawaj dowód + odznakę** → dystrybucja i lock-in.
7. **Nie ruszaj cudzych danych** (zero-upload) → prywatność + zero infry.
8. **Wypalaj dług całej biblioteki** → kontrakt zamiast usługi.

**Pointa:** konkurencja gra w „dokładniejsze AI". My zmieniamy zasady — *nie generujemy, dopasowujemy; nie verbatim, czytelnie; nie czekamy, łatamy w tle; nie liczymy wszystkiego, tylko niepewne; nie wyrzucamy korekt, uczymy się z nich; nie sprzedajemy tekstu, sprzedajemy dowód.* To jest poziom Spotify, nie kolejny wrapper.

## Co z tego budujemy NAJPIERW (bez API, największa dźwignia / najmniejszy koszt)
- **#1 Transkrypt-P2P (wklej skrypt / wrzuć TXT → forced alignment)** — ogromna jakość za darmo, killer dla uczelni.
- **#2 Kondensacja pod tempo czytania** — już mamy reguły; dołożyć auto-skracanie do limitu.
- **#7 Zero-upload** — działa, podkreślić w UI/narracji.
- **#6 PDF/odznaka** — najtańszy argument sprzedażowy dla instytucji.
Reszta (#3 streaming, #4 confidence-routing, #5 P2P korekt, #8 dashboard długu) wchodzi po hostowanym workerze + persistencji.
