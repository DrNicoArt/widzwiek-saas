"""Testy gotowości trybu API — wyłącznie offline (zero wywołań sieciowych/płatnych)."""
from fastapi.testclient import TestClient

from widzwiek.api_check import readiness
from widzwiek.config import Settings
from widzwiek.main import app

client = TestClient(app)


def _settings(**kw) -> Settings:
    s = Settings()
    s.asr_provider = ""; s.diarization_provider = ""; s.sound_provider = ""
    for k, v in kw.items():
        setattr(s, k, v)
    return s


def test_readiness_mock_is_ready_without_anything():
    r = readiness(_settings(pipeline_mode="mock", openai_api_key=""))
    assert r["mode"] == "mock"
    assert r["ready"] is True  # demo działa bez kluczy/openai/ffmpeg


def test_readiness_api_without_key_not_ready():
    r = readiness(_settings(pipeline_mode="api", openai_api_key=""))
    assert r["ready"] is False
    assert any("OPENAI_API_KEY" in n for n in r["notes"])


def test_readiness_reports_flags():
    r = readiness(_settings(pipeline_mode="api", openai_api_key="sk-test"))
    assert set(["mode", "api_key_present", "openai_installed", "ffmpeg_present", "ready", "notes"]) <= set(r)
    assert r["api_key_present"] is True


def test_health_exposes_mode_and_readiness():
    data = client.get("/health").json()
    assert data["status"] == "ok"
    for key in ("mode", "ready", "api_key_present", "openai_installed", "ffmpeg_present", "providers", "notes"):
        assert key in data
    assert data["mode"] == "mock"  # domyślny tryb demo
