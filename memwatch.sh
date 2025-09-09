#!/usr/bin/env bash
# Sum PSS of all gunicorn ft processes every 0.5s.
# Usage: ./memwatch.sh [interval_seconds] [pgrep_pattern]
# Example: ./memwatch.sh 0.5 'gunicorn: .* \[ft\]'

interval="${1:-0.5}"
pattern="${2:-gunicorn: .* \[ft\]}"

while :; do
  sum_kb=0
  count=0
  mapfile -t pids < <(pgrep -f "$pattern" || true)

  for pid in "${pids[@]}"; do
    # Skip processes whose command starts with "uv run"
    cmd=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)
    if [ -z "$cmd" ]; then
      cmd=$(ps -o cmd= -p "$pid" 2>/dev/null || echo "")
    fi
    if [[ "$cmd" == uv\ run* ]]; then
      continue
    fi

    f="/proc/$pid/smaps_rollup"
    if [ -r "$f" ]; then
      pss_kb=$(awk '/^Pss:/ {print $2; exit}' "$f" 2>/dev/null || echo 0)
    else
      pss_kb=$(sudo awk '/^Pss:/ {print $2; exit}' "$f" 2>/dev/null || echo 0)
    fi
    (( sum_kb += pss_kb ))
    (( count++ ))
  done

  ts=$(date +%H:%M:%S)
  printf "%s  total PSS: %.1f MiB  (pids: %d)\n" "$ts" "$(awk -v kb="$sum_kb" 'BEGIN{printf kb/1024}')" "$count"
  sleep "$interval"
done
