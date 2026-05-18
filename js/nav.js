// Shared site navigation — single source of truth for all pages.
// Each page includes: <div id="site-nav"></div><script src="../js/nav.js"></script>
// (use "js/nav.js" without "../" on index.html)

(function () {
  const PAGES = [
    { href: 'neural-networks.html', label: 'Neural Nets' },
    { href: 'deep-learning.html',   label: 'Deep Learning' },
    { href: 'cnn.html',             label: 'CNN' },
    { href: 'attention.html',       label: 'Attention' },
    { href: 'generative-ai.html',   label: 'Generative AI' },
    { href: 'reinforcement.html',   label: 'RL' },
    { href: 'unsupervised.html',    label: 'Unsupervised' },
    { href: 'quiz.html',            label: 'Quiz' },
    { href: 'midterm-quiz.html',    label: 'Midterm Quiz' },
    { href: 'midterm-exam.html',    label: 'Midterm Exam' },
    { href: 'evolution.html',       label: 'Evolution' },
    { href: 'final-exam.html',      label: 'Final Exam' },
    { href: 'cheatsheet.html',      label: 'Cheat Sheet' }
  ];

  // Detect whether we're on index.html (root) or inside /pages/
  const path = window.location.pathname;
  const inPagesDir = /\/pages\//.test(path);
  const fileName = path.split('/').pop() || 'index.html';

  const homeHref = inPagesDir ? '../index.html' : 'index.html';
  const pagePrefix = inPagesDir ? '' : 'pages/';

  const links = PAGES.map(p => {
    const active = (fileName === p.href) ? ' class="active"' : '';
    return `<a href="${pagePrefix}${p.href}"${active}>${p.label}</a>`;
  }).join('\n      ');

  const html = `
<nav class="navbar">
  <a href="${homeHref}" class="nav-brand">ML Visual Guide</a>
  <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">☰</button>
  <div class="nav-links" id="navLinks">
      ${links}
  </div>
</nav>`;

  const mount = document.getElementById('site-nav');
  if (mount) {
    mount.outerHTML = html;
  } else {
    // Fallback: insert at top of body
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // Mobile toggle
  const toggle = document.getElementById('navToggle');
  const links_el = document.getElementById('navLinks');
  if (toggle && links_el) {
    toggle.addEventListener('click', () => links_el.classList.toggle('open'));
  }
})();
