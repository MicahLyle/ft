# Config and worker-type refactor

Date: 2025-08-25

Prompt/context: Refactor instrumentation to derive worker type from a new Pydantic BaseSettings subclass, and add a config module. Fields requested: mode, runtime, ft, is_sync, is_async.

What I changed:
- Added `ft/config.py` with `AppSettings` (Pydantic v2 + pydantic-settings). It reads MODE and optional RUNTIME from the environment, computes:
  - ft: whether mode is free-threaded (contains "-ft-").
  - is_sync/is_async: simple sync default for now.
  - worker_type: 'p' for gunicorn, 't' otherwise; runtime inferred from mode if not provided.
- Added pydantic-settings to pyproject.toml.
- Updated `ft/instrumentation.py` to source WORKER_TYPE from settings.worker_type (and kept exported names intact). No behavior changes expected in current modes.

Why:
- Centralize environment-driven behavior in a typed settings object.
- Make worker-type selection explicit via mode/runtime, avoiding bespoke env validation.

Notes/future:
- Granian is supported in the runtime literal; current worker_type defaults to 't' for it. Adjust as concurrency semantics evolve.
- If needed, teach is_sync to reflect async modes when we add them.
