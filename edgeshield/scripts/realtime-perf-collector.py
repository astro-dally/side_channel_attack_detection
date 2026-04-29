#!/usr/bin/env python3
"""
Stream live perf stat hardware counter windows into EdgeShield.

Example:
  sudo python3 scripts/realtime-perf-collector.py \
    --url https://edgeshield.astro-edgeshield.workers.dev \
    --source-id laptop-demo \
    -- sleep 30
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request


RAW_EVENTS = [
    "cache_misses",
    "cache_references",
    "instructions",
    "cycles",
    "branches",
    "branch_misses",
]


def safe_int(value: str):
    value = str(value).replace(",", "").strip()
    if not value:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def parse_perf_line(line: str):
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return None

    if "," in stripped:
        parts = [part.strip() for part in stripped.split(",")]
        if len(parts) >= 4:
            return float(parts[0]), parts[3].replace("-", "_"), safe_int(parts[1])

    match = re.match(r"^\s*([0-9]+\.[0-9]+)\s+([0-9,]+)\s+([A-Za-z0-9\-]+)\s*$", stripped)
    if match:
        return float(match.group(1)), match.group(3).replace("-", "_"), safe_int(match.group(2))

    return None


def post_json(url: str, payload: dict, timeout: float):
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{url.rstrip('/')}/analyze",
        data=data,
        headers={"content-type": "application/json"},
        method="POST",
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = json.loads(response.read().decode("utf-8"))
    body["client_latency_ms"] = round((time.perf_counter() - started) * 1000, 2)
    return body


def main():
    parser = argparse.ArgumentParser(description="Send live perf stat windows to EdgeShield.")
    parser.add_argument("--url", default="http://127.0.0.1:8787", help="EdgeShield base URL")
    parser.add_argument("--source-id", default="perf-live", help="Source ID for mitigation tracking")
    parser.add_argument("--interval-ms", type=int, default=50, help="perf sampling interval")
    parser.add_argument("--timeout", type=float, default=2.0, help="HTTP timeout in seconds")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to monitor. Use -- before it.")
    args = parser.parse_args()

    command = args.command[1:] if args.command and args.command[0] == "--" else args.command
    if not command:
        command = ["sleep", "30"]

    perf_command = [
        "perf",
        "stat",
        "-I",
        str(args.interval_ms),
        "-x",
        ",",
        "-e",
        "cache-misses,cache-references,instructions,cycles,branches,branch-misses",
        "--",
        *command,
    ]

    print("Starting:", " ".join(perf_command), file=sys.stderr)
    process = subprocess.Popen(
        perf_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    current_timestamp = None
    bucket = {}

    assert process.stderr is not None
    for line in process.stderr:
        parsed = parse_perf_line(line)
        if parsed is None:
            continue

        timestamp, event, count = parsed
        if event not in RAW_EVENTS or count is None:
            continue

        if current_timestamp is None:
            current_timestamp = timestamp

        if timestamp != current_timestamp:
            if all(name in bucket for name in RAW_EVENTS):
                payload = {
                    "features": bucket,
                    "sourceId": args.source_id,
                    "metadata": {
                        "collector": "perf",
                        "interval_ms": args.interval_ms,
                        "timestamp": current_timestamp,
                    },
                }
                result = post_json(args.url, payload, args.timeout)
                print(
                    f"t={current_timestamp:.3f}s prediction={result['prediction']} "
                    f"confidence={result['confidence']:.4f} worker={result['latency_ms']}ms "
                    f"client={result['client_latency_ms']}ms action={result['mitigation']['action']}"
                )

            current_timestamp = timestamp
            bucket = {}

        bucket[event] = count

    return process.wait()


if __name__ == "__main__":
    raise SystemExit(main())
