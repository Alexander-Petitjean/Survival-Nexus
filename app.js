/* ============================
   Survival Nexus - app.js
   Modular Frontend Script
============================ */

const THEME_STORAGE_KEY = 'survival-nexus-theme';
const ANALYTICS_CONSENT_KEY = 'survival-nexus-analytics-consent';
const GA_MEASUREMENT_ID = 'G-K6FEKZZ86S';

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
  syncThemeImages(theme);
}

applyTheme(getPreferredTheme());

document.addEventListener("DOMContentLoaded", () => {
  ensureSkipLink();
  injectHeader();
  initThemeImages();
  initThemeToggle();
  initNavToggle();
  injectFooter();
  initAnalyticsConsent();
  setCurrentYear();
  highlightActiveNav();
  initSupplierFilters();
  initSiteSearch();
  initEmergencyChecklist();
  injectRelatedContent();
});

function getDaylightImageSrc(src) {
  return src
    .replace(/-noir\.png$/i, '-daylight.webp')
    .replace(/-noir\.webp$/i, '-daylight.webp');
}

function initThemeImages() {
  document.querySelectorAll('img[src*="-noir."]').forEach((img) => {
    const darkSrc = img.getAttribute('src');
    if (!darkSrc) return;
    img.dataset.darkSrc = darkSrc;
    img.dataset.lightSrc = getDaylightImageSrc(darkSrc);
  });
  syncThemeImages(document.documentElement.dataset.theme || getPreferredTheme());
}

function syncThemeImages(theme) {
  if (!document.body) return;
  document.querySelectorAll('img[data-dark-src][data-light-src]').forEach((img) => {
    const nextSrc = theme === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (nextSrc && img.getAttribute('src') !== nextSrc) img.setAttribute('src', nextSrc);
  });
}

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

/* ----- OPTIONAL ANALYTICS ----- */
function loadAnalytics() {
  if (document.querySelector('script[data-survival-nexus-analytics]')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.dataset.survivalNexusAnalytics = 'true';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.append(script);
}

function initAnalyticsConsent() {
  let savedChoice = null;
  try { savedChoice = localStorage.getItem(ANALYTICS_CONSENT_KEY); } catch { /* Storage is optional. */ }
  if (savedChoice === 'accepted') loadAnalytics();
  if (savedChoice === 'accepted' || savedChoice === 'declined') return;

  const banner = document.createElement('section');
  banner.className = 'analytics-consent';
  banner.setAttribute('aria-label', 'Analytics preference');
  banner.innerHTML = `
    <div>
      <strong>Help improve Survival Nexus?</strong>
      <p>With your permission, Google Analytics will measure visits and which guides are useful. It stays off unless you accept. <a href="privacy.html#analytics">Privacy details</a></p>
    </div>
    <div class="analytics-consent-actions">
      <button class="secondary-button" type="button" data-analytics-choice="declined">No thanks</button>
      <button class="cta-button" type="button" data-analytics-choice="accepted">Allow analytics</button>
    </div>
  `;
  document.body.append(banner);

  banner.addEventListener('click', event => {
    const choice = event.target.closest('[data-analytics-choice]')?.dataset.analyticsChoice;
    if (!choice) return;
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, choice); } catch { /* Apply for this page only. */ }
    if (choice === 'accepted') loadAnalytics();
    banner.remove();
  });
}

function resetAnalyticsPreference() {
  try { localStorage.removeItem(ANALYTICS_CONSENT_KEY); } catch { /* Storage is optional. */ }
  location.reload();
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
        <a class="search-link" href="search.html" aria-label="Search Survival Nexus">Search</a>
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
        <li><a class="conditions-nav-link" href="field-conditions.html">Live Conditions</a></li>
        <li><a href="guides.html">Guides</a></li>
        <li><a href="suppliers.html">Suppliers</a></li>
        <li><a href="gear-buyers-guide.html">Buyer’s Guide</a></li>
        <li><a href="Reviews.html">Reviews</a></li>
        <li><a href="scenarios.html">Scenarios</a></li>
        <li><a href="field-choices.html">Field Game</a></li>
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
          <li><a href="gear-buyers-guide.html">Buyer’s Guide</a></li>
          <li><a href="search.html">Search</a></li>
          <li><a href="field-conditions.html">Field Conditions</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="disclosure.html">Affiliate Disclosure</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><button class="footer-button" id="analyticsPreferences" type="button">Analytics choices</button></li>
        </ul>
      </nav>
      <section class="footer-legal">
        <p>© <span id="year"></span> Survival Nexus. All rights reserved.</p>
        <p class="affiliate-note">As an Amazon Associate I earn from qualifying purchases.</p>
      </section>
    </div>
  `;
  footer.querySelector('#analyticsPreferences')?.addEventListener('click', resetAnalyticsPreference);
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
    '72-hour-packloadbalance.html',
    '72-hour-emergency-kit.html',
    '72-hour-checklist.html',
    'ten-essentials.html'
  ]);
  const reviewPages = new Set(['72-hour-gear-comparisons.html']);

  links.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });

  const currentLink = Array.from(links).find(link => link.getAttribute('href') === current);
  const activeLink = currentLink || (
    guidePages.has(current) || reviewPages.has(current)
      ? Array.from(links).find(link => link.getAttribute('href') === (reviewPages.has(current) ? 'Reviews.html' : 'guides.html'))
      : null
  );
  if (activeLink) {
    activeLink.classList.add('active');
    if (currentLink) activeLink.setAttribute('aria-current', 'page');
  }
}

/* ----- 72-HOUR CHECKLIST ----- */
function initEmergencyChecklist() {
  const form = document.getElementById('emergency-checklist');
  const progress = document.getElementById('checklist-progress');
  const reset = document.getElementById('reset-checklist');
  const print = document.getElementById('print-checklist');
  if (!form || !progress || !reset || !print) return;

  const storageKey = 'survival-nexus-72-hour-checklist';
  const boxes = Array.from(form.querySelectorAll('input[type="checkbox"]'));

  const updateProgress = () => {
    const checked = boxes.filter(box => box.checked).length;
    progress.textContent = `${checked} of ${boxes.length} items checked`;
  };

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(boxes.filter(box => box.checked).map(box => box.id)));
    } catch {
      // The checklist remains usable when storage is unavailable.
    }
  };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) boxes.forEach(box => { box.checked = saved.includes(box.id); });
  } catch {
    // Ignore invalid or unavailable saved state.
  }

  form.addEventListener('change', () => {
    save();
    updateProgress();
  });
  reset.addEventListener('click', () => {
    boxes.forEach(box => { box.checked = false; });
    try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    updateProgress();
  });
  print.addEventListener('click', () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'print_checklist', { content_name: '72-Hour Emergency Checklist' });
    }
    window.print();
  });
  updateProgress();
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

/* ----- SITE SEARCH ----- */
async function initSiteSearch() {
  const form = document.getElementById('site-search-form');
  const input = document.getElementById('site-search-input');
  const results = document.getElementById('site-search-results');
  const summary = document.getElementById('site-search-summary');
  if (!form || !input || !results || !summary) return;

  let index = [];
  try {
    const response = await fetch('search-index.json');
    if (!response.ok) throw new Error(`Search index returned ${response.status}`);
    index = await response.json();
  } catch {
    summary.textContent = 'Search is temporarily unavailable. Browse the Guides or Resources pages instead.';
    return;
  }

  const render = query => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if (!terms.length) {
      summary.textContent = 'Enter a skill, situation, or piece of gear.';
      return;
    }

    const matches = index
      .map(item => {
        const searchable = `${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
        const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

    summary.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'} for “${query.trim()}”`;
    for (const { item } of matches) {
      const card = document.createElement('article');
      card.className = 'search-result-card';
      const title = document.createElement('h2');
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title;
      const description = document.createElement('p');
      description.textContent = item.description;
      const type = document.createElement('span');
      type.className = 'badge';
      type.textContent = item.type;
      title.append(link);
      card.append(type, title, description);
      results.append(card);
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value;
    const url = new URL(location.href);
    if (query.trim()) url.searchParams.set('q', query.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    render(query);
  });

  const initialQuery = new URLSearchParams(location.search).get('q') || '';
  input.value = initialQuery;
  render(initialQuery);
}

/* ----- RELATED CONTENT ----- */
function injectRelatedContent() {
  const current = location.pathname.split('/').pop();
  const related = {
    'cold-firecraft.html': ['fire-readiness.html', 'hypothermia.html', 'scenarios.html#fire'],
    'fire-readiness.html': ['cold-firecraft.html', 'water-disinfection.html', 'scenarios.html#fire'],
    'water-disinfection.html': ['emt-kit-basics.html', 'vagabond-travel.html', 'resources.html'],
    'shock-recognition.html': ['emt-kit-basics.html', 'hypothermia.html', 'scenarios.html#emt'],
    'emt-kit-basics.html': ['shock-recognition.html', 'hypothermia.html', 'resources.html'],
    'hypothermia.html': ['cold-firecraft.html', 'shock-recognition.html', 'scenarios.html#emt'],
    'vagabond-travel.html': ['ten-essentials.html', '72-hour-packloadbalance.html', 'water-disinfection.html'],
    '72-hour-packloadbalance.html': ['72-hour-emergency-kit.html', 'vagabond-travel.html', 'scenarios.html#hiking'],
    '72-hour-emergency-kit.html': ['72-hour-checklist.html', 'index.html#preparedness-blueprint', '72-hour-gear-comparisons.html'],
    '72-hour-checklist.html': ['72-hour-emergency-kit.html', '72-hour-packloadbalance.html', 'resources.html'],
    '72-hour-gear-comparisons.html': ['72-hour-emergency-kit.html', '72-hour-checklist.html', 'resources.html'],
    'ten-essentials.html': ['index.html#preparedness-blueprint', '72-hour-packloadbalance.html', 'water-disinfection.html'],
    'treasure-tools.html': ['scenarios.html#treasure', 'Reviews.html', 'suppliers.html#treasure']
  }[current];
  const main = document.querySelector('main');
  if (!related || !main || main.querySelector('.related-content')) return;

  const labels = {
    'cold-firecraft.html': 'Cold-Weather Firecraft',
    'fire-readiness.html': 'Fire Readiness 101',
    'water-disinfection.html': 'Water Disinfection',
    'shock-recognition.html': 'Shock Recognition',
    'emt-kit-basics.html': 'EMT Kit Basics',
    'hypothermia.html': 'Hypothermia & Heat Retention',
    'vagabond-travel.html': 'Vagabonding Essentials',
    '72-hour-packloadbalance.html': '72-Hour Pack Load Balance',
    '72-hour-emergency-kit.html': '72-Hour Emergency Kit Guide',
    '72-hour-checklist.html': 'Printable 72-Hour Checklist',
    '72-hour-gear-comparisons.html': '72-Hour Gear Comparisons',
    'ten-essentials.html': 'The Ten Essentials',
    'index.html#preparedness-blueprint': 'The Preparedness Blueprint',
    'Reviews.html': 'Gear Reviews',
    'resources.html': 'Training & Resources',
    'suppliers.html#treasure': 'Treasure Suppliers',
    'scenarios.html#fire': 'Fire Scenarios',
    'scenarios.html#emt': 'Medical Scenarios',
    'scenarios.html#hiking': 'Hiking Scenarios',
    'scenarios.html#treasure': 'Recovery Scenarios'
  };
  const section = document.createElement('section');
  section.className = 'related-content';
  section.setAttribute('aria-labelledby', 'related-content-heading');
  const heading = document.createElement('h2');
  heading.id = 'related-content-heading';
  heading.textContent = 'Continue learning';
  const list = document.createElement('ul');
  for (const url of related) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.textContent = labels[url] || url;
    item.append(link);
    list.append(item);
  }
  section.append(heading, list);
  main.append(section);
}
