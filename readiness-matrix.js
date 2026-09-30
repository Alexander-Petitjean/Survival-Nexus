(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function calculateReadiness(settings) {
    const values = {
      householdSize: clamp(Number(settings.householdSize) || 1, 1, 8),
      waterDays: clamp(Number(settings.waterDays) || 1, 1, 14),
      alertCoverage: clamp(Number(settings.alertCoverage) || 0, 0, 2),
      medicationPlan: clamp(Number(settings.medicationPlan) || 0, 0, 2),
      communicationPlan: clamp(Number(settings.communicationPlan) || 0, 0, 2),
      chargingPlan: clamp(Number(settings.chargingPlan) || 0, 0, 2),
      practiceDrill: clamp(Number(settings.practiceDrill) || 0, 0, 2),
      shelterPlan: clamp(Number(settings.shelterPlan) || 0, 0, 2)
    };

    const rawScore = Math.round(
      (values.alertCoverage * 15) +
      (values.medicationPlan * 15) +
      (values.communicationPlan * 15) +
      (values.chargingPlan * 12) +
      (values.practiceDrill * 12) +
      (values.shelterPlan * 12) +
      Math.min(18, values.waterDays * 1.5) +
      Math.min(12, values.householdSize * 1.5)
    );
    const score = Math.round((rawScore / 192) * 100);

    const label = score >= 85 ? 'Ready for a rough first 72 hours' : score >= 70 ? 'Solid, but not finished' : score >= 50 ? 'Useful foundation, important gaps remain' : 'High-risk gaps need attention';

    const improvements = [];
    if (values.waterDays < 3) improvements.push('Increase water storage for at least three days and refill rotation dates.');
    if (values.alertCoverage < 2) improvements.push('Add local alert enrollment and a battery-powered radio or NOAA weather receiver.');
    if (values.medicationPlan < 2) improvements.push('Create a medication and accessibility plan with backup locations and refill timing.');
    if (values.communicationPlan < 2) improvements.push('Define a call tree and a backup contact outside the local area.');
    if (values.chargingPlan < 2) improvements.push('Build a charging layer for phones, batteries, and essential devices.');
    if (values.practiceDrill < 2) improvements.push('Run a short drill for departure, shelter, and check-in timing.');
    if (values.shelterPlan < 2) improvements.push('Set a shelter and temperature plan for heat, smoke, or cold.');

    return {
      score,
      label,
      summary: `This plan scores ${score}/100. ${label}.`,
      actions: improvements.length ? improvements : ['Your plan has a good baseline. Keep reviewing it every season and after major life changes.']
    };
  }

  function getReadinessMessage(score) {
    if (score >= 85) return 'Strong baseline. Keep rotating supplies, testing gear, and revising the plan after major life changes.';
    if (score >= 70) return 'Good progress. Focus on the weakest layer, then practice the full household sequence together.';
    if (score >= 50) return 'Useful start. A few simple additions can reduce a lot of stress during a disruption.';
    return 'The system needs more structure. Start with water, alerts, medicines, and a realistic evacuation route.';
  }

  if (typeof window !== 'undefined') {
    window.SurvivalReadinessCalculator = { calculateReadiness, getReadinessMessage };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateReadiness, getReadinessMessage };
  }
})();
