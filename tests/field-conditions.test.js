const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeAlerts,
  normalizeForecast,
  normalizeEarthquakes,
  distanceKm,
  trendForReadings,
  normalizeStreamGauges,
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

test('distance calculation returns a useful nearby distance', () => {
  const distance = distanceKm(39.7392, -104.9903, 40.015, -105.2705);
  assert.ok(distance > 35 && distance < 50);
});

test('stream trend recognizes rising, falling, and steady readings', () => {
  const readings = (first, last) => [
    { value: String(first), dateTime: '2026-08-14T10:00:00Z' },
    { value: String(last), dateTime: '2026-08-14T16:00:00Z' }
  ];
  assert.equal(trendForReadings(readings(100, 120), '00060'), 'Rising');
  assert.equal(trendForReadings(readings(100, 80), '00060'), 'Falling');
  assert.equal(trendForReadings(readings(100, 102), '00060'), 'Steady');
  assert.equal(trendForReadings([{ value: '100', dateTime: '2026-08-14T16:00:00Z' }], '00060'), 'Trend unavailable');
  assert.equal(trendForReadings([{ value: null, dateTime: '2026-08-14T16:00:00Z' }], '00060'), 'Trend unavailable');
});

test('USGS water series group parameters by site and sort by distance', () => {
  const makeSeries = (siteNumber, name, latitude, longitude, parameterCode, values) => ({
    sourceInfo: {
      siteName: name,
      siteCode: [{ value: siteNumber }],
      geoLocation: { geogLocation: { latitude, longitude } }
    },
    variable: { variableCode: [{ value: parameterCode }], unit: { unitCode: parameterCode === '00060' ? 'ft3/s' : 'ft' } },
    values: [{ value: values }]
  });
  const data = { value: { timeSeries: [
    makeSeries('002', 'Far Creek', 40.5, -105, '00060', [{ value: '50', dateTime: '2026-08-14T16:00:00Z' }]),
    makeSeries('001', 'Near Creek', 40.01, -105, '00060', [
      { value: '100', dateTime: '2026-08-14T10:00:00Z' },
      { value: '120', dateTime: '2026-08-14T16:00:00Z' }
    ]),
    makeSeries('001', 'Near Creek', 40.01, -105, '00065', [{ value: '3.2', dateTime: '2026-08-14T16:00:00Z' }])
  ] } };
  const gauges = normalizeStreamGauges(data, 40, -105, 3);
  assert.deepEqual(gauges.map(gauge => gauge.siteNumber), ['001', '002']);
  assert.equal(gauges[0].metrics['00060'].trend, 'Rising');
  assert.equal(gauges[0].metrics['00065'].value, 3.2);
});

test('USGS water normalization accepts empty results and rejects malformed data', () => {
  assert.deepEqual(normalizeStreamGauges({ value: { timeSeries: [] } }, 40, -105), []);
  assert.throws(() => normalizeStreamGauges({}, 40, -105), /missing time series/);
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
