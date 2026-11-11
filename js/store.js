// Local storage persistence. All data stays on this device.
import { isValidKey } from './utils.js';

const KEY = 'bloom-data-v1';

const defaults = () => ({
  settings: { cycleLength: 28, periodLength: 5, lutealLength: 14 },
  days: {}, // { 'YYYY-MM-DD': { flow, symptoms: [], mood, notes } }
});

let state = load();

function normalise(data) {
  const base = defaults();
  const days = {};
  for (const [k, v] of Object.entries(data?.days || {})) {
    if (isValidKey(k) && v && typeof v === 'object') days[k] = v;
  }
  return { settings: { ...base.settings, ...(data?.settings || {}) }, days };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalise(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save data', e);
  }
}

export const getState = () => state;
export const getDay = (key) => state.days[key] || null;

export function setDay(key, entry) {
  const clean = {
    flow: entry.flow || '',
    symptoms: entry.symptoms || [],
    mood: entry.mood || '',
    notes: (entry.notes || '').trim(),
  };
  const empty = !clean.flow && !clean.symptoms.length && !clean.mood && !clean.notes;
  if (empty) delete state.days[key];
  else state.days[key] = clean;
  save();
}

export function setFlow(key, flow) {
  setDay(key, { ...(getDay(key) || {}), flow });
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save();
}

export function exportData() {
  return JSON.stringify({ app: 'bloom', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object' || !data.days) throw new Error('Not a Bloom backup file');
  state = normalise(data);
  save();
}

export function resetAll() {
  state = defaults();
  save();
}
