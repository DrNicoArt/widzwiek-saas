import re

from widzwiek.export import to_srt, to_vtt
from widzwiek.pipeline import run_pipeline


def test_srt_format():
    doc = run_pipeline("film.mp4")
    srt = to_srt(doc)
    # numer + timecode SRT z przecinkiem
    assert "1\n" in srt
    assert re.search(r"\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}", srt)
    # etykieta mówcy obecna (2 mówców)
    assert "[Lektor]" in srt or "[Ekspertka]" in srt


def test_vtt_format():
    doc = run_pipeline("film.mp4")
    vtt = to_vtt(doc)
    assert vtt.startswith("WEBVTT")
    # timecode VTT z kropką
    assert re.search(r"\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}", vtt)
    # blok STYLE z kolorami i voice tag
    assert "STYLE" in vtt
    assert "<v " in vtt


def test_sound_cue_in_brackets():
    doc = run_pipeline("film.mp4")
    srt = to_srt(doc)
    assert re.search(r"\[[^\]]+\]", srt)  # np. [oklaski]
