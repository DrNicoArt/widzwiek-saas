# Widźwięk worker — obraz produkcyjny. Rdzeń 1-2-3: transkrypcja (faster-whisper),
# dźwięki (heurystyka/optymalnie model), walidacja WCAG, eksport. FastAPI + uvicorn.
FROM python:3.11-slim

# ffmpeg: ekstrakcja audio z wideo + probe. Reszta: kompilacja kół (faster-whisper/ctranslate2).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Najpierw zależności (lepszy cache warstw)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Kod
COPY widzwiek ./widzwiek

# Dane jobów (montuj wolumen w produkcji), modele Whisper w cache HF
ENV WIDZWIEK_STORAGE_DIR=/data/storage \
    HF_HOME=/data/models \
    PIPELINE_MODE=auto \
    WIDZWIEK_HOST=0.0.0.0 \
    WIDZWIEK_PORT=8000
RUN mkdir -p /data/storage /data/models

EXPOSE 8000

# Healthcheck na /health (offline, bez sieci)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4); sys.exit(0)" || exit 1

CMD ["uvicorn", "widzwiek.main:app", "--host", "0.0.0.0", "--port", "8000"]
