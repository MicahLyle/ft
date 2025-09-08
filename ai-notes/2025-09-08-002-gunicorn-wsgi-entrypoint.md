# 2025-09-08 – Fix Gunicorn target to use top-level wsgi

Context: Gunicorn failed with `Failed to parse 'app.wsgi' as an attribute name or function call.` when using `gunicorn app:app.wsgi`. Gunicorn expects `module:callable` (not dotted attribute access).

Changes:
- Exposed top-level callables in `app.py`:
  - `wsgi = app.wsgi`
  - `asgi = app.asgi`
- Updated README Gunicorn commands to `app:wsgi` and corrected `-k gthread` placement.

Why:
- Gunicorn's documented usage is `gunicorn MODULE:VARIABLE` or with a factory, not `MODULE:object.attr`. See docs: [Gunicorn docs](https://gunicorn.org/#docs).

Result:
- `MODE=gun-sync-gil-p-313 uv run gunicorn app:wsgi` now starts successfully.

Optimized commands added to README:
- Python 3.13 (GIL on, sync): `MODE=gun-sync-gil-p-313 uv run -p python3.13 gunicorn app:wsgi -w 8`
- Python 3.13t (free-threaded, gthread): `MODE=gun-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t gunicorn -k gthread app:wsgi -w 2 --threads 16`
- Python 3.14 (GIL on, sync): `MODE=gun-sync-gil-p-314 uv run -p python3.14 gunicorn app:wsgi -w 8`
- Python 3.14t (free-threaded, gthread): `MODE=gun-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t gunicorn -k gthread app:wsgi -w 2 --threads 16`

Rationale:
- GIL builds: scale mostly with processes; `-w 8` increases parallelism for CPU-bound tasks.
- Free-threaded builds: threads can run CPU-bound Python concurrently; a small number of workers with higher `--threads` balances overhead and throughput.

Granian commands recap and rationale:
- Recap (examples from README):
  - 3.13 WSGI: `uv run -p python3.13 granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
  - 3.13 ASGI: `uv run -p python3.13 granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
  - 3.13t free-threaded: same targets; interpreter is `-p python3.13t`.
  - 3.14/3.14t: same pattern with `-p python3.14` / `-p python3.14t`.
- Why `app:app.wsgi`/`app:app.asgi` is correct for Granian:
  - Granian accepts dotted attribute import targets, so using the attributes on our `app` module is valid. In contrast, Gunicorn requires `module:callable` without dotted attributes, which is why we expose `wsgi = app.wsgi` and use `app:wsgi` there. See [Granian README](https://github.com/emmett-framework/granian?tab=readme-ov-file#readme).
- Concurrency notes (Granian):
  - Granian uses Rust worker threads/processes depending on configuration; you can tune max concurrency via backpressure and choose runtime threading paradigms (single-threaded "st" vs multi-threaded "mt"). The best choice depends on CPU count and workload; experiment for your app. Reference: [Granian README](https://github.com/emmett-framework/granian?tab=readme-ov-file#readme).

Granian 3.14t optimized presets (added to README):
- WSGI: `--workers 2 --runtime-threads 16 --backpressure 256` (start point balancing overhead and parallelism).
- WSGI with mt runtime: add `--runtime mt` (may scale better on many cores).
- ASGI: `--workers 2 --runtime-threads 8 --backpressure 512` (higher backpressure for async concurrency).

