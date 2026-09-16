const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreWildfireRisk, getRiskGuidance } = require('../wildfire-risk.js');

test('severe wildfire conditions produce a high-risk score and strong guidance', () => {
  const result = scoreWildfireRisk({
    region: 'west',
    fuel: 'dry',
    wind: 'high',
    slope: 'steep',
    alert: 'evacuation',
    prepared: 'low'
  });

  assert.ok(result.score >= 80);
  assert.match(result.label, /High|Severe/);
  assert.ok(result.guidance.length > 0);
  assert.match(getRiskGuidance(result.score), /leave|evacuate|avoid/);
});

test('lower-risk conditions score better and suggest practical preparation', () => {
  const result = scoreWildfireRisk({
    region: 'nonwest',
    fuel: 'moist',
    wind: 'low',
    slope: 'gentle',
    alert: 'watch',
    prepared: 'high'
  });

  assert.ok(result.score < 50);
  assert.match(result.label, /Low|Moderate/);
  assert.ok(result.guidance.some(item => /prepare|review|maintain/i.test(item)));
});
