(function () {
  function calculateKitLoad(settings) {
    const adults = Number(settings.adults || 0);
    const children = Number(settings.children || 0);
    const pets = Number(settings.pets || 0);
    const days = Number(settings.days || 1);
    const gear = Number(settings.gear || 0);
    const medical = Number(settings.medical || 0);

    const personWaterLiters = 3; // rough emergency target, liters per person per day
    const petWaterLiters = 1.5;
    const waterLiters = Math.max(0, ((adults + children) * personWaterLiters * days) + (pets * petWaterLiters * days));
    const baseWeightKg = waterLiters * 1.0 + gear * 2.5 + medical * 3.0 + 4;
    const totalWeightKg = Number((baseWeightKg + (adults + children + pets) * 1.5).toFixed(1));

    return {
      waterLiters: Number(waterLiters.toFixed(1)),
      baseWeightKg: Number(baseWeightKg.toFixed(1)),
      totalWeightKg,
      people: adults + children,
      pets
    };
  }

  function getPackAdvice(weight) {
    if (weight > 45) return 'Heavy load: split the kit between two bags, keep the most-used items near the top, and carry the heaviest layer in a vehicle or designated cache.';
    if (weight > 25) return 'Moderate load: keep the plan simple, distribute weight evenly, and use smaller bins to prevent overpacking.';
    if (weight > 12) return 'Manageable load: organize by priority, keep daily-use items accessible, and rotate water and food before expiration.';
    return 'Light load: maintain a compact go bag, ensure it is truly grab-and-go, and add storage only for the essentials you can carry without strain.';
  }

  function initKitCalculator() {
    const form = document.getElementById('kit-form');
    const resultNode = document.getElementById('kit-result');
    const waterNode = document.getElementById('kit-water');
    const totalNode = document.getElementById('kit-total');
    const adviceNode = document.getElementById('kit-advice');

    if (!form || !resultNode || !waterNode || !totalNode || !adviceNode) return;

    const render = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      const result = calculateKitLoad(data);
      resultNode.textContent = `${result.totalWeightKg.toFixed(1)} kg`;
      waterNode.textContent = `${result.waterLiters} L water`;
      totalNode.textContent = `Base load ${result.baseWeightKg.toFixed(1)} kg · household ${result.people + result.pets} total`;
      adviceNode.textContent = getPackAdvice(result.totalWeightKg);
    };

    form.addEventListener('change', render);
    render();
  }

  if (typeof window !== 'undefined') {
    window.KitCalculator = { calculateKitLoad, getPackAdvice, initKitCalculator };
    window.addEventListener('DOMContentLoaded', initKitCalculator);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateKitLoad, getPackAdvice };
  }
})();
