// ===== Smooth Scroll =====
document.querySelectorAll('[data-scroll-to]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== Intersection Observer (fade-in) =====
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== Stock Chart (SVG) =====
(function buildChart() {
  const svg = document.getElementById('stockChart');
  if (!svg) return;

  const W = 700, H = 300;
  const pad = { top: 30, right: 30, bottom: 60, left: 60 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  // Data: [つばさ誕生, 反抗期, 大学進学, 現在]
  const labels = ['つばさ誕生', '反抗期', '大学進学', '現在'];
  const values = [280, 180, 340, 420]; // 反抗期で下げ → 以降右肩上がり
  const minV = 80, maxV = 480;

  function xPos(i) {
    return pad.left + (i / (labels.length - 1)) * cW;
  }
  function yPos(v) {
    return pad.top + cH - ((v - minV) / (maxV - minV)) * cH;
  }

  // Defs
  const defs = `
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c9a84c" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#c9a84c" stop-opacity="0.01"/>
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8a6d28"/>
        <stop offset="100%" stop-color="#e8c87a"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>`;

  // Grid lines (horizontal)
  const gridSteps = 4;
  let gridLines = '';
  for (let i = 0; i <= gridSteps; i++) {
    const v = minV + (i / gridSteps) * (maxV - minV);
    const y = yPos(v);
    const label = Math.round(v);
    gridLines += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}"
      stroke="rgba(201,168,76,0.1)" stroke-width="1" stroke-dasharray="4,4"/>`;
    gridLines += `<text x="${pad.left - 10}" y="${y + 4}" text-anchor="end"
      font-size="10" fill="#8a9bbf" font-family="Arial,sans-serif">${label}</text>`;
  }

  // Area path
  const pts = values.map((v, i) => [xPos(i), yPos(v)]);
  let areaD = `M ${pts[0][0]} ${H - pad.bottom}`;
  pts.forEach(([x, y]) => { areaD += ` L ${x} ${y}`; });
  areaD += ` L ${pts[pts.length - 1][0]} ${H - pad.bottom} Z`;

  // Smooth line (cardinal spline approx via cubic bezier)
  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const tension = 0.3;
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  const linePath = smoothPath(pts);

  // X-axis labels
  let xLabels = '';
  labels.forEach((lbl, i) => {
    xLabels += `<text x="${xPos(i)}" y="${H - pad.bottom + 22}" text-anchor="middle"
      font-size="11" fill="#8a9bbf" font-family="'Helvetica Neue',Arial,Meiryo,sans-serif">${lbl}</text>`;
  });

  // Y-axis title
  const yTitle = `<text x="14" y="${pad.top + cH / 2}" text-anchor="middle"
    font-size="10" fill="#8a9bbf" font-family="Arial,sans-serif"
    transform="rotate(-90, 14, ${pad.top + cH / 2})">父親としての企業価値</text>`;

  // Data point dots
  let dots = '';
  pts.forEach(([x, y], i) => {
    const isLast = i === pts.length - 1;
    if (isLast) {
      // pulsing dot at 現在
      dots += `
        <circle cx="${x}" cy="${y}" r="10" fill="rgba(201,168,76,0.15)">
          <animate attributeName="r" values="8;14;8" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x}" cy="${y}" r="5" fill="#c9a84c" filter="url(#glow)"/>
        <circle cx="${x}" cy="${y}" r="3" fill="#fdf8f0"/>`;
      // Annotation bubble
      const bx = x - 70, by = y - 52;
      dots += `
        <rect x="${bx}" y="${by}" width="120" height="36" rx="6"
          fill="#132040" stroke="#c9a84c" stroke-width="1"/>
        <text x="${bx + 60}" y="${by + 14}" text-anchor="middle"
          font-size="9" fill="#c9a84c" font-family="Arial,sans-serif" font-weight="700"
          letter-spacing="0.05em">現在</text>
        <text x="${bx + 60}" y="${by + 28}" text-anchor="middle"
          font-size="9" fill="#e8c87a" font-family="Arial,sans-serif">最高値更新中 ▲</text>
        <line x1="${x}" y1="${by + 36}" x2="${x}" y2="${y - 5}"
          stroke="rgba(201,168,76,0.4)" stroke-width="1" stroke-dasharray="3,2"/>`;
    } else {
      dots += `<circle cx="${x}" cy="${y}" r="4" fill="#c9a84c" opacity="0.7"/>`;
    }
  });

  // X axis line
  const xAxis = `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}"
    stroke="rgba(201,168,76,0.25)" stroke-width="1"/>`;

  svg.innerHTML = defs + gridLines + yTitle +
    `<path d="${areaD}" fill="url(#areaGrad)"/>` +
    `<path d="${linePath}" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>` +
    xAxis + xLabels + dots;
})();
