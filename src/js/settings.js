'use strict';
window.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const headerWrapper = document.querySelector('#header-wrapper');
  /** @type {HTMLInputElement} */
  const showDevTools = document.querySelector('#showDevTools');

  headerWrapper.innerHTML = api.getTemplate('headerbar', { title: 'Settings' });

  showDevTools.checked = api.send('store', 'get', 'showDevTools');
  showDevTools.addEventListener('change', () => {
    api.send('store', 'set', 'showDevTools', showDevTools.checked);
  });
});