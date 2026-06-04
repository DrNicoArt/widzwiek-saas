from widzwiek.contracts import (
    CaptionDocument,
    Cue,
    CueKind,
    MediaInfo,
    SourceKind,
    Speaker,
)
from widzwiek.pipeline import run_pipeline
from widzwiek.wcag import validate


def _doc(cues, speakers=None):
    return CaptionDocument(
        media=MediaInfo(filename="t.mp4", source_kind=SourceKind.video, duration_ms=10000),
        speakers=speakers or [],
        cues=cues,
    )


def test_mock_material_is_compliant():
    doc = run_pipeline("film.mp4")
    assert doc.wcag.compliant is True
    assert doc.wcag.stats.error_count == 0
    # demo celowo zawiera >=1 ostrzezenie, by pokazac wartosc raportu
    assert doc.wcag.stats.warning_count >= 1


def test_line_too_long_is_error():
    long = "x" * 60
    doc = _doc([Cue(id="c1", index=1, start_ms=0, end_ms=3000,
                    kind=CueKind.speech, lines=[long], text=long)])
    rep = validate(doc)
    assert rep.compliant is False
    assert any(i.code == "LINE_TOO_LONG" and i.severity.value == "error" for i in rep.issues)


def test_too_many_lines_is_error():
    doc = _doc([Cue(id="c1", index=1, start_ms=0, end_ms=3000, kind=CueKind.speech,
                    lines=["a", "b", "c"], text="a b c")])
    rep = validate(doc)
    assert any(i.code == "TOO_MANY_LINES" for i in rep.issues)
    assert rep.compliant is False


def test_all_caps_is_error():
    doc = _doc([Cue(id="c1", index=1, start_ms=0, end_ms=3000, kind=CueKind.speech,
                    lines=["TO JEST KRZYK"], text="TO JEST KRZYK")])
    rep = validate(doc)
    assert any(i.code == "ALL_CAPS" for i in rep.issues)


def test_bleep_caps_allowed():
    doc = _doc([Cue(id="c1", index=1, start_ms=0, end_ms=3000, kind=CueKind.speech,
                    lines=["Powiedział BLEEP wtedy"], text="Powiedział BLEEP wtedy")])
    rep = validate(doc)
    assert not any(i.code == "ALL_CAPS" for i in rep.issues)


def test_short_duration_is_error():
    doc = _doc([Cue(id="c1", index=1, start_ms=0, end_ms=400, kind=CueKind.speech,
                    lines=["szybko"], text="szybko")])
    rep = validate(doc)
    assert any(i.code == "DURATION_TOO_SHORT" for i in rep.issues)


def test_overlap_is_error():
    cues = [
        Cue(id="c1", index=1, start_ms=0, end_ms=3000, kind=CueKind.speech, lines=["a"], text="a"),
        Cue(id="c2", index=2, start_ms=2000, end_ms=5000, kind=CueKind.speech, lines=["b"], text="b"),
    ]
    rep = validate(_doc(cues))
    assert any(i.code == "OVERLAP" for i in rep.issues)


def test_warnings_do_not_break_compliance():
    # przerwa < 1500 ms -> warning, ale nadal compliant
    cues = [
        Cue(id="c1", index=1, start_ms=0, end_ms=3000, kind=CueKind.speech, lines=["pierwszy"], text="pierwszy"),
        Cue(id="c2", index=2, start_ms=3500, end_ms=6500, kind=CueKind.speech, lines=["drugi"], text="drugi"),
    ]
    rep = validate(_doc(cues, speakers=[Speaker(id="S1", label="A")]))
    assert any(i.code == "GAP_TOO_SHORT" for i in rep.issues)
    assert rep.compliant is True
