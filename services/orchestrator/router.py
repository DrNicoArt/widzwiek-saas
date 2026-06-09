"""Router providerów — decyduje, który provider (lub którzy) obsłużą dany materiał.

Wejście: profil materiału (język, długość, domena, plan, strategia/tryb).
Logika: odfiltruj po obsłudze języka i statusie planu → policz score wg wag trybu →
posortuj. Tryby „most_accurate"/„institutional" mogą uruchomić TOP-N równolegle
i wybrać najlepszy po ZMIERZONEJ jakości (telemetria), pozostałe to fallbacky.

To jest miejsce, gdzie powstaje przewaga: klient wybiera TRYB, nie providera.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .adapters import ProviderProfile, asr_profiles

# Wagi per strategia (suma nieistotna — normalizujemy). Wyżej = ważniejsze.
STRATEGY_WEIGHTS: dict[str, dict[str, float]] = {
    "automatic":     {"quality": 0.45, "cost": 0.30, "speed": 0.15, "reliability": 0.10},
    "most_accurate": {"quality": 0.80, "cost": 0.00, "speed": 0.05, "reliability": 0.15},
    "cheapest":      {"quality": 0.20, "cost": 0.70, "speed": 0.05, "reliability": 0.05},
    "fastest":       {"quality": 0.20, "cost": 0.10, "speed": 0.65, "reliability": 0.05},
    "institutional": {"quality": 0.55, "cost": 0.05, "speed": 0.05, "reliability": 0.35},
}

# Ile providerów uruchomić równolegle (potem wybór po zmierzonej jakości).
STRATEGY_PARALLELISM: dict[str, int] = {
    "automatic": 1, "cheapest": 1, "fastest": 1, "most_accurate": 3, "institutional": 2,
}


@dataclass
class MaterialProfile:
    language: str = "pl"
    duration_ms: int = 0
    domain: str = "general"          # general | lecture | media | call ...
    plan_tier: str = "standard"      # free | standard | pro | enterprise
    strategy: str = "automatic"


@dataclass
class RankedProvider:
    profile: ProviderProfile
    score: float
    reasons: dict = field(default_factory=dict)


def _norm_cost(cost: float, mx: float) -> float:
    """0..1, gdzie 1 = najtaniej (cost=0), 0 = najdrożej (cost=mx)."""
    if mx <= 0:
        return 1.0
    return max(0.0, 1.0 - (cost / mx))


def rank(kind: str, profile: MaterialProfile, candidates: list[ProviderProfile] | None = None) -> list[RankedProvider]:
    if kind != "transcription":
        raise ValueError("v1 obsługuje 'transcription'; kolejne rodzaje analogicznie.")
    pool = candidates if candidates is not None else asr_profiles()
    # Filtr: język + (plan free => tylko providerzy bez klucza/koszt 0)
    pool = [p for p in pool if p.supports(profile.language)]
    if profile.plan_tier == "free":
        pool = [p for p in pool if not p.requires_api_key]
    if not pool:
        return []
    w = STRATEGY_WEIGHTS.get(profile.strategy, STRATEGY_WEIGHTS["automatic"])
    tot = sum(w.values()) or 1.0
    mx_cost = max(p.cost_per_min_cents for p in pool)
    ranked: list[RankedProvider] = []
    for p in pool:
        cost_score = _norm_cost(p.cost_per_min_cents, mx_cost)
        s = (w["quality"] * p.quality + w["cost"] * cost_score
             + w["speed"] * p.speed + w["reliability"] * p.reliability) / tot
        ranked.append(RankedProvider(p, round(s, 4), {
            "quality": p.quality, "cost_score": round(cost_score, 3),
            "speed": p.speed, "reliability": p.reliability,
        }))
    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked


def select(kind: str, profile: MaterialProfile) -> dict:
    """Zwraca decyzję: wybrany provider + ilu uruchomić równolegle + ranking."""
    ranked = rank(kind, profile)
    if not ranked:
        return {"chosen": None, "parallel": [], "ranked": []}
    n = STRATEGY_PARALLELISM.get(profile.strategy, 1)
    parallel = [r.profile.id for r in ranked[:n]]
    return {
        "chosen": ranked[0].profile.id,
        "parallel": parallel,         # uruchom te; wybierz najlepszy po zmierzonej jakości
        "ranked": [(r.profile.id, r.score) for r in ranked],
    }
