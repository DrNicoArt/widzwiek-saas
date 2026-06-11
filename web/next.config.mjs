/** @type {import('next').NextConfig} */
// NEXT_PUBLIC_STATIC_DEMO steruje TYLKO zachowaniem (silnik w przeglądarce, bez workera),
// NIE trybem builda. Wcześniej 'output: export' generował statycznie tylko znane id projektów,
// przez co każdy nowo przetworzony materiał (dynamiczne id) zwracał 404. Na Vercelu Next działa
// natywnie i dynamiczne ścieżki rozwiązują się w czasie wykonania — bez 404.
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
