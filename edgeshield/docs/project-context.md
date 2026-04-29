# EdgeShield Project Context

This document explains what EdgeShield is, what has been built, what is working today, and how the Cloudflare implementation fits together.

## Short Version

EdgeShield is the Cloudflare edge version of the side-channel attack detection project. The original project collects hardware performance counters with Linux `perf`, engineers temporal/statistical features, and trains ML models to classify execution windows as `attack` or `benign`.

The `edgeshield` project turns that research pipeline into a deployable Worker API and dashboard:

- It accepts six raw hardware performance counter values.
- It rebuilds the same derived feature family used by the notebook/runtime monitor.
- It classifies each request with a transparent Random-Forest-inspired JavaScript ruleset.
- It logs detections to Cloudflare D1.
- It stores live thresholds and repeat-attacker state in Cloudflare KV.
- It optionally archives raw traces to Cloudflare R2 when the binding exists.
- It serves a dashboard, OpenAPI spec, simulator, dataset evaluator, and live `perf` collector tooling.

The core demo is working locally through Wrangler and is structured for Cloudflare deployment.

## Repository Position

The parent repository is the research project:

- `data/` contains Ubuntu and Fedora benign/attack `perf` datasets.
- `notebooks/` contains the training and analysis pipeline.
- `runtime/realtime_hpc_monitor.py` runs local Python inference with exported model artifacts.
- `Research_Results/` contains model reports, metrics, plots, and comparisons.
- `data_extraction_code/` contains the attacker/victim programs and `perf` collection helper.

The `edgeshield/` folder is the edge product layer:

- `src/index.js` is the Cloudflare Worker entry point and API router.
- `src/model.js` contains feature engineering and the detection ruleset.
- `src/simulator.js` generates calibrated benign/attack samples from dataset distributions.
- `src/dashboard.js` renders the browser dashboard.
- `src/openapi.js` exposes the machine-readable API document.
- `src/evaluation.js` embeds the latest dataset evaluation summary.
- `scripts/` contains local smoke testing, dataset evaluation, sample generation, and live `perf` collection.
- `tests/` contains Node test coverage for the Worker and model.
- `schema.sql` defines the D1 database schema.
- `wrangler.toml` is the safe Cloudflare configuration template.

## What We Have Done

EdgeShield now has a working Worker application around the original side-channel detection idea.

Implemented API surface:

- `GET /health` returns service health and model version.
- `GET /features` returns the exact feature order.
- `POST /analyze` classifies direct hardware counter vectors.
- `POST /analyze/raw` parses raw `perf stat` output and classifies the latest complete window.
- `POST /simulate` generates a benign or attack sample and immediately analyzes it.
- `GET /trace` generates synthetic multi-window traces.
- `POST /dataset/test` evaluates a bounded CSV or JSON dataset through the edge model.
- `GET /api/stats` returns D1-backed detection totals and recent detections.
- `GET /api/evaluation` returns the latest saved dataset evaluation summary.
- `GET|POST /admin/thresholds` reads or updates model thresholds through KV when authorized.
- `GET /dashboard` serves the built-in demo dashboard.
- `GET /openapi.json` serves OpenAPI 3.0 documentation.

Implemented operational pieces:

- D1 persistence for detection records.
- KV-backed dynamic thresholds.
- KV-backed repeat-attacker counting for mitigation decisions.
- Optional R2 archival when `EDGESHIELD_TRACES` is bound.
- Non-blocking database/archive writes through `ctx.waitUntil()`.
- Local and remote Wrangler scripts.
- GitHub-safe config templates, with real resource IDs moved to ignored local files.
- Automated Node tests for routing, model behavior, dataset validation, raw perf parsing, and admin auth.
- Dataset evaluation reports under `reports/`.

## What Is Working

The current implementation has test and evaluation evidence:

- `npm test` runs model and Worker tests using Node's built-in test runner.
- `npm run test:api` smoke-tests `/simulate` and `/analyze` against a running Worker.
- `npm run test:dataset` evaluates Ubuntu/Fedora benign/attack datasets against the API.
- The saved evaluation report currently shows 2,000 sampled rows evaluated with:
  - 99.70% accuracy
  - 99.60% attack recall
  - 99.80% benign recall
  - 0.20% false positive rate
  - 99.70% F1 score
  - about 1.03 ms average Worker latency

The dashboard is also functional:

- It can generate live benign/attack demo traffic through `/simulate`.
- It displays attack rate, latency, confidence, threat stream, recent detections, and mitigation actions.
- It loads persisted totals from `/api/stats` when D1 is bound.
- It loads the static benchmark summary from `/api/evaluation`.
- It can upload small datasets to `/dataset/test`.
- It supports CSV/JSON exports for live data, benchmark data, and dataset-test results.
- It shows feature contribution details from the model response.

## Side-Channel Detection Background

A side-channel attack leaks information through indirect signals instead of through a normal application output. In this project, the signal is hardware performance counter behavior.

Linux `perf` can sample low-level CPU counters such as:

- cache misses
- cache references
- instructions
- cycles
- branches
- branch misses

The original project samples these counters every 50 ms. Attack and benign workloads produce different patterns. For this dataset, attack windows are especially separated by cache behavior: attack traces tend to have very low cache miss rate and very low cache misses per thousand instructions compared with benign traces.

EdgeShield does not run `perf` itself inside Cloudflare. Instead, it receives counter windows from a client, script, simulator, or dataset upload. That is the correct boundary: hardware counters are collected on the monitored machine, and Cloudflare provides the globally reachable inference, logging, dashboard, and mitigation layer.

## Feature Engineering

The Worker uses six raw counters:

1. `cache_misses`
2. `cache_references`
3. `instructions`
4. `cycles`
5. `branches`
6. `branch_misses`

`src/model.js` expands those six fields into 36 total features:

- 6 raw counters
- IPC: `instructions / cycles`
- CPI: `cycles / instructions`
- cache miss rate: `cache_misses / cache_references`
- branch miss rate: `branch_misses / branches`
- cache misses per thousand instructions
- cache references per thousand instructions
- branches per thousand instructions
- cycles per branch
- first-order diffs for each raw counter
- five-sample rolling means and standard deviations for raw counters, cache miss rate, and branch miss rate

The exact feature order is exported as `FEATURE_ORDER` and available at `/features`.

Important implementation detail: `POST /analyze` accepts either a six-value raw vector or an object. If the input is an array with six values, the order is the six raw events above. If the input is an object, event names are normalized by replacing hyphens and spaces with underscores.

## Model Implementation

The original notebook trained Random Forest, SVM, and CNN-LSTM models. The Worker does not load Python/scikit-learn artifacts directly. Instead, `src/model.js` implements a transparent ruleset inspired by the Random Forest boundaries.

Why this approach was chosen:

- Cloudflare Workers run JavaScript/TypeScript on the edge.
- Shipping Python, scikit-learn, and native model dependencies into a Worker is not the natural fit for this runtime.
- A ruleset is fast, explainable, testable, and good for the demo.
- The strongest dataset boundaries were clear enough to encode directly.

The current model version is:

```text
edgeshield-rf-rules-v1
```

The ruleset adds weighted attack or benign votes. High-weight attack rules include:

- cache miss rate below the attack boundary
- cache misses per thousand instructions below the attack boundary
- low cache miss ratio with dense cache references
- low cache misses with elevated cycles per branch
- branch density matching attack traces
- low IPC plus very low cache miss ratio
- stable low rolling cache behavior
- branch miss rate aligned with attack windows

Benign guardrails add benign votes when:

- cache miss rate exceeds the benign boundary
- cache misses per thousand instructions exceed the benign boundary

The final attack score is:

```text
attackVotes / (attackVotes + benignVotes)
```

If the score is greater than or equal to `decisionThreshold`, the prediction is `attack`; otherwise it is `benign`.

Default thresholds:

```js
{
  decisionThreshold: 0.55,
  hardAttackCacheMissRate: 0.02,
  hardBenignCacheMissRate: 0.03,
  hardAttackMissesPerKinst: 5,
  hardBenignMissesPerKinst: 10,
  mitigationAttackCount: 3
}
```

Every response includes `feature_contributions`, so the dashboard and API clients can explain why a sample was classified as attack or benign.

## Request Flow

For `POST /analyze`, the Worker flow is:

1. Parse JSON input.
2. Read model thresholds from KV with fallback to defaults.
3. Engineer the 36-feature row.
4. Run the ruleset.
5. Determine `sourceId` from body, `x-source-id`, `cf-connecting-ip`, or `anonymous`.
6. Update mitigation state for attack predictions.
7. Build a detection record with prediction, confidence, feature data, timings, reasons, and mitigation.
8. Persist the record to D1 and optionally R2.
9. Return the JSON response immediately while persistence continues in `ctx.waitUntil()`.

The response contains both inference timing and Worker timing:

- `latency_ms` / `inference_latency_ms`: model inference time.
- `worker_latency_ms`: full Worker request handling time.
- `metadata.timings_ms`: config read, inference, mitigation, and total Worker timing.

## Raw perf Flow

`POST /analyze/raw` accepts either JSON or plain text.

JSON example:

```json
{
  "perf_output": "0.050,149,,cache-misses\n0.050,139866,,cache-references"
}
```

The parser supports comma-separated `perf stat -x ,` style output and whitespace style output. It groups lines by timestamp and only keeps complete windows containing all six raw events. It analyzes the latest complete window.

If no complete window exists, the API returns:

```json
{
  "error": "no_complete_perf_windows"
}
```

## Dataset Test Flow

`POST /dataset/test` accepts:

- CSV with the six raw counter columns and optional `label`
- JSON with `rows: [{ features, label }]`

The expected upload format is now documented separately in `docs/data-format.md`, with starter files in:

- `docs/sample-dataset.csv`
- `docs/sample-dataset.json`

The required columns are:

```text
cache_misses,cache_references,instructions,cycles,branches,branch_misses,label
```

The `label` field is optional. It should be `attack` or `benign` when ground truth is known. Without labels, EdgeShield can still classify rows, but accuracy and confusion-matrix metrics require labels.

Users should collect matching data with Linux `perf` using the same counter set:

```bash
sudo perf stat -I 50 -x , -e cache-misses,cache-references,instructions,cycles,branches,branch-misses -- ./your_program
```

Raw `perf` output has one counter per line. For `/dataset/test`, each complete timestamp window should be converted into one table row with the six counter values as columns. For direct raw `perf` text, use `/analyze/raw`.

Safety limits:

- maximum payload size: 512 KB
- maximum evaluated rows per request: 1,000
- validation errors are capped in the response

The endpoint returns:

- total rows
- evaluated rows
- accuracy
- attack recall
- false positive rate
- confusion matrix
- sample results
- sample misclassifications

This is meant for demos and quick validation, not bulk offline training.

## Simulator and Trace Generation

`src/simulator.js` contains calibrated distributions for:

- Ubuntu benign
- Ubuntu attack
- Fedora benign
- Fedora attack

The simulator generates triangularly distributed raw counter values with slight jitter, engineers the same feature row, and returns both raw fields and feature vectors.

`POST /simulate` calls the simulator and then reuses the normal `/analyze` path. This means simulated requests exercise the same model, mitigation, D1, KV, and response logic as real requests.

`GET /trace` generates a sequence of synthetic windows. The trace path is useful for visualizations and future replay-style demos.

## Live perf Collector

`scripts/realtime-perf-collector.py` is the bridge from a monitored Linux machine to EdgeShield.

It runs:

```bash
perf stat -I 50 -x , -e cache-misses,cache-references,instructions,cycles,branches,branch-misses -- <command>
```

Then it:

1. Reads `perf` output from stderr.
2. Groups counter lines into complete timestamp windows.
3. Posts each complete window to `/analyze`.
4. Prints prediction, confidence, Worker latency, client latency, and mitigation action.

This differs from the parent repo's `runtime/realtime_hpc_monitor.py`, which loads local Python model artifacts and performs local inference. EdgeShield's collector sends the same class of hardware counter windows to the Cloudflare Worker instead.

## Cloudflare Concepts Used

### Cloudflare Workers

A Worker is serverless JavaScript running on Cloudflare's edge network. In this project, the Worker is the main application server.

Implementation details:

- `wrangler.toml` points `main` to `src/index.js`.
- `src/index.js` exports the standard Worker `fetch(request, env, ctx)` handler.
- Routes are implemented by inspecting `new URL(request.url).pathname`.
- JSON responses include permissive CORS headers for demo use.
- `OPTIONS` requests return a 204 CORS preflight response.
- `/dashboard` is served directly as HTML from the Worker.

### Wrangler

Wrangler is Cloudflare's local development and deployment CLI.

Project scripts:

- `npm run dev` runs `wrangler dev --config wrangler.local.toml --local --port 8787`.
- `npm run deploy` deploys the production Worker using `wrangler.local.toml`.
- `npm run deploy:dry-run` validates deployment without publishing.
- `npm run d1:init:local` applies `schema.sql` to local D1.
- `npm run d1:init:remote` applies `schema.sql` to remote D1.

The committed `wrangler.toml` is intentionally a safe template with placeholder resource IDs. Real Cloudflare IDs belong in `wrangler.local.toml`, which is ignored by git.

### Bindings

Bindings are how a Worker receives access to Cloudflare resources. In code, bindings appear as properties on `env`.

EdgeShield uses these binding names:

- `EDGESHIELD_DB`: D1 database binding.
- `EDGESHIELD_KV`: KV namespace binding.
- `EDGESHIELD_TRACES`: optional R2 bucket binding.
- `ADMIN_TOKEN`: secret used to protect admin threshold routes.

The binding names matter. If the TOML binding name does not match the code, the Worker will behave as if the resource is missing.

### D1

D1 is Cloudflare's serverless SQL database. EdgeShield uses it for durable detection logs and dashboard statistics.

Implementation details:

- `schema.sql` creates `detections`.
- `schema.sql` also creates `source_reputation`, which is planned for richer reputation tracking.
- `persistDetection()` inserts detection records into `detections`.
- `/api/stats` queries totals and the 50 most recent detections.
- If D1 is not bound, `/api/stats` returns a clear `storage: "not_bound"` response.
- If the schema is missing, `/api/stats` returns `storage: "schema_missing"` with setup guidance.

The current detection table stores:

- ID
- timestamp
- source ID
- client IP
- prediction
- confidence
- attack score
- latency
- mitigation state
- mitigation action
- model version
- engineered feature JSON
- raw JSON
- metadata JSON

### KV

KV is Cloudflare's globally distributed key-value store. It is good for small, low-latency configuration and state where eventual consistency is acceptable.

EdgeShield uses KV for two things:

1. Dynamic model thresholds:
   - key: `model:thresholds`
   - read by `readModelConfig()`
   - updated by `/admin/thresholds`

2. Repeat-attacker tracking:
   - key shape: `source:<sourceId>:attacks`
   - incremented on attack predictions
   - expiration TTL: 3600 seconds
   - when the count reaches `mitigationAttackCount`, the action becomes `rate_limit`

When KV is not bound, local in-memory state is used for repeat-attacker counts, and default thresholds are used.

### R2

R2 is Cloudflare's object storage. EdgeShield treats R2 as optional trace archival.

Implementation details:

- If `env.EDGESHIELD_TRACES` exists and the detection record has raw data, `persistDetection()` writes the full record as JSON.
- Object keys are grouped by date: `YYYY-MM-DD/<detection-id>.json`.
- The committed `wrangler.toml` currently leaves the R2 binding commented out because trace storage is optional.

### Secrets and Environment Values

There are two different categories of configuration:

- Resource bindings belong in Wrangler TOML.
- Runtime secrets belong in `.dev.vars` locally or Cloudflare secrets remotely.

In this project:

- `.env.example` is for shell/script values like `EDGESHIELD_URL` and setup notes.
- `.dev.vars.example` is for local Worker secrets like `ADMIN_TOKEN`.
- `wrangler.local.toml` should contain real D1/KV/R2 resource IDs.
- The committed `wrangler.toml` should stay GitHub-safe.

Remote admin token setup:

```bash
npx wrangler secret put ADMIN_TOKEN --env production
```

### `ctx.waitUntil()`

`ctx.waitUntil()` lets a Worker return the response while background work continues.

EdgeShield uses it to avoid making the client wait for D1/R2 persistence:

```js
const persistPromise = persistDetection(env, record);
if (ctx?.waitUntil) ctx.waitUntil(persistPromise);
else await persistPromise;
```

This is a good fit for detection logging because classification should stay low-latency, while durable audit storage can complete just after the response is sent.

### Cloudflare Request Metadata

The Worker reads `cf-connecting-ip` as a fallback source identity:

```js
request.headers.get("cf-connecting-ip")
```

In production behind Cloudflare, this header identifies the client IP. Locally, it may be absent, so the code falls back to `anonymous` unless the request body or `x-source-id` provides a source ID.

## Dashboard Implementation

The dashboard is a static HTML/CSS/JS string returned by `renderDashboard()`.

It does not require a separate frontend build step. The Worker serves it directly from `/dashboard` or `/`.

The dashboard uses browser-side `fetch()` calls to:

- call `/simulate` for live demo traffic
- call `/api/stats` for persisted totals and recent detections
- call `/api/evaluation` for benchmark metrics
- call `/dataset/test` for uploaded CSV/JSON evaluation

It keeps a client-side rolling list of recent rows for charts and exports. It also renders feature insights from each response's `feature_contributions`.

## Security and Admin Behavior

Most routes are public because this is a demo API.

The threshold admin route is protected:

- `GET /admin/thresholds`
- `POST /admin/thresholds`

The route requires either:

- `Authorization: Bearer <ADMIN_TOKEN>`
- `x-admin-token: <ADMIN_TOKEN>`

If `ADMIN_TOKEN` is not configured, the route returns `admin_token_not_configured`.

Mitigation in the current code is advisory. The Worker returns:

- `action: "allow"` for normal requests or early attack counts
- `action: "rate_limit"` after repeated attacks from the same source

The Worker does not yet enforce Cloudflare firewall rules or actual network blocking. It exposes the action so a gateway, dashboard, or future Cloudflare Rules integration can act on it.

## API Examples

Direct attack-like vector:

```json
{
  "features": {
    "cache_misses": 149,
    "cache_references": 139866,
    "instructions": 704519,
    "cycles": 2637200,
    "branches": 122831,
    "branch_misses": 11525
  },
  "sourceId": "demo-client"
}
```

Equivalent six-value vector:

```json
{
  "features": [149, 139866, 704519, 2637200, 122831, 11525]
}
```

Simulation:

```json
{
  "mode": "attack",
  "os": "fedora",
  "sourceId": "demo-client"
}
```

Threshold update:

```json
{
  "decisionThreshold": 0.6,
  "mitigationAttackCount": 5
}
```

## Local Development

Common local flow:

```bash
cd /Users/dally/side_channel_attack_detection/edgeshield
npm install
cp .env.example .env
cp .dev.vars.example .dev.vars
cp wrangler.toml wrangler.local.toml
npm run d1:init:local
npm run dev
```

Then open:

```text
http://127.0.0.1:8787/dashboard
```

Useful verification:

```bash
npm test
npm run test:api
npm run test:dataset
```

For a deployed Worker:

```bash
EDGESHIELD_URL=https://edgeshield.<your-subdomain>.workers.dev npm run test:api
EDGESHIELD_URL=https://edgeshield.<your-subdomain>.workers.dev npm run test:dataset
```

## Deployment Shape

Cloudflare resources needed for the full demo:

- Worker: application/API/dashboard runtime.
- D1 database: detection logs and statistics.
- KV namespace: thresholds and repeat-attacker counts.
- Optional R2 bucket: raw trace archive.
- Secret: `ADMIN_TOKEN`.

Setup outline:

```bash
npx wrangler login
npx wrangler d1 create edgeshield
npx wrangler kv namespace create EDGESHIELD_KV
npx wrangler kv namespace create EDGESHIELD_KV --preview
npx wrangler r2 bucket create edgeshield-traces
```

Then paste returned IDs into `wrangler.local.toml`, initialize D1, set the secret, and deploy:

```bash
npm run d1:init:remote
npx wrangler secret put ADMIN_TOKEN --env production
npm run deploy
```

## Known Boundaries

The current system is demo-ready, but there are important boundaries:

- The Worker uses a distilled ruleset, not the exact saved Random Forest/SVM/CNN-LSTM artifacts.
- R2 is optional and currently commented out in the committed Wrangler template.
- Mitigation returns a recommended action but does not yet enforce real Cloudflare blocking.
- `/dataset/test` is intentionally bounded and is not a bulk training/evaluation service.
- D1 stats are simple totals and recent records, not full historical analytics yet.
- KV repeat-attacker counts are simple one-hour counters keyed by source ID.
- The dashboard is served as a static Worker-rendered page, not a separate frontend app.

## Good Next Steps

The highest-value next improvements are:

1. Add historical analytics over D1 detections.
2. Add dashboard controls for threshold tuning.
3. Add real alert delivery such as Slack, Discord, email, or PagerDuty webhooks.
4. Add a stronger replay view for historical traces.
5. Export actual Random Forest tree thresholds from saved artifacts if those artifacts are restored.
6. Add CI for `npm test`, dry-run deploy, and OpenAPI validation.
7. Connect mitigation actions to a real enforcement layer.

## Mental Model

Think of EdgeShield as a three-part system:

1. Sensor side: a monitored machine collects `perf` hardware counter windows.
2. Edge inference side: Cloudflare Worker receives the window, engineers features, classifies it, and returns an action.
3. Operations side: D1/KV/R2/dashboard make the detection stream visible, tunable, and auditable.

That is the main accomplishment: the research pipeline has been turned into a practical edge-facing detection service with a live demo surface and a Cloudflare-native storage/configuration story.
