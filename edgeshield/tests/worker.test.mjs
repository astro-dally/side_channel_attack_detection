import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";

function ctx() {
  return {
    promises: [],
    waitUntil(promise) {
      this.promises.push(promise);
    }
  };
}

function kvStore(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    async get(key, type) {
      const value = store.get(key);
      if (type === "json" && value) return JSON.parse(value);
      return value ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    }
  };
}

async function request(path, options = {}, env = {}) {
  const context = ctx();
  const response = await worker.fetch(
    new Request(`http://example.test${path}`, options),
    env,
    context
  );
  const body = await response.json();
  await Promise.all(context.promises);
  return { response, body };
}

test("serves health and OpenAPI documents", async () => {
  const health = await request("/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.body.ok, true);

  const openapi = await request("/openapi.json");
  assert.equal(openapi.response.status, 200);
  assert.equal(openapi.body.openapi, "3.0.3");
  assert.ok(openapi.body.paths["/analyze"]);
});

test("analyzes direct JSON features", async () => {
  const { response, body } = await request("/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      features: {
        cache_misses: 149,
        cache_references: 139866,
        instructions: 704519,
        cycles: 2637200,
        branches: 122831,
        branch_misses: 11525
      }
    })
  });

  assert.equal(response.status, 200);
  assert.equal(body.prediction, "attack");
  assert.ok(body.feature_contributions.length > 0);
  assert.ok(body.latency_ms >= 1);
});

test("parses perf stat output", async () => {
  const { response, body } = await request("/analyze/raw", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      perf_output: [
        "0.050,149,,cache-misses",
        "0.050,139866,,cache-references",
        "0.050,704519,,instructions",
        "0.050,2637200,,cycles",
        "0.050,122831,,branches",
        "0.050,11525,,branch-misses"
      ].join("\n")
    })
  });

  assert.equal(response.status, 200);
  assert.equal(body.prediction, "attack");
  assert.equal(body.perf_windows, 1);
});

test("returns clear dataset validation errors", async () => {
  const { response, body } = await request("/dataset/test", {
    method: "POST",
    headers: { "content-type": "text/csv" },
    body: "cache_misses,cache_references\\n1,2\\n"
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "no_dataset_rows");
  assert.ok(body.validation_errors[0].includes("missing required columns"));
});

test("evaluates a valid CSV dataset", async () => {
  const csv = [
    "cache_misses,cache_references,instructions,cycles,branches,branch_misses,label",
    "149,139866,704519,2637200,122831,11525,attack",
    "78887,556178,1706780,4978970,299316,34462,benign"
  ].join("\n");
  const { response, body } = await request("/dataset/test", {
    method: "POST",
    headers: { "content-type": "text/csv" },
    body: csv
  });

  assert.equal(response.status, 200);
  assert.equal(body.evaluated_rows, 2);
  assert.equal(body.accuracy, 1);
});

test("protects and updates admin thresholds", async () => {
  const env = { ADMIN_TOKEN: "secret", EDGESHIELD_KV: kvStore() };
  const denied = await request("/admin/thresholds", { method: "GET" }, env);
  assert.equal(denied.response.status, 401);

  const updated = await request("/admin/thresholds", {
    method: "POST",
    headers: {
      "authorization": "Bearer secret",
      "content-type": "application/json"
    },
    body: JSON.stringify({ decisionThreshold: 0.6 })
  }, env);

  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.thresholds.decisionThreshold, 0.6);
});
