(function () {
  const regions = {
    northwest: { name: 'Pacific Northwest', icon: '↟', terrain: 'rain forest and coastal foothills', hazard: 'cold rain turns the trail into a chain of runoff channels', clue: 'a mossy spur trail and the sound of a creek', shelter: 'a dense stand of young fir away from dead overhead limbs', water: 'fast creek water', warning: 'slick roots, falling limbs, and rapid cooling', expect: 'Cold rain can impair hands and judgment well before dramatic shivering begins.' },
    southwest: { name: 'Southwest', icon: '☀', terrain: 'desert canyon country', hazard: 'the marked path disappears into sun-bleached rock', clue: 'an old fence line and a dry wash', shelter: 'open shade above the wash floor', water: 'the water already in your bottle', warning: 'heat load, flash floods, and false shortcuts', expect: 'Heat illness and dehydration can accelerate; a distant storm can flood a dry channel.' },
    northeast: { name: 'Northeast', icon: '▲', terrain: 'rocky hardwood hills', hazard: 'fog settles across intersecting game and hiking trails', clue: 'a stone wall and a faded trail blaze', shelter: 'a protected bench below the ridge', water: 'a mapped hillside spring', warning: 'wet rock, cold exposure, and confusing trail junctions', expect: 'Fog erases landmarks and wet leaves conceal unstable footing.' },
    southeast: { name: 'Southeast', icon: '≋', terrain: 'pine lowlands and wetlands', hazard: 'a storm drops branches and covers the route', clue: 'a drainage ditch and a utility cut', shelter: 'high, open ground clear of damaged trees', water: 'slow surface water near the lowland', warning: 'lightning, heat stress, insects, and contaminated water', expect: 'Storm cells can return quickly, while humidity slows cooling and soaked ground limits camps.' },
    mountains: { name: 'Mountain West', icon: '△', terrain: 'high alpine basin', hazard: 'cloud closes over the pass after a wrong turn', clue: 'a descending ridgeline and a distant tree line', shelter: 'the lee side of a low rock band, away from the crest', water: 'a snow-fed stream below tree line', warning: 'altitude, lightning, wind chill, and steep terrain', expect: 'Weather and temperature can change fast; exposed ridges become dangerous before rain arrives.' },
    plains: { name: 'Great Plains', icon: '—', terrain: 'open prairie and farm roads', hazard: 'wind-driven dust hides the road you left', clue: 'a shelterbelt and a line of power poles', shelter: 'the protected side of a sound low structure', water: 'your carried reserve', warning: 'exposure, severe storms, and few natural landmarks', expect: 'Wind can drain heat and mask approaching weather; lightning may reach far from the rain core.' },
    forest: { name: 'Northern Forest', icon: '♣', terrain: 'lake country and boreal forest', hazard: 'dense spruce closes behind an unplanned detour', clue: 'a portage marker and the slope toward a lake', shelter: 'dry ground within the tree line, clear of dead snags', water: 'clear lake water', warning: 'cold water, deadfall, insects, and difficult navigation', expect: 'Travel is much slower off trail, and immersion can become a cold emergency in any season.' },
    river: { name: 'River Country', icon: '≈', terrain: 'wooded river bottoms', hazard: 'rising water cuts off the route back', clue: 'a levee crown and higher hardwood ground', shelter: 'high ground well beyond the water line', water: 'sediment-heavy river water', warning: 'rising water, unstable banks, and hidden current', expect: 'Water can keep rising after local rain stops, and familiar crossings may no longer be safe.' }
  };

  const seasons = [
    { name: 'Winter', modifier: -12, daylight: 3, text: 'The air is colder than forecast and daylight is short.' },
    { name: 'Spring', modifier: -5, daylight: 5, text: 'Thaw, rain, and changing water levels complicate the route.' },
    { name: 'Summer', modifier: 0, daylight: 7, text: 'Long daylight helps, but heat and fast-building storms demand attention.' },
    { name: 'Autumn', modifier: -4, daylight: 5, text: 'A mild afternoon will give way to a much colder night.' }
  ];

  const gear = {
    communicator: { name: 'Satellite messenger', icon: '⌁', detail: 'Reliable emergency text and position sharing' },
    filter: { name: 'Water filter', icon: '◒', detail: 'Makes suitable backcountry water safer to drink' },
    tarp: { name: 'Compact tarp', icon: '◇', detail: 'Fast protection from rain, wind, and sun' },
    layers: { name: 'Insulating layer', icon: '▤', detail: 'Slows heat loss when weather or activity changes' },
    power: { name: 'Power bank', icon: 'ϟ', detail: 'Extends phone navigation and communication' },
    mirror: { name: 'Signal mirror + whistle', icon: '✦', detail: 'Makes a stationary person easier to locate' }
  };

  const state = { region: null, regionKey: '', season: null, roll: 0, event: null, chapter: 0, condition: 100, daylight: 5, water: 1, signal: 1, good: 0, selectedGear: [], history: [] };
  const $ = id => document.getElementById(id);
  const regionScreen = $('region-screen');
  const loadoutScreen = $('loadout-screen');
  const storyScreen = $('story-screen');
  const endingScreen = $('ending-screen');

  function secureRoll(max) {
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function buildRegionCards() {
    const grid = $('region-grid');
    Object.entries(regions).forEach(([key, region]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'region-card';
      button.innerHTML = `<span class="region-icon" aria-hidden="true">${region.icon}</span><strong>${region.name}</strong><span>${region.terrain}</span>`;
      button.addEventListener('click', () => chooseRegion(key));
      grid.append(button);
    });
  }

  function chooseRegion(key) {
    state.region = regions[key];
    state.regionKey = key;
    state.selectedGear = [];
    regionScreen.hidden = true;
    loadoutScreen.hidden = false;
    buildLoadout();
    $('loadout-title').focus({ preventScroll: true });
  }

  function buildLoadout() {
    const grid = $('loadout-grid');
    grid.replaceChildren();
    Object.entries(gear).forEach(([key, item]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'loadout-card';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span aria-hidden="true">${item.icon}</span><strong>${item.name}</strong><small>${item.detail}</small>`;
      button.addEventListener('click', () => {
        const selected = state.selectedGear.includes(key);
        if (!selected && state.selectedGear.length === 3) return;
        state.selectedGear = selected ? state.selectedGear.filter(value => value !== key) : [...state.selectedGear, key];
        button.setAttribute('aria-pressed', String(!selected));
        button.classList.toggle('is-selected', !selected);
        updateLoadout();
      });
      grid.append(button);
    });
    updateLoadout();
  }

  function updateLoadout() {
    $('loadout-count').textContent = `${state.selectedGear.length} of 3 selected`;
    $('begin-story').disabled = state.selectedGear.length !== 3;
    document.querySelectorAll('.loadout-card:not(.is-selected)').forEach(button => {
      button.classList.toggle('is-unavailable', state.selectedGear.length === 3);
    });
  }

  function begin() {
    const seasonIndex = secureRoll(seasons.length);
    const events = eventDeck();
    Object.assign(state, { season: seasons[seasonIndex], roll: seasonIndex + 1, event: events[secureRoll(events.length)], chapter: 0, condition: 100 + seasons[seasonIndex].modifier, daylight: seasons[seasonIndex].daylight, water: 1, signal: 1, good: 0, history: [] });
    loadoutScreen.hidden = true;
    endingScreen.hidden = true;
    storyScreen.hidden = false;
    renderChapter();
  }

  function eventDeck() {
    const common = [
      { name: 'Forecast shift', text: 'The weather arrives two hours earlier than forecast.', condition: -5, daylight: -1, helps: ['tarp','layers'] },
      { name: 'Minor injury', text: 'A slip leaves you with a painful but weight-bearing ankle.', condition: -10, daylight: -.5, helps: ['communicator','mirror'] },
      { name: 'Equipment loss', text: 'Your bottle falls and half the carried water is lost.', water: -.5, condition: 0, helps: ['filter'] },
      { name: 'Brief signal window', text: 'A weak cellular signal appears, but may not last.', signal: 1, condition: 0, helps: ['power','communicator'] }
    ];
    const regional = {
      northwest: { name: 'Creek rise', text: 'Rain has raised every creek crossing.', condition: -4, daylight: -.5, helps: ['tarp','communicator'] },
      southwest: { name: 'Heat spike', text: 'Reflected canyon heat is much higher than forecast.', condition: -9, water: -.2, helps: ['tarp','filter'] },
      northeast: { name: 'Fog bank', text: 'Visibility contracts to less than fifty yards.', condition: -3, daylight: -.5, helps: ['communicator','mirror'] },
      southeast: { name: 'Second storm cell', text: 'Thunder returns from the west.', condition: -5, daylight: -1, helps: ['tarp','communicator'] },
      mountains: { name: 'Pressure drop', text: 'Wind and cloud build over the exposed ridge.', condition: -7, daylight: -.5, helps: ['layers','tarp'] },
      plains: { name: 'Severe-weather watch', text: 'The sky darkens beneath a fast-moving front.', condition: -5, daylight: -1, helps: ['communicator','tarp'] },
      forest: { name: 'Cold-water crossing', text: 'The familiar crossing is deeper than expected.', condition: -6, daylight: -.5, helps: ['layers','communicator'] },
      river: { name: 'Upstream release', text: 'The river climbs despite clear local skies.', condition: -6, daylight: -1, helps: ['communicator','mirror'] }
    };
    return [...common, regional[state.regionKey]];
  }

  function chapters() {
    const r = state.region;
    const matchingGear = state.selectedGear.find(key => state.event.helps.includes(key));
    return [
      {
        title: 'The moment you stop recognizing the trail',
        copy: `You are alone in ${r.terrain}. ${r.hazard}. Your map was never downloaded for offline use. You notice ${r.clue}. You have not told anyone about the detour. What do you do first?`,
        choices: [
          { label: 'Stop, breathe, inventory, and mark this spot', result: 'You halt the cascade. You note the time, preserve your starting point, and find that text messages are briefly sending.', impact: { condition: 2, daylight: -0.5, good: 2 }, tag: 'Stopped and made a deliberate plan.' },
          { label: 'Climb toward a better view and phone signal', result: `You gain a partial view, but spend time and energy on uncertain ground. ${r.warning} remain active concerns.`, impact: { condition: -12, daylight: -1.5, good: 0 }, tag: 'Moved uphill before establishing a last known point.' },
          { label: 'Follow the nearest drainage downhill', result: 'The terrain becomes thicker and slicker. Drainages are tempting handrails, but can lead to cliffs, flood channels, and travel traps.', impact: { condition: -18, daylight: -2, water: -0.2, good: -1 }, tag: 'Committed to an unverified drainage.' }
        ]
      },
      {
        title: state.event.name,
        copy: `${state.event.text} This is the turn that was not in your plan. Your earlier preparation now determines which responses are available.`,
        choices: [
          { label: matchingGear ? `Use your ${gear[matchingGear].name.toLowerCase()}` : 'Use a matching piece of equipment', unavailable: !matchingGear, unavailableText: 'No matching loadout item', result: `You use the ${matchingGear ? gear[matchingGear].name.toLowerCase() : 'equipment'} as part of a deliberate response, buying time without pretending one item solves everything.`, impact: { condition: Math.max(3, -(state.event.condition || 0)), daylight: 0, water: Math.max(0, -(state.event.water || 0)), good: 2 }, tag: 'Used prepared equipment to absorb an unexpected complication.' },
          { label: 'Slow down, reassess the route, and adjust the plan', result: 'You accept the delay and prevent the surprise from forcing a second, larger mistake.', impact: { condition: state.event.condition || -3, daylight: state.event.daylight || -.5, water: state.event.water || 0, signal: state.event.signal || 0, good: 1 }, tag: 'Reassessed after conditions changed.' },
          { label: 'Keep the original schedule and make up the time', result: 'The schedule becomes a trap. You spend physical margin trying to preserve a plan that no longer matches reality.', impact: { condition: (state.event.condition || -5) - 12, daylight: -1.5, water: (state.event.water || 0) - .2, good: -2 }, tag: 'Kept an obsolete schedule after the situation changed.' }
        ]
      },
      {
        title: 'Weather takes control of the clock',
        copy: `${state.season.text} You estimate ${state.daylight.toFixed(1)} hours of useful light. Nearby you can reach ${r.shelter}; you also know of ${r.water}. Your next choice will determine whether you are still moving at dusk.`,
        choices: [
          { label: state.selectedGear.includes('tarp') || state.selectedGear.includes('layers') ? 'Use your shelter gear and stop before exposure worsens' : 'Improvise a protected stop before exposure worsens', result: 'You get out of the worst exposure, add insulation before chilling, and drink enough to keep thinking clearly.', impact: { condition: state.selectedGear.includes('layers') ? 12 : 7, daylight: -1, water: -0.35, good: 2 }, tag: 'Prioritized shelter, temperature, and clear thinking.' },
          { label: 'Collect and treat water before settling in', requires: 'filter', result: `Your filter makes suitable ${r.water} usable. The side trip costs light, but you return before committing to camp.`, impact: { condition: 2, daylight: -1.5, water: 0.7, good: 2 }, tag: 'Collected and treated water with the right equipment.' },
          { label: 'Push hard while there is still light', result: `The hoped-for junction does not appear. Fatigue rises and ${r.warning} make small navigation errors harder to correct.`, impact: { condition: -22, daylight: -2.5, water: -0.4, good: -1 }, tag: 'Spent the remaining light on uncertain travel.' }
        ]
      },
      {
        title: 'One message, one move',
        copy: `Your phone wakes long enough to show a weak connection. You can send one short message. Condition is ${Math.max(0, state.condition)} and dusk is ${state.daylight > 1 ? 'approaching' : 'nearly here'}. What closes the chain?`,
        choices: [
          { label: state.selectedGear.includes('communicator') ? 'Send a satellite check-in with location, condition, and plan' : 'Send location, condition, plan, and battery limit; then stay findable', result: 'The compact message transmits. You make yourself visible, conserve power, and avoid moving away from the location rescuers received.', impact: { condition: 4, daylight: -0.5, signal: 2, good: state.selectedGear.includes('communicator') ? 4 : 3 }, tag: 'Sent a useful emergency message and stayed findable.' },
          { label: 'Call repeatedly until someone answers', result: 'One call connects briefly but drops before your location is clear. The battery dies while you are describing how the day began.', impact: { condition: -5, daylight: -0.5, good: 0 }, tag: 'Used the remaining battery on incomplete calls.' },
          { label: 'Use the last battery to navigate toward the road', result: 'The screen helps for several minutes, then goes black. Your new position no longer matches any message or last known point.', impact: { condition: -15, daylight: -1, good: -1 }, tag: 'Moved after consuming the last navigation and communication power.' }
        ]
      }
    ];
  }

  function renderChapter() {
    const chapter = chapters()[state.chapter];
    $('chapter-label').textContent = `Chapter ${state.chapter + 1} of 4`;
    $('story-title').textContent = chapter.title;
    $('story-location').textContent = `${state.region.name} · ${state.season.name} · season roll ${state.roll} of 4`;
    $('story-copy').textContent = chapter.copy;
    $('story-consequence').hidden = true;
    updateStatus();
    const list = $('choice-list');
    list.replaceChildren();
    chapter.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.innerHTML = `<span>${String.fromCharCode(65 + index)}</span><strong>${choice.label}</strong>`;
      const locked = choice.unavailable || (choice.requires && !state.selectedGear.includes(choice.requires));
      if (locked) {
        button.disabled = true;
        button.classList.add('is-locked');
        const reason = choice.unavailableText || `Requires: ${gear[choice.requires].name}`;
        button.querySelector('strong').insertAdjacentHTML('beforeend', `<small>${reason}</small>`);
      } else button.addEventListener('click', () => choose(choice));
      list.append(button);
    });
    $('story-title').focus({ preventScroll: true });
  }

  function choose(choice) {
    state.condition = Math.max(0, Math.min(100, state.condition + (choice.impact.condition || 0)));
    state.daylight = Math.max(0, state.daylight + (choice.impact.daylight || 0));
    state.water = Math.max(0, state.water + (choice.impact.water || 0));
    state.signal = Math.max(0, state.signal + (choice.impact.signal || 0));
    state.good += choice.impact.good || 0;
    state.history.push({ choice: choice.label, result: choice.result, tag: choice.tag });
    document.querySelectorAll('.choice-button').forEach(button => { button.disabled = true; });
    const consequence = $('story-consequence');
    consequence.innerHTML = `<strong>Consequence</strong><p>${choice.result}</p>`;
    consequence.hidden = false;
    updateStatus();
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'cta-button game-next';
    next.textContent = state.chapter === 3 ? 'See your field report' : 'Continue the story';
    next.addEventListener('click', () => {
      state.chapter += 1;
      if (state.chapter > 3) finish(); else renderChapter();
    });
    consequence.append(next);
    next.focus();
  }

  function updateStatus() {
    $('status-region').textContent = state.region.name;
    $('status-season').textContent = `${state.roll} → ${state.season.name}`;
    $('status-condition').textContent = `${Math.round(state.condition)} / 100`;
    $('status-daylight').textContent = `${state.daylight.toFixed(1)} hr`;
    $('status-water').textContent = `${state.water.toFixed(1)} L`;
    $('status-signal').textContent = state.signal >= 3 ? 'Confirmed' : state.signal >= 1 ? 'Weak' : 'None';
    $('event-banner').innerHTML = `<strong>Complication:</strong> ${state.event.name} <span>•</span> <strong>Loadout:</strong> ${state.selectedGear.map(key => gear[key].name).join(', ')}`;
  }

  function finish() {
    storyScreen.hidden = true;
    endingScreen.hidden = false;
    const strong = state.good >= 7 && state.condition >= 55 && state.signal >= 1;
    const mixed = !strong && state.good >= 2 && state.condition >= 30;
    $('ending-grade').textContent = strong ? 'Outcome: located and stable' : mixed ? 'Outcome: delayed but recoverable' : 'Outcome: preventable escalation';
    $('ending-title').textContent = strong ? 'Your plan made you easier to find.' : mixed ? 'You made it through, but spent your margin.' : 'Small guesses became a larger emergency.';
    $('ending-copy').textContent = strong ? `Searchers reach your position in the ${state.region.name} after your message gives them a usable starting point.` : mixed ? 'Your eventual location is narrowed down, but exposure and uncertain movement lengthen the response.' : 'Your changing position, declining condition, and lost daylight force a wider search and a more difficult night.';
    $('debrief-happened').textContent = state.history.map(item => item.tag).join(' ');
    $('debrief-do').textContent = 'Use STOP: stop, think, observe, plan. Share a trip plan before departure, carry offline navigation and emergency communication, protect body temperature, treat questionable water, and give rescuers one reliable location and plan.';
    $('debrief-expect').textContent = `${state.region.expect} In a real response, help may take hours or longer; weather, access, location accuracy, and local resources all change the timeline.`;
    const log = $('decision-log');
    log.replaceChildren();
    state.history.forEach((item, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>0${index + 1}</span><div><strong>${item.choice}</strong><p>${item.result}</p></div>`;
      log.append(li);
    });
    $('ending-title').focus({ preventScroll: true });
  }

  function restart() {
    storyScreen.hidden = true;
    endingScreen.hidden = true;
    loadoutScreen.hidden = true;
    regionScreen.hidden = false;
    regionScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    regionScreen.querySelector('button')?.focus({ preventScroll: true });
  }

  $('restart-game').addEventListener('click', restart);
  $('play-again').addEventListener('click', restart);
  $('begin-story').addEventListener('click', begin);
  buildRegionCards();
})();
