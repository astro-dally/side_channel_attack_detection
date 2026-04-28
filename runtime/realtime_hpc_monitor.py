#!/usr/bin/env python3
"""
Real-time HPC monitor for the SideChannelAI project.

What this script does:
- launches a target command under `perf stat -I 50`
- parses live hardware counter output
- builds sliding-window features compatible with the notebook's classical models
- loads a saved Random Forest or SVM model from `artifacts/`
- prints an alert when the predicted attack probability / score crosses a threshold

Recommended use:
1. Train the models in the notebook first.
2. Keep the exported model `.joblib` file and feature column JSON in `artifacts/`.
3. Run this script on the AWS instance against the command you want to monitor.

Example:
python3 runtime/realtime_hpc_monitor.py \
  --model artifacts/ubuntu_random_forest.joblib \
  --features artifacts/ubuntu_feature_columns.json \
  --threshold 0.70 \
  -- ./data_extraction_code/attacker
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import deque
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


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

    parts = re.split(r"\s+", stripped)
    if len(parts) >= 3:
        try:
            return float(parts[0]), parts[-1].replace("-", "_"), safe_int(parts[1])
        except ValueError:
            return None

    return None


def safe_divide(a, b):
    if b in (0, None) or pd.isna(b):
        return 0.0
    value = a / b
    if np.isinf(value) or np.isnan(value):
        return 0.0
    return float(value)


def build_feature_row(history_rows: list[dict]) -> dict:
    """
    Build one inference row matching the notebook's classical feature engineering.
    We use the latest row plus diff/rolling features from a short history buffer.
    """
    current = history_rows[-1].copy()
    feature_row = dict(current)

    feature_row["ipc"] = safe_divide(current["instructions"], current["cycles"])
    feature_row["cpi"] = safe_divide(current["cycles"], current["instructions"])
    feature_row["cache_miss_rate"] = safe_divide(current["cache_misses"], current["cache_references"])
    feature_row["branch_miss_rate"] = safe_divide(current["branch_misses"], current["branches"])
    feature_row["cache_misses_per_kinst"] = safe_divide(current["cache_misses"] * 1000, current["instructions"])
    feature_row["cache_references_per_kinst"] = safe_divide(current["cache_references"] * 1000, current["instructions"])
    feature_row["branches_per_kinst"] = safe_divide(current["branches"] * 1000, current["instructions"])
    feature_row["cycles_per_branch"] = safe_divide(current["cycles"], current["branches"])

    previous = history_rows[-2] if len(history_rows) > 1 else None
    for col in RAW_EVENTS:
      # First-order diff features
        feature_row[f"{col}_diff"] = 0.0 if previous is None else float(current[col] - previous[col])

    rolling_cols = RAW_EVENTS + ["cache_miss_rate", "branch_miss_rate"]
    temp_df = pd.DataFrame(history_rows)
    temp_df["cache_miss_rate"] = temp_df.apply(
        lambda row: safe_divide(row["cache_misses"], row["cache_references"]), axis=1
    )
    temp_df["branch_miss_rate"] = temp_df.apply(
        lambda row: safe_divide(row["branch_misses"], row["branches"]), axis=1
    )

    for col in rolling_cols:
        feature_row[f"{col}_roll_mean_5"] = float(temp_df[col].tail(5).mean())
        feature_row[f"{col}_roll_std_5"] = float(temp_df[col].tail(5).std(ddof=0))

    return feature_row


def score_sample(model, feature_df: pd.DataFrame):
    if hasattr(model, "predict_proba"):
        score = float(model.predict_proba(feature_df)[0, 1])
    elif hasattr(model, "decision_function"):
        raw = float(model.decision_function(feature_df)[0])
        score = 1.0 / (1.0 + np.exp(-raw))
    else:
        pred = int(model.predict(feature_df)[0])
        score = float(pred)
    pred = int(score >= 0.5)
    return pred, score


def main():
    parser = argparse.ArgumentParser(description="Run live side-channel inference over a command with perf.")
    parser.add_argument("--model", required=True, help="Path to saved .joblib model")
    parser.add_argument("--features", required=True, help="Path to exported feature-column JSON")
    parser.add_argument("--interval-ms", type=int, default=50, help="Sampling interval in milliseconds")
    parser.add_argument("--threshold", type=float, default=0.70, help="Alert threshold on attack score")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command to monitor. Use -- before the command.")
    args = parser.parse_args()

    if args.command and args.command[0] == "--":
        args.command = args.command[1:]

    if not args.command:
        raise SystemExit("No command provided. Example: -- ./attacker")

    model = joblib.load(args.model)
    feature_columns = json.loads(Path(args.features).read_text(encoding="utf-8"))

    perf_command = [
        "perf",
        "stat",
        "-I",
        str(args.interval_ms),
        "-e",
        "cache-misses,cache-references,instructions,cycles,branches,branch-misses",
        "--",
        *args.command,
    ]

    print("Starting monitor with command:")
    print(" ".join(perf_command))

    process = subprocess.Popen(
        perf_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    current_timestamp = None
    current_bucket = {}
    history = deque(maxlen=5)

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
            if all(event_name in current_bucket for event_name in RAW_EVENTS):
                current_bucket["time_sec"] = current_timestamp
                history.append(current_bucket.copy())
                if len(history) >= 1:
                    feature_row = build_feature_row(list(history))
                    feature_df = pd.DataFrame([feature_row])
                    for col in feature_columns:
                        if col not in feature_df.columns:
                            feature_df[col] = 0.0
                    feature_df = feature_df[feature_columns].fillna(0.0)
                    pred, score = score_sample(model, feature_df)
                    label = "ATTACK" if score >= args.threshold else "BENIGN"
                    print(
                        f"[t={current_timestamp:0.3f}s] label={label} "
                        f"pred={pred} score={score:0.4f}"
                    )

            current_timestamp = timestamp
            current_bucket = {}

        current_bucket[event] = count

    return_code = process.wait()
    if return_code != 0:
        print(f"perf process exited with code {return_code}", file=sys.stderr)


if __name__ == "__main__":
    main()
