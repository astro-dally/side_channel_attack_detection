import test from "node:test";
import assert from "node:assert/strict";

import { FEATURE_ORDER, analyzeFeatures, engineerFeatures } from "../src/model.js";

test("engineers the expected 36-feature vector", () => {
  const features = engineerFeatures({
    cache_misses: 149,
    cache_references: 139866,
    instructions: 704519,
    cycles: 2637200,
    branches: 122831,
    branch_misses: 11525
  });

  assert.equal(FEATURE_ORDER.length, 36);
  assert.equal(Object.keys(features).length, 36);
  assert.equal(features.cache_misses, 149);
  assert.ok(features.cache_miss_rate > 0);
});

test("classifies a known attack vector with contribution details", () => {
  const result = analyzeFeatures({
    cache_misses: 149,
    cache_references: 139866,
    instructions: 704519,
    cycles: 2637200,
    branches: 122831,
    branch_misses: 11525
  });

  assert.equal(result.prediction, "attack");
  assert.ok(result.confidence >= 0.9);
  assert.ok(result.feature_contributions.length > 0);
  assert.equal(result.feature_contributions[0].direction, "attack");
});

test("classifies a known benign vector", () => {
  const result = analyzeFeatures({
    cache_misses: 78887,
    cache_references: 556178,
    instructions: 1706780,
    cycles: 4978970,
    branches: 299316,
    branch_misses: 34462
  });

  assert.equal(result.prediction, "benign");
  assert.ok(result.confidence >= 0.9);
});
