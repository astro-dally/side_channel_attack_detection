CREATE TABLE IF NOT EXISTS detections (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  source_id TEXT,
  client_ip TEXT,
  prediction TEXT NOT NULL CHECK (prediction IN ('attack', 'benign')),
  confidence REAL NOT NULL,
  attack_score REAL NOT NULL,
  latency_ms INTEGER NOT NULL,
  mitigated INTEGER NOT NULL DEFAULT 0,
  mitigation_action TEXT,
  model_version TEXT NOT NULL,
  feature_json TEXT NOT NULL,
  raw_json TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_detections_prediction ON detections(prediction);
CREATE INDEX IF NOT EXISTS idx_detections_source ON detections(source_id, timestamp);

CREATE TABLE IF NOT EXISTS source_reputation (
  source_id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  attack_count INTEGER NOT NULL DEFAULT 0,
  benign_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TEXT
);
