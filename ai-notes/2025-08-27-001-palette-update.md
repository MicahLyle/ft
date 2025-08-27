# Palette update for PID/TID visualizations

Date: 2025-08-27

- Implemented distinct color palettes for processes (32) and threads (64).
- Source for color names: the 140 standard HTML color names listed at [HTML Color Names](https://htmlcolorcodes.com/color-names/).

Context:
- Prompt requested unique colors for PIDs (processes) and TIDs (threads), avoiding adjacent similarity, and using only standard HTML named colors.

What changed:
- `public/app.js`
  - Added `PROCESS_COLOR_PALETTE` (32 colors) and `THREAD_COLOR_PALETTE` (64 colors), curated to minimize near-adjacent similarity and keep the sets disjoint.
  - Updated `buildCountsWithColors` to accept an explicit palette.
  - Wired PID counts to `PROCESS_COLOR_PALETTE` and TID counts to `THREAD_COLOR_PALETTE`.

Notes:
- Colors were spaced across hues (reds→oranges→yellows→greens→cyans→blues→purples→pinks) to reduce clustering.
- The palettes comprise only widely supported named colors, ensuring compatibility in ECharts and CSS rendering.
