import { getState } from '../store.js';
import { getStats } from '../cycle.js';
import { fromKey, diffDays, fmt, plural } from '../utils.js';

export const title = 'History';

export function render(el) {
  const s = getStats(getState());

  if (!s.periods.length) {
    el.innerHTML = `
      <h1 tabindex="-1">History</h1>
      <section class="card"><p>No periods logged yet.</p>
      <a class="btn btn-primary" href="#/today">Get started</a></section>`;
    return;
  }

  const periods = [...s.periods].reverse();
  const recent = s.cycles.slice(-6);
  const max = Math.max(45, ...recent.map((c) => c.length));

  el.innerHTML = `
    <h1 tabindex="-1">History</h1>

    <div class="grid-2">
      <section class="card"><h2 class="stat-label">Avg. cycle</h2><p class="stat-value">${plural(s.avgCycle, 'day')}</p></section>
      <section class="card"><h2 class="stat-label">Avg. period</h2><p class="stat-value">${plural(s.avgPeriod, 'day')}</p></section>
      <section class="card"><h2 class="stat-label">Cycles tracked</h2><p class="stat-value">${s.cycles.length}</p></section>
      <section class="card"><h2 class="stat-label">Shortest / longest</h2><p class="stat-value">${s.cycles.length ? `${Math.min(...s.cycles.map((c) => c.length))} / ${Math.max(...s.cycles.map((c) => c.length))}` : '—'}</p></section>
    </div>

    ${recent.length ? `
    <section class="card" aria-labelledby="cycle-len-h">
      <h2 id="cycle-len-h">Recent cycle lengths</h2>
      <ul class="bars" style="list-style:none;margin:0;padding:0">
        ${recent.map((c) => `
          <li class="bar-row">
            <span>${fmt(fromKey(c.start))}</span>
            <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:${(c.length / max) * 100}%"></span></span>
            <span><span class="visually-hidden">Cycle length </span>${c.length}d</span>
          </li>`).join('')}
      </ul>
    </section>` : ''}

    <section class="card" aria-labelledby="periods-h">
      <h2 id="periods-h">Periods</h2>
      <ul class="period-list" data-testid="period-list">
        ${periods.map((p, i) => {
          const newer = periods[i - 1];
          const cycleLen = newer ? diffDays(fromKey(newer.start), fromKey(p.start)) : null;
          return `<li>
            <div>
              <div class="period-dates">${fmt(fromKey(p.start), { day: 'numeric', month: 'short', year: 'numeric' })}${p.end !== p.start ? ` – ${fmt(fromKey(p.end))}` : ''}</div>
              <div class="muted small">${plural(p.length, 'day')}${cycleLen ? ` · ${cycleLen}-day cycle` : i === 0 ? ' · current cycle' : ''}</div>
            </div>
            <a class="icon-btn" href="#/log/${p.start}" aria-label="Open ${fmt(fromKey(p.start), { day: 'numeric', month: 'long' })}">›</a>
          </li>`;
        }).join('')}
      </ul>
    </section>
  `;
}
