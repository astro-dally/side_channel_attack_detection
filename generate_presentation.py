import os

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI for OS-Level Side-Channel Attack Detection</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0a0e27;
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
            --accent-primary: #0ea5e9;
            --accent-secondary: #2dd4bf;
            --accent-gradient: linear-gradient(135deg, #0ea5e9, #2dd4bf);
            --panel-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
            --glass-blur: blur(12px);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(45, 212, 191, 0.15) 0%, transparent 50%);
        }

        .presentation-container {
            width: 90vw;
            height: 85vh;
            max-width: 1400px;
            position: relative;
            background: var(--panel-bg);
            backdrop-filter: var(--glass-blur);
            -webkit-backdrop-filter: var(--glass-blur);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            background: rgba(15, 23, 42, 0.5);
        }

        .header-title {
            font-size: 1.2rem;
            font-weight: 600;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .slide-counter {
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .slide-container {
            flex-grow: 1;
            position: relative;
            overflow-y: auto;
            padding: 40px;
        }

        .slide {
            display: none;
            height: 100%;
            animation: fadeIn 0.5s ease-out forwards;
        }

        .slide.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h1 {
            font-size: 3.5rem;
            margin-bottom: 20px;
            font-weight: 800;
            line-height: 1.2;
        }

        h2 {
            font-size: 2.5rem;
            margin-bottom: 30px;
            color: var(--accent-secondary);
            font-weight: 600;
        }

        h3 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: var(--accent-primary);
        }

        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 20px;
            color: var(--text-muted);
        }

        ul, ol {
            font-size: 1.2rem;
            line-height: 1.8;
            margin-left: 30px;
            margin-bottom: 20px;
            color: var(--text-muted);
        }

        li {
            margin-bottom: 10px;
        }

        .controls {
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid var(--border-color);
            background: rgba(15, 23, 42, 0.5);
        }

        button {
            background: transparent;
            border: 1px solid var(--accent-primary);
            color: var(--accent-primary);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        button:hover {
            background: var(--accent-primary);
            color: #fff;
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.5);
        }

        button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: transparent;
            box-shadow: none;
        }

        /* Utility Classes */
        .flex-row { display: flex; gap: 30px; }
        .flex-col { display: flex; flex-direction: column; gap: 20px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .center-content { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; }
        
        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 25px;
            transition: transform 0.3s ease;
        }
        
        .card:hover { transform: translateY(-5px); border-color: var(--accent-primary); }

        .chip {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            background: rgba(14, 165, 233, 0.1);
            border: 1px solid rgba(14, 165, 233, 0.3);
            color: var(--accent-primary);
            font-size: 0.9rem;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th { color: var(--accent-secondary); font-weight: 600; }
        
        /* Architecture Animation CSS */
        .arch-pipeline {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            padding: 20px;
        }
        
        .arch-node {
            background: linear-gradient(90deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%);
            border: 1px solid var(--accent-primary);
            padding: 15px 40px;
            border-radius: 8px;
            min-width: 400px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateY(20px);
        }
        
        .arch-connector {
            width: 4px;
            height: 30px;
            background: var(--text-muted);
            opacity: 0;
        }
        
        .slide.active .arch-node { animation: nodeIn 0.5s forwards; }
        .slide.active .arch-connector { animation: fadeConnector 0.5s forwards; }
        
        .slide.active .arch-node:nth-child(1) { animation-delay: 0.2s; }
        .slide.active .arch-connector:nth-child(2) { animation-delay: 0.5s; }
        .slide.active .arch-node:nth-child(3) { animation-delay: 0.7s; }
        .slide.active .arch-connector:nth-child(4) { animation-delay: 1.0s; }
        .slide.active .arch-node:nth-child(5) { animation-delay: 1.2s; }
        .slide.active .arch-connector:nth-child(6) { animation-delay: 1.5s; }
        .slide.active .arch-node:nth-child(7) { animation-delay: 1.7s; }
        .slide.active .arch-connector:nth-child(8) { animation-delay: 2.0s; }
        .slide.active .arch-node:nth-child(9) { animation-delay: 2.2s; }

        @keyframes nodeIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeConnector {
            0% { opacity: 0; background: var(--text-muted); }
            50% { opacity: 1; background: var(--accent-primary); }
            100% { opacity: 1; background: var(--accent-gradient); box-shadow: 0 0 10px var(--accent-primary); }
        }

        /* CNN-LSTM CSS */
        .cnn-layer {
            border-left: 4px solid var(--accent-primary);
        }
        .cnn-layer.pool { border-color: var(--text-muted); }
        .cnn-layer.lstm { border-color: #a855f7; }
        .cnn-layer.dense { border-color: #f59e0b; }
        .cnn-layer.out { border-color: #10b981; }

        /* Images and Lightbox */
        .img-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .res-img { width: 100%; border-radius: 8px; cursor: zoom-in; transition: transform 0.2s; border: 1px solid var(--border-color); }
        .res-img:hover { transform: scale(1.02); border-color: var(--accent-primary); }
        
        #lightbox {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; cursor: zoom-out;
        }
        #lightbox img { max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.5); }
        #lightbox.active { display: flex; }

    </style>
</head>
<body>

<div id="lightbox" onclick="this.classList.remove('active')">
    <img id="lightbox-img" src="" alt="Zoomed image">
</div>

<div class="presentation-container">
    <div class="header">
        <div class="header-title">Side-Channel Detection Platform</div>
        <div class="slide-counter">Slide <span id="current-slide">1</span> / <span id="total-slides">13</span></div>
    </div>

    <div class="slide-container">
        
        <!-- Slide 1: Title -->
        <div class="slide active">
            <div class="center-content">
                <h1>AI for OS-Level Side-Channel Attack Detection</h1>
                <p style="font-size: 1.5rem; color: var(--accent-primary);">and Mitigation in Linux Kernels</p>
                
                <div class="card" style="margin-top: 40px; text-align: left; max-width: 500px;">
                    <h3>Student Information</h3>
                    <p><strong>Name:</strong> [Your Name]</p>
                    <p><strong>Roll No:</strong> [Your Roll Number]</p>
                    <p><strong>Institution:</strong> [Your Department / Institution]</p>
                </div>
                
                <div style="margin-top: 40px;">
                    <span class="chip">Hardware Performance Counters</span>
                    <span class="chip">Machine Learning</span>
                    <span class="chip">Linux Kernel</span>
                    <span class="chip">CNN-LSTM</span>
                </div>
            </div>
        </div>

        <!-- Slide 2: Table of Contents -->
        <div class="slide">
            <h2>Agenda</h2>
            <div class="grid-2">
                <div class="card">
                    <h3>1. Context & Objectives</h3>
                    <ul>
                        <li>Problem Description</li>
                        <li>Project Objectives</li>
                    </ul>
                </div>
                <div class="card">
                    <h3>2. System Architecture</h3>
                    <ul>
                        <li>Methodology Pipeline</li>
                        <li>Architectural Design</li>
                        <li>CNN-LSTM Model</li>
                    </ul>
                </div>
                <div class="card">
                    <h3>3. Experimental Data</h3>
                    <ul>
                        <li>Complexity Analysis</li>
                        <li>Setup & Telemetry</li>
                    </ul>
                </div>
                <div class="card">
                    <h3>4. Findings & Conclusion</h3>
                    <ul>
                        <li>Results & Generalization</li>
                        <li>Limitations & Future Work</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Slide 3: Problem Description -->
        <div class="slide">
            <h2>The Threat Landscape</h2>
            <div class="grid-2">
                <div>
                    <p>Microarchitectural side-channel attacks leak sensitive information by observing shared hardware behavior rather than bypassing software isolation.</p>
                    <div class="card" style="margin-top: 20px;">
                        <h3 style="color: #ef4444;">The Challenge</h3>
                        <p>The OS kernel enforces correct privilege boundaries but remains blind to information leakage happening in the hardware caches.</p>
                    </div>
                </div>
                <div>
                    <h3>Our Approach</h3>
                    <ul>
                        <li>Leverage <strong>Hardware Performance Counters (HPCs)</strong> via Linux <code>perf</code>.</li>
                        <li>Capture micro-architectural noise (cache misses, branch predictions).</li>
                        <li>Use Machine Learning to detect the "fingerprint" of an attack in real-time.</li>
                        <li>Distinguish benign system jitter from active cache eviction.</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Slide 4: Objectives -->
        <div class="slide">
            <h2>Project Objectives Review</h2>
            <div class="card">
                <table>
                    <tr>
                        <th>Objective</th>
                        <th>Status</th>
                        <th>Outcome</th>
                    </tr>
                    <tr>
                        <td>1. HPC Extraction</td>
                        <td><span style="color: #10b981;">✔ Met</span></td>
                        <td>Extracted 6 core counters using <code>perf</code>.</td>
                    </tr>
                    <tr>
                        <td>2. Multi-OS Pipeline</td>
                        <td><span style="color: #10b981;">✔ Met</span></td>
                        <td>Hybrid parser handles Ubuntu & Fedora traces.</td>
                    </tr>
                    <tr>
                        <td>3. Core Models</td>
                        <td><span style="color: #10b981;">✔ Met</span></td>
                        <td>Trained Random Forest, SVM, and CNN-LSTM.</td>
                    </tr>
                    <tr>
                        <td>4. Cross-OS Testing</td>
                        <td><span style="color: #10b981;">✔ Met</span></td>
                        <td>Proven 99.3%+ transferability (Ubuntu → Fedora).</td>
                    </tr>
                    <tr>
                        <td>5. Real-Time Deployment</td>
                        <td><span style="color: #10b981;">✔ Met</span></td>
                        <td>Sliding-window monitor script developed.</td>
                    </tr>
                    <tr>
                        <td>6. Evasion Resistance</td>
                        <td><span style="color: #f59e0b;">Extension</span></td>
                        <td>Requires dedicated adversarial stress-testing.</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Slide 5: Methodology -->
        <div class="slide">
            <h2>Methodology Workflow</h2>
            <p>Our detection framework operates through a continuous 5-stage pipeline:</p>
            
            <div class="flex-col" style="margin-top: 30px;">
                <div class="card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 2rem; color: var(--accent-primary); font-weight: bold;">1</div>
                    <div>
                        <h3>Telemetry Collection</h3>
                        <p style="margin:0;">Sampling HPCs at 50ms intervals ensuring PID-level isolation.</p>
                    </div>
                </div>
                <div class="card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 2rem; color: var(--accent-primary); font-weight: bold;">2</div>
                    <div>
                        <h3>Data Normalization</h3>
                        <p style="margin:0;">10ms Bucket Rounding to align asynchronous events and hybrid parsing.</p>
                    </div>
                </div>
                <div class="card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 2rem; color: var(--accent-primary); font-weight: bold;">3</div>
                    <div>
                        <h3>Feature Engineering</h3>
                        <p style="margin:0;">Constructing 36 temporal features (rates, ratios, rolling statistics).</p>
                    </div>
                </div>
                <div class="card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 2rem; color: var(--accent-primary); font-weight: bold;">4</div>
                    <div>
                        <h3>Model Inference</h3>
                        <p style="margin:0;">Evaluating traces via RF, SVM, and CNN-LSTM architectures.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slide 6: Architecture Diagram -->
        <div class="slide">
            <h2>System Architecture</h2>
            <div class="arch-pipeline">
                <div class="arch-node">Attacker / Victim Workloads</div>
                <div class="arch-connector"></div>
                <div class="arch-node">Linux <code>perf</code> Collector (50ms)</div>
                <div class="arch-connector"></div>
                <div class="arch-node">Hybrid Parser & Bucket Normalizer</div>
                <div class="arch-connector"></div>
                <div class="arch-node">Temporal Feature Engine</div>
                <div class="arch-connector"></div>
                <div class="arch-node">ML Classifier (RF / SVM / CNN-LSTM)</div>
            </div>
        </div>

        <!-- Slide 7: CNN-LSTM Diagram -->
        <div class="slide">
            <h2>CNN-LSTM Architecture</h2>
            <div class="grid-2">
                <div>
                    <p>Designed to capture both spatial signatures of cache contention and temporal progression across 1-second windows.</p>
                    <div class="arch-pipeline" style="transform: scale(0.85); transform-origin: top left; padding: 0;">
                        <div class="arch-node cnn-layer">Input: (20 timesteps × 14 features)</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer">Conv1D(64) + BatchNorm</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer">Conv1D(64)</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer pool">MaxPool1D(2)</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer lstm">LSTM(64 units)</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer dense">Dense(32) + Dropout(0.3)</div>
                        <div class="arch-connector"></div>
                        <div class="arch-node cnn-layer out">Dense(1, Sigmoid) → Output</div>
                    </div>
                </div>
                <div>
                    <h3>Layer Purpose</h3>
                    <ul style="font-size: 1rem;">
                        <li><strong>Conv1D:</strong> Extracts local short-range signal patterns.</li>
                        <li><strong>BatchNorm:</strong> Stabilizes training activations.</li>
                        <li><strong>MaxPool:</strong> Reduces temporal resolution 2×.</li>
                        <li><strong>LSTM:</strong> Models temporal evolution of cache contention.</li>
                        <li><strong>Dense:</strong> Non-linear classification head.</li>
                    </ul>
                    <div class="card" style="margin-top: 20px;">
                        <img src="../Research_Results/ubuntu_cnn_lstm_training_history.png" class="res-img" onclick="openLightbox(this.src)">
                    </div>
                </div>
            </div>
        </div>

        <!-- Slide 8: Complexity Analysis -->
        <div class="slide">
            <h2>Complexity Analysis</h2>
            <div class="card">
                <table>
                    <tr>
                        <th>Phase</th>
                        <th>Time Complexity</th>
                        <th>Space Complexity</th>
                        <th>Dominant Factor</th>
                    </tr>
                    <tr>
                        <td>Data Ingestion</td>
                        <td>O(N)</td>
                        <td>O(N)</td>
                        <td>String parsing regex</td>
                    </tr>
                    <tr>
                        <td>Feature Engineering</td>
                        <td>O(N × F)</td>
                        <td>O(N × F)</td>
                        <td>Rolling window math</td>
                    </tr>
                    <tr>
                        <td>Random Forest Training</td>
                        <td>O(T × N log N × F)</td>
                        <td>O(T × Nodes)</td>
                        <td>Tree depth and sample size</td>
                    </tr>
                    <tr>
                        <td>CNN-LSTM Training</td>
                        <td>O(E × N × C)</td>
                        <td>O(Weights)</td>
                        <td>Convolutions per epoch</td>
                    </tr>
                    <tr>
                        <td>Runtime Inference</td>
                        <td>O(W × F)</td>
                        <td>O(W × F)</td>
                        <td>Buffering history arrays</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; font-size: 0.9rem;"><em>N = Samples, F = Features, T = Trees, E = Epochs, W = Window Size</em></p>
            </div>
        </div>

        <!-- Slide 9: Experimental Setup -->
        <div class="slide">
            <h2>Experimental Dataset Setup</h2>
            <div class="grid-2">
                <div class="flex-col">
                    <div class="card">
                        <h3>Ubuntu 24.04 LTS</h3>
                        <p style="font-size: 2.5rem; font-weight: bold; color: var(--accent-primary); margin: 0;">150,519</p>
                        <p style="margin:0;">Total Samples (77k Attack / 73k Benign)</p>
                    </div>
                    <div class="card">
                        <h3>Fedora 40</h3>
                        <p style="font-size: 2.5rem; font-weight: bold; color: var(--accent-secondary); margin: 0;">59,020</p>
                        <p style="margin:0;">Total Samples (23k Attack / 35k Benign)</p>
                    </div>
                </div>
                <div>
                    <img src="../Research_Results/ubuntu_correlation_heatmap.png" class="res-img" onclick="openLightbox(this.src)" alt="Feature Correlation">
                    <p style="text-align: center; font-size: 0.9rem; margin-top: 10px;">Ubuntu Feature Correlation Heatmap</p>
                </div>
            </div>
        </div>

        <!-- Slide 10: Results & Analysis -->
        <div class="slide">
            <h2>Primary Results Analysis</h2>
            <div class="grid-2">
                <div>
                    <table style="font-size: 0.9rem;">
                        <tr>
                            <th>OS</th>
                            <th>Model</th>
                            <th>Accuracy</th>
                            <th>F1-Score</th>
                        </tr>
                        <tr>
                            <td>Ubuntu</td>
                            <td>Random Forest</td>
                            <td>99.95%</td>
                            <td>0.9995</td>
                        </tr>
                        <tr>
                            <td>Ubuntu</td>
                            <td>SVM</td>
                            <td>99.90%</td>
                            <td>0.9990</td>
                        </tr>
                        <tr>
                            <td>Ubuntu</td>
                            <td>CNN-LSTM</td>
                            <td>99.65%</td>
                            <td>0.9966</td>
                        </tr>
                        <tr>
                            <td>Fedora</td>
                            <td>All Models</td>
                            <td>100%</td>
                            <td>1.0000</td>
                        </tr>
                    </table>
                </div>
                <div class="img-grid">
                    <img src="../Research_Results/ubuntu_random_forest_confusion_matrix.png" class="res-img" onclick="openLightbox(this.src)" alt="Ubuntu RF Confusion Matrix">
                    <img src="../Research_Results/per_os_model_comparison_f1.png" class="res-img" onclick="openLightbox(this.src)" alt="F1 Comparison">
                </div>
            </div>
        </div>

        <!-- Slide 11: Challenges -->
        <div class="slide">
            <h2>Cross-OS Generalization</h2>
            <p>To prove distribution portability, models trained exclusively on Ubuntu traces were evaluated against unseen Fedora traces.</p>
            <div class="grid-2">
                <div class="card">
                    <h3>Transfer Metrics (Ubuntu → Fedora)</h3>
                    <table style="font-size: 0.9rem;">
                        <tr>
                            <th>Model</th>
                            <th>Accuracy</th>
                            <th>F1-Score</th>
                        </tr>
                        <tr>
                            <td>Random Forest</td>
                            <td>99.36%</td>
                            <td>0.9919</td>
                        </tr>
                        <tr>
                            <td>SVM</td>
                            <td>99.97%</td>
                            <td>0.9996</td>
                        </tr>
                    </table>
                    <p style="margin-top: 15px; font-size: 0.95rem;">The SVM model demonstrated exceptional resilience to underlying OS distribution differences.</p>
                </div>
                <div>
                    <img src="../Research_Results/cross_os_random_forest_confusion_matrix.png" class="res-img" onclick="openLightbox(this.src)">
                </div>
            </div>
        </div>

        <!-- Slide 12: Conclusion -->
        <div class="slide">
            <h2>Conclusion & Future Work</h2>
            <div class="grid-2">
                <div>
                    <h3>Key Takeaways</h3>
                    <ul>
                        <li>Hardware Performance Counters provide a highly accurate side-channel signature.</li>
                        <li>Machine Learning effectively isolates attack noise from benign OS jitter.</li>
                        <li>The signatures generalize extremely well across Linux distributions (Ubuntu/Fedora).</li>
                    </ul>
                </div>
                <div>
                    <h3>Future Research Avenues</h3>
                    <ul>
                        <li><strong>Adversarial Evasion:</strong> Stress-testing against polymorphic or "low-and-slow" attacks.</li>
                        <li><strong>Cross-Architecture:</strong> Extending pipeline to ARM/Android environments.</li>
                        <li><strong>Live Workload Testing:</strong> Profiling monitor overhead on cloud instances (e.g., AWS EC2).</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Slide 13: References -->
        <div class="slide">
            <h2>References</h2>
            <ol style="font-size: 0.95rem; line-height: 1.5; color: var(--text-muted);">
                <li>P. Kocher et al., "Spectre Attacks: Exploiting Speculative Execution," 2019.</li>
                <li>M. Lipp et al., "Meltdown: Reading Kernel Memory from User Space," 2018.</li>
                <li>Y. Yarom and K. Falkner, "FLUSH+RELOAD: a High Resolution, Low Noise, L3 Cache Side-Channel Attack," USENIX, 2014.</li>
                <li>F. Liu et al., "Last-Level Cache Side-Channel Attacks are Practical," IEEE S&P, 2015.</li>
                <li>"Linux Perf Event Features and Design," Kernel.org Documentation.</li>
                <li>Intel Corporation, "Intel 64 and IA-32 Architectures Software Developer’s Manual."</li>
                <li>M. Musleh et al., "Detecting Cache-Based Side-Channel Attacks Using Hardware Performance Counters," IEEE HOST, 2018.</li>
                <li>R. Benadjila et al., "A Survey of Deep Learning for Side-Channel Analysis," 2020.</li>
                <li>A. S. Tanenbaum and H. Bos, "Modern Operating Systems (4th Edition)."</li>
            </ol>
        </div>

    </div>

    <div class="controls">
        <button id="prevBtn" onclick="changeSlide(-1)" disabled>← Previous</button>
        <button id="nextBtn" onclick="changeSlide(1)">Next →</button>
    </div>
</div>

<script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    
    document.getElementById('total-slides').innerText = totalSlides;

    function updateSlides() {
        slides.forEach((slide, index) => {
            if(index === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        document.getElementById('current-slide').innerText = currentSlide + 1;
        document.getElementById('prevBtn').disabled = currentSlide === 0;
        document.getElementById('nextBtn').disabled = currentSlide === totalSlides - 1;
    }

    function changeSlide(direction) {
        currentSlide += direction;
        if (currentSlide < 0) currentSlide = 0;
        if (currentSlide >= totalSlides) currentSlide = totalSlides - 1;
        updateSlides();
    }
    
    document.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowRight' || e.key === 'Space') changeSlide(1);
        if(e.key === 'ArrowLeft') changeSlide(-1);
    });

    function openLightbox(src) {
        document.getElementById('lightbox-img').src = src;
        document.getElementById('lightbox').classList.add('active');
    }
</script>

</body>
</html>
"""

with open('/Users/dally/side_channel_attack_detection/presentation/progress_report_presentation.html', 'w') as f:
    f.write(HTML_CONTENT)
    print("Done")
