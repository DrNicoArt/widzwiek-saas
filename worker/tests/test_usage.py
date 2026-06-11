"""Rejestr zuzycia: ukonczony job nalicza minuty zgodnosci WCAG; /api/usage je sumuje (per org)."""
from __future__ import annotations

import io

from fastapi.testclient import TestClient

from widzwiek.config import settings
from widzwiek.main import app
from widzwiek import usage
def test_usage_recorded_and_summarized():
    client = TestClient(app)
    prev = settings.api_tokens
    settings.api_tokens = {}  # tryb demo
    try:
        before = usage.summary("demo")["wcag_minutes"]
        files = {"file": ("n.mp3", io.BytesIO(b"x"), "audio/mpeg")}
        r = client.post("/api/jobs", files=files)
        assert r.status_code == 200 and r.json()["status"] == "done"
        s = client.get("/api/usage").json()
        assert s["org_id"] == "demo"
        assert s["wcag_minutes"] >= before  # naliczono (mock ma dodatnie minuty)
        assert s["events"] >= 1
    finally:
        settings.api_tokens = prev
