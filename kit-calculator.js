(function () {
  function calculateKitLoad(settings) {
    const adults = Number(settings.adults || 0);
    const children = Number(settings.children || 0);
    const pets = Number(settings.pets || 0);
    const days = Number(settings.days || 1);
    const gear = Number(settings.gear || 0);
    const medical = Number(settings.medical || 0);

    const personWaterLiters = 3;
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

  if (typeof window !== 'undefined') {
    window.KitCalculator = { calculateKitLoad, getPackAdvice };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateKitLoad, getPackAdvice };
  }
})();
