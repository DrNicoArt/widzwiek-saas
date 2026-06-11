# Widźwięk — operacje wdrożeniowe. Uruchamiaj z katalogu infra/.
# Wymaga Docker + docker compose. Sekrety w infra/.env (skopiuj z .env.example).

.PHONY: up down logs migrate health

up:                ## Zbuduj i uruchom worker (rdzeń: transkrypcja+dźwięki+WCAG)
	docker compose up -d --build worker

down:              ## Zatrzymaj
	docker compose down

logs:              ## Podgląd logów workera
	docker compose logs -f worker

health:            ## Sprawdź gotowość workera
	curl -fsS http://localhost:8000/health | python -m json.tool

# Postgres (gdy włączysz konta/płatności na bazie — odkomentuj usługę db w compose):
migrate:           ## Załaduj schemat bazy (wymaga uruchomionego db + DATABASE_URL)
	psql "$$DATABASE_URL" -f db/0001_init.sql
