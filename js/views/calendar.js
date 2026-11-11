import { getState } from '../store.js';
import { getStats, getPredictions } from '../cycle.js';
import { today, toKey, diffDays, fmt } from '../utils.js';
import { flowLabel } from '../ui.js';

export const title = 'Calendar';
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function render(el, params) {
  const t = today();
  let year = t.getFullYear();
  let month = t.getMonth();
  const m = /^(\d{4})-(\d{2})$/.exec(params[0] || '');
  if (m) { year = +m[1]; month = +m[2] - 1; }

  const state = getState();
  const stats = getStats(state);
  const preds = getPredictions(stats);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push('<span aria-hidden="true"></span>');

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = toKey(date);
    const entry = state.days[key];
    const flags = preds.get(key) || new Set();
    const isFuture = diffDays(date, t) > 0;
    const cls = ['cal-day'];
    const desc = [];

    if (entry?.flow && entry.flow !== 'spotting') { cls.push('period'); desc.push(`period, ${flowLabel(entry.flow).toLowerCase()} flow`); }
    else if (entry?.flow === 'spotting') { cls.push('spotting'); desc.push('spotting'); }
    else if (flags.has('predicted')) { cls.push('predicted'); desc.push('predicted period'); }
    if (!cls.includes('period')) {
      if (flags.has('ovulation')) { cls.push('fertile', 'ovulation'); desc.push('estimated ovulation'); }
      else if (flags.has('fertile')) { cls.push('fertile'); desc.push('fertile window'); }
    }
    if (entry && (entry.symptoms?.length || entry.mood || entry.notes)) { cls.push('has-log'); desc.push('has notes'); }
    if (diffDays(date, t) === 0) { cls.push('today'); desc.unshift('today'); }
    if (isFuture) cls.push('future');

    const label = [fmt(date, { day: 'numeric', month: 'long' }), ...desc].join(', ');
    cells.push(isFuture
      ? `<span class="${cls.join(' ')}" role="img" aria-label="${label}">${day}</span>`
      : `<a class="${cls.join(' ')}" href="#/log/${key}" aria-label="${label}" data-testid="day-${key}"${diffDays(date, t) === 0 ? ' aria-current="date"' : ''}>${day}</a>`);
  }

  el.innerHTML = `
    <section class="card">
      <div class="cal-head">
        <a class="icon-btn" href="#/calendar/${monthKey(prev)}" aria-label="Previous month" data-testid="cal-prev">‹</a>
        <h1 tabindex="-1" data-testid="cal-title">${first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h1>
        <a class="icon-btn" href="#/calendar/${monthKey(next)}" aria-label="Next month" data-testid="cal-next">›</a>
      </div>
      <div class="cal-grid">
        ${DOW.map((d) => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('')}
        ${cells.join('')}
      </div>
      <ul class="legend" aria-label="Legend">
        <li><span class="swatch period" aria-hidden="true"></span>Period</li>
        <li><span class="swatch predicted" aria-hidden="true"></span>Predicted</li>
        <li><span class="swatch fertile" aria-hidden="true"></span>Fertile</li>
        <li><span class="swatch ovulation" aria-hidden="true"></span>Ovulation</li>
        <li><span class="swatch today" aria-hidden="true"></span>Today</li>
      </ul>
    </section>
    <p class="muted small center">Tap a day to log your period, symptoms or mood.</p>
    ${monthKey(first) !== monthKey(t) ? `<p class="center"><a class="btn btn-secondary" href="#/calendar">Back to this month</a></p>` : ''}
  `;
}
