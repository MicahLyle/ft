# Async hash/store additions

Prompt: Add async_hash_password and async_store_password in the dropdown and create those functions. Use Django async ORM (aget, acreate, etc.) and await results; otherwise mirror synchronous code.

Changes made:
- Backend (`app.py`): Added async endpoints `/api/async/pw/hash-password` and `/api/async/pw/set-and-store`. Implemented hashing logic identical to sync paths; used async ORM (`aget`, `asave`, `acreate`) to upsert `LatestPw` rows.
- Extended `PwPayload.operation` to include `async_hash_password` and `async_store_password` so the client can select them.
- Frontend (`public/app.js`): Added dropdown options for `async_hash_password` and `async_store_password`; mapped them to the new endpoints.

Update (wrapping hashing under async):
- Wrapped all password hashing and verification in async endpoints with `sync_to_async(...)` per Django async guidance to avoid async-unsafe calls when running under ASGI. Initially used `thread_sensitive=True` for safety, then switched to `thread_sensitive=False` to maximize concurrency since hashing/checking are CPU-bound and not thread-sensitive. See Django docs: https://docs.djangoproject.com/en/5.2/topics/async/

Notes:
- Hashing remains CPU-bound and uses the same hasher mapping/salt behavior as sync functions.
- Async DB interactions rely on Django async manager methods where available; a get-or-create pattern is used for upsert semantics.

## Gunicorn + Uvicorn worker (README update)

- Added README entries to run Gunicorn with the Uvicorn worker against `app:asgi` on port 8001, matching existing sync examples.
- Commands added:
  - GIL (3.14): `MODE=gun-async-gil-p-314 uv run -p python3.14 gunicorn -k uvicorn.workers.UvicornWorker app:asgi --bind 0.0.0.0:8001 --workers 8 --name ft`
  - Free-threaded (3.14t): `MODE=gun-async-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t gunicorn -k uvicorn.workers.UvicornWorker app:asgi --bind 0.0.0.0:8001 --workers 2 --name ft`
- Rationale: user prefers built-in `uvicorn.workers.UvicornWorker`. Note: Uvicorn’s deployment docs mention the `uvicorn.workers` module is deprecated and recommend the external `uvicorn-worker` package; we stayed with the built-in per user choice. Reference: [Uvicorn deployment](https://www.uvicorn.org/deployment/).

