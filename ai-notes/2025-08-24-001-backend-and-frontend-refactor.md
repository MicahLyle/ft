# 2025-08-24-001 Backend and Frontend Refactor

What I did
- Added `LatestPw` model with `LatestPw.objects.upsert_hashed(req_id, hashed_pw)`.
- Extended `PwPayload` to validate `db`, `operation`, `hasher` (sqlite/postgres/mysql; ping/hash-pw/check-pw/hash-and-check-pw; pbkdf2/argon/bcrypt).
- Implemented sync endpoints:
  - POST `/sync/pw/ping`: returns `{ ok: true, length }`.
  - POST `/sync/pw/set`: hashes via `make_password` using `hasher` mapping, upserts into `LatestPw`, returns `{ ok: true, pw, length }`.
  - POST `/sync/pw/check`: checks against DB by `X-Django-Request-ID`; 404 `{ ok: null }` if missing; 400 `{ ok: false }` if mismatch; 200 `{ ok: true }` if match.
  - POST `/sync/pw/set-and-check`: hashes then upserts; checks twice (immediate and after DB); returns `{ ok, ok1, ok2, length }`.
- Frontend refactor in `public/app.js`:
  - Introduced `Node` class encapsulating reactive state per request (stable request id, own 7-char alphanumeric password, timings, headers, http status, ok, status, error).
  - Added configuration form for DB, Operation, Hasher, and Node Count (1–300; default 100).
  - Wired concurrent run of N nodes; preserved timing/thread header extraction; added OK and HTTP status columns with visual indicators.
  - Added global flags `hasHashed` and `hasHashedAndChecked` to gate check operations.

Why
- Model real-world per-request isolation using nodes with independent passwords.
- Enable controlled experiments across DB/operation/hasher dimensions.
- Provide clear correctness signal (OK) and HTTP status in results.

How to use
1. Start the server and open `/`.
2. Pick DB, Operation, Hasher, and Node Count.
3. Click Run. Rows populate with per-node status, timings, thread/process IDs, OK icon, and HTTP status.
4. Check operations are enabled after at least one successful `hash-pw` or `hash-and-check-pw` run in the page session.
