import { getState, updateSettings, exportData, importData, resetAll } from '../store.js';
import { toKey, today } from '../utils.js';
import { toast, refresh } from '../ui.js';

export const title = 'Settings';

export function render(el) {
  const { settings } = getState();

  el.innerHTML = `
    <h1 tabindex="-1">Settings</h1>

    <form class="card" id="settings-form" novalidate>
      <h2>Cycle defaults</h2>
      <p class="muted small">Used until you’ve logged a few cycles — after that Bloom uses your own averages.</p>
      <div class="field">
        <label for="s-cycle">Cycle length (days)</label>
        <input type="number" id="s-cycle" min="20" max="45" value="${settings.cycleLength}" inputmode="numeric" data-testid="s-cycle">
      </div>
      <div class="field">
        <label for="s-period">Period length (days)</label>
        <input type="number" id="s-period" min="1" max="10" value="${settings.periodLength}" inputmode="numeric" data-testid="s-period">
      </div>
      <p id="s-error" class="small" style="color:#a3122f" role="alert"></p>
      <button class="btn btn-primary" type="submit" data-testid="s-save">Save</button>
    </form>

    <section class="card" aria-labelledby="data-h">
      <h2 id="data-h">Your data</h2>
      <p class="muted small">Everything is stored only in this browser. Export a backup to move it to another device.</p>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="export-btn" data-testid="export">Export backup</button>
        <label class="btn btn-secondary" for="import-file">Import backup</label>
        <input type="file" id="import-file" accept="application/json,.json" class="visually-hidden" data-testid="import">
      </div>
    </section>

    <section class="card" aria-labelledby="danger-h">
      <h2 id="danger-h">Reset</h2>
      <p class="muted small">Deletes all logs and settings from this device.</p>
      <button type="button" class="btn btn-danger" id="reset-btn" data-testid="reset">Delete all data</button>
    </section>
  `;

  el.querySelector('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cycle = +el.querySelector('#s-cycle').value;
    const period = +el.querySelector('#s-period').value;
    const err = el.querySelector('#s-error');
    if (!(cycle >= 20 && cycle <= 45)) { err.textContent = 'Cycle length must be between 20 and 45 days.'; el.querySelector('#s-cycle').focus(); return; }
    if (!(period >= 1 && period <= 10)) { err.textContent = 'Period length must be between 1 and 10 days.'; el.querySelector('#s-period').focus(); return; }
    err.textContent = '';
    updateSettings({ cycleLength: Math.round(cycle), periodLength: Math.round(period) });
    toast('Settings saved');
  });

  el.querySelector('#export-btn').addEventListener('click', () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bloom-backup-${toKey(today())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });

  el.querySelector('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importData(await file.text());
      toast('Backup imported');
      refresh();
    } catch {
      toast('That file isn’t a valid Bloom backup');
    }
    e.target.value = '';
  });

  el.querySelector('#reset-btn').addEventListener('click', () => {
    if (!confirm('Delete all Bloom data from this device? This can’t be undone.')) return;
    resetAll();
    toast('All data deleted');
    location.hash = '#/today';
  });
}
