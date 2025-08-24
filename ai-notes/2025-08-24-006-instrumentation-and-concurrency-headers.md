# 2025-08-24 Instrumentation and Concurrency Headers

I was asked to add simple thread/process concurrency instrumentation inspired by atomics libraries like `patomic` and `atomics`, but implemented in a simpler fashion tailored for this project.

References reviewed for inspiration:
- `patomic` repository: https://github.com/doodspav/patomic
- `atomics` repository: https://github.com/doodspav/atomics

## Changes

- Created `ft/instrumentation.py`:
  - Added global `WORKER_TYPE` derived from the `WORKER_TYPE` environment variable; asserts it's either `"t"` (thread) or `"p"` (process).
  - Implemented `ThreadGlobal` with a `threading.Lock` and integer counter with `inc()`, `dec()`, and `read()` methods, returning `(before, after)` for `inc/dec`.
  - Implemented `ProcessGlobal` using `multiprocessing.Value('i', 0)` with `get_lock()` per the recommended pattern, also exposing `inc()`, `dec()`, and `read()`.
  - Provided `thread_global`, `process_global`, and `select_counter()` to choose based on `WORKER_TYPE`.

- Updated `ft/middleware.py` to set four new headers indicating concurrency counts around the request lifecycle:
  - `X-Django-Concurrency-Start-Before` (C1): read before increment
  - `X-Django-Concurrency-Start-After` (C2): value after increment
  - `X-Django-Concurrency-End-Before` (C3): value before decrement
  - `X-Django-Concurrency-End-After` (C4): read after decrement

- Updated `public/app.js` to read these headers and display them in a new table column labeled "Req C" as `C1, C2, C3, C4`.

## Notes

- The process counter uses `multiprocessing.Value` with locking around read and writes to avoid race conditions, aligning with common patterns discussed on StackOverflow. The thread counter uses a `threading.Lock`.
- Headers integrate with the existing middleware that already reports request timing and process/thread IDs.

## Prompt context

- The user requested a simple approach in Python for concurrency tracking, not directly using external atomic libraries but informed by their existence.
- Implemented as requested and wired through the middleware and frontend for visibility.
