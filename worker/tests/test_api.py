import io

from fastapi.testclient import TestClient

from widzwiek.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_full_job_flow():
    files = {"file": ("test.mp4", io.BytesIO(b"fake-bytes"), "video/mp4")}
    r = client.post("/api/jobs", files=files)
    assert r.status_code == 200
    job = r.json()
    assert job["status"] == "done"
    job_id = job["id"]

    # status
    r2 = client.get(f"/api/jobs/{job_id}")
    assert r2.status_code == 200
    assert r2.json()["result"]["wcag"]["target"] == "WCAG 2.1 AA"

    # eksporty
    srt = client.get(f"/api/jobs/{job_id}/export/srt")
    assert srt.status_code == 200 and "-->" in srt.text
    vtt = client.get(f"/api/jobs/{job_id}/export/vtt")
    assert vtt.status_code == 200 and vtt.text.startswith("WEBVTT")


def test_missing_job_404():
    assert client.get("/api/jobs/nope").status_code == 404
