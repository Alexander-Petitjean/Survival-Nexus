/* ============================
   Survival Nexus - app.js
   Modular Frontend Script
============================ */

const THEME_STORAGE_KEY = 'survival-nexus-theme';

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

applyTheme(getPreferredTheme());

document.addEventListener("DOMContentLoaded", () => {
  ensureSkipLink();
  injectHeader();
  initThemeToggle();
  initNavToggle();
  injectFooter();
  setCurrentYear();
  highlightActiveNav();
  initSupplierFilters();
});

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const syncToggle = () => {
    const theme = document.documentElement.dataset.theme || getPreferredTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    toggle.setAttribute('title', `Switch to ${nextTheme} theme`);
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    toggle.querySelector('[data-theme-icon]').textContent = theme === 'dark' ? '☀' : '☾';
    toggle.querySelector('[data-theme-label]').textContent = theme === 'dark' ? 'Light' : 'Dark';
  };

  toggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies for the current page.
    }
    syncToggle();
  });

  syncToggle();
}

function ensureSkipLink() {
  const main = document.querySelector('main');
  if (!main) return;
  if (!main.id) main.id = 'main';
  if (document.querySelector('.skip-link')) return;
  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = `#${main.id}`;
  link.textContent = 'Skip to content';
  document.body.prepend(link);
}

/* ----- NAV TOGGLE ----- */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-navigation');
  if (!toggle || !nav) return;
  const mobile = window.matchMedia('(max-width: 820px)');

  if (!toggle.hasAttribute('type')) toggle.type = 'button';

  const setOpen = (open, returnFocus = false) => {
    const shouldOpen = mobile.matches && open;
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    nav.classList.toggle('is-open', shouldOpen);
    nav.toggleAttribute('inert', mobile.matches && !shouldOpen);
    if (returnFocus) toggle.focus();
  };

  const syncViewport = () => {
    if (mobile.matches) {
      setOpen(false);
    } else {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      nav.removeAttribute('inert');
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });

  document.addEventListener('click', event => {
    if (
      toggle.getAttribute('aria-expanded') === 'true' &&
      !nav.contains(event.target) &&
      !toggle.contains(event.target)
    ) setOpen(false);
  });

  mobile.addEventListener?.('change', syncViewport);
  syncViewport();
}

/* ----- SHARED HEADER ----- */
function injectHeader() {
  const header = document.getElementById('siteHeader') || document.querySelector('header.site-header');
  if (!header) return;
  header.classList.add('site-header');
  const existingNav = header.querySelector('.navbar');
  const markup = `
    <nav class="navbar" aria-label="Primary">
      <div class="logo"><a href="index.html" aria-label="Survival Nexus home">Survival Nexus</a></div>
      <div class="nav-actions">
        <button class="theme-toggle" type="button" aria-pressed="false">
          <span data-theme-icon aria-hidden="true">☀</span>
          <span data-theme-label>Light</span>
        </button>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation">
          <span aria-hidden="true">☰</span><span class="sr-only">Menu</span>
        </button>
      </div>
      <ul id="primary-navigation" class="nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="guides.html">Guides</a></li>
        <li><a href="suppliers.html">Suppliers</a></li>
        <li><a href="Reviews.html">Reviews</a></li>
        <li><a href="scenarios.html">Scenarios</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>
  `;
  if (existingNav) existingNav.outerHTML = markup;
  else header.insertAdjacentHTML('afterbegin', markup);
}

/* ----- FOOTER INJECTION ----- */
function injectFooter() {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;
  footer.classList.add('site-footer');
  footer.innerHTML = `
    <div class="footer-grid">
      <section class="footer-brand">
        <p><strong>Survival Nexus</strong> — Practical preparedness research, adaptive design, guides, and gear notes.</p>
		<p class="ai-note"> Some images on this site are AI-generated for illustrative purposes only and do not depict real people or events.</p>
      </section>
      <nav class="footer-nav" aria-label="Footer">
        <ul class="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="guides.html">Guides</a></li>
          <li><a href="suppliers.html">Suppliers</a></li>
          <li><a href="Reviews.html">Reviews</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="disclosure.html">Affiliate Disclosure</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
        </ul>
      </nav>
      <section class="footer-legal">
        <p>© <span id="year"></span> Survival Nexus. All rights reserved.</p>
        <p class="affiliate-note">As an Amazon Associate I earn from qualifying purchases.</p>
      </section>
    </div>
  `;
}

/* ----- YEAR AUTO-UPDATE ----- */
function setCurrentYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}

/* ----- ACTIVE NAV HIGHLIGHT ----- */
function highlightActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const current = location.pathname.split('/').pop() || 'index.html';
  const guidePages = new Set([
    'cold-firecraft.html',
    'water-disinfection.html',
    'shock-recognition.html',
    'emt-kit-basics.html',
    'vagabond-travel.html',
    'treasure-tools.html',
    'fire-readiness.html',
    'hypothermia.html',
    '72-hour-packloadbalance.html'
  ]);

  links.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });

  const currentLink = Array.from(links).find(link => link.getAttribute('href') === current);
  const activeLink = currentLink || (
    guidePages.has(current)
      ? Array.from(links).find(link => link.getAttribute('href') === 'guides.html')
      : null
  );
  if (activeLink) {
    activeLink.classList.add('active');
    if (currentLink) activeLink.setAttribute('aria-current', 'page');
  }
}

/* ----- SUPPLIER FILTERS ----- */
function initSupplierFilters() {
  const form = document.getElementById('supplier-filters');
  const grid = document.getElementById('supplierGrid');
  const count = document.getElementById('resultsCount');
  if (!form || !grid || !count) return;

  const cards = Array.from(grid.querySelectorAll(':scope > .supplier-card'));
  const values = () => new FormData(form);
  const numbers = text => (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);

  const apply = () => {
    const data = values();
    const query = String(data.get('q') || '').trim().toLowerCase();
    const category = String(data.get('category') || '');
    const cert = String(data.get('certs') || '').toLowerCase();
    const region = String(data.get('region') || '').toLowerCase();
    const maxLead = Number(data.get('lead')) || Infinity;
    let visible = 0;

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const leadValues = numbers(card.querySelector('.lead')?.textContent || '');
      const cardMaxLead = leadValues.length ? Math.max(...leadValues) : Infinity;
      const matches =
        (!query || text.includes(query)) &&
        (!category || card.id === category) &&
        (!cert || text.includes(cert)) &&
        (!region || text.includes(region) || text.includes('worldwide') || text.includes('global')) &&
        cardMaxLead <= maxLead;
      card.hidden = !matches;
      if (matches) visible += 1;
    });

    count.textContent = `Showing ${visible} ${visible === 1 ? 'supplier' : 'suppliers'}`;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    apply();
  });
  form.addEventListener('input', apply);
  form.addEventListener('reset', () => requestAnimationFrame(apply));
  apply();
}
