"""Lekka autoryzacja: token API -> org_id. Bez tokenow w configu => tryb otwarty ('demo').

To fundament wielodostepnosci/kont. Docelowo zastapi to pelny auth (sesje/OIDC),
ale kontrakt (org per request) juz tu jest — endpointy filtruja po org_id.
"""
from __future__ import annotations

from typing import Optional

from fastapi import Header, HTTPException

from .config import settings


def current_org(authorization: Optional[str] = Header(default=None)) -> str:
    if not settings.api_tokens:
        return "demo"  # auth wylaczony — tryb otwarty/demo (testy, lokalnie)
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    org = settings.api_tokens.get(token)
    if not org:
        raise HTTPException(status_code=401, detail="Brak lub niewlasciwy token API.")
    return org
