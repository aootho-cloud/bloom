// Small shared UI helpers.

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

let refreshFn = () => {};
export const onRefresh = (fn) => { refreshFn = fn; };
/** Re-render the current page without moving focus. */
export const refresh = () => refreshFn();

export const FLOWS = [
  { value: '', label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

export const SYMPTOMS = [
  'Cramps', 'Headache', 'Bloating', 'Back pain', 'Acne',
  'Tender breasts', 'Fatigue', 'Nausea', 'Cravings', 'Insomnia',
];

export const MOODS = ['Happy', 'Calm', 'Sensitive', 'Sad', 'Irritable', 'Anxious'];

export const flowLabel = (v) => FLOWS.find((f) => f.value === v)?.label || '';
