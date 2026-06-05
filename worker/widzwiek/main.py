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

from .config import settings
from .contracts import Job
from .export import to_srt, to_vtt
from .jobs import store
from .pipeline.providers import select_providers

app = FastAPI(
    title="Widźwięk Worker",
    description="Pipeline AI + walidacja WCAG + eksport SRT/VTT. Tryb mock (demo) / api.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Liveness + aktywny tryb pipeline'u i realne nazwy providerów (bez wymogu klucza API)."""
    p = select_providers(settings)
    api_ready = settings.pipeline_mode != "api" or bool(settings.openai_api_key)
    return {
        "status": "ok",
        "mode": settings.pipeline_mode,
        "api_key_present": bool(settings.openai_api_key),
        "ready": api_ready,
        "providers": {
            "asr": p.asr.name,
            "diarization": p.diarization.name,
            "sound_events": p.sound_events.name,
        },
    }


@app.post("/api/jobs", response_model=Job)
async def create_job(file: UploadFile = File(...)) -> Job:
    """Upload pliku audio/wideo -> utworzenie joba i uruchomienie pipeline'u.

    Tryb mock kończy synchronicznie (szybko). Kontrakt statusów jest gotowy pod realne, długie AI.
    """
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
