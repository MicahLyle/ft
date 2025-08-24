## 2025-08-24 — ECharts scaffolding

Prompt: Add base scaffolding for ECharts in Vue, without wiring any data yet. Include ECharts, Vue, and Vue-ECharts scripts in the correct order, create a charts.js that registers a `v-chart` component, and do not connect it to the app.

Changes made:
- Updated `app.py` template to include scripts, in order: ECharts → Vue → Vue-ECharts → `/charts.js` → `/app.js`.
- Created `public/charts.js` exposing `FTCharts.registerCharts(app)` which, when called, registers the global `VueECharts` component as `v-chart` on the provided Vue app. No auto-registration or mounting is performed.

Notes:
- This keeps the chart integration decoupled so we can hook it up later with actual data and component usage in `public/app.js`.
- The current `public/app.js` remains unchanged and continues to import Vue via ESM. The global Vue script is present for the chart UMDs; we can consolidate versions later if desired.

