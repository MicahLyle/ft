- Added Ninja POST endpoint `POST /api/pw` with Pydantic validation for `pw` (6–40 chars).
- Updated `public/app.js` to fire 50 concurrent POSTs with `X-Django-Request-ID` set to `fe-1..fe-50` and render a live-updating table with frontend elapsed, Django start delta, Django elapsed, PID, and TID from response headers.
- Headers consumed from middleware: `X-Django-Request-Start`, `X-Django-Perf-Time-MS`, `X-Django-Python-Process-ID`, `X-Django-Native-Thread-ID` (fallback to `X-Django-Python-Thread-ID`).

How to run
1. Start the server.
2. Open `/` in a browser over HTTP.
3. Click "Run 50 Requests" or let it auto-run. Table updates as requests start/finish.
