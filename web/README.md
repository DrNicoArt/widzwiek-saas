# Widźwięk — Web (Next.js)

Frontend/demo. Renderuje wynik z workera (transkrypcja, mówcy, dźwięki, raport WCAG, eksport).
Cała logika AI/WCAG jest po stronie workera — frontend tylko wywołuje API i wyświetla wynik.

## Uruchomienie (Windows / PowerShell)

```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```

Otwórz http://localhost:3000. Wymaga działającego workera (domyślnie http://localhost:8000).

## Konfiguracja

`NEXT_PUBLIC_WORKER_URL` — adres workera. Lokalnie `http://localhost:8000`; na Vercel publiczny adres workera.

## Skrypty

```powershell
npm run dev        # serwer deweloperski
npm run build      # build produkcyjny (Vercel)
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Deploy na Vercel

Root Directory = `web`. Ustaw `NEXT_PUBLIC_WORKER_URL`. Worker AI hostujemy osobno — patrz
`../docs/ROADMAP.md`.
