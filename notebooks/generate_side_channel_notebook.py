import json
from pathlib import Path


def md_cell(text):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": text.strip("\n").splitlines(keepends=True),
    }


def code_cell(text):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": text.strip("\n").splitlines(keepends=True),
    }


cells = [
    md_cell(
        """
# Side-Channel Attack Detection Pipeline

This notebook builds a complete training and evaluation workflow for detecting cache-based covert-channel activity from Linux `perf` hardware performance counter traces.

It covers:

- Hybrid ingestion for Ubuntu-style and Fedora-style `perf stat` outputs
- Preprocessing and normalization
- Exploratory Data Analysis (EDA)
- Feature engineering
- Separate model training for Ubuntu and Fedora
- Model comparison using `Random Forest`, `SVM`, and `CNN-LSTM`
- Cross-OS generalization experiments
- Saving every important plot and table into `results/` for report and presentation reuse

Assumptions:

- The notebook is run from the project root on the EC2 instance
- The raw files live in either `dataset/` or `data/`
- Labels are derived from file names: `benign` -> `0`, `attack` -> `1`
- You already created a top-level `results/` directory on the EC2 instance
"""
    ),
    md_cell(
        """
## 1. Environment Setup

If your EC2 notebook environment is missing dependencies, run the next cell once.
"""
    ),
    code_cell(
        """
# Uncomment this cell if packages are missing in your EC2 notebook environment.
# %pip install -q numpy pandas matplotlib seaborn scikit-learn joblib tensorflow
"""
    ),
    md_cell(
        """
## 2. Imports

The notebook is intentionally commented in a project-friendly style so that it can be reused during report writing,
presentation preparation, and final deployment.
"""
    ),
    code_cell(
        """
from __future__ import annotations

import json
import math
import re
import warnings
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC

warnings.filterwarnings("ignore")
sns.set_theme(style="whitegrid", context="notebook")
pd.set_option("display.max_columns", 200)
pd.set_option("display.max_rows", 200)

try:
    import tensorflow as tf
    from tensorflow.keras import Sequential
    from tensorflow.keras.callbacks import EarlyStopping
    from tensorflow.keras.layers import LSTM, BatchNormalization, Conv1D, Dense, Dropout, MaxPooling1D

    TF_AVAILABLE = True
except Exception as exc:
    TF_AVAILABLE = False
    TF_IMPORT_ERROR = exc
"""
    ),
    md_cell(
        """
## 2. Paths and Project Configuration

This path resolver makes the notebook portable between your local copy and the EC2 instance.
It also ensures that all figures and summary CSV files are saved into `results/`, while trained models are saved into `artifacts/`.
"""
    ),
    code_cell(
        """
RANDOM_STATE = 42
RAW_EVENTS = [
    "cache_misses",
    "cache_references",
    "instructions",
    "cycles",
    "branches",
    "branch_misses",
]
RATIO_FEATURES = [
    "ipc",
    "cpi",
    "cache_miss_rate",
    "branch_miss_rate",
    "cache_misses_per_kinst",
    "cache_references_per_kinst",
    "branches_per_kinst",
    "cycles_per_branch",
]


def resolve_project_root() -> Path:
    cwd = Path.cwd()
    candidates = [cwd, cwd.parent]
    for candidate in candidates:
        if (candidate / "dataset").exists() or (candidate / "data").exists():
            return candidate
    return cwd


PROJECT_ROOT = resolve_project_root()
DATA_DIR = PROJECT_ROOT / "dataset" if (PROJECT_ROOT / "dataset").exists() else PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "results"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

FILE_MAP = {
    "ubuntu": {
        "benign": DATA_DIR / "benign_data.csv",
        "attack": DATA_DIR / "attack_data_final.csv",
    },
    "fedora": {
        "benign": DATA_DIR / "benign_fedora.csv",
        "attack": DATA_DIR / "attack_fedora.csv",
    },
}

print("Project root:", PROJECT_ROOT)
print("Data directory:", DATA_DIR)
print("Results directory:", RESULTS_DIR)
print("Artifacts directory:", ARTIFACTS_DIR)
print(json.dumps({k: {kk: str(vv) for kk, vv in v.items()} for k, v in FILE_MAP.items()}, indent=2))
"""
    ),
    code_cell(
        """
def slugify(text: str) -> str:
    \"\"\"Create stable filenames for plots and exported tables.\"\"\"
    return (
        text.lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("->", "_to_")
        .replace("-", "_")
    )


def save_current_figure(filename: str, dpi: int = 180):
    \"\"\"Save the currently active Matplotlib figure into the results directory.\"\"\"
    output_path = RESULTS_DIR / filename
    plt.savefig(output_path, dpi=dpi, bbox_inches="tight")
    print(f"Saved figure: {output_path}")


def save_dataframe(df: pd.DataFrame, filename: str):
    \"\"\"Save a DataFrame to CSV in the results directory for later report writing.\"\"\"
    output_path = RESULTS_DIR / filename
    df.to_csv(output_path, index=False)
    print(f"Saved table: {output_path}")


def save_text(text: str, filename: str):
    \"\"\"Persist plain-text reports such as classification reports.\"\"\"
    output_path = RESULTS_DIR / filename
    output_path.write_text(text, encoding="utf-8")
    print(f"Saved text report: {output_path}")
"""
    ),
    md_cell(
        """
## 3. Hybrid Ingestion Engine

Ubuntu and Fedora produced different `perf` formats. The parser below detects each line format and converts both into a single long-form schema before pivoting to one row per sampling timestamp.
"""
    ),
    code_cell(
        """
UBUNTU_CSV_PATTERN = re.compile(r"^\\s*\\d")
FEDORA_PATTERN = re.compile(r"^\\s*([0-9]+\\.[0-9]+)\\s+([0-9,]+)\\s+([A-Za-z0-9\\-]+)\\s*$")


def safe_int(value: str) -> int | None:
    value = str(value).replace(",", "").strip()
    if value in {"", "<not", "<not counted>", "not", "not counted"}:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def parse_perf_line(line: str):
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        return None

    if "," in stripped:
        parts = [part.strip() for part in stripped.split(",")]
        if len(parts) >= 4:
            time_sec = float(parts[0])
            count = safe_int(parts[1])
            event = parts[3].replace("-", "_")
            return time_sec, event, count

    match = FEDORA_PATTERN.match(stripped)
    if match:
        time_sec = float(match.group(1))
        count = safe_int(match.group(2))
        event = match.group(3).replace("-", "_")
        return time_sec, event, count

    parts = re.split(r"\\s+", stripped)
    if len(parts) >= 3:
        try:
            time_sec = float(parts[0])
            count = safe_int(parts[1])
            event = parts[-1].replace("-", "_")
            return time_sec, event, count
        except ValueError:
            return None

    return None


def load_perf_file(path: Path, label_name: str, os_name: str) -> pd.DataFrame:
    rows = []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            parsed = parse_perf_line(line)
            if parsed is None:
                continue
            time_sec, event, count = parsed
            if event in RAW_EVENTS and count is not None:
                rows.append((time_sec, event, count))

    long_df = pd.DataFrame(rows, columns=["time_sec", "event", "count"])
    wide_df = (
        long_df.pivot_table(index="time_sec", columns="event", values="count", aggfunc="first")
        .reset_index()
        .sort_values("time_sec")
        .reset_index(drop=True)
    )
    wide_df.columns.name = None
    wide_df["label_name"] = label_name
    wide_df["label"] = 1 if label_name == "attack" else 0
    wide_df["os_name"] = os_name
    wide_df["source_file"] = path.name
    return wide_df


def load_os_dataset(os_name: str) -> pd.DataFrame:
    benign_df = load_perf_file(FILE_MAP[os_name]["benign"], "benign", os_name)
    attack_df = load_perf_file(FILE_MAP[os_name]["attack"], "attack", os_name)
    combined = pd.concat([benign_df, attack_df], ignore_index=True)
    combined = combined.sort_values(["label_name", "time_sec"]).reset_index(drop=True)
    return combined
"""
    ),
    code_cell(
        """
ubuntu_raw = load_os_dataset("ubuntu")
fedora_raw = load_os_dataset("fedora")

display(ubuntu_raw.head())
display(fedora_raw.head())

print("Ubuntu shape:", ubuntu_raw.shape)
print("Fedora shape:", fedora_raw.shape)
"""
    ),
    md_cell(
        """
## 4. Data Quality Checks
"""
    ),
    code_cell(
        """
def quality_report(df: pd.DataFrame, name: str) -> pd.DataFrame:
    # This report helps us verify that the ingestion step produced a clean,
    # fully numeric table before we start building ML features.
    report = pd.DataFrame(
        {
            "missing_values": df.isna().sum(),
            "dtype": df.dtypes.astype(str),
        }
    )
    print(f"\\n{name} label counts")
    display(df["label_name"].value_counts())
    print(f"\\n{name} missing values")
    display(report)
    return report


ubuntu_quality = quality_report(ubuntu_raw, "Ubuntu")
fedora_quality = quality_report(fedora_raw, "Fedora")

ubuntu_quality.reset_index().rename(columns={"index": "column"}).to_csv(RESULTS_DIR / "ubuntu_quality_report.csv", index=False)
fedora_quality.reset_index().rename(columns={"index": "column"}).to_csv(RESULTS_DIR / "fedora_quality_report.csv", index=False)
"""
    ),
    md_cell(
        """
## 5. Preprocessing and Feature Engineering

The feature set includes:

- Raw counter values
- Microarchitectural ratios
- First-order temporal differences
- Short rolling statistics
"""
    ),
    code_cell(
        """
def safe_divide(series_a: pd.Series, series_b: pd.Series) -> pd.Series:
    # We explicitly guard against division-by-zero because HPC counters can
    # occasionally produce empty or zero-valued intervals.
    result = series_a.astype(float) / series_b.replace(0, np.nan).astype(float)
    return result.replace([np.inf, -np.inf], np.nan)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    # Feature engineering is where raw HPC values become security-relevant
    # indicators. The ratios below capture behavioral shifts that are harder
    # to see from raw counts alone.
    df = df.copy().sort_values(["label_name", "time_sec"]).reset_index(drop=True)

    for col in RAW_EVENTS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["ipc"] = safe_divide(df["instructions"], df["cycles"])
    df["cpi"] = safe_divide(df["cycles"], df["instructions"])
    df["cache_miss_rate"] = safe_divide(df["cache_misses"], df["cache_references"])
    df["branch_miss_rate"] = safe_divide(df["branch_misses"], df["branches"])
    df["cache_misses_per_kinst"] = safe_divide(df["cache_misses"] * 1000, df["instructions"])
    df["cache_references_per_kinst"] = safe_divide(df["cache_references"] * 1000, df["instructions"])
    df["branches_per_kinst"] = safe_divide(df["branches"] * 1000, df["instructions"])
    df["cycles_per_branch"] = safe_divide(df["cycles"], df["branches"])

    group_key = ["os_name", "label_name"]
    for col in RAW_EVENTS:
        df[f"{col}_diff"] = df.groupby(group_key)[col].diff().fillna(0)

    rolling_features = RAW_EVENTS + ["cache_miss_rate", "branch_miss_rate"]
    for col in rolling_features:
        df[f"{col}_roll_mean_5"] = (
            df.groupby(group_key)[col]
            .transform(lambda s: s.rolling(window=5, min_periods=1).mean())
        )
        df[f"{col}_roll_std_5"] = (
            df.groupby(group_key)[col]
            .transform(lambda s: s.rolling(window=5, min_periods=1).std())
            .fillna(0)
        )

    df = df.replace([np.inf, -np.inf], np.nan)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    return df


ubuntu_df = engineer_features(ubuntu_raw)
fedora_df = engineer_features(fedora_raw)

print("Ubuntu engineered shape:", ubuntu_df.shape)
print("Fedora engineered shape:", fedora_df.shape)
display(ubuntu_df.head())
"""
    ),
    md_cell(
        """
## 6. Exploratory Data Analysis

The following helpers keep visualizations readable for large datasets by sampling when needed.
"""
    ),
    code_cell(
        """
def sampled(df: pd.DataFrame, n: int = 15000) -> pd.DataFrame:
    if len(df) <= n:
        return df.copy()
    return df.sample(n=n, random_state=RANDOM_STATE).sort_values("time_sec")


def run_eda(df: pd.DataFrame, os_name: str):
    sample_df = sampled(df, n=12000)

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))

    sns.countplot(data=df, x="label_name", ax=axes[0, 0], palette="Set2")
    axes[0, 0].set_title(f"{os_name.title()} label distribution")

    sns.boxplot(data=sample_df, x="label_name", y="cache_miss_rate", ax=axes[0, 1], palette="Set2")
    axes[0, 1].set_title(f"{os_name.title()} cache miss rate by class")

    sns.boxplot(data=sample_df, x="label_name", y="branch_miss_rate", ax=axes[1, 0], palette="Set2")
    axes[1, 0].set_title(f"{os_name.title()} branch miss rate by class")

    sns.boxplot(data=sample_df, x="label_name", y="ipc", ax=axes[1, 1], palette="Set2")
    axes[1, 1].set_title(f"{os_name.title()} IPC by class")

    plt.tight_layout()
    save_current_figure(f"{os_name}_eda_core_distributions.png")
    plt.show()

    timeline_cols = ["cache_misses", "cache_references", "cycles", "cache_miss_rate"]
    fig, axes = plt.subplots(len(timeline_cols), 1, figsize=(16, 12), sharex=True)
    for ax, col in zip(axes, timeline_cols):
        for label_name, subset in sample_df.groupby("label_name"):
            subset_sorted = subset.sort_values("time_sec")
            ax.plot(subset_sorted["time_sec"], subset_sorted[col], label=label_name, alpha=0.7)
        ax.set_title(f"{os_name.title()} timeline: {col}")
        ax.legend()
    plt.tight_layout()
    save_current_figure(f"{os_name}_eda_timelines.png")
    plt.show()

    corr_cols = RAW_EVENTS + RATIO_FEATURES
    corr = sample_df[corr_cols + ["label"]].corr(numeric_only=True)
    plt.figure(figsize=(12, 8))
    sns.heatmap(corr, cmap="coolwarm", center=0)
    plt.title(f"{os_name.title()} feature correlation heatmap")
    save_current_figure(f"{os_name}_correlation_heatmap.png")
    plt.show()

    summary = (
        df.groupby("label_name")[RAW_EVENTS + RATIO_FEATURES]
        .agg(["mean", "median", "std"])
        .round(4)
    )
    display(summary)
    summary.to_csv(RESULTS_DIR / f"{os_name}_eda_summary_statistics.csv")
"""
    ),
    code_cell(
        """
run_eda(ubuntu_df, "ubuntu")
"""
    ),
    code_cell(
        """
run_eda(fedora_df, "fedora")
"""
    ),
    md_cell(
        """
## 7. Train/Test Splitting

To reduce temporal leakage, each class is split chronologically: the first 80% for training and the last 20% for testing.
"""
    ),
    code_cell(
        """
META_COLUMNS = ["time_sec", "label", "label_name", "os_name", "source_file"]


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    return [col for col in df.columns if col not in META_COLUMNS]


def temporal_train_test_split(df: pd.DataFrame, test_ratio: float = 0.2):
    # We split chronologically inside each class instead of performing a fully
    # random split. This is more realistic for time-series-like HPC data.
    train_parts = []
    test_parts = []

    for label_name, subset in df.groupby("label_name"):
        subset = subset.sort_values("time_sec").reset_index(drop=True)
        split_idx = int(len(subset) * (1 - test_ratio))
        split_idx = max(split_idx, 1)
        train_parts.append(subset.iloc[:split_idx].copy())
        test_parts.append(subset.iloc[split_idx:].copy())

    train_df = pd.concat(train_parts, ignore_index=True)
    test_df = pd.concat(test_parts, ignore_index=True)

    train_df = train_df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    test_df = test_df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    return train_df, test_df
"""
    ),
    md_cell(
        """
## 8. Classical ML Models
"""
    ),
    code_cell(
        """
def evaluate_predictions(y_true, y_pred, y_score, model_name: str, os_name: str) -> dict:
    # Accuracy alone can be misleading in security detection, so we record
    # precision, recall, F1, and ROC-AUC wherever possible.
    metrics = {
        "os_name": os_name,
        "model": model_name,
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1_score": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_score) if y_score is not None else np.nan,
    }
    return metrics


def plot_confusion(y_true, y_pred, title: str, filename: str):
    cm = confusion_matrix(y_true, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["benign", "attack"])
    disp.plot(cmap="Blues")
    plt.title(title)
    save_current_figure(filename)
    plt.show()


def train_classical_models(df: pd.DataFrame, os_name: str):
    feature_cols = get_feature_columns(df)
    train_df, test_df = temporal_train_test_split(df)

    X_train = train_df[feature_cols]
    y_train = train_df["label"]
    X_test = test_df[feature_cols]
    y_test = test_df["label"]

    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_split=2,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "SVM": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("svc", LinearSVC(class_weight="balanced", random_state=RANDOM_STATE, max_iter=10000)),
            ]
        ),
    }

    trained = {}
    results = []
    reports = {}

    for model_name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        if hasattr(model, "predict_proba"):
            y_score = model.predict_proba(X_test)[:, 1]
        elif hasattr(model, "decision_function"):
            y_score = model.decision_function(X_test)
        else:
            y_score = None

        metrics = evaluate_predictions(y_test, y_pred, y_score, model_name, os_name)
        results.append(metrics)
        trained[model_name] = model
        reports[model_name] = classification_report(
            y_test, y_pred, target_names=["benign", "attack"], zero_division=0
        )

        print(f"\\n{os_name.title()} - {model_name}")
        print(reports[model_name])
        save_text(reports[model_name], f"{os_name}_{slugify(model_name)}_classification_report.txt")
        plot_confusion(
            y_test,
            y_pred,
            f"{os_name.title()} - {model_name}",
            f"{os_name}_{slugify(model_name)}_confusion_matrix.png",
        )

    results_df = pd.DataFrame(results).sort_values("f1_score", ascending=False).reset_index(drop=True)
    return {
        "train_df": train_df,
        "test_df": test_df,
        "feature_cols": feature_cols,
        "models": trained,
        "metrics": results_df,
        "reports": reports,
    }
"""
    ),
    code_cell(
        """
ubuntu_classical = train_classical_models(ubuntu_df, "ubuntu")
display(ubuntu_classical["metrics"])
save_dataframe(ubuntu_classical["metrics"], "ubuntu_classical_metrics.csv")
ubuntu_classical["metrics"].to_csv(ARTIFACTS_DIR / "ubuntu_classical_metrics.csv", index=False)
for model_name, model in ubuntu_classical["models"].items():
    safe_name = model_name.lower().replace(" ", "_")
    joblib.dump(model, ARTIFACTS_DIR / f"ubuntu_{safe_name}.joblib")

# Export feature metadata so the real-time monitor can rebuild exactly the
# same inference input order later on.
(ARTIFACTS_DIR / "ubuntu_feature_columns.json").write_text(
    json.dumps(ubuntu_classical["feature_cols"], indent=2),
    encoding="utf-8",
)
"""
    ),
    code_cell(
        """
fedora_classical = train_classical_models(fedora_df, "fedora")
display(fedora_classical["metrics"])
save_dataframe(fedora_classical["metrics"], "fedora_classical_metrics.csv")
fedora_classical["metrics"].to_csv(ARTIFACTS_DIR / "fedora_classical_metrics.csv", index=False)
for model_name, model in fedora_classical["models"].items():
    safe_name = model_name.lower().replace(" ", "_")
    joblib.dump(model, ARTIFACTS_DIR / f"fedora_{safe_name}.joblib")

(ARTIFACTS_DIR / "fedora_feature_columns.json").write_text(
    json.dumps(fedora_classical["feature_cols"], indent=2),
    encoding="utf-8",
)
"""
    ),
    md_cell(
        """
## 9. CNN-LSTM Hybrid

This section uses temporal sequences instead of independent rows. It is useful for capturing short-term counter dynamics that may distinguish benign execution from cache attack behavior.
"""
    ),
    code_cell(
        """
SEQUENCE_FEATURES = RAW_EVENTS + RATIO_FEATURES
SEQUENCE_LENGTH = 20  # 20 x 50 ms = 1 second windows


def build_sequences(df: pd.DataFrame, feature_cols: list[str], sequence_length: int = SEQUENCE_LENGTH):
    # The CNN-LSTM consumes fixed-length sequences rather than single rows.
    # Each sequence becomes one training example with a binary label.
    sequences = []
    labels = []
    for label_name, subset in df.groupby("label_name"):
        subset = subset.sort_values("time_sec").reset_index(drop=True)
        values = subset[feature_cols].to_numpy(dtype=np.float32)
        label_value = int(subset["label"].iloc[0])
        if len(values) < sequence_length:
            continue
        for idx in range(len(values) - sequence_length + 1):
            sequences.append(values[idx : idx + sequence_length])
            labels.append(label_value)
    return np.array(sequences, dtype=np.float32), np.array(labels, dtype=np.int32)


def build_cnn_lstm(input_shape):
    # A compact hybrid model:
    # - Conv1D extracts local short-range signal patterns
    # - LSTM models temporal evolution over the window
    model = Sequential(
        [
            Conv1D(64, kernel_size=3, activation="relu", padding="same", input_shape=input_shape),
            BatchNormalization(),
            Conv1D(64, kernel_size=3, activation="relu", padding="same"),
            MaxPooling1D(pool_size=2),
            LSTM(64),
            Dense(32, activation="relu"),
            Dropout(0.3),
            Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )
    return model


def train_cnn_lstm(df: pd.DataFrame, os_name: str):
    if not TF_AVAILABLE:
        raise ImportError(f"TensorFlow is not available: {TF_IMPORT_ERROR}")

    train_df, test_df = temporal_train_test_split(df)

    scaler = StandardScaler()
    train_scaled = train_df.copy()
    test_scaled = test_df.copy()

    train_scaled[SEQUENCE_FEATURES] = scaler.fit_transform(train_scaled[SEQUENCE_FEATURES])
    test_scaled[SEQUENCE_FEATURES] = scaler.transform(test_scaled[SEQUENCE_FEATURES])

    X_train_seq, y_train_seq = build_sequences(train_scaled, SEQUENCE_FEATURES)
    X_test_seq, y_test_seq = build_sequences(test_scaled, SEQUENCE_FEATURES)

    model = build_cnn_lstm((X_train_seq.shape[1], X_train_seq.shape[2]))
    early_stop = EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)

    history = model.fit(
        X_train_seq,
        y_train_seq,
        validation_split=0.2,
        epochs=25,
        batch_size=128,
        callbacks=[early_stop],
        verbose=1,
    )

    y_score = model.predict(X_test_seq, verbose=0).ravel()
    y_pred = (y_score >= 0.5).astype(int)

    metrics = evaluate_predictions(y_test_seq, y_pred, y_score, "CNN-LSTM", os_name)
    report_text = classification_report(
        y_test_seq, y_pred, target_names=["benign", "attack"], zero_division=0
    )

    print(f"\\n{os_name.title()} - CNN-LSTM")
    print(report_text)
    save_text(report_text, f"{os_name}_cnn_lstm_classification_report.txt")
    plot_confusion(
        y_test_seq,
        y_pred,
        f"{os_name.title()} - CNN-LSTM",
        f"{os_name}_cnn_lstm_confusion_matrix.png",
    )

    history_df = pd.DataFrame(history.history)
    return {
        "model": model,
        "scaler": scaler,
        "metrics": pd.DataFrame([metrics]),
        "history": history_df,
        "test_labels": y_test_seq,
        "test_scores": y_score,
        "test_predictions": y_pred,
        "report_text": report_text,
    }
"""
    ),
    code_cell(
        """
if TF_AVAILABLE:
    ubuntu_dl = train_cnn_lstm(ubuntu_df, "ubuntu")
    display(ubuntu_dl["metrics"])
    save_dataframe(ubuntu_dl["metrics"], "ubuntu_cnn_lstm_metrics.csv")
    ubuntu_dl["metrics"].to_csv(ARTIFACTS_DIR / "ubuntu_cnn_lstm_metrics.csv", index=False)
    ubuntu_dl["history"].plot(figsize=(12, 4), title="Ubuntu CNN-LSTM training history")
    save_current_figure("ubuntu_cnn_lstm_training_history.png")
    plt.show()
    ubuntu_dl["model"].save(ARTIFACTS_DIR / "ubuntu_cnn_lstm.keras")
    joblib.dump(ubuntu_dl["scaler"], ARTIFACTS_DIR / "ubuntu_cnn_lstm_scaler.joblib")
else:
    print("TensorFlow not available. Run the setup cell, then re-run this section.")
"""
    ),
    code_cell(
        """
if TF_AVAILABLE:
    fedora_dl = train_cnn_lstm(fedora_df, "fedora")
    display(fedora_dl["metrics"])
    save_dataframe(fedora_dl["metrics"], "fedora_cnn_lstm_metrics.csv")
    fedora_dl["metrics"].to_csv(ARTIFACTS_DIR / "fedora_cnn_lstm_metrics.csv", index=False)
    fedora_dl["history"].plot(figsize=(12, 4), title="Fedora CNN-LSTM training history")
    save_current_figure("fedora_cnn_lstm_training_history.png")
    plt.show()
    fedora_dl["model"].save(ARTIFACTS_DIR / "fedora_cnn_lstm.keras")
    joblib.dump(fedora_dl["scaler"], ARTIFACTS_DIR / "fedora_cnn_lstm_scaler.joblib")
else:
    print("TensorFlow not available. Run the setup cell, then re-run this section.")
"""
    ),
    md_cell(
        """
## 10. Per-OS Model Comparison
"""
    ),
    code_cell(
        """
ubuntu_metrics = [ubuntu_classical["metrics"]]
fedora_metrics = [fedora_classical["metrics"]]

if TF_AVAILABLE and "ubuntu_dl" in globals():
    ubuntu_metrics.append(ubuntu_dl["metrics"])
if TF_AVAILABLE and "fedora_dl" in globals():
    fedora_metrics.append(fedora_dl["metrics"])

ubuntu_compare = pd.concat(ubuntu_metrics, ignore_index=True).sort_values("f1_score", ascending=False)
fedora_compare = pd.concat(fedora_metrics, ignore_index=True).sort_values("f1_score", ascending=False)

display(ubuntu_compare)
display(fedora_compare)

save_dataframe(ubuntu_compare, "ubuntu_model_comparison.csv")
save_dataframe(fedora_compare, "fedora_model_comparison.csv")
"""
    ),
    code_cell(
        """
fig, axes = plt.subplots(1, 2, figsize=(14, 5), sharey=True)

sns.barplot(data=ubuntu_compare, x="model", y="f1_score", ax=axes[0], palette="viridis")
axes[0].set_title("Ubuntu model comparison (F1-score)")
axes[0].tick_params(axis="x", rotation=20)

sns.barplot(data=fedora_compare, x="model", y="f1_score", ax=axes[1], palette="magma")
axes[1].set_title("Fedora model comparison (F1-score)")
axes[1].tick_params(axis="x", rotation=20)

plt.tight_layout()
save_current_figure("per_os_model_comparison_f1.png")
plt.show()
"""
    ),
    md_cell(
        """
## 11. Cross-OS Comparison

This table helps compare how the same model family behaves across Ubuntu and Fedora.
"""
    ),
    code_cell(
        """
overall_compare = pd.concat([ubuntu_compare, fedora_compare], ignore_index=True)
display(overall_compare.sort_values(["model", "f1_score"], ascending=[True, False]))

overall_compare.to_csv(ARTIFACTS_DIR / "overall_model_comparison.csv", index=False)
save_dataframe(overall_compare, "overall_model_comparison.csv")
"""
    ),
    code_cell(
        """
plt.figure(figsize=(10, 5))
sns.barplot(data=overall_compare, x="model", y="f1_score", hue="os_name", palette="Set2")
plt.title("Cross-OS model comparison (F1-score)")
plt.xticks(rotation=20)
plt.tight_layout()
save_current_figure("cross_os_model_comparison_f1.png")
plt.show()
"""
    ),
    md_cell(
        """
## 12. Optional Cross-OS Generalization Test

This experiment is useful for your portability objective:

- Train on Ubuntu
- Test on Fedora

It evaluates whether a model trained on one Linux distribution transfers to another without retraining.
"""
    ),
    code_cell(
        """
def cross_os_transfer_train_test(train_df: pd.DataFrame, test_df: pd.DataFrame, model_name: str = "Random Forest"):
    feature_cols = get_feature_columns(train_df)
    X_train = train_df[feature_cols]
    y_train = train_df["label"]
    X_test = test_df[feature_cols]
    y_test = test_df["label"]

    if model_name == "Random Forest":
        model = RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )
    elif model_name == "SVM":
        model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("svc", LinearSVC(class_weight="balanced", random_state=RANDOM_STATE, max_iter=10000)),
            ]
        )
    else:
        raise ValueError("model_name must be 'Random Forest' or 'SVM'")

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    if hasattr(model, "predict_proba"):
        y_score = model.predict_proba(X_test)[:, 1]
    elif hasattr(model, "decision_function"):
        y_score = model.decision_function(X_test)
    else:
        y_score = None

    metrics = evaluate_predictions(y_test, y_pred, y_score, f"{model_name} (Ubuntu->Fedora)", "cross_os")
    report_text = classification_report(y_test, y_pred, target_names=["benign", "attack"], zero_division=0)
    print(report_text)
    save_text(report_text, f"cross_os_{slugify(model_name)}_classification_report.txt")
    plot_confusion(
        y_test,
        y_pred,
        f"{model_name} transfer: Ubuntu train -> Fedora test",
        f"cross_os_{slugify(model_name)}_confusion_matrix.png",
    )
    return metrics


ubuntu_full = ubuntu_df.sort_values(["label_name", "time_sec"]).reset_index(drop=True)
fedora_full = fedora_df.sort_values(["label_name", "time_sec"]).reset_index(drop=True)

transfer_results = pd.DataFrame(
    [
        cross_os_transfer_train_test(ubuntu_full, fedora_full, "Random Forest"),
        cross_os_transfer_train_test(ubuntu_full, fedora_full, "SVM"),
    ]
)

display(transfer_results)
transfer_results.to_csv(ARTIFACTS_DIR / "ubuntu_to_fedora_transfer_metrics.csv", index=False)
save_dataframe(transfer_results, "ubuntu_to_fedora_transfer_metrics.csv")
"""
    ),
    md_cell(
        """
## 13. Runtime Deployment Preparation

The next code cell writes a compact metadata file describing the best available classical model per operating system.
This metadata is meant for the real-time monitor script that you can run separately on AWS.
"""
    ),
    code_cell(
        """
def pick_best_classical_model(metrics_df: pd.DataFrame) -> dict:
    row = metrics_df.sort_values(["f1_score", "accuracy"], ascending=False).iloc[0]
    return {
        "model": row["model"],
        "accuracy": float(row["accuracy"]),
        "precision": float(row["precision"]),
        "recall": float(row["recall"]),
        "f1_score": float(row["f1_score"]),
        "roc_auc": None if pd.isna(row["roc_auc"]) else float(row["roc_auc"]),
    }


runtime_manifest = {
    "ubuntu_best_classical_model": pick_best_classical_model(ubuntu_classical["metrics"]),
    "fedora_best_classical_model": pick_best_classical_model(fedora_classical["metrics"]),
    "raw_events": RAW_EVENTS,
    "ratio_features": RATIO_FEATURES,
    "sequence_features": SEQUENCE_FEATURES,
}

(RESULTS_DIR / "runtime_manifest.json").write_text(json.dumps(runtime_manifest, indent=2), encoding="utf-8")
print(json.dumps(runtime_manifest, indent=2))
print(f"Saved runtime manifest to: {RESULTS_DIR / 'runtime_manifest.json'}")
"""
    ),
    md_cell(
        """
## 14. Final Notes

Recommended reporting flow for your project:

1. Show the raw counter collection methodology.
2. Explain the Ubuntu/Fedora formatting mismatch and your hybrid ingestion engine.
3. Present EDA evidence that attack traces shift cache-related behavior.
4. Compare classical and deep models separately for Ubuntu and Fedora.
5. Use the cross-OS section to discuss portability strengths and limitations.
6. Emphasize F1-score, recall, and false-positive behavior, not only accuracy.

Outputs saved to `results/`:

- EDA plots
- Confusion matrices
- Training history plots
- Per-OS and cross-OS comparison charts
- Summary metric CSV files
- Text classification reports
- Runtime manifest for live deployment

Model artifacts saved to `artifacts/`:

- Classical model `.joblib` files
- CNN-LSTM `.keras` models and scalers when TensorFlow is available
"""
    ),
]


notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.11",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}


output_path = Path(__file__).resolve().parent / "side_channel_attack_detection_pipeline.ipynb"
with output_path.open("w", encoding="utf-8") as handle:
    json.dump(notebook, handle, indent=2)

print(f"Notebook written to: {output_path}")
