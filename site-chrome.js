(function () {
  // where am I? (root vs subfolder)
  const path = location.pathname;
  const isSub = /\/guides\//.test(path);    // add other subfolders if needed
  const base = isSub ? "../" : "./";

  // helper to stamp year
  const year = new Date().getFullYear();

  // unified footer HTML
  const footerHTML = `
    <p>&copy; <span class="js-year">${year}</span> Survival Nexus. All rights reserved.</p>
    <p>
      <a href="${base}disclaimer.html">Disclaimer</a> |
      <a href="${base}privacy.html">Privacy Policy</a>
    </p>
    <p class="text-dim small">
      Survival Nexus participates in affiliate programs (e.g., AvantLink) and may earn commissions from qualifying purchases.
    </p>
  `;

  // inject footer
  const mount = document.getElementById("siteFooter");
  if (mount) {
    mount.innerHTML = footerHTML;
  }

  // OPTIONAL: fix Home link in the navbar automatically
  const homeLink = document.querySelector('.nav-links a[href$="index.html"]');
  if (homeLink) homeLink.setAttribute("href", base + "index.html");
})();
