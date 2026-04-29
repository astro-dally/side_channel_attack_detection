# Model Conversion Notes

The original notebook trains Random Forest, SVM, and CNN-LSTM models from `perf stat` hardware performance counters. This EdgeShield demo keeps the same feature family but converts the Random Forest idea into explicit JavaScript decision stumps so it can run inside Cloudflare Workers without Python, scikit-learn, or native binaries.

## Source Signals

The notebook and `runtime/realtime_hpc_monitor.py` use these raw counters:

- `cache_misses`
- `cache_references`
- `instructions`
- `cycles`
- `branches`
- `branch_misses`

EdgeShield currently derives 30 engineered fields from 6 raw counters, for 36 total Worker features:

- `ipc`
- `cpi`
- `cache_miss_rate`
- `branch_miss_rate`
- `cache_misses_per_kinst`
- `cache_references_per_kinst`
- `branches_per_kinst`
- `cycles_per_branch`
- raw counter diffs
- five-sample rolling means and standard deviations

## Dataset Boundaries Used

The strongest cross-dataset separator is cache behavior:

| Dataset | Mode | Median cache miss rate | Median cache misses / kinst |
| --- | --- | ---: | ---: |
| Ubuntu | benign | 0.1957 | 62.33 |
| Ubuntu | attack | 0.0053 | 1.59 |
| Fedora | benign | 0.0736 | 24.01 |
| Fedora | attack | 0.0011 | 0.21 |

The Worker treats `cache_miss_rate <= 0.02` and `cache_misses_per_kinst <= 5` as the highest-weight attack boundaries, then adds smaller votes for IPC, branch density, cycles per branch, and rolling stability.

## How To Extract Real RF Boundaries Later

If the saved `.joblib` model artifacts are restored, export the real tree thresholds from scikit-learn:

```python
import json
import joblib

model = joblib.load("artifacts/ubuntu_random_forest.joblib")
feature_names = json.loads(open("artifacts/ubuntu_feature_columns.json").read())

rules = []
for estimator_index, estimator in enumerate(model.estimators_):
    tree = estimator.tree_
    for node_id, feature_index in enumerate(tree.feature):
        if feature_index >= 0:
            rules.append({
                "tree": estimator_index,
                "node": node_id,
                "feature": feature_names[feature_index],
                "threshold": float(tree.threshold[node_id])
            })

open("rf_thresholds.json", "w").write(json.dumps(rules, indent=2))
```

Those thresholds can replace or tune the rule weights in `src/model.js`.
