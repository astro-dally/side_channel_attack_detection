# EdgeShield Data Format

EdgeShield can only evaluate data that represents the same hardware performance counter window used by the research pipeline. Each row should describe one sampling window collected from Linux `perf`.

## Required Counters

CSV and JSON uploads must include these six raw counters:

```text
cache_misses
cache_references
instructions
cycles
branches
branch_misses
```

Hyphenated names from `perf`, such as `cache-misses`, are normalized internally to underscores. For uploaded datasets, using the underscore names above is the clearest and safest format.

## Optional Label

For dataset evaluation, add a `label` column or field when you know the ground truth:

```text
attack
benign
```

If labels are present, EdgeShield can calculate accuracy, recall, false-positive rate, and the confusion matrix. If labels are missing, the model can still produce predictions, but accuracy metrics will not be meaningful.

If every row has the same label, the dashboard and API also support a query-level fallback label:

```text
/dataset/test?label=attack
/dataset/test?label=benign
```

## CSV Template

Use `docs/sample-dataset.csv` as the upload template.

```csv
cache_misses,cache_references,instructions,cycles,branches,branch_misses,label
149,139866,704519,2637200,122831,11525,attack
78887,556178,1706780,4978970,299316,34462,benign
```

Upload command:

```bash
curl -X POST http://127.0.0.1:8787/dataset/test \
  -H "Content-Type: text/csv" \
  --data-binary @docs/sample-dataset.csv
```

## JSON Template

Use `docs/sample-dataset.json` when sending structured JSON.

```json
{
  "rows": [
    {
      "features": {
        "cache_misses": 149,
        "cache_references": 139866,
        "instructions": 704519,
        "cycles": 2637200,
        "branches": 122831,
        "branch_misses": 11525
      },
      "label": "attack"
    }
  ]
}
```

Upload command:

```bash
curl -X POST http://127.0.0.1:8787/dataset/test \
  -H "Content-Type: application/json" \
  --data-binary @docs/sample-dataset.json
```

## How To Collect Matching Data

On a Linux machine with `perf` available, collect the same six counters at the same 50 ms interval used in the project:

```bash
sudo perf stat \
  -I 50 \
  -x , \
  -e cache-misses,cache-references,instructions,cycles,branches,branch-misses \
  -- ./your_program
```

For system-wide collection, the parent project used:

```bash
sudo perf stat \
  -e cache-misses,cache-references,instructions,cycles,branches,branch-misses \
  -I 50 \
  -x , \
  -o data/dataset.csv \
  --append \
  -a
```

Raw `perf stat -x ,` output usually has one line per counter per timestamp. EdgeShield's `/analyze/raw` route can parse that raw output directly when it contains complete timestamp windows.

For `/dataset/test`, convert each complete timestamp window into one CSV row with the six counter values as columns. The uploaded CSV should be table-shaped, not raw multi-line `perf` output.

## One Row Means One Window

This raw `perf` group:

```text
0.050,149,,cache-misses
0.050,139866,,cache-references
0.050,704519,,instructions
0.050,2637200,,cycles
0.050,122831,,branches
0.050,11525,,branch-misses
```

becomes this dataset row:

```csv
cache_misses,cache_references,instructions,cycles,branches,branch_misses,label
149,139866,704519,2637200,122831,11525,attack
```

## Limits

`/dataset/test` is for demo-scale evaluation:

- maximum upload size: 512 KB
- maximum evaluated rows per request: 1,000
- required columns: the six counters above

For larger experiments, use `scripts/evaluate-dataset.mjs` against local files or split uploads into smaller chunks.
