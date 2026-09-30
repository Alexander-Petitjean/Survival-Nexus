(function () {
  const readiness = typeof module !== 'undefined' && module.exports
    ? require('./readiness-matrix.js')
    : window.SurvivalReadinessCalculator;
  const kit = typeof module !== 'undefined' && module.exports
    ? require('./kit-calculator.js')
    : window.KitCalculator;

  function buildHouseholdActionPlan(settings) {
    const adults = Number(settings.adults) || 1;
    const children = Number(settings.children) || 0;
    const pets = Number(settings.pets) || 0;
    const householdSize = adults + children;
    const readinessResult = readiness.calculateReadiness({
      householdSize,
      waterDays: settings.waterDays,
      alertCoverage: settings.alertCoverage,
      medicationPlan: settings.medicationPlan,
      communicationPlan: settings.communicationPlan,
      chargingPlan: settings.chargingPlan,
      practiceDrill: settings.practiceDrill,
      shelterPlan: settings.shelterPlan
    });
    const kitResult = kit.calculateKitLoad({
      adults,
      children,
      pets,
      days: settings.days,
      gear: settings.gear,
      medical: settings.medical
    });
    const priorities = [...readinessResult.actions];

    if (children > 0) {
      priorities.unshift('Pack child-specific food, comfort items, clothing, and copies of essential contacts; assign an adult to each child during departure.');
    }
    if (pets > 0) {
      priorities.unshift('Prepare pet carriers or leashes, food, water, medications, identification, and a pet-friendly destination.');
    }

    return {
      householdSize,
      pets,
      readiness: readinessResult,
      priorities,
      kit: kitResult,
      packAdvice: kit.getPackAdvice(kitResult.totalWeightKg)
    };
  }

  function initHouseholdActionPlan() {
    const form = document.getElementById('household-plan-form');
    if (!form) return;

    const scoreNode = document.getElementById('plan-readiness-score');
    const householdSummary = document.getElementById('plan-household-summary');
    const readinessLabel = document.getElementById('plan-readiness-label');
    const waterNode = document.getElementById('plan-water-estimate');
    const weightNode = document.getElementById('plan-weight-estimate');
    const prioritiesNode = document.getElementById('plan-priorities');
    const packAdviceNode = document.getElementById('plan-pack-advice');
    const storageStatus = document.getElementById('plan-storage-status');
    const storageKey = 'survival-nexus-household-action-plan';

    const getSettings = () => Object.fromEntries(new FormData(form).entries());

    const render = () => {
      const settings = getSettings();
      const result = buildHouseholdActionPlan(settings);
      const householdParts = [
        `${result.householdSize} ${result.householdSize === 1 ? 'person' : 'people'}`,
        `${result.pets} ${result.pets === 1 ? 'pet' : 'pets'}`,
        `${Number(settings.days)}-day kit estimate`,
        `${Number(settings.waterDays)} days of stored water selected`
      ];
      householdSummary.textContent = householdParts.join(' · ');
      scoreNode.textContent = String(result.readiness.score);
      readinessLabel.textContent = result.readiness.label;
      waterNode.textContent = `${result.kit.waterLiters} L`;
      weightNode.textContent = `${result.kit.totalWeightKg.toFixed(1)} kg`;
      packAdviceNode.textContent = result.packAdvice;
      prioritiesNode.replaceChildren();

      result.priorities.forEach((action) => {
        const item = document.createElement('li');
        item.textContent = action;
        prioritiesNode.appendChild(item);
      });
    };

    form.addEventListener('change', render);

    try {
      const savedPlan = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (savedPlan && typeof savedPlan === 'object') {
        for (const [name, value] of Object.entries(savedPlan)) {
          const field = form.elements.namedItem(name);
          if (field && [...field.options].some(option => option.value === String(value))) {
            field.value = String(value);
          }
        }
        storageStatus.textContent = 'Saved plan restored from this browser.';
      }
    } catch {
      storageStatus.textContent = 'This browser could not read a saved plan.';
    }

    document.getElementById('save-household-plan').addEventListener('click', () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(getSettings()));
        storageStatus.textContent = 'Plan saved in this browser only.';
      } catch {
        storageStatus.textContent = 'Could not save in this browser. You can still print the plan.';
      }
    });

    document.getElementById('clear-household-plan').addEventListener('click', () => {
      try {
        localStorage.removeItem(storageKey);
        storageStatus.textContent = 'Saved copy cleared. Current answers remain on this page.';
      } catch {
        storageStatus.textContent = 'Could not clear browser storage.';
      }
    });

    document.getElementById('print-household-plan').addEventListener('click', () => window.print());

    render();
  }

  if (typeof window !== 'undefined') {
    window.HouseholdActionPlan = { buildHouseholdActionPlan };
    window.addEventListener('DOMContentLoaded', initHouseholdActionPlan);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildHouseholdActionPlan };
  }
})();
