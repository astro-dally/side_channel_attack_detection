export function renderDashboard() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:," />
  <title>EdgeShield Security Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
      --bg-base: #030712;
      --bg-glass: rgba(17, 24, 39, 0.6);
      --bg-glass-hover: rgba(31, 41, 55, 0.7);
      --border-glass: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.15);
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --text-faint: #6b7280;
      
      --neon-green: #10b981;
      --neon-teal: #14b8a6;
      --neon-red: #ef4444;
      --neon-amber: #f59e0b;
      --neon-blue: #3b82f6;

      --glow-green: rgba(16, 185, 129, 0.3);
      --glow-red: rgba(239, 68, 68, 0.4);
      --glow-teal: rgba(20, 184, 166, 0.3);

      --radius: 12px;
      --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      
      font-family: 'Outfit', system-ui, sans-serif;
    }
    
    * { box-sizing: border-box; }
    
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text-main);
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(circle at 15% 50%, rgba(20, 184, 166, 0.08), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(239, 68, 68, 0.05), transparent 25%);
      background-attachment: fixed;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: -1;
      background: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, transparent 100%);
    }

    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    h3 { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .text-mono { font-family: 'JetBrains Mono', monospace; font-size: 13px; }

    .glass-panel {
      background: var(--bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius);
      box-shadow: var(--shadow-glass);
      padding: 20px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    
    button, select, input {
      height: 40px;
      border: 1px solid var(--border-glass);
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: var(--text-main);
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 0 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    }
    
    button:hover {
      background: rgba(255,255,255,0.1);
      border-color: var(--border-strong);
      transform: translateY(-1px);
    }

    button.primary {
      background: linear-gradient(135deg, var(--neon-teal), var(--neon-green));
      color: #000;
      border: none;
      box-shadow: 0 0 15px var(--glow-teal);
    }
    
    button.primary:hover {
      box-shadow: 0 0 25px var(--glow-teal);
      transform: translateY(-2px);
    }
    
    button.danger {
      background: rgba(239, 68, 68, 0.15);
      color: var(--neon-red);
      border-color: rgba(239, 68, 68, 0.4);
    }
    
    button.danger:hover {
      background: rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 15px var(--glow-red);
    }

    .app-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 24px 40px;
      display: grid;
      gap: 20px;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0 -24px 20px;
      padding: 16px 24px;
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-glass);
    }

    .brand-section { display: flex; align-items: center; gap: 24px; }
    .brand-title { display: flex; flex-direction: column; gap: 2px; }
    .brand-title span { font-size: 11px; color: var(--neon-teal); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }

    .status-group { display: flex; gap: 12px; align-items: center; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
    }
    .status-pill.active {
      color: var(--neon-green);
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
    }
    .status-pill.danger {
      color: var(--neon-red);
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
    }
    .status-pill.info {
      color: var(--neon-blue);
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }
    
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(currentColor, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(currentColor, 0); }
      100% { box-shadow: 0 0 0 0 rgba(currentColor, 0); }
    }

    .grid-hero { display: grid; grid-template-columns: 1fr 420px; gap: 20px; }
    .grid-main { display: grid; grid-template-columns: 1fr 420px; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    
    .threat-panel {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 280px;
      padding: 40px;
    }
    
    .threat-panel::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--neon-teal), var(--neon-green));
      transition: background 0.3s ease;
    }
    
    .threat-panel.attack-active {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(17, 24, 39, 0.8));
      border-color: rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 40px rgba(239, 68, 68, 0.1);
    }
    .threat-panel.attack-active::before {
      background: linear-gradient(90deg, var(--neon-red), var(--neon-amber));
    }

    .threat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .threat-title { font-size: 32px; font-weight: 800; line-height: 1.1; }
    .attack-active .threat-title { color: #fecaca; }
    .threat-desc { font-size: 16px; color: var(--text-muted); margin-top: 8px; max-width: 80%; line-height: 1.5; }
    
    .threat-stats { display: flex; gap: 20px; margin-top: 30px; }
    .stat-box {
      background: rgba(0,0,0,0.2);
      border: 1px solid var(--border-glass);
      border-radius: 8px;
      padding: 12px 20px;
      flex: 1;
    }
    .stat-box label { display: block; font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; }
    .stat-box .value { font-size: 20px; font-weight: 700; }
    
    .text-red { color: var(--neon-red); }
    .text-green { color: var(--neon-green); }
    .text-amber { color: var(--neon-amber); }
    .text-main { color: var(--text-main); }

    .mitigation-panel { display: flex; flex-direction: column; gap: 20px; }
    
    .mitigation-status {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
    }
    .mitigation-status.mitigating {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
    }
    .mitigation-icon { font-size: 28px; }
    .mitigation-text h4 { margin: 0; font-size: 16px; font-weight: 700; }
    .mitigation-text p { margin: 4px 0 0; font-size: 13px; color: var(--text-muted); }

    .narrative-box {
      padding: 16px;
      border-left: 3px solid var(--neon-teal);
      background: rgba(20, 184, 166, 0.05);
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #ccfbf1;
    }
    .narrative-box.alert {
      border-left-color: var(--neon-red);
      background: rgba(239, 68, 68, 0.05);
      color: #fee2e2;
    }

    .chart-container {
      position: relative;
      height: 300px;
      margin-top: 20px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      border: 1px solid var(--border-glass);
      overflow: hidden;
    }
    canvas { width: 100%; height: 100%; display: block; }
    
    .chart-legend {
      display: flex; gap: 16px; margin-top: 16px; font-size: 13px; color: var(--text-muted);
    }
    .legend-item { display: flex; align-items: center; gap: 6px; font-weight: 500; }
    .legend-color { width: 12px; height: 4px; border-radius: 2px; }

    .insight-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .insight-item { padding-bottom: 16px; border-bottom: 1px solid var(--border-glass); }
    .insight-item:last-child { border-bottom: none; padding-bottom: 0; }
    .insight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .insight-title { font-size: 14px; font-weight: 600; color: #fff; }
    .insight-impact { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: rgba(255,255,255,0.1); }
    .insight-impact.attack { color: var(--neon-red); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
    .insight-impact.safe { color: var(--neon-teal); background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.2); }
    .insight-bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
    .insight-bar-fill { height: 100%; background: var(--neon-red); border-radius: 3px; transition: width 0.3s ease; }
    .insight-bar-fill.safe { background: var(--neon-teal); }
    .insight-desc { font-size: 13px; color: var(--text-muted); }

    .feed-container { overflow-x: auto; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-glass); }
    th { color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; background: rgba(0,0,0,0.2); }
    tr.attack-row { background: rgba(239, 68, 68, 0.05); }
    
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase;
    }
    .badge.benign, .badge.allow { color: var(--neon-green); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
    .badge.attack, .badge.block, .badge.rate_limit { color: var(--neon-red); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }

    .edge-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .compare-card { padding: 16px; border-radius: 8px; border: 1px solid var(--border-glass); background: rgba(0,0,0,0.2); }
    .compare-card.winner { border-color: rgba(20, 184, 166, 0.4); background: rgba(20, 184, 166, 0.05); box-shadow: 0 4px 20px rgba(20, 184, 166, 0.1); }
    .compare-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
    .compare-metric { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .winner .compare-metric { color: var(--neon-teal); }
    .compare-desc { font-size: 13px; color: var(--text-muted); line-height: 1.4; }

    .pipeline { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .pipe-step {
      display: flex; align-items: center; gap: 16px; padding: 12px 16px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px;
    }
    .pipe-icon { color: var(--neon-teal); font-weight: 800; }
    .pipe-content h4 { margin: 0; font-size: 14px; color: #fff; }
    .pipe-content p { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
    .section-title h2 { font-size: 20px; color: #fff; }
    .section-title p { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

    @media (max-width: 1200px) {
      .grid-hero, .grid-main { grid-template-columns: 1fr; }
    }

    /* Tabs */
    .tabs-nav { display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 8px; width: fit-content; border: 1px solid var(--border-glass); }
    .tab-btn { background: transparent; border: none; padding: 8px 16px; border-radius: 6px; color: var(--text-muted); font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s ease; }
    .tab-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
    .tab-btn.active { background: linear-gradient(135deg, var(--neon-teal), var(--neon-green)); color: #000; box-shadow: 0 0 10px var(--glow-teal); }
    .view-content { display: none; }
    .view-content.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .text-teal { color: var(--neon-teal); }
    .text-blue { color: var(--neon-blue); }
  </style>
</head>
<body>
  <div class="app-container">
    <header class="topbar">
      <div class="brand-section">
        <div class="brand-title">
          <span>Cloudflare Edge Detection</span>
          <h1>EdgeShield</h1>
        </div>
        <div class="status-group" style="margin-left: 20px;">
          <div class="status-pill active"><span class="pulse-dot"></span> Edge Protection Active</div>
          <div class="status-pill info">Mode: <span id="demoState" style="margin-left:4px">Simulation</span></div>
          <div class="status-pill active">Worker: Online</div>
        </div>
      </div>
      <div class="status-group">
        <button id="tick" class="primary">Run Simulation</button>
        <button id="toggle">Pause Stream</button>
      </div>
    </header>

    <nav class="tabs-nav" aria-label="Dashboard sections">
      <button class="tab-btn active" data-view="operations">Operations</button>
      <button class="tab-btn" data-view="dataset">Dataset Evaluation</button>
      <button class="tab-btn" data-view="modelView">Model Details</button>
    </nav>

    <div class="view-content active" id="operations">
      <div class="grid-hero">
      <div id="primaryThreat" class="glass-panel threat-panel">
        <div class="threat-header">
          <div id="threatBadge" class="status-pill active">Monitoring</div>
        </div>
        <h2 id="primaryThreatTitle" class="threat-title">No active side-channel attack detected</h2>
        <p id="primaryThreatReason" class="threat-desc">Recent hardware counter windows are consistent with benign execution.</p>
        
        <div class="threat-stats">
          <div class="stat-box">
            <label>Risk Level</label>
            <div id="riskLevel" class="value text-green">Low</div>
          </div>
          <div class="stat-box">
            <label>Attack Type</label>
            <div id="attackType" class="value text-main">No active attack pattern</div>
          </div>
          <div class="stat-box">
            <label>Confidence</label>
            <div id="primaryConfidence" class="value text-main text-mono">0%</div>
          </div>
        </div>
      </div>

      <div class="glass-panel mitigation-panel">
        <div class="section-title">
          <h2>Mitigation Status</h2>
          <p>Automated edge response</p>
        </div>
        
        <div id="mitigationBox" class="mitigation-status">
          <div class="mitigation-icon">🛡️</div>
          <div class="mitigation-text">
            <h4>Action: <span id="mitigationAction">Allowing normal traffic</span></h4>
            <p>Source: <span id="sourceId" class="text-mono">demo-client</span> | Strikes: <span id="repeatCount" class="text-mono">0</span></p>
          </div>
        </div>

        <div id="systemNarrative" class="narrative-box">
          EdgeShield is continuously inspecting hardware counter windows at the edge and is ready to mitigate suspicious cache behavior before it reaches the application.
        </div>

        <div style="margin-top: auto; display: flex; gap: 8px; align-items: center;">
          <select id="mode" style="flex:1">
            <option value="mixed">Mixed Traffic</option>
            <option value="attack">Attack Burst</option>
            <option value="benign">Benign Only</option>
          </select>
          <button id="attackCta" class="danger">Simulate Attack</button>
          <select id="os" style="display:none"><option value="mixed"></option></select>
        </div>
      </div>
    </div>

    <div class="grid-3" style="margin-top: 20px;">
      <div class="glass-panel" style="padding: 16px 20px;">
        <h3 style="margin-bottom: 8px;">Attack Rate (24h)</h3>
        <div style="display: flex; align-items: baseline; gap: 12px;">
          <span id="attackRate" style="font-size: 28px; font-weight: 700;">0%</span>
          <span id="attackTrend" class="text-muted" style="font-size: 13px;">stable</span>
        </div>
      </div>
      <div class="glass-panel" style="padding: 16px 20px;">
        <h3 style="margin-bottom: 8px;">Edge Latency</h3>
        <div style="display: flex; align-items: baseline; gap: 12px;">
          <span id="avgLatency" style="font-size: 28px; font-weight: 700; color: var(--neon-teal);">0 ms</span>
          <span class="text-muted" style="font-size: 13px;">inference time</span>
        </div>
      </div>
      <div class="glass-panel" style="padding: 16px 20px;">
        <h3 style="margin-bottom: 8px;">Avg Confidence</h3>
        <div style="display: flex; align-items: baseline; gap: 12px;">
          <span id="avgConfidence" style="font-size: 28px; font-weight: 700;">0%</span>
          <span class="text-muted" style="font-size: 13px;">certainty</span>
        </div>
      </div>
    </div>

    <div class="grid-main" style="margin-top: 20px;">
      <div class="glass-panel">
        <div class="section-header">
          <div class="section-title">
            <h2>Real-Time Threat Timeline</h2>
            <p>Streaming inference from hardware counters</p>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="exportLiveJson" style="height:32px; padding:0 12px; font-size:12px;">Export JSON</button>
            <button id="exportLiveCsv" style="display:none">CSV</button>
          </div>
        </div>
        
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-color" style="background: var(--neon-teal);"></div> Benign Confidence</div>
          <div class="legend-item"><div class="legend-color" style="background: var(--neon-red);"></div> Attack Score</div>
          <div class="legend-item"><div class="legend-color" style="background: rgba(239, 68, 68, 0.4); border-radius: 50%; width: 10px; height: 10px; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);"></div> Attack Detected</div>
        </div>
        
        <div class="chart-container">
          <canvas id="threatCanvas" width="1000" height="300"></canvas>
        </div>
      </div>

      <div class="glass-panel">
        <div class="section-header">
          <div class="section-title">
            <h2>Why was this flagged?</h2>
            <p>Explainability for latest decision</p>
          </div>
          <span id="latestMeta" class="status-pill info" style="font-size: 11px;">waiting</span>
        </div>
        <div id="insights" class="insight-list"></div>
      </div>
    </div>

    <div class="grid-main" style="margin-top: 20px;">
      <div class="glass-panel">
        <div class="section-header">
          <div class="section-title">
            <h2>Live Activity Feed</h2>
            <p>Recent edge decisions</p>
          </div>
          <span id="rowCount" class="status-pill info">0 events</span>
        </div>
        <div class="feed-container">
          <table>
            <thead><tr><th>Time</th><th>Prediction</th><th>Confidence</th><th>Latency</th><th>Action Taken</th></tr></thead>
            <tbody id="feed"></tbody>
          </table>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="glass-panel">
          <div class="section-title" style="margin-bottom: 16px;">
            <h2>Why Edge Detection?</h2>
            <p>Cloudflare Workers vs Traditional Infrastructure</p>
          </div>
          <div class="edge-compare">
            <div class="compare-card winner">
              <div class="compare-title">EdgeShield</div>
              <div class="compare-metric">~1 ms</div>
              <div class="compare-desc">Detection & mitigation occurs at the edge, blocking attacks before they reach the server.</div>
            </div>
            <div class="compare-card">
              <div class="compare-title">Traditional Cloud</div>
              <div class="compare-metric">80-150 ms</div>
              <div class="compare-desc">Detection only happens after the malicious request reaches the backend infrastructure.</div>
            </div>
          </div>
        </div>

        <div class="glass-panel" style="flex: 1;">
          <div class="section-title" style="margin-bottom: 16px;">
            <h2>System Pipeline</h2>
          </div>
          <div class="pipeline">
            <div class="pipe-step"><div class="pipe-icon">01</div><div class="pipe-content"><h4>HPC Data Stream</h4><p>Client perf counters</p></div></div>
            <div class="pipe-step"><div class="pipe-icon">02</div><div class="pipe-content"><h4>Cloudflare Worker</h4><p>Edge API receives payload</p></div></div>
            <div class="pipe-step"><div class="pipe-icon">03</div><div class="pipe-content"><h4>Detection Engine</h4><p>Feature eng. & ML ruleset</p></div></div>
            <div class="pipe-step"><div class="pipe-icon">04</div><div class="pipe-content"><h4>Mitigation</h4><p>Allow or Rate Limit</p></div></div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Dataset View -->
    <div class="view-content" id="dataset">
      <div class="grid-3">
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">Benchmark Accuracy</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="evalAccuracy" style="font-size: 28px; font-weight: 700;">0%</span>
            <span class="text-muted" style="font-size: 13px;">2,000-row eval</span>
          </div>
        </div>
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">Attack Recall</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="evalRecall" style="font-size: 28px; font-weight: 700; color: var(--neon-teal);">0%</span>
            <span class="text-muted" style="font-size: 13px;">attacks detected</span>
          </div>
        </div>
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">False Positives</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="evalFpr" style="font-size: 28px; font-weight: 700; color: var(--neon-red);">0%</span>
            <span class="text-muted" style="font-size: 13px;">benign rows flagged</span>
          </div>
        </div>
      </div>

      <div class="grid-main" style="margin-top: 20px;">
        <div class="glass-panel">
          <div class="section-header">
            <div class="section-title">
              <h2>Evaluate Custom Dataset</h2>
              <p id="datasetResult" style="color: var(--text-muted); font-size: 13px;">Upload CSV or JSON built from the six required perf counters.</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button id="exportDatasetJson" style="height:32px; padding:0 12px; font-size:12px;">JSON</button>
              <button id="exportDatasetCsv" style="height:32px; padding:0 12px; font-size:12px;">CSV</button>
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; margin-bottom: 16px; align-items: center;">
            <input id="datasetFile" type="file" accept=".csv,.json,text/csv,application/json" style="flex: 1; padding: 6px;"/>
            <select id="datasetLabel" style="width: 150px;">
              <option value="">Auto Detect</option>
              <option value="attack">All Attack</option>
              <option value="benign">All Benign</option>
            </select>
            <button id="runDataset" class="primary">Evaluate</button>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <button id="downloadCsvTemplate" style="font-size: 12px;">CSV Template</button>
            <button id="downloadJsonTemplate" style="font-size: 12px;">JSON Template</button>
          </div>
          
          <div class="insight-list">
            <div class="insight-item">
              <div class="insight-title">Required Columns</div>
              <div class="insight-desc text-mono" style="margin-top: 4px;">cache_misses, cache_references, instructions, cycles, branches, branch_misses, label</div>
            </div>
          </div>
          
          <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 20px 0; overflow: hidden;">
            <div id="datasetProgress" style="width: 0%; height: 100%; background: var(--neon-teal); transition: width 0.3s ease;"></div>
          </div>
          <div id="datasetErrors" style="color: var(--neon-red); font-size: 13px; margin-bottom: 12px;"></div>

          <div class="grid-3">
            <div class="stat-box"><label>Rows Checked</label><div id="datasetRowsEvaluated" class="value">0</div></div>
            <div class="stat-box"><label>Accuracy</label><div id="datasetAccuracy" class="value text-teal">0%</div></div>
            <div class="stat-box"><label>False Positives</label><div id="datasetFpr" class="value text-red">0%</div></div>
          </div>
        </div>
        
        <div class="glass-panel">
          <div class="section-header">
            <div class="section-title">
              <h2>Confusion Matrix</h2>
              <p>Computed when ground-truth labels are present.</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button id="exportEvalJson" style="height:32px; padding:0 12px; font-size:12px;">JSON</button>
              <button id="exportEvalCsv" style="height:32px; padding:0 12px; font-size:12px;">CSV</button>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
            <div class="stat-box"><label>True Positive</label><div id="tp" class="value text-green">0</div></div>
            <div class="stat-box"><label>False Negative</label><div id="fn" class="value text-red">0</div></div>
            <div class="stat-box"><label>False Positive</label><div id="fp" class="value text-amber">0</div></div>
            <div class="stat-box"><label>True Negative</label><div id="tn" class="value text-blue">0</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Model Details View -->
    <div class="view-content" id="modelView">
      <div class="grid-3">
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">Cache Behavior</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="cacheImportance" style="font-size: 28px; font-weight: 700;">0%</span>
            <span class="text-muted" style="font-size: 13px;">dominant signal</span>
          </div>
        </div>
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">Branch Behavior</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="branchImportance" style="font-size: 28px; font-weight: 700;">0%</span>
            <span class="text-muted" style="font-size: 13px;">control-flow</span>
          </div>
        </div>
        <div class="glass-panel" style="padding: 16px 20px;">
          <h3 style="margin-bottom: 8px;">Execution Timing</h3>
          <div style="display: flex; align-items: baseline; gap: 12px;">
            <span id="execImportance" style="font-size: 28px; font-weight: 700;">0%</span>
            <span class="text-muted" style="font-size: 13px;">IPC & cycles</span>
          </div>
        </div>
      </div>

      <div class="grid-main" style="margin-top: 20px;">
        <div class="glass-panel">
          <div class="section-title" style="margin-bottom: 16px;">
            <h2>How the model works</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Worker rebuilds 36 features and applies transparent ML ruleset.</p>
          </div>
          <div class="pipeline">
            <div class="pipe-step"><div class="pipe-icon">01</div><div class="pipe-content"><h4>Raw counters</h4><p>misses, references, instructions, cycles, branches.</p></div></div>
            <div class="pipe-step"><div class="pipe-icon">02</div><div class="pipe-content"><h4>Engineered features</h4><p>IPC, CPI, miss rates, rolling statistics.</p></div></div>
            <div class="pipe-step"><div class="pipe-icon">03</div><div class="pipe-content"><h4>Edge decision</h4><p>Weighted rules vote toward attack or benign.</p></div></div>
          </div>
        </div>
        <div class="glass-panel">
          <div class="section-title" style="margin-bottom: 16px;">
            <h2>Feature Importance Details</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Live contribution breakdowns across categories.</p>
          </div>
          <div id="importance" class="insight-list"></div>
        </div>
      </div>
    </div>

  </div>

  <script>
    const state = { rows: [], running: true, persisted: null, evaluation: null, datasetReport: null, previousAttackRate: 0, scanOffset: 0 };
    const $ = (id) => document.getElementById(id);
    const insightCopy = {
      cache_miss_rate: "Cache miss rate deviates significantly from normal baseline",
      cache_misses_per_kinst: "Cache access density matches memory probing behavior",
      cache_references_per_kinst: "Access pattern indicates repeated cache probing",
      cycles_per_branch: "Execution timing changed during suspicious memory access",
      branches_per_kinst: "Control-flow activity resembles known attack windows",
      ipc: "Instruction throughput dropped during the suspicious window",
      cache_miss_rate_roll_mean_5: "Abnormal cache behavior persisted across recent windows",
      branch_miss_rate: "Branch behavior supports the side-channel pattern"
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
        { features: { cache_misses: 149, cache_references: 139866, instructions: 704519, cycles: 2637200, branches: 122831, branch_misses: 11525 }, label: "attack" },
        { features: { cache_misses: 78887, cache_references: 556178, instructions: 1706780, cycles: 4978970, branches: 299316, branch_misses: 34462 }, label: "benign" }
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
      
      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
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
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      state.scanOffset = (state.scanOffset + 2) % 160;
      
      if (series.length < 2) return;
      
      const drawLine = (getter, color, width, fill) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        
        const pts = [];
        series.forEach((row, index) => {
          const x = index * (w / Math.max(1, series.length - 1));
          const y = h - getter(row) * (h - 20) - 10;
          pts.push({x,y});
        });
        
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
           ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        
        if (fill) {
           ctx.lineTo(w, h);
           ctx.lineTo(0, h);
           ctx.fillStyle = fill;
           ctx.fill();
        }
      };
      
      drawLine((row) => 1 - Number(row.attack_score || 0), "rgba(20, 184, 166, 0.9)", 2, "rgba(20, 184, 166, 0.05)");
      drawLine((row) => Number(row.attack_score || 0), "rgba(239, 68, 68, 0.9)", 2, "rgba(239, 68, 68, 0.05)");
      
      const attackPoints = [];
      series.forEach((row, index) => {
        if (row.prediction !== "attack") return;
        const x = index * (w / Math.max(1, series.length - 1));
        const y = h - Number(row.attack_score || 0) * (h - 20) - 10;
        attackPoints.push({ x, y, index });
        
        ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      let lastLabelX = -999;
      attackPoints
        .filter((point) => point.index > series.length - 24)
        .slice(-3)
        .forEach((point) => {
          if (Math.abs(point.x - lastLabelX) < 125) return;
          lastLabelX = point.x;
          ctx.fillStyle = "#fecaca";
          ctx.font = "bold 11px Outfit, sans-serif";
          ctx.fillText("ATTACK", Math.min(point.x + 8, w - 50), Math.max(20, point.y - 8));
        });
    }

    function threatLevel(rate, confidence) {
      if (rate >= 0.45 || (confidence >= 0.94 && rate >= 0.28)) return ["HIGH", "text-red", "Active side-channel attack detected."];
      if (rate >= 0.18) return ["MEDIUM", "text-amber", "Suspicious hardware-counter activity is rising."];
      return ["LOW", "text-green", "No active attack pattern in the recent stream."];
    }

    function renderInsights(row) {
      if (!row) {
        $("insights").innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Waiting for the first detection event.</div>';
        return;
      }
      $("latestMeta").textContent = row.prediction === "attack" ? "ATTACK FLAGGED" : "NORMAL TRAFFIC";
      $("latestMeta").className = row.prediction === "attack" ? "status-pill danger" : "status-pill active";
      
      const items = (row.feature_contributions || []).slice(0, 4);
      $("insights").innerHTML = items.length ? items.map((item) => {
        const title = insightCopy[item.feature] || item.label || "Signal changed from baseline";
        const impact = Math.min(100, Math.round(Math.abs(item.impact || 0) / 0.24 * 100));
        const cls = item.impact >= 0 ? "attack" : "safe";
        const note = item.direction === "attack" ? "Raises attack score" : "Supports benign classification";
        return '<div class="insight-item"><div class="insight-header"><span class="insight-title">' + safeText(title) + '</span><span class="insight-impact ' + cls + '">' + impact + '%</span></div><div class="insight-bar-bg"><div class="insight-bar-fill ' + cls + '" style="width:' + impact + '%"></div></div><div class="insight-desc">' + safeText(note) + '</div></div>';
      }).join("") : '<div style="color:var(--text-muted);font-size:13px;">Persisted events do not include feature contributions. Run a new sample.</div>';
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
        return '<div class="insight-item"><div class="insight-header"><span class="insight-title">' + safeText(name) + '</span><span class="insight-impact safe">' + width + '%</span></div><div class="insight-bar-bg"><div class="insight-bar-fill safe" style="width:' + width + '%"></div></div><div class="insight-desc" style="font-family: \\'JetBrains Mono\\', monospace; font-size: 11px;">' + groups[name].map(safeText).join(", ") + '</div></div>';
      }).join("");
    }

    function renderLive() {
      const rows = state.rows.slice(-120);
      const latest = rows[rows.length - 1] || null;
      const recentAttack = rows.slice(-12).reverse().find((row) => row.prediction === "attack") || null;
      const incident = recentAttack || latest;
      const activeAttack = Boolean(recentAttack);
      const persistedTotals = state.persisted?.totals;
      
      const total = Number(persistedTotals?.total ?? rows.length);
      const attacks = Number(persistedTotals?.attacks ?? rows.filter((row) => row.prediction === "attack").length);
      const attackRate = total ? attacks / total : 0;
      
      const avgLatency = Number(persistedTotals?.avg_latency_ms ?? (rows.length ? rows.reduce((s, r) => s + Number(r.latency_ms || 0), 0) / rows.length : 0));
      const avgConfidence = Number(persistedTotals?.avg_confidence ?? (rows.length ? rows.reduce((s, r) => s + Number(r.confidence || 0), 0) / rows.length : 0));
      const level = threatLevel(attackRate, avgConfidence);
      
      $("primaryThreat").className = activeAttack ? "glass-panel threat-panel attack-active" : "glass-panel threat-panel";
      $("threatBadge").className = activeAttack ? "status-pill danger" : "status-pill active";
      $("threatBadge").textContent = activeAttack ? "ACTIVE ATTACK DETECTED" : "Monitoring";
      
      $("primaryThreatTitle").textContent = activeAttack ? "ACTIVE SIDE-CHANNEL ATTACK DETECTED" : "No active side-channel attack detected";
      $("primaryThreatReason").textContent = activeAttack
        ? "Unusual cache access patterns indicate memory probing behavior."
        : "Recent hardware counter windows are consistent with benign execution.";
        
      $("riskLevel").textContent = activeAttack ? "HIGH" : level[0];
      $("riskLevel").className = activeAttack ? "value text-red" : "value " + level[1];
      $("attackType").textContent = activeAttack ? "Cache-Based Side-Channel Attack" : "No active attack pattern";
      $("primaryConfidence").textContent = incident ? pct(incident.confidence) : "0%";
      
      const isMitigating = activeAttack && incident?.mitigation?.action === "rate_limit";
      $("mitigationBox").className = isMitigating ? "mitigation-status mitigating" : "mitigation-status";
      $("mitigationAction").textContent = activeAttack
        ? (isMitigating ? "Rate limiting suspicious traffic" : "Suspicious source under observation")
        : "Allowing normal traffic";
        
      $("sourceId").textContent = incident?.source_id || "demo-client";
      $("repeatCount").textContent = String(incident?.mitigation?.attack_count || 0);
      
      $("systemNarrative").textContent = activeAttack
        ? "EdgeShield is detecting abnormal cache behavior consistent with side-channel attack patterns. Detection and mitigation occur at the edge with millisecond latency."
        : "EdgeShield is continuously inspecting hardware counter windows at the edge and is ready to mitigate suspicious cache behavior before it reaches the application.";
      $("systemNarrative").className = activeAttack ? "narrative-box alert" : "narrative-box";
      
      $("attackRate").textContent = pct(attackRate);
      const delta = attackRate - state.previousAttackRate;
      $("attackTrend").textContent = Math.abs(delta) < 0.02 ? "stable" : (delta > 0 ? "increasing" : "decreasing");
      state.previousAttackRate = attackRate;
      
      $("avgLatency").textContent = ms(avgLatency);
      $("avgConfidence").textContent = pct(avgConfidence);
      $("rowCount").textContent = rows.length + " events";
      
      drawThreatStream(rows);
      
      $("feed").innerHTML = rows.slice(-12).reverse().map((row) => {
        const action = row.mitigation?.action || "allow";
        return '<tr class="' + (row.prediction === "attack" ? "attack-row" : "") + '"><td>' + new Date(row.timestamp).toLocaleTimeString() + '</td><td><span class="badge ' + row.prediction + '">' + row.prediction + '</span></td><td>' + pct(row.confidence) + '</td><td>' + ms(row.latency_ms) + '</td><td><span class="badge ' + action + '">' + actionLabel(action) + '</span></td></tr>';
      }).join("");
      
      renderInsights(incident);
    }

    async function runSample(forcedMode) {
      const selected = forcedMode || $("mode").value;
      const mode = selected === "mixed" ? (Math.random() < 0.38 ? "attack" : "benign") : selected;
      const response = await fetch("/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, os: "mixed", sourceId: "demo-client" })
      });
      const data = await response.json();
      state.rows.push(data);
      renderLive();
    }

    async function runAttackBurst() {
      for (let index = 0; index < 3; index += 1) {
        await runSample("attack");
      }
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

    function exportLive(format) {
      const rows = state.rows.slice(-120);
      if (format === "json") download("edgeshield-live.json", "application/json", JSON.stringify(rows, null, 2));
      else download("edgeshield-live.csv", "text/csv", rowsToCsv(rows, ["timestamp","prediction","confidence","attack_score","latency_ms","worker_latency_ms"]));
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
      $("datasetErrors").innerHTML = (report.validation_errors || []).map((error) => '<div style="border-left: 3px solid var(--neon-red); padding: 8px 10px; background: rgba(239,68,68,0.1); border-radius: 4px; margin-bottom: 4px;">' + safeText(error) + '</div>').join("");
      setTimeout(() => { $("datasetProgress").style.width = "0%"; }, 1200);
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

    document.querySelectorAll(".tab-btn").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".view-content").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.view).classList.add("active");
        requestAnimationFrame(() => drawThreatStream(state.rows.slice(-120)));
      });
    });

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

    $("tick").addEventListener("click", () => runSample());
    $("attackCta").addEventListener("click", () => { $("mode").value = "attack"; runAttackBurst().catch(console.error); });
    $("toggle").addEventListener("click", () => {
      state.running = !state.running;
      $("toggle").textContent = state.running ? "Pause Stream" : "Resume Stream";
      $("demoState").textContent = state.running ? "Simulation" : "Paused";
    });
    
    $("exportLiveJson").addEventListener("click", () => exportLive("json"));

    setInterval(() => { if (state.running) runSample().catch(console.error); }, 1200);
    setInterval(() => { if (state.rows.length) drawThreatStream(state.rows.slice(-120)); }, 140);
    setInterval(() => { loadPersistedStats().catch(console.error); }, 7000);
    
    loadEvaluation().catch(console.error);
    loadPersistedStats().catch(console.error);
    renderLive();
    runAttackBurst().catch(console.error);
  </script>
</body>
</html>`;
}

