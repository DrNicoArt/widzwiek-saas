"""Testy trybu pipeline (mock/api), konfiguracji providera API i mapowania
wyniku transkrypcji do kontraktu CaptionDocument. Bez sieci — API jest mockowane.
"""
import os
import tempfile

import pytest

from widzwiek.config import Settings
from widzwiek.contracts import CaptionDocument, MediaInfo, SourceKind
from widzwiek.export import to_srt, to_vtt
from widzwiek.pipeline import formatter
from widzwiek.pipeline.asr import MockASRProvider, OpenAIASRProvider, map_transcription
from widzwiek.pipeline.audio import ensure_audio
from widzwiek.pipeline.diarization import (
    MockDiarizationProvider,
    HeuristicTurnDiarizationProvider,
    SingleSpeakerDiarizationProvider,
)
from widzwiek.pipeline.providers import select_providers
from widzwiek.pipeline.sound_events import MockSoundEventProvider, NoopSoundEventProvider, OpenAudioSoundEventProvider
from widzwiek.wcag import validate


def _settings(**kw) -> Settings:
    s = Settings()
    s.asr_provider = ""
    s.diarization_provider = ""
    s.sound_provider = ""
    for k, v in kw.items():
        setattr(s, k, v)
    return s


def _media() -> MediaInfo:
    return MediaInfo(filename="a.mp3", source_kind=SourceKind.audio, duration_ms=0)


# --- wybór trybu --------------------------------------------------------------

def test_mode_mock_selects_mock_providers():
    p = select_providers(_settings(pipeline_mode="mock"))
    assert isinstance(p.asr, MockASRProvider)
    assert isinstance(p.diarization, MockDiarizationProvider)
    assert isinstance(p.sound_events, MockSoundEventProvider)


def test_mode_api_selects_api_providers():
    p = select_providers(_settings(pipeline_mode="api", openai_api_key="sk-test"))
    assert isinstance(p.asr, OpenAIASRProvider)
    assert isinstance(p.diarization, HeuristicTurnDiarizationProvider)
    assert isinstance(p.sound_events, OpenAudioSoundEventProvider)


def test_invalid_mode_raises():
    with pytest.raises(ValueError):
        select_providers(_settings(pipeline_mode="nonsense"))


def test_per_stage_override_wins():
    p = select_providers(_settings(pipeline_mode="api", openai_api_key="x", sound_provider="mock"))
    assert isinstance(p.asr, OpenAIASRProvider)
    assert isinstance(p.sound_events, MockSoundEventProvider)


# --- konfiguracja providera API ----------------------------------------------

def test_missing_api_key_gives_clear_error():
    prov = OpenAIASRProvider(api_key="", model="whisper-1")
    with pytest.raises(ValueError) as exc:
        prov.transcribe("/tmp/whatever.mp3", _media())
    assert "OPENAI_API_KEY" in str(exc.value)


# --- mapowanie transkrypcji -> SpeechSegment ----------------------------------

def test_map_transcription_segments_to_ms():
    data = {
        "text": "Dzień dobry. Druga linia",
        "duration": 5.0,
        "segments": [
            {"start": 0.0, "end": 2.5, "text": " Dzień dobry."},
            {"start": 2.5, "end": 5.0, "text": "Druga linia"},
        ],
    }
    segs = map_transcription(data)
    assert len(segs) == 2
    assert segs[0].start_ms == 0 and segs[0].end_ms == 2500
    assert segs[0].text == "Dzień dobry."          # przycięte białe znaki
    assert segs[0].speaker_id is None              # diaryzacja to osobny etap


def test_map_transcription_fallback_single_segment():
    segs = map_transcription({"text": "Sam tekst bez segmentów", "segments": []})
    assert len(segs) == 1
    assert segs[0].start_ms == 0 and segs[0].end_ms > 0


def test_openai_provider_maps_via_monkeypatched_request():
    prov = OpenAIASRProvider(api_key="sk-test", model="whisper-1")
    prov._request_transcription = lambda path: {  # type: ignore[method-assign]
        "segments": [{"start": 0.0, "end": 1.2, "text": "Halo świecie"}]
    }
    segs = prov.transcribe("/tmp/x.mp3", _media())
    assert segs[0].text == "Halo świecie" and segs[0].end_ms == 1200


def test_api_output_flows_into_existing_contract_and_export():
    """Wynik transkrypcji (API) przechodzi przez diaryzację TBD, formatter,
    walidację WCAG i eksport SRT/VTT — czyli istniejący kontrakt/flow."""
    prov = OpenAIASRProvider(api_key="sk-test", model="whisper-1")
    prov._request_transcription = lambda path: {  # type: ignore[method-assign]
        "segments": [
            {"start": 0.0, "end": 3.0, "text": "Pierwsze zdanie testowe."},
            {"start": 4.0, "end": 7.0, "text": "Drugie zdanie testowe."},
        ]
    }
    segs = prov.transcribe("/tmp/x.mp3", _media())
    diar = SingleSpeakerDiarizationProvider().diarize(None, segs)
    cues = formatter.build_cues(diar.segments, [])
    media = _media()
    media.duration_ms = max(c.end_ms for c in cues)
    doc = CaptionDocument(media=media, speakers=diar.speakers, cues=cues)
    doc.wcag = validate(doc)

    assert len(doc.cues) == 2
    assert doc.speakers and doc.speakers[0].label == "Mówca"
    assert "-->" in to_srt(doc)
    assert to_vtt(doc).startswith("WEBVTT")
    assert doc.wcag.target == "WCAG 2.1 AA"


# --- obsługa pliku audio/wideo ------------------------------------------------

def test_ensure_audio_passthrough_for_audio_file():
    fd, path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)
    try:
        prepared = ensure_audio(path, "nagranie.mp3")
        assert prepared.path == path and prepared.cleanup is False and prepared.extracted is False
    finally:
        os.unlink(path)


def test_ensure_audio_missing_file_raises():
    with pytest.raises(FileNotFoundError):
        ensure_audio("/nie/istnieje.mp3", "x.mp3")
