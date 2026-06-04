from widzwiek.contracts import CueKind
from widzwiek.pipeline import run_pipeline
from widzwiek.pipeline.formatter import wrap_two_lines
from widzwiek.wcag import rules


def test_pipeline_produces_document():
    doc = run_pipeline("film_tomka.mp4")
    assert doc.schema_version == "1.0"
    assert doc.media.language == "pl"
    assert len(doc.speakers) >= 2
    assert len(doc.cues) > 0
    # cues posortowane i ponumerowane ciągle od 1
    assert [c.index for c in doc.cues] == list(range(1, len(doc.cues) + 1))
    starts = [c.start_ms for c in doc.cues]
    assert starts == sorted(starts)


def test_pipeline_has_speech_and_sound():
    doc = run_pipeline("x.mp4")
    kinds = {c.kind for c in doc.cues}
    assert CueKind.speech in kinds
    assert CueKind.sound in kinds
    # kryterium PoC: >= 3 opisy dźwięków
    assert sum(1 for c in doc.cues if c.kind == CueKind.sound) >= 3


def test_wrap_two_lines_respects_limit():
    text = "To jest dosyć długie zdanie testowe, które musi zostać podzielone na dwie linie."
    lines = wrap_two_lines(text)
    assert 1 <= len(lines) <= rules.MAX_LINES
    assert all(len(l) <= rules.MAX_CHARS_PER_LINE for l in lines)


def test_short_text_single_line():
    assert wrap_two_lines("Krótki tekst") == ["Krótki tekst"]
