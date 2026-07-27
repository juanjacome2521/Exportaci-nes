/**
 * Interactive Ecuador Export Dashboard (2014-2025)
 * Official Data: Banco Central del Ecuador (USD FOB Millions)
 */

// Dataset: [Year, Total_USD, Petroleras_USD, No_Petroleras_USD]
const exportData = [
  [2014, 25732.3, 13302.5, 12429.8],
  [2015, 18330.6,  6660.3, 11670.3],
  [2016, 16797.7,  5459.2, 11338.5],
  [2017, 19122.5,  6913.6, 12208.9],
  [2018, 21606.1,  8801.7, 12804.4],
  [2019, 22329.4,  8679.6, 13649.8],
  [2020, 20355.4,  5250.4, 15105.0],
  [2021, 26699.0,  8607.0, 18092.0],
  [2022, 32658.0, 11587.0, 21071.0],
  [2023, 31126.0,  8952.0, 22175.0],
  [2024, 34421.0,  9572.0, 24849.0],
  [2025, 37152.0,  7750.1, 29401.9]
];

// Product ranking dataset (2025)
let productData = [
  { name: 'Camarón', type: 'Tradicional', val: 8401.3, share: 28.6, growth: 20.2 },
  { name: 'Cacao y elaborados', type: 'Tradicional', val: 4668.3, share: 15.9, growth: 29.0 },
  { name: 'Banano y plátano', type: 'Tradicional', val: 4262.4, share: 14.5, growth: 11.0 },
  { name: 'Productos mineros', type: 'No tradicional', val: 4163.3, share: 14.2, growth: 35.4 },
  { name: 'Enlatados de pescado', type: 'No tradicional', val: 1848.0, share: 6.3, growth: 10.3 },
  { name: 'Flores naturales', type: 'No tradicional', val: 1044.7, share: 3.6, growth: 2.8 },
  { name: 'Madera y elaborados', type: 'No tradicional', val: 512.1, share: 1.7, growth: 4.5 },
  { name: 'Atún y pescado fresco', type: 'No tradicional', val: 418.9, share: 1.4, growth: -1.2 }
];

let sortState = { key: 'val', asc: false };
let currentSeriesFilter = 'all';

// Number Formatter
const formatCurrency = (val) => {
  return 'USD ' + val.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M';
};

const formatPct = (val) => {
  return (val >= 0 ? '+' : '') + val.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
};

// SVG Helper
function createSvg(width, height, content) {
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

// Sparklines for KPI Cards
function renderSparkline(containerId, dataIdx, colorVar) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const w = 180, h = 30, padding = 4;
  const vals = exportData.map(r => r[dataIdx]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const points = vals.map((v, i) => {
    const x = padding + (i / (vals.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((v - min) / (max - min || 1)) * (h - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  container.innerHTML = createSvg(w, h, `
    <polyline fill="none" stroke="${colorVar}" stroke-width="2" stroke-linejoin="round" points="${points}" />
  `);
}

// Render Main Line / Area Trend Chart
function renderTrendChart() {
  const container = document.getElementById('trendChartContainer');
  if (!container) return;

  const w = 820, h = 310;
  const p = { top: 20, right: 20, bottom: 40, left: 55 };
  const maxVal = 40000;

  const getX = (i) => p.left + (i / (exportData.length - 1)) * (w - p.left - p.right);
  const getY = (val) => h - p.bottom - (val / maxVal) * (h - p.top - p.bottom);

  let svgContent = '';

  // Y-Axis Grid & Labels
  const yTicks = [0, 10000, 20000, 30000, 40000];
  yTicks.forEach(tick => {
    const y = getY(tick);
    svgContent += `
      <line x1="${p.left}" y1="${y}" x2="${w - p.right}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4,4" />
      <text x="${p.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="11" text-anchor="end">${tick === 0 ? '0' : (tick/1000) + 'k'}</text>
    `;
  });

  // X-Axis Labels (Years)
  exportData.forEach((r, i) => {
    const x = getX(i);
    svgContent += `
      <text x="${x}" y="${h - 12}" fill="var(--text-muted)" font-size="11" text-anchor="middle">${r[0]}</text>
    `;
  });

  // Smooth Path Generator (Bezier Curves)
  const getBezierPath = (idx) => {
    const pts = exportData.map((r, i) => ({ x: getX(i), y: getY(r[idx]) }));
    return pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
    }, '');
  };

  // Draw Series Lines & Gradients
  const seriesConfig = [
    { idx: 1, id: 'all', color: 'var(--accent-blue)', name: 'Total' },
    { idx: 3, id: 'non_oil', color: 'var(--accent-emerald)', name: 'No Petrolera' },
    { idx: 2, id: 'oil', color: 'var(--accent-amber)', name: 'Petrolera' }
  ];

  // Defs for Gradients
  svgContent += `
    <defs>
      <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0.0"/>
      </linearGradient>
      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-emerald)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--accent-emerald)" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
  `;

  seriesConfig.forEach(s => {
    if (currentSeriesFilter !== 'all' && currentSeriesFilter !== s.id) return;
    const linePath = getBezierPath(s.idx);

    // Area Fill for Total and Non-Oil
    if (s.id === 'all') {
      const areaPath = `${linePath} L ${getX(exportData.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;
      svgContent += `<path d="${areaPath}" fill="url(#gradBlue)" />`;
    } else if (s.id === 'non_oil') {
      const areaPath = `${linePath} L ${getX(exportData.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;
      svgContent += `<path d="${areaPath}" fill="url(#gradEmerald)" />`;
    }

    svgContent += `<path d="${linePath}" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />`;

    // Data Point Dots
    exportData.forEach((r, i) => {
      svgContent += `
        <circle cx="${getX(i)}" cy="${getY(r[s.idx])}" r="4" fill="${s.color}" stroke="var(--bg-secondary)" stroke-width="2" class="chart-point" data-year="${r[0]}" data-val="${r[s.idx]}" data-name="${s.name}" />
      `;
    });
  });

  container.innerHTML = createSvg(w, h, svgContent);
}

// Render Donut Chart
function renderDonutChart() {
  const container = document.getElementById('donutContainer');
  if (!container) return;

  const nonOilVal = 29401.9;
  const oilVal = 7750.1;
  const total = nonOilVal + oilVal;
  const nonOilShare = nonOilVal / total;

  const size = 220;
  const r = 74;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dashNonOil = circ * nonOilShare;

  const svg = createSvg(size, size, `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--accent-amber)" stroke-width="22" opacity="0.8" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--accent-emerald)" stroke-width="22" 
            stroke-dasharray="${dashNonOil} ${circ}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" />
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="var(--font-heading)" font-size="28" font-weight="700" fill="var(--text-main)">79,14%</text>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" font-weight="500" fill="var(--text-muted)">No Petroleras</text>
  `);

  container.innerHTML = svg;
}

// Render Growth Bar Chart
function renderBarChart() {
  const container = document.getElementById('barChartContainer');
  if (!container) return;

  const w = 560, h = 250;
  const p = { top: 20, right: 15, bottom: 35, left: 45 };

  // Calculate Interannual Growth % for Non-Oil
  const growthData = exportData.slice(1).map((r, i) => {
    const prev = exportData[i][3];
    const curr = r[3];
    const pct = ((curr - prev) / prev) * 100;
    return { year: r[0], pct };
  });

  const minPct = -10, maxPct = 25;
  const getX = (i) => p.left + (i / growthData.length) * (w - p.left - p.right);
  const getY = (pct) => h - p.bottom - ((pct - minPct) / (maxPct - minPct)) * (h - p.top - p.bottom);
  const zeroY = getY(0);
  const barWidth = ((w - p.left - p.right) / growthData.length) * 0.55;

  let svgContent = '';

  // Grid Lines
  [-10, 0, 10, 20].forEach(val => {
    const y = getY(val);
    svgContent += `
      <line x1="${p.left}" y1="${y}" x2="${w - p.right}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <text x="${p.left - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="11" text-anchor="end">${val}%</text>
    `;
  });

  // Bars
  growthData.forEach((d, i) => {
    const x = getX(i) + ((w - p.left - p.right) / growthData.length - barWidth) / 2;
    const y = getY(Math.max(0, d.pct));
    const height = Math.abs(getY(d.pct) - zeroY);
    const color = d.pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)';

    svgContent += `
      <rect x="${x}" y="${d.pct >= 0 ? y : zeroY}" width="${barWidth}" height="${height}" fill="${color}" rx="3" opacity="0.9" />
      <text x="${x + barWidth / 2}" y="${h - 12}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${d.year}</text>
    `;
  });

  container.innerHTML = createSvg(w, h, svgContent);
}

// Render Products Data Table
function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  const searchInput = document.getElementById('tableSearch');
  if (!tbody) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = productData.filter(p => p.name.toLowerCase().includes(query) || p.type.toLowerCase().includes(query));

  // Sort
  filtered.sort((a, b) => {
    let valA = a[sortState.key];
    let valB = b[sortState.key];
    if (typeof valA === 'string') {
      return sortState.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortState.asc ? valA - valB : valB - valA;
  });

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge ${p.type === 'Tradicional' ? 'tradicional' : 'no-tradicional'}">${p.type}</span></td>
      <td class="num font-mono"><strong>USD ${p.val.toLocaleString('es-EC', {minimumFractionDigits:1})} M</strong></td>
      <td class="num">${p.share.toFixed(1).replace('.', ',')}%</td>
      <td class="num ${p.growth >= 0 ? 'kpi-meta positive' : 'kpi-meta negative'}">
        ${formatPct(p.growth)}
      </td>
    </tr>
  `).join('');
}

// CSV Export Download Trigger
function setupExportCsv() {
  const btn = document.getElementById('downloadCsv');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const csvHeader = 'anio,exportaciones_totales_usd_millones,petroleras_usd_millones,no_petroleras_usd_millones\n';
    const csvRows = exportData.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exportaciones_ecuador_2014_2025.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

// Print / PDF Report Trigger
function setupPrintReport() {
  const btn = document.getElementById('printReport');
  if (!btn) return;
  btn.addEventListener('click', () => window.print());
}

// Theme Toggle
function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    renderTrendChart();
    renderDonutChart();
    renderBarChart();
  });
}

// Series Filter Control
function setupSeriesFilter() {
  const select = document.getElementById('seriesFilter');
  if (!select) return;

  select.addEventListener('change', (e) => {
    currentSeriesFilter = e.target.value;
    renderTrendChart();
  });
}

// Table Sorting Handlers
function setupTableSorting() {
  document.querySelectorAll('.data-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (sortState.key === key) {
        sortState.asc = !sortState.asc;
      } else {
        sortState.key = key;
        sortState.asc = false;
      }
      renderProductsTable();
    });
  });

  const searchInput = document.getElementById('tableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', renderProductsTable);
  }
}

// Initialize Application
function initDashboard() {
  renderSparkline('sparkTotal', 1, 'var(--accent-blue)');
  renderSparkline('sparkNonOil', 3, 'var(--accent-emerald)');
  renderSparkline('sparkOil', 2, 'var(--accent-amber)');

  renderTrendChart();
  renderDonutChart();
  renderBarChart();
  renderProductsTable();

  setupExportCsv();
  setupPrintReport();
  setupThemeToggle();
  setupSeriesFilter();
  setupTableSorting();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
