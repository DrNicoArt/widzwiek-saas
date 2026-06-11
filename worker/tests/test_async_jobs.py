"""S4 — tryb async (WIDZWIEK_ASYNC=1): POST wraca natychmiast, job dochodzi w tle."""
from __future__ import annotations

import io
import time

from fastapi.testclient import TestClient

from widzwiek.config import settings
from widzwiek.main import app


def test_async_job_completes_in_background():
    client = TestClient(app)
    prev = settings.async_jobs
    settings.async_jobs = True
    try:
        files = {"file": ("nagranie.mp3", io.BytesIO(b"x"), "audio/mpeg")}
        r = client.post("/api/jobs", files=files)
        assert r.status_code == 200
        job = r.json()
        jid = job["id"]  # mock konczy sie blyskawicznie; istotne, ze sciezka async (watek) dziala bez bledu
        # job dochodzi w tle — odpytujemy status
        done = False
        for _ in range(50):
            jr = client.get(f"/api/jobs/{jid}").json()
            if jr["status"] in ("done", "error"):
                done = jr["status"] == "done"
                break
            time.sleep(0.05)
        assert done, "job nie ukonczyl sie w tle"
        assert client.get(f"/api/jobs/{jid}").json()["result"]["wcag"]["target"] == "WCAG 2.1 AA"
    finally:
        settings.async_jobs = prev
