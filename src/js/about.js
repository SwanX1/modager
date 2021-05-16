'use strict';
window.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLDivElement} */
  const headerWrapper = document.querySelector('#header-wrapper');
  headerWrapper.innerHTML = api.getTemplate('headerbar', { title: 'About' });

  document.querySelector('#open-github').addEventListener('click', () => {
    api.send('openExternal', 'https://github.com/SwanX1/modager');
  });
  document.querySelector('#open-license').addEventListener('click', () => {
    api.send('openExternal', 'https://www.apache.org/licenses/LICENSE-2.0.txt');
  });
});