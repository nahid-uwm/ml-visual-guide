/* ============================================
   ML Visual Guide — Shared Utilities
   ============================================ */

// ── Tab System ──
function initTabs(container) {
  const tabs = container.querySelectorAll('.tab');
  const contents = container.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = container.querySelector(`#${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// Init all tab groups on page load
function initAllTabs() {
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
}

// ── Mobile Nav ──
function initNav() {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
    }
  });
}

// ── Intersection Observer for animations ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-slide-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.card, .demo-container, .formula').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.5s ease';
    observer.observe(el);
  });
}
function observeEl(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.5s ease';
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(el);
}

// ── Math Utilities ──
const sigmoid = x => 1 / (1 + Math.exp(-x));
const sigmoid_d = x => { const s = sigmoid(x); return s * (1 - s); };
const relu = x => Math.max(0, x);
const relu_d = x => x > 0 ? 1 : 0;
const leakyRelu = (x, a = 0.01) => x > 0 ? x : a * x;
const leakyRelu_d = (x, a = 0.01) => x > 0 ? 1 : a;
const tanh_fn = x => Math.tanh(x);
const tanh_d = x => 1 - Math.tanh(x) ** 2;
const step = (x, T = 0) => x >= T ? 1 : 0;
const softmax = arr => { const m = Math.max(...arr); const e = arr.map(v => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };

// ── Canvas Drawing Utilities ──
function clearCanvas(ctx, bg = '#0d1220') {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawGrid(ctx, color = 'rgba(255,255,255,0.04)') {
  const { width, height } = ctx.canvas;
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  const step = 40;
  ctx.beginPath();
  for (let x = 0; x <= width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let y = 0; y <= height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
}

function drawAxes(ctx, cx, cy, w, h, color = 'rgba(255,255,255,0.2)') {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - w/2, cy); ctx.lineTo(cx + w/2, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx, cy + h/2); ctx.stroke();
}

function drawFunction(ctx, fn, xMin, xMax, cx, cy, scaleX, scaleY, color, lineWidth = 2.5) {
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath();
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * (i / steps);
    const y = fn(x);
    const px = cx + x * scaleX;
    const py = cy - y * scaleY;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Activation Function Plotter ──
function plotActivation(canvasId, fnName) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const scaleX = W / 8, scaleY = H / 3;

  clearCanvas(ctx, '#0d1220');
  drawGrid(ctx);
  drawAxes(ctx, cx, cy, W, H);

  // Tick labels
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
  [-3,-2,-1,1,2,3].forEach(v => {
    ctx.fillText(v, cx + v * scaleX, cy + 15);
    ctx.fillText(v, cx - 22, cy - v * scaleY + 4);
  });

  const fns = {
    sigmoid: { fn: sigmoid, color: '#00d4ff', label: 'σ(x) = 1/(1+e⁻ˣ)', range: '(0,1)' },
    relu:    { fn: relu,    color: '#10b981', label: 'ReLU(x) = max(0,x)', range: '[0,∞)' },
    leaky:   { fn: x => leakyRelu(x, 0.1), color: '#f59e0b', label: 'Leaky ReLU(x)', range: '(-∞,∞)' },
    tanh:    { fn: tanh_fn, color: '#a855f7', label: 'tanh(x)', range: '(-1,1)' },
    step:    { fn: step,    color: '#ef4444', label: 'Step(x)', range: '{0,1}' },
  };

  const f = fns[fnName] || fns.sigmoid;
  drawFunction(ctx, f.fn, -4, 4, cx, cy, scaleX, scaleY, f.color);

  // Derivative
  const derivFns = { sigmoid: sigmoid_d, relu: relu_d, leaky: x => leakyRelu_d(x, 0.1), tanh: tanh_d, step: () => 0 };
  const df = derivFns[fnName] || derivFns.sigmoid;
  drawFunction(ctx, df, -4, 4, cx, cy, scaleX, scaleY, f.color.replace('ff', '66').replace(')', ',0.4)'), 1.5);

  // Label
  ctx.fillStyle = f.color; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
  ctx.fillText(f.label, 10, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px monospace';
  ctx.fillText(`Range: ${f.range}`, 10, 36);
  ctx.fillText('— f(x)   - - f′(x)', 10, H - 10);
}

// ── Sigmoid/activation demo ──
function computeActivation(netInput, fnName) {
  switch(fnName) {
    case 'sigmoid': return sigmoid(netInput);
    case 'relu': return relu(netInput);
    case 'leaky': return leakyRelu(netInput, 0.1);
    case 'tanh': return tanh_fn(netInput);
    case 'step': return step(netInput, 0);
    default: return sigmoid(netInput);
  }
}

// ── Number formatting ──
const fmt = (n, d = 4) => parseFloat(n.toFixed(d));
const pct = n => (n * 100).toFixed(1) + '%';

// ── Color interpolation ──
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return `rgb(${Math.round(lerp(c1[0],c2[0],t))},${Math.round(lerp(c1[1],c2[1],t))},${Math.round(lerp(c1[2],c2[2],t))})`;
}
function heatColor(v, alpha = 1) {
  // 0 = dark blue, 1 = bright cyan/white
  const r = Math.round(v * 100);
  const g = Math.round(v * 200);
  const b = Math.round(100 + v * 155);
  return `rgba(${r},${g},${b},${alpha})`;
}
function attentionColor(weight) {
  // weight 0→1, color from dim to bright purple/blue
  const r = Math.round(lerp(13, 168, weight));
  const g = Math.round(lerp(18, 85, weight));
  const b = Math.round(lerp(32, 247, weight));
  return `rgba(${r},${g},${b},${0.3 + weight * 0.7})`;
}

// ── Initialize on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initAllTabs();
  initNav();
});
