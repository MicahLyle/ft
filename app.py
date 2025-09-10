from datetime import datetime
from functools import wraps
from typing import Literal

from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from asgiref.sync import sync_to_async
from django.db import models
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.crypto import get_random_string
from nanodjango import Django
from pydantic import BaseModel, Field

app = Django(
    INSTALLED_APPS=[
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "nanodjango",
        "ft",
    ],
    MIDDLEWARE=[
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "ft.middleware.outer_middleware",
    ],
    PASSWORD_HASHERS=[
        "ft.hashers.Blake3PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2PasswordHasher",
        "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
        "django.contrib.auth.hashers.Argon2PasswordHasher",
        "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
        "django.contrib.auth.hashers.ScryptPasswordHasher",
    ],
)


def with_error_type(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        try:
            return view_func(request, *args, **kwargs)
        except Exception as exc:
            message = str(exc).lower()
            error_type = "db_locked" if "database is locked" in message else "unknown"
            return JsonResponse({"ok": None, "error_type": error_type}, status=500)

    return _wrapped


class CountLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)


class LatestPwManager(models.Manager):
    def upsert_hashed(
        self,
        req_id: str,
        hashed_pw: str,
        *,
        as_of: datetime | str | None = None,
    ):
        assert req_id and hashed_pw

        finalized_as_of: datetime
        if as_of is None:
            finalized_as_of = timezone.now()
        elif isinstance(as_of, str):
            finalized_as_of = datetime.fromisoformat(as_of)
        elif isinstance(as_of, datetime):
            finalized_as_of = as_of
        else:
            raise ValueError(f"Invalid type for as_of: {type(as_of)}")

        self.update_or_create(
            req_id=req_id,
            defaults={"pw": hashed_pw, "as_of": finalized_as_of},
        )


class LatestPw(models.Model):
    req_id = models.CharField(max_length=63)
    pw = models.CharField(max_length=255)
    as_of = models.DateTimeField()

    objects = LatestPwManager()

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=((~Q(req_id="")) & (~Q(pw=""))),
                name="lpw_fields_not_blank",
                violation_error_code="fields_blank",
                violation_error_message="Fields cannot be blank.",
            ),
            models.UniqueConstraint(fields=["req_id"], name="lpw_req_id_uix"),
        ]


@app.route("/")
def index(request):
    return app.render(request, "index.html", {})


@app.api.get("/add")
def add(request):
    CountLog.objects.create()
    return {"count": CountLog.objects.count()}


class PwPayload(BaseModel):
    pw: str = Field(min_length=6, max_length=40)
    db: Literal["sqlite", "postgres", "mysql"]
    operation: Literal[
        "ping", "hash-pw", "check-pw", "hash-and-check-pw", "hash-and-store-pw",
        "async_hash_password", "async_hash_and_store"
    ]
    hasher: Literal["bcrypt", "argon", "pbkdf2", "blake3"]


@app.api.post("/sync/pw/ping")
@with_error_type
def sync_pw_ping(request, payload: PwPayload):
    return JsonResponse(
        {
            "ok": True,
            "pw": payload.pw,
            "length": len(payload.pw),
            "error_type": None,
        },
        status=200,
    )


@app.api.post("/sync/pw/set")
@with_error_type
def sync_pw_set(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID") or ""
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
        "blake3": "blake3",
    }
    django_hasher = hasher_map[payload.hasher]

    ok: bool
    last_hash: str | None = None
    if django_hasher == "pbkdf2_sha256":
        # PBKDF2: use a fixed per-request salt and compare first vs fifth hashes.
        salt = get_random_string(10)
        first_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)
        for _ in range(4):
            last_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)
        ok = bool(first_hash == last_hash)
    elif django_hasher in ("argon2", "bcrypt_sha256"):
        # Argon2 and bcrypt: don't pass a salt; hash 5 times and verify last with check_password.
        for _ in range(5):
            last_hash = make_password(payload.pw, hasher=django_hasher)
        ok = check_password(payload.pw, last_hash or "")
    else:
        # For BLAKE3, use a fixed per-request hex salt and compare the first and fifth hashes. Note: our Blake3PasswordHasher expects a hex-encoded salt string.
        salt = get_random_string(32, allowed_chars="0123456789abcdef")
        first_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)
        for _ in range(4):
            last_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)
        ok = bool(first_hash == last_hash)

    return JsonResponse(
        {
            "ok": ok,
            "pw": payload.pw,
            "length": len(payload.pw),
            "error_type": None,
        },
        status=200,
    )


@app.api.post("/sync/pw/check")
@with_error_type
def sync_pw_check(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID")
    assert req_id and isinstance(req_id, str)
    try:
        row = LatestPw.objects.get(req_id=req_id)

        is_valid = check_password(payload.pw, row.pw)

        if is_valid:
            return JsonResponse(
                {
                    "ok": True,
                    "pw": payload.pw,
                    "length": len(payload.pw),
                    "error_type": None,
                },
                status=200,
            )
        return JsonResponse(
            {
                "ok": False,
                "pw": payload.pw,
                "length": len(payload.pw),
                "error_type": None,
            },
            status=400,
        )
    except LatestPw.DoesNotExist:
        return JsonResponse(
            {
                "ok": None,
                "pw": payload.pw,
                "length": len(payload.pw),
                "error_type": None,
            },
            status=404,
        )


@app.api.post("/sync/pw/set-and-check")
@with_error_type
def sync_pw_set_and_check(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID")
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
        "blake3": "blake3",
    }
    django_hasher = hasher_map[payload.hasher]

    hashed = make_password(payload.pw, hasher=django_hasher)

    ok1 = check_password(payload.pw, hashed)

    LatestPw.objects.upsert_hashed(req_id=req_id, hashed_pw=hashed)

    ok2: bool | None = None
    try:
        row = LatestPw.objects.get(req_id=req_id)
        ok2 = check_password(payload.pw, row.pw)
        if ok2 and ok1:
            return JsonResponse(
                {
                    "ok": True,
                    "ok1": ok1,
                    "ok2": ok2,
                    "pw": payload.pw,
                    "length": len(payload.pw),
                    "error_type": None,
                },
                status=200,
            )
        return JsonResponse(
            {
                "ok": False,
                "ok1": ok1,
                "ok2": ok2,
                "pw": payload.pw,
                "length": len(payload.pw),
                "error_type": None,
            },
            status=400,
        )
    except LatestPw.DoesNotExist:
        return JsonResponse(
            {
                "ok": None,
                "ok1": ok1,
                "ok2": ok2,
                "pw": payload.pw,
                "length": len(payload.pw),
                "error_type": None,
            },
            status=404,
        )


@app.api.post("/sync/pw/set-and-store")
@with_error_type
def sync_pw_set_and_store(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID") or ""
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
        "blake3": "blake3",
    }
    django_hasher = hasher_map[payload.hasher]

    # Hash 5 times (per-hasher behavior matches sync_pw_set), store the final hash
    last_hash: str | None = None
    if django_hasher == "pbkdf2_sha256":
        salt = get_random_string(10)
        for _ in range(5):
            last_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)
    elif django_hasher in ("argon2", "bcrypt_sha256"):
        for _ in range(5):
            last_hash = make_password(payload.pw, hasher=django_hasher)
    else:
        # For BLAKE3, reuse a predetermined hex salt across the five runs.
        salt = get_random_string(32, allowed_chars="0123456789abcdef")
        for _ in range(5):
            last_hash = make_password(payload.pw, salt=salt, hasher=django_hasher)

    LatestPw.objects.upsert_hashed(req_id=req_id, hashed_pw=last_hash or "")

    return JsonResponse(
        {
            "ok": True,
            "pw": payload.pw,
            "length": len(payload.pw),
            "error_type": None,
        },
        status=200,
    )


@app.route("/slow/")
async def slow(request):
    import asyncio

    await asyncio.sleep(10)
    return "Async views supported"


app.templates["index.html"] = """<!doctype html>
  <html lang="en">
    <body>
      <div id=\"app\">
        {% block content %}
        Hello
        {% endblock %}
      </div>
      <script src=\"https://cdn.jsdelivr.net/npm/echarts@6.0.0\"></script>
      <script src=\"https://cdn.jsdelivr.net/npm/vue@3.5.18\"></script>
      <script src=\"https://cdn.jsdelivr.net/npm/vue-echarts@8.0.0-beta.1\"></script>
      <script src=\"/charts.js\"></script>
      <script type=\"module\" src=\"/app.js\"></script>
    </body>
  </html>
"""

# Async API endpoints mirroring sync logic


# Async helpers for CPU-bound sync hash functions
make_pw_async = sync_to_async(make_password, thread_sensitive=False)
check_pw_async = sync_to_async(check_password, thread_sensitive=False)


@app.api.post("/async/pw/set")
async def async_pw_set(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID") or ""
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
        "blake3": "blake3",
    }
    django_hasher = hasher_map[payload.hasher]

    ok: bool
    last_hash: str | None = None
    if django_hasher == "pbkdf2_sha256":
        # PBKDF2: use a fixed per-request salt and compare first vs fifth hashes.
        salt = get_random_string(10)
        first_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)
        for _ in range(4):
            last_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)
        ok = bool(first_hash == last_hash)
    elif django_hasher in ("argon2", "bcrypt_sha256"):
        # Argon2 and bcrypt: don't pass a salt; hash 5 times and verify last with check_password.
        for _ in range(5):
            last_hash = await make_pw_async(payload.pw, hasher=django_hasher)
        ok = await check_pw_async(payload.pw, last_hash or "")
    else:
        # For BLAKE3, use a fixed per-request hex salt and compare the first and fifth hashes.
        salt = get_random_string(32, allowed_chars="0123456789abcdef")
        first_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)
        for _ in range(4):
            last_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)
        ok = bool(first_hash == last_hash)

    return JsonResponse(
        {
            "ok": ok,
            "pw": payload.pw,
            "length": len(payload.pw),
            "error_type": None,
        },
        status=200,
    )


@app.api.post("/async/pw/set-and-store")
async def async_pw_set_and_store(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID") or ""
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
        "blake3": "blake3",
    }
    django_hasher = hasher_map[payload.hasher]

    # Hash 5 times (per-hasher behavior matches sync_pw_set), store the final hash
    last_hash: str | None = None
    if django_hasher == "pbkdf2_sha256":
        salt = get_random_string(10)
        for _ in range(5):
            last_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)
    elif django_hasher in ("argon2", "bcrypt_sha256"):
        for _ in range(5):
            last_hash = await make_pw_async(payload.pw, hasher=django_hasher)
    else:
        # For BLAKE3, reuse a predetermined hex salt across the five runs.
        salt = get_random_string(32, allowed_chars="0123456789abcdef")
        for _ in range(5):
            last_hash = await make_pw_async(payload.pw, salt=salt, hasher=django_hasher)

    # Async upsert via get-or-create pattern
    try:
        row = await LatestPw.objects.aget(req_id=req_id)
        row.pw = last_hash or ""
        row.as_of = timezone.now()
        await row.asave(update_fields=["pw", "as_of"])  # type: ignore[attr-defined]
    except LatestPw.DoesNotExist:
        await LatestPw.objects.acreate(  # type: ignore[attr-defined]
            req_id=req_id,
            pw=last_hash or "",
            as_of=timezone.now(),
        )

    return JsonResponse(
        {
            "ok": True,
            "pw": payload.pw,
            "length": len(payload.pw),
            "error_type": None,
        },
        status=200,
    )


# Expose top-level callables for WSGI/ASGI servers.
wsgi = app.wsgi
asgi = app.asgi
