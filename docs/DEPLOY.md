# Deploy — Widźwięk

## Produkcja (Vercel)
- Gałąź produkcyjna: `main`. Każdy push do `main` → automatyczny deploy „Production" na Vercel.
- Root Directory w projekcie Vercel: `web`.
- Zmienna środowiskowa demo: `NEXT_PUBLIC_STATIC_DEMO=1` (frontend działa bez workera).

## Przepływ pracy
- Zmiany lądują na `main`, agent pushuje bezpośrednio (`git push origin main`).
- Preview deploye powstają z innych gałęzi (osobny URL), produkcję rusza tylko `main`.

## Transkrypcja/dźwięki bez API
- Whisper i AST/AudioSet działają w przeglądarce (transformers.js z CDN). Modele pobierają się raz do cache przeglądarki — nie trzymamy ich w repo.
