# EdgeShield Dataset Evaluation

Generated: 2026-04-29T07:56:46.337Z

Endpoint: http://127.0.0.1:8787

## Summary

| Metric | Value |
| --- | ---: |
| Rows evaluated | 2000 |
| Accuracy | 99.70% |
| Attack detection rate / recall | 99.60% |
| Benign recall | 99.80% |
| False positive rate | 0.20% |
| Precision | 99.80% |
| F1 score | 99.70% |
| Average Worker latency | 1.03 ms |
| P95 Worker latency | 1 ms |
| Max Worker latency | 6 ms |
| Average confidence | 97.77% |

## Confusion Matrix

|  | Predicted attack | Predicted benign |
| --- | ---: | ---: |
| Actual attack | 996 | 4 |
| Actual benign | 2 | 998 |

## By Dataset

| Dataset | Rows | Accuracy | Attack recall | False positive rate | Avg Worker latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| ubuntu_benign | 500 | 100.00% | 0.00% | 0.00% | 1.10 ms |
| ubuntu_attack | 500 | 99.40% | 99.40% | 0.00% | 1.00 ms |
| fedora_benign | 500 | 99.60% | 0.00% | 0.40% | 1.01 ms |
| fedora_attack | 500 | 99.80% | 99.80% | 0.00% | 1.01 ms |

## Notes

This report evaluates parsed hardware performance counter rows from the repository datasets through the EdgeShield `/analyze` API. The default command evenly samples rows from each dataset so the evaluation runs quickly during demos. Use `--all` for an exhaustive pass.
