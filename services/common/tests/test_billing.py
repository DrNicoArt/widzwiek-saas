import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from common.billing import wcag_minutes, credits_for, check_entitlement, ComplianceOptions

def test_full_compliance_multiplier():
    # 60s audio = 1 min; pelna kompozycja mnoznik 1.7 -> ceil = 2
    assert wcag_minutes(60000, ComplianceOptions(True, True, True)) == 2

def test_base_only():
    # sama transkrypcja: mnoznik 1.0
    assert wcag_minutes(60000, ComplianceOptions(False, False, False)) == 1

def test_rounds_up_audio_minutes():
    # 90s -> 2 min audio; base -> 2
    assert wcag_minutes(90000, ComplianceOptions(False, False, False)) == 2

def test_entitlement_blocks_when_insufficient():
    chk = check_entitlement(limit=10, used=9, needed=2)
    assert chk.allowed is False and chk.remaining == 1

def test_entitlement_allows_when_enough():
    assert check_entitlement(limit=100, used=10, needed=5).allowed is True
