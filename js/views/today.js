import { getState, getDay, setFlow, setDay, updateSettings } from '../store.js';
import { getStats } from '../cycle.js';
import { today, toKey, fromKey, addDays, diffDays, fmt, plural } from '../utils.js';
import { toast, refresh } from '../ui.js';

export const title = 'Today';

export function render(el) {
  const state = getState();
  const s = getStats(state);
  const tKey = toKey(today());

  if (!s.lastPeriod) return renderWelcome(el, state);

  const progress = Math.min(s.cycleDay / s.avgCycle, 1);
  const r = 92;
  const circ = 2 * Math.PI * r;

  let big, sub;
  if (s.onPeriod) { big = s.cycleDay; sub = 'day of your period'; }
  else if (s.daysUntil > 0) { big = s.daysUntil; sub = s.daysUntil === 1 ? 'day until your period' : 'days until your period'; }
  else if (s.daysUntil === 0) { big = 'Today'; sub = 'period expected'; }
  else { big = -s.daysUntil; sub = -s.daysUntil === 1 ? 'day late' : 'days late'; }

  const todayEntry = getDay(tKey);
  const loggedToday = todayEntry?.flow && todayEntry.flow !== 'spotting';

  el.innerHTML = `
    <h1 class="visually-hidden" tabindex="-1">Today</h1>
    <section class="card today-hero" aria-labelledby="cycle-status">
      <span class="chip" data-testid="phase">${s.phase}</span>
      <div class="ring">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle class="track" cx="110" cy="110" r="${r}"></circle>
          <circle class="progress" cx="110" cy="110" r="${r}"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - progress)}"></circle>
        </svg>
        <div class="ring-center" id="cycle-status" data-testid="cycle-status">
          <span class="ring-small">Cycle day ${s.cycleDay}</span>
          <span class="ring-big">${big}</span>
          <span class="ring-sub">${sub}</span>
        </div>
      </div>
      <div class="btn-row" style="justify-content:center">
        ${loggedToday
          ? `<button type="button" class="btn btn-secondary" id="toggle-period" data-testid="toggle-period">Remove today's period</button>`
          : `<button type="button" class="btn btn-primary" id="toggle-period" data-testid="toggle-period">${s.onPeriod ? 'Log period today' : 'Period started today'}</button>`}
        <a class="btn btn-secondary" href="#/log/${tKey}" data-testid="log-symptoms">Add symptoms</a>
      </div>
    </section>

    <div class="grid-2">
      <section class="card">
        <h2 class="stat-label">Next period</h2>
        <p class="stat-value" data-testid="next-period">${fmt(s.daysUntil < 0 ? today() : s.nextStart)}</p>
      </section>
      <section class="card">
        <h2 class="stat-label">Fertile window</h2>
        <p class="stat-value" data-testid="fertile-window">${fmt(s.fertileStart)} – ${fmt(s.fertileEnd)}</p>
      </section>
      <section class="card">
        <h2 class="stat-label">Avg. cycle</h2>
        <p class="stat-value">${plural(s.avgCycle, 'day')}</p>
      </section>
      <section class="card">
        <h2 class="stat-label">Avg. period</h2>
        <p class="stat-value">${plural(s.avgPeriod, 'day')}</p>
      </section>
    </div>

    ${todayEntry && (todayEntry.symptoms?.length || todayEntry.mood || todayEntry.notes) ? `
      <section class="card" aria-labelledby="today-log-h">
        <h2 id="today-log-h">Today's log</h2>
        ${todayEntry.mood ? `<p><strong>Mood:</strong> ${todayEntry.mood}</p>` : ''}
        ${todayEntry.symptoms?.length ? `<p><strong>Symptoms:</strong> ${todayEntry.symptoms.join(', ')}</p>` : ''}
        ${todayEntry.notes ? `<p class="muted small">Has a note</p>` : ''}
      </section>` : ''}

    <p class="muted small center">Predictions are estimates based on your logged cycles and aren't medical advice.</p>
  `;

  el.querySelector('#toggle-period').addEventListener('click', () => {
    if (loggedToday) {
      setFlow(tKey, '');
      toast('Removed today’s period log');
    } else {
      setFlow(tKey, todayEntry?.flow && todayEntry.flow !== 'spotting' ? todayEntry.flow : 'medium');
      toast('Period logged for today');
    }
    refresh();
  });
}

function renderWelcome(el, state) {
  const tKey = toKey(today());
  el.innerHTML = `
    <section class="card">
      <h1 tabindex="-1">Welcome to Bloom</h1>
      <p>A simple period tracker. Everything you log stays on this device.</p>
      <p>To get started, tell us when your last period began.</p>
      <form id="welcome-form" novalidate>
        <div class="field">
          <label for="last-start">First day of your last period</label>
          <input type="date" id="last-start" max="${tKey}" required data-testid="last-start">
        </div>
        <div class="field">
          <label for="w-period">Period usually lasts (days)</label>
          <input type="number" id="w-period" min="1" max="10" value="${state.settings.periodLength}" inputmode="numeric">
        </div>
        <div class="field">
          <label for="w-cycle">Cycle usually lasts (days)</label>
          <input type="number" id="w-cycle" min="20" max="45" value="${state.settings.cycleLength}" inputmode="numeric">
          <p class="hint">Not sure? Leave it at 28 — Bloom will learn from what you log.</p>
        </div>
        <p id="welcome-error" class="small" style="color:#a3122f" role="alert"></p>
        <button class="btn btn-primary btn-block" type="submit" data-testid="welcome-submit">Start tracking</button>
      </form>
    </section>
  `;

  el.querySelector('#welcome-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const startVal = el.querySelector('#last-start').value;
    const periodLength = clamp(+el.querySelector('#w-period').value, 1, 10, 5);
    const cycleLength = clamp(+el.querySelector('#w-cycle').value, 20, 45, 28);
    const err = el.querySelector('#welcome-error');
    if (!startVal) { err.textContent = 'Please choose a date.'; el.querySelector('#last-start').focus(); return; }
    const start = fromKey(startVal);
    if (diffDays(start, today()) > 0) { err.textContent = 'The date can’t be in the future.'; return; }

    updateSettings({ periodLength, cycleLength });
    for (let i = 0; i < periodLength; i++) {
      const d = addDays(start, i);
      if (diffDays(d, today()) > 0) break;
      setDay(toKey(d), { ...(getDay(toKey(d)) || {}), flow: 'medium' });
    }
    toast('All set!');
    refresh();
  });
}

const clamp = (n, min, max, fallback) => (Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, Math.round(n))) : fallback);
