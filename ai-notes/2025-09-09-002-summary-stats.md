# 2025-09-09-002 - Summary stats above charts

Context: Asked to add a summary stats section above the charts (and below the table) in the frontend.

Changes made:
- Computed additional summary fields in `public/app.js` within `buildNodeGroupStats(nodes)`:
  - `distinctProcesses`, `distinctThreads` (from PID/TID counts).
  - Concurrency `min`, `max`, `mean`, `median` derived from existing 20-bucket computation.
  - `totalBatchMs` (overall time window across all requests based on JS start/end times).
- Inserted a new "Summary" UI block under the results table and above the Charts section.
  - Displays processes, threads, total time, Django elapsed min/max/mean/median, and concurrency min/max/mean/median.
  - Slightly emphasized styling (padding, border, larger font).

Notes:
- Reused existing numeric helpers for mean/median.
- Styling is inline to keep the single-file approach consistent with the rest of `public/app.js`.
- No backend changes required.
