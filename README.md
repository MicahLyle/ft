# README

## Possible Modes

### Runserver (sync only, worker t)

- `runserver-sync-gil-t-313`: `MODE=rns-sync-gil-t-313 uv run nanodjango manage app.py runserver 0:8000`
- `runserver-sync-ft-t-313t`: `MODE=rns-sync-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t nanodjango manage app.py runserver 0:8000`
- `runserver-sync-gil-t-314`: `MODE=rns-sync-gil-t-314 uv run -p python3.14 nanodjango manage app.py runserver 0:8000`
- `runserver-sync-ft-t-314t`: `MODE=rns-sync-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t nanodjango manage app.py runserver 0:8000`

### Gunicorn (wsgi only, worker p)

- `gunicorn-sync-gil-p-313`: `MODE=gun-sync-gil-p-313 uv run gunicorn app:app.wsgi`
- `gunicorn-sync-ft-p-313t`: `MODE=gun-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t gunicorn -k gthread app:app.wsgi`
- `gunicorn-sync-gil-p-314`: `MODE=gun-sync-gil-p-314 uv run -p python3.14 gunicorn app:app.wsgi`
- `gunicorn-sync-ft-p-314t`: `MODE=gun-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t -k gthread gunicorn app:app.wsgi`

### Granian (sync/async, worker t or p)

# 3.13

- `granian-sync-gil-t-313`: `MODE=gra-sync-gil-t-313 uv run -p python3.13 granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-sync-gil-p-313`: `MODE=gra-sync-gil-p-313 uv run -p python3.13 granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-async-gil-t-313`: `MODE=gra-async-gil-t-313 uv run -p python3.13 granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
- `granian-async-gil-p-313`: `MODE=gra-async-gil-p-313 uv run -p python3.13 granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`

# 3.13t

- `granian-sync-ft-t-313t`: `MODE=gra-sync-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-sync-ft-p-313t`: `MODE=gra-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-async-ft-t-313t`: `MODE=gra-async-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
- `granian-async-ft-p-313t`: `MODE=gra-async-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`

# 3.14

- `granian-sync-gil-t-314`: `MODE=gra-sync-gil-t-314 uv run -p python3.14 granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-sync-gil-p-314`: `MODE=gra-sync-gil-p-314 uv run -p python3.14 granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-async-gil-t-314`: `MODE=gra-async-gil-t-314 uv run -p python3.14 granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
- `granian-async-gil-p-314`: `MODE=gra-async-gil-p-314 uv run -p python3.14 granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`

# 3.14t

- `granian-sync-ft-t-314t`: `MODE=gra-sync-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-sync-ft-p-314t`: `MODE=gra-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --target app:app.wsgi --bind 0.0.0.0:8000`
- `granian-async-ft-t-314t`: `MODE=gra-async-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
- `granian-async-ft-p-314t`: `MODE=gra-async-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface asgi --target app:app.asgi --bind 0.0.0.0:8000`
