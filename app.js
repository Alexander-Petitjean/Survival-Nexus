/* ============================
   Survival Nexus - app.js
   Modular Frontend Script
============================ */

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  injectFooter();
  setCurrentYear();
  highlightActiveNav();
  guideMetaBootstrap(); // new
});

/* ----- NAV TOGGLE ----- */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-navigation');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
}

/* ----- FOOTER INJECTION ----- */
function injectFooter() {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-grid">
      <section class="footer-brand">
        <p><strong>Survival Nexus</strong> — Gear, guides, and field-tested know-how for EMTs, explorers, and vagabonds.</p>
		<p class="ai-note"> Some images on this site are AI-generated for illustrative purposes only and do not depict real people or events.</p>
      </section>
      <nav class="footer-nav" aria-label="Footer">
        <ul class="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="guides.html">Guides</a></li>
          <li><a href="suppliers.html">Suppliers</a></li>
          <li><a href="reviews.html">Reviews</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="disclosure.html">Affiliate Disclosure</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
        </ul>
      </nav>
      <section class="footer-legal">
        <p>© <span id="year"></span> Survival Nexus. All rights reserved.</p>
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
  links.forEach(link => {
    if (link.getAttribute('href') === current) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* =========================================
   Guide metadata + JSON-LD injector (NEW)
========================================= */
function guideMetaBootstrap() {
  if (!/\/guides\//.test(location.pathname)) return; // only on guide pages

  fetch('../assets/data/guides-meta.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => applyGuideMeta(data))
    .catch(() => {/* fail silently if file missing */});
}

function applyGuideMeta(data) {
  const filename = location.pathname.split('/').pop();
  const site = data.site || {};
  const guide = (data.guides || []).find(g => g.slug === filename);
  if (!guide) return;

  // Title
  const brand = site.brand || 'Survival Nexus';
  const pageTitle = `${guide.title} | ${brand}`;
  document.title = pageTitle;

  // Meta description
  upsertMeta('description', guide.description || '');

  // Canonical
  const base = (site.baseUrl || '').replace(/\/+$/, ''); // strip trailing slash
  const canonicalHref = base ? `${base}/guides/${guide.slug}` : null;
  if (canonicalHref) upsertLink('canonical', canonicalHref);

  // Open Graph / Twitter (nice to have)
  upsertMeta('og:title', pageTitle, 'property');
  upsertMeta('og:description', guide.description || '', 'property');
  if (guide.image && base) upsertMeta('og:image', `${base}${guide.image}`, 'property');
  upsertMeta('og:type', 'article', 'property');

  upsertMeta('twitter:card', 'summary_large_image', 'name');
  upsertMeta('twitter:title', pageTitle, 'name');
  upsertMeta('twitter:description', guide.description || '', 'name');
  if (guide.image && base) upsertMeta('twitter:image', `${base}${guide.image}`, 'name');

  // JSON-LD (HowTo default)
  const schema = buildHowToSchema(guide, brand, base);
  upsertJsonLd('guide-howto', schema);
}

/* Helpers: meta/link/ld upsert */
function upsertMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${cssEscape(name)}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${cssEscape(rel)}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, obj) {
  if (!obj) return;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

/* Build a HowTo schema from meta JSON */
function buildHowToSchema(guide, brand, base) {
  const imageAbs = (base && guide.image) ? `${base}${guide.image}` : undefined;
  const supplies = (guide.supply || []).map(s => ({ "@type": "HowToSupply", "name": s }));
  const tools = (guide.tool || []).map(t => ({ "@type": "HowToTool", "name": t }));
  const steps = (guide.steps || []).map(st => ({
    "@type": "HowToStep",
    "name": st.name || "",
    "text": st.text || ""
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": guide.type === 'HowTo' ? "HowTo" : "Article",
    "name": guide.title,
    "description": guide.description || "",
    "image": imageAbs,
    "publisher": { "@type": "Organization", "name": brand }
  };

  if (schema["@type"] === "HowTo") {
    if (guide.totalTimeISO) schema.totalTime = guide.totalTimeISO; // e.g., PT20M
    if (guide.estimatedCostUSD) {
      schema.estimatedCost = {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": guide.estimatedCostUSD
      };
    }
    if (supplies.length) schema.supply = supplies;
    if (tools.length) schema.tool = tools;
    if (steps.length) schema.step = steps;
  }

  return schema;
}

/* Small util: escape for attribute selectors */
function cssEscape(s) {
  return (s || '').replace(/["\\]/g, '\\$&');
}
/* =========================================
   Guide metadata (offline embedded)
========================================= */
const guidesMeta = {
  site: {
    brand: "Survival Nexus",
    baseUrl: "file:///C:/path/to/your/project-root"
  },
  guides: [
    {
      slug: "cold-firecraft.html",
      type: "HowTo",
      title: "Cold-Weather Firecraft & Fatwood Chemistry",
      description: "Master ignition in freezing, wet conditions with fatwood resin science, snow platforms, and a timed boil-test drill.",
      image: "/assets/img/guides/cold-firecraft.jpg"
    },
    {
      slug: "water-disinfection.html",
      type: "HowTo",
      title: "Emergency Water Disinfection 101",
      description: "Filters, chemicals, and UV—explained by biological mechanism.",
      image: "/assets/img/guides/water-disinfection.jpg"
    }
    // …and so on
  ]
};
// Auto-highlight current nav link (and footer link) by URL
(function () {
  var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function markActive(rootSelector) {
    var root = document.querySelector(rootSelector);
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var file = href.split('/').pop().toLowerCase();
      if (file === current) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  }

  markActive('#primary-navigation');     // header
  markActive('.footer-links');           // footer (if present)
})();
