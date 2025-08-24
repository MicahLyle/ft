from django.db import models
from django.db.models import Q
from datetime import datetime
from typing import Literal
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.hashers import (
    check_password,
    is_password_usable,
    make_password,
)
from nanodjango import Django
from pydantic import BaseModel, Field

app = Django(
    MIDDLEWARE=[
        "ft.middleware.outer_middleware",
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
    ]
)


@app.admin
class CountLog(models.Model):
    # Standard Django model, registered with the admin site
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


@app.admin
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
    # Django Ninja API support built in
    CountLog.objects.create()
    return {"count": CountLog.objects.count()}


class PwPayload(BaseModel):
    pw: str = Field(min_length=6, max_length=40)
    db: Literal["sqlite", "postgres", "mysql"]
    operation: Literal["ping", "hash-pw", "check-pw", "hash-and-check-pw"]
    hasher: Literal["bcrypt", "argon", "pbkdf2"]


@app.api.post("/pw")
def create_pw(request, payload: PwPayload):
    # Simple echo endpoint; validation handled by Pydantic via Django Ninja
    return {"ok": True, "length": len(payload.pw)}


@app.api.post("/sync/pw/ping")
def sync_pw_ping(request, payload: PwPayload):
    return JsonResponse(
        {
            "ok": True,
            "pw": payload.pw,
            "length": len(payload.pw),
        },
        status=200,
    )


@app.api.post("/sync/pw/set")
def sync_pw_set(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID") or ""
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
    }
    django_hasher = hasher_map[payload.hasher]

    hashed = make_password(payload.pw, hasher=django_hasher)

    LatestPw.objects.upsert_hashed(req_id=req_id, hashed_pw=hashed)

    return JsonResponse(
        {
            "ok": True,
            "pw": payload.pw,
            "length": len(payload.pw),
        },
        status=200,
    )


@app.api.post("/sync/pw/check")
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
                },
                status=200,
            )
        return JsonResponse(
            {
                "ok": False,
                "pw": payload.pw,
                "length": len(payload.pw),
            },
            status=400,
        )
    except LatestPw.DoesNotExist:
        return JsonResponse(
            {
                "ok": None,
                "pw": payload.pw,
                "length": len(payload.pw),
            },
            status=404,
        )


@app.api.post("/sync/pw/set-and-check")
def sync_pw_set_and_check(request, payload: PwPayload):
    req_id = request.META.get("HTTP_X_DJANGO_REQUEST_ID")
    assert req_id and isinstance(req_id, str)
    hasher_map = {
        "pbkdf2": "pbkdf2_sha256",
        "argon": "argon2",
        "bcrypt": "bcrypt_sha256",
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
            },
            status=404,
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
      <script type=\"module\" src=\"/app.js\"></script>
    </body>
  </html>
"""
