# Granian support and mode tokenization

Date: 2025-08-25

- Tokenized `mode` into a frozenset of lowercase parts and derived settings from tokens.
- Added computed fields in `ft/config.py`: `tokens`, `ft`, `is_sync`, `is_async`, `worker_type`, `gateway_type`, `python_version`.
- Worker type now comes from `mode` tokens (`t`/`p`) with fallbacks by runtime.
- Added `granian` commands to README and moved to new mode naming including `-t-`/`-p-` tokens.
- Rewired `ft/instrumentation.py` to use `settings.worker_type`.

Notes:
- `gateway_type`: runserver => `runserver`; gunicorn/granian => `asgi` if async else `wsgi`.
- `python_version` derived from tokens (`313`, `314`, `313t`, `314t`).
