## 2025-08-24 — Charts integration scaffolding and Raw Stats

### Prompt
- Integrate `app.js` and `charts.js` sensibly.
- Rename “Stats” to “Raw Stats”.
- Add charts (below table, above Raw Stats):
  - Bar: PID → count.
  - Bar: TID → count.
  - Scatter: req index → Django elapsed ms.
  - Scatter: req index → overall request time (frontend elapsed).

### Changes
- `public/charts.js`
  - Expose `FTCharts.options` with builders:
    - `buildPidCountBarOptions(stats)` and `buildTidCountBarOptions(stats)`.
    - `buildIndexToValueScatterOptions(title, nodes, key)`.
    - `buildIndexToOverallRequestTimeOptions(nodes)`.
- `public/app.js`
  - Compute chart options via `FTCharts.options` and render a new “Charts” grid with four `<v-chart>` components.
  - Renamed the Stats header to “Raw Stats”.

### Notes
- Charts are computed, so they update after runs.
- Keeps the registration via `FTCharts.registerCharts(app)` available; components rely on global registration.

