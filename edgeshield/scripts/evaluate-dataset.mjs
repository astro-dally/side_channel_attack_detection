import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAW_EVENTS = [
  "cache_misses",
  "cache_references",
  "instructions",
  "cycles",
  "branches",
  "branch_misses"
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const repoDir = path.resolve(projectDir, "..");

const DEFAULT_DATASETS = [
  { name: "ubuntu_benign", os: "ubuntu", label: "benign", file: path.join(repoDir, "data/benign_data.csv") },
  { name: "ubuntu_attack", os: "ubuntu", label: "attack", file: path.join(repoDir, "data/attack_data_final.csv") },
  { name: "fedora_benign", os: "fedora", label: "benign", file: path.join(repoDir, "data/benign_fedora.csv") },
  { name: "fedora_attack", os: "fedora", label: "attack", file: path.join(repoDir, "data/attack_fedora.csv") }
];

function parseArgs(argv) {
  const args = {
    url: process.env.EDGESHIELD_URL || "http://127.0.0.1:8787",
    maxPerFile: 500,
    concurrency: 16,
    output: path.join(projectDir, "reports/dataset-evaluation.json"),
    markdownOutput: path.join(projectDir, "reports/dataset-evaluation.md"),
    all: false,
    files: []
  };

  for (const arg of argv.slice(2)) {
    if (arg === "--all") args.all = true;
    else if (arg.startsWith("--url=")) args.url = arg.slice("--url=".length);
    else if (arg.startsWith("--max-per-file=")) args.maxPerFile = Number(arg.slice("--max-per-file=".length));
    else if (arg.startsWith("--concurrency=")) args.concurrency = Number(arg.slice("--concurrency=".length));
    else if (arg.startsWith("--output=")) args.output = path.resolve(arg.slice("--output=".length));
    else if (arg.startsWith("--markdown-output=")) args.markdownOutput = path.resolve(arg.slice("--markdown-output=".length));
    else if (arg.startsWith("--file=")) args.files.push(path.resolve(arg.slice("--file=".length)));
    else if (arg === "--help") args.help = true;
  }
  return args;
}

function usage() {
  return `Usage:
  npm run test:dataset
  node scripts/evaluate-dataset.mjs --max-per-file=2000 --concurrency=24
  EDGESHIELD_URL=https://edgeshield.example.workers.dev npm run test:dataset

Options:
  --url=<url>             EdgeShield base URL. Defaults to EDGESHIELD_URL or http://127.0.0.1:8787
  --max-per-file=<n>      Evenly sample up to n rows per dataset. Defaults to 500
  --all                   Evaluate every parsed row
  --concurrency=<n>       Concurrent /analyze requests. Defaults to 16
  --output=<path>         JSON report path
  --markdown-output=<p>   Markdown summary path
  --file=<path>           Evaluate a custom labeled CSV file. Label is inferred from filename.
`;
}

function safeNumber(value) {
  const n = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeEventName(value) {
  return String(value || "").trim().replaceAll("-", "_").replaceAll(" ", "_");
}

function parsePerfLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((part) => part.trim());
    if (parts.length >= 4) {
      const timestamp = Number(parts[0]);
      const count = safeNumber(parts[1]);
      const event = normalizeEventName(parts[3]);
      if (Number.isFinite(timestamp) && count !== null && RAW_EVENTS.includes(event)) {
        return { timestamp, event, count };
      }
    }
  }

  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s+([0-9,]+)\s+([A-Za-z0-9-]+)\s*$/);
  if (match) {
    const timestamp = Number(match[1]);
    const count = safeNumber(match[2]);
    const event = normalizeEventName(match[3]);
    if (Number.isFinite(timestamp) && count !== null && RAW_EVENTS.includes(event)) {
      return { timestamp, event, count };
    }
  }

  return null;
}

function parsePlainCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (!lines.length) return null;

  const headers = lines[0].split(",").map((header) => normalizeEventName(header));
  if (!RAW_EVENTS.every((event) => headers.includes(event))) return null;

  const labelIndex = headers.findIndex((header) => header === "label" || header === "prediction");
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((cell) => cell.trim());
    const features = {};
    for (const event of RAW_EVENTS) {
      const value = safeNumber(cells[headers.indexOf(event)]);
      if (value === null) continue;
      features[event] = value;
    }
    if (RAW_EVENTS.every((event) => Number.isFinite(features[event]))) {
      rows.push({
        features,
        label: labelIndex >= 0 ? String(cells[labelIndex]).toLowerCase() : undefined
      });
    }
  }
  return rows;
}

function parsePerfCsv(text) {
  const rows = [];
  let currentTimestamp = null;
  let bucket = {};

  for (const line of text.split(/\r?\n/)) {
    const parsed = parsePerfLine(line);
    if (!parsed) continue;

    if (currentTimestamp === null) currentTimestamp = parsed.timestamp;
    if (parsed.timestamp !== currentTimestamp) {
      if (RAW_EVENTS.every((event) => Number.isFinite(bucket[event]))) {
        rows.push({ features: { ...bucket }, timestamp: currentTimestamp });
      }
      currentTimestamp = parsed.timestamp;
      bucket = {};
    }
    bucket[parsed.event] = parsed.count;
  }

  if (RAW_EVENTS.every((event) => Number.isFinite(bucket[event]))) {
    rows.push({ features: { ...bucket }, timestamp: currentTimestamp });
  }
  return rows;
}

async function loadRows(dataset) {
  const text = await fs.readFile(dataset.file, "utf8");
  const plainRows = parsePlainCsv(text);
  const rows = plainRows || parsePerfCsv(text);
  return rows.map((row) => ({
    ...row,
    label: row.label || dataset.label,
    dataset: dataset.name,
    os: dataset.os
  }));
}

function sampleRows(rows, maxRows, useAll) {
  if (useAll || rows.length <= maxRows) return rows;
  const sampled = [];
  const step = rows.length / maxRows;
  for (let index = 0; index < maxRows; index += 1) {
    sampled.push(rows[Math.floor(index * step)]);
  }
  return sampled;
}

async function analyze(baseUrl, row, index) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}/analyze`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-source-id": `dataset-eval-${row.dataset}`
    },
    body: JSON.stringify({
      features: row.features,
      sourceId: `dataset-eval-${row.dataset}`,
      metadata: {
        evaluation: true,
        dataset: row.dataset,
        os: row.os,
        row_index: index,
        expected: row.label
      }
    })
  });
  const latencyClientMs = performance.now() - started;
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${row.dataset} row ${index} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return {
    index,
    expected: row.label,
    predicted: body.prediction,
    confidence: body.confidence,
    latency_ms: body.latency_ms,
    client_latency_ms: latencyClientMs,
    attack_score: body.attack_score,
    dataset: row.dataset,
    os: row.os,
    features: row.features
  };
}

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      if ((index + 1) % 250 === 0 || index + 1 === items.length) {
        process.stdout.write(`\rProcessed ${index + 1}/${items.length}`);
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
  return results;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarize(results) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (const result of results) {
    if (result.expected === "attack" && result.predicted === "attack") tp += 1;
    else if (result.expected === "benign" && result.predicted === "benign") tn += 1;
    else if (result.expected === "benign" && result.predicted === "attack") fp += 1;
    else if (result.expected === "attack" && result.predicted === "benign") fn += 1;
  }

  const total = results.length;
  const latencies = results.map((result) => result.latency_ms);
  const clientLatencies = results.map((result) => result.client_latency_ms);
  const confidences = results.map((result) => result.confidence);
  const accuracy = total ? (tp + tn) / total : 0;
  const attackRecall = tp + fn ? tp / (tp + fn) : 0;
  const benignRecall = tn + fp ? tn / (tn + fp) : 0;
  const falsePositiveRate = fp + tn ? fp / (fp + tn) : 0;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const f1 = precision + attackRecall ? (2 * precision * attackRecall) / (precision + attackRecall) : 0;

  return {
    total,
    confusion_matrix: { tp, tn, fp, fn },
    accuracy,
    attack_recall: attackRecall,
    benign_recall: benignRecall,
    false_positive_rate: falsePositiveRate,
    precision,
    f1,
    latency_ms: {
      avg: latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: Math.max(...latencies, 0)
    },
    client_latency_ms: {
      avg: clientLatencies.reduce((sum, value) => sum + value, 0) / Math.max(1, clientLatencies.length),
      p50: percentile(clientLatencies, 50),
      p95: percentile(clientLatencies, 95),
      max: Math.max(...clientLatencies, 0)
    },
    avg_confidence: confidences.reduce((sum, value) => sum + value, 0) / Math.max(1, confidences.length)
  };
}

function byDataset(results) {
  const groups = new Map();
  for (const result of results) {
    if (!groups.has(result.dataset)) groups.set(result.dataset, []);
    groups.get(result.dataset).push(result);
  }
  return Object.fromEntries([...groups.entries()].map(([name, rows]) => [name, summarize(rows)]));
}

function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function printSummary(report) {
  const s = report.summary;
  console.log("\nEdgeShield Dataset Evaluation");
  console.log(`URL: ${report.url}`);
  console.log(`Rows: ${s.total}`);
  console.log(`Accuracy: ${formatPct(s.accuracy)}`);
  console.log(`Attack recall / detection rate: ${formatPct(s.attack_recall)}`);
  console.log(`Benign recall: ${formatPct(s.benign_recall)}`);
  console.log(`False positive rate: ${formatPct(s.false_positive_rate)}`);
  console.log(`Precision: ${formatPct(s.precision)}`);
  console.log(`F1: ${formatPct(s.f1)}`);
  console.log(`Worker latency avg/p95/max: ${s.latency_ms.avg.toFixed(2)}ms / ${s.latency_ms.p95}ms / ${s.latency_ms.max}ms`);
  console.log(`Client latency avg/p95/max: ${s.client_latency_ms.avg.toFixed(2)}ms / ${s.client_latency_ms.p95.toFixed(2)}ms / ${s.client_latency_ms.max.toFixed(2)}ms`);
  console.log(`Confusion matrix: TP=${s.confusion_matrix.tp} TN=${s.confusion_matrix.tn} FP=${s.confusion_matrix.fp} FN=${s.confusion_matrix.fn}`);
  console.log(`Report: ${report.output}`);
  console.log(`Markdown: ${report.markdown_output}`);
}

function markdownReport(report) {
  const s = report.summary;
  const datasetRows = Object.entries(report.by_dataset)
    .map(([name, item]) => `| ${name} | ${item.total} | ${formatPct(item.accuracy)} | ${formatPct(item.attack_recall)} | ${formatPct(item.false_positive_rate)} | ${item.latency_ms.avg.toFixed(2)} ms |`)
    .join("\n");

  return `# EdgeShield Dataset Evaluation

Generated: ${report.generated_at}

Endpoint: ${report.url}

## Summary

| Metric | Value |
| --- | ---: |
| Rows evaluated | ${s.total} |
| Accuracy | ${formatPct(s.accuracy)} |
| Attack detection rate / recall | ${formatPct(s.attack_recall)} |
| Benign recall | ${formatPct(s.benign_recall)} |
| False positive rate | ${formatPct(s.false_positive_rate)} |
| Precision | ${formatPct(s.precision)} |
| F1 score | ${formatPct(s.f1)} |
| Average Worker latency | ${s.latency_ms.avg.toFixed(2)} ms |
| P95 Worker latency | ${s.latency_ms.p95} ms |
| Max Worker latency | ${s.latency_ms.max} ms |
| Average confidence | ${formatPct(s.avg_confidence)} |

## Confusion Matrix

|  | Predicted attack | Predicted benign |
| --- | ---: | ---: |
| Actual attack | ${s.confusion_matrix.tp} | ${s.confusion_matrix.fn} |
| Actual benign | ${s.confusion_matrix.fp} | ${s.confusion_matrix.tn} |

## By Dataset

| Dataset | Rows | Accuracy | Attack recall | False positive rate | Avg Worker latency |
| --- | ---: | ---: | ---: | ---: | ---: |
${datasetRows}

## Notes

This report evaluates parsed hardware performance counter rows from the repository datasets through the EdgeShield \`/analyze\` API. The default command evenly samples rows from each dataset so the evaluation runs quickly during demos. Use \`--all\` for an exhaustive pass.
`;
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log(usage());
  process.exit(0);
}

if (!args.all && (!Number.isFinite(args.maxPerFile) || args.maxPerFile < 1)) {
  throw new Error("--max-per-file must be a positive number, or use --all");
}
if (!Number.isFinite(args.concurrency) || args.concurrency < 1) {
  throw new Error("--concurrency must be a positive number");
}

const customDatasets = args.files.map((file) => {
  const base = path.basename(file).toLowerCase();
  return {
    name: path.basename(file, path.extname(file)),
    os: base.includes("fedora") ? "fedora" : base.includes("ubuntu") ? "ubuntu" : "unknown",
    label: base.includes("attack") ? "attack" : "benign",
    file
  };
});
const datasets = customDatasets.length ? customDatasets : DEFAULT_DATASETS;

const preparedRows = [];
for (const dataset of datasets) {
  const rows = await loadRows(dataset);
  const selected = sampleRows(rows, args.maxPerFile, args.all);
  console.log(`${dataset.name}: parsed ${rows.length}, evaluating ${selected.length}`);
  preparedRows.push(...selected);
}

const started = Date.now();
const results = await mapConcurrent(preparedRows, args.concurrency, (row, index) => analyze(args.url, row, index));
const report = {
  generated_at: new Date().toISOString(),
  url: args.url,
  elapsed_ms: Date.now() - started,
  sampled: !args.all,
  max_per_file: args.all ? null : args.maxPerFile,
  datasets: datasets.map((dataset) => ({
    name: dataset.name,
    os: dataset.os,
    label: dataset.label,
    file: dataset.file
  })),
  summary: summarize(results),
  by_dataset: byDataset(results),
  sample_misclassifications: results
    .filter((result) => result.expected !== result.predicted)
    .slice(0, 25),
  output: args.output,
  markdown_output: args.markdownOutput
};

await fs.mkdir(path.dirname(args.output), { recursive: true });
await fs.writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`);
await fs.mkdir(path.dirname(args.markdownOutput), { recursive: true });
await fs.writeFile(args.markdownOutput, markdownReport(report));
printSummary(report);
