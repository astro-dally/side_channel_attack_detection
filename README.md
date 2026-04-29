# 🚀 EdgeShield: Real-Time Side-Channel Detection at the Edge

EdgeShield is an edge-native system for detecting side-channel attacks using hardware performance counter (HPC) signals.  

Instead of running detection in a centralized backend, EdgeShield deploys the entire pipeline on Cloudflare Workers, enabling real-time inference and mitigation directly at the edge.

This project bridges the gap between academic research and practical security systems by turning offline ML pipelines into a deployable, serverless security layer.

---

## 🛡️ EdgeShield

EdgeShield takes the side-channel detection pipeline from research and makes it usable in practice.

We collect hardware performance counter data using Linux `perf`, engineer features like cache miss rate and IPC, and run detection directly at the edge using Cloudflare Workers.

The system processes each request in milliseconds, explains why it was flagged, and can trigger mitigation actions such as rate limiting.

For safe and reproducible demos, EdgeShield includes a simulation layer based on real datasets, while also supporting live ingestion using a perf-based collector.

---

## 🏗️ Architecture

EdgeShield separates data collection from inference and runs detection at the edge:

```text
HPC Data / Simulation
        ↓
Cloudflare Worker (Feature Engineering + Inference)
        ↓
KV (Thresholds + Attacker State)
        ↓
D1 (Detection Logs + Analytics)
        ↓
R2 (Optional Trace Storage)
        ↓
Dashboard (Real-Time Visualization)
```

### Key Idea

Instead of sending data to a backend, detection happens instantly inside Cloudflare Workers, reducing latency and enabling immediate mitigation.

---

## 🌐 Cloudflare Usage

EdgeShield is built entirely on Cloudflare’s edge platform:

- **Workers** → Runs feature engineering and detection logic at the edge  
- **D1** → Stores detection logs and powers dashboard analytics  
- **KV** → Stores thresholds and tracks repeat attacker behavior  
- **R2** → Optional storage for raw traces and replay  

This allows the system to run without any traditional backend infrastructure.

---

## ⚡ Why Edge-Based Detection?

Side-channel attacks operate at extremely small time scales and rely on timing behavior.

Traditional approach:
- Data → Backend → Analysis → Response  
- High latency → delayed detection  

EdgeShield approach:
- Data → Edge → Instant inference  
- Low latency → immediate detection  

Running detection at the edge ensures faster response and reduces the window of exploitation.

---

## ✨ Features

- Real-time side-channel attack detection  
- Edge-native inference using Cloudflare Workers  
- Explainable detection (feature-level insights)  
- Simulation pipeline for reproducible testing  
- Dataset evaluation with accuracy metrics  
- Live dashboard with threat stream visualization  
- Optional raw trace storage and replay  

---

## 🚀 Demo

Run EdgeShield locally:

```bash
cd edgeshield
npm install
npm run dev
```

Open:
`http://localhost:8787`

You can:
- simulate attack and benign traffic
- view real-time detection
- inspect feature-level explanations
- evaluate datasets

---

## 📁 Repository Structure

```text
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

## ⚙️ Getting Started

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

## 📄 Building the Report

The LaTeX paper lives in `report/`. A simple Makefile target compiles it to PDF:

```bash
make pdf
```

The output `report/main.pdf` contains the IEEE-style paper with all figures linked from `Research_Results/`.

---

## 📊 Running the Presentation

Open the HTML deck directly in a browser or serve it locally:

```bash
# Quick local server (Python 3)
python -m http.server --directory presentation 8000
# Then navigate to http://localhost:8000/progress_report_presentation.html
```

Keyboard navigation (←/→ arrows) and the **Previous** / **Next** buttons work out-of-the-box.

---

## 💾 Data & Results

All generated figures are stored under `Research_Results/`. The repository does **not** track the large raw perf logs – they are listed in `.gitignore` to keep the repo lightweight. If you need the raw data, generate it using the scripts in `data_extraction_code/` (see the notebook for the full workflow).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b my-feature`).
3. Make your changes and ensure the LaTeX builds (`make pdf`).
4. Submit a Pull Request.

---

## 📝 License

This project is licensed under the MIT License – see the `LICENSE` file for details.
