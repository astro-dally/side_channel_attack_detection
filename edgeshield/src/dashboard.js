export function renderDashboard() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:," />
  <title>EdgeShield</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07090d;
      --surface: #0d1118;
      --surface-2: #111823;
      --surface-3: #17202c;
      --line: rgba(221, 231, 255, 0.12);
      --line-strong: rgba(221, 231, 255, 0.22);
      --text: #f5f7fb;
      --muted: #9ea9b8;
      --faint: #6f7b8a;
      --green: #4ade80;
      --teal: #2dd4bf;
      --blue: #60a5fa;
      --amber: #f59e0b;
      --red: #fb7185;
      --violet: #a78bfa;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
      --radius: 8px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(96,165,250,0.08), transparent 260px),
        linear-gradient(135deg, #07090d 0%, #0a1017 44%, #100f16 100%);
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(221,231,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(221,231,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      opacity: 0.48;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 84%);
    }
    button, select, input {
      height: 36px;
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(255,255,255,0.055);
      color: var(--text);
      font: inherit;
      font-size: 13px;
      font-weight: 720;
      padding: 0 12px;
      letter-spacing: 0;
    }
    button {
      cursor: pointer;
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
    }
    button:hover { transform: translateY(-1px); border-color: var(--line-strong); background: rgba(255,255,255,0.095); }
    button.primary { color: #04110b; border-color: transparent; background: linear-gradient(135deg, var(--green), var(--teal)); }
    button.danger { color: #ffe6ea; border-color: rgba(251,113,133,0.38); background: rgba(251,113,133,0.14); }
    button.ghost { color: var(--muted); background: transparent; }
    select option { color: #0b1117; }
    input[type="file"] { width: min(100%, 310px); padding: 7px 10px; }
    h1, h2, h3, p { margin: 0; letter-spacing: 0; }
    h1 { font-size: 23px; font-weight: 860; line-height: 1.08; }
    h2 { font-size: 15px; font-weight: 820; }
    h3 { font-size: 12px; color: var(--muted); text-transform: uppercase; font-weight: 820; }
    code {
      color: #b7f7db;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
      word-break: break-word;
    }
    .app {
      position: relative;
      width: min(1540px, calc(100% - 28px));
      margin: 0 auto;
      padding: 16px 0 28px;
      display: grid;
      gap: 14px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: minmax(300px, 0.85fr) minmax(420px, 1.15fr) auto;
      gap: 14px;
      align-items: center;
      margin: 0 calc((100vw - min(1540px, calc(100vw - 28px))) / -2);
      padding: 13px max(14px, calc((100vw - 1540px) / 2 + 14px));
      border-bottom: 1px solid var(--line);
      background: rgba(7, 9, 13, 0.86);
      backdrop-filter: blur(18px);
    }
    .brand { display: grid; gap: 6px; }
    .eyebrow, .label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-line, .row, .actions, .tabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .status-line { color: var(--muted); font-size: 13px; }
    .pulse {
      width: 9px;
      height: 9px;
      border-radius: 99px;
      background: var(--green);
      box-shadow: 0 0 18px rgba(74,222,128,0.8);
      animation: beat 1.5s ease-in-out infinite;
    }
    @keyframes beat {
      0%, 100% { transform: scale(0.82); opacity: 0.72; }
      50% { transform: scale(1.15); opacity: 1; }
    }
    .edge-strip {
      height: 62px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(135deg, rgba(45,212,191,0.09), rgba(167,139,250,0.06));
      overflow: hidden;
      position: relative;
    }
    .edge-strip::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 120px;
      left: -140px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
      animation: sweep 3.2s linear infinite;
    }
    @keyframes sweep { to { left: calc(100% + 140px); } }
    .edge-strip svg { width: 100%; height: 62px; display: block; }
    .edge-node { fill: var(--green); }
    .edge-node.hot { fill: var(--red); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 26px;
      padding: 0 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255,255,255,0.045);
      font-size: 12px;
      font-weight: 760;
      white-space: nowrap;
    }
    .pill.live { color: #bfffe0; border-color: rgba(74,222,128,0.26); background: rgba(74,222,128,0.09); }
    .pill.warn { color: #ffdde3; border-color: rgba(251,113,133,0.3); background: rgba(251,113,133,0.1); }
    .tabs {
      padding: 4px;
      width: fit-content;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: rgba(255,255,255,0.04);
    }
    .tab { border: 0; color: var(--muted); background: transparent; }
    .tab.active { color: #06110c; background: linear-gradient(135deg, var(--green), var(--teal)); }
    .view { display: none; gap: 14px; }
    .view.active { display: grid; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(310px, 0.7fr);
      gap: 14px;
      align-items: stretch;
    }
    .intro {
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(135deg, rgba(17,24,35,0.98), rgba(13,17,24,0.92));
      box-shadow: var(--shadow);
    }
    .intro h2 { margin-top: 8px; font-size: 27px; line-height: 1.12; }
    .intro p { margin-top: 9px; max-width: 850px; color: var(--muted); font-size: 14px; line-height: 1.55; }
    .stack {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 15px;
    }
    .stack-item {
      min-height: 74px;
      padding: 10px;
      border-left: 2px solid var(--teal);
      background: rgba(255,255,255,0.045);
      border-radius: 6px;
    }
    .stack-item:nth-child(2) { border-left-color: var(--blue); }
    .stack-item:nth-child(3) { border-left-color: var(--amber); }
    .stack-item:nth-child(4) { border-left-color: var(--violet); }
    .stack-item strong { display: block; font-size: 13px; margin-bottom: 5px; }
    .stack-item span { display: block; color: var(--muted); font-size: 12px; line-height: 1.35; }
    .panel, .metric, .rail {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: rgba(13,17,24,0.9);
      box-shadow: var(--shadow);
    }
    .panel { padding: 15px; overflow: hidden; }
    .rail { padding: 14px; display: grid; gap: 12px; align-content: start; }
    .metrics {
      display: grid;
      grid-template-columns: 1.15fr repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      min-height: 118px;
      padding: 14px;
      display: grid;
      align-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .metric::before {
      content: "";
      position: absolute;
      inset: 0 0 auto;
      height: 2px;
      background: linear-gradient(90deg, var(--green), transparent);
      opacity: 0.8;
    }
    .metric.primary::before { background: linear-gradient(90deg, var(--green), var(--teal), transparent); }
    .metric.warning::before { background: linear-gradient(90deg, var(--red), var(--amber), transparent); }
    .value { font-size: 34px; font-weight: 900; line-height: 1; }
    .subtext { color: var(--faint); font-size: 12px; line-height: 1.4; }
    .copy { color: var(--muted); font-size: 13px; line-height: 1.55; }
    .shell {
      display: grid;
      grid-template-columns: minmax(0, 1.48fr) minmax(360px, 0.72fr);
      gap: 12px;
    }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 13px;
    }
    .panel-title { display: grid; gap: 5px; }
    canvas {
      width: 100%;
      height: 350px;
      display: block;
      border-radius: var(--radius);
      background: #090d13;
      border: 1px solid rgba(221,231,255,0.08);
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td {
      padding: 11px 9px;
      border-bottom: 1px solid rgba(221,231,255,0.08);
      text-align: left;
      white-space: nowrap;
    }
    th { color: var(--muted); font-size: 11px; text-transform: uppercase; font-weight: 820; }
    tr.attack-row { background: rgba(251,113,133,0.07); }
    .feed { overflow-x: auto; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 25px;
      padding: 0 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 850;
      text-transform: capitalize;
    }
    .badge::before { content: ""; width: 7px; height: 7px; border-radius: 99px; background: currentColor; }
    .badge.benign, .badge.allow { color: var(--green); background: rgba(74,222,128,0.12); }
    .badge.attack, .badge.block { color: var(--red); background: rgba(251,113,133,0.14); }
    .badge.rate_limit { color: var(--amber); background: rgba(245,158,11,0.13); }
    .threat-low { color: var(--green); }
    .threat-medium { color: var(--amber); }
    .threat-high { color: var(--red); }
    .trend.up { color: var(--red); }
    .trend.down { color: var(--green); }
    .insights, .importance, .steps { display: grid; gap: 10px; }
    .insight, .guide-row, .category {
      border-top: 1px solid rgba(221,231,255,0.09);
      padding-top: 10px;
    }
    .insight:first-child, .guide-row:first-child, .category:first-child { border-top: 0; padding-top: 0; }
    .insight-top, .importance-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
    }
    .bar { height: 8px; border-radius: 99px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--green), var(--teal)); }
    .bar span.attack { background: linear-gradient(90deg, var(--amber), var(--red)); }
    .dataset-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .progress { height: 8px; border-radius: 99px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 12px; }
    .progress span { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, var(--green), var(--teal)); transition: width 280ms ease; }
    .matrix { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
    .cell {
      min-height: 92px;
      padding: 12px;
      border-radius: 7px;
      border: 1px solid rgba(221,231,255,0.1);
      background: rgba(255,255,255,0.045);
      display: grid;
      align-content: space-between;
    }
    .errors { display: grid; gap: 7px; margin-top: 10px; }
    .error-item { border-left: 3px solid var(--red); padding: 8px 10px; background: rgba(251,113,133,0.1); border-radius: 7px; color: #ffdce1; }
    .empty { color: var(--muted); font-size: 13px; line-height: 1.45; }
    .control-block { display: grid; gap: 8px; }
    .control-block select { width: 100%; }
    .footer-note { color: var(--faint); font-size: 12px; line-height: 1.45; }
    @media (max-width: 1180px) {
      .topbar, .hero, .shell, .metrics, .grid-3, .grid-2 { grid-template-columns: 1fr; }
      .actions { justify-content: flex-start; }
      canvas { height: 300px; }
      .stack { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .app { width: min(100% - 18px, 1540px); }
      .topbar { margin: 0 -9px; padding: 11px 9px; }
      .intro h2 { font-size: 22px; }
      .value { font-size: 29px; }
      .stack, .matrix { grid-template-columns: 1fr; }
      button, select, input[type="file"] { width: 100%; }
      .tabs { width: 100%; }
      .tab { flex: 1; }
      .feed table, .feed tbody, .feed tr, .feed td { display: block; width: 100%; }
      .feed thead { display: none; }
      .feed tr { padding: 9px 0; border-bottom: 1px solid rgba(221,231,255,0.1); }
      .feed td {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        border-bottom: 0;
        white-space: normal;
      }
      .feed td::before {
        color: var(--faint);
        font-size: 11px;
        font-weight: 820;
        text-transform: uppercase;
      }
      .feed td:nth-child(1)::before { content: "Time"; }
      .feed td:nth-child(2)::before { content: "Prediction"; }
      .feed td:nth-child(3)::before { content: "Confidence"; }
      .feed td:nth-child(4)::before { content: "Latency"; }
      .feed td:nth-child(5)::before { content: "Action"; }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="eyebrow">Cloudflare edge detection</div>
        <h1>EdgeShield</h1>
        <div class="status-line"><span class="pulse"></span><span id="demoState">Live demo traffic running</span><span class="pill live">Worker online</span></div>
      </div>
      <div class="edge-strip" aria-label="Edge request flow">
        <svg viewBox="0 0 740 92" role="img">
          <path d="M32 53 C128 22, 201 30, 288 55 S438 74, 524 38 S654 28, 710 51" fill="none" stroke="rgba(96,165,250,0.45)" stroke-width="1.5"/>
          <path d="M40 66 C142 44, 224 50, 318 30 S480 20, 583 63 S678 70, 722 46" fill="none" stroke="rgba(45,212,191,0.42)" stroke-width="1.5"/>
          <g>
            <circle class="edge-node" cx="74" cy="53" r="4"/><circle class="edge-node" cx="184" cy="35" r="4"/>
            <circle class="edge-node hot" cx="306" cy="56" r="5"/><circle class="edge-node" cx="434" cy="39" r="4"/>
            <circle class="edge-node hot" cx="558" cy="62" r="5"/><circle class="edge-node" cx="670" cy="48" r="4"/>
          </g>
        </svg>
      </div>
      <div class="actions">
        <button id="tick" class="primary">Run sample now</button>
        <button id="toggle">Pause stream</button>
      </div>
    </header>

    <nav class="tabs" aria-label="Dashboard sections">
      <button class="tab active" data-view="operations">Operations</button>
      <button class="tab" data-view="dataset">Dataset evaluation</button>
      <button class="tab" data-view="modelView">Model details</button>
    </nav>

    <section id="operations" class="view active">
      <section class="hero">
        <div class="intro">
          <div class="eyebrow">Real-time side-channel monitoring</div>
          <h2>Hardware counter windows go in. Edge decisions come back in milliseconds.</h2>
          <p>EdgeShield receives Linux perf counter samples, rebuilds the same feature family used in the research pipeline, and classifies each window as benign or attack traffic through a low-latency JavaScript model running at the Cloudflare edge.</p>
          <div class="stack">
            <div class="stack-item"><strong>Worker</strong><span>Runs the API, dashboard, simulator, and model.</span></div>
            <div class="stack-item"><strong>D1</strong><span>Stores detection history and dashboard stats.</span></div>
            <div class="stack-item"><strong>KV</strong><span>Keeps thresholds and repeat-attack counts.</span></div>
            <div class="stack-item"><strong>R2</strong><span>Optional archive for raw trace records.</span></div>
          </div>
        </div>
        <aside class="rail">
          <div class="panel-title">
            <h2>Demo controls</h2>
            <p class="copy">Generate traffic from the calibrated Ubuntu and Fedora distributions, then watch the stream update live.</p>
          </div>
          <div class="control-block">
            <h3>Traffic type</h3>
            <select id="mode">
              <option value="mixed">Mixed traffic</option>
              <option value="attack">Attack only</option>
              <option value="benign">Benign only</option>
            </select>
          </div>
          <div class="control-block">
            <h3>Operating system profile</h3>
            <select id="os">
              <option value="mixed">Mixed OS</option>
              <option value="ubuntu">Ubuntu</option>
              <option value="fedora">Fedora</option>
            </select>
          </div>
          <button id="attackCta" class="danger">Trigger attack burst</button>
          <p class="footer-note">For live collection, run the perf collector on the monitored Linux machine and send windows to /analyze.</p>
        </aside>
      </section>

      <section class="metrics">
        <div class="metric primary">
          <div class="label">Threat level</div>
          <div class="value" id="threatLevel">Low</div>
          <div class="subtext" id="threatSummary">Waiting for live samples.</div>
        </div>
        <div class="metric">
          <div class="label">Attack rate</div>
          <div class="value" id="attackRate">0%</div>
          <div class="subtext"><span id="attackTrend" class="trend down">stable</span> across recent windows</div>
        </div>
        <div class="metric">
          <div class="label">Edge latency</div>
          <div class="value" id="avgLatency">0 ms</div>
          <div class="subtext">model inference time</div>
        </div>
        <div class="metric">
          <div class="label">Confidence</div>
          <div class="value" id="avgConfidence">0%</div>
          <div class="subtext">average prediction certainty</div>
        </div>
      </section>

      <section class="shell">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Live threat stream</h2>
              <p class="copy">The blue line tracks benign confidence. The red line tracks attack score, with bright points marking attack windows.</p>
            </div>
            <div class="row">
              <button id="exportLiveJson">Export JSON</button>
              <button id="exportLiveCsv">Export CSV</button>
            </div>
          </div>
          <canvas id="threatCanvas" width="1000" height="390"></canvas>
        </div>
        <aside class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Decision explanation</h2>
              <p class="copy">Top signals from the latest prediction.</p>
            </div>
            <span id="latestMeta" class="pill">waiting</span>
          </div>
          <div id="insights" class="insights"></div>
        </aside>
      </section>

      <section class="shell">
        <div class="panel feed">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Detection feed</h2>
              <p class="copy">Most recent edge decisions, including the mitigation recommendation.</p>
            </div>
            <span id="rowCount" class="pill">0 events</span>
          </div>
          <table>
            <thead><tr><th>Time</th><th>Prediction</th><th>Confidence</th><th>Latency</th><th>Action</th></tr></thead>
            <tbody id="feed"></tbody>
          </table>
        </div>
        <aside class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Signal groups</h2>
              <p class="copy">How the latest decision is distributed across feature families.</p>
            </div>
          </div>
          <div id="importance" class="importance"></div>
        </aside>
      </section>
    </section>

    <section id="dataset" class="view">
      <section class="grid-3">
        <div class="metric"><div class="label">Benchmark accuracy</div><div class="value" id="evalAccuracy">0%</div><div class="subtext">2,000-row sampled evaluation</div></div>
        <div class="metric"><div class="label">Attack recall</div><div class="value" id="evalRecall">0%</div><div class="subtext">attack windows detected</div></div>
        <div class="metric"><div class="label">False positives</div><div class="value" id="evalFpr">0%</div><div class="subtext">benign rows flagged</div></div>
      </section>
      <section class="shell">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Evaluate your own dataset</h2>
              <p class="copy" id="datasetResult">Upload CSV or JSON built from the same six perf counters used in the research pipeline.</p>
            </div>
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
            <button id="runDataset" class="primary">Evaluate</button>
            <button id="downloadCsvTemplate">CSV template</button>
            <button id="downloadJsonTemplate">JSON template</button>
          </div>
          <div class="steps" style="margin-top:14px">
            <div class="guide-row">
              <h3>Required columns</h3>
              <code>cache_misses, cache_references, instructions, cycles, branches, branch_misses, label</code>
              <p class="copy">The label is optional. Use attack or benign when you know the ground truth.</p>
            </div>
            <div class="guide-row">
              <h3>Matching collection command</h3>
              <code>sudo perf stat -I 50 -x , -e cache-misses,cache-references,instructions,cycles,branches,branch-misses -- ./your_program</code>
              <p class="copy">Each complete timestamp window becomes one upload row.</p>
            </div>
          </div>
          <div class="progress"><span id="datasetProgress"></span></div>
          <div id="datasetErrors" class="errors"></div>
          <div class="grid-3" style="margin-top:14px">
            <div class="cell"><div class="label">Rows checked</div><div class="value" id="datasetRowsEvaluated">0</div></div>
            <div class="cell"><div class="label">Accuracy</div><div class="value" id="datasetAccuracy">0%</div></div>
            <div class="cell"><div class="label">False positives</div><div class="value" id="datasetFpr">0%</div></div>
          </div>
        </div>
        <aside class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Confusion matrix</h2>
              <p class="copy">Computed when labels are present.</p>
            </div>
            <div class="row"><button id="exportEvalJson">JSON</button><button id="exportEvalCsv">CSV</button></div>
          </div>
          <div class="matrix">
            <div class="cell"><div class="label">True positive</div><div class="value" id="tp">0</div></div>
            <div class="cell"><div class="label">False negative</div><div class="value" id="fn">0</div></div>
            <div class="cell"><div class="label">False positive</div><div class="value" id="fp">0</div></div>
            <div class="cell"><div class="label">True negative</div><div class="value" id="tn">0</div></div>
          </div>
        </aside>
      </section>
    </section>

    <section id="modelView" class="view">
      <section class="grid-3">
        <div class="metric"><div class="label">Cache behavior</div><div class="value" id="cacheImportance">0%</div><div class="subtext">dominant attack signal</div></div>
        <div class="metric"><div class="label">Branch behavior</div><div class="value" id="branchImportance">0%</div><div class="subtext">control-flow signal</div></div>
        <div class="metric"><div class="label">Execution timing</div><div class="value" id="execImportance">0%</div><div class="subtext">IPC and cycle ratios</div></div>
      </section>
      <section class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>How the model works</h2>
              <p class="copy">The Worker rebuilds 36 features from six raw counters and applies a transparent Random-Forest-inspired ruleset.</p>
            </div>
          </div>
          <div class="steps">
            <div class="guide-row"><h3>1. Raw counters</h3><p class="copy">cache misses, references, instructions, cycles, branches, and branch misses.</p></div>
            <div class="guide-row"><h3>2. Engineered features</h3><p class="copy">IPC, CPI, miss rates, per-thousand-instruction ratios, diffs, and rolling statistics.</p></div>
            <div class="guide-row"><h3>3. Edge decision</h3><p class="copy">Weighted rules vote toward attack or benign, then return confidence and feature contributions.</p></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Active Cloudflare services</h2>
              <p class="copy">What each edge binding is doing in the current architecture.</p>
            </div>
          </div>
          <div class="steps">
            <div class="guide-row"><h3>Worker</h3><p class="copy">Serves the API, dashboard, model, simulator, and OpenAPI document.</p></div>
            <div class="guide-row"><h3>D1</h3><p class="copy">Persists detection records for audit history and dashboard statistics.</p></div>
            <div class="guide-row"><h3>KV</h3><p class="copy">Stores live thresholds and counts repeated attack predictions by source ID.</p></div>
            <div class="guide-row"><h3>R2</h3><p class="copy">Optional object storage for full raw trace archival.</p></div>
          </div>
        </div>
      </section>
    </section>
  </div>

  <script>
    const state = { rows: [], running: true, persisted: null, evaluation: null, datasetReport: null, previousAttackRate: 0, scanOffset: 0 };
    const $ = (id) => document.getElementById(id);
    const insightCopy = {
      cache_miss_rate: "Cache miss rate crossed an attack boundary",
      cache_misses_per_kinst: "Cache miss density matches attack traces",
      cache_references_per_kinst: "Cache reference density is in the suspicious range",
      cycles_per_branch: "Cycles per branch moved into an attack-like band",
      branches_per_kinst: "Branch density resembles attack windows",
      ipc: "Instruction throughput is unusually low",
      cache_miss_rate_roll_mean_5: "Low cache-miss behavior is stable across recent windows",
      branch_miss_rate: "Branch miss behavior supports the decision"
    };
    const groups = {
      "Cache behavior": ["cache_miss_rate", "cache_misses_per_kinst", "cache_references_per_kinst", "cache_miss_rate_roll_mean_5"],
      "Branch behavior": ["branches_per_kinst", "branch_miss_rate"],
      "Execution timing": ["ipc", "cycles_per_branch"]
    };
    const sampleCsv = [
      "cache_misses,cache_references,instructions,cycles,branches,branch_misses,label",
      "149,139866,704519,2637200,122831,11525,attack",
      "152,160392,728285,2746720,127052,13828,attack",
      "78887,556178,1706780,4978970,299316,34462,benign",
      "3422,90858,281075,759759,59167,7933,benign"
    ].join("\\n");
    const sampleJson = JSON.stringify({
      rows: [
        {
          features: {
            cache_misses: 149,
            cache_references: 139866,
            instructions: 704519,
            cycles: 2637200,
            branches: 122831,
            branch_misses: 11525
          },
          label: "attack"
        },
        {
          features: {
            cache_misses: 78887,
            cache_references: 556178,
            instructions: 1706780,
            cycles: 4978970,
            branches: 299316,
            branch_misses: 34462
          },
          label: "benign"
        }
      ]
    }, null, 2);
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
      if (action === "rate_limit") return "Rate limit";
      if (action === "block") return "Block";
      return "Allow";
    }
    function drawThreatStream(rows) {
      const canvas = $("threatCanvas");
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const series = rows.slice(-90);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#090d13";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(221,231,255,0.085)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i += 1) {
        const y = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i += 1) {
        const x = ((i * 160) + state.scanOffset) % (w + 160) - 160;
        ctx.strokeStyle = "rgba(45,212,191,0.08)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 80, h);
        ctx.stroke();
      }
      state.scanOffset = (state.scanOffset + 6) % 160;
      if (series.length < 2) return;
      const draw = (getter, color, width) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        series.forEach((row, index) => {
          const x = index * (w / Math.max(1, series.length - 1));
          const y = h - getter(row) * (h - 38) - 19;
          index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      };
      draw((row) => 1 - Number(row.attack_score || 0), "rgba(96,165,250,0.92)", 3);
      draw((row) => Number(row.attack_score || 0), "rgba(251,113,133,0.95)", 3);
      series.forEach((row, index) => {
        if (row.prediction !== "attack") return;
        const x = index * (w / Math.max(1, series.length - 1));
        const y = h - Number(row.attack_score || 0) * (h - 38) - 19;
        ctx.fillStyle = "rgba(251,113,133,0.20)";
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(245,247,251,0.74)";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("attack score", 14, 22);
      ctx.fillStyle = "rgba(96,165,250,0.82)";
      ctx.fillText("benign confidence", 105, 22);
    }
    function threatLevel(rate, confidence) {
      if (rate >= 0.45 || (confidence >= 0.94 && rate >= 0.28)) return ["High", "threat-high", "Active attack pattern detected."];
      if (rate >= 0.18) return ["Medium", "threat-medium", "Suspicious hardware-counter activity is rising."];
      return ["Low", "threat-low", "No active attack pattern in the recent stream."];
    }
    function renderInsights(row) {
      if (!row) {
        $("insights").innerHTML = '<div class="empty">Waiting for the first detection event.</div>';
        renderImportance(null);
        return;
      }
      $("latestMeta").textContent = row.prediction === "attack" ? "flagged" : "clear";
      $("latestMeta").className = row.prediction === "attack" ? "pill warn" : "pill live";
      const items = (row.feature_contributions || []).slice(0, 4);
      $("insights").innerHTML = items.length ? items.map((item) => {
        const title = insightCopy[item.feature] || item.label || "Signal changed from baseline";
        const impact = Math.min(100, Math.round(Math.abs(item.impact || 0) / 0.24 * 100));
        const cls = item.impact >= 0 ? "attack" : "";
        const note = item.direction === "attack" ? "Raises attack score" : "Supports benign classification";
        return '<div class="insight"><div class="insight-top"><strong>' + safeText(title) + '</strong><span class="label">' + impact + '%</span></div><div class="bar" style="margin:8px 0"><span class="' + cls + '" style="width:' + impact + '%"></span></div><p class="copy">' + safeText(note) + '</p></div>';
      }).join("") : '<div class="empty">Persisted events do not include feature contributions. Run a new sample to see live explainability.</div>';
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
      $("branchImportance").textContent = pct(totals["Branch behavior"] / max);
      $("execImportance").textContent = pct(totals["Execution timing"] / max);
      $("importance").innerHTML = Object.entries(totals).map(([name, value]) => {
        const width = Math.round(value / max * 100);
        return '<div class="category"><div class="importance-row"><strong>' + safeText(name) + '</strong><span class="label">' + width + '%</span></div><div class="bar" style="margin:8px 0"><span style="width:' + width + '%"></span></div><p class="copy">' + groups[name].map(safeText).join(", ") + '</p></div>';
      }).join("");
    }
    function renderLive() {
      const rows = state.rows.slice(-120);
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
        $("datasetResult").textContent = "Choose a CSV or JSON file that contains the six required perf counters.";
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
      const rows = state.rows.slice(-120);
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
    function downloadTemplate(format) {
      if (format === "json") download("edgeshield-sample-dataset.json", "application/json", sampleJson);
      else download("edgeshield-sample-dataset.csv", "text/csv", sampleCsv);
    }
    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.view).classList.add("active");
        requestAnimationFrame(() => drawThreatStream(state.rows.slice(-120)));
      });
    });
    $("tick").addEventListener("click", () => runSample());
    $("attackCta").addEventListener("click", () => { $("mode").value = "attack"; runSample("attack"); });
    $("toggle").addEventListener("click", () => {
      state.running = !state.running;
      $("toggle").textContent = state.running ? "Pause stream" : "Resume stream";
      $("demoState").textContent = state.running ? "Live demo traffic running" : "Demo traffic paused";
    });
    $("exportLiveJson").addEventListener("click", () => exportLive("json"));
    $("exportLiveCsv").addEventListener("click", () => exportLive("csv"));
    $("exportEvalJson").addEventListener("click", () => exportEvaluation("json"));
    $("exportEvalCsv").addEventListener("click", () => exportEvaluation("csv"));
    $("exportDatasetJson").addEventListener("click", () => exportDataset("json"));
    $("exportDatasetCsv").addEventListener("click", () => exportDataset("csv"));
    $("downloadCsvTemplate").addEventListener("click", () => downloadTemplate("csv"));
    $("downloadJsonTemplate").addEventListener("click", () => downloadTemplate("json"));
    $("runDataset").addEventListener("click", () => runDatasetTest().catch((error) => {
      $("datasetResult").textContent = error.message;
      $("datasetProgress").style.width = "0%";
    }));
    setInterval(() => { if (state.running) runSample().catch(console.error); }, 1200);
    setInterval(() => { if (state.rows.length) drawThreatStream(state.rows.slice(-120)); }, 140);
    setInterval(() => { loadPersistedStats().catch(console.error); }, 7000);
    loadEvaluation().catch(console.error);
    loadPersistedStats().catch(console.error);
    renderLive();
    runSample().catch(console.error);
  </script>
</body>
</html>`;
}
