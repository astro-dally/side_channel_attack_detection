const baseUrl = process.env.EDGESHIELD_URL || "http://127.0.0.1:8787";

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-source-id": "test-client" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

const benign = await post("/simulate", { mode: "benign", os: "ubuntu", seed: 11 });
const attack = await post("/simulate", { mode: "attack", os: "fedora", seed: 22 });
const direct = await post("/analyze", {
  features: {
    cache_misses: 149,
    cache_references: 139866,
    instructions: 704519,
    cycles: 2637200,
    branches: 122831,
    branch_misses: 11525
  },
  sourceId: "direct-vector"
});

console.log("benign simulation:", {
  prediction: benign.prediction,
  confidence: benign.confidence,
  latency_ms: benign.latency_ms,
  worker_latency_ms: benign.worker_latency_ms
});
console.log("attack simulation:", {
  prediction: attack.prediction,
  confidence: attack.confidence,
  latency_ms: attack.latency_ms,
  worker_latency_ms: attack.worker_latency_ms,
  mitigation: attack.mitigation
});
console.log("direct analyze:", {
  prediction: direct.prediction,
  confidence: direct.confidence,
  latency_ms: direct.latency_ms,
  worker_latency_ms: direct.worker_latency_ms
});

if (benign.prediction !== "benign") throw new Error("expected benign simulation to classify as benign");
if (attack.prediction !== "attack") throw new Error("expected attack simulation to classify as attack");
if (direct.prediction !== "attack") throw new Error("expected direct vector to classify as attack");
const maxInferenceLatency = Math.max(benign.latency_ms, attack.latency_ms, direct.latency_ms);
if (maxInferenceLatency >= 100) {
  throw new Error(`inference latency target missed: ${maxInferenceLatency}ms`);
}

const maxWorkerLatency = Math.max(
  benign.worker_latency_ms || benign.latency_ms,
  attack.worker_latency_ms || attack.latency_ms,
  direct.worker_latency_ms || direct.latency_ms
);
if (maxWorkerLatency >= 500) {
  throw new Error(`worker latency budget missed: ${maxWorkerLatency}ms`);
}

console.log("EdgeShield API smoke test passed.");
