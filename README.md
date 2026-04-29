# Side-Channel Attack Detection

## Overview

This repository contains the full code, data, presentation, and research report for the **AI-Based Side-Channel Attack Detection in OS Kernels** project. The work builds a complete pipeline that:

- Collects hardware performance counters (HPC) on Linux (Ubuntu 24.04 LTS, Fedora 40) using `perf` at a 50 ms sampling interval.
- Normalises heterogeneous perf output across distributions.
- Engineers a rich set of temporal and statistical features.
- Trains and evaluates three model families (Random Forest, SVM, CNN-LSTM).
- Provides a real-time runtime monitor for live inference.
- **Features EdgeShield:** A production-grade, edge-native cybersecurity control panel built on Cloudflare Workers for sub-millisecond threat detection and mitigation.

The repository is organised for easy reproducibility and for publishing the results on GitHub.

---
## Repository Structure

```
.
├── edgeshield/                # Edge-native side-channel detection worker & UI dashboard
├── Research_Results/          # Plots, figures, exported CSVs, and PDF report assets
├── data/                      # Raw perf logs (large files – optional, .gitignore recommended)
├── data_extraction_code/      # Scripts for data collection (collector.sh) & C programs (attacker.c, victim.c)
├── documents/                 # Additional project documentation
├── notebooks/                 # Jupyter notebooks (side_channel_attack_detection_pipeline.ipynb, generated HTMLs)
├── presentation/              # HTML slide deck (progress_report_presentation.html) and assets
├── report/                    # IEEE-style LaTeX paper (main.tex) and exported PDFs/HTMLs
├── runtime/                   # Real-time monitoring script (realtime_hpc_monitor.py)
├── generate_presentation.py   # Helper script to (re)generate the HTML deck
├── Makefile                   # Build shortcuts for compiling the LaTeX report
├── README.md                  # This file
├── requirements.txt           # Python package dependencies
├── .gitignore                 # Ignored files & directories
└── LICENSE                    # MIT License
```

---
## Getting Started

### Prerequisites

- **Python 3.11+** with packages listed in `requirements.txt` (`pandas`, `scikit-learn`, `torch`, `torchvision`, `matplotlib`, `seaborn`, `numpy`, `jupyter`).
- **LaTeX** distribution (TeX Live or MiKTeX) with `latexmk` and standard packages (`IEEEtran`, `hyperref`, `graphicx`).
- **Git** for cloning the repository.
- **Node.js & npm** (Required only for running the EdgeShield Cloudflare Worker).

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/side_channel_attack_detection.git
cd side_channel_attack_detection

# Install Python dependencies (prefer a virtual environment)
python -m venv venv
source venv/bin/activate   # on macOS/Linux
pip install -r requirements.txt
```

---
## EdgeShield: Real-Time Side-Channel Attack Detection at the Edge

Side-channel attacks exploit hardware-level behavior such as cache access patterns and timing variations to leak sensitive information without violating traditional access controls. These attacks are difficult to detect because they closely resemble legitimate workloads and often leave no direct trace during execution.

EdgeShield addresses this challenge by transforming side-channel detection into a deployable, real-time system at the edge. We collect hardware performance counter (HPC) data using Linux perf, engineer features such as cache miss rate, IPC, and branch behavior, and build a detection pipeline inspired by machine learning models.

Instead of running this pipeline in a centralized backend, we deploy it using Cloudflare Workers, enabling low-latency inference directly at the edge. The system exposes APIs for real-time analysis, raw perf parsing, simulation, and dataset evaluation. Cloudflare D1 stores detection logs and powers analytics, KV manages thresholds and repeat-attacker state for fast decisions, and R2 can store raw traces for replay and debugging.

By running inference at the edge, EdgeShield achieves sub-10 ms latency and eliminates the need for centralized infrastructure. This is critical because side-channel attacks operate at extremely small time scales, where delayed detection reduces effectiveness.

EdgeShield bridges the gap between academic research and real-world deployment by demonstrating how side-channel attack detection can be implemented as a scalable, serverless, edge-native security system using Cloudflare infrastructure.

### Running the Dashboard

To run the interactive EdgeShield dashboard locally:

```bash
cd edgeshield
npm install
npm run dev
```

Navigate to `http://localhost:8787` to access the premium dark-mode control panel. Features include real-time threat stream visualization, automated mitigation status, and custom dataset evaluation directly at the edge.

---
## Building the Report

The LaTeX paper lives in `report/`. A simple Makefile target compiles it to PDF:

```bash
make pdf
```

The output `report/main.pdf` contains the IEEE-style paper with all figures linked from `Research_Results/`.

---
## Running the Presentation

Open the HTML deck directly in a browser or serve it locally:

```bash
# Quick local server (Python 3)
python -m http.server --directory presentation 8000
# Then navigate to http://localhost:8000/progress_report_presentation.html
```

Keyboard navigation (←/→ arrows) and the **Previous** / **Next** buttons work out-of-the-box.

---
## Data & Results

All generated figures are stored under `Research_Results/`. The repository does **not** track the large raw perf logs – they are listed in `.gitignore` to keep the repo lightweight. If you need the raw data, generate it using the scripts in `data_extraction_code/` (see the notebook for the full workflow).

---
## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b my-feature`).
3. Make your changes and ensure the LaTeX builds (`make pdf`).
4. Submit a Pull Request.

---
## License

This project is licensed under the MIT License – see the `LICENSE` file for details.
