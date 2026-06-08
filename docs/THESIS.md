# Widźwięk — teza kategorii (nie narzędzie, lecz system zaufania)

> **Reframe:** Widźwięk to nie „generator napisów". To **system zaufania i rejestr zgodności dostępności** dla organizacji —
> *„Vanta dla WCAG/EAA"*. Napisy są pierwszym sensorem, nie produktem.
>
> **Zakład:** generowanie tekstu staje się towarem (za 2–3 lata każdy model zrobi przyzwoity transkrypt).
> Trwała wartość firmy leży w **kontroli jakości, przewidywalności, dowodzie zgodności, korpusie ludzkich
> decyzji i byciu systemem zapisu** — rzeczach, których nie kupi się przez podpięcie kolejnego API.

---

## CZĘŚĆ A — 24 fałszywe założenia rynku → odpowiedzi zmieniające reguły
*(tag = rodzaj przewagi: [workflow] [dane] [sieć] [lock-in] [pozycja] [biznes] [trwałość] / „kopiowalne" = uczciwie słabe)*

**Proces i produkt**
1. „Najpierw transkrypcja, potem audyt." → **Najpierw audyt ryzyka, transkrypcja selektywnie** tam, gdzie boli. Odwracamy pipeline. [workflow]
2. „Generowanie jest produktem." → Generowanie to komodyta; produktem jest **wiedza, KIEDY wynik jest dobry, a kiedy zły**. [trwałość]
3. „AI ma pisać tekst." → AI ma **znajdować naruszenia**; pisanie tekstu to najmniej wartościowa część. [workflow]
4. „User chce edytować." → User chce **„napraw wszystko"**. Każda minuta edycji to porażka produktu. [workflow]
5. „Człowiek kontroluje jakość." → **Maszyna robi red team, człowiek tylko podpisuje.** Dowód = maszyna+podpis. [trust/lock-in]
6. „Jednostką jest plik." → Jednostką jest **organizacja**. Na poziomie pliku jesteś funkcją; na poziomie organizacji — systemem. [skala/lock-in]
7. „Każdy plik analizujemy od zera." → **Pamięć organizacji** rośnie z każdym plikiem (mówcy, dźwięki, terminologia, styl). [dane/compounding]
8. „Napisy to produkt końcowy." → Napisy to **pierwszy sensor**; produkt to **autopilot dostępności** (audio description, PDF, strony, monitoring EAA). [platforma]
9. „Dostępność to projekt jednorazowy." → Dostępność to **stan, który się psuje** (codziennie dochodzi treść) → **ciągły monitoring**, nie jednorazowa robota. [recurring/lock-in]
10. „Źródłem prawdy jest audio." → Źródłem prawdy jest **wszystko naraz**: slajdy, opis, OCR z obrazu, metadane, agenda, poprzednie filmy autora, logo kanału, istniejące napisy. [dane]
11. „Raport to dodatek." → **Raport/dashboard JEST produktem** — rejestr i dowód zgodności. [trust/lock-in]

**Rynek i konkurencja**
12. „Konkurencją są narzędzia do napisów." → Konkurencją jest **ręczna robota (10+ zł/min), agencje, etaty**. Oszczędzasz 10 min → przegrywasz; **likwidujesz cały proces/stanowisko → wygrywasz**. [pozycja]
13. „Przewaga wynika z AI." → AI to towar. Przewaga z **danych: korpusu milionów decyzji korekcyjnych** (kiedy skrócić, jak opisać dźwięk po polsku, jak nazwać mówcę). [dane — kluczowe]
14. „Trzeba najlepszego modelu." → Problem jest **organizacyjny, nie techniczny** — wygrywa **najlepszy workflow zgodności**, nie najlepszy model. [workflow]
15. „Lepszy model = przewaga." → Gdy wyjdzie Whisper 5, konkurencja traci przewagę. My mamy **warstwę niezależną od modelu** (walidacja, polityki, dowód, rejestr). [trwałość]
16. „95% skuteczności wystarczy." → Instytucja chce **przewidywalności** — wiedzieć *gdzie* są błędy, nie „średnio dobrze". Sprzedajemy pewność, nie procent. [trust]

**Klient, instytucje, uczelnie, twórcy**
17. „Każdy klient równie wartościowy." → Twórca ~20–50 zł/mies, uczelnia ~kilkanaście tys./rok, urząd więcej. **Nie buduj pod najtańszy segment.** [biznes]
18. „Klient wie, co poprawić." → **Nie wie.** Największa wartość = **znaleźć WSZYSTKO niezgodne** (produkt odkrywania ≠ produkt generowania). [pozycja]
19. „Klient kupuje napisy." → Kupuje **ochronę prawną, dowód dla kontroli, spokój**. Budżet idzie z compliance/ryzyka, nie z „produkcji wideo". [pozycja/biznes]
20. „User musi wrzucić plik." → **Wkleja URL kanału/biblioteki**, my sami znajdujemy całą niezgodność. [skala]
21. „Problem jest techniczny." → Większość instytucji *mogłaby* zrobić napisy — **nie mają procesu**. Sprzedajemy proces. [workflow]
22. „Dostępność to koszt." → Dostępność to **zarządzane ryzyko prawne** (jak SOC2/ubezpieczenie). Reframe budżetu = większe portfele. [framing]
23. „Sprzedaż per-minuta/per-seat." → Sprzedaż **per-zgodność-organizacji** (kontrakt na *stan zgodności*, nie na zużycie). [biznes]
24. „Twórcy internetowi to rynek." → Twórcy to **akwizycja i dane** (top-of-funnel, korpus). Pieniądze i fosa są w **organizacjach**. [biznes]

---

## CZĘŚĆ B — Brutalna samokrytyka (co jest kopiowalne, a co nie)
- **Kopiowalne w weekend / przez gracza z $20M:** import captionów z YouTube, „analiza archiwum kanału", chunki, alignment, streaming, „lepsza transkrypcja". To **nie są fosy** — to higiena.
- **Trudniejsze, ale wciąż do kupienia:** dashboard długu, raport PDF, pamięć organizacji (na start). Dobre jako wedge, **nie jako fosa same w sobie**.
- **Cold start każdego efektu sieciowego:** korpus i „odznaka uznawana przez audytorów" są bezwartościowe przy zerze klientów. To zakład 2–3-letni, nie funkcja na środę. **Trzeba to powiedzieć wprost.**
- **Największe ryzyko myślenia:** „mamy lepsze AI". To najszybciej parująca przewaga. Jeśli na tym budujemy firmę — przegramy z OpenAI/Google/Deepgram.

## CZĘŚĆ C — Fosy, które rosną z liczbą klientów i NIE są do kupienia przez API
*(uszeregowane wg trwałości)*
1. **Korpus decyzji dostępnościowych (polski/EU).** Każda korekta (skrót, etykieta dźwięku, nazwa mówcy, tempo) → unikalny zbiór, którego nie ma żaden model API. Im więcej klientów → lepsze domyślne → mniej edycji → niższy koszt i wyższa jakość. **To jest silnik firmy.**
2. **System zapisu (system of record) + ślad audytowy.** Organizacja trzyma u nas **historię zgodności i dowody**. Nikt nie migruje rejestru zgodności → twardy lock-in (jak Vanta/compliance SaaS).
3. **Ciągły monitoring stanu.** Dostępność się psuje; bycie tym, kto **pilnuje** całej biblioteki w czasie → przychód cykliczny + dane + lock-in. Per-plik konkurencja nie może być monitorem.
4. **Warstwa zaufania/przewidywalności.** „Wiemy, kiedy wynik jest dobry/zły i co poprawić" + podpis człowieka → **obronny dowód**, niezależny od modelu.
5. **Sieć uznania odznaki.** Gdy audytorzy/koordynatorzy uznają „Widźwięk Verified", organizacje chcą jej, bo audytorzy ją akceptują, a audytorzy akceptują, bo organizacje jej używają → **efekt sieciowy po stronie standardu** (kredencjał).
6. **Pamięć i polityki organizacji.** Per-klient: głosy/nazwiska, jingle, terminologia, reguły stylu, polityki WCAG → produkt staje się „uszyty" → koszt zmiany rośnie.

## CZĘŚĆ D — Na czym budujemy FIRMĘ (nie produkt)
**„Vanta dla dostępności mediów (EAA/WCAG)":**
- wykryj wszystko niezgodne w całej organizacji,
- napraw automatycznie, pokaż tylko to, co wymaga podpisu człowieka,
- udowodnij zgodność (raport, rejestr, odznaka),
- **pilnuj stanu w czasie** (monitoring),
- z każdym klientem i korektą **bądź mądrzejszy po polsku**.

Napisy to drzwi. Firma to **przewidywalna zgodność jako usługa ciągła**.

## CZĘŚĆ E — Uczciwy rozdział: wedge DZIŚ vs fosa za 2–3 lata
- **DZIŚ (wejście, na środę):** najszybsze, najbardziej niezawodne i eleganckie *doprowadzenie materiału do zgodności* online (to, czego rynek ręcznej roboty 10 zł/min nie dowiózł). To zdobywa pierwszych klientów i **zaczyna zbierać dane**.
- **ZA 2–3 LATA (firma):** korpus + system zapisu + monitoring + sieć odznaki = fosa. Każdy klient czyni produkt lepszym i trudniejszym do podmiany.
- **Reguła decyzyjna na każdą funkcję:** „Czy to staje się lepsze z liczbą klientów i czy przetrwa lepszy model konkurencji?" Jeśli nie — to higiena, nie inwestycja w fosę.

---
*Pointa: nie wygrywamy „lepszym AI". Wygrywamy stając się miejscem, gdzie zgodność jest **wykonywana, udowadniana i pilnowana** — i które z każdą organizacją zna polską dostępność lepiej niż ktokolwiek inny.*
