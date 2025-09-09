# 2025-09-09-001: Group first four charts for shared screenshot

## Context
Prompt requested grouping of four specific charts so they can be screenshotted together:
- PID → Count
- TID → Count
- Req Index → Django Elapsed ms
- Req Index → Overall Request (Frontend) ms

## Changes
- In `public/app.js`, wrapped the first four charts in a shared container `#chart-group-main` so they can be captured together.
- Kept the remaining charts (`Δms → Concurrency` and `Django Server Intervals (Waterfall)`) in a separate grid below to preserve existing layout and sizing.

## Files
- Edited: `public/app.js`
- Added: this note

## Notes
- The shared container uses a 2-column CSS grid with existing spacing and borders maintained for visual consistency.
