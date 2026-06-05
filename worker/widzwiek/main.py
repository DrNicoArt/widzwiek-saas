"""FastAPI — REST API workera Widźwięk.

Uruchomienie: uvicorn widzwiek.main:app --reload --port 8000
Dokumentacja interaktywna: http://localhost:8000/docs
"""
from __future__ import annotations

import os
import tempfile
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from .api_check import readiness
from .config import settings
from .contracts import Job
from .export import to_srt, to_vtt
from .jobs import store
from .pipeline.providers import select_providers

app = FastAPI(
    title="Widźwięk Worker",
    description="Pipeline AI + walidacja WCAG + eksport SRT/VTT. Tryb mock (demo) / api.",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _health_dict() -> dict:
    p = select_providers(settings)
    r = readiness(settings)
    return {
        "status": "ok",
        "mode": r["mode"],
        "ready": r["ready"],
        "api_key_present": r["api_key_present"],
        "openai_installed": r["openai_installed"],
        "ffmpeg_present": r["ffmpeg_present"],
        "transcription_model": settings.openai_transcription_model,
        "providers": {"asr": p.asr.name, "diarization": p.diarization.name, "sound_events": p.sound_events.name},
        "notes": r["notes"],
    }


@app.get("/health")
def health() -> dict:
    """Liveness + tryb + realne providery + gotowość API (offline, bez wywołań sieci)."""
    return _health_dict()


class ConfigUpdate(BaseModel):
    pipeline_mode: Optional[str] = None
    openai_api_key: Optional[str] = None
    openai_transcription_model: Optional[str] = None


@app.post("/api/config")
def update_config(cfg: ConfigUpdate) -> dict:
    """Ustawia konfigurację w PAMIĘCI procesu workera (klucz/tryb/model).

    Sekret NIE jest zapisywany na dysk ani w repo — żyje tylko do restartu workera.
    Zwraca /health, więc UI od razu widzi nowy stan i gotowość.
    """
    if cfg.pipeline_mode is not None:
        m = cfg.pipeline_mode.strip().lower()
        if m not in ("mock", "api"):
            raise HTTPException(status_code=400, detail="PIPELINE_MODE musi być 'mock' albo 'api'.")
        settings.pipeline_mode = m
    if cfg.openai_api_key is not None:
        settings.openai_api_key = cfg.openai_api_key.strip()
    if cfg.openai_transcription_model is not None and cfg.openai_transcription_model.strip():
        settings.openai_transcription_model = cfg.openai_transcription_model.strip()
    return _health_dict()


@app.post("/api/jobs", response_model=Job)
async def create_job(file: UploadFile = File(...)) -> Job:
    """Upload pliku audio/wideo -> utworzenie joba i uruchomienie pipeline'u."""
    job = store.create(filename=file.filename or "upload")

    audio_path: Optional[str] = None
    try:
        suffix = os.path.splitext(file.filename or "")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            audio_path = tmp.name
    except Exception:  # noqa: BLE001
        audio_path = None

    store.process(job, audio_path)

    if audio_path:
        try:
            os.unlink(audio_path)
        except OSError:
            pass
    return job


@app.get("/api/jobs/{job_id}", response_model=Job)
def get_job(job_id: str) -> Job:
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nie istnieje.")
    return job


def _require_done(job_id: str) -> Job:
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nie istnieje.")
    if not job.result:
        raise HTTPException(status_code=409, detail=f"Job nie jest gotowy (status: {job.status}).")
    return job


@app.get("/api/jobs/{job_id}/export/srt", response_class=PlainTextResponse)
def export_srt(job_id: str) -> PlainTextResponse:
    job = _require_done(job_id)
    content = to_srt(job.result)  # type: ignore[arg-type]
    return PlainTextResponse(content, media_type="application/x-subrip",
                             headers={"Content-Disposition": f'attachment; filename="{job_id}.srt"'})


@app.get("/api/jobs/{job_id}/export/vtt", response_class=PlainTextResponse)
def export_vtt(job_id: str) -> PlainTextResponse:
    job = _require_done(job_id)
    content = to_vtt(job.result)  # type: ignore[arg-type]
    return PlainTextResponse(content, media_type="text/vtt",
                             headers={"Content-Disposition": f'attachment; filename="{job_id}.vtt"'})
