"""Wielodostepnosc + lekka autoryzacja tokenem (token -> org_id).

Bez WIDZWIEK_API_TOKENS auth jest wylaczony (tryb 'demo'). Z tokenami:
- zly token -> 401,
- organizacje sa izolowane (orgA nie widzi materialow orgB).
"""
from __future__ import annotations

import io

from fastapi.testclient import TestClient

from widzwiek.config import settings
from widzwiek.main import app


def _upload(client, token):
    files = {"file": ("n.mp3", io.BytesIO(b"x"), "audio/mpeg")}
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post("/api/jobs", files=files, headers=h)


def test_open_mode_when_no_tokens():
    client = TestClient(app)
    prev = settings.api_tokens
    settings.api_tokens = {}
    try:
        assert _upload(client, None).status_code == 200
    finally:
        settings.api_tokens = prev


def test_bad_token_rejected():
    client = TestClient(app)
    prev = settings.api_tokens
    settings.api_tokens = {"tokA": "orgA"}
    try:
        assert _upload(client, "zly").status_code == 401
        assert client.get("/api/jobs", headers={"Authorization": "Bearer zly"}).status_code == 401
    finally:
        settings.api_tokens = prev


def test_orgs_are_isolated():
    client = TestClient(app)
    prev = settings.api_tokens
    settings.api_tokens = {"tokA": "orgA", "tokB": "orgB"}
    try:
        jid = _upload(client, "tokA").json()["id"]
        # orgB nie widzi materialu orgA
        assert client.get(f"/api/jobs/{jid}", headers={"Authorization": "Bearer tokB"}).status_code == 404
        listB = client.get("/api/jobs", headers={"Authorization": "Bearer tokB"}).json()
        assert all(j["id"] != jid for j in listB)
        # orgA widzi swoj
        assert client.get(f"/api/jobs/{jid}", headers={"Authorization": "Bearer tokA"}).status_code == 200
        listA = client.get("/api/jobs", headers={"Authorization": "Bearer tokA"}).json()
        assert any(j["id"] == jid for j in listA)
    finally:
        settings.api_tokens = prev
