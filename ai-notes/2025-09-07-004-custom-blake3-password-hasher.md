# 2025-09-07 – Add custom pure-Python BLAKE3 password hasher

Goal: Avoid `make_password` paths that may release the GIL. Implement a Django-compatible hasher using pure Python BLAKE3.

References:
- GitHub `pure_python_blake3`: https://github.com/oconnor663/pure_python_blake3
- Django docs (Writing your own hasher): https://docs.djangoproject.com/en/5.2/topics/auth/passwords/#writing-your-own-hasher

Context:
- Mirror PBKDF2 behavior for BLAKE3 (first/fifth equality check) and use a predetermined salt. Clarified that the BLAKE3 salt must be hex-encoded.

Changes:
- Created `ft/hashers.py` with `Blake3PasswordHasher` (format: `blake3$rounds$hex_salt$hex_digest`). Default rounds = 5,000.
- Registered hasher in `app.py` via `PASSWORD_HASHERS` with Django defaults as fallbacks.
- Extended API payload `hasher` enum to include `"blake3"`, and wired endpoints to use the custom hasher through Django’s password API. Endpoints now successfully call the custom hasher.
 - Updated `/sync/pw/set` for `hasher="blake3"` to reuse a predetermined per-request hex salt and compare first vs fifth hashes for equality (mirrors PBKDF2 behavior).
 - Updated `/sync/pw/set-and-store` to reuse the same predetermined hex salt across five runs before storing the final hash.
 - Ensured the salt passed to `Blake3PasswordHasher` is hex-only via `get_random_string(32, allowed_chars="0123456789abcdef")`.

Why:
- `Blake3PasswordHasher.encode` expects a hex-encoded salt; previously the salt could include non-hex characters. This ensures consistent behavior and avoids assertion errors.

Outcome:
- New hashes can be created and verified with `blake3` without using `make_password` codepaths that rely on C extensions releasing the GIL.
