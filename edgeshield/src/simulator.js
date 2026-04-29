import { FEATURE_ORDER, engineerFeatures } from "./model.js";

const DISTRIBUTIONS = {
  ubuntu: {
    benign: {
      cache_misses: [78887, 121067, 190521],
      cache_references: [556178, 589751, 681569],
      instructions: [1706780, 1811610, 2245050],
      cycles: [4978970, 5290680, 6211130],
      branches: [299316, 317910, 394884],
      branch_misses: [34462, 36703, 42924]
    },
    attack: {
      cache_misses: [6320, 6592, 7566],
      cache_references: [1205590, 1240510, 1313700],
      instructions: [4044290, 4145670, 4481050],
      cycles: [11929900, 12209400, 12886400],
      branches: [685089, 703023, 763661],
      branch_misses: [74790, 77165, 81978]
    }
  },
  fedora: {
    benign: {
      cache_misses: [3422, 7062, 12278],
      cache_references: [90858, 92807, 98216],
      instructions: [281075, 288996, 301645],
      cycles: [759759, 779393, 830120],
      branches: [59167, 60702, 63117],
      branch_misses: [7933, 8143, 8371]
    },
    attack: {
      cache_misses: [145, 149, 152],
      cache_references: [132567, 139866, 160392],
      instructions: [695722, 704519, 728285],
      cycles: [2531240, 2637200, 2746720],
      branches: [121281, 122831, 127052],
      branch_misses: [10521, 11525, 13828]
    }
  }
};

function rand(seedState) {
  if (!seedState) return Math.random();
  seedState.value = (seedState.value * 1664525 + 1013904223) >>> 0;
  return seedState.value / 0x100000000;
}

function triangular([low, mode, high], seedState) {
  const u = rand(seedState);
  const c = (mode - low) / (high - low);
  const value = u < c
    ? low + Math.sqrt(u * (high - low) * (mode - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
  const jitter = 1 + (rand(seedState) - 0.5) * 0.035;
  return Math.max(0, Math.round(value * jitter));
}

function chooseOs(os, seedState) {
  if (os === "ubuntu" || os === "fedora") return os;
  return rand(seedState) < 0.56 ? "ubuntu" : "fedora";
}

export function generateSample({ mode = "benign", os = "mixed", seed } = {}) {
  const safeMode = mode === "attack" ? "attack" : "benign";
  const seedState = Number.isFinite(Number(seed)) ? { value: Number(seed) >>> 0 } : null;
  const selectedOs = chooseOs(os, seedState);
  const distribution = DISTRIBUTIONS[selectedOs][safeMode];
  const raw = {};
  for (const [key, stats] of Object.entries(distribution)) {
    raw[key] = triangular(stats, seedState);
  }
  const features = engineerFeatures(raw);
  return {
    mode: safeMode,
    os: selectedOs,
    raw,
    features,
    vector: FEATURE_ORDER.map((key) => features[key])
  };
}

export function generateTrace({ mode = "benign", os = "mixed", count = 20, seed } = {}) {
  const trace = [];
  const seedState = Number.isFinite(Number(seed)) ? { value: Number(seed) >>> 0 } : null;
  const selectedOs = chooseOs(os, seedState);
  const history = [];
  for (let index = 0; index < count; index += 1) {
    const sample = generateSample({
      mode,
      os: selectedOs,
      seed: seedState ? seedState.value + index + 1 : undefined
    });
    const features = engineerFeatures(sample.raw, history);
    history.push(features);
    trace.push({
      index,
      timestamp_ms: index * 50,
      mode: sample.mode,
      os: selectedOs,
      raw: sample.raw,
      features,
      vector: FEATURE_ORDER.map((key) => features[key])
    });
  }
  return trace;
}
