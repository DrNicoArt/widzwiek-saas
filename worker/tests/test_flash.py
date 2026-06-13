from widzwiek.pipeline.flash import detect_flashes


def test_calm_video_passes():
    luma = [float(100 + (i % 5)) for i in range(150)]
    r = detect_flashes(luma, 30.0)
    assert r.analyzed and r.passed
    assert r.flashes_per_sec <= 3.0


def test_strobe_video_fails():
    luma = [0.0 if i % 2 == 0 else 255.0 for i in range(150)]
    r = detect_flashes(luma, 30.0)
    assert r.analyzed and not r.passed
    assert r.flashes_per_sec > 3.0
    assert r.worst_time_s is not None


def test_too_short_passes():
    assert detect_flashes([10.0], 30.0).passed
    assert detect_flashes([], 30.0).passed


def test_three_per_sec_boundary_passes():
    luma = []
    for sec in range(5):
        for f in range(30):
            luma.append(255.0 if f in (0, 10, 20) else 0.0)
    r = detect_flashes(luma, 30.0)
    assert r.flashes_per_sec <= 3.0
