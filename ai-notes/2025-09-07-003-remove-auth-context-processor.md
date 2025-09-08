# 2025-09-07 – Remove auth/messages context processors to avoid importing auth

Error: Rendering `index.html` triggered `django.contrib.auth` import via the default auth context processor, causing:

RuntimeError: Model class django.contrib.auth.models.Permission isn't in INSTALLED_APPS

Change: In `app.py`, added a minimal `TEMPLATES` with only `django.template.context_processors.request` and removed auth/messages context processors.

Effect: Template rendering no longer imports `django.contrib.auth`; the error is resolved without enabling admin/auth middleware.

Update: This TEMPLATES override was later removed. The site works by including `django.contrib.auth` in `INSTALLED_APPS` (admin still excluded) and leaving the default template context processors.
