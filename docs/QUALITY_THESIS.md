# Widźwięk — teza jakości: „czy wynik jest wystarczająco dobry?" w centrum produktu

> Ten dokument świadomie przesuwa środek ciężkości. PROJECT_MAP/STRATEGY mówiły o systemie i providerach.
> Tu jest jedyne pytanie, które decyduje, czy produkt istnieje:
> **czy Widźwięk zamienia przeciętny materiał w wynik, którego człowiek nie musi poprawiać przez godzinę.**
> Wszystko inne (providerzy, integracje, ekrany) jest wtórne wobec tej odpowiedzi.

---

## 0. Przesunięcie środka ciężkości
Największa iluzja dotychczasowego kierunku: że problemem jest „który provider". **Problemem jest jakość wyniku końcowego.** Jeśli 30-min wykład po polsku wymaga 2 h ręcznej korekty, nie ma znaczenia, czy wygrał Whisper, Deepgram czy OpenAI — produkt przegrał. Provider orchestration jest potrzebny, ale **dopiero gdy pojedynczy model już daje używalny wynik**. Dziś orchestration to przedwczesna optymalizacja.

Klient nie kupuje Whispera/ElevenLabs/Deepgram/AST. Kupuje zdanie: **„wrzuciłem film i dostałem napisy zgodne z WCAG bez ręcznej roboty."** To jest cały produkt.

## 1. Metryka północna: HETP (Human Edit-Time to Publish)
Jedna liczba, której podporządkowujemy wszystko: **ile minut ręcznej pracy dzieli wynik AI od materiału gotowego do publikacji.** Pochodne:
- **% segmentów zaakceptowanych bez edycji** (auto-accept rate).
- **liczba ręcznych korekt / minutę materiału.**
- **czas od uploadu do stanu „zgodny".**

Nie mierzymy „provider win-rate". Mierzymy HETP na realnych materiałach. Każda funkcja musi obniżać HETP albo nie wchodzi.

## 2. Dwa różne produkty — budujemy ten trudniejszy
Rynek jest pełen: **audio → tekst.** Rynek jest niemal pusty: **audio → gotowy materiał WCAG.** To nie ten sam produkt. Różnicą jest **warstwa korekty** — to ona, nie transkrypcja, jest sercem Widźwięku i realną przewagą. Transkrypcja to wejście; produktem jest doprowadzenie do publikowalnej zgodności przy minimum dotknięć człowieka.

## 3. Skąd system wie, że wynik jest dobry (warstwa pewności)
To jest największa dziś luka. Potrzebny **model pewności**, który per segment i per dokument szacuje „czy to jest gotowe", łącząc sygnały:
- **pewność ASR** (confidence/logprob per słowo/segment),
- **płynność polszczyzny** (perplexity modelu językowego, wykrywanie bełkotu/OOV/halucynacji),
- **zgodność źródeł** (gdy uruchomimy >1 providera — rozbieżność = ryzyko),
- **dopasowanie audio↔tekst** (forced alignment score),
- **higiena techniczna** (interpunkcja, wielkie litery, podejrzane bloki),
- **walidacja WCAG** (już mamy),
- **spójność mówców i dźwięków** (gwałtowne zmiany etykiet = podejrzane).

Z tego powstaje: **(a)** per-segment confidence, **(b)** dokumentowy stan gotowości, **(c)** kolejka przeglądu** — system sam pokazuje człowiekowi **tylko te ~10% fragmentów, które tego wymagają**, zamiast kazać czytać wszystko. To jest „red team" własnego wyniku. To, a nie generowanie tekstu, jest produktem.

## 4. Klasyfikacja materiału źródłowego (triage przed pipeline)
Dziś nie istnieje pojęcie *jakości źródła*. A to są różne problemy: **podcast studyjny / wykład na uczelni / nagranie z telefonu / film z ulicy / webinar / TikTok.** Przed wyborem ścieżki klasyfikujemy materiał po sygnałach: SNR, obecność muzyki/tła, nakładanie się mówców, pogłos, pewność języka, długość, kanały audio. Klasyfikacja daje trzy rzeczy:
1. **dobór pipeline'u** (inny dla studia, inny dla ulicy),
2. **kopertę oczekiwanej jakości** (ile HETP się spodziewać),
3. **uczciwą zapowiedź dla użytkownika** („ten materiał jest trudny — spodziewaj się przeglądu", zamiast cichego oddania słabego wyniku).

## 5. Maszyna stanów gotowości (definicja „gotowe")
Sukces nie może być rozmyty. Każdy materiał ma jeden ze stanów:
- **Nieprzetwarzalny** — brak mowy / jakość uniemożliwia sensowny wynik (system mówi to wprost, nie udaje).
- **Wymaga przeglądu** — wynik jest, ale pewność niska w istotnych miejscach → kolejka przeglądu.
- **Częściowo zgodny** — WCAG prawie spełnione, zostały drobne ostrzeżenia.
- **Zgodny (gotowy do publikacji)** — 0 błędów, pewność wysoka, dowód wystawiony.

Kryteria wejścia/wyjścia każdego stanu są jawne i wersjonowane (jak ruleset). Dopiero to pozwala budować automatyzację i SLA.

## 6. Model danych: system ZGODNOŚCI, nie transkrypcji
Obecny `CaptionDocument` wygląda jak system do transkrypcji. System do zgodności musi dla **każdego fragmentu** odpowiedzieć:
- **skąd pochodzi** (provider/źródło),
- **kto go stworzył** (AI/import/człowiek),
- **kto i kiedy zmodyfikował**,
- **dlaczego** (jaka reguła WCAG / jaki problem),
- **czy poprawka była automatyczna czy ręczna**,
- **jaka była pewność** przed i po.

To rozszerza `cue_provenance` z Kroku 2 i jest fundamentem raportów, audytów ORAZ uczenia. Bez tego nie ma ani obronnego dowodu, ani korpusu.

## 7. Pętla uczenia — najcenniejsza, niekupowalna fosa
Każda **poprawka, akceptacja, zmiana mówcy, korekta dźwięku, przesunięcie timestampu** musi stawać się wiedzą systemu. To jest fosa, której nie kupisz od OpenAI. Co zbieramy i jak wraca — nawet zanim wejdzie ML:
- **słownik per organizacja** budowany automatycznie z poprawek nazw/terminów (uczelnia, urząd, marka) → mniej błędów następnym razem.
- **reguły substytucji** (częste złe→dobre) i preferencje etykiet dźwięków.
- **kalibracja pewności** — uczymy się, kiedy „wysoka pewność" realnie znaczyła „dobre" (mniej fałszywych zielonych).
- **profile materiału** — co działa dla jakiej klasy źródła.
Efekt compounding: im więcej klientów i poprawek, tym niższy HETP i tym trudniej nas podmienić.

## 8. Co się dzieje PO wygenerowaniu (pełny cykl, nie „upload→eksport")
Dziś projekt myśli: upload → przetwarzanie → eksport. Powinien myśleć:
**upload → klasyfikacja → analiza → naprawa → walidacja → (kolejka przeglądu) → dowód zgodności → historia → ponowna analiza po zmianach materiału.**
„Dowód" i „historia" to nie dodatki — to one czynią z tego system zgodności (i wiążą klienta).

## 9. Przeszeregowanie prac (jakość przed orkiestracją)
- **P0 — jeden scenariusz E2E, doskonale.** MP4 (PL) → transkrypcja → mówcy → dźwięki → naprawa WCAG → raport → eksport. Na realnym materiale, z **pomiarem HETP**. Dopóki to nie jest dobre, nic więcej nie ma znaczenia.
- **P1 — warstwa pewności + kolejka przeglądu + stany gotowości + provenancja.** To zamienia „audio→tekst" w „audio→gotowy WCAG".
- **P2 — pętla uczenia (capture + słownik per org + kalibracja).**
- **P3 — klasyfikacja materiału → koperta jakości + zapowiedź.**
- **P4 — warstwa serwerowa** (DB/kolejka/storage/auth) — niezbędna do skali, ale po udowodnieniu jakości.
- **P5 — provider orchestration** — dopiero gdy zmierzymy, że drugi provider **realnie obniża HETP** dla danej klasy materiału. Wtedy, i tylko wtedy.

Uwaga do Modelu B: pozycjonowanie („jesteśmy providerem, sprzedajemy rezultat") zostaje. Ale **priorytet inżynieryjny to jakość i pewność, nie multi-provider routing.** Orchestration bez dobrego pojedynczego modelu to zamek z waty cukrowej.

---

## Jedno zdanie
Najważniejszym pytaniem Widźwięku nie jest „którego providera wybrać" ani „jaki ekran dodać", tylko **„czy system wie, kiedy wynik jest wystarczająco dobry, i czy potrafi doprowadzić przeciętny materiał do tego stanu bez godziny ręcznej roboty"** — i wokół tego pytania, nie wokół providerów, należy ułożyć cały dalszy rozwój.
