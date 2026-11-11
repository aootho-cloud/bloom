// Hash router + app boot.
import * as today from './views/today.js';
import * as calendar from './views/calendar.js';
import * as log from './views/log.js';
import * as history from './views/history.js';
import * as settings from './views/settings.js';
import { onRefresh } from './ui.js';

const routes = { today, calendar, log, history, settings };
const main = document.getElementById('app');
let firstLoad = true;

function parseHash() {
  const [name, ...params] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: routes[name] ? name : 'today', params };
}

function render({ moveFocus }) {
  const { name, params } = parseHash();
  const view = routes[name];
  main.innerHTML = '';
  view.render(main, params);

  document.title = `${view.title} – Bloom`;
  document.querySelectorAll('.bottom-nav a').forEach((a) => {
    if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (moveFocus && !firstLoad) {
    window.scrollTo(0, 0);
    (main.querySelector('h1') || main).focus({ preventScroll: true });
  }
  firstLoad = false;
}

window.addEventListener('hashchange', () => render({ moveFocus: true }));
onRefresh(() => render({ moveFocus: false }));
render({ moveFocus: false });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
