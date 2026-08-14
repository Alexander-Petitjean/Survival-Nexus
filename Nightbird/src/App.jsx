import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'nightbird-shift-v1';
const THEME_KEY = 'nightbird-theme';

const defaultState = {
  responder: '',
  role: 'EMT / Paramedic',
  unit: '',
  shiftStart: '',
  shiftEnd: '',
  checklist: {
    ppe: false,
    communications: false,
    medical: false,
    vehicle: false,
    foodWater: false,
    personal: false,
  },
  energy: 3,
  stress: 2,
  lastRest: '',
  equipmentNotes: '',
  shiftNotes: '',
  decompression: '',
};

const checklistItems = [
  ['ppe', 'PPE ready', 'Correct fit, condition, access, and replacement items'],
  ['communications', 'Communications checked', 'Radio, battery, charger, contacts, and backup plan'],
  ['medical', 'Medical equipment checked', 'Seals, dates, quantities, access order, and agency checklist'],
  ['vehicle', 'Vehicle or apparatus checked', 'Fuel or charge, lights, access, restraints, and reported defects'],
  ['foodWater', 'Food and water packed', 'Enough for the shift plus a delay or extended incident'],
  ['personal', 'Personal readiness checked', 'Medication, prosthetic supplies, weather layers, and recovery plan'],
];

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object'
      ? { ...defaultState, ...saved, checklist: { ...defaultState.checklist, ...saved.checklist } }
      : defaultState;
  } catch {
    return defaultState;
  }
}

function App() {
  const [data, setData] = useState(readSavedState);
  const [savedAt, setSavedAt] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [data]);

  const completed = useMemo(
    () => Object.values(data.checklist).filter(Boolean).length,
    [data.checklist],
  );

  const readiness = Math.round((completed / checklistItems.length) * 100);
  const fatigueFlag = data.energy <= 2 || data.stress >= 4;

  const update = (field, value) => setData((current) => ({ ...current, [field]: value }));
  const toggleCheck = (key) => setData((current) => ({
    ...current,
    checklist: { ...current.checklist, [key]: !current.checklist[key] },
  }));

  const resetShift = () => {
    if (!window.confirm('Clear this shift from this browser? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultState);
    setSavedAt('');
  };

  return (
    <div className="nightbird-app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Nightbird home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span><strong>Nightbird</strong><small>Shift readiness</small></span>
        </a>
        <div className="topbar-actions">
          <div className="save-state" role="status"><span />{savedAt ? `Saved locally ${savedAt}` : 'Local-only workspace'}</div>
          <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            <strong>{theme === 'dark' ? 'Light' : 'Dark'}</strong>
          </button>
        </div>
      </header>

      <main id="top" className="dashboard">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">After-dark shift companion</p>
            <h1>Start ready. Finish accounted for.</h1>
            <p>One private place for readiness checks, fatigue awareness, equipment notes, and an end-of-shift reset.</p>
          </div>
          <div className="readiness-ring" style={{ '--progress': `${readiness * 3.6}deg` }} aria-label={`${readiness}% checklist complete`}>
            <strong>{readiness}%</strong><span>ready</span>
          </div>
        </section>

        <aside className="boundary-note">
          <strong>Personal readiness only.</strong> Nightbird is not a patient record, dispatch system, clinical decision tool, department inspection record, or substitute for agency policy. Do not enter patient identifiers or protected health information.
        </aside>

        <section className="dashboard-grid">
          <article className="panel shift-panel">
            <div className="panel-heading"><div><span className="step">01</span><h2>Set the shift</h2></div><span className="status-chip">Private</span></div>
            <div className="form-grid">
              <label><span>Name or initials</span><input value={data.responder} onChange={(e) => update('responder', e.target.value)} placeholder="Optional" /></label>
              <label><span>Role</span><select value={data.role} onChange={(e) => update('role', e.target.value)}><option>EMT / Paramedic</option><option>Firefighter</option><option>Dispatcher</option><option>Search & Rescue</option><option>Emergency Management</option><option>Other responder</option></select></label>
              <label><span>Unit / station</span><input value={data.unit} onChange={(e) => update('unit', e.target.value)} placeholder="Optional" /></label>
              <label><span>Shift starts</span><input type="datetime-local" value={data.shiftStart} onChange={(e) => update('shiftStart', e.target.value)} /></label>
              <label><span>Expected finish</span><input type="datetime-local" value={data.shiftEnd} onChange={(e) => update('shiftEnd', e.target.value)} /></label>
            </div>
          </article>

          <article className="panel checklist-panel">
            <div className="panel-heading"><div><span className="step">02</span><h2>Readiness sweep</h2></div><span className="count">{completed}/{checklistItems.length}</span></div>
            <div className="checklist">
              {checklistItems.map(([key, title, description]) => (
                <label className={`check-row ${data.checklist[key] ? 'is-complete' : ''}`} key={key}>
                  <input type="checkbox" checked={data.checklist[key]} onChange={() => toggleCheck(key)} />
                  <span className="custom-check" aria-hidden="true">✓</span>
                  <span><strong>{title}</strong><small>{description}</small></span>
                </label>
              ))}
            </div>
          </article>

          <article className="panel wellness-panel">
            <div className="panel-heading"><div><span className="step">03</span><h2>Human factors</h2></div>{fatigueFlag && <span className="warning-chip">Check in</span>}</div>
            <Scale label="Energy" value={data.energy} onChange={(value) => update('energy', value)} low="depleted" high="strong" />
            <Scale label="Stress load" value={data.stress} onChange={(value) => update('stress', value)} low="light" high="heavy" />
            <label className="full-label"><span>Last meaningful rest</span><input value={data.lastRest} onChange={(e) => update('lastRest', e.target.value)} placeholder="Example: 6 hours ending at 17:00" /></label>
            {fatigueFlag && <p className="fatigue-message"><strong>Pause before the shift.</strong> Consider a supervisor or partner check-in, hydration, food, a safer transport plan, or another action supported by your workplace.</p>}
          </article>

          <article className="panel notes-panel">
            <div className="panel-heading"><div><span className="step">04</span><h2>Equipment notes</h2></div></div>
            <label><span>Defects, shortages, replacements, or follow-up</span><textarea rows="7" value={data.equipmentNotes} onChange={(e) => update('equipmentNotes', e.target.value)} placeholder="No patient information. Use the agency reporting system for official defects." /></label>
          </article>

          <article className="panel notes-panel">
            <div className="panel-heading"><div><span className="step">05</span><h2>Shift notes</h2></div></div>
            <label><span>Personal reminders and non-clinical observations</span><textarea rows="7" value={data.shiftNotes} onChange={(e) => update('shiftNotes', e.target.value)} placeholder="Do not enter names, addresses, incident numbers, or patient details." /></label>
          </article>

          <article className="panel close-panel">
            <div className="panel-heading"><div><span className="step">06</span><h2>Close the loop</h2></div></div>
            <label><span>What needs recovery, restocking, or a conversation?</span><textarea rows="5" value={data.decompression} onChange={(e) => update('decompression', e.target.value)} placeholder="A private prompt—not an official report." /></label>
            <div className="close-prompts"><span>Hydrate</span><span>Restock</span><span>Document officially</span><span>Check in</span><span>Get home safely</span></div>
          </article>
        </section>

        <section className="data-controls">
          <div><h2>Your browser, your data</h2><p>This prototype sends nothing to a server. Anyone with access to this browser profile may still be able to view locally saved entries.</p></div>
          <button className="danger-button" type="button" onClick={resetShift}>Clear this shift</button>
        </section>
      </main>
      <footer><strong>Nightbird prototype</strong><span>Personal readiness—not operational authority.</span><a href="../index.html">Return to Survival Nexus</a></footer>
    </div>
  );
}

function Scale({ label, value, onChange, low, high }) {
  return (
    <fieldset className="scale-field">
      <legend>{label}</legend>
      <div className="scale-buttons">
        {[1, 2, 3, 4, 5].map((number) => <button type="button" className={value === number ? 'is-active' : ''} onClick={() => onChange(number)} key={number} aria-pressed={value === number}>{number}</button>)}
      </div>
      <div className="scale-labels"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}

export default App;
