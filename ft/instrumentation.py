from __future__ import annotations

import os
import threading
import multiprocessing
from typing import Final, Literal

from .config import settings


class ThreadGlobal:
    def __init__(self):
        self._lock = threading.Lock()
        self._value: int = 0

    def inc(self) -> tuple[int, int]:
        with self._lock:
            before = self._value
            self._value = before + 1
            return before, self._value

    def dec(self) -> tuple[int, int]:
        with self._lock:
            before = self._value
            self._value = before - 1
            return before, self._value

    def read(self) -> int:
        with self._lock:
            return self._value


class _MPValueCounter:
    def __init__(self):
        self._val = multiprocessing.Value("i", 0)

    def inc(self) -> tuple[int, int]:
        with self._val.get_lock():
            before = self._val.value
            self._val.value = before + 1
            return before, self._val.value

    def dec(self) -> tuple[int, int]:
        with self._val.get_lock():
            before = self._val.value
            self._val.value = before - 1
            return before, self._val.value

    def read(self) -> int:
        with self._val.get_lock():
            return int(self._val.value)


class ProcessGlobal:
    def __init__(self) -> None:
        self._counter = _MPValueCounter()

    def inc(self) -> tuple[int, int]:
        return self._counter.inc()

    def dec(self) -> tuple[int, int]:
        return self._counter.dec()

    def read(self) -> int:
        return self._counter.read()


selected_counter: Final[ThreadGlobal | ProcessGlobal] = (
    ThreadGlobal() if settings.worker_type == "t" else ProcessGlobal()
)
