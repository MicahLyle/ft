# 2025-08-24 – Backend error typing and FE display

Context: Prompted to classify 500s from `/api/sync/pw/set` (notably "database is locked" from SQLite) and expose an `error_type` field to the frontend table. Also asked to document work.

Changes:
- Added a backend decorator `with_error_type` in `app.py` that wraps API views and returns `{ ok: None, error_type }` with status 500 on exceptions.
  - Currently recognizes `"database is locked"` → `error_type = "db_locked"`; otherwise `"unknown"`.
  - Leaves normal success/4xx flows unchanged and includes `error_type: None` on successful responses.
- Applied decorator to `/sync/pw/ping`, `/sync/pw/set`, `/sync/pw/check`, `/sync/pw/set-and-check`.
- Frontend (`public/app.js`):
  - Node state now tracks `error_type`.
  - Parses `error_type` from JSON responses.
  - Resets `error_type` on reruns and network error paths.
  - Table now shows a new "Error Type" column.

Notes:
- The 500 handler uses a simple substring check, lowercasing the exception message, per instructions. This can be extended with more conditions later.
- `ok` is forced to false on 5xx/404 in FE; backend 500 payload uses `ok: None` as requested.

Logs Provided:
- Included sqlite locking traces which motivated `db_locked` detection.


