"""Billing — jednostka rozliczeniowa: MINUTA ZGODNOSCI WCAG (nie minuta transkrypcji).

Cena nie zalezy od providera pod spodem — to klucz Modelu B. Operatorzy platnosci sa
wymienni przez interfejs PaymentProvider (Stripe/Paddle/Przelewy24/PayU/Tpay/faktura).
Rozliczenie liczone z append-only usage_events (patrz infra/db/0001_init.sql).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import ceil

# Mnozniki za dodatkowe warstwy zgodnosci (kompozycja produktu, nie cennik providera).
MULT_BASE = 1.0
MULT_SPEAKERS = 0.3       # rozpoznanie i etykiety mowcow
MULT_SOUNDS = 0.3        # opisy dzwiekow niewerbalnych
MULT_REPORT = 0.1        # raport WCAG (dowod)


@dataclass(frozen=True)
class ComplianceOptions:
    speakers: bool = True
    sounds: bool = True
    report: bool = True


def wcag_minutes(duration_ms: int, opts: ComplianceOptions = ComplianceOptions()) -> int:
    """Ile 'minut zgodnosci' nalicza ten material. Minuty audio * mnoznik kompozycji, zaokr. w gore."""
    audio_min = max(1, ceil(duration_ms / 60000)) if duration_ms > 0 else 0
    mult = MULT_BASE + (MULT_SPEAKERS if opts.speakers else 0) + (MULT_SOUNDS if opts.sounds else 0) + (MULT_REPORT if opts.report else 0)
    return ceil(audio_min * mult)


def credits_for(duration_ms: int, opts: ComplianceOptions = ComplianceOptions(), credit_per_min: float = 1.0) -> int:
    return ceil(wcag_minutes(duration_ms, opts) * credit_per_min)


@dataclass
class EntitlementCheck:
    allowed: bool
    remaining: float
    needed: int


def check_entitlement(limit: float, used: float, needed: int) -> EntitlementCheck:
    remaining = limit - used
    return EntitlementCheck(allowed=remaining >= needed, remaining=remaining, needed=needed)


# === Operatorzy platnosci (interfejs wymienny — scaffold) ===
@dataclass
class CheckoutSession:
    url: str
    external_id: str
    provider: str


class PaymentProvider(ABC):
    id: str = "abstract"
    @abstractmethod
    def create_checkout(self, org_id: str, plan: str, amount_cents: int, currency: str = "PLN") -> CheckoutSession: ...
    @abstractmethod
    def handle_webhook(self, payload: dict, signature: str) -> dict: ...
    @abstractmethod
    def refund(self, external_id: str, amount_cents: int) -> bool: ...

# Adaptery do dolozenia bez zmiany reszty: StripeAdapter, PaddleAdapter, Przelewy24Adapter,
# PayUAdapter, TpayAdapter, ManualInvoiceAdapter (faktura B2B / przelew tradycyjny).
SUPPORTED_PROVIDERS = ("stripe", "paddle", "przelewy24", "payu", "tpay", "manual_invoice")
