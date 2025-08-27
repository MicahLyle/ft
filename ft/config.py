from __future__ import annotations

from typing import Final, Literal, TypeAlias

from pydantic import BaseModel, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


Mode: TypeAlias = str

Runtime = Literal["runserver", "gunicorn", "granian"]


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", case_sensitive=False)

    mode: Mode
    runtime: Runtime | None = None

    @computed_field(return_type=bool)
    @property
    def tokens(self) -> frozenset[str]:
        return frozenset(
            part.strip().lower() for part in self.mode.split("-") if part.strip()
        )

    @computed_field(return_type=bool)
    @property
    def ft(self) -> bool:
        tks = self.tokens
        if "ft" in tks:
            return True
        if "gil" in tks:
            return False
        py_tok = _extract_python_token(tks)
        return py_tok.endswith("t")

    @computed_field(return_type=bool)
    @property
    def gil(self) -> bool:
        return not self.ft

    @computed_field(return_type=bool)
    @property
    def is_sync(self) -> bool:
        tks = self.tokens
        if "sync" in tks:
            return True
        if "async" in tks:
            return False
        return True

    @computed_field(return_type=bool)
    @property
    def is_async(self) -> bool:
        tks = self.tokens
        return "async" in tks and "sync" not in tks

    @computed_field(return_type=Literal["t", "p"])
    @property
    def worker_type(self) -> Literal["t", "p"]:
        tks = self.tokens
        if "t" in tks:
            return "t"
        if "p" in tks:
            return "p"
        raise RuntimeError(f"Failed to determine worker type for mode {self.mode}")

    @computed_field(return_type=Literal["asgi", "wsgi", "runserver"])
    @property
    def gateway_type(self) -> Literal["asgi", "wsgi", "runserver"]:
        runtime = self.runtime or _infer_runtime_from_tokens(self.tokens)
        if runtime == "runserver":
            return "runserver"
        if runtime == "gunicorn":
            return "wsgi"
        return "asgi" if self.is_async else "wsgi"

    @computed_field(return_type=Literal["3.13", "3.14"])  # type: ignore[misc]
    @property
    def python_version(self) -> Literal["3.13", "3.14"]:
        py_tok = _extract_python_token(self.tokens)
        if py_tok.startswith("314") or py_tok.startswith("3.14"):
            return "3.14"
        if py_tok.startswith("313") or py_tok.startswith("3.13"):
            return "3.13"
        raise RuntimeError(f"Failed to determine Python version for mode {self.mode}")


settings: Final[AppSettings] = AppSettings()


def _infer_runtime_from_tokens(tokens: frozenset[str]) -> Runtime:
    if "gun" in tokens or "gunicorn" in tokens:
        return "gunicorn"
    if "gra" in tokens or "granian" in tokens:
        return "granian"
    if "rns" in tokens or "runserver" in tokens:
        return "runserver"
    raise RuntimeError(f"Failed to determine runtime for mode {tokens}")


def _extract_python_token(tokens: frozenset[str]) -> str:
    for t in tokens:
        if t.startswith("313") or t.startswith("314"):
            return t
    raise RuntimeError(f"Failed to determine Python version for mode {tokens}")
