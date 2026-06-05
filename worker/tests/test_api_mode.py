"""Testy gotowości i konfiguracji trybu API — wyłącznie offline (zero wywołań sieci/płatnych)."""
from fastapi.testclient import TestClient

from widzwiek.api_check import readiness
from widzwiek.config import Settings, settings
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
    assert r["mode"] == "mock" and r["ready"] is True


def test_readiness_api_without_key_not_ready():
    r = readiness(_settings(pipeline_mode="api", openai_api_key=""))
    assert r["ready"] is False
    assert any("OPENAI_API_KEY" in n for n in r["notes"])


def test_health_exposes_fields():
    data = client.get("/health").json()
    for key in ("mode", "ready", "api_key_present", "openai_installed", "ffmpeg_present", "providers", "notes"):
        assert key in data


def test_config_endpoint_sets_key_and_mode_in_memory():
    try:
        # ustaw tryb api + klucz (w pamięci) — bez żadnego wywołania do OpenAI
        data = client.post("/api/config", json={"pipeline_mode": "api", "openai_api_key": "sk-test-123"}).json()
        assert data["mode"] == "api"
        assert data["api_key_present"] is True
        assert data["providers"]["asr"] == "openai"
        # wróć do mock + wyczyść klucz
        data2 = client.post("/api/config", json={"pipeline_mode": "mock", "openai_api_key": ""}).json()
        assert data2["mode"] == "mock"
        assert data2["api_key_present"] is False
    finally:
        settings.pipeline_mode = "mock"; settings.openai_api_key = ""


def test_config_rejects_invalid_mode():
    assert client.post("/api/config", json={"pipeline_mode": "xxx"}).status_code == 400
