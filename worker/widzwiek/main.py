"""FastAPI — REST API workera Widźwięk.

Uruchomienie: uvicorn widzwiek.main:app --reload --port 8000
Dokumentacja interaktywna: http://localhost:8000/docs
"""
from __future__ import annotations

import os
import tempfile
import threading
from typing import Optional

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from .api_check import readiness
from .config import settings
from .contracts import CaptionDocument, Job, JobStatus
from .export import to_srt, to_txt, to_vtt
from .jobs import store
from .pipeline.orchestrator import registry_snapshot
from .pipeline.providers import select_providers

app = FastAPI(
    title="Widźwięk Worker",
    description="No-API-first orchestrator + WCAG captions pipeline + eksport SRT/VTT.",
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
        "capabilities": registry_snapshot(),
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
def update_config(cfg: ConfigUpdate, x_admin_token: Optional[str] = Header(default=None)) -> dict:
    # Hardening (Krok 5): w produkcji ustaw WIDZWIEK_ADMIN_TOKEN; wtedy endpoint wymaga naglowka.
    # Docelowo (Model B) ten endpoint znika z prod — klucze providerow to sekrety platformy z env.
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Brak/zly token administracyjny.")
    """Ustawia konfigurację w PAMIĘCI procesu workera (klucz/tryb/model).

    Sekret NIE jest zapisywany na dysk ani w repo — żyje tylko do restartu workera.
    Zwraca /health, więc UI od razu widzi nowy stan i gotowość.
    """
    if cfg.pipeline_mode is not None:
        m = cfg.pipeline_mode.strip().lower()
        if m not in ("auto", "local", "free", "mock", "api"):
            raise HTTPException(status_code=400, detail="PIPELINE_MODE musi być auto/local/free/mock/api.")
        settings.pipeline_mode = m
    if cfg.openai_api_key is not None:
        settings.openai_api_key = cfg.openai_api_key.strip()
    if cfg.openai_transcription_model is not None and cfg.openai_transcription_model.strip():
        settings.openai_transcription_model = cfg.openai_transcription_model.strip()
    return _health_dict()


class ImportRequest(BaseModel):
    filename: str = "import"
    document: CaptionDocument


class URLJobRequest(BaseModel):
    url: str


@app.post("/api/jobs/import", response_model=Job)
def import_job(req: ImportRequest) -> Job:
    """Import gotowych napisow (SRT/VTT sparsowane na froncie) jako trwaly job.
    Normalizuje linie wg stylu i waliduje WCAG. Offline, bez AI."""
    if store.storage_usage()["over_limit"]:
        raise HTTPException(status_code=413, detail="Limit magazynu przekroczony. Usun materialy, aby dodac nowe.")
    job = store.create(filename=req.filename)
    return store.update_document(job, req.document)


@app.post("/api/jobs/url", response_model=Job)
def create_url_job(req: URLJobRequest) -> Job:
    """URL -> istniejące napisy/auto-captiony przez no-key źródła.

    Nie pobiera wideo/audio. Jeśli platforma nie udostępnia napisów, job kończy się
    czytelnym błędem i użytkownik może użyć uploadu pliku.
    """
    if store.storage_usage()["over_limit"]:
        raise HTTPException(status_code=413, detail="Limit magazynu przekroczony. Usun materialy, aby dodac nowe.")
    if not req.url.strip().lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Podaj poprawny URL http(s).")
    job = store.create(filename=req.url.strip())
    return store.process_url(job, req.url.strip())


@app.post("/api/jobs", response_model=Job)
async def create_job(file: UploadFile = File(...)) -> Job:
    """Upload pliku audio/wideo -> utworzenie joba i uruchomienie pipeline'u."""
    if store.storage_usage()["over_limit"]:
        raise HTTPException(status_code=413, detail="Limit magazynu przekroczony. Usun materialy, aby dodac nowe.")
    job = store.create(filename=file.filename or "upload")

    audio_path: Optional[str] = None
    try:
        suffix = os.path.splitext(file.filename or "")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            audio_path = tmp.name
    except Exception:  # noqa: BLE001
        audio_path = None

    def _run_and_cleanup() -> None:
        try:
            store.process(job, audio_path)
        finally:
            if audio_path:
                try:
                    os.unlink(audio_path)
                except OSError:
                    pass

    if settings.async_jobs:
        # Tryb serwerowy: przetwarzanie w tle, request wraca natychmiast (frontend odpytuje status).
        job.status = JobStatus.processing
        threading.Thread(target=_run_and_cleanup, daemon=True).start()
        return job

    _run_and_cleanup()
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


@app.get("/api/storage")
def storage() -> dict:
    """Zuzycie magazynu materialow + limit (do paska w UI)."""
    return store.storage_usage()


@app.get("/api/jobs", response_model=list[Job])
def list_jobs() -> list[Job]:
    """Lista zapisanych materialow (trwala, laduje sie z dysku po restarcie)."""
    return store.list()


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str) -> dict:
    if not store.delete(job_id):
        raise HTTPException(status_code=404, detail="Job nie istnieje.")
    return {"ok": True}


@app.put("/api/jobs/{job_id}", response_model=Job)
def update_job_document(job_id: str, doc: CaptionDocument) -> Job:
    """Edytor napisow: zapis poprawionego dokumentu -> normalizacja + ponowna
    walidacja WCAG + trwaly zapis. W pelni offline (bez AI)."""
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nie istnieje.")
    return store.update_document(job, doc)


@app.get("/api/jobs/{job_id}/export/txt", response_class=PlainTextResponse)
def export_txt(job_id: str) -> PlainTextResponse:
    job = _require_done(job_id)
    return PlainTextResponse(to_txt(job.result), media_type="text/plain",
                             headers={"Content-Disposition": f'attachment; filename="{job_id}.txt"'})


@app.get("/api/jobs/{job_id}/export/json", response_class=PlainTextResponse)
def export_json(job_id: str) -> PlainTextResponse:
    job = _require_done(job_id)
    return PlainTextResponse(job.result.model_dump_json(indent=2), media_type="application/json",
                             headers={"Content-Disposition": f'attachment; filename="{job_id}.json"'})


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
