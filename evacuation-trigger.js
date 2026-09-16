(function () {
  function scoreTriggerPlan(settings) {
    const hazardMap = { none: 0, smoke: 12, flood: 14, fire: 20, wind: 18, utility: 10 };
    const routeMap = { clear: 0, narrowed: 8, blocked: 18, unknown: 12 };
    const alertMap = { none: 0, watch: 10, warning: 20, order: 30 };
    const accessMap = { easy: 0, slow: 8, limited: 16, impossible: 24 };
    const mobilityMap = { ready: -8, moderate: 6, limited: 14 };
    const communicationMap = { strong: -10, partial: 0, weak: 12 };

    const score = Math.min(100, Math.max(0,
      (hazardMap[settings.hazard] || 8) +
      (routeMap[settings.route] || 6) +
      (alertMap[settings.alert] || 8) +
      (accessMap[settings.access] || 8) +
      (mobilityMap[settings.mobility] || 6) +
      (communicationMap[settings.communication] || 6)
    ));

    let label = 'Monitor and review';
    if (score >= 75) label = 'Evacuate now';
    else if (score >= 55) label = 'Prepare to leave soon';
    else if (score >= 35) label = 'Review your trigger threshold';

    const steps = [];
    if (score >= 75) {
      steps.push('Follow the official evacuation order, leave before the road network narrows, and avoid delaying for nonessential tasks.');
      steps.push('Take medicine, documents, chargers, water, and a simple communication plan with you.');
      steps.push('Select the route with the highest likelihood of staying open and check in with your contact plan.');
    } else if (score >= 55) {
      steps.push('Set a firm trigger: when the next condition worsens, leave without waiting for a perfect plan.');
      steps.push('Stage the go bag, review the route, and make sure each person has a known meeting point.');
      steps.push('Confirm that your household can move with medications, mobility needs, pets, and essential communications.');
    } else {
      steps.push('Keep monitoring local alerts and conditions instead of assuming a calm period will last.');
      steps.push('Pre-stage the essentials, define your decision threshold, and rehearse the household departure order.');
      steps.push('Review every dependency: transportation, medicine, access, communication, and a secondary route.');
    }

    return { score, label, steps };
  }

  function getTriggerAdvice(score) {
    if (score >= 75) return 'Immediate departure recommended. Use official instructions, your saved route, and the quickest safe exit.';
    if (score >= 55) return 'Start moving toward a full departure plan and do not wait for a single worsening factor to combine.';
    if (score >= 35) return 'Keep a clear trigger point and practice the decision process so it remains simple under stress.';
    return 'Maintain monitoring and keep the go bag staged so a fast decision is possible when conditions change.';
  }

  function initTriggerPlanner() {
    const form = document.getElementById('trigger-form');
    const scoreNode = document.getElementById('trigger-score');
    const labelNode = document.getElementById('trigger-label');
    const listNode = document.getElementById('trigger-steps');

    if (!form || !scoreNode || !labelNode || !listNode) return;

    const render = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      const result = scoreTriggerPlan(data);
      scoreNode.textContent = `${result.score}`;
      labelNode.textContent = result.label;
      listNode.innerHTML = '';
      result.steps.forEach((step) => {
        const item = document.createElement('li');
        item.textContent = step;
        listNode.appendChild(item);
      });
    };

    form.addEventListener('change', render);
    render();
  }

  if (typeof window !== 'undefined') {
    window.EvacuationTriggerPlanner = { scoreTriggerPlan, getTriggerAdvice, initTriggerPlanner };
    window.addEventListener('DOMContentLoaded', initTriggerPlanner);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { scoreTriggerPlan, getTriggerAdvice };
  }
})();
