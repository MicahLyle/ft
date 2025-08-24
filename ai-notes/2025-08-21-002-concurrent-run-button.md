What changed
- Frontend run is now initiated only by a button click. The table is hidden until the run starts, and the run button disappears after the first click (single-use per page load). Regenerate password is disabled once the run has started.

How to use
1. Open `/`.
2. Optionally regenerate the auto-generated 10-char password.
3. Click "Run 50 Requests". The table appears and live-updates as requests start/finish. The button disappears to prevent additional runs.

Implementation notes
- `public/app.js`: removed auto-run on mount; `Run 50 Requests` button is visible only before any request starts, table is conditionally rendered after start, and controls are disabled appropriately.
- No backend changes required beyond the existing `POST /api/pw` endpoint.

