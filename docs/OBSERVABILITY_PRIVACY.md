# Krok 8 — Obserwowalność + prywatność (RODO)

## Obserwowalność
- **Logi strukturalne (JSON)** z korelacją `request_id`/`job_id`/`org_id` (bez treści mediów i sekretów).
- **Metryki**: czas przetwarzania per etap, koszt providerów (`provider_runs`), kolejka (długość, czas oczekiwania), błędy per provider, % materiałów zgodnych za pierwszym razem.
- **Tracing** (OpenTelemetry) na ścieżce API→kolejka→worker→provider.
- **Error tracking** (np. Sentry) z tagiem `org_id` (bez PII).
- **Dashboard operatora**: koszt vs przychód (marża), jakość per provider/język — wprost z `provider_runs` + `usage_events`.

## Prywatność / RODO (wymóg instytucji publicznych)
- **Minimalizacja**: media trzymane tylko na czas przetwarzania + zdefiniowana retencja (`media_assets.retention_until`); domyślnie krótka, konfigurowalna per organizacja.
- **Twarde usuwanie**: `ObjectStorage.delete()` + kasowanie rekordów; „usuń materiał" = nieodwracalne.
- **Region danych**: storage i DB w UE (wymóg sektora publicznego). Provider AI z opcją „no training on data".
- **Zgody i DPA**: rejestr zgód; umowy powierzenia z providerami AI; lista subprocesorów.
- **Eksport/usunięcie na żądanie** (prawo dostępu/zapomnienia) — operacje per organizacja/użytkownik.
- **Brak PII w logach/telemetrii**: logujemy metadane (czasy, kody), nie transkrypty.

## Zmienne środowiskowe (dodatkowe)
```
WIDZWIEK_DATA_REGION=eu-central
WIDZWIEK_MEDIA_RETENTION_DAYS=7
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=
```

## Stan
Scaffold/polityka — do wdrożenia wraz z warstwą API/worker (Kroki 3/5) i infrastrukturą (Krok 9).
