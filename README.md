# README

## Runserver
* runserver, synchronous, GIL
  * `runserver-sync-gil-t-314`: `MODE=rns-sync-gil-t-314 uv run -p python3.14 nanodjango manage app.py runserver 0:8000`
* runserver, synchronous, Free Threaded
  * `runserver-sync-ft-t-314`: `MODE=rns-sync-ft-t-314 PYTHON_GIL=0 uv run -p python3.14t nanodjango manage app.py runserver 0:8000`

## WSGI/Sync

## ASGI/Async

## (Older, Less Relevant) ##
## Possible Modes

### Runserver (sync only, worker t)

- `runserver-sync-gil-t-313`: `MODE=rns-sync-gil-t-313 uv run nanodjango manage app.py runserver 0:8000`
- `runserver-sync-ft-t-313t`: `MODE=rns-sync-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t nanodjango manage app.py runserver 0:8000`
- `runserver-sync-gil-t-314`: `MODE=rns-sync-gil-t-314 uv run -p python3.14 nanodjango manage app.py runserver 0:8000`
- `runserver-sync-ft-t-314t`: `MODE=rns-sync-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t nanodjango manage app.py runserver 0:8000`

### Gunicorn (wsgi only, worker p)

- `gunicorn-sync-gil-p-313`: `MODE=gun-sync-gil-p-313 uv run gunicorn app:wsgi`
- `gunicorn-sync-ft-p-313t`: `MODE=gun-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t gunicorn -k gthread app:wsgi`
- `gunicorn-sync-gil-p-314`: `MODE=gun-sync-gil-p-314 uv run -p python3.14 gunicorn app:wsgi`
- `gunicorn-sync-ft-p-314t`: `MODE=gun-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t gunicorn -k gthread app:wsgi`

### Gunicorn (wsgi only, worker p, optimized)

- `gunicorn-sync-gil-p-313`: `MODE=gun-sync-gil-p-313 uv run -p python3.13 gunicorn app:wsgi -w 8`
- `gunicorn-sync-ft-p-313t`: `MODE=gun-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t gunicorn -k gthread app:wsgi -w 2 --threads 16`
- `gunicorn-sync-gil-p-314`: `MODE=gun-sync-gil-p-314 uv run -p python3.14 gunicorn app:wsgi -w 8`
- `gunicorn-sync-ft-p-314t`: `MODE=gun-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t gunicorn -k gthread app:wsgi -w 2 --threads 16`

### Granian (sync/async, worker t or p)

# 3.13

- `granian-sync-gil-t-313`: `MODE=gra-sync-gil-t-313 uv run -p python3.13 granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-sync-gil-p-313`: `MODE=gra-sync-gil-p-313 uv run -p python3.13 granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-async-gil-t-313`: `MODE=gra-async-gil-t-313 uv run -p python3.13 granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`
- `granian-async-gil-p-313`: `MODE=gra-async-gil-p-313 uv run -p python3.13 granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`

# 3.13t

- `granian-sync-ft-t-313t`: `MODE=gra-sync-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-sync-ft-p-313t`: `MODE=gra-sync-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-async-ft-t-313t`: `MODE=gra-async-ft-t-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`
- `granian-async-ft-p-313t`: `MODE=gra-async-ft-p-313t PYTHON_GIL=0 uv run -p python3.13t granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`

# 3.14

- `granian-sync-gil-t-314`: `MODE=gra-sync-gil-t-314 uv run -p python3.14 granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-sync-gil-p-314`: `MODE=gra-sync-gil-p-314 uv run -p python3.14 granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-async-gil-t-314`: `MODE=gra-async-gil-t-314 uv run -p python3.14 granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`
- `granian-async-gil-p-314`: `MODE=gra-async-gil-p-314 uv run -p python3.14 granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`

# 3.14t

- `granian-sync-ft-t-314t`: `MODE=gra-sync-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-sync-ft-p-314t`: `MODE=gra-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --host 0.0.0.0 --port 8000 app:wsgi`
- `granian-async-ft-t-314t`: `MODE=gra-async-ft-t-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`
- `granian-async-ft-p-314t`: `MODE=gra-async-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface asgi --host 0.0.0.0 --port 8000 app:asgi`

### Granian (3.14t optimized presets)

- `gra-sync-ft-p-314t (WSGI, workers=2, runtime-threads=16, backpressure=256)`:  
  `MODE=gra-sync-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --host 0.0.0.0 --port 8000 --workers 2 --runtime-threads 16 --backpressure 256 app:wsgi`
- `gra-sync-ft-mt-314t (WSGI, mt runtime, workers=2, runtime-threads=16, backpressure=256)`:  
  `MODE=gra-sync-ft-mt-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface wsgi --host 0.0.0.0 --port 8000 --workers 2 --runtime-threads 16 --backpressure 256 --runtime mt app:wsgi`
- `gra-async-ft-p-314t (ASGI, workers=2, runtime-threads=8, backpressure=512)`:  
  `MODE=gra-async-ft-p-314t PYTHON_GIL=0 uv run -p python3.14t granian --interface asgi --host 0.0.0.0 --port 8000 --workers 2 --runtime-threads 8 --backpressure 512 app:asgi`

