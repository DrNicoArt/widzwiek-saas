"""Testy realnego, offline obiegu jobow: trwalosc, lista, edycja+rewalidacja, eksport TXT/JSON.
Zero wywolan sieci/AI."""
import io
import os
import tempfile

from fastapi.testclient import TestClient

from widzwiek.config import settings
from widzwiek.contracts import Job, JobStatus, CaptionDocument, MediaInfo, SourceKind, Cue, CueKind
from widzwiek.jobs import JobStore, normalize_document
from widzwiek.main import app

client = TestClient(app)


def _upload():
    files = {"file": ("nagranie.mp3", io.BytesIO(b"x" * 16), "audio/mpeg")}
    return client.post("/api/jobs", files=files).json()


def test_list_and_delete_roundtrip():
    job = _upload()
    jid = job["id"]
    ids = [j["id"] for j in client.get("/api/jobs").json()]
    assert jid in ids
    assert client.delete(f"/api/jobs/{jid}").status_code == 200
    assert client.delete(f"/api/jobs/{jid}").status_code == 404


def test_update_document_revalidates_and_reindexes():
    job = _upload()
    jid = job["id"]
    doc = client.get(f"/api/jobs/{jid}").json()["result"]
    # zaburz kolejnosc + dodaj za dluga linie mowy
    doc["cues"][0]["start_ms"] = 999999
    doc["cues"][1]["text"] = "To jest bardzo dluga wypowiedz ktora znacznie przekracza limit jednej linii napisow WCAG"
    res = client.put(f"/api/jobs/{jid}", json=doc)
    assert res.status_code == 200
    out = res.json()["result"]
    # przenumerowane wg startu (1..n) i posortowane
    assert [c["index"] for c in out["cues"]] == list(range(1, len(out["cues"]) + 1))
    assert out["cues"] == sorted(out["cues"], key=lambda c: c["start_ms"])
    # mowa zawsze max 2 linie
    for c in out["cues"]:
        assert len(c["lines"]) <= 2
    # raport WCAG przeliczony
    assert "wcag" in out and "stats" in out["wcag"]


def test_export_txt_and_json():
    job = _upload()
    jid = job["id"]
    txt = client.get(f"/api/jobs/{jid}/export/txt")
    assert txt.status_code == 200 and len(txt.text.strip()) > 0
    js = client.get(f"/api/jobs/{jid}/export/json")
    assert js.status_code == 200 and '"schema_version"' in js.text


def test_persistence_survives_new_store(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "storage_dir", str(tmp_path))
    s1 = JobStore()
    j = s1.create("plik.wav")
    s1.process(j)  # mock pipeline -> done -> persist
    assert os.path.exists(os.path.join(str(tmp_path), f"{j.id}.json"))
    s2 = JobStore()  # nowy store laduje z dysku
    assert s2.get(j.id) is not None
    assert s2.get(j.id).status == JobStatus.done


def test_normalize_rewraps_and_recomputes_duration():
    doc = CaptionDocument(
        media=MediaInfo(filename="a.mp3", source_kind=SourceKind.audio, duration_ms=0),
        cues=[
            Cue(id="c2", index=5, start_ms=4000, end_ms=6000, kind=CueKind.speech, lines=["b"], text="druga wypowiedz"),
            Cue(id="c1", index=2, start_ms=0, end_ms=2000, kind=CueKind.speech, lines=["a"], text="pierwsza"),
        ],
    )
    out = normalize_document(doc)
    assert [c.index for c in out.cues] == [1, 2]
    assert out.cues[0].id == "c1"           # posortowane wg startu
    assert out.media.duration_ms == 6000    # przeliczony czas


def test_storage_usage_endpoint():
    data = client.get("/api/storage").json()
    for k in ("count", "used_bytes", "limit_bytes", "over_limit"):
        assert k in data
    assert data["limit_bytes"] > 0
    assert isinstance(data["over_limit"], bool)


def test_style_default_and_wrap_respects_limits():
    from widzwiek.pipeline import formatter
    # max 1 linia -> wszystko w jednej
    assert len(formatter.wrap_lines("alfa beta gamma delta", max_chars=10, max_lines=1)) == 1
    # waski limit, 2 linie
    out = formatter.wrap_lines("alfa beta gamma delta epsilon", max_chars=12, max_lines=2)
    assert len(out) <= 2
    assert " ".join(out).split() == "alfa beta gamma delta epsilon".split()  # nic nie zgubione


def test_vtt_embeds_style_and_position():
    from widzwiek.export import to_vtt
    from widzwiek.contracts import CaptionDocument, MediaInfo, SourceKind, CaptionStyle, Speaker, Cue, CueKind
    doc = CaptionDocument(
        media=MediaInfo(filename="a.mp3", source_kind=SourceKind.audio, duration_ms=2000),
        speakers=[Speaker(id="S1", label="Lektor", color="yellow")],
        style=CaptionStyle(font_family="serif", font_size="lg", position="top", background=False),
        cues=[Cue(id="c1", index=1, start_ms=0, end_ms=2000, kind=CueKind.speech, speaker_id="S1", lines=["Czesc"], text="Czesc")],
    )
    vtt = to_vtt(doc)
    assert "STYLE" in vtt and "::cue" in vtt
    assert "Georgia" in vtt              # serif
    assert "background: transparent" in vtt
    assert "line:5%" in vtt              # pozycja top


def test_update_with_style_rewraps_to_max_chars():
    job = _upload()
    jid = job["id"]
    doc = client.get(f"/api/jobs/{jid}").json()["result"]
    doc["style"]["max_chars_per_line"] = 15
    doc["style"]["max_lines"] = 2
    doc["cues"][1]["text"] = "alfa beta gamma delta epsilon zeta eta"
    out = client.put(f"/api/jobs/{jid}", json=doc).json()["result"]
    for c in out["cues"]:
        assert len(c["lines"]) <= 2
    assert out["style"]["max_chars_per_line"] == 15
