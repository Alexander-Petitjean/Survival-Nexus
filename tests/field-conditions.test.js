const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeAlerts,
  normalizeForecast,
  normalizeEarthquakes,
  groupFemaDeclarations
} = require('../field-conditions.js');

const severityRank = new Map([['Extreme', 0], ['Severe', 1], ['Moderate', 2], ['Minor', 3], ['Unknown', 4]]);
const urgencyRank = new Map([['Immediate', 0], ['Expected', 1], ['Future', 2], ['Past', 3], ['Unknown', 4]]);

test('NWS alerts normalize and sort by severity then urgency', () => {
  const alerts = normalizeAlerts({ features: [
    { properties: { event: 'Advisory', severity: 'Minor', urgency: 'Expected' } },
    { properties: { event: 'Warning', severity: 'Severe', urgency: 'Immediate' } },
    { properties: { event: 'Watch', severity: 'Severe', urgency: 'Future' } }
  ] }, severityRank, urgencyRank);
  assert.deepEqual(alerts.map(alert => alert.properties.event), ['Warning', 'Watch', 'Advisory']);
});

test('NWS alerts accept an empty result', () => {
  assert.deepEqual(normalizeAlerts({ features: [] }, severityRank, urgencyRank), []);
});

test('NWS alerts reject a malformed response', () => {
  assert.throws(() => normalizeAlerts({}, severityRank, urgencyRank), /features array/);
});

test('NWS forecast returns daily and hourly periods', () => {
  const result = normalizeForecast(
    { properties: { periods: [{ name: 'Today', temperature: 70 }] } },
    { properties: { periods: [{ startTime: '2026-08-04T12:00:00Z', temperature: 68 }] } }
  );
  assert.equal(result.periods[0].name, 'Today');
  assert.equal(result.hours[0].temperature, 68);
});

test('NWS forecast accepts empty period arrays', () => {
  assert.deepEqual(normalizeForecast({ properties: { periods: [] } }, { properties: { periods: [] } }), { periods: [], hours: [] });
});

test('NWS forecast rejects missing period arrays', () => {
  assert.throws(() => normalizeForecast({ properties: {} }, { properties: { periods: [] } }), /expected periods/);
});

test('USGS earthquakes preserve valid GeoJSON features', () => {
  const feature = { properties: { mag: 3.2 }, geometry: { coordinates: [-118, 34, 8] } };
  assert.deepEqual(normalizeEarthquakes({ features: [feature] }), [feature]);
});

test('USGS earthquakes accept an empty catalog', () => {
  assert.deepEqual(normalizeEarthquakes({ features: [] }), []);
});

test('USGS earthquakes reject a malformed response', () => {
  assert.throws(() => normalizeEarthquakes(null), /features array/);
});

test('FEMA records group designated areas by disaster number', () => {
  const declarations = groupFemaDeclarations({ DisasterDeclarationsSummaries: [
    { disasterNumber: 5000, declarationDate: '2026-08-01T00:00:00Z', designatedArea: 'Alpha County' },
    { disasterNumber: 5000, declarationDate: '2026-08-01T00:00:00Z', designatedArea: 'Beta County' },
    { disasterNumber: 4999, declarationDate: '2026-07-01T00:00:00Z', designatedArea: 'Gamma County' }
  ] });
  assert.equal(declarations.length, 2);
  assert.deepEqual(declarations[0].areas, ['Alpha County', 'Beta County']);
});

test('FEMA records accept an empty result', () => {
  assert.deepEqual(groupFemaDeclarations({ DisasterDeclarationsSummaries: [] }), []);
});

test('FEMA records reject a malformed response', () => {
  assert.throws(() => groupFemaDeclarations({}), /declaration records/);
});
