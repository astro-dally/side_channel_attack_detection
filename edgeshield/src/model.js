export const RAW_EVENTS = [
  "cache_misses",
  "cache_references",
  "instructions",
  "cycles",
  "branches",
  "branch_misses"
];

export const FEATURE_ORDER = [
  ...RAW_EVENTS,
  "ipc",
  "cpi",
  "cache_miss_rate",
  "branch_miss_rate",
  "cache_misses_per_kinst",
  "cache_references_per_kinst",
  "branches_per_kinst",
  "cycles_per_branch",
  "cache_misses_diff",
  "cache_references_diff",
  "instructions_diff",
  "cycles_diff",
  "branches_diff",
  "branch_misses_diff",
  "cache_misses_roll_mean_5",
  "cache_misses_roll_std_5",
  "cache_references_roll_mean_5",
  "cache_references_roll_std_5",
  "instructions_roll_mean_5",
  "instructions_roll_std_5",
  "cycles_roll_mean_5",
  "cycles_roll_std_5",
  "branches_roll_mean_5",
  "branches_roll_std_5",
  "branch_misses_roll_mean_5",
  "branch_misses_roll_std_5",
  "cache_miss_rate_roll_mean_5",
  "cache_miss_rate_roll_std_5",
  "branch_miss_rate_roll_mean_5",
  "branch_miss_rate_roll_std_5"
];

export const MODEL_VERSION = "edgeshield-rf-rules-v1";

export const DEFAULT_THRESHOLDS = {
  decisionThreshold: 0.55,
  hardAttackCacheMissRate: 0.02,
  hardBenignCacheMissRate: 0.03,
  hardAttackMissesPerKinst: 5,
  hardBenignMissesPerKinst: 10,
  mitigationAttackCount: 3
};

function finiteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeDivide(a, b) {
  const numerator = finiteNumber(a);
  const denominator = finiteNumber(b);
  if (!denominator) return 0;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : 0;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + finiteNumber(value), 0) / values.length;
}

function std(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => {
    const delta = finiteNumber(value) - avg;
    return sum + delta * delta;
  }, 0) / values.length;
  return Math.sqrt(variance);
}

export function normalizeEventName(name) {
  return String(name || "")
    .trim()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export function featuresFromInput(input) {
  if (Array.isArray(input)) {
    const row = {};
    const order = input.length <= RAW_EVENTS.length ? RAW_EVENTS : FEATURE_ORDER;
    order.forEach((key, index) => {
      row[key] = finiteNumber(input[index]);
    });
    return engineerFeatures(row);
  }

  if (input && typeof input === "object") {
    const row = {};
    for (const [key, value] of Object.entries(input)) {
      row[normalizeEventName(key)] = finiteNumber(value);
    }
    return engineerFeatures(row);
  }

  throw new Error("features must be an array or object");
}

export function engineerFeatures(row, history = []) {
  const current = {};
  for (const event of RAW_EVENTS) {
    current[event] = finiteNumber(row[event]);
  }

  const features = {
    ...current,
    ipc: finiteNumber(row.ipc, safeDivide(current.instructions, current.cycles)),
    cpi: finiteNumber(row.cpi, safeDivide(current.cycles, current.instructions)),
    cache_miss_rate: finiteNumber(
      row.cache_miss_rate,
      safeDivide(current.cache_misses, current.cache_references)
    ),
    branch_miss_rate: finiteNumber(
      row.branch_miss_rate,
      safeDivide(current.branch_misses, current.branches)
    ),
    cache_misses_per_kinst: finiteNumber(
      row.cache_misses_per_kinst,
      safeDivide(current.cache_misses * 1000, current.instructions)
    ),
    cache_references_per_kinst: finiteNumber(
      row.cache_references_per_kinst,
      safeDivide(current.cache_references * 1000, current.instructions)
    ),
    branches_per_kinst: finiteNumber(
      row.branches_per_kinst,
      safeDivide(current.branches * 1000, current.instructions)
    ),
    cycles_per_branch: finiteNumber(
      row.cycles_per_branch,
      safeDivide(current.cycles, current.branches)
    )
  };

  const previous = history.length ? history[history.length - 1] : null;
  for (const event of RAW_EVENTS) {
    const diffKey = `${event}_diff`;
    features[diffKey] = finiteNumber(
      row[diffKey],
      previous ? current[event] - finiteNumber(previous[event]) : 0
    );
  }

  const windowRows = [...history.slice(-4), features];
  const rollingColumns = [...RAW_EVENTS, "cache_miss_rate", "branch_miss_rate"];
  for (const col of rollingColumns) {
    const values = windowRows.map((item) => finiteNumber(item[col]));
    features[`${col}_roll_mean_5`] = finiteNumber(row[`${col}_roll_mean_5`], mean(values));
    features[`${col}_roll_std_5`] = finiteNumber(row[`${col}_roll_std_5`], std(values));
  }

  for (const key of FEATURE_ORDER) {
    features[key] = finiteNumber(features[key]);
  }
  return features;
}

function vote(condition, weight, reason, attackVotes, benignVotes, reasons, contributions, detail = {}) {
  const benignWeight = Number((weight * 0.72).toFixed(4));
  if (condition) {
    reasons.push(reason);
    contributions.push({
      feature: detail.feature || "rule",
      label: detail.label || reason,
      value: finiteNumber(detail.value),
      threshold: detail.threshold,
      direction: detail.direction || "attack",
      impact: Number(weight.toFixed(4)),
      matched: true,
      reason
    });
    return [attackVotes + weight, benignVotes];
  }
  contributions.push({
    feature: detail.feature || "rule",
    label: detail.label || reason,
    value: finiteNumber(detail.value),
    threshold: detail.threshold,
    direction: "benign",
    impact: -benignWeight,
    matched: false,
    reason: detail.clearReason || "rule did not match attack boundary"
  });
  return [attackVotes, benignVotes + benignWeight];
}

export function analyzeFeatureRow(featureRow, config = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...config };
  let attackVotes = 0;
  let benignVotes = 0;
  const reasons = [];
  const contributions = [];
  const f = featureRow;

  [attackVotes, benignVotes] = vote(
    f.cache_miss_rate <= thresholds.hardAttackCacheMissRate,
    0.24,
    "cache_miss_rate below attack boundary",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "cache_miss_rate",
      label: "Cache miss rate",
      value: f.cache_miss_rate,
      threshold: `<= ${thresholds.hardAttackCacheMissRate}`
    }
  );
  [attackVotes, benignVotes] = vote(
    f.cache_misses_per_kinst <= thresholds.hardAttackMissesPerKinst,
    0.22,
    "cache misses per thousand instructions below attack boundary",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "cache_misses_per_kinst",
      label: "Cache misses / k instructions",
      value: f.cache_misses_per_kinst,
      threshold: `<= ${thresholds.hardAttackMissesPerKinst}`
    }
  );
  [attackVotes, benignVotes] = vote(
    f.cache_miss_rate <= 0.012 && f.cache_references_per_kinst <= 310,
    0.14,
    "low cache miss ratio with dense cache references",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "cache_references_per_kinst",
      label: "Cache reference density",
      value: f.cache_references_per_kinst,
      threshold: "miss rate <= 0.012 and refs/k <= 310"
    }
  );
  [attackVotes, benignVotes] = vote(
    f.cache_miss_rate <= 0.02 && f.cycles_per_branch >= 17.2,
    0.1,
    "low cache misses with elevated cycles per branch",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "cycles_per_branch",
      label: "Cycles per branch",
      value: f.cycles_per_branch,
      threshold: "miss rate <= 0.02 and cycles/branch >= 17.2"
    }
  );
  [attackVotes, benignVotes] = vote(
    f.cache_miss_rate <= 0.02 && f.branches_per_kinst <= 177,
    0.1,
    "branch density matches attacker traces",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "branches_per_kinst",
      label: "Branch density",
      value: f.branches_per_kinst,
      threshold: "miss rate <= 0.02 and branches/k <= 177"
    }
  );
  [attackVotes, benignVotes] = vote(
    f.ipc <= 0.3 && f.cache_miss_rate <= 0.01,
    0.08,
    "low IPC and very low cache miss ratio",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "ipc",
      label: "Instructions per cycle",
      value: f.ipc,
      threshold: "IPC <= 0.3 and miss rate <= 0.01"
    }
  );
  [attackVotes, benignVotes] = vote(
    f.cache_miss_rate_roll_mean_5 <= 0.025 && f.cache_misses_roll_std_5 <= 9000,
    0.07,
    "stable low rolling cache miss behavior",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "cache_miss_rate_roll_mean_5",
      label: "Rolling cache behavior",
      value: f.cache_miss_rate_roll_mean_5,
      threshold: "rolling miss rate <= 0.025 and std <= 9000"
    }
  );
  [attackVotes, benignVotes] = vote(
    f.branch_miss_rate <= 0.112 && f.cache_miss_rate <= 0.02,
    0.05,
    "branch miss rate aligns with attack windows",
    attackVotes,
    benignVotes,
    reasons,
    contributions,
    {
      feature: "branch_miss_rate",
      label: "Branch miss rate",
      value: f.branch_miss_rate,
      threshold: "branch miss rate <= 0.112 and cache miss rate <= 0.02"
    }
  );

  if (f.cache_miss_rate >= thresholds.hardBenignCacheMissRate) {
    benignVotes += 0.18;
    contributions.push({
      feature: "cache_miss_rate",
      label: "Benign cache miss guardrail",
      value: f.cache_miss_rate,
      threshold: `>= ${thresholds.hardBenignCacheMissRate}`,
      direction: "benign",
      impact: -0.18,
      matched: true,
      reason: "cache miss rate exceeds benign boundary"
    });
  }
  if (f.cache_misses_per_kinst >= thresholds.hardBenignMissesPerKinst) {
    benignVotes += 0.16;
    contributions.push({
      feature: "cache_misses_per_kinst",
      label: "Benign cache miss density guardrail",
      value: f.cache_misses_per_kinst,
      threshold: `>= ${thresholds.hardBenignMissesPerKinst}`,
      direction: "benign",
      impact: -0.16,
      matched: true,
      reason: "cache misses per thousand instructions exceed benign boundary"
    });
  }

  const total = Math.max(attackVotes + benignVotes, 1e-9);
  const attackScore = attackVotes / total;
  const prediction = attackScore >= thresholds.decisionThreshold ? "attack" : "benign";
  const confidence = prediction === "attack" ? attackScore : 1 - attackScore;

  return {
    prediction,
    confidence: Number(confidence.toFixed(4)),
    attack_score: Number(attackScore.toFixed(4)),
    model_version: MODEL_VERSION,
    reasons: reasons.slice(0, 4),
    feature_contributions: contributions
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 10),
    feature_order: FEATURE_ORDER
  };
}

export function analyzeFeatures(input, config = {}) {
  const featureRow = featuresFromInput(input);
  return {
    ...analyzeFeatureRow(featureRow, config),
    features: featureRow
  };
}
