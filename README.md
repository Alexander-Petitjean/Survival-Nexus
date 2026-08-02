# Survival Nexus

A static collection of practical preparedness guides, scenarios, gear reviews, and supplier notes.

## Preview locally

Serve the project root with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validate the site

Node.js 18 or newer is recommended. The validator checks page titles, descriptions, primary headings, duplicate IDs, JSON-LD, and local links/assets.

```sh
node scripts/check-site.mjs
```

Run the validator whenever pages, links, scripts, stylesheets, or images change.
