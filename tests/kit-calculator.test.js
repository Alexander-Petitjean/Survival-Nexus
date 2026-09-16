const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateKitLoad, getPackAdvice } = require('../kit-calculator.js');

test('kit calculator totals water and gear weight for a household and returns specific advice', () => {
  const result = calculateKitLoad({
    adults: 2,
    children: 1,
    pets: 1,
    days: 3,
    gear: 4,
    medical: 2
  });

  assert.ok(result.waterLiters > 0);
  assert.ok(result.totalWeightKg > 0);
  assert.ok(result.totalWeightKg > result.baseWeightKg);
  assert.match(getPackAdvice(result.totalWeightKg), /heavy|pack|split|distribute/i);
});

test('smaller household loads remain lighter and prefer simple guidance', () => {
  const result = calculateKitLoad({
    adults: 1,
    children: 0,
    pets: 0,
    days: 2,
    gear: 2,
    medical: 1
  });

  assert.ok(result.totalWeightKg < 30);
  assert.match(getPackAdvice(result.totalWeightKg), /manageable|light|carry/i);
});
