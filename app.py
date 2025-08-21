from django.db import models
from nanodjango import Django

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


@app.route("/")
def index(request):
    return app.render(request, "index.html", {})


@app.api.get("/add")
def add(request):
    # Django Ninja API support built in
    CountLog.objects.create()
    return {"count": CountLog.objects.count()}


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
