# 2025-09-07 – Middleware pruning

## Context
Requested to remove as much middleware as possible while keeping admin operational and avoiding DB hits in `sync_pw_set`.

## Change
- In `app.py`, removed the previously commented-out middleware lines from the `MIDDLEWARE` list, keeping only the minimal set needed for admin:
  - Kept: `ft.middleware.outer_middleware`, `SessionMiddleware`, `AuthenticationMiddleware`, `MessageMiddleware`.
  - Removed commented entries for: `SecurityMiddleware`, `WhiteNoiseMiddleware`, `CommonMiddleware`, `CsrfViewMiddleware`, `XFrameOptionsMiddleware`.

## Notes
- Admin requires Session/Auth/Message middlewares; API views like `sync_pw_set` do not trigger DB via these middlewares unless sessions/auth are accessed.
