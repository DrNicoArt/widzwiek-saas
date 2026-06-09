import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from orchestrator.router import rank, select, MaterialProfile
from orchestrator.adapters import asr_profiles


def test_cheapest_prefers_zero_cost_local():
    d = select("transcription", MaterialProfile(language="pl", strategy="cheapest"))
    assert d["chosen"] == "faster-whisper-local"  # koszt 0


def test_most_accurate_prefers_high_quality_and_parallelizes():
    d = select("transcription", MaterialProfile(language="pl", strategy="most_accurate"))
    top = d["chosen"]
    # najwyzsza deklarowana jakosc dla PL to speechmatics (0.91) lub openai (0.90)
    assert top in ("speechmatics", "openai-whisper")
    assert len(d["parallel"]) == 3  # most_accurate uruchamia TOP-3


def test_language_filter_excludes_unsupported():
    # assemblyai obsluguje tylko EN -> nie pojawia sie dla PL
    ranked_pl = [r.profile.id for r in rank("transcription", MaterialProfile(language="pl"))]
    assert "assemblyai" not in ranked_pl
    ranked_en = [r.profile.id for r in rank("transcription", MaterialProfile(language="en"))]
    assert "assemblyai" in ranked_en


def test_free_plan_only_no_key_providers():
    ranked = rank("transcription", MaterialProfile(language="pl", plan_tier="free"))
    assert all(not r.profile.requires_api_key for r in ranked)
    assert any(r.profile.id == "faster-whisper-local" for r in ranked)


def test_automatic_is_no_api_first_for_margin():
    # ZAMIERZONE: automatic = najlepsza WARTOSC -> darmowy lokalny silnik wygrywa,
    # gdy jest "wystarczajaco dobry" (no-API-first + maksymalna marza). Platni wchodza
    # dopiero przy strategii most_accurate. To swiadoma decyzja produktowa (Model B).
    d = select("transcription", MaterialProfile(language="pl", strategy="automatic"))
    assert d["chosen"] == "faster-whisper-local"
    assert len(d["parallel"]) == 1  # automatic nie pali pieniedzy na rownolegle przebiegi

def test_most_accurate_beats_automatic_choice():
    auto = select("transcription", MaterialProfile(language="pl", strategy="automatic"))["chosen"]
    acc = select("transcription", MaterialProfile(language="pl", strategy="most_accurate"))["chosen"]
    assert acc != auto and acc != "faster-whisper-local"
