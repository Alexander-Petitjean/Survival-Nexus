const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateReadiness, getReadinessMessage } = require('../readiness-matrix.js');

test('strong household readiness scores highly with a brief recommendation list', () => {
  const result = calculateReadiness({
    householdSize: 4,
    waterDays: 7,
    alertCoverage: 2,
    medicationPlan: 2,
    communicationPlan: 2,
    chargingPlan: 2,
    practiceDrill: 2,
    shelterPlan: 2
  });

  assert.ok(result.score >= 85);
  assert.match(result.label, /Ready/);
  assert.equal(Array.isArray(result.actions), true);
  assert.ok(result.actions.length > 0);
  assert.match(getReadinessMessage(result.score), /Strong|Good/);
});

test('weak plans receive a lower score and actionable improvement steps', () => {
  const result = calculateReadiness({
    householdSize: 5,
    waterDays: 1,
    alertCoverage: 0,
    medicationPlan: 0,
    communicationPlan: 0,
    chargingPlan: 0,
    practiceDrill: 0,
    shelterPlan: 0
  });

  assert.ok(result.score < 50);
  assert.match(result.label, /High-risk/);
  assert.ok(result.actions.some(action => /water|alert|medication|communication/i.test(action)));
  assert.match(getReadinessMessage(result.score), /needs more structure|Start/);
});
