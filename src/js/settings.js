window.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLInputElement} */
  const showDevTools = document.querySelector('#showDevTools');

  showDevTools.checked = api.send('store', 'get', 'showDevTools');
  showDevTools.addEventListener('change', () => {
    api.send('store', 'set', 'showDevTools', showDevTools.checked);
  });
});