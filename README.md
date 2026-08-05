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

## Test the live-data parser

The Field Conditions tool reads official data directly in the visitor's browser from the National Weather Service, U.S. Geological Survey, and OpenFEMA APIs. Location access is opt-in; coordinates are not stored by Survival Nexus. OpenFEMA receives only the state abbreviation resolved by NWS.

Run the parser tests with Node.js 18 or newer:

```sh
node --test tests/field-conditions.test.js
```
