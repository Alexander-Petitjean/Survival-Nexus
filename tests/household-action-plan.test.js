const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHouseholdActionPlan } = require('../household-action-plan.js');

test('household plan combines readiness priorities with a household-specific kit estimate', () => {
  const result = buildHouseholdActionPlan({
    adults: 2,
    children: 1,
    pets: 1,
    days: 3,
    gear: 4,
    medical: 2,
    waterDays: 1,
    alertCoverage: 0,
    medicationPlan: 0,
    communicationPlan: 0,
    chargingPlan: 0,
    practiceDrill: 0,
    shelterPlan: 0
  });

  assert.equal(result.householdSize, 3);
  assert.equal(result.pets, 1);
  assert.equal(result.kit.waterLiters, 31.5);
  assert.ok(result.priorities.some(action => /child-specific/i.test(action)));
  assert.ok(result.priorities.some(action => /pet-friendly/i.test(action)));
  assert.ok(result.readiness.score < 50);
  assert.ok(result.readiness.actions.some(action => /water/i.test(action)));
  assert.match(result.packAdvice, /load|weight|carry|split|distribute/i);
});

test('a well-prepared household receives the existing baseline maintenance action', () => {
  const result = buildHouseholdActionPlan({
    adults: 2,
    children: 0,
    pets: 0,
    days: 3,
    gear: 2,
    medical: 1,
    waterDays: 7,
    alertCoverage: 2,
    medicationPlan: 2,
    communicationPlan: 2,
    chargingPlan: 2,
    practiceDrill: 2,
    shelterPlan: 2
  });

  assert.ok(result.readiness.score >= 85);
  assert.match(result.readiness.actions[0], /baseline|season/i);
});
