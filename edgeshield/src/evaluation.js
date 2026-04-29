export const EVALUATION_SUMMARY = {
  generated_at: "2026-04-29T07:56:46.337Z",
  sampled: true,
  max_per_file: 500,
  total_rows: 2000,
  accuracy: 0.997,
  attack_recall: 0.996,
  benign_recall: 0.998,
  false_positive_rate: 0.002,
  precision: 0.9979959919839679,
  f1: 0.9969969969969971,
  avg_worker_latency_ms: 1.0275,
  p95_worker_latency_ms: 1,
  max_worker_latency_ms: 6,
  avg_confidence: 0.9776916000000051,
  confusion_matrix: {
    tp: 996,
    tn: 998,
    fp: 2,
    fn: 4
  },
  by_dataset: {
    ubuntu_benign: { rows: 500, accuracy: 1, attack_recall: 0, false_positive_rate: 0, avg_worker_latency_ms: 1.098 },
    ubuntu_attack: { rows: 500, accuracy: 0.994, attack_recall: 0.994, false_positive_rate: 0, avg_worker_latency_ms: 1 },
    fedora_benign: { rows: 500, accuracy: 0.996, attack_recall: 0, false_positive_rate: 0.004, avg_worker_latency_ms: 1.006 },
    fedora_attack: { rows: 500, accuracy: 0.998, attack_recall: 0.998, false_positive_rate: 0, avg_worker_latency_ms: 1.006 }
  }
};
