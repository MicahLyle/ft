# 2025-09-07 – Remove Django admin to resolve middleware checks

Prompt: Fix admin middleware errors without using admin.

Change made: In `app.py`, explicitly set a minimal `INSTALLED_APPS` on `nanodjango.Django` with only `django.contrib.contenttypes` and `django.contrib.staticfiles`, omitting `django.contrib.admin`, `auth`, `sessions`, and `messages`.

Effect: Admin system checks (E408/E409/E410) stop running; the pruned middleware stays pruned.

Update: Final working config includes `django.contrib.auth` and `django.contrib.contenttypes` plus app entries (`nanodjango`, `ft`) in `INSTALLED_APPS`. Admin remains excluded; middleware stays pruned; no custom `TEMPLATES` override needed.
