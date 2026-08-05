const FieldConditionsCore = (() => {
  function expectFeatures(data, source) {
    if (!data || !Array.isArray(data.features)) throw new Error(`${source} response is missing a features array.`);
    return data.features;
  }

  function normalizeAlerts(data, severityRank, urgencyRank) {
    return [...expectFeatures(data, 'NWS alerts')].sort((a, b) => {
      const aProperties = a?.properties || {};
      const bProperties = b?.properties || {};
      return (severityRank.get(aProperties.severity) ?? 4) - (severityRank.get(bProperties.severity) ?? 4)
        || (urgencyRank.get(aProperties.urgency) ?? 4) - (urgencyRank.get(bProperties.urgency) ?? 4);
    });
  }

  function normalizeForecast(forecastData, hourlyData) {
    const periods = forecastData?.properties?.periods;
    const hours = hourlyData?.properties?.periods;
    if (!Array.isArray(periods) || !Array.isArray(hours)) throw new Error('NWS forecast response is missing expected periods.');
    return { periods, hours };
  }

  function normalizeEarthquakes(data) {
    return expectFeatures(data, 'USGS earthquake');
  }

  function groupFemaDeclarations(data, limit = 6) {
    const records = data?.DisasterDeclarationsSummaries;
    if (!Array.isArray(records)) throw new Error('OpenFEMA response is missing declaration records.');
    const grouped = new Map();
    records.forEach(record => {
      if (!Number.isInteger(record.disasterNumber)) return;
      const existing = grouped.get(record.disasterNumber);
      if (!existing) {
        grouped.set(record.disasterNumber, { ...record, areas: record.designatedArea ? [record.designatedArea] : [] });
      } else if (record.designatedArea && !existing.areas.includes(record.designatedArea)) {
        existing.areas.push(record.designatedArea);
      }
    });
    return [...grouped.values()].slice(0, limit);
  }

  return { normalizeAlerts, normalizeForecast, normalizeEarthquakes, groupFemaDeclarations };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = FieldConditionsCore;

(() => {
  if (typeof document === 'undefined') return;
  const locationButton = document.getElementById('use-device-location');
  const coordinatesForm = document.getElementById('coordinates-form');
  const status = document.getElementById('conditions-status');
  const results = document.getElementById('conditions-results');
  const forecastSection = document.getElementById('forecast-section');
  const forecastLocation = document.getElementById('forecast-location');
  const forecastPeriods = document.getElementById('forecast-periods');
  const hourlyPeriods = document.getElementById('hourly-periods');
  const forecastUpdated = document.getElementById('forecast-updated');
  const completeForecastLink = document.getElementById('complete-forecast-link');
  const earthquakeResults = document.getElementById('earthquake-results');
  const femaResults = document.getElementById('fema-results');
  if (!locationButton || !coordinatesForm || !status || !results || !forecastSection || !forecastLocation || !forecastPeriods || !hourlyPeriods || !forecastUpdated || !completeForecastLink || !earthquakeResults || !femaResults) return;

  const severityRank = new Map([
    ['Extreme', 0], ['Severe', 1], ['Moderate', 2], ['Minor', 3], ['Unknown', 4]
  ]);
  const urgencyRank = new Map([
    ['Immediate', 0], ['Expected', 1], ['Future', 2], ['Past', 3], ['Unknown', 4]
  ]);

  const guideRules = [
    { pattern: /fire|red flag|smoke/i, title: 'Fire readiness', url: 'fire-readiness.html' },
    { pattern: /cold|freeze|frost|snow|winter|ice|blizzard/i, title: 'Hypothermia and cold', url: 'hypothermia.html' },
    { pattern: /flood|coastal|storm surge|tsunami/i, title: 'Emergency shelter', url: 'emergency-shelter.html' },
    { pattern: /heat/i, title: 'Emergency shelter and exposure', url: 'emergency-shelter.html#weather' },
    { pattern: /thunder|lightning|tornado|wind|hurricane|tropical/i, title: 'Weather hazard shelter', url: 'emergency-shelter.html#weather' },
    { pattern: /fog|dust|visibility/i, title: 'Navigation decisions', url: 'navigation-lost.html' },
    { pattern: /./, title: 'Preparedness blueprint', url: 'index.html#preparedness-blueprint' }
  ];

  function setBusy(busy) {
    locationButton.disabled = busy;
    coordinatesForm.querySelectorAll('button, input').forEach(element => { element.disabled = busy; });
    results.setAttribute('aria-busy', String(busy));
    earthquakeResults.setAttribute('aria-busy', String(busy));
    femaResults.setAttribute('aria-busy', String(busy));
  }

  function formatDate(value) {
    if (!value) return 'Not provided';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not provided';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium', timeStyle: 'short'
    }).format(date);
  }

  function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function guideFor(eventName) {
    return guideRules.find(rule => rule.pattern.test(eventName || '')) || guideRules.at(-1);
  }

  function renderAlert(feature) {
    const alert = feature?.properties || {};
    const card = document.createElement('article');
    card.className = 'condition-card';

    const heading = document.createElement('header');
    const labels = document.createElement('div');
    labels.className = 'condition-labels';
    addText(labels, 'span', alert.severity || 'Unknown severity', `condition-severity severity-${(alert.severity || 'unknown').toLowerCase()}`);
    addText(labels, 'span', alert.urgency || 'Unknown urgency', 'badge');
    heading.append(labels);
    addText(heading, 'h2', alert.event || 'Weather alert');
    if (alert.headline) addText(heading, 'p', alert.headline, 'condition-headline');
    card.append(heading);

    const timing = document.createElement('dl');
    timing.className = 'condition-timing';
    [['Area', alert.areaDesc || 'Not provided'], ['Effective', formatDate(alert.effective)], ['Expires', formatDate(alert.expires)]].forEach(([term, value]) => {
      addText(timing, 'dt', term);
      addText(timing, 'dd', value);
    });
    card.append(timing);

    if (alert.description) {
      addText(card, 'h3', 'Official description');
      addText(card, 'p', alert.description, 'condition-copy');
    }
    if (alert.instruction) {
      addText(card, 'h3', 'Official instructions');
      addText(card, 'p', alert.instruction, 'condition-copy');
    }

    const links = document.createElement('div');
    links.className = 'condition-links';
    const guide = guideFor(alert.event);
    const guideLink = document.createElement('a');
    guideLink.className = 'secondary-button';
    guideLink.href = guide.url;
    guideLink.textContent = `Related guide: ${guide.title}`;
    links.append(guideLink);

    const officialUrl = feature?.id || alert['@id'];
    if (typeof officialUrl === 'string' && officialUrl.startsWith('https://')) {
      const officialLink = document.createElement('a');
      officialLink.href = officialUrl;
      officialLink.target = '_blank';
      officialLink.rel = 'noopener';
      officialLink.textContent = 'Open official alert ↗';
      links.append(officialLink);
    }
    card.append(links);
    return card;
  }

  function safeNwsUrl(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'api.weather.gov' ? url.href : null;
    } catch {
      return null;
    }
  }

  async function fetchJson(url, accept = 'application/geo+json') {
    const response = await fetch(url, { headers: { Accept: accept } });
    if (!response.ok) throw new Error(`The weather service returned HTTP ${response.status}.`);
    return response.json();
  }

  function renderForecastPeriod(period) {
    const card = document.createElement('article');
    card.className = 'forecast-card';
    addText(card, 'h4', period.name || 'Forecast period');
    const temperature = Number.isFinite(period.temperature) ? `${period.temperature}°${period.temperatureUnit || ''}` : 'Temperature unavailable';
    addText(card, 'p', temperature, 'forecast-temperature');
    addText(card, 'p', period.shortForecast || 'Forecast unavailable');
    const details = [period.windSpeed, period.windDirection].filter(Boolean).join(' ');
    if (details) addText(card, 'p', `Wind: ${details}`, 'text-dim');
    return card;
  }

  function renderHourlyPeriod(period) {
    const row = document.createElement('article');
    row.className = 'hourly-row';
    addText(row, 'time', new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric' }).format(new Date(period.startTime)));
    addText(row, 'strong', Number.isFinite(period.temperature) ? `${period.temperature}°${period.temperatureUnit || ''}` : '—');
    addText(row, 'span', period.shortForecast || 'Forecast unavailable');
    addText(row, 'span', [period.windSpeed, period.windDirection].filter(Boolean).join(' ') || 'Wind unavailable', 'text-dim');
    return row;
  }

  async function loadForecast(latitude, longitude) {
    const pointData = await fetchJson(`https://api.weather.gov/points/${encodeURIComponent(latitude.toFixed(4))},${encodeURIComponent(longitude.toFixed(4))}`, 'application/geo+json');
    const properties = pointData.properties || {};
    const forecastUrl = safeNwsUrl(properties.forecast);
    const hourlyUrl = safeNwsUrl(properties.forecastHourly);
    if (!forecastUrl || !hourlyUrl) throw new Error('The weather service did not provide forecast endpoints for this point.');

    const [forecastData, hourlyData] = await Promise.all([
      fetchJson(forecastUrl), fetchJson(hourlyUrl)
    ]);
    const { periods, hours } = FieldConditionsCore.normalizeForecast(forecastData, hourlyData);

    forecastPeriods.replaceChildren(...periods.slice(0, 7).map(renderForecastPeriod));
    hourlyPeriods.replaceChildren(...hours.slice(0, 12).map(renderHourlyPeriod));
    const place = properties.relativeLocation?.properties || {};
    forecastLocation.textContent = place.city && place.state ? `${place.city}, ${place.state}` : `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    forecastUpdated.textContent = `Forecast generated ${formatDate(forecastData.properties?.generatedAt || forecastData.properties?.updated)}. Always check the issuance time before acting.`;
    completeForecastLink.href = `https://forecast.weather.gov/MapClick.php?lat=${encodeURIComponent(latitude.toFixed(4))}&lon=${encodeURIComponent(longitude.toFixed(4))}`;
    forecastSection.hidden = false;
    return { state: place.state || null, city: place.city || null };
  }

  async function loadAlerts(latitude, longitude) {
    const point = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const data = await fetchJson(`https://api.weather.gov/alerts/active?point=${encodeURIComponent(point)}`);
    const alerts = FieldConditionsCore.normalizeAlerts(data, severityRank, urgencyRank);
    if (!alerts.length) {
      const note = document.createElement('div');
      note.className = 'callout';
      note.textContent = 'No active NWS alerts were returned. This does not mean conditions are safe.';
      results.append(note);
    } else {
      alerts.forEach(alert => results.append(renderAlert(alert)));
    }
    return alerts.length;
  }

  function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
    const toRadians = value => value * Math.PI / 180;
    const deltaLatitude = toRadians(latitudeB - latitudeA);
    const deltaLongitude = toRadians(longitudeB - longitudeA);
    const a = Math.sin(deltaLatitude / 2) ** 2
      + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function renderEarthquake(feature, latitude, longitude) {
    const properties = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates || [];
    const eventLongitude = Number(coordinates[0]);
    const eventLatitude = Number(coordinates[1]);
    const depth = Number(coordinates[2]);
    const magnitude = Number(properties.mag);
    const card = document.createElement('article');
    card.className = 'earthquake-card';

    const heading = document.createElement('header');
    addText(heading, 'span', Number.isFinite(magnitude) ? `Magnitude ${magnitude.toFixed(1)}` : 'Magnitude unavailable', 'earthquake-magnitude');
    addText(heading, 'h3', properties.place || 'Location unavailable');
    card.append(heading);

    const facts = document.createElement('dl');
    facts.className = 'condition-timing';
    const distance = Number.isFinite(eventLatitude) && Number.isFinite(eventLongitude)
      ? `${Math.round(distanceKm(latitude, longitude, eventLatitude, eventLongitude))} km from selected point`
      : 'Not available';
    [
      ['Time', formatDate(properties.time)],
      ['Distance', distance],
      ['Depth', Number.isFinite(depth) ? `${depth.toFixed(1)} km` : 'Not available'],
      ['USGS status', properties.status || 'Not provided']
    ].forEach(([term, value]) => {
      addText(facts, 'dt', term);
      addText(facts, 'dd', value);
    });
    card.append(facts);

    if (typeof properties.url === 'string' && properties.url.startsWith('https://earthquake.usgs.gov/')) {
      const link = document.createElement('a');
      link.href = properties.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open official USGS event ↗';
      card.append(link);
    }
    return card;
  }

  async function loadEarthquakes(latitude, longitude) {
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const parameters = new URLSearchParams({
      format: 'geojson',
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      maxradiuskm: '500',
      minmagnitude: '2.5',
      starttime: startTime,
      orderby: 'time',
      limit: '10',
      eventtype: 'earthquake'
    });
    const data = await fetchJson(`https://earthquake.usgs.gov/fdsnws/event/1/query?${parameters}`, 'application/json');
    const earthquakes = FieldConditionsCore.normalizeEarthquakes(data);
    if (!earthquakes.length) {
      const note = document.createElement('div');
      note.className = 'callout';
      note.textContent = 'No matching USGS earthquakes were returned for this radius and time window.';
      earthquakeResults.append(note);
    } else {
      earthquakeResults.append(...earthquakes.map(feature => renderEarthquake(feature, latitude, longitude)));
    }
    return earthquakes.length;
  }

  function declarationTypeLabel(type) {
    return ({ DR: 'Major disaster', EM: 'Emergency', FM: 'Fire management assistance' })[type] || type || 'Declaration';
  }

  function renderFemaDeclaration(declaration) {
    const card = document.createElement('article');
    card.className = 'fema-card';
    const heading = document.createElement('header');
    addText(heading, 'span', declarationTypeLabel(declaration.declarationType), 'badge');
    addText(heading, 'h3', declaration.declarationTitle || `Disaster ${declaration.disasterNumber}`);
    addText(heading, 'p', declaration.femaDeclarationString || `FEMA-${declaration.disasterNumber}`, 'condition-headline');
    card.append(heading);

    const facts = document.createElement('dl');
    facts.className = 'condition-timing';
    const programs = [
      declaration.ihProgramDeclared && 'Individuals & Households',
      declaration.iaProgramDeclared && 'Individual Assistance',
      declaration.paProgramDeclared && 'Public Assistance',
      declaration.hmProgramDeclared && 'Hazard Mitigation'
    ].filter(Boolean);
    const areas = Array.isArray(declaration.areas) ? declaration.areas : [];
    const areaSummary = areas.length > 3 ? `${areas.slice(0, 3).join(', ')} and ${areas.length - 3} more` : areas.join(', ');
    [
      ['Declared', formatDate(declaration.declarationDate)],
      ['Incident', declaration.incidentType || 'Not provided'],
      ['Designated areas', areaSummary || 'Not provided'],
      ['Programs recorded', programs.join(', ') || 'None shown in this record']
    ].forEach(([term, value]) => {
      addText(facts, 'dt', term);
      addText(facts, 'dd', value);
    });
    card.append(facts);

    if (Number.isInteger(declaration.disasterNumber)) {
      const link = document.createElement('a');
      link.href = `https://www.fema.gov/disaster/${declaration.disasterNumber}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open official FEMA declaration ↗';
      card.append(link);
    }
    return card;
  }

  async function loadFemaDeclarations(state) {
    if (!/^[A-Z]{2}$/.test(state || '')) throw new Error('A U.S. state or territory could not be resolved for FEMA lookup.');
    const parameters = new URLSearchParams({
      '$filter': `state eq '${state}'`,
      '$orderby': 'declarationDate desc',
      '$top': '50'
    });
    const data = await fetchJson(`https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?${parameters}`, 'application/json');
    const declarations = FieldConditionsCore.groupFemaDeclarations(data, 6);
    if (!declarations.length) {
      const note = document.createElement('div');
      note.className = 'callout';
      note.textContent = `No FEMA declaration records were returned for ${state}.`;
      femaResults.append(note);
    } else {
      femaResults.append(...declarations.map(renderFemaDeclaration));
    }
    return declarations.length;
  }

  async function fetchConditions(latitude, longitude) {
    setBusy(true);
    results.replaceChildren();
    forecastSection.hidden = true;
    forecastPeriods.replaceChildren();
    hourlyPeriods.replaceChildren();
    earthquakeResults.replaceChildren();
    femaResults.replaceChildren();
    status.textContent = 'Checking NWS weather, USGS earthquakes, and FEMA declarations…';

    const [forecastOutcome, alertsOutcome, earthquakeOutcome] = await Promise.allSettled([
      loadForecast(latitude, longitude), loadAlerts(latitude, longitude), loadEarthquakes(latitude, longitude)
    ]);
    let femaOutcome;
    if (forecastOutcome.status === 'fulfilled' && forecastOutcome.value?.state) {
      [femaOutcome] = await Promise.allSettled([loadFemaDeclarations(forecastOutcome.value.state)]);
    } else {
      femaOutcome = { status: 'rejected', reason: new Error('FEMA lookup requires a state resolved by NWS.') };
    }
    const outcomes = [forecastOutcome, alertsOutcome, earthquakeOutcome, femaOutcome];
    const failures = outcomes.filter(outcome => outcome.status === 'rejected');

    if (alertsOutcome.status === 'rejected') {
      const message = document.createElement('div');
      message.className = 'callout caution-callout';
      message.textContent = 'Active alerts could not be loaded. Use weather.gov to verify official alerts.';
      results.append(message);
    }
    if (earthquakeOutcome.status === 'rejected') {
      const message = document.createElement('div');
      message.className = 'callout caution-callout';
      message.textContent = 'Recent USGS earthquake records could not be loaded. Use earthquake.usgs.gov to verify events.';
      earthquakeResults.append(message);
    }
    if (femaOutcome.status === 'rejected') {
      const message = document.createElement('div');
      message.className = 'callout caution-callout';
      message.textContent = 'FEMA declarations could not be loaded or no U.S. state was resolved for this point.';
      femaResults.append(message);
    }
    const point = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (!failures.length) {
      const alertCount = alertsOutcome.value;
      const earthquakeCount = earthquakeOutcome.value;
      const declarationCount = femaOutcome.value;
      status.textContent = `Conditions loaded for ${point}: ${alertCount} active alert${alertCount === 1 ? '' : 's'}, ${earthquakeCount} recent earthquake${earthquakeCount === 1 ? '' : 's'}, and ${declarationCount} recent FEMA declaration${declarationCount === 1 ? '' : 's'}.`;
    } else if (failures.length < outcomes.length) {
      status.textContent = `Some official data loaded for ${point}, but ${failures.length} ${failures.length === 1 ? 'service was' : 'services were'} unavailable. Verify conditions at the linked agency sites.`;
    } else {
      status.textContent = 'Official weather, earthquake, and FEMA data could not be loaded. Check your connection and use the agency websites.';
    }
    setBusy(false);
  }

  locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = 'This browser does not provide location access. Enter coordinates instead.';
      return;
    }
    setBusy(true);
    status.textContent = 'Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(
      position => fetchConditions(position.coords.latitude, position.coords.longitude),
      error => {
        setBusy(false);
        status.textContent = error.code === error.PERMISSION_DENIED
          ? 'Location permission was not granted. Enter coordinates instead.'
          : 'The device location could not be determined. Enter coordinates instead.';
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });

  coordinatesForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(coordinatesForm);
    const latitude = Number(data.get('latitude'));
    const longitude = Number(data.get('longitude'));
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      status.textContent = 'Enter a latitude from −90 to 90 and longitude from −180 to 180.';
      return;
    }
    fetchConditions(latitude, longitude);
  });
})();
