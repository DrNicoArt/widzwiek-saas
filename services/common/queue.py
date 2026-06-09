"""Abstrakcja kolejki zadań — niezależna od dostawcy (Redis/RQ → SQS/PubSub).

API tylko ENQUEUE + odczyt statusu; pula workerów konsumuje. Implementacje konkretne
(RedisQueue, SQSQueue) dokładamy bez zmiany wywołań. Scaffold Kroku 3.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class JobMessage:
    job_id: str
    org_id: str
    type: str = "caption"
    strategy: str = "automatic"


class JobQueue(ABC):
    @abstractmethod
    def enqueue(self, msg: JobMessage) -> None: ...
    @abstractmethod
    def dequeue(self, timeout_s: int = 5) -> JobMessage | None: ...
    @abstractmethod
    def ack(self, job_id: str) -> None: ...


class InMemoryQueue(JobQueue):
    """Do testów/dev. Produkcja: RedisQueue/SQSQueue."""
    def __init__(self) -> None:
        self._q: list[JobMessage] = []
    def enqueue(self, msg: JobMessage) -> None:
        self._q.append(msg)
    def dequeue(self, timeout_s: int = 5) -> JobMessage | None:
        return self._q.pop(0) if self._q else None
    def ack(self, job_id: str) -> None:
        return None
