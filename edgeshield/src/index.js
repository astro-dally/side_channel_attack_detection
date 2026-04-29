import {
  analyzeFeatures,
  DEFAULT_THRESHOLDS,
  FEATURE_ORDER,
  MODEL_VERSION,
  RAW_EVENTS,
  normalizeEventName
} from "./model.js";
import { generateSample, generateTrace } from "./simulator.js";
import { renderDashboard } from "./dashboard.js";
import { EVALUATION_SUMMARY } from "./evaluation.js";
import { OPENAPI_SPEC } from "./openapi.js";

const LOCAL_ATTACK_COUNTS = new Map();

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-admin-token,x-source-id"
};

const MAX_DATASET_ROWS = 1000;
const MAX_DATASET_BYTES = 512 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function html(markup) {
  return new Response(markup, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function sourceIdFromRequest(request, body) {
  return body?.sourceId
    || request.headers.get("x-source-id")
    || request.headers.get("cf-connecting-ip")
    || "anonymous";
}

function finiteNumber(value) {
  const n = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
}

function parsePerfLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((part) => part.trim());
    if (parts.length >= 4) {
      const timestamp = Number(parts[0]);
      const count = finiteNumber(parts[1]);
      const event = normalizeEventName(parts[3]);
      if (Number.isFinite(timestamp) && count !== null && RAW_EVENTS.includes(event)) {
        return { timestamp, event, count };
      }
    }
  }

  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s+([0-9,]+)\s+([A-Za-z0-9-]+)\s*$/);
  if (!match) return null;

  const timestamp = Number(match[1]);
  const count = finiteNumber(match[2]);
  const event = normalizeEventName(match[3]);
  if (Number.isFinite(timestamp) && count !== null && RAW_EVENTS.includes(event)) {
    return { timestamp, event, count };
  }
  return null;
}

function parsePerfOutput(text) {
  const rows = [];
  let currentTimestamp = null;
  let bucket = {};

  for (const line of String(text || "").split(/\r?\n/)) {
    const parsed = parsePerfLine(line);
    if (!parsed) continue;

    if (currentTimestamp === null) currentTimestamp = parsed.timestamp;
    if (parsed.timestamp !== currentTimestamp) {
      if (RAW_EVENTS.every((event) => Number.isFinite(bucket[event]))) {
        rows.push({ timestamp: currentTimestamp, features: { ...bucket } });
      }
      currentTimestamp = parsed.timestamp;
      bucket = {};
    }
    bucket[parsed.event] = parsed.count;
  }

  if (RAW_EVENTS.every((event) => Number.isFinite(bucket[event]))) {
    rows.push({ timestamp: currentTimestamp, features: { ...bucket } });
  }
  return rows;
}

function parsePlainCsv(text, fallbackLabel) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  const errors = [];
  if (!lines.length) return { rows: [], errors: ["CSV is empty."] };

  const headers = lines[0].split(",").map((header) => normalizeEventName(header));
  const missing = RAW_EVENTS.filter((event) => !headers.includes(event));
  if (missing.length) {
    return {
      rows: [],
      errors: [`CSV is missing required columns: ${missing.join(", ")}.`],
      headers
    };
  }

  const labelIndex = headers.findIndex((header) => header === "label" || header === "prediction");
  const rows = [];
  lines.slice(1).forEach((line, lineIndex) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const features = {};
    const rowMissing = [];
    for (const event of RAW_EVENTS) {
      const value = finiteNumber(cells[headers.indexOf(event)]);
      if (value !== null) features[event] = value;
      else rowMissing.push(event);
    }
    const label = labelIndex >= 0 ? String(cells[labelIndex]).toLowerCase() : fallbackLabel;
    if (rowMissing.length) {
      errors.push(`Row ${lineIndex + 2} has invalid numeric values for: ${rowMissing.join(", ")}.`);
    } else if (label && label !== "attack" && label !== "benign") {
      errors.push(`Row ${lineIndex + 2} has invalid label "${label}". Use "attack" or "benign".`);
    } else {
      rows.push({ features, label });
    }
  });
  return { rows, errors: errors.slice(0, 25), headers };
}

function validateDatasetRows(rows, fallbackLabel) {
  const validRows = [];
  const errors = [];
  if (!Array.isArray(rows)) return { rows: validRows, errors: ["JSON payload must include rows as an array."] };
  rows.forEach((row, index) => {
    const source = row?.features || row;
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      errors.push(`Row ${index + 1} must be an object or { features: object }.`);
      return;
    }
    const features = {};
    const missing = [];
    for (const event of RAW_EVENTS) {
      const value = finiteNumber(source[event]);
      if (value === null) missing.push(event);
      else features[event] = value;
    }
    const label = row.label || fallbackLabel;
    if (missing.length) {
      errors.push(`Row ${index + 1} is missing valid counters: ${missing.join(", ")}.`);
    } else if (label && label !== "attack" && label !== "benign") {
      errors.push(`Row ${index + 1} has invalid label "${label}". Use "attack" or "benign".`);
    } else {
      validRows.push({ features, label });
    }
  });
  return { rows: validRows, errors: errors.slice(0, 25) };
}

function summarizeBatch(results) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let labeled = 0;

  for (const result of results) {
    if (result.expected !== "attack" && result.expected !== "benign") continue;
    labeled += 1;
    if (result.expected === "attack" && result.predicted === "attack") tp += 1;
    else if (result.expected === "benign" && result.predicted === "benign") tn += 1;
    else if (result.expected === "benign" && result.predicted === "attack") fp += 1;
    else if (result.expected === "attack" && result.predicted === "benign") fn += 1;
  }

  const accuracy = labeled ? (tp + tn) / labeled : null;
  const attackRecall = tp + fn ? tp / (tp + fn) : null;
  const falsePositiveRate = fp + tn ? fp / (fp + tn) : null;
  return {
    labeled_rows: labeled,
    accuracy,
    attack_recall: attackRecall,
    false_positive_rate: falsePositiveRate,
    confusion_matrix: { tp, tn, fp, fn }
  };
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return { ok: false, response: json({ error: "admin_token_not_configured" }, 503) };
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const token = bearer || request.headers.get("x-admin-token");
  if (token !== env.ADMIN_TOKEN) {
    return { ok: false, response: json({ error: "unauthorized" }, 401) };
  }
  return { ok: true };
}

async function readModelConfig(env) {
  if (!env.EDGESHIELD_KV) return DEFAULT_THRESHOLDS;
  const stored = await env.EDGESHIELD_KV.get("model:thresholds", "json").catch(() => null);
  return { ...DEFAULT_THRESHOLDS, ...(stored || {}) };
}

function cleanThresholds(input) {
  const allowed = Object.keys(DEFAULT_THRESHOLDS);
  const cleaned = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (!allowed.includes(key)) continue;
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) cleaned[key] = numberValue;
  }
  return cleaned;
}

async function updateMitigation(env, sourceId, prediction, threshold) {
  if (!sourceId || prediction !== "attack") {
    return { mitigated: false, action: "allow", attack_count: 0 };
  }

  let attackCount = 1;
  if (env.EDGESHIELD_KV) {
    const key = `source:${sourceId}:attacks`;
    const existing = Number(await env.EDGESHIELD_KV.get(key).catch(() => 0)) || 0;
    attackCount = existing + 1;
    await env.EDGESHIELD_KV.put(key, String(attackCount), { expirationTtl: 3600 }).catch(() => {});
  } else {
    attackCount = (LOCAL_ATTACK_COUNTS.get(sourceId) || 0) + 1;
    LOCAL_ATTACK_COUNTS.set(sourceId, attackCount);
  }

  const mitigated = attackCount >= threshold;
  return {
    mitigated,
    action: mitigated ? "rate_limit" : "allow",
    attack_count: attackCount
  };
}

async function persistDetection(env, record) {
  if (env.EDGESHIELD_DB) {
    await env.EDGESHIELD_DB.prepare(
      `INSERT INTO detections (
        id, timestamp, source_id, client_ip, prediction, confidence, attack_score,
        latency_ms, mitigated, mitigation_action, model_version, feature_json, raw_json, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      record.id,
      record.timestamp,
      record.source_id,
      record.client_ip,
      record.prediction,
      record.confidence,
      record.attack_score,
      record.latency_ms,
      record.mitigation.mitigated ? 1 : 0,
      record.mitigation.action,
      record.model_version,
      JSON.stringify(record.features),
      record.raw ? JSON.stringify(record.raw) : null,
      record.metadata ? JSON.stringify(record.metadata) : null
    ).run().catch(() => null);
  }

  if (env.EDGESHIELD_TRACES && record.raw) {
    const key = `${record.timestamp.slice(0, 10)}/${record.id}.json`;
    await env.EDGESHIELD_TRACES.put(key, JSON.stringify(record)).catch(() => null);
  }
}

async function handleAnalyze(request, env, ctx, bodyOverride) {
  const started = Date.now();
  const body = bodyOverride || await request.json();
  if (!body.features) {
    return json({ error: "POST /analyze requires { features: [...] } or { features: {...} }" }, 400);
  }

  const configStarted = Date.now();
  const config = await readModelConfig(env);
  const configLatencyMs = Math.max(0, Date.now() - configStarted);
  const inferenceStarted = Date.now();
  const result = analyzeFeatures(body.features, config);
  const inferenceLatencyMs = Math.max(1, Date.now() - inferenceStarted);
  const sourceId = sourceIdFromRequest(request, body);
  const mitigationStarted = Date.now();
  const mitigation = await updateMitigation(
    env,
    sourceId,
    result.prediction,
    config.mitigationAttackCount
  );
  const mitigationLatencyMs = Math.max(0, Date.now() - mitigationStarted);
  const workerLatencyMs = Math.max(1, Date.now() - started);
  const record = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source_id: sourceId,
    client_ip: request.headers.get("cf-connecting-ip"),
    prediction: result.prediction,
    confidence: result.confidence,
    attack_score: result.attack_score,
    latency_ms: inferenceLatencyMs,
    inference_latency_ms: inferenceLatencyMs,
    worker_latency_ms: workerLatencyMs,
    model_version: result.model_version,
    reasons: result.reasons,
    feature_contributions: result.feature_contributions,
    mitigation,
    features: result.features,
    raw: body.raw || null,
    metadata: {
      ...(body.metadata || {}),
      timings_ms: {
        config: configLatencyMs,
        inference: inferenceLatencyMs,
        mitigation: mitigationLatencyMs,
        worker: workerLatencyMs
      }
    }
  };

  const persistPromise = persistDetection(env, record);
  if (ctx?.waitUntil) ctx.waitUntil(persistPromise);
  else await persistPromise;
  return json(record);
}

async function handleSimulate(request, env, ctx) {
  const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
  const url = new URL(request.url);
  const mode = body.mode || url.searchParams.get("mode") || "benign";
  const os = body.os || url.searchParams.get("os") || "mixed";
  const sample = generateSample({ mode, os, seed: body.seed });
  return handleAnalyze(request, env, ctx, {
    features: sample.features,
    raw: sample.raw,
    sourceId: body.sourceId || "simulator",
    metadata: { simulator_mode: sample.mode, simulator_os: sample.os }
  });
}

async function handleTrace(request) {
  const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
  const url = new URL(request.url);
  const count = Math.min(200, Math.max(1, Number(body.count || url.searchParams.get("count") || 20)));
  const mode = body.mode || url.searchParams.get("mode") || "benign";
  const os = body.os || url.searchParams.get("os") || "mixed";
  return json({ trace: generateTrace({ mode, os, count, seed: body.seed }), feature_order: FEATURE_ORDER });
}

async function handleAnalyzeRaw(request, env, ctx) {
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await request.json()
    : { perf_output: await request.text() };
  const rows = parsePerfOutput(body.perf_output || body.raw || "");
  if (!rows.length) {
    return json({
      error: "no_complete_perf_windows",
      message: "Send perf stat output containing all six raw counters for at least one timestamp."
    }, 400);
  }

  const latest = rows[rows.length - 1];
  const response = await handleAnalyze(request, env, ctx, {
    features: latest.features,
    raw: latest.features,
    sourceId: body.sourceId,
    metadata: {
      ...(body.metadata || {}),
      parser: "perf_output",
      perf_windows: rows.length,
      perf_timestamp: latest.timestamp
    }
  });
  const record = await response.json();
  return json({ ...record, perf_windows: rows.length, perf_timestamp: latest.timestamp }, response.status);
}

async function handleDatasetTest(request, env) {
  const contentType = request.headers.get("content-type") || "";
  const url = new URL(request.url);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_DATASET_BYTES) {
    return json({
      error: "dataset_too_large",
      message: `Dataset payload is too large. Maximum size is ${MAX_DATASET_BYTES} bytes.`,
      max_bytes: MAX_DATASET_BYTES
    }, 413);
  }
  const body = contentType.includes("application/json")
    ? await request.json()
    : { csv: await request.text() };
  const requestedLabel = body.label || url.searchParams.get("label");
  const label = requestedLabel === "attack" || requestedLabel === "benign" ? requestedLabel : undefined;
  const validation = Array.isArray(body.rows)
    ? validateDatasetRows(body.rows, label)
    : parsePlainCsv(body.csv || "", label);
  const rows = validation.rows;

  if (!rows.length) {
    return json({
      error: "no_dataset_rows",
      message: "Send CSV with the six raw counter columns, or JSON { rows: [{ features, label }] }.",
      required_columns: RAW_EVENTS,
      validation_errors: validation.errors || []
    }, 400);
  }

  const config = await readModelConfig(env);
  const selected = rows.slice(0, MAX_DATASET_ROWS);
  const results = selected.map((row, index) => {
    const analysis = analyzeFeatures(row.features, config);
    return {
      index,
      expected: row.label,
      predicted: analysis.prediction,
      confidence: analysis.confidence,
      attack_score: analysis.attack_score,
      reasons: analysis.reasons,
      feature_contributions: analysis.feature_contributions
    };
  });
  const summary = summarizeBatch(results);
  return json({
    total_rows: rows.length,
    evaluated_rows: selected.length,
    max_rows: MAX_DATASET_ROWS,
    validation_errors: validation.errors || [],
    truncated: rows.length > MAX_DATASET_ROWS,
    model_version: MODEL_VERSION,
    feature_order: FEATURE_ORDER,
    ...summary,
    sample_results: results.slice(0, 25),
    sample_misclassifications: results
      .filter((result) => result.expected && result.expected !== result.predicted)
      .slice(0, 25)
  });
}

async function handleAdminThresholds(request, env) {
  const admin = requireAdmin(request, env);
  if (!admin.ok) return admin.response;
  if (!env.EDGESHIELD_KV) return json({ error: "kv_not_bound" }, 503);

  if (request.method === "GET") {
    return json({ thresholds: await readModelConfig(env), defaults: DEFAULT_THRESHOLDS });
  }

  const body = await request.json();
  const updates = cleanThresholds(body.thresholds || body);
  if (!Object.keys(updates).length) {
    return json({ error: "no_valid_thresholds", allowed_keys: Object.keys(DEFAULT_THRESHOLDS) }, 400);
  }

  const thresholds = { ...(await readModelConfig(env)), ...updates };
  await env.EDGESHIELD_KV.put("model:thresholds", JSON.stringify(thresholds));
  return json({ thresholds, updated: Object.keys(updates) });
}

async function handleStats(env) {
  if (!env.EDGESHIELD_DB) {
    return json({
      storage: "not_bound",
      model_version: MODEL_VERSION,
      message: "Bind D1 to EDGESHIELD_DB for persisted statistics."
    });
  }
  try {
    const totals = await env.EDGESHIELD_DB.prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN prediction = 'attack' THEN 1 ELSE 0 END) AS attacks,
        AVG(latency_ms) AS avg_latency_ms,
        AVG(confidence) AS avg_confidence
       FROM detections`
    ).first();
    const recent = await env.EDGESHIELD_DB.prepare(
      `SELECT id, timestamp, source_id, prediction, confidence, attack_score, latency_ms, mitigated, mitigation_action
       FROM detections
       ORDER BY timestamp DESC
       LIMIT 50`
    ).all();
    return json({ storage: "bound", totals, recent: recent.results || [] });
  } catch (error) {
    return json({
      storage: "schema_missing",
      model_version: MODEL_VERSION,
      message: "Run schema.sql against the EDGESHIELD_DB D1 database before using persisted statistics.",
      error: error.message
    }, 503);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    const url = new URL(request.url);
    try {
      if (url.pathname === "/" || url.pathname === "/dashboard") return html(renderDashboard());
      if (url.pathname === "/openapi.json") return json(OPENAPI_SPEC);
      if (url.pathname === "/health") {
        return json({ ok: true, service: "edgeshield", model_version: MODEL_VERSION });
      }
      if (url.pathname === "/features") return json({ feature_order: FEATURE_ORDER });
      if (url.pathname === "/api/evaluation") return json(EVALUATION_SUMMARY);
      if (url.pathname === "/admin/thresholds" && ["GET", "POST"].includes(request.method)) {
        return handleAdminThresholds(request, env);
      }
      if (url.pathname === "/analyze" && request.method === "POST") return handleAnalyze(request, env, ctx);
      if (url.pathname === "/analyze/raw" && request.method === "POST") return handleAnalyzeRaw(request, env, ctx);
      if (url.pathname === "/dataset/test" && request.method === "POST") return handleDatasetTest(request, env);
      if (url.pathname === "/simulate") return handleSimulate(request, env, ctx);
      if (url.pathname === "/trace") return handleTrace(request);
      if (url.pathname === "/api/stats") return handleStats(env);
      return json({ error: "not_found" }, 404);
    } catch (error) {
      return json({ error: error.message || "internal_error" }, 500);
    }
  }
};
