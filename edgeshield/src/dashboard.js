export function renderDashboard() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EdgeShield</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #061018;
      --bg-soft: #0b1d24;
      --panel: rgba(12, 29, 39, 0.72);
      --panel-strong: rgba(15, 42, 53, 0.84);
      --glass: rgba(255, 255, 255, 0.075);
      --line: rgba(168, 255, 221, 0.14);
      --line-strong: rgba(168, 255, 221, 0.28);
      --text: #f2fff9;
      --muted: #a6bdbb;
      --faint: #718987;
      --green: #59f3a7;
      --teal: #5ee7df;
      --blue: #69a8ff;
      --yellow: #ffd66b;
      --red: #ff5f73;
      --orange: #ff9d55;
      --shadow: 0 22px 60px rgba(0, 0, 0, 0.38);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(circle at 18% 12%, rgba(89, 243, 167, 0.16), transparent 30%),
        radial-gradient(circle at 84% 6%, rgba(94, 231, 223, 0.14), transparent 26%),
        linear-gradient(145deg, #050b12 0%, #071821 44%, #10131f 100%);
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(168,255,221,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(168,255,221,0.035) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.95), transparent 86%);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: minmax(260px, 1fr) minmax(260px, 0.9fr) auto;
      gap: 18px;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--line);
      background: rgba(4, 13, 20, 0.78);
      backdrop-filter: blur(18px);
      box-shadow: 0 12px 38px rgba(0,0,0,0.24);
    }
    main {
      position: relative;
      width: min(1500px, calc(100% - 32px));
      margin: 0 auto;
      padding: 18px 0 30px;
      display: grid;
      gap: 14px;
    }
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { font-size: 24px; font-weight: 850; }
    h2 { font-size: 15px; font-weight: 820; }
    h3 { font-size: 13px; color: var(--muted); text-transform: uppercase; }
    button, select, input {
      height: 36px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(255,255,255,0.075);
      color: var(--text);
      font: inherit;
      font-size: 13px;
      font-weight: 760;
      padding: 0 12px;
      transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
    }
    button { cursor: pointer; }
    button:hover { transform: translateY(-1px); border-color: var(--line-strong); background: rgba(255,255,255,0.12); }
    button.primary {
      border-color: transparent;
      color: #03120c;
      background: linear-gradient(135deg, var(--green), var(--teal));
      box-shadow: 0 0 24px rgba(89, 243, 167, 0.22);
    }
    button.danger {
      border-color: rgba(255,95,115,0.34);
      background: rgba(255,95,115,0.12);
      color: #ffd9df;
    }
    select option { color: #09141a; }
    input[type="file"] { padding: 7px 10px; max-width: 280px; }
    .brand { display: grid; gap: 7px; }
    .status-line { display: flex; align-items: center; gap: 9px; color: var(--muted); font-size: 13px; }
    .pulse {
      width: 9px; height: 9px; border-radius: 99px; background: var(--green);
      box-shadow: 0 0 18px var(--green);
      position: relative;
    }
    .pulse::after {
      content: "";
      position: absolute;
      inset: -6px;
      border: 1px solid rgba(89,243,167,0.4);
      border-radius: inherit;
      animation: ping 1.8s infinite ease-out;
    }
    @keyframes ping { from { transform: scale(0.4); opacity: 0.85; } to { transform: scale(1.7); opacity: 0; } }
    .edge-map {
      min-height: 58px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(94,231,223,0.08), rgba(89,243,167,0.04));
      position: relative;
      overflow: hidden;
    }
    .edge-map svg { width: 100%; height: 58px; display: block; opacity: 0.95; }
    .header-actions, .tabs, .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .tabs {
      padding: 3px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: rgba(255,255,255,0.055);
    }
    .tab { border: 0; color: var(--muted); background: transparent; }
    .tab.active { color: #03120c; background: linear-gradient(135deg, var(--green), var(--teal)); }
    .demo-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 26px;
      padding: 0 9px;
      border-radius: 999px;
      color: var(--green);
      background: rgba(89,243,167,0.12);
      border: 1px solid rgba(89,243,167,0.24);
      font-size: 12px;
      font-weight: 820;
    }
    .view { display: none; gap: 14px; }
    .view.active { display: grid; }
    .metrics { display: grid; grid-template-columns: 1.15fr repeat(3, 1fr); gap: 12px; }
    .shell { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr); gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .panel, .metric {
      border: 1px solid var(--line);
      border-radius: 9px;
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(22px);
    }
    .panel { padding: 15px; overflow: hidden; }
    .metric {
      min-height: 116px;
      padding: 15px;
      display: grid;
      align-content: space-between;
      position: relative;
    }
    .metric.primary { background: linear-gradient(145deg, rgba(89,243,167,0.14), rgba(255,255,255,0.06)); }
    .metric::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background: linear-gradient(130deg, rgba(255,255,255,0.08), transparent 38%);
    }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .label { color: var(--muted); font-size: 12px; text-transform: uppercase; font-weight: 850; }
    .value { font-size: 32px; font-weight: 900; letter-spacing: 0; line-height: 1; }
    .subtext { color: var(--faint); font-size: 12px; line-height: 1.35; }
    .trend.up { color: var(--red); }
    .trend.down { color: var(--green); }
    .threat-low { color: var(--green); }
    .threat-medium { color: var(--yellow); }
    .threat-high { color: var(--red); }
    canvas { width: 100%; height: 330px; display: block; border-radius: 8px; background: rgba(255,255,255,0.035); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 11px 9px; border-bottom: 1px solid rgba(168,255,221,0.1); text-align: left; white-space: nowrap; }
    th { color: var(--muted); font-size: 12px; font-weight: 850; }
    tr.attack-row { background: rgba(255,95,115,0.065); }
    .feed { overflow-x: auto; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 25px;
      padding: 0 9px;
      border-radius: 999px;
      font-weight: 850;
    }
    .badge::before { content: ""; width: 7px; height: 7px; border-radius: 99px; background: currentColor; }
    .badge.benign, .badge.allow { color: var(--green); background: rgba(89,243,167,0.13); }
    .badge.attack, .badge.block, .badge.rate_limit { color: var(--red); background: rgba(255,95,115,0.14); }
    .badge.rate_limit { color: var(--orange); background: rgba(255,157,85,0.14); }
    .insights { display: grid; gap: 10px; }
    .insight {
      border: 1px solid rgba(168,255,221,0.12);
      border-radius: 8px;
      background: rgba(255,255,255,0.055);
      padding: 11px;
    }
    .insight-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
    .bar { height: 8px; border-radius: 99px; background: rgba(255,255,255,0.1); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--green), var(--teal)); }
    .bar span.attack { background: linear-gradient(90deg, var(--orange), var(--red)); }
    .matrix {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .cell {
      min-height: 96px;
      border: 1px solid rgba(168,255,221,0.12);
      border-radius: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.055);
      display: grid;
      align-content: space-between;
    }
    .dataset-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .progress { height: 9px; border-radius: 99px; background: rgba(255,255,255,0.1); overflow: hidden; margin-top: 12px; }
    .progress span { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, var(--green), var(--teal)); transition: width 300ms ease; }
    .empty, .notice { color: var(--muted); font-size: 13px; line-height: 1.45; }
    .errors { display: grid; gap: 7px; margin-top: 10px; }
    .error-item { border-left: 3px solid var(--red); padding: 8px 10px; background: rgba(255,95,115,0.1); border-radius: 7px; color: #ffdce1; }
    .importance { display: grid; gap: 12px; }
    .importance-row {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr) 42px;
      gap: 12px;
      align-items: center;
    }
    .category {
      border: 1px solid rgba(168,255,221,0.12);
      border-radius: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.05);
    }
    .tooltip { cursor: help; border-bottom: 1px dotted rgba(255,255,255,0.45); }
    @media (max-width: 1100px) {
      header, .shell, .metrics, .grid-3 { grid-template-columns: 1fr; }
      canvas { height: 280px; }
      main { width: min(100% - 20px, 1500px); }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>EdgeShield</h1>
      <div class="status-line"><span class="pulse"></span><span>Edge Protection Active</span><span id="demoState" class="demo-pill">Demo Mode Active</span></div>
    </div>
    <div class="edge-map" aria-label="Global edge network">
      <svg viewBox="0 0 600 90" role="img">
        <path d="M20 46 C92 18, 146 22, 212 48 S342 74, 412 39 S530 18, 580 42" fill="none" stroke="rgba(94,231,223,.45)" stroke-width="1.5"/>
        <path d="M42 62 C112 38, 178 45, 248 25 S362 20, 442 57 S548 72, 586 48" fill="none" stroke="rgba(89,243,167,.28)" stroke-width="1.2"/>
        <g fill="#59f3a7">
          <circle cx="70" cy="45" r="4"/><circle cx="156" cy="32" r="4"/><circle cx="245" cy="48" r="4"/><circle cx="332" cy="31" r="4"/><circle cx="432" cy="54" r="4"/><circle cx="528" cy="38" r="4"/>
        </g>
        <g fill="none" stroke="#59f3a7" opacity=".35">
          <circle cx="70" cy="45" r="12"/><circle cx="332" cy="31" r="12"/><circle cx="528" cy="38" r="12"/>
        </g>
      </svg>
    </div>
    <div class="header-actions">
      <button id="tick" class="primary">Run Simulation</button>
      <button id="toggle">Pause Traffic</button>
    </div>
  </header>

  <main>
    <nav class="tabs">
      <button class="tab active" data-view="operations">Operations</button>
      <button class="tab" data-view="dataset">Dataset Evaluation</button>
      <button class="tab" data-view="modelView">Model Transparency</button>
    </nav>

    <section id="operations" class="view active">
      <section class="metrics">
        <div class="metric primary">
          <div class="label tooltip" title="Overall posture from recent attack rate and confidence.">Threat Level</div>
          <div class="value" id="threatLevel">Low</div>
          <div class="subtext" id="threatSummary">No active anomaly pattern.</div>
        </div>
        <div class="metric">
          <div class="label tooltip" title="Share of recent samples classified as attacks.">Attack Rate</div>
          <div class="value" id="attackRate">0%</div>
          <div class="subtext"><span id="attackTrend" class="trend down">stable</span></div>
        </div>
        <div class="metric">
          <div class="label tooltip" title="Average model inference time at the edge.">Avg Latency</div>
          <div class="value" id="avgLatency">0 ms</div>
          <div class="subtext">edge inference</div>
        </div>
        <div class="metric">
          <div class="label tooltip" title="Average prediction confidence across recent events.">Detection Certainty</div>
          <div class="value" id="avgConfidence">0%</div>
          <div class="subtext">confidence score</div>
        </div>
      </section>

      <section class="shell">
        <div class="panel">
          <div class="panel-head">
            <div><h2>Real-Time Threat Stream</h2><div class="subtext">Blue indicates benign traffic. Red markers indicate attacks.</div></div>
            <div class="row">
              <button id="exportLiveJson">Export JSON</button>
              <button id="exportLiveCsv">Export CSV</button>
            </div>
          </div>
          <canvas id="threatCanvas" width="900" height="360"></canvas>
        </div>
        <aside class="panel">
          <div class="panel-head"><h2>Why was this flagged?</h2><span id="latestMeta" class="label">waiting</span></div>
          <div id="insights" class="insights"></div>
        </aside>
      </section>

      <section class="shell">
        <div class="panel feed">
          <div class="panel-head"><h2>Live Activity Feed</h2><span id="rowCount" class="label">0 events</span></div>
          <table>
            <thead><tr><th>Time</th><th>Prediction</th><th>Confidence</th><th>Latency</th><th>Action Taken</th></tr></thead>
            <tbody id="feed"></tbody>
          </table>
        </div>
        <aside class="panel">
          <div class="panel-head"><h2>Simulation Control</h2><span class="label">traffic generator</span></div>
          <div class="importance">
            <div>
              <h3>Traffic Type</h3>
              <select id="mode" style="width:100%; margin-top:8px">
                <option value="mixed">Mixed</option>
                <option value="attack">Attack</option>
                <option value="benign">Benign</option>
              </select>
            </div>
            <div>
              <h3>Operating System</h3>
              <select id="os" style="width:100%; margin-top:8px">
                <option value="mixed">Mixed</option>
                <option value="ubuntu">Ubuntu</option>
                <option value="fedora">Fedora</option>
              </select>
            </div>
            <button id="attackCta" class="danger">Start Attack Simulation</button>
          </div>
        </aside>
      </section>
    </section>

    <section id="dataset" class="view">
      <section class="grid-3">
        <div class="metric"><div class="label">Accuracy</div><div class="value" id="evalAccuracy">0%</div><div class="subtext">benchmark</div></div>
        <div class="metric"><div class="label">Detection Rate</div><div class="value" id="evalRecall">0%</div><div class="subtext">attack recall</div></div>
        <div class="metric"><div class="label">False Positives</div><div class="value" id="evalFpr">0%</div><div class="subtext">benign flagged</div></div>
      </section>
      <section class="shell">
        <div class="panel">
          <div class="panel-head">
            <div><h2>Dataset Evaluation</h2><div class="subtext" id="datasetResult">Upload a dataset to evaluate detection performance.</div></div>
            <div class="row">
              <button id="exportDatasetJson">Export JSON</button>
              <button id="exportDatasetCsv">Export CSV</button>
            </div>
          </div>
          <div class="dataset-form">
            <input id="datasetFile" type="file" accept=".csv,.json,text/csv,application/json" />
            <select id="datasetLabel">
              <option value="">Labels in file</option>
              <option value="attack">All attack</option>
              <option value="benign">All benign</option>
            </select>
            <button id="runDataset" class="primary">Evaluate Dataset</button>
          </div>
          <div class="progress"><span id="datasetProgress"></span></div>
          <div id="datasetErrors" class="errors"></div>
          <div class="grid-3" style="margin-top:14px">
            <div class="cell"><div class="label">Rows</div><div class="value" id="datasetRowsEvaluated">0</div></div>
            <div class="cell"><div class="label">Accuracy</div><div class="value" id="datasetAccuracy">0%</div></div>
            <div class="cell"><div class="label">False Positives</div><div class="value" id="datasetFpr">0%</div></div>
          </div>
        </div>
        <aside class="panel">
          <div class="panel-head">
            <h2>Confusion Matrix</h2>
            <div class="row"><button id="exportEvalJson">JSON</button><button id="exportEvalCsv">CSV</button></div>
          </div>
          <div class="matrix">
            <div class="cell"><div class="label">True Positive</div><div class="value" id="tp">0</div></div>
            <div class="cell"><div class="label">False Negative</div><div class="value" id="fn">0</div></div>
            <div class="cell"><div class="label">False Positive</div><div class="value" id="fp">0</div></div>
            <div class="cell"><div class="label">True Negative</div><div class="value" id="tn">0</div></div>
          </div>
        </aside>
      </section>
    </section>

    <section id="modelView" class="view">
      <section class="grid-3">
        <div class="metric"><div class="label">Cache Behavior</div><div class="value" id="cacheImportance">0%</div><div class="subtext">dominant signal group</div></div>
        <div class="metric"><div class="label">Branch Prediction</div><div class="value" id="branchImportance">0%</div><div class="subtext">control-flow signal</div></div>
        <div class="metric"><div class="label">Execution Metrics</div><div class="value" id="execImportance">0%</div><div class="subtext">timing and IPC</div></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Feature Importance</h2><span class="label">interpretable groups</span></div>
        <div id="importance" class="importance"></div>
      </section>
    </section>
  </main>

  <script>
    const state = { rows: [], running: true, persisted: null, evaluation: null, datasetReport: null, previousAttackRate: 0 };
    const $ = (id) => document.getElementById(id);
    const insightCopy = {
      cache_miss_rate: "Unusual cache behavior detected",
      cache_misses_per_kinst: "Cache miss density shifted from normal baseline",
      cache_references_per_kinst: "Cache access pattern matches attack windows",
      cycles_per_branch: "Abnormal timing variance observed",
      branches_per_kinst: "Branch activity resembles attacker traces",
      ipc: "Execution efficiency dropped unexpectedly",
      cache_miss_rate_roll_mean_5: "Sustained cache anomaly across recent windows",
      branch_miss_rate: "Branch prediction behavior is abnormal"
    };
    const groups = {
      "Cache behavior": ["cache_miss_rate", "cache_misses_per_kinst", "cache_references_per_kinst", "cache_miss_rate_roll_mean_5"],
      "Branch prediction": ["branches_per_kinst", "branch_miss_rate"],
      "Execution metrics": ["ipc", "cycles_per_branch"]
    };
    function pct(value) { return value === null || value === undefined ? "n/a" : Math.round(value * 1000) / 10 + "%"; }
    function ms(value) { return Math.round(Number(value || 0)) + " ms"; }
    function safeText(value) { return String(value ?? "").replace(/[&<>]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[c])); }
    function escapeCell(value) { return '"' + String(value ?? "").replaceAll('"', '""') + '"'; }
    function download(name, type, content) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    }
    function rowsToCsv(rows, columns) {
      return [columns.join(","), ...rows.map((row) => columns.map((col) => escapeCell(row[col])).join(","))].join("\\n");
    }
    function actionLabel(action) {
      if (action === "rate_limit") return "Rate Limit";
      if (action === "block") return "Block";
      return "Allow";
    }
    function drawThreatStream(rows) {
      const canvas = $("threatCanvas");
      const ctx = canvas.getContext("2d");
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(168,255,221,0.12)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      if (rows.length < 2) return;
      const series = rows.slice(-80);
      const draw = (getter, color) => {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        series.forEach((row, index) => {
          const x = index * (w / Math.max(1, series.length - 1));
          const y = h - getter(row) * (h - 28) - 14;
          index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      };
      draw((row) => 1 - Number(row.attack_score || 0), "#69a8ff");
      draw((row) => Number(row.attack_score || 0), "#ff5f73");
      series.forEach((row, index) => {
        if (row.prediction !== "attack") return;
        const x = index * (w / Math.max(1, series.length - 1));
        const y = h - Number(row.attack_score || 0) * (h - 28) - 14;
        ctx.fillStyle = "#ff5f73";
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        if (index > series.length - 8) {
          ctx.fillStyle = "rgba(255,95,115,0.92)";
          ctx.font = "12px Inter, sans-serif";
          ctx.fillText("Attack Detected", Math.min(x + 8, w - 110), Math.max(18, y - 10));
        }
      });
    }
    function threatLevel(rate, confidence) {
      if (rate >= 0.45 || confidence >= 0.94 && rate >= 0.28) return ["High", "threat-high", "Active attack pattern detected."];
      if (rate >= 0.18) return ["Medium", "threat-medium", "Anomalies require analyst attention."];
      return ["Low", "threat-low", "No active anomaly pattern."];
    }
    function renderInsights(row) {
      if (!row) return;
      $("latestMeta").textContent = row.prediction === "attack" ? "flagged" : "clear";
      const items = (row.feature_contributions || []).slice(0, 3);
      $("insights").innerHTML = items.length ? items.map((item) => {
        const title = insightCopy[item.feature] || item.label || "Signal changed from baseline";
        const impact = Math.min(100, Math.round(Math.abs(item.impact || 0) / 0.24 * 100));
        const cls = item.impact >= 0 ? "attack" : "";
        return '<div class="insight"><div class="insight-top"><strong>' + safeText(title) + '</strong><span class="label">' + impact + '%</span></div><div class="bar"><span class="' + cls + '" style="width:' + impact + '%"></span></div><div class="subtext" style="margin-top:7px">' + safeText(item.direction === "attack" ? "Contributes to threat score" : "Supports benign classification") + '</div></div>';
      }).join("") : '<div class="empty">No anomaly explanation available for this persisted event. Run a new simulation sample to view live explainability.</div>';
      renderImportance(row);
    }
    function renderImportance(row) {
      const contributions = row?.feature_contributions || [];
      const totals = {};
      Object.keys(groups).forEach((name) => totals[name] = 0);
      contributions.forEach((item) => {
        for (const [name, features] of Object.entries(groups)) {
          if (features.includes(item.feature)) totals[name] += Math.abs(item.impact || 0);
        }
      });
      const max = Math.max(...Object.values(totals), 0.01);
      $("cacheImportance").textContent = pct(totals["Cache behavior"] / max);
      $("branchImportance").textContent = pct(totals["Branch prediction"] / max);
      $("execImportance").textContent = pct(totals["Execution metrics"] / max);
      $("importance").innerHTML = Object.entries(totals).map(([name, value]) => {
        const width = Math.round(value / max * 100);
        return '<div class="category"><div class="importance-row"><strong>' + name + '</strong><div class="bar"><span style="width:' + width + '%"></span></div><span class="label">' + width + '%</span></div><div class="subtext" style="margin-top:8px">' + groups[name].map(safeText).join(", ") + '</div></div>';
      }).join("");
    }
    function renderLive() {
      const rows = state.rows.slice(-100);
      const persistedTotals = state.persisted?.totals;
      const total = Number(persistedTotals?.total ?? rows.length);
      const attacks = Number(persistedTotals?.attacks ?? rows.filter((row) => row.prediction === "attack").length);
      const attackRate = total ? attacks / total : 0;
      const avgLatency = Number(persistedTotals?.avg_latency_ms ?? (rows.length ? rows.reduce((s, r) => s + Number(r.latency_ms || 0), 0) / rows.length : 0));
      const avgConfidence = Number(persistedTotals?.avg_confidence ?? (rows.length ? rows.reduce((s, r) => s + Number(r.confidence || 0), 0) / rows.length : 0));
      const level = threatLevel(attackRate, avgConfidence);
      $("threatLevel").textContent = level[0];
      $("threatLevel").className = "value " + level[1];
      $("threatSummary").textContent = level[2];
      $("attackRate").textContent = pct(attackRate);
      const delta = attackRate - state.previousAttackRate;
      $("attackTrend").textContent = Math.abs(delta) < 0.02 ? "stable" : (delta > 0 ? "increasing" : "decreasing");
      $("attackTrend").className = delta > 0.02 ? "trend up" : "trend down";
      state.previousAttackRate = attackRate;
      $("avgLatency").textContent = ms(avgLatency);
      $("avgConfidence").textContent = pct(avgConfidence);
      $("rowCount").textContent = rows.length + " events";
      drawThreatStream(rows);
      $("feed").innerHTML = rows.slice(-18).reverse().map((row) => {
        const action = row.mitigation?.action || "allow";
        return '<tr class="' + (row.prediction === "attack" ? "attack-row" : "") + '"><td>' + new Date(row.timestamp).toLocaleTimeString() + '</td><td><span class="badge ' + row.prediction + '">' + row.prediction + '</span></td><td>' + pct(row.confidence) + '</td><td>' + ms(row.latency_ms) + '</td><td><span class="badge ' + action + '">' + actionLabel(action) + '</span></td></tr>';
      }).join("");
      renderInsights(rows[rows.length - 1]);
    }
    async function runSample(forcedMode) {
      const selected = forcedMode || $("mode").value;
      const mode = selected === "mixed" ? (Math.random() < 0.38 ? "attack" : "benign") : selected;
      const response = await fetch("/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, os: $("os").value, sourceId: "demo-client" })
      });
      const data = await response.json();
      state.rows.push(data);
      renderLive();
    }
    async function loadPersistedStats() {
      const stats = await fetch("/api/stats").then((res) => res.json());
      if (stats.storage !== "bound" || !Array.isArray(stats.recent)) return;
      state.persisted = stats;
      if (!state.rows.some((row) => row.feature_contributions?.length)) {
        state.rows = stats.recent.slice().reverse().map((row) => ({
          ...row,
          mitigation: { action: row.mitigation_action || "allow" },
          feature_contributions: []
        }));
      }
      renderLive();
    }
    async function loadEvaluation() {
      const report = await fetch("/api/evaluation").then((res) => res.json());
      state.evaluation = report;
      $("evalAccuracy").textContent = pct(report.accuracy);
      $("evalRecall").textContent = pct(report.attack_recall);
      $("evalFpr").textContent = pct(report.false_positive_rate);
      $("tp").textContent = report.confusion_matrix.tp;
      $("tn").textContent = report.confusion_matrix.tn;
      $("fp").textContent = report.confusion_matrix.fp;
      $("fn").textContent = report.confusion_matrix.fn;
    }
    async function runDatasetTest() {
      const file = $("datasetFile").files[0];
      if (!file) {
        $("datasetResult").textContent = "Upload a dataset to evaluate detection performance.";
        return;
      }
      $("datasetProgress").style.width = "38%";
      const label = $("datasetLabel").value;
      const isJson = file.name.toLowerCase().endsWith(".json");
      const body = await file.text();
      const url = label ? "/dataset/test?label=" + encodeURIComponent(label) : "/dataset/test";
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": isJson ? "application/json" : "text/csv" },
        body: isJson && label ? JSON.stringify({ ...JSON.parse(body), label }) : body
      });
      $("datasetProgress").style.width = "100%";
      const report = await response.json();
      state.datasetReport = report;
      $("datasetResult").textContent = response.ok ? "Evaluated " + report.evaluated_rows + " of " + report.total_rows + " rows." : report.message || report.error;
      $("datasetRowsEvaluated").textContent = String(report.evaluated_rows || 0);
      $("datasetAccuracy").textContent = pct(report.accuracy);
      $("datasetFpr").textContent = pct(report.false_positive_rate);
      $("datasetErrors").innerHTML = (report.validation_errors || []).map((error) => '<div class="error-item">' + safeText(error) + '</div>').join("");
      setTimeout(() => { $("datasetProgress").style.width = "0%"; }, 1200);
    }
    function exportLive(format) {
      const rows = state.rows.slice(-100);
      if (format === "json") download("edgeshield-live.json", "application/json", JSON.stringify(rows, null, 2));
      else download("edgeshield-live.csv", "text/csv", rowsToCsv(rows, ["timestamp","prediction","confidence","attack_score","latency_ms","worker_latency_ms"]));
    }
    function exportEvaluation(format) {
      if (!state.evaluation) return;
      if (format === "json") download("edgeshield-evaluation.json", "application/json", JSON.stringify(state.evaluation, null, 2));
      else {
        const rows = Object.entries(state.evaluation.by_dataset || {}).map(([dataset, row]) => ({ dataset, ...row }));
        download("edgeshield-evaluation.csv", "text/csv", rowsToCsv(rows, ["dataset","rows","accuracy","attack_recall","false_positive_rate","avg_worker_latency_ms"]));
      }
    }
    function exportDataset(format) {
      if (!state.datasetReport) return;
      if (format === "json") download("edgeshield-dataset-test.json", "application/json", JSON.stringify(state.datasetReport, null, 2));
      else download("edgeshield-dataset-test.csv", "text/csv", rowsToCsv(state.datasetReport.sample_results || [], ["index","expected","predicted","confidence","attack_score"]));
    }
    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.view).classList.add("active");
      });
    });
    $("tick").addEventListener("click", () => runSample());
    $("attackCta").addEventListener("click", () => { $("mode").value = "attack"; runSample("attack"); });
    $("toggle").addEventListener("click", () => {
      state.running = !state.running;
      $("toggle").textContent = state.running ? "Pause Traffic" : "Resume Traffic";
      $("demoState").textContent = state.running ? "Demo Mode Active" : "Traffic Paused";
    });
    $("exportLiveJson").addEventListener("click", () => exportLive("json"));
    $("exportLiveCsv").addEventListener("click", () => exportLive("csv"));
    $("exportEvalJson").addEventListener("click", () => exportEvaluation("json"));
    $("exportEvalCsv").addEventListener("click", () => exportEvaluation("csv"));
    $("exportDatasetJson").addEventListener("click", () => exportDataset("json"));
    $("exportDatasetCsv").addEventListener("click", () => exportDataset("csv"));
    $("runDataset").addEventListener("click", () => runDatasetTest().catch((error) => {
      $("datasetResult").textContent = error.message;
      $("datasetProgress").style.width = "0%";
    }));
    setInterval(() => { if (state.running) runSample().catch(console.error); }, 1200);
    setInterval(() => { loadPersistedStats().catch(console.error); }, 7000);
    loadEvaluation().catch(console.error);
    loadPersistedStats().catch(console.error);
    runSample().catch(console.error);
  </script>
</body>
</html>`;
}
