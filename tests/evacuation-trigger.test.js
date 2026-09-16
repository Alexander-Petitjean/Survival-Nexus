const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreTriggerPlan, getTriggerAdvice } = require('../evacuation-trigger.js');

test('evacuation trigger planner produces a high urgency score under severe conditions', () => {
  const result = scoreTriggerPlan({
    hazard: 'fire',
    route: 'blocked',
    alert: 'order',
    access: 'impossible',
    mobility: 'limited',
    communication: 'weak'
  });

  assert.ok(result.score >= 75);
  assert.match(result.label, /Evacuate/);
  assert.ok(result.steps.length > 0);
  assert.match(getTriggerAdvice(result.score), /Immediate|leave|departure/i);
});

test('monitoring conditions yield a lower urgency without overreacting', () => {
  const result = scoreTriggerPlan({
    hazard: 'none',
    route: 'clear',
    alert: 'watch',
    access: 'easy',
    mobility: 'ready',
    communication: 'strong'
  });

  assert.ok(result.score < 35);
  assert.match(result.label, /Monitor|Review/);
  assert.ok(result.steps.some(step => /monitor|review|staged/i.test(step)));
});
