(function () {
  function scoreWildfireRisk(settings) {
    const regionMap = { west: 24, nonwest: 8, rural: 16, suburban: 10 };
    const fuelMap = { dry: 20, moderate: 12, moist: 6 };
    const windMap = { low: 4, moderate: 10, high: 18, extreme: 24 };
    const slopeMap = { flat: 2, gentle: 6, steep: 18, ridge: 24 };
    const alertMap = { none: 0, watch: 8, warning: 18, evacuation: 28 };
    const preparedMap = { high: -12, medium: 0, low: 14 };

    const score = Math.min(100, Math.max(0,
      (regionMap[settings.region] || 12) +
      (fuelMap[settings.fuel] || 10) +
      (windMap[settings.wind] || 8) +
      (slopeMap[settings.slope] || 8) +
      (alertMap[settings.alert] || 6) +
      (preparedMap[settings.prepared] || 0)
    ));

    let label = 'Low risk';
    if (score >= 80) label = 'High wildfire risk';
    else if (score >= 60) label = 'Severe risk';
    else if (score >= 40) label = 'Moderate risk';

    const guidance = [];
    if (score >= 80) {
      guidance.push('Leave early if an evacuation notice is issued. Do not delay for nonessential tasks.');
      guidance.push('Reduce ignition sources and keep your route, fuels, and escape plan current before the weather peaks.');
      guidance.push('Prepare a quick-access go bag with documents, medicines, water, and charging gear.');
    } else if (score >= 60) {
      guidance.push('Check local restrictions and prepare an early-warning plan for smoke, wind, and road closures.');
      guidance.push('Keep a defensible shelter, spare water, and communication plan nearby.');
      guidance.push('Review your home ignition risks and make a simple departure checklist.');
    } else {
      guidance.push('Maintain basic wildfire readiness with good defensible-space habits and a reviewed exit plan.');
      guidance.push('Keep equipment and fuels properly stored and check local conditions before using outdoor tools.');
      guidance.push('Review your household alert sources and prepare a simple go bag without overloading it.');
    }

    return { score, label, guidance };
  }

  function getRiskGuidance(score) {
    if (score >= 80) return 'Leave early, avoid unnecessary travel, and follow official evacuation orders.';
    if (score >= 60) return 'Stay alert, prepare an exit route, and keep documents, medicines, and water ready.';
    if (score >= 40) return 'Prepare for changing conditions and review ignition risks before using outdoor equipment.';
    return 'Maintain readiness and monitor local guidance without waiting for a sudden escalation.';
  }

  if (typeof window !== 'undefined') {
    window.WildfireRiskCalculator = { scoreWildfireRisk, getRiskGuidance };
    window.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('wildfire-form');
      if (!form) return;
      const scoreNode = document.getElementById('wildfire-score');
      const labelNode = document.getElementById('wildfire-label');
      const listNode = document.getElementById('wildfire-guidance');
      if (!scoreNode || !labelNode || !listNode) return;
      const render = () => {
        const data = Object.fromEntries(new FormData(form).entries());
        const result = scoreWildfireRisk(data);
        scoreNode.textContent = `${result.score}`;
        labelNode.textContent = result.label;
        listNode.innerHTML = '';
        result.guidance.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          listNode.appendChild(li);
        });
      };
      form.addEventListener('change', render);
      render();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { scoreWildfireRisk, getRiskGuidance };
  }
})();
