"""Etap detekcji dźwięków niewerbalnych.

Tryby:
- Mock (PoC) — MockSoundEventProvider (przykładowe [oklaski], [muzyka]...).
- TBD — NoopSoundEventProvider: nic nie wykrywa (zamiast zmyślać dźwięki dla
  realnego audio). Walidator WCAG zgłosi wtedy INFO o braku opisów dźwięków.
"""
from __future__ import annotations

from typing import Optional

from ..contracts import MediaInfo
from .base import SoundEvent, SoundEventProvider, SpeechSegment
from . import mock_data


class MockSoundEventProvider(SoundEventProvider):
    name = "mock"

    def detect(
        self,
        audio_path: Optional[str],
        media: MediaInfo,
        speech_segments: Optional[list[SpeechSegment]] = None,
    ) -> list[SoundEvent]:
        return [
            SoundEvent(s.start_ms, s.end_ms, s.label, confidence=0.86, source=self.name, relevance="accepted")
            for s in mock_data.mock_sounds()
        ]


class NoopSoundEventProvider(SoundEventProvider):
    """TBD: brak detekcji dźwięków niewerbalnych (placeholder dla trybu API)."""
    name = "noop-tbd"

    def detect(
        self,
        audio_path: Optional[str],
        media: MediaInfo,
        speech_segments: Optional[list[SpeechSegment]] = None,
    ) -> list[SoundEvent]:
        return []


class OpenAudioSoundEventProvider(SoundEventProvider):
    """No-key MVP: próbuje lokalnej segmentacji speech/music/noise, a bez modelu
    dodaje istotne przerwy/ciszę z osi czasu mowy."""
    name = "open-audio-events"

    def detect(
        self,
        audio_path: Optional[str],
        media: MediaInfo,
        speech_segments: Optional[list[SpeechSegment]] = None,
    ) -> list[SoundEvent]:
        events: list[SoundEvent] = []
        if audio_path:
            events.extend(self._ina_segments(audio_path))
        events.extend(self._gap_events(speech_segments or [], media.duration_ms))
        return self._dedupe(events)

    def _ina_segments(self, audio_path: str) -> list[SoundEvent]:
        try:
            from inaSpeechSegmenter import Segmenter
        except ImportError:
            return []
        out: list[SoundEvent] = []
        try:
            seg = Segmenter(detect_gender=False)
            for label, start, end in seg(audio_path):
                start_ms = int(float(start) * 1000)
                end_ms = int(float(end) * 1000)
                if end_ms <= start_ms:
                    continue
                mapped = self._map_label(str(label))
                if mapped:
                    out.append(SoundEvent(start_ms, end_ms, mapped, 0.68, "inaSpeechSegmenter", "candidate"))
        except Exception:
            return []
        return out

    def _map_label(self, label: str) -> Optional[str]:
        l = label.lower()
        if "music" in l:
            return "[muzyka w tle]"
        if "noise" in l or "noenergy" in l:
            return "[szum tła]"
        return None

    def _gap_events(self, speech: list[SpeechSegment], duration_ms: int) -> list[SoundEvent]:
        if not speech:
            return []
        events: list[SoundEvent] = []
        ordered = sorted(speech, key=lambda s: s.start_ms)
        prev_end = 0
        for seg in ordered:
            gap = seg.start_ms - prev_end
            if gap >= 4500:
                events.append(SoundEvent(prev_end, seg.start_ms, "[cisza]", 0.42, "speech-gap-analysis", "review"))
            prev_end = max(prev_end, seg.end_ms)
        if duration_ms and duration_ms - prev_end >= 4500:
            events.append(SoundEvent(prev_end, duration_ms, "[cisza]", 0.42, "speech-gap-analysis", "review"))
        return events

    def _dedupe(self, events: list[SoundEvent]) -> list[SoundEvent]:
        events = sorted(events, key=lambda e: (e.start_ms, e.end_ms, e.label))
        out: list[SoundEvent] = []
        for ev in events:
            if out and ev.label == out[-1].label and ev.start_ms < out[-1].end_ms + 800:
                prev = out[-1]
                out[-1] = SoundEvent(prev.start_ms, max(prev.end_ms, ev.end_ms), prev.label, max(prev.confidence, ev.confidence), prev.source, prev.relevance)
            else:
                out.append(ev)
        return out


class AudioTaggingSoundEventProvider(SoundEventProvider):
    """TBD — klasyfikacja zdarzeń dźwiękowych.

    Wariant A: model audio-tagging (YAMNet / PANNs) -> mapowanie etykiet na
               polskie opisy [muzyka], [oklaski], [pukanie]...
    Wariant B: LLM po transkrypcji + cechy audio (do walidacji jakości na PoC).
    """
    name = "yamnet"

    def detect(
        self,
        audio_path: Optional[str],
        media: MediaInfo,
        speech_segments: Optional[list[SpeechSegment]] = None,
    ) -> list[SoundEvent]:
        raise NotImplementedError("AudioTaggingSoundEventProvider: integracja AI = TBD po GO z PoC.")


def get_sound_provider(name: str) -> SoundEventProvider:
    if name in ("open", "open-audio-events", "free", "local"):
        return OpenAudioSoundEventProvider()
    if name in ("yamnet", "panns"):
        return AudioTaggingSoundEventProvider()
    if name in ("noop", "noop-tbd", "none"):
        return NoopSoundEventProvider()
    return MockSoundEventProvider()
