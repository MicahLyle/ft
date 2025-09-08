# 2025-09-07 – Middleware pruning

## Context
Requested to remove as much middleware as possible while keeping admin operational and avoiding DB hits in `sync_pw_set`.

## Change
- In `app.py`, trimmed the `MIDDLEWARE` list to a minimal set for admin, and later reinstated static serving:
  - Kept: `ft.middleware.outer_middleware`, `SessionMiddleware`, `AuthenticationMiddleware`, `MessageMiddleware`, `WhiteNoiseMiddleware` (added back to serve static assets).
  - Removed/left out: `SecurityMiddleware`, `CommonMiddleware`, `CsrfViewMiddleware`, `XFrameOptionsMiddleware`.

## Notes
- Admin requires Session/Auth/Message middlewares; API views like `sync_pw_set` do not trigger DB via these middlewares unless sessions/auth are accessed.
