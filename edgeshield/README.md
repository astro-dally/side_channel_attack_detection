# EdgeShield

EdgeShield turns the side-channel detection work in this repository into a Cloudflare edge demo:

- `POST /analyze` classifies HPC feature vectors in a Worker.
- `POST /analyze/raw` parses `perf stat` output and classifies the latest complete counter window.
- `POST /simulate` generates realistic benign or attack samples from the repository CSV distributions.
- `POST /dataset/test` runs a bounded CSV/JSON dataset through the edge model and returns accuracy metrics.
- D1 logs detections, KV stores threshold and repeat-attacker state, and R2 can archive raw traces.
- `/dashboard` shows live classifications, latency, confidence, feature contributions, export controls, and mitigation actions.
- `/openapi.json` serves machine-readable API documentation.

## Why These Features

The training notebook and realtime monitor use six raw hardware performance counters:

1. `cache_misses`
2. `cache_references`
3. `instructions`
4. `cycles`
5. `branches`
6. `branch_misses`

EdgeShield rebuilds the same derived feature family used by the notebook: IPC, CPI, cache miss rate, branch miss rate, per-thousand-instruction ratios, first-order diffs, and five-sample rolling stats. The Worker currently exposes 36 total features: 6 raw counters plus 30 engineered fields. It uses a transparent Random-Forest-inspired ruleset because Cloudflare Workers cannot run the Python model directly.

## Configuration

Copy the example environment files for local shell/runtime values:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
cp wrangler.toml wrangler.local.toml
```

Wrangler resource bindings are declared in TOML, not loaded from `.env`. Keep the committed `wrangler.toml` as a GitHub-safe template with placeholders. Put your real Cloudflare resource IDs in `wrangler.local.toml`, which is ignored by git and used by the npm scripts.

Use `.env` to keep command-time values such as `EDGESHIELD_URL`, `CLOUDFLARE_ACCOUNT_ID`, and setup notes. Use `.dev.vars` for local Worker secrets such as `ADMIN_TOKEN`.

The Worker expects these binding names:

| Binding | Purpose |
| --- | --- |
| `EDGESHIELD_DB` | D1 database for persisted detections and `/api/stats` |
| `EDGESHIELD_KV` | KV namespace for thresholds and repeat-attacker counts |
| `EDGESHIELD_TRACES` | Optional R2 bucket for raw trace archival |
| `ADMIN_TOKEN` | Secret required for `/admin/thresholds` |

## Local Demo

```bash
cd /Users/dally/side_channel_attack_detection/edgeshield
npm install
npm run dev
```

In another terminal:

```bash
cd /Users/dally/side_channel_attack_detection/edgeshield
npm run test:api
npm test
```

Evaluate the existing Ubuntu/Fedora datasets through the live Worker:

```bash
npm run test:dataset
```

By default this evenly samples 500 parsed rows from each dataset. For a larger run:

```bash
node scripts/evaluate-dataset.mjs --max-per-file=5000 --concurrency=24
```

For the deployed Worker:

```bash
EDGESHIELD_URL=https://edgeshield.<your-subdomain>.workers.dev npm run test:dataset
```

The default evaluation samples 500 parsed rows from each dataset. To evaluate every parsed row:

```bash
node scripts/evaluate-dataset.mjs --all --concurrency=32
```

Stream live hardware performance counter windows into EdgeShield:

```bash
sudo python3 scripts/realtime-perf-collector.py \
  --url https://edgeshield.<your-subdomain>.workers.dev \
  --source-id laptop-demo \
  -- sleep 30
```

Open the dashboard at:

```text
http://127.0.0.1:8787/dashboard
```

## Cloudflare Setup

```bash
cd /Users/dally/side_channel_attack_detection/edgeshield
npm install
npx wrangler login
npx wrangler d1 create edgeshield
npx wrangler kv namespace create EDGESHIELD_KV
npx wrangler kv namespace create EDGESHIELD_KV --preview
npx wrangler r2 bucket create edgeshield-traces
```

Copy the returned IDs into `wrangler.local.toml`. The D1 binding must be named `EDGESHIELD_DB`. Do not put real resource IDs in the committed `wrangler.toml`.

Set the admin token secret used by `/admin/thresholds`:

```bash
npx wrangler secret put ADMIN_TOKEN --env production
```

Initialize D1:

```bash
npm run d1:init:remote
```

Deploy:

```bash
npm run deploy
```

Smoke test the deployed Worker:

```bash
EDGESHIELD_URL=https://edgeshield.<your-subdomain>.workers.dev npm run test:api
```

## API

### `POST /analyze`

Input:

```json
{
  "features": [149, 139866, 704519, 2637200, 122831, 11525],
  "sourceId": "demo-client"
}
```

The six-value vector order is the raw HPC counter order listed above. You can also send an object:

```json
{
  "features": {
    "cache_misses": 149,
    "cache_references": 139866,
    "instructions": 704519,
    "cycles": 2637200,
    "branches": 122831,
    "branch_misses": 11525
  }
}
```

Output:

```json
{
  "prediction": "attack",
  "confidence": 0.9502,
  "latency_ms": 3
}
```

The real response includes model reasons, engineered features, source ID, and mitigation metadata.

### `POST /analyze/raw`

Input can be JSON:

```json
{
  "perf_output": "0.050,149,,cache-misses\n0.050,139866,,cache-references\n..."
}
```

or `text/plain` perf output. The Worker parses complete timestamp windows containing all six raw counters and analyzes the latest window.

### `POST /dataset/test`

Accepts CSV with raw counter columns and an optional `label` column:

```csv
cache_misses,cache_references,instructions,cycles,branches,branch_misses,label
149,139866,704519,2637200,122831,11525,attack
78887,556178,1706780,4978970,299316,34462,benign
```

Sample files are available at:

- `docs/sample-dataset.csv`
- `docs/sample-dataset.json`
- `docs/data-format.md`

```bash
curl -X POST http://127.0.0.1:8787/dataset/test \
  -H "Content-Type: text/csv" \
  --data-binary @docs/sample-dataset.csv
```

The endpoint evaluates up to 1000 rows per request and returns accuracy, recall, false-positive rate, a confusion matrix, and sample misclassifications.

To collect matching raw data on Linux, use the same six hardware performance counters at the 50 ms sampling interval:

```bash
sudo perf stat \
  -I 50 \
  -x , \
  -e cache-misses,cache-references,instructions,cycles,branches,branch-misses \
  -- ./your_program
```

Each complete timestamp window from `perf` should become one upload row. The `label` value should be `attack` or `benign` when ground truth is known; omit it when you only need predictions.

### `/admin/thresholds`

Requires `ADMIN_TOKEN`:

```bash
curl -X POST https://edgeshield.<your-subdomain>.workers.dev/admin/thresholds \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decisionThreshold":0.6,"mitigationAttackCount":5}'
```

### `GET /openapi.json`

Returns the OpenAPI 3.0 document for the Worker API. A static YAML copy is also available at `docs/openapi.yaml`.

### `POST /simulate`

```json
{
  "mode": "attack",
  "os": "fedora",
  "sourceId": "demo-client"
}
```

Modes are `attack` or `benign`. OS values are `ubuntu`, `fedora`, or `mixed`.

## Submission Architecture Blurb

EdgeShield deploys side-channel attack detection to Cloudflare Workers, moving inference from a single host into a globally distributed edge API. The Worker accepts hardware performance counter vectors, reconstructs the same feature family used in the original Random Forest pipeline, and applies a low-latency ruleset distilled from the model's strongest decision boundaries. D1 stores detection events for auditability and dashboard metrics, KV stores live thresholds and repeat-attacker state, and optional R2 can retain raw simulated traces. The demo includes a simulator calibrated from the repository datasets so attack and benign traffic can be replayed without live HPC collection.

## Minimum Viable Demo

1. Run `npm run dev`.
2. Open `/dashboard`.
3. Let the simulator generate mixed traffic.
4. Run `npm run test:api`.
5. Run `npm run test:dataset`.
6. Show that attack samples classify as `attack`, benign samples classify as `benign`, and inference latency stays below 100 ms.
