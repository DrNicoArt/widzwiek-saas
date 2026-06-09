"""Abstrakcja object storage (S3/R2/GCS) + upload bezposredni przez presigned URL.

Duze wideo NIE idzie przez API — klient dostaje presigned PUT i wgrywa wprost do storage.
Scaffold Kroku 3. Implementacje: S3Storage (boto3), R2Storage (S3-compat).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PresignedUpload:
    url: str
    method: str
    storage_key: str
    headers: dict


class ObjectStorage(ABC):
    @abstractmethod
    def presign_upload(self, org_id: str, filename: str, mime: str) -> PresignedUpload: ...
    @abstractmethod
    def presign_download(self, storage_key: str, ttl_s: int = 3600) -> str: ...
    @abstractmethod
    def delete(self, storage_key: str) -> None: ...   # RODO: twarde usuwanie
