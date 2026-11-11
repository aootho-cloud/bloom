import { getDay, setDay } from '../store.js';
import { today, toKey, fromKey, addDays, diffDays, fmtLong, isValidKey, escapeHtml } from '../utils.js';
import { FLOWS, SYMPTOMS, MOODS, toast, refresh } from '../ui.js';

export const title = 'Log';

export function render(el, params) {
  const t = today();
  const key = isValidKey(params[0] || '') ? params[0] : toKey(t);
  const date = fromKey(key);
  const isFuture = diffDays(date, t) > 0;
  const isToday = diffDays(date, t) === 0;
  const prevKey = toKey(addDays(date, -1));
  const nextKey = toKey(addDays(date, 1));
  const entry = getDay(key) || { flow: '', symptoms: [], mood: '', notes: '' };

  const header = `
    <div class="date-nav">
      <a class="icon-btn" href="#/log/${prevKey}" aria-label="Previous day" data-testid="log-prev">‹</a>
      <h1 tabindex="-1" data-testid="log-date">${isToday ? 'Today' : fmtLong(date)}</h1>
      <a class="icon-btn" href="#/log/${nextKey}" aria-label="Next day" data-testid="log-next"
        ${isToday || isFuture ? 'aria-disabled="true" tabindex="-1"' : ''}>›</a>
    </div>`;

  if (isFuture) {
    el.innerHTML = `${header}
      <section class="card"><p>You can’t log days in the future.</p>
      <a class="btn btn-primary" href="#/log">Go to today</a></section>`;
    return;
  }

  el.innerHTML = `${header}
    ${isToday ? `<p class="muted small center" style="margin-top:-8px">${fmtLong(date)}</p>` : ''}
    <form class="card" id="log-form" novalidate>
      <fieldset>
        <legend>Period flow</legend>
        <div class="pills">
          ${FLOWS.map((f) => pill('radio', 'flow', f.value, f.label, entry.flow === f.value)).join('')}
        </div>
      </fieldset>

      <fieldset>
        <legend>Symptoms</legend>
        <div class="pills">
          ${SYMPTOMS.map((s) => pill('checkbox', 'symptoms', s, s, entry.symptoms?.includes(s))).join('')}
        </div>
      </fieldset>

      <fieldset>
        <legend>Mood</legend>
        <div class="pills">
          ${pill('radio', 'mood', '', 'None', !entry.mood)}
          ${MOODS.map((m) => pill('radio', 'mood', m, m, entry.mood === m)).join('')}
        </div>
      </fieldset>

      <div class="field">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" data-testid="log-notes">${escapeHtml(entry.notes)}</textarea>
      </div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary" data-testid="log-save">Save</button>
        ${getDay(key) ? `<button type="button" class="btn btn-danger" id="clear-day" data-testid="log-clear">Clear day</button>` : ''}
      </div>
    </form>
  `;

  const form = el.querySelector('#log-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    setDay(key, {
      flow: fd.get('flow') || '',
      symptoms: fd.getAll('symptoms'),
      mood: fd.get('mood') || '',
      notes: fd.get('notes') || '',
    });
    toast('Saved');
    refresh();
  });

  el.querySelector('#clear-day')?.addEventListener('click', () => {
    setDay(key, {});
    toast('Day cleared');
    refresh();
  });
}

function pill(type, name, value, label, checked) {
  const id = `${name}-${value || 'none'}`.replace(/\s+/g, '-').toLowerCase();
  return `<label class="pill" for="${id}">
    <input type="${type}" id="${id}" name="${name}" value="${escapeHtml(value)}" ${checked ? 'checked' : ''} data-testid="${id}">
    <span>${label}</span>
  </label>`;
}
