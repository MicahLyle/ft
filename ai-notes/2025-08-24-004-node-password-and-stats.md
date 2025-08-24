## 2025-08-24 — Password column, 50% regeneration, and NodeGroup stats

### Prompt
- Show the password in the table.
- For `hash-pw` and `hash-and-check-pw`, randomly regenerate a new password 50% of the time on run; otherwise keep existing (generate if missing).
- Add aggregate stats (“NodeGroup”):
  - Min, Max, Median, Mean of Django elapsed.
  - PID and TID counts, each assigned one of 20 distinct HTML5 colors.
  - Compute concurrency across 20 time buckets from earliest JS start to latest JS end using Django timing deltas.

### Changes
- public/app.js
  - Displayed each node’s `password` in the table next to `Frontend ID`.
  - Implemented 50% password regeneration for hash operations:
    - If no password exists, always generate one.
    - Otherwise regenerate with `Math.random() < 0.5` for `hash-pw` and `hash-and-check-pw`.
  - Tracked timing per node:
    - Captured `jsStartEpochMs` and `jsEndEpochMs`.
    - Continued to parse Django timing headers for `X-Django-Request-Start`/`X-Django-Perf-Time-MS`, PID and TID.
  - Implemented NodeGroup helpers:
    - Numeric median/mean utilities with 4-decimal rounding.
    - PID/TID frequency counts with 20-color palette assignment.
    - Concurrency over 20 equally-sized buckets:
      - Global window = earliest JS start to latest JS end.
      - For each bucket midpoint, concurrency = number of requests whose server interval overlaps that point.
      - Server interval = `jsStartEpochMs + djangoStartDeltaMs` to `+ djangoElapsedMs`.
  - Added a “Stats” summary below the table rendering:
    - Shows min/max/median/mean for Django elapsed.
    - Lists PID/TID counts with color swatches.
    - Renders the 20 concurrency bucket values as a compact grid.

### Notes
- All work was frontend-only in `public/app.js`; no backend changes required.
- NodeGroup stats are computed reactively via a `computed` getter.
- Concurrency requires nodes to have `jsStartEpochMs`, `djangoStartDeltaMs`, and `djangoElapsedMs`; buckets are empty if insufficient data.

### Context
This was requested in the “Clarifying approach for app.js changes” follow-up to add visibility into per-request input and derived aggregate metrics for quick local concurrency experiments.


