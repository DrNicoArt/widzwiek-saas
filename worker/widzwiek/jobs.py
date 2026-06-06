"""Job store. PoC bez bazy: in-memory + trwaly zrzut JSON na dysk (laduje sie przy starcie).
Daje realny, trwaly obieg projektow offline (bez API). Migracja do Postgres/queue: docs/ROADMAP.md.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from .config import settings
from .contracts import CaptionDocument, Cue, CueKind, Job, JobStatus
from .pipeline import formatter, run_pipeline
from .wcag import validate


def normalize_document(doc: CaptionDocument) -> CaptionDocument:
    """Po edycji: sortuj cues wg startu, przenumeruj, prze-zawijaj linie mowy,
    przelicz czas trwania. Czysta logika offline (bez AI)."""
    cues = sorted(doc.cues, key=lambda c: (c.start_ms, c.end_ms))
    fixed: list[Cue] = []
    for i, c in enumerate(cues, start=1):
        text = (c.text or " ".join(c.lines)).strip()
        if c.kind == CueKind.speech:
            lines = formatter.wrap_two_lines(text)
        else:
            lines = [text]
        fixed.append(c.model_copy(update={"index": i, "lines": lines, "text": text}))
    doc.cues = fixed
    if fixed:
        doc.media.duration_ms = max(c.end_ms for c in fixed)
    return doc


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._load()

    def _load(self) -> None:
        d = settings.storage_dir
        if not d or not os.path.isdir(d):
            return
        for name in os.listdir(d):
            if not name.endswith(".json"):
                continue
            try:
                with open(os.path.join(d, name), encoding="utf-8") as f:
                    job = Job.model_validate_json(f.read())
                self._jobs[job.id] = job
            except Exception:  # noqa: BLE001 — uszkodzony plik pomijamy
                continue

    def create(self, filename: str) -> Job:
        job = Job(id=uuid.uuid4().hex[:12], status=JobStatus.queued, filename=filename)
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def list(self) -> list[Job]:
        return sorted(self._jobs.values(), key=lambda j: j.updated_at, reverse=True)

    def delete(self, job_id: str) -> bool:
        existed = self._jobs.pop(job_id, None) is not None
        if settings.storage_dir:
            try:
                os.unlink(os.path.join(settings.storage_dir, f"{job_id}.json"))
            except OSError:
                pass
        return existed

    def _touch(self, job: Job, status: JobStatus) -> None:
        job.status = status
        job.updated_at = datetime.now(timezone.utc).isoformat()

    def process(self, job: Job, audio_path: Optional[str] = None) -> Job:
        self._touch(job, JobStatus.processing)
        try:
            doc: CaptionDocument = run_pipeline(job.filename or "sample", audio_path)
            job.result = doc
            self._touch(job, JobStatus.done)
            self._persist(job)
        except Exception as exc:  # noqa: BLE001
            job.error = str(exc)
            self._touch(job, JobStatus.error)
        return job

    def update_document(self, job: Job, doc: CaptionDocument) -> Job:
        """Edytor: zapis poprawionego dokumentu -> normalizacja + ponowna walidacja WCAG + zrzut.
        W pelni offline (bez AI)."""
        doc = normalize_document(doc)
        doc.wcag = validate(doc)
        job.result = doc
        self._touch(job, JobStatus.done)
        self._persist(job)
        return job

    def storage_usage(self) -> dict:
        """Zuzycie magazynu (offline): liczba materialow + bajty na dysku + limit."""
        used = 0
        d = settings.storage_dir
        if d and os.path.isdir(d):
            for name in os.listdir(d):
                if name.endswith(".json"):
                    try:
                        used += os.path.getsize(os.path.join(d, name))
                    except OSError:
                        pass
        limit = max(1, settings.storage_limit_mb) * 1024 * 1024
        return {"count": len(self._jobs), "used_bytes": used, "limit_bytes": limit,
                "over_limit": used >= limit}

    def _persist(self, job: Job) -> None:
        if not settings.storage_dir:
            return
        try:
            os.makedirs(settings.storage_dir, exist_ok=True)
            path = os.path.join(settings.storage_dir, f"{job.id}.json")
            with open(path, "w", encoding="utf-8") as f:
                f.write(job.model_dump_json(indent=2))
        except OSError:
            pass


store = JobStore()
