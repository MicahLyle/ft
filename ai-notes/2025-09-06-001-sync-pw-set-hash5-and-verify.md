# 2025-09-06 – CPU-heavy sync_pw_set (hash x5, then hash+verify)

## Context
Prompt: "In sync_pw_set, lets change it so that I hash the password 5 times in a row (trying to make the cpu work hard for testing purpose). Then lets hash it once and check that it matches, and set \"ok\" based on that."

## What changed
- Modified `app.py` `sync_pw_set`:
  - PBKDF2: hashes the same plaintext five times using `make_password` with a single per-request random salt (length 10); sets `ok` by comparing the first and fifth hashes (no chaining).
  - Argon2/bcrypt: hashes five times without passing a salt; sets `ok` by verifying the last hash with `check_password`.
  - No DB write in this endpoint; other endpoints retain DB behavior.

## Rationale
- Provide deterministic CPU work per request for load/concurrency experiments without adding DB contention.
- Maintain correctness signal by verifying the final hash.

## Notes
- `/sync/pw/check` and `/sync/pw/set-and-check` still use the database path; `sync_pw_set` itself is now CPU-only.
- Hasher selection remains controlled by `hasher` (pbkdf2/argon/bcrypt) via mapping to Django hashers.
 - `/sync/pw/set-and-store`: now hashes five times per the same per-hasher rules as `sync_pw_set` and stores the final hash via `LatestPw.objects.upsert_hashed`.
