"""Prosty store jobów. PoC: in-memory + opcjonalny zrzut JSON na dysk.
Bez bazy danych (ADR-006). Migracja do Postgres/queue: docs/ROADMAP.md.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from .config import settings
from .contracts import CaptionDocument, Job, JobStatus
from .pipeline import run_pipeline


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def create(self, filename: str) -> Job:
        job = Job(id=uuid.uuid4().hex[:12], status=JobStatus.queued, filename=filename)
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def _touch(self, job: Job, status: JobStatus) -> None:
        job.status = status
        job.updated_at = datetime.now(timezone.utc).isoformat()

    def process(self, job: Job, audio_path: Optional[str] = None) -> Job:
        """Uruchamia pipeline synchronicznie (PoC: mock jest szybki).
        Pod realne, długie AI -> przenieść do workera w tle (ROADMAP)."""
        self._touch(job, JobStatus.processing)
        try:
            doc: CaptionDocument = run_pipeline(job.filename or "sample", audio_path)
            job.result = doc
            self._touch(job, JobStatus.done)
            self._persist(job)
        except Exception as exc:  # noqa: BLE001 — chcemy zaraportować błąd jobowi
            job.error = str(exc)
            self._touch(job, JobStatus.error)
        return job

    def _persist(self, job: Job) -> None:
        if not settings.storage_dir:
            return
        try:
            os.makedirs(settings.storage_dir, exist_ok=True)
            path = os.path.join(settings.storage_dir, f"{job.id}.json")
            with open(path, "w", encoding="utf-8") as f:
                f.write(job.model_dump_json(indent=2))
        except OSError:
            pass  # zrzut na dysk jest best-effort na PoC


store = JobStore()
