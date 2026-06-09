# Krok 5 — Auth, wielodostępność, hardening

## Uwierzytelnianie
- Sesje/JWT po stronie API (rekomendacja: ciasteczko httpOnly + krótki JWT dostępu + refresh). Provider tożsamości wymienny (e‑mail+hasło na start, później SSO/OIDC dla instytucji).
- Użytkownik należy do 1..N organizacji (`memberships`), z rolą: `owner|admin|editor|viewer`.

## Wielodostępność (najważniejsze)
Każde zapytanie domenowe jest **filtrowane po `org_id`** — to jedyna granica izolacji. Wzorzec: repozytoria (`JobRepo`, `ProjectRepo`, `DocumentRepo`, `UsageRepo`) przyjmują `org_id` z kontekstu żądania i dodają `WHERE org_id = :org`. Brak globalnych zapytań w handlerach. Middleware ustawia `request.ctx = {user_id, org_id, role}` po weryfikacji tokenu; autoryzacja per rola na endpoint.

## Hardening (do wdrożenia przed publicznym ruchem)
- [x] `/api/config` za tokenem (`WIDZWIEK_ADMIN_TOKEN`) — *zrobione, opcjonalne*. **Docelowo usunąć z prod**: klucze providerów to sekrety platformy z env/secrets managera, nie ustawiane runtime.
- [ ] CORS: zamienić `*` na allowlistę domen (`WIDZWIEK_CORS_ORIGINS`).
- [ ] Rate-limiting (per IP / per org) na endpointach kosztownych (upload, job).
- [ ] Walidacja plików po stronie serwera: typ MIME, rozmiar, czas trwania; odrzucanie podejrzanych.
- [ ] Skan antywirusowy uploadów (np. ClamAV) przed przetwarzaniem.
- [ ] Limity zasobów per zadanie (czas, pamięć) — ochrona przed nadużyciem.
- [ ] Sekrety wyłącznie w secrets managerze; rotacja; zero sekretów w repo/logach.
- [ ] Audyt logowań i akcji wrażliwych (zmiana planu, usunięcie materiału).

## Role → uprawnienia (szkic)
- `owner`: rozliczenia, członkowie, usuwanie organizacji.
- `admin`: zarządzanie projektami i członkami (bez rozliczeń).
- `editor`: tworzenie/edycja materiałów i napisów.
- `viewer`: podgląd i pobieranie eksportów/raportów.

## Stan
Gate `/api/config` zrobiony (kod). Reszta to scaffold/plan — wymaga warstwy API z bazą (Krok 2/3) i biblioteki auth (instalacja u Ciebie).
