# EdgeShield Roadmap Status

This file keeps the submission roadmap aligned with the code that exists today.

## Implemented

- Worker endpoints: `/analyze`, `/analyze/raw`, `/simulate`, `/trace`, `/dataset/test`, `/api/stats`, `/api/evaluation`, `/features`, `/dashboard`.
- D1 persistence through the `EDGESHIELD_DB` binding.
- KV-backed repeat-attacker tracking and threshold reads through `EDGESHIELD_KV`.
- Admin threshold updates through `/admin/thresholds` when `ADMIN_TOKEN` is configured.
- Static dashboard with live demo traffic, persisted stats fallback, evaluation summary, and model feature listing.
- CLI dataset evaluation against local or deployed Workers.
- Client-side live `perf stat` collector script.

## Corrected Claims

- Feature count is 36 total features, not 42: 6 raw counters plus 30 engineered features.
- Dataset upload now exists as `POST /dataset/test`, bounded to 1000 evaluated rows per request.
- Real HPC parsing now exists as `POST /analyze/raw`; the Python collector remains useful for streaming live windows.
- R2 archival remains optional and is only active when `EDGESHIELD_TRACES` is bound.

## Still Planned

- Rich dashboard redesign with dark mode, exports, and stronger visual polish.
- Historical analytics beyond the current `/api/stats` totals and recent detections.
- Multi-model support for SVM and CNN-LSTM variants.
- Alert/webhook integrations.
- CI/CD, SDKs, Docker, and IaC.
