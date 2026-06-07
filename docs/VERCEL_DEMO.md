# Vercel demo deploy

Ten tryb sluzy do szybkiego, klikalnego pokazu frontendu bez publicznego workera.

## Ustawienia projektu Vercel

- Repository: `DrNicoArt/widzwiek-saas`
- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: domyslne dla Next.js
- Environment Variable: `NEXT_PUBLIC_STATIC_DEMO=1`

## Co robi `NEXT_PUBLIC_STATIC_DEMO=1`

- wlacza statyczny export Next.js,
- generuje statyczne trasy projektow demo `p1`-`p6`,
- udaje `/health` jako `system online`,
- pozwala przeklikac Studio bez workera,
- kieruje upload/przetwarzanie na przykladowy `CaptionDocument`,
- nie wymaga `NEXT_PUBLIC_WORKER_URL`, kluczy API ani backendu.

## Tryb z realnym workerem

Nie ustawiaj `NEXT_PUBLIC_STATIC_DEMO=1`. Wtedy frontend buduje sie normalnie i powinien dostac:

- `NEXT_PUBLIC_WORKER_URL=https://...`
- worker z poprawnym CORS dla domeny Vercel.
