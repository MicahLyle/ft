# README

## Possible Modes

# GIL (Non Free-Threading)

- `runserver-sync-gil-313`: `MODE=rns-sync-gil-313 uv run nanodjango manage app.py runserver 0:8000`
- `runserver-sync-gil-314`: `MODE=rns-sync-gil-314 uv run -p python3.14 nanodjango manage app.py runserver 0:8000`
- `gunicorn-sync-gil-313`: `MODE=gun-sync-gil-313 uv run gunicorn app:app.wsgi`
- `gunicorn-sync-gil-314`: `MODE=gun-sync-gil-314 uv run -p python3.14 gunicorn app:app.wsgi`

# Free Threading

- `runserver-sync-ft-313`: `MODE=rns-sync-ft-313 PYTHON_GIL=0 uv run -p python3.13t nanodjango manage app.py runserver 0:8000`
- `runserver-sync-ft-314`: `MODE=rns-sync-ft-314 PYTHON_GIL=0 uv run -p python3.14t nanodjango manage app.py runserver 0:8000`
- `gunicorn-sync-ft-313`: `MODE=gun-sync-ft-313 PYTHON_GIL=0 uv run -p python3.13t gunicorn app:app.wsgi`
- `gunicorn-sync-ft-314`: `MODE=gun-sync-ft-314 PYTHON_GIL=0 uv run -p python3.14t gunicorn app:app.wsgi`
